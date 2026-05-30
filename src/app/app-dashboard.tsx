'use client'

import { Activity, Banknote, Gauge, ShieldCheck, Sparkles, Target, Wrench } from 'lucide-react'
import { useState } from 'react'
import { ExpensesDashboard } from './expenses-dashboard'
import { MatchesDashboard } from './matches-dashboard'

type Tab = 'matches' | 'expenses' | 'chrono' | 'maintenance'

const tabs: Array<{
  id: Tab
  label: string
  description: string
  icon: React.ComponentType<{ className?: string }>
}> = [
  { id: 'matches', label: 'Matches', description: 'Results, stage notes, video', icon: Activity },
  { id: 'expenses', label: 'Expenses', description: 'Fees, ammo, parts, travel', icon: Banknote },
  { id: 'chrono', label: 'Chrono', description: 'Loads, velocity, power factor', icon: Gauge },
  { id: 'maintenance', label: 'Maintenance', description: 'Round counts, service alerts', icon: Wrench },
]

const quickStats = [
  { label: 'Current focus', value: 'Match review', icon: Target },
  { label: 'Primary signal', value: 'Cost per round', icon: Banknote },
  { label: 'Next workspace', value: 'Chrono UI', icon: Gauge },
]

export function AppDashboard() {
  const [activeTab, setActiveTab] = useState<Tab>('matches')

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
              Log the match. Learn the pattern. Reduce the noise.
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-600">
              The interface is organized around the practical shooter workflow: record the result,
              capture context, connect cost, then review what needs attention before the next match.
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

      <nav className="dashboard-tabs grid gap-2 rounded-3xl border border-zinc-200 bg-white p-2 shadow-sm sm:grid-cols-2 lg:grid-cols-4">
        {tabs.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`dashboard-tab ${isActive ? 'is-active' : ''}`}
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

      {activeTab === 'matches' ? <MatchesDashboard /> : null}
      {activeTab === 'expenses' ? <ExpensesDashboard /> : null}
      {activeTab === 'chrono' ? <Placeholder title="Chrono" icon={Gauge} /> : null}
      {activeTab === 'maintenance' ? <Placeholder title="Maintenance" icon={Wrench} /> : null}
    </div>
  )
}

function Placeholder({
  title,
  icon: Icon,
}: {
  title: string
  icon: React.ComponentType<{ className?: string }>
}) {
  return (
    <section className="placeholder-panel rounded-3xl border border-zinc-200 bg-white px-6 py-12 text-center shadow-sm">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-zinc-200 bg-zinc-50 text-zinc-700">
        <Icon className="h-6 w-6" />
      </div>
      <p className="eyebrow mt-5">Coming next</p>
      <h2 className="mt-2 text-2xl font-semibold tracking-tight text-zinc-950">{title}</h2>
      <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-zinc-500">
        The API surface is already in place. This workspace is reserved for the next UI pass with
        the same card, metric, and form system used across matches and expenses.
      </p>
      <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-xs font-medium text-zinc-600">
        <ShieldCheck className="h-3.5 w-3.5" /> Backend ready
      </div>
    </section>
  )
}
