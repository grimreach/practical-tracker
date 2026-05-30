'use client'

import { FormEvent, useEffect, useMemo, useState } from 'react'
import { CheckCircle2, ShieldAlert, Wrench } from 'lucide-react'
import { fmtDate } from '@/lib/constants'

type MaintenanceLog = {
  id: string
  date: string
  roundsFired: number
  totalRoundsSinceClean: number
  lifetimeRounds: number
  action: string
  partsReplaced: string | null
  partsInspected: string | null
  lubricants: string | null
  notes: string | null
}

type MaintenanceForm = {
  date: string
  roundsFired: string
  totalRoundsSinceClean: string
  lifetimeRounds: string
  action: string
  partsReplaced: string
  partsInspected: string
  lubricants: string
  notes: string
}

const today = new Date().toISOString().slice(0, 10)

const initialForm: MaintenanceForm = {
  date: today,
  roundsFired: '',
  totalRoundsSinceClean: '',
  lifetimeRounds: '',
  action: 'Cleaned and lubricated',
  partsReplaced: '',
  partsInspected: '',
  lubricants: '',
  notes: '',
}

const actionPresets = [
  'Cleaned and lubricated',
  'Inspected wear parts',
  'Replaced spring',
  'Optic / zero check',
  'Malfunction diagnosis',
]

function toOptionalNumber(value: string) {
  return value.trim() === '' ? undefined : Number(value)
}

function serviceTone(roundsSinceClean: number) {
  if (roundsSinceClean >= 1000) return 'Service due'
  if (roundsSinceClean >= 600) return 'Watchlist'
  return 'Healthy'
}

