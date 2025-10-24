import { apiClient } from './client';
import { API_CONFIG } from './config';
import type {
  RegisterRequest,
  RegisterResponse,
  LoginRequest,
  LoginResponse,
  VerifyEmailRequest,
  ResendOTPRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  SuccessResponse
} from './types';

// Auth API Service
export const authApi = {
  // Register a new user
  register: async (userData: RegisterRequest): Promise<RegisterResponse> => {
    return apiClient.post<RegisterResponse>(
      API_CONFIG.ENDPOINTS.AUTH.REGISTER,
      userData
    );
  },

  // Login user
  login: async (credentials: LoginRequest): Promise<LoginResponse> => {
    return apiClient.post<LoginResponse>(
      API_CONFIG.ENDPOINTS.AUTH.LOGIN,
      credentials
    );
  },

  // Verify email with OTP
  verifyEmail: async (verificationData: VerifyEmailRequest): Promise<SuccessResponse> => {
    return apiClient.post<SuccessResponse>(
      API_CONFIG.ENDPOINTS.AUTH.VERIFY_EMAIL,
      verificationData
    );
  },

  // Resend OTP
  resendOTP: async (emailData: ResendOTPRequest): Promise<SuccessResponse> => {
    return apiClient.post<SuccessResponse>(
      API_CONFIG.ENDPOINTS.AUTH.RESEND_OTP,
      emailData
    );
  },

  // Forgot password
  forgotPassword: async (emailData: ForgotPasswordRequest): Promise<SuccessResponse> => {
    return apiClient.post<SuccessResponse>(
      API_CONFIG.ENDPOINTS.AUTH.FORGOT_PASSWORD,
      emailData
    );
  },

  // Reset password
  resetPassword: async (resetData: ResetPasswordRequest): Promise<SuccessResponse> => {
    return apiClient.post<SuccessResponse>(
      API_CONFIG.ENDPOINTS.AUTH.RESET_PASSWORD,
      resetData
    );
  },

  // Logout
  logout: async (): Promise<SuccessResponse> => {
    return apiClient.post<SuccessResponse>(
      API_CONFIG.ENDPOINTS.AUTH.LOGOUT
    );
  },
};
