const BUILD_METADATA_PREFIX = '[[practical-tracker:gun-build]]'

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

function normalizePart(part, index = 0) {
  return {
    id: part.id,
    componentType: nullableString(part.componentType),
    brandModel: nullableString(part.brandModel),
    retailPrice: Number.isFinite(Number(part.retailPrice)) ? Number(part.retailPrice) : 0,
    notes: part.notes == null ? null : String(part.notes),
    sortOrder: Number.isFinite(Number(part.sortOrder)) ? Number(part.sortOrder) : index + 1,
  }
}

export function deserializeGunBuildNotes(value) {
  const raw = nullableString(value)
  const [plainNotes, metadata] = raw.split(`\n${BUILD_METADATA_PREFIX}`)

  if (!metadata) {
    return { notes: raw, imageUrl: '', buildParts: [] }
  }

  try {
    const parsed = JSON.parse(metadata.trim())
    return {
      notes: plainNotes.trim(),
      imageUrl: nullableString(parsed.imageUrl),
      buildParts: Array.isArray(parsed.buildParts)
        ? parsed.buildParts.map((part, index) => normalizePart(part, index))
        : [],
    }
  } catch {
    return { notes: raw, imageUrl: '', buildParts: [] }
  }
}

/**
 * @param {{
 *   notes?: string,
 *   imageUrl?: string,
 *   buildParts?: Array<{
 *     id?: string,
 *     componentType?: string,
 *     brandModel?: string,
 *     retailPrice?: number | string,
 *     notes?: string | null,
 *     sortOrder?: number | string,
 *   }>,
 * }} input
 */
export function serializeGunBuildNotes({ notes = '', imageUrl = '', buildParts = [] }) {
  const normalizedParts = (buildParts ?? []).map((part, index) => normalizePart(part, index))
  const metadata = JSON.stringify({ imageUrl: nullableString(imageUrl), buildParts: normalizedParts })
  const userNotes = nullableString(notes).trim()
  return `${userNotes}\n${BUILD_METADATA_PREFIX}${metadata}`.trim()
}

export function hydrateGunBuildRecord(record) {
  const metadata = deserializeGunBuildNotes(record.notes)
  return {
    ...record,
    notes: metadata.notes,
    imageUrl: metadata.imageUrl,
    buildParts: normalizeBuildParts(metadata.buildParts),
  }
}

export function gunFormFromRecord(record) {
  const hydrated = record.buildParts || record.imageUrl ? record : hydrateGunBuildRecord(record)
  return {
    name: nullableString(hydrated.name),
    caliber: nullableString(hydrated.caliber),
    discipline: Array.isArray(hydrated.discipline) ? hydrated.discipline : [],
    imageUrl: nullableString(hydrated.imageUrl),
    notes: nullableString(hydrated.notes),
    isActive: hydrated.isActive !== false,
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

export function updateBuildPartForm(parts, index, updates) {
  return (parts ?? []).map((part, partIndex) => (
    partIndex === index ? { ...part, ...updates } : part
  ))
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
