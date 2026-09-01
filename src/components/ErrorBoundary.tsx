import { Component, ReactNode } from 'react'
import { PawMark } from './Logo'

/** Last-resort catch so a render crash never leaves a blank page. */
export class ErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  render() {
    if (!this.state.failed) return this.props.children
    return (
      <div className="page">
        <div className="crash" role="alert">
          <PawMark size={48} />
          <p className="crash-title">Doggo stopped working.</p>
          <button className="btn-filled" onClick={() => location.reload()}>
            Reload
          </button>
        </div>
      </div>
    )
  }
}
