import { useState, useEffect } from 'react'
import { collection, query, where, getDocs } from 'firebase/firestore'
import { db } from '../firebase/config'
import { useTranslation } from 'react-i18next'
import { format, subDays } from 'date-fns'
import { BarChart2, TrendingUp, TrendingDown, Minus, RefreshCw } from 'lucide-react'

const PERIODS = [
  { key:'7d',  label:'7 Days',  labelBn:'৭ দিন',  days:7  },
  { key:'15d', label:'15 Days', labelBn:'১৫ দিন', days:15 },
  { key:'1m',  label:'1 Month', labelBn:'১ মাস',  days:30 },
]

function fmtMin(m) {
  const h=Math.floor(m/60), min=m%60
  if(h>0&&min>0) return `${h}h ${min}m`
  if(h>0) return `${h}h`
  if(min>0) return `${min}m`
  return '0m'
}

export default function StudyGraph({ uid, goalMinutes }) {
  const { i18n } = useTranslation()
  const isBn = i18n.language === 'bn'
  const [period,   setPeriod]   = useState('7d')
  const [data,     setData]     = useState([])
  const [loading,  setLoading]  = useState(true)
  const [selected, setSelected] = useState(null)
  const [error,    setError]    = useState('')

  const days = PERIODS.find(p=>p.key===period)?.days || 7

  useEffect(() => { if(uid) fetchData() }, [uid, period])

  const fetchData = async () => {
    setLoading(true); setSelected(null); setError('')
    try {
      // KEY FIX: Only filter by userId — no date filter = no composite index needed
      // Then filter dates client-side
      const snap = await getDocs(query(
        collection(db, 'studyLogs'),
        where('userId', '==', uid)
      ))

      // Build date range client-side
      const today    = format(new Date(), 'yyyy-MM-dd')
      const dateSet  = new Set()
      for(let i=0; i<days; i++) {
        dateSet.add(format(subDays(new Date(), i), 'yyyy-MM-dd'))
      }

      // Aggregate by date (only dates in our range)
      const logMap = {}
      snap.docs.forEach(d => {
        const { date, minutes } = d.data()
        if(date && minutes>0 && dateSet.has(date)) {
          logMap[date] = (logMap[date]||0) + minutes
        }
      })

      // Build sorted chart array oldest→newest
      const sortedDates = [...dateSet].sort()
      const chart = sortedDates.map(dateStr => ({
        date:     dateStr,
        minutes:  logMap[dateStr] || 0,
        label:    days<=7
          ? format(new Date(dateStr+'T12:00:00'), 'EEE')
          : days<=15
          ? format(new Date(dateStr+'T12:00:00'), 'd/M')
          : format(new Date(dateStr+'T12:00:00'), 'd'),
        fullDate: format(new Date(dateStr+'T12:00:00'), 'EEE, dd MMM yyyy'),
        isToday:  dateStr === today,
      }))

      setData(chart)
    } catch(err) {
      console.error('Graph error:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const totalMins   = data.reduce((s,d)=>s+d.minutes, 0)
  const studyDays   = data.filter(d=>d.minutes>0).length
  const avgMins     = studyDays>0 ? Math.round(totalMins/studyDays) : 0
  const goalMetDays = data.filter(d=>d.minutes>=(goalMinutes||1) && d.minutes>0).length
  const maxBar      = Math.max(...data.map(d=>d.minutes), goalMinutes||60, 60)
  const hasData     = data.some(d=>d.minutes>0)

  const half=Math.floor(data.length/2)
  const trend = data.slice(half).reduce((s,d)=>s+d.minutes,0) > data.slice(0,half).reduce((s,d)=>s+d.minutes,0)
    ? 'up' : data.slice(half).reduce((s,d)=>s+d.minutes,0) < data.slice(0,half).reduce((s,d)=>s+d.minutes,0)
    ? 'down' : 'flat'

  const sel = selected!==null ? data[selected] : null

  return (
    <div className="card mb-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <BarChart2 size={16} className="text-brand-400"/>
          <h3 className={`text-sm font-display font-semibold text-white/80 ${isBn?'font-bengali':''}`}>
            {isBn?'পড়ার বিশ্লেষণ':'Study Analysis'}
          </h3>
          {!loading && hasData && (
            <span className={`flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded-full font-display ${
              trend==='up'?'bg-green-500/15 text-green-400':trend==='down'?'bg-red-500/15 text-red-400':'bg-white/10 text-white/40'
            }`}>
              {trend==='up'&&<TrendingUp size={9}/>}{trend==='down'&&<TrendingDown size={9}/>}{trend==='flat'&&<Minus size={9}/>}
              <span className="ml-0.5">{trend==='up'?'↑':trend==='down'?'↓':'→'}</span>
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button onClick={fetchData} className="text-white/30 hover:text-white/60 p-1 transition-colors">
            <RefreshCw size={12}/>
          </button>
          <div className="flex bg-surface-700 rounded-lg p-0.5">
            {PERIODS.map(p=>(
              <button key={p.key} onClick={()=>setPeriod(p.key)}
                className={`px-2 py-1 rounded-md text-[10px] font-display font-semibold transition-all ${
                  period===p.key?'bg-brand-500 text-white':'text-white/40 hover:text-white/60'
                }`}>
                {isBn?p.labelBn:p.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        {[
          {label:isBn?'মোট':'Total',        value:fmtMin(totalMins), color:'text-brand-400',  bg:'bg-brand-500/10' },
          {label:isBn?'গড়/দিন':'Avg/Day',   value:fmtMin(avgMins),   color:'text-accent-400', bg:'bg-accent-500/10'},
          {label:isBn?'লক্ষ্য পূরণ':'Goal Met',value:`${goalMetDays}d`,color:'text-green-400',  bg:'bg-green-500/10' },
        ].map(({label,value,color,bg})=>(
          <div key={label} className={`${bg} rounded-xl py-3 px-2 text-center`}>
            <p className={`font-display font-bold text-sm ${color}`}>{value}</p>
            <p className={`text-[9px] text-white/40 mt-0.5 ${isBn?'font-bengali':''}`}>{label}</p>
          </div>
        ))}
      </div>

      {loading ? (
        <div className="h-40 rounded-xl shimmer"/>
      ) : error ? (
        <div className="h-40 flex flex-col items-center justify-center gap-2">
          <p className="text-red-400 text-xs text-center">{error}</p>
          <button onClick={fetchData} className="text-brand-400 text-xs font-display underline">Retry</button>
        </div>
      ) : !hasData ? (
        <div className="h-40 flex flex-col items-center justify-center gap-2">
          <BarChart2 size={32} className="text-white/10"/>
          <p className={`text-white/30 text-xs text-center ${isBn?'font-bengali':''}`}>
            {isBn?'এই সময়ে কোনো ডেটা নেই':'No study data in this period'}
          </p>
          <p className="text-white/20 text-[10px] font-display">
            {isBn?'পড়া লগ করলে গ্রাফ দেখাবে':'Log study hours to see the graph'}
          </p>
        </div>
      ) : (
        <>
          {/* Tooltip */}
          {sel && (
            <div className="flex items-center justify-between bg-surface-600 border border-white/10 rounded-xl px-4 py-2 mb-3">
              <span className="text-white/50 text-xs font-display">{sel.fullDate}</span>
              <div className="flex items-center gap-2">
                <span className={`font-display font-bold text-sm ${sel.minutes>=(goalMinutes||1)&&sel.minutes>0?'text-green-400':'text-brand-400'}`}>
                  {fmtMin(sel.minutes)}
                </span>
                {sel.minutes===0 && <span className="text-white/30 text-[10px]">{isBn?'পড়িনি':'no study'}</span>}
                {sel.minutes>=(goalMinutes||1)&&sel.minutes>0 && <span className="text-green-400 text-[10px] font-display">✓</span>}
              </div>
            </div>
          )}

          {/* Chart */}
          <div className="flex gap-1.5">
            {/* Y axis */}
            <div className="flex flex-col justify-between w-8 flex-shrink-0 pb-5">
              {[maxBar, Math.round(maxBar/2), 0].map((v,i)=>(
                <span key={i} className="text-[7px] text-white/25 font-display text-right">{v>0?fmtMin(v):'0'}</span>
              ))}
            </div>

            {/* Bars */}
            <div className="flex-1 relative pb-5">
              {/* Grid lines */}
              {[25,50,75,100].map(p=>(
                <div key={p} className="absolute left-0 right-0 border-t border-white/[0.04] pointer-events-none"
                  style={{bottom:`${p*0.85}%`}}/>
              ))}

              {/* Goal line */}
              {(goalMinutes||0) > 0 && (
                <div className="absolute left-0 right-0 z-10 pointer-events-none"
                  style={{bottom:`${Math.min((goalMinutes/maxBar)*85, 83)}%`}}>
                  <div className="border-t-2 border-dashed border-accent-400/50"/>
                  <span className="absolute right-0 -top-4 text-[7px] text-accent-400/60 font-display">
                    {isBn?'লক্ষ্য':'Goal'}
                  </span>
                </div>
              )}

              {/* Bar container */}
              <div className="flex items-end gap-0.5 h-32">
                {data.map((d,i)=>{
                  const pct   = maxBar>0 ? (d.minutes/maxBar)*85 : 0
                  const met   = d.minutes>=(goalMinutes||1) && d.minutes>0
                  const isSel = selected===i

                  return (
                    <div key={d.date} className="flex-1 flex flex-col items-center gap-1 cursor-pointer group"
                      onClick={()=>setSelected(isSel?null:i)}>
                      <div className="w-full flex items-end" style={{height:'112px'}}>
                        {d.minutes>0 ? (
                          <div className="w-full rounded-t-md transition-all duration-500 relative overflow-hidden"
                            style={{
                              height:`${Math.max(pct,3)}%`,
                              background: met
                                ? 'linear-gradient(180deg,#4ade80 0%,#15803d 100%)'
                                : 'linear-gradient(180deg,#38bdf8 0%,#0369a1 100%)',
                              opacity: selected!==null&&!isSel ? 0.45 : 1,
                              boxShadow: isSel ? (met?'0 0 8px #22c55e80':'0 0 8px #0ea5e980') : 'none',
                            }}>
                            <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent"/>
                          </div>
                        ) : (
                          <div className="w-full bg-white/5 rounded-t-sm" style={{height:'3px'}}/>
                        )}
                      </div>
                      <span className={`text-[7px] font-display leading-none ${
                        d.isToday?'text-brand-400 font-bold':isSel?'text-white':'text-white/30'
                      }`}>
                        {d.isToday?(isBn?'আজ':'Now'):d.label}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Legend */}
          <div className="flex justify-center gap-4 mt-2 pt-2 border-t border-white/5">
            {[
              {c:'bg-green-500',l:isBn?'লক্ষ্য পূরণ':'Goal met'},
              {c:'bg-brand-400',l:isBn?'পড়েছি':'Studied'},
              {c:'bg-white/10', l:isBn?'পড়িনি':'No study'},
            ].map(({c,l})=>(
              <div key={l} className="flex items-center gap-1">
                <div className={`w-2.5 h-2.5 rounded ${c}`}/>
                <span className={`text-[9px] text-white/40 ${isBn?'font-bengali':''}`}>{l}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
