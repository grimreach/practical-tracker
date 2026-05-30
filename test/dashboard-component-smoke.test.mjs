import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

import {
  DASHBOARD_TAB_SMOKE_CONTRACTS,
  DEFAULT_DASHBOARD_TAB_ID,
  getDashboardTabSmokeContract,
} from '../src/lib/dashboard-component-smoke.mjs'

const expectedTabs = ['overview', 'matches', 'guns', 'expenses', 'chrono', 'maintenance']

test('defines smoke contracts for every major dashboard tab', () => {
  assert.deepEqual(
    DASHBOARD_TAB_SMOKE_CONTRACTS.map((tab) => tab.id),
    expectedTabs,
  )

  for (const tab of DASHBOARD_TAB_SMOKE_CONTRACTS) {
    assert.equal(typeof tab.label, 'string')
    assert.ok(tab.label.length > 0)
    assert.equal(typeof tab.componentName, 'string')
    assert.ok(tab.componentName.endsWith('Dashboard'))
    assert.equal(typeof tab.sourcePath, 'string')
    assert.ok(tab.sourcePath.endsWith('.tsx'))
    assert.equal(typeof tab.primaryHeading, 'string')
    assert.ok(tab.primaryHeading.length > 0)
    assert.equal(typeof tab.emptyState, 'string')
    assert.ok(tab.emptyState.length > 0)
    assert.ok(Array.isArray(tab.apiRoutes))
  }
})

test('keeps the season overview as the default dashboard smoke target', () => {
  assert.equal(DEFAULT_DASHBOARD_TAB_ID, 'overview')
  assert.equal(getDashboardTabSmokeContract(DEFAULT_DASHBOARD_TAB_ID).componentName, 'SeasonOverviewDashboard')
})

test('tracks API dependencies used by data-backed dashboard components', () => {
  assert.deepEqual(getDashboardTabSmokeContract('overview').apiRoutes, [
    '/api/matches',
    '/api/expenses',
    '/api/chrono',
    '/api/maintenance',
    '/api/export',
  ])
  assert.deepEqual(getDashboardTabSmokeContract('matches').apiRoutes, ['/api/matches'])
  assert.deepEqual(getDashboardTabSmokeContract('guns').apiRoutes, ['/api/guns'])
  assert.deepEqual(getDashboardTabSmokeContract('expenses').apiRoutes, ['/api/expenses'])
  assert.deepEqual(getDashboardTabSmokeContract('chrono').apiRoutes, ['/api/chrono'])
  assert.deepEqual(getDashboardTabSmokeContract('maintenance').apiRoutes, ['/api/maintenance'])
})

test('uses unique tab labels, component names, and primary headings for reliable smoke assertions', () => {
  const labels = new Set(DASHBOARD_TAB_SMOKE_CONTRACTS.map((tab) => tab.label))
  const components = new Set(DASHBOARD_TAB_SMOKE_CONTRACTS.map((tab) => tab.componentName))
  const headings = new Set(DASHBOARD_TAB_SMOKE_CONTRACTS.map((tab) => tab.primaryHeading))

  assert.equal(labels.size, DASHBOARD_TAB_SMOKE_CONTRACTS.length)
  assert.equal(components.size, DASHBOARD_TAB_SMOKE_CONTRACTS.length)
  assert.equal(headings.size, DASHBOARD_TAB_SMOKE_CONTRACTS.length)
})

test('smoke contracts stay anchored to real component headings and empty states', () => {
  for (const tab of DASHBOARD_TAB_SMOKE_CONTRACTS) {
    const source = readFileSync(tab.sourcePath, 'utf8')

    assert.match(source, new RegExp(`export function ${tab.componentName}\\b`))
    assert.ok(
      source.includes(tab.primaryHeading),
      `${tab.componentName} should render primary heading “${tab.primaryHeading}”`,
    )
    assert.ok(
      source.includes(tab.emptyState),
      `${tab.componentName} should render empty state “${tab.emptyState}”`,
    )
  }
})

test('dashboard form tabs share reusable UI primitives instead of local helper copies', () => {
  const sharedUiSource = readFileSync(new URL('../src/app/dashboard-ui.tsx', import.meta.url), 'utf8')
  for (const exportedName of [
    'DashboardMetric',
    'DashboardBadge',
    'DashboardStat',
    'DashboardField',
    'DashboardStateBlock',
    'DashboardRelationshipLabels',
  ]) {
    assert.match(sharedUiSource, new RegExp(`export function ${exportedName}\\b`))
  }

  for (const tabId of ['matches', 'guns', 'expenses', 'chrono', 'maintenance']) {
    const tab = getDashboardTabSmokeContract(tabId)
    const source = readFileSync(tab.sourcePath, 'utf8')
    assert.ok(source.includes("from './dashboard-ui'"), `${tab.componentName} should import shared dashboard UI primitives`)
    assert.doesNotMatch(source, /function (Metric|Badge|Stat|Field|StateBlock)\b/)
  }
})

test('throws a clear error for unknown dashboard smoke targets', () => {
  assert.throws(
    () => getDashboardTabSmokeContract('unknown'),
    /Unknown dashboard tab smoke contract: unknown/,
  )
})
