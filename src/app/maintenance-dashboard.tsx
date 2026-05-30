'use client'

import { FormEvent, useEffect, useMemo, useState } from 'react'
import { CheckCircle2, Pencil, ShieldAlert, Trash2, Wrench, X } from 'lucide-react'
import { fmtDate } from '@/lib/constants'
import {
  applyDeletedRecord,
  applySavedRecord,
  hasValidationErrors,
  maintenanceFormFromRecord,
  validateMaintenanceForm,
} from '@/lib/edit-flows.mjs'
import { DashboardBadge as Badge, DashboardField as Field, DashboardMetric as Metric, DashboardStat as Stat } from './dashboard-ui'

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
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [validationErrors, setValidationErrors] = useState<Partial<Record<keyof MaintenanceForm, string>>>({})
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

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

  function resetForm() {
    setForm({
      ...initialForm,
      date: form.date,
      lifetimeRounds: form.lifetimeRounds,
      totalRoundsSinceClean: form.totalRoundsSinceClean,
    })
    setEditingId(null)
    setValidationErrors({})
  }

  function editLog(log: MaintenanceLog) {
    setForm(maintenanceFormFromRecord(log) as MaintenanceForm)
    setEditingId(log.id)
    setValidationErrors({})
    setError(null)
    setSuccess('Editing maintenance log. Save changes or cancel to keep the original record.')
  }

  async function deleteLog(log: MaintenanceLog) {
    const confirmed = window.confirm(`Delete maintenance log: ${log.action}? This cannot be undone.`)
    if (!confirmed) return

    setDeletingId(log.id)
    setError(null)
    setSuccess(null)

    const res = await fetch(`/api/maintenance/${log.id}`, { method: 'DELETE' })
    if (!res.ok) {
      setError('Could not delete maintenance log. Try again.')
      setDeletingId(null)
      return
    }

    setLogs((current) => applyDeletedRecord(current, log.id) as MaintenanceLog[])
    if (editingId === log.id) resetForm()
    setSuccess('Maintenance log deleted.')
    setDeletingId(null)
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const nextValidationErrors = validateMaintenanceForm(form) as Partial<Record<keyof MaintenanceForm, string>>
    setValidationErrors(nextValidationErrors)
    if (hasValidationErrors(nextValidationErrors)) {
      setError('Fix the highlighted maintenance fields and try again.')
      return
    }

    setIsSaving(true)
    setError(null)
    setSuccess(null)

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

    const res = await fetch(editingId ? `/api/maintenance/${editingId}` : '/api/maintenance', {
      method: editingId ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    if (!res.ok) {
      setError('Could not save maintenance log. Action is required.')
      setIsSaving(false)
      return
    }

    const saved = (await res.json()) as MaintenanceLog
    setLogs((current) => applySavedRecord(current, saved) as MaintenanceLog[])
    setForm({
      ...initialForm,
      date: form.date,
      lifetimeRounds: String(payload.lifetimeRounds),
      totalRoundsSinceClean: String(payload.totalRoundsSinceClean),
    })
    setEditingId(null)
    setValidationErrors({})
    setSuccess(editingId ? 'Maintenance log updated.' : 'Maintenance log saved.')
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

          {success ? (
            <div className="border-b border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              {success}
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
                    <div className="flex shrink-0 flex-col gap-2 md:items-end">
                      <div className="rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-right">
                        <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">Care</p>
                        <Wrench className="ml-auto mt-1 h-6 w-6 text-zinc-500" />
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => editLog(log)}
                          className="inline-flex items-center gap-1 rounded-md border border-zinc-200 px-2 py-1 text-xs font-semibold text-zinc-600 transition hover:bg-zinc-100"
                        >
                          <Pencil className="h-3.5 w-3.5" /> Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => void deleteLog(log)}
                          disabled={deletingId === log.id}
                          className="inline-flex items-center gap-1 rounded-md border border-red-100 px-2 py-1 text-xs font-semibold text-red-700 transition hover:bg-red-50 disabled:opacity-60"
                        >
                          <Trash2 className="h-3.5 w-3.5" /> {deletingId === log.id ? 'Deleting' : 'Delete'}
                        </button>
                      </div>
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
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-zinc-950">
                {editingId ? 'Edit Maintenance' : 'Log Maintenance'}
              </h2>
              <p className="mt-1 text-sm text-zinc-500">
                {editingId
                  ? 'Update the service record and save, or cancel to keep the original log.'
                  : 'Record the action, round counts, inspected parts, and replacements.'}
              </p>
            </div>
            {editingId ? (
              <button
                type="button"
                onClick={() => resetForm()}
                className="rounded-full border border-zinc-200 p-2 text-zinc-500 transition hover:bg-zinc-100"
                aria-label="Cancel maintenance edit"
              >
                <X className="h-4 w-4" />
              </button>
            ) : null}
          </div>

          <div className="mb-4 rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">Next service read</p>
            <p className="mt-1 text-3xl font-semibold tracking-tight text-zinc-950">
              {form.totalRoundsSinceClean || latest?.totalRoundsSinceClean || '-'}
            </p>
            <p className="mt-2 text-xs text-zinc-500">Rounds since clean / inspection checkpoint.</p>
          </div>

          <div className="grid gap-3">
            <Field label="Date" error={validationErrors.date}>
              <input required type="date" value={form.date} onChange={(event) => updateField('date', event.target.value)} className="input" />
            </Field>
            <Field label="Action" error={validationErrors.action}>
              <input required list="maintenance-actions" value={form.action} onChange={(event) => updateField('action', event.target.value)} className="input" placeholder="Cleaned and lubricated" />
              <datalist id="maintenance-actions">
                {actionPresets.map((preset) => <option key={preset} value={preset} />)}
              </datalist>
            </Field>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Rounds fired" error={validationErrors.roundsFired}>
                <input min="0" type="number" value={form.roundsFired} onChange={(event) => updateField('roundsFired', event.target.value)} className="input" placeholder="142" />
              </Field>
              <Field label="Since clean" error={validationErrors.totalRoundsSinceClean}>
                <input min="0" type="number" value={form.totalRoundsSinceClean} onChange={(event) => updateField('totalRoundsSinceClean', event.target.value)} className="input" placeholder="650" />
              </Field>
            </div>
            <Field label="Lifetime rounds" error={validationErrors.lifetimeRounds}>
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
            {isSaving ? 'Saving...' : editingId ? 'Save Maintenance Changes' : 'Save Maintenance Log'}
          </button>
        </form>
      </aside>
    </div>
  )
}
