import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import type { Discipline } from '@/generated/prisma/client'
import { z } from 'zod'

const stageSchema = z.object({
  stageNum:  z.number().int().min(1),
  stageName: z.string().optional(),
  score:     z.number().default(0),
  time:      z.number().optional(),
  hits:      z.number().int().optional(),
  misses:    z.number().int().default(0),
  penalties: z.number().int().default(0),
  dnf:       z.boolean().default(false),
  notes:     z.string().optional(),
})

const matchSchema = z.object({
  date:             z.string(),
  club:             z.string().min(1),
  matchName:        z.string().optional(),
  discipline:       z.enum(['USPSA','SCSA','IPSC','IDPA','THREE_GUN','PRS','NRL22','RIMFIRE','OTHER']),
  division:         z.string().optional(),
  tier:             z.enum(['LOCAL','TIER1','TIER2','TIER3','MAJOR']).default('LOCAL'),
  placement:        z.number().int().positive().optional(),
  totalCompetitors: z.number().int().positive().optional(),
  roundsUsed:       z.number().int().min(0).default(0),
  ammoCostPerRound: z.number().min(0).default(0),
  powerFactor:      z.number().int().optional(),
  pfType:           z.string().optional(),
  gunId:            z.string().optional(),
  dq:               z.boolean().default(false),
  dqReason:         z.string().optional(),
  notes:            z.string().optional(),
  stages:           z.array(stageSchema).default([]),
})

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
  const percentile = d.placement && d.totalCompetitors
    ? Math.round((1 - d.placement / d.totalCompetitors) * 100)
    : null

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
    include: { stages: true },
  })

  return NextResponse.json(match, { status: 201 })
}
