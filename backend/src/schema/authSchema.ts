import {z} from 'zod'

export const registerSchema = z.object({
  body: z.object({
    user_name: z.string().min(2, 'Name must be at least 2 characters').max(50, 'Name must be less than 50 characters').trim(),
    user_email: z.string().email('Invalid email format').toLowerCase().trim(),
    user_password: z.string().min(8, 'Password must be at least 8 characters').trim(),
    confirmPassword: z.string().trim()
  }).refine((data) => data.user_password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"]
  })
})

export const loginSchema = z.object({
  body: z.object({
    user_email: z.string().email('Invalid email format').toLowerCase().trim(),
    password: z.string().min(1, 'Password is required').trim()
  })
})

export const verifyEmailSchema = z.object({
    body: z.object({
        user_email: z.string().email('Invalid email format').toLowerCase().trim(),
        otp_code: z.string().length(6, 'OTP must be 6 digits').trim()
    })
})


export const resendOTPSchema = z.object({
  body: z.object({
    user_email: z.string().email('Invalid email format').toLowerCase().trim(),
  })
})

export const forgotPasswordSchema = z.object({
  body: z.object({
    user_email: z.string().email('Invalid email format').toLowerCase().trim(),
  })
})


export const resetPasswordSchema = z.object({
  body: z.object({
    token: z.string("Reset token is required"),
    new_password: z.string("New password is required")
  })
});

export type RegisterSchema = z.infer<typeof registerSchema>
export type LoginSchema = z.infer<typeof loginSchema>
export type VerifyEmailSchema = z.infer<typeof verifyEmailSchema>
export type ResendOTPSchema = z.infer<typeof resendOTPSchema>
export type ForgotPasswordSchema = z.infer<typeof forgotPasswordSchema>
export type ResetPasswordSchema = z.infer<typeof resetPasswordSchema>