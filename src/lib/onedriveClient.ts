/**
 * OneDrive/SharePoint client using Microsoft Graph API.
 * Requires a user access token obtained via device code flow (see msalClient.ts).
 */

export interface SharedPdfFile {
  name: string
  downloadUrl: string
  /** Path relative to the shared folder root, preserving subfolder structure */
  relativePath: string
}

/**
 * Encodes a sharing URL for the Graph API shares endpoint.
 * Uses manual base64url to guarantee correct output regardless of Node.js version.
 * Spec: RFC 4648 §5 — replace + with -, / with _, strip = padding.
 */
function encodeSharingUrl(url: string): string {
  const b64 = Buffer.from('u=' + url.trim())
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '')
  return 'u!' + b64
}

const ITEM_SELECT = '$select=id,name,file,folder,@microsoft.graph.downloadUrl'

interface GraphItem {
  id: string
  name: string
  file?: object
  folder?: object
  '@microsoft.graph.downloadUrl'?: string
  parentReference?: { driveId: string }
}

interface GraphChildren {
  value: GraphItem[]
  '@odata.nextLink'?: string
}

async function fetchAllChildren(url: string, headers: Record<string, string>): Promise<GraphItem[]> {
  const items: GraphItem[] = []
  const sep = url.includes('?') ? '&' : '?'
  let next: string | undefined = `${url}${sep}${ITEM_SELECT}`

  while (next) {
    const res = await fetch(next, { headers })
    if (!res.ok) {
      const msg = await res.text()
      throw new Error(`Graph API ${res.status}: ${msg}`)
    }
    const data = (await res.json()) as GraphChildren
    items.push(...data.value)
    next = data['@odata.nextLink']
  }

  return items
}

/** Walks parent folders from a given item up to (but not including) the drive root, returning names in root→leaf order. */
async function getAncestorNames(
  driveId: string,
  startParentId: string,
  headers: Record<string, string>
): Promise<string[]> {
  const names: string[] = []
  let currentId: string | undefined = startParentId
  const visited = new Set<string>()

  while (currentId && !visited.has(currentId)) {
    visited.add(currentId)
    const res = await fetch(
      `https://graph.microsoft.com/v1.0/drives/${driveId}/items/${currentId}?$select=id,name,parentReference`,
      { headers }
    )
    if (!res.ok) break
    const item = (await res.json()) as { id: string; name: string; parentReference?: { id?: string } }
    if (!item.parentReference?.id) break // reached root — skip root name
    names.push(item.name)
    currentId = item.parentReference.id
  }

  return names.reverse()
}

async function collectPdfs(
  childrenUrl: string,
  headers: Record<string, string>,
  driveId: string,
  relativeBase: string,
  results: SharedPdfFile[],
  folderNames?: string[]
): Promise<void> {
  const items = await fetchAllChildren(childrenUrl, headers)

  for (const item of items) {
    const relPath = relativeBase ? `${relativeBase}/${item.name}` : item.name

    if (item.folder) {
      folderNames?.push(item.name)
      const subUrl = `https://graph.microsoft.com/v1.0/drives/${driveId}/items/${item.id}/children`
      await collectPdfs(subUrl, headers, driveId, relPath, results, folderNames)
    } else if (item.file && item.name.toLowerCase().endsWith('.pdf')) {
      const downloadUrl = item['@microsoft.graph.downloadUrl']
        ?? `https://graph.microsoft.com/v1.0/drives/${driveId}/items/${item.id}/content`
      results.push({ name: item.name, downloadUrl, relativePath: relPath })
    }
  }
}

/**
 * Lists all PDF files in a OneDrive/SharePoint shared folder.
 * @param sharingUrl  The full sharing URL pasted by the user.
 * @param accessToken User access token from device code flow.
 */
export interface ListSharedResult {
  files: SharedPdfFile[]
  folderNames: string[]
}

