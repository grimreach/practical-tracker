export const EXPORT_WORKFLOW_VERSION = 'export-v1'

const DATASET_KEYS = ['guns', 'matches', 'expenses', 'chronoEntries', 'maintenanceLogs']

function countRecords(value) {
  return Array.isArray(value) ? value.length : 0
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

export function validateImportPreviewPayload(payload = {}) {
  if (payload.app !== 'practical-tracker') {
    return { success: false, error: 'Import file is not a Practical Tracker export.' }
  }

  if (payload.workflow !== EXPORT_WORKFLOW_VERSION) {
    return { success: false, error: `Unsupported import workflow: ${payload.workflow ?? 'missing'}.` }
  }

  if (!payload.data || typeof payload.data !== 'object') {
    return { success: false, error: 'Import file is missing its data block.' }
  }

  return { success: true, summary: buildExportSummary(payload) }
}
