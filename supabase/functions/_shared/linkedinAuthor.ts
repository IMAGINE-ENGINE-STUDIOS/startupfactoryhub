// Resolves the LinkedIn credentials used for auto-posting.
// Campaign automation is intentionally Company Page-only. A member token must
// never be used as a silent fallback because that publishes on a person's feed.

export type LinkedInAuthor = {
  access_token: string
  org_urn: string // author URN (organization or person)
  kind: 'organization' | 'member'
  label: string
}

export async function resolveLinkedInAuthor(admin: any): Promise<LinkedInAuthor | null> {
  const { data: orgToken } = await admin
    .from('linkedin_org_tokens')
    .select('*')
    .eq('is_active', true)
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  const isRealOrganization = /^urn:li:organization:\d+$/.test(orgToken?.org_urn ?? '')
  const grantedScopes = String(orgToken?.scope ?? '').split(/[\s,]+/).filter(Boolean)

  if (
    orgToken?.access_token &&
    isRealOrganization &&
    grantedScopes.includes('w_organization_social')
  ) {
    return {
      access_token: orgToken.access_token,
      org_urn: orgToken.org_urn,
      kind: 'organization',
      label: orgToken.org_name ?? 'Company Page',
    }
  }

  return null
}
