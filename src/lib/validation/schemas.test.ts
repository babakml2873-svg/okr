import { describe, expect, it } from 'vitest'

import { checkInSchema, keyResultSchema, objectiveSchema, registerSchema } from './schemas'

const validKeyResult = {
  objectiveId: 'obj-1',
  title: 'افزایش دامداری‌های فعال',
  metricType: 'INCREASE' as const,
  startValue: 20,
  currentValue: 45,
  targetValue: 100,
  ownerId: 'user-1',
}

describe('keyResultSchema', () => {
  it('accepts a well-formed increase key result', () => {
    expect(keyResultSchema.safeParse(validKeyResult).success).toBe(true)
  })

  it('rejects an increase target below its start value', () => {
    const result = keyResultSchema.safeParse({ ...validKeyResult, targetValue: 5 })
    expect(result.success).toBe(false)
  })

  it('rejects a decrease target above its start value', () => {
    const result = keyResultSchema.safeParse({
      ...validKeyResult,
      metricType: 'DECREASE',
      startValue: 2,
      targetValue: 10,
    })
    expect(result.success).toBe(false)
  })

  it('accepts a valid decrease key result', () => {
    const result = keyResultSchema.safeParse({
      ...validKeyResult,
      metricType: 'DECREASE',
      startValue: 12,
      currentValue: 8,
      targetValue: 4,
    })
    expect(result.success).toBe(true)
  })

  it('rejects a milestone with no steps', () => {
    const result = keyResultSchema.safeParse({
      ...validKeyResult,
      metricType: 'MILESTONE',
      startValue: 0,
      targetValue: 0,
    })
    expect(result.success).toBe(false)
  })

  it('accepts Persian digits in numeric fields', () => {
    const result = keyResultSchema.safeParse({ ...validKeyResult, currentValue: '۴۵' })
    expect(result.success).toBe(true)
    if (result.success) expect(result.data.currentValue).toBe(45)
  })

  it('rejects a title that is too short', () => {
    expect(keyResultSchema.safeParse({ ...validKeyResult, title: 'ا' }).success).toBe(false)
  })
})

describe('objectiveSchema', () => {
  it('accepts a valid objective', () => {
    const result = objectiveSchema.safeParse({
      title: 'تبدیل شدن به پیشروترین پلتفرم مدیریت گاوداری',
      level: 'COMPANY',
      ownerId: 'user-1',
      quarterId: 'q-1',
    })
    expect(result.success).toBe(true)
  })

  it('normalises empty optional ids to null', () => {
    const result = objectiveSchema.safeParse({
      title: 'هدف نمونه',
      level: 'TEAM',
      ownerId: 'user-1',
      quarterId: 'q-1',
      parentId: '',
      departmentId: '',
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.parentId).toBeNull()
      expect(result.data.departmentId).toBeNull()
    }
  })

  it('rejects an out-of-range confidence score', () => {
    const base = { title: 'هدف نمونه', level: 'TEAM', ownerId: 'u', quarterId: 'q' }
    expect(objectiveSchema.safeParse({ ...base, confidence: 0 }).success).toBe(false)
    expect(objectiveSchema.safeParse({ ...base, confidence: 11 }).success).toBe(false)
    expect(objectiveSchema.safeParse({ ...base, confidence: 10 }).success).toBe(true)
  })
})

describe('checkInSchema', () => {
  it('accepts a weekly check-in', () => {
    const result = checkInSchema.safeParse({
      keyResultId: 'kr-1',
      newValue: 75,
      confidence: 8,
      blockers: 'تأخیر در قیف فروش',
      nextActions: 'تماس با ۲۰ سرنخ',
    })
    expect(result.success).toBe(true)
  })

  it('rejects a confidence score outside 1–10', () => {
    expect(
      checkInSchema.safeParse({ keyResultId: 'kr-1', newValue: 5, confidence: 12 }).success,
    ).toBe(false)
  })
})

describe('registerSchema', () => {
  const base = {
    name: 'بابک محمدی',
    email: 'Babak@Example.COM',
    password: 'strongpass123',
    confirmPassword: 'strongpass123',
    organizationName: 'نیوماو',
  }

  it('accepts a valid registration and lowercases the email', () => {
    const result = registerSchema.safeParse(base)
    expect(result.success).toBe(true)
    if (result.success) expect(result.data.email).toBe('babak@example.com')
  })

  it('rejects mismatched passwords', () => {
    expect(registerSchema.safeParse({ ...base, confirmPassword: 'other' }).success).toBe(false)
  })

  it('rejects a short password', () => {
    expect(
      registerSchema.safeParse({ ...base, password: 'short', confirmPassword: 'short' }).success,
    ).toBe(false)
  })
})
