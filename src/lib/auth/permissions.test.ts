import { describe, expect, it } from 'vitest'

import {
  can,
  creatableLevels,
  isAtLeast,
  PermissionError,
  requirePermission,
  type Actor,
} from './permissions'

const ORG = 'org-1'
const OTHER_ORG = 'org-2'

const admin: Actor = { userId: 'u-admin', organizationId: ORG, role: 'ADMIN' }
const executive: Actor = { userId: 'u-exec', organizationId: ORG, role: 'EXECUTIVE' }
const manager: Actor = {
  userId: 'u-manager',
  organizationId: ORG,
  role: 'MANAGER',
  departmentId: 'dept-sales',
  teamId: 'team-inside',
}
const member: Actor = {
  userId: 'u-member',
  organizationId: ORG,
  role: 'MEMBER',
  departmentId: 'dept-sales',
  teamId: 'team-inside',
}

const ownObjective = { organizationId: ORG, ownerId: 'u-member', level: 'INDIVIDUAL' as const }
const salesObjective = {
  organizationId: ORG,
  ownerId: 'someone-else',
  departmentId: 'dept-sales',
  level: 'DEPARTMENT' as const,
}
const engineeringObjective = {
  organizationId: ORG,
  ownerId: 'someone-else',
  departmentId: 'dept-eng',
  level: 'DEPARTMENT' as const,
}

describe('organization scoping', () => {
  it('denies everything on resources from another organization, even for admins', () => {
    const foreign = { organizationId: OTHER_ORG, ownerId: 'u-admin' }
    expect(can(admin, 'objective:view', foreign)).toBe(false)
    expect(can(admin, 'objective:update', foreign)).toBe(false)
    expect(can(admin, 'keyResult:checkIn', foreign)).toBe(false)
    expect(can(admin, 'report:export', foreign)).toBe(false)
  })
})

describe('ADMIN', () => {
  it('may administer the workspace', () => {
    expect(can(admin, 'organization:update')).toBe(true)
    expect(can(admin, 'organization:manage_members')).toBe(true)
    expect(can(admin, 'organization:manage_structure')).toBe(true)
    expect(can(admin, 'organization:manage_quarters')).toBe(true)
  })

  it('may edit and delete any OKR in the organization', () => {
    expect(can(admin, 'objective:update', engineeringObjective)).toBe(true)
    expect(can(admin, 'objective:delete', engineeringObjective)).toBe(true)
    expect(can(admin, 'keyResult:update', engineeringObjective)).toBe(true)
  })
})

describe('EXECUTIVE', () => {
  it('may not manage members or workspace settings', () => {
    expect(can(executive, 'organization:manage_members')).toBe(false)
    expect(can(executive, 'organization:update')).toBe(false)
  })

  it('may create company-level objectives', () => {
    expect(can(executive, 'objective:create', { organizationId: ORG, level: 'COMPANY' })).toBe(true)
  })

  it('may see and edit OKRs across departments', () => {
    expect(can(executive, 'objective:view', engineeringObjective)).toBe(true)
    expect(can(executive, 'objective:update', engineeringObjective)).toBe(true)
  })
})

describe('MANAGER', () => {
  it('may not create company-level objectives', () => {
    expect(can(manager, 'objective:create', { organizationId: ORG, level: 'COMPANY' })).toBe(false)
    expect(can(manager, 'objective:create', { organizationId: ORG, level: 'DEPARTMENT' })).toBe(
      true,
    )
  })

  it('may manage OKRs inside its own department', () => {
    expect(can(manager, 'objective:update', salesObjective)).toBe(true)
    expect(can(manager, 'objective:delete', salesObjective)).toBe(true)
    expect(can(manager, 'keyResult:update', salesObjective)).toBe(true)
  })

  it('may not manage another department’s OKRs', () => {
    expect(can(manager, 'objective:update', engineeringObjective)).toBe(false)
    expect(can(manager, 'keyResult:delete', engineeringObjective)).toBe(false)
  })

  it('may still read the whole organization', () => {
    expect(can(manager, 'objective:view', engineeringObjective)).toBe(true)
  })

  it('may manage OKRs it owns outside its department', () => {
    expect(
      can(manager, 'objective:update', { ...engineeringObjective, ownerId: 'u-manager' }),
    ).toBe(true)
  })

  it('may not manage members', () => {
    expect(can(manager, 'organization:manage_members')).toBe(false)
  })
})

