import React, { useState } from 'react';
import ForgotPasswordModal from './ForgotPasswordModal';

export default function Login() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#1E1E1E]">
      <div className="flex w-full max-w-6xl shadow-2xl bg-[#1E1E1E]">
        {/* Left: Form */}
        <div className="flex-1 p-8 md:p-12 flex flex-col justify-center">
          <div className="flex flex-col mb-8">
            <div className="flex items-center mb-6">
              {/* <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="40" height="40" rx="8" fill="url(#gradient)" />
                <path d="M12 16L20 12L28 16V26L20 30L12 26V16Z" stroke="white" strokeWidth="2" fill="none" strokeLinejoin="round" />
                <path d="M12 16L20 21L28 16" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M20 21V30" stroke="white" strokeWidth="2" strokeLinecap="round" />
                <circle cx="24" cy="19" r="1.5" fill="#FFD88A" />
                <defs>
                  <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#FF7F7F" />
                    <stop offset="50%" stopColor="#FF5757" />
                    <stop offset="100%" stopColor="#00CC99" />
                  </linearGradient>
                </defs>
              </svg> */}
              {/* <div className="ml-3">
                <h1 className="text-xl font-bold text-white">Learning Management</h1>
                <p className="text-sm text-gray-400">System</p>
              </div> */}
            </div>
            <h2 className="text-3xl font-bold text-white mb-2">Sign In</h2>
            <div>
              <span className="text-gray-300">Don't have an account? </span>
              <a href="/auth/register" className="text-[#FF5757] hover:text-[#FF7B7B] underline transition-colors">Sign up</a>
            </div>
          </div>
          <button className="w-full flex items-center justify-center gap-2 bg-white hover:bg-gray-100 text-gray-800 font-medium py-3 px-4 rounded-lg mb-6 transition-all duration-200 shadow-sm hover:shadow-md">
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M21.35,11.1H12v3.2h5.59c-0.56,2.19-2.46,3.8-5.59,3.8c-3.18,0-5.76-2.58-5.76-5.76 s2.58-5.76,5.76-5.76c1.35,0,2.58,0.47,3.54,1.24l2.48-2.48C16.35,3.88,14.29,3,12,3c-4.97,0-9,4.03-9,9s4.03,9,9,9 s9-4.03,9-9C21,12.33,20.84,11.55,21.35,11.1z"/>
            </svg>
            <span>Sign up with Google</span>
          </button>
          <div className="flex items-center my-6">
            <div className="flex-1 h-px bg-gray-700"></div>
            <div className="mx-4 text-sm text-gray-400">Or</div>
            <div className="flex-1 h-px bg-gray-700"></div>
          </div>
          <form className="space-y-4">
            
            <div className="mb-4">
              <input 
                type="email" 
                name="email"
                placeholder="Email address" 
                value={formData.email}
                onChange={handleInputChange}
                className="w-full rounded-lg border border-gray-600 bg-[#242424] px-4 py-2.5 text-white placeholder-gray-400 focus:border-[#FF5757] focus:outline-none hover:border-gray-500 transition-colors"
              />
            </div>
            
            <div className='flex flex-row gap-2 w-full'>
              <div className="relative mb-4 w-full" >
              <input 
                type={!showPassword ? "password" : "text"}
                name="password"
                placeholder="Password" 
                value={formData.password}
                onChange={handleInputChange}
                className="w-full rounded-lg border border-gray-600 bg-[#242424] px-4 py-2.5 text-white placeholder-gray-400 focus:border-[#FF5757] focus:outline-none hover:border-gray-500 transition-colors pr-12"
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300"
              >
                {!showPassword ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"></path>
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                  </svg>
                )}
              </button>
            </div>
            </div>
            
            {/* Forgot Password Link */}
            <div className="text-right mb-4">
              <button
                type="button"
                onClick={() => setShowForgotPasswordModal(true)}
                className="text-[#FF5757] hover:text-[#FF7B7B] text-sm underline transition-colors"
              >
                Forgot Password?
              </button>
            </div>
            
            <button 
              type="submit" 
              className="w-full bg-[#FF5757] hover:bg-[#FF6B6B] text-white font-medium py-2.5 px-4 rounded-lg transition-all duration-200"
            >
              Sign In
            </button>
          </form>
          <div className="mt-4 text-xs text-gray-400">
            By signing in, I agree with Anima's <a href="#" className="text-[#FF5757] hover:text-[#FF7B7B] transition-colors">Privacy Policy</a> and <a href="#" className="text-[#FF5757] hover:text-[#FF7B7B] transition-colors">Terms of Service</a>.
          </div>
        </div>
        {/* Right: Freehand Drawing Illustration */}
        <div className="hidden md:flex flex-1 items-center justify-center relative">
          <svg className="w-full max-w-lg h-full" viewBox="0 0 400 400" fill="none" xmlns="http://www.w3.org/2000/svg" style={{filter: "drop-shadow(0 4px 8px rgba(0,0,0,0.1))"}}>
            {/* Floating learning houses */}
            <g style={{animation: "float 3s ease-in-out infinite"}}>
              <path d="M120 80 L140 60 L160 80 L160 100 L120 100 Z" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M130 60 L130 45 L140 50 L150 45 L150 60" stroke="#FF7F7F" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
              <rect x="125" y="85" width="8" height="15" stroke="white" strokeWidth="1.5" fill="none" />
              <rect x="147" y="85" width="8" height="15" stroke="white" strokeWidth="1.5" fill="none" />
              <circle cx="140" cy="110" r="4" fill="#FFD88A" />
            </g>
            
            <g style={{animation: "float 4s ease-in-out infinite 1.5s"}}>
              <path d="M290 60 L310 40 L330 60 L330 80 L290 80 Z" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M300 40 L300 25 L310 30 L320 25 L320 40" stroke="#FF7F7F" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
              <rect x="295" y="65" width="8" height="15" stroke="white" strokeWidth="1.5" fill="none" />
              <rect x="317" y="65" width="8" height="15" stroke="white" strokeWidth="1.5" fill="none" />
              <circle cx="310" cy="90" r="4" fill="#FFD88A" />
            </g>

            {/* Main 3D computer/box - Fixed orientation */}
            <g transform="translate(200, 200)">
              {/* Top face */}
              <path d="M-60 -40 L-40 -60 L80 -60 L60 -40 Z" stroke="white" strokeWidth="2" fill="none" strokeLinejoin="round" />
              
              {/* Right face */}
              <path d="M60 -40 L80 -60 L80 60 L60 40 Z" stroke="white" strokeWidth="2" fill="none" strokeLinejoin="round" />
              
              {/* Front face */}
              <rect x="-60" y="-40" width="120" height="80" stroke="white" strokeWidth="2" fill="none" rx="4" />
              
              {/* Screen */}
              <rect x="-45" y="-25" width="90" height="50" stroke="white" strokeWidth="1.5" fill="none" rx="2" strokeDasharray="2 1" />
              <line x1="-30" y1="-10" x2="30" y2="-10" stroke="white" strokeWidth="1" strokeOpacity="0.5" />
              <line x1="-30" y1="0" x2="30" y2="0" stroke="white" strokeWidth="1" strokeOpacity="0.5" />
              <line x1="-30" y1="10" x2="30" y2="10" stroke="white" strokeWidth="1" strokeOpacity="0.5" />
              
              {/* Stand */}
              <rect x="-25" y="40" width="50" height="15" stroke="white" strokeWidth="2" fill="none" rx="2" />
              <rect x="-10" y="55" width="20" height="8" stroke="white" strokeWidth="2" fill="none" rx="1" />
              
              {/* Connection lines */}
              <path d="M-60 -40 L-40 -60" stroke="white" strokeWidth="2" />
              <path d="M60 -40 L80 -60" stroke="white" strokeWidth="2" />
              <path d="M-60 40 L-40 60 L80 60 L60 40" stroke="white" strokeWidth="2" strokeDasharray="3 2" />
            </g>

            {/* Palette/Base */}
            <ellipse cx="200" cy="320" rx="140" ry="40" stroke="white" strokeWidth="2" fill="none" />
            <ellipse cx="200" cy="315" rx="135" ry="35" stroke="white" strokeWidth="1" fill="none" strokeOpacity="0.3" />
            
            {/* Color dots on palette */}
            <ellipse cx="120" cy="315" rx="20" ry="12" fill="#E8A5A5" fillOpacity="0.8" />
            <ellipse cx="170" cy="325" rx="18" ry="10" fill="#F5D76E" fillOpacity="0.8" />
            <ellipse cx="220" cy="320" rx="22" ry="14" fill="#7FDBCA" fillOpacity="0.8" />
            <ellipse cx="270" cy="310" rx="19" ry="11" fill="#E8A5A5" fillOpacity="0.8" />
            
            {/* Small decorative elements */}
            <circle cx="80" cy="150" r="6" stroke="white" strokeWidth="1.5" fill="none" style={{animation: "float 5s ease-in-out infinite 2s"}} />
            <path d="M350 180 L360 170 L370 180 L360 190 Z" stroke="white" strokeWidth="1.5" fill="#7FDBCA" fillOpacity="0.6" style={{animation: "float 6s ease-in-out infinite 3s"}} />
            
            {/* Small connecting lines/dots */}
            <circle cx="200" cy="280" r="2" fill="white" />
            <line x1="180" y1="270" x2="220" y2="270" stroke="white" strokeWidth="1" strokeOpacity="0.4" strokeDasharray="2 3" />
          </svg>
        </div>
      </div>

      {/* Forgot Password Modal */}
      <ForgotPasswordModal 
        isOpen={showForgotPasswordModal}
        onClose={() => setShowForgotPasswordModal(false)}
      />
    </div>
  );
}


