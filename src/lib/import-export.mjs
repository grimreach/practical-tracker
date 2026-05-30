export const EXPORT_WORKFLOW_VERSION = 'export-v1'
export const PRACTISCORE_CSV_WORKFLOW_VERSION = 'practiscore-csv-v1'

const DATASET_KEYS = ['guns', 'matches', 'expenses', 'chronoEntries', 'maintenanceLogs']
const MATCH_NAME_HEADERS = ['match name', 'match', 'event name', 'event']
const MATCH_DATE_HEADERS = ['date', 'match date', 'event date']
const CLUB_HEADERS = ['club', 'club name', 'range']
const STAGE_NAME_HEADERS = ['stage name', 'stage']
const STAGE_NUMBER_HEADERS = ['stage number', 'stage #', 'stage no', 'stage num']
const DETECTED_FIELD_HEADERS = {
  division: ['division', 'div'],
  class: ['class', 'classification'],
  place: ['place', 'overall place', 'finish'],
  percent: ['percent', 'percentage', 'match percent', '%'],
  points: ['points', 'pts', 'score'],
  time: ['time', 'stage time'],
}

function countRecords(value) {
  return Array.isArray(value) ? value.length : 0
}

function normalizeHeader(value) {
  return String(value ?? '').trim().toLowerCase()
}

function firstValue(row, candidates) {
  for (const candidate of candidates) {
    const value = row[candidate]
    if (value != null && String(value).trim()) return String(value).trim()
  }
  return ''
}

function parseCsvRows(csv) {
  const rows = []
  let row = []
  let field = ''
  let inQuotes = false

  for (let index = 0; index < csv.length; index += 1) {
    const char = csv[index]
    const next = csv[index + 1]

    if (char === '"') {
      if (inQuotes && next === '"') {
        field += '"'
        index += 1
      } else {
        inQuotes = !inQuotes
      }
    } else if (char === ',' && !inQuotes) {
      row.push(field)
      field = ''
    } else if ((char === '\n' || char === '\r') && !inQuotes) {
      if (char === '\r' && next === '\n') index += 1
      row.push(field)
      if (row.some((cell) => String(cell).trim())) rows.push(row)
      row = []
      field = ''
    } else {
      field += char
    }
  }

  row.push(field)
  if (row.some((cell) => String(cell).trim())) rows.push(row)
  return rows
}

function csvToObjects(csv) {
  const parsed = parseCsvRows(String(csv ?? '').trim())
  if (parsed.length < 2) return []

  const headers = parsed[0].map(normalizeHeader)
  return parsed.slice(1).map((values) => Object.fromEntries(
    headers.map((header, index) => [header, values[index] == null ? '' : String(values[index]).trim()]),
  ))
}

function detectedFieldsForRows(rows) {
  return Object.entries(DETECTED_FIELD_HEADERS)
    .filter(([, candidates]) => rows.some((row) => Boolean(firstValue(row, candidates))))
    .map(([field]) => field)
}

export function buildExportSummary(payload = {}) {
  const data = payload.data ?? {}
  return {
    workflow: payload.workflow ?? EXPORT_WORKFLOW_VERSION,
    exportedAt: payload.exportedAt ?? null,
    version: payload.version ?? null,
    counts: Object.fromEntries(DATASET_KEYS.map((key) => [key, countRecords(data[key])])),
  }
}

export function parsePractiscoreCsvPreview(csv) {
  const rows = csvToObjects(csv)
  if (!rows.length) {
    return { success: false, error: 'PractiScore CSV import preview requires at least one data row.' }
  }

  const matchesByKey = new Map()
  for (const row of rows) {
    const name = firstValue(row, MATCH_NAME_HEADERS) || 'Untitled PractiScore match'
    const date = firstValue(row, MATCH_DATE_HEADERS) || null
    const club = firstValue(row, CLUB_HEADERS) || null
    const stageName = firstValue(row, STAGE_NAME_HEADERS)
    const stageNumber = firstValue(row, STAGE_NUMBER_HEADERS)
    const key = [name, date, club].join('|')
    const existing = matchesByKey.get(key) ?? {
      name,
      date,
      club,
      stageCount: 0,
      sampleStages: [],
      detectedFields: [],
      rows: [],
    }

    existing.stageCount += 1
    existing.rows.push(row)
    if (stageName || stageNumber) {
      existing.sampleStages.push({
        name: stageName || `Stage ${existing.stageCount}`,
        number: stageNumber || null,
      })
    }
    matchesByKey.set(key, existing)
  }

  const matches = [...matchesByKey.values()].map((match) => ({
    name: match.name,
    date: match.date,
    club: match.club,
    stageCount: match.stageCount,
    sampleStages: match.sampleStages.slice(0, 5),
    detectedFields: detectedFieldsForRows(match.rows),
  }))

  return {
    success: true,
    summary: {
      workflow: PRACTISCORE_CSV_WORKFLOW_VERSION,
      mode: 'preview-only',
      counts: {
        rows: rows.length,
        matches: matches.length,
        stages: rows.length,
      },
      matches,
    },
  }
}

export function validateImportPreviewPayload(payload = {}) {
  if (payload.app !== 'practical-tracker') {
    return { success: false, error: 'Import file is not a Practical Tracker export.' }
  }

  if (payload.workflow === PRACTISCORE_CSV_WORKFLOW_VERSION) {
    return parsePractiscoreCsvPreview(payload.csv ?? payload.data?.csv ?? '')
  }

  if (payload.workflow !== EXPORT_WORKFLOW_VERSION) {
    return { success: false, error: `Unsupported import workflow: ${payload.workflow ?? 'missing'}.` }
  }

  if (!payload.data || typeof payload.data !== 'object') {
    return { success: false, error: 'Import file is missing its data block.' }
  }

  return { success: true, summary: buildExportSummary(payload) }
}
