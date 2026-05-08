import { useState, useEffect } from 'react'
import { collection, query, where, getDocs } from 'firebase/firestore'
import { db } from '../firebase/config'
import { useTranslation } from 'react-i18next'
import { format, subDays } from 'date-fns'
import { BarChart2, TrendingUp, TrendingDown, Minus } from 'lucide-react'

const PERIODS = [
  { key:'7d',  label:'7 Days',  labelBn:'৭ দিন',  days:7  },
  { key:'15d', label:'15 Days', labelBn:'১৫ দিন', days:15 },
  { key:'1m',  label:'1 Month', labelBn:'১ মাস',  days:30 },
]

function fmtMin(m) {
  const h = Math.floor(m/60), min = m%60
  if (h>0 && min>0) return `${h}h ${min}m`
  if (h>0) return `${h}h`
  if (min>0) return `${min}m`
  return '0m'
}

// Build array of date strings for the last N days including today
function buildDateRange(days) {
  const dates = []
  for (let i = days-1; i >= 0; i--) {
    dates.push(format(subDays(new Date(), i), 'yyyy-MM-dd'))
  }
  return dates
}

// Short label for x-axis
function getLabel(dateStr, days) {
  const d = new Date(dateStr + 'T12:00:00')
  if (days <= 7)  return format(d, 'EEE')
  if (days <= 15) return format(d, 'd MMM')
  return format(d, 'd')
}

