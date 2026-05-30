'use client'

import { Activity, Banknote, Gauge, Wrench } from 'lucide-react'
import { useState } from 'react'
import { ExpensesDashboard } from './expenses-dashboard'
import { MatchesDashboard } from './matches-dashboard'

type Tab = 'matches' | 'expenses' | 'chrono' | 'maintenance'

const tabs: Array<{
  id: Tab
  label: string
  icon: React.ComponentType<{ className?: string }>
}> = [
  { id: 'matches', label: 'Matches', icon: Activity },
  { id: 'expenses', label: 'Expenses', icon: Banknote },
  { id: 'chrono', label: 'Chrono', icon: Gauge },
  { id: 'maintenance', label: 'Maintenance', icon: Wrench },
]

export function AppDashboard() {
  const [activeTab, setActiveTab] = useState<Tab>('matches')

  return (
    <div className="grid gap-6">
      <nav className="flex gap-1 overflow-x-auto rounded-lg border border-zinc-200 bg-white p-1 shadow-sm">
        {tabs.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`inline-flex shrink-0 items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition ${
                isActive
                  ? 'bg-zinc-950 text-white'
                  : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-950'
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          )
        })}
      </nav>

      {activeTab === 'matches' ? <MatchesDashboard /> : null}
      {activeTab === 'expenses' ? <ExpensesDashboard /> : null}
      {activeTab === 'chrono' ? <Placeholder title="Chrono" /> : null}
      {activeTab === 'maintenance' ? <Placeholder title="Maintenance" /> : null}
    </div>
  )
}

function Placeholder({ title }: { title: string }) {
  return (
    <section className="rounded-lg border border-zinc-200 bg-white px-4 py-10 text-center shadow-sm">
      <h2 className="text-base font-semibold text-zinc-950">{title}</h2>
      <p className="mt-1 text-sm text-zinc-500">API is ready. UI comes next.</p>
    </section>
  )
}
