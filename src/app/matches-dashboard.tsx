'use client'

import { FormEvent, useEffect, useMemo, useState } from 'react'
import { Edit3, ExternalLink, Plus, Trash2, X } from 'lucide-react'
import {
  DISCIPLINES,
  DIVISIONS,
  MATCH_TIERS,
  fmt$,
  fmtDate,
} from '@/lib/constants'

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
  const [error, setError] = useState<string | null>(null)

  const divisions = useMemo(() => DIVISIONS[form.discipline] ?? [], [form.discipline])
  const matchCount = matches.length
  const totalRounds = matches.reduce((sum, match) => sum + match.roundsUsed, 0)
  const totalAmmoCost = matches.reduce(
    (sum, match) => sum + match.roundsUsed * match.ammoCostPerRound,
    0,
  )

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

        setMatches(await res.json())
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
  }

  function editMatch(match: Match) {
    setForm(formFromMatch(match))
    setStageRows(stageRowsFromMatch(match))
    setEditingId(match.id)
    setError(null)
  }

  async function deleteMatch(match: Match) {
    const label = match.matchName || match.club
    if (!window.confirm(`Delete ${label}?`)) return

    setDeletingId(match.id)
    setError(null)

    const res = await fetch(`/api/matches/${match.id}`, { method: 'DELETE' })
    if (!res.ok) {
      setError('Could not delete match.')
      setDeletingId(null)
      return
    }

    setMatches((current) => current.filter((item) => item.id !== match.id))
    if (editingId === match.id) resetForm()
    setDeletingId(null)
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsSaving(true)
    setError(null)

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
    setForm({ ...initialForm, date: form.date })
    setStageRows([])
    setEditingId(null)
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

        <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-3">
            <h2 className="text-base font-semibold text-zinc-950">Matches</h2>
            <span className="text-xs font-medium text-zinc-500">
              {isLoading ? 'Loading...' : `${matchCount} logged`}
            </span>
          </div>

          {error ? (
            <div className="border-b border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          {isLoading ? (
            <div className="px-4 py-10 text-center text-sm text-zinc-500">
              Loading your match history...
            </div>
          ) : matches.length === 0 ? (
            <div className="px-4 py-10 text-center">
              <p className="font-medium text-zinc-900">No matches logged yet.</p>
              <p className="mt-1 text-sm text-zinc-500">
                Add your first match to start tracking placements, rounds, and ammo cost.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-zinc-100">
              {matches.map((match) => (
                <article key={match.id} className="px-4 py-4">
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="truncate font-semibold text-zinc-950">
                          {match.matchName || match.club}
                        </h3>
                        {match.dq ? (
                          <span className="rounded bg-red-100 px-1.5 py-0.5 text-xs font-semibold text-red-700">
                            DQ
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-1 text-sm text-zinc-600">
                        {fmtDate(match.date)} · {match.club}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-2 text-xs text-zinc-600">
                        <Badge>{DISCIPLINES[match.discipline]}</Badge>
                        {match.division ? <Badge>{match.division}</Badge> : null}
                        <Badge>{MATCH_TIERS[match.tier]}</Badge>
                      </div>
                    </div>

                    <div className="grid grid-cols-[repeat(3,minmax(0,1fr))_auto] gap-2 text-right md:min-w-80">
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
                      <div className="flex justify-end gap-1">
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
                  </div>

                  {match.powerFactor || match.notes ? (
                    <div className="mt-3 text-sm text-zinc-600">
                      {match.powerFactor ? (
                        <span>
                          PF {match.powerFactor}
                          {match.pfType ? ` (${match.pfType})` : ''}
                        </span>
                      ) : null}
                      {match.powerFactor && match.notes ? <span> · </span> : null}
                      {match.notes ? <span>{match.notes}</span> : null}
                    </div>
                  ) : null}

                  {match.stages.length > 0 ? (
                    <div className="mt-4 rounded-md border border-zinc-200 bg-zinc-50 p-3">
                      <h4 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                        Stage review
                      </h4>
                      <div className="mt-2 grid gap-2">
                        {match.stages.map((stage) => (
                          <div
                            key={stage.id}
                            className="rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm"
                          >
                            <div className="flex items-center justify-between gap-3">
                              <span className="min-w-0 truncate font-medium text-zinc-800">
                                Stage {stage.stageNum}
                                {stage.stageName ? ` · ${stage.stageName}` : ''}
                              </span>
                              {stage.youtubeUrl ? (
                                <a
                                  href={stage.youtubeUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center gap-1 text-xs font-semibold text-zinc-700 hover:text-zinc-950"
                                >
                                  Video
                                  <ExternalLink className="h-3.5 w-3.5" />
                                </a>
                              ) : null}
                            </div>
                            {stage.notes ? (
                              <p className="mt-1 text-zinc-600">{stage.notes}</p>
                            ) : null}
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </article>
              ))}
            </div>
          )}
        </div>
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
                      <div className="flex items-center gap-2">
                        <label className="grid w-20 gap-1 text-xs font-medium text-zinc-600">
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

                        <label className="grid min-w-0 flex-1 gap-1 text-xs font-medium text-zinc-600">
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
                          className="mt-5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-zinc-300 text-zinc-600 hover:bg-zinc-100"
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
