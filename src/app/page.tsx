import { auth, signIn, signOut } from '@/auth'
import { MatchesDashboard } from './matches-dashboard'

export default async function Home() {
  const session = await auth()

  return (
    <main className="min-h-screen bg-zinc-50 text-zinc-950">
      {session?.user ? (
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
          <header className="flex flex-col gap-4 border-b border-zinc-200 pb-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Practical Tracker</h1>
              <p className="mt-1 text-sm text-zinc-600">
                Signed in as {session.user.name ?? session.user.email}
              </p>
            </div>

            <form
              action={async () => {
                'use server'
                await signOut({ redirectTo: '/' })
              }}
            >
              <button className="rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-800 shadow-sm hover:bg-zinc-100">
                Sign out
              </button>
            </form>
          </header>

          <MatchesDashboard />
        </div>
      ) : (
        <div className="flex min-h-screen flex-col items-center justify-center gap-6 p-8 text-center">
          <div>
            <h1 className="text-3xl font-bold">Practical Tracker</h1>
            <p className="mt-3 max-w-xl text-zinc-600">
              Match tracker for practical shooting — USPSA, SCSA, IPSC, 3-Gun, PRS.
            </p>
          </div>
          <form
            action={async () => {
              'use server'
              await signIn('github', { redirectTo: '/' })
            }}
          >
            <button className="rounded-md bg-zinc-950 px-5 py-2.5 text-sm font-medium text-white hover:bg-zinc-800">
              Sign in with GitHub
            </button>
          </form>
        </div>
      )}
    </main>
  )
}
