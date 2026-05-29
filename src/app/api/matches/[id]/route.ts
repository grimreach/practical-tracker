import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

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
  const percentile = body.placement && body.totalCompetitors
    ? Math.round((1 - body.placement / body.totalCompetitors) * 100)
    : null

  // Delete old stages and recreate
  await prisma.stageScore.deleteMany({ where: { matchId: id } })

  const match = await prisma.match.update({
    where: { id },
    data: {
      date:             body.date ? new Date(body.date) : undefined,
      club:             body.club,
      matchName:        body.matchName,
      discipline:       body.discipline,
      division:         body.division,
      tier:             body.tier,
      placement:        body.placement,
      totalCompetitors: body.totalCompetitors,
      percentile,
      roundsUsed:       body.roundsUsed,
      ammoCostPerRound: body.ammoCostPerRound,
      powerFactor:      body.powerFactor,
      pfType:           body.pfType,
      dq:               body.dq,
      dqReason:         body.dqReason,
      notes:            body.notes,
      stages: { create: body.stages || [] },
    },
    include: { stages: true },
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
