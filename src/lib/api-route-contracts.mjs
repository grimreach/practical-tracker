import { z } from 'zod'

export function calcPowerFactor(bulletWeight, avgVelocity) {
  return Math.round(((bulletWeight * avgVelocity) / 1000) * 10) / 10
}

export const expenseCreateSchema = z.object({
  date: z.string(),
  category: z.enum([
    'PARTS',
    'AMMO',
    'RELOADING',
    'OPTICS',
    'ACCESSORIES',
    'MATCH_FEES',
    'TRAINING',
    'TRAVEL',
    'OTHER',
  ]),
  item: z.string().min(1),
  amount: z.number().positive(),
  vendor: z.string().optional(),
  url: z.url().optional().or(z.literal('')),
  notes: z.string().optional(),
})

export const chronoCreateSchema = z.object({
  date: z.string(),
  gunId: z.string().optional(),
  ammoDescription: z.string().optional(),
  bulletWeight: z.number().positive(),
  bulletType: z.string().optional(),
  powder: z.string().optional(),
  powderCharge: z.number().optional(),
  primer: z.string().optional(),
  oal: z.number().optional(),
  strings: z.number().int().min(1).default(10),
  avgVelocity: z.number().positive(),
  minVelocity: z.number().default(0),
  maxVelocity: z.number().default(0),
  stdDev: z.number().optional(),
  extremeSpread: z.number().optional(),
  notes: z.string().optional(),
})

export const maintenanceCreateSchema = z.object({
  date: z.string(),
  gunId: z.string().optional(),
  roundsFired: z.number().int().min(0).default(0),
  totalRoundsSinceClean: z.number().int().min(0).default(0),
  lifetimeRounds: z.number().int().min(0).default(0),
  action: z.string().min(1),
  partsReplaced: z.string().optional(),
  partsInspected: z.string().optional(),
  lubricants: z.string().optional(),
  notes: z.string().optional(),
})

export function parseExpenseCreatePayload(body) {
  return expenseCreateSchema.safeParse(body)
}

export function parseChronoCreatePayload(body) {
  return chronoCreateSchema.safeParse(body)
}

export function parseMaintenanceCreatePayload(body) {
  return maintenanceCreateSchema.safeParse(body)
}

export function buildExpenseCreateData(userId, data) {
  return {
    userId,
    date: new Date(data.date),
    category: data.category,
    item: data.item,
    amount: data.amount,
    vendor: data.vendor,
    url: data.url || null,
    notes: data.notes,
  }
}

export function buildChronoCreateData(userId, data) {
  return {
    userId,
    gunId: data.gunId,
    date: new Date(data.date),
    ammoDescription: data.ammoDescription,
    bulletWeight: data.bulletWeight,
    bulletType: data.bulletType,
    powder: data.powder,
    powderCharge: data.powderCharge,
    primer: data.primer,
    oal: data.oal,
    strings: data.strings,
    avgVelocity: data.avgVelocity,
    minVelocity: data.minVelocity,
    maxVelocity: data.maxVelocity,
    stdDev: data.stdDev,
    extremeSpread: data.extremeSpread,
    powerFactor: calcPowerFactor(data.bulletWeight, data.avgVelocity),
    notes: data.notes,
  }
}

export function buildMaintenanceCreateData(userId, data) {
  return {
    userId,
    gunId: data.gunId,
    date: new Date(data.date),
    roundsFired: data.roundsFired,
    totalRoundsSinceClean: data.totalRoundsSinceClean,
    lifetimeRounds: data.lifetimeRounds,
    action: data.action,
    partsReplaced: data.partsReplaced,
    partsInspected: data.partsInspected,
    lubricants: data.lubricants,
    notes: data.notes,
  }
}
