import { expect, test } from '@playwright/test'

import { filterBy, parsePercent, signIn } from './helpers'

test.describe('چرخه کامل OKR', () => {
  test('ساخت هدف، افزودن نتیجه کلیدی و ثبت بازبینی پیشرفت را به‌روز می‌کند', async ({ page }) => {
    await signIn(page, 'admin')

    const title = `هدف آزمایشی ${Date.now()}`

    // --- create an objective -------------------------------------------
    await page.goto('/objectives')
    await page.getByRole('button', { name: 'هدف جدید' }).click()
    await page.fill('#objective-title', title)
    await page.fill('#objective-description', 'هدفی که تست خودکار ساخته است')
    await page.getByRole('button', { name: 'ایجاد هدف' }).click()

    // The card renders both a title link and a chevron link to the same page.
    const objectiveLink = page.getByRole('link', { name: title, exact: true })
    await expect(objectiveLink).toBeVisible({ timeout: 15000 })
    await objectiveLink.click()
    await page.waitForURL(/\/objectives\/[^/]+$/)

    // A brand-new objective has no key results yet.
    await expect(page.getByText('هنوز نتیجه کلیدی تعریف نشده')).toBeVisible()

    // --- add a key result ----------------------------------------------
    await page.getByRole('button', { name: 'نتیجه کلیدی' }).click()
    await page.fill('#kr-title', 'افزایش دامداری‌های فعال از ۲۰ به ۱۰۰')
    await page.fill('#kr-start', '20')
    await page.fill('#kr-current', '20')
    await page.fill('#kr-target', '100')
    await page.fill('#kr-unit', 'دامداری')
    await page.getByRole('button', { name: 'افزودن نتیجه کلیدی' }).click()

    const keyResultLink = page.getByRole('link', { name: /افزایش دامداری‌های فعال/ })
    await expect(keyResultLink.first()).toBeVisible({ timeout: 15000 })

    // At the start value the objective is still at zero.
    const progressBefore = parsePercent(
      (await page.locator('.text-2xl.font-bold').first().textContent()) ?? '0',
    )
    expect(progressBefore).toBe(0)

    // --- check in --------------------------------------------------------
    await page.getByRole('button', { name: 'ثبت بازبینی' }).first().click()
    await page.fill('#checkin-value', '60')
    await page.fill('#checkin-note', 'پیشرفت خوبی داشتیم')
    await page.fill('#checkin-blockers', 'تأخیر در قیف فروش')
    await page.fill('#checkin-next', 'تماس با ۲۰ سرنخ')
    await page.getByRole('button', { name: 'ثبت بازبینی' }).last().click()

    // 20 → 60 out of 100 is exactly half the range.
    await expect
      .poll(
        async () =>
          parsePercent((await page.locator('.text-2xl.font-bold').first().textContent()) ?? '0'),
        { timeout: 15000 },
      )
      .toBe(50)

    // The check-in narrative is recorded on the timeline.
    await expect(page.getByText('تأخیر در قیف فروش')).toBeVisible()
    await expect(page.getByText('تماس با ۲۰ سرنخ')).toBeVisible()
  })

  test('فیلتر سطح فقط اهداف همان سطح را نشان می‌دهد', async ({ page }) => {
    await signIn(page, 'admin')
    await page.goto('/objectives')

    await page.getByLabel('سطح', { exact: true }).click()
    await page.getByRole('option', { name: 'شرکت' }).click()
    await expect(page).toHaveURL(/level=COMPANY/)

    const badges = page.getByText('شرکت', { exact: true })
    await expect(badges.first()).toBeVisible()
  })

  test('جست‌وجوی سراسری نتایج مرتبط را برمی‌گرداند', async ({ page }) => {
    await signIn(page, 'admin')
    await page.goto('/search')
    await filterBy(page, 'جست‌وجو', 'دامداری')

    await expect(page.getByText(/نتیجه برای/)).toBeVisible({ timeout: 15000 })
    await expect(page.getByRole('link', { name: /دامداری/ }).first()).toBeVisible()
  })
})
