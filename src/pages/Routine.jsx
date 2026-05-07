import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import BottomNav from '../components/BottomNav'
import { BookOpen, ZoomIn, X } from 'lucide-react'

const ROUTINES = {
  science:  'https://i.ibb.co/qFBq2jJk/file-00000000a97871faa79181a29aee85bc.png',
  arts:     'https://i.ibb.co/JjSJxfDW/HSC-Routine-2026-1.jpg',
  commerce: 'https://i.ibb.co/q3vtwCCV/file-0000000032f07206a48e968de4b29cec.png',
}

const GROUPS = ['science', 'arts', 'commerce']

export default function Routine() {
  const { t, i18n } = useTranslation()
  const isBn = i18n.language === 'bn'
  const [activeGroup, setActiveGroup] = useState('science')
  const [zoomed, setZoomed] = useState(false)
  const [imgError, setImgError] = useState({})
  const [imgLoaded, setImgLoaded] = useState({})

  const url = ROUTINES[activeGroup]
  const hasError = imgError[activeGroup]
  const isLoaded = imgLoaded[activeGroup]

  return (
    <div className="min-h-screen bg-surface-900">
      <div className="page-container pt-6">
        <div className="mb-5 pr-16">
          <div className="flex items-center gap-2 mb-1">
            <BookOpen size={20} className="text-brand-400" />
            <h1 className={`text-xl font-display font-bold text-white ${isBn ? 'font-bengali' : ''}`}>
              {t('routine.title')}
            </h1>
          </div>
          <p className={`text-white/40 text-xs ${isBn ? 'font-bengali' : ''}`}>{t('routine.subtitle')}</p>
        </div>

        {/* Group tabs */}
        <div className="grid grid-cols-3 gap-2 mb-5">
          {GROUPS.map(g => {
            const icons = { science:'🔬', arts:'🎨', commerce:'💼' }
            return (
              <button key={g} onClick={() => setActiveGroup(g)}
                className={`flex flex-col items-center py-3 rounded-xl border transition-all ${
                  activeGroup === g
                    ? 'bg-brand-500/20 border-brand-500/40 text-brand-400'
                    : 'bg-surface-800 border-white/5 text-white/50'
                }`}>
                <span className="text-xl mb-1">{icons[g]}</span>
                <span className={`text-xs font-display font-medium ${isBn ? 'font-bengali text-[10px]' : ''}`}>
                  {t(`routine.${g}`)}
                </span>
              </button>
            )
          })}
        </div>

        {/* Image */}
        <div className="card relative">
          {!isLoaded && !hasError && (
            <div className="w-full h-64 rounded-xl shimmer flex items-center justify-center">
              <p className="text-white/30 text-xs font-display">Loading routine...</p>
            </div>
          )}

          {!hasError && (
            <img
              key={activeGroup}
              src={url}
              alt={`${activeGroup} routine`}
              className={`w-full rounded-xl object-contain cursor-zoom-in transition-opacity duration-300 ${isLoaded ? 'opacity-100' : 'opacity-0 h-0'}`}
              onClick={() => setZoomed(true)}
              onLoad={() => setImgLoaded(p => ({ ...p, [activeGroup]: true }))}
              onError={() => setImgError(p => ({ ...p, [activeGroup]: true }))}
            />
          )}

          {isLoaded && !hasError && (
            <>
              <button onClick={() => setZoomed(true)}
                className="absolute top-7 right-7 bg-black/60 backdrop-blur-sm rounded-lg p-2 text-white/70">
                <ZoomIn size={16} />
              </button>
              <p className="text-white/20 text-[10px] text-center mt-2 font-display">
                {isBn ? 'ট্যাপ করো জুম করতে' : 'Tap to zoom'}
              </p>
            </>
          )}

          {hasError && (
            <div className="flex flex-col items-center py-12 text-center">
              <div className="text-5xl mb-4">📋</div>
              <p className="text-white/40 text-sm mb-1">
                {isBn ? 'ছবি লোড হয়নি' : 'Image failed to load'}
              </p>
              <p className="text-white/20 text-xs">{url}</p>
            </div>
          )}
        </div>

        <div className="mt-4 p-3 bg-brand-500/10 border border-brand-500/20 rounded-xl">
          <p className={`text-brand-300 text-xs leading-relaxed ${isBn ? 'font-bengali' : ''}`}>
            📅 {isBn ? 'এইচএসসি পরীক্ষা শুরু: ০২ জুলাই ২০২৬' : 'HSC Exam starts: 02 July 2026'}
          </p>
        </div>
        <div className="h-4" />
      </div>

      {zoomed && !hasError && (
        <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-2 overflow-auto"
          onClick={() => setZoomed(false)}>
          <button className="fixed top-4 right-4 bg-white/10 rounded-full p-2.5 text-white z-10"
            onClick={() => setZoomed(false)}>
            <X size={20} />
          </button>
          <img src={url} alt="zoomed" className="max-w-full object-contain rounded-xl"
            onClick={e => e.stopPropagation()} />
        </div>
      )}
      <BottomNav />
    </div>
  )
}
