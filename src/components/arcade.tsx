/**
 * Sprites for the arcade high-score screen. Drawn inline so they inherit
 * currentColor and stay crisp at any size.
 */

/** Pac-Man style wedge. `bite` is the half-angle of the mouth in degrees. */
function Wedge({ size, bite }: { size: number; bite: number }) {
  const r = 11
  const rad = (bite * Math.PI) / 180
  const x = 12 + r * Math.cos(rad)
  const yTop = 12 - r * Math.sin(rad)
  const yBottom = 12 + r * Math.sin(rad)
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d={`M12 12 L${x.toFixed(2)} ${yTop.toFixed(2)} A${r} ${r} 0 1 0 ${x.toFixed(2)} ${yBottom.toFixed(2)} Z`} />
    </svg>
  )
}

/**
 * Two-frame chomp, the way the cabinet animates it: a closed circle and a
 * wide-open mouth, cross-faded in antiphase so only one is ever visible.
 */
export function PacMan({ size = 20 }: { size?: number }) {
  return (
    <span className="pac" aria-hidden="true">
      <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
        <circle cx="12" cy="12" r="11" />
      </svg>
      <Wedge size={size} bite={42} />
    </span>
  )
}

/** Ghost, used to mark players who posted without a name. */
export function Ghost({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="currentColor"
        d="M2 22V10a10 10 0 0 1 20 0v12l-3.3-2.5-3.35 2.5L12 19.5 8.65 22 5.3 19.5 2 22Z"
      />
      <ellipse cx="8.6" cy="10" rx="2.7" ry="3.2" fill="#fff" />
      <ellipse cx="15.4" cy="10" rx="2.7" ry="3.2" fill="#fff" />
      <circle cx="9.5" cy="10.4" r="1.4" fill="#1a1a3a" />
      <circle cx="16.3" cy="10.4" r="1.4" fill="#1a1a3a" />
    </svg>
  )
}

/** Selection caret for the arcade menu. */
export function Caret({ size = 12 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 12 12" fill="currentColor" aria-hidden="true">
      <path d="M2 0.5 10 6 2 11.5Z" />
    </svg>
  )
}
