'use client'

import { Activity, Banknote, Crosshair, Gauge, Sparkles, Target, TrendingUp, Wrench } from 'lucide-react'
import { useState } from 'react'
import {
  DASHBOARD_TAB_SMOKE_CONTRACTS,
  DEFAULT_DASHBOARD_TAB_ID,
} from '@/lib/dashboard-component-smoke.mjs'
import { ChronoDashboard } from './chrono-dashboard'
import { ExpensesDashboard } from './expenses-dashboard'
import { GunsDashboard } from './guns-dashboard'
import { MaintenanceDashboard } from './maintenance-dashboard'
import { MatchesDashboard } from './matches-dashboard'
import { SeasonOverviewDashboard } from './season-overview-dashboard'

type Tab = 'overview' | 'matches' | 'guns' | 'expenses' | 'chrono' | 'maintenance'

type DashboardTabSmokeContract = {
  id: Tab
  label: string
  description: string
  icon: React.ComponentType<{ className?: string }>
}

const tabIcons: Record<Tab, React.ComponentType<{ className?: string }>> = {
  overview: TrendingUp,
  matches: Activity,
  guns: Crosshair,
  expenses: Banknote,
  chrono: Gauge,
  maintenance: Wrench,
}

const tabs: DashboardTabSmokeContract[] = DASHBOARD_TAB_SMOKE_CONTRACTS.map((tab) => ({
  id: tab.id as Tab,
  label: tab.label,
  description: tab.description,
  icon: tabIcons[tab.id as Tab],
}))

const quickStats = [
  { label: 'Current focus', value: 'Season overview', icon: Target },
  { label: 'Primary signal', value: 'Next action', icon: TrendingUp },
  { label: 'Connected data', value: 'Matches + cost', icon: Banknote },
]

export function AppDashboard() {
  const [activeTab, setActiveTab] = useState<Tab>(DEFAULT_DASHBOARD_TAB_ID as Tab)

  return (
    <div className="grid gap-6">
      <section className="command-panel rounded-3xl border border-zinc-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="status-pill">
                <Sparkles className="h-3.5 w-3.5" /> Workspace ready
              </span>
              <span className="sport-pill">Open-source</span>
            </div>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight text-zinc-950 sm:text-3xl">
              Start with the season signal, then drill into the work.
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-600">
              The first signed-in view now answers how you are doing, what you spent,
              and what needs attention next — with tabs for the deeper match, cost, chrono, and maintenance work.
            </p>
          </div>

          <div className="grid gap-2 sm:grid-cols-3 lg:w-[430px]">
            {quickStats.map((stat) => {
              const Icon = stat.icon
              return (
                <div key={stat.label} className="mini-stat">
                  <Icon className="h-4 w-4" />
                  <span>{stat.label}</span>
                  <strong>{stat.value}</strong>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      <nav className="dashboard-tabs grid gap-2 rounded-3xl border border-zinc-200 bg-white p-2 shadow-sm sm:grid-cols-2 xl:grid-cols-6">
        {tabs.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`dashboard-tab ${isActive ? 'is-active' : ''}`}
              data-smoke-target={`dashboard-tab-${tab.id}`}
              aria-pressed={isActive}
            >
              <span className="tab-icon">
                <Icon className="h-4 w-4" />
              </span>
              <span className="min-w-0 text-left">
                <span className="block truncate text-sm font-semibold">{tab.label}</span>
                <span className="block truncate text-xs opacity-70">{tab.description}</span>
              </span>
            </button>
          )
        })}
      </nav>

      {activeTab === 'overview' ? <SeasonOverviewDashboard onNavigate={setActiveTab} /> : null}
      {activeTab === 'matches' ? <MatchesDashboard /> : null}
      {activeTab === 'guns' ? <GunsDashboard /> : null}
      {activeTab === 'expenses' ? <ExpensesDashboard /> : null}
      {activeTab === 'chrono' ? <ChronoDashboard /> : null}
      {activeTab === 'maintenance' ? <MaintenanceDashboard /> : null}
    </div>
  )
}
