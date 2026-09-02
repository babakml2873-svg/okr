import { expect, test } from '@playwright/test'

import { ACCOUNTS, PASSWORD, signIn } from './helpers'

test.describe('احراز هویت', () => {
  test('کاربر مهمان به صفحه ورود هدایت می‌شود', async ({ page }) => {
    await page.goto('/dashboard')
    await page.waitForURL('**/login')
    await expect(page.getByRole('heading', { name: 'ورود به حساب' })).toBeVisible()
  })

  test('ورود با اطلاعات نادرست پیام خطا نشان می‌دهد', async ({ page }) => {
    await page.goto('/login')
    await page.fill('#email', ACCOUNTS.admin.email)
    await page.fill('#password', 'wrong-password')
    await page.click('button[type=submit]')
    // Next.js renders its own empty route-announcer with role=alert, so scope
    // the assertion to the form's own error banner.
    await expect(page.locator('form [role=alert]')).toContainText('نادرست')
  })

  test('ورود موفق کاربر را به داشبورد می‌برد', async ({ page }) => {
    await signIn(page, 'admin')
    await expect(page).toHaveURL(/\/dashboard/)
  })

  test('کاربر واردشده در صفحه ورود نمی‌ماند', async ({ page }) => {
    await signIn(page, 'admin')
    await page.goto('/login')
    await page.waitForURL('**/dashboard')
  })

  test('خروج از حساب کاربر را به صفحه ورود برمی‌گرداند', async ({ page }) => {
    await signIn(page, 'admin')
    await page.getByRole('button', { name: 'منوی کاربر' }).click()
    await page.getByRole('menuitem', { name: /خروج از حساب/ }).click()
    await page.waitForURL('**/login')
  })

  test('ثبت‌نام سازمان جدید، سازمان و حساب مدیر می‌سازد', async ({ page }) => {
    const stamp = Date.now()
    await page.goto('/register')
    await page.fill('#name', 'کاربر آزمایشی')
    await page.fill('#organizationName', `سازمان آزمایشی ${stamp}`)
    await page.fill('#email', `e2e-${stamp}@example.com`)
    await page.fill('#password', PASSWORD)
    await page.fill('#confirmPassword', PASSWORD)
    await page.click('button[type=submit]')
    await page.waitForURL('**/dashboard')
    await expect(page.getByRole('heading', { level: 1 })).toContainText('آزمایشی')
  })
})
