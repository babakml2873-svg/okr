/**
 * Zod schemas shared by forms (client) and services (server).
 *
 * The server never trusts the client's validation — it re-parses every payload
 * with the same schema — but sharing the definition keeps the Persian error
 * messages identical on both sides.
 */

import { z } from 'zod'

import { parsePersianNumber } from '@/lib/format/numbers'

// --------------------------------------------------------------------------
// primitives
// --------------------------------------------------------------------------

export const idSchema = z.string().min(1, 'شناسه نامعتبر است')

/** Accepts Persian digits and Persian separators from the UI. */
export const numericSchema = z.preprocess((value) => {
  if (typeof value === 'number') return value
  if (typeof value === 'string') return parsePersianNumber(value)
  return value
}, z.number({ error: 'یک عدد معتبر وارد کنید' }).finite('عدد وارد‌شده معتبر نیست'))

/** An id that may be absent, empty or explicitly null — all normalise to null. */
export const optionalIdSchema = z
  .union([idSchema, z.literal(''), z.null()])
  .optional()
  .transform((value) => (value === '' || value === undefined ? null : value))

export const dateSchema = z.preprocess((value) => {
  if (value instanceof Date) return value
  if (typeof value === 'string' && value.trim() !== '') return new Date(value)
  return value
}, z.date({ error: 'تاریخ معتبر وارد کنید' }))

export const optionalDateSchema = z.preprocess((value) => {
  if (value === '' || value === null || value === undefined) return null
  if (value instanceof Date) return value
  if (typeof value === 'string') return new Date(value)
  return value
}, z.date().nullable())

export const confidenceSchema = z.coerce
  .number()
  .int('امتیاز اطمینان باید عدد صحیح باشد')
  .min(1, 'حداقل امتیاز اطمینان ۱ است')
  .max(10, 'حداکثر امتیاز اطمینان ۱۰ است')

export const roleSchema = z.enum(['ADMIN', 'EXECUTIVE', 'MANAGER', 'MEMBER'], {
  error: 'نقش انتخاب‌شده معتبر نیست',
})

export const objectiveLevelSchema = z.enum(['COMPANY', 'DEPARTMENT', 'TEAM', 'INDIVIDUAL'], {
  error: 'سطح هدف معتبر نیست',
})

export const objectiveStatusSchema = z.enum(['DRAFT', 'ACTIVE', 'COMPLETED', 'CANCELLED'])
export const healthSchema = z.enum(['ON_TRACK', 'AT_RISK', 'OFF_TRACK'])
export const rollupModeSchema = z.enum(['KEY_RESULTS_ONLY', 'KEY_RESULTS_AND_CHILDREN'])
export const metricTypeSchema = z.enum(['INCREASE', 'DECREASE', 'BINARY', 'MILESTONE'], {
  error: 'نوع متریک معتبر نیست',
})
export const keyResultStatusSchema = z.enum(['ACTIVE', 'COMPLETED', 'CANCELLED'])
export const initiativeStatusSchema = z.enum([
  'NOT_STARTED',
  'IN_PROGRESS',
  'DONE',
  'BLOCKED',
  'CANCELLED',
])
export const checkInCadenceSchema = z.enum(['WEEKLY', 'MONTHLY', 'ADHOC'])
export const calendarTypeSchema = z.enum(['JALALI', 'GREGORIAN'])

// --------------------------------------------------------------------------
// auth & organization
// --------------------------------------------------------------------------

export const emailSchema = z
  .string()
  .trim()
  .min(1, 'ایمیل الزامی است')
  .email('قالب ایمیل صحیح نیست')
  .toLowerCase()

export const passwordSchema = z
  .string()
  .min(8, 'رمز عبور باید حداقل ۸ کاراکتر باشد')
  .max(72, 'رمز عبور نمی‌تواند بیش از ۷۲ کاراکتر باشد')

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'رمز عبور الزامی است'),
})

export const registerSchema = z
  .object({
    name: z.string().trim().min(2, 'نام باید حداقل ۲ کاراکتر باشد').max(80),
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string(),
    organizationName: z
      .string()
      .trim()
      .min(2, 'نام سازمان باید حداقل ۲ کاراکتر باشد')
      .max(80, 'نام سازمان طولانی است'),
    /** Optional invitation token — when present the user joins instead. */
    invitationToken: z.string().optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'رمز عبور و تکرار آن یکسان نیستند',
    path: ['confirmPassword'],
  })

