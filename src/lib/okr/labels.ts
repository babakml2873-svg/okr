/**
 * Persian display labels for every domain enum, in one place so the wording
 * stays consistent across pages, charts, exports and reports.
 */

export const ROLE_LABELS = {
  ADMIN: 'مدیر سامانه',
  EXECUTIVE: 'مدیر ارشد',
  MANAGER: 'مدیر',
  MEMBER: 'عضو',
} as const

export const ROLE_DESCRIPTIONS = {
  ADMIN: 'دسترسی کامل به سازمان، اعضا و تنظیمات',
  EXECUTIVE: 'مشاهده کامل سازمان و مدیریت اهداف سطح شرکت',
  MANAGER: 'مدیریت اهداف دپارتمان و تیم تحت مسئولیت',
  MEMBER: 'به‌روزرسانی نتایج کلیدی خود و ثبت بازبینی',
} as const

export const OBJECTIVE_LEVEL_LABELS = {
  COMPANY: 'شرکت',
  DEPARTMENT: 'دپارتمان',
  TEAM: 'تیم',
  INDIVIDUAL: 'فردی',
} as const

export const OBJECTIVE_STATUS_LABELS = {
  DRAFT: 'پیش‌نویس',
  ACTIVE: 'فعال',
  COMPLETED: 'تکمیل‌شده',
  CANCELLED: 'لغو‌شده',
} as const

export const HEALTH_LABELS = {
  ON_TRACK: 'در مسیر',
  AT_RISK: 'در معرض ریسک',
  OFF_TRACK: 'خارج از مسیر',
} as const

export const METRIC_TYPE_LABELS = {
  INCREASE: 'افزایشی',
  DECREASE: 'کاهشی',
  BINARY: 'دو‌حالته',
  MILESTONE: 'مرحله‌ای',
} as const

export const METRIC_TYPE_HINTS = {
  INCREASE: 'مثال: افزایش دامداری‌های فعال از ۲۰ به ۱۰۰',
  DECREASE: 'مثال: کاهش نرخ خطا از ۱۰٪ به ۲٪',
  BINARY: 'مثال: انتشار اپلیکیشن موبایل — انجام شد / نشد',
  MILESTONE: 'مثال: تکمیل ۵ مرحله از فرآیند استقرار',
} as const

export const KEY_RESULT_STATUS_LABELS = {
  ACTIVE: 'فعال',
  COMPLETED: 'تکمیل‌شده',
  CANCELLED: 'لغو‌شده',
} as const

export const INITIATIVE_STATUS_LABELS = {
  NOT_STARTED: 'شروع‌نشده',
  IN_PROGRESS: 'در حال انجام',
  DONE: 'انجام‌شده',
  BLOCKED: 'متوقف‌شده',
  CANCELLED: 'لغو‌شده',
} as const

export const CHECK_IN_CADENCE_LABELS = {
  WEEKLY: 'هفتگی',
  MONTHLY: 'ماهانه',
  ADHOC: 'موردی',
} as const

export const QUARTER_STATUS_LABELS = {
  UPCOMING: 'پیش‌رو',
  ACTIVE: 'جاری',
  CLOSED: 'بسته‌شده',
} as const

export const NOTIFICATION_TYPE_LABELS = {
  CHECK_IN_DUE: 'بازبینی سررسید',
  KEY_RESULT_ASSIGNED: 'واگذاری نتیجه کلیدی',
  OBJECTIVE_ASSIGNED: 'واگذاری هدف',
  COMMENT_ADDED: 'دیدگاه جدید',
  MENTIONED: 'اشاره به شما',
  AT_RISK: 'هشدار ریسک',
  INVITATION: 'دعوت‌نامه',
  OBJECTIVE_COMPLETED: 'تکمیل هدف',
} as const

export const ROLLUP_MODE_LABELS = {
  KEY_RESULTS_ONLY: 'فقط نتایج کلیدی',
  KEY_RESULTS_AND_CHILDREN: 'نتایج کلیدی و اهداف زیرمجموعه',
} as const

export const ACTIVITY_ACTION_LABELS = {
  CREATED: 'ایجاد کرد',
  UPDATED: 'به‌روزرسانی کرد',
  DELETED: 'حذف کرد',
  CHECKED_IN: 'بازبینی ثبت کرد',
  COMMENTED: 'دیدگاه گذاشت',
  STATUS_CHANGED: 'وضعیت را تغییر داد',
} as const

export const ENTITY_TYPE_LABELS = {
  OBJECTIVE: 'هدف',
  KEY_RESULT: 'نتیجه کلیدی',
  INITIATIVE: 'اقدام',
  CHECK_IN: 'بازبینی',
  COMMENT: 'دیدگاه',
  MEMBER: 'عضو',
  DEPARTMENT: 'دپارتمان',
  TEAM: 'تیم',
  QUARTER: 'کوارتر',
} as const

/** Look a label up without throwing on values that are not in the map. */
export function labelOf<T extends Record<string, string>>(
  map: T,
  key: string | null | undefined,
  fallback = '—',
): string {
  if (!key) return fallback
  return map[key as keyof T] ?? fallback
}
