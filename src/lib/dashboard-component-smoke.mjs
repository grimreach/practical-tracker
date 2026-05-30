/**
 * Dashboard component smoke contracts are intentionally framework-free so Phase 6
 * can verify the major signed-in tabs without coupling tests to React internals.
 */

export const DEFAULT_DASHBOARD_TAB_ID = 'overview'

export const DASHBOARD_TAB_SMOKE_CONTRACTS = [
  {
    id: 'overview',
    label: 'Overview',
    description: 'Season signals, next actions',
    componentName: 'SeasonOverviewDashboard',
    sourcePath: 'src/app/season-overview-dashboard.tsx',
    primaryHeading: 'Season Overview',
    emptyState: 'Log a match to start the season overview.',
    apiRoutes: ['/api/matches', '/api/expenses', '/api/chrono', '/api/maintenance'],
  },
  {
    id: 'matches',
    label: 'Matches',
    description: 'Results, stage notes, video',
    componentName: 'MatchesDashboard',
    sourcePath: 'src/app/matches-dashboard.tsx',
    primaryHeading: 'Match Cards',
    emptyState: 'No matches logged yet.',
    apiRoutes: ['/api/matches'],
  },
  {
    id: 'guns',
    label: 'Gun Builds',
    description: 'Photos, parts, build cost',
    componentName: 'GunsDashboard',
    sourcePath: 'src/app/guns-dashboard.tsx',
    primaryHeading: 'Equipment profiles, photos, parts, and cost',
    emptyState: 'No gun builds yet',
    apiRoutes: ['/api/guns'],
  },
  {
    id: 'expenses',
    label: 'Expenses',
    description: 'Fees, ammo, parts, travel',
    componentName: 'ExpensesDashboard',
    sourcePath: 'src/app/expenses-dashboard.tsx',
    primaryHeading: 'Expense command center',
    emptyState: 'No expenses logged yet.',
    apiRoutes: ['/api/expenses'],
  },
  {
    id: 'chrono',
    label: 'Chrono',
    description: 'Loads, velocity, power factor',
    componentName: 'ChronoDashboard',
    sourcePath: 'src/app/chrono-dashboard.tsx',
    primaryHeading: 'Chrono & Load Development',
    emptyState: 'No chrono data logged yet.',
    apiRoutes: ['/api/chrono'],
  },
  {
    id: 'maintenance',
    label: 'Maintenance',
    description: 'Round counts, service alerts',
    componentName: 'MaintenanceDashboard',
    sourcePath: 'src/app/maintenance-dashboard.tsx',
    primaryHeading: 'Maintenance Timeline',
    emptyState: 'No maintenance logged yet.',
    apiRoutes: ['/api/maintenance'],
  },
]

export function getDashboardTabSmokeContract(tabId) {
  const contract = DASHBOARD_TAB_SMOKE_CONTRACTS.find((tab) => tab.id === tabId)

  if (!contract) {
    throw new Error(`Unknown dashboard tab smoke contract: ${tabId}`)
  }

  return contract
}
