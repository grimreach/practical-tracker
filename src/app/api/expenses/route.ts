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

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const expenses = await prisma.expense.findMany({ where: { userId: session.user.id }, orderBy: { date: 'desc' } })
  return NextResponse.json(expenses)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  const d = parsed.data
  const expense = await prisma.expense.create({
    data: { userId: session.user.id, date: new Date(d.date), category: d.category, item: d.item, amount: d.amount, vendor: d.vendor, url: d.url || null, notes: d.notes }
  })
  return NextResponse.json(expense, { status: 201 })
}
