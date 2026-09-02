'use client'

import { Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
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
import { Textarea } from '@/components/ui/textarea'
import { formatMetricValue, toPersianDigits } from '@/lib/format/numbers'
import { CHECK_IN_CADENCE_LABELS, calculateKeyResultProgress } from '@/lib/okr'
import { createCheckInAction } from '@/server/actions/okr'

import { ProgressBar } from './progress-bar'

export interface CheckInTarget {
  id: string
  title: string
  metricType: 'INCREASE' | 'DECREASE' | 'BINARY' | 'MILESTONE'
  startValue: number
  currentValue: number
  targetValue: number
  unit: string | null
  progress: number
  confidence: number
}

/**
 * The weekly check-in: move the metric, restate confidence, name the blocker
 * and the next action. Shows live what the new value does to progress.
 */
export function CheckInDialog({
  open,
  onOpenChange,
  keyResult,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  keyResult: CheckInTarget
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const [newValue, setNewValue] = useState(String(keyResult.currentValue))
  const [confidence, setConfidence] = useState(keyResult.confidence)
  const [cadence, setCadence] = useState<'WEEKLY' | 'MONTHLY' | 'ADHOC'>('WEEKLY')
  const [note, setNote] = useState('')
  const [blockers, setBlockers] = useState('')
  const [nextActions, setNextActions] = useState('')

  const isBinary = keyResult.metricType === 'BINARY'
  const projectedProgress = calculateKeyResultProgress({
    metricType: keyResult.metricType,
    startValue: keyResult.startValue,
    currentValue: Number(newValue) || 0,
    targetValue: keyResult.targetValue,
  })
  const delta = Math.round((projectedProgress - keyResult.progress) * 10) / 10

  function submit(event: React.FormEvent) {
    event.preventDefault()

    startTransition(async () => {
      const result = await createCheckInAction({
        keyResultId: keyResult.id,
        newValue,
        confidence,
        cadence,
        note,
        blockers,
        nextActions,
      })

      if (result.ok) {
        toast.success('بازبینی ثبت شد و پیشرفت به‌روزرسانی گردید')
        onOpenChange(false)
        setNote('')
        setBlockers('')
        setNextActions('')
        router.refresh()
      } else {
        toast.error(result.error)
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>ثبت بازبینی</DialogTitle>
          <DialogDescription>{keyResult.title}</DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="space-y-4 overflow-y-auto">
          <div className="bg-muted/50 rounded-lg p-3">
            <div className="text-muted-foreground mb-2 flex items-center justify-between text-xs">
              <span>
                مقدار فعلی: {formatMetricValue(keyResult.currentValue, keyResult.unit)} · هدف:{' '}
                {formatMetricValue(keyResult.targetValue, keyResult.unit)}
              </span>
              {delta !== 0 && (
                <span className={delta > 0 ? 'text-success' : 'text-danger'}>
                  {delta > 0 ? '+' : '−'}
                  {toPersianDigits(Math.abs(delta))}٪
                </span>
              )}
            </div>
            <ProgressBar progress={projectedProgress} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="checkin-value">مقدار جدید</Label>
            {isBinary ? (
              <Select value={newValue === '1' ? '1' : '0'} onValueChange={setNewValue}>
                <SelectTrigger id="checkin-value">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">انجام نشده</SelectItem>
                  <SelectItem value="1">انجام شد</SelectItem>
                </SelectContent>
              </Select>
            ) : (
              <Input
                id="checkin-value"
                value={newValue}
                onChange={(event) => setNewValue(event.target.value)}
                inputMode="decimal"
                dir="ltr"
                required
              />
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="checkin-confidence">
                اطمینان: {toPersianDigits(confidence)} از ۱۰
              </Label>
              <input
                id="checkin-confidence"
                type="range"
                min={1}
                max={10}
                value={confidence}
                onChange={(event) => setConfidence(Number(event.target.value))}
                className="accent-primary h-9 w-full"
              />
            </div>
            <div className="space-y-2">
              <Label>دوره بازبینی</Label>
              <Select
                value={cadence}
                onValueChange={(value) => setCadence(value as typeof cadence)}
              >
                <SelectTrigger aria-label="دوره بازبینی">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(CHECK_IN_CADENCE_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="checkin-note">توضیح پیشرفت</Label>
            <Textarea
              id="checkin-note"
              value={note}
              onChange={(event) => setNote(event.target.value)}
              rows={2}
              placeholder="این هفته چه اتفاقی افتاد؟"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="checkin-blockers">بلاکرها</Label>
            <Textarea
              id="checkin-blockers"
              value={blockers}
              onChange={(event) => setBlockers(event.target.value)}
              rows={2}
              placeholder="مثال: تأخیر در قیف فروش"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="checkin-next">اقدام بعدی</Label>
            <Textarea
              id="checkin-next"
              value={nextActions}
              onChange={(event) => setNextActions(event.target.value)}
              rows={2}
              placeholder="مثال: تماس با ۲۰ سرنخ"
            />
          </div>

          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="size-4 animate-spin" />}
              ثبت بازبینی
            </Button>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              انصراف
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
