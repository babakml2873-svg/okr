import type { Metadata, Viewport } from 'next'
import { Toaster } from 'sonner'

import { ThemeProvider } from '@/components/theme-provider'
import { vazirmatn } from '@/lib/fonts'

import './globals.css'

export const metadata: Metadata = {
  title: {
    default: 'سامانه مدیریت OKR',
    template: '%s | سامانه مدیریت OKR',
  },
  description:
    'پلتفرم مدیریت اهداف و نتایج کلیدی — تعریف، ردیابی، بازبینی و تحلیل اهداف استراتژیک سازمان',
  icons: { icon: '/favicon.svg' },
  robots: { index: false, follow: false },
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#101318' },
  ],
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fa" dir="rtl" suppressHydrationWarning className={vazirmatn.variable}>
      <body className="bg-background text-foreground font-sans antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster position="bottom-left" dir="rtl" richColors closeButton />
        </ThemeProvider>
      </body>
    </html>
  )
}
