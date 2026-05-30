import { auth, signIn, signOut } from '@/auth'
import { Activity, ArrowRight, Gauge, LogIn, ShieldCheck, Target, Wallet } from 'lucide-react'
import { AppDashboard } from './app-dashboard'

const featureCards = [
  {
    icon: Activity,
    title: 'Match intelligence',
    body: 'Log placements, divisions, stage notes, and video links across USPSA, SCSA, IPSC, PRS, and more.',
  },
  {
    icon: Wallet,
    title: 'True cost tracking',
    body: 'Keep fees, ammo, parts, travel, and receipts tied to the same shooting history.',
  },
  {
    icon: Gauge,
    title: 'Load development ready',
    body: 'Chrono and maintenance workspaces are staged for velocity strings, power factor, and service intervals.',
  },
]

const productPills = ['USPSA', 'SCSA', 'IPSC', 'IDPA', '3-Gun', 'PRS', 'NRL22']

export default async function Home() {
  const session = await auth()

  return (
    <main className="tracker-shell min-h-screen bg-zinc-50 text-zinc-950">
      {session?.user ? (
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-7 px-4 py-5 sm:px-6 lg:px-8">
          <header className="dashboard-header overflow-hidden rounded-3xl border border-zinc-200 bg-white px-5 py-5 shadow-sm sm:px-6">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-start gap-4">
                <div className="brand-orb">
                  <Target className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="eyebrow">Shooter command center</p>
                    <span className="status-pill">
                      <ShieldCheck className="h-3.5 w-3.5" /> Synced
                    </span>
                  </div>
                  <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
                    Practical Tracker
                  </h1>
                  <p className="mt-2 max-w-2xl text-sm text-zinc-600 sm:text-base">
                    Signed in as {session.user.name ?? session.user.email}. Capture match outcomes,
                    spend, stage review, and gun data from one clean workspace.
                  </p>
                </div>
              </div>

              <form
                action={async () => {
                  'use server'
                  await signOut({ redirectTo: '/' })
                }}
              >
                <button className="inline-flex items-center justify-center rounded-full border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-800 shadow-sm transition hover:bg-zinc-100">
                  Sign out
                </button>
              </form>
            </div>
          </header>

          <AppDashboard />
        </div>
      ) : (
        <div className="relative isolate flex min-h-screen flex-col overflow-hidden">
          <div className="hero-glow hero-glow-a" />
          <div className="hero-glow hero-glow-b" />

          <header className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-6 lg:px-8">
            <div className="flex items-center gap-3">
              <div className="brand-orb">
                <Target className="h-5 w-5" />
              </div>
              <span className="text-sm font-semibold tracking-tight text-zinc-100">
                Practical Tracker
              </span>
            </div>
            <form
              action={async () => {
                'use server'
                await signIn('github', { redirectTo: '/' })
              }}
            >
              <button className="ghost-button hidden sm:inline-flex">
                <LogIn className="h-4 w-4" /> Sign in
              </button>
            </form>
          </header>

          <section className="mx-auto grid w-full max-w-7xl flex-1 items-center gap-12 px-6 pb-16 pt-8 lg:grid-cols-[minmax(0,1fr)_460px] lg:px-8 lg:pb-24">
            <div>
              <p className="eyebrow">Open-source performance logbook</p>
              <h1 className="mt-5 max-w-4xl text-5xl font-semibold leading-[0.95] tracking-[-0.06em] text-zinc-50 sm:text-6xl lg:text-7xl">
                A cleaner way to track every match, round, dollar, and lesson.
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-zinc-400">
                Practical Tracker gives competitive shooters a purpose-built command center for match
                history, stage review, ammo cost, load development, and maintenance signals.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <form
                  action={async () => {
                    'use server'
                    await signIn('github', { redirectTo: '/' })
                  }}
                >
                  <button className="primary-button w-full sm:w-auto">
                    <LogIn className="h-4 w-4" /> Sign in with GitHub
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </form>
                <a href="https://github.com/grimreach/practical-tracker" className="ghost-button">
                  View repo
                </a>
              </div>

              <div className="mt-8 flex flex-wrap gap-2">
                {productPills.map((pill) => (
                  <span key={pill} className="sport-pill">
                    {pill}
                  </span>
                ))}
              </div>
            </div>

            <div className="hero-panel">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <p className="eyebrow">This season</p>
                  <h2 className="mt-2 text-2xl font-semibold text-zinc-50">Performance cockpit</h2>
                </div>
                <span className="status-pill">Live</span>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <PreviewMetric label="Matches" value="18" trend="+4 this month" />
                <PreviewMetric label="Rounds" value="2,486" trend="142 avg / match" />
                <PreviewMetric label="Ammo spend" value="$596" trend="$0.24 / round" />
                <PreviewMetric label="Service due" value="650" trend="rounds remaining" />
              </div>

              <div className="mt-5 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="mini-icon"><Activity className="h-4 w-4" /></div>
                  <div>
                    <p className="text-sm font-semibold text-zinc-950">May USPSA</p>
                    <p className="text-xs text-zinc-500">4/37 · PCC · Stage review attached</p>
                  </div>
                </div>
                <div className="mt-4 h-2 overflow-hidden rounded-full bg-zinc-100">
                  <div className="h-full w-[89%] rounded-full bg-indigo-500" />
                </div>
              </div>

              <div className="mt-5 grid gap-3">
                {featureCards.map((feature) => {
                  const Icon = feature.icon
                  return (
                    <article key={feature.title} className="preview-row">
                      <Icon className="h-4 w-4" />
                      <div>
                        <h3>{feature.title}</h3>
                        <p>{feature.body}</p>
                      </div>
                    </article>
                  )
                })}
              </div>
            </div>
          </section>
        </div>
      )}
    </main>
  )
}

function PreviewMetric({ label, value, trend }: { label: string; value: string; trend: string }) {
  return (
    <div className="preview-metric">
      <p>{label}</p>
      <strong>{value}</strong>
      <span>{trend}</span>
    </div>
  )
}