export const updateProfileSchema = z.object({
  name: z.string().trim().min(2, 'نام باید حداقل ۲ کاراکتر باشد').max(80),
  jobTitle: z.string().trim().max(80).optional().or(z.literal('')),
})

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'رمز عبور فعلی الزامی است'),
    newPassword: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'رمز عبور جدید و تکرار آن یکسان نیستند',
    path: ['confirmPassword'],
  })

export const updateOrganizationSchema = z.object({
  name: z.string().trim().min(2, 'نام سازمان باید حداقل ۲ کاراکتر باشد').max(80),
  calendarType: calendarTypeSchema,
})

export const inviteMemberSchema = z.object({
  email: emailSchema,
  role: roleSchema,
  departmentId: optionalIdSchema,
  teamId: optionalIdSchema,
})

export const updateMemberSchema = z.object({
  membershipId: idSchema,
  role: roleSchema,
  departmentId: optionalIdSchema,
  teamId: optionalIdSchema,
  status: z.enum(['ACTIVE', 'INVITED', 'DISABLED']),
})

// --------------------------------------------------------------------------
// org structure
// --------------------------------------------------------------------------

export const departmentSchema = z.object({
  name: z.string().trim().min(2, 'نام دپارتمان باید حداقل ۲ کاراکتر باشد').max(60),
  description: z.string().trim().max(500).optional().or(z.literal('')),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, 'کد رنگ معتبر نیست')
    .default('#4f46e5'),
  headId: optionalIdSchema,
})

export const teamSchema = z.object({
  name: z.string().trim().min(2, 'نام تیم باید حداقل ۲ کاراکتر باشد').max(60),
  description: z.string().trim().max(500).optional().or(z.literal('')),
  departmentId: idSchema,
  leadId: optionalIdSchema,
})

export const quarterSchema = z.object({
  year: z.coerce.number().int().min(1300, 'سال معتبر نیست').max(2200),
  quarterNumber: z.coerce.number().int().min(1).max(4),
})

// --------------------------------------------------------------------------
// OKRs
// --------------------------------------------------------------------------

export const objectiveSchema = z.object({
  title: z.string().trim().min(3, 'عنوان هدف باید حداقل ۳ کاراکتر باشد').max(160),
  description: z.string().trim().max(2000).optional().or(z.literal('')),
  level: objectiveLevelSchema,
  status: objectiveStatusSchema.default('ACTIVE'),
  ownerId: idSchema,
  departmentId: optionalIdSchema,
  teamId: optionalIdSchema,
  quarterId: idSchema,
  parentId: optionalIdSchema,
  confidence: confidenceSchema.default(7),
  rollupMode: rollupModeSchema.default('KEY_RESULTS_ONLY'),
})

export const updateObjectiveSchema = objectiveSchema.partial().extend({ id: idSchema })

export const keyResultSchema = z
  .object({
    objectiveId: idSchema,
    title: z.string().trim().min(3, 'عنوان نتیجه کلیدی باید حداقل ۳ کاراکتر باشد').max(160),
    description: z.string().trim().max(2000).optional().or(z.literal('')),
    metricType: metricTypeSchema,
    startValue: numericSchema,
    currentValue: numericSchema,
    targetValue: numericSchema,
    unit: z.string().trim().max(24).optional().or(z.literal('')),
    weight: z.coerce.number().positive('وزن باید عددی مثبت باشد').max(100).default(1),
    confidence: confidenceSchema.default(7),
    ownerId: idSchema,
    dueDate: optionalDateSchema,
    autoUpdateFromInitiatives: z.boolean().default(false),
  })
  .refine(
    (data) => data.metricType !== 'INCREASE' || data.targetValue >= data.startValue,
    { message: 'برای متریک افزایشی، مقدار هدف باید بزرگ‌تر از مقدار شروع باشد', path: ['targetValue'] },
  )
  .refine(
    (data) => data.metricType !== 'DECREASE' || data.targetValue <= data.startValue,
    { message: 'برای متریک کاهشی، مقدار هدف باید کوچک‌تر از مقدار شروع باشد', path: ['targetValue'] },
  )
  .refine(
    (data) => data.metricType !== 'MILESTONE' || data.targetValue > 0,
    { message: 'تعداد مراحل باید بزرگ‌تر از صفر باشد', path: ['targetValue'] },
  )

