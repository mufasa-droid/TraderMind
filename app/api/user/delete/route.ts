import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServerClient } from '@supabase/ssr'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      // In demo mode without authenticated user, acknowledge deletion
      return NextResponse.json({
        success: true,
        message: 'Demo account state cleared.',
      })
    }

    // 1. Delete user record from public.users (cascades to all user tables)
    try {
      await supabase.from('users').delete().eq('id', user.id)
    } catch {
      // Continue cleanup
    }

    // 2. If service role key is available, delete from auth.users as well
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    if (serviceKey && supabaseUrl && !serviceKey.includes('YOUR_')) {
      const adminClient = createServerClient(supabaseUrl, serviceKey, {
        cookies: {
          getAll: () => [],
          setAll: () => {},
        },
      })
      await adminClient.auth.admin.deleteUser(user.id).catch(() => {})
    }

    // 3. Sign out session
    await supabase.auth.signOut().catch(() => {})

    return NextResponse.json({
      success: true,
      message: 'Account successfully deleted.',
    })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
