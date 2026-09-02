import type { NextRequest } from 'next/server'

import { withApiContext } from '@/server/api'
import { deleteKeyResult, getKeyResult, updateKeyResult } from '@/server/services/key-results'

type Params = { params: Promise<{ id: string }> }

export async function GET(_request: NextRequest, { params }: Params) {
  const { id } = await params
  return withApiContext(async (context) => getKeyResult(context, id))
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const { id } = await params
  return withApiContext(async (context) =>
    updateKeyResult(context, { ...(await request.json()), id }),
  )
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  const { id } = await params
  return withApiContext(async (context) => {
    await deleteKeyResult(context, id)
    return { deleted: true }
  })
}
