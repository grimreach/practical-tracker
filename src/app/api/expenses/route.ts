import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { buildExpenseCreateData, parseExpenseCreatePayload } from '@/lib/api-route-contracts.mjs'

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const expenses = await prisma.expense.findMany({ where: { userId: session.user.id }, orderBy: { date: 'desc' } })
  return NextResponse.json(expenses)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json()
  const parsed = parseExpenseCreatePayload(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  const expense = await prisma.expense.create({
    data: buildExpenseCreateData(session.user.id, parsed.data)
  })
  return NextResponse.json(expense, { status: 201 })
}
