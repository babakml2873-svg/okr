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
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { toDateInputValue } from '@/lib/date'
import { toPersianDigits } from '@/lib/format/numbers'
import { calculateKeyResultProgress, METRIC_TYPE_HINTS, METRIC_TYPE_LABELS } from '@/lib/okr'
import { createKeyResultAction, updateKeyResultAction } from '@/server/actions/okr'

import { ProgressBar } from './progress-bar'

type MetricType = keyof typeof METRIC_TYPE_LABELS

export interface KeyResultFormValues {
  id?: string
  objectiveId: string
  title: string
  description: string
  metricType: MetricType
  startValue: string
  currentValue: string
  targetValue: string
  unit: string
  weight: string
  confidence: number
  ownerId: string
  dueDate: string
  autoUpdateFromInitiatives: boolean
}

const EMPTY: KeyResultFormValues = {
  objectiveId: '',
  title: '',
  description: '',
  metricType: 'INCREASE',
  startValue: '0',
  currentValue: '0',
  targetValue: '100',
  unit: '',
  weight: '1',
  confidence: 7,
  ownerId: '',
  dueDate: '',
  autoUpdateFromInitiatives: false,
}

export function KeyResultForm({
  open,
  onOpenChange,
  objectiveId,
  owners,
  initialValues,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  objectiveId: string
  owners: { id: string; name: string }[]
  initialValues?: Partial<KeyResultFormValues>
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({})

  const [values, setValues] = useState<KeyResultFormValues>({
    ...EMPTY,
    objectiveId,
    ownerId: owners[0]?.id ?? '',
    ...initialValues,
  })

  const isEdit = Boolean(initialValues?.id)
  const isBinary = values.metricType === 'BINARY'
  const isMilestone = values.metricType === 'MILESTONE'

  const set = <K extends keyof KeyResultFormValues>(key: K, value: KeyResultFormValues[K]) =>
    setValues((current) => ({ ...current, [key]: value }))

  /** Live preview of what the entered numbers mean, using the real engine. */
  const previewProgress = calculateKeyResultProgress({
    metricType: values.metricType,
    startValue: Number(values.startValue) || 0,
    currentValue: Number(values.currentValue) || 0,
    targetValue: Number(values.targetValue) || 0,
  })

  function changeMetricType(metricType: MetricType) {
    setValues((current) => ({
      ...current,
      metricType,
      // Give each type sensible defaults instead of carrying nonsense over.
      ...(metricType === 'BINARY'
        ? { startValue: '0', currentValue: '0', targetValue: '1', unit: '' }
        : {}),
      ...(metricType === 'MILESTONE' && current.metricType === 'BINARY'
        ? { startValue: '0', currentValue: '0', targetValue: '5', unit: 'مرحله' }
        : {}),
    }))
  }

  function submit(event: React.FormEvent) {
    event.preventDefault()
    setFieldErrors({})

    startTransition(async () => {
      const payload = {
        objectiveId: values.objectiveId,
        title: values.title,
        description: values.description,
        metricType: values.metricType,
        startValue: values.startValue,
        currentValue: values.currentValue,
        targetValue: values.targetValue,
        unit: values.unit,
        weight: values.weight,
        confidence: values.confidence,
        ownerId: values.ownerId,
        dueDate: values.dueDate || null,
        autoUpdateFromInitiatives: values.autoUpdateFromInitiatives,
      }

      const result = isEdit
        ? await updateKeyResultAction({ ...payload, id: initialValues!.id })
        : await createKeyResultAction(payload)

      if (result.ok) {
        toast.success(isEdit ? 'نتیجه کلیدی به‌روزرسانی شد' : 'نتیجه کلیدی اضافه شد')
        onOpenChange(false)
        router.refresh()
      } else {
        setFieldErrors(result.fieldErrors ?? {})
        toast.error(result.error)
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'ویرایش نتیجه کلیدی' : 'افزودن نتیجه کلیدی'}</DialogTitle>
          <DialogDescription>{METRIC_TYPE_HINTS[values.metricType]}</DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="space-y-4 overflow-y-auto">
          <div className="space-y-2">
            <Label htmlFor="kr-title">عنوان</Label>
            <Input
              id="kr-title"
              value={values.title}
              onChange={(event) => set('title', event.target.value)}
              placeholder="مثال: افزایش دامداری‌های فعال از ۲۰ به ۱۰۰"
              aria-invalid={Boolean(fieldErrors.title)}
              required
            />
            {fieldErrors.title && (
              <p className="text-destructive text-xs">{fieldErrors.title[0]}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="kr-description">توضیحات</Label>
            <Textarea
              id="kr-description"
              value={values.description}
              onChange={(event) => set('description', event.target.value)}
              rows={2}
              placeholder="تعریف دقیق متریک و منبع داده"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>نوع متریک</Label>
              <Select
                value={values.metricType}
                onValueChange={(value) => changeMetricType(value as MetricType)}
              >
                <SelectTrigger aria-label="نوع متریک">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(METRIC_TYPE_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>مالک</Label>
              <Select value={values.ownerId} onValueChange={(value) => set('ownerId', value)}>
                <SelectTrigger aria-label="مالک">
                  <SelectValue placeholder="انتخاب مالک" />
                </SelectTrigger>
                <SelectContent>
                  {owners.map((owner) => (
                    <SelectItem key={owner.id} value={owner.id}>
                      {owner.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {isBinary ? (
            <div className="bg-muted/50 space-y-2 rounded-lg p-3">
              <Label>وضعیت فعلی</Label>
              <Select
                value={values.currentValue === '1' ? '1' : '0'}
                onValueChange={(value) => set('currentValue', value)}
              >
                <SelectTrigger aria-label="وضعیت فعلی">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">انجام نشده</SelectItem>
                  <SelectItem value="1">انجام شد</SelectItem>
                </SelectContent>
              </Select>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-4">
              <div className="space-y-2">
                <Label htmlFor="kr-start">{isMilestone ? 'مرحله شروع' : 'مقدار شروع'}</Label>
                <Input
                  id="kr-start"
                  value={values.startValue}
                  onChange={(event) => set('startValue', event.target.value)}
                  inputMode="decimal"
                  dir="ltr"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="kr-current">{isMilestone ? 'مراحل انجام‌شده' : 'مقدار فعلی'}</Label>
                <Input
                  id="kr-current"
                  value={values.currentValue}
                  onChange={(event) => set('currentValue', event.target.value)}
                  inputMode="decimal"
                  dir="ltr"
                  disabled={values.autoUpdateFromInitiatives}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="kr-target">{isMilestone ? 'کل مراحل' : 'مقدار هدف'}</Label>
                <Input
                  id="kr-target"
                  value={values.targetValue}
                  onChange={(event) => set('targetValue', event.target.value)}
                  inputMode="decimal"
                  dir="ltr"
                  aria-invalid={Boolean(fieldErrors.targetValue)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="kr-unit">واحد</Label>
                <Input
                  id="kr-unit"
                  value={values.unit}
                  onChange={(event) => set('unit', event.target.value)}
                  placeholder="٪ / دامداری"
                />
              </div>
            </div>
          )}

          {fieldErrors.targetValue && (
            <p className="text-destructive text-xs">{fieldErrors.targetValue[0]}</p>
          )}

          <div className="bg-muted/50 space-y-2 rounded-lg p-3">
            <p className="text-muted-foreground text-xs">پیش‌نمایش پیشرفت با مقادیر واردشده</p>
            <ProgressBar progress={previewProgress} />
          </div>

          {isMilestone && (
            <label className="flex items-center justify-between gap-3 rounded-lg border p-3">
              <span>
                <span className="block text-sm font-medium">محاسبه خودکار از اقدامات</span>
                <span className="text-muted-foreground block text-xs">
                  مراحل انجام‌شده از تعداد اقدامات «انجام‌شده» محاسبه می‌شود
                </span>
              </span>
              <Switch
                checked={values.autoUpdateFromInitiatives}
                onCheckedChange={(checked) => set('autoUpdateFromInitiatives', checked)}
              />
            </label>
          )}

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="kr-weight">وزن در محاسبه هدف</Label>
              <Input
                id="kr-weight"
                value={values.weight}
                onChange={(event) => set('weight', event.target.value)}
                inputMode="decimal"
                dir="ltr"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="kr-due">مهلت</Label>
              <Input
                id="kr-due"
                type="date"
                value={values.dueDate}
                onChange={(event) => set('dueDate', event.target.value)}
                dir="ltr"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="kr-confidence">
                اطمینان: {toPersianDigits(values.confidence)} از ۱۰
              </Label>
              <input
                id="kr-confidence"
                type="range"
                min={1}
                max={10}
                value={values.confidence}
                onChange={(event) => set('confidence', Number(event.target.value))}
                className="accent-primary h-9 w-full"
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="size-4 animate-spin" />}
              {isEdit ? 'ذخیره تغییرات' : 'افزودن نتیجه کلیدی'}
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

/** Convert a persisted key result into form values. */
export function keyResultToFormValues(keyResult: {
  id: string
  objectiveId: string
  title: string
  description: string | null
  metricType: MetricType
  startValue: number
  currentValue: number
  targetValue: number
  unit: string | null
  weight: number
  confidence: number
  ownerId: string
  dueDate: Date | null
  autoUpdateFromInitiatives: boolean
}): Partial<KeyResultFormValues> {
  return {
    id: keyResult.id,
    objectiveId: keyResult.objectiveId,
    title: keyResult.title,
    description: keyResult.description ?? '',
    metricType: keyResult.metricType,
    startValue: String(keyResult.startValue),
    currentValue: String(keyResult.currentValue),
    targetValue: String(keyResult.targetValue),
    unit: keyResult.unit ?? '',
    weight: String(keyResult.weight),
    confidence: keyResult.confidence,
    ownerId: keyResult.ownerId,
    dueDate: toDateInputValue(keyResult.dueDate),
    autoUpdateFromInitiatives: keyResult.autoUpdateFromInitiatives,
  }
}
