'use client'

import { FormEvent, useEffect, useMemo, useState } from 'react'
import { ExternalLink, Filter, Pencil, ReceiptText, Search, Trash2, WalletCards, X } from 'lucide-react'
import { EXPENSE_CATEGORIES, fmt$, fmtDate } from '@/lib/constants'
import {
  applyDeletedRecord,
  applySavedRecord,
  expenseFormFromRecord,
  hasValidationErrors,
  validateExpenseForm,
} from '@/lib/edit-flows.mjs'

type Gun = {
  id: string
  name: string
  caliber: string
}

type MatchOption = {
  id: string
  date: string
  club: string
  matchName: string | null
}

type Expense = {
  id: string
  gunId: string | null
  matchId: string | null
  gun: Gun | null
  match: MatchOption | null
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
  gunId: string
  matchId: string
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
  gunId: '',
  matchId: '',
  item: '',
  amount: '',
  vendor: '',
  url: '',
  notes: '',
}

const allCategories = Object.keys(EXPENSE_CATEGORIES) as ExpenseCategory[]

function expenseMonth(value: string) {
  return new Date(value).toISOString().slice(0, 7)
}

function monthLabel(value: string) {
  const [year, month] = value.split('-').map(Number)
  return new Date(year, month - 1, 1).toLocaleDateString('en-US', {
    month: 'short',
    year: 'numeric',
  })
}

