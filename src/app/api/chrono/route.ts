import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { buildChronoCreateData, parseChronoCreatePayload } from '@/lib/api-route-contracts.mjs'

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const entries = await prisma.chronoEntry.findMany({
    where: { userId: session.user.id },
    orderBy: { date: 'desc' },
    include: { gun: true, match: true },
  })
  return NextResponse.json(entries)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json()
  const parsed = parseChronoCreatePayload(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  const entry = await prisma.chronoEntry.create({
    data: buildChronoCreateData(session.user.id, parsed.data),
    include: { gun: true, match: true },
  })
  return NextResponse.json(entry, { status: 201 })
}
