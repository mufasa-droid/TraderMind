'use client'

import { useState, useEffect } from 'react'
import { Image as ImageIcon, Upload, Trash2, Eye } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

const c = {
  green: '#3ecf8e', red: '#ff5f5f', amber: '#f5a623',
  accent: 'hsl(226,100%,71%)', purple: '#b48eff',
  surface: 'hsl(224,18%,8%)', surface2: 'hsl(224,16%,11%)', surface3: 'hsl(224,14%,14%)',
  border: 'hsl(220,12%,14%)', text: 'hsl(220,15%,92%)',
  text2: 'hsl(220,10%,55%)', text3: 'hsl(220,10%,35%)', mono: "'DM Mono', monospace",
}
const panel = { background: c.surface, border: `1px solid ${c.border}`, borderRadius: '10px', overflow: 'hidden' }

type Shot = { id:string; url:string; thumbnail_url:string; label?:string; notes?:string; timeframe?:string; trade_type?:string; created_at:string }

const DEMO_SHOTS: Shot[] = [
  { id:'1', url:'', thumbnail_url:'', label:'EURUSD Breakout', notes:'H1 ATR confirmed', timeframe:'H1', trade_type:'setup', created_at: new Date().toISOString() },
  { id:'2', url:'', thumbnail_url:'', label:'GBPJPY Loss', notes:'Revenge entry after SL', timeframe:'M15', trade_type:'review', created_at: new Date(Date.now()-86400000).toISOString() },
]

export default function ScreenshotsPage(){
  const [shots, setShots] = useState<Shot[]>(DEMO_SHOTS)
  const [loading, setLoading]=useState(true)
  const [uploading, setUploading]=useState(false)

  useEffect(()=>{
    let cancelled=false
    const supabase=createClient()
    supabase.from('trade_screenshots').select('*').order('created_at',{ascending:false}).limit(20).then(({data,error})=>{
      if(cancelled) return
      if(!error && data && data.length) setShots(data as Shot[])
      setLoading(false)
    })
    return ()=>{cancelled=true}
  },[])

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>)=>{
    const file = e.target.files?.[0]
    if(!file) return
    setUploading(true)
    try{
      const supabase=createClient()
      const { data:{user} } = await supabase.auth.getUser()
      if(!user){
        // demo local placeholder
        const demo: Shot = { id: Math.random().toString(36).slice(2), url: URL.createObjectURL(file), thumbnail_url: URL.createObjectURL(file), label: file.name.slice(0,20), notes: 'Demo upload', created_at: new Date().toISOString() }
        setShots(prev=>[demo,...prev].slice(0,20))
        return
      }
      const path = `${user.id}/${Date.now()}-${file.name}`
      const { error: upErr } = await supabase.storage.from('screenshots').upload(path, file)
      if(upErr) throw upErr
      const { data:{ publicUrl } } = supabase.storage.from('screenshots').getPublicUrl(path)
      const { data, error } = await supabase.from('trade_screenshots').insert({ user_id:user.id, url: publicUrl, thumbnail_url: publicUrl, label: file.name }).select().single()
      if(error) throw error
      if(data) setShots(prev=>[data as Shot, ...prev])
    } catch(err){ alert(err instanceof Error? err.message : String(err)) }
    finally{ setUploading(false); e.target.value='' }
  }

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'20px', maxWidth:'1100px' }}>
      <div style={{ display:'flex', alignItems:'flex-end', justifyContent:'space-between' }}>
        <div>
          <h1 style={{fontSize:'24px',fontWeight:800,letterSpacing:'-0.6px'}}>Screenshots</h1>
          <p style={{fontSize:'12px',color:c.text3,marginTop:'3px',fontFamily:c.mono}}>{loading? 'Loading…': `${shots.length} images · Click to annotate`}</p>
        </div>
        <label style={{ display:'flex', alignItems:'center', gap:'6px', padding:'8px 14px', borderRadius:'8px', background:c.accent, color:'#fff', fontSize:'12px', fontWeight:600, cursor: uploading?'not-allowed':'pointer', opacity: uploading?0.6:1 }}>
          <Upload size={14}/> {uploading?'Uploading…':'Upload'}
          <input type='file' accept='image/*' onChange={handleUpload} style={{display:'none'}} disabled={uploading} />
        </label>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(280px,1fr))', gap:'14px' }}>
        {shots.map(s=>(
          <div key={s.id} style={panel}>
            <div style={{ height:'160px', background: c.surface2, display:'flex', alignItems:'center', justifyContent:'center', borderBottom:`1px solid ${c.border}`, overflow:'hidden' }}>
              {s.url ? <img src={s.thumbnail_url || s.url} alt={s.label} style={{width:'100%',height:'100%',objectFit:'cover'}} /> : <ImageIcon size={24} color={c.text3} />}
            </div>
            <div style={{ padding:'12px 14px' }}>
              <div style={{ fontSize:'13px', fontWeight:600, marginBottom:'4px' }}>{s.label || 'Untitled'}</div>
              <div style={{ fontSize:'11px', color:c.text3, fontFamily:c.mono }}>{new Date(s.created_at).toLocaleDateString()} · {s.timeframe ?? '—'} · {s.trade_type ?? 'setup'}</div>
              {s.notes && <p style={{ fontSize:'12px', color:c.text2, marginTop:'8px', lineHeight:1.5 }}>{s.notes}</p>}
              <div style={{ display:'flex', gap:'8px', marginTop:'10px' }}>
                <button style={{ flex:1, padding:'6px', borderRadius:'6px', background:c.surface2, border:`1px solid ${c.border}`, color:c.text2, fontSize:'11px', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:'4px' }}><Eye size={12}/> View</button>
                <button style={{ padding:'6px 10px', borderRadius:'6px', background:'transparent', border:`1px solid ${c.border}`, color:c.red, cursor:'pointer' }}><Trash2 size={12}/></button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {!loading && shots.length===0 && (
        <div style={{ ...panel, padding:'40px', textAlign:'center', color:c.text3, fontFamily:c.mono, fontSize:'13px' }}>No screenshots yet — upload your first chart.</div>
      )}
    </div>
  )
}
