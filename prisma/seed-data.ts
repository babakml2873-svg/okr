/**
 * Demo content for the Newmaaw (نیوماو) dairy-farm management platform.
 *
 * Kept separate from the seeding logic so the narrative — departments, people
 * and the OKR tree — reads as a document rather than being buried in loops.
 */

import type { InitiativeStatus, MetricType, ObjectiveLevel, Role } from '@prisma/client'

export const ORGANIZATION = { name: 'نیوماو', slug: 'newmaaw' }

export const DEPARTMENTS = [
  {
    key: 'product',
    name: 'محصول',
    color: '#6366f1',
    description: 'استراتژی محصول، تحقیق کاربر و طراحی تجربه',
  },
  {
    key: 'ai',
    name: 'هوش مصنوعی',
    color: '#8b5cf6',
    description: 'مدل‌های بینایی ماشین، شناسایی دام و پیش‌بینی',
  },
  {
    key: 'sales',
    name: 'فروش',
    color: '#f59e0b',
    description: 'توسعه بازار، جذب دامداری و مدیریت مشتریان',
  },
  {
    key: 'marketing',
    name: 'بازاریابی',
    color: '#ec4899',
    description: 'برند، محتوا، رویداد و تولید سرنخ',
  },
  {
    key: 'engineering',
    name: 'مهندسی',
    color: '#10b981',
    description: 'پلتفرم، زیرساخت، اپلیکیشن موبایل و پایداری',
  },
] as const

export type DepartmentKey = (typeof DEPARTMENTS)[number]['key']

export const TEAMS = [
  {
    key: 'platform',
    name: 'تیم پلتفرم',
    department: 'engineering',
    description: 'سرویس‌های هسته و API',
  },
  {
    key: 'mobile',
    name: 'تیم موبایل',
    department: 'engineering',
    description: 'اپلیکیشن دامدار و اپراتور',
  },
  {
    key: 'vision',
    name: 'تیم بینایی ماشین',
    department: 'ai',
    description: 'شناسایی و ردیابی دام',
  },
  {
    key: 'growth',
    name: 'تیم رشد',
    department: 'marketing',
    description: 'کانال‌های جذب و تولید سرنخ',
  },
  {
    key: 'field',
    name: 'تیم فروش میدانی',
    department: 'sales',
    description: 'استقرار در دامداری‌ها',
  },
] as const

export type TeamKey = (typeof TEAMS)[number]['key']

/** Every demo account uses this password; it is printed after seeding. */
export const DEMO_PASSWORD = 'okr12345'

