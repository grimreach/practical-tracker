'use client'

import { FormEvent, useEffect, useMemo, useState } from 'react'
import { Camera, Crosshair, Pencil, Plus, Shield, Trash2, Wrench, X } from 'lucide-react'
import { DISCIPLINES, fmt$ } from '@/lib/constants'
import {
  buildPartFormFromRecord,
  calculateBuildTotal,
  gunFormFromRecord,
  normalizeBuildParts,
  updateBuildPartForm,
  validateBuildPartForm,
  validateGunForm,
} from '@/lib/gun-builds.mjs'
import { applyDeletedRecord, applySavedRecord, hasValidationErrors } from '@/lib/edit-flows.mjs'

type Discipline = keyof typeof DISCIPLINES

type BuildPart = {
  id?: string
  componentType: string
  brandModel: string
  retailPrice: number
  notes: string | null
  sortOrder: number
}

type Gun = {
  id: string
  name: string
  caliber: string
  discipline: Discipline[]
  imageUrl: string | null
  notes: string | null
  isActive: boolean
  buildParts: BuildPart[]
}

type GunForm = {
  name: string
  caliber: string
  discipline: Discipline[]
  imageUrl: string
  notes: string
  isActive: boolean
}

type PartForm = {
  componentType: string
  brandModel: string
  retailPrice: string
  notes: string
  sortOrder: string
}

const initialGunForm: GunForm = {
  name: '',
  caliber: '9mm',
  discipline: ['USPSA', 'SCSA'],
  imageUrl: '',
  notes: '',
  isActive: true,
}

const initialPartForm: PartForm = {
  componentType: '',
  brandModel: '',
  retailPrice: '',
  notes: '',
  sortOrder: '',
}

const seedPccParts: PartForm[] = [
  { componentType: 'Lower Receiver', brandModel: 'Aero Precision EPC-9 Lower', retailPrice: '140', notes: 'Standard MSRP from Aero Precision.', sortOrder: '1' },
  { componentType: 'Upper & Barrel', brandModel: 'ODIN Works 9mm 16" Super Lite Barrel & Upper', retailPrice: '254', notes: 'From ODIN Works ($203.20 on sale).', sortOrder: '2' },
  { componentType: 'BCG', brandModel: 'IDL Industries 9mm AR15 Gen3 BCG (Nitride)', retailPrice: '119.99', notes: 'IDL Industries ($94.99 holiday sale).', sortOrder: '3' },
  { componentType: 'Buffer Tube', brandModel: 'BCM MK2 Intermediate Receiver Extension', retailPrice: '38.95', notes: 'Sold as BCM A5 Intermediate extension.', sortOrder: '4' },
  { componentType: 'Buffer', brandModel: 'Kynshot RB5015HD Hydraulic Buffer', retailPrice: '164.99', notes: 'AR15Discounts ($99.99 clearance price).', sortOrder: '5' },
  { componentType: 'Buffer Weight', brandModel: 'Kynshot 2.5oz Spacer Weight', retailPrice: '20.99', notes: 'Standard pricing via Range USA.', sortOrder: '6' },
  { componentType: 'Buffer Spring', brandModel: 'David Tubb Lightweight Flatwire Spring', retailPrice: '25.95', notes: 'Direct from David Tubb / Superior Shooting.', sortOrder: '7' },
  { componentType: 'Trigger System', brandModel: 'HIPERFIRE Hipertouch 24C Competition', retailPrice: '237.50', notes: 'Market rate at OpticsPlanet and major retailers.', sortOrder: '8' },
  { componentType: 'Trigger Pins', brandModel: 'Anti-Walk Pins (included)', retailPrice: '0', notes: 'Included free inside HIPERFIRE box.', sortOrder: '9' },
  { componentType: 'Optic', brandModel: 'Vortex Razor AMG UH-1 Gen II Holographic', retailPrice: '599', notes: 'Street price at EuroOptic & OpticsPlanet.', sortOrder: '10' },
  { componentType: 'Optic Mount', brandModel: 'Factory Lower 1/3 Co-Witness Mount', retailPrice: '0', notes: 'Built into the Vortex chassis base.', sortOrder: '11' },
  { componentType: 'Mag Release', brandModel: 'Elevated Mag Catch (e.g. Macon Armory)', retailPrice: '35', notes: 'Standard specialty upgrade cost.', sortOrder: '12' },
  { componentType: 'Ejector', brandModel: 'Upgraded Static Lower Ejector', retailPrice: '25', notes: 'Baseline replacement, competition geometry.', sortOrder: '13' },
]

