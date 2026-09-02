'use client'

import { Printer, X } from 'lucide-react'

import { Button } from '@/components/ui/button'

/** On-screen toolbar for the print view; hidden in the printed output. */
export function PrintTrigger() {
  return (
    <div className="no-print mb-6 flex items-center justify-between gap-3 rounded-lg border p-3">
      <p className="text-muted-foreground text-sm">
        برای گرفتن خروجی PDF، دکمه چاپ را بزنید و در پنجره چاپ گزینه «ذخیره به‌صورت PDF» را انتخاب
        کنید.
      </p>
      <div className="flex gap-2">
        <Button onClick={() => window.print()}>
          <Printer className="size-4" />
          چاپ
        </Button>
        <Button variant="ghost" size="icon" onClick={() => window.close()} aria-label="بستن">
          <X className="size-4" />
        </Button>
      </div>
    </div>
  )
}
