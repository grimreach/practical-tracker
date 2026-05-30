function nullableString(value) {
  return value == null ? '' : String(value)
}

function numericString(value) {
  return value == null ? '' : String(value)
}

function nonNegativeNumber(value) {
  const number = Number(value)
  return Number.isFinite(number) && number >= 0
}

function optionalHttpUrl(value) {
  const url = value?.trim?.() ?? ''
  return !url || /^https?:\/\//i.test(url)
}

export function gunFormFromRecord(record) {
  return {
    name: nullableString(record.name),
    caliber: nullableString(record.caliber),
    discipline: Array.isArray(record.discipline) ? record.discipline : [],
    imageUrl: nullableString(record.imageUrl),
    notes: nullableString(record.notes),
    isActive: record.isActive !== false,
  }
}

export function buildPartFormFromRecord(record) {
  return {
    componentType: nullableString(record.componentType),
    brandModel: nullableString(record.brandModel),
    retailPrice: numericString(record.retailPrice),
    notes: nullableString(record.notes),
    sortOrder: numericString(record.sortOrder),
  }
}

export function normalizeBuildParts(parts) {
  return [...(parts ?? [])].sort((a, b) => {
    const sortA = Number.isFinite(Number(a.sortOrder)) ? Number(a.sortOrder) : 0
    const sortB = Number.isFinite(Number(b.sortOrder)) ? Number(b.sortOrder) : 0
    if (sortA !== sortB) return sortA - sortB
    return String(a.componentType ?? '').localeCompare(String(b.componentType ?? ''))
  })
}

export function calculateBuildTotal(parts) {
  return (parts ?? []).reduce((sum, part) => {
    const price = Number(part.retailPrice)
    return Number.isFinite(price) && price > 0 ? sum + price : sum
  }, 0)
}

export function validateGunForm(form) {
  const errors = {}
  if (!form.name?.trim()) errors.name = 'Build name is required.'
  if (!form.caliber?.trim()) errors.caliber = 'Caliber is required.'
  if (!optionalHttpUrl(form.imageUrl)) {
    errors.imageUrl = 'Image URL must start with http:// or https://.'
  }
  return errors
}

export function validateBuildPartForm(form) {
  const errors = {}
  if (!form.componentType?.trim()) errors.componentType = 'Component type is required.'
  if (!form.brandModel?.trim()) errors.brandModel = 'Brand/model is required.'
  if (!nonNegativeNumber(form.retailPrice)) errors.retailPrice = 'Retail price cannot be negative.'
  return errors
}