const disciplineKeys = Object.keys(DISCIPLINES) as Discipline[]

export function GunsDashboard() {
  const [guns, setGuns] = useState<Gun[]>([])
  const [gunForm, setGunForm] = useState<GunForm>(initialGunForm)
  const [parts, setParts] = useState<PartForm[]>([])
  const [partForm, setPartForm] = useState<PartForm>(initialPartForm)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [gunErrors, setGunErrors] = useState<Partial<Record<keyof GunForm, string>>>({})
  const [partErrors, setPartErrors] = useState<Partial<Record<keyof PartForm, string>>>({})

  const totalInventoryValue = guns.reduce((sum, gun) => sum + calculateBuildTotal(gun.buildParts), 0)
  const activeBuilds = guns.filter((gun) => gun.isActive).length
  const currentTotal = useMemo(() => calculateBuildTotal(parts), [parts])
  const selectedGun = guns[0]

  useEffect(() => {
    let isActive = true
    async function loadGuns() {
      try {
        const res = await fetch('/api/guns', { cache: 'no-store' })
        if (!isActive) return
        if (!res.ok) {
          setError('Could not load gun builds.')
          setIsLoading(false)
          return
        }
        setGuns(await res.json())
        setIsLoading(false)
      } catch {
        if (!isActive) return
        setError('Could not load gun builds.')
        setIsLoading(false)
      }
    }
    void loadGuns()
    return () => {
      isActive = false
    }
  }, [])

  function resetForm() {
    setGunForm(initialGunForm)
    setParts([])
    setPartForm(initialPartForm)
    setEditingId(null)
    setGunErrors({})
    setPartErrors({})
  }

  function toggleDiscipline(discipline: Discipline) {
    setGunForm((current) => ({
      ...current,
      discipline: current.discipline.includes(discipline)
        ? current.discipline.filter((item) => item !== discipline)
        : [...current.discipline, discipline],
    }))
  }

  function addPart() {
    const nextErrors = validateBuildPartForm(partForm) as Partial<Record<keyof PartForm, string>>
    setPartErrors(nextErrors)
    if (hasValidationErrors(nextErrors)) return
    setParts((current) => [
      ...current,
      {
        ...partForm,
        retailPrice: String(Number(partForm.retailPrice || 0)),
        sortOrder: partForm.sortOrder || String(current.length + 1),
      },
    ])
    setPartForm(initialPartForm)
  }

  function updatePart(index: number, updates: Partial<PartForm>) {
    setParts((current) => updateBuildPartForm(current, index, updates) as PartForm[])
  }

  function removePart(index: number) {
    setParts((current) => current.filter((_, partIndex) => partIndex !== index))
  }

  function loadPccTemplate() {
    setGunForm({
      name: '9mm PCC Build',
      caliber: '9mm',
      discipline: ['USPSA', 'SCSA'],
      imageUrl: '',
      notes: 'Aero EPC-9 / ODIN Works competition PCC build imported from the workbook template.',
      isActive: true,
    })
    setParts(seedPccParts)
    setSuccess('Loaded the 9mm PCC workbook parts as a new-build template. Add a photo URL, adjust anything needed, then save.')
  }

  function editGun(gun: Gun) {
    setGunForm(gunFormFromRecord(gun) as GunForm)
    setParts(normalizeBuildParts(gun.buildParts).map((part: BuildPart) => buildPartFormFromRecord(part) as PartForm))
    setEditingId(gun.id)
    setGunErrors({})
    setPartErrors({})
    setSuccess('Editing build. Save changes or cancel to keep the original record.')
  }

  async function deleteGun(gun: Gun) {
    if (!window.confirm(`Delete ${gun.name}? This removes the build and parts list.`)) return
    const res = await fetch(`/api/guns/${gun.id}`, { method: 'DELETE' })
    if (!res.ok) {
      setError('Could not delete build. Try again.')
      return
    }
    setGuns((current) => applyDeletedRecord(current, gun.id) as Gun[])
    if (editingId === gun.id) resetForm()
    setSuccess('Build deleted.')
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const nextErrors = validateGunForm(gunForm) as Partial<Record<keyof GunForm, string>>
    setGunErrors(nextErrors)
    if (hasValidationErrors(nextErrors)) {
      setError('Fix the highlighted build fields and try again.')
      return
    }

    setIsSaving(true)
    setError(null)
    setSuccess(null)
    const payload = {
      ...gunForm,
      name: gunForm.name.trim(),
      caliber: gunForm.caliber.trim(),
      imageUrl: gunForm.imageUrl.trim() || '',
      notes: gunForm.notes.trim() || undefined,
      buildParts: parts.map((part, index) => ({
        componentType: part.componentType.trim(),
        brandModel: part.brandModel.trim(),
        retailPrice: Number(part.retailPrice || 0),
        notes: part.notes.trim() || undefined,
        sortOrder: Number(part.sortOrder || index + 1),
      })),
    }

    const res = await fetch(editingId ? `/api/guns/${editingId}` : '/api/guns', {
      method: editingId ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    if (!res.ok) {
      setError('Could not save build. Check the required fields and try again.')
      setIsSaving(false)
      return
    }

    const saved = (await res.json()) as Gun
    setGuns((current) => applySavedRecord(current, saved) as Gun[])
    resetForm()
    setSuccess(editingId ? 'Build updated.' : 'Build saved.')
    setIsSaving(false)
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
      <section className="min-w-0 space-y-4">
        <div className="grid gap-3 sm:grid-cols-3">
          <Metric label="Active builds" value={String(activeBuilds)} detail={`${guns.length} total profiles`} />
          <Metric label="Inventory value" value={fmt$(totalInventoryValue)} detail="Parts entered across builds" />
          <Metric label="Top build" value={selectedGun?.name ?? '-'} detail={selectedGun ? fmt$(calculateBuildTotal(selectedGun.buildParts)) : 'No builds yet'} />
        </div>

        <div className="command-panel rounded-3xl border border-zinc-200 bg-white p-4 shadow-sm sm:p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="eyebrow">Gun builds</p>
              <h3 className="mt-1 text-xl font-semibold text-zinc-950">Equipment profiles, photos, parts, and cost</h3>
            </div>
            <button type="button" onClick={loadPccTemplate} className="inline-flex items-center justify-center gap-2 rounded-full border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-800 transition hover:bg-zinc-100">
              <Plus className="h-4 w-4" /> Load PCC template
            </button>
          </div>
        </div>

        {error ? <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}
        {success ? <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{success}</div> : null}

        {isLoading ? (
          <div className="rounded-3xl border border-zinc-200 bg-white p-6 text-sm text-zinc-500 shadow-sm">Loading gun builds…</div>
        ) : guns.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-zinc-300 bg-white p-8 text-center shadow-sm">
            <Shield className="mx-auto h-8 w-8 text-zinc-400" />
            <h3 className="mt-3 text-lg font-semibold text-zinc-950">No gun builds yet</h3>
            <p className="mt-2 text-sm text-zinc-500">Create a profile from scratch or load the uploaded 9mm PCC workbook template.</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {guns.map((gun) => {
              const buildTotal = calculateBuildTotal(gun.buildParts)
              const orderedParts = normalizeBuildParts(gun.buildParts) as BuildPart[]
              return (
                <article key={gun.id} className="overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-sm">
                  {gun.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={gun.imageUrl} alt={`${gun.name} photo`} className="h-56 w-full object-cover" />
                  ) : (
                    <div className="flex h-40 items-center justify-center bg-zinc-100 text-zinc-400">
                      <Camera className="h-10 w-10" />
                    </div>
                  )}
                  <div className="space-y-4 p-5">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="status-pill">{gun.caliber}</span>
                          {gun.discipline.map((discipline) => <span key={discipline} className="sport-pill">{DISCIPLINES[discipline]}</span>)}
                        </div>
                        <h3 className="mt-2 text-xl font-semibold text-zinc-950">{gun.name}</h3>
                        {gun.notes ? <p className="mt-1 text-sm text-zinc-500">{gun.notes}</p> : null}
                      </div>
                      <div className="flex gap-2">
                        <button type="button" onClick={() => editGun(gun)} className="rounded-full border border-zinc-300 p-2 text-zinc-600 transition hover:bg-zinc-100" aria-label={`Edit ${gun.name}`}><Pencil className="h-4 w-4" /></button>
                        <button type="button" onClick={() => void deleteGun(gun)} className="rounded-full border border-red-200 p-2 text-red-600 transition hover:bg-red-50" aria-label={`Delete ${gun.name}`}><Trash2 className="h-4 w-4" /></button>
                      </div>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-3">
                      <Metric label="Build total" value={fmt$(buildTotal)} detail={`${orderedParts.length} parts`} />
                      <Metric label="Status" value={gun.isActive ? 'Active' : 'Archived'} detail="Profile state" />
                      <Metric label="Linked work" value="Ready" detail="Matches / chrono / maintenance" />
                    </div>

                    <div className="overflow-hidden rounded-2xl border border-zinc-200">
                      {orderedParts.map((part) => (
                        <div key={`${gun.id}-${part.id ?? part.componentType}`} className="grid gap-2 border-b border-zinc-100 px-4 py-3 text-sm last:border-b-0 sm:grid-cols-[160px_minmax(0,1fr)_90px]">
                          <span className="font-medium text-zinc-900">{part.componentType}</span>
                          <span className="text-zinc-600">{part.brandModel}{part.notes ? <span className="block text-xs text-zinc-400">{part.notes}</span> : null}</span>
                          <span className="font-semibold text-zinc-950 sm:text-right">{fmt$(part.retailPrice)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </section>

      <aside className="h-fit rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
        <form className="space-y-4" onSubmit={(event) => void handleSubmit(event)}>
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="eyebrow">{editingId ? 'Edit build' : 'New build'}</p>
              <h3 className="mt-1 text-xl font-semibold text-zinc-950">Gun profile</h3>
            </div>
            {editingId ? <button type="button" onClick={resetForm} className="rounded-full p-2 text-zinc-500 hover:bg-zinc-100" aria-label="Cancel editing"><X className="h-4 w-4" /></button> : null}
          </div>

          <Field label="Build name" error={gunErrors.name}>
            <input className="input" value={gunForm.name} onChange={(event) => setGunForm({ ...gunForm, name: event.target.value })} placeholder="9mm PCC Build" />
          </Field>
          <Field label="Caliber" error={gunErrors.caliber}>
            <input className="input" value={gunForm.caliber} onChange={(event) => setGunForm({ ...gunForm, caliber: event.target.value })} placeholder="9mm" />
          </Field>
          <Field label="Gun photo URL" error={gunErrors.imageUrl}>
            <input className="input" value={gunForm.imageUrl} onChange={(event) => setGunForm({ ...gunForm, imageUrl: event.target.value })} placeholder="https://…/photo.jpg" />
          </Field>

          <div>
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">Disciplines</span>
            <div className="mt-2 flex flex-wrap gap-2">
              {disciplineKeys.map((discipline) => (
                <button key={discipline} type="button" onClick={() => toggleDiscipline(discipline)} className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${gunForm.discipline.includes(discipline) ? 'border-zinc-900 bg-zinc-950 text-white' : 'border-zinc-300 text-zinc-700 hover:bg-zinc-100'}`}>
                  {DISCIPLINES[discipline]}
                </button>
              ))}
            </div>
          </div>

          <Field label="Build notes">
            <textarea className="input" value={gunForm.notes} onChange={(event) => setGunForm({ ...gunForm, notes: event.target.value })} rows={3} placeholder="Purpose, setup notes, reliability notes…" />
          </Field>

          <div className="rounded-2xl border border-zinc-200 p-3">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-sm font-semibold text-zinc-950">Parts list</p>
                <p className="text-xs text-zinc-500">Current total: {fmt$(currentTotal)}</p>
              </div>
              <Wrench className="h-4 w-4 text-zinc-400" />
            </div>
            <div className="mt-3 grid gap-2">
              <input className="input" value={partForm.componentType} onChange={(event) => setPartForm({ ...partForm, componentType: event.target.value })} placeholder="Component type" />
              {partErrors.componentType ? <p className="text-xs text-red-600">{partErrors.componentType}</p> : null}
              <input className="input" value={partForm.brandModel} onChange={(event) => setPartForm({ ...partForm, brandModel: event.target.value })} placeholder="Brand & model" />
              {partErrors.brandModel ? <p className="text-xs text-red-600">{partErrors.brandModel}</p> : null}
              <input className="input" value={partForm.retailPrice} onChange={(event) => setPartForm({ ...partForm, retailPrice: event.target.value })} placeholder="Retail price" inputMode="decimal" />
              {partErrors.retailPrice ? <p className="text-xs text-red-600">{partErrors.retailPrice}</p> : null}
              <textarea className="input" value={partForm.notes} onChange={(event) => setPartForm({ ...partForm, notes: event.target.value })} rows={2} placeholder="Notes / source" />
              <button type="button" onClick={addPart} className="inline-flex items-center justify-center gap-2 rounded-full border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-800 transition hover:bg-zinc-100">
                <Plus className="h-4 w-4" /> Add part
              </button>
            </div>

            {parts.length ? (
              <div className="mt-3 space-y-2">
                {parts.map((part, index) => (
                  <div key={`${part.componentType}-${index}`} className="grid gap-2 rounded-xl bg-zinc-50 px-3 py-2 text-xs sm:grid-cols-[minmax(0,1fr)_96px_auto] sm:items-center">
                    <span><strong>{part.componentType}</strong><br />{part.brandModel}</span>
                    <label className="grid gap-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-500">
                      Price
                      <input
                        className="input px-2 py-1 text-xs font-normal normal-case tracking-normal"
                        value={part.retailPrice}
                        onChange={(event) => updatePart(index, { retailPrice: event.target.value })}
                        aria-label={`Edit ${part.componentType} price`}
                        inputMode="decimal"
                      />
                    </label>
                    <button type="button" onClick={() => removePart(index)} className="text-left text-red-600 sm:text-right">Remove</button>
                  </div>
                ))}
              </div>
            ) : null}
          </div>

          <button type="submit" disabled={isSaving} className="primary-button w-full disabled:cursor-not-allowed disabled:opacity-60">
            <Crosshair className="h-4 w-4" /> {isSaving ? 'Saving…' : editingId ? 'Save build changes' : 'Save gun build'}
          </button>
        </form>
      </aside>
    </div>
  )
}

function Metric({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div className="mini-stat items-start">
      <span>{label}</span>
      <strong>{value}</strong>
      <span>{detail}</span>
    </div>
  )
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <label className="grid gap-1.5 text-sm font-medium text-zinc-700">
      <span>{label}</span>
      {children}
      {error ? <span className="text-xs text-red-600">{error}</span> : null}
    </label>
  )
}
