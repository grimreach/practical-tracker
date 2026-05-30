import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { calcPercentile, matchSchema } from '@/lib/match-schema'

async function getMatch(id: string, userId: string) {
  return prisma.match.findFirst({ where: { id, userId }, include: { stages: { orderBy: { stageNum: 'asc' } }, gun: true } })
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const match = await getMatch(id, session.user.id)
  if (!match) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(match)
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const existing = await getMatch(id, session.user.id)
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const body = await req.json()
  const parsed = matchSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const d = parsed.data
  const percentile = calcPercentile(d.placement, d.totalCompetitors)

  const match = await prisma.$transaction(async (tx) => {
    await tx.stageScore.deleteMany({ where: { matchId: id } })

    return tx.match.update({
      where: { id },
      data: {
        date:             new Date(d.date),
        gunId:            d.gunId,
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
  })
  return NextResponse.json(match)
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const existing = await getMatch(id, session.user.id)
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  await prisma.match.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
