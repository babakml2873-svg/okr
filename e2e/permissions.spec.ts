import { expect, test } from '@playwright/test'

import { signIn } from './helpers'

test.describe('دسترسی‌ها بر اساس نقش', () => {
  test('مدیر سامانه به همه بخش‌های تنظیمات دسترسی دارد', async ({ page }) => {
    await signIn(page, 'admin')
    await page.goto('/settings/members')
    await expect(page.getByText('اعضای سازمان')).toBeVisible()

    await page.goto('/settings/departments')
    await expect(page.getByText('دپارتمان‌ها', { exact: true }).first()).toBeVisible()
  })

  test('عضو عادی به مدیریت اعضا دسترسی ندارد', async ({ page }) => {
    await signIn(page, 'member')
    await page.goto('/settings/members')
    await expect(page.getByText('دسترسی محدود')).toBeVisible()
  })

  test('عضو عادی فقط می‌تواند هدف فردی بسازد', async ({ page }) => {
    await signIn(page, 'member')
    await page.goto('/my-okrs')
    await page.getByRole('button', { name: 'هدف فردی جدید' }).click()

    await page.getByLabel('سطح', { exact: true }).click()
    const options = page.getByRole('option')
    await expect(options).toHaveCount(1)
    await expect(options.first()).toHaveText('فردی')
  })

  test('عضو عادی OKRهای خودش را می‌بیند', async ({ page }) => {
    await signIn(page, 'member')
    await page.goto('/my-okrs')
    await expect(page.getByRole('heading', { name: 'OKRهای من' })).toBeVisible()
    await expect(page.getByText('نتایج کلیدی من', { exact: true })).toBeVisible()
  })

  test('همه نقش‌ها می‌توانند اهداف سازمان را ببینند', async ({ page }) => {
    await signIn(page, 'member')
    await page.goto('/objectives')
    await expect(page.getByRole('heading', { name: 'اهداف' })).toBeVisible()
    await expect(page.locator('a[href^="/objectives/"]').first()).toBeVisible()
  })
})
