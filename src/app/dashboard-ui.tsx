import type { ReactNode } from 'react'

type DashboardMetricProps = {
  label: string
  value: string
  detail?: string
  variant?: 'card' | 'mini'
}

export function DashboardMetric({ label, value, detail, variant = 'card' }: DashboardMetricProps) {
  if (variant === 'mini') {
    return (
      <div className="mini-stat items-start">
        <span>{label}</span>
        <strong>{value}</strong>
        {detail ? <span>{detail}</span> : null}
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-zinc-200 bg-white px-4 py-3 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">{label}</p>
      <p className="mt-1 truncate text-xl font-semibold text-zinc-950">{value}</p>
      {detail ? <p className="mt-1 truncate text-xs text-zinc-500">{detail}</p> : null}
    </div>
  )
}

export function DashboardBadge({ children }: { children: ReactNode }) {
  return <span className="rounded bg-zinc-100 px-1.5 py-0.5 text-xs font-medium text-zinc-700">{children}</span>
}

export function DashboardStat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-zinc-500">{label}</p>
      <p className="font-semibold text-zinc-950">{value}</p>
    </div>
  )
}

export function DashboardField({ label, children, error }: { label: string; children: ReactNode; error?: string }) {
  return (
    <label className="grid gap-1.5 text-sm font-medium text-zinc-700">
      <span>{label}</span>
      {children}
      {error ? <span className="text-xs font-medium text-red-700">{error}</span> : null}
    </label>
  )
}

export function DashboardStateBlock({ title, detail }: { title: string; detail: string }) {
  return (
    <div className="px-4 py-12 text-center">
      <p className="font-medium text-zinc-900">{title}</p>
      <p className="mx-auto mt-1 max-w-md text-sm text-zinc-500">{detail}</p>
    </div>
  )
}

type DashboardRelationshipLabel = {
  label: string
  value: string
}

export function DashboardRelationshipLabels({ labels }: { labels: DashboardRelationshipLabel[] }) {
  if (labels.length === 0) return null

  return (
    <div className="mt-2 flex flex-wrap items-center gap-1.5 text-xs font-medium text-zinc-500">
      {labels.map((relationship) => (
        <span key={`${relationship.label}:${relationship.value}`} className="rounded-full bg-zinc-100 px-2 py-0.5">
          <span className="text-zinc-400">{relationship.label}:</span> {relationship.value}
        </span>
      ))}
    </div>
  )
}
