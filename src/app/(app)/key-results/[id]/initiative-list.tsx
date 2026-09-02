'use client'

import { Loader2, Plus, Trash2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { toast } from 'sonner'

import { UserAvatar } from '@/components/shared/user-avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { formatDueDistance } from '@/lib/date'
import { INITIATIVE_STATUS_LABELS } from '@/lib/okr'
import {
  createInitiativeAction,
  deleteInitiativeAction,
  updateInitiativeAction,
} from '@/server/actions/okr'

type InitiativeStatus = keyof typeof INITIATIVE_STATUS_LABELS

const STATUS_VARIANT: Record<
  InitiativeStatus,
  'muted' | 'info' | 'success' | 'danger' | 'secondary'
> = {
  NOT_STARTED: 'muted',
  IN_PROGRESS: 'info',
  DONE: 'success',
  BLOCKED: 'danger',
  CANCELLED: 'secondary',
}

interface InitiativeItem {
  id: string
  title: string
  description: string | null
  status: InitiativeStatus
  dueDate: Date | null
  ownerId: string
  owner: { id: string; name: string; avatarUrl: string | null }
}

/**
 * Initiatives under a key result — the concrete work items. When the key
 * result tracks them, changing a status recomputes its progress server-side.
 */
export function InitiativeList({
  keyResultId,
  initiatives,
  owners,
  canManage,
  autoTracked,
}: {
  keyResultId: string
  initiatives: InitiativeItem[]
  owners: { id: string; name: string }[]
  canManage: boolean
  autoTracked: boolean
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [ownerId, setOwnerId] = useState(owners[0]?.id ?? '')
  const [dueDate, setDueDate] = useState('')

  function create(event: React.FormEvent) {
    event.preventDefault()
    startTransition(async () => {
      const result = await createInitiativeAction({
        keyResultId,
        title,
        description,
        ownerId,
        status: 'NOT_STARTED',
        dueDate: dueDate || null,
      })
      if (result.ok) {
        toast.success('اقدام اضافه شد')
        setOpen(false)
        setTitle('')
        setDescription('')
        setDueDate('')
        router.refresh()
      } else {
        toast.error(result.error)
      }
    })
  }

  function changeStatus(id: string, status: InitiativeStatus) {
    startTransition(async () => {
      const result = await updateInitiativeAction({ id, status })
      if (result.ok) router.refresh()
      else toast.error(result.error)
    })
  }

  function remove(id: string) {
    startTransition(async () => {
      const result = await deleteInitiativeAction(id)
      if (result.ok) router.refresh()
      else toast.error(result.error)
    })
  }

  return (
    <div className="space-y-3">
      {autoTracked && (
        <p className="bg-info/10 text-info rounded-md px-3 py-2 text-xs">
          پیشرفت این نتیجه کلیدی به‌صورت خودکار از تعداد اقدامات «انجام‌شده» محاسبه می‌شود.
        </p>
      )}

      {initiatives.length === 0 ? (
        <p className="text-muted-foreground py-6 text-center text-sm">هنوز اقدامی تعریف نشده است</p>
      ) : (
        <ul className="divide-border divide-y">
          {initiatives.map((initiative) => (
            <li key={initiative.id} className="flex items-center gap-3 py-2.5">
              <UserAvatar user={initiative.owner} size="sm" />

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm">{initiative.title}</p>
                <p className="text-muted-foreground text-xs">
                  {initiative.owner.name}
                  {initiative.dueDate && ` · ${formatDueDistance(new Date(initiative.dueDate))}`}
                </p>
              </div>

              {canManage ? (
                <Select
                  value={initiative.status}
                  onValueChange={(value) => changeStatus(initiative.id, value as InitiativeStatus)}
                >
                  <SelectTrigger className="h-8 w-36" aria-label={`وضعیت ${initiative.title}`}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(INITIATIVE_STATUS_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Badge variant={STATUS_VARIANT[initiative.status]}>
                  {INITIATIVE_STATUS_LABELS[initiative.status]}
                </Badge>
              )}

              {canManage && (
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="text-muted-foreground hover:text-destructive"
                  onClick={() => remove(initiative.id)}
                  disabled={isPending}
                  aria-label={`حذف ${initiative.title}`}
                >
                  <Trash2 className="size-3.5" />
                </Button>
              )}
            </li>
          ))}
        </ul>
      )}

      {canManage && (
        <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
          <Plus className="size-3.5" />
          افزودن اقدام
        </Button>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>افزودن اقدام</DialogTitle>
          </DialogHeader>
          <form onSubmit={create} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="initiative-title">عنوان</Label>
              <Input
                id="initiative-title"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="مثال: راه‌اندازی کمپین بازاریابی"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="initiative-description">توضیحات</Label>
              <Textarea
                id="initiative-description"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                rows={2}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>مسئول</Label>
                <Select value={ownerId} onValueChange={setOwnerId}>
                  <SelectTrigger aria-label="مسئول اقدام">
                    <SelectValue placeholder="انتخاب مسئول" />
                  </SelectTrigger>
                  <SelectContent>
                    {owners.map((owner) => (
                      <SelectItem key={owner.id} value={owner.id}>
                        {owner.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="initiative-due">مهلت</Label>
                <Input
                  id="initiative-due"
                  type="date"
                  value={dueDate}
                  onChange={(event) => setDueDate(event.target.value)}
                  dir="ltr"
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="size-4 animate-spin" />}
                افزودن
              </Button>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                انصراف
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
