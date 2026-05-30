'use client'

import { FormEvent, useEffect, useMemo, useState } from 'react'
import { Gauge, TrendingUp } from 'lucide-react'
import { fmtDate, pfStatus } from '@/lib/constants'

type ChronoEntry = {
  id: string
  date: string
  ammoDescription: string | null
  bulletWeight: number
  bulletType: string | null
  powder: string | null
  powderCharge: number | null
  primer: string | null
  oal: number | null
  strings: number
  avgVelocity: number
  minVelocity: number
  maxVelocity: number
  stdDev: number | null
  extremeSpread: number | null
  powerFactor: number
  notes: string | null
}

type ChronoForm = {
  date: string
  ammoDescription: string
  bulletWeight: string
  bulletType: string
  powder: string
  powderCharge: string
  primer: string
  oal: string
  strings: string
  avgVelocity: string
  minVelocity: string
  maxVelocity: string
  stdDev: string
  extremeSpread: string
  notes: string
}

const today = new Date().toISOString().slice(0, 10)

const initialForm: ChronoForm = {
  date: today,
  ammoDescription: '',
  bulletWeight: '124',
  bulletType: '',
  powder: '',
  powderCharge: '',
  primer: '',
  oal: '',
  strings: '10',
  avgVelocity: '',
  minVelocity: '',
  maxVelocity: '',
  stdDev: '',
  extremeSpread: '',
  notes: '',
}

function toOptionalNumber(value: string) {
  return value.trim() === '' ? undefined : Number(value)
}

function powerFactorPreview(weight: string, velocity: string) {
  const bulletWeight = Number(weight)
  const avgVelocity = Number(velocity)
  if (!bulletWeight || !avgVelocity) return null
  return Math.round((bulletWeight * avgVelocity) / 1000)
}

function pfLabel(pf: number) {
  const status = pfStatus(pf)
  if (status === 'major') return 'Major-ready'
  if (status === 'minor') return 'Minor-ready'
  return 'Below minor'
}

