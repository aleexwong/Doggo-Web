/** Material-style system icons, inline so they inherit currentColor. */

export function CheckIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M9.55 17.6 4 12.05l1.4-1.4 4.15 4.15 9.05-9.05 1.4 1.4z" />
    </svg>
  )
}

export function CloseIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M6.4 19 5 17.6l5.6-5.6L5 6.4 6.4 5l5.6 5.6L17.6 5 19 6.4 13.4 12l5.6 5.6-1.4 1.4-5.6-5.6z" />
    </svg>
  )
}

export function LeaderboardIcon({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M19 5h-2V3H7v2H5a2 2 0 0 0-2 2v1c0 2.55 1.92 4.63 4.39 4.94A5.01 5.01 0 0 0 11 15.9V19H7v2h10v-2h-4v-3.1a5.01 5.01 0 0 0 3.61-2.96C19.08 12.63 21 10.55 21 8V7a2 2 0 0 0-2-2ZM5 8V7h2v3.82C5.84 10.4 5 9.3 5 8Zm14 0c0 1.3-.84 2.4-2 2.82V7h2v1Z" />
    </svg>
  )
}

export function BackIcon({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20z" />
    </svg>
  )
}

/** Sun / moon pair for the theme toggle. */
export function ThemeIcon({ dark, size = 21 }: { dark: boolean; size?: number }) {
  return dark ? (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 3a9 9 0 1 0 9 9 7 7 0 0 1-9-9Z" />
    </svg>
  ) : (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10Zm-1-6h2v3.2h-2Zm0 18.8h2V23h-2ZM1 11h3.2v2H1Zm18.8 0H23v2h-3.2ZM4.2 2.8 6.5 5.1 5.1 6.5 2.8 4.2Zm12.3 14.1 1.4-1.4 2.3 2.3-1.4 1.4ZM19.8 4.2l-2.3 2.3-1.4-1.4 2.3-2.3ZM5.1 16.9l1.4 1.4-2.3 2.3-1.4-1.4Z" />
    </svg>
  )
}