describe('MEMBER', () => {
  it('may read everything in the organization', () => {
    expect(can(member, 'objective:view', engineeringObjective)).toBe(true)
    expect(can(member, 'report:view', engineeringObjective)).toBe(true)
  })

  it('may update and check in on key results it owns', () => {
    const ownKeyResult = { organizationId: ORG, ownerId: 'u-member' }
    expect(can(member, 'keyResult:update', ownKeyResult)).toBe(true)
    expect(can(member, 'keyResult:checkIn', ownKeyResult)).toBe(true)
  })

  it('may not update key results owned by someone else', () => {
    const otherKeyResult = { organizationId: ORG, ownerId: 'someone-else' }
    expect(can(member, 'keyResult:update', otherKeyResult)).toBe(false)
    expect(can(member, 'keyResult:checkIn', otherKeyResult)).toBe(false)
  })

  it('may create key results under an objective it owns', () => {
    expect(
      can(member, 'keyResult:create', { organizationId: ORG, parentOwnerId: 'u-member' }),
    ).toBe(true)
    expect(
      can(member, 'keyResult:create', { organizationId: ORG, parentOwnerId: 'someone-else' }),
    ).toBe(false)
  })

  it('may only create individual objectives for itself', () => {
    expect(
      can(member, 'objective:create', {
        organizationId: ORG,
        level: 'INDIVIDUAL',
        ownerId: 'u-member',
      }),
    ).toBe(true)
    expect(
      can(member, 'objective:create', {
        organizationId: ORG,
        level: 'INDIVIDUAL',
        ownerId: 'other',
      }),
    ).toBe(false)
    expect(can(member, 'objective:create', { organizationId: ORG, level: 'TEAM' })).toBe(false)
  })

  it('may edit its own objective but not delete anyone else’s', () => {
    expect(can(member, 'objective:update', ownObjective)).toBe(true)
    expect(can(member, 'objective:delete', ownObjective)).toBe(false)
    expect(can(member, 'objective:update', salesObjective)).toBe(false)
  })

  it('may always comment', () => {
    expect(can(member, 'comment:create', engineeringObjective)).toBe(true)
  })

  it('may delete only its own comments', () => {
    expect(can(member, 'comment:delete', { organizationId: ORG, ownerId: 'u-member' })).toBe(true)
    expect(can(member, 'comment:delete', { organizationId: ORG, ownerId: 'other' })).toBe(false)
  })

  it('may not administer anything', () => {
    expect(can(member, 'organization:manage_members')).toBe(false)
    expect(can(member, 'organization:manage_structure')).toBe(false)
  })
})

describe('isAtLeast', () => {
  it('orders roles from member to admin', () => {
    expect(isAtLeast('ADMIN', 'MANAGER')).toBe(true)
    expect(isAtLeast('MEMBER', 'MANAGER')).toBe(false)
    expect(isAtLeast('MANAGER', 'MANAGER')).toBe(true)
    expect(isAtLeast('EXECUTIVE', 'MANAGER')).toBe(true)
  })
})

describe('creatableLevels', () => {
  it('narrows the options as the role narrows', () => {
    expect(creatableLevels('ADMIN')).toHaveLength(4)
    expect(creatableLevels('MANAGER')).not.toContain('COMPANY')
    expect(creatableLevels('MEMBER')).toEqual(['INDIVIDUAL'])
  })
})

describe('requirePermission', () => {
  it('passes silently when allowed', () => {
    expect(() => requirePermission(admin, 'organization:update')).not.toThrow()
  })

  it('throws PermissionError when denied', () => {
    expect(() => requirePermission(member, 'organization:update')).toThrow(PermissionError)
  })
})
