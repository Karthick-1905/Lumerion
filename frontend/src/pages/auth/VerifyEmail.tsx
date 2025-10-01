import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useVerifyEmailMutation, useResendOTPMutation } from '../../hooks/useAuth';
import type { VerifyEmailRequest, ResendOTPRequest } from '../../api/types';

export default function VerifyEmail() {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [timeLeft, setTimeLeft] = useState(120); // 2 minutes in seconds
  const [canResend, setCanResend] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  
  const location = useLocation();
  const navigate = useNavigate();
  
  // Get email from location state or localStorage
  const email = location.state?.email || localStorage.getItem('pendingVerificationEmail');
  
  // React Query mutations
  const verifyEmailMutation = useVerifyEmailMutation();
  const resendOTPMutation = useResendOTPMutation();

  // Redirect if no email found and show success message
  useEffect(() => {
    if (!email) {
      toast.error('No email found for verification. Please register again.');
      navigate('/register');
    } else if (location.state?.message) {
      toast.success(location.state.message);
    }
  }, [email, navigate, location.state]);

  // Timer effect
  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => {
        setTimeLeft(timeLeft - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [timeLeft]);

  // Format time as MM:SS
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Handle OTP input change
  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) return; // Prevent multiple characters
    
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  // Handle backspace
  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  // Handle paste
  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').slice(0, 6);
    const newOtp = pastedData.split('').slice(0, 6);
    
    while (newOtp.length < 6) {
      newOtp.push('');
    }
    
    setOtp(newOtp);
    
    // Focus the next empty input or the last input
    const nextEmptyIndex = newOtp.findIndex(val => val === '');
    const focusIndex = nextEmptyIndex === -1 ? 5 : nextEmptyIndex;
    inputRefs.current[focusIndex]?.focus();
  };

  // Handle verify OTP
  const handleVerify = async () => {
    const otpString = otp.join('');
    if (otpString.length !== 6) {
      toast.error('Please enter all 6 digits');
      return;
    }
    
    if (!email) {
      toast.error('Email not found. Please try registering again.');
      navigate('/register');
      return;
    }

    const verifyData: VerifyEmailRequest = {
      user_email: email,
      otp_code: otpString
    };

    try {
      await verifyEmailMutation.mutateAsync(verifyData);
      toast.success('Email verified successfully!');
    } catch (error: any) {
      const errorMessage = error?.response?.message || error?.message || 'Verification failed. Please try again.';
      toast.error(errorMessage);
      // Clear OTP on error
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    }
  };

  // Handle resend OTP
  const handleResend = async () => {
    if (!email) {
      toast.error('Email not found. Please try registering again.');
      navigate('/register');
      return;
    }

    const resendData: ResendOTPRequest = {
      user_email: email
    };

    try {
      await resendOTPMutation.mutateAsync(resendData);
      toast.success('New verification code sent to your email!');
      
      // Reset timer and states
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
    <div className="min-h-screen flex items-center justify-center bg-[#1E1E1E]">
      <div className="flex w-full max-w-6xl shadow-2xl bg-[#1E1E1E]">
        {/* Left: Form */}
        <div className="flex-1 p-8 md:p-12 flex flex-col justify-center">
          <div className="flex flex-col mb-8">
            <div className="flex items-center mb-6">
              {/* Logo placeholder - same as other pages */}
            </div>
            <h2 className="text-3xl font-bold text-white mb-2">Verify Your Email</h2>
            <div className="text-gray-300 mb-6">
              We've sent a verification code to{' '}
              <span className="text-[#FF5757] font-medium">{email}</span>
              <br />
              Please enter the 6-digit code below.
            </div>
          </div>

          {/* OTP Input Fields */}
          <div className="mb-8">
            <div className="flex justify-center gap-3 mb-6">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  ref={el => { inputRefs.current[index] = el; }}
                  type="text"
                  value={digit}
                  onChange={(e) => handleOtpChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  onPaste={index === 0 ? handlePaste : undefined}
                  className="w-12 h-12 text-center text-xl font-semibold bg-[#242424] border border-gray-600 rounded-lg text-white focus:border-[#FF5757] focus:outline-none hover:border-gray-500 transition-colors"
                  maxLength={1}
                />
              ))}
            </div>

            {/* Timer */}
            <div className="text-center mb-6">
              <div className="text-gray-400 text-sm mb-2">Time remaining</div>
              <div className={`text-2xl font-mono font-bold ${
                timeLeft <= 30 ? 'text-[#FF5757]' : 'text-white'
              }`}>
                {formatTime(timeLeft)}
              </div>
            </div>

            {/* Verify Button */}
            <button 
              onClick={handleVerify}
              disabled={otp.join('').length !== 6 || verifyEmailMutation.isPending}
              className="w-full bg-[#FF5757] hover:bg-[#FF6B6B] disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium py-2.5 px-4 rounded-lg transition-all duration-200 mb-4"
            >
              {verifyEmailMutation.isPending ? (
                <div className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Verifying...
                </div>
              ) : (
                'Verify Email'
              )}
            </button>

            {/* Resend OTP */}
            <div className="text-center">
              {canResend ? (
                <button
                  onClick={handleResend}
                  disabled={resendOTPMutation.isPending}
                  className="text-[#FF5757] hover:text-[#FF7B7B] underline transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {resendOTPMutation.isPending ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Sending...
                    </span>
                  ) : (
                    'Resend OTP'
                  )}
                </button>
              ) : (
                <span className="text-gray-400">
                  Didn't receive the code? You can resend in {formatTime(timeLeft)}
                </span>
              )}
            </div>
          </div>

          {/* Back to login link */}
          <div className="text-center">
            <span className="text-gray-300">Want to use a different email? </span>
            <a href="/login" className="text-[#FF5757] hover:text-[#FF7B7B] underline transition-colors">
              Back to Login
            </a>
          </div>
        </div>

        {/* Right: Illustration - Same as other pages but with email theme */}
        <div className="hidden md:flex flex-1 items-center justify-center relative">
          <svg className="w-full max-w-lg h-full" viewBox="0 0 400 400" fill="none" xmlns="http://www.w3.org/2000/svg" style={{filter: "drop-shadow(0 4px 8px rgba(0,0,0,0.1))"}}>
            {/* Floating email envelopes */}
            <g style={{animation: "float 3s ease-in-out infinite"}}>
              <path d="M100 90 L140 90 L140 120 L100 120 Z" stroke="white" strokeWidth="2" fill="none" strokeLinejoin="round" />
              <path d="M100 90 L120 110 L140 90" stroke="#FF7F7F" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
              <circle cx="120" cy="105" r="2" fill="#FFD88A" />
            </g>
            
            <g style={{animation: "float 4s ease-in-out infinite 1.5s"}}>
              <path d="M280 70 L320 70 L320 100 L280 100 Z" stroke="white" strokeWidth="2" fill="none" strokeLinejoin="round" />
              <path d="M280 70 L300 90 L320 70" stroke="#FF7F7F" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
              <circle cx="300" cy="85" r="2" fill="#FFD88A" />
            </g>

            {/* Main email/verification illustration */}
            <g transform="translate(200, 200)">
              {/* Large envelope */}
              <path d="M-80 -60 L80 -60 L80 60 L-80 60 Z" stroke="white" strokeWidth="3" fill="none" strokeLinejoin="round" />
              <path d="M-80 -60 L0 20 L80 -60" stroke="white" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
              
              {/* Verification checkmark */}
              <circle cx="0" cy="0" r="25" stroke="#00CC99" strokeWidth="3" fill="none" />
              <path d="M-10 0 L-2 8 L10 -8" stroke="#00CC99" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
              
              {/* Digital lines representing code */}
              <line x1="-50" y1="30" x2="-20" y2="30" stroke="white" strokeWidth="2" strokeOpacity="0.6" />
              <line x1="-15" y1="30" x2="15" y2="30" stroke="white" strokeWidth="2" strokeOpacity="0.6" />
              <line x1="20" y1="30" x2="50" y2="30" stroke="white" strokeWidth="2" strokeOpacity="0.6" />
              
              <line x1="-40" y1="40" x2="-10" y2="40" stroke="white" strokeWidth="2" strokeOpacity="0.4" />
              <line x1="-5" y1="40" x2="25" y2="40" stroke="white" strokeWidth="2" strokeOpacity="0.4" />
              <line x1="30" y1="40" x2="60" y2="40" stroke="white" strokeWidth="2" strokeOpacity="0.4" />
            </g>

            {/* Timer visualization */}
            <g transform="translate(200, 320)">
              <circle cx="0" cy="0" r="30" stroke="white" strokeWidth="2" fill="none" strokeOpacity="0.3" />
              <circle cx="0" cy="0" r="25" stroke="#FF5757" strokeWidth="3" fill="none" strokeDasharray="157 157" strokeDashoffset="78.5" style={{animation: "timer 120s linear infinite"}}>
                <animateTransform
                  attributeName="transform"
                  type="rotate"
                  values="0 0 0;360 0 0"
                  dur="120s"
                  repeatCount="indefinite"
                />
              </circle>
              <line x1="0" y1="0" x2="0" y2="-15" stroke="white" strokeWidth="2" strokeLinecap="round" />
              <line x1="0" y1="0" x2="10" y2="0" stroke="white" strokeWidth="2" strokeLinecap="round" />
            </g>

            {/* Decorative code digits floating */}
            {/* <g style={{animation: "float 5s ease-in-out infinite 2s"}}>
              <text x="80" y="160" fill="white" fontSize="14" fontFamily="monospace" opacity="0.4">1</text>
              <text x="100" y="180" fill="white" fontSize="14" fontFamily="monospace" opacity="0.4">2</text>
              <text x="120" y="200" fill="white" fontSize="14" fontFamily="monospace" opacity="0.4">3</text>
            </g>
            
            <g style={{animation: "float 6s ease-in-out infinite 3s"}}>
              <text x="320" y="180" fill="white" fontSize="14" fontFamily="monospace" opacity="0.4">4</text>
              <text x="300" y="200" fill="white" fontSize="14" fontFamily="monospace" opacity="0.4">5</text>
              <text x="280" y="220" fill="white" fontSize="14" fontFamily="monospace" opacity="0.4">6</text>
            </g> */}

            {/* Connection lines */}
            <line x1="150" y1="300" x2="250" y2="300" stroke="white" strokeWidth="1" strokeOpacity="0.2" strokeDasharray="3 3" />
            <circle cx="200" cy="350" r="3" fill="white" fillOpacity="0.3" />
          </svg>
        </div>
      </div>
      
      {/* Add keyframes for animations */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        
        @keyframes timer {
          0% { stroke-dashoffset: 157; }
          100% { stroke-dashoffset: 0; }
        }
      `}</style>
    </div>
  );
}
