// API Configuration
export const API_CONFIG = {
  BASE_URL: 'http://localhost:8000',
  ENDPOINTS: {
    AUTH: {
      REGISTER: '/api/auth/register',
      LOGIN: '/api/auth/login',
      VERIFY_EMAIL: '/api/auth/verify-email',
      RESEND_OTP: '/api/auth/resend-otp',
      FORGOT_PASSWORD: '/api/auth/forgot-password',
      RESET_PASSWORD: '/api/auth/reset-password'
    }
  }
} as const;
