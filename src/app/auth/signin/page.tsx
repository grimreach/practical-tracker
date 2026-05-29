import { signIn } from '@/auth'

export default function SignIn() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-6 p-8">
      <h1 className="text-2xl font-bold">Sign in to Practical Tracker</h1>
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
    </main>
  )
}
