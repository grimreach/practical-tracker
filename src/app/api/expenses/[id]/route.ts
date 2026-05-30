import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const schema = z.object({
  date:     z.string(),
  category: z.enum(['PARTS','AMMO','RELOADING','OPTICS','ACCESSORIES','MATCH_FEES','TRAINING','TRAVEL','OTHER']),
  item:     z.string().min(1),
  amount:   z.number().positive(),
  vendor:   z.string().optional(),
  url:      z.url().optional().or(z.literal('')),
  notes:    z.string().optional(),
})

async function getExpense(id: string, userId: string) {
  return prisma.expense.findFirst({ where: { id, userId } })
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const existing = await getExpense(id, session.user.id)
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  const d = parsed.data

  const expense = await prisma.expense.update({
    where: { id },
    data: {
      date: new Date(d.date),
      category: d.category,
      item: d.item,
      amount: d.amount,
      vendor: d.vendor,
      url: d.url || null,
      notes: d.notes,
    },
  })
  return NextResponse.json(expense)
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const existing = await getExpense(id, session.user.id)
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  await prisma.expense.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
