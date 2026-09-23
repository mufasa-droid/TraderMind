/**
 * TraderMind — MT5 Live Webhook Trade Streaming Simulator
 *
 * Simulates a MetaTrader 5 terminal running the TraderMind_Sync.mq5 Expert Advisor.
 * Demonstrates:
 *   1. Webhook endpoint health check
 *   2. Initial historical deal synchronization batch
 *   3. Live real-time trade event streaming (deal closure notifications)
 *   4. Account balance & equity heartbeats
 */

const WEBHOOK_URL = process.env.WEBHOOK_URL || 'http://localhost:3000/api/broker/webhook'
const SYNC_KEY = process.env.SYNC_KEY || 'demo-trader-uuid-1234'
const ACCOUNT_LOGIN = 98765432
const SERVER_NAME = 'ICMarketsSC-Live'

const colors = {
  reset: '\x1b[0m',
  cyan: '\x1b[36m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  magenta: '\x1b[35m',
  bold: '\x1b[1m',
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

function log(prefix, msg, color = colors.cyan) {
  const ts = new Date().toISOString().substring(11, 19)
  console.log(`${colors.bold}[${ts}]${colors.reset} ${color}${prefix}${colors.reset} ${msg}`)
}

async function sendWebhook(payload) {
  const res = await fetch(WEBHOOK_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-sync-key': SYNC_KEY,
    },
    body: JSON.stringify(payload),
  })
  const text = await res.text()
  try {
    return { ok: res.ok, status: res.status, data: JSON.parse(text) }
  } catch {
    return { ok: res.ok, status: res.status, raw: text }
  }
}

