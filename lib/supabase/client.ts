import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !key || url.includes('YOUR_PROJECT') || key.includes('YOUR_')) {
    // Provide a safe fallback mock client so demo mode doesn't crash when env vars are unconfigured
    return createBrowserClient(
      'https://placeholder-project.supabase.co',
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.dummy'
    )
  }

  return createBrowserClient(url, key)
}
