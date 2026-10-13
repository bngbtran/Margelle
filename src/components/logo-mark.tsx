const QUOTE =
  'M-7 0C-7-9.5-1.5-15.5 6.5-17.5L7.8-13.4C3.6-12 1-9.6.4-6.6A7 7 0 1 1-7 0Z'

// The Margelle mark: a well rim seen from above, holding a quotation mark.
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden>
      <circle
        cx="32"
        cy="32"
        r="22.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        d={QUOTE}
        transform="translate(25.2 37.2) scale(0.78)"
        fill="currentColor"
      />
      <path
        d={QUOTE}
        transform="translate(40.2 37.2) scale(0.78)"
        fill="currentColor"
      />
    </svg>
  )
}
