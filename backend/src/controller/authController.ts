import { StatusCodes } from "http-status-codes";
import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { ForgotPasswordSchema, LoginSchema, RegisterSchema, ResendOTPSchema, ResetPasswordSchema, VerifyEmailSchema } from "../schema/authSchema";
import {db} from "../drizzle";
import { passwordResetTokens, userEmailVerification, users } from "../drizzle/schema";
import { and, eq, gt } from "drizzle-orm";
import { comparePasswords, createSession, deleteSession, generateSalt, generateSessionId, getSessionExpirationSeconds, hashPassword } from "../utils/authUtils";
import { generateOTP, sendOtpEmail, sendPasswordResetEmail } from "../mailer/authmailer";
import crypto from 'crypto'

export const registerController = async(
    req: Request<{}, {}, RegisterSchema["body"]>,
    res: Response,
) => {
    try {
        const { user_name, user_email, user_password } = req.body;

        const user = await db.query.users.findFirst({
            where: eq(users.userEmail, user_email) 
        })  
        if(user){
          res.status(StatusCodes.BAD_REQUEST).json({success: false, message :'User already exists'})
          return;
        }

        const salt = generateSalt();
        const hashedPassword = await hashPassword(user_password, salt)

        const [new_user] = await db.insert(users).values({
            userEmail : user_email,
            userName: user_name,
            password : hashedPassword, 
            salt: salt
        }).returning({ id : users.userId, userName: users.userName })

        if(!new_user){
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({success:false,message: "Error While creating user"})
            return
        }

        const otp = generateOTP();
        await db.insert(userEmailVerification).values({
            userId : new_user.id,
            otpCode : otp,
            userEmail : user_email,
            createdAt : new Date().toISOString(),
            updatedAt : new Date().toISOString()
        })
        const emailSent = await sendOtpEmail(user_email, otp, new_user.userName)
        if (!emailSent) {
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({success: false, message: "Error sending verification email"})
            return
        }

        res.status(StatusCodes.CREATED).json({
            success: true, 
            message: "Registered Successfully. Please check your email for verification code.",
        })
    } catch (error) {
        console.log(error);
        console.log(req.body)
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            message: "Internal server error"
        })
    }
}


export const loginController = async (
  req: Request<{},{}, LoginSchema["body"]>,
  res: Response
) => {
    try {
      const { user_email, password } = req.body
      
      const user = await db.query.users.findFirst({
        where: eq(users.userEmail, user_email)
      })
      
      if (!user) {
        res.status(StatusCodes.UNAUTHORIZED).json({success: false, message: 'Invalid credentials'})
        return
      }
      
      if (!user.isVerified) {
        res.status(StatusCodes.UNAUTHORIZED).json({success: false, message: 'Please verify your email first'})
        return
      }
      
      if (!user.salt || !user.password) {
        res.status(StatusCodes.UNAUTHORIZED).json({success: false, message: 'Invalid credentials'})
        return
      }
      
      const isPasswordValid = await comparePasswords({
        password,
        salt: user.salt,
        hashedPassword: user.password
      })
      
      if (!isPasswordValid) {
        res.status(StatusCodes.UNAUTHORIZED).json({success: false, message: 'Invalid credentials'})
        return
      }
      
      const sessionId = generateSessionId()
      await createSession(sessionId, user.userId)

      const sessionExpirationMs = getSessionExpirationSeconds() * 1000
      
      res.cookie(process.env.COOKIE_SESSION_KEY!, sessionId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: sessionExpirationMs,
        sameSite: "lax",
      })
      
      res.status(StatusCodes.OK).json({
        success: true,
        message: "Login successful"
      })
      
    } catch (error) {
      console.error('Login error:', error)
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({success: false, message: "Error during login"})
    }
}



export const logoutController = async (
  req: Request,
  res: Response
) => {
    try {
      const sessionId = req.cookies[process.env.COOKIE_SESSION_KEY!]
      
      if (sessionId) {
        await deleteSession(sessionId)
      }
      
      res.clearCookie(process.env.COOKIE_SESSION_KEY!)
      res.status(StatusCodes.OK).json({success: true, message: "Logout successful"})
      
    } catch (error) {
      console.error('Logout error:', error)
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({success: false, message: "Error during logout"})
    }
}