export function ChronoDashboard() {
  const [entries, setEntries] = useState<ChronoEntry[]>([])
  const [form, setForm] = useState<ChronoForm>(initialForm)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const previewPf = powerFactorPreview(form.bulletWeight, form.avgVelocity)
  const averagePf = useMemo(() => {
    if (entries.length === 0) return 0
    return Math.round(entries.reduce((sum, entry) => sum + entry.powerFactor, 0) / entries.length)
  }, [entries])
  const fastestLoad = entries.reduce<ChronoEntry | null>(
    (fastest, entry) => (!fastest || entry.avgVelocity > fastest.avgVelocity ? entry : fastest),
    null,
  )
  const minorReady = entries.filter((entry) => entry.powerFactor >= 125).length

  useEffect(() => {
    let isActive = true

    async function loadEntries() {
      try {
        const res = await fetch('/api/chrono', { cache: 'no-store' })
        if (!isActive) return

        if (!res.ok) {
          setError('Could not load chrono entries.')
          setIsLoading(false)
          return
        }

        setEntries(await res.json())
        setIsLoading(false)
      } catch {
        if (!isActive) return
        setError('Could not load chrono entries.')
        setIsLoading(false)
      }
    }

    void loadEntries()

    return () => {
      isActive = false
    }
  }, [])

  function updateField<Key extends keyof ChronoForm>(key: Key, value: ChronoForm[Key]) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsSaving(true)
    setError(null)

    const payload = {
      date: form.date,
      ammoDescription: form.ammoDescription.trim() || undefined,
      bulletWeight: Number(form.bulletWeight),
      bulletType: form.bulletType.trim() || undefined,
      powder: form.powder.trim() || undefined,
      powderCharge: toOptionalNumber(form.powderCharge),
      primer: form.primer.trim() || undefined,
      oal: toOptionalNumber(form.oal),
      strings: toOptionalNumber(form.strings) ?? 10,
      avgVelocity: Number(form.avgVelocity),
      minVelocity: toOptionalNumber(form.minVelocity) ?? 0,
      maxVelocity: toOptionalNumber(form.maxVelocity) ?? 0,
      stdDev: toOptionalNumber(form.stdDev),
      extremeSpread: toOptionalNumber(form.extremeSpread),
      notes: form.notes.trim() || undefined,
    }

    const res = await fetch('/api/chrono', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    if (!res.ok) {
      setError('Could not save chrono entry. Check bullet weight and average velocity.')
      setIsSaving(false)
      return
    }

    const created = (await res.json()) as ChronoEntry
    setEntries((current) => [created, ...current])
    setForm({ ...initialForm, date: form.date, bulletWeight: form.bulletWeight })
    setIsSaving(false)
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_400px]">
      <section className="min-w-0">
        <div className="mb-4 grid gap-3 sm:grid-cols-4">
          <Metric label="Loads" value={entries.length.toString()} />
          <Metric label="Avg PF" value={averagePf ? averagePf.toString() : '-'} />
          <Metric label="Minor+" value={minorReady.toString()} />
          <Metric label="Fastest" value={fastestLoad ? `${Math.round(fastestLoad.avgVelocity)} fps` : '-'} />
        </div>

        <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm">
          <div className="flex flex-col gap-2 border-b border-zinc-200 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-base font-semibold text-zinc-950">Chrono & Load Development</h2>
              <p className="mt-1 text-sm text-zinc-500">
                Velocity strings, power factor, and recipe notes in one timeline.
              </p>
            </div>
            <span className="status-pill">
              <Gauge className="h-3.5 w-3.5" /> {isLoading ? 'Loading' : `${entries.length} strings`}
            </span>
          </div>

          {error ? (
            <div className="border-b border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          {isLoading ? (
            <div className="px-4 py-10 text-center text-sm text-zinc-500">
              Loading chrono history...
            </div>
          ) : entries.length === 0 ? (
            <div className="px-4 py-12 text-center">
              <p className="font-medium text-zinc-900">No chrono data logged yet.</p>
              <p className="mt-1 text-sm text-zinc-500">
                Add your first string to calculate power factor automatically.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-zinc-100">
              {entries.map((entry) => (
                <article key={entry.id} className="px-4 py-4">
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="truncate font-semibold text-zinc-950">
                          {entry.ammoDescription || `${entry.bulletWeight}gr load`}
                        </h3>
                        <Badge>{pfLabel(entry.powerFactor)}</Badge>
                      </div>
                      <p className="mt-1 text-sm text-zinc-600">
                        {fmtDate(entry.date)} · {entry.bulletWeight}gr
                        {entry.bulletType ? ` ${entry.bulletType}` : ''}
                        {entry.powder ? ` · ${entry.powder}` : ''}
                        {entry.powderCharge ? ` ${entry.powderCharge}gr` : ''}
                      </p>
                      <div className="mt-3 grid gap-2 text-sm text-zinc-600 sm:grid-cols-2 lg:grid-cols-4">
                        <Stat label="Avg" value={`${Math.round(entry.avgVelocity)} fps`} />
                        <Stat label="PF" value={entry.powerFactor.toString()} />
                        <Stat label="ES" value={entry.extremeSpread ? entry.extremeSpread.toString() : '-'} />
                        <Stat label="SD" value={entry.stdDev ? entry.stdDev.toString() : '-'} />
                      </div>
                    </div>
                    <div className="rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-right">
                      <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">String</p>
                      <p className="mt-1 text-xl font-semibold text-zinc-950">{entry.strings}</p>
                      <p className="text-xs text-zinc-500">shots</p>
                    </div>
                  </div>

                  {entry.primer || entry.oal || entry.notes ? (
                    <p className="mt-3 text-sm text-zinc-600">
                      {[entry.primer ? `Primer: ${entry.primer}` : null, entry.oal ? `OAL: ${entry.oal}` : null, entry.notes]
                        .filter(Boolean)
                        .join(' · ')}
                    </p>
                  ) : null}
                </article>
              ))}
            </div>
          )}
        </div>
      </section>

      <aside className="lg:sticky lg:top-6 lg:self-start">
        <form onSubmit={handleSubmit} className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
          <div className="mb-4">
            <h2 className="text-base font-semibold text-zinc-950">Log Chrono String</h2>
            <p className="mt-1 text-sm text-zinc-500">
              Enter bullet weight and average velocity; power factor is calculated on save.
            </p>
          </div>

          <div className="mb-4 rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">PF preview</p>
                <p className="mt-1 text-3xl font-semibold tracking-tight text-zinc-950">
                  {previewPf ?? '-'}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-zinc-500" />
            </div>
            <p className="mt-2 text-xs text-zinc-500">
              {previewPf ? pfLabel(previewPf) : 'Waiting on velocity data.'}
            </p>
          </div>

          <div className="grid gap-3">
            <Field label="Date">
              <input required type="date" value={form.date} onChange={(event) => updateField('date', event.target.value)} className="input" />
            </Field>
            <Field label="Ammo description">
              <input value={form.ammoDescription} onChange={(event) => updateField('ammoDescription', event.target.value)} className="input" placeholder="124gr coated match load" />
            </Field>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Bullet weight">
                <input required min="1" step="0.1" type="number" value={form.bulletWeight} onChange={(event) => updateField('bulletWeight', event.target.value)} className="input" placeholder="124" />
              </Field>
              <Field label="Bullet type">
                <input value={form.bulletType} onChange={(event) => updateField('bulletType', event.target.value)} className="input" placeholder="FMJ / JHP / Coated" />
              </Field>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Powder">
                <input value={form.powder} onChange={(event) => updateField('powder', event.target.value)} className="input" placeholder="N320" />
              </Field>
              <Field label="Charge">
                <input min="0" step="0.01" type="number" value={form.powderCharge} onChange={(event) => updateField('powderCharge', event.target.value)} className="input" placeholder="3.8" />
              </Field>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Avg velocity">
                <input required min="1" step="0.1" type="number" value={form.avgVelocity} onChange={(event) => updateField('avgVelocity', event.target.value)} className="input" placeholder="1075" />
              </Field>
              <Field label="Shots">
                <input min="1" type="number" value={form.strings} onChange={(event) => updateField('strings', event.target.value)} className="input" placeholder="10" />
              </Field>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Min velocity">
                <input min="0" step="0.1" type="number" value={form.minVelocity} onChange={(event) => updateField('minVelocity', event.target.value)} className="input" placeholder="1058" />
              </Field>
              <Field label="Max velocity">
                <input min="0" step="0.1" type="number" value={form.maxVelocity} onChange={(event) => updateField('maxVelocity', event.target.value)} className="input" placeholder="1092" />
              </Field>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Std dev">
                <input min="0" step="0.1" type="number" value={form.stdDev} onChange={(event) => updateField('stdDev', event.target.value)} className="input" placeholder="9.4" />
              </Field>
              <Field label="Extreme spread">
                <input min="0" step="0.1" type="number" value={form.extremeSpread} onChange={(event) => updateField('extremeSpread', event.target.value)} className="input" placeholder="34" />
              </Field>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Primer">
                <input value={form.primer} onChange={(event) => updateField('primer', event.target.value)} className="input" placeholder="Federal SPP" />
              </Field>
              <Field label="OAL">
                <input min="0" step="0.001" type="number" value={form.oal} onChange={(event) => updateField('oal', event.target.value)} className="input" placeholder="1.130" />
              </Field>
            </div>
            <Field label="Notes">
              <textarea rows={3} value={form.notes} onChange={(event) => updateField('notes', event.target.value)} className="input resize-none" placeholder="Soft recoil, clean ejection, verify at match temp." />
            </Field>
          </div>

          <button disabled={isSaving} className="mt-4 w-full rounded-md bg-zinc-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-400">
            {isSaving ? 'Saving...' : 'Save Chrono Entry'}
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
      <p className="mt-1 truncate text-xl font-semibold text-zinc-950">{value}</p>
    </div>
  )
}

function Badge({ children }: { children: React.ReactNode }) {
  return <span className="rounded bg-zinc-100 px-1.5 py-0.5 text-xs font-medium text-zinc-700">{children}</span>
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
