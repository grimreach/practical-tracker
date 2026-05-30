import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { hydrateGunBuildRecord, serializeGunBuildNotes } from '@/lib/gun-builds.mjs'

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

async function getGun(id: string, userId: string) {
  return prisma.gun.findFirst({ where: { id, userId } })
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

  const gun = await prisma.gun.update({
    where: { id },
    data: {
      name: d.name,
      caliber: d.caliber,
      discipline: d.discipline,
      notes: serializeGunBuildNotes({
        notes: d.notes,
        imageUrl: d.imageUrl,
        buildParts: d.buildParts ?? [],
      }),
      isActive: d.isActive,
    },
  })

  return NextResponse.json(hydrateGunBuildRecord(gun))
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
