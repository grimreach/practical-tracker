import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const disciplineSchema = z.enum(['USPSA','SCSA','IPSC','IDPA','THREE_GUN','PRS','NRL22','RIMFIRE','OTHER'])

const buildPartSchema = z.object({
  id:            z.string().optional(),
  componentType: z.string().min(1),
  brandModel:    z.string().min(1),
  retailPrice:   z.number().nonnegative().default(0),
  notes:         z.string().optional(),
  sortOrder:     z.number().int().nonnegative().default(0),
})

const gunSchema = z.object({
  name:       z.string().min(1),
  caliber:    z.string().min(1),
  discipline: z.array(disciplineSchema).default([]),
  imageUrl:   z.url().optional().or(z.literal('')),
  notes:      z.string().optional(),
  isActive:   z.boolean().default(true),
  buildParts: z.array(buildPartSchema).optional(),
})

const gunInclude = { buildParts: { orderBy: [{ sortOrder: 'asc' as const }, { createdAt: 'asc' as const }] } }

async function getGun(id: string, userId: string) {
  return prisma.gun.findFirst({ where: { id, userId }, include: gunInclude })
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const existing = await getGun(id, session.user.id)
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const body = await req.json()
  const parsed = gunSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  const d = parsed.data

  const gun = await prisma.$transaction(async (tx) => {
    await tx.gunBuildPart.deleteMany({ where: { gunId: id } })
    return tx.gun.update({
      where: { id },
      data: {
        name: d.name,
        caliber: d.caliber,
        discipline: d.discipline,
        imageUrl: d.imageUrl || null,
        notes: d.notes,
        isActive: d.isActive,
        buildParts: d.buildParts?.length
          ? {
              create: d.buildParts.map((part, index) => ({
                componentType: part.componentType,
                brandModel: part.brandModel,
                retailPrice: part.retailPrice,
                notes: part.notes,
                sortOrder: part.sortOrder || index,
              })),
            }
          : undefined,
      },
      include: gunInclude,
    })
  })

  return NextResponse.json(gun)
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const existing = await getGun(id, session.user.id)
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  await prisma.gun.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
