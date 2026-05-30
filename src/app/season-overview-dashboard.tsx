'use client'

import { useEffect, useMemo, useState } from 'react'
import { Activity, AlertTriangle, Banknote, Clapperboard, Gauge, ListChecks, PlayCircle, Target, TrendingUp, Wrench } from 'lucide-react'
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { DISCIPLINES, fmt$, fmtDate } from '@/lib/constants'
import { buildSeasonOverview } from '@/lib/season-overview.mjs'
import { buildSeasonReportCards, buildTrendChartData } from '@/lib/season-reports.mjs'

type Stage = {
  id: string
  stageNum: number
  stageName: string | null
  youtubeUrl: string | null
  notes: string | null
}

type Match = {
  id: string
  date: string
  club: string
  matchName: string | null
  discipline: keyof typeof DISCIPLINES
  percentile: number | null
  roundsUsed: number
  ammoCostPerRound: number
  powerFactor: number | null
  stages: Stage[]
}

type Expense = {
  id: string
  amount: number
}

type ChronoEntry = {
  id: string
  date: string
  powerFactor: number
}

type MaintenanceLog = {
  id: string
  date: string
  totalRoundsSinceClean: number
  action: string
}

type Overview = ReturnType<typeof buildSeasonOverview>
type ReportCard = { title: string; label: string; value: string; detail: string } | null
type OverviewTab = 'matches' | 'expenses' | 'chrono' | 'maintenance'

type SeasonOverviewProps = {
  onNavigate: (tab: OverviewTab) => void
}

function metricCard(label: string, value: string, detail: string, icon: React.ReactNode) {
  return (
    <article className="rounded-3xl border border-zinc-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">{label}</span>
        <span className="rounded-2xl border border-zinc-200 bg-zinc-50 p-2 text-zinc-500">{icon}</span>
      </div>
      <strong className="mt-4 block text-3xl font-semibold tracking-tight text-zinc-950">{value}</strong>
      <p className="mt-2 text-sm leading-6 text-zinc-600">{detail}</p>
    </article>
  )
}
function reportCard(card: ReportCard, fallback: string) {
  return (
    <article className="rounded-3xl border border-zinc-200 bg-white p-4 shadow-sm">
      {card ? (
        <>
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">{card.title}</span>
          <strong className="mt-3 block text-2xl font-semibold tracking-tight text-zinc-950">{card.value}</strong>
          <p className="mt-1 text-sm font-medium text-zinc-800">{card.label}</p>
          <p className="mt-2 text-sm leading-6 text-zinc-500">{card.detail}</p>
        </>
      ) : (
        <p className="text-sm leading-6 text-zinc-500">{fallback}</p>
      )}
    </article>
  )
}


function maintenanceClass(tone: string) {
  if (tone === 'due') return 'border-red-200 bg-red-50 text-red-700'
  if (tone === 'watchlist') return 'border-amber-200 bg-amber-50 text-amber-800'
  if (tone === 'healthy') return 'border-emerald-200 bg-emerald-50 text-emerald-700'
  return 'border-zinc-200 bg-zinc-50 text-zinc-600'
}

function matchLabel(match: Match) {
  return match.matchName || match.club || 'Untitled match'
}

async function loadJson<T>(url: string): Promise<T> {
  const res = await fetch(url, { cache: 'no-store' })
  if (!res.ok) throw new Error(`Could not load ${url}`)
  return res.json() as Promise<T>
}

