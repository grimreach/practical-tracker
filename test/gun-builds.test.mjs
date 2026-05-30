import test from 'node:test'
import assert from 'node:assert/strict'

import {
  buildPartFormFromRecord,
  calculateBuildTotal,
  gunFormFromRecord,
  normalizeBuildParts,
  serializeGunBuildNotes,
  deserializeGunBuildNotes,
  validateBuildPartForm,
  validateGunForm,
} from '../src/lib/gun-builds.mjs'

const pccBuild = {
  id: 'gun-1',
  name: '9mm PCC Build',
  caliber: '9mm',
  discipline: ['USPSA', 'SCSA'],
  imageUrl: 'https://example.com/pcc.jpg',
  notes: 'GRS competition build',
  isActive: true,
  buildParts: [
    { id: 'part-2', componentType: 'Optic', brandModel: 'Vortex Razor AMG UH-1 Gen II', retailPrice: 599, notes: 'Street price', sortOrder: 2 },
    { id: 'part-1', componentType: 'Lower Receiver', brandModel: 'Aero Precision EPC-9 Lower', retailPrice: 140, notes: null, sortOrder: 1 },
  ],
}

test('converts an existing gun build into editable form state', () => {
  assert.deepEqual(gunFormFromRecord(pccBuild), {
    name: '9mm PCC Build',
    caliber: '9mm',
    discipline: ['USPSA', 'SCSA'],
    imageUrl: 'https://example.com/pcc.jpg',
    notes: 'GRS competition build',
    isActive: true,
  })

  assert.deepEqual(buildPartFormFromRecord(pccBuild.buildParts[1]), {
    componentType: 'Lower Receiver',
    brandModel: 'Aero Precision EPC-9 Lower',
    retailPrice: '140',
    notes: '',
    sortOrder: '1',
  })
})

test('calculates build totals from parts without double-counting empty or invalid prices', () => {
  assert.equal(
    calculateBuildTotal([
      { retailPrice: 140 },
      { retailPrice: '254.00' },
      { retailPrice: '' },
      { retailPrice: 'not a price' },
      { retailPrice: 0 },
    ]),
    394,
  )
})

test('normalizes build parts into stable display order', () => {
  assert.deepEqual(normalizeBuildParts(pccBuild.buildParts).map((part) => part.id), ['part-1', 'part-2'])
})

test('validates gun and build part forms near the relevant fields', () => {
  assert.deepEqual(validateGunForm({ name: '', caliber: '', imageUrl: 'ftp://example.com/photo.jpg' }), {
    name: 'Build name is required.',
    caliber: 'Caliber is required.',
    imageUrl: 'Image URL must start with http:// or https://.',
  })

  assert.deepEqual(validateBuildPartForm({ componentType: '', brandModel: '', retailPrice: '-1' }), {
    componentType: 'Component type is required.',
    brandModel: 'Brand/model is required.',
    retailPrice: 'Retail price cannot be negative.',
  })
})

test('serializes gun build metadata into notes without requiring new database columns', () => {
  const stored = serializeGunBuildNotes({
    notes: 'GRS competition build',
    imageUrl: 'https://example.com/pcc.jpg',
    buildParts: [
      { componentType: 'Lower Receiver', brandModel: 'Aero Precision EPC-9 Lower', retailPrice: 140, notes: 'MSRP', sortOrder: 1 },
    ],
  })

  assert.equal(stored.includes('GRS competition build'), true)
  const parsed = deserializeGunBuildNotes(stored)
  assert.equal(parsed.notes, 'GRS competition build')
  assert.equal(parsed.imageUrl, 'https://example.com/pcc.jpg')
  assert.deepEqual(parsed.buildParts.map((part) => part.componentType), ['Lower Receiver'])
})

test('treats legacy plain gun notes as user notes with no build metadata', () => {
  assert.deepEqual(deserializeGunBuildNotes('Plain notes from an older gun profile'), {
    notes: 'Plain notes from an older gun profile',
    imageUrl: '',
    buildParts: [],
  })
})
