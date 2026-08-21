import { createClient } from '@/lib/supabase/server'
import { detectTradingSession } from '@/lib/utils'

export async function connectMetaAccount(userId: string, opts: {
  login: string
  password: string
  server: string
  platform: 'mt4' | 'mt5'
  brokerConnectionId: string
}) {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const MetaApi = require('metaapi.cloud-sdk').default
  const api = new MetaApi(process.env.META_API_TOKEN!)
  const account = await api.metatraderAccountApi.createAccount({
    name: `TraderMind-${opts.login}`,
    type: 'cloud',
    login: opts.login,
    password: opts.password,
    server: opts.server,
    platform: opts.platform,
    magic: 0,
  })
  await account.deploy()
  await account.waitConnected()
  const supabase = await createClient()
  await supabase
    .from('broker_connections')
    .update({ account_id: account.id, last_sync_at: new Date().toISOString() })
    .eq('id', opts.brokerConnectionId)
  return account.id
}

export async function syncMetaTrades(
  userId: string,
  brokerConnectionId: string,
  metaAccountId: string
) {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const MetaApi = require('metaapi.cloud-sdk').default
  const api = new MetaApi(process.env.META_API_TOKEN!)
  const supabase = await createClient()
  const account = await api.metatraderAccountApi.getAccount(metaAccountId)
  const startDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
  const historyApi = account.getHistoricalTradeApi()
  const deals = await historyApi.getHistoricalDeals(startDate, new Date())

  const trades = deals
    .filter((d: any) => ['DEAL_TYPE_BUY', 'DEAL_TYPE_SELL'].includes(d.type))
    .map((deal: any) => ({
      user_id: userId,
      broker_connection_id: brokerConnectionId,
      external_trade_id: deal.id,
      symbol: deal.symbol,
      direction: deal.type === 'DEAL_TYPE_BUY' ? 'long' : 'short',
      status: 'closed' as const,
      entry_price: deal.price,
      lot_size: deal.volume,
      net_pnl: deal.profit,
      gross_pnl: deal.profit,
      commission: deal.commission ?? 0,
      swap: deal.swap ?? 0,
      opened_at: deal.time.toISOString(),
      session: detectTradingSession(deal.time),
      instrument_type: 'forex' as const,
    }))

  if (trades.length > 0) {
    await supabase
      .from('trades')
      .upsert(trades, { onConflict: 'user_id,external_trade_id' })
  }

  await supabase
    .from('broker_connections')
    .update({ last_sync_at: new Date().toISOString() })
    .eq('id', brokerConnectionId)

  return trades.length
}

export async function getAccountInfo(metaAccountId: string) {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const MetaApi = require('metaapi.cloud-sdk').default
  const api = new MetaApi(process.env.META_API_TOKEN!)
  const account = await api.metatraderAccountApi.getAccount(metaAccountId)
  const conn = account.getRPCConnection()
  await conn.connect()
  await conn.waitSynchronized()
  const info = await conn.getAccountInformation()
  return { balance: info.balance, equity: info.equity, currency: info.currency }
}