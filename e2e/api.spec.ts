import { expect, test } from '@playwright/test'

import { signIn } from './helpers'

test.describe('REST API v1', () => {
  test('بدون احراز هویت ۴۰۱ برمی‌گرداند', async ({ request }) => {
    const response = await request.get('/api/v1/objectives')
    expect(response.status()).toBe(401)
  })

  test('فهرست اهداف را برمی‌گرداند', async ({ page }) => {
    await signIn(page, 'admin')
    const response = await page.request.get('/api/v1/objectives')
    expect(response.status()).toBe(200)

    const payload = (await response.json()) as { data: { id: string; title: string }[] }
    expect(Array.isArray(payload.data)).toBe(true)
    expect(payload.data.length).toBeGreaterThan(0)
    expect(payload.data[0]).toHaveProperty('title')
  })

  test('ورودی نامعتبر را با ۴۲۲ رد می‌کند', async ({ page }) => {
    await signIn(page, 'admin')
    const response = await page.request.post('/api/v1/objectives', {
      data: { title: 'x' },
    })
    expect(response.status()).toBe(422)
  })

  test('عضو عادی نمی‌تواند هدف سطح شرکت بسازد', async ({ page }) => {
    await signIn(page, 'member')

    const quarters = await page.request.get('/api/v1/objectives')
    const existing = (await quarters.json()) as {
      data: { quarterId: string; ownerId: string }[]
    }
    const quarterId = existing.data[0]?.quarterId

    const response = await page.request.post('/api/v1/objectives', {
      data: {
        title: 'هدف سطح شرکت از سوی عضو عادی',
        level: 'COMPANY',
        ownerId: existing.data[0]?.ownerId,
        quarterId,
      },
    })
    expect(response.status()).toBe(403)
  })

  test('جست‌وجو نتایج اسکوپ‌شده به سازمان برمی‌گرداند', async ({ page }) => {
    await signIn(page, 'admin')
    const response = await page.request.get('/api/v1/search?q=دامداری')
    expect(response.status()).toBe(200)

    const payload = (await response.json()) as { data: { type: string }[] }
    expect(payload.data.length).toBeGreaterThan(0)
  })
})
