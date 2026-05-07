import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import BottomNav from '../components/BottomNav'
import { BookOpen, ZoomIn, X } from 'lucide-react'

// Routine images — replace these URLs with Firebase Storage URLs after upload
// For now shows placeholder until images are uploaded
const ROUTINES = {
  science: null,   // e.g. 'https://firebasestorage.googleapis.com/...'
  arts: null,
  commerce: null,
}

const GROUPS = ['science', 'arts', 'commerce']

export default function Routine() {
  const { t, i18n } = useTranslation()
  const isBn = i18n.language === 'bn'
  const [activeGroup, setActiveGroup] = useState('science')
  const [zoomed, setZoomed] = useState(false)

  const routineUrl = ROUTINES[activeGroup]

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
                onClick={() => setActiveGroup(g)}
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
          {routineUrl ? (
            <>
              <img
                src={routineUrl}
                alt={`${activeGroup} routine`}
                className="w-full rounded-xl object-contain cursor-zoom-in"
                onClick={() => setZoomed(true)}
              />
              <button
                onClick={() => setZoomed(true)}
                className="absolute top-4 right-4 bg-black/50 backdrop-blur-sm rounded-lg p-2 text-white/70 hover:text-white"
              >
                <ZoomIn size={16} />
              </button>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-16 h-16 bg-surface-700 rounded-2xl flex items-center justify-center text-3xl mb-4">
                📋
              </div>
              <p className={`text-white/40 text-sm ${isBn ? 'font-bengali' : ''}`}>
                {t('routine.coming_soon')}
              </p>
              <p className="text-white/20 text-xs mt-2 font-display">
                {activeGroup.charAt(0).toUpperCase() + activeGroup.slice(1)} group routine
              </p>
            </div>
          )}
        </div>

        {/* Info note */}
        <div className="mt-4 p-3 bg-brand-500/10 border border-brand-500/20 rounded-xl">
          <p className={`text-brand-300 text-xs ${isBn ? 'font-bengali' : ''}`}>
            {isBn
              ? '📌 পরীক্ষার রুটিন শীঘ্রই আপলোড করা হবে। নিয়মিত চেক করো।'
              : '📌 Exam routines will be uploaded soon. Check back regularly.'}
          </p>
        </div>
      </div>

      {/* Zoom modal */}
      {zoomed && routineUrl && (
        <div
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4"
          onClick={() => setZoomed(false)}
        >
          <button
            className="absolute top-4 right-4 bg-white/10 rounded-full p-2 text-white"
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
