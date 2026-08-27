'use client'

import { useState, useEffect } from 'react'
import { Search, Filter, Plus, ArrowUpRight, ArrowDownRight, TrendingUp } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import type { Trade, PerformanceAnalytics } from '@/types'

const c = {
  green: '#3ecf8e', red: '#ff5f5f', amber: '#f5a623',
  accent: 'hsl(226,100%,71%)', purple: '#b48eff',
  surface: 'hsl(224,18%,8%)', surface2: 'hsl(224,16%,11%)', surface3: 'hsl(224,14%,14%)',
  border: 'hsl(220,12%,14%)', text: 'hsl(220,15%,92%)',
  text2: 'hsl(220,10%,55%)', text3: 'hsl(220,10%,35%)', mono: "'DM Mono', monospace",
}
const panel = { background: c.surface, border: `1px solid ${c.border}`, borderRadius: '10px', overflow: 'hidden' }

const DEMO_TRADES = [
  { id: 1, symbol: 'EURUSD', direction: 'Long', pnl: 312, rr: 2.4, risk: 1.2, emotion: 'Focused', alignment: 91, session: 'London', strategy: 'Breakout', opened: '2026-05-26 08:32', duration: '2h 14m', status: 'closed' },
  { id: 2, symbol: 'GBPJPY', direction: 'Short', pnl: -180, rr: -1.0, risk: 2.8, emotion: 'Revenge', alignment: 31, session: 'London', strategy: 'Impulse', opened: '2026-05-26 09:15', duration: '0h 45m', status: 'closed' },
  { id: 3, symbol: 'XAUUSD', direction: 'Long', pnl: 540, rr: 3.1, risk: 1.5, emotion: 'Calm', alignment: 88, session: 'Overlap', strategy: 'Breakout', opened: '2026-05-25 12:44', duration: '3h 02m', status: 'closed' },
  { id: 4, symbol: 'BTCUSD', direction: 'Long', pnl: -95, rr: -0.6, risk: 1.0, emotion: 'FOMO', alignment: 54, session: 'New York', strategy: 'Range', opened: '2026-05-25 14:20', duration: '1h 30m', status: 'closed' },
  { id: 5, symbol: 'USDJPY', direction: 'Short', pnl: 228, rr: 1.9, risk: 1.1, emotion: 'Focused', alignment: 82, session: 'London', strategy: 'Breakout', opened: '2026-05-24 10:05', duration: '2h 45m', status: 'closed' },
  { id: 6, symbol: 'GBPUSD', direction: 'Long', pnl: -142, rr: -1.0, risk: 1.8, emotion: 'Overconfident', alignment: 48, session: 'New York', strategy: 'Trend', opened: '2026-05-24 14:10', duration: '1h 15m', status: 'closed' },
  { id: 7, symbol: 'EURUSD', direction: 'Short', pnl: 187, rr: 1.7, risk: 0.9, emotion: 'Calm', alignment: 85, session: 'London', strategy: 'Breakout', opened: '2026-05-23 09:30', duration: '3h 10m', status: 'closed' },
  { id: 8, symbol: 'ETHBTC', direction: 'Long', pnl: 430, rr: 2.8, risk: 1.3, emotion: 'Focused', alignment: 89, session: 'Asian', strategy: 'Range', opened: '2026-05-23 04:15', duration: '4h 30m', status: 'closed' },
]

const DEMO_PNL_BY_DAY = [
  { date: 'May 20', pnl: 145 }, { date: 'May 21', pnl: -87 }, { date: 'May 22', pnl: 310 },
  { date: 'May 23', pnl: 617 }, { date: 'May 24', pnl: 86 }, { date: 'May 25', pnl: 445 }, { date: 'May 26', pnl: 132 },
]

const FILTERS = ['All', 'Wins', 'Losses', 'Flagged', 'London', 'New York'] as const

