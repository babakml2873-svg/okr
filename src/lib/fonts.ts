import localFont from 'next/font/local'

/**
 * Vazirmatn variable font, vendored into the repo so that Docker/CI builds
 * never depend on reaching a font CDN at build time.
 */
export const vazirmatn = localFont({
  src: '../assets/fonts/Vazirmatn.woff2',
  variable: '--font-vazirmatn',
  display: 'swap',
  weight: '100 900',
  fallback: ['system-ui', 'sans-serif'],
})
