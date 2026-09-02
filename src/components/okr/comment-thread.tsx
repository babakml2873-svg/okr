'use client'

import { Loader2, MessageSquare, Trash2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { toast } from 'sonner'

import { UserAvatar } from '@/components/shared/user-avatar'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { formatRelativeTime } from '@/lib/date'
import { createCommentAction, deleteCommentAction } from '@/server/actions/okr'

export interface CommentItem {
  id: string
  body: string
  createdAt: Date | string
  authorId: string
  author: { id: string; name: string; avatarUrl: string | null; jobTitle?: string | null }
}

export type CommentTargetKey = 'objectiveId' | 'keyResultId' | 'initiativeId' | 'checkInId'

/** Discussion under an objective, key result or initiative. */
export function CommentThread({
  comments,
  targetKey,
  targetId,
  currentUserId,
  canDeleteAny,
}: {
  comments: CommentItem[]
  targetKey: CommentTargetKey
  targetId: string
  currentUserId: string
  canDeleteAny: boolean
}) {
  const router = useRouter()
  const [body, setBody] = useState('')
  const [isPending, startTransition] = useTransition()

  function submit(event: React.FormEvent) {
    event.preventDefault()
    if (!body.trim()) return

    startTransition(async () => {
      const result = await createCommentAction({ body, [targetKey]: targetId })
      if (result.ok) {
        setBody('')
        router.refresh()
      } else {
        toast.error(result.error)
      }
    })
  }

  function remove(commentId: string) {
    startTransition(async () => {
      const result = await deleteCommentAction(commentId)
      if (result.ok) router.refresh()
      else toast.error(result.error)
    })
  }

  return (
    <div className="space-y-4">
      <form onSubmit={submit} className="space-y-2">
        <Textarea
          value={body}
          onChange={(event) => setBody(event.target.value)}
          placeholder="دیدگاه خود را بنویسید…"
          rows={2}
          aria-label="متن دیدگاه"
        />
        <div className="flex justify-start">
          <Button type="submit" size="sm" disabled={isPending || !body.trim()}>
            {isPending && <Loader2 className="size-3.5 animate-spin" />}
            ثبت دیدگاه
          </Button>
        </div>
      </form>

      {comments.length === 0 ? (
        <p className="text-muted-foreground flex items-center justify-center gap-2 py-6 text-sm">
          <MessageSquare className="size-4" />
          هنوز دیدگاهی ثبت نشده است
        </p>
      ) : (
        <ul className="space-y-4">
          {comments.map((comment) => (
            <li key={comment.id} className="flex gap-3">
              <UserAvatar user={comment.author} size="sm" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{comment.author.name}</span>
                  <span className="text-muted-foreground text-xs">
                    {formatRelativeTime(comment.createdAt)}
                  </span>
                  {(canDeleteAny || comment.authorId === currentUserId) && (
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      className="text-muted-foreground hover:text-destructive ms-auto"
                      onClick={() => remove(comment.id)}
                      disabled={isPending}
                      aria-label="حذف دیدگاه"
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  )}
                </div>
                <p className="mt-1 text-sm leading-relaxed whitespace-pre-wrap">{comment.body}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
