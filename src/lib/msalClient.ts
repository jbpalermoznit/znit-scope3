/**
 * Microsoft device code flow — no client secret required.
 * Requires AZURE_TENANT_ID and AZURE_CLIENT_ID in .env.local.
 *
 * Setup (one-time, ~2 min):
 * 1. portal.azure.com → "App registrations" → "New registration"
 * 2. Name: "ZNIT Scope3", Supported accounts: "this organizational directory only"
 * 3. Platform: "Mobile and desktop applications" → add redirect URI: http://localhost
 * 4. Register → copy "Application (client) ID" and "Directory (tenant) ID"
 * 5. API permissions → Add → Microsoft Graph → Delegated → Files.Read.All + Sites.Read.All
 * 6. Paste IDs into .env.local as AZURE_CLIENT_ID and AZURE_TENANT_ID
 */

const SCOPES = 'https://graph.microsoft.com/Files.Read.All https://graph.microsoft.com/Sites.Read.All https://graph.microsoft.com/User.Read offline_access'

function tenantUrl() {
  const tenant = process.env.AZURE_TENANT_ID
  if (!tenant) throw new Error('AZURE_TENANT_ID não definido em .env.local')
  return `https://login.microsoftonline.com/${tenant}/oauth2/v2.0`
}

function clientId() {
  const id = process.env.AZURE_CLIENT_ID
  if (!id) throw new Error('AZURE_CLIENT_ID não definido em .env.local')
  return id
}

export interface DeviceCodeResponse {
  device_code: string
  user_code: string
  verification_uri: string
  expires_in: number
  interval: number
  message: string
}

export interface TokenResponse {
  access_token: string
  expires_in: number
}

/** Step 1: Request a device code. Show user_code + verification_uri to the user. */
export async function requestDeviceCode(): Promise<DeviceCodeResponse> {
  const res = await fetch(`${tenantUrl()}/devicecode`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId(),
      scope: SCOPES,
    }),
  })
  if (!res.ok) {
    const body = await res.text()
    let detail = body
    try {
      const json = JSON.parse(body) as { error?: string; error_description?: string }
      detail = json.error_description?.split('\r\n')[0] ?? json.error ?? body
      if (json.error === 'unauthorized_client') {
        throw new Error(
          'App não autorizado para device code flow. No portal Azure: ' +
            'App registrations → Authentication → Advanced settings → ' +
            '"Allow public client flows" → Sim → Salvar.'
        )
      }
    } catch (parseErr) {
      if (parseErr instanceof Error && parseErr.message.includes('Allow public client')) throw parseErr
    }
    throw new Error(`Erro ao iniciar autenticação Microsoft (${res.status}): ${detail}`)
  }
  return res.json() as Promise<DeviceCodeResponse>
}

/** Step 2: Poll until the user completes auth. Returns the access token or null if still pending. */
export async function pollForToken(
  deviceCode: string
): Promise<TokenResponse | 'pending' | 'expired'> {
  const res = await fetch(`${tenantUrl()}/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:device_code',
      client_id: clientId(),
      device_code: deviceCode,
    }),
  })

  const data = (await res.json()) as {
    access_token?: string
    error?: string
    error_description?: string
    expires_in?: number
  }

  if (data.access_token) {
    return { access_token: data.access_token, expires_in: data.expires_in ?? 3600 }
  }
  if (data.error === 'authorization_pending' || data.error === 'slow_down') return 'pending'
  if (data.error === 'expired_token') return 'expired'

  // Surface the real error description from Microsoft
  const detail = data.error_description?.split('\r\n')[0] ?? data.error ?? 'Erro desconhecido'

  if (data.error === 'unauthorized_client') {
    throw new Error(
      'App não configurado para fluxo público. No portal Azure: ' +
        'App registrations → Authentication → "Allow public client flows" → Sim. ' +
        `Detalhe: ${detail}`
    )
  }

  throw new Error(`Erro de autenticação Microsoft (${data.error}): ${detail}`)
}
