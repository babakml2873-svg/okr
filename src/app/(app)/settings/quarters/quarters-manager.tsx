'use client'

import { Loader2, Plus } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { toast } from 'sonner'

import { Num } from '@/components/shared/num'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { currentJalaliYear, formatDate, JALALI_SEASON_NAMES, quarterLabel } from '@/lib/date'
import { QUARTER_STATUS_LABELS } from '@/lib/okr'
import { createQuarterAction } from '@/server/actions/workspace'

type QuarterStatus = 'UPCOMING' | 'ACTIVE' | 'CLOSED'

const STATUS_VARIANT: Record<QuarterStatus, 'success' | 'muted' | 'secondary'> = {
  ACTIVE: 'success',
  UPCOMING: 'secondary',
  CLOSED: 'muted',
}

interface Quarter {
  id: string
  year: number
  quarterNumber: number
  label: string
  startDate: Date
  endDate: Date
  status: QuarterStatus
  objectiveCount: number
}

export function QuartersManager({
  quarters,
  calendarType,
}: {
  quarters: Quarter[]
  calendarType: 'JALALI' | 'GREGORIAN'
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [open, setOpen] = useState(false)

  const defaultYear = calendarType === 'JALALI' ? currentJalaliYear() : new Date().getUTCFullYear()
  const [year, setYear] = useState(String(defaultYear))
  const [quarterNumber, setQuarterNumber] = useState('1')

  function submit(event: React.FormEvent) {
    event.preventDefault()
    startTransition(async () => {
      const result = await createQuarterAction({ year, quarterNumber })
      if (result.ok) {
        toast.success('کوارتر اضافه شد')
        setOpen(false)
        router.refresh()
      } else {
        toast.error(result.error)
      }
    })
  }

  const seasonLabels =
    calendarType === 'JALALI'
      ? JALALI_SEASON_NAMES.map((name, index) => ({ value: String(index + 1), label: name }))
      : [1, 2, 3, 4].map((n) => ({ value: String(n), label: `Q${n}` }))

  return (
    <>
      <Card>
        <CardHeader className="flex-row items-start justify-between">
          <div>
            <CardTitle>کوارترها</CardTitle>
            <CardDescription>
              {calendarType === 'JALALI'
                ? 'کوارترها بر اساس فصول شمسی محاسبه می‌شوند: بهار، تابستان، پاییز و زمستان.'
                : 'کوارترها بر اساس تقویم میلادی محاسبه می‌شوند.'}
            </CardDescription>
          </div>
          <Button onClick={() => setOpen(true)}>
            <Plus className="size-4" />
            کوارتر جدید
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>کوارتر</TableHead>
                <TableHead>شروع</TableHead>
                <TableHead>پایان</TableHead>
                <TableHead>وضعیت</TableHead>
                <TableHead>اهداف</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {quarters.map((quarter) => (
                <TableRow key={quarter.id}>
                  <TableCell className="font-medium">{quarter.label}</TableCell>
                  <TableCell className="text-sm">
                    {formatDate(quarter.startDate, calendarType, 'short')}
                  </TableCell>
                  <TableCell className="text-sm">
                    {formatDate(quarter.endDate, calendarType, 'short')}
                  </TableCell>
                  <TableCell>
                    <Badge variant={STATUS_VARIANT[quarter.status]}>
                      {QUARTER_STATUS_LABELS[quarter.status]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Num value={quarter.objectiveCount} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>افزودن کوارتر</DialogTitle>
            <DialogDescription>
              تاریخ شروع و پایان به‌صورت خودکار از تقویم سازمان محاسبه می‌شود:{' '}
              {quarterLabel(Number(year) || defaultYear, Number(quarterNumber), calendarType)}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={submit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="quarter-year">سال</Label>
                <Input
                  id="quarter-year"
                  value={year}
                  onChange={(event) => setYear(event.target.value)}
                  inputMode="numeric"
                  dir="ltr"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>فصل</Label>
                <Select value={quarterNumber} onValueChange={setQuarterNumber}>
                  <SelectTrigger aria-label="فصل">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {seasonLabels.map((season) => (
                      <SelectItem key={season.value} value={season.value}>
                        {season.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter>
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="size-4 animate-spin" />}
                افزودن کوارتر
              </Button>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                انصراف
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
