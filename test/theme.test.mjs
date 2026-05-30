import assert from 'node:assert/strict'
import test from 'node:test'

import {
  THEME_STORAGE_KEY,
  getInitialTheme,
  getNextTheme,
  isTheme,
} from '../src/lib/theme.mjs'

test('recognizes only supported tracker themes', () => {
  assert.equal(isTheme('dark'), true)
  assert.equal(isTheme('light'), true)
  assert.equal(isTheme('system'), false)
  assert.equal(isTheme(''), false)
})

test('defaults to dark unless a stored light or dark preference exists', () => {
  assert.equal(getInitialTheme(null), 'dark')
  assert.equal(getInitialTheme('system'), 'dark')
  assert.equal(getInitialTheme('light'), 'light')
  assert.equal(getInitialTheme('dark'), 'dark')
})

test('toggles between dark and light themes', () => {
  assert.equal(getNextTheme('dark'), 'light')
  assert.equal(getNextTheme('light'), 'dark')
})

test('uses a stable localStorage key for the UI switch', () => {
  assert.equal(THEME_STORAGE_KEY, 'practical-tracker-theme')
})
