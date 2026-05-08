import { useState } from 'react'
import { doc, setDoc } from 'firebase/firestore'
import { db } from '../firebase/config'
import { useAuth } from '../contexts/AuthContext'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { ChevronRight } from 'lucide-react'

const GROUPS = ['science','arts','commerce']
const GOALS  = [4,6,8,10,12,14,16]
const GROUP_ICONS = { science:'🔬', arts:'🎨', commerce:'💼' }

export default function Onboarding() {
  const { t, i18n } = useTranslation()
  const isBn = i18n.language === 'bn'
  const { user, refreshProfile } = useAuth()
  const navigate = useNavigate()

  const [form, setForm] = useState({
    name:      user?.displayName || '',
    college:   '',
    group:     '',
    dailyGoal: 8,
  })
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    if (!form.name.trim())    { toast.error('Please enter your name');    return }
    if (!form.college.trim()) { toast.error('Please enter college name'); return }
    if (!form.group)          { toast.error('Please select your group');  return }

    setSaving(true)
    try {
      await setDoc(doc(db, 'users', user.uid), {
        uid:          user.uid,
        name:         form.name.trim(),
        college:      form.college.trim(),
        group:        form.group,
        dailyGoal:    form.dailyGoal,
        photoURL:     user.photoURL || '',
        email:        user.email    || '',
        joinedAt:     new Date().toISOString(),
        totalMinutes: 0,
        daysStudied:  0,
        streak:       0,
        lastStudyDate: null,
      })
      await refreshProfile()
      toast.success(isBn ? 'প্রোফাইল সেট হয়েছে! 🎉' : 'Profile saved! 🎉')
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
      <div className="absolute inset-0 bg-hero-glow pointer-events-none"/>
      <div className="absolute top-10 right-10 w-64 h-64 bg-brand-500/10 rounded-full blur-3xl pointer-events-none"/>

      <div className="flex-1 flex flex-col justify-center px-6 py-8 relative z-10 max-w-sm mx-auto w-full">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 mx-auto mb-3 bg-brand-500/20 border border-brand-500/30 rounded-2xl flex items-center justify-center text-2xl">
            🎓
          </div>
          <h1 className={`text-2xl font-display font-bold text-white mb-1 ${isBn?'font-bengali':''}`}>
            {t('onboarding.title')}
          </h1>
          <p className={`text-white/40 text-sm ${isBn?'font-bengali':''}`}>
            {t('onboarding.subtitle')}
          </p>
        </div>

        <div className="space-y-4">
          {/* Name */}
          <div>
            <label className={`block text-white/60 text-xs font-display mb-1.5 ${isBn?'font-bengali':''}`}>
              {t('onboarding.name')} *
            </label>
            <input type="text" value={form.name}
              onChange={e => setForm(f=>({...f,name:e.target.value}))}
              placeholder={isBn?'তোমার পুরো নাম লেখো':'Enter your full name'}
              className="input-field"/>
          </div>

          {/* College */}
          <div>
            <label className={`block text-white/60 text-xs font-display mb-1.5 ${isBn?'font-bengali':''}`}>
              {t('onboarding.college')} *
            </label>
            <input type="text" value={form.college}
              onChange={e => setForm(f=>({...f,college:e.target.value}))}
              placeholder={isBn?'তোমার কলেজের নাম':'Enter your college name'}
              className="input-field"/>
          </div>

          {/* Group */}
          <div>
            <label className={`block text-white/60 text-xs font-display mb-2 ${isBn?'font-bengali':''}`}>
              {t('onboarding.group')} *
            </label>
            <div className="grid grid-cols-3 gap-2">
              {GROUPS.map(g => (
                <button key={g} onClick={() => setForm(f=>({...f,group:g}))}
                  className={`flex flex-col items-center py-3 rounded-xl border transition-all duration-200 ${
                    form.group===g
                      ? 'bg-brand-500 border-brand-400 text-white shadow-lg shadow-brand-500/30'
                      : 'bg-surface-700 border-white/10 text-white/50 hover:text-white'
                  }`}>
                  <span className="text-xl mb-1">{GROUP_ICONS[g]}</span>
                  <span className={`text-[11px] font-display font-medium ${isBn?'font-bengali':''}`}>
                    {t(`onboarding.groups.${g}`)}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Daily Goal */}
          <div>
            <label className={`block text-white/60 text-xs font-display mb-2 ${isBn?'font-bengali':''}`}>
              {t('onboarding.daily_goal')} —{' '}
              <span className="text-brand-400 font-bold">{form.dailyGoal}h</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {GOALS.map(g => (
                <button key={g} onClick={() => setForm(f=>({...f,dailyGoal:g}))}
                  className={`w-12 h-10 rounded-xl text-sm font-display font-bold border transition-all ${
                    form.dailyGoal===g
                      ? 'bg-accent-500 border-accent-400 text-white shadow-lg shadow-accent-500/30'
                      : 'bg-surface-700 border-white/10 text-white/50 hover:text-white'
                  }`}>
                  {g}h
                </button>
              ))}
            </div>
            <p className={`text-white/25 text-[10px] mt-1.5 ${isBn?'font-bengali':''}`}>
              {isBn ? '💡 বাস্তবসম্মত লক্ষ্য নির্ধারণ করো' : '💡 Set a realistic daily study goal'}
            </p>
          </div>

          {/* Save */}
          <button onClick={handleSave} disabled={saving}
            className="btn-primary w-full flex items-center justify-center gap-2 mt-2">
            {saving ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>
            ) : (
              <>
                <span className={isBn?'font-bengali':''}>{t('onboarding.save')}</span>
                <ChevronRight size={16}/>
              </>
            )}
          </button>
        </div>

        <p className="text-center text-white/20 text-xs mt-6">
          Built with ❤️ by Arnnik Islam Payel
        </p>
      </div>
    </div>
  )
}