export async function listSharedPdfs(
  sharingUrl: string,
  accessToken: string
): Promise<ListSharedResult> {
  const headers: Record<string, string> = { Authorization: `Bearer ${accessToken}` }

  const encodedToken = encodeSharingUrl(sharingUrl)
  const rootUrl = `https://graph.microsoft.com/v1.0/shares/${encodedToken}/driveItem`

  console.log('[onedrive] sharingUrl:', JSON.stringify(sharingUrl))
  console.log('[onedrive] encodedToken:', encodedToken)
  console.log('[onedrive] rootUrl:', rootUrl)

  // --- Approach 1: /shares endpoint (v1.0 and beta) ---
  const rootRes = await fetch(rootUrl, { headers })
  if (rootRes.ok) {
    return { files: await resolveRoot(await rootRes.json() as GraphItem, rootUrl, headers), folderNames: [] }
  }
  console.log('[onedrive] /shares v1.0 failed:', rootRes.status, await rootRes.text())

  const betaUrl = `https://graph.microsoft.com/beta/shares/${encodedToken}/driveItem`
  const betaRes = await fetch(betaUrl, { headers })
  if (betaRes.ok) {
    return { files: await resolveRoot(await betaRes.json() as GraphItem, betaUrl, headers), folderNames: [] }
  }
  console.log('[onedrive] /shares beta failed:', betaRes.status, await betaRes.text())

  // --- Approach 2: site-based navigation (works when /shares endpoint fails for OneDrive for Business personal sites) ---
  const urlObj = new URL(sharingUrl)
  const hostname = urlObj.hostname // e.g. znit872-my.sharepoint.com
  const pathParts = urlObj.pathname.split('/').filter(Boolean)
  // Expected: [':f:', 'g', 'personal', 'username', 'itemSegment']
  const personalIdx = pathParts.indexOf('personal')

  if (personalIdx !== -1 && pathParts.length > personalIdx + 2) {
    const driveOwnerUser = pathParts[personalIdx + 1] // contato_znit_ai
    const urlItemSegment = pathParts[personalIdx + 2] // SharePoint-encoded item ID

    console.log('[onedrive] trying site-based navigation, owner:', driveOwnerUser, 'hostname:', hostname)

    // Get authenticated user's domain to reconstruct the owner's UPN
    const meRes = await fetch('https://graph.microsoft.com/v1.0/me?$select=userPrincipalName', { headers })
    const domain = meRes.ok
      ? ((await meRes.json()) as { userPrincipalName?: string }).userPrincipalName?.split('@')[1]
      : undefined

    // 2a: Try /users/{ownerUpn}/drive (requires admin or same-user access)
    if (domain) {
      // SharePoint personal site paths encode the UPN by replacing '@' and '.' with '_'
      // e.g. contato@znit.ai → contato_znit_ai (where '_znit_ai' = '@znit.ai' with dots as underscores)
      const domainSuffix = '_' + domain.replace(/\./g, '_') // 'znit.ai' → '_znit_ai'
      const ownerLocalPart = driveOwnerUser.endsWith(domainSuffix)
        ? driveOwnerUser.slice(0, -domainSuffix.length) // strip domain suffix to get 'contato'
        : driveOwnerUser
      const ownerUpn = `${ownerLocalPart}@${domain}` // contato@znit.ai
      console.log('[onedrive] decoded UPN:', ownerUpn, '(from path:', driveOwnerUser, ')')
      const userItemUrl = `https://graph.microsoft.com/v1.0/users/${encodeURIComponent(ownerUpn)}/drive/items/${urlItemSegment}`
      const userItemRes = await fetch(userItemUrl, { headers })
      if (userItemRes.ok) {
        const item = (await userItemRes.json()) as GraphItem
        console.log('[onedrive] user drive item ok:', item.name)
        const childrenUrl = `https://graph.microsoft.com/v1.0/users/${encodeURIComponent(ownerUpn)}/drive/items/${item.id}/children`
        const userDriveRes2 = await fetch(`https://graph.microsoft.com/v1.0/users/${encodeURIComponent(ownerUpn)}/drive?$select=id`, { headers })
        const userDriveId = userDriveRes2.ok ? ((await userDriveRes2.json()) as { id: string }).id : item.id
        const results: SharedPdfFile[] = []
        await collectPdfs(childrenUrl, headers, userDriveId, '', results)
        return { files: results, folderNames: [] }
      }
      console.log('[onedrive] /users drive item failed:', userItemRes.status, await userItemRes.text())
    }

    // 2b: Try /sites/{hostname}:/personal/{username} → drive → item
    const siteApiUrl = `https://graph.microsoft.com/v1.0/sites/${hostname}:/personal/${driveOwnerUser}`
    console.log('[onedrive] trying', siteApiUrl)
    const siteRes = await fetch(siteApiUrl, { headers })
    if (siteRes.ok) {
      const site = (await siteRes.json()) as { id: string }
      console.log('[onedrive] site ok:', site.id)

      const siteDriveRes = await fetch(`https://graph.microsoft.com/v1.0/sites/${site.id}/drive`, { headers })
      if (siteDriveRes.ok) {
        const siteDrive = (await siteDriveRes.json()) as { id: string }
        console.log('[onedrive] site drive ok:', siteDrive.id)

        // Try the specific item
        const itemUrl = `https://graph.microsoft.com/v1.0/drives/${siteDrive.id}/items/${urlItemSegment}`
        const itemRes = await fetch(itemUrl, { headers })
        if (itemRes.ok) {
          const item = (await itemRes.json()) as GraphItem
          console.log('[onedrive] item ok:', item.name)
          const childrenUrl = `https://graph.microsoft.com/v1.0/drives/${siteDrive.id}/items/${item.id}/children`
          const results: SharedPdfFile[] = []
          await collectPdfs(childrenUrl, headers, siteDrive.id, '', results)
          return { files: results, folderNames: [] }
        }
        console.log('[onedrive] site drive item failed:', itemRes.status, await itemRes.text())

        // Try to find the specific shared folder via SharePoint _api/web/GetFolderById with decoded GUIDs
        // The URL item segment is 35 bytes: 2-byte prefix + GUID1 (bytes 2-17) + GUID2 (bytes 19-34) + 1 trailing byte
        const segBuf = Buffer.from(
          urlItemSegment.replace(/-/g, '+').replace(/_/g, '/') +
          '='.repeat((4 - urlItemSegment.length % 4) % 4),
          'base64'
        )
        // Mixed-endian (Windows GUID byte order): first 3 components little-endian, last 2 big-endian
        const toMixedEndianGuid = (buf: Buffer, offset: number) => {
          const b = buf.slice(offset, offset + 16)
          return [
            b.slice(0, 4).reverse().toString('hex'),
            b.slice(4, 6).reverse().toString('hex'),
            b.slice(6, 8).reverse().toString('hex'),
            b.slice(8, 10).toString('hex'),
            b.slice(10).toString('hex'),
          ].join('-')
        }
        // Big-endian (standard UUID byte order)
        const toBigEndianGuid = (buf: Buffer, offset: number) => {
          const b = buf.slice(offset, offset + 16)
          return [
            b.slice(0, 4).toString('hex'),
            b.slice(4, 6).toString('hex'),
            b.slice(6, 8).toString('hex'),
            b.slice(8, 10).toString('hex'),
            b.slice(10).toString('hex'),
          ].join('-')
        }
        const guidsToTry: string[] = []
        if (segBuf.length >= 18) {
          guidsToTry.push(toMixedEndianGuid(segBuf, 2))  // bytes 2-17, mixed-endian
          guidsToTry.push(toBigEndianGuid(segBuf, 2))     // bytes 2-17, big-endian
        }
        if (segBuf.length >= 35) {
          guidsToTry.push(toMixedEndianGuid(segBuf, 19)) // bytes 19-34, mixed-endian
          guidsToTry.push(toBigEndianGuid(segBuf, 19))    // bytes 19-34, big-endian
        }
        console.log('[onedrive] guids to try:', guidsToTry)

        for (const guid of guidsToTry) {
          // Try SharePoint CSOM REST: _api/web/GetFolderById('{guid}')
          const spFolderUrl = `https://${hostname}/personal/${driveOwnerUser}/_api/web/GetFolderById('${guid}')?$select=ServerRelativeUrl,UniqueId,Name`
          const spFolderRes = await fetch(spFolderUrl, {
            headers: { ...headers, Accept: 'application/json;odata=nometadata' },
          })
          if (spFolderRes.ok) {
            const folder = (await spFolderRes.json()) as { ServerRelativeUrl?: string; Name?: string }
            console.log('[onedrive] SharePoint folder found via GUID', guid, ':', JSON.stringify(folder))
            if (folder.ServerRelativeUrl) {
              // Extract path relative to /personal/driveOwnerUser/Documents/
              // e.g. /personal/contato_znit_ai/Documents/Invoices → root:/Documents/Invoices
              const docLib = `/personal/${driveOwnerUser}/`
              const folderRel = folder.ServerRelativeUrl.startsWith(docLib)
                ? folder.ServerRelativeUrl.slice(docLib.length)
                : folder.ServerRelativeUrl
              console.log('[onedrive] navigating to folder path:', folderRel)
              const folderNavUrl = `https://graph.microsoft.com/v1.0/drives/${siteDrive.id}/root:/${encodeURIComponent(folderRel)}:/children`
              const folderChildRes = await fetch(folderNavUrl, { headers })
              if (folderChildRes.ok) {
                const data = (await folderChildRes.json()) as GraphChildren
                console.log('[onedrive] folder children ok, count:', data.value?.length)
                const results: SharedPdfFile[] = []
                await collectPdfs(folderNavUrl.replace(/\/children.*/, '/children'), headers, siteDrive.id, '', results)
                if (results.length > 0) return { files: results, folderNames: [] }
              }
            }
          } else {
            console.log('[onedrive] SP GetFolderById failed for guid', guid, ':', spFolderRes.status, await spFolderRes.text())
          }
        }

        // Search the drive for PDF files, then filter to the specific folder
        console.log('[onedrive] searching drive for PDFs...')
        const searchUrl = `https://graph.microsoft.com/v1.0/drives/${siteDrive.id}/root/search(q='.pdf')?$select=id,name,file,folder,@microsoft.graph.downloadUrl,parentReference&$top=200`
        const searchRes = await fetch(searchUrl, { headers })
        if (searchRes.ok) {
          const searchData = (await searchRes.json()) as { value: GraphItem[] }
          const pdfItems = searchData.value?.filter(item => item.file && item.name.toLowerCase().endsWith('.pdf'))

          // Group search results by parent folder id
          const byParent = new Map<string, GraphItem[]>()
          for (const item of (pdfItems ?? [])) {
            const pr = item.parentReference as { id?: string } | undefined
            const pid = pr?.id ?? '__root__'
            if (!byParent.has(pid)) byParent.set(pid, [])
            byParent.get(pid)!.push(item)
          }
          console.log('[onedrive] unique parent folder IDs in search:', byParent.size)

          // Match parent folders against our decoded GUIDs via sharepointIds.listItemUniqueId
          const guidsLower = guidsToTry.map(g => g.toLowerCase())
          const uniqueParentIds = [...byParent.keys()].filter(id => id !== '__root__')
          console.log('[onedrive] checking', uniqueParentIds.length, 'parent folders for GUID match...')
          console.log('[onedrive] target guids:', guidsLower)

          for (const parentId of uniqueParentIds) {
            const folderRes = await fetch(
              `https://graph.microsoft.com/v1.0/drives/${siteDrive.id}/items/${parentId}?$select=id,name,sharepointIds,parentReference`,
              { headers }
            )
            if (!folderRes.ok) continue
            const folder = (await folderRes.json()) as { id: string; name: string; sharepointIds?: { listItemUniqueId?: string }; parentReference?: { id?: string } }
            const uniqueId = folder.sharepointIds?.listItemUniqueId?.toLowerCase().replace(/[{}]/g, '')
            console.log('[onedrive] folder', folder.name, 'listItemUniqueId:', uniqueId)
            if (uniqueId && guidsLower.some(g => g === uniqueId)) {
              console.log('[onedrive] FOUND target folder via sharepointIds match!', folder.name, 'id:', folder.id)
              // Collect ancestor names (root → matched folder) + subfolders inside it
              const ancestorNames = folder.parentReference?.id
                ? await getAncestorNames(siteDrive.id, folder.parentReference.id, headers)
                : []
              const subfolderNames: string[] = []
              const results: SharedPdfFile[] = []
              const childrenUrl = `https://graph.microsoft.com/v1.0/drives/${siteDrive.id}/items/${folder.id}/children`
              await collectPdfs(childrenUrl, headers, siteDrive.id, '', results, subfolderNames)
              const folderNames = [...ancestorNames, folder.name, ...subfolderNames]
              if (results.length > 0) return { files: results, folderNames }
              // Fallback to search results already in memory for this folder
              console.log('[onedrive] collectPdfs empty, using search results for matched folder')
              const targetItems = byParent.get(parentId) ?? []
              for (const item of targetItems) {
                const dlUrl = item['@microsoft.graph.downloadUrl']
                  ?? `https://graph.microsoft.com/v1.0/drives/${siteDrive.id}/items/${item.id}/content`
                results.push({ name: item.name, downloadUrl: dlUrl, relativePath: item.name })
              }
              if (results.length > 0) return { files: results, folderNames }
            }
          }
          console.log('[onedrive] no parent folder matched the GUIDs; falling back to all search results')

          // Fallback: return all search results
          if (pdfItems && pdfItems.length > 0) {
            const results: SharedPdfFile[] = []
            for (const item of pdfItems) {
              const dlUrl = item['@microsoft.graph.downloadUrl']
                ?? `https://graph.microsoft.com/v1.0/drives/${siteDrive.id}/items/${item.id}/content`
              results.push({ name: item.name, downloadUrl: dlUrl, relativePath: item.name })
            }
            return { files: results, folderNames: [] }
          }
        } else {
          console.log('[onedrive] search failed:', searchRes.status, await searchRes.text())
        }
      } else {
        console.log('[onedrive] site drive failed:', siteDriveRes.status, await siteDriveRes.text())
      }
    } else {
      console.log('[onedrive] site failed:', siteRes.status, await siteRes.text())
    }
  }

  throw new Error(
    `Não foi possível acessar o link OneDrive (${rootRes.status}). ` +
    'Verifique se o link é de uma pasta compartilhada do OneDrive for Business e se a conta autenticada tem acesso.'
  )
}

async function resolveRoot(root: GraphItem, baseUrl: string, headers: Record<string, string>): Promise<SharedPdfFile[]> {
  if (!root.folder) {
    if (!root.name.toLowerCase().endsWith('.pdf')) {
      throw new Error('O link compartilhado não aponta para uma pasta ou arquivo PDF.')
    }
    const downloadUrl = root['@microsoft.graph.downloadUrl']
    if (!downloadUrl) throw new Error('Não foi possível obter o URL de download do arquivo.')
    return [{ name: root.name, downloadUrl, relativePath: root.name }]
  }
  const driveId = root.parentReference?.driveId
  if (!driveId) throw new Error('Não foi possível identificar o drive do link compartilhado.')
  const results: SharedPdfFile[] = []
  await collectPdfs(`${baseUrl}/children`, headers, driveId, '', results)
  return results
}
