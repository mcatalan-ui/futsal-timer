'use client'
import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../lib/supabaseClient'
import { PLAYERS } from '../players'


function format(sec: number) {
  const m = Math.floor(sec/60).toString().padStart(2,'0')
  const s = Math.floor(sec%60).toString().padStart(2,'0')
  return `${m}:${s}`
}

export default function MatchPage({ params }: { params: { id: string } }) {
  const { id } = params
  const [match, setMatch] = useState<any>(null)
  const [times, setTimes] = useState<Record<number, number>>({})
  const [playing, setPlaying] = useState<Record<number, boolean>>({})
  const [running, setRunning] = useState(false)
  const lastTickRef = useRef<number | null>(null)
  const intervalRef = useRef<any>(null)

  useEffect(()=>{ load() },[])

  async function load(){
    const { data: m } = await supabase.from('matches').select('*').eq('id', id).single()
    setMatch(m)
    const { data: pts } = await supabase.from('player_times').select('*').eq('match_id', id)
    const map: Record<number, number> = {}
    (pts||[]).forEach((p:any)=> map[p.player_id]=p.total_seconds||0)
    setTimes(map)
    const playingInit: Record<number, boolean> = {}
    for(let i=1;i<=10;i++) playingInit[i]=false
    setPlaying(playingInit)
  }

  useEffect(()=>{
    if (running) {
      lastTickRef.current = Date.now()
      intervalRef.current = setInterval(tick, 1000)
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    return ()=>{ if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [running, playing, times])

  function tick(){
    const now = Date.now()
    const last = lastTickRef.current || now
    const diff = Math.floor((now - last)/1000)
    if (diff <= 0) {
      lastTickRef.current = now
      return
    }
    lastTickRef.current = now
    const newTimes = {...times}
    for(let i=1;i<=10;i++){
      if (playing[i]) newTimes[i] = (newTimes[i] || 0) + diff
    }
    setTimes(newTimes)
    persistTimes(newTimes)
  }

  async function persistTimes(newTimes: Record<number, number>){
    const rows = Object.entries(newTimes).map(([player_id, total_seconds])=>({
      match_id: id,
      player_id: Number(player_id),
      total_seconds
    }))
    await supabase.from('player_times').upsert(rows, { onConflict: ['match_id','player_id'] })
  }

  function togglePlayer(pid:number){
    setPlaying(prev=> ({...prev, [pid]: !prev[pid]}))
  }

  async function resetAll(){
    const cleared = {}
    for(let i=1;i<=10;i++) cleared[i]=0
    setTimes(cleared as any)
    await supabase.from('player_times').delete().eq('match_id', id)
    const initial = Array.from({length:10}).map((_,i)=>({match_id: id, player_id: i+1, total_seconds: 0}))
    await supabase.from('player_times').insert(initial)
  }

  if (!match) return <div>Cargando...</div>

  return (
    <div>
      <h2>{match.name}</h2>
      <div className="timer">{format(Object.values(times).reduce((a,b)=>a+(b||0),0))}</div>
      <div className="controls">
        <button onClick={()=>setRunning(true)}>Iniciar</button>
        <button onClick={()=>setRunning(false)}>Pausar</button>
        <button onClick={()=>{
          setRunning(false)
          resetAll()
        }}>Reiniciar</button>
      </div>

      <div className="player-grid">
        {PLAYERS.map(p=>(
          <div key={p.id} className={'player '+(playing[p.id] ? 'playing' : '')} onClick={()=>togglePlayer(p.id)}>
            <div style={{width:64,height:64,borderRadius:9999,display:'flex',alignItems:'center',justifyContent:'center',background:'#e6f6f5',fontWeight:700}}>
              {p.name.split(' ').map(s=>s[0]).slice(0,2).join('')}
            </div>
            <div>{p.name}</div>
            <div className="small">{format(times[p.id]||0)}</div>
            <div className="small">{playing[p.id] ? 'Jugando' : 'Banquillo'}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