export const verifyEmailController = async(
    req: Request<{}, {}, VerifyEmailSchema["body"]>,
    res: Response
) => {
    try {
        const {user_email, otp_code} = req.body
        const verification = await db.query.userEmailVerification.findFirst({
            where: and(
                eq(userEmailVerification.userEmail,user_email),
                eq(userEmailVerification.otpCode, otp_code)
            )
        })

        if (!verification) {
            res.status(StatusCodes.BAD_REQUEST).json({success: false, message: 'Invalid OTP code'})
            return
        }

        const referenceTime = verification.updatedAt ?? verification.createdAt;
        // Get reference time as timestamp
        const referenceDate = new Date(referenceTime + 'Z');
        const currentDate = new Date();
        const otpAge = currentDate.getTime() - referenceDate.getTime();

        if (otpAge > 10 * 60 * 1000) {
            res.status(StatusCodes.BAD_REQUEST).json({success: false, message: 'OTP code has expired'});
            return;
        }
        await db.update(users).set({ isVerified: true }).where(eq(users.userId, verification.userId))

        const user = await db.query.users.findFirst({
            where: eq(users.userId, verification.userId)
        })
      
        if (!user) {
          res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({success: false, message: "User not found after verification"})
          return
        }

        const sessionId = generateSessionId()
        await createSession(sessionId, user.userId)
        
        const sessionExpirationMs = getSessionExpirationSeconds() * 1000

        res.cookie(process.env.COOKIE_SESSION_KEY!, sessionId, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          maxAge: sessionExpirationMs,
          sameSite: "lax",
        })

        await db.delete(userEmailVerification)
          .where(eq(userEmailVerification.verificationId, verification.verificationId))

        res.status(StatusCodes.OK).json({
          success: true, 
          message: "Email verified successfully",
        })
    } catch (error) {
        console.error('Email verification error:', error)
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({success: false, message: "Error during email verification"})
    }

}

export const resendOtpController = async (
    req: Request<{}, {}, ResendOTPSchema["body"]>,
    res: Response
) => {
    const {user_email} = req.body;
    const user = await db.query.users.findFirst({
      where: eq(users.userEmail, user_email)
    })
    
    if (!user) {
      res.status(StatusCodes.NOT_FOUND).json({success: false, message: 'User not found'})
      return
    }

    if (user.isVerified) {
      res.status(StatusCodes.BAD_REQUEST).json({success: false, message: 'Email already verified'})
      return
    }
    const existingOtp = await db.query.userEmailVerification.findFirst({
        where: eq(userEmailVerification.userId, user.userId)
    })

    const otpCode = generateOTP();

    if(existingOtp){
        await db.update(userEmailVerification).set({
            otpCode: otpCode,
            updatedAt: new Date().toISOString()
        }).where(eq(userEmailVerification.verificationId, existingOtp.verificationId))
    }else{
        await db.insert(userEmailVerification).values({
          userId: user.userId,
          userEmail: user_email,
          otpCode: otpCode,
          createdAt : new Date().toISOString(),
          updatedAt : new Date().toISOString()
        })
    }

    const emailSent = await sendOtpEmail(user_email, otpCode, user.userName)
    if (!emailSent) {
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({success: false, message: "Error sending verification email"})
      return
    }
    
    res.status(StatusCodes.OK).json({success: true, message: "New verification code sent to your email"})
}

export const forgotPasswordController = async (
  req : Request<{} , {} , ForgotPasswordSchema["body"]>,
  res : Response
) => {
  try {
    const {user_email} = req.body;
    const user = await db.query.users.findFirst({
        where: eq(users.userEmail, user_email)
    })

    if (!user) {
      // Don't reveal if user exists or not for security
      res.status(StatusCodes.OK).json({success: true, message: "If the email exists, a password reset link has been sent"})
      return
    }

    await db.delete(passwordResetTokens)
        .where(eq(passwordResetTokens.userId, user.userId))

    const resetToken = crypto.randomBytes(32).toString('hex').normalize()
    const expiresAt = new Date(Date.now() + 60 * 2 * 1000) // 1 minute expiration
    await db.insert(passwordResetTokens).values({
        userId: user.userId,
        token: resetToken,
        expiresAt: expiresAt.toISOString()
    })

    const emailSent = await sendPasswordResetEmail(user_email, resetToken, user.userName)
    if (!emailSent) {
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({success: false, message: "Error sending password reset email"})
      return
    }

    res.status(StatusCodes.OK).json({success: true, message: "If the email exists, a password reset link has been sent"})
  } catch (error) {
    console.error('Forgot password error:', error)
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({success: false, message: "Error processing password reset request"})
  }   
}

export const resetPasswordController = async (
  req: Request<{}, {}, ResetPasswordSchema["body"]>,
  res: Response
) => {
  try {
    const {token, new_password} = req.body

    const resetToken = await db.query.passwordResetTokens.findFirst({
      where: and(
        eq(passwordResetTokens.token, token),
        eq(passwordResetTokens.isUsed, false),
        gt(passwordResetTokens.expiresAt, new Date().toISOString())
      )
    })

    console.log(resetToken, token)

    if (!resetToken) {
      res.status(StatusCodes.BAD_REQUEST).json({success: false, message: 'Invalid or expired reset token'})
      return
    }

    const salt = generateSalt()
    const hashedPassword = await hashPassword(new_password, salt)

    await db.update(users).set({ 
      password: hashedPassword,salt: salt
    }).where(eq(users.userId, resetToken.userId))
    await db.update(passwordResetTokens).set({ isUsed: true })
        .where(eq(passwordResetTokens.tokenId, resetToken.tokenId))

    res.status(StatusCodes.OK).json({success: true, message: "Password reset successful"})

  } catch (error) {
    console.error('Reset password error:', error)
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({success: false, message: "Error processing password reset request"})
  }
}