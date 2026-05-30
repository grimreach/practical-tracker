import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { buildPractiscoreCsvImportPlan, PRACTISCORE_CSV_WORKFLOW_VERSION } from '@/lib/import-export.mjs'
import { calcPercentile } from '@/lib/match-schema'

type ImportAction = {
  action: 'create-match' | 'skip-duplicate'
  key: string
  payload: {
    date: string
    club: string
    matchName: string
    discipline: 'USPSA' | 'SCSA' | 'IPSC' | 'IDPA' | 'THREE_GUN' | 'PRS' | 'NRL22' | 'RIMFIRE' | 'OTHER'
    division?: string
    tier: 'LOCAL' | 'TIER1' | 'TIER2' | 'TIER3' | 'MAJOR'
    placement?: number
    totalCompetitors?: number
    roundsUsed: number
    ammoCostPerRound: number
    powerFactor?: number
    pfType?: string
    dq: boolean
    dqReason?: string
    notes?: string
    stages: Array<{
      stageNum: number
      stageName?: string
      score: number
      points?: number
      time?: number
      hitFactor?: number
      misses: number
      penalties: number
      stagePlacement?: number
      stageTotalCompetitors?: number
      classifier: boolean
      dnf: boolean
      notes?: string
    }>
  }
}

type ImportPlanResult = {
  success: boolean
  error?: string
  errors?: Array<{ matchName?: string; reason: string }>
  plan?: {
    counts: {
      rows: number
      matches: number
      stages: number
      createMatches: number
      skipDuplicates: number
      errors: number
    }
    actions: ImportAction[]
  }
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const payload = await req.json()
  if (payload?.app !== 'practical-tracker') {
    return NextResponse.json({ error: 'Import file is not a Practical Tracker export.' }, { status: 400 })
  }
  if (payload?.workflow !== PRACTISCORE_CSV_WORKFLOW_VERSION) {
    return NextResponse.json({ error: `Unsupported import apply workflow: ${payload?.workflow ?? 'missing'}.` }, { status: 400 })
  }
  if (payload?.confirm !== true) {
    return NextResponse.json({ error: 'Import apply requires confirm: true after preview review.' }, { status: 400 })
  }

  const existingMatches = await prisma.match.findMany({
    where: { userId: session.user.id },
    select: { date: true, club: true, matchName: true },
  })

  const planned = buildPractiscoreCsvImportPlan(payload.csv ?? payload.data?.csv ?? '', {
    existingMatches,
    defaults: payload.defaults,
  }) as ImportPlanResult

  if (!planned.success || !planned.plan) {
    return NextResponse.json({ error: planned.error ?? 'PractiScore import apply plan failed.', errors: planned.errors ?? [] }, { status: 400 })
  }

  const createActions = planned.plan.actions.filter((action) => action.action === 'create-match')
  const created = await prisma.$transaction(createActions.map((action) => prisma.match.create({
    data: {
      userId: session.user.id,
      date: new Date(action.payload.date),
      club: action.payload.club,
      matchName: action.payload.matchName,
      discipline: action.payload.discipline,
      division: action.payload.division,
      tier: action.payload.tier,
      placement: action.payload.placement,
      totalCompetitors: action.payload.totalCompetitors,
      percentile: calcPercentile(action.payload.placement, action.payload.totalCompetitors),
      roundsUsed: action.payload.roundsUsed,
      ammoCostPerRound: action.payload.ammoCostPerRound,
      powerFactor: action.payload.powerFactor,
      pfType: action.payload.pfType,
      dq: action.payload.dq,
      dqReason: action.payload.dqReason,
      notes: action.payload.notes,
      stages: { create: action.payload.stages },
    },
    include: { stages: { orderBy: { stageNum: 'asc' } } },
  })))

  return NextResponse.json({
    ok: true,
    mode: 'confirm-apply',
    message: 'PractiScore CSV import applied. Review imported matches to attach guns, ammo costs, expenses, and videos.',
    summary: {
      ...planned.plan.counts,
      createdMatches: created.length,
      skippedDuplicates: planned.plan.counts.skipDuplicates,
    },
    created: created.map((match) => ({ id: match.id, matchName: match.matchName, date: match.date, stageCount: match.stages.length })),
  }, { status: 201 })
}
