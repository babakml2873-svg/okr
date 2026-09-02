import type { Metadata } from 'next'
import Link from 'next/link'

import { LoginForm } from './login-form'

export const metadata: Metadata = { title: 'ورود' }

export default function LoginPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold">ورود به حساب</h1>
      <p className="text-muted-foreground mt-2 text-sm">
        برای دسترسی به اهداف و نتایج کلیدی سازمان وارد شوید.
      </p>

      <LoginForm />

      <p className="text-muted-foreground mt-6 text-center text-sm">
        حساب کاربری ندارید؟{' '}
        <Link href="/register" className="text-primary font-medium hover:underline">
          ساخت سازمان جدید
        </Link>
      </p>
    </div>
  )
}
