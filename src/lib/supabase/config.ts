export function getSupabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

  if (
    !url
    || !key
    || /your[-_]supabase|paste[-_]your|your[-_]project|your[-_]key/i.test(url)
    || /your[-_]supabase|paste[-_]your|your[-_]project|your[-_]key/i.test(key)
  ) {
    return null;
  }

  try {
    const parsedUrl = new URL(url);
    const isLocalhost = ["localhost", "127.0.0.1", "::1"].includes(parsedUrl.hostname);
    if (
      !["https:", "http:"].includes(parsedUrl.protocol)
      || (parsedUrl.protocol !== "https:" && !isLocalhost)
      || parsedUrl.username
      || parsedUrl.password
      || parsedUrl.hash
    ) {
      return null;
    }
  } catch {
    return null;
  }

  return { url, key };
}
