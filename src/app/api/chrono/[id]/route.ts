import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { calcPF } from '@/lib/constants'

const schema = z.object({
  date:            z.string(),
  gunId:           z.string().optional(),
  matchId:         z.string().optional(),
  ammoDescription: z.string().optional(),
  bulletWeight:    z.number().positive(),
  bulletType:      z.string().optional(),
  powder:          z.string().optional(),
  powderCharge:    z.number().optional(),
  primer:          z.string().optional(),
  oal:             z.number().optional(),
  strings:         z.number().int().min(1).default(10),
  avgVelocity:     z.number().positive(),
  minVelocity:     z.number().default(0),
  maxVelocity:     z.number().default(0),
  stdDev:          z.number().optional(),
  extremeSpread:   z.number().optional(),
  notes:           z.string().optional(),
})

async function getEntry(id: string, userId: string) {
  return prisma.chronoEntry.findFirst({ where: { id, userId } })
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const existing = await getEntry(id, session.user.id)
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  const d = parsed.data
  const powerFactor = calcPF(d.bulletWeight, d.avgVelocity)

  const entry = await prisma.chronoEntry.update({
    where: { id },
    data: {
      gunId: d.gunId,
      matchId: d.matchId,
      date: new Date(d.date),
      ammoDescription: d.ammoDescription,
      bulletWeight: d.bulletWeight,
      bulletType: d.bulletType,
      powder: d.powder,
      powderCharge: d.powderCharge,
      primer: d.primer,
      oal: d.oal,
      strings: d.strings,
      avgVelocity: d.avgVelocity,
      minVelocity: d.minVelocity,
      maxVelocity: d.maxVelocity,
      stdDev: d.stdDev,
      extremeSpread: d.extremeSpread,
      powerFactor,
      notes: d.notes,
    },
    include: { gun: true, match: true },
  })
  return NextResponse.json(entry)
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const existing = await getEntry(id, session.user.id)
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  await prisma.chronoEntry.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
