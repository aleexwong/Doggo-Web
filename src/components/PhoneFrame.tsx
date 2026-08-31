import { ReactNode, useEffect, useState } from 'react'
import { BackIcon } from './icons'

function Clock() {
  const [now, setNow] = useState(new Date())
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30_000)
    return () => clearInterval(id)
  }, [])
  return <span>{now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</span>
}

export function PhoneFrame({
  children,
  dark = false,
}: {
  children: ReactNode
  /** Dark status bar content (for dark screens like boot) */
  dark?: boolean
}) {
  return (
    <div className="phone">
      <div className="phone-screen">
        <div className={`statusbar ${dark ? 'statusbar-dark' : ''}`}>
          <Clock />
          <div className="statusbar-icons" aria-hidden="true">
            {/* signal bars */}
            <svg width="13" height="11" viewBox="0 0 13 11" fill="currentColor">
              <rect x="0" y="7.5" width="2.4" height="3.5" rx="0.8" />
              <rect x="3.5" y="5" width="2.4" height="6" rx="0.8" />
              <rect x="7" y="2.5" width="2.4" height="8.5" rx="0.8" />
              <rect x="10.5" y="0" width="2.4" height="11" rx="0.8" />
            </svg>
            {/* wifi */}
            <svg width="14" height="11" viewBox="0 0 14 11" fill="currentColor">
              <path d="M7 10.6 0.4 3.3a9.8 9.8 0 0 1 13.2 0Z" />
            </svg>
            {/* battery */}
            <svg width="9" height="14" viewBox="0 0 10 16" fill="currentColor">
              <path d="M3.2 0h3.6v1.4H8.6A1.4 1.4 0 0 1 10 2.8v11.8A1.4 1.4 0 0 1 8.6 16H1.4A1.4 1.4 0 0 1 0 14.6V2.8a1.4 1.4 0 0 1 1.4-1.4h1.8Z" />
            </svg>
          </div>
        </div>
        <div className="camera" aria-hidden="true" />
        <div className="app-area">{children}</div>
        <div className={`gesturebar ${dark ? 'gesturebar-dark' : ''}`} aria-hidden="true">
          <div className="gesturebar-pill" />
        </div>
      </div>
    </div>
  )
}

/** M3 top app bar: surface-coloured, with icon buttons that carry a state layer. */
export function AppBar({
  title,
  onBack,
  trailing,
}: {
  title: ReactNode
  onBack?: () => void
  trailing?: ReactNode
}) {
  return (
    <header className="appbar">
      {onBack && (
        <button className="appbar-icon state-layer" onClick={onBack} aria-label="Back">
          <BackIcon />
        </button>
      )}
      <span className="appbar-title">{title}</span>
      <span className="appbar-trailing">{trailing}</span>
    </header>
  )
}
