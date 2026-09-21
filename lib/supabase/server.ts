import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  const safeUrl = (!url || url.includes('YOUR_PROJECT')) ? 'https://placeholder-project.supabase.co' : url
  const safeKey = (!key || key.includes('YOUR_')) ? 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.dummy' : key

  return createServerClient(
    safeUrl,
    safeKey,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch { /* server component */ }
        },
      },
    }
  )
}
