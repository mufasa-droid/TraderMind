import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { syncMetaTrades } from '@/lib/brokers/metaapi-adapter'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { broker_connection_id } = await request.json()
  const { data: conn } = await supabase.from('broker_connections')
    .select('*').eq('id', broker_connection_id).eq('user_id', user.id).single()
  if (!conn) return NextResponse.json({ error: "Not found" }, { status: 404 })
  const synced = await syncMetaTrades(user.id, conn.id, conn.account_id)