import { ReactNode } from 'react'

/** Paw-print logo mark, drawn inline so it inherits currentColor. */
export function PawMark({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      {/* four toes in an arc above the pad */}
      <ellipse cx="4.6" cy="10.6" rx="2.0" ry="2.7" transform="rotate(-28 4.6 10.6)" />
      <ellipse cx="9.5" cy="6.6" rx="2.1" ry="2.9" transform="rotate(-9 9.5 6.6)" />
      <ellipse cx="14.5" cy="6.6" rx="2.1" ry="2.9" transform="rotate(9 14.5 6.6)" />
      <ellipse cx="19.4" cy="10.6" rx="2.0" ry="2.7" transform="rotate(28 19.4 10.6)" />
      {/* main pad */}
      <path d="M12 12.2c2.3 0 4 1.4 5 3.1.9 1.4 2.1 2.5 2.1 4.2 0 2-1.7 3.3-3.6 3.3-1.4 0-2.4-.8-3.5-.8s-2.1.8-3.5.8c-1.9 0-3.6-1.3-3.6-3.3 0-1.7 1.2-2.8 2.1-4.2 1-1.7 2.7-3.1 5-3.1Z" />
    </svg>
  )
}

/**
 * Hand-drawn-style icons: single wobbly strokes, round caps, no fills —
 * they read like quick pen sketches and inherit currentColor.
 */
function Sketch({ size, children }: { size: number; children: ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  )
}

/** Floppy-eared dog face. */
export function DogSketch({ size = 24 }: { size?: number }) {
  return (
    <Sketch size={size}>
      {/* head */}
      <path d="M12 4.8c3.1 0 5.6 2.4 5.8 5.6.2 3.6-2.4 6.5-5.8 6.5s-6-2.9-5.8-6.5C6.4 7.2 8.9 4.8 12 4.8Z" />
      {/* floppy ears hanging past the cheeks */}
      <path d="M7 5.6C5.3 5.5 4 6.9 3.9 8.9c-.1 1.9.8 3.7 2.3 4.4.8-.9 1.2-2.2 1.1-3.8L7 5.6Z" />
      <path d="M17 5.6c1.7-.1 3 1.3 3.1 3.3.1 1.9-.8 3.7-2.3 4.4-.8-.9-1.2-2.2-1.1-3.8L17 5.6Z" />
      {/* eyes, nose, mouth */}
      <path d="M9.7 10.4h.01M14.3 10.4h.01" strokeWidth="2.4" />
      <path d="M11.1 12.6h1.8l-.9 1.1Z" />
      <path d="M12 13.7v1.3M12 15c-.5.7-1.3.9-2.1.6M12 15c.5.7 1.3.9 2.1.6" />
    </Sketch>
  )
}

/** Loose flame doodle for the streak chip. */
export function FlameSketch({ size = 16 }: { size?: number }) {
  return (
    <Sketch size={size}>
      <path d="M12 3.2c.6 2.4-.3 4-1.7 5.3C8.8 9.9 7.2 11.3 7 13.8c-.2 3 2.1 5.6 5 5.7 2.9.1 5.3-2.2 5.3-5.2 0-2.2-1.1-3.6-2-5-.3.9-.8 1.6-1.6 2.1.3-3-.4-6-1.7-8.2Z" />
      <path d="M10 14.6c0 1.4 1 2.5 2.2 2.5s2.1-1 2.1-2.3c0-.9-.5-1.5-1.1-2.2-.7.6-1.4.8-2.2.9" />
    </Sketch>
  )
}

/** Little trophy for the leaderboard. */
export function TrophySketch({ size = 18 }: { size?: number }) {
  return (
    <Sketch size={size}>
      <path d="M7.2 4.1h9.6l-.3 5.2c-.2 2.7-2.1 4.7-4.5 4.8-2.4 0-4.4-2.1-4.6-4.7l-.2-5.3Z" />
      <path d="M7.1 5.9c-1.5-.2-2.7.5-2.9 1.8-.2 1.4 1 2.7 2.8 2.9M16.9 5.9c1.5-.2 2.7.5 2.9 1.8.2 1.4-1 2.7-2.8 2.9" />
      <path d="M12 14.2v3M9.3 19.8c1.8-.4 3.7-.4 5.4 0" />
    </Sketch>
  )
}
export function Wordmark({ size = 22 }: { size?: number }) {
  return (
    <span className="wordmark" style={{ fontSize: size }}>
      <PawMark size={size * 1.05} />
      Doggo
    </span>
  )
}
