import { NextResponse } from 'next/server'
import { requestDeviceCode } from '@/lib/msalClient'

export async function GET() {
  try {
    const data = await requestDeviceCode()
    return NextResponse.json(data)
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Erro ao iniciar autenticação'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
