import { NextResponse } from 'next/server'
import { CAPABILITIES } from '@/lib/capabilities'

export async function GET() {
  try {
    return NextResponse.json({ capabilities: CAPABILITIES })
  } catch (err) {
    console.error('[/api/discover]', err)
    return NextResponse.json(
      { error: 'Failed to load capabilities', code: 'DISCOVER_ERROR' },
      { status: 500 }
    )
  }
}
