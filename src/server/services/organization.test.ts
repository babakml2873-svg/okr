import { describe, expect, it } from 'vitest'

import { slugify } from './organization'

describe('slugify', () => {
  it('transliterates Persian names', () => {
    expect(slugify('نیوماو')).toBe('nywmaw')
    expect(slugify('شرکت نیوماو')).toBe('shrkt-nywmaw')
  })

  it('keeps Latin names intact', () => {
    expect(slugify('Newmaaw Dairy')).toBe('newmaaw-dairy')
  })

  it('strips punctuation and collapses separators', () => {
    expect(slugify('  Acme   &&  Co.  ')).toBe('acme-co')
  })

  it('handles the zero-width non-joiner used in Persian compounds', () => {
    expect(slugify('می‌خواهم')).toBe('my-khwahm')
  })

  it('falls back when nothing survives', () => {
    expect(slugify('!!!')).toBe('org')
    expect(slugify('   ')).toBe('org')
  })
})