export const USERS: {
  key: string
  name: string
  email: string
  jobTitle: string
  role: Role
  department?: DepartmentKey
  team?: TeamKey
}[] = [
  {
    key: 'ceo',
    name: 'بابک محمدی',
    email: 'admin@newmaaw.com',
    jobTitle: 'مدیرعامل',
    role: 'ADMIN',
  },
  {
    key: 'coo',
    name: 'شیرین کاظمی',
    email: 'shirin@newmaaw.com',
    jobTitle: 'مدیر ارشد عملیات',
    role: 'EXECUTIVE',
  },
  {
    key: 'cto',
    name: 'آرش نیک‌پور',
    email: 'arash@newmaaw.com',
    jobTitle: 'مدیر ارشد فناوری',
    role: 'EXECUTIVE',
  },
  {
    key: 'product-lead',
    name: 'مریم رستمی',
    email: 'maryam@newmaaw.com',
    jobTitle: 'مدیر محصول',
    role: 'MANAGER',
    department: 'product',
  },
  {
    key: 'ai-lead',
    name: 'سینا فتحی',
    email: 'sina@newmaaw.com',
    jobTitle: 'مدیر هوش مصنوعی',
    role: 'MANAGER',
    department: 'ai',
    team: 'vision',
  },
  {
    key: 'sales-lead',
    name: 'نرگس احمدی',
    email: 'narges@newmaaw.com',
    jobTitle: 'مدیر فروش',
    role: 'MANAGER',
    department: 'sales',
    team: 'field',
  },
  {
    key: 'marketing-lead',
    name: 'پویا صادقی',
    email: 'pouya@newmaaw.com',
    jobTitle: 'مدیر بازاریابی',
    role: 'MANAGER',
    department: 'marketing',
    team: 'growth',
  },
  {
    key: 'eng-lead',
    name: 'حمید کریمی',
    email: 'hamid@newmaaw.com',
    jobTitle: 'مدیر مهندسی',
    role: 'MANAGER',
    department: 'engineering',
    team: 'platform',
  },
  {
    key: 'ml-engineer',
    name: 'الهام موسوی',
    email: 'elham@newmaaw.com',
    jobTitle: 'مهندس یادگیری ماشین',
    role: 'MEMBER',
    department: 'ai',
    team: 'vision',
  },
  {
    key: 'backend',
    name: 'رضا شریفی',
    email: 'reza@newmaaw.com',
    jobTitle: 'مهندس بک‌اند',
    role: 'MEMBER',
    department: 'engineering',
    team: 'platform',
  },
  {
    key: 'mobile-dev',
    name: 'سارا جعفری',
    email: 'sara@newmaaw.com',
    jobTitle: 'توسعه‌دهنده موبایل',
    role: 'MEMBER',
    department: 'engineering',
    team: 'mobile',
  },
  {
    key: 'account-exec',
    name: 'محسن رحیمی',
    email: 'mohsen@newmaaw.com',
    jobTitle: 'کارشناس فروش',
    role: 'MEMBER',
    department: 'sales',
    team: 'field',
  },
  {
    key: 'content',
    name: 'زهرا نوری',
    email: 'zahra@newmaaw.com',
    jobTitle: 'کارشناس محتوا',
    role: 'MEMBER',
    department: 'marketing',
    team: 'growth',
  },
]

export interface SeedKeyResult {
  title: string
  description?: string
  metricType: MetricType
  startValue: number
  currentValue: number
  targetValue: number
  unit?: string
  weight?: number
  confidence: number
  owner: string
  autoUpdateFromInitiatives?: boolean
  initiatives?: { title: string; owner: string; status: InitiativeStatus; dueInDays?: number }[]
}

export interface SeedObjective {
  key: string
  title: string
  description: string
  level: ObjectiveLevel
  owner: string
  department?: DepartmentKey
  team?: TeamKey
  parent?: string
  confidence: number
  rollupMode?: 'KEY_RESULTS_ONLY' | 'KEY_RESULTS_AND_CHILDREN'
  keyResults: SeedKeyResult[]
}

/**
 * The current quarter's OKR tree: one company objective, four department
 * objectives aligned to it, team objectives beneath those, and individual
 * objectives at the leaves.
 */
