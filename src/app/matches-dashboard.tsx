'use client'

import { FormEvent, useEffect, useMemo, useState } from 'react'
import { ArrowUpDown, ChevronLeft, Edit3, ExternalLink, Filter, LayoutGrid, List, PlayCircle, Plus, Search, Trash2, X } from 'lucide-react'
import {
  DISCIPLINES,
  DIVISIONS,
  MATCH_TIERS,
  fmt$,
  fmtDate,
} from '@/lib/constants'
import {
  MATCH_SORTS,
  filterAndSortMatches,
  getMatchFilterSummary,
} from '@/lib/match-history.mjs'
import { getStageReviewDetails } from '@/lib/stage-review.mjs'

type Match = {
  id: string
  date: string
  club: string
  matchName: string | null
  discipline: keyof typeof DISCIPLINES
  division: string | null
  tier: keyof typeof MATCH_TIERS
  placement: number | null
  totalCompetitors: number | null
  percentile: number | null
  roundsUsed: number
  ammoCostPerRound: number
  powerFactor: number | null
  pfType: string | null
  dq: boolean
  notes: string | null
  stages: Stage[]
}

type Stage = {
  id: string
  stageNum: number
  stageName: string | null
  youtubeUrl: string | null
  notes: string | null
}

type FormState = {
  date: string
  club: string
  matchName: string
  discipline: keyof typeof DISCIPLINES
  division: string
  tier: keyof typeof MATCH_TIERS
  placement: string
  totalCompetitors: string
  roundsUsed: string
  ammoCostPerRound: string
  powerFactor: string
  pfType: string
  notes: string
}

type StageForm = {
  stageNum: string
  stageName: string
  youtubeUrl: string
  notes: string
}

type MatchSort = keyof typeof MATCH_SORTS
type MatchViewMode = 'cards' | 'compact'
type DisciplineFilter = keyof typeof DISCIPLINES | 'ALL'
type TierFilter = keyof typeof MATCH_TIERS | 'ALL'

const today = new Date().toISOString().slice(0, 10)

const initialForm: FormState = {
  date: today,
  club: '',
  matchName: '',
  discipline: 'USPSA',
  division: 'PCC',
  tier: 'LOCAL',
  placement: '',
  totalCompetitors: '',
  roundsUsed: '',
  ammoCostPerRound: '',
  powerFactor: '',
  pfType: '',
  notes: '',
}

function dateForInput(value: string) {
  return new Date(value).toISOString().slice(0, 10)
}

function numberToInput(value: number | null) {
  return value === null ? '' : String(value)
}

function toOptionalNumber(value: string) {
  return value.trim() === '' ? undefined : Number(value)
}

function isYouTubeUrl(value: string) {
  if (value.trim() === '') return true

  try {
    const url = new URL(value)
    const host = url.hostname.replace(/^www\./, '')
    const isWebUrl = url.protocol === 'https:' || url.protocol === 'http:'
    return isWebUrl && (host === 'youtube.com' || host === 'youtu.be' || host.endsWith('.youtube.com'))
  } catch {
    return false
  }
}

function youtubeEmbedUrl(value: string | null) {
  if (!value) return null

  try {
    const url = new URL(value)
    const host = url.hostname.replace(/^www\./, '')

    if (host === 'youtu.be') {
      const id = url.pathname.split('/').filter(Boolean)[0]
      return id ? `https://www.youtube.com/embed/${id}` : null
    }

    if (host === 'youtube.com' || host.endsWith('.youtube.com')) {
      if (url.pathname.startsWith('/embed/')) return url.toString()
      if (url.pathname.startsWith('/shorts/')) {
        const id = url.pathname.split('/').filter(Boolean)[1]
        return id ? `https://www.youtube.com/embed/${id}` : null
      }
      const id = url.searchParams.get('v')
      return id ? `https://www.youtube.com/embed/${id}` : null
    }

    return null
  } catch {
    return null
  }
}

