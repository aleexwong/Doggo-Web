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
      {/* Hardware: earpiece slit in the top bezel, power and volume on the
          right rail — where they sit on a current Android phone. */}
      <span className="phone-speaker" aria-hidden="true" />
      <span className="phone-btn power" aria-hidden="true" />
      <span className="phone-btn volume" aria-hidden="true" />
      <div className="phone-screen">
        <div className={`statusbar ${dark ? 'statusbar-dark' : ''}`}>
          <Clock />
          <div className="statusbar-icons" aria-hidden="true">
            {/* mobile signal */}
            <svg width="13" height="11" viewBox="0 0 13 11" fill="currentColor">
              <rect x="0" y="7.6" width="2.3" height="3.4" rx="0.9" />
              <rect x="3.6" y="5.1" width="2.3" height="5.9" rx="0.9" />
              <rect x="7.2" y="2.6" width="2.3" height="8.4" rx="0.9" />
              <rect x="10.7" y="0" width="2.3" height="11" rx="0.9" />
            </svg>
            {/* wifi */}
            <svg width="13" height="11" viewBox="0 0 13 11" fill="currentColor">
              <path d="M6.5 10.4 0.35 3.3a9.4 9.4 0 0 1 12.3 0Z" />
            </svg>
            {/* battery, drawn as an outline with a fill level and a cap */}
            <svg width="9" height="14" viewBox="0 0 22 28" fill="none">
              <rect x="6.5" y="0" width="9" height="3.4" rx="1.7" fill="currentColor" />
              <rect
                x="1.1"
                y="2.6"
                width="19.8"
                height="24.4"
                rx="4.4"
                stroke="currentColor"
                strokeWidth="2.2"
              />
              <rect x="4.4" y="9.6" width="13.2" height="14.1" rx="2.2" fill="currentColor" />
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
