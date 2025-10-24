import React from 'react';

type VerifyEmailFormProps = {
  email: string | null;
  otp: string[];
  inputRefs: React.MutableRefObject<(HTMLInputElement | null)[]>;
  timeLeft: number;
  canResend: boolean;
  formatTime: (seconds: number) => string;
  onOtpChange: (index: number, value: string) => void;
  onKeyDown: (index: number, event: React.KeyboardEvent<HTMLInputElement>) => void;
  onPaste: (event: React.ClipboardEvent<HTMLInputElement>) => void;
  onVerify: () => void;
  onResend: () => void;
  onBackToLogin: () => void;
  verifyPending: boolean;
  resendPending: boolean;
};

export default function VerifyEmailForm({
  email,
  otp,
  inputRefs,
  timeLeft,
  canResend,
  formatTime,
  onOtpChange,
  onKeyDown,
  onPaste,
  onVerify,
  onResend,
  onBackToLogin,
  verifyPending,
  resendPending,
}: VerifyEmailFormProps) {
  return (
    <div className="flex-1 bg-white text-[#14141F] px-8 py-10 md:px-12 md:py-14 flex flex-col">
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center">
        <div className="mb-8">
          <p className="text-sm uppercase tracking-[0.25em] text-[#8D8DA6]">Confirm access</p>
          <h2 className="mt-3 text-3xl font-semibold text-[#14141F]">Verify your email</h2>
          <p className="mt-2 text-sm text-[#74748A]">
            We sent a 6-digit code to{' '}
            <span className="font-medium text-[#1F1F29]">{email ?? 'your inbox'}</span>. Enter it below to complete setup.
          </p>
        </div>

        <div className="mb-10">
          <div className="flex justify-center gap-3">
            {otp.map((digit, index) => (
              <input
                key={index}
                ref={el => {
                  inputRefs.current[index] = el;
                }}
                type="text"
                value={digit}
                inputMode="numeric"
                onChange={event => onOtpChange(index, event.target.value.replace(/\D/g, ''))}
                onKeyDown={event => onKeyDown(index, event)}
                onPaste={index === 0 ? onPaste : undefined}
                className="h-14 w-12 rounded-xl border border-[#E4E4EC] bg-white text-center text-xl font-semibold text-[#1F1F29] shadow-sm focus:border-[#8F8FF6] focus:ring-2 focus:ring-[#C9C9FD] transition"
                maxLength={1}
              />
            ))}
          </div>
        </div>

        <div className="text-center mb-8">
          <span className="text-sm text-[#74748A] block mb-2">Time remaining</span>
          <span className={`text-2xl font-mono font-semibold ${timeLeft <= 30 ? 'text-[#8F8FF6]' : 'text-[#1F1F29]'}`}>
            {formatTime(timeLeft)}
          </span>
        </div>

        <button
          onClick={onVerify}
          disabled={otp.join('').length !== 6 || verifyPending}
          className={`w-full rounded-full py-3 text-base font-semibold transition ${
            otp.join('').length !== 6 || verifyPending
              ? 'bg-[#E4E4EC] text-[#A7A7BA] cursor-not-allowed'
              : 'bg-[#111112] text-white shadow-[0_16px_32px_rgba(17,17,18,0.22)] hover:bg-[#0C0C0F]'
          }`}
        >
          {verifyPending ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              Verifying…
            </span>
          ) : (
            'Verify Email'
          )}
        </button>

        <div className="mt-6 text-center text-sm">
          {canResend ? (
            <button
              onClick={onResend}
              disabled={resendPending}
              className="font-medium text-[#8F8FF6] hover:text-[#6B6BEF] transition disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {resendPending ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Sending…
                </span>
              ) : (
                'Resend verification code'
              )}
            </button>
          ) : (
            <span className="text-[#74748A]">Didn’t get the code? You can resend in {formatTime(timeLeft)}</span>
          )}
        </div>
      </div>

      <div className="mt-10 text-sm text-center text-[#7F7F90]">
        Want to use a different email?{' '}
        <button onClick={onBackToLogin} className="font-medium text-[#8F8FF6] hover:text-[#6B6BEF] transition">
          Back to login
        </button>
      </div>
    </div>
  );
}