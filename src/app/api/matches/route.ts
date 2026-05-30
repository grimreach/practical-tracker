import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import type { Discipline } from '@/generated/prisma/client'
import { calcPercentile, matchSchema } from '@/lib/match-schema'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const discipline = searchParams.get('discipline')
  const limit = parseInt(searchParams.get('limit') || '50')

  const matches = await prisma.match.findMany({
    where: {
      userId: session.user.id,
      ...(discipline ? { discipline: discipline as Discipline } : {}),
    },
    include: { stages: { orderBy: { stageNum: 'asc' } }, gun: true },
    orderBy: { date: 'desc' },
    take: Math.min(limit, 200),
  })

  return NextResponse.json(matches)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const parsed = matchSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const d = parsed.data
  const percentile = calcPercentile(d.placement, d.totalCompetitors)

  const match = await prisma.match.create({
    data: {
      userId:           session.user.id,
      gunId:            d.gunId,
      date:             new Date(d.date),
      club:             d.club,
      matchName:        d.matchName,
      discipline:       d.discipline,
      division:         d.division,
      tier:             d.tier,
      placement:        d.placement,
      totalCompetitors: d.totalCompetitors,
      percentile,
      roundsUsed:       d.roundsUsed,
      ammoCostPerRound: d.ammoCostPerRound,
      powerFactor:      d.powerFactor,
      pfType:           d.pfType,
      dq:               d.dq,
      dqReason:         d.dqReason,
      notes:            d.notes,
      stages: { create: d.stages },
    },
    include: { stages: { orderBy: { stageNum: 'asc' } }, gun: true },
  })

  return NextResponse.json(match, { status: 201 })
}
