import type { Metadata } from 'next'
import Link from 'next/link'

import { RegisterForm } from './register-form'

export const metadata: Metadata = { title: 'ثبت‌نام' }

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ invitation?: string }>
}) {
  const { invitation } = await searchParams

  return (
    <div>
      <h1 className="text-2xl font-bold">
        {invitation ? 'پذیرش دعوت‌نامه' : 'ساخت سازمان جدید'}
      </h1>
      <p className="text-muted-foreground mt-2 text-sm">
        {invitation
          ? 'برای پیوستن به سازمان، حساب کاربری خود را بسازید.'
          : 'حساب کاربری بسازید و سازمان خود را راه‌اندازی کنید — شما مدیر سامانه خواهید بود.'}
      </p>

      <RegisterForm invitationToken={invitation} />

      <p className="text-muted-foreground mt-6 text-center text-sm">
        قبلاً ثبت‌نام کرده‌اید؟{' '}
        <Link href="/login" className="text-primary font-medium hover:underline">
          ورود
        </Link>
      </p>
    </div>
  )
}
