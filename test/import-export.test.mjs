import test from 'node:test'
import assert from 'node:assert/strict'

import {
  buildExportSummary,
  parsePractiscoreCsvPreview,
  validateImportPreviewPayload,
} from '../src/lib/import-export.mjs'

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

test('previews PractiScore CSV rows without mutating user data', () => {
  const csv = [
    'Match Name,Date,Club,Division,Class,Place,Percent,Points,Time,Stage Name,Stage Number',
    'Snowcap Steel,2026-05-12,North Range,PCC,B,3,87.5,480,92.35,Smoke & Hope,1',
    'Snowcap Steel,2026-05-12,North Range,PCC,B,3,87.5,460,88.10,Outer Limits,2',
  ].join('\n')

  const preview = parsePractiscoreCsvPreview(csv)

  assert.equal(preview.success, true)
  assert.equal(preview.summary.workflow, 'practiscore-csv-v1')
  assert.equal(preview.summary.counts.rows, 2)
  assert.equal(preview.summary.counts.matches, 1)
  assert.equal(preview.summary.counts.stages, 2)
  assert.equal(preview.summary.matches[0].name, 'Snowcap Steel')
  assert.equal(preview.summary.matches[0].stageCount, 2)
  assert.deepEqual(preview.summary.matches[0].detectedFields, ['division', 'class', 'place', 'percent', 'points', 'time'])
})

test('accepts PractiScore CSV import preview payloads', () => {
  const preview = validateImportPreviewPayload({
    app: 'practical-tracker',
    workflow: 'practiscore-csv-v1',
    csv: 'Match Name,Date,Stage Name\nClassifier Night,2026-05-01,CM 99-11',
  })

  assert.equal(preview.success, true)
  assert.equal(preview.summary.counts.rows, 1)
  assert.equal(preview.summary.matches[0].name, 'Classifier Night')
})

test('rejects PractiScore CSV preview files without match rows', () => {
  const preview = parsePractiscoreCsvPreview('Match Name,Date,Stage Name\n')

  assert.equal(preview.success, false)
  assert.match(preview.error, /at least one data row/)
})
