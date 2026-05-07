import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import './i18n'

import Login from './pages/Login'
import Onboarding from './pages/Onboarding'
import Dashboard from './pages/Dashboard'
import Leaderboard from './pages/Leaderboard'
import Routine from './pages/Routine'
import Account from './pages/Account'
import Developer from './pages/Developer'

// Language toggle floating button (shown on all protected pages)
import { useTranslation } from 'react-i18next'

function LangToggle() {
  const { i18n } = useTranslation()
  const toggle = () => {
    const next = i18n.language === 'en' ? 'bn' : 'en'
    i18n.changeLanguage(next)
    localStorage.setItem('hsc_lang', next)
  }
  return (
    <button
      onClick={toggle}
      className="fixed top-4 right-4 z-50 glass text-white/70 hover:text-white text-xs font-display px-3 py-1.5 rounded-full transition-colors"
      style={{ fontSize: '11px' }}
    >
      {i18n.language === 'en' ? 'বাংলা' : 'EN'}
    </button>
  )
}

// Auth guard — redirect to login if not authed, onboarding if no profile
function ProtectedRoute({ children }) {
  const { user, profile, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-surface-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-brand-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white/40 text-sm font-display">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) return <Navigate to="/login" replace />
  if (!profile) return <Navigate to="/onboarding" replace />

  return (
    <>
      <LangToggle />
      {children}
    </>
  )
}

function AppRoutes() {
  const { user, profile, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-surface-900 flex items-center justify-center">
        <div className="w-12 h-12 border-2 border-brand-400 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <Routes>
      {/* Public */}
      <Route path="/login" element={
        user && profile ? <Navigate to="/dashboard" replace /> : <Login />
      } />

      {/* Onboarding — only for authed but no profile */}
      <Route path="/onboarding" element={
        !user ? <Navigate to="/login" replace /> :
        profile ? <Navigate to="/dashboard" replace /> :
        <Onboarding />
      } />

      {/* Protected routes */}
      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/leaderboard" element={<ProtectedRoute><Leaderboard /></ProtectedRoute>} />
      <Route path="/routine" element={<ProtectedRoute><Routine /></ProtectedRoute>} />
      <Route path="/account" element={<ProtectedRoute><Account /></ProtectedRoute>} />
      <Route path="/developer" element={<ProtectedRoute><Developer /></ProtectedRoute>} />

      {/* Default redirect */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
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
            style: {
              background: '#1e293b',
              color: '#fff',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '12px',
              fontSize: '13px',
              fontFamily: 'Sora, sans-serif',
            },
            success: { iconTheme: { primary: '#22c55e', secondary: '#fff' } },
            error:   { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
          }}
        />
      </BrowserRouter>
    </AuthProvider>
  )
}
