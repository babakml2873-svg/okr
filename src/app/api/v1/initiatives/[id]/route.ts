import type { NextRequest } from 'next/server'

import { withApiContext } from '@/server/api'
import { deleteInitiative, updateInitiative } from '@/server/services/initiatives'

type Params = { params: Promise<{ id: string }> }

export async function PATCH(request: NextRequest, { params }: Params) {
  const { id } = await params
  return withApiContext(async (context) =>
    updateInitiative(context, { ...(await request.json()), id }),
  )
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  const { id } = await params
  return withApiContext(async (context) => {
    await deleteInitiative(context, id)
    return { deleted: true }
  })
}
