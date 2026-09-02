import type { CalendarType, Prisma, Role } from '@prisma/client'

import { buildYearQuarters, currentJalaliYear, quarterStatusFor } from '@/lib/date'
import { prisma } from '@/server/db'

/**
 * Persian → Latin transliteration, so a workspace named «نیوماو» gets the slug
 * `nywmaw` rather than a meaningless counter.
 */
const TRANSLITERATION: Record<string, string> = {
  ا: 'a',
  آ: 'a',
  أ: 'a',
  إ: 'e',
  ب: 'b',
  پ: 'p',
  ت: 't',
  ث: 's',
  ج: 'j',
  چ: 'ch',
  ح: 'h',
  خ: 'kh',
  د: 'd',
  ذ: 'z',
  ر: 'r',
  ز: 'z',
  ژ: 'zh',
  س: 's',
  ش: 'sh',
  ص: 's',
  ض: 'z',
  ط: 't',
  ظ: 'z',
  ع: 'a',
  غ: 'gh',
  ف: 'f',
  ق: 'gh',
  ک: 'k',
  ك: 'k',
  گ: 'g',
  ل: 'l',
  م: 'm',
  ن: 'n',
  و: 'w',
  ه: 'h',
  ی: 'y',
  ي: 'y',
  ة: 'h',
  ء: '',
  '۰': '0',
  '۱': '1',
  '۲': '2',
  '۳': '3',
  '۴': '4',
  '۵': '5',
  '۶': '6',
  '۷': '7',
  '۸': '8',
  '۹': '9',
}

/** URL-safe slug derived from a (possibly Persian) organization name. */
export function slugify(name: string): string {
  const transliterated = Array.from(name.trim().toLowerCase())
    .map((char) => TRANSLITERATION[char] ?? char)
    .join('')

  const base = transliterated
    .replace(/[\s\u200c_]+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')

  return base || 'org'
}

/** Reserve a unique slug, appending a counter when the base is taken. */
export async function uniqueSlug(name: string, client: Prisma.TransactionClient = prisma) {
  const base = slugify(name)
  let candidate = base
  let counter = 1
  while (
    await client.organization.findUnique({ where: { slug: candidate }, select: { id: true } })
  ) {
    counter += 1
    candidate = `${base}-${counter}`
  }
  return candidate
}

/**
 * Seed the planning calendar for a new organization: the current year's four
 * periods plus the next year's, with statuses derived from the clock.
 */
export async function createDefaultQuarters(
  client: Prisma.TransactionClient,
  organizationId: string,
  calendarType: CalendarType,
  now = new Date(),
) {
  const baseYear = calendarType === 'JALALI' ? currentJalaliYear(now) : now.getUTCFullYear()

  const definitions = [
    ...buildYearQuarters(baseYear, calendarType),
    ...buildYearQuarters(baseYear + 1, calendarType),
  ]

  await client.quarter.createMany({
    data: definitions.map((quarter) => ({
      organizationId,
      year: quarter.year,
      quarterNumber: quarter.quarterNumber,
      label: quarter.label,
      startDate: quarter.startDate,
      endDate: quarter.endDate,
      status: quarterStatusFor(quarter, now),
    })),
    skipDuplicates: true,
  })
}

export interface CreateOrganizationInput {
  name: string
  ownerUserId: string
  calendarType?: CalendarType
  ownerRole?: Role
}

/** Create an organization with its owner membership and default quarters. */
export async function createOrganization(
  input: CreateOrganizationInput,
  client: Prisma.TransactionClient,
) {
  const calendarType = input.calendarType ?? 'JALALI'
  const organization = await client.organization.create({
    data: {
      name: input.name,
      slug: await uniqueSlug(input.name, client),
      calendarType,
    },
  })

  await client.membership.create({
    data: {
      userId: input.ownerUserId,
      organizationId: organization.id,
      role: input.ownerRole ?? 'ADMIN',
      status: 'ACTIVE',
    },
  })

  await createDefaultQuarters(client, organization.id, calendarType)

  return organization
}
