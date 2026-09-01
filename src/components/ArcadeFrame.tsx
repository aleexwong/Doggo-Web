import { ReactNode } from 'react'

/**
 * A CRT arcade monitor: cabinet bezel, a tube with the bowed corners of real
 * glass, and an overlay that carries the things a photograph of one shows —
 * the specular bulge highlight, scanlines, the aperture grille, the vignette
 * where the glass thickens at the edge, and a slow roll bar.
 */
export function ArcadeFrame({ children }: { children: ReactNode }) {
  return (
    <div className="crt">
      <div className="crt-bezel">
        <div className="crt-tube">
          <div className="crt-screen">
            <div className="app-area">{children}</div>
          </div>
          <span className="crt-glass" aria-hidden="true" />
        </div>
        <span className="crt-led" aria-hidden="true" />
      </div>
    </div>
  )
}
