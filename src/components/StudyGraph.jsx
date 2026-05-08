import { useState, useEffect } from 'react'
import { collection, query, where, getDocs } from 'firebase/firestore'
import { db } from '../firebase/config'
import { useTranslation } from 'react-i18next'
import { format, subDays, eachDayOfInterval } from 'date-fns'
import { BarChart2, TrendingUp, TrendingDown, Minus } from 'lucide-react'

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

  const days = PERIODS.find(p=>p.key===period)?.days || 7

  useEffect(() => { if(uid) fetchData() }, [uid, period])

  const fetchData = async () => {
    setLoading(true); setSelected(null)
    try {
      const today    = new Date()
      const fromDate = subDays(today, days-1)
      const fromStr  = format(fromDate, 'yyyy-MM-dd')

      const snap = await getDocs(query(
        collection(db,'studyLogs'),
        where('userId','==',uid),
        where('date','>=',fromStr)
      ))

      const logMap = {}
      snap.docs.forEach(d => {
        const { date, minutes } = d.data()
        if(date && minutes) logMap[date] = (logMap[date]||0) + minutes
      })

      const allDays = eachDayOfInterval({ start:fromDate, end:today })
      const chart = allDays.map(day => {
        const dateStr = format(day,'yyyy-MM-dd')
        return {
          date:     dateStr,
          minutes:  logMap[dateStr] || 0,
          label:    days<=7
            ? format(day,'EEE')
            : days<=15
            ? format(day,'d MMM')
            : format(day,'d'),
          fullDate: format(day,'EEE, dd MMM yyyy'),
          isToday:  dateStr === format(today,'yyyy-MM-dd'),
        }
      })
      setData(chart)
    } catch(err) {
      console.error('Graph fetch:', err)
    } finally {
      setLoading(false)
    }
  }

  const totalMins  = data.reduce((s,d)=>s+d.minutes, 0)
  const studyDays  = data.filter(d=>d.minutes>0).length
  const avgMins    = studyDays>0 ? Math.round(totalMins/studyDays) : 0
  const goalMetDays = data.filter(d=>d.minutes>=goalMinutes && d.minutes>0).length
  const maxMinutes = Math.max(...data.map(d=>d.minutes), goalMinutes||1, 60)

  // Trend: compare first half vs second half
  const half   = Math.floor(data.length/2)
  const first  = data.slice(0,half).reduce((s,d)=>s+d.minutes,0)
  const second = data.slice(half).reduce((s,d)=>s+d.minutes,0)
  const trend  = second > first ? 'up' : second < first ? 'down' : 'flat'

  const sel = selected !== null ? data[selected] : null

  return (
    <div className="card mb-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <BarChart2 size={16} className="text-brand-400"/>
          <h3 className={`text-sm font-display font-semibold text-white/80 ${isBn?'font-bengali':''}`}>
            {isBn ? 'পড়ার বিশ্লেষণ' : 'Study Analysis'}
          </h3>
          {/* Trend indicator */}
          {!loading && data.length>0 && (
            <div className={`flex items-center gap-0.5 text-[10px] font-display px-1.5 py-0.5 rounded-full ${
              trend==='up'   ? 'bg-green-500/15 text-green-400' :
              trend==='down' ? 'bg-red-500/15 text-red-400'     :
              'bg-white/10 text-white/40'
            }`}>
              {trend==='up'   && <TrendingUp  size={10}/>}
              {trend==='down' && <TrendingDown size={10}/>}
              {trend==='flat' && <Minus        size={10}/>}
              <span>{trend==='up'?'Improving':trend==='down'?'Declining':'Steady'}</span>
            </div>
          )}
        </div>

        {/* Period tabs */}
        <div className="flex bg-surface-700 rounded-lg p-0.5 gap-0.5">
          {PERIODS.map(p => (
            <button key={p.key} onClick={()=>setPeriod(p.key)}
              className={`px-2.5 py-1 rounded-md text-[10px] font-display font-semibold transition-all ${
                period===p.key ? 'bg-brand-500 text-white' : 'text-white/40 hover:text-white/70'
              }`}>
              {isBn ? p.labelBn : p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Summary stat pills */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        {[
          { label:isBn?'মোট পড়েছি':'Total',      value:fmtMin(totalMins), color:'text-brand-400',  bg:'bg-brand-500/10'  },
          { label:isBn?'গড় প্রতিদিন':'Avg/Day',   value:fmtMin(avgMins),   color:'text-accent-400', bg:'bg-accent-500/10' },
          { label:isBn?'লক্ষ্য পূরণ':'Goal Met',  value:`${goalMetDays}d`, color:'text-green-400',  bg:'bg-green-500/10'  },
        ].map(({label,value,color,bg})=>(
          <div key={label} className={`${bg} rounded-xl py-3 px-2 text-center`}>
            <p className={`font-display font-bold text-sm ${color}`}>{value}</p>
            <p className={`text-[9px] text-white/40 mt-0.5 ${isBn?'font-bengali':''}`}>{label}</p>
          </div>
        ))}
      </div>

      {loading ? (
        <div className="h-36 rounded-xl shimmer"/>
      ) : data.every(d=>d.minutes===0) ? (
        <div className="h-36 flex flex-col items-center justify-center text-center">
          <BarChart2 size={28} className="text-white/10 mb-2"/>
          <p className={`text-white/30 text-xs ${isBn?'font-bengali':''}`}>
            {isBn ? 'এখনো কোনো ডেটা নেই। পড়া শুরু করো!' : 'No data yet. Start studying!'}
          </p>
        </div>
      ) : (
        <>
          {/* Selected bar tooltip */}
          <div className={`transition-all duration-200 overflow-hidden ${sel ? 'max-h-12 mb-3' : 'max-h-0 mb-0'}`}>
            {sel && (
              <div className="flex items-center justify-between bg-surface-600 border border-white/10 rounded-xl px-4 py-2">
                <span className="text-white/50 text-xs font-display">{sel.fullDate}</span>
                <div className="flex items-center gap-2">
                  <span className={`font-display font-bold text-sm ${sel.minutes>=goalMinutes&&sel.minutes>0?'text-green-400':'text-brand-400'}`}>
                    {fmtMin(sel.minutes)}
                  </span>
                  {sel.minutes===0 && <span className="text-white/30 text-xs">{isBn?'(পড়িনি)':'(no study)'}</span>}
                  {sel.minutes>=goalMinutes && sel.minutes>0 && <span className="text-green-400 text-xs">✓ Goal</span>}
                </div>
              </div>
            )}
          </div>

          {/* Chart container */}
          <div className="relative">
            {/* Y-axis labels */}
            <div className="absolute left-0 top-0 bottom-6 flex flex-col justify-between pointer-events-none">
              {[100,50,0].map(pct=>(
                <span key={pct} className="text-[8px] text-white/20 font-display w-6 text-right">
                  {pct===0 ? '0' : fmtMin(Math.round(maxMinutes*pct/100))}
                </span>
              ))}
            </div>

            {/* Bars area */}
            <div className="ml-7 relative">
              {/* Horizontal grid lines */}
              {[0,25,50,75,100].map(pct=>(
                <div key={pct} className="absolute left-0 right-0 border-t border-white/5 pointer-events-none"
                  style={{bottom:`${(pct/100)*100}%`, bottom:`calc(${pct}% + 20px)`}}/>
              ))}

              {/* Goal line */}
              {goalMinutes>0 && (
                <div className="absolute left-0 right-0 pointer-events-none z-10"
                  style={{bottom:`calc(${(goalMinutes/maxMinutes)*100}% + 20px)`}}>
                  <div className="border-t-2 border-dashed border-accent-500/50"/>
                  <span className="absolute right-0 -top-4 text-[8px] text-accent-400/70 font-display bg-surface-800 px-1">
                    {isBn?'লক্ষ্য':'Goal'}
                  </span>
                </div>
              )}

              {/* Bars */}
              <div className="flex items-end gap-1 h-32">
                {data.map((d,i)=>{
                  const heightPct = (d.minutes/maxMinutes)*100
                  const metGoal   = d.minutes>=goalMinutes && d.minutes>0
                  const isSel     = selected===i

                  return (
                    <div key={d.date} className="flex-1 flex flex-col items-center gap-1 cursor-pointer group"
                      onClick={()=>setSelected(isSel?null:i)}>
                      <div className="w-full relative flex items-end" style={{height:'100%'}}>
                        {/* Bar */}
                        {d.minutes>0 ? (
                          <div className="w-full rounded-t-lg transition-all duration-300 relative overflow-hidden"
                            style={{
                              height:`${Math.max(heightPct,3)}%`,
                              background: metGoal
                                ? 'linear-gradient(180deg,#4ade80,#16a34a)'
                                : 'linear-gradient(180deg,#38bdf8,#0284c7)',
                              boxShadow: isSel
                                ? metGoal
                                  ? '0 0 12px rgba(34,197,94,0.5)'
                                  : '0 0 12px rgba(14,165,233,0.5)'
                                : 'none',
                              opacity: isSel ? 1 : 0.85,
                            }}>
                            {/* Shine effect */}
                            <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent"/>
                          </div>
                        ) : (
                          <div className="w-full rounded-t-lg bg-white/5 border border-white/5"
                            style={{height:'4px'}}/>
                        )}
                      </div>
                      {/* X label */}
                      <span className={`text-[8px] font-display transition-colors leading-none ${
                        d.isToday ? 'text-brand-400 font-bold' :
                        isSel     ? 'text-white'               :
                        'text-white/30'
                      }`}>
                        {d.isToday ? (isBn?'আজ':'Now') : d.label}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Legend */}
          <div className="flex items-center justify-center gap-4 mt-4 pt-3 border-t border-white/5">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded bg-green-500"/>
              <span className={`text-[9px] text-white/40 ${isBn?'font-bengali':''}`}>{isBn?'লক্ষ্য পূরণ':'Goal met'}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded bg-brand-400"/>
              <span className={`text-[9px] text-white/40 ${isBn?'font-bengali':''}`}>{isBn?'পড়েছি':'Studied'}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded bg-white/10 border border-white/10"/>
              <span className={`text-[9px] text-white/40 ${isBn?'font-bengali':''}`}>{isBn?'পড়িনি':'No study'}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-0.5 border-t-2 border-dashed border-accent-500/60"/>
              <span className={`text-[9px] text-white/40 ${isBn?'font-bengali':''}`}>{isBn?'লক্ষ্য':'Goal'}</span>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
