import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { buildMaintenanceCreateData, parseMaintenanceCreatePayload } from '@/lib/api-route-contracts.mjs'

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const logs = await prisma.maintenanceLog.findMany({ where: { userId: session.user.id }, orderBy: { date: 'desc' }, include: { gun: true } })
  return NextResponse.json(logs)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json()
  const parsed = parseMaintenanceCreatePayload(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  const log = await prisma.maintenanceLog.create({
    data: buildMaintenanceCreateData(session.user.id, parsed.data)
  })
  return NextResponse.json(log, { status: 201 })
}
