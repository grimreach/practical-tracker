import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]/route'
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

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const logs = await prisma.maintenanceLog.findMany({ where: { userId: session.user.id }, orderBy: { date: 'desc' }, include: { gun: true } })
  return NextResponse.json(logs)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  const d = parsed.data
  const log = await prisma.maintenanceLog.create({
    data: { userId: session.user.id, gunId: d.gunId, date: new Date(d.date), roundsFired: d.roundsFired, totalRoundsSinceClean: d.totalRoundsSinceClean, lifetimeRounds: d.lifetimeRounds, action: d.action, partsReplaced: d.partsReplaced, partsInspected: d.partsInspected, lubricants: d.lubricants, notes: d.notes }
  })
  return NextResponse.json(log, { status: 201 })
}
