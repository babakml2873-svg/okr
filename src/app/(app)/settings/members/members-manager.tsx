'use client'

import { Copy, Loader2, Trash2, UserPlus } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { toast } from 'sonner'

import { UserChip } from '@/components/shared/user-avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { formatDate } from '@/lib/date'
import type { Role } from '@/lib/auth/permissions'
import { ROLE_DESCRIPTIONS, ROLE_LABELS } from '@/lib/okr'
import {
  inviteMemberAction,
  revokeInvitationAction,
  updateMemberAction,
} from '@/server/actions/workspace'

type MembershipStatus = 'ACTIVE' | 'INVITED' | 'DISABLED'

const STATUS_LABELS: Record<MembershipStatus, string> = {
  ACTIVE: 'فعال',
  INVITED: 'دعوت‌شده',
  DISABLED: 'غیرفعال',
}

interface Member {
  id: string
  userId: string
  name: string
  email: string
  avatarUrl: string | null
  jobTitle: string | null
  role: Role
  status: MembershipStatus
  departmentId: string | null
  teamId: string | null
}

interface Invitation {
  id: string
  email: string
  role: Role
  token: string
  invitedBy: string
  expiresAt: Date
}

export function MembersManager({
  currentUserId,
  members,
  invitations,
  departments,
  teams,
}: {
  currentUserId: string
  members: Member[]
  invitations: Invitation[]
  departments: { id: string; name: string }[]
  teams: { id: string; name: string; departmentId: string }[]
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [inviteOpen, setInviteOpen] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<Role>('MEMBER')
  const [inviteDepartment, setInviteDepartment] = useState('none')
  const [lastInviteUrl, setLastInviteUrl] = useState<string | null>(null)

  function patchMember(member: Member, changes: Partial<Member>) {
    startTransition(async () => {
      const next = { ...member, ...changes }
      const result = await updateMemberAction({
        membershipId: member.id,
        role: next.role,
        departmentId: next.departmentId,
        teamId: next.teamId,
        status: next.status,
      })
      if (result.ok) {
        toast.success('دسترسی عضو به‌روزرسانی شد')
        router.refresh()
      } else {
        toast.error(result.error)
      }
    })
  }

  function invite(event: React.FormEvent) {
    event.preventDefault()
    startTransition(async () => {
      const result = await inviteMemberAction({
        email: inviteEmail,
        role: inviteRole,
        departmentId: inviteDepartment === 'none' ? null : inviteDepartment,
        teamId: null,
      })
      if (result.ok) {
        setLastInviteUrl(result.data.inviteUrl)
        setInviteEmail('')
        toast.success('دعوت‌نامه ساخته شد — لینک را برای کاربر بفرستید')
        router.refresh()
      } else {
        toast.error(result.error)
      }
    })
  }

  function copyInviteLink(token: string) {
    const url = `${window.location.origin}/register?invitation=${token}`
    void navigator.clipboard.writeText(url)
    toast.success('لینک دعوت کپی شد')
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex-row items-start justify-between">
          <div>
            <CardTitle>اعضای سازمان</CardTitle>
            <CardDescription>
              نقش هر عضو تعیین می‌کند چه چیزی را ببیند و چه چیزی را تغییر دهد.
            </CardDescription>
          </div>
          <Button onClick={() => setInviteOpen(true)}>
            <UserPlus className="size-4" />
            دعوت عضو
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>عضو</TableHead>
                <TableHead>نقش</TableHead>
                <TableHead>دپارتمان</TableHead>
                <TableHead>تیم</TableHead>
                <TableHead>وضعیت</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {members.map((member) => {
                const memberTeams = member.departmentId
                  ? teams.filter((team) => team.departmentId === member.departmentId)
                  : teams
                return (
                  <TableRow key={member.id}>
                    <TableCell>
                      <UserChip
                        user={{ name: member.name, avatarUrl: member.avatarUrl }}
                        subtitle={member.email}
                        size="md"
                      />
                    </TableCell>
                    <TableCell>
                      <Select
                        value={member.role}
                        onValueChange={(value) => patchMember(member, { role: value as Role })}
                        disabled={isPending}
                      >
                        <SelectTrigger className="h-8 w-36" aria-label={`نقش ${member.name}`}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {(Object.keys(ROLE_LABELS) as Role[]).map((role) => (
                            <SelectItem key={role} value={role}>
                              {ROLE_LABELS[role]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Select
                        value={member.departmentId ?? 'none'}
                        onValueChange={(value) =>
                          patchMember(member, {
                            departmentId: value === 'none' ? null : value,
                            teamId: null,
                          })
                        }
                        disabled={isPending}
                      >
                        <SelectTrigger className="h-8 w-36" aria-label={`دپارتمان ${member.name}`}>
                          <SelectValue placeholder="—" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">بدون دپارتمان</SelectItem>
                          {departments.map((department) => (
                            <SelectItem key={department.id} value={department.id}>
                              {department.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Select
                        value={member.teamId ?? 'none'}
                        onValueChange={(value) =>
                          patchMember(member, { teamId: value === 'none' ? null : value })
                        }
                        disabled={isPending}
                      >
                        <SelectTrigger className="h-8 w-32" aria-label={`تیم ${member.name}`}>
                          <SelectValue placeholder="—" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">بدون تیم</SelectItem>
                          {memberTeams.map((team) => (
                            <SelectItem key={team.id} value={team.id}>
                              {team.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      {member.userId === currentUserId ? (
                        <Badge variant="default">شما</Badge>
                      ) : (
                        <Select
                          value={member.status}
                          onValueChange={(value) =>
                            patchMember(member, { status: value as MembershipStatus })
                          }
                          disabled={isPending}
                        >
                          <SelectTrigger className="h-8 w-28" aria-label={`وضعیت ${member.name}`}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {(Object.keys(STATUS_LABELS) as MembershipStatus[]).map((status) => (
                              <SelectItem key={status} value={status}>
                                {STATUS_LABELS[status]}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {invitations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>دعوت‌نامه‌های در انتظار</CardTitle>
            <CardDescription>
              لینک دعوت را برای کاربر بفرستید تا حساب خود را بسازد و به سازمان بپیوندد.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ایمیل</TableHead>
                  <TableHead>نقش</TableHead>
                  <TableHead>دعوت‌کننده</TableHead>
                  <TableHead>انقضا</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {invitations.map((invitation) => (
                  <TableRow key={invitation.id}>
                    <TableCell dir="ltr" className="text-start text-sm">
                      {invitation.email}
                    </TableCell>
                    <TableCell>
                      <Badge variant="muted">{ROLE_LABELS[invitation.role]}</Badge>
                    </TableCell>
                    <TableCell className="text-sm">{invitation.invitedBy}</TableCell>
                    <TableCell className="text-sm">
                      {formatDate(invitation.expiresAt, 'JALALI', 'short')}
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => copyInviteLink(invitation.token)}
                          aria-label="کپی لینک دعوت"
                        >
                          <Copy className="size-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          className="text-muted-foreground hover:text-destructive"
                          disabled={isPending}
                          onClick={() =>
                            startTransition(async () => {
                              const result = await revokeInvitationAction(invitation.id)
                              if (result.ok) router.refresh()
                              else toast.error(result.error)
                            })
                          }
                          aria-label="لغو دعوت"
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
      )}

      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>دعوت عضو جدید</DialogTitle>
            <DialogDescription>{ROLE_DESCRIPTIONS[inviteRole]}</DialogDescription>
          </DialogHeader>

          <form onSubmit={invite} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="invite-email">ایمیل</Label>
              <Input
                id="invite-email"
                type="email"
                dir="ltr"
                value={inviteEmail}
                onChange={(event) => setInviteEmail(event.target.value)}
                placeholder="person@example.com"
                required
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>نقش</Label>
                <Select value={inviteRole} onValueChange={(value) => setInviteRole(value as Role)}>
                  <SelectTrigger aria-label="نقش دعوت">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(ROLE_LABELS) as Role[]).map((role) => (
                      <SelectItem key={role} value={role}>
                        {ROLE_LABELS[role]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>دپارتمان</Label>
                <Select value={inviteDepartment} onValueChange={setInviteDepartment}>
                  <SelectTrigger aria-label="دپارتمان دعوت">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">بدون دپارتمان</SelectItem>
                    {departments.map((department) => (
                      <SelectItem key={department.id} value={department.id}>
                        {department.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {lastInviteUrl && (
              <div className="bg-muted/50 space-y-1.5 rounded-md p-3">
                <p className="text-xs font-medium">لینک دعوت ساخته شد:</p>
                <code className="block truncate text-xs" dir="ltr">
                  {lastInviteUrl}
                </code>
              </div>
            )}

            <DialogFooter>
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="size-4 animate-spin" />}
                ساخت دعوت‌نامه
              </Button>
              <Button type="button" variant="outline" onClick={() => setInviteOpen(false)}>
                بستن
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
