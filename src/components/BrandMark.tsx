/** The LeashPay mark: a leash handle loop ending in a clip. */
export default function BrandMark({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="8" cy="8" r="5" fill="none" stroke="currentColor" strokeWidth="2.2" />
      <path d="M11.5 11.5 L17 17" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
      <rect x="15" y="15" width="6" height="6" rx="1.5" fill="var(--marigold)" />
    </svg>
  );
}
