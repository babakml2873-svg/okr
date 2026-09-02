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
import type { ObjectiveLevel } from '@/lib/auth/permissions'
import { OBJECTIVE_LEVEL_LABELS, ROLLUP_MODE_LABELS } from '@/lib/okr'
import { toPersianDigits } from '@/lib/format/numbers'
import { createObjectiveAction, updateObjectiveAction } from '@/server/actions/okr'

export interface ObjectiveFormOptions {
  levels: ObjectiveLevel[]
  owners: { id: string; name: string }[]
  departments: { id: string; name: string }[]
  teams: { id: string; name: string; departmentId: string }[]
  quarters: { id: string; label: string }[]
  parents: { id: string; title: string; level: string }[]
}

export interface ObjectiveFormValues {
  id?: string
  title: string
  description: string
  level: ObjectiveLevel
  ownerId: string
  departmentId: string
  teamId: string
  quarterId: string
  parentId: string
  confidence: number
  rollupMode: 'KEY_RESULTS_ONLY' | 'KEY_RESULTS_AND_CHILDREN'
}

/** Create/edit dialog for an objective. Shared by every page that offers it. */
export function ObjectiveForm({
  open,
  onOpenChange,
  options,
  initialValues,
  trigger,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  options: ObjectiveFormOptions
  initialValues?: Partial<ObjectiveFormValues>
  trigger?: React.ReactNode
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({})

  const [values, setValues] = useState<ObjectiveFormValues>({
    title: '',
    description: '',
    level: options.levels[0] ?? 'INDIVIDUAL',
    ownerId: options.owners[0]?.id ?? '',
    departmentId: '',
    teamId: '',
    quarterId: options.quarters[0]?.id ?? '',
    parentId: '',
    confidence: 7,
    rollupMode: 'KEY_RESULTS_ONLY',
    ...initialValues,
  })

  const isEdit = Boolean(initialValues?.id)
  const set = <K extends keyof ObjectiveFormValues>(key: K, value: ObjectiveFormValues[K]) =>
    setValues((current) => ({ ...current, [key]: value }))

  // Teams only make sense within the chosen department.
  const availableTeams = values.departmentId
    ? options.teams.filter((team) => team.departmentId === values.departmentId)
    : options.teams

  function submit(event: React.FormEvent) {
    event.preventDefault()
    setFieldErrors({})

    startTransition(async () => {
      const payload = {
        ...values,
        description: values.description || '',
        departmentId: values.departmentId || null,
        teamId: values.teamId || null,
        parentId: values.parentId || null,
      }

      const result = isEdit
        ? await updateObjectiveAction({ ...payload, id: initialValues!.id })
        : await createObjectiveAction(payload)

      if (result.ok) {
        toast.success(isEdit ? 'هدف به‌روزرسانی شد' : 'هدف جدید ایجاد شد')
        onOpenChange(false)
        router.refresh()
      } else {
        setFieldErrors(result.fieldErrors ?? {})
        toast.error(result.error)
      }
    })
  }

  return (
    <>
      {trigger}
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{isEdit ? 'ویرایش هدف' : 'ایجاد هدف جدید'}</DialogTitle>
            <DialogDescription>
              هدف باید کیفی، الهام‌بخش و قابل سنجش از طریق نتایج کلیدی باشد.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={submit} className="space-y-4 overflow-y-auto">
            <div className="space-y-2">
              <Label htmlFor="objective-title">عنوان هدف</Label>
              <Input
                id="objective-title"
                value={values.title}
                onChange={(event) => set('title', event.target.value)}
                placeholder="مثال: تبدیل شدن به پیشروترین پلتفرم مدیریت گاوداری شیری"
                aria-invalid={Boolean(fieldErrors.title)}
                required
              />
              {fieldErrors.title && (
                <p className="text-destructive text-xs">{fieldErrors.title[0]}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="objective-description">توضیحات</Label>
              <Textarea
                id="objective-description"
                value={values.description}
                onChange={(event) => set('description', event.target.value)}
                placeholder="زمینه، دلیل اهمیت و محدوده این هدف را توضیح دهید"
                rows={3}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>سطح</Label>
                <Select
                  value={values.level}
                  onValueChange={(value) => set('level', value as ObjectiveLevel)}
                >
                  <SelectTrigger aria-label="سطح">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {options.levels.map((level) => (
                      <SelectItem key={level} value={level}>
                        {OBJECTIVE_LEVEL_LABELS[level]}
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
                    {options.owners.map((owner) => (
                      <SelectItem key={owner.id} value={owner.id}>
                        {owner.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {fieldErrors.ownerId && (
                  <p className="text-destructive text-xs">{fieldErrors.ownerId[0]}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label>کوارتر</Label>
                <Select value={values.quarterId} onValueChange={(value) => set('quarterId', value)}>
                  <SelectTrigger aria-label="کوارتر">
                    <SelectValue placeholder="انتخاب کوارتر" />
                  </SelectTrigger>
                  <SelectContent>
                    {options.quarters.map((quarter) => (
                      <SelectItem key={quarter.id} value={quarter.id}>
                        {quarter.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>دپارتمان</Label>
                <Select
                  value={values.departmentId || 'none'}
                  onValueChange={(value) => {
                    set('departmentId', value === 'none' ? '' : value)
                    set('teamId', '')
                  }}
                >
                  <SelectTrigger aria-label="دپارتمان">
                    <SelectValue placeholder="بدون دپارتمان" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">بدون دپارتمان</SelectItem>
                    {options.departments.map((department) => (
                      <SelectItem key={department.id} value={department.id}>
                        {department.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>تیم</Label>
                <Select
                  value={values.teamId || 'none'}
                  onValueChange={(value) => set('teamId', value === 'none' ? '' : value)}
                >
                  <SelectTrigger aria-label="تیم">
                    <SelectValue placeholder="بدون تیم" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">بدون تیم</SelectItem>
                    {availableTeams.map((team) => (
                      <SelectItem key={team.id} value={team.id}>
                        {team.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>هم‌راستا با هدف</Label>
                <Select
                  value={values.parentId || 'none'}
                  onValueChange={(value) => set('parentId', value === 'none' ? '' : value)}
                >
                  <SelectTrigger aria-label="هم‌راستا با هدف">
                    <SelectValue placeholder="بدون والد" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">بدون والد</SelectItem>
                    {options.parents
                      .filter((parent) => parent.id !== initialValues?.id)
                      .map((parent) => (
                        <SelectItem key={parent.id} value={parent.id}>
                          {parent.title}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                {fieldErrors.parentId && (
                  <p className="text-destructive text-xs">{fieldErrors.parentId[0]}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="objective-confidence">
                  امتیاز اطمینان: {toPersianDigits(values.confidence)} از ۱۰
                </Label>
                <input
                  id="objective-confidence"
                  type="range"
                  min={1}
                  max={10}
                  value={values.confidence}
                  onChange={(event) => set('confidence', Number(event.target.value))}
                  className="accent-primary h-9 w-full"
                />
              </div>

              <div className="space-y-2">
                <Label>روش محاسبه پیشرفت</Label>
                <Select
                  value={values.rollupMode}
                  onValueChange={(value) =>
                    set('rollupMode', value as ObjectiveFormValues['rollupMode'])
                  }
                >
                  <SelectTrigger aria-label="روش محاسبه پیشرفت">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(ROLLUP_MODE_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter>
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="size-4 animate-spin" />}
                {isEdit ? 'ذخیره تغییرات' : 'ایجاد هدف'}
              </Button>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                انصراف
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
