import type { Page } from '@playwright/test'
import { expect } from '@playwright/test'

/** Demo accounts created by `npm run db:seed`. */
export const ACCOUNTS = {
  admin: { email: 'admin@newmaaw.com', name: 'بابک محمدی' },
  manager: { email: 'narges@newmaaw.com', name: 'نرگس احمدی' },
  member: { email: 'elham@newmaaw.com', name: 'الهام موسوی' },
} as const

export const PASSWORD = 'okr12345'

export async function signIn(page: Page, account: keyof typeof ACCOUNTS = 'admin') {
  await page.goto('/login')
  await page.fill('#email', ACCOUNTS[account].email)
  await page.fill('#password', PASSWORD)
  await page.click('button[type=submit]')
  await page.waitForURL('**/dashboard')
  await expect(page.getByRole('heading', { level: 1 })).toContainText('داشبورد')
}

/** Persian digits back to ASCII, so assertions can compare numbers. */
export function toLatin(value: string): string {
  return value.replace(/[۰-۹]/g, (char) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(char)))
}

/** Read a percentage rendered in Persian digits, e.g. «۶۰٪» → 60. */
export function parsePercent(text: string): number {
  return Number(toLatin(text).replace(/[^\d.]/g, ''))
}
