/**
 * Seeds the Newmaaw demo workspace.
 *
 * Idempotent: it wipes the demo organization's rows and rebuilds them, so it
 * can be re-run at any time without duplicating data. Other organizations in
 * the database are left untouched.
 *
 * Run with: npm run db:seed
 */

import { type Prisma } from '@prisma/client'
import bcrypt from 'bcryptjs'

import {
  buildYearQuarters,
  currentJalaliYear,
  quarterStatusFor,
  weekBoundsFor,
} from '../src/lib/date'
import {
  calculateHealth,
  calculateKeyResultProgress,
  rollupObjectiveTree,
  weightedAverage,
} from '../src/lib/okr'
import { createPrismaClient } from '../src/server/prisma-client'
import {
  CHECK_IN_NOTES,
  DEMO_PASSWORD,
  DEPARTMENTS,
  OBJECTIVES,
  ORGANIZATION,
  SEED_COMMENTS,
  TEAMS,
  USERS,
  type SeedKeyResult,
} from './seed-data'

// Uses the same connection strategy as the app (TCP, or the Neon adapter).
const prisma = createPrismaClient()

const DAY = 24 * 60 * 60 * 1000

/** Deterministic pseudo-random generator, so re-seeding gives the same demo. */
function makeRandom(seed: number) {
  let state = seed
  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296
    return state / 4294967296
  }
}
const random = makeRandom(20260902)

function pick<T>(items: readonly T[], index: number): T {
  return items[index % items.length]!
}

