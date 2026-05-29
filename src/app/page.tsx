import { auth, signIn, signOut } from '@/auth'

export default async function Home() {
  const session = await auth()

  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-6 p-8">
      <h1 className="text-3xl font-bold">Practical Tracker</h1>
      <p className="text-gray-500">
        Match tracker for practical shooting — USPSA, SCSA, IPSC, 3-Gun, PRS.
      </p>

      {session?.user ? (
        <div className="flex flex-col items-center gap-3">
          <p className="text-sm text-gray-700">
            Signed in as {session.user.name ?? session.user.email}
          </p>
          <form
            action={async () => {
              'use server'
              await signOut({ redirectTo: '/' })
            }}
          >
            <button className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-50">
              Sign out
            </button>
          </form>
        </div>
      ) : (
        <form
          action={async () => {
            'use server'
            await signIn('github', { redirectTo: '/' })
          }}
        >
          <button className="rounded-md bg-black px-5 py-2.5 text-sm font-medium text-white hover:bg-gray-800">
            Sign in with GitHub
          </button>
        </form>
      )}
    </main>
  )
}