export const OBJECTIVES: SeedObjective[] = [
  {
    key: 'market-leader',
    title: 'تبدیل شدن به پیشروترین پلتفرم مدیریت گاوداری شیری کشور',
    description:
      'تثبیت جایگاه نیوماو به‌عنوان مرجع مدیریت داده‌محور دامداری‌های شیری، از طریق رشد پایگاه مشتریان، افزایش دقت هوش مصنوعی و اثبات ارزش اقتصادی برای دامدار.',
    level: 'COMPANY',
    owner: 'ceo',
    confidence: 8,
    rollupMode: 'KEY_RESULTS_AND_CHILDREN',
    keyResults: [
      {
        title: 'افزایش دامداری‌های فعال از ۲۰ به ۱۰۰',
        description: 'دامداری فعال یعنی حداقل ۳۰ روز ثبت مستمر رکورد شیردهی.',
        metricType: 'INCREASE',
        startValue: 20,
        currentValue: 68,
        targetValue: 100,
        unit: 'دامداری',
        weight: 3,
        confidence: 8,
        owner: 'sales-lead',
      },
      {
        title: 'رسیدن به دقت ۹۵٪ در شناسایی دام',
        description: 'دقت مدل بینایی ماشین روی دیتاست اعتبارسنجی مستقل.',
        metricType: 'INCREASE',
        startValue: 78,
        currentValue: 91.4,
        targetValue: 95,
        unit: '٪',
        weight: 2,
        confidence: 7,
        owner: 'ai-lead',
      },
      {
        title: 'پردازش ۱ میلیون رکورد شیردهی',
        metricType: 'INCREASE',
        startValue: 120000,
        currentValue: 640000,
        targetValue: 1000000,
        unit: 'رکورد',
        weight: 2,
        confidence: 8,
        owner: 'eng-lead',
      },
      {
        title: 'کاهش نرخ ریزش مشتری از ۱۲٪ به ۴٪',
        metricType: 'DECREASE',
        startValue: 12,
        currentValue: 6.5,
        targetValue: 4,
        unit: '٪',
        weight: 2,
        confidence: 6,
        owner: 'coo',
      },
      {
        title: 'انتشار عمومی اپلیکیشن موبایل دامدار',
        metricType: 'BINARY',
        startValue: 0,
        currentValue: 0,
        targetValue: 1,
        weight: 1,
        confidence: 5,
        owner: 'cto',
      },
    ],
  },

  // ---------------------------------------------------------------- product
  {
    key: 'product-value',
    title: 'ساخت تجربه‌ای که دامدار هر روز به آن برگردد',
    description:
      'تمرکز بر ارزش روزانه محصول: سرعت ثبت رکورد، شفافیت گزارش‌ها و کاهش اصطکاک استقرار.',
    level: 'DEPARTMENT',
    owner: 'product-lead',
    department: 'product',
    parent: 'market-leader',
    confidence: 7,
    keyResults: [
      {
        title: 'افزایش کاربران فعال روزانه از ۱۴۰ به ۵۰۰',
        metricType: 'INCREASE',
        startValue: 140,
        currentValue: 318,
        targetValue: 500,
        unit: 'کاربر',
        weight: 2,
        confidence: 7,
        owner: 'product-lead',
      },
      {
        title: 'کاهش زمان استقرار یک دامداری از ۱۴ به ۳ روز',
        metricType: 'DECREASE',
        startValue: 14,
        currentValue: 7,
        targetValue: 3,
        unit: 'روز',
        confidence: 6,
        owner: 'product-lead',
      },
      {
        title: 'تکمیل ۵ مرحله بازطراحی جریان ثبت رکورد',
        metricType: 'MILESTONE',
        startValue: 0,
        currentValue: 0,
        targetValue: 5,
        unit: 'مرحله',
        confidence: 7,
        owner: 'product-lead',
        autoUpdateFromInitiatives: true,
        initiatives: [
          { title: 'مصاحبه با ۱۵ دامدار درباره جریان فعلی', owner: 'product-lead', status: 'DONE' },
          { title: 'طراحی نسخه اولیه جریان جدید', owner: 'product-lead', status: 'DONE' },
          { title: 'تست کاربردپذیری با ۸ کاربر', owner: 'product-lead', status: 'DONE' },
          {
            title: 'پیاده‌سازی در اپ موبایل',
            owner: 'mobile-dev',
            status: 'IN_PROGRESS',
            dueInDays: 12,
          },
          {
            title: 'انتشار تدریجی و سنجش اثر',
            owner: 'product-lead',
            status: 'NOT_STARTED',
            dueInDays: 30,
          },
        ],
      },
    ],
  },

  // --------------------------------------------------------------------- AI
  {
    key: 'ai-accuracy',
    title: 'رساندن هوش مصنوعی نیوماو به سطح قابل اتکا برای تصمیم دامدار',
    description:
      'ارتقای دقت و سرعت مدل‌های شناسایی دام و پیش‌بینی تولید شیر تا حدی که دامدار بدون بازبینی دستی به آن تکیه کند.',
    level: 'DEPARTMENT',
    owner: 'ai-lead',
    department: 'ai',
    parent: 'market-leader',
    confidence: 7,
    rollupMode: 'KEY_RESULTS_AND_CHILDREN',
    keyResults: [
      {
        title: 'افزایش دقت شناسایی دام از ۷۸٪ به ۹۵٪',
        metricType: 'INCREASE',
        startValue: 78,
        currentValue: 91.4,
        targetValue: 95,
        unit: '٪',
        weight: 3,
        confidence: 7,
        owner: 'ml-engineer',
      },
      {
        title: 'کاهش خطای پیش‌بینی تولید شیر از ۱۸٪ به ۸٪',
        metricType: 'DECREASE',
        startValue: 18,
        currentValue: 11.2,
        targetValue: 8,
        unit: '٪',
        weight: 2,
        confidence: 6,
        owner: 'ml-engineer',
      },
      {
        title: 'کاهش زمان استنتاج هر تصویر از ۹۰۰ به ۲۰۰ میلی‌ثانیه',
        metricType: 'DECREASE',
        startValue: 900,
        currentValue: 410,
        targetValue: 200,
        unit: 'میلی‌ثانیه',
        confidence: 8,
        owner: 'ml-engineer',
      },
    ],
  },
  {
    key: 'vision-dataset',
    title: 'ساخت بزرگ‌ترین دیتاست برچسب‌خورده دام شیری ایران',
    description: 'زیرساخت داده‌ای که مزیت رقابتی بلندمدت مدل‌های نیوماو را تضمین می‌کند.',
    level: 'TEAM',
    owner: 'ml-engineer',
    department: 'ai',
    team: 'vision',
    parent: 'ai-accuracy',
    confidence: 8,
    keyResults: [
      {
        title: 'برچسب‌گذاری ۵۰٬۰۰۰ تصویر دام',
        metricType: 'INCREASE',
        startValue: 8000,
        currentValue: 34500,
        targetValue: 50000,
        unit: 'تصویر',
        weight: 2,
        confidence: 8,
        owner: 'ml-engineer',
      },
      {
        title: 'پوشش ۲۰ دامداری مختلف در دیتاست',
        metricType: 'INCREASE',
        startValue: 4,
        currentValue: 13,
        targetValue: 20,
        unit: 'دامداری',
        confidence: 7,
        owner: 'ml-engineer',
      },
      {
        title: 'راه‌اندازی خط لوله خودکار برچسب‌گذاری',
        metricType: 'BINARY',
        startValue: 0,
        currentValue: 1,
        targetValue: 1,
        confidence: 9,
        owner: 'ml-engineer',
      },
    ],
  },

  // ------------------------------------------------------------------ sales
  {
    key: 'sales-growth',
    title: 'رشد پایدار پایگاه دامداری‌های فعال',
    description:
      'حرکت از فروش موردی به یک موتور فروش تکرارپذیر با چرخه کوتاه‌تر و نرخ تبدیل بالاتر.',
    level: 'DEPARTMENT',
    owner: 'sales-lead',
    department: 'sales',
    parent: 'market-leader',
    confidence: 6,
    rollupMode: 'KEY_RESULTS_AND_CHILDREN',
    keyResults: [
      {
        title: 'جذب ۸۰ دامداری جدید',
        metricType: 'INCREASE',
        startValue: 0,
        currentValue: 48,
        targetValue: 80,
        unit: 'دامداری',
        weight: 3,
        confidence: 6,
        owner: 'sales-lead',
      },
      {
        title: 'افزایش درآمد ماهانه تکرارشونده از ۳۰۰ به ۹۰۰ میلیون تومان',
        metricType: 'INCREASE',
        startValue: 300,
        currentValue: 585,
        targetValue: 900,
        unit: 'میلیون تومان',
        weight: 3,
        confidence: 6,
        owner: 'sales-lead',
      },
      {
        title: 'کاهش چرخه فروش از ۶۰ به ۳۰ روز',
        metricType: 'DECREASE',
        startValue: 60,
        currentValue: 44,
        targetValue: 30,
        unit: 'روز',
        confidence: 5,
        owner: 'account-exec',
      },
    ],
  },
  {
    key: 'field-deployment',
    title: 'استقرار بی‌نقص در دامداری‌های بزرگ استان‌های هدف',
    description: 'تیم میدانی باید استقرار را از یک پروژه سنگین به یک فرآیند چند‌روزه تبدیل کند.',
    level: 'TEAM',
    owner: 'account-exec',
    department: 'sales',
    team: 'field',
    parent: 'sales-growth',
    confidence: 6,
    keyResults: [
      {
        title: 'استقرار موفق در ۲۵ دامداری بالای ۵۰۰ رأس',
        metricType: 'INCREASE',
        startValue: 3,
        currentValue: 14,
        targetValue: 25,
        unit: 'دامداری',
        weight: 2,
        confidence: 6,
        owner: 'account-exec',
        initiatives: [
          { title: 'تدوین چک‌لیست استاندارد استقرار', owner: 'account-exec', status: 'DONE' },
          {
            title: 'آموزش ۵ کارشناس میدانی جدید',
            owner: 'sales-lead',
            status: 'IN_PROGRESS',
            dueInDays: 20,
          },
          {
            title: 'راه‌اندازی پشتیبانی تلفنی روزهای شیردهی',
            owner: 'account-exec',
            status: 'BLOCKED',
            dueInDays: 15,
          },
        ],
      },
      {
        title: 'رسیدن به رضایت ۹۰٪ از فرآیند استقرار',
        metricType: 'INCREASE',
        startValue: 62,
        currentValue: 79,
        targetValue: 90,
        unit: '٪',
        confidence: 7,
        owner: 'account-exec',
      },
    ],
  },

  // -------------------------------------------------------------- marketing
  {
    key: 'marketing-demand',
    title: 'ساخت جریان پایدار تقاضا از بازار دامداری',
    description: 'نیوماو باید پیش از تماس فروش، در ذهن دامدار به‌عنوان مرجع شناخته شده باشد.',
    level: 'DEPARTMENT',
    owner: 'marketing-lead',
    department: 'marketing',
    parent: 'market-leader',
    confidence: 7,
    keyResults: [
      {
        title: 'تولید ۶۰۰ سرنخ واجد شرایط',
        metricType: 'INCREASE',
        startValue: 90,
        currentValue: 372,
        targetValue: 600,
        unit: 'سرنخ',
        weight: 2,
        confidence: 7,
        owner: 'marketing-lead',
      },
      {
        title: 'کاهش هزینه جذب هر سرنخ از ۴۵۰ به ۲۰۰ هزار تومان',
        metricType: 'DECREASE',
        startValue: 450,
        currentValue: 296,
        targetValue: 200,
        unit: 'هزار تومان',
        confidence: 6,
        owner: 'marketing-lead',
      },
      {
        title: 'انتشار ۲۴ محتوای تخصصی دامپروری',
        metricType: 'INCREASE',
        startValue: 0,
        currentValue: 15,
        targetValue: 24,
        unit: 'محتوا',
        confidence: 8,
        owner: 'content',
        initiatives: [
          { title: 'تقویم محتوایی سه‌ماهه', owner: 'content', status: 'DONE' },
          {
            title: 'مجموعه ویدئویی «مدیریت شیردهی»',
            owner: 'content',
            status: 'IN_PROGRESS',
            dueInDays: 25,
          },
          {
            title: 'همکاری با ۳ دامپزشک شناخته‌شده',
            owner: 'marketing-lead',
            status: 'NOT_STARTED',
            dueInDays: 40,
          },
        ],
      },
    ],
  },

  // ------------------------------------------------------------ engineering
  {
    key: 'engineering-scale',
    title: 'آماده‌سازی پلتفرم برای ده برابر شدن مقیاس',
    description:
      'زیرساختی که بتواند ۱۰۰ دامداری و میلیون‌ها رکورد را بدون افت کیفیت سرویس تحمل کند.',
    level: 'DEPARTMENT',
    owner: 'eng-lead',
    department: 'engineering',
    parent: 'market-leader',
    confidence: 8,
    rollupMode: 'KEY_RESULTS_AND_CHILDREN',
    keyResults: [
      {
        title: 'پردازش ۱ میلیون رکورد شیردهی',
        metricType: 'INCREASE',
        startValue: 120000,
        currentValue: 640000,
        targetValue: 1000000,
        unit: 'رکورد',
        weight: 2,
        confidence: 8,
        owner: 'backend',
      },
      {
        title: 'کاهش زمان پاسخ API از ۸۵۰ به ۲۵۰ میلی‌ثانیه',
        metricType: 'DECREASE',
        startValue: 850,
        currentValue: 470,
        targetValue: 250,
        unit: 'میلی‌ثانیه',
        weight: 2,
        confidence: 7,
        owner: 'backend',
      },
      {
        title: 'رسیدن به پایداری ۹۹٫۹٪ سرویس',
        metricType: 'INCREASE',
        startValue: 98.2,
        currentValue: 99.4,
        targetValue: 99.9,
        unit: '٪',
        confidence: 8,
        owner: 'eng-lead',
      },
      {
        title: 'کاهش نرخ خطای سرویس از ۳٫۵٪ به ۰٫۵٪',
        metricType: 'DECREASE',
        startValue: 3.5,
        currentValue: 1.2,
        targetValue: 0.5,
        unit: '٪',
        confidence: 7,
        owner: 'backend',
      },
    ],
  },
  {
    key: 'mobile-launch',
    title: 'انتشار اپلیکیشن موبایل دامدار',
    description: 'دامدار باید بتواند کنار جایگاه شیردوشی، بدون کامپیوتر، رکورد ثبت کند.',
    level: 'TEAM',
    owner: 'mobile-dev',
    department: 'engineering',
    team: 'mobile',
    parent: 'engineering-scale',
    confidence: 5,
    keyResults: [
      {
        title: 'انتشار نسخه ۱٫۰ در کافه‌بازار',
        metricType: 'BINARY',
        startValue: 0,
        currentValue: 0,
        targetValue: 1,
        weight: 2,
        confidence: 5,
        owner: 'mobile-dev',
        initiatives: [
          {
            title: 'تکمیل جریان ثبت رکورد آفلاین',
            owner: 'mobile-dev',
            status: 'IN_PROGRESS',
            dueInDays: 18,
          },
          {
            title: 'رفع ۱۲ باگ بحرانی نسخه بتا',
            owner: 'mobile-dev',
            status: 'IN_PROGRESS',
            dueInDays: 10,
          },
          {
            title: 'آماده‌سازی صفحه فروشگاه و اسکرین‌شات‌ها',
            owner: 'content',
            status: 'NOT_STARTED',
            dueInDays: 35,
          },
        ],
      },
      {
        title: 'رسیدن به ۲۰۰ نصب فعال در ماه اول',
        metricType: 'INCREASE',
        startValue: 0,
        currentValue: 0,
        targetValue: 200,
        unit: 'نصب',
        confidence: 4,
        owner: 'mobile-dev',
      },
      {
        title: 'تکمیل ۴ مرحله آماده‌سازی انتشار',
        metricType: 'MILESTONE',
        startValue: 0,
        currentValue: 2,
        targetValue: 4,
        unit: 'مرحله',
        confidence: 6,
        owner: 'mobile-dev',
      },
    ],
  },
  {
    key: 'platform-reliability',
    title: 'حذف بدهی فنی بحرانی سرویس‌های هسته',
    level: 'TEAM',
    description: 'کاهش ریسک عملیاتی پیش از ورود مشتریان بزرگ.',
    owner: 'backend',
    department: 'engineering',
    team: 'platform',
    parent: 'engineering-scale',
    confidence: 7,
    keyResults: [
      {
        title: 'افزایش پوشش تست از ۳۴٪ به ۸۰٪',
        metricType: 'INCREASE',
        startValue: 34,
        currentValue: 61,
        targetValue: 80,
        unit: '٪',
        confidence: 7,
        owner: 'backend',
      },
      {
        title: 'کاهش زمان استقرار از ۴۵ به ۱۰ دقیقه',
        metricType: 'DECREASE',
        startValue: 45,
        currentValue: 22,
        targetValue: 10,
        unit: 'دقیقه',
        confidence: 8,
        owner: 'backend',
      },
    ],
  },

  // ------------------------------------------------------------- individual
  {
    key: 'individual-elham',
    title: 'تبدیل شدن به مرجع فنی بینایی ماشین دام در تیم',
    description: 'هدف فردی برای رشد تخصصی و انتقال دانش.',
    level: 'INDIVIDUAL',
    owner: 'ml-engineer',
    department: 'ai',
    team: 'vision',
    parent: 'vision-dataset',
    confidence: 8,
    keyResults: [
      {
        title: 'انتشار ۳ مستند فنی داخلی',
        metricType: 'INCREASE',
        startValue: 0,
        currentValue: 2,
        targetValue: 3,
        unit: 'مستند',
        confidence: 9,
        owner: 'ml-engineer',
      },
      {
        title: 'برگزاری ۶ جلسه هم‌آموزی تیمی',
        metricType: 'INCREASE',
        startValue: 0,
        currentValue: 4,
        targetValue: 6,
        unit: 'جلسه',
        confidence: 8,
        owner: 'ml-engineer',
      },
    ],
  },
  {
    key: 'individual-mohsen',
    title: 'رسیدن به سهم پایدار از جذب دامداری‌های جدید',
    level: 'INDIVIDUAL',
    description: 'هدف فردی کارشناس فروش برای سهم مشخص از هدف دپارتمان.',
    owner: 'account-exec',
    department: 'sales',
    team: 'field',
    parent: 'field-deployment',
    confidence: 6,
    keyResults: [
      {
        title: 'بستن ۲۵ قرارداد جدید',
        metricType: 'INCREASE',
        startValue: 0,
        currentValue: 13,
        targetValue: 25,
        unit: 'قرارداد',
        confidence: 6,
        owner: 'account-exec',
      },
      {
        title: 'تماس با ۳۰۰ سرنخ واجد شرایط',
        metricType: 'INCREASE',
        startValue: 0,
        currentValue: 186,
        targetValue: 300,
        unit: 'تماس',
        confidence: 7,
        owner: 'account-exec',
      },
    ],
  },
]

