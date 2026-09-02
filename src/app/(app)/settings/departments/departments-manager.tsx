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
import {
  createDepartmentAction,
  deleteDepartmentAction,
  updateDepartmentAction,
} from '@/server/actions/workspace'

interface Department {
  id: string
  name: string
  description: string | null
  color: string
  headId: string | null
  teamCount: number
  memberCount: number
  objectiveCount: number
}

const EMPTY = { id: '', name: '', description: '', color: '#4f46e5', headId: 'none' }

export function DepartmentsManager({
  departments,
  owners,
}: {
  departments: Department[]
  owners: { id: string; name: string }[]
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(EMPTY)

  function openCreate() {
    setForm(EMPTY)
    setOpen(true)
  }

  function openEdit(department: Department) {
    setForm({
      id: department.id,
      name: department.name,
      description: department.description ?? '',
      color: department.color,
      headId: department.headId ?? 'none',
    })
    setOpen(true)
  }

  function submit(event: React.FormEvent) {
    event.preventDefault()
    startTransition(async () => {
      const payload = {
        name: form.name,
        description: form.description,
        color: form.color,
        headId: form.headId === 'none' ? null : form.headId,
      }
      const result = form.id
        ? await updateDepartmentAction(form.id, payload)
        : await createDepartmentAction(payload)

      if (result.ok) {
        toast.success(form.id ? 'دپارتمان به‌روزرسانی شد' : 'دپارتمان ساخته شد')
        setOpen(false)
        router.refresh()
      } else {
        toast.error(result.error)
      }
    })
  }

  function remove(department: Department) {
    if (!confirm(`دپارتمان «${department.name}» حذف شود؟`)) return
    startTransition(async () => {
      const result = await deleteDepartmentAction(department.id)
      if (result.ok) {
        toast.success('دپارتمان حذف شد')
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
            <CardTitle>دپارتمان‌ها</CardTitle>
            <CardDescription>
              دپارتمان‌ها ساختار سازمان و دسترسی مدیران را تعیین می‌کنند.
            </CardDescription>
          </div>
          <Button onClick={openCreate}>
            <Plus className="size-4" />
            دپارتمان جدید
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>نام</TableHead>
                <TableHead>مدیر</TableHead>
                <TableHead>تیم‌ها</TableHead>
                <TableHead>اعضا</TableHead>
                <TableHead>اهداف</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {departments.map((department) => (
                <TableRow key={department.id}>
                  <TableCell>
                    <span className="flex items-center gap-2">
                      <span
                        className="size-3 shrink-0 rounded-full"
                        style={{ backgroundColor: department.color }}
                      />
                      <span className="font-medium">{department.name}</span>
                    </span>
                  </TableCell>
                  <TableCell className="text-sm">
                    {owners.find((owner) => owner.id === department.headId)?.name ?? '—'}
                  </TableCell>
                  <TableCell>
                    <Num value={department.teamCount} />
                  </TableCell>
                  <TableCell>
                    <Num value={department.memberCount} />
                  </TableCell>
                  <TableCell>
                    <Num value={department.objectiveCount} />
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => openEdit(department)}
                        aria-label={`ویرایش ${department.name}`}
                      >
                        <Pencil className="size-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        className="text-muted-foreground hover:text-destructive"
                        onClick={() => remove(department)}
                        disabled={isPending}
                        aria-label={`حذف ${department.name}`}
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{form.id ? 'ویرایش دپارتمان' : 'دپارتمان جدید'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="department-name">نام</Label>
              <Input
                id="department-name"
                value={form.name}
                onChange={(event) => setForm({ ...form, name: event.target.value })}
                placeholder="مثال: مهندسی"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="department-description">توضیحات</Label>
              <Textarea
                id="department-description"
                value={form.description}
                onChange={(event) => setForm({ ...form, description: event.target.value })}
                rows={2}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="department-color">رنگ</Label>
                <Input
                  id="department-color"
                  type="color"
                  value={form.color}
                  onChange={(event) => setForm({ ...form, color: event.target.value })}
                  className="h-9 p-1"
                />
              </div>
              <div className="space-y-2">
                <Label>مدیر دپارتمان</Label>
                <Select
                  value={form.headId}
                  onValueChange={(value) => setForm({ ...form, headId: value })}
                >
                  <SelectTrigger aria-label="مدیر دپارتمان">
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
                {form.id ? 'ذخیره' : 'ساخت دپارتمان'}
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
