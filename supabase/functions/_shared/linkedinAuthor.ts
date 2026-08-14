// Resolves the LinkedIn credentials used for auto-posting.
// Preference: active Company Page (organization) token.
// Fallback: most recent still-valid member token (posts as the person).

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
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (orgToken?.access_token && orgToken?.org_urn) {
    return {
      access_token: orgToken.access_token,
      org_urn: orgToken.org_urn,
      kind: 'organization',
      label: orgToken.org_name ?? 'Company Page',
    }
  }

  const { data: memberTokens } = await admin
    .from('linkedin_tokens')
    .select('access_token, linkedin_sub, linkedin_name, expires_at')
    .gt('expires_at', new Date().toISOString())
    .order('updated_at', { ascending: false })
    .limit(1)

  const member = memberTokens?.[0]
  if (member?.access_token && member?.linkedin_sub) {
    return {
      access_token: member.access_token,
      org_urn: `urn:li:person:${member.linkedin_sub}`,
      kind: 'member',
      label: member.linkedin_name ?? 'LinkedIn member',
    }
  }

  return null
}
