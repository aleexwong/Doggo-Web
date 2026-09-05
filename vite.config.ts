import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import { appearanceConfig } from './src/game/appearance'

const TOKEN = '__DOGGO_APPEARANCE__'

/**
 * The script in index.html has to choose a theme before first paint, which
 * means before any module can load — so it cannot import the theme key, the
 * surface colours, or which frames want a dark picture. Rather than write
 * them out a second time, inject them here from src/game/appearance.ts.
 */
function appearanceConstants(): Plugin {
  return {
    name: 'doggo-appearance-constants',
    transformIndexHtml(html) {
      return html.replace(new RegExp(TOKEN, 'g'), JSON.stringify(appearanceConfig()))
    },
  }
}

export default defineConfig({
  plugins: [react(), appearanceConstants()],
})
