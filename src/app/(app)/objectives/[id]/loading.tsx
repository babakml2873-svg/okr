import { CardSkeleton, ListSkeleton } from '@/components/shared/states'
import { Skeleton } from '@/components/ui/skeleton'

export default function ObjectiveDetailLoading() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-4 w-48" />
      <Skeleton className="h-8 w-2/3" />
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-4">
          <CardSkeleton rows={1} />
          <ListSkeleton count={3} />
        </div>
        <CardSkeleton rows={5} />
      </div>
    </div>
  )
}
