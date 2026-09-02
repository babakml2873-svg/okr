import type { NextRequest } from 'next/server'

import { withApiContext } from '@/server/api'
import { archiveObjective, getObjective, updateObjective } from '@/server/services/objectives'

type Params = { params: Promise<{ id: string }> }

export async function GET(_request: NextRequest, { params }: Params) {
  const { id } = await params
  return withApiContext(async (context) => getObjective(context, id))
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const { id } = await params
  return withApiContext(async (context) =>
    updateObjective(context, { ...(await request.json()), id }),
  )
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  const { id } = await params
  return withApiContext(async (context) => {
    await archiveObjective(context, id)
    return { archived: true }
  })
}
