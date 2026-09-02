'use client'

import { Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { changePasswordAction, updateProfileAction } from '@/server/actions/workspace'

export function ProfileForm({
  initialName,
  initialJobTitle,
  email,
}: {
  initialName: string
  initialJobTitle: string
  email: string
}) {
  const router = useRouter()
  const [name, setName] = useState(initialName)
  const [jobTitle, setJobTitle] = useState(initialJobTitle)
  const [isPending, startTransition] = useTransition()
  const [errors, setErrors] = useState<Record<string, string[]>>({})

  function submit(event: React.FormEvent) {
    event.preventDefault()
    setErrors({})
    startTransition(async () => {
      const result = await updateProfileAction({ name, jobTitle })
      if (result.ok) {
        toast.success('پروفایل به‌روزرسانی شد')
        router.refresh()
      } else {
        setErrors(result.fieldErrors ?? {})
        toast.error(result.error)
      }
    })
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="profile-name">نام و نام خانوادگی</Label>
          <Input
            id="profile-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            aria-invalid={Boolean(errors.name)}
            required
          />
          {errors.name && <p className="text-destructive text-xs">{errors.name[0]}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="profile-title">عنوان شغلی</Label>
          <Input
            id="profile-title"
            value={jobTitle}
            onChange={(event) => setJobTitle(event.target.value)}
            placeholder="مثال: مدیر محصول"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="profile-email">ایمیل</Label>
        <Input id="profile-email" value={email} dir="ltr" disabled />
        <p className="text-muted-foreground text-xs">ایمیل شناسه ورود شماست و قابل تغییر نیست.</p>
      </div>

      <Button type="submit" disabled={isPending}>
        {isPending && <Loader2 className="size-4 animate-spin" />}
        ذخیره تغییرات
      </Button>
    </form>
  )
}

export function ChangePasswordForm() {
  const [values, setValues] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [isPending, startTransition] = useTransition()
  const [errors, setErrors] = useState<Record<string, string[]>>({})

  function submit(event: React.FormEvent) {
    event.preventDefault()
    setErrors({})
    startTransition(async () => {
      const result = await changePasswordAction(values)
      if (result.ok) {
        toast.success('رمز عبور تغییر کرد')
        setValues({ currentPassword: '', newPassword: '', confirmPassword: '' })
      } else {
        setErrors(result.fieldErrors ?? {})
        toast.error(result.error)
      }
    })
  }

  const set = (key: keyof typeof values) => (event: React.ChangeEvent<HTMLInputElement>) =>
    setValues((current) => ({ ...current, [key]: event.target.value }))

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="current-password">رمز عبور فعلی</Label>
          <Input
            id="current-password"
            type="password"
            dir="ltr"
            value={values.currentPassword}
            onChange={set('currentPassword')}
            aria-invalid={Boolean(errors.currentPassword)}
            required
          />
          {errors.currentPassword && (
            <p className="text-destructive text-xs">{errors.currentPassword[0]}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="new-password">رمز عبور جدید</Label>
          <Input
            id="new-password"
            type="password"
            dir="ltr"
            value={values.newPassword}
            onChange={set('newPassword')}
            aria-invalid={Boolean(errors.newPassword)}
            required
          />
          {errors.newPassword && (
            <p className="text-destructive text-xs">{errors.newPassword[0]}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirm-password">تکرار رمز جدید</Label>
          <Input
            id="confirm-password"
            type="password"
            dir="ltr"
            value={values.confirmPassword}
            onChange={set('confirmPassword')}
            aria-invalid={Boolean(errors.confirmPassword)}
            required
          />
          {errors.confirmPassword && (
            <p className="text-destructive text-xs">{errors.confirmPassword[0]}</p>
          )}
        </div>
      </div>

      <Button type="submit" disabled={isPending}>
        {isPending && <Loader2 className="size-4 animate-spin" />}
        تغییر رمز عبور
      </Button>
    </form>
  )
}
