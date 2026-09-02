import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Target } from 'lucide-react'

import { getSessionContext } from '@/server/context'

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  // Already signed in? There is nothing to do on these pages.
  if (await getSessionContext()) redirect('/dashboard')

  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      <div className="flex flex-col justify-center px-6 py-12 sm:px-12">
        <div className="mx-auto w-full max-w-sm">
          <Link href="/" className="mb-10 flex items-center gap-2.5">
            <span className="bg-primary text-primary-foreground flex size-9 items-center justify-center rounded-lg">
              <Target className="size-5" />
            </span>
            <span className="text-lg font-semibold">سامانه مدیریت OKR</span>
          </Link>
          {children}
        </div>
      </div>

      <div className="bg-primary relative hidden overflow-hidden lg:block">
        <div className="absolute inset-0 opacity-20 [background-image:radial-gradient(circle_at_1px_1px,white_1px,transparent_0)] [background-size:28px_28px]" />
        <div className="text-primary-foreground relative flex h-full flex-col justify-center px-14">
          <h2 className="text-3xl leading-relaxed font-bold">
            اهداف سازمان را از استراتژی تا اجرا هم‌راستا کنید
          </h2>
          <p className="mt-6 max-w-md text-base leading-loose opacity-90">
            اهداف را در چهار سطح شرکت، دپارتمان، تیم و فرد تعریف کنید، پیشرفت را به‌صورت خودکار
            محاسبه کنید، بازبینی‌های هفتگی ثبت کنید و ریسک‌ها را پیش از تبدیل‌شدن به بحران ببینید.
          </p>
          <ul className="mt-10 space-y-4 text-sm opacity-90">
            {[
              'محاسبه خودکار پیشرفت برای چهار نوع متریک',
              'درخت هم‌راستایی از هدف شرکت تا هدف فردی',
              'بازبینی هفتگی با ثبت بلاکر و اقدام بعدی',
              'داشبورد اجرایی و گزارش‌های قابل خروجی',
            ].map((item) => (
              <li key={item} className="flex items-center gap-3">
                <span className="bg-primary-foreground/70 size-1.5 shrink-0 rounded-full" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}
