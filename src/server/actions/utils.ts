import { ZodError } from 'zod'

import { PermissionError } from '@/lib/auth/permissions'
import { NotFoundError, ValidationError } from '@/server/context'

/** Uniform shape returned by every server action. */
export type ActionResult<T = void> =
  { ok: true; data: T } | { ok: false; error: string; fieldErrors?: Record<string, string[]> }

/**
 * Run a service call and translate its exceptions into a serialisable result.
 *
 * Keeps every action's error handling identical, and makes sure a permission
 * failure surfaces as a readable Persian message rather than a stack trace.
 */
export async function runAction<T>(fn: () => Promise<T>): Promise<ActionResult<T>> {
  try {
    return { ok: true, data: await fn() }
  } catch (error) {
    if (error instanceof ZodError) {
      const flattened = error.flatten()
      return {
        ok: false,
        error: 'اطلاعات واردشده معتبر نیست.',
        fieldErrors: flattened.fieldErrors as Record<string, string[]>,
      }
    }
    if (error instanceof ValidationError) {
      return { ok: false, error: error.message, fieldErrors: error.fieldErrors }
    }
    if (error instanceof PermissionError) {
      return { ok: false, error: error.message }
    }
    if (error instanceof NotFoundError) {
      return { ok: false, error: error.message }
    }
    console.error('[action] unexpected error', error)
    return { ok: false, error: 'خطای غیرمنتظره‌ای رخ داد. لطفاً دوباره تلاش کنید.' }
  }
}

/** Turn a FormData into a plain object, dropping empty strings for optionals. */
export function formToObject(formData: FormData): Record<string, unknown> {
  const result: Record<string, unknown> = {}
  for (const [key, value] of formData.entries()) {
    if (value instanceof File) continue
    result[key] = value
  }
  return result
}
