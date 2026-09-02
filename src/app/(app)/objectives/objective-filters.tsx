import { FilterBar } from '@/components/shared/filter-bar'
import { HEALTH_LABELS, OBJECTIVE_LEVEL_LABELS, OBJECTIVE_STATUS_LABELS } from '@/lib/okr'

export interface OkrFilterOptions {
  quarters: { id: string; label: string }[]
  departments: { id: string; name: string }[]
  owners: { id: string; name: string }[]
}

/** The filter row shared by the objectives, key-results and team pages. */
export function OkrFilterBar({
  options,
  include = ['quarterId', 'departmentId', 'ownerId', 'level', 'status', 'health'],
  searchPlaceholder,
}: {
  options: OkrFilterOptions
  include?: string[]
  searchPlaceholder?: string
}) {
  const all = [
    {
      key: 'quarterId',
      label: 'کوارتر',
      allLabel: 'همه کوارترها',
      options: options.quarters.map((quarter) => ({ value: quarter.id, label: quarter.label })),
    },
    {
      key: 'departmentId',
      label: 'دپارتمان',
      allLabel: 'همه دپارتمان‌ها',
      options: options.departments.map((department) => ({
        value: department.id,
        label: department.name,
      })),
    },
    {
      key: 'ownerId',
      label: 'مالک',
      allLabel: 'همه مالکان',
      options: options.owners.map((owner) => ({ value: owner.id, label: owner.name })),
    },
    {
      key: 'level',
      label: 'سطح',
      allLabel: 'همه سطوح',
      options: Object.entries(OBJECTIVE_LEVEL_LABELS).map(([value, label]) => ({ value, label })),
    },
    {
      key: 'status',
      label: 'وضعیت',
      allLabel: 'همه وضعیت‌ها',
      options: Object.entries(OBJECTIVE_STATUS_LABELS).map(([value, label]) => ({ value, label })),
    },
    {
      key: 'health',
      label: 'سلامت',
      allLabel: 'همه',
      options: Object.entries(HEALTH_LABELS).map(([value, label]) => ({ value, label })),
    },
  ]

  return (
    <FilterBar
      filters={all.filter((filter) => include.includes(filter.key))}
      searchPlaceholder={searchPlaceholder ?? 'جست‌وجو در عنوان و توضیحات…'}
    />
  )
}
