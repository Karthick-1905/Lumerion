import 'dotenv/config'
import nodemailer from 'nodemailer'
import crypto from 'crypto'

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || "587", 10),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    }
})

export function generateOTP(): string {
  return crypto.randomInt(100000, 999999).toString()
}

export function generateResetToken(): string {
  return crypto.randomBytes(32).toString('hex').normalize()
}

export async function sendOtpEmail(email : string, otp: string , username : string ) : Promise<boolean>{
    try {
        const mailOptions = {
          from: process.env.SMTP_FROM_EMAIL,
          to: email,
          subject: 'Email Verification - Learning Management System',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #333;">Email Verification</h2>
              <p>Hello ${username},</p>
              <p>Thank you for registering with our Learning Management System. Please use the following OTP to verify your email address:</p>
              <div style="background-color: #f4f4f4; padding: 20px; text-align: center; margin: 20px 0;">
                <h1 style="color: #007bff; font-size: 32px; margin: 0;">${otp}</h1>
              </div>
              <p>This OTP will expire in 10 minutes.</p>
              <p>If you didn't create an account, please ignore this email.</p>
              <br>
              <p>Best regards,<br>Learning Management System Team</p>
            </div>
          `
        }
        await transporter.sendMail(mailOptions)
        return true
    } catch (error) {
        console.error('Error sending OTP email:', error)
        return false
    }
}

export async function sendPasswordResetEmail(email: string, resetToken: string, userName: string): Promise<boolean> {
  try {
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`
    
    const mailOptions = {
      from: process.env.SMTP_FROM_EMAIL,
      to: email,
      subject: 'Password Reset - Learning Management System',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Password Reset Request</h2>
          <p>Hello ${userName},</p>
          <p>We received a request to reset your password for your Learning Management System account.</p>
          <p>Click the button below to reset your password:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">Reset Password</a>
          </div>
          <p>Or copy and paste this link in your browser:</p>
          <p style="word-break: break-all; color: #007bff;">${resetUrl}</p>
          <p>This link will expire in 1 hour.</p>
          <p>If you didn't request a password reset, please ignore this email.</p>
          <br>
          <p>Best regards,<br>Learning Management System Team</p>
        </div>
      `
    }

    await transporter.sendMail(mailOptions)
    return true
  } catch (error) {
    console.error('Error sending password reset email:', error)
    return false
  }
}

export async function verifyEmailConfig(): Promise<boolean> {
  try {
    await transporter.verify()
    console.log('Email service is ready')
    return true
  } catch (error) {
    console.error('Email service configuration error:', error)
    return false
  }
}