function formFromMatch(match: Match): FormState {
  return {
    date: dateForInput(match.date),
    club: match.club,
    matchName: match.matchName ?? '',
    discipline: match.discipline,
    division: match.division ?? DIVISIONS[match.discipline]?.[0] ?? '',
    tier: match.tier,
    placement: numberToInput(match.placement),
    totalCompetitors: numberToInput(match.totalCompetitors),
    roundsUsed: String(match.roundsUsed),
    ammoCostPerRound: String(match.ammoCostPerRound),
    powerFactor: numberToInput(match.powerFactor),
    pfType: match.pfType ?? '',
    notes: match.notes ?? '',
  }
}

function stageRowsFromMatch(match: Match): StageForm[] {
  return match.stages.map((stage) => ({
    stageNum: String(stage.stageNum),
    stageName: stage.stageName ?? '',
    youtubeUrl: stage.youtubeUrl ?? '',
    notes: stage.notes ?? '',
  }))
}

export function MatchesDashboard() {
  const [matches, setMatches] = useState<Match[]>([])
  const [form, setForm] = useState<FormState>(initialForm)
  const [stageRows, setStageRows] = useState<StageForm[]>([])
  const [editingId, setEditingId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [disciplineFilter, setDisciplineFilter] = useState<DisciplineFilter>('ALL')
  const [tierFilter, setTierFilter] = useState<TierFilter>('ALL')
  const [sortMode, setSortMode] = useState<MatchSort>('newest')
  const [viewMode, setViewMode] = useState<MatchViewMode>('cards')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const divisions = useMemo(() => DIVISIONS[form.discipline] ?? [], [form.discipline])
  const matchCount = matches.length
  const totalRounds = matches.reduce((sum, match) => sum + match.roundsUsed, 0)
  const totalAmmoCost = matches.reduce(
    (sum, match) => sum + match.roundsUsed * match.ammoCostPerRound,
    0,
  )
  const selectedMatch = matches.find((match) => match.id === selectedMatchId) ?? null
  const filteredMatches = useMemo(
    () =>
      filterAndSortMatches(matches, {
        query,
        discipline: disciplineFilter,
        tier: tierFilter,
        sort: sortMode,
      }) as Match[],
    [disciplineFilter, matches, query, sortMode, tierFilter],
  )
  const filterSummary = getMatchFilterSummary(filteredMatches.length, matchCount, {
    query,
    discipline: disciplineFilter,
    tier: tierFilter,
    sort: sortMode,
  })
  const hasActiveFilters =
    query.trim() !== '' || disciplineFilter !== 'ALL' || tierFilter !== 'ALL' || sortMode !== 'newest'

  useEffect(() => {
    let isActive = true

    async function loadMatches() {
      try {
        const res = await fetch('/api/matches', { cache: 'no-store' })
        if (!isActive) return

        if (!res.ok) {
          setError('Could not load matches.')
          setIsLoading(false)
          return
        }

        const loadedMatches = (await res.json()) as Match[]
        setMatches(loadedMatches)
        setSelectedMatchId((current) =>
          current && loadedMatches.some((match) => match.id === current) ? current : null,
        )
        setIsLoading(false)
      } catch {
        if (!isActive) return
        setError('Could not load matches.')
        setIsLoading(false)
      }
    }

    void loadMatches()

    return () => {
      isActive = false
    }
  }, [])

  function updateField<Key extends keyof FormState>(key: Key, value: FormState[Key]) {
    setForm((current) => {
      const next = { ...current, [key]: value }
      if (key === 'discipline') {
        const nextDivisions = DIVISIONS[value] ?? []
        next.division = nextDivisions[0] ?? ''
      }
      return next
    })
  }

  function resetForm() {
    setForm(initialForm)
    setStageRows([])
    setEditingId(null)
    setError(null)
    setSuccess(null)
  }

  function editMatch(match: Match) {
    setForm(formFromMatch(match))
    setStageRows(stageRowsFromMatch(match))
    setEditingId(match.id)
    setError(null)
    setSuccess(null)
  }

  async function deleteMatch(match: Match) {
    const label = match.matchName || match.club
    if (!window.confirm(`Delete ${label}?`)) return

    setDeletingId(match.id)
    setError(null)
    setSuccess(null)

    const res = await fetch(`/api/matches/${match.id}`, { method: 'DELETE' })
    if (!res.ok) {
      setError('Could not delete match.')
      setDeletingId(null)
      return
    }

    setMatches((current) => current.filter((item) => item.id !== match.id))
    setSelectedMatchId((current) => (current === match.id ? null : current))
    if (editingId === match.id) resetForm()
    setSuccess('Match deleted.')
    setDeletingId(null)
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsSaving(true)
    setError(null)
    setSuccess(null)

    if (stageRows.some((stage) => !isYouTubeUrl(stage.youtubeUrl))) {
      setError('Stage video links must be YouTube URLs.')
      setIsSaving(false)
      return
    }

    const payload = {
      date: form.date,
      club: form.club.trim(),
      matchName: form.matchName.trim() || undefined,
      discipline: form.discipline,
      division: form.division || undefined,
      tier: form.tier,
      placement: toOptionalNumber(form.placement),
      totalCompetitors: toOptionalNumber(form.totalCompetitors),
      roundsUsed: toOptionalNumber(form.roundsUsed) ?? 0,
      ammoCostPerRound: toOptionalNumber(form.ammoCostPerRound) ?? 0,
      powerFactor: toOptionalNumber(form.powerFactor),
      pfType: form.pfType || undefined,
      notes: form.notes.trim() || undefined,
      stages: stageRows
        .filter((stage) => stage.stageName.trim() || stage.youtubeUrl.trim() || stage.notes.trim())
        .map((stage, index) => ({
          stageNum: toOptionalNumber(stage.stageNum) ?? index + 1,
          stageName: stage.stageName.trim() || undefined,
          youtubeUrl: stage.youtubeUrl.trim() || undefined,
          notes: stage.notes.trim() || undefined,
        })),
    }

    const res = await fetch(editingId ? `/api/matches/${editingId}` : '/api/matches', {
      method: editingId ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    if (!res.ok) {
      setError('Could not save match. Check the required fields and try again.')
      setIsSaving(false)
      return
    }

    const saved = (await res.json()) as Match
    setMatches((current) =>
      editingId
        ? current.map((match) => (match.id === saved.id ? saved : match))
        : [saved, ...current],
    )
    setSelectedMatchId(saved.id)
    setForm({ ...initialForm, date: form.date })
    setStageRows([])
    setEditingId(null)
    setSuccess(editingId ? 'Match updated.' : 'Match saved.')
    setIsSaving(false)
  }

  function addStageRow() {
    setStageRows((current) => [
      ...current,
      { stageNum: String(current.length + 1), stageName: '', youtubeUrl: '', notes: '' },
    ])
  }

  function removeStageRow(index: number) {
    setStageRows((current) => current.filter((_, currentIndex) => currentIndex !== index))
  }

  function updateStageRow<Key extends keyof StageForm>(
    index: number,
    key: Key,
    value: StageForm[Key],
  ) {
    setStageRows((current) =>
      current.map((stage, currentIndex) =>
        currentIndex === index ? { ...stage, [key]: value } : stage,
      ),
    )
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_430px]">
      <section className="min-w-0">
        <div className="mb-4 grid gap-3 sm:grid-cols-3">
          <Metric label="Matches" value={matchCount.toString()} />
          <Metric label="Rounds logged" value={totalRounds.toLocaleString()} />
          <Metric label="Ammo spend" value={fmt$(totalAmmoCost)} />
        </div>

        {selectedMatch ? (
          <MatchDetail
            match={selectedMatch}
            onBack={() => setSelectedMatchId(null)}
            onEdit={() => editMatch(selectedMatch)}
            onDelete={() => void deleteMatch(selectedMatch)}
            isDeleting={deletingId === selectedMatch.id}
          />
        ) : (
          <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm">
            <div className="flex flex-col gap-2 border-b border-zinc-200 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-base font-semibold text-zinc-950">Match Cards</h2>
                <p className="mt-1 text-sm text-zinc-500">
                  Hero summaries stay clean. Open a match to review every stage and embedded video.
                </p>
              </div>
              <span className="text-xs font-medium text-zinc-500">
                {isLoading ? 'Loading...' : filterSummary}
              </span>
            </div>

            <div className="match-filter-panel space-y-3 border-b border-zinc-200 px-4 py-4">
              <label className="relative block">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  className="input pl-9"
                  placeholder="Search match, club, note, or stage..."
                />
              </label>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_auto]">
                <label className="relative block min-w-0">
                  <Filter className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                  <select
                    value={disciplineFilter}
                    onChange={(event) => setDisciplineFilter(event.target.value as DisciplineFilter)}
                    className="input pl-9"
                  >
                    <option value="ALL">All disciplines</option>
                    {Object.entries(DISCIPLINES).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="relative block min-w-0">
                  <Filter className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                  <select
                    value={tierFilter}
                    onChange={(event) => setTierFilter(event.target.value as TierFilter)}
                    className="input pl-9"
                  >
                    <option value="ALL">All tiers</option>
                    {Object.entries(MATCH_TIERS).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="relative block min-w-0">
                  <ArrowUpDown className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                  <select
                    value={sortMode}
                    onChange={(event) => setSortMode(event.target.value as MatchSort)}
                    className="input pl-9"
                  >
                    {Object.entries(MATCH_SORTS).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </label>
                <div className="grid grid-cols-2 gap-2 sm:col-span-2 xl:col-span-1 xl:min-w-[170px]" aria-label="Match layout">
                  <button
                    type="button"
                    onClick={() => setViewMode('cards')}
                    className={`inline-flex items-center justify-center gap-2 rounded-md border px-3 py-2 text-sm font-semibold transition ${
                      viewMode === 'cards'
                        ? 'border-zinc-300 bg-white text-zinc-950 shadow-sm'
                        : 'border-zinc-200 text-zinc-500 hover:bg-zinc-100'
                    }`}
                  >
                    <LayoutGrid className="h-4 w-4" /> Cards
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode('compact')}
                    className={`inline-flex items-center justify-center gap-2 rounded-md border px-3 py-2 text-sm font-semibold transition ${
                      viewMode === 'compact'
                        ? 'border-zinc-300 bg-white text-zinc-950 shadow-sm'
                        : 'border-zinc-200 text-zinc-500 hover:bg-zinc-100'
                    }`}
                  >
                    <List className="h-4 w-4" /> List
                  </button>
                </div>
              </div>
            </div>

            {hasActiveFilters ? (
              <div className="flex flex-col gap-2 border-b border-zinc-200 px-4 py-3 text-sm text-zinc-500 sm:flex-row sm:items-center sm:justify-between">
                <span>{filterSummary}</span>
                <button
                  type="button"
                  onClick={() => {
                    setQuery('')
                    setDisciplineFilter('ALL')
                    setTierFilter('ALL')
                    setSortMode('newest')
                  }}
                  className="font-semibold text-zinc-700 hover:text-zinc-950"
                >
                  Clear filters
                </button>
              </div>
            ) : null}

            {error ? (
              <div className="border-b border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            ) : null}

            {success ? (
              <div className="border-b border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                {success}
              </div>
            ) : null}

            {isLoading ? (
              <StateBlock title="Loading match history..." detail="Pulling match cards, stages, and video review links." />
            ) : matches.length === 0 ? (
              <StateBlock
                title="No matches logged yet."
                detail="Add your first match to start tracking placements, rounds, and ammo cost."
              />
            ) : filteredMatches.length === 0 ? (
              <StateBlock
                title="No matches match those filters."
                detail="Clear the search or widen the discipline and tier filters to find prior matches."
              />
            ) : (
              <div className={viewMode === 'cards' ? 'grid gap-4 p-4' : 'divide-y divide-zinc-100'}>
                {filteredMatches.map((match) => (
                  <article
                    key={match.id}
                    className={
                      viewMode === 'cards'
                        ? 'group overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-zinc-300'
                        : 'group bg-white px-4 py-3 transition hover:bg-zinc-50/80'
                    }
                  >
                    <button
                      type="button"
                      onClick={() => setSelectedMatchId(match.id)}
                      className="block w-full p-0 text-left"
                    >
                      <div className={viewMode === 'cards' ? 'relative overflow-hidden border-b border-zinc-200 bg-zinc-50 px-5 py-5' : 'relative overflow-hidden px-0 py-1'}>
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_10%,rgba(113,112,255,0.22),transparent_28rem)]" />
                        <div className="relative flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <Badge>{DISCIPLINES[match.discipline]}</Badge>
                              {match.division ? <Badge>{match.division}</Badge> : null}
                              <Badge>{MATCH_TIERS[match.tier]}</Badge>
                              {match.stages.length > 0 ? <Badge>{match.stages.length} stages</Badge> : null}
                              {match.dq ? (
                                <span className="rounded bg-red-100 px-1.5 py-0.5 text-xs font-semibold text-red-700">
                                  DQ
                                </span>
                              ) : null}
                            </div>
                            <h3 className={viewMode === 'cards' ? 'mt-3 truncate text-2xl font-semibold tracking-tight text-zinc-950' : 'mt-2 truncate text-base font-semibold tracking-tight text-zinc-950'}>
                              {match.matchName || match.club}
                            </h3>
                            <p className="mt-1 text-sm text-zinc-600">
                              {fmtDate(match.date)} · {match.club}
                            </p>
                          </div>

                          <div className={viewMode === 'cards' ? 'grid grid-cols-3 gap-3 text-left sm:text-right md:min-w-80' : 'grid grid-cols-3 gap-3 text-left sm:min-w-72 sm:text-right'}>
                            <Stat
                              label="Place"
                              value={
                                match.placement && match.totalCompetitors
                                  ? `${match.placement}/${match.totalCompetitors}`
                                  : '-'
                              }
                            />
                            <Stat
                              label="Percentile"
                              value={match.percentile === null ? '-' : `${match.percentile}%`}
                            />
                            <Stat label="Rounds" value={match.roundsUsed.toLocaleString()} />
                          </div>
                        </div>
                      </div>
                    </button>

                    <div className={viewMode === 'cards' ? 'flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between' : 'mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'}>
                      <div className="text-sm text-zinc-600">
                        {match.powerFactor ? (
                          <span>
                            PF {match.powerFactor}
                            {match.pfType ? ` (${match.pfType})` : ''}
                          </span>
                        ) : (
                          <span>{fmt$(match.roundsUsed * match.ammoCostPerRound)} ammo logged</span>
                        )}
                        {match.notes ? <span> · {match.notes}</span> : null}
                      </div>
                      <div className="grid grid-cols-[minmax(0,1fr)_auto_auto] gap-2 sm:flex sm:justify-end">
                        <button
                          type="button"
                          onClick={() => setSelectedMatchId(match.id)}
                          className="inline-flex items-center justify-center gap-2 rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm font-semibold text-zinc-700 shadow-sm hover:bg-zinc-100"
                        >
                          <PlayCircle className="h-4 w-4" /> Review stages
                        </button>
                        <IconButton label="Edit match" onClick={() => editMatch(match)}>
                          <Edit3 className="h-4 w-4" />
                        </IconButton>
                        <IconButton
                          label="Delete match"
                          onClick={() => void deleteMatch(match)}
                          disabled={deletingId === match.id}
                        >
                          <Trash2 className="h-4 w-4" />
                        </IconButton>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        )}
      </section>

      <aside className="lg:sticky lg:top-6 lg:self-start">
        <form
          onSubmit={handleSubmit}
          className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm"
        >
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-zinc-950">
                {editingId ? 'Edit Match' : 'Log a Match'}
              </h2>
              <p className="mt-1 text-sm text-zinc-500">
                Capture results, round count, and stage review notes.
              </p>
            </div>
            {editingId ? (
              <button
                type="button"
                onClick={resetForm}
                className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-zinc-300 text-zinc-600 hover:bg-zinc-100"
                aria-label="Cancel edit"
                title="Cancel edit"
              >
                <X className="h-4 w-4" />
              </button>
            ) : null}
          </div>

          <div className="grid gap-3">
            <Field label="Date">
              <input
                required
                type="date"
                value={form.date}
                onChange={(event) => updateField('date', event.target.value)}
                className="input"
              />
            </Field>

            <Field label="Club">
              <input
                required
                value={form.club}
                onChange={(event) => updateField('club', event.target.value)}
                className="input"
                placeholder="Oak Hill Practical Shooters"
              />
            </Field>

            <Field label="Match name">
              <input
                value={form.matchName}
                onChange={(event) => updateField('matchName', event.target.value)}
                className="input"
                placeholder="May USPSA"
              />
            </Field>

            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Discipline">
                <select
                  value={form.discipline}
                  onChange={(event) =>
                    updateField('discipline', event.target.value as FormState['discipline'])
                  }
                  className="input"
                >
                  {Object.entries(DISCIPLINES).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Division">
                <select
                  value={form.division}
                  onChange={(event) => updateField('division', event.target.value)}
                  className="input"
                >
                  {divisions.map((division) => (
                    <option key={division} value={division}>
                      {division}
                    </option>
                  ))}
                </select>
              </Field>
            </div>

            <Field label="Tier">
              <select
                value={form.tier}
                onChange={(event) => updateField('tier', event.target.value as FormState['tier'])}
                className="input"
              >
                {Object.entries(MATCH_TIERS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </Field>

            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Placement">
                <input
                  min="1"
                  type="number"
                  value={form.placement}
                  onChange={(event) => updateField('placement', event.target.value)}
                  className="input"
                  placeholder="4"
                />
              </Field>

              <Field label="Competitors">
                <input
                  min="1"
                  type="number"
                  value={form.totalCompetitors}
                  onChange={(event) => updateField('totalCompetitors', event.target.value)}
                  className="input"
                  placeholder="37"
                />
              </Field>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Rounds used">
                <input
                  min="0"
                  type="number"
                  value={form.roundsUsed}
                  onChange={(event) => updateField('roundsUsed', event.target.value)}
                  className="input"
                  placeholder="142"
                />
              </Field>

              <Field label="Ammo cost / round">
                <input
                  min="0"
                  step="0.01"
                  type="number"
                  value={form.ammoCostPerRound}
                  onChange={(event) => updateField('ammoCostPerRound', event.target.value)}
                  className="input"
                  placeholder="0.24"
                />
              </Field>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Power factor">
                <input
                  min="0"
                  type="number"
                  value={form.powerFactor}
                  onChange={(event) => updateField('powerFactor', event.target.value)}
                  className="input"
                  placeholder="132"
                />
              </Field>

              <Field label="PF type">
                <select
                  value={form.pfType}
                  onChange={(event) => updateField('pfType', event.target.value)}
                  className="input"
                >
                  <option value="">None</option>
                  <option value="Minor">Minor</option>
                  <option value="Major">Major</option>
                </select>
              </Field>
            </div>

            <Field label="Notes">
              <textarea
                rows={3}
                value={form.notes}
                onChange={(event) => updateField('notes', event.target.value)}
                className="input resize-none"
                placeholder="Classifier felt good, dropped points on stage 3."
              />
            </Field>

            <section className="rounded-md border border-zinc-200 bg-zinc-50 p-3">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-sm font-semibold text-zinc-900">Stage review</h3>
                <button
                  type="button"
                  onClick={addStageRow}
                  className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-zinc-300 bg-white text-zinc-700 shadow-sm hover:bg-zinc-100"
                  aria-label="Add stage"
                  title="Add stage"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>

              {stageRows.length === 0 ? (
                <button
                  type="button"
                  onClick={addStageRow}
                  className="mt-3 w-full rounded-md border border-dashed border-zinc-300 px-3 py-3 text-sm font-medium text-zinc-600 hover:border-zinc-400 hover:bg-white"
                >
                  Add stage review
                </button>
              ) : (
                <div className="mt-3 grid gap-3">
                  {stageRows.map((stage, index) => (
                    <div
                      key={index}
                      className="grid gap-2 rounded-md border border-zinc-200 bg-white p-3"
                    >
                      <div className="grid gap-2 sm:grid-cols-[80px_minmax(0,1fr)_auto] sm:items-end">
                        <label className="grid gap-1 text-xs font-medium text-zinc-600">
                          Stage
                          <input
                            min="1"
                            type="number"
                            value={stage.stageNum}
                            onChange={(event) =>
                              updateStageRow(index, 'stageNum', event.target.value)
                            }
                            className="input"
                          />
                        </label>

                        <label className="grid min-w-0 gap-1 text-xs font-medium text-zinc-600">
                          Name
                          <input
                            value={stage.stageName}
                            onChange={(event) =>
                              updateStageRow(index, 'stageName', event.target.value)
                            }
                            className="input"
                            placeholder="Stage plan"
                          />
                        </label>

                        <button
                          type="button"
                          onClick={() => removeStageRow(index)}
                          className="inline-flex h-9 w-full shrink-0 items-center justify-center rounded-md border border-zinc-300 text-zinc-600 hover:bg-zinc-100 sm:w-9"
                          aria-label={`Remove stage ${index + 1}`}
                          title="Remove stage"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>

                      <label className="grid gap-1 text-xs font-medium text-zinc-600">
                        YouTube URL
                        <input
                          type="url"
                          value={stage.youtubeUrl}
                          onChange={(event) =>
                            updateStageRow(index, 'youtubeUrl', event.target.value)
                          }
                          className="input"
                          placeholder="https://youtu.be/..."
                        />
                      </label>

                      <label className="grid gap-1 text-xs font-medium text-zinc-600">
                        Review notes
                        <textarea
                          rows={2}
                          value={stage.notes}
                          onChange={(event) => updateStageRow(index, 'notes', event.target.value)}
                          className="input resize-none"
                          placeholder="Entry plan, mistake, fix for next time."
                        />
                      </label>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>

          <button
            disabled={isSaving}
            className="mt-4 w-full rounded-md bg-zinc-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-400"
          >
            {isSaving ? 'Saving...' : editingId ? 'Save Changes' : 'Save Match'}
          </button>
        </form>
      </aside>
    </div>
  )
}

function MatchDetail({
  match,
  isDeleting,
  onBack,
  onDelete,
  onEdit,
}: {
  match: Match
  isDeleting: boolean
  onBack: () => void
  onDelete: () => void
  onEdit: () => void
}) {
  return (
    <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm">
      <div className="border-b border-zinc-200 bg-zinc-50 px-4 py-4">
        <button
          type="button"
          onClick={onBack}
          className="mb-4 inline-flex items-center gap-2 rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm font-semibold text-zinc-700 shadow-sm hover:bg-zinc-100"
        >
          <ChevronLeft className="h-4 w-4" /> Match cards
        </button>

        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <Badge>{DISCIPLINES[match.discipline]}</Badge>
              {match.division ? <Badge>{match.division}</Badge> : null}
              <Badge>{MATCH_TIERS[match.tier]}</Badge>
              <Badge>{match.stages.length} stages</Badge>
            </div>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-zinc-950">
              {match.matchName || match.club}
            </h2>
            <p className="mt-1 text-sm text-zinc-600">
              {fmtDate(match.date)} · {match.club}
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3 text-left sm:text-right md:min-w-80">
            <Stat
              label="Place"
              value={
                match.placement && match.totalCompetitors
                  ? `${match.placement}/${match.totalCompetitors}`
                  : '-'
              }
            />
            <Stat
              label="Percentile"
              value={match.percentile === null ? '-' : `${match.percentile}%`}
            />
            <Stat label="Rounds" value={match.roundsUsed.toLocaleString()} />
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-zinc-600">
            {match.powerFactor ? (
              <span>
                PF {match.powerFactor}
                {match.pfType ? ` (${match.pfType})` : ''}
              </span>
            ) : null}
            {match.powerFactor && match.notes ? <span> · </span> : null}
            {match.notes ? <span>{match.notes}</span> : null}
            {!match.powerFactor && !match.notes ? (
              <span>{fmt$(match.roundsUsed * match.ammoCostPerRound)} ammo logged</span>
            ) : null}
          </p>
          <div className="grid w-full grid-cols-2 gap-2 sm:w-auto sm:flex">
            <button
              type="button"
              onClick={onEdit}
              className="inline-flex items-center justify-center gap-2 rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm font-semibold text-zinc-700 shadow-sm hover:bg-zinc-100"
            >
              <Edit3 className="h-4 w-4" /> Edit
            </button>
            <button
              type="button"
              onClick={onDelete}
              disabled={isDeleting}
              className="inline-flex items-center justify-center gap-2 rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm font-semibold text-zinc-700 shadow-sm hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Trash2 className="h-4 w-4" /> Delete
            </button>
          </div>
        </div>
      </div>

      {match.stages.length === 0 ? (
        <StateBlock
          title="No stages attached yet."
          detail="Edit this match and add stage names, review notes, and YouTube links."
        />
      ) : (
        <div className="grid gap-4 p-4">
          {match.stages.map((stage, index) => {
            const embedUrl = youtubeEmbedUrl(stage.youtubeUrl)
            const stageDetails = getStageReviewDetails(stage, match, {
              index,
              totalStages: match.stages.length,
            })

            return (
              <article key={stage.id} className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
                <div className="flex flex-col gap-2 border-b border-zinc-200 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                      {stageDetails.eyebrow}
                    </p>
                    <h3 className="mt-1 text-lg font-semibold text-zinc-950">
                      {stageDetails.title}
                    </h3>
                    <p className="mt-1 text-sm text-zinc-500">{stageDetails.matchContext} · {stageDetails.dateLabel}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${stageDetails.videoStatus.tone === 'ready' ? 'bg-emerald-50 text-emerald-700' : 'bg-zinc-100 text-zinc-600'}`}>
                      {stageDetails.videoStatus.label}
                    </span>
                    {stage.youtubeUrl ? (
                      <a
                        href={stage.youtubeUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-semibold text-zinc-700 hover:text-zinc-950"
                      >
                        Open YouTube
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    ) : null}
                  </div>
                </div>

                {embedUrl ? (
                  <div className="aspect-video w-full overflow-hidden bg-black">
                    <iframe
                      className="h-full w-full"
                      src={embedUrl}
                      title={`Stage ${stage.stageNum} video`}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      allowFullScreen
                    />
                  </div>
                ) : (
                  <div className="flex aspect-video w-full items-center justify-center bg-zinc-50 px-4 text-center text-sm text-zinc-500">
                    {stage.youtubeUrl
                      ? 'Could not embed this YouTube URL. Use a normal watch, shorts, or youtu.be link.'
                      : 'No video link attached to this stage yet.'}
                  </div>
                )}

                <div className="stage-review-detail-strip border-t border-zinc-200 p-4">
                  <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(220px,0.42fr)]">
                    <div className="stage-review-detail-card rounded-2xl border p-4">
                      <p className="stage-review-detail-label text-xs font-semibold uppercase tracking-[0.18em]">
                        {stageDetails.notesTitle}
                      </p>
                      <p className="stage-review-detail-copy mt-2 text-sm leading-6">{stageDetails.notes}</p>
                    </div>
                    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
                      <div className="stage-review-detail-card rounded-2xl border p-3">
                        <p className="stage-review-detail-label text-xs font-semibold uppercase tracking-wide">Round context</p>
                        <p className="stage-review-detail-value mt-1 text-sm font-semibold">{stageDetails.roundsLabel}</p>
                      </div>
                      <div className="stage-review-detail-card rounded-2xl border p-3">
                        <p className="stage-review-detail-label text-xs font-semibold uppercase tracking-wide">Load signal</p>
                        <p className="stage-review-detail-value mt-1 text-sm font-semibold">{stageDetails.powerFactorLabel}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      )}
    </div>
  )
}

function StateBlock({ title, detail }: { title: string; detail: string }) {
  return (
    <div className="px-4 py-12 text-center">
      <p className="font-medium text-zinc-900">{title}</p>
      <p className="mx-auto mt-1 max-w-md text-sm text-zinc-500">{detail}</p>
    </div>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-white px-4 py-3 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">{label}</p>
      <p className="mt-1 text-xl font-semibold text-zinc-950">{value}</p>
    </div>
  )
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded bg-zinc-100 px-1.5 py-0.5 font-medium text-zinc-700">
      {children}
    </span>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-zinc-500">{label}</p>
      <p className="font-semibold text-zinc-950">{value}</p>
    </div>
  )
}

function IconButton({
  label,
  children,
  disabled,
  onClick,
}: {
  label: string
  children: React.ReactNode
  disabled?: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-zinc-300 text-zinc-600 hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-50"
      aria-label={label}
      title={label}
    >
      {children}
    </button>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="grid gap-1.5 text-sm font-medium text-zinc-700">
      {label}
      {children}
    </label>
  )
}
