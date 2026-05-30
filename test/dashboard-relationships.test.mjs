import assert from 'node:assert/strict'
import test from 'node:test'

import {
  dashboardRelationshipLabels,
  gunRelationshipName,
  matchRelationshipName,
} from '../src/lib/dashboard-relationships.mjs'

test('formats match relationships with a stable fallback order', () => {
  assert.equal(matchRelationshipName({ matchName: 'Oil Capital USPSA', club: 'Oil Capital' }), 'Oil Capital USPSA')
  assert.equal(matchRelationshipName({ matchName: null, club: 'Oil Capital' }), 'Oil Capital')
  assert.equal(matchRelationshipName({ matchName: '', club: '' }), 'Untitled match')
  assert.equal(matchRelationshipName(null), null)
})

test('formats gun relationships only when a display name is available', () => {
  assert.equal(gunRelationshipName({ name: 'PCC Match Rifle' }), 'PCC Match Rifle')
  assert.equal(gunRelationshipName({ name: '' }), null)
  assert.equal(gunRelationshipName(null), null)
})

test('builds labeled dashboard relationships in firearm then match order', () => {
  assert.deepEqual(
    dashboardRelationshipLabels({
      gun: { name: 'PCC Match Rifle' },
      match: { matchName: null, club: 'Oil Capital' },
    }),
    [
      { label: 'Firearm', value: 'PCC Match Rifle' },
      { label: 'Match', value: 'Oil Capital' },
    ],
  )

  assert.deepEqual(dashboardRelationshipLabels(), [])
})
