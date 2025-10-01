// API Response Types
export interface SuccessResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
}

export interface ErrorResponse {
  success: false;
  message: string;
  error?: any;
}

// Auth Types
export interface RegisterRequest {
  user_name: string;
  user_email: string;
  user_password: string;
  confirmPassword: string;
}

export interface RegisterResponse extends SuccessResponse {
  message: string; // "Registered Successfully. Please check your email for verification code."
}

export interface LoginRequest {
  user_email: string;
  password: string;
}

export interface LoginResponse extends SuccessResponse {
  data: {
    user: {
      id: string;
      user_name: string;
      user_email: string;
    };
    token: string;
  };
}

export interface VerifyEmailRequest {
  user_email: string;
  otp_code: string;
}

export interface ResendOTPRequest {
  user_email: string;
}

export interface ForgotPasswordRequest {
  user_email: string;
}

export interface ResetPasswordRequest {
  token: string;
  new_password: string;
}

// API Error Type
export interface ApiError extends Error {
  status?: number;
  response?: ErrorResponse;
}
