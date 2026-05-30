import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { validateImportPreviewPayload } from '@/lib/import-export.mjs'

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const payload = await req.json()
  const preview = validateImportPreviewPayload(payload)
  if (!preview.success) {
    const error = 'error' in preview ? String((preview as { error?: unknown }).error) : 'Invalid import preview payload.'
    return NextResponse.json({ error }, { status: 400 })
  }

  return NextResponse.json({
    ok: true,
    mode: 'preview-only',
    message: 'Import preview validated. Confirm/apply is intentionally separate so user data is not mutated blindly.',
    summary: preview.summary,
  })
}
