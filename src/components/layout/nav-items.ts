import {
  BarChart3,
  ClipboardCheck,
  FileText,
  GitBranch,
  LayoutDashboard,
  Settings,
  Target,
  TrendingUp,
  User,
  Users,
} from 'lucide-react'

export interface NavItem {
  href: string
  label: string
  icon: typeof Target
  /** Section heading this item sits under in the sidebar. */
  group: 'main' | 'okr' | 'insight' | 'system'
}

export const NAV_ITEMS: NavItem[] = [
  { href: '/dashboard', label: 'داشبورد', icon: LayoutDashboard, group: 'main' },
  { href: '/objectives', label: 'اهداف', icon: Target, group: 'okr' },
  { href: '/key-results', label: 'نتایج کلیدی', icon: TrendingUp, group: 'okr' },
  { href: '/my-okrs', label: 'OKRهای من', icon: User, group: 'okr' },
  { href: '/team-okrs', label: 'OKRهای تیم', icon: Users, group: 'okr' },
  { href: '/alignment', label: 'هم‌راستایی', icon: GitBranch, group: 'okr' },
  { href: '/reviews', label: 'بازبینی‌ها', icon: ClipboardCheck, group: 'insight' },
  { href: '/reports', label: 'گزارش‌ها', icon: FileText, group: 'insight' },
  { href: '/search', label: 'جست‌وجو', icon: BarChart3, group: 'insight' },
  { href: '/settings/profile', label: 'تنظیمات', icon: Settings, group: 'system' },
]

export const NAV_GROUP_LABELS: Record<NavItem['group'], string> = {
  main: '',
  okr: 'مدیریت OKR',
  insight: 'تحلیل و بازبینی',
  system: 'سیستم',
}
