import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Download, X } from 'lucide-react'

export default function PWAInstallBanner() {
  const { i18n } = useTranslation()
  const isBn = i18n.language === 'bn'
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [show, setShow] = useState(false)

  useEffect(() => {
    // Already installed or dismissed?
    if (localStorage.getItem('pwa_dismissed')) return

    const handler = (e) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setShow(true)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const handleInstall = async () => {
    if (!deferredPrompt) return
    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') {
      setShow(false)
      setDeferredPrompt(null)
    }
  }

  const handleDismiss = () => {
    setShow(false)
    localStorage.setItem('pwa_dismissed', '1')
  }

  if (!show) return null

  return (
    <div className="fixed bottom-20 left-3 right-3 z-40 animate-slide-up">
      <div className="bg-surface-700 border border-brand-500/30 rounded-2xl p-4 shadow-2xl shadow-black/40 flex items-center gap-3">
        {/* Icon */}
        <div className="w-10 h-10 bg-brand-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
          <Download size={18} className="text-brand-400" />
        </div>
        {/* Text */}
        <div className="flex-1 min-w-0">
          <p className={`text-white text-xs font-display font-semibold ${isBn?'font-bengali':''}`}>
            {isBn ? 'অ্যাপ ইনস্টল করো' : 'Install HSC PathFinder'}
          </p>
          <p className={`text-white/40 text-[10px] ${isBn?'font-bengali':''}`}>
            {isBn ? 'হোম স্ক্রিনে যোগ করো — সহজে ব্যবহার করো' : 'Add to home screen for quick access'}
          </p>
        </div>
        {/* Buttons */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <button onClick={handleInstall}
            className="bg-brand-500 text-white text-[11px] font-display font-semibold px-3 py-1.5 rounded-lg active:scale-95 transition-transform">
            {isBn ? 'ইনস্টল' : 'Install'}
          </button>
          <button onClick={handleDismiss} className="text-white/30 hover:text-white/60 p-1">
            <X size={14} />
          </button>
        </div>
      </div>
    </div>
  )
}
