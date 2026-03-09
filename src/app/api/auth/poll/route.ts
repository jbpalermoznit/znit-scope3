import { NextRequest, NextResponse } from 'next/server'
import { pollForToken } from '@/lib/msalClient'

export async function POST(req: NextRequest) {
  try {
    const { deviceCode } = (await req.json()) as { deviceCode: string }
    const result = await pollForToken(deviceCode)
    if (result === 'pending') return NextResponse.json({ status: 'pending' })
    if (result === 'expired') return NextResponse.json({ status: 'expired' })
    return NextResponse.json({ status: 'ok', accessToken: result.access_token })
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Erro ao verificar autenticação'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
