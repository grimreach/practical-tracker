export const EXPORT_WORKFLOW_VERSION = 'export-v1'
export const PRACTISCORE_CSV_WORKFLOW_VERSION = 'practiscore-csv-v1'

const DATASET_KEYS = ['guns', 'matches', 'expenses', 'chronoEntries', 'maintenanceLogs']
const DISCIPLINES = new Set(['USPSA', 'SCSA', 'IPSC', 'IDPA', 'THREE_GUN', 'PRS', 'NRL22', 'RIMFIRE', 'OTHER'])
const MATCH_TIERS = new Set(['LOCAL', 'TIER1', 'TIER2', 'TIER3', 'MAJOR'])
const MATCH_NAME_HEADERS = ['match name', 'match', 'event name', 'event']
const MATCH_DATE_HEADERS = ['date', 'match date', 'event date']
const CLUB_HEADERS = ['club', 'club name', 'range']
const STAGE_NAME_HEADERS = ['stage name', 'stage']
const STAGE_NUMBER_HEADERS = ['stage number', 'stage #', 'stage no', 'stage num']
const TOTAL_COMPETITOR_HEADERS = ['total competitors', 'competitors', 'match competitors', 'stage total competitors']
const STAGE_TOTAL_COMPETITOR_HEADERS = ['stage total competitors', 'total competitors', 'competitors']
const DQ_HEADERS = ['dq', 'disqualified']
const PF_TYPE_HEADERS = ['pf type', 'power factor type', 'power factor']
const DETECTED_FIELD_HEADERS = {
  division: ['division', 'div'],
  class: ['class', 'classification'],
  place: ['place', 'overall place', 'finish'],
  percent: ['percent', 'percentage', 'match percent', '%'],
  points: ['points', 'pts', 'score'],
  time: ['time', 'stage time'],
  hitFactor: ['hit factor', 'hitfactor', 'hf'],
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

function toOptionalNumber(value) {
  if (value == null || String(value).trim() === '') return undefined
  const normalized = String(value).trim().replace(/%$/, '').replace(/,/g, '')
  const parsed = Number(normalized)
  return Number.isFinite(parsed) ? parsed : undefined
}

function toOptionalInt(value) {
  const parsed = toOptionalNumber(value)
  return parsed == null ? undefined : Math.trunc(parsed)
}

function toBoolean(value) {
  const normalized = String(value ?? '').trim().toLowerCase()
  return ['1', 'true', 'yes', 'y', 'dq', 'disqualified'].includes(normalized)
}

function normalizeDateKey(value) {
  if (!value) return ''
  const date = new Date(value)
  if (!Number.isNaN(date.getTime())) return date.toISOString().slice(0, 10)
  return String(value).trim().slice(0, 10)
}

function normalizeComparable(value) {
  return String(value ?? '').trim().toLowerCase()
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

function buildMatchGroups(rows) {
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
  return [...matchesByKey.values()]
}

function normalizeDiscipline(value) {
  const normalized = String(value ?? '').trim().toUpperCase().replace(/[ -]/g, '_')
  if (normalized === 'STEEL_CHALLENGE') return 'SCSA'
  return DISCIPLINES.has(normalized) ? normalized : undefined
}

function normalizeTier(value) {
  const normalized = String(value ?? '').trim().toUpperCase().replace(/[ -]/g, '')
  if (normalized === 'LEVEL1') return 'TIER1'
  if (normalized === 'LEVEL2') return 'TIER2'
  if (normalized === 'LEVEL3') return 'TIER3'
  return MATCH_TIERS.has(normalized) ? normalized : undefined
}

function matchImportKey(match) {
  return [
    normalizeDateKey(match.date),
    normalizeComparable(match.club),
    normalizeComparable(match.matchName ?? match.name),
  ].join('|')
}

function buildDuplicateKeySet(existingMatches = []) {
  return new Set(existingMatches.map((match) => matchImportKey(match)).filter(Boolean))
}

function buildStagePayload(row, index) {
  const stageNum = toOptionalInt(firstValue(row, STAGE_NUMBER_HEADERS)) ?? index + 1
  const stageName = firstValue(row, STAGE_NAME_HEADERS) || `Stage ${stageNum}`
  const points = toOptionalNumber(firstValue(row, DETECTED_FIELD_HEADERS.points))
  const time = toOptionalNumber(firstValue(row, DETECTED_FIELD_HEADERS.time))
  const hitFactor = toOptionalNumber(firstValue(row, DETECTED_FIELD_HEADERS.hitFactor))
  const stagePlacement = toOptionalInt(firstValue(row, ['stage place', 'stage placement', 'stage rank']))
  const stageTotalCompetitors = toOptionalInt(firstValue(row, STAGE_TOTAL_COMPETITOR_HEADERS))

  return {
    stageNum,
    stageName,
    score: points ?? 0,
    points,
    time,
    hitFactor,
    misses: toOptionalInt(firstValue(row, ['misses', 'mikes'])) ?? 0,
    penalties: toOptionalInt(firstValue(row, ['penalties', 'procedurals', 'penalty'])) ?? 0,
    stagePlacement,
    stageTotalCompetitors,
    classifier: toBoolean(firstValue(row, ['classifier', 'is classifier'])),
    dnf: toBoolean(firstValue(row, ['dnf'])),
    notes: 'Imported from PractiScore CSV.',
  }
}

function buildMatchPayload(group, options = {}) {
  const firstRow = group.rows[0] ?? {}
  const date = group.date || firstValue(firstRow, MATCH_DATE_HEADERS)
  const placement = toOptionalInt(firstValue(firstRow, DETECTED_FIELD_HEADERS.place))
  const totalCompetitors = toOptionalInt(firstValue(firstRow, TOTAL_COMPETITOR_HEADERS))
  const discipline = normalizeDiscipline(options.discipline ?? firstValue(firstRow, ['discipline', 'sport'])) ?? 'USPSA'
  const tier = normalizeTier(options.tier ?? firstValue(firstRow, ['tier', 'level', 'match tier'])) ?? 'LOCAL'
  const division = (options.division ?? firstValue(firstRow, DETECTED_FIELD_HEADERS.division)) || undefined
  const powerFactor = toOptionalInt(firstValue(firstRow, ['power factor number', 'pf']))
  const pfType = firstValue(firstRow, PF_TYPE_HEADERS) || undefined
  const dq = toBoolean(firstValue(firstRow, DQ_HEADERS))

  return {
    date,
    club: group.club || 'PractiScore',
    matchName: group.name,
    discipline,
    division,
    tier,
    placement,
    totalCompetitors,
    roundsUsed: toOptionalInt(firstValue(firstRow, ['rounds used', 'rounds', 'minimum rounds'])) ?? 0,
    ammoCostPerRound: toOptionalNumber(firstValue(firstRow, ['ammo cost per round'])) ?? 0,
    powerFactor,
    pfType,
    dq,
    dqReason: dq ? firstValue(firstRow, ['dq reason', 'disqualification reason']) || 'Imported PractiScore DQ flag.' : undefined,
    notes: 'Imported from PractiScore CSV. Review equipment, ammo, and video links after import.',
    stages: group.rows.map((row, index) => buildStagePayload(row, index)),
  }
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

  const matches = buildMatchGroups(rows).map((match) => ({
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

export function buildPractiscoreCsvImportPlan(csv, options = {}) {
  const rows = csvToObjects(csv)
  if (!rows.length) {
    return { success: false, error: 'PractiScore CSV import apply requires at least one data row.' }
  }

  const duplicateKeys = buildDuplicateKeySet(options.existingMatches)
  const groups = buildMatchGroups(rows)
  const actions = []
  const errors = []

  groups.forEach((group) => {
    const payload = buildMatchPayload(group, options.defaults)
    const key = matchImportKey(payload)

    if (!payload.date) {
      errors.push({ matchName: payload.matchName, reason: 'Match date is required before applying a PractiScore CSV import.' })
      return
    }

    if (duplicateKeys.has(key)) {
      actions.push({ action: 'skip-duplicate', key, payload })
      return
    }

    duplicateKeys.add(key)
    actions.push({ action: 'create-match', key, payload })
  })

  const createCount = actions.filter((action) => action.action === 'create-match').length
  const duplicateCount = actions.filter((action) => action.action === 'skip-duplicate').length

  return {
    success: errors.length === 0,
    errors,
    plan: {
      workflow: PRACTISCORE_CSV_WORKFLOW_VERSION,
      mode: 'confirm-apply',
      counts: {
        rows: rows.length,
        matches: groups.length,
        stages: rows.length,
        createMatches: createCount,
        skipDuplicates: duplicateCount,
        errors: errors.length,
      },
      actions,
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