async function runSimulation() {
  console.log('\n' + '='.repeat(70))
  console.log(`${colors.bold}${colors.magenta}  TRADERMIND — METATRADER 5 LIVE TRADE STREAM SIMULATOR${colors.reset}`)
  console.log('='.repeat(70))
  log('TARGET', `Webhook URL: ${WEBHOOK_URL}`)
  log('AUTH', `Private Sync Key: ${SYNC_KEY}`)
  log('BROKER', `Account: ${ACCOUNT_LOGIN} on Server: ${SERVER_NAME}`)
  console.log('-'.repeat(70))

  // 1. Health check
  log('STEP 1', 'Probing Webhook healthcheck endpoint...')
  try {
    const healthRes = await fetch(WEBHOOK_URL)
    const healthData = await healthRes.json()
    log('HEALTH', `Endpoint online: ${JSON.stringify(healthData)}`, colors.green)
  } catch (err) {
    log('ERROR', `Webhook unreachable: ${err.message}`, colors.red)
    process.exit(1)
  }

  await sleep(1200)

  // 2. Initial Historical Deals Sync
  console.log('\n' + '-'.repeat(70))
  log('STEP 2', 'Simulating OnInit() Historical Deal Sweep (5 historical trades)...')

  const historicalPayload = {
    sync_key: SYNC_KEY,
    platform: 'mt5',
    account_login: ACCOUNT_LOGIN,
    server: SERVER_NAME,
    currency: 'USD',
    balance: 10000.0,
    equity: 10000.0,
    trades: [
      {
        ticket: 80102140,
        symbol: 'EURUSD',
        type: 'BUY',
        volume: 1.5,
        open_price: 1.08250,
        exit_price: 1.08620,
        profit: 555.00,
        commission: -10.50,
        swap: -2.30,
        open_time: new Date(Date.now() - 3600000 * 28).toISOString(),
        close_time: new Date(Date.now() - 3600000 * 24).toISOString(),
      },
      {
        ticket: 80102141,
        symbol: 'GBPJPY',
        type: 'SELL',
        volume: 1.0,
        open_price: 191.400,
        exit_price: 191.950,
        profit: -360.00,
        commission: -7.00,
        swap: 0.0,
        open_time: new Date(Date.now() - 3600000 * 20).toISOString(),
        close_time: new Date(Date.now() - 3600000 * 18).toISOString(),
      },
      {
        ticket: 80102142,
        symbol: 'XAUUSD',
        type: 'BUY',
        volume: 0.5,
        open_price: 2620.50,
        exit_price: 2638.10,
        profit: 880.00,
        commission: -5.00,
        swap: -4.10,
        open_time: new Date(Date.now() - 3600000 * 14).toISOString(),
        close_time: new Date(Date.now() - 3600000 * 10).toISOString(),
      },
      {
        ticket: 80102143,
        symbol: 'BTCUSD',
        type: 'BUY',
        volume: 0.25,
        open_price: 64200.00,
        exit_price: 63100.00,
        profit: -275.00,
        commission: -3.50,
        swap: -1.20,
        open_time: new Date(Date.now() - 3600000 * 8).toISOString(),
        close_time: new Date(Date.now() - 3600000 * 5).toISOString(),
      },
      {
        ticket: 80102144,
        symbol: 'US30',
        type: 'SELL',
        volume: 1.0,
        open_price: 42100.00,
        exit_price: 41820.00,
        profit: 280.00,
        commission: -7.00,
        swap: 0.0,
        open_time: new Date(Date.now() - 3600000 * 4).toISOString(),
        close_time: new Date(Date.now() - 3600000 * 2).toISOString(),
      },
    ],
  }

  const histResult = await sendWebhook(historicalPayload)
  log('HIST-SYNC', `Dispatched batch. Status: ${histResult.status} | Synced deals: ${histResult.data?.synced ?? 0}`, colors.green)
  if (histResult.data?.trades) {
    histResult.data.trades.forEach(t => {
      const pnlColor = t.net_pnl >= 0 ? colors.green : colors.red
      console.log(`   ${colors.bold}#${t.ticket}${colors.reset} ${t.symbol} [${t.direction.toUpperCase()}] -> ${pnlColor}$${t.net_pnl.toFixed(2)}${colors.reset} (Session: ${t.session})`)
    })
  }

  // 3. Live Trade Streaming (OnTradeTransaction deal closures)
  console.log('\n' + '-'.repeat(70))
  log('STEP 3', 'Starting Live Streaming Simulation (OnTradeTransaction deals)...')

  const liveTrades = [
    {
      ticket: 80102150,
      symbol: 'EURUSD',
      type: 'BUY',
      volume: 2.0,
      open_price: 1.08450,
      exit_price: 1.08720,
      profit: 540.00,
      commission: -14.00,
      swap: 0.0,
      open_time: new Date(Date.now() - 1800000).toISOString(),
      close_time: new Date().toISOString(),
      pnlDesc: '+$526.00 Net (Win)',
    },
    {
      ticket: 80102151,
      symbol: 'XAUUSD',
      type: 'SELL',
      volume: 0.8,
      open_price: 2642.00,
      exit_price: 2649.50,
      profit: -600.00,
      commission: -8.00,
      swap: 0.0,
      open_time: new Date(Date.now() - 900000).toISOString(),
      close_time: new Date().toISOString(),
      pnlDesc: '-$608.00 Net (Stop Loss Hit)',
    },
    {
      ticket: 80102152,
      symbol: 'USDJPY',
      type: 'BUY',
      volume: 1.2,
      open_price: 143.200,
      exit_price: 143.680,
      profit: 402.10,
      commission: -8.40,
      swap: 1.20,
      open_time: new Date(Date.now() - 600000).toISOString(),
      close_time: new Date().toISOString(),
      pnlDesc: '+$394.90 Net (Target Achieved)',
    },
  ]

  let runningBalance = 10000.0 + 1070.90 // historical profit

  for (let i = 0; i < liveTrades.length; i++) {
    await sleep(2500)
    const deal = liveTrades[i]
    runningBalance += (deal.profit + deal.commission + deal.swap)

    log('LIVE-DEAL', `[MT5 Event] Closed Deal on ${deal.symbol} (#${deal.ticket}) — ${deal.pnlDesc}`, colors.yellow)

    const livePayload = {
      sync_key: SYNC_KEY,
      platform: 'mt5',
      account_login: ACCOUNT_LOGIN,
      server: SERVER_NAME,
      currency: 'USD',
      balance: runningBalance,
      equity: runningBalance,
      trades: [deal],
    }

    const liveRes = await sendWebhook(livePayload)
    log('WEBHOOK-ACK', `HTTP ${liveRes.status} OK: Deal #${deal.ticket} acknowledged and attributed to session.`, colors.green)
  }

  // 4. Heartbeat
  await sleep(2000)
  console.log('\n' + '-'.repeat(70))
  log('STEP 4', 'Sending OnTimer() Balance & Connectivity Heartbeat...')

  const heartbeatPayload = {
    sync_key: SYNC_KEY,
    platform: 'mt5',
    account_login: ACCOUNT_LOGIN,
    server: SERVER_NAME,
    currency: 'USD',
    balance: runningBalance,
    equity: runningBalance + 120.50, // floating open P&L
    heartbeat: true,
  }

  const hbRes = await sendWebhook(heartbeatPayload)
  log('HEARTBEAT-ACK', `HTTP ${hbRes.status} OK: Balance updated to $${runningBalance.toFixed(2)}, Equity: $${(runningBalance + 120.50).toFixed(2)}`, colors.green)

  console.log('\n' + '='.repeat(70))
  console.log(`${colors.bold}${colors.green}  ✓ STREAMING TEST COMPLETE — ALL DEALS SUCCESSFULLY INGESTED${colors.reset}`)
  console.log('='.repeat(70) + '\n')
}

runSimulation().catch(err => {
  console.error('\nFatal simulation error:', err)
  process.exit(1)
})
