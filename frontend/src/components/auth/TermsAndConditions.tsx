type TermsAndConditionsProps = {
  onAcceptChange?: (checked: boolean) => void;
  onMarketingChange?: (checked: boolean) => void;
};

export default function TermsAndConditions({ onAcceptChange, onMarketingChange }: TermsAndConditionsProps) {
  return (
    <div className="space-y-3 text-sm text-[#64647A]">
      <label className="flex items-start gap-3">
        <input
          type="checkbox"
          required
          className="mt-1 size-4 rounded border-[#D4D4DE] text-[#111112] focus:ring-[#8F8FF6]"
          onChange={event => onAcceptChange?.(event.target.checked)}
        />
        <span>
          By creating an account, I agree to the{' '}
          <a className="text-[#8F8FF6] hover:text-[#6B6BEF]" href="/terms" target="_blank" rel="noreferrer">
            Terms &amp; Conditions
          </a>{' '}
          and{' '}
          <a className="text-[#8F8FF6] hover:text-[#6B6BEF]" href="/privacy" target="_blank" rel="noreferrer">
            Privacy Policy
          </a>{' '}
          of the Learning Studio.
        </span>
      </label>
      <label className="flex items-start gap-3">
        <input
          type="checkbox"
          className="mt-1 size-4 rounded border-[#D4D4DE] text-[#111112] focus:ring-[#8F8FF6]"
          onChange={event => onMarketingChange?.(event.target.checked)}
        />
        <span>Keep me informed about new pathways, invite-only cohorts, and feature announcements.</span>
      </label>
    </div>
  );
}