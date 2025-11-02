import React, { useState } from 'react';
import { useForgotPasswordMutation } from '../../hooks/useAuth';
import { toast } from 'react-toastify';

interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ForgotPasswordModal({ isOpen, onClose }: ForgotPasswordModalProps) {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { mutate: forgotPassword } = useForgotPasswordMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setIsLoading(true);
    forgotPassword(
      { user_email: email },
      {
        onSuccess: () => {
          setIsSubmitted(true);
        },
        onError: (error: any) => {
          const message = error?.response?.message || error?.message || 'Failed to send reset link';
          toast.error(message);
        },
        onSettled: () => {
          setIsLoading(false);
        },
      }
    );
  };

  const handleClose = () => {
    setEmail('');
    setIsSubmitted(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-[#1E1E1E] border border-gray-600 rounded-lg p-8 max-w-md w-full mx-4 relative">
        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {!isSubmitted ? (
          <>
            {/* Header */}
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-white mb-2">Reset Password</h2>
              <p className="text-gray-300 text-sm">
                Enter your email address and we'll send you a link to reset your password.
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <input
                  type="email"
                  placeholder="Enter your email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-lg border border-gray-600 bg-[#242424] px-4 py-2.5 text-white placeholder-gray-400 focus:border-[#FF5757] focus:outline-none hover:border-gray-500 transition-colors"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isLoading || !email.trim()}
                className="w-full bg-[#FF5757] hover:bg-[#FF6B6B] disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium py-2.5 px-4 rounded-lg transition-all duration-200"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Sending...
                  </div>
                ) : (
                  'Send Reset Link'
                )}
              </button>
            </form>

            {/* Back to login */}
            <div className="mt-4 text-center">
              <button
                onClick={handleClose}
                className="text-gray-400 hover:text-gray-300 text-sm underline transition-colors"
              >
                Back to Login
              </button>
            </div>
          </>
        ) : (
          <>
            {/* Success state */}
            <div className="text-center">
              {/* Success icon */}
              <div className="mx-auto mb-4 w-16 h-16 bg-white/10 border border-white/20 rounded-full flex items-center justify-center text-white/80">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
              </div>

              <h2 className="text-2xl font-bold text-white mb-2">Check Your Email</h2>
              <p className="text-gray-300 text-sm mb-6">
                We've sent a password reset link to <br />
                <span className="text-[#FF5757] font-medium">{email}</span>
              </p>

              <button
                onClick={handleClose}
                className="w-full bg-[#FF5757] hover:bg-[#FF6B6B] text-white font-medium py-2.5 px-4 rounded-lg transition-all duration-200"
              >
                Done
              </button>

              <div className="mt-4">
                <p className="text-gray-400 text-xs">
                  Didn't receive the email? Check your spam folder or{' '}
                  <button
                    onClick={() => {
                      setIsSubmitted(false);
                      setEmail('');
                    }}
                    className="text-[#FF5757] hover:text-[#FF7B7B] underline transition-colors"
                  >
                    try again
                  </button>
                </p>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
