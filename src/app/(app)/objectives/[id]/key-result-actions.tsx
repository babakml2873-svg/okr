'use client'

import { ClipboardCheck, MoreVertical, Pencil, Trash2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { toast } from 'sonner'

import { CheckInDialog, type CheckInTarget } from '@/components/okr/check-in-dialog'
import {
  KeyResultForm,
  keyResultToFormValues,
  type KeyResultFormValues,
} from '@/components/okr/key-result-form'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { deleteKeyResultAction } from '@/server/actions/okr'

/** Per-row controls: check in, edit, delete. */
export function KeyResultActions({
  keyResult,
  owners,
  canUpdate,
  canDelete,
  canCheckIn,
  compact = true,
}: {
  keyResult: Parameters<typeof keyResultToFormValues>[0] & CheckInTarget
  owners: { id: string; name: string }[]
  canUpdate: boolean
  canDelete: boolean
  canCheckIn: boolean
  compact?: boolean
}) {
  const router = useRouter()
  const [checkInOpen, setCheckInOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  function remove() {
    if (!confirm(`نتیجه کلیدی «${keyResult.title}» حذف شود؟ این عملیات برگشت‌پذیر نیست.`)) return
    startTransition(async () => {
      const result = await deleteKeyResultAction(keyResult.id)
      if (result.ok) {
        toast.success('نتیجه کلیدی حذف شد')
        router.refresh()
      } else {
        toast.error(result.error)
      }
    })
  }

  const initialValues: Partial<KeyResultFormValues> = keyResultToFormValues(keyResult)

  return (
    <>
      {canCheckIn && (
        <Button
          variant={compact ? 'ghost' : 'default'}
          size={compact ? 'icon-sm' : 'sm'}
          onClick={() => setCheckInOpen(true)}
          aria-label="ثبت بازبینی"
          title="ثبت بازبینی"
        >
          <ClipboardCheck className="size-4" />
          {!compact && 'ثبت بازبینی'}
        </Button>
      )}

      {(canUpdate || canDelete) && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon-sm" aria-label="عملیات نتیجه کلیدی">
              <MoreVertical className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {canUpdate && (
              <DropdownMenuItem onClick={() => setEditOpen(true)}>
                <Pencil className="size-4" />
                ویرایش
              </DropdownMenuItem>
            )}
            {canDelete && (
              <DropdownMenuItem
                onClick={remove}
                disabled={isPending}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="size-4" />
                حذف
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      {checkInOpen && (
        <CheckInDialog open={checkInOpen} onOpenChange={setCheckInOpen} keyResult={keyResult} />
      )}

      {editOpen && (
        <KeyResultForm
          open={editOpen}
          onOpenChange={setEditOpen}
          objectiveId={keyResult.objectiveId}
          owners={owners}
          initialValues={initialValues}
        />
      )}
    </>
  )
}
