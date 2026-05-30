import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const schema = z.object({
  date:                  z.string(),
  gunId:                 z.string().optional(),
  roundsFired:           z.number().int().min(0).default(0),
  totalRoundsSinceClean: z.number().int().min(0).default(0),
  lifetimeRounds:        z.number().int().min(0).default(0),
  action:                z.string().min(1),
  partsReplaced:         z.string().optional(),
  partsInspected:        z.string().optional(),
  lubricants:            z.string().optional(),
  notes:                 z.string().optional(),
})

async function getLog(id: string, userId: string) {
  return prisma.maintenanceLog.findFirst({ where: { id, userId } })
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const existing = await getLog(id, session.user.id)
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  const d = parsed.data

  const log = await prisma.maintenanceLog.update({
    where: { id },
    data: {
      gunId: d.gunId,
      date: new Date(d.date),
      roundsFired: d.roundsFired,
      totalRoundsSinceClean: d.totalRoundsSinceClean,
      lifetimeRounds: d.lifetimeRounds,
      action: d.action,
      partsReplaced: d.partsReplaced,
      partsInspected: d.partsInspected,
      lubricants: d.lubricants,
      notes: d.notes,
    },
    include: { gun: true },
  })
  return NextResponse.json(log)
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const existing = await getLog(id, session.user.id)
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  await prisma.maintenanceLog.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
