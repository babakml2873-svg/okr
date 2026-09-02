'use client'

import { MoreVertical, Pencil, Plus, Trash2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { toast } from 'sonner'

import { KeyResultForm } from '@/components/okr/key-result-form'
import {
  ObjectiveForm,
  type ObjectiveFormOptions,
  type ObjectiveFormValues,
} from '@/components/okr/objective-form'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { archiveObjectiveAction } from '@/server/actions/okr'

/** Edit / delete / add-key-result controls on the objective detail page. */
export function ObjectiveActions({
  objectiveId,
  formOptions,
  initialValues,
  owners,
  canEdit,
  canDelete,
  canAddKeyResult,
}: {
  objectiveId: string
  formOptions: ObjectiveFormOptions
  initialValues: Partial<ObjectiveFormValues>
  owners: { id: string; name: string }[]
  canEdit: boolean
  canDelete: boolean
  canAddKeyResult: boolean
}) {
  const router = useRouter()
  const [editOpen, setEditOpen] = useState(false)
  const [keyResultOpen, setKeyResultOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  function archive() {
    if (
      !confirm(
        'این هدف حذف شود؟ نتایج کلیدی و تاریخچه آن حفظ می‌شوند اما هدف از فهرست خارج می‌شود.',
      )
    ) {
      return
    }
    startTransition(async () => {
      const result = await archiveObjectiveAction(objectiveId)
      if (result.ok) {
        toast.success('هدف حذف شد')
        router.push('/objectives')
      } else {
        toast.error(result.error)
      }
    })
  }

  return (
    <>
      {canAddKeyResult && (
        <Button onClick={() => setKeyResultOpen(true)}>
          <Plus className="size-4" />
          نتیجه کلیدی
        </Button>
      )}

      {(canEdit || canDelete) && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon" aria-label="عملیات بیشتر">
              <MoreVertical className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {canEdit && (
              <DropdownMenuItem onClick={() => setEditOpen(true)}>
                <Pencil className="size-4" />
                ویرایش هدف
              </DropdownMenuItem>
            )}
            {canDelete && (
              <DropdownMenuItem
                onClick={archive}
                disabled={isPending}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="size-4" />
                حذف هدف
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      {editOpen && (
        <ObjectiveForm
          open={editOpen}
          onOpenChange={setEditOpen}
          options={formOptions}
          initialValues={initialValues}
        />
      )}

      {keyResultOpen && (
        <KeyResultForm
          open={keyResultOpen}
          onOpenChange={setKeyResultOpen}
          objectiveId={objectiveId}
          owners={owners}
        />
      )}
    </>
  )
}
