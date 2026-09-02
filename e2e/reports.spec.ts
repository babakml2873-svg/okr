import { expect, test } from '@playwright/test'

import { signIn } from './helpers'

test.describe('گزارش‌ها و خروجی‌ها', () => {
  test.beforeEach(async ({ page }) => {
    await signIn(page, 'admin')
  })

  test('هر سه گزارش در فهرست هستند', async ({ page }) => {
    await page.goto('/reports')
    await expect(page.getByText('گزارش کوارتری OKR')).toBeVisible()
    await expect(page.getByText('گزارش عملکرد دپارتمان')).toBeVisible()
    await expect(page.getByText('گزارش عملکرد فردی')).toBeVisible()
  })

  test('گزارش کوارتری داده‌های واقعی نشان می‌دهد', async ({ page }) => {
    await page.goto('/reports/quarterly')
    await expect(page.getByRole('heading', { name: 'گزارش کوارتری OKR' })).toBeVisible()
    await expect(page.getByText('عملکرد دپارتمان‌ها')).toBeVisible()
    await expect(page.getByText('جزئیات اهداف و نتایج کلیدی')).toBeVisible()
  })

  test('ویو چاپ بدون پوسته اپ رندر می‌شود', async ({ page }) => {
    await page.goto('/reports/quarterly/print')
    await expect(page.getByRole('button', { name: 'چاپ' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'گزارش کوارتری OKR' })).toBeVisible()
    // The app sidebar must not appear in a document destined for print.
    await expect(page.getByRole('navigation', { name: 'ناوبری اصلی' })).toHaveCount(0)
  })

  test('خروجی اکسل یک فایل xlsx معتبر برمی‌گرداند', async ({ page }) => {
    const response = await page.request.get('/api/exports/excel?type=quarterly')
    expect(response.status()).toBe(200)
    expect(response.headers()['content-type']).toContain('spreadsheetml')

    const body = await response.body()
    // Every .xlsx is a ZIP archive — check the magic bytes.
    expect(body.subarray(0, 2).toString('latin1')).toBe('PK')
    expect(body.byteLength).toBeGreaterThan(4000)
  })
})
