import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { APP_VERSION } from '@/lib/version'

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userId = session.user.id
  const [user, guns, matches, expenses, chronoEntries, maintenanceLogs] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        username: true,
        uspsa_number: true,
        scsa_number: true,
        division: true,
        primaryGun: true,
        bio: true,
        isPublic: true,
        createdAt: true,
      },
    }),
    prisma.gun.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } }),
    prisma.match.findMany({
      where: { userId },
      orderBy: { date: 'desc' },
      include: { stages: { orderBy: { stageNum: 'asc' } }, gun: true },
    }),
    prisma.expense.findMany({ where: { userId }, orderBy: { date: 'desc' }, include: { gun: true, match: true } }),
    prisma.chronoEntry.findMany({ where: { userId }, orderBy: { date: 'desc' }, include: { gun: true, match: true } }),
    prisma.maintenanceLog.findMany({ where: { userId }, orderBy: { date: 'desc' }, include: { gun: true } }),
  ])

  const exportedAt = new Date().toISOString()
  const payload = {
    app: 'practical-tracker',
    version: APP_VERSION,
    exportedAt,
    workflow: 'export-v1',
    user,
    data: {
      guns,
      matches,
      expenses,
      chronoEntries,
      maintenanceLogs,
    },
  }

  return NextResponse.json(payload, {
    headers: {
      'Content-Disposition': `attachment; filename="practical-tracker-export-${exportedAt.slice(0, 10)}.json"`,
      'Cache-Control': 'no-store',
    },
  })
}
