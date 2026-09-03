import { ReactNode } from 'react'

/**
 * The frameless presentation: the same screens, filling the browser instead
 * of a drawn phone. No status bar, gesture bar or bezel — the browser
 * already provides that chrome.
 */
export function WebFrame({ children }: { children: ReactNode }) {
  return (
    <div className="web-frame">
      <div className="app-area">{children}</div>
    </div>
  )
}