export default function StudyGraph({ uid, goalMinutes }) {
  const { i18n } = useTranslation()
  const isBn = i18n.language === 'bn'

  const [period,   setPeriod]   = useState('7d')
  const [data,     setData]     = useState([])
  const [loading,  setLoading]  = useState(true)
  const [selected, setSelected] = useState(null)

  const days = PERIODS.find(p=>p.key===period)?.days || 7

  useEffect(() => { if (uid) fetchData() }, [uid, period])

  const fetchData = async () => {
    setLoading(true)
    setSelected(null)
    try {
      // Build the date range we care about
      const dateRange  = buildDateRange(days)
      const oldestDate = dateRange[0]           // e.g. '2026-05-02'
      const todayStr   = dateRange[dateRange.length - 1]  // e.g. '2026-05-09'

      console.log(`Fetching logs: userId=${uid}, date >= ${oldestDate}`)

      // Simple query — no orderBy, just filter by userId and date range
      const snap = await getDocs(query(
        collection(db, 'studyLogs'),
        where('userId', '==', uid),
        where('date', '>=', oldestDate),
        where('date', '<=', todayStr)
      ))

      console.log(`Found ${snap.size} log documents`)

      // Aggregate minutes per date
      const logMap = {}
      snap.docs.forEach(d => {
        const { date, minutes } = d.data()
        if (date && minutes > 0) {
          logMap[date] = (logMap[date] || 0) + minutes
        }
      })

      console.log('logMap:', logMap)

      // Build chart array — one entry per day
      const chart = dateRange.map(dateStr => ({
        date:     dateStr,
        minutes:  logMap[dateStr] || 0,
        label:    getLabel(dateStr, days),
        fullDate: format(new Date(dateStr + 'T12:00:00'), 'EEE, dd MMM yyyy'),
        isToday:  dateStr === todayStr,
      }))

      console.log('Chart data:', chart.map(c => `${c.date}:${c.minutes}m`).join(', '))
      setData(chart)
    } catch (err) {
      console.error('StudyGraph error:', err)
    } finally {
      setLoading(false)
    }
  }

  const totalMins   = data.reduce((s,d) => s + d.minutes, 0)
  const studyDays   = data.filter(d => d.minutes > 0).length
  const avgMins     = studyDays > 0 ? Math.round(totalMins / studyDays) : 0
  const goalMetDays = data.filter(d => d.minutes >= goalMinutes && d.minutes > 0).length
  const maxMinutes  = Math.max(...data.map(d => d.minutes), goalMinutes || 60, 60)

  // Trend
  const half   = Math.floor(data.length / 2)
  const first  = data.slice(0, half).reduce((s,d) => s+d.minutes, 0)
  const second = data.slice(half).reduce((s,d) => s+d.minutes, 0)
  const trend  = second > first ? 'up' : second < first ? 'down' : 'flat'

  const hasAnyData = data.some(d => d.minutes > 0)
  const sel = selected !== null ? data[selected] : null

  return (
    <div className="card mb-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 flex-wrap">
          <BarChart2 size={16} className="text-brand-400"/>
          <h3 className={`text-sm font-display font-semibold text-white/80 ${isBn?'font-bengali':''}`}>
            {isBn ? 'পড়ার বিশ্লেষণ' : 'Study Analysis'}
          </h3>
          {!loading && hasAnyData && (
            <span className={`flex items-center gap-0.5 text-[10px] font-display px-1.5 py-0.5 rounded-full ${
              trend==='up'   ? 'bg-green-500/15 text-green-400'  :
              trend==='down' ? 'bg-red-500/15   text-red-400'    :
              'bg-white/10 text-white/40'
            }`}>
              {trend==='up'   && <TrendingUp   size={9}/>}
              {trend==='down' && <TrendingDown  size={9}/>}
              {trend==='flat' && <Minus         size={9}/>}
              <span className="ml-0.5">
                {trend==='up'?'Improving':trend==='down'?'Declining':'Steady'}
              </span>
            </span>
          )}
        </div>

        {/* Period tabs */}
        <div className="flex bg-surface-700 rounded-lg p-0.5">
          {PERIODS.map(p => (
            <button key={p.key} onClick={()=>setPeriod(p.key)}
              className={`px-2 py-1 rounded-md text-[10px] font-display font-semibold transition-all ${
                period===p.key ? 'bg-brand-500 text-white' : 'text-white/40 hover:text-white/70'
              }`}>
              {isBn ? p.labelBn : p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Summary pills */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        {[
          { label:isBn?'মোট':'Total',     value:fmtMin(totalMins), color:'text-brand-400',  bg:'bg-brand-500/10'  },
          { label:isBn?'গড়/দিন':'Avg/Day', value:fmtMin(avgMins),   color:'text-accent-400', bg:'bg-accent-500/10' },
          { label:isBn?'লক্ষ্য পূরণ':'Goal Met', value:`${goalMetDays}d`, color:'text-green-400', bg:'bg-green-500/10' },
        ].map(({label,value,color,bg})=>(
          <div key={label} className={`${bg} rounded-xl py-3 px-2 text-center`}>
            <p className={`font-display font-bold text-sm ${color}`}>{value}</p>
            <p className={`text-[9px] text-white/40 mt-0.5 ${isBn?'font-bengali':''}`}>{label}</p>
          </div>
        ))}
      </div>

      {/* Chart */}
      {loading ? (
        <div className="h-40 rounded-xl shimmer"/>
      ) : !hasAnyData ? (
        <div className="h-40 flex flex-col items-center justify-center">
          <BarChart2 size={32} className="text-white/10 mb-2"/>
          <p className={`text-white/30 text-xs ${isBn?'font-bengali':''}`}>
            {isBn?'এই সময়ে কোনো ডেটা নেই':'No study data in this period'}
          </p>
          <p className="text-white/20 text-[10px] mt-1 font-display">
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
                <span className={`font-display font-bold text-sm ${
                  sel.minutes >= goalMinutes && sel.minutes > 0 ? 'text-green-400' : 'text-brand-400'
                }`}>
                  {fmtMin(sel.minutes)}
                </span>
                {sel.minutes === 0 && <span className="text-white/30 text-xs">{isBn?'পড়িনি':'no study'}</span>}
                {sel.minutes >= goalMinutes && sel.minutes > 0 && (
                  <span className="text-green-400 text-xs font-display">✓ Goal</span>
                )}
              </div>
            </div>
          )}

          {/* Bars with Y-axis */}
          <div className="flex gap-2">
            {/* Y-axis */}
            <div className="flex flex-col justify-between pb-5 w-8 flex-shrink-0">
              {[maxMinutes, Math.round(maxMinutes/2), 0].map((v,i)=>(
                <span key={i} className="text-[8px] text-white/25 font-display text-right w-full">
                  {v===0 ? '0' : fmtMin(v)}
                </span>
              ))}
            </div>

            {/* Chart area */}
            <div className="flex-1 relative">
              {/* Goal line */}
              {goalMinutes > 0 && goalMinutes <= maxMinutes && (
                <div className="absolute left-0 right-0 z-10 pointer-events-none"
                  style={{bottom:`calc(${(goalMinutes/maxMinutes)*90}% + 20px)`}}>
                  <div className="border-t-2 border-dashed border-accent-400/50 relative">
                    <span className="absolute -top-4 right-0 text-[8px] text-accent-400/60 font-display bg-surface-800/80 px-1 rounded">
                      {isBn?'লক্ষ্য':'Goal'}
                    </span>
                  </div>
                </div>
              )}

              {/* Horizontal grid */}
              {[25,50,75].map(pct=>(
                <div key={pct} className="absolute left-0 right-0 border-t border-white/5 pointer-events-none"
                  style={{bottom:`calc(${pct*0.9}% + 20px)`}}/>
              ))}

              {/* Bars */}
              <div className="flex items-end gap-1 h-36">
                {data.map((d,i) => {
                  const pct    = maxMinutes > 0 ? (d.minutes/maxMinutes)*90 : 0
                  const metGoal = d.minutes >= goalMinutes && d.minutes > 0
                  const isSel  = selected === i

                  return (
                    <div key={d.date}
                      className="flex-1 flex flex-col items-center gap-1 cursor-pointer"
                      onClick={()=>setSelected(isSel ? null : i)}>

                      {/* Bar wrapper */}
                      <div className="w-full flex items-end justify-center" style={{height:'115px'}}>
                        {d.minutes > 0 ? (
                          <div
                            className="w-full rounded-t-lg transition-all duration-500 relative overflow-hidden"
                            style={{
                              height: `${Math.max(pct, 4)}%`,
                              background: metGoal
                                ? 'linear-gradient(180deg,#4ade80,#16a34a)'
                                : 'linear-gradient(180deg,#38bdf8,#0369a1)',
                              boxShadow: isSel
                                ? metGoal
                                  ? '0 0 10px rgba(34,197,94,0.6)'
                                  : '0 0 10px rgba(14,165,233,0.6)'
                                : 'none',
                              opacity: selected !== null && !isSel ? 0.5 : 1,
                            }}>
                            {/* Shine */}
                            <div className="absolute inset-0 bg-gradient-to-r from-white/15 to-transparent pointer-events-none"/>
                          </div>
                        ) : (
                          <div className="w-full rounded-t bg-white/5 border-t border-white/8" style={{height:'3px'}}/>
                        )}
                      </div>

                      {/* Label */}
                      <span className={`text-[8px] font-display leading-none transition-colors ${
                        d.isToday   ? 'text-brand-400 font-bold' :
                        isSel       ? 'text-white'               :
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
          <div className="flex items-center justify-center gap-4 mt-3 pt-3 border-t border-white/5">
            {[
              { color:'bg-green-500', label:isBn?'লক্ষ্য পূরণ':'Goal met' },
              { color:'bg-brand-400', label:isBn?'পড়েছি':'Studied'         },
              { color:'bg-white/10',  label:isBn?'পড়িনি':'No study'        },
            ].map(({color,label})=>(
              <div key={label} className="flex items-center gap-1.5">
                <div className={`w-2.5 h-2.5 rounded ${color}`}/>
                <span className={`text-[9px] text-white/40 ${isBn?'font-bengali':''}`}>{label}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
