import { useState } from 'react'
import { doc, setDoc } from 'firebase/firestore'
import { db } from '../firebase/config'
import { useAuth } from '../contexts/AuthContext'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'

const GROUPS = ['science', 'arts', 'commerce']
const GOALS = [4, 6, 8, 10, 12, 14, 16]

export default function Onboarding() {
  const { t, i18n } = useTranslation()
  const { user, refreshProfile } = useAuth()
  const navigate = useNavigate()
  const isBn = i18n.language === 'bn'

  const [form, setForm] = useState({
    name: user?.displayName || '',
    college: '',
    group: '',
    dailyGoal: 8
  })
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    if (!form.name.trim() || !form.college.trim() || !form.group) {
      toast.error('Please fill all fields')
      return
    }
    setSaving(true)
    try {
      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        name: form.name.trim(),
        college: form.college.trim(),
        group: form.group,
        dailyGoal: form.dailyGoal,
        photoURL: user.photoURL || '',
        email: user.email,
        joinedAt: new Date().toISOString(),
        totalMinutes: 0,
        streak: 0,
        lastStudyDate: null
      })
      await refreshProfile()
      toast.success('Profile saved! 🎉')
      navigate('/dashboard')
    } catch (err) {
      console.error(err)
      toast.error('Failed to save. Try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-surface-900 flex flex-col relative overflow-hidden">
      <div className="absolute inset-0 bg-hero-glow pointer-events-none" />
      <div className="absolute top-20 right-10 w-64 h-64 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="flex-1 flex flex-col justify-center px-6 py-10 relative z-10 max-w-sm mx-auto w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 mx-auto mb-4 bg-brand-500/20 border border-brand-500/30 rounded-2xl flex items-center justify-center text-2xl">
            🎓
          </div>
          <h1 className={`text-2xl font-display font-bold text-white mb-1 ${isBn ? 'font-bengali' : ''}`}>
            {t('onboarding.title')}
          </h1>
          <p className={`text-white/50 text-sm ${isBn ? 'font-bengali' : ''}`}>
            {t('onboarding.subtitle')}
          </p>
        </div>

        <div className="space-y-4">
          {/* Name */}
          <div>
            <label className={`block text-white/70 text-xs font-display mb-1.5 ${isBn ? 'font-bengali' : ''}`}>
              {t('onboarding.name')}
            </label>
            <input
              type="text"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="Your full name"
              className="input-field"
            />
          </div>

          {/* College */}
          <div>
            <label className={`block text-white/70 text-xs font-display mb-1.5 ${isBn ? 'font-bengali' : ''}`}>
              {t('onboarding.college')}
            </label>
            <input
              type="text"
              value={form.college}
              onChange={e => setForm(f => ({ ...f, college: e.target.value }))}
              placeholder="Your college name"
              className="input-field"
            />
          </div>

          {/* Group */}
          <div>
            <label className={`block text-white/70 text-xs font-display mb-1.5 ${isBn ? 'font-bengali' : ''}`}>
              {t('onboarding.group')}
            </label>
            <div className="grid grid-cols-3 gap-2">
              {GROUPS.map(g => (
                <button
                  key={g}
                  onClick={() => setForm(f => ({ ...f, group: g }))}
                  className={`py-3 rounded-xl text-sm font-display font-medium transition-all duration-200 border ${
                    form.group === g
                      ? 'bg-brand-500 border-brand-400 text-white shadow-lg shadow-brand-500/30'
                      : 'bg-surface-700 border-white/10 text-white/60 hover:text-white hover:border-white/20'
                  }`}
                >
                  <span className={isBn ? 'font-bengali text-xs' : ''}>
                    {t(`onboarding.groups.${g}`)}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Daily Goal */}
          <div>
            <label className={`block text-white/70 text-xs font-display mb-1.5 ${isBn ? 'font-bengali' : ''}`}>
              {t('onboarding.daily_goal')} — <span className="text-brand-400 font-semibold">{form.dailyGoal}h</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {GOALS.map(g => (
                <button
                  key={g}
                  onClick={() => setForm(f => ({ ...f, dailyGoal: g }))}
                  className={`w-12 h-10 rounded-lg text-sm font-display font-semibold transition-all duration-200 border ${
                    form.dailyGoal === g
                      ? 'bg-accent-500 border-accent-400 text-white'
                      : 'bg-surface-700 border-white/10 text-white/60 hover:text-white'
                  }`}
                >
                  {g}h
                </button>
              ))}
            </div>
          </div>

          {/* Save button */}
          <button
            onClick={handleSave}
            disabled={saving}
            className="btn-primary w-full mt-2"
          >
            {saving ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span className={isBn ? 'font-bengali' : ''}>{t('onboarding.saving')}</span>
              </span>
            ) : (
              <span className={isBn ? 'font-bengali' : ''}>{t('onboarding.save')}</span>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
