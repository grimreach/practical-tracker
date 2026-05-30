function dateOnly(value) {
  if (!value) return ''
  return String(value).slice(0, 10)
}

function nullableString(value) {
  return value == null ? '' : String(value)
}

function numericString(value) {
  return value == null ? '' : String(value)
}

function positiveNumber(value) {
  const number = Number(value)
  return Number.isFinite(number) && number > 0
}

function nonNegativeNumber(value) {
  if (value === '' || value == null) return true
  const number = Number(value)
  return Number.isFinite(number) && number >= 0
}

export function expenseFormFromRecord(record) {
  return {
    date: dateOnly(record.date),
    category: record.category,
    item: nullableString(record.item),
    amount: numericString(record.amount),
    vendor: nullableString(record.vendor),
    url: nullableString(record.url),
    notes: nullableString(record.notes),
  }
}

export function chronoFormFromRecord(record) {
  return {
    date: dateOnly(record.date),
    ammoDescription: nullableString(record.ammoDescription),
    bulletWeight: numericString(record.bulletWeight),
    bulletType: nullableString(record.bulletType),
    powder: nullableString(record.powder),
    powderCharge: numericString(record.powderCharge),
    primer: nullableString(record.primer),
    oal: numericString(record.oal),
    strings: numericString(record.strings),
    avgVelocity: numericString(record.avgVelocity),
    minVelocity: numericString(record.minVelocity),
    maxVelocity: numericString(record.maxVelocity),
    stdDev: numericString(record.stdDev),
    extremeSpread: numericString(record.extremeSpread),
    notes: nullableString(record.notes),
  }
}

export function maintenanceFormFromRecord(record) {
  return {
    date: dateOnly(record.date),
    roundsFired: numericString(record.roundsFired),
    totalRoundsSinceClean: numericString(record.totalRoundsSinceClean),
    lifetimeRounds: numericString(record.lifetimeRounds),
    action: nullableString(record.action),
    partsReplaced: nullableString(record.partsReplaced),
    partsInspected: nullableString(record.partsInspected),
    lubricants: nullableString(record.lubricants),
    notes: nullableString(record.notes),
  }
}

export function applySavedRecord(records, saved) {
  const index = records.findIndex((record) => record.id === saved.id)
  if (index === -1) return [saved, ...records]
  return records.map((record) => (record.id === saved.id ? saved : record))
}

export function applyDeletedRecord(records, id) {
  return records.filter((record) => record.id !== id)
}

export function validateExpenseForm(form) {
  const errors = {}
  if (!form.date) errors.date = 'Date is required.'
  if (!form.item?.trim()) errors.item = 'Item is required.'
  if (!positiveNumber(form.amount)) errors.amount = 'Amount must be greater than zero.'
  if (form.url?.trim() && !/^https?:\/\//i.test(form.url.trim())) {
    errors.url = 'Receipt URL must start with http:// or https://.'
  }
  return errors
}

export function validateChronoForm(form) {
  const errors = {}
  if (!form.date) errors.date = 'Date is required.'
  if (!positiveNumber(form.bulletWeight)) errors.bulletWeight = 'Bullet weight must be greater than zero.'
  if (!positiveNumber(form.avgVelocity)) errors.avgVelocity = 'Average velocity must be greater than zero.'
  if (form.strings !== '' && (!Number.isFinite(Number(form.strings)) || Number(form.strings) < 1)) {
    errors.strings = 'Shots must be at least 1.'
  }
  return errors
}

export function validateMaintenanceForm(form) {
  const errors = {}
  if (!form.date) errors.date = 'Date is required.'
  if (!form.action?.trim()) errors.action = 'Action is required.'
  if (!nonNegativeNumber(form.roundsFired)) errors.roundsFired = 'Rounds fired cannot be negative.'
  if (!nonNegativeNumber(form.totalRoundsSinceClean)) errors.totalRoundsSinceClean = 'Since clean cannot be negative.'
  if (!nonNegativeNumber(form.lifetimeRounds)) errors.lifetimeRounds = 'Lifetime rounds cannot be negative.'
  return errors
}

export function hasValidationErrors(errors) {
  return Object.keys(errors).length > 0
}
