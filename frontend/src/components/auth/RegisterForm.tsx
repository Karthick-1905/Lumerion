import React from 'react';
import TermsAndConditions from './TermsAndConditions';

type FormData = {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
};

type RegisterFormProps = {
  formData: FormData;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  showPassword: boolean;
  showConfirmPassword: boolean;
  onTogglePassword: () => void;
  onToggleConfirmPassword: () => void;
  isSubmitting: boolean;
  onAcceptTerms?: (checked: boolean) => void;
  onMarketingOptIn?: (checked: boolean) => void;
};

export default function RegisterForm({
  formData,
  onChange,
  onSubmit,
  showPassword,
  showConfirmPassword,
  onTogglePassword,
  onToggleConfirmPassword,
  isSubmitting,
  onAcceptTerms,
  onMarketingOptIn,
}: RegisterFormProps) {
  const inputStyles =
    'w-full rounded-xl border border-[#E4E4EC] bg-white px-4 py-3 text-sm text-[#1F1F29] shadow-sm focus:border-[#8F8FF6] focus:ring-2 focus:ring-[#C9C9FD] placeholder:text-[#9C9CAD] transition';

  return (
    <div className="flex-1 bg-white text-[#14141F] px-8 py-10 md:px-12 md:py-14">
      <div className="flex flex-col h-full">
        <div className="mb-8">
          <p className="text-sm uppercase tracking-[0.25em] text-[#8D8DA6]">Sign up now</p>
          <h2 className="mt-3 text-3xl font-semibold text-[#14141F]">Join the Learning Studio</h2>
          <p className="mt-2 text-sm text-[#74748A]">Create your account to track modules, earn badges, and collaborate in real time.</p>
        </div>

        <form onSubmit={onSubmit} className="flex-1 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="text"
              name="username"
              autoComplete="username"
              placeholder="Display name"
              value={formData.username}
              onChange={onChange}
              className={`${inputStyles} md:col-span-2`}
            />
            <input
              type="email"
              name="email"
              autoComplete="email"
              placeholder="Email address"
              value={formData.email}
              onChange={onChange}
              className={`${inputStyles} md:col-span-2`}
            />

            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                autoComplete="new-password"
                placeholder="Password"
                value={formData.password}
                onChange={onChange}
                className={`${inputStyles} pr-12`}
              />
              <button
                type="button"
                onClick={onTogglePassword}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-[#7B7B92] hover:text-[#3C3C59] transition"
              >
                {showPassword ? (
                  <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.6" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.6" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                ) : (
                  <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.6" d="M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21m-3.589-3.589A9.953 9.953 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 014.243 4.243" />
                  </svg>
                )}
              </button>
            </div>

            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                name="confirmPassword"
                autoComplete="new-password"
                placeholder="Confirm password"
                value={formData.confirmPassword}
                onChange={onChange}
                className={`${inputStyles} pr-12`}
              />
              <button
                type="button"
                onClick={onToggleConfirmPassword}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-[#7B7B92] hover:text-[#3C3C59] transition"
              >
                {showConfirmPassword ? (
                  <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.6" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.6" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                ) : (
                  <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.6" d="M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21m-3.589-3.589A9.953 9.953 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 014.243 4.243" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          <TermsAndConditions onAcceptChange={onAcceptTerms} onMarketingChange={onMarketingOptIn} />

          <button
            type="submit"
            disabled={isSubmitting}
            className={`w-full rounded-full py-3 text-base font-semibold transition ${
              isSubmitting
                ? 'bg-[#E4E4EC] text-[#A7A7BA] cursor-not-allowed'
                : 'bg-[#111112] text-white shadow-[0_16px_32px_rgba(17,17,18,0.22)] hover:bg-[#0C0C0F]'
            }`}
          >
            {isSubmitting ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        <div className="mt-6 text-sm text-center text-[#7F7F90]">
          Already part of the learning circle?{' '}
          <a href="/auth/login" className="font-medium text-[#8F8FF6] hover:text-[#6B6BEF]">
            Log in
          </a>
        </div>
      </div>
    </div>
  );
}