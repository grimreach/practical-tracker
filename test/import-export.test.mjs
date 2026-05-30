import test from 'node:test'
import assert from 'node:assert/strict'

import { buildExportSummary, validateImportPreviewPayload } from '../src/lib/import-export.mjs'

const exportPayload = {
  app: 'practical-tracker',
  version: '0.12.0',
  exportedAt: '2026-05-30T00:00:00.000Z',
  workflow: 'export-v1',
  data: {
    guns: [{ id: 'gun-1' }],
    matches: [{ id: 'match-1' }, { id: 'match-2' }],
    expenses: [{ id: 'expense-1' }],
    chronoEntries: [],
    maintenanceLogs: [{ id: 'maintenance-1' }],
  },
}

test('summarizes Practical Tracker export payloads without mutating user data', () => {
  assert.deepEqual(buildExportSummary(exportPayload), {
    workflow: 'export-v1',
    exportedAt: '2026-05-30T00:00:00.000Z',
    version: '0.12.0',
    counts: {
      guns: 1,
      matches: 2,
      expenses: 1,
      chronoEntries: 0,
      maintenanceLogs: 1,
    },
  })
})

test('accepts valid export files for import preview', () => {
  const preview = validateImportPreviewPayload(exportPayload)

  assert.equal(preview.success, true)
  assert.equal(preview.summary.counts.matches, 2)
})

test('rejects non-Practical Tracker and unsupported import files', () => {
  assert.equal(validateImportPreviewPayload({ app: 'other', workflow: 'export-v1', data: {} }).success, false)
  assert.equal(validateImportPreviewPayload({ app: 'practical-tracker', workflow: 'legacy', data: {} }).success, false)
  assert.equal(validateImportPreviewPayload({ app: 'practical-tracker', workflow: 'export-v1' }).success, false)
})
