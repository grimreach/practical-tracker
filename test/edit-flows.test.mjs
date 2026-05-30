import test from 'node:test'
import assert from 'node:assert/strict'

import {
  applyDeletedRecord,
  applySavedRecord,
  expenseFormFromRecord,
  chronoFormFromRecord,
  maintenanceFormFromRecord,
  validateChronoForm,
  validateExpenseForm,
  validateMaintenanceForm,
} from '../src/lib/edit-flows.mjs'

const expense = {
  id: 'expense-1',
  date: '2026-05-30T00:00:00.000Z',
  category: 'AMMO',
  item: 'Match ammo',
  amount: 42.5,
  vendor: 'Range shop',
  url: null,
  notes: '9mm restock',
}

const chrono = {
  id: 'chrono-1',
  date: '2026-05-29T00:00:00.000Z',
  ammoDescription: '124gr match load',
  bulletWeight: 124,
  bulletType: null,
  powder: 'N320',
  powderCharge: 3.8,
  primer: null,
  oal: 1.13,
  strings: 10,
  avgVelocity: 1075,
  minVelocity: 1058,
  maxVelocity: 1092,
  stdDev: null,
  extremeSpread: 34,
  notes: null,
}

const maintenance = {
  id: 'maint-1',
  date: '2026-05-28T00:00:00.000Z',
  roundsFired: 142,
  totalRoundsSinceClean: 650,
  lifetimeRounds: 5480,
  action: 'Cleaned and lubricated',
  partsReplaced: null,
  partsInspected: 'Extractor, ejector',
  lubricants: 'Slip 2000',
  notes: null,
}

test('converts existing records into editable form state', () => {
  assert.deepEqual(expenseFormFromRecord(expense), {
    date: '2026-05-30',
    category: 'AMMO',
    item: 'Match ammo',
    amount: '42.5',
    vendor: 'Range shop',
    url: '',
    notes: '9mm restock',
  })

  assert.equal(chronoFormFromRecord(chrono).date, '2026-05-29')
  assert.equal(chronoFormFromRecord(chrono).powderCharge, '3.8')
  assert.equal(chronoFormFromRecord(chrono).primer, '')

  assert.equal(maintenanceFormFromRecord(maintenance).date, '2026-05-28')
  assert.equal(maintenanceFormFromRecord(maintenance).partsReplaced, '')
  assert.equal(maintenanceFormFromRecord(maintenance).partsInspected, 'Extractor, ejector')
})

test('applies saved records in place and keeps newest records first', () => {
  const original = [{ id: 'old', date: '2026-05-01' }, expense]
  const edited = { ...expense, item: 'Updated ammo', amount: 55 }
  const added = { id: 'new', date: '2026-06-01' }

  assert.deepEqual(applySavedRecord(original, edited).map((record) => record.id), ['old', 'expense-1'])
  assert.equal(applySavedRecord(original, edited)[1].item, 'Updated ammo')
  assert.deepEqual(applySavedRecord(original, added).map((record) => record.id), ['new', 'old', 'expense-1'])
})

test('removes deleted records without disturbing the remaining order', () => {
  const original = [{ id: 'first' }, { id: 'delete-me' }, { id: 'last' }]
  assert.deepEqual(applyDeletedRecord(original, 'delete-me'), [{ id: 'first' }, { id: 'last' }])
})

test('validates required fields near editable forms', () => {
  assert.deepEqual(validateExpenseForm({ date: '', item: '', amount: '0', url: 'not-a-url' }), {
    date: 'Date is required.',
    item: 'Item is required.',
    amount: 'Amount must be greater than zero.',
    url: 'Receipt URL must start with http:// or https://.',
  })

  assert.deepEqual(validateChronoForm({ date: '', bulletWeight: '0', avgVelocity: '', strings: '0' }), {
    date: 'Date is required.',
    bulletWeight: 'Bullet weight must be greater than zero.',
    avgVelocity: 'Average velocity must be greater than zero.',
    strings: 'Shots must be at least 1.',
  })

  assert.deepEqual(validateMaintenanceForm({ date: '', action: '', roundsFired: '-1', totalRoundsSinceClean: '-1', lifetimeRounds: '-1' }), {
    date: 'Date is required.',
    action: 'Action is required.',
    roundsFired: 'Rounds fired cannot be negative.',
    totalRoundsSinceClean: 'Since clean cannot be negative.',
    lifetimeRounds: 'Lifetime rounds cannot be negative.',
  })
})
