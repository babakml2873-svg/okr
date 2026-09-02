import { expect, test } from '@playwright/test'

import { signIn } from './helpers'

test.describe('چیدمان موبایل', () => {
  test.use({ viewport: { width: 390, height: 844 } })

  test('منوی کشویی موبایل کار می‌کند', async ({ page }) => {
    await signIn(page, 'admin')

    // The desktop sidebar is hidden below the lg breakpoint.
    await expect(page.getByRole('button', { name: 'باز کردن منو' })).toBeVisible()

    await page.getByRole('button', { name: 'باز کردن منو' }).click()
    await expect(page.getByRole('link', { name: 'اهداف' })).toBeVisible()

    await page.getByRole('link', { name: 'اهداف' }).click()
    await page.waitForURL('**/objectives')
    await expect(page.getByRole('heading', { name: 'اهداف' })).toBeVisible()
  })

  test('صفحه در موبایل به‌صورت افقی اسکرول نمی‌شود', async ({ page }) => {
    await signIn(page, 'admin')
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    )
    expect(overflow).toBeLessThanOrEqual(1)
  })
})
