import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  // Resolve public origin reliably on Vercel (taking proxy headers into account)
  const forwardedHost = request.headers.get('x-forwarded-host')
  const proto = request.headers.get('x-forwarded-proto') ?? 'https'
  const origin = forwardedHost
    ? `${proto}://${forwardedHost}`
    : (process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin)

  if (code) {
    try {
      const supabase = await createClient()
      const { error } = await supabase.auth.exchangeCodeForSession(code)

      if (error) {
        return NextResponse.redirect(`${origin}/auth/login?error=${encodeURIComponent(error.message)}`)
      }

      // Check if user has completed onboarding
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: profile } = await supabase
          .from('users')
          .select('onboarding_completed')
          .eq('id', user.id)
          .maybeSingle()

        if (profile && !profile.onboarding_completed) {
          return NextResponse.redirect(`${origin}/auth/onboarding`)
        }
      }

      const redirectPath = next.startsWith('/') ? next : '/dashboard'
      return NextResponse.redirect(`${origin}${redirectPath}`)
    } catch {
      return NextResponse.redirect(`${origin}/auth/login?error=Authentication%20failed`)
    }
  }

  return NextResponse.redirect(`${origin}/auth/login`)
}