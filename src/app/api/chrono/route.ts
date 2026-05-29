import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { calcPF } from '@/lib/constants'

const schema = z.object({
  date:            z.string(),
  gunId:           z.string().optional(),
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

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const entries = await prisma.chronoEntry.findMany({ where: { userId: session.user.id }, orderBy: { date: 'desc' }, include: { gun: true } })
  return NextResponse.json(entries)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  const d = parsed.data
  const powerFactor = calcPF(d.bulletWeight, d.avgVelocity)
  const entry = await prisma.chronoEntry.create({
    data: { userId: session.user.id, gunId: d.gunId, date: new Date(d.date), ammoDescription: d.ammoDescription, bulletWeight: d.bulletWeight, bulletType: d.bulletType, powder: d.powder, powderCharge: d.powderCharge, primer: d.primer, oal: d.oal, strings: d.strings, avgVelocity: d.avgVelocity, minVelocity: d.minVelocity, maxVelocity: d.maxVelocity, stdDev: d.stdDev, extremeSpread: d.extremeSpread, powerFactor, notes: d.notes }
  })
  return NextResponse.json(entry, { status: 201 })
}
