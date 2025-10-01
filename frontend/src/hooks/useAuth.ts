import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { authApi } from '../api/auth';
import type {
  RegisterRequest,
  RegisterResponse,
  LoginRequest,
  LoginResponse,
  VerifyEmailRequest,
  ResendOTPRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  SuccessResponse,
  ApiError
} from '../api/types';

// Query Keys
export const AUTH_QUERY_KEYS = {
  register: ['auth', 'register'] as const,
  login: ['auth', 'login'] as const,
  verifyEmail: ['auth', 'verifyEmail'] as const,
  resendOTP: ['auth', 'resendOTP'] as const,
  forgotPassword: ['auth', 'forgotPassword'] as const,
  resetPassword: ['auth', 'resetPassword'] as const,
} as const;

// Register Mutation
export const useRegisterMutation = () => {
  const navigate = useNavigate();

  return useMutation<RegisterResponse, ApiError, RegisterRequest>({
    mutationKey: AUTH_QUERY_KEYS.register,
    mutationFn: authApi.register,
    onSuccess: (data, variables) => {
      // Store the email for verification step
      localStorage.setItem('pendingVerificationEmail', variables.user_email);
      
      // Navigate to email verification page
      navigate('/verify-email', {
        state: { 
          email: variables.user_email,
          message: data.message 
        }
      });
    },
    onError: (error) => {
      console.error('Registration failed:', error);
    },
  });
};

// Login Mutation
export const useLoginMutation = () => {
  const navigate = useNavigate();

  return useMutation<LoginResponse, ApiError, LoginRequest>({
    mutationKey: AUTH_QUERY_KEYS.login,
    mutationFn: authApi.login,
    onSuccess: (data) => {
      // Store user data and token
      localStorage.setItem('authToken', data.data.token);
      localStorage.setItem('userData', JSON.stringify(data.data.user));
      
      // Navigate to dashboard or appropriate page
      navigate('/dashboard');
    },
    onError: (error) => {
      console.error('Login failed:', error);
    },
  });
};

// Verify Email Mutation
export const useVerifyEmailMutation = () => {
  const navigate = useNavigate();

  return useMutation<SuccessResponse, ApiError, VerifyEmailRequest>({
    mutationKey: AUTH_QUERY_KEYS.verifyEmail,
    mutationFn: authApi.verifyEmail,
    onSuccess: () => {
      // Clear pending verification email
      localStorage.removeItem('pendingVerificationEmail');
      
      // Navigate to profile setup or login
      navigate('/profile-setup');
    },
    onError: (error) => {
      console.error('Email verification failed:', error);
    },
  });
};

// Resend OTP Mutation
export const useResendOTPMutation = () => {
  return useMutation<SuccessResponse, ApiError, ResendOTPRequest>({
    mutationKey: AUTH_QUERY_KEYS.resendOTP,
    mutationFn: authApi.resendOTP,
    onSuccess: (data) => {
      console.log('OTP resent successfully:', data.message);
    },
    onError: (error) => {
      console.error('Failed to resend OTP:', error);
    },
  });
};

// Forgot Password Mutation
export const useForgotPasswordMutation = () => {
  const navigate = useNavigate();

  return useMutation<SuccessResponse, ApiError, ForgotPasswordRequest>({
    mutationKey: AUTH_QUERY_KEYS.forgotPassword,
    mutationFn: authApi.forgotPassword,
    onSuccess: (data, variables) => {
      // Store email and navigate to reset password page
      localStorage.setItem('resetPasswordEmail', variables.user_email);
      navigate('/reset-password', {
        state: { 
          email: variables.user_email,
          message: data.message 
        }
      });
    },
    onError: (error) => {
      console.error('Forgot password request failed:', error);
    },
  });
};

// Reset Password Mutation
export const useResetPasswordMutation = () => {
  const navigate = useNavigate();

  return useMutation<SuccessResponse, ApiError, ResetPasswordRequest>({
    mutationKey: AUTH_QUERY_KEYS.resetPassword,
    mutationFn: authApi.resetPassword,
    onSuccess: (data) => {
      // Clear stored email
      localStorage.removeItem('resetPasswordEmail');
      
      // Navigate to login with success message
      navigate('/login', {
        state: { 
          message: data.message 
        }
      });
    },
    onError: (error) => {
      console.error('Password reset failed:', error);
    },
  });
};
