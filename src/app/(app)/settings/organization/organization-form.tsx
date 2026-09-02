'use client'

import { Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { updateOrganizationAction } from '@/server/actions/workspace'

export function OrganizationForm({
  initialName,
  initialCalendarType,
  slug,
}: {
  initialName: string
  initialCalendarType: 'JALALI' | 'GREGORIAN'
  slug: string
}) {
  const router = useRouter()
  const [name, setName] = useState(initialName)
  const [calendarType, setCalendarType] = useState(initialCalendarType)
  const [isPending, startTransition] = useTransition()

  function submit(event: React.FormEvent) {
    event.preventDefault()
    startTransition(async () => {
      const result = await updateOrganizationAction({ name, calendarType })
      if (result.ok) {
        toast.success('تنظیمات سازمان ذخیره شد')
        router.refresh()
      } else {
        toast.error(result.error)
      }
    })
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="org-name">نام سازمان</Label>
          <Input
            id="org-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="org-slug">شناسه</Label>
          <Input id="org-slug" value={slug} dir="ltr" disabled />
        </div>
      </div>

      <div className="space-y-2">
        <Label>نوع تقویم</Label>
        <Select
          value={calendarType}
          onValueChange={(value) => setCalendarType(value as 'JALALI' | 'GREGORIAN')}
        >
          <SelectTrigger className="sm:w-64" aria-label="نوع تقویم">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="JALALI">شمسی — کوارترها بر اساس فصول (بهار، تابستان…)</SelectItem>
            <SelectItem value="GREGORIAN">میلادی — کوارترهای Q۱ تا Q۴</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-muted-foreground text-xs">
          تغییر تقویم روی کوارترهای موجود اثری ندارد؛ فقط کوارترهای جدید با تقویم انتخابی ساخته
          می‌شوند.
        </p>
      </div>

      <Button type="submit" disabled={isPending}>
        {isPending && <Loader2 className="size-4 animate-spin" />}
        ذخیره تغییرات
      </Button>
    </form>
  )
}
