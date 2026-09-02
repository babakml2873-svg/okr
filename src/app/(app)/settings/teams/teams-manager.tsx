'use client'

import { Loader2, Pencil, Plus, Trash2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { toast } from 'sonner'

import { Num } from '@/components/shared/num'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Textarea } from '@/components/ui/textarea'
import { createTeamAction, deleteTeamAction, updateTeamAction } from '@/server/actions/workspace'

interface Team {
  id: string
  name: string
  description: string | null
  departmentId: string
  departmentName: string
  leadId: string | null
  memberCount: number
  objectiveCount: number
}

export function TeamsManager({
  teams,
  departments,
  owners,
}: {
  teams: Team[]
  departments: { id: string; name: string }[]
  owners: { id: string; name: string }[]
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({
    id: '',
    name: '',
    description: '',
    departmentId: departments[0]?.id ?? '',
    leadId: 'none',
  })

  function openCreate() {
    setForm({
      id: '',
      name: '',
      description: '',
      departmentId: departments[0]?.id ?? '',
      leadId: 'none',
    })
    setOpen(true)
  }

  function openEdit(team: Team) {
    setForm({
      id: team.id,
      name: team.name,
      description: team.description ?? '',
      departmentId: team.departmentId,
      leadId: team.leadId ?? 'none',
    })
    setOpen(true)
  }

  function submit(event: React.FormEvent) {
    event.preventDefault()
    startTransition(async () => {
      const payload = {
        name: form.name,
        description: form.description,
        departmentId: form.departmentId,
        leadId: form.leadId === 'none' ? null : form.leadId,
      }
      const result = form.id
        ? await updateTeamAction(form.id, payload)
        : await createTeamAction(payload)

      if (result.ok) {
        toast.success(form.id ? 'تیم به‌روزرسانی شد' : 'تیم ساخته شد')
        setOpen(false)
        router.refresh()
      } else {
        toast.error(result.error)
      }
    })
  }

  function remove(team: Team) {
    if (!confirm(`تیم «${team.name}» حذف شود؟`)) return
    startTransition(async () => {
      const result = await deleteTeamAction(team.id)
      if (result.ok) {
        toast.success('تیم حذف شد')
        router.refresh()
      } else {
        toast.error(result.error)
      }
    })
  }

  return (
    <>
      <Card>
        <CardHeader className="flex-row items-start justify-between">
          <div>
            <CardTitle>تیم‌ها</CardTitle>
            <CardDescription>هر تیم زیرمجموعه یک دپارتمان است.</CardDescription>
          </div>
          <Button onClick={openCreate} disabled={departments.length === 0}>
            <Plus className="size-4" />
            تیم جدید
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          {departments.length === 0 ? (
            <p className="text-muted-foreground p-6 text-center text-sm">
              ابتدا یک دپارتمان بسازید تا بتوانید تیم تعریف کنید.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>نام تیم</TableHead>
                  <TableHead>دپارتمان</TableHead>
                  <TableHead>سرپرست</TableHead>
                  <TableHead>اعضا</TableHead>
                  <TableHead>اهداف</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {teams.map((team) => (
                  <TableRow key={team.id}>
                    <TableCell className="font-medium">{team.name}</TableCell>
                    <TableCell className="text-sm">{team.departmentName}</TableCell>
                    <TableCell className="text-sm">
                      {owners.find((owner) => owner.id === team.leadId)?.name ?? '—'}
                    </TableCell>
                    <TableCell>
                      <Num value={team.memberCount} />
                    </TableCell>
                    <TableCell>
                      <Num value={team.objectiveCount} />
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => openEdit(team)}
                          aria-label={`ویرایش ${team.name}`}
                        >
                          <Pencil className="size-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          className="text-muted-foreground hover:text-destructive"
                          onClick={() => remove(team)}
                          disabled={isPending}
                          aria-label={`حذف ${team.name}`}
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{form.id ? 'ویرایش تیم' : 'تیم جدید'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="team-name">نام تیم</Label>
              <Input
                id="team-name"
                value={form.name}
                onChange={(event) => setForm({ ...form, name: event.target.value })}
                placeholder="مثال: تیم پلتفرم"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="team-description">توضیحات</Label>
              <Textarea
                id="team-description"
                value={form.description}
                onChange={(event) => setForm({ ...form, description: event.target.value })}
                rows={2}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>دپارتمان</Label>
                <Select
                  value={form.departmentId}
                  onValueChange={(value) => setForm({ ...form, departmentId: value })}
                >
                  <SelectTrigger aria-label="دپارتمان تیم">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map((department) => (
                      <SelectItem key={department.id} value={department.id}>
                        {department.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>سرپرست تیم</Label>
                <Select
                  value={form.leadId}
                  onValueChange={(value) => setForm({ ...form, leadId: value })}
                >
                  <SelectTrigger aria-label="سرپرست تیم">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">تعیین‌نشده</SelectItem>
                    {owners.map((owner) => (
                      <SelectItem key={owner.id} value={owner.id}>
                        {owner.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="size-4 animate-spin" />}
                {form.id ? 'ذخیره' : 'ساخت تیم'}
              </Button>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                انصراف
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