function mapTrade(t: Trade){
  const pnl = Math.round(t.net_pnl ?? 0)
  const rr = t.reward_risk_ratio ?? 0
  const risk = t.risk_pct ?? 0
  const dir = t.direction === 'long' ? 'Long' : 'Short'
  // emotion not stored on trade — derive from alignment/risk heuristic for display, fallback to —
  const emotion = (t.alignment_score ?? 50) < 40 ? 'Revenge' : (t.alignment_score ?? 50) > 75 ? 'Focused' : '—'
  const sess = t.session === 'new_york' ? 'New York' : t.session.charAt(0).toUpperCase()+t.session.slice(1)
  const opened = new Date(t.opened_at).toLocaleString('en-US',{month:'short',day:'numeric',hour:'2-digit',minute:'2-digit',hour12:false})
  const duration = t.duration_minutes ? `${Math.floor(t.duration_minutes/60)}h ${t.duration_minutes%60}m` : '—'
  return { id: t.id, symbol: t.symbol, direction: dir, pnl, rr, risk, emotion, alignment: t.alignment_score ?? 50, session: sess, strategy: t.strategy_name ?? 'Untagged', opened, duration, status: t.status }
}

export default function TradesPage() {
  const [filter, setFilter] = useState<typeof FILTERS[number]>('All')
  const [search, setSearch] = useState('')
  const [showEval, setShowEval] = useState(false)
  const [trades, setTrades] = useState<ReturnType<typeof mapTrade>[]>(DEMO_TRADES as any)
  const [pnlByDay, setPnlByDay] = useState(DEMO_PNL_BY_DAY)
  const [strategyStats, setStrategyStats] = useState<{name:string,wr:number,trades:number,pnl:number}[]>([
    { name: 'Breakout', wr: 71, trades: 14, pnl: 1247 },
    { name: 'Range', wr: 55, trades: 8, pnl: 335 },
    { name: 'Trend', wr: 48, trades: 6, pnl: -142 },
  ])
  const [loading, setLoading] = useState(true)
  const [evalForm, setEvalForm] = useState({ symbol: 'EURUSD', direction: 'long', risk_pct: '1.0', session: 'london', strategy_name: 'Breakout' })
  const [evalResult, setEvalResult] = useState<null | { alignment_score:number; verdict:string; warnings:any[] }>(null)
  const [evalLoading, setEvalLoading] = useState(false)
  const [showLog, setShowLog] = useState(false)
  const [logSaving, setLogSaving] = useState(false)

  useEffect(() => {
    let cancelled=false
    async function load(){
      try{
        const [tradesRes, analyticsRes] = await Promise.all([
          fetch('/api/trades?limit=50&status=closed', {cache:'no-store'}).then(async r=> r.ok ? r.json() : null).catch(()=>null),
          fetch('/api/behavioral/analytics?range=1M', {cache:'no-store'}).then(async r=> r.ok ? r.json() : null).catch(()=>null),
        ])
        if(cancelled) return
        if(tradesRes?.data?.length){
          const mapped = (tradesRes.data as Trade[]).map(mapTrade)
          setTrades(mapped)
          // build pnlByDay from equity_curve if available
          if(analyticsRes?.equity_curve?.length){
            setPnlByDay(analyticsRes.equity_curve.slice(-7).map((p:any)=>({date: p.date.slice(5), pnl: p.daily_pnl})))
          }
        }
        if(analyticsRes?.analytics){
          const a = analyticsRes.analytics as PerformanceAnalytics
          if(a.strategy_performance?.length){
            setStrategyStats(a.strategy_performance.slice(0,3).map(s=>({name:s.strategy_name, wr: s.win_rate, trades: s.total_trades, pnl: Math.round(s.total_pnl)})))
          }
        }
      } catch(e){ console.warn('trades fetch fallback',e) }
      finally{ if(!cancelled) setLoading(false) }
    }
    load()
    return ()=>{cancelled=true}
  }, [])

  const doEvaluate = async ()=>{
    setEvalLoading(true)
    setEvalResult(null)
    try{
      const r = await fetch('/api/behavioral/evaluate', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({
        symbol: evalForm.symbol,
        direction: evalForm.direction,
        risk_pct: parseFloat(evalForm.risk_pct) || 0,
        session: evalForm.session,
        strategy_name: evalForm.strategy_name,
        user_id: 'me',
      })})
      const j = await r.json()
      if(j.data) setEvalResult(j.data)
      else setEvalResult({alignment_score:0,verdict: j.error || 'Failed', warnings:[]})
    } catch(e){ setEvalResult({alignment_score:0,verdict:String(e),warnings:[]}) }
    finally{ setEvalLoading(false) }
  }

  const doLogTrade = async ()=>{
    setLogSaving(true)
    try{
      const body = {
        symbol: evalForm.symbol || 'EURUSD',
        direction: evalForm.direction,
        risk_pct: parseFloat(evalForm.risk_pct)||1,
        session: evalForm.session,
        strategy_name: evalForm.strategy_name,
        instrument_type: 'forex',
        status: 'closed',
        entry_price: 1.08,
        exit_price: 1.09,
        lot_size: 0.1,
        position_size_usd: 1000,
        net_pnl: Math.round((Math.random()*400-100)),
        gross_pnl: 0,
        opened_at: new Date().toISOString(),
        closed_at: new Date().toISOString(),
      }
      const r = await fetch('/api/trades',{method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(body)})
      const j = await r.json()
      if(r.ok && j.data){
        const mapped = mapTrade(j.data as Trade)
        setTrades(prev=>[mapped, ...prev].slice(0,50))
      } else alert(j.error || 'Failed to log')
    } finally{ setLogSaving(false); setShowLog(false) }
  }

  const filtered = trades.filter(t => {
    if (filter === 'Wins') return t.pnl > 0
    if (filter === 'Losses') return t.pnl < 0
    if (filter === 'Flagged') return t.alignment < 55
    if (filter === 'London') return t.session === 'London'
    if (filter === 'New York') return t.session === 'New York'
    return true
  }).filter(t => t.symbol.toLowerCase().includes(search.toLowerCase()))

  const totalPnl = filtered.reduce((s, t) => s + t.pnl, 0)
  const winRate = filtered.length > 0 ? Math.round((filtered.filter(t => t.pnl > 0).length / filtered.length) * 100) : 0
  const avgAlignment = filtered.length > 0 ? Math.round(filtered.reduce((s, t) => s + t.alignment, 0) / filtered.length) : 0

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '1200px' }}>
      {/* Header — live */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, letterSpacing: '-0.6px' }}>Trade History</h1>
          <p style={{ fontSize: '12px', color: c.text3, marginTop: '3px', fontFamily: c.mono }}>
            {loading ? 'Loading…' : `${trades.length} trades · ${filtered.length} filtered · ${search ? `search "${search}"` : 'May 2026'}`}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={() => setShowEval(!showEval)} style={{
            display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px',
            borderRadius: '8px', background: 'rgba(108,142,255,0.1)', border: `1px solid rgba(108,142,255,0.3)`,
            color: c.accent, fontSize: '12px', fontWeight: 600, cursor: 'pointer',
          }}>
            <TrendingUp size={13} /> Evaluate Trade
          </button>
          <button onClick={()=> setShowLog(!showLog)} style={{
            display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px',
            borderRadius: '8px', background: c.accent, border: 'none',
            color: '#fff', fontSize: '12px', fontWeight: 600, cursor: 'pointer', opacity: logSaving?0.6:1,
          }}>
            <Plus size={13} /> {logSaving ? 'Saving…' : 'Log Trade'}
          </button>
        </div>
      </div>

      {/* Stats Strip — live */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '10px' }}>
        {[
          { label: 'Total Trades', value: trades.length, mono: true },
          { label: 'Win Rate', value: `${winRate}%`, color: c.green },
          { label: 'Net P&L', value: `${totalPnl >= 0 ? '+' : ''}$${Math.abs(totalPnl).toLocaleString()}`, color: totalPnl >= 0 ? c.green : c.red },
          { label: 'Avg R:R', value: `${(filtered.length? (filtered.reduce((s,t)=>s+t.rr,0)/filtered.length).toFixed(1) : '0.0')}R`, color: c.amber },
          { label: 'Avg Alignment', value: `${avgAlignment}/100`, color: c.accent },
        ].map(s => (
          <div key={s.label} style={{ ...panel, padding: '12px 14px' }}>
            <div style={{ fontSize: '10px', color: c.text3, fontFamily: c.mono, textTransform: 'uppercase', letterSpacing: '0.8px' }}>{s.label}</div>
            <div style={{ fontSize: '20px', fontWeight: 800, color: s.color ?? c.text, letterSpacing: '-0.5px', marginTop: '4px' }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Log Trade quick form */}
      {showLog && (
        <div style={{ background: c.surface, border:`1px solid ${c.border}`, borderRadius:'10px', padding:'16px' }}>
          <div style={{fontSize:'13px',fontWeight:600,marginBottom:'10px'}}>Log Trade — demo will create a synthetic closed trade</div>
          <div style={{fontSize:'11px',color:c.text2,marginBottom:'10px',fontFamily:c.mono}}>Uses current Evaluate form values + random P&L. Writes to Supabase via POST /api/trades.</div>
          <button onClick={doLogTrade} disabled={logSaving} style={{padding:'8px 14px',borderRadius:'7px',background:c.accent,border:'none',color:'#fff',fontSize:'12px',fontWeight:600,cursor:'pointer'}}>{logSaving?'Saving…':'Confirm Log'}</button>
        </div>
      )}

      {/* Trade Eval Panel — live wired to /api/behavioral/evaluate */}
      {showEval && (
        <div style={{
          background: 'linear-gradient(135deg, rgba(108,142,255,0.06), rgba(180,142,255,0.04))',
          border: `1px solid rgba(108,142,255,0.2)`, borderRadius: '10px', padding: '20px',
        }}>
          <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '14px' }}>Pre-Trade Evaluation — live engine</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '10px', marginBottom: '14px' }}>
            <div>
              <div style={{ fontSize: '10px', color: c.text3, fontFamily: c.mono, marginBottom: '5px' }}>Symbol</div>
              <input value={evalForm.symbol} onChange={e=>setEvalForm({...evalForm,symbol:e.target.value})} placeholder='EURUSD' style={{width:'100%', background:c.surface3, border:`1px solid ${c.border}`, borderRadius:'7px', padding:'8px 10px', fontSize:'12px', color:c.text, fontFamily:c.mono, outline:'none'}} />
            </div>
            <div>
              <div style={{ fontSize: '10px', color: c.text3, fontFamily: c.mono, marginBottom: '5px' }}>Direction</div>
              <select value={evalForm.direction} onChange={e=>setEvalForm({...evalForm,direction:e.target.value})} style={{width:'100%', background:c.surface3, border:`1px solid ${c.border}`, borderRadius:'7px', padding:'8px 10px', fontSize:'12px', color:c.text, fontFamily:c.mono}}>
                <option value='long'>Long</option><option value='short'>Short</option>
              </select>
            </div>
            <div>
              <div style={{ fontSize: '10px', color: c.text3, fontFamily: c.mono, marginBottom: '5px' }}>Risk %</div>
              <input value={evalForm.risk_pct} onChange={e=>setEvalForm({...evalForm,risk_pct:e.target.value})} placeholder='1.0' style={{width:'100%', background:c.surface3, border:`1px solid ${c.border}`, borderRadius:'7px', padding:'8px 10px', fontSize:'12px', color:c.text, fontFamily:c.mono, outline:'none'}} />
            </div>
            <div>
              <div style={{ fontSize: '10px', color: c.text3, fontFamily: c.mono, marginBottom: '5px' }}>Session</div>
              <select value={evalForm.session} onChange={e=>setEvalForm({...evalForm,session:e.target.value})} style={{width:'100%', background:c.surface3, border:`1px solid ${c.border}`, borderRadius:'7px', padding:'8px 10px', fontSize:'12px', color:c.text, fontFamily:c.mono}}>
                <option value='london'>London</option><option value='overlap'>Overlap</option><option value='new_york'>New York</option><option value='asian'>Asian</option>
              </select>
            </div>
            <div>
              <div style={{ fontSize: '10px', color: c.text3, fontFamily: c.mono, marginBottom: '5px' }}>Strategy</div>
              <input value={evalForm.strategy_name} onChange={e=>setEvalForm({...evalForm,strategy_name:e.target.value})} placeholder='Breakout' style={{width:'100%', background:c.surface3, border:`1px solid ${c.border}`, borderRadius:'7px', padding:'8px 10px', fontSize:'12px', color:c.text, fontFamily:c.mono, outline:'none'}} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <button onClick={doEvaluate} disabled={evalLoading} style={{ padding: '8px 16px', borderRadius: '8px', background: c.accent, border: 'none', color: '#fff', fontSize: '12px', fontWeight: 600, cursor: 'pointer', opacity: evalLoading?0.6:1 }}>
              {evalLoading ? 'Evaluating…' : 'Evaluate'}
            </button>
            <div style={{
              flex: 1, padding: '10px 14px', borderRadius: '8px',
              background: evalResult ? ((evalResult.alignment_score ?? 0)>=70?'rgba(62,207,142,0.08)':'rgba(245,166,35,0.08)') : 'rgba(62,207,142,0.08)',
              border: `1px solid ${((evalResult?.alignment_score ?? 0)>=70)?'rgba(62,207,142,0.2)':'rgba(245,166,35,0.2)'}`,
              fontSize: '12px', color: c.text2, lineHeight: 1.5,
            }}>
              {evalResult ? (
                <><strong style={{ color: c.text }}>Alignment: {evalResult.alignment_score}/100</strong> — {evalResult.verdict} {evalResult.warnings?.length? `· ${evalResult.warnings.length} warning(s)` : ''}</>
              ) : 'Fill the form and click Evaluate — uses your real behavioral history.'}
            </div>
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: '14px' }}>
        {/* Trades Table */}
        <div style={panel}>
          {/* Controls */}
          <div style={{ padding: '12px 16px', borderBottom: `1px solid ${c.border}`, display: 'flex', gap: '10px', alignItems: 'center' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <Search size={13} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: c.text3 }} />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search symbol..."
                style={{ width: '100%', paddingLeft: '30px', background: c.surface2, border: `1px solid ${c.border}`, borderRadius: '7px', padding: '7px 10px 7px 30px', fontSize: '12px', color: c.text, outline: 'none', fontFamily: c.mono }}
              />
            </div>
            <div style={{ display: 'flex', gap: '4px' }}>
              {FILTERS.map(f => (
                <button key={f} onClick={() => setFilter(f)} style={{
                  padding: '5px 10px', borderRadius: '6px', fontSize: '11px', fontFamily: c.mono,
                  border: `1px solid ${filter === f ? `rgba(108,142,255,0.3)` : c.border}`,
                  background: filter === f ? 'rgba(108,142,255,0.1)' : 'transparent',
                  color: filter === f ? c.accent : c.text3, cursor: 'pointer',
                }}>{f}</button>
              ))}
            </div>
          </div>

          {/* Table */}
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['Pair', 'P&L', 'R:R', 'Risk %', 'Emotion', 'Alignment', 'Session', 'Strategy', 'Duration'].map(h => (
                  <th key={h} style={{ padding: '8px 12px', fontSize: '10px', fontWeight: 600, color: c.text3, textTransform: 'uppercase', letterSpacing: '0.8px', textAlign: 'left', fontFamily: c.mono, borderBottom: `1px solid ${c.border}` }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(trade => (
                <tr key={trade.id} style={{ cursor: 'pointer' }}
                  onMouseEnter={e => (e.currentTarget.style.background = c.surface2)}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <td style={{ padding: '10px 12px', borderTop: `1px solid ${c.border}40` }}>
                    <div style={{ fontWeight: 600, fontSize: '13px', fontFamily: c.mono }}>{trade.symbol}</div>
                    <div style={{ fontSize: '10px', color: trade.direction === 'Long' ? c.green : c.red, fontFamily: c.mono }}>{trade.direction}</div>
                  </td>
                  <td style={{ padding: '10px 12px', borderTop: `1px solid ${c.border}40`, color: trade.pnl >= 0 ? c.green : c.red, fontFamily: c.mono, fontWeight: 600 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                      {trade.pnl >= 0 ? <ArrowUpRight size={11} /> : <ArrowDownRight size={11} />}
                      {trade.pnl >= 0 ? '+' : ''}${Math.abs(trade.pnl)}
                    </div>
                  </td>
                  <td style={{ padding: '10px 12px', borderTop: `1px solid ${c.border}40`, color: c.text2, fontFamily: c.mono, fontSize: '12px' }}>{trade.rr}R</td>
                  <td style={{ padding: '10px 12px', borderTop: `1px solid ${c.border}40`, color: trade.risk > 2 ? c.amber : c.text2, fontFamily: c.mono, fontSize: '12px' }}>{trade.risk}%</td>
                  <td style={{ padding: '10px 12px', borderTop: `1px solid ${c.border}40` }}>
                    <span style={{ fontSize: '11px', color: trade.emotion === 'Focused' || trade.emotion === 'Calm' ? c.green : trade.emotion === 'Revenge' ? c.red : c.amber }}>{trade.emotion}</span>
                  </td>
                  <td style={{ padding: '10px 12px', borderTop: `1px solid ${c.border}40` }}>
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontFamily: c.mono, fontWeight: 500,
                      background: trade.alignment >= 75 ? 'rgba(62,207,142,0.1)' : trade.alignment >= 50 ? 'rgba(245,166,35,0.1)' : 'rgba(255,95,95,0.1)',
                      color: trade.alignment >= 75 ? c.green : trade.alignment >= 50 ? c.amber : c.red,
                    }}>● {trade.alignment}</span>
                  </td>
                  <td style={{ padding: '10px 12px', borderTop: `1px solid ${c.border}40`, color: c.text3, fontFamily: c.mono, fontSize: '11px' }}>{trade.session}</td>
                  <td style={{ padding: '10px 12px', borderTop: `1px solid ${c.border}40`, color: c.text3, fontFamily: c.mono, fontSize: '11px' }}>{trade.strategy}</td>
                  <td style={{ padding: '10px 12px', borderTop: `1px solid ${c.border}40`, color: c.text3, fontFamily: c.mono, fontSize: '11px' }}>{trade.duration}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Right: Daily PnL chart */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={panel}>
            <div style={{ padding: '12px 16px', borderBottom: `1px solid ${c.border}`, fontSize: '13px', fontWeight: 600 }}>Daily P&L</div>
            <div style={{ padding: '12px 8px 4px' }}>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={pnlByDay} margin={{ top: 0, right: 0, left: -15, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 9, fill: c.text3, fontFamily: c.mono }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 9, fill: c.text3, fontFamily: c.mono }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ background: c.surface2, border: `1px solid ${c.border}`, borderRadius: '8px', fontSize: '11px', fontFamily: c.mono }}
                    formatter={(v: any) => [`${v >= 0 ? '+' : ''}$${v}`, 'P&L']}
                  />
                  <Bar dataKey="pnl" radius={[4, 4, 0, 0]} fill={c.accent}
                    label={false}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Strategy breakdown — live */}
          <div style={panel}>
            <div style={{ padding: '12px 16px', borderBottom: `1px solid ${c.border}`, fontSize: '13px', fontWeight: 600 }}>Strategy Performance</div>
            <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {strategyStats.map(s => (
                <div key={s.name} style={{ padding: '10px 12px', background: c.surface2, borderRadius: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 600 }}>{s.name}</span>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: s.wr >= 60 ? c.green : s.wr >= 50 ? c.amber : c.red, fontFamily: c.mono }}>{s.wr.toFixed(1)}%</span>
                  </div>
                  <div style={{ height: '3px', background: c.surface3, borderRadius: '2px' }}>
                    <div style={{ height: '3px', borderRadius: '2px', background: s.wr >= 60 ? c.green : s.wr >= 50 ? c.amber : c.red, width: `${Math.min(100,s.wr)}%` }} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '5px', fontSize: '10px', color: c.text3, fontFamily: c.mono }}>
                    <span>{s.trades} trades</span>
                    <span style={{ color: s.pnl >= 0 ? c.green : c.red }}>{s.pnl >= 0 ? '+' : ''}${s.pnl}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
