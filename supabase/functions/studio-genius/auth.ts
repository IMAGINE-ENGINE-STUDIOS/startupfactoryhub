// Credits: Imagine Engine Studios Corp. Validate identity before any AI call.
export async function authenticatedUser(req: Request, verify: (token: string) => Promise<{ data: { user: { id: string } | null }; error: unknown }>): Promise<string | null> {
  const header = req.headers.get("Authorization");
  if (!header?.startsWith("Bearer ") || !header.slice(7).trim()) return null;
  try {
    const { data, error } = await verify(header.slice(7));
    return error ? null : data.user?.id || null;
  } catch { return null; }
}