async function main() {
  const now = new Date()
  console.log('🌱 در حال ساخت داده‌های نمونه نیوماو…\n')

  // ---------------------------------------------------------------- reset
  const existing = await prisma.organization.findUnique({ where: { slug: ORGANIZATION.slug } })
  if (existing) {
    // Cascades clear departments, teams, quarters, objectives, key results,
    // initiatives, check-ins, comments, notifications, snapshots and activity.
    await prisma.organization.delete({ where: { id: existing.id } })
    console.log('  ↺ سازمان قبلی پاک شد')
  }

  // -------------------------------------------------------- organization
  const organization = await prisma.organization.create({
    data: { name: ORGANIZATION.name, slug: ORGANIZATION.slug, calendarType: 'JALALI' },
  })

  // --------------------------------------------------------------- users
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10)
  const userIdByKey = new Map<string, string>()

  for (const seedUser of USERS) {
    const user = await prisma.user.upsert({
      where: { email: seedUser.email },
      create: {
        email: seedUser.email,
        name: seedUser.name,
        jobTitle: seedUser.jobTitle,
        passwordHash,
      },
      update: { name: seedUser.name, jobTitle: seedUser.jobTitle, passwordHash },
    })
    userIdByKey.set(seedUser.key, user.id)
  }
  const userId = (key: string) => {
    const id = userIdByKey.get(key)
    if (!id) throw new Error(`کاربر ناشناخته در داده نمونه: ${key}`)
    return id
  }

  // --------------------------------------------------------- departments
  const departmentIdByKey = new Map<string, string>()
  for (const seedDepartment of DEPARTMENTS) {
    const head = USERS.find(
      (user) => user.department === seedDepartment.key && user.role === 'MANAGER',
    )
    const department = await prisma.department.create({
      data: {
        organizationId: organization.id,
        name: seedDepartment.name,
        description: seedDepartment.description,
        color: seedDepartment.color,
        headId: head ? userId(head.key) : null,
      },
    })
    departmentIdByKey.set(seedDepartment.key, department.id)
  }

  // --------------------------------------------------------------- teams
  const teamIdByKey = new Map<string, string>()
  for (const seedTeam of TEAMS) {
    const lead = USERS.find((user) => user.team === seedTeam.key && user.role === 'MANAGER')
    const team = await prisma.team.create({
      data: {
        organizationId: organization.id,
        departmentId: departmentIdByKey.get(seedTeam.department)!,
        name: seedTeam.name,
        description: seedTeam.description,
        leadId: lead ? userId(lead.key) : null,
      },
    })
    teamIdByKey.set(seedTeam.key, team.id)
  }

  // --------------------------------------------------------- memberships
  for (const seedUser of USERS) {
    await prisma.membership.create({
      data: {
        userId: userId(seedUser.key),
        organizationId: organization.id,
        role: seedUser.role,
        status: 'ACTIVE',
        departmentId: seedUser.department ? departmentIdByKey.get(seedUser.department) : null,
        teamId: seedUser.team ? teamIdByKey.get(seedUser.team) : null,
      },
    })
  }

  // ------------------------------------------------------------ quarters
  const baseYear = currentJalaliYear(now)
  const quarterDefinitions = [
    ...buildYearQuarters(baseYear - 1, 'JALALI'),
    ...buildYearQuarters(baseYear, 'JALALI'),
  ]

  const quarters = []
  for (const definition of quarterDefinitions) {
    quarters.push(
      await prisma.quarter.create({
        data: {
          organizationId: organization.id,
          year: definition.year,
          quarterNumber: definition.quarterNumber,
          label: definition.label,
          startDate: definition.startDate,
          endDate: definition.endDate,
          status: quarterStatusFor(definition, now),
        },
      }),
    )
  }

  const activeQuarter =
    quarters.find((quarter) => quarter.status === 'ACTIVE') ?? quarters[quarters.length - 1]!
  const closedQuarters = quarters.filter((quarter) => quarter.status === 'CLOSED').slice(-3)

  // ----------------------------------------------------------- objectives
  const objectiveIdByKey = new Map<string, string>()
  const keyResultRecords: { id: string; seed: SeedKeyResult; objectiveKey: string }[] = []

  for (const [index, seedObjective] of OBJECTIVES.entries()) {
    const objective = await prisma.objective.create({
      data: {
        organizationId: organization.id,
        title: seedObjective.title,
        description: seedObjective.description,
        level: seedObjective.level,
        status: 'ACTIVE',
        ownerId: userId(seedObjective.owner),
        createdById: userId('ceo'),
        departmentId: seedObjective.department
          ? departmentIdByKey.get(seedObjective.department)
          : null,
        teamId: seedObjective.team ? teamIdByKey.get(seedObjective.team) : null,
        quarterId: activeQuarter.id,
        parentId: seedObjective.parent ? objectiveIdByKey.get(seedObjective.parent) : null,
        confidence: seedObjective.confidence,
        rollupMode: seedObjective.rollupMode ?? 'KEY_RESULTS_ONLY',
        sortOrder: index,
      },
    })
    objectiveIdByKey.set(seedObjective.key, objective.id)

    for (const [keyResultIndex, seedKeyResult] of seedObjective.keyResults.entries()) {
      const progress = calculateKeyResultProgress(seedKeyResult)
      const keyResult = await prisma.keyResult.create({
        data: {
          organizationId: organization.id,
          objectiveId: objective.id,
          title: seedKeyResult.title,
          description: seedKeyResult.description ?? null,
          metricType: seedKeyResult.metricType,
          startValue: seedKeyResult.startValue,
          currentValue: seedKeyResult.currentValue,
          targetValue: seedKeyResult.targetValue,
          unit: seedKeyResult.unit ?? null,
          weight: seedKeyResult.weight ?? 1,
          confidence: seedKeyResult.confidence,
          progress,
          health: calculateHealth({
            progress,
            confidence: seedKeyResult.confidence,
            periodStart: activeQuarter.startDate,
            periodEnd: activeQuarter.endDate,
            now,
          }),
          status: progress >= 100 ? 'COMPLETED' : 'ACTIVE',
          completedAt: progress >= 100 ? now : null,
          ownerId: userId(seedKeyResult.owner),
          autoUpdateFromInitiatives: seedKeyResult.autoUpdateFromInitiatives ?? false,
          dueDate: activeQuarter.endDate,
          sortOrder: keyResultIndex,
        },
      })

      keyResultRecords.push({
        id: keyResult.id,
        seed: seedKeyResult,
        objectiveKey: seedObjective.key,
      })

      for (const [initiativeIndex, seedInitiative] of (seedKeyResult.initiatives ?? []).entries()) {
        await prisma.initiative.create({
          data: {
            organizationId: organization.id,
            keyResultId: keyResult.id,
            title: seedInitiative.title,
            ownerId: userId(seedInitiative.owner),
            status: seedInitiative.status,
            dueDate: seedInitiative.dueInDays
              ? new Date(now.getTime() + seedInitiative.dueInDays * DAY)
              : null,
            completedAt:
              seedInitiative.status === 'DONE' ? new Date(now.getTime() - 5 * DAY) : null,
            sortOrder: initiativeIndex,
          },
        })
      }
    }
  }

  // Milestone key results that track initiatives need their count applied.
  for (const record of keyResultRecords) {
    if (!record.seed.autoUpdateFromInitiatives) continue
    const done = await prisma.initiative.count({
      where: { keyResultId: record.id, status: 'DONE' },
    })
    const progress = calculateKeyResultProgress({ ...record.seed, currentValue: done })
    await prisma.keyResult.update({
      where: { id: record.id },
      data: { currentValue: done, progress },
    })
  }

  // ------------------------------------------------ check-in history
  //
  // Twelve weeks of weekly check-ins per key result, interpolating from the
  // start value up to today's value so the trend charts have real shape.
  const WEEKS = 12
  let checkInCount = 0
  let snapshotCount = 0

  const allKeyResults = await prisma.keyResult.findMany({
    where: { organizationId: organization.id },
    select: {
      id: true,
      metricType: true,
      startValue: true,
      currentValue: true,
      targetValue: true,
      confidence: true,
      ownerId: true,
    },
  })

  const snapshotRows: Prisma.ProgressSnapshotCreateManyInput[] = []
  const checkInRows: Prisma.CheckInCreateManyInput[] = []

  for (const keyResult of allKeyResults) {
    let previousValue = keyResult.startValue
    let previousProgress = calculateKeyResultProgress({ ...keyResult, currentValue: previousValue })

    for (let week = WEEKS - 1; week >= 0; week -= 1) {
      const at = new Date(now.getTime() - week * 7 * DAY)
      if (at < activeQuarter.startDate) continue

      // Ease toward the current value, with a little week-to-week noise.
      const share = (WEEKS - week) / WEEKS
      const eased = share ** 1.15
      const noise = (random() - 0.5) * 0.06
      const value =
        keyResult.metricType === 'BINARY'
          ? keyResult.currentValue
          : keyResult.startValue +
            (keyResult.currentValue - keyResult.startValue) *
              Math.min(1, Math.max(0, eased + noise))

      const progress = calculateKeyResultProgress({ ...keyResult, currentValue: value })
      const confidence = Math.max(
        3,
        Math.min(10, Math.round(keyResult.confidence + (random() - 0.5) * 2)),
      )
      const health = calculateHealth({
        progress,
        confidence,
        periodStart: activeQuarter.startDate,
        periodEnd: activeQuarter.endDate,
        now: at,
      })
      const narrative = pick(CHECK_IN_NOTES, checkInCount)
      const { start: periodStart, end: periodEnd } = weekBoundsFor(at)

      checkInRows.push({
        organizationId: organization.id,
        keyResultId: keyResult.id,
        authorId: keyResult.ownerId,
        cadence: 'WEEKLY',
        previousValue,
        newValue: Math.round(value * 100) / 100,
        previousProgress,
        newProgress: progress,
        confidence,
        health,
        note: narrative.note,
        blockers: narrative.blockers,
        nextActions: narrative.nextActions,
        periodStart,
        periodEnd,
        createdAt: at,
        updatedAt: at,
      })

      snapshotRows.push({
        organizationId: organization.id,
        subjectType: 'KEY_RESULT',
        subjectId: keyResult.id,
        progress,
        confidence,
        health,
        capturedOn: new Date(Date.UTC(at.getUTCFullYear(), at.getUTCMonth(), at.getUTCDate())),
      })

      previousValue = Math.round(value * 100) / 100
      previousProgress = progress
      checkInCount += 1
    }

    await prisma.keyResult.update({
      where: { id: keyResult.id },
      data: { lastCheckInAt: new Date(now.getTime() - Math.floor(random() * 9) * DAY) },
    })
  }

  await prisma.checkIn.createMany({ data: checkInRows })
  await prisma.progressSnapshot.createMany({ data: snapshotRows, skipDuplicates: true })
  snapshotCount += snapshotRows.length

  // -------------------------------------------- objective roll-up + history
  const objectives = await prisma.objective.findMany({
    where: { organizationId: organization.id },
    select: {
      id: true,
      parentId: true,
      rollupMode: true,
      confidence: true,
      keyResults: { select: { progress: true, weight: true } },
    },
  })

  const childrenOf = new Map<string, string[]>()
  for (const objective of objectives) {
    if (!objective.parentId) continue
    childrenOf.set(objective.parentId, [
      ...(childrenOf.get(objective.parentId) ?? []),
      objective.id,
    ])
  }

  const progressById = rollupObjectiveTree(
    objectives.map((objective) => ({
      id: objective.id,
      rollupMode: objective.rollupMode,
      keyResults: objective.keyResults,
      childIds: childrenOf.get(objective.id) ?? [],
    })),
  )

  const objectiveSnapshots: Prisma.ProgressSnapshotCreateManyInput[] = []

  for (const objective of objectives) {
    const progress = progressById.get(objective.id) ?? 0
    const health = calculateHealth({
      progress,
      confidence: objective.confidence,
      periodStart: activeQuarter.startDate,
      periodEnd: activeQuarter.endDate,
      now,
    })

    await prisma.objective.update({
      where: { id: objective.id },
      data: {
        progress,
        health,
        ...(progress >= 100 ? { status: 'COMPLETED' as const, completedAt: now } : {}),
      },
    })

    // Back-fill a matching objective trend so the dashboard chart is populated.
    for (let week = WEEKS - 1; week >= 0; week -= 1) {
      const at = new Date(now.getTime() - week * 7 * DAY)
      if (at < activeQuarter.startDate) continue
      const share = (WEEKS - week) / WEEKS
      const historic = Math.round(progress * share ** 1.15 * 100) / 100
      objectiveSnapshots.push({
        organizationId: organization.id,
        subjectType: 'OBJECTIVE',
        subjectId: objective.id,
        progress: historic,
        confidence: objective.confidence,
        health: calculateHealth({
          progress: historic,
          confidence: objective.confidence,
          periodStart: activeQuarter.startDate,
          periodEnd: activeQuarter.endDate,
          now: at,
        }),
        capturedOn: new Date(Date.UTC(at.getUTCFullYear(), at.getUTCMonth(), at.getUTCDate())),
      })
    }
  }

  await prisma.progressSnapshot.createMany({ data: objectiveSnapshots, skipDuplicates: true })
  snapshotCount += objectiveSnapshots.length

  // ------------------------------------------ closed quarters for trends
  //
  // A few finished objectives in past periods so the quarter-performance chart
  // has something to compare against. These get *real* key results rather than
  // a hard-coded progress value: the roll-up recomputes every objective from
  // its key results, so an objective with none would legitimately resolve to
  // 0% and silently erase the history the chart is built on.
  for (const [index, quarter] of closedQuarters.entries()) {
    for (const seedObjective of OBJECTIVES.slice(0, 4)) {
      // Each past quarter lands a little higher than the one before it.
      const targetProgress = Math.min(96, 62 + index * 9 + Math.round(random() * 10))

      const objective = await prisma.objective.create({
        data: {
          organizationId: organization.id,
          title: `${seedObjective.title} (${quarter.label})`,
          description: seedObjective.description,
          level: seedObjective.level,
          status: 'COMPLETED',
          health: 'ON_TRACK',
          confidence: 8,
          ownerId: userId(seedObjective.owner),
          createdById: userId('ceo'),
          departmentId: seedObjective.department
            ? departmentIdByKey.get(seedObjective.department)
            : null,
          quarterId: quarter.id,
          completedAt: quarter.endDate,
          createdAt: quarter.startDate,
        },
      })

      // Reuse the objective's real key-result shapes, with each one landing
      // near the intended progress so the weighted roll-up reproduces it.
      const historicKeyResults = seedObjective.keyResults.slice(0, 3)
      const rolledUp: { progress: number; weight: number }[] = []

      for (const [keyResultIndex, seedKeyResult] of historicKeyResults.entries()) {
        const ratio = Math.min(1, Math.max(0, targetProgress / 100 + (random() - 0.5) * 0.12))
        const currentValue =
          seedKeyResult.metricType === 'BINARY'
            ? ratio >= 0.6
              ? seedKeyResult.targetValue
              : seedKeyResult.startValue
            : Math.round(
                (seedKeyResult.startValue +
                  (seedKeyResult.targetValue - seedKeyResult.startValue) * ratio) *
                  100,
              ) / 100

        const progress = calculateKeyResultProgress({ ...seedKeyResult, currentValue })

        await prisma.keyResult.create({
          data: {
            organizationId: organization.id,
            objectiveId: objective.id,
            title: seedKeyResult.title,
            metricType: seedKeyResult.metricType,
            startValue: seedKeyResult.startValue,
            currentValue,
            targetValue: seedKeyResult.targetValue,
            unit: seedKeyResult.unit ?? null,
            weight: seedKeyResult.weight ?? 1,
            confidence: seedKeyResult.confidence,
            progress,
            health: 'ON_TRACK',
            status: progress >= 100 ? 'COMPLETED' : 'ACTIVE',
            ownerId: userId(seedKeyResult.owner),
            dueDate: quarter.endDate,
            sortOrder: keyResultIndex,
            lastCheckInAt: quarter.endDate,
            createdAt: quarter.startDate,
          },
        })

        rolledUp.push({ progress, weight: seedKeyResult.weight ?? 1 })
      }

      // Store the value the roll-up engine itself produces, so recomputing the
      // organization later is a no-op rather than a change.
      await prisma.objective.update({
        where: { id: objective.id },
        data: { progress: weightedAverage(rolledUp) },
      })
    }
  }

  // -------------------------------------------------------------- comments
  const commentTargets = await prisma.objective.findMany({
    where: { organizationId: organization.id, quarterId: activeQuarter.id },
    select: { id: true, ownerId: true },
    take: 8,
  })

  for (const [index, target] of commentTargets.entries()) {
    await prisma.comment.create({
      data: {
        organizationId: organization.id,
        authorId: index % 2 === 0 ? userId('ceo') : userId('coo'),
        objectiveId: target.id,
        body: pick(SEED_COMMENTS, index),
        createdAt: new Date(now.getTime() - (index + 1) * 2 * DAY),
      },
    })
  }

  const recentCheckIns = await prisma.checkIn.findMany({
    where: { organizationId: organization.id },
    orderBy: { createdAt: 'desc' },
    select: { id: true },
    take: 6,
  })
  for (const [index, checkIn] of recentCheckIns.entries()) {
    await prisma.comment.create({
      data: {
        organizationId: organization.id,
        authorId: userId('coo'),
        checkInId: checkIn.id,
        body: pick(SEED_COMMENTS, index + 2),
        createdAt: new Date(now.getTime() - index * DAY),
      },
    })
  }

  // --------------------------------------------------------- activity feed
  const activityObjectives = await prisma.objective.findMany({
    where: { organizationId: organization.id, quarterId: activeQuarter.id },
    select: { id: true, title: true, ownerId: true },
  })

  await prisma.activityLog.createMany({
    data: activityObjectives.flatMap((objective, index) => [
      {
        organizationId: organization.id,
        actorId: objective.ownerId,
        action: 'CREATED' as const,
        entityType: 'OBJECTIVE' as const,
        entityId: objective.id,
        summary: `هدف «${objective.title}» را ایجاد کرد`,
        createdAt: new Date(now.getTime() - (index + 6) * DAY),
      },
      {
        organizationId: organization.id,
        actorId: objective.ownerId,
        action: 'CHECKED_IN' as const,
        entityType: 'OBJECTIVE' as const,
        entityId: objective.id,
        summary: `برای «${objective.title}» بازبینی هفتگی ثبت کرد`,
        createdAt: new Date(now.getTime() - index * DAY - 3 * 60 * 60 * 1000),
      },
    ]),
  })

  // -------------------------------------------------------- notifications
  const atRisk = await prisma.keyResult.findMany({
    where: { organizationId: organization.id, health: { in: ['AT_RISK', 'OFF_TRACK'] } },
    select: {
      id: true,
      title: true,
      ownerId: true,
      objective: { select: { title: true, ownerId: true } },
    },
    take: 8,
  })

  await prisma.notification.createMany({
    data: atRisk.map((keyResult, index) => ({
      organizationId: organization.id,
      userId: keyResult.objective.ownerId,
      type: 'AT_RISK' as const,
      title: 'یک نتیجه کلیدی در معرض ریسک است',
      body: `${keyResult.title} — ${keyResult.objective.title}`,
      link: `/key-results/${keyResult.id}`,
      entityType: 'KEY_RESULT' as const,
      entityId: keyResult.id,
      createdAt: new Date(now.getTime() - index * 6 * 60 * 60 * 1000),
      readAt: index > 2 ? new Date(now.getTime() - index * DAY) : null,
    })),
  })

  // ------------------------------------------------------------- summary
  const counts = await Promise.all([
    prisma.objective.count({ where: { organizationId: organization.id } }),
    prisma.keyResult.count({ where: { organizationId: organization.id } }),
    prisma.initiative.count({ where: { organizationId: organization.id } }),
    prisma.checkIn.count({ where: { organizationId: organization.id } }),
    prisma.comment.count({ where: { organizationId: organization.id } }),
  ])

  console.log(`  ✓ سازمان: ${organization.name} (${organization.slug})`)
  console.log(
    `  ✓ دپارتمان‌ها: ${DEPARTMENTS.length} · تیم‌ها: ${TEAMS.length} · اعضا: ${USERS.length}`,
  )
  console.log(`  ✓ کوارترها: ${quarters.length} (جاری: ${activeQuarter.label})`)
  console.log(`  ✓ اهداف: ${counts[0]} · نتایج کلیدی: ${counts[1]} · اقدامات: ${counts[2]}`)
  console.log(
    `  ✓ بازبینی‌ها: ${counts[3]} · دیدگاه‌ها: ${counts[4]} · نمونه‌های پیشرفت: ${snapshotCount}`,
  )

  console.log('\n👤 حساب‌های نمونه (رمز عبور همه: %s):', DEMO_PASSWORD)
  for (const user of USERS) {
    console.log(`   ${user.email.padEnd(24)} ${user.role.padEnd(10)} ${user.name}`)
  }
  console.log('')
}

main()
  .catch((error) => {
    console.error('✗ خطا در ساخت داده‌های نمونه:', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
