import assert from 'node:assert/strict'
import test from 'node:test'

import {
  buildChronoCreateData,
  buildExpenseCreateData,
  buildMaintenanceCreateData,
  parseChronoCreatePayload,
  parseExpenseCreatePayload,
  parseMaintenanceCreatePayload,
} from '../src/lib/api-route-contracts.mjs'

const userId = 'user_123'

test('validates and maps expense create payloads for the API route', () => {
  const parsed = parseExpenseCreatePayload({
    date: '2026-05-29',
    category: 'AMMO',
    item: 'Match ammo',
    amount: 42.5,
    vendor: 'Range shop',
    url: '',
    notes: 'Local match resupply',
  })

  assert.equal(parsed.success, true)
  const data = buildExpenseCreateData(userId, parsed.data)

  assert.equal(data.userId, userId)
  assert.equal(data.category, 'AMMO')
  assert.equal(data.amount, 42.5)
  assert.equal(data.url, null)
  assert.equal(data.date.toISOString(), '2026-05-29T00:00:00.000Z')
})

test('rejects unsafe expense create payloads before hitting Prisma', () => {
  const parsed = parseExpenseCreatePayload({
    date: '2026-05-29',
    category: 'AMMO',
    item: '',
    amount: -1,
  })

  assert.equal(parsed.success, false)
  assert.ok(parsed.error.flatten().fieldErrors.item)
  assert.ok(parsed.error.flatten().fieldErrors.amount)
})

test('validates and maps chrono create payloads including calculated power factor', () => {
  const parsed = parseChronoCreatePayload({
    date: '2026-05-29',
    gunId: 'gun_pcc',
    ammoDescription: '124gr test load',
    bulletWeight: 124,
    avgVelocity: 1075,
    minVelocity: 1058,
    maxVelocity: 1088,
    strings: 10,
  })

  assert.equal(parsed.success, true)
  const data = buildChronoCreateData(userId, parsed.data)

  assert.equal(data.userId, userId)
  assert.equal(data.gunId, 'gun_pcc')
  assert.equal(data.powerFactor, 133.3)
  assert.equal(data.strings, 10)
  assert.equal(data.date.toISOString(), '2026-05-29T00:00:00.000Z')
})

test('validates and maps maintenance create payloads with safe default counters', () => {
  const parsed = parseMaintenanceCreatePayload({
    date: '2026-05-29',
    gunId: 'gun_pcc',
    action: 'Clean and inspect extractor',
  })

  assert.equal(parsed.success, true)
  const data = buildMaintenanceCreateData(userId, parsed.data)

  assert.equal(data.userId, userId)
  assert.equal(data.gunId, 'gun_pcc')
  assert.equal(data.roundsFired, 0)
  assert.equal(data.totalRoundsSinceClean, 0)
  assert.equal(data.lifetimeRounds, 0)
  assert.equal(data.action, 'Clean and inspect extractor')
})

test('rejects empty maintenance actions and invalid chrono velocities', () => {
  assert.equal(
    parseMaintenanceCreatePayload({ date: '2026-05-29', action: '' }).success,
    false,
  )
  assert.equal(
    parseChronoCreatePayload({ date: '2026-05-29', bulletWeight: 124, avgVelocity: 0 }).success,
    false,
  )
})
