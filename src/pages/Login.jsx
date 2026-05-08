import { useState } from 'react'
import { signInWithPopup } from 'firebase/auth'
import { auth, googleProvider } from '../firebase/config'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'

export default function Login() {
  const { t, i18n } = useTranslation()
  const isBn = i18n.language === 'bn'
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleLogin = async () => {
    setLoading(true)
    try {
      await signInWithPopup(auth, googleProvider)
      navigate('/dashboard')
    } catch (err) {
      console.error(err)
      if (err.code !== 'auth/popup-closed-by-user') {
        toast.error('Login failed. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  const toggleLang = () => {
    const next = i18n.language === 'en' ? 'bn' : 'en'
    i18n.changeLanguage(next)
    localStorage.setItem('hsc_lang', next)
  }

  return (
    <div className="min-h-screen bg-surface-900 flex flex-col overflow-hidden relative">
      {/* Background glows */}
      <div className="absolute inset-0 bg-hero-glow pointer-events-none"/>
      <div className="absolute top-20 left-10 w-72 h-72 bg-brand-500/10 rounded-full blur-3xl pointer-events-none"/>
      <div className="absolute bottom-20 right-10 w-64 h-64 bg-accent-500/10 rounded-full blur-3xl pointer-events-none"/>

      {/* Language toggle */}
      <div className="relative z-10 flex justify-end p-4">
        <button onClick={toggleLang}
          className="glass px-4 py-1.5 rounded-full text-sm font-display font-medium text-white/70 hover:text-white transition-colors">
          {isBn ? 'English' : 'বাংলা'}
        </button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-6 py-8 relative z-10">

        {/* Logo */}
        <div className="text-center mb-8 animate-fade-in">
          <div className="w-24 h-24 mx-auto mb-5 animate-float">
            <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full drop-shadow-2xl">
              <circle cx="50" cy="50" r="48" fill="url(#loginGrad)"/>
              <path d="M25 65 L50 25 L75 65" stroke="white" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
              <path d="M35 65 L65 65" stroke="white" strokeWidth="5" strokeLinecap="round"/>
              <circle cx="50" cy="50" r="6" fill="white" opacity="0.9"/>
              <defs>
                <linearGradient id="loginGrad" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#0ea5e9"/><stop offset="1" stopColor="#f97316"/>
                </linearGradient>
              </defs>
            </svg>
          </div>
          <h1 className={`text-4xl font-display font-bold text-gradient mb-2 ${isBn?'font-bengali':''}`}>
            {t('appName')}
          </h1>
          <p className={`text-white/50 text-sm ${isBn?'font-bengali':''}`}>{t('tagline')}</p>
          <div className="mt-3 inline-flex items-center gap-2 bg-accent-500/20 border border-accent-500/30 text-accent-400 text-xs font-display font-semibold px-4 py-1.5 rounded-full">
            🎓 {t('exam_date')} — 02 July 2026
          </div>
        </div>

        {/* Feature pills */}
        <div className="flex flex-wrap justify-center gap-2 mb-6">
          {['📊 Study Tracker','🏆 Leaderboard','📅 Exam Routine','📸 Custom Photos','📱 PWA'].map(f => (
            <span key={f} className="text-xs bg-white/5 border border-white/10 text-white/50 px-3 py-1 rounded-full">{f}</span>
          ))}
        </div>

        {/* Login card */}
        <div className="w-full max-w-sm animate-slide-up">
          <div className="card neon-border">
            <h2 className={`text-xl font-display font-bold text-white text-center mb-1.5 ${isBn?'font-bengali':''}`}>
              {t('auth.welcome')}
            </h2>
            <p className={`text-white/40 text-xs text-center mb-5 ${isBn?'font-bengali':''}`}>
              {t('auth.subtitle')}
            </p>

            {/* Google button */}
            <button onClick={handleLogin} disabled={loading}
              className="w-full flex items-center justify-center gap-3 bg-white text-gray-800 font-display font-semibold py-3.5 px-6 rounded-xl hover:bg-gray-100 active:scale-95 transition-all disabled:opacity-60 shadow-lg">
              {loading ? (
                <div className="w-5 h-5 border-2 border-gray-300 border-t-gray-700 rounded-full animate-spin"/>
              ) : (
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
              )}
              <span className={isBn?'font-bengali':''}>
                {loading ? t('auth.logging_in') : t('auth.google_login')}
              </span>
            </button>

            {/* Honesty note */}
            <div className="mt-4 p-3 bg-accent-500/10 border border-accent-500/20 rounded-xl">
              <p className={`text-accent-400/80 text-xs leading-relaxed ${isBn?'font-bengali':''}`}>
                {t('auth.honesty_note')}
              </p>
            </div>
          </div>

          {/* Developer credit */}
          <p className="text-center text-white/20 text-xs mt-5">
            Built with ❤️ by{' '}
            <a href="https://arnnikislam.vercel.app" target="_blank" rel="noopener noreferrer"
              className="text-brand-400/50 hover:text-brand-400 transition-colors">
              Arnnik Islam Payel
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
