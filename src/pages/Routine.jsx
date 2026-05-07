import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import BottomNav from '../components/BottomNav'
import { BookOpen, ZoomIn, X, ExternalLink } from 'lucide-react'

// imgbb viewer page links (user provided)
// To get direct image links: open each link → long press image → Copy image address
const ROUTINES = {
  science:  { page: 'https://ibb.co/zMJ9qYL',  direct: 'https://i.ibb.co/zMJ9qYL/image.jpg'  },
  commerce: { page: 'https://ibb.co/chq6VBw8', direct: 'https://i.ibb.co/chq6VBw8/image.jpg' },
  arts:     { page: 'https://ibb.co/xZbPMrQ',  direct: 'https://i.ibb.co/xZbPMrQ/image.jpg'  },
}

const GROUPS = ['science', 'arts', 'commerce']

export default function Routine() {
  const { t, i18n } = useTranslation()
  const isBn = i18n.language === 'bn'
  const [activeGroup, setActiveGroup] = useState('science')
  const [zoomed, setZoomed] = useState(false)
  const [imgLoaded, setImgLoaded] = useState({})
  const [imgError, setImgError] = useState({})

  const routine = ROUTINES[activeGroup]
  const hasError = imgError[activeGroup]
  const isLoaded = imgLoaded[activeGroup]

  return (
    <div className="min-h-screen bg-surface-900">
      <div className="page-container pt-6">

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
            const icons = { science:'🔬', arts:'🎨', commerce:'💼' }
            return (
              <button key={g} onClick={() => setActiveGroup(g)}
                className={`flex flex-col items-center py-3 rounded-xl border transition-all duration-200 ${
                  activeGroup === g
                    ? 'bg-brand-500/20 border-brand-500/40 text-brand-400'
                    : 'bg-surface-800 border-white/5 text-white/50 hover:text-white'
                }`}>
                <span className="text-xl mb-1">{icons[g]}</span>
                <span className={`text-xs font-display font-medium ${isBn ? 'font-bengali text-[10px]' : ''}`}>
                  {t(`routine.${g}`)}
                </span>
              </button>
            )
          })}
        </div>

        {/* Image card */}
        <div className="card relative overflow-hidden">
          {/* Loading skeleton */}
          {!isLoaded && !hasError && (
            <div className="w-full h-64 rounded-xl shimmer flex items-center justify-center">
              <p className="text-white/20 text-xs">Loading routine...</p>
            </div>
          )}

          {/* Image */}
          {!hasError && (
            <img
              src={routine.direct}
              alt={`${activeGroup} exam routine`}
              className={`w-full rounded-xl object-contain cursor-zoom-in transition-opacity duration-300 ${isLoaded ? 'opacity-100' : 'opacity-0 absolute'}`}
              onClick={() => setZoomed(true)}
              onLoad={() => setImgLoaded(p => ({ ...p, [activeGroup]: true }))}
              onError={() => setImgError(p => ({ ...p, [activeGroup]: true }))}
            />
          )}

          {/* Zoom button */}
          {isLoaded && !hasError && (
            <button onClick={() => setZoomed(true)}
              className="absolute top-7 right-7 bg-black/60 backdrop-blur-sm rounded-lg p-2 text-white/70 hover:text-white">
              <ZoomIn size={16} />
            </button>
          )}

          {/* Error fallback */}
          {hasError && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="text-5xl mb-4">📋</div>
              <p className={`text-white/60 text-sm mb-2 ${isBn ? 'font-bengali' : ''}`}>
                {isBn ? 'ছবি সরাসরি লোড হচ্ছে না' : "Image couldn't load directly"}
              </p>
              <p className={`text-white/30 text-xs mb-5 ${isBn ? 'font-bengali' : ''}`}>
                {isBn ? 'নিচের বাটনে ট্যাপ করে দেখো' : 'Tap below to view in browser'}
              </p>
              <a href={routine.page} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 btn-primary text-sm py-2.5 px-6">
                <ExternalLink size={14} />
                <span className={isBn ? 'font-bengali' : ''}>{isBn ? 'রুটিন দেখো' : 'View Routine'}</span>
              </a>
            </div>
          )}

          {isLoaded && !hasError && (
            <p className="text-white/20 text-[10px] text-center mt-2 font-display">
              {isBn ? 'ছবিতে ট্যাপ করো জুম করতে' : 'Tap image to zoom'}
            </p>
          )}
        </div>

        {/* Open in browser option */}
        {!hasError && (
          <a href={routine.page} target="_blank" rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 mt-3 text-white/30 hover:text-white/60 text-xs font-display transition-colors">
            <ExternalLink size={11} />
            {isBn ? 'ব্রাউজারে খোলো' : 'Open in browser'}
          </a>
        )}

        <div className="mt-4 p-3 bg-brand-500/10 border border-brand-500/20 rounded-xl">
          <p className={`text-brand-300 text-xs leading-relaxed ${isBn ? 'font-bengali' : ''}`}>
            📅 {isBn
              ? 'এইচএসসি পরীক্ষা শুরু: ০২ জুলাই ২০২৬ — প্রতিটি বিষয় মনোযোগ দিয়ে পড়ো!'
              : 'HSC Exam starts: 02 July 2026 — Study every subject carefully!'}
          </p>
        </div>
        <div className="h-4" />
      </div>

      {/* Zoom modal */}
      {zoomed && !hasError && (
        <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-2 overflow-auto"
          onClick={() => setZoomed(false)}>
          <button className="fixed top-4 right-4 bg-white/10 rounded-full p-2.5 text-white z-10"
            onClick={() => setZoomed(false)}>
            <X size={20} />
          </button>
          <img src={routine.direct} alt="routine zoomed"
            className="max-w-full object-contain rounded-xl"
            onClick={e => e.stopPropagation()} />
        </div>
      )}
      <BottomNav />
    </div>
  )
}