export const updateKeyResultSchema = z.object({
  id: idSchema,
  title: z.string().trim().min(3).max(160).optional(),
  description: z.string().trim().max(2000).optional().or(z.literal('')),
  metricType: metricTypeSchema.optional(),
  startValue: numericSchema.optional(),
  currentValue: numericSchema.optional(),
  targetValue: numericSchema.optional(),
  unit: z.string().trim().max(24).optional().or(z.literal('')),
  weight: z.coerce.number().positive().max(100).optional(),
  confidence: confidenceSchema.optional(),
  ownerId: idSchema.optional(),
  dueDate: optionalDateSchema.optional(),
  status: keyResultStatusSchema.optional(),
  autoUpdateFromInitiatives: z.boolean().optional(),
})

export const initiativeSchema = z.object({
  keyResultId: idSchema,
  title: z.string().trim().min(3, 'عنوان اقدام باید حداقل ۳ کاراکتر باشد').max(160),
  description: z.string().trim().max(2000).optional().or(z.literal('')),
  ownerId: idSchema,
  status: initiativeStatusSchema.default('NOT_STARTED'),
  dueDate: optionalDateSchema,
})

export const updateInitiativeSchema = initiativeSchema.partial().extend({ id: idSchema })

export const checkInSchema = z.object({
  keyResultId: idSchema,
  newValue: numericSchema,
  confidence: confidenceSchema,
  cadence: checkInCadenceSchema.default('WEEKLY'),
  note: z.string().trim().max(2000).optional().or(z.literal('')),
  blockers: z.string().trim().max(2000).optional().or(z.literal('')),
  nextActions: z.string().trim().max(2000).optional().or(z.literal('')),
})

export const commentSchema = z
  .object({
    body: z.string().trim().min(1, 'متن دیدگاه نمی‌تواند خالی باشد').max(4000),
    objectiveId: optionalIdSchema,
    keyResultId: optionalIdSchema,
    initiativeId: optionalIdSchema,
    checkInId: optionalIdSchema,
    parentId: optionalIdSchema,
  })
  .refine(
    (data) =>
      [data.objectiveId, data.keyResultId, data.initiativeId, data.checkInId].filter(Boolean)
        .length === 1,
    { message: 'دیدگاه باید دقیقاً به یک موضوع متصل باشد' },
  )

// --------------------------------------------------------------------------
// filtering & search
// --------------------------------------------------------------------------

export const okrFilterSchema = z.object({
  quarterId: optionalIdSchema,
  departmentId: optionalIdSchema,
  teamId: optionalIdSchema,
  ownerId: optionalIdSchema,
  level: objectiveLevelSchema.optional(),
  status: objectiveStatusSchema.optional(),
  health: healthSchema.optional(),
  search: z.string().trim().max(120).optional(),
})

export const searchSchema = z.object({
  q: z.string().trim().min(1, 'عبارت جست‌وجو را وارد کنید').max(120),
  limit: z.coerce.number().int().min(1).max(50).default(20),
})

// --------------------------------------------------------------------------
// inferred types
// --------------------------------------------------------------------------

export type LoginInput = z.infer<typeof loginSchema>
export type RegisterInput = z.infer<typeof registerSchema>
export type ObjectiveInput = z.infer<typeof objectiveSchema>
export type KeyResultInput = z.infer<typeof keyResultSchema>
export type UpdateKeyResultInput = z.infer<typeof updateKeyResultSchema>
export type InitiativeInput = z.infer<typeof initiativeSchema>
export type CheckInInput = z.infer<typeof checkInSchema>
export type CommentInput = z.infer<typeof commentSchema>
export type OkrFilterInput = z.infer<typeof okrFilterSchema>
export type InviteMemberInput = z.infer<typeof inviteMemberSchema>
export type DepartmentInput = z.infer<typeof departmentSchema>
export type TeamInput = z.infer<typeof teamSchema>
