import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'

// HSC First exam: 2 July 2026 at 10:00 AM Bangladesh Time (UTC+6)
const EXAM_DATE = new Date('2026-07-02T10:00:00+06:00')

function getTimeLeft() {
  const diff = EXAM_DATE - new Date()
  if (diff <= 0) return { days:0, hours:0, minutes:0, seconds:0, over:true }
  return {
    days:    Math.floor(diff / (1000*60*60*24)),
    hours:   Math.floor((diff % (1000*60*60*24)) / (1000*60*60)),
    minutes: Math.floor((diff % (1000*60*60)) / (1000*60)),
    seconds: Math.floor((diff % (1000*60)) / 1000),
    over:    false,
  }
}

export default function CountdownBanner() {
  const { t, i18n } = useTranslation()
  const isBn = i18n.language === 'bn'
  const [time, setTime] = useState(getTimeLeft())

  useEffect(() => {
    const id = setInterval(() => setTime(getTimeLeft()), 1000)
    return () => clearInterval(id)
  }, [])

  const color = time.days > 90
    ? 'from-brand-500 to-brand-600'
    : time.days > 30
    ? 'from-yellow-500 to-orange-500'
    : 'from-red-500 to-rose-600'

  const units = [
    { label: t('countdown.days'),    value: time.days    },
    { label: t('countdown.hours'),   value: time.hours   },
    { label: t('countdown.minutes'), value: time.minutes },
    { label: t('countdown.seconds'), value: time.seconds },
  ]

  if (time.over) {
    return (
      <div className="rounded-2xl bg-green-500/20 border border-green-500/30 p-4 mb-4 text-center">
        <p className="text-green-400 font-display font-bold text-lg">🎓 HSC Exam Has Started!</p>
        <p className="text-green-300/60 text-xs mt-1">Best of luck to all candidates!</p>
      </div>
    )
  }

  return (
    <div className={`relative rounded-2xl overflow-hidden bg-gradient-to-r ${color} p-0.5 mb-4`}>
      <div className="bg-surface-800 rounded-[14px] p-4">
        <p className={`text-white/50 text-xs text-center mb-3 font-display ${isBn?'font-bengali':''}`}>
          🎓 {t('countdown.left')}
        </p>
        <div className="grid grid-cols-4 gap-2">
          {units.map(({ label, value }) => (
            <div key={label} className="text-center">
              <div className={`bg-gradient-to-br ${color} rounded-xl py-2.5 px-1 mb-1.5 shadow-lg`}>
                <span className="text-white font-display font-bold text-2xl tabular-nums leading-none">
                  {String(value).padStart(2, '0')}
                </span>
              </div>
              <span className={`text-white/50 text-[10px] font-display ${isBn?'font-bengali':''}`}>
                {label}
              </span>
            </div>
          ))}
        </div>
        <p className="text-center text-white/25 text-[10px] mt-2 font-display">
          02 July 2026 • 10:00 AM
        </p>
      </div>
    </div>
  )
}
