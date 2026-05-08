import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { useTranslation } from 'react-i18next'
import './i18n'

import Login              from './pages/Login'
import Onboarding         from './pages/Onboarding'
import Dashboard          from './pages/Dashboard'
import Leaderboard        from './pages/Leaderboard'
import Routine            from './pages/Routine'
import Account            from './pages/Account'
import Developer          from './pages/Developer'
import PWAInstallBanner   from './components/PWAInstallBanner'
import NotificationManager from './components/NotificationManager'

// Language toggle — small, fixed, non-intrusive
function LangToggle() {
  const { i18n } = useTranslation()
  const toggle = () => {
    const next = i18n.language === 'en' ? 'bn' : 'en'
    i18n.changeLanguage(next)
    localStorage.setItem('hsc_lang', next)
  }
  return (
    <button onClick={toggle}
      className="fixed top-3 right-3 z-50 bg-surface-700/90 backdrop-blur-sm border border-white/10 text-white/60 hover:text-white text-[11px] font-display px-2.5 py-1 rounded-full transition-colors shadow-lg">
      {i18n.language === 'en' ? 'বাংলা' : 'EN'}
    </button>
  )
}

function Loading() {
  return (
    <div className="min-h-screen bg-surface-900 flex items-center justify-center">
      <div className="text-center">
        {/* Logo */}
        <div className="w-16 h-16 mx-auto mb-4 animate-float">
          <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="50" cy="50" r="48" fill="url(#lg)"/>
            <path d="M25 65 L50 25 L75 65" stroke="white" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
            <path d="M35 65 L65 65" stroke="white" strokeWidth="5" strokeLinecap="round"/>
            <circle cx="50" cy="50" r="6" fill="white" opacity="0.9"/>
            <defs>
              <linearGradient id="lg" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
                <stop stopColor="#0ea5e9"/><stop offset="1" stopColor="#f97316"/>
              </linearGradient>
            </defs>
          </svg>
        </div>
        <div className="w-8 h-8 border-2 border-brand-400 border-t-transparent rounded-full animate-spin mx-auto mb-3"/>
        <p className="text-white/40 text-sm font-display">HSC PathFinder</p>
      </div>
    </div>
  )
}

function ProtectedRoute({ children }) {
  const { user, profile, loading } = useAuth()
  if (loading) return <Loading />
  if (!user)    return <Navigate to="/login"      replace />
  if (!profile) return <Navigate to="/onboarding" replace />
  return <>{children}</>
}

function AppRoutes() {
  const { user, profile, loading } = useAuth()
  if (loading) return <Loading />

  return (
    <>
      <LangToggle />
      <NotificationManager />
      <PWAInstallBanner />
      <Routes>
        <Route path="/login" element={
          user && profile ? <Navigate to="/dashboard" replace /> : <Login />
        } />
        <Route path="/onboarding" element={
          !user   ? <Navigate to="/login"     replace /> :
          profile ? <Navigate to="/dashboard" replace /> :
          <Onboarding />
        } />
        <Route path="/dashboard"   element={<ProtectedRoute><Dashboard   /></ProtectedRoute>} />
        <Route path="/leaderboard" element={<ProtectedRoute><Leaderboard /></ProtectedRoute>} />
        <Route path="/routine"     element={<ProtectedRoute><Routine     /></ProtectedRoute>} />
        <Route path="/account"     element={<ProtectedRoute><Account     /></ProtectedRoute>} />
        <Route path="/developer"   element={<ProtectedRoute><Developer   /></ProtectedRoute>} />
        <Route path="*"            element={<Navigate to="/dashboard"    replace />} />
      </Routes>
    </>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
        <Toaster
          position="top-center"
          toastOptions={{
            duration: 3000,
            style: {
              background:   '#1e293b',
              color:        '#fff',
              border:       '1px solid rgba(255,255,255,0.1)',
              borderRadius: '12px',
              fontSize:     '13px',
              fontFamily:   'Sora, sans-serif',
              maxWidth:     '320px',
            },
            success: { iconTheme: { primary:'#22c55e', secondary:'#fff' } },
            error:   { iconTheme: { primary:'#ef4444', secondary:'#fff' } },
          }}
        />
      </BrowserRouter>
    </AuthProvider>
  )
}
