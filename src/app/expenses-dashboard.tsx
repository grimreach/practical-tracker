'use client'

import { FormEvent, useEffect, useMemo, useState } from 'react'
import { EXPENSE_CATEGORIES, fmt$, fmtDate } from '@/lib/constants'

type Expense = {
  id: string
  date: string
  category: keyof typeof EXPENSE_CATEGORIES
  item: string
  amount: number
  vendor: string | null
  url: string | null
  notes: string | null
}

type ExpenseForm = {
  date: string
  category: keyof typeof EXPENSE_CATEGORIES
  item: string
  amount: string
  vendor: string
  url: string
  notes: string
}

type ExpenseCategory = keyof typeof EXPENSE_CATEGORIES

const today = new Date().toISOString().slice(0, 10)

const initialForm: ExpenseForm = {
  date: today,
  category: 'MATCH_FEES',
  item: '',
  amount: '',
  vendor: '',
  url: '',
  notes: '',
}

export function ExpensesDashboard() {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [form, setForm] = useState<ExpenseForm>(initialForm)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const totalSpend = expenses.reduce((sum, expense) => sum + expense.amount, 0)
  const categoryTotals = useMemo(() => {
    return expenses.reduce<Partial<Record<ExpenseCategory, number>>>((totals, expense) => {
      totals[expense.category] = (totals[expense.category] ?? 0) + expense.amount
      return totals
    }, {})
  }, [expenses])
  const topCategory = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1])[0] as
    | [ExpenseCategory, number]
    | undefined

  useEffect(() => {
    let isActive = true

    async function loadExpenses() {
      try {
        const res = await fetch('/api/expenses', { cache: 'no-store' })
        if (!isActive) return

        if (!res.ok) {
          setError('Could not load expenses.')
          setIsLoading(false)
          return
        }

        setExpenses(await res.json())
        setIsLoading(false)
      } catch {
        if (!isActive) return
        setError('Could not load expenses.')
        setIsLoading(false)
      }
    }

    void loadExpenses()

    return () => {
      isActive = false
    }
  }, [])

  function updateField<Key extends keyof ExpenseForm>(key: Key, value: ExpenseForm[Key]) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsSaving(true)
    setError(null)

    const payload = {
      date: form.date,
      category: form.category,
      item: form.item.trim(),
      amount: Number(form.amount),
      vendor: form.vendor.trim() || undefined,
      url: form.url.trim() || '',
      notes: form.notes.trim() || undefined,
    }

    const res = await fetch('/api/expenses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    if (!res.ok) {
      setError('Could not save expense. Check the required fields and try again.')
      setIsSaving(false)
      return
    }

    const created = (await res.json()) as Expense
    setExpenses((current) => [created, ...current])
    setForm({ ...initialForm, date: form.date })
    setIsSaving(false)
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
      <section className="min-w-0">
        <div className="mb-4 grid gap-3 sm:grid-cols-3">
          <Metric label="Expenses" value={expenses.length.toString()} />
          <Metric label="Total spend" value={fmt$(totalSpend)} />
          <Metric
            label="Top category"
            value={topCategory ? EXPENSE_CATEGORIES[topCategory[0]] : '-'}
          />
        </div>

        <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-3">
            <h2 className="text-base font-semibold text-zinc-950">Expenses</h2>
            <span className="text-xs font-medium text-zinc-500">
              {isLoading ? 'Loading...' : fmt$(totalSpend)}
            </span>
          </div>

          {error ? (
            <div className="border-b border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          {isLoading ? (
            <div className="px-4 py-10 text-center text-sm text-zinc-500">
              Loading expenses...
            </div>
          ) : expenses.length === 0 ? (
            <div className="px-4 py-10 text-center">
              <p className="font-medium text-zinc-900">No expenses logged yet.</p>
              <p className="mt-1 text-sm text-zinc-500">
                Add match fees, ammo, parts, travel, and training costs here.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-zinc-100">
              {expenses.map((expense) => (
                <article key={expense.id} className="px-4 py-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <h3 className="truncate font-semibold text-zinc-950">{expense.item}</h3>
                      <p className="mt-1 text-sm text-zinc-600">
                        {fmtDate(expense.date)}
                        {expense.vendor ? ` · ${expense.vendor}` : ''}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-2 text-xs text-zinc-600">
                        <Badge>{EXPENSE_CATEGORIES[expense.category]}</Badge>
                        {expense.url ? (
                          <a
                            href={expense.url}
                            target="_blank"
                            rel="noreferrer"
                            className="rounded bg-zinc-100 px-1.5 py-0.5 font-medium text-zinc-700 hover:bg-zinc-200"
                          >
                            Receipt
                          </a>
                        ) : null}
                      </div>
                      {expense.notes ? (
                        <p className="mt-3 text-sm text-zinc-600">{expense.notes}</p>
                      ) : null}
                    </div>
                    <p className="shrink-0 font-semibold text-zinc-950">{fmt$(expense.amount)}</p>
                  </div>
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
            <h2 className="text-base font-semibold text-zinc-950">Log an Expense</h2>
            <p className="mt-1 text-sm text-zinc-500">
              Keep match, ammo, parts, and travel spend in one place.
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

            <Field label="Category">
              <select
                value={form.category}
                onChange={(event) =>
                  updateField('category', event.target.value as ExpenseForm['category'])
                }
                className="input"
              >
                {Object.entries(EXPENSE_CATEGORIES).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Item">
              <input
                required
                value={form.item}
                onChange={(event) => updateField('item', event.target.value)}
                className="input"
                placeholder="Club match fee"
              />
            </Field>

            <Field label="Amount">
              <input
                required
                min="0.01"
                step="0.01"
                type="number"
                value={form.amount}
                onChange={(event) => updateField('amount', event.target.value)}
                className="input"
                placeholder="25.00"
              />
            </Field>

            <Field label="Vendor">
              <input
                value={form.vendor}
                onChange={(event) => updateField('vendor', event.target.value)}
                className="input"
                placeholder="PractiScore"
              />
            </Field>

            <Field label="Receipt URL">
              <input
                type="url"
                value={form.url}
                onChange={(event) => updateField('url', event.target.value)}
                className="input"
                placeholder="https://..."
              />
            </Field>

            <Field label="Notes">
              <textarea
                rows={3}
                value={form.notes}
                onChange={(event) => updateField('notes', event.target.value)}
                className="input resize-none"
                placeholder="Ammo for monthly match."
              />
            </Field>
          </div>

          <button
            disabled={isSaving}
            className="mt-4 w-full rounded-md bg-zinc-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-400"
          >
            {isSaving ? 'Saving...' : 'Save Expense'}
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
  return (
    <span className="rounded bg-zinc-100 px-1.5 py-0.5 font-medium text-zinc-700">
      {children}
    </span>
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
