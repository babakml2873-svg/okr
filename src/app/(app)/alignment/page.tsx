import type { Metadata } from 'next'
import { GitBranch } from 'lucide-react'

import { AlignmentTree } from '@/components/okr/alignment-tree'
import { PageHeader } from '@/components/shared/page-header'
import { EmptyState } from '@/components/shared/states'
import { okrFilterSchema } from '@/lib/validation/schemas'
import { requireSessionContext } from '@/server/context'
import { getAlignmentTree } from '@/server/services/objectives'
import {
  getDefaultQuarter,
  listDepartments,
  listOwnerOptions,
  listQuarters,
} from '@/server/services/workspace'

import { OkrFilterBar } from '../objectives/objective-filters'

export const metadata: Metadata = { title: 'هم‌راستایی' }

export default async function AlignmentPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>
}) {
  const context = await requireSessionContext()
  const params = await searchParams

  const [quarters, departments, owners, defaultQuarter] = await Promise.all([
    listQuarters(context),
    listDepartments(context),
    listOwnerOptions(context),
    getDefaultQuarter(context),
  ])

  const filter = okrFilterSchema.parse({
    ...params,
    quarterId: params.quarterId ?? defaultQuarter?.id,
  })
  const tree = await getAlignmentTree(context, filter)

  return (
    <div className="space-y-6">
      <PageHeader
        title="درخت هم‌راستایی"
        description="مسیر از هدف شرکت تا اهداف دپارتمان، تیم و افراد — تا ببینید هر کار به کدام استراتژی وصل است."
      />

      <OkrFilterBar
        options={{
          quarters: quarters.map((q) => ({ id: q.id, label: q.label })),
          departments: departments.map((d) => ({ id: d.id, name: d.name })),
          owners: owners.map((o) => ({ id: o.id, name: o.name })),
        }}
        include={['quarterId', 'departmentId', 'ownerId', 'health']}
      />

      {tree.length === 0 ? (
        <EmptyState
          icon={GitBranch}
          title="هدفی برای نمایش وجود ندارد"
          description="با ایجاد هدف شرکت و هم‌راستا کردن اهداف دپارتمان با آن، این درخت شکل می‌گیرد."
          action={{ label: 'ایجاد هدف', href: '/objectives?new=1' }}
        />
      ) : (
        <AlignmentTree nodes={tree} />
      )}
    </div>
  )
}
