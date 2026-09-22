import { NextRequest, NextResponse } from 'next/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { detectTradingSession } from '@/lib/utils'
import type { Trade } from '@/types'

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder-project.supabase.co'
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'dummy'
  return createSupabaseClient(url, key)
}

function detectInstrumentType(symbol: string): 'forex' | 'crypto' | 'commodities' | 'indices' | 'stocks' {
  const s = symbol.toUpperCase()
  if (s.includes('BTC') || s.includes('ETH') || s.includes('SOL') || s.includes('USDT') || s.includes('XRP')) return 'crypto'
  if (s.includes('XAU') || s.includes('GOLD') || s.includes('XAG') || s.includes('OIL') || s.includes('WTI') || s.includes('BRENT')) return 'commodities'
  if (s.includes('US30') || s.includes('NAS') || s.includes('SPX') || s.includes('GER') || s.includes('DAX') || s.includes('USTEC') || s.includes('DJIA')) return 'indices'
  return 'forex'
}

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    service: 'tradermind-mql5-webhook',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  })
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null)
    if (!body) {
      return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 })
    }

    // Read sync token from header or body
    const syncKey = request.headers.get('x-sync-key') || body.sync_key
    if (!syncKey || typeof syncKey !== 'string') {
      return NextResponse.json({ error: 'Missing sync_key. Provide it in x-sync-key header or sync_key body property.' }, { status: 401 })
    }

    const admin = getAdminClient()

    // 1. Verify user exists
    let user: { id: string; email?: string; full_name?: string } | null = null

    // Check if syncKey is a valid UUID
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(syncKey)
    if (isUUID) {
      const { data: u } = await admin
        .from('users')
        .select('id, email, full_name')
        .eq('id', syncKey)
        .maybeSingle()
      user = u
    }

    // Try finding by email
    if (!user && syncKey.includes('@')) {
      const { data: u } = await admin
        .from('users')
        .select('id, email, full_name')
        .eq('email', syncKey)
        .maybeSingle()
      user = u
    }

    // Fallback: If demo mode or test sync key
    if (!user && (syncKey === 'demo' || syncKey === 'portfolio-demo' || process.env.NEXT_PUBLIC_DEMO_MODE === 'true')) {
      const { data: firstUser } = await admin
        .from('users')
        .select('id, email, full_name')
        .order('created_at', { ascending: true })
        .limit(1)
        .maybeSingle()
      user = firstUser || { id: '00000000-0000-0000-0000-000000000001', email: 'demo@tradermind.io', full_name: 'Alex Kim' }
    }

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized: Invalid sync_key' }, { status: 401 })
    }

    const platform = (body.platform === 'mt4' ? 'mt4' : 'mt5') as 'mt4' | 'mt5'
    const accountLogin = String(body.account_login || body.login || 'Unknown')
    const serverName = String(body.server || 'MetaTrader 5 Server')
    const balance = typeof body.balance === 'number' ? body.balance : parseFloat(body.balance || '0')
    const equity = typeof body.equity === 'number' ? body.equity : parseFloat(body.equity || '0')
    const currency = String(body.currency || 'USD').toUpperCase()

    // 2. Find or create broker_connection
    const { data: existingConn } = await admin
      .from('broker_connections')
      .select('id')
      .eq('user_id', user.id)
      .eq('platform', platform)
      .eq('account_id', accountLogin)
      .maybeSingle()

    let connectionId = existingConn?.id

    if (!connectionId) {
      const { data: newConn, error: connErr } = await admin
        .from('broker_connections')
        .insert({
          user_id: user.id,
          platform,
          account_id: accountLogin,
          account_name: `${platform.toUpperCase()} (${accountLogin})`,
          server: serverName,
          balance,
          equity,
          currency,
          is_active: true,
          last_sync_at: new Date().toISOString(),
        })
        .select('id')
        .single()

      if (connErr) {
        console.error('Failed to create broker connection:', connErr)
      } else {
        connectionId = newConn?.id
      }
    } else {
      await admin
        .from('broker_connections')
        .update({
          balance,
          equity,
          currency,
          last_sync_at: new Date().toISOString(),
          is_active: true,
        })
        .eq('id', connectionId)
    }

    // 3. Process and normalize trades
    const incomingTrades = Array.isArray(body.trades) ? body.trades : []
    const normalizedTrades: Partial<Trade>[] = []

    for (const t of incomingTrades) {
      if (!t.ticket || !t.symbol) continue

      const entryPrice = parseFloat(t.entry_price || t.open_price || '0')
      const exitPrice = t.exit_price ? parseFloat(t.exit_price) : undefined
      const lotSize = parseFloat(t.lot_size || t.volume || '0.01')
      const profit = parseFloat(t.profit || '0')
      const commission = parseFloat(t.commission || '0')
      const swap = parseFloat(t.swap || '0')
      const netPnl = profit + commission + swap

      const typeStr = String(t.type || '').toUpperCase()
      const direction: 'long' | 'short' = (typeStr === 'BUY' || typeStr === '0' || typeStr === 'DEAL_TYPE_BUY') ? 'long' : 'short'

      const openDate = t.open_time ? new Date(t.open_time) : new Date()
      const closeDate = t.close_time ? new Date(t.close_time) : openDate
      const durationMinutes = Math.max(1, Math.round((closeDate.getTime() - openDate.getTime()) / 60000))

      normalizedTrades.push({
        user_id: user.id,
        broker_connection_id: connectionId,
        external_trade_id: `mt5-${t.ticket}`,
        symbol: String(t.symbol).toUpperCase(),
        instrument_type: detectInstrumentType(String(t.symbol)),
        direction,
        status: 'closed',
        entry_price: entryPrice,
        exit_price: exitPrice,
        stop_loss: t.stop_loss ? parseFloat(t.stop_loss) : undefined,
        take_profit: t.take_profit ? parseFloat(t.take_profit) : undefined,
        lot_size: lotSize,
        gross_pnl: profit,
        net_pnl: netPnl,
        commission,
        swap,
        opened_at: openDate.toISOString(),
        closed_at: closeDate.toISOString(),
        session: detectTradingSession(openDate),
        duration_minutes: durationMinutes,
      })
    }

    // 4. Batch upsert trades (idempotent deduplication by user_id, external_trade_id)
    if (normalizedTrades.length > 0) {
      const { error: upsertErr } = await admin
        .from('trades')
        .upsert(normalizedTrades, { onConflict: 'user_id,external_trade_id' })

      if (upsertErr) {
        console.error('Trade upsert error:', upsertErr)
        return NextResponse.json({ error: 'Failed to save trades', details: upsertErr.message }, { status: 500 })
      }
    }

    // 5. Update user broker_connected flag
    await admin
      .from('users')
      .update({ broker_connected: true })
      .eq('id', user.id)

    return NextResponse.json({
      success: true,
      synced: normalizedTrades.length,
      account: accountLogin,
      server: serverName,
      timestamp: new Date().toISOString(),
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown server error'
    console.error('Webhook error:', err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
