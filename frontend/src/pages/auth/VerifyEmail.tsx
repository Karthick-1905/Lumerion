import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useVerifyEmailMutation, useResendOTPMutation } from '../../hooks/useAuth';
import type { VerifyEmailRequest, ResendOTPRequest } from '../../api/types';
import VerifyEmailHero from '../../components/auth/VerifyEmail';
import VerifyEmailForm from '../../components/auth/VerifyEmailForm';

export default function VerifyEmail() {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [timeLeft, setTimeLeft] = useState(120);
  const [canResend, setCanResend] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const location = useLocation();
  const navigate = useNavigate();

  const email = location.state?.email || localStorage.getItem('pendingVerificationEmail');

  const verifyEmailMutation = useVerifyEmailMutation();
  const resendOTPMutation = useResendOTPMutation();

  useEffect(() => {
    if (!email) {
      toast.error('No email found for verification. Please register again.');
      navigate('/auth/register');
    } else if (location.state?.message) {
      toast.success(location.state.message);
    }
  }, [email, navigate, location.state]);

  useEffect(() => {
    if (timeLeft > 0) {
      const timer = window.setTimeout(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
      return () => window.clearTimeout(timer);
    }
    setCanResend(true);
  }, [timeLeft]);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    const newOtp = pastedData.split('').slice(0, 6);

    while (newOtp.length < 6) {
      newOtp.push('');
    }

    setOtp(newOtp);

    const nextEmptyIndex = newOtp.findIndex(val => val === '');
    const focusIndex = nextEmptyIndex === -1 ? 5 : nextEmptyIndex;
    inputRefs.current[focusIndex]?.focus();
  };

  const handleVerify = async () => {
    const otpString = otp.join('');
    if (otpString.length !== 6) {
      toast.error('Please enter all 6 digits.');
      return;
    }

    if (!email) {
      toast.error('Email not found. Please try registering again.');
      navigate('/auth/register');
      return;
    }

    const verifyData: VerifyEmailRequest = {
      user_email: email,
      otp_code: otpString,
    };

    try {
      await verifyEmailMutation.mutateAsync(verifyData);
      toast.success('Email verified successfully!');
      navigate('/auth/login');
    } catch (error: any) {
      const errorMessage = error?.response?.message || error?.message || 'Verification failed. Please try again.';
      toast.error(errorMessage);
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    }
  };

  const handleResend = async () => {
    if (!email) {
      toast.error('Email not found. Please try registering again.');
      navigate('/auth/register');
      return;
    }

    const resendData: ResendOTPRequest = {
      user_email: email,
    };

    try {
      await resendOTPMutation.mutateAsync(resendData);
      toast.success('New verification code sent to your email!');
      setTimeLeft(120);
      setCanResend(false);
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } catch (error: any) {
      const errorMessage = error?.response?.message || error?.message || 'Failed to resend OTP. Please try again.';
      toast.error(errorMessage);
    }
  };

  return (
    <div className="h-screen bg-gradient-to-br from-[#050507] via-[#0F1015] to-[#15161D] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-6xl flex flex-col md:flex-row rounded-[36px] overflow-hidden shadow-[0_38px_86px_rgba(3,3,6,0.65)]">
        <VerifyEmailHero />
        <VerifyEmailForm
          email={email}
          otp={otp}
          inputRefs={inputRefs}
          timeLeft={timeLeft}
          canResend={canResend}
          formatTime={formatTime}
          onOtpChange={handleOtpChange}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          onVerify={handleVerify}
          onResend={handleResend}
          onBackToLogin={() => navigate('/auth/login')}
          verifyPending={verifyEmailMutation.isPending}
          resendPending={resendOTPMutation.isPending}
        />
      </div>
    </div>
  );
}