export function SeasonOverviewDashboard({ onNavigate }: SeasonOverviewProps) {
  const [matches, setMatches] = useState<Match[]>([])
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [chronoEntries, setChronoEntries] = useState<ChronoEntry[]>([])
  const [maintenanceLogs, setMaintenanceLogs] = useState<MaintenanceLog[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let isActive = true

    async function loadOverview() {
      try {
        const [nextMatches, nextExpenses, nextChrono, nextMaintenance] = await Promise.all([
          loadJson<Match[]>('/api/matches?limit=200'),
          loadJson<Expense[]>('/api/expenses'),
          loadJson<ChronoEntry[]>('/api/chrono'),
          loadJson<MaintenanceLog[]>('/api/maintenance'),
        ])

        if (!isActive) return
        setMatches(nextMatches)
        setExpenses(nextExpenses)
        setChronoEntries(nextChrono)
        setMaintenanceLogs(nextMaintenance)
        setIsLoading(false)
      } catch {
        if (!isActive) return
        setError('Could not load season overview data.')
        setIsLoading(false)
      }
    }

    void loadOverview()

    return () => {
      isActive = false
    }
  }, [])

  const overview = useMemo<Overview>(
    () => buildSeasonOverview({ matches, expenses, chronoEntries, maintenanceLogs }) as Overview,
    [chronoEntries, expenses, maintenanceLogs, matches],
  )
  const chartData = useMemo(
    () => buildTrendChartData({ matches, expenses, chronoEntries, maintenanceLogs }),
    [chronoEntries, expenses, maintenanceLogs, matches],
  )
  const reportCards = useMemo(
    () => buildSeasonReportCards({ matches, expenses, chronoEntries }),
    [chronoEntries, expenses, matches],
  )

  if (isLoading) {
    return (
      <section className="placeholder-panel rounded-3xl border border-zinc-200 bg-white p-8 text-center shadow-sm">
        <p className="text-sm font-semibold text-zinc-950">Building season overview…</p>
        <p className="mt-2 text-sm text-zinc-500">Gathering matches, spend, chrono, and maintenance signals.</p>
      </section>
    )
  }

  if (error) {
    return (
      <section className="rounded-3xl border border-red-200 bg-red-50 p-6 text-sm text-red-700 shadow-sm">
        {error}
      </section>
    )
  }

  return (
    <div className="grid gap-6">
      <section className="hero-panel rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1.1fr)_minmax(280px,0.9fr)] lg:items-center">
          <div>
            <span className="status-pill">
              <TrendingUp className="h-3.5 w-3.5" /> Season Overview
            </span>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight text-zinc-950 sm:text-4xl">
              How the season is trending right now.
            </h2>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-zinc-600">
              Your signed-in command center combines match output, round count, spend, power factor,
              video review, and maintenance status so the next action is obvious.
            </p>
          </div>

          <div className={`rounded-3xl border p-4 ${maintenanceClass(overview.maintenanceSignal.tone)}`}>
            <div className="flex items-center gap-2 text-sm font-semibold">
              <Wrench className="h-4 w-4" /> Maintenance signal
            </div>
            <strong className="mt-3 block text-2xl">{overview.maintenanceSignal.label}</strong>
            <p className="mt-2 text-sm leading-6">{overview.maintenanceSignal.detail}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => onNavigate('maintenance')}
                className="rounded-full border border-current px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] opacity-80 transition hover:opacity-100"
              >
                Open maintenance
              </button>
              <a
                href="/api/export"
                className="rounded-full border border-current px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] opacity-80 transition hover:opacity-100"
              >
                Export data
              </a>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
        {metricCard('Matches shot', overview.matchesShot.toLocaleString(), 'Logged match history this season.', <Activity className="h-4 w-4" />)}
        {metricCard('Total rounds', overview.totalRounds.toLocaleString(), 'Match rounds tracked from results.', <Target className="h-4 w-4" />)}
        {metricCard('Total spend', fmt$(overview.totalSpend), 'Expenses plus match ammo cost.', <Banknote className="h-4 w-4" />)}
        {metricCard('Avg percentile', `${overview.averagePercentile}%`, 'Average across scored matches.', <TrendingUp className="h-4 w-4" />)}
        {metricCard('Current PF', overview.currentPowerFactor ? String(overview.currentPowerFactor) : '—', 'Latest chrono PF, or recent match PF.', <Gauge className="h-4 w-4" />)}
        {metricCard('Video stages', overview.recentVideoStages.length.toLocaleString(), 'Recent stages ready to review.', <Clapperboard className="h-4 w-4" />)}
      </section>

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {reportCard(reportCards.bestMatch, 'Add scored matches to identify your best performance.')}
        {reportCard(reportCards.worstMatch, 'Add scored matches to find the hardest match to review.')}
        {reportCard(reportCards.mostExpensiveMonth, 'Log expenses and match ammo cost to spot spend spikes.')}
        {reportCard(reportCards.topLoad, 'Add chrono strings to surface your strongest current load.')}
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <article className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
          <h3 className="text-lg font-semibold text-zinc-950">Spend and rounds trend</h3>
          <p className="text-sm text-zinc-500">Monthly rollup from match ammo cost plus logged expenses.</p>
          <div className="mt-4 h-72">
            {chartData.length === 0 ? (
              <div className="flex h-full items-center justify-center rounded-2xl border border-dashed border-zinc-300 text-sm text-zinc-500">Add matches and expenses to build the trend.</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
                  <XAxis dataKey="period" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="Spend" fill="#18181b" radius={[8, 8, 0, 0]} />
                  <Bar dataKey="Rounds" fill="#a1a1aa" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </article>

        <article className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
          <h3 className="text-lg font-semibold text-zinc-950">Percentile, PF, and maintenance intervals</h3>
          <p className="text-sm text-zinc-500">Monthly scoring, chrono, and service rhythm for the season.</p>
          <div className="mt-4 h-72">
            {chartData.length === 0 ? (
              <div className="flex h-full items-center justify-center rounded-2xl border border-dashed border-zinc-300 text-sm text-zinc-500">Add scored matches, chrono, or maintenance logs to build the trend.</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
                  <XAxis dataKey="period" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="Percentile" stroke="#18181b" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="PF" stroke="#71717a" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="Maintenance" stroke="#d97706" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </article>
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
        <article className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold text-zinc-950">Recent matches</h3>
              <p className="text-sm text-zinc-500">Newest match signals with rounds and percentile.</p>
            </div>
            <button type="button" onClick={() => onNavigate('matches')} className="rounded-full border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-800 transition hover:bg-zinc-100">
              Open matches
            </button>
          </div>

          <div className="mt-4 grid gap-3">
            {overview.recentMatches.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-zinc-300 p-5 text-sm text-zinc-500">
                Log a match to start the season overview.
              </div>
            ) : (
              overview.recentMatches.map((match: Match) => (
                <div key={match.id} className="rounded-2xl border border-zinc-200 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <h4 className="font-semibold text-zinc-950">{matchLabel(match)}</h4>
                      <p className="text-sm text-zinc-500">
                        {fmtDate(match.date)} · {DISCIPLINES[match.discipline] ?? match.discipline} · {match.roundsUsed} rounds
                      </p>
                    </div>
                    <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-semibold text-zinc-700">
                      {match.percentile == null ? 'No score' : `${match.percentile}%`}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </article>

        <article className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
          <div className="flex items-start gap-3">
            <ListChecks className="mt-1 h-5 w-5 text-zinc-400" />
            <div>
              <h3 className="text-lg font-semibold text-zinc-950">Recommended next actions</h3>
              <p className="text-sm text-zinc-500">What needs attention before the next practice block.</p>
            </div>
          </div>
          <div className="mt-4 grid gap-3">
            {overview.nextActions.map((action: { title: string; detail: string; priority: string }) => (
              <div key={action.title} className="rounded-2xl border border-zinc-200 p-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-zinc-950">
                  {action.priority === 'high' ? <AlertTriangle className="h-4 w-4 text-red-500" /> : <Target className="h-4 w-4 text-zinc-400" />}
                  {action.title}
                </div>
                <p className="mt-2 text-sm leading-6 text-zinc-600">{action.detail}</p>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold text-zinc-950">Recent stage video</h3>
            <p className="text-sm text-zinc-500">Quick links back into the newest reviewable stages.</p>
          </div>
          <button type="button" onClick={() => onNavigate('matches')} className="rounded-full border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-800 transition hover:bg-zinc-100">
            Add / review video
          </button>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {overview.recentVideoStages.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-zinc-300 p-5 text-sm text-zinc-500 md:col-span-3">
              No stage videos yet. Add YouTube links on the Matches tab to make this review lane useful.
            </div>
          ) : (
            overview.recentVideoStages.map((stage: Stage & { matchLabel: string; matchDate: string }) => (
              <a key={stage.id} href={stage.youtubeUrl ?? '#'} target="_blank" rel="noreferrer" className="rounded-2xl border border-zinc-200 p-4 transition hover:-translate-y-0.5 hover:shadow-md">
                <PlayCircle className="h-5 w-5 text-zinc-500" />
                <h4 className="mt-3 font-semibold text-zinc-950">Stage {stage.stageNum}: {stage.stageName || 'Video review'}</h4>
                <p className="mt-1 text-sm text-zinc-500">{stage.matchLabel} · {fmtDate(stage.matchDate)}</p>
              </a>
            ))
          )}
        </div>
      </section>
    </div>
  )
}