export function MaintenanceDashboard() {
  const [logs, setLogs] = useState<MaintenanceLog[]>([])
  const [form, setForm] = useState<MaintenanceForm>(initialForm)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const totalRounds = logs.reduce((sum, log) => sum + log.roundsFired, 0)
  const latest = logs[0]
  const serviceStatus = latest ? serviceTone(latest.totalRoundsSinceClean) : 'No data'
  const replacedCount = useMemo(
    () => logs.filter((log) => Boolean(log.partsReplaced?.trim())).length,
    [logs],
  )

  useEffect(() => {
    let isActive = true

    async function loadLogs() {
      try {
        const res = await fetch('/api/maintenance', { cache: 'no-store' })
        if (!isActive) return

        if (!res.ok) {
          setError('Could not load maintenance logs.')
          setIsLoading(false)
          return
        }

        setLogs(await res.json())
        setIsLoading(false)
      } catch {
        if (!isActive) return
        setError('Could not load maintenance logs.')
        setIsLoading(false)
      }
    }

    void loadLogs()

    return () => {
      isActive = false
    }
  }, [])

  function updateField<Key extends keyof MaintenanceForm>(key: Key, value: MaintenanceForm[Key]) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsSaving(true)
    setError(null)

    const payload = {
      date: form.date,
      roundsFired: toOptionalNumber(form.roundsFired) ?? 0,
      totalRoundsSinceClean: toOptionalNumber(form.totalRoundsSinceClean) ?? 0,
      lifetimeRounds: toOptionalNumber(form.lifetimeRounds) ?? 0,
      action: form.action.trim(),
      partsReplaced: form.partsReplaced.trim() || undefined,
      partsInspected: form.partsInspected.trim() || undefined,
      lubricants: form.lubricants.trim() || undefined,
      notes: form.notes.trim() || undefined,
    }

    const res = await fetch('/api/maintenance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    if (!res.ok) {
      setError('Could not save maintenance log. Action is required.')
      setIsSaving(false)
      return
    }

    const created = (await res.json()) as MaintenanceLog
    setLogs((current) => [created, ...current])
    setForm({
      ...initialForm,
      date: form.date,
      lifetimeRounds: String(payload.lifetimeRounds),
      totalRoundsSinceClean: String(payload.totalRoundsSinceClean),
    })
    setIsSaving(false)
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_400px]">
      <section className="min-w-0">
        <div className="mb-4 grid gap-3 sm:grid-cols-4">
          <Metric label="Logs" value={logs.length.toString()} />
          <Metric label="Rounds tracked" value={totalRounds.toLocaleString()} />
          <Metric label="Parts replaced" value={replacedCount.toString()} />
          <Metric label="Status" value={serviceStatus} />
        </div>

        <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm">
          <div className="flex flex-col gap-2 border-b border-zinc-200 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-base font-semibold text-zinc-950">Maintenance Timeline</h2>
              <p className="mt-1 text-sm text-zinc-500">
                Track service actions, round count, inspected parts, and replacement history.
              </p>
            </div>
            <span className="status-pill">
              {serviceStatus === 'Service due' ? <ShieldAlert className="h-3.5 w-3.5" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
              {serviceStatus}
            </span>
          </div>

          {error ? (
            <div className="border-b border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          {isLoading ? (
            <div className="px-4 py-10 text-center text-sm text-zinc-500">
              Loading maintenance history...
            </div>
          ) : logs.length === 0 ? (
            <div className="px-4 py-12 text-center">
              <p className="font-medium text-zinc-900">No maintenance logged yet.</p>
              <p className="mt-1 text-sm text-zinc-500">
                Add a cleaning, inspection, or part replacement after your next range session.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-zinc-100">
              {logs.map((log) => (
                <article key={log.id} className="px-4 py-4">
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="truncate font-semibold text-zinc-950">{log.action}</h3>
                        <Badge>{serviceTone(log.totalRoundsSinceClean)}</Badge>
                      </div>
                      <p className="mt-1 text-sm text-zinc-600">
                        {fmtDate(log.date)} · {log.roundsFired.toLocaleString()} rounds this session
                      </p>
                      <div className="mt-3 grid gap-2 text-sm text-zinc-600 sm:grid-cols-3">
                        <Stat label="Since clean" value={log.totalRoundsSinceClean.toLocaleString()} />
                        <Stat label="Lifetime" value={log.lifetimeRounds.toLocaleString()} />
                        <Stat label="Lubricant" value={log.lubricants || '-'} />
                      </div>
                    </div>
                    <div className="rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-right">
                      <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">Care</p>
                      <Wrench className="ml-auto mt-1 h-6 w-6 text-zinc-500" />
                    </div>
                  </div>

                  {log.partsInspected || log.partsReplaced || log.notes ? (
                    <div className="mt-3 rounded-md border border-zinc-200 bg-zinc-50 p-3 text-sm text-zinc-600">
                      {log.partsInspected ? <p><strong>Inspected:</strong> {log.partsInspected}</p> : null}
                      {log.partsReplaced ? <p><strong>Replaced:</strong> {log.partsReplaced}</p> : null}
                      {log.notes ? <p><strong>Notes:</strong> {log.notes}</p> : null}
                    </div>
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
            <h2 className="text-base font-semibold text-zinc-950">Log Maintenance</h2>
            <p className="mt-1 text-sm text-zinc-500">
              Record the action, round counts, inspected parts, and replacements.
            </p>
          </div>

          <div className="mb-4 rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">Next service read</p>
            <p className="mt-1 text-3xl font-semibold tracking-tight text-zinc-950">
              {form.totalRoundsSinceClean || latest?.totalRoundsSinceClean || '-'}
            </p>
            <p className="mt-2 text-xs text-zinc-500">Rounds since clean / inspection checkpoint.</p>
          </div>

          <div className="grid gap-3">
            <Field label="Date">
              <input required type="date" value={form.date} onChange={(event) => updateField('date', event.target.value)} className="input" />
            </Field>
            <Field label="Action">
              <input required list="maintenance-actions" value={form.action} onChange={(event) => updateField('action', event.target.value)} className="input" placeholder="Cleaned and lubricated" />
              <datalist id="maintenance-actions">
                {actionPresets.map((preset) => <option key={preset} value={preset} />)}
              </datalist>
            </Field>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Rounds fired">
                <input min="0" type="number" value={form.roundsFired} onChange={(event) => updateField('roundsFired', event.target.value)} className="input" placeholder="142" />
              </Field>
              <Field label="Since clean">
                <input min="0" type="number" value={form.totalRoundsSinceClean} onChange={(event) => updateField('totalRoundsSinceClean', event.target.value)} className="input" placeholder="650" />
              </Field>
            </div>
            <Field label="Lifetime rounds">
              <input min="0" type="number" value={form.lifetimeRounds} onChange={(event) => updateField('lifetimeRounds', event.target.value)} className="input" placeholder="5480" />
            </Field>
            <Field label="Parts inspected">
              <input value={form.partsInspected} onChange={(event) => updateField('partsInspected', event.target.value)} className="input" placeholder="Extractor, ejector, buffer, optic mount" />
            </Field>
            <Field label="Parts replaced">
              <input value={form.partsReplaced} onChange={(event) => updateField('partsReplaced', event.target.value)} className="input" placeholder="Recoil spring" />
            </Field>
            <Field label="Lubricants">
              <input value={form.lubricants} onChange={(event) => updateField('lubricants', event.target.value)} className="input" placeholder="Slip 2000 EWL" />
            </Field>
            <Field label="Notes">
              <textarea rows={3} value={form.notes} onChange={(event) => updateField('notes', event.target.value)} className="input resize-none" placeholder="No unusual wear. Re-check extractor tension after next match." />
            </Field>
          </div>

          <button disabled={isSaving} className="mt-4 w-full rounded-md bg-zinc-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-400">
            {isSaving ? 'Saving...' : 'Save Maintenance Log'}
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
