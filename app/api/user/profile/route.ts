import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { full_name, timezone } = body

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      // Demo fallback
      return NextResponse.json({
        success: true,
        user: { full_name: full_name || 'Alex Kim', timezone: timezone || 'UTC' },
      })
    }

    const updates: Record<string, any> = {}
    if (full_name !== undefined) updates.full_name = full_name
    if (timezone !== undefined) updates.timezone = timezone

    const { error: profileError } = await supabase
      .from('users')
      .update(updates)
      .eq('id', user.id)

    if (profileError) {
      return NextResponse.json({ error: profileError.message }, { status: 500 })
    }

    if (full_name) {
      await supabase.auth.updateUser({
        data: { full_name },
      }).catch(() => {})
    }

    return NextResponse.json({
      success: true,
      user: { full_name, timezone },
    })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
