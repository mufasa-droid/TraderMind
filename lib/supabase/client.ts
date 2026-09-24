import { createBrowserClient } from '@supabase/ssr'

export function isSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  return Boolean(
    url &&
    key &&
    !url.includes('YOUR_PROJECT') &&
    !url.includes('placeholder-project') &&
    !key.includes('YOUR_') &&
    !key.includes('dummy')
  )
}

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !key || url.includes('YOUR_PROJECT') || key.includes('YOUR_') || url.includes('placeholder-project')) {
    // Provide a safe fallback mock client so demo mode doesn't crash when env vars are unconfigured
    return createBrowserClient(
      'https://placeholder-project.supabase.co',
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.dummy'
    )
  }

  return createBrowserClient(url, key)
}

