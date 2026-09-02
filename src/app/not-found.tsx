import Link from 'next/link'
import { FileQuestion } from 'lucide-react'

import { Button } from '@/components/ui/button'

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 px-6 text-center">
      <span className="bg-muted text-muted-foreground flex size-14 items-center justify-center rounded-full">
        <FileQuestion className="size-7" />
      </span>
      <h1 className="text-2xl font-bold">صفحه موردنظر یافت نشد</h1>
      <p className="text-muted-foreground max-w-sm text-sm leading-relaxed">
        ممکن است این مورد حذف شده باشد یا شما به آن دسترسی نداشته باشید.
      </p>
      <Button asChild>
        <Link href="/dashboard">بازگشت به داشبورد</Link>
      </Button>
    </div>
  )
}
