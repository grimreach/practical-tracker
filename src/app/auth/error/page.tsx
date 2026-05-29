export default async function AuthError({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const { error } = await searchParams

  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-4 p-8">
      <h1 className="text-2xl font-bold">Authentication error</h1>
      <p className="text-gray-500">
        {error ?? 'Something went wrong during sign in.'}
      </p>
      <a href="/auth/signin" className="text-sm underline">
        Try again
      </a>
    </main>
  )
}