/** Realistic weekly check-in narratives, cycled through the seeded history. */
export const CHECK_IN_NOTES = [
  {
    note: 'روند این هفته مطابق برنامه پیش رفت و چند مورد باقیمانده در حال بررسی است.',
    blockers: null,
    nextActions: 'ادامه اجرای برنامه هفته و بازبینی در جلسه بعدی.',
  },
  {
    note: 'پیشرفت داشتیم اما کمتر از چیزی که انتظار داشتیم.',
    blockers: 'تأخیر در قیف فروش و دیر پاسخ دادن دو دامداری بزرگ.',
    nextActions: 'تماس با ۲۰ سرنخ جدید و پیگیری مستقیم دو دامداری معطل‌مانده.',
  },
  {
    note: 'هفته خوبی بود؛ دو مورد از موانع قبلی برطرف شد.',
    blockers: null,
    nextActions: 'تمرکز روی موارد باقیمانده و آماده‌سازی گزارش ماهانه.',
  },
  {
    note: 'به دلیل تعطیلات، ظرفیت تیم کمتر از حد معمول بود.',
    blockers: 'کمبود نیروی میدانی در هفته جاری.',
    nextActions: 'جبران عقب‌ماندگی در هفته آینده با افزایش ظرفیت.',
  },
  {
    note: 'کیفیت خروجی بهتر از هدف بود و بازخورد کاربران مثبت است.',
    blockers: null,
    nextActions: 'مستندسازی تغییرات و اشتراک‌گذاری با سایر تیم‌ها.',
  },
  {
    note: 'یک مسئله فنی غیرمنتظره باعث توقف موقت شد.',
    blockers: 'ناسازگاری نسخه سرویس شناسایی با داده‌های دو دامداری جدید.',
    nextActions: 'رفع ناسازگاری تا پایان هفته و اجرای مجدد پردازش.',
  },
]

export const SEED_COMMENTS = [
  'اگر روند فعلی ادامه پیدا کند تا پایان کوارتر به هدف می‌رسیم.',
  'پیشنهاد می‌کنم برای هفته آینده یک جلسه هماهنگی با تیم فروش بگذاریم.',
  'عدد این هفته با گزارش مالی هم‌خوانی دارد؛ ممنون از پیگیری.',
  'به نظر می‌رسد این مورد به ظرفیت بیشتری نیاز دارد. در جلسه هفتگی مطرح می‌کنم.',
  'نتیجه تست کاربردپذیری را در جلسه محصول مرور کردیم و تغییرات اعمال شد.',
]
