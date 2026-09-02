'use client'

import { useEffect } from 'react'

import { ErrorState } from '@/components/shared/states'

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[app] render error', error)
  }, [error])

  return (
    <ErrorState
      title="مشکلی در نمایش این صفحه پیش آمد"
      description="اطلاعات این بخش بارگذاری نشد. می‌توانید دوباره تلاش کنید یا به داشبورد برگردید."
      onRetry={reset}
    />
  )
}
