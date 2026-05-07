import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'

// HSC Exam date: 2 July 2026
const EXAM_DATE = new Date('2026-07-02T00:00:00+06:00')

function getTimeLeft() {
  const now = new Date()
  const diff = EXAM_DATE - now
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, over: true }
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
  const seconds = Math.floor((diff % (1000 * 60)) / 1000)
  return { days, hours, minutes, seconds, over: false }
}

export default function CountdownBanner() {
  const { t, i18n } = useTranslation()
  const isBn = i18n.language === 'bn'
  const [time, setTime] = useState(getTimeLeft())

  useEffect(() => {
    const interval = setInterval(() => setTime(getTimeLeft()), 1000)
    return () => clearInterval(interval)
  }, [])

  const units = [
    { label: t('countdown.days'), value: time.days },
    { label: t('countdown.hours'), value: time.hours },
    { label: t('countdown.minutes'), value: time.minutes },
    { label: t('countdown.seconds'), value: time.seconds },
  ]

  // Color urgency based on days left
  const urgencyColor = time.days > 90
    ? 'from-brand-500 to-brand-600'
    : time.days > 30
    ? 'from-yellow-500 to-orange-500'
    : 'from-red-500 to-rose-600'

  return (
    <div className={`relative rounded-2xl overflow-hidden bg-gradient-to-r ${urgencyColor} p-0.5 mb-4`}>
      <div className="bg-surface-800 rounded-[14px] p-4">
        <p className={`text-white/60 text-xs text-center mb-3 font-display ${isBn ? 'font-bengali' : ''}`}>
          🎓 {t('countdown.left')}
        </p>
        <div className="grid grid-cols-4 gap-2">
          {units.map(({ label, value }) => (
            <div key={label} className="text-center">
              <div className={`bg-gradient-to-br ${urgencyColor} rounded-xl py-2.5 px-1 mb-1.5 shadow-lg`}>
                <span className="text-white font-display font-bold text-2xl tabular-nums leading-none">
                  {String(value).padStart(2, '0')}
                </span>
              </div>
              <span className={`text-white/50 text-[10px] font-display ${isBn ? 'font-bengali' : ''}`}>
                {label}
              </span>
            </div>
          ))}
        </div>
        <p className="text-center text-white/30 text-[10px] mt-2 font-display">
          02 July 2026
        </p>
      </div>
    </div>
  )
}
