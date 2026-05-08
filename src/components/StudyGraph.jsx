import { useState, useEffect } from 'react'
import { collection, query, where, getDocs } from 'firebase/firestore'
import { db } from '../firebase/config'
import { useTranslation } from 'react-i18next'
import { format, subDays, eachDayOfInterval, parseISO } from 'date-fns'
import { BarChart2 } from 'lucide-react'

const PERIODS = [
  { key: '7d',  label: '7 Days',  labelBn: '৭ দিন',  days: 7  },
  { key: '15d', label: '15 Days', labelBn: '১৫ দিন', days: 15 },
  { key: '1m',  label: '1 Month', labelBn: '১ মাস',  days: 30 },
]

function fmtMin(m) {
  const h = Math.floor(m / 60), min = m % 60
  if (h > 0 && min > 0) return `${h}h ${min}m`
  if (h > 0) return `${h}h`
  if (min > 0) return `${min}m`
  return '0'
}

export default function StudyGraph({ uid, goalMinutes }) {
  const { t, i18n } = useTranslation()
  const isBn = i18n.language === 'bn'

  const [period,   setPeriod]   = useState('7d')
  const [data,     setData]     = useState([])
  const [loading,  setLoading]  = useState(true)
  const [selected, setSelected] = useState(null) // selected bar index

  const days = PERIODS.find(p => p.key === period)?.days || 7

  useEffect(() => {
    if (uid) fetchData()
  }, [uid, period])

  const fetchData = async () => {
    setLoading(true)
    setSelected(null)
    try {
      const today    = new Date()
      const fromDate = subDays(today, days - 1)
      const fromStr  = format(fromDate, 'yyyy-MM-dd')

      const snap = await getDocs(query(
        collection(db, 'studyLogs'),
        where('userId', '==', uid),
        where('date', '>=', fromStr)
      ))

      // Build a map date→minutes
      const logMap = {}
      snap.docs.forEach(d => {
        const { date, minutes } = d.data()
        if (date && minutes) logMap[date] = (logMap[date] || 0) + minutes
      })

      // Fill every day in range even if 0
      const allDays = eachDayOfInterval({ start: fromDate, end: today })
      const chartData = allDays.map(day => {
        const dateStr = format(day, 'yyyy-MM-dd')
        return {
          date:    dateStr,
          minutes: logMap[dateStr] || 0,
          label:   days <= 7
            ? format(day, 'EEE')   // Mon, Tue...
            : days <= 15
            ? format(day, 'd MMM') // 1 May
            : format(day, 'd'),    // 1, 2, 3...
          fullDate: format(day, 'dd MMM yyyy'),
        }
      })

      setData(chartData)
    } catch (err) {
      console.error('StudyGraph fetch:', err)
    } finally {
      setLoading(false)
    }
  }

  const maxMinutes = Math.max(...data.map(d => d.minutes), goalMinutes, 60)
  const totalMins  = data.reduce((s, d) => s + d.minutes, 0)
  const studyDays  = data.filter(d => d.minutes > 0).length
  const avgMins    = studyDays > 0 ? Math.round(totalMins / studyDays) : 0
  const goalMet    = data.filter(d => d.minutes >= goalMinutes).length

  return (
    <div className="card mb-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <BarChart2 size={16} className="text-brand-400" />
          <h3 className={`text-sm font-display font-semibold text-white/80 ${isBn?'font-bengali':''}`}>
            {isBn ? 'পড়ার গ্রাফ' : 'Study Graph'}
          </h3>
        </div>
        {/* Period selector */}
        <div className="flex bg-surface-700 rounded-lg p-0.5 gap-0.5">
          {PERIODS.map(p => (
            <button key={p.key} onClick={() => setPeriod(p.key)}
              className={`px-2.5 py-1 rounded-md text-[10px] font-display font-semibold transition-all ${
                period === p.key
                  ? 'bg-brand-500 text-white shadow'
                  : 'text-white/40 hover:text-white/70'
              }`}>
              {isBn ? p.labelBn : p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        {[
          { label: isBn ? 'মোট' : 'Total',    value: fmtMin(totalMins), color: 'text-brand-400'  },
          { label: isBn ? 'গড়'  : 'Avg/Day',  value: fmtMin(avgMins),   color: 'text-accent-400' },
          { label: isBn ? 'লক্ষ্য পূরণ' : 'Goal Met', value: `${goalMet}d`,   color: 'text-green-400'  },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-surface-700 rounded-xl py-2.5 px-2 text-center">
            <p className={`text-[9px] text-white/40 mb-0.5 ${isBn?'font-bengali':''}`}>{label}</p>
            <p className={`font-display font-bold text-sm ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Bar chart */}
      {loading ? (
        <div className="h-32 rounded-xl shimmer" />
      ) : (
        <>
          {/* Tooltip for selected bar */}
          {selected !== null && data[selected] && (
            <div className="mb-3 text-center">
              <span className="inline-block bg-surface-600 border border-white/10 rounded-lg px-3 py-1.5 text-xs font-display">
                <span className="text-white/50">{data[selected].fullDate}  </span>
                <span className={data[selected].minutes >= goalMinutes ? 'text-green-400 font-bold' : 'text-brand-400 font-bold'}>
                  {fmtMin(data[selected].minutes)}
                </span>
                {data[selected].minutes === 0 && (
                  <span className="text-white/30 ml-1">{isBn ? '(পড়া হয়নি)' : '(no study)'}</span>
                )}
                {data[selected].minutes >= goalMinutes && (
                  <span className="text-green-400 ml-1">✓</span>
                )}
              </span>
            </div>
          )}

          {/* Bars */}
          <div className="flex items-end justify-between gap-1 h-32 relative">
            {/* Goal line */}
            {goalMinutes > 0 && (
              <div
                className="absolute left-0 right-0 border-t border-dashed border-accent-500/40 z-10 pointer-events-none"
                style={{ bottom: `${(goalMinutes / maxMinutes) * 100}%` }}
              >
                <span className="absolute right-0 -top-4 text-[8px] text-accent-400/60 font-display">
                  {isBn ? 'লক্ষ্য' : 'Goal'}
                </span>
              </div>
            )}

            {data.map((d, i) => {
              const heightPct = maxMinutes > 0 ? (d.minutes / maxMinutes) * 100 : 0
              const metGoal   = d.minutes >= goalMinutes && d.minutes > 0
              const isToday   = d.date === format(new Date(), 'yyyy-MM-dd')
              const isSel     = selected === i

              return (
                <div key={d.date} className="flex-1 flex flex-col items-center gap-1 cursor-pointer"
                  onClick={() => setSelected(isSel ? null : i)}>
                  {/* Bar */}
                  <div className="w-full flex items-end justify-center" style={{ height: '100%' }}>
                    <div
                      className="w-full rounded-t-md transition-all duration-300 relative"
                      style={{
                        height: d.minutes > 0 ? `${Math.max(heightPct, 3)}%` : '3%',
                        background: d.minutes === 0
                          ? 'rgba(255,255,255,0.05)'
                          : metGoal
                          ? (isSel ? 'linear-gradient(180deg,#4ade80,#22c55e)' : 'linear-gradient(180deg,#22c55e,#16a34a)')
                          : (isSel ? 'linear-gradient(180deg,#60c5ff,#0ea5e9)' : 'linear-gradient(180deg,#0ea5e9,#0284c7)'),
                        boxShadow: isSel
                          ? metGoal ? '0 0 8px rgba(34,197,94,0.6)' : '0 0 8px rgba(14,165,233,0.6)'
                          : 'none',
                        opacity: d.minutes === 0 ? 0.4 : 1,
                      }}
                    />
                  </div>
                  {/* Label */}
                  <span className={`text-[8px] font-display transition-colors ${
                    isToday ? 'text-brand-400 font-bold' :
                    isSel   ? 'text-white' :
                    'text-white/30'
                  }`}>
                    {isToday ? (isBn ? 'আজ' : 'Now') : d.label}
                  </span>
                </div>
              )
            })}
          </div>

          {/* Legend */}
          <div className="flex items-center justify-center gap-4 mt-3">
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-sm bg-green-500" />
              <span className={`text-[9px] text-white/40 ${isBn?'font-bengali':''}`}>
                {isBn ? 'লক্ষ্য পূরণ' : 'Goal met'}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-sm bg-brand-500" />
              <span className={`text-[9px] text-white/40 ${isBn?'font-bengali':''}`}>
                {isBn ? 'পড়েছি' : 'Studied'}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-sm bg-white/10" />
              <span className={`text-[9px] text-white/40 ${isBn?'font-bengali':''}`}>
                {isBn ? 'পড়িনি' : 'No study'}
              </span>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
