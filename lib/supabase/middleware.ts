import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  // Allow placeholder env (fresh clone with .env.example) to run without crashing
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''
  const isPlaceholder = url.includes('YOUR_PROJECT') || anon.includes('YOUR_') || !url || !anon
  if (isPlaceholder) {
    // In placeholder/demo mode still allow demo bypass; skip Supabase check
    return NextResponse.next({ request })
  }

  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    url,
    anon,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // IMPORTANT: Do not remove getUser() — it refreshes the auth token
  const { data: { user } } = await supabase.auth.getUser()

  const isDemo = process.env.NEXT_PUBLIC_DEMO_MODE === 'true'
  const pathname = request.nextUrl.pathname

  const isPublic =
    pathname === '/' ||
    pathname.startsWith('/auth') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname === '/api/auth/callback' // allow OAuth callback

  const isApi = pathname.startsWith('/api/')
  const isPublicApi =
    pathname === '/api/auth/callback' ||
    pathname === '/api/auth/init-user' ||
    pathname.startsWith('/api/broker/webhook')

  // Protect dashboard + app routes (Rule 3.16 & Section 6.3)
  const protectedPaths = [
    '/dashboard', '/behavior', '/ai-coach', '/trades',
    '/journal', '/goals', '/broker', '/screenshots', '/onboarding',
  ]
  const isProtected = protectedPaths.some(p => pathname.startsWith(p))

  if (!user && !isDemo && (isProtected || (isApi && !isPublicApi))) {
    // For API, return 401 JSON instead of redirect
    if (isApi) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (isProtected) {
      const url = request.nextUrl.clone()
      url.pathname = '/auth/login'
      url.searchParams.set('next', pathname)
      return NextResponse.redirect(url)
    }
  }

  // If authenticated user hits /auth/login or /auth/register, send to dashboard
  if (user && (pathname.startsWith('/auth/login') || pathname.startsWith('/auth/register'))) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}
