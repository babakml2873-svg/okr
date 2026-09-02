import { cn } from '@/lib/utils'

import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar'

/** First letters of the first two words — works for Persian names. */
function initials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0] ?? '')
    .join('')
}

export function UserAvatar({
  user,
  size = 'md',
  className,
}: {
  user: { name: string; avatarUrl?: string | null }
  size?: 'sm' | 'md' | 'lg'
  className?: string
}) {
  return (
    <Avatar
      className={cn(
        size === 'sm' && 'size-6',
        size === 'md' && 'size-8',
        size === 'lg' && 'size-10',
        className,
      )}
    >
      {user.avatarUrl && <AvatarImage src={user.avatarUrl} alt={user.name} />}
      <AvatarFallback className={size === 'sm' ? 'text-[10px]' : undefined}>
        {initials(user.name)}
      </AvatarFallback>
    </Avatar>
  )
}

/** Avatar plus name, the standard owner chip used in lists and tables. */
export function UserChip({
  user,
  subtitle,
  size = 'sm',
  className,
}: {
  user: { name: string; avatarUrl?: string | null; jobTitle?: string | null }
  subtitle?: string | null
  size?: 'sm' | 'md'
  className?: string
}) {
  return (
    <span className={cn('inline-flex items-center gap-2', className)}>
      <UserAvatar user={user} size={size} />
      <span className="min-w-0">
        <span className="block truncate text-sm">{user.name}</span>
        {(subtitle ?? user.jobTitle) && (
          <span className="text-muted-foreground block truncate text-xs">
            {subtitle ?? user.jobTitle}
          </span>
        )}
      </span>
    </span>
  )
}
