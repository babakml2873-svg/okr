/**
 * Role-based access control.
 *
 * Pure, data-only rules so they can be unit-tested exhaustively and reused on
 * both sides of the wire: the server calls `requirePermission` before every
 * mutation, the UI calls `can` to decide what to render. The UI check is a
 * convenience — the server check is the one that matters.
 */

export type Role = 'ADMIN' | 'EXECUTIVE' | 'MANAGER' | 'MEMBER'
export type ObjectiveLevel = 'COMPANY' | 'DEPARTMENT' | 'TEAM' | 'INDIVIDUAL'

/** Who is asking — the caller's membership in the organization at hand. */
export interface Actor {
  userId: string
  organizationId: string
  role: Role
  departmentId?: string | null
  teamId?: string | null
}

/** What is being acted upon. All fields optional; rules use what they need. */
export interface ResourceContext {
  organizationId: string
  ownerId?: string | null
  departmentId?: string | null
  teamId?: string | null
  level?: ObjectiveLevel | null
  /** For key results and initiatives: the owner of the parent objective. */
  parentOwnerId?: string | null
}

export type Permission =
  // organization administration
  | 'organization:update'
  | 'organization:manage_members'
  | 'organization:manage_structure'
  | 'organization:manage_quarters'
  // objectives
  | 'objective:view'
  | 'objective:create'
  | 'objective:update'
  | 'objective:delete'
  // key results
  | 'keyResult:create'
  | 'keyResult:update'
  | 'keyResult:delete'
  | 'keyResult:checkIn'
  // initiatives
  | 'initiative:create'
  | 'initiative:update'
  | 'initiative:delete'
  // collaboration
  | 'comment:create'
  | 'comment:delete'
  // reporting
  | 'report:view'
  | 'report:export'

const ROLE_RANK: Record<Role, number> = { MEMBER: 0, MANAGER: 1, EXECUTIVE: 2, ADMIN: 3 }

export function isAtLeast(role: Role, minimum: Role): boolean {
  return ROLE_RANK[role] >= ROLE_RANK[minimum]
}

function sameOrg(actor: Actor, resource?: ResourceContext): boolean {
  return !resource || actor.organizationId === resource.organizationId
}

function isOwner(actor: Actor, resource?: ResourceContext): boolean {
  if (!resource) return false
  return resource.ownerId === actor.userId || resource.parentOwnerId === actor.userId
}

/**
 * A manager's remit: their own department, their own team, and anything owned
 * by them. A manager with no department assignment manages only their own OKRs.
 */
function inManagerScope(actor: Actor, resource?: ResourceContext): boolean {
  if (!resource) return false
  if (isOwner(actor, resource)) return true
  if (actor.departmentId && resource.departmentId === actor.departmentId) return true
  if (actor.teamId && resource.teamId === actor.teamId) return true
  return false
}

/**
 * Can `actor` perform `permission` on `resource`?
 *
 * Everything is scoped to a single organization first: a membership never
 * grants anything outside its own organization, whatever the role.
 */
export function can(actor: Actor, permission: Permission, resource?: ResourceContext): boolean {
  if (!sameOrg(actor, resource)) return false

  const { role } = actor

  switch (permission) {
    // ---- organization administration: admins only --------------------------
    case 'organization:update':
    case 'organization:manage_members':
    case 'organization:manage_structure':
    case 'organization:manage_quarters':
      return role === 'ADMIN'

    // ---- reading: everyone in the organization -----------------------------
    case 'objective:view':
    case 'report:view':
    case 'comment:create':
      return true

    case 'report:export':
      return isAtLeast(role, 'MEMBER')

    // ---- objectives --------------------------------------------------------
    case 'objective:create': {
      if (role === 'ADMIN') return true
      const level = resource?.level ?? 'INDIVIDUAL'
      if (role === 'EXECUTIVE') return true
      if (role === 'MANAGER') return level !== 'COMPANY'
      // Members may only create objectives for themselves.
      return level === 'INDIVIDUAL' && (!resource?.ownerId || resource.ownerId === actor.userId)
    }

    case 'objective:update': {
      if (role === 'ADMIN') return true
      if (role === 'EXECUTIVE') return true
      if (role === 'MANAGER') return inManagerScope(actor, resource)
      return isOwner(actor, resource)
    }

    case 'objective:delete': {
      if (role === 'ADMIN') return true
      if (role === 'EXECUTIVE') return resource?.level === 'COMPANY' || isOwner(actor, resource)
      if (role === 'MANAGER') return inManagerScope(actor, resource)
      return false
    }

    // ---- key results -------------------------------------------------------
    case 'keyResult:create':
    case 'keyResult:delete': {
      if (role === 'ADMIN' || role === 'EXECUTIVE') return true
      if (role === 'MANAGER') return inManagerScope(actor, resource)
      // Members can shape the key results of objectives they own.
      return resource?.parentOwnerId === actor.userId
    }

    case 'keyResult:update':
    case 'keyResult:checkIn': {
      if (role === 'ADMIN' || role === 'EXECUTIVE') return true
      if (role === 'MANAGER') return inManagerScope(actor, resource)
      // The core member permission: update the key results assigned to you.
      return isOwner(actor, resource)
    }

    // ---- initiatives -------------------------------------------------------
    case 'initiative:create':
    case 'initiative:update':
    case 'initiative:delete': {
      if (role === 'ADMIN' || role === 'EXECUTIVE') return true
      if (role === 'MANAGER') return inManagerScope(actor, resource)
      return isOwner(actor, resource)
    }

    // ---- collaboration -----------------------------------------------------
    case 'comment:delete':
      return role === 'ADMIN' || isOwner(actor, resource)

    default:
      return false
  }
}

/** Thrown by `requirePermission`; mapped to HTTP 403 at the API boundary. */
export class PermissionError extends Error {
  readonly permission: Permission

  constructor(permission: Permission, message = 'شما دسترسی لازم برای این عملیات را ندارید.') {
    super(message)
    this.name = 'PermissionError'
    this.permission = permission
  }
}

/** Assert a permission, throwing `PermissionError` when it is not granted. */
export function requirePermission(
  actor: Actor,
  permission: Permission,
  resource?: ResourceContext,
): void {
  if (!can(actor, permission, resource)) throw new PermissionError(permission)
}

/** Highest objective level this actor is allowed to create. */
export function maxCreatableLevel(role: Role): ObjectiveLevel {
  if (role === 'ADMIN' || role === 'EXECUTIVE') return 'COMPANY'
  if (role === 'MANAGER') return 'DEPARTMENT'
  return 'INDIVIDUAL'
}

/** Objective levels offered in the "new objective" form for this role. */
export function creatableLevels(role: Role): ObjectiveLevel[] {
  switch (role) {
    case 'ADMIN':
    case 'EXECUTIVE':
      return ['COMPANY', 'DEPARTMENT', 'TEAM', 'INDIVIDUAL']
    case 'MANAGER':
      return ['DEPARTMENT', 'TEAM', 'INDIVIDUAL']
    default:
      return ['INDIVIDUAL']
  }
}
