'use server'

import { revalidatePath } from 'next/cache'

import { requireSessionContext } from '@/server/context'
import { createCheckIn } from '@/server/services/check-ins'
import { createComment, deleteComment } from '@/server/services/comments'
import { createInitiative, deleteInitiative, updateInitiative } from '@/server/services/initiatives'
import { createKeyResult, deleteKeyResult, updateKeyResult } from '@/server/services/key-results'
import { markNotificationsRead } from '@/server/services/notifications'
import { archiveObjective, createObjective, updateObjective } from '@/server/services/objectives'

import { runAction, type ActionResult } from './utils'

/** Refresh every surface that shows OKR numbers after a write. */
function revalidateOkrSurfaces() {
  for (const path of [
    '/dashboard',
    '/objectives',
    '/key-results',
    '/my-okrs',
    '/team-okrs',
    '/alignment',
    '/reviews',
    '/reports',
  ]) {
    revalidatePath(path, 'page')
  }
  revalidatePath('/objectives/[id]', 'page')
  revalidatePath('/key-results/[id]', 'page')
}

export async function createObjectiveAction(input: unknown): Promise<ActionResult<{ id: string }>> {
  const context = await requireSessionContext()
  const result = await runAction(async () => {
    const objective = await createObjective(context, input)
    return { id: objective.id }
  })
  if (result.ok) revalidateOkrSurfaces()
  return result
}

export async function updateObjectiveAction(input: unknown): Promise<ActionResult<{ id: string }>> {
  const context = await requireSessionContext()
  const result = await runAction(async () => {
    const objective = await updateObjective(context, input)
    return { id: objective.id }
  })
  if (result.ok) revalidateOkrSurfaces()
  return result
}

export async function archiveObjectiveAction(objectiveId: string): Promise<ActionResult> {
  const context = await requireSessionContext()
  const result = await runAction(async () => {
    await archiveObjective(context, objectiveId)
  })
  if (result.ok) revalidateOkrSurfaces()
  return result
}

export async function createKeyResultAction(input: unknown): Promise<ActionResult<{ id: string }>> {
  const context = await requireSessionContext()
  const result = await runAction(async () => {
    const keyResult = await createKeyResult(context, input)
    return { id: keyResult.id }
  })
  if (result.ok) revalidateOkrSurfaces()
  return result
}

export async function updateKeyResultAction(input: unknown): Promise<ActionResult<{ id: string }>> {
  const context = await requireSessionContext()
  const result = await runAction(async () => {
    const keyResult = await updateKeyResult(context, input)
    return { id: keyResult.id }
  })
  if (result.ok) revalidateOkrSurfaces()
  return result
}

export async function deleteKeyResultAction(keyResultId: string): Promise<ActionResult> {
  const context = await requireSessionContext()
  const result = await runAction(async () => {
    await deleteKeyResult(context, keyResultId)
  })
  if (result.ok) revalidateOkrSurfaces()
  return result
}

export async function createCheckInAction(input: unknown): Promise<ActionResult<{ id: string }>> {
  const context = await requireSessionContext()
  const result = await runAction(async () => {
    const checkIn = await createCheckIn(context, input)
    return { id: checkIn.id }
  })
  if (result.ok) revalidateOkrSurfaces()
  return result
}

export async function createInitiativeAction(
  input: unknown,
): Promise<ActionResult<{ id: string }>> {
  const context = await requireSessionContext()
  const result = await runAction(async () => {
    const initiative = await createInitiative(context, input)
    return { id: initiative.id }
  })
  if (result.ok) revalidateOkrSurfaces()
  return result
}

export async function updateInitiativeAction(
  input: unknown,
): Promise<ActionResult<{ id: string }>> {
  const context = await requireSessionContext()
  const result = await runAction(async () => {
    const initiative = await updateInitiative(context, input)
    return { id: initiative.id }
  })
  if (result.ok) revalidateOkrSurfaces()
  return result
}

export async function deleteInitiativeAction(initiativeId: string): Promise<ActionResult> {
  const context = await requireSessionContext()
  const result = await runAction(async () => {
    await deleteInitiative(context, initiativeId)
  })
  if (result.ok) revalidateOkrSurfaces()
  return result
}

export async function createCommentAction(input: unknown): Promise<ActionResult<{ id: string }>> {
  const context = await requireSessionContext()
  const result = await runAction(async () => {
    const comment = await createComment(context, input)
    return { id: comment.id }
  })
  if (result.ok) revalidateOkrSurfaces()
  return result
}

export async function deleteCommentAction(commentId: string): Promise<ActionResult> {
  const context = await requireSessionContext()
  const result = await runAction(async () => {
    await deleteComment(context, commentId)
  })
  if (result.ok) revalidateOkrSurfaces()
  return result
}

export async function markNotificationsReadAction(notificationId?: string): Promise<ActionResult> {
  const context = await requireSessionContext()
  const result = await runAction(async () => {
    await markNotificationsRead(context, notificationId)
  })
  if (result.ok) revalidatePath('/', 'layout')
  return result
}
