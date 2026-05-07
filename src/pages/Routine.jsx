import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import BottomNav from '../components/BottomNav'
import { BookOpen, ZoomIn, X } from 'lucide-react'

// Exam routine images from imgbb
const ROUTINES = {
  science:  'https://i.ibb.co/zMJ9qYL',
  commerce: 'https://i.ibb.co/chq6VBw8',
  arts:     'https://i.ibb.co/xZbPMrQ',
}

const GROUPS = ['science', 'arts', 'commerce']

export default function Routine() {
  const { t, i18n } = useTranslation()
  const isBn = i18n.language === 'bn'
  const [activeGroup, setActiveGroup] = useState('science')
  const [zoomed, setZoomed] = useState(false)
  const [imgError, setImgError] = useState(false)

  const routineUrl = ROUTINES[activeGroup]

  const handleGroupChange = (g) => {
    setActiveGroup(g)
    setImgError(false)
  }

  return (
    <div className="min-h-screen bg-surface-900">
      <div className="page-container pt-6">

        {/* Header */}
        <div className="mb-5">
          <div className="flex items-center gap-2 mb-1">
            <BookOpen size={20} className="text-brand-400" />
            <h1 className={`text-xl font-display font-bold text-white ${isBn ? 'font-bengali' : ''}`}>
              {t('routine.title')}
            </h1>
          </div>
          <p className={`text-white/40 text-xs ${isBn ? 'font-bengali' : ''}`}>
            {t('routine.subtitle')}
          </p>
        </div>

        {/* Group tabs */}
        <div className="grid grid-cols-3 gap-2 mb-5">
          {GROUPS.map(g => {
            const icons = { science: '🔬', arts: '🎨', commerce: '💼' }
            return (
              <button
                key={g}
                onClick={() => handleGroupChange(g)}
                className={`flex flex-col items-center py-3 rounded-xl border transition-all duration-200 ${
                  activeGroup === g
                    ? 'bg-brand-500/20 border-brand-500/40 text-brand-400'
                    : 'bg-surface-800 border-white/5 text-white/50 hover:text-white'
                }`}
              >
                <span className="text-xl mb-1">{icons[g]}</span>
                <span className={`text-xs font-display font-medium ${isBn ? 'font-bengali text-[10px]' : ''}`}>
                  {t(`routine.${g}`)}
                </span>
              </button>
            )
          })}
        </div>

        {/* Routine image */}
        <div className="card relative">
          {!imgError ? (
            <>
              <img
                src={routineUrl}
                alt={`${activeGroup} routine`}
                className="w-full rounded-xl object-contain cursor-zoom-in"
                onClick={() => setZoomed(true)}
                onError={() => setImgError(true)}
              />
              <button
                onClick={() => setZoomed(true)}
                className="absolute top-7 right-7 bg-black/60 backdrop-blur-sm rounded-lg p-2 text-white/70 hover:text-white"
              >
                <ZoomIn size={16} />
              </button>
              <p className={`text-white/30 text-[10px] text-center mt-3 font-display ${isBn ? 'font-bengali' : ''}`}>
                {isBn ? 'ছবিতে ট্যাপ করো জুম করতে' : 'Tap image to zoom'}
              </p>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-16 h-16 bg-surface-700 rounded-2xl flex items-center justify-center text-3xl mb-4">📋</div>
              <p className={`text-white/40 text-sm ${isBn ? 'font-bengali' : ''}`}>
                {t('routine.coming_soon')}
              </p>
            </div>
          )}
        </div>

        {/* Exam date note */}
        <div className="mt-4 p-3 bg-brand-500/10 border border-brand-500/20 rounded-xl">
          <p className={`text-brand-300 text-xs leading-relaxed ${isBn ? 'font-bengali' : ''}`}>
            📅 {isBn
              ? 'এইচএসসি পরীক্ষা শুরু: ০২ জুলাই ২০২৬ — প্রতিটি বিষয় মনোযোগ দিয়ে পড়ো!'
              : 'HSC Exam starts: 02 July 2026 — Study each subject carefully!'}
          </p>
        </div>

        <div className="h-4" />
      </div>

      {/* Zoom modal */}
      {zoomed && !imgError && (
        <div
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-2"
          onClick={() => setZoomed(false)}
        >
          <button
            className="absolute top-4 right-4 bg-white/10 rounded-full p-2.5 text-white z-10"
            onClick={() => setZoomed(false)}
          >
            <X size={20} />
          </button>
          <img
            src={routineUrl}
            alt="routine zoomed"
            className="max-w-full max-h-full object-contain rounded-xl"
            onClick={e => e.stopPropagation()}
          />
        </div>
      )}

      <BottomNav />
    </div>
  )
}
