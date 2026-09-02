import { expect, test } from '@playwright/test'

import { signIn } from './helpers'

test.describe('داشبورد', () => {
  test.beforeEach(async ({ page }) => {
    await signIn(page, 'admin')
  })

  test('هر پنج ویجت خلاصه را نشان می‌دهد', async ({ page }) => {
    for (const label of [
      'کل اهداف',
      'OKRهای فعال',
      'میانگین پیشرفت',
      'اهداف در معرض ریسک',
      'اهداف تکمیل‌شده',
    ]) {
      await expect(page.getByText(label, { exact: true })).toBeVisible()
    }
  })

  test('هر چهار نمودار رندر می‌شوند', async ({ page }) => {
    for (const title of [
      'پیشرفت به تفکیک دپارتمان',
      'توزیع سلامت اهداف',
      'عملکرد کوارترها',
      'عملکرد مالکان',
    ]) {
      await expect(page.getByText(title, { exact: true })).toBeVisible()
    }
    // Recharts draws each chart into its own SVG wrapper.
    await expect(page.locator('.recharts-wrapper').first()).toBeVisible()
  })

  test('فیلتر کوارتر داشبورد را به‌روزرسانی می‌کند', async ({ page }) => {
    await page.getByLabel('کوارتر').click()
    await page.getByRole('option').nth(1).click()
    await expect(page).toHaveURL(/quarterId=/)
  })

  test('تغییر پوسته به حالت تیره کار می‌کند', async ({ page }) => {
    await page.getByRole('button', { name: 'تغییر پوسته' }).click()
    await page.getByRole('menuitem', { name: 'تیره' }).click()
    await expect(page.locator('html')).toHaveClass(/dark/)
  })
})
