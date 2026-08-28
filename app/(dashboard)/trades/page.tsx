'use client'

import { useState, useEffect } from 'react'
import { Search, Filter, Plus, ArrowUpRight, ArrowDownRight, TrendingUp, X, Edit3, Trash2 } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import type { Trade, PerformanceAnalytics } from '@/types'
import { createClient } from '@/lib/supabase/client'

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
  const [logError, setLogError] = useState<string | null>(null)
  const [logForm, setLogForm] = useState({
    symbol: 'EURUSD',
    direction: 'long' as 'long'|'short',
    instrument_type: 'forex' as 'forex'|'crypto'|'commodities'|'indices'|'stocks',
    entry_price: '1.0850',
    exit_price: '1.0900',
    lot_size: '0.10',
    risk_pct: '1.0',
    stop_loss: '',
    take_profit: '',
    session: 'london' as 'london'|'overlap'|'new_york'|'asian',
    strategy_name: 'Breakout',
    opened_at: new Date().toISOString().slice(0,16),
    closed_at: new Date().toISOString().slice(0,16),
    status: 'closed' as 'open'|'closed'|'pending',
  })
  const [rawTrades, setRawTrades] = useState<Trade[]>([])
  const [selected, setSelected] = useState<Trade | null>(null)
  const [drawerFlags, setDrawerFlags] = useState<any[]>([])
  const [drawerLogs, setDrawerLogs] = useState<any[]>([])
  const [editing, setEditing] = useState(false)
  const [editForm, setEditForm] = useState<Record<string,string>>({})
  const [deleting, setDeleting] = useState(false)
  const [drawerSaving, setDrawerSaving] = useState(false)

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
          const raws = tradesRes.data as Trade[]
          setRawTrades(raws)
          const mapped = raws.map(mapTrade)
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

  // Drawer: fetch flags & logs for selected trade
  useEffect(()=>{
    if(!selected){ setDrawerFlags([]); setDrawerLogs([]); setEditing(false); return }
    let cancelled=false
    const supabase = createClient()
    // only fetch if looks like uuid (live), else keep empty for demo
    const isLive = selected.id.includes('-') && selected.id.length>10
    if(!isLive) return
    Promise.all([
      supabase.from('behavioral_flags').select('*').eq('trade_id', selected.id).order('detected_at',{ascending:false}).limit(5).then(r=> r.data ?? []),
      supabase.from('behavioral_logs').select('*').eq('trade_id', selected.id).order('logged_at',{ascending:false}).limit(5).then(r=> r.data ?? []),
    ]).then(([flags, logs])=>{
      if(!cancelled){ setDrawerFlags(flags as any[]); setDrawerLogs(logs as any[]) }
    }).catch(()=>{})
    // prep edit form
    setEditForm({
      symbol: selected.symbol,
      entry_price: String(selected.entry_price ?? ''),
      exit_price: selected.exit_price ? String(selected.exit_price) : '',
      lot_size: String(selected.lot_size ?? ''),
      risk_pct: String(selected.risk_pct ?? ''),
      stop_loss: selected.stop_loss ? String(selected.stop_loss) : '',
      take_profit: selected.take_profit ? String(selected.take_profit) : '',
      strategy_name: selected.strategy_name ?? '',
      session: selected.session,
    })
    return ()=>{cancelled=true}
  }, [selected])

  const handleDelete = async ()=>{
    if(!selected) return
    if(!deleting){ setDeleting(true); return } // first click arms, second confirms? We'll use confirm dialog
    const isDemo = !selected.id.includes('-')
    if(isDemo){
      setTrades(prev=> prev.filter(t=> t.id!==selected.id))
      setSelected(null); setDeleting(false)
      return
    }
    setDrawerSaving(true)
    try{
      const r = await fetch(`/api/trades?id=${selected.id}`, { method:'DELETE' })
      const j = await r.json().catch(()=> ({}))
      if(!r.ok) throw new Error(j.error || 'Delete failed')
      setTrades(prev=> prev.filter(t=> String(t.id)!==String(selected.id)))
      setRawTrades(prev=> prev.filter(t=> t.id!==selected.id))
      setSelected(null)
    } catch(e){ alert(e instanceof Error ? e.message : String(e)) }
    finally{ setDrawerSaving(false); setDeleting(false) }
  }

  const handleSaveEdit = async ()=>{
    if(!selected) return
    setDrawerSaving(true)
    try{
      const payload: any = {
        id: selected.id,
        symbol: editForm.symbol?.toUpperCase().trim(),
        entry_price: editForm.entry_price ? parseFloat(editForm.entry_price) : undefined,
        exit_price: editForm.exit_price ? parseFloat(editForm.exit_price) : undefined,
        lot_size: editForm.lot_size ? parseFloat(editForm.lot_size) : undefined,
        risk_pct: editForm.risk_pct ? parseFloat(editForm.risk_pct) : undefined,
        stop_loss: editForm.stop_loss ? parseFloat(editForm.stop_loss) : null,
        take_profit: editForm.take_profit ? parseFloat(editForm.take_profit) : null,
        strategy_name: editForm.strategy_name || null,
        session: editForm.session,
      }
      // remove undefined
      Object.keys(payload).forEach(k=> payload[k]===undefined && delete payload[k])
      if(!payload.symbol) throw new Error('Symbol required')
      const isDemo = !selected.id.includes('-')
      if(isDemo){
        // local update only
        setTrades(prev=> prev.map(t=> String(t.id)===String(selected.id) ? { ...t, symbol: payload.symbol, rr: t.rr, risk: payload.risk_pct ?? t.risk, session: payload.session ?? t.session, strategy: payload.strategy_name ?? t.strategy, alignment: t.alignment } : t))
        setSelected(null); setEditing(false)
        return
      }
      const r = await fetch('/api/trades', { method:'PATCH', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload) })
      const j = await r.json()
      if(!r.ok) throw new Error(j.error || 'Update failed')
      const updated = j.data as Trade
      const mapped = mapTrade(updated)
      setTrades(prev=> prev.map(t=> String(t.id)===String(updated.id) ? mapped : t))
      setRawTrades(prev=> prev.map(t=> t.id===updated.id ? updated : t))
      setSelected(updated)
      setEditing(false)
    } catch(e){ alert(e instanceof Error ? e.message : String(e)) }
    finally{ setDrawerSaving(false) }
  }

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
    setLogError(null)
    // validation
    if(!logForm.symbol.trim()) { setLogError('Symbol required'); return }
    const entry = parseFloat(logForm.entry_price)
    const lot = parseFloat(logForm.lot_size)
    const risk = parseFloat(logForm.risk_pct)
    if(Number.isNaN(entry) || entry<=0) { setLogError('Entry price must be > 0'); return }
    if(Number.isNaN(lot) || lot<=0) { setLogError('Lot size must be > 0'); return }
    if(Number.isNaN(risk) || risk<=0 || risk>10) { setLogError('Risk % must be 0.1–10'); return }
    if(logForm.status==='closed'){
      const exit = logForm.exit_price ? parseFloat(logForm.exit_price) : NaN
      if(logForm.exit_price && (Number.isNaN(exit) || exit<=0)) { setLogError('Exit price invalid'); return }
    }
    setLogSaving(true)
    try{
      const opened = new Date(logForm.opened_at)
      const closed = logForm.closed_at ? new Date(logForm.closed_at) : null
      const exitVal = logForm.exit_price ? parseFloat(logForm.exit_price) : undefined
      const sl = logForm.stop_loss ? parseFloat(logForm.stop_loss) : undefined
      const tp = logForm.take_profit ? parseFloat(logForm.take_profit) : undefined
      // auto pnl if closed and prices present
      let netPnl: number | undefined = undefined
      if(logForm.status==='closed' && exitVal){
        const dir = logForm.direction==='long'?1:-1
        const pipMult = logForm.symbol.includes('JPY') ? 100 : 10000
        const pips = (exitVal - entry) * pipMult * dir
        // synthetic pnl: pips * lot * 10 (approx) — real broker would compute
        netPnl = Math.round(pips * lot * 0.8 * 10) / 10
      }
      const body: any = {
        symbol: logForm.symbol.toUpperCase().trim(),
        direction: logForm.direction,
        instrument_type: logForm.instrument_type,
        status: logForm.status,
        entry_price: entry,
        exit_price: exitVal,
        stop_loss: Number.isFinite(sl as number) ? sl : undefined,
        take_profit: Number.isFinite(tp as number) ? tp : undefined,
        lot_size: lot,
        position_size_usd: Math.round(lot * 100000 * entry * 0.01),
        risk_pct: risk,
        session: logForm.session,
        strategy_name: logForm.strategy_name || undefined,
        opened_at: opened.toISOString(),
        closed_at: closed && logForm.status==='closed' ? closed.toISOString() : undefined,
        net_pnl: netPnl,
        gross_pnl: netPnl,
      }
      const r = await fetch('/api/trades',{method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(body)})
      const j = await r.json()
      if(r.ok && j.data){
        const mapped = mapTrade(j.data as Trade)
        setTrades(prev=>[mapped, ...prev].slice(0,50))
        setShowLog(false)
      } else {
        setLogError(j.error || 'Failed to log trade')
      }
    } catch(e){
      setLogError(e instanceof Error ? e.message : String(e))
    } finally{ setLogSaving(false) }
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

      {/* Log Trade — full modal (5a) */}
      {showLog && (
        <div onClick={()=> !logSaving && setShowLog(false)} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', backdropFilter:'blur(4px)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:50, padding:'20px' }}>
          <div onClick={e=> e.stopPropagation()} style={{ width:'100%', maxWidth:'560px', maxHeight:'90vh', overflowY:'auto', background:c.surface, border:`1px solid ${c.border}`, borderRadius:'12px', boxShadow:'0 20px 60px rgba(0,0,0,0.5)' }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'16px 18px', borderBottom:`1px solid ${c.border}`, position:'sticky', top:0, background:c.surface, zIndex:1 }}>
              <div>
                <div style={{ fontSize:'14px', fontWeight:700 }}>Log Trade</div>
                <div style={{ fontSize:'11px', color:c.text3, fontFamily:c.mono, marginTop:'2px' }}>Manual entry · validated via POST /api/trades</div>
              </div>
              <button onClick={()=> !logSaving && setShowLog(false)} style={{ background:'transparent', border:`1px solid ${c.border}`, borderRadius:'6px', padding:'6px', cursor:'pointer', color:c.text3, display:'flex' }}><X size={14}/></button>
            </div>

            <div style={{ padding:'16px 18px', display:'flex', flexDirection:'column', gap:'14px' }}>
              {/* Row 1: Symbol + Direction + Instrument */}
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'10px' }}>
                <div>
                  <div style={{ fontSize:'10px', color:c.text3, fontFamily:c.mono, marginBottom:'5px', textTransform:'uppercase' as const, letterSpacing:'0.5px' }}>Symbol *</div>
                  <input value={logForm.symbol} onChange={e=> setLogForm({...logForm, symbol:e.target.value})} placeholder='EURUSD' style={{ width:'100%', background:c.surface2, border:`1px solid ${c.border}`, borderRadius:'7px', padding:'8px 10px', fontSize:'13px', color:c.text, fontFamily:c.mono, outline:'none', boxSizing:'border-box' }} />
                </div>
                <div>
                  <div style={{ fontSize:'10px', color:c.text3, fontFamily:c.mono, marginBottom:'5px', textTransform:'uppercase' as const, letterSpacing:'0.5px' }}>Direction *</div>
                  <select value={logForm.direction} onChange={e=> setLogForm({...logForm, direction:e.target.value as any})} style={{ width:'100%', background:c.surface2, border:`1px solid ${c.border}`, borderRadius:'7px', padding:'8px 10px', fontSize:'13px', color:c.text, fontFamily:'inherit', outline:'none' }}>
                    <option value='long'>Long</option><option value='short'>Short</option>
                  </select>
                </div>
                <div>
                  <div style={{ fontSize:'10px', color:c.text3, fontFamily:c.mono, marginBottom:'5px', textTransform:'uppercase' as const, letterSpacing:'0.5px' }}>Instrument</div>
                  <select value={logForm.instrument_type} onChange={e=> setLogForm({...logForm, instrument_type:e.target.value as any})} style={{ width:'100%', background:c.surface2, border:`1px solid ${c.border}`, borderRadius:'7px', padding:'8px 10px', fontSize:'13px', color:c.text, outline:'none' }}>
                    <option value='forex'>Forex</option><option value='crypto'>Crypto</option><option value='commodities'>Commodities</option><option value='indices'>Indices</option><option value='stocks'>Stocks</option>
                  </select>
                </div>
              </div>

              {/* Row 2: Entry + Exit + Lot */}
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'10px' }}>
                <div>
                  <div style={{ fontSize:'10px', color:c.text3, fontFamily:c.mono, marginBottom:'5px' }}>Entry Price *</div>
                  <input type='number' step='0.00001' value={logForm.entry_price} onChange={e=> setLogForm({...logForm, entry_price:e.target.value})} style={{ width:'100%', background:c.surface2, border:`1px solid ${c.border}`, borderRadius:'7px', padding:'8px 10px', fontSize:'13px', color:c.text, fontFamily:c.mono, outline:'none', boxSizing:'border-box' }} />
                </div>
                <div>
                  <div style={{ fontSize:'10px', color:c.text3, fontFamily:c.mono, marginBottom:'5px' }}>Exit Price {logForm.status==='closed' ? '' : '(optional)'}</div>
                  <input type='number' step='0.00001' value={logForm.exit_price} onChange={e=> setLogForm({...logForm, exit_price:e.target.value})} placeholder={logForm.status==='open'?'—':''} style={{ width:'100%', background:c.surface2, border:`1px solid ${c.border}`, borderRadius:'7px', padding:'8px 10px', fontSize:'13px', color:c.text, fontFamily:c.mono, outline:'none', boxSizing:'border-box' }} />
                </div>
                <div>
                  <div style={{ fontSize:'10px', color:c.text3, fontFamily:c.mono, marginBottom:'5px' }}>Lot Size *</div>
                  <input type='number' step='0.01' value={logForm.lot_size} onChange={e=> setLogForm({...logForm, lot_size:e.target.value})} style={{ width:'100%', background:c.surface2, border:`1px solid ${c.border}`, borderRadius:'7px', padding:'8px 10px', fontSize:'13px', color:c.text, fontFamily:c.mono, outline:'none', boxSizing:'border-box' }} />
                </div>
              </div>

              {/* Row 3: SL / TP / Risk */}
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'10px' }}>
                <div>
                  <div style={{ fontSize:'10px', color:c.text3, fontFamily:c.mono, marginBottom:'5px' }}>Stop Loss</div>
                  <input type='number' step='0.00001' value={logForm.stop_loss} onChange={e=> setLogForm({...logForm, stop_loss:e.target.value})} placeholder='optional' style={{ width:'100%', background:c.surface2, border:`1px solid ${c.border}`, borderRadius:'7px', padding:'8px 10px', fontSize:'13px', color:c.text, fontFamily:c.mono, outline:'none', boxSizing:'border-box' }} />
                </div>
                <div>
                  <div style={{ fontSize:'10px', color:c.text3, fontFamily:c.mono, marginBottom:'5px' }}>Take Profit</div>
                  <input type='number' step='0.00001' value={logForm.take_profit} onChange={e=> setLogForm({...logForm, take_profit:e.target.value})} placeholder='optional' style={{ width:'100%', background:c.surface2, border:`1px solid ${c.border}`, borderRadius:'7px', padding:'8px 10px', fontSize:'13px', color:c.text, fontFamily:c.mono, outline:'none', boxSizing:'border-box' }} />
                </div>
                <div>
                  <div style={{ fontSize:'10px', color:c.text3, fontFamily:c.mono, marginBottom:'5px' }}>Risk % *</div>
                  <input type='number' step='0.1' min={0.1} max={10} value={logForm.risk_pct} onChange={e=> setLogForm({...logForm, risk_pct:e.target.value})} style={{ width:'100%', background:c.surface2, border:`1px solid ${c.border}`, borderRadius:'7px', padding:'8px 10px', fontSize:'13px', color:c.text, fontFamily:c.mono, outline:'none', boxSizing:'border-box' }} />
                </div>
              </div>

              {/* Row 4: Session + Strategy + Status */}
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'10px' }}>
                <div>
                  <div style={{ fontSize:'10px', color:c.text3, fontFamily:c.mono, marginBottom:'5px' }}>Session</div>
                  <select value={logForm.session} onChange={e=> setLogForm({...logForm, session:e.target.value as any})} style={{ width:'100%', background:c.surface2, border:`1px solid ${c.border}`, borderRadius:'7px', padding:'8px 10px', fontSize:'13px', color:c.text }}>
                    <option value='london'>London</option><option value='overlap'>Overlap</option><option value='new_york'>New York</option><option value='asian'>Asian</option>
                  </select>
                </div>
                <div>
                  <div style={{ fontSize:'10px', color:c.text3, fontFamily:c.mono, marginBottom:'5px' }}>Strategy</div>
                  <input value={logForm.strategy_name} onChange={e=> setLogForm({...logForm, strategy_name:e.target.value})} placeholder='Breakout' style={{ width:'100%', background:c.surface2, border:`1px solid ${c.border}`, borderRadius:'7px', padding:'8px 10px', fontSize:'13px', color:c.text, outline:'none', boxSizing:'border-box' }} />
                </div>
                <div>
                  <div style={{ fontSize:'10px', color:c.text3, fontFamily:c.mono, marginBottom:'5px' }}>Status</div>
                  <select value={logForm.status} onChange={e=> setLogForm({...logForm, status:e.target.value as any})} style={{ width:'100%', background:c.surface2, border:`1px solid ${c.border}`, borderRadius:'7px', padding:'8px 10px', fontSize:'13px', color:c.text }}>
                    <option value='closed'>Closed</option><option value='open'>Open</option><option value='pending'>Pending</option>
                  </select>
                </div>
              </div>

              {/* Row 5: Dates */}
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px' }}>
                <div>
                  <div style={{ fontSize:'10px', color:c.text3, fontFamily:c.mono, marginBottom:'5px' }}>Opened At *</div>
                  <input type='datetime-local' value={logForm.opened_at} onChange={e=> setLogForm({...logForm, opened_at:e.target.value})} style={{ width:'100%', background:c.surface2, border:`1px solid ${c.border}`, borderRadius:'7px', padding:'8px 10px', fontSize:'13px', color:c.text, outline:'none', boxSizing:'border-box' }} />
                </div>
                <div>
                  <div style={{ fontSize:'10px', color:c.text3, fontFamily:c.mono, marginBottom:'5px' }}>Closed At {logForm.status!=='closed' && '(— for open)'}</div>
                  <input type='datetime-local' value={logForm.closed_at} onChange={e=> setLogForm({...logForm, closed_at:e.target.value})} disabled={logForm.status!=='closed'} style={{ width:'100%', background:c.surface2, border:`1px solid ${c.border}`, borderRadius:'7px', padding:'8px 10px', fontSize:'13px', color: logForm.status!=='closed'? c.text3 : c.text, outline:'none', opacity: logForm.status!=='closed'?0.6:1, boxSizing:'border-box' }} />
                </div>
              </div>

              {logError && <div style={{ padding:'8px 10px', borderRadius:'7px', background:'rgba(255,95,95,0.08)', border:'1px solid rgba(255,95,95,0.2)', fontSize:'12px', color:c.red }}>{logError}</div>}

              <div style={{ display:'flex', gap:'10px', justifyContent:'flex-end', paddingTop:'6px' }}>
                <button onClick={()=> setShowLog(false)} disabled={logSaving} style={{ padding:'9px 14px', borderRadius:'7px', background:'transparent', border:`1px solid ${c.border}`, color:c.text2, fontSize:'13px', fontWeight:600, cursor:'pointer' }}>Cancel</button>
                <button onClick={doLogTrade} disabled={logSaving} style={{ padding:'9px 16px', borderRadius:'7px', background:c.accent, border:'none', color:'#fff', fontSize:'13px', fontWeight:700, cursor: logSaving?'not-allowed':'pointer', opacity: logSaving?0.6:1 }}>{logSaving ? 'Saving…' : 'Save Trade'}</button>
              </div>
              <div style={{ fontSize:'10px', color:c.text3, fontFamily:c.mono, textAlign:'center' }}>Pips &amp; PnL auto-derived from entry/exit · RLS: user_id scoped</div>
            </div>
          </div>
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
              {filtered.length===0 ? (
                <tr><td colSpan={9} style={{ padding:'24px', textAlign:'center', color:c.text3, fontFamily:c.mono, fontSize:'12px' }}>{loading? 'Loading…':'No trades match filter'}</td></tr>
              ) : filtered.map(trade => (
                <tr key={trade.id} onClick={()=>{
                  const raw = rawTrades.find(r=> String(r.id)===String(trade.id))
                  if(raw) setSelected(raw)
                  else {
                    const synth: Trade = {
                      id: String(trade.id), user_id:'demo', broker_connection_id:'', symbol: trade.symbol, instrument_type:'forex' as const,
                      direction: trade.direction==='Long'?'long':'short' as const, status:'closed' as const, entry_price:1.085, exit_price:1.09, lot_size:0.1, position_size_usd:1000,
                      risk_pct: trade.risk, reward_risk_ratio: trade.rr, session: trade.session.toLowerCase().replace(' ','_') as any, opened_at: new Date().toISOString(), closed_at: new Date().toISOString(),
                      net_pnl: trade.pnl, gross_pnl: trade.pnl, strategy_name: trade.strategy, alignment_score: trade.alignment, created_at:new Date().toISOString(), updated_at:new Date().toISOString(),
                    }
                    setSelected(synth)
                  }
                }} style={{ cursor: 'pointer' }}
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

      {/* Detail Drawer — 5b */}
      {selected && (
        <div onClick={()=> !drawerSaving && !editing && setSelected(null)} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.55)', backdropFilter:'blur(2px)', display:'flex', justifyContent:'flex-end', zIndex:40 }}>
          <div onClick={e=> e.stopPropagation()} style={{ width:'440px', maxWidth:'92vw', background:c.surface, borderLeft:`1px solid ${c.border}`, display:'flex', flexDirection:'column', height:'100vh', overflow:'hidden' }}>
            {/* Header */}
            <div style={{ padding:'16px 18px', borderBottom:`1px solid ${c.border}`, display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0 }}>
              <div>
                <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
                  <span style={{ fontSize:'16px', fontWeight:800, fontFamily:c.mono }}>{selected.symbol}</span>
                  <span style={{ fontSize:'11px', fontWeight:600, padding:'2px 7px', borderRadius:'4px', background: selected.direction==='long' ? 'rgba(62,207,142,0.12)' : 'rgba(255,95,95,0.12)', color: selected.direction==='long' ? c.green : c.red, fontFamily:c.mono }}>{selected.direction.toUpperCase()}</span>
                  <span style={{ fontSize:'10px', color:c.text3, fontFamily:c.mono }}>{selected.status}</span>
                </div>
                <div style={{ fontSize:'11px', color:c.text3, fontFamily:c.mono, marginTop:'3px' }}>{new Date(selected.opened_at).toLocaleString()} · {selected.session}</div>
              </div>
              <button onClick={()=> setSelected(null)} style={{ background:'transparent', border:`1px solid ${c.border}`, borderRadius:'6px', padding:'6px', cursor:'pointer', color:c.text3, display:'flex' }}><X size={14}/></button>
            </div>

            <div style={{ flex:1, overflowY:'auto', padding:'16px 18px', display:'flex', flexDirection:'column', gap:'14px' }}>
              {/* Actions */}
              <div style={{ display:'flex', gap:'8px' }}>
                <button onClick={()=> setEditing(!editing)} disabled={drawerSaving} style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:'6px', padding:'8px', borderRadius:'7px', background: editing ? c.surface2 : c.accent, border:`1px solid ${editing ? c.border : c.accent}`, color: editing ? c.text2 : '#fff', fontSize:'12px', fontWeight:600, cursor:'pointer' }}><Edit3 size={13}/>{editing ? 'Cancel Edit' : 'Edit'}</button>
                <button onClick={handleDelete} disabled={drawerSaving} style={{ display:'flex', alignItems:'center', gap:'6px', padding:'8px 12px', borderRadius:'7px', background: deleting ? 'rgba(255,95,95,0.15)' : 'transparent', border:`1px solid ${deleting ? 'rgba(255,95,95,0.4)' : c.border}`, color: deleting ? c.red : c.text3, fontSize:'12px', fontWeight:600, cursor:'pointer', opacity: drawerSaving?0.6:1 }}>
                  <Trash2 size={13}/>{ deleting ? 'Confirm?' : 'Delete'}
                </button>
              </div>

              {/* Edit form */}
              {editing ? (
                <div style={{ display:'flex', flexDirection:'column', gap:'10px', background:c.surface2, border:`1px solid ${c.border}`, borderRadius:'8px', padding:'12px' }}>
                  {[
                    {k:'symbol', label:'Symbol', ph:'EURUSD'},
                    {k:'entry_price', label:'Entry', ph:'1.0850'},
                    {k:'exit_price', label:'Exit', ph:'1.0900'},
                    {k:'lot_size', label:'Lot', ph:'0.10'},
                    {k:'risk_pct', label:'Risk %', ph:'1.0'},
                    {k:'stop_loss', label:'SL', ph:'optional'},
                    {k:'take_profit', label:'TP', ph:'optional'},
                    {k:'strategy_name', label:'Strategy', ph:'Breakout'},
                    {k:'session', label:'Session', ph:'london'},
                  ].map(f=>(
                    <div key={f.k}>
                      <div style={{ fontSize:'10px', color:c.text3, fontFamily:c.mono, marginBottom:'4px' }}>{f.label}</div>
                      <input value={(editForm as any)[f.k] ?? ''} onChange={e=> setEditForm(prev=> ({...prev, [f.k]: e.target.value}))} placeholder={f.ph} style={{ width:'100%', background:c.surface, border:`1px solid ${c.border}`, borderRadius:'6px', padding:'7px 10px', fontSize:'12px', color:c.text, fontFamily:c.mono, outline:'none', boxSizing:'border-box' }} />
                    </div>
                  ))}
                  <button onClick={handleSaveEdit} disabled={drawerSaving} style={{ marginTop:'6px', padding:'9px', borderRadius:'7px', background:c.accent, border:'none', color:'#fff', fontSize:'13px', fontWeight:700, cursor:'pointer', opacity:drawerSaving?0.6:1 }}>{drawerSaving ? 'Saving…' : 'Save Changes'}</button>
                </div>
              ) : (
                <>
                  {/* Stats */}
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'8px' }}>
                    {[
                      {label:'P&L', value:`${(selected.net_pnl ?? 0) >=0 ? '+' : ''}$${Math.round(selected.net_pnl ?? 0)}`, color: (selected.net_pnl ?? 0)>=0 ? c.green : c.red},
                      {label:'R:R', value: `${(selected.reward_risk_ratio ?? 0).toFixed(1)}R`, color:c.text},
                      {label:'Risk', value: `${selected.risk_pct ?? 0}%`, color: (selected.risk_pct ?? 0)>2 ? c.amber : c.text2},
                      {label:'Alignment', value: `${selected.alignment_score ?? 50}`, color: (selected.alignment_score ?? 50)>=75 ? c.green : (selected.alignment_score ?? 50)>=50 ? c.amber : c.red},
                      {label:'Entry', value: `${selected.entry_price}`, color:c.text2},
                      {label:'Exit', value: `${selected.exit_price ?? '—'}`, color:c.text2},
                      {label:'Lot', value: `${selected.lot_size}`, color:c.text2},
                      {label:'Pips', value: `${selected.pips ?? '—'}`, color:c.text2},
                    ].map(s=>(
                      <div key={s.label} style={{ background:c.surface2, borderRadius:'7px', padding:'10px 12px' }}>
                        <div style={{ fontSize:'10px', color:c.text3, fontFamily:c.mono }}>{s.label}</div>
                        <div style={{ fontSize:'13px', fontWeight:700, color:s.color, marginTop:'2px', fontFamily:c.mono }}>{s.value}</div>
                      </div>
                    ))}
                  </div>

                  {/* Flags */}
                  <div style={{ background:c.surface2, border:`1px solid ${c.border}`, borderRadius:'8px', padding:'12px' }}>
                    <div style={{ fontSize:'11px', fontWeight:600, marginBottom:'8px' }}>Behavioral Flags</div>
                    {drawerFlags.length ? drawerFlags.map((f:any)=>(
                      <div key={f.id} style={{ display:'flex', gap:'8px', padding:'6px 0', borderTop:`1px solid ${c.border}20` }}>
                        <span style={{ width:'6px', height:'6px', borderRadius:'50%', background: f.severity==='high'?c.red : f.severity==='medium'?c.amber:c.green, marginTop:'6px', flexShrink:0 }} />
                        <div>
                          <div style={{ fontSize:'12px', fontWeight:600, color: f.severity==='high'?c.red : c.text }}>{f.flag_type?.replace(/_/g,' ')}</div>
                          <div style={{ fontSize:'11px', color:c.text2, marginTop:'2px' }}>{f.description}</div>
                        </div>
                      </div>
                    )) : <div style={{ fontSize:'11px', color:c.text3, fontFamily:c.mono }}>No flags for this trade</div>}
                  </div>

                  {/* Journal logs */}
                  <div style={{ background:c.surface2, border:`1px solid ${c.border}`, borderRadius:'8px', padding:'12px' }}>
                    <div style={{ fontSize:'11px', fontWeight:600, marginBottom:'8px', display:'flex', justifyContent:'space-between' }}>
                      <span>Journal Entries</span>
                      <a href='/journal' style={{ fontSize:'11px', color:c.accent, textDecoration:'none', fontFamily:c.mono }}>view journal →</a>
                    </div>
                    {drawerLogs.length ? drawerLogs.map((l:any)=>(
                      <div key={l.id} style={{ padding:'8px 0', borderTop:`1px solid ${c.border}20` }}>
                        <div style={{ fontSize:'11px', fontWeight:600, color: ['fearful','revenge_trading','stressed'].includes(l.emotion) ? c.red : c.green }}>{l.emotion.replace(/_/g,' ')} <span style={{color:c.text3, fontWeight:400}}>· {new Date(l.logged_at).toLocaleDateString()}</span></div>
                        <div style={{ fontSize:'12px', color:c.text2, marginTop:'4px', lineHeight:1.5 }}>{l.setup_notes ?? l.pre_trade_reasoning ?? l.post_trade_reflection ?? '—'}</div>
                      </div>
                    )) : <div style={{ fontSize:'11px', color:c.text3, fontFamily:c.mono }}>No journal for this trade <a href='/journal' style={{color:c.accent}}>Add one</a></div>}
                  </div>

                  {/* Meta */}
                  <div style={{ fontSize:'10px', color:c.text3, fontFamily:c.mono, textAlign:'center', paddingTop:'8px', borderTop:`1px solid ${c.border}20` }}>
                    ID: {String(selected.id).slice(0,8)} · {selected.instrument_type} · {selected.timeframe ?? '—'} · {selected.duration_minutes ?? '—'}m
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
