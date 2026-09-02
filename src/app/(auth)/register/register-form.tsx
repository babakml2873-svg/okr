'use client'

import { Loader2 } from 'lucide-react'
import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { registerAction, type ActionState } from '@/server/actions/auth'

function SubmitButton({ invited }: { invited: boolean }) {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending && <Loader2 className="size-4 animate-spin" />}
      {pending ? 'در حال ساخت حساب…' : invited ? 'پیوستن به سازمان' : 'ساخت حساب و سازمان'}
    </Button>
  )
}

function Field({
  id,
  label,
  errors,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & {
  id: string
  label: string
  errors?: string[]
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} name={id} aria-invalid={Boolean(errors)} {...props} />
      {errors && <p className="text-destructive text-xs">{errors[0]}</p>}
    </div>
  )
}

export function RegisterForm({ invitationToken }: { invitationToken?: string }) {
  const [state, formAction] = useActionState<ActionState, FormData>(registerAction, {})

  return (
    <form action={formAction} className="mt-8 space-y-4" noValidate>
      {invitationToken && <input type="hidden" name="invitationToken" value={invitationToken} />}

      {state.error && (
        <div
          role="alert"
          className="border-destructive/30 bg-destructive/10 text-destructive rounded-md border px-3 py-2 text-sm"
        >
          {state.error}
        </div>
      )}

      <Field
        id="name"
        label="نام و نام خانوادگی"
        placeholder="بابک محمدی"
        required
        errors={state.fieldErrors?.name}
      />

      {!invitationToken && (
        <Field
          id="organizationName"
          label="نام سازمان"
          placeholder="نیوماو"
          required
          errors={state.fieldErrors?.organizationName}
        />
      )}

      <Field
        id="email"
        label="ایمیل"
        type="email"
        dir="ltr"
        autoComplete="email"
        placeholder="you@example.com"
        required
        errors={state.fieldErrors?.email}
      />

      <Field
        id="password"
        label="رمز عبور"
        type="password"
        dir="ltr"
        autoComplete="new-password"
        placeholder="حداقل ۸ کاراکتر"
        required
        errors={state.fieldErrors?.password}
      />

      <Field
        id="confirmPassword"
        label="تکرار رمز عبور"
        type="password"
        dir="ltr"
        autoComplete="new-password"
        required
        errors={state.fieldErrors?.confirmPassword}
      />

      <SubmitButton invited={Boolean(invitationToken)} />
    </form>
  )
}
