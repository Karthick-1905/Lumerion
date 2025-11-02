import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useResetPasswordMutation } from '../../hooks/useAuth';
import { toast } from 'react-toastify';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    newPassword: '',
    confirmPassword: ''
  });
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [token, setToken] = useState<string | null>(null);
  const { mutate: resetPassword, isPending } = useResetPasswordMutation();

  useEffect(() => {
    const tokenParam = searchParams.get('token');
    if (!tokenParam) {
      toast.error('Invalid reset link. Please request a new password reset.');
      navigate('/auth/login');
      return;
    }
    setToken(tokenParam);
  }, [searchParams, navigate]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (error) setError('');
  };

  const validatePasswords = () => {
    if (formData.newPassword.length < 8) {
      setError('Password must be at least 8 characters long');
      return false;
    }
    if (formData.newPassword !== formData.confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validatePasswords()) return;
    if (!token) {
      setError('Invalid reset token');
      return;
    }

    resetPassword(
      {
        token,
        new_password: formData.newPassword
      },
      {
        onError: (err: any) => {
          const message = err?.response?.message || err?.message || 'Failed to reset password';
          setError(message);
        },
      }
    );
  };

//   if (!token) {
//     return (
//       <div className="min-h-screen flex items-center justify-center bg-[#1E1E1E]">
//         <div className="text-center">
//           <div className="text-white text-xl mb-4">Loading...</div>
//         </div>
//       </div>
//     );
//   }

  return (
    <div className="min-h-screen flex items-center justify-center bg-primary">
      <div className="flex w-full max-w-6xl shadow-2xl bg-primary">
        {/* Left: Form */}
        <div className="flex-1 p-8 md:p-12 flex flex-col justify-center">
          <div className="flex flex-col mb-8">
            <h2 className="text-3xl font-bold text-primary mb-2">Reset Your Password</h2>
            <p className="text-secondary">
              Enter your new password below to complete the reset process.
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-900/20 border border-red-700 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* New Password */}
            <div className="relative mb-4">
              <input
                type={!showNewPassword ? "password" : "text"}
                name="newPassword"
                placeholder="New Password"
                value={formData.newPassword}
                onChange={handleInputChange}
                className="input-field pr-12"
                required
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-secondary hover:text-primary"
              >
                {!showNewPassword ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.542 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"></path>
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                  </svg>
                )}
              </button>
            </div>

            {/* Confirm Password */}
            <div className="relative mb-6">
              <input
                type={!showConfirmPassword ? "password" : "text"}
                name="confirmPassword"
                placeholder="Confirm New Password"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                className="input-field pr-12"
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-secondary hover:text-primary"
              >
                {!showConfirmPassword ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.542 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"></path>
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                  </svg>
                )}
              </button>
            </div>

            {/* Password requirements */}
            <div className="mb-6 text-xs text-secondary">
              <p>Password requirements:</p>
              <ul className="list-disc list-inside mt-1 space-y-1">
                <li className={formData.newPassword.length >= 8 ? 'text-white/80' : ''}>
                  At least 8 characters
                </li>
                <li className={formData.newPassword === formData.confirmPassword && formData.confirmPassword ? 'text-white/80' : ''}>
                  Passwords match
                </li>
              </ul>
            </div>

            <button
              type="submit"
              disabled={isPending || !formData.newPassword || !formData.confirmPassword}
              className="w-full bg-accent hover:bg-accent/90 disabled:bg-secondary disabled:cursor-not-allowed text-primary font-medium py-2.5 px-4 rounded-lg transition-all duration-200"
            >
              {isPending ? (
                <div className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Resetting Password...
                </div>
              ) : (
                'Reset Password'
              )}
            </button>
          </form>

          {/* Back to login */}
          <div className="mt-6 text-center">
            <span className="text-secondary">Remember your password? </span>
            <a href="/auth/login" className="text-accent hover:text-accent/90 underline transition-colors">
              Back to Login
            </a>
          </div>
        </div>

        {/* Right: Illustration */}
        <div className="hidden md:flex flex-1 items-center justify-center relative">
          <svg className="w-full max-w-lg h-full" viewBox="0 0 400 400" fill="none" xmlns="http://www.w3.org/2000/svg" style={{filter: "drop-shadow(0 4px 8px rgba(0,0,0,0.1))"}}>
            {/* Floating lock icons */}
            <g style={{animation: "float 3s ease-in-out infinite"}}>
              <rect x="110" y="70" width="30" height="20" stroke="white" strokeWidth="2" fill="none" rx="3" />
              <path d="M115 70 L115 60 Q115 50 125 50 Q135 50 135 60 L135 70" stroke="white" strokeWidth="2" fill="none" />
              <circle cx="125" cy="80" r="2" fill="#FFD88A" />
            </g>
            
            <g style={{animation: "float 4s ease-in-out infinite 1.5s"}}>
              <rect x="280" y="50" width="30" height="20" stroke="white" strokeWidth="2" fill="none" rx="3" />
              <path d="M285 50 L285 40 Q285 30 295 30 Q305 30 305 40 L305 50" stroke="white" strokeWidth="2" fill="none" />
              <circle cx="295" cy="60" r="2" fill="#FFD88A" />
            </g>

            {/* Main reset password illustration */}
            <g transform="translate(200, 200)">
              {/* Large shield/lock */}
              <path d="M0 -60 Q-40 -60 -40 -20 L-40 20 Q-40 60 0 60 Q40 60 40 20 L40 -20 Q40 -60 0 -60" stroke="white" strokeWidth="3" fill="none" />
              
              {/* Lock inside shield */}
              <rect x="-15" y="-10" width="30" height="25" stroke="white" strokeWidth="2" fill="none" rx="3" />
              <path d="M-10 -10 L-10 -20 Q-10 -30 0 -30 Q10 -30 10 -20 L10 -10" stroke="white" strokeWidth="2" fill="none" />
              
              {/* Reset arrows around the shield */}
              <g style={{animation: "rotate 4s ease-in-out infinite"}}>
                <path d="M60 0 Q60 -30 30 -30 L20 -30" stroke="#00CC99" strokeWidth="3" fill="none" strokeLinecap="round" />
                <path d="M25 -35 L20 -30 L25 -25" stroke="#00CC99" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                
                <path d="M-60 0 Q-60 30 -30 30 L-20 30" stroke="#00CC99" strokeWidth="3" fill="none" strokeLinecap="round" />
                <path d="M-25 25 L-20 30 L-25 35" stroke="#00CC99" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
              </g>
              
              {/* Key symbol */}
              <circle cx="0" cy="5" r="4" fill="#FFD88A" />
              <line x1="4" y1="5" x2="10" y2="5" stroke="#FFD88A" strokeWidth="2" strokeLinecap="round" />
              <line x1="8" y1="3" x2="10" y2="3" stroke="#FFD88A" strokeWidth="1.5" strokeLinecap="round" />
              <line x1="8" y1="7" x2="10" y2="7" stroke="#FFD88A" strokeWidth="1.5" strokeLinecap="round" />
            </g>

            {/* Security dots pattern */}
            <g opacity="0.3">
              <circle cx="100" cy="150" r="2" fill="white" />
              <circle cx="120" cy="160" r="2" fill="white" />
              <circle cx="140" cy="170" r="2" fill="white" />
              <circle cx="280" cy="180" r="2" fill="white" />
              <circle cx="300" cy="190" r="2" fill="white" />
              <circle cx="320" cy="200" r="2" fill="white" />
            </g>

            {/* Base platform */}
            <ellipse cx="200" cy="320" rx="120" ry="30" stroke="white" strokeWidth="2" fill="none" strokeOpacity="0.3" />
            
            {/* Decorative elements */}
            <g style={{animation: "float 5s ease-in-out infinite 2s"}}>
              <path d="M80 180 L90 170 L100 180 L90 190 Z" stroke="#FF5757" strokeWidth="2" fill="none" />
            </g>
            
            <g style={{animation: "float 6s ease-in-out infinite 3s"}}>
              <circle cx="320" cy="150" r="6" stroke="#00CC99" strokeWidth="2" fill="none" />
              <circle cx="320" cy="150" r="2" fill="#00CC99" />
            </g>
          </svg>
        </div>
      </div>
      
      {/* Add keyframes for animations */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        
        @keyframes rotate {
          0%, 100% { transform: rotate(0deg); }
          50% { transform: rotate(15deg); }
        }
      `}</style>
    </div>
  );
}