export function ExpensesDashboard() {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [guns, setGuns] = useState<Gun[]>([])
  const [matches, setMatches] = useState<MatchOption[]>([])
  const [form, setForm] = useState<ExpenseForm>(initialForm)
  const [query, setQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<ExpenseCategory | 'ALL'>('ALL')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [validationErrors, setValidationErrors] = useState<Partial<Record<keyof ExpenseForm, string>>>({})
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const totalSpend = expenses.reduce((sum, expense) => sum + expense.amount, 0)
  const currentMonth = today.slice(0, 7)
  const currentMonthSpend = expenses
    .filter((expense) => expenseMonth(expense.date) === currentMonth)
    .reduce((sum, expense) => sum + expense.amount, 0)
  const receiptCount = expenses.filter((expense) => expense.url).length
  const averageExpense = expenses.length ? totalSpend / expenses.length : 0

  const categoryTotals = useMemo(() => {
    return expenses.reduce<Partial<Record<ExpenseCategory, number>>>((totals, expense) => {
      totals[expense.category] = (totals[expense.category] ?? 0) + expense.amount
      return totals
    }, {})
  }, [expenses])

  const categoryBreakdown = allCategories
    .map((category) => ({ category, amount: categoryTotals[category] ?? 0 }))
    .filter((entry) => entry.amount > 0)
    .sort((a, b) => b.amount - a.amount)

  const topCategory = categoryBreakdown[0]

  const monthlyTotals = useMemo(() => {
    const totals = expenses.reduce<Record<string, number>>((acc, expense) => {
      const month = expenseMonth(expense.date)
      acc[month] = (acc[month] ?? 0) + expense.amount
      return acc
    }, {})

    return Object.entries(totals)
      .sort((a, b) => b[0].localeCompare(a[0]))
      .slice(0, 6)
      .map(([month, amount]) => ({ month, amount }))
  }, [expenses])

  const filteredExpenses = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()

    return expenses.filter((expense) => {
      const matchesCategory = categoryFilter === 'ALL' || expense.category === categoryFilter
      const searchable = [
        expense.item,
        expense.vendor,
        expense.notes,
        EXPENSE_CATEGORIES[expense.category],
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()

      return matchesCategory && (!normalizedQuery || searchable.includes(normalizedQuery))
    })
  }, [categoryFilter, expenses, query])

  useEffect(() => {
    let isActive = true

    async function loadExpenses() {
      try {
        const [expensesRes, gunsRes, matchesRes] = await Promise.all([
          fetch('/api/expenses', { cache: 'no-store' }),
          fetch('/api/guns', { cache: 'no-store' }),
          fetch('/api/matches?limit=200', { cache: 'no-store' }),
        ])
        if (!isActive) return

        if (!expensesRes.ok || !gunsRes.ok || !matchesRes.ok) {
          setError('Could not load expenses.')
          setIsLoading(false)
          return
        }

        setExpenses(await expensesRes.json())
        setGuns(await gunsRes.json())
        setMatches(await matchesRes.json())
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

  function resetForm(nextDate = form.date) {
    setForm({ ...initialForm, date: nextDate })
    setEditingId(null)
    setValidationErrors({})
  }

  function editExpense(expense: Expense) {
    setForm(expenseFormFromRecord(expense) as ExpenseForm)
    setEditingId(expense.id)
    setValidationErrors({})
    setError(null)
    setSuccess('Editing expense. Save changes or cancel to keep the original record.')
  }

  async function deleteExpense(expense: Expense) {
    const confirmed = window.confirm(`Delete ${expense.item}? This cannot be undone.`)
    if (!confirmed) return

    setDeletingId(expense.id)
    setError(null)
    setSuccess(null)

    const res = await fetch(`/api/expenses/${expense.id}`, { method: 'DELETE' })
    if (!res.ok) {
      setError('Could not delete expense. Try again.')
      setDeletingId(null)
      return
    }

    setExpenses((current) => applyDeletedRecord(current, expense.id) as Expense[])
    if (editingId === expense.id) resetForm()
    setSuccess('Expense deleted.')
    setDeletingId(null)
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const nextValidationErrors = validateExpenseForm(form) as Partial<Record<keyof ExpenseForm, string>>
    setValidationErrors(nextValidationErrors)
    if (hasValidationErrors(nextValidationErrors)) {
      setError('Fix the highlighted expense fields and try again.')
      return
    }

    setIsSaving(true)
    setError(null)
    setSuccess(null)

    const payload = {
      date: form.date,
      category: form.category,
      gunId: form.gunId || undefined,
      matchId: form.matchId || undefined,
      item: form.item.trim(),
      amount: Number(form.amount),
      vendor: form.vendor.trim() || undefined,
      url: form.url.trim() || '',
      notes: form.notes.trim() || undefined,
    }

    const res = await fetch(editingId ? `/api/expenses/${editingId}` : '/api/expenses', {
      method: editingId ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    if (!res.ok) {
      setError('Could not save expense. Check the required fields and try again.')
      setIsSaving(false)
      return
    }

    const saved = (await res.json()) as Expense
    setExpenses((current) => applySavedRecord(current, saved) as Expense[])
    setForm({ ...initialForm, date: form.date })
    setEditingId(null)
    setValidationErrors({})
    setSuccess(editingId ? 'Expense updated.' : 'Expense saved.')
    setIsSaving(false)
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_400px]">
      <section className="min-w-0 space-y-4">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Metric label="Total spend" value={fmt$(totalSpend)} detail={`${expenses.length} logged expenses`} />
          <Metric label="This month" value={fmt$(currentMonthSpend)} detail={monthLabel(currentMonth)} />
          <Metric
            label="Top category"
            value={topCategory ? EXPENSE_CATEGORIES[topCategory.category] : '-'}
            detail={topCategory ? fmt$(topCategory.amount) : 'No category spend yet'}
          />
          <Metric
            label="Receipts"
            value={`${receiptCount}/${expenses.length}`}
            detail={`${fmt$(averageExpense)} average ticket`}
          />
        </div>

        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(280px,0.85fr)]">
          <section className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
            <div className="border-b border-zinc-200 bg-zinc-50 px-4 py-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                    <WalletCards className="h-3.5 w-3.5" /> Spend ledger
                  </p>
                  <h2 className="mt-1 text-xl font-semibold tracking-tight text-zinc-950">
                    Expense command center
                  </h2>
                  <p className="mt-1 text-sm text-zinc-500">
                    Filter purchases, receipts, and training spend without losing the budget picture.
                  </p>
                </div>
                <span className="rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs font-semibold text-zinc-600 shadow-sm">
                  {isLoading ? 'Loading...' : `${filteredExpenses.length} visible`}
                </span>
              </div>

              <div className="mt-4 grid gap-2 md:grid-cols-[minmax(0,1fr)_220px]">
                <label className="relative block">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                  <input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    className="input pl-9"
                    placeholder="Search item, vendor, notes, or category..."
                  />
                </label>
                <label className="relative block">
                  <Filter className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                  <select
                    value={categoryFilter}
                    onChange={(event) =>
                      setCategoryFilter(event.target.value as ExpenseCategory | 'ALL')
                    }
                    className="input pl-9"
                  >
                    <option value="ALL">All categories</option>
                    {allCategories.map((category) => (
                      <option key={category} value={category}>
                        {EXPENSE_CATEGORIES[category]}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
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
                Loading expenses...
              </div>
            ) : expenses.length === 0 ? (
              <div className="px-4 py-12 text-center">
                <p className="font-medium text-zinc-900">No expenses logged yet.</p>
                <p className="mt-1 text-sm text-zinc-500">
                  Add match fees, ammo, parts, travel, and training costs here.
                </p>
              </div>
            ) : filteredExpenses.length === 0 ? (
              <div className="px-4 py-12 text-center">
                <p className="font-medium text-zinc-900">No expenses match that filter.</p>
                <p className="mt-1 text-sm text-zinc-500">
                  Clear the search or switch back to all categories.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-zinc-100">
                {filteredExpenses.map((expense) => (
                  <article key={expense.id} className="px-4 py-4 transition hover:bg-zinc-50/80">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge>{EXPENSE_CATEGORIES[expense.category]}</Badge>
                          {expense.url ? (
                            <a
                              href={expense.url}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 rounded bg-zinc-100 px-1.5 py-0.5 text-xs font-medium text-zinc-700 hover:bg-zinc-200"
                            >
                              Receipt
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          ) : null}
                        </div>
                        <h3 className="mt-2 truncate text-base font-semibold text-zinc-950">
                          {expense.item}
                        </h3>
                        <p className="mt-1 text-sm text-zinc-600">
                          {fmtDate(expense.date)}
                          {expense.vendor ? ` · ${expense.vendor}` : ''}
                        </p>
                        {expense.gun || expense.match ? (
                          <p className="mt-1 text-xs font-medium text-zinc-500">
                            {[expense.gun?.name, expense.match ? expense.match.matchName || expense.match.club : null]
                              .filter(Boolean)
                              .join(' · ')}
                          </p>
                        ) : null}
                        {expense.notes ? (
                          <p className="mt-3 max-w-2xl text-sm text-zinc-600">{expense.notes}</p>
                        ) : null}
                      </div>
                      <div className="flex shrink-0 flex-col items-start gap-2 sm:items-end">
                        <p className="text-lg font-semibold text-zinc-950">
                          {fmt$(expense.amount)}
                        </p>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => editExpense(expense)}
                            className="inline-flex items-center gap-1 rounded-md border border-zinc-200 px-2 py-1 text-xs font-semibold text-zinc-600 transition hover:bg-zinc-100"
                          >
                            <Pencil className="h-3.5 w-3.5" /> Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => void deleteExpense(expense)}
                            disabled={deletingId === expense.id}
                            className="inline-flex items-center gap-1 rounded-md border border-red-100 px-2 py-1 text-xs font-semibold text-red-700 transition hover:bg-red-50 disabled:opacity-60"
                          >
                            <Trash2 className="h-3.5 w-3.5" /> {deletingId === expense.id ? 'Deleting' : 'Delete'}
                          </button>
                        </div>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>

          <aside className="space-y-4">
            <section className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                    Category mix
                  </p>
                  <h3 className="mt-1 text-base font-semibold text-zinc-950">Where money is going</h3>
                </div>
                <ReceiptText className="h-5 w-5 text-zinc-400" />
              </div>

              {categoryBreakdown.length === 0 ? (
                <p className="mt-4 text-sm text-zinc-500">Log expenses to see the spend mix.</p>
              ) : (
                <div className="mt-4 space-y-3">
                  {categoryBreakdown.slice(0, 6).map((entry) => {
                    const percent = totalSpend ? Math.round((entry.amount / totalSpend) * 100) : 0

                    return (
                      <div key={entry.category}>
                        <div className="mb-1 flex items-center justify-between gap-3 text-sm">
                          <span className="truncate font-medium text-zinc-700">
                            {EXPENSE_CATEGORIES[entry.category]}
                          </span>
                          <span className="shrink-0 text-zinc-500">{fmt$(entry.amount)}</span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-zinc-100">
                          <div
                            className="h-full rounded-full bg-zinc-900"
                            style={{ width: `${Math.max(percent, 6)}%` }}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </section>

            <section className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                Monthly pace
              </p>
              <h3 className="mt-1 text-base font-semibold text-zinc-950">Last 6 months</h3>
              {monthlyTotals.length === 0 ? (
                <p className="mt-4 text-sm text-zinc-500">Monthly totals appear after expenses are logged.</p>
              ) : (
                <div className="mt-4 space-y-3">
                  {monthlyTotals.map((entry) => {
                    const peak = Math.max(...monthlyTotals.map((month) => month.amount))
                    const percent = peak ? Math.round((entry.amount / peak) * 100) : 0

                    return (
                      <div key={entry.month} className="grid grid-cols-[76px_minmax(0,1fr)_auto] items-center gap-3 text-sm">
                        <span className="text-zinc-500">{monthLabel(entry.month)}</span>
                        <div className="h-2 overflow-hidden rounded-full bg-zinc-100">
                          <div
                            className="h-full rounded-full bg-zinc-900/80"
                            style={{ width: `${Math.max(percent, 6)}%` }}
                          />
                        </div>
                        <span className="font-medium text-zinc-700">{fmt$(entry.amount)}</span>
                      </div>
                    )
                  })}
                </div>
              )}
            </section>
          </aside>
        </div>
      </section>

      <aside className="xl:sticky xl:top-6 xl:self-start">
        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm"
        >
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                {editingId ? 'Correction mode' : 'Quick capture'}
              </p>
              <h2 className="mt-1 text-lg font-semibold text-zinc-950">
                {editingId ? 'Edit Expense' : 'Log an Expense'}
              </h2>
              <p className="mt-1 text-sm text-zinc-500">
                {editingId
                  ? 'Update the fields and save, or cancel to leave the expense unchanged.'
                  : 'Keep match, ammo, parts, and travel spend in one place.'}
              </p>
            </div>
            {editingId ? (
              <button
                type="button"
                onClick={() => resetForm()}
                className="rounded-full border border-zinc-200 p-2 text-zinc-500 transition hover:bg-zinc-100"
                aria-label="Cancel expense edit"
              >
                <X className="h-4 w-4" />
              </button>
            ) : null}
          </div>

          <div className="grid gap-3">
            <Field label="Date" error={validationErrors.date}>
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

            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Firearm / build">
                <select value={form.gunId} onChange={(event) => updateField('gunId', event.target.value)} className="input">
                  <option value="">Not linked</option>
                  {guns.map((gun) => (
                    <option key={gun.id} value={gun.id}>{gun.name} · {gun.caliber}</option>
                  ))}
                </select>
              </Field>
              <Field label="Related match">
                <select value={form.matchId} onChange={(event) => updateField('matchId', event.target.value)} className="input">
                  <option value="">Not linked</option>
                  {matches.map((match) => (
                    <option key={match.id} value={match.id}>{match.matchName || match.club}</option>
                  ))}
                </select>
              </Field>
            </div>

            <Field label="Item" error={validationErrors.item}>
              <input
                required
                value={form.item}
                onChange={(event) => updateField('item', event.target.value)}
                className="input"
                placeholder="Club match fee"
              />
            </Field>

            <Field label="Amount" error={validationErrors.amount}>
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

            <Field label="Receipt URL" error={validationErrors.url}>
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
            {isSaving ? 'Saving...' : editingId ? 'Save Expense Changes' : 'Save Expense'}
          </button>
        </form>
      </aside>
    </div>
  )
}

function Metric({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white px-4 py-3 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">{label}</p>
      <p className="mt-1 truncate text-xl font-semibold text-zinc-950">{value}</p>
      <p className="mt-1 truncate text-xs text-zinc-500">{detail}</p>
    </div>
  )
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded bg-zinc-100 px-1.5 py-0.5 text-xs font-medium text-zinc-700">
      {children}
    </span>
  )
}

function Field({ label, children, error }: { label: string; children: React.ReactNode; error?: string }) {
  return (
    <label className="grid gap-1.5 text-sm font-medium text-zinc-700">
      {label}
      {children}
      {error ? <span className="text-xs font-medium text-red-700">{error}</span> : null}
    </label>
  )
}
