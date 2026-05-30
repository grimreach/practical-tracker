'use client'

import { FormEvent, useEffect, useMemo, useState } from 'react'
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
  stages: Array<{ id: string }>
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

function toOptionalNumber(value: string) {
  return value.trim() === '' ? undefined : Number(value)
}

export function MatchesDashboard() {
  const [matches, setMatches] = useState<Match[]>([])
  const [form, setForm] = useState<FormState>(initialForm)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
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

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsSaving(true)
    setError(null)

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
      stages: [],
    }

    const res = await fetch('/api/matches', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    if (!res.ok) {
      setError('Could not save match. Check the required fields and try again.')
      setIsSaving(false)
      return
    }

    const created = (await res.json()) as Match
    setMatches((current) => [created, ...current])
    setForm({ ...initialForm, date: form.date })
    setIsSaving(false)
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_420px]">
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

                    <div className="grid grid-cols-3 gap-2 text-right md:min-w-72">
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
          <div className="mb-4">
            <h2 className="text-base font-semibold text-zinc-950">Log a Match</h2>
            <p className="mt-1 text-sm text-zinc-500">
              Record the basics now; stages can come next.
            </p>
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
          </div>

          <button
            disabled={isSaving}
            className="mt-4 w-full rounded-md bg-zinc-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-400"
          >
            {isSaving ? 'Saving...' : 'Save Match'}
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

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="grid gap-1.5 text-sm font-medium text-zinc-700">
      {label}
      {children}
    </label>
  )
}
