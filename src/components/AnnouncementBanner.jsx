import { useState, useEffect } from 'react'
import { collection, getDocs, orderBy, query, limit } from 'firebase/firestore'
import { db } from '../firebase/config'
import { useTranslation } from 'react-i18next'
import { Megaphone, X, ChevronDown, ChevronUp } from 'lucide-react'

export default function AnnouncementBanner() {
  const { i18n } = useTranslation()
  const isBn = i18n.language === 'bn'
  const [announcements, setAnnouncements] = useState([])
  const [dismissed,     setDismissed]     = useState([])
  const [expanded,      setExpanded]      = useState({})

  useEffect(() => {
    fetchAnnouncements()
    // Load dismissed list from localStorage
    const d = JSON.parse(localStorage.getItem('dismissed_announcements') || '[]')
    setDismissed(d)
  }, [])

  const fetchAnnouncements = async () => {
    try {
      const snap = await getDocs(query(
        collection(db, 'announcements'),
        limit(5)
      ))
      const items = snap.docs.map(d => ({ id: d.id, ...d.data() }))
      items.sort((a,b) => (b.createdAt?.seconds||0) - (a.createdAt?.seconds||0))
      setAnnouncements(items)
    } catch (err) {
      console.error('Announcements fetch error:', err)
    }
  }

  const dismiss = (id) => {
    const newDismissed = [...dismissed, id]
    setDismissed(newDismissed)
    localStorage.setItem('dismissed_announcements', JSON.stringify(newDismissed))
  }

  const toggleExpand = (id) => {
    setExpanded(prev => ({ ...prev, [id]: !prev[id] }))
  }

  const visible = announcements.filter(a => !dismissed.includes(a.id))
  if (visible.length === 0) return null

  return (
    <div className="space-y-2 mb-4">
      {visible.map(a => {
        const text    = isBn ? (a.text || a.textEn) : (a.textEn || a.text)
        const isLong  = text?.length > 100
        const isExpanded = expanded[a.id]
        const display = isLong && !isExpanded ? text?.slice(0, 100) + '...' : text

        return (
          <div key={a.id}
            className="relative bg-gradient-to-r from-brand-500/15 to-accent-500/10 border border-brand-500/25 rounded-2xl px-4 py-3 overflow-hidden">
            {/* Decorative dot */}
            <div className="absolute top-3 left-3 w-1.5 h-1.5 bg-brand-400 rounded-full animate-pulse-slow"/>

            <div className="flex items-start gap-3 pl-3">
              <Megaphone size={14} className="text-brand-400 flex-shrink-0 mt-0.5"/>
              <div className="flex-1 min-w-0">
                <p className="text-brand-300 text-[10px] font-display font-bold mb-1 uppercase tracking-wide">
                  📢 Admin Announcement
                </p>
                <p className={`text-white/80 text-xs leading-relaxed ${isBn ? 'font-bengali' : ''}`}>
                  {display}
                </p>
                {isLong && (
                  <button onClick={() => toggleExpand(a.id)}
                    className="flex items-center gap-1 text-brand-400/70 text-[10px] font-display mt-1 hover:text-brand-400 transition-colors">
                    {isExpanded ? <><ChevronUp size={10}/> Show less</> : <><ChevronDown size={10}/> Read more</>}
                  </button>
                )}
              </div>
              <button onClick={() => dismiss(a.id)}
                className="text-white/20 hover:text-white/60 flex-shrink-0 p-0.5 transition-colors active:scale-90">
                <X size={14}/>
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}
