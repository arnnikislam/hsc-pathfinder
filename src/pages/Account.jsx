import { useState, useEffect } from 'react'
import { doc, updateDoc, collection, query, where, getDocs, orderBy } from 'firebase/firestore'
import { signOut } from 'firebase/auth'
import { db, auth } from '../firebase/config'
import { useAuth } from '../contexts/AuthContext'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { format } from 'date-fns'
import BottomNav from '../components/BottomNav'
import { exportStudyReport } from '../utils/pdfExport'
import toast from 'react-hot-toast'
import { User, Edit3, LogOut, Download, Target, Flame, TrendingUp, Calendar } from 'lucide-react'

const GROUPS = ['science', 'arts', 'commerce']
const GOALS = [4, 6, 8, 10, 12, 14, 16]

export default function Account() {
  const { user, profile, refreshProfile } = useAuth()
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const isBn = i18n.language === 'bn'

  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({ name: '', college: '', group: '', dailyGoal: 8 })
  const [saving, setSaving] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [allLogs, setAllLogs] = useState([])

  useEffect(() => {
    if (profile) {
      setForm({ name: profile.name, college: profile.college, group: profile.group, dailyGoal: profile.dailyGoal })
      fetchAllLogs()
    }
  }, [profile])

  const fetchAllLogs = async () => {
    if (!user) return
    try {
      const q = query(
        collection(db, 'studyLogs'),
        where('userId', '==', user.uid),
        orderBy('date', 'desc')
      )
      const snap = await getDocs(q)
      setAllLogs(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    } catch (err) { console.error(err) }
  }

  const handleSave = async () => {
    if (!form.name.trim() || !form.college.trim()) { toast.error('Fill all fields'); return }
    setSaving(true)
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        name: form.name.trim(),
        college: form.college.trim(),
        group: form.group,
        dailyGoal: form.dailyGoal,
      })
      await refreshProfile()
      setEditing(false)
      toast.success('Profile updated! ✅')
    } catch (err) {
      toast.error('Update failed')
    } finally {
      setSaving(false)
    }
  }

  const handleExportPDF = async () => {
    setExporting(true)
    try {
      await exportStudyReport({ profile, allLogs, t })
      toast.success('Report downloaded! 📄')
    } catch (err) {
      toast.error('Export failed')
      console.error(err)
    } finally {
      setExporting(false)
    }
  }

  const handleLogout = async () => {
    await signOut(auth)
    navigate('/login')
  }

  const totalHours = Math.floor((profile?.totalMinutes || allLogs.reduce((s,l) => s + l.minutes, 0)) / 60)
  const daysStudied = new Set(allLogs.map(l => l.date)).size
  const avgMins = daysStudied > 0 ? Math.round(allLogs.reduce((s,l) => s + l.minutes, 0) / daysStudied) : 0
  const avgH = Math.floor(avgMins / 60), avgM = avgMins % 60

  const groupLabel = { science: 'Science 🔬', arts: 'Arts 🎨', commerce: 'Commerce 💼' }
  const joinedDate = profile?.joinedAt ? format(new Date(profile.joinedAt), 'dd MMM yyyy') : '—'

  return (
    <div className="min-h-screen bg-surface-900">
      <div className="page-container pt-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <User size={20} className="text-brand-400" />
            <h1 className={`text-xl font-display font-bold text-white ${isBn ? 'font-bengali' : ''}`}>
              {t('account.title')}
            </h1>
          </div>
          <button
            onClick={() => { setEditing(!editing); setForm({ name: profile?.name, college: profile?.college, group: profile?.group, dailyGoal: profile?.dailyGoal }) }}
            className="flex items-center gap-1.5 text-brand-400 text-xs font-display"
          >
            <Edit3 size={14} />
            <span className={isBn ? 'font-bengali' : ''}>{editing ? t('account.cancel') : t('account.edit')}</span>
          </button>
        </div>

        {/* Profile card */}
        <div className="card mb-4">
          <div className="flex items-center gap-4 mb-4">
            <img
              src={user?.photoURL || `https://ui-avatars.com/api/?name=${profile?.name}&background=0ea5e9&color=fff&size=80`}
              alt="avatar"
              className="w-16 h-16 rounded-2xl border-2 border-brand-500/40"
            />
            <div className="flex-1 min-w-0">
              {editing ? (
                <input
                  type="text"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  className="input-field text-sm mb-1"
                />
              ) : (
                <h2 className="text-lg font-display font-bold text-white truncate">{profile?.name}</h2>
              )}
              <p className="text-white/40 text-xs">{user?.email}</p>
              {!editing && (
                <span className="inline-block mt-1 text-xs bg-brand-500/20 text-brand-300 px-2 py-0.5 rounded-full font-display">
                  {groupLabel[profile?.group]}
                </span>
              )}
            </div>
          </div>

          {editing ? (
            <div className="space-y-3">
              <div>
                <label className={`block text-white/50 text-xs mb-1 ${isBn ? 'font-bengali' : ''}`}>{t('onboarding.college')}</label>
                <input type="text" value={form.college} onChange={e => setForm(f => ({ ...f, college: e.target.value }))} className="input-field" />
              </div>
              <div>
                <label className={`block text-white/50 text-xs mb-1 ${isBn ? 'font-bengali' : ''}`}>{t('onboarding.group')}</label>
                <div className="grid grid-cols-3 gap-2">
                  {GROUPS.map(g => (
                    <button key={g} onClick={() => setForm(f => ({ ...f, group: g }))}
                      className={`py-2 rounded-xl text-xs font-display border transition-all ${form.group === g ? 'bg-brand-500 border-brand-400 text-white' : 'bg-surface-700 border-white/10 text-white/50'}`}>
                      {t(`onboarding.groups.${g}`)}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className={`block text-white/50 text-xs mb-1 ${isBn ? 'font-bengali' : ''}`}>{t('onboarding.daily_goal')} — {form.dailyGoal}h</label>
                <div className="flex flex-wrap gap-2">
                  {GOALS.map(g => (
                    <button key={g} onClick={() => setForm(f => ({ ...f, dailyGoal: g }))}
                      className={`w-11 h-9 rounded-lg text-xs font-display font-semibold border transition-all ${form.dailyGoal === g ? 'bg-accent-500 border-accent-400 text-white' : 'bg-surface-700 border-white/10 text-white/50'}`}>
                      {g}h
                    </button>
                  ))}
                </div>
              </div>
              <button onClick={handleSave} disabled={saving} className="btn-primary w-full">
                {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto" /> : t('account.save')}
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="bg-surface-700 rounded-xl p-3">
                <p className="text-white/40 text-[10px] mb-0.5">{t('onboarding.college')}</p>
                <p className="text-white font-display font-medium text-xs truncate">{profile?.college}</p>
              </div>
              <div className="bg-surface-700 rounded-xl p-3">
                <p className="text-white/40 text-[10px] mb-0.5">{t('account.goal')}</p>
                <p className="text-accent-400 font-display font-bold">{profile?.dailyGoal}h / day</p>
              </div>
              <div className="bg-surface-700 rounded-xl p-3">
                <p className="text-white/40 text-[10px] mb-0.5">{t('account.joined')}</p>
                <p className="text-white font-display text-xs">{joinedDate}</p>
              </div>
              <div className="bg-surface-700 rounded-xl p-3">
                <p className="text-white/40 text-[10px] mb-0.5">Days Studied</p>
                <p className="text-green-400 font-display font-bold">{daysStudied}</p>
              </div>
            </div>
          )}
        </div>

        {/* Stats */}
        {!editing && (
          <div className="card mb-4">
            <h3 className={`text-sm font-display font-semibold text-white/80 mb-3 ${isBn ? 'font-bengali' : ''}`}>
              {t('account.stats')}
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {[
                { icon: TrendingUp, label: t('account.total_study'), value: `${totalHours}h`, color: 'text-brand-400', bg: 'bg-brand-500/10' },
                { icon: Target, label: t('account.daily_avg'), value: `${avgH}h ${avgM}m`, color: 'text-accent-400', bg: 'bg-accent-500/10' },
                { icon: Flame, label: t('account.streak'), value: `${profile?.streak || 0} days 🔥`, color: 'text-orange-400', bg: 'bg-orange-500/10' },
                { icon: Calendar, label: 'Days Studied', value: `${daysStudied} days`, color: 'text-green-400', bg: 'bg-green-500/10' },
              ].map(({ icon: Icon, label, value, color, bg }) => (
                <div key={label} className={`${bg} rounded-xl p-3 flex items-center gap-3`}>
                  <Icon size={18} className={color} />
                  <div>
                    <p className={`text-[10px] text-white/40 ${isBn ? 'font-bengali' : ''}`}>{label}</p>
                    <p className={`font-display font-bold text-sm ${color}`}>{value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        {!editing && (
          <div className="space-y-3">
            <button
              onClick={handleExportPDF}
              disabled={exporting}
              className="w-full flex items-center justify-center gap-2 bg-green-500/20 border border-green-500/30 text-green-400 py-3.5 rounded-xl font-display font-semibold text-sm hover:bg-green-500/30 transition-colors active:scale-95 disabled:opacity-60"
            >
              <Download size={16} />
              <span className={isBn ? 'font-bengali' : ''}>
                {exporting ? 'Generating PDF...' : t('account.export_pdf')}
              </span>
            </button>

            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 bg-red-500/10 border border-red-500/20 text-red-400 py-3.5 rounded-xl font-display font-semibold text-sm hover:bg-red-500/20 transition-colors active:scale-95"
            >
              <LogOut size={16} />
              <span className={isBn ? 'font-bengali' : ''}>{t('account.logout')}</span>
            </button>
          </div>
        )}

        {/* Credit */}
        <p className="text-center text-white/20 text-xs mt-6 font-body">
          Built with ❤️ by{' '}
          <a href="https://arnnikislam.vercel.app" target="_blank" rel="noopener noreferrer" className="text-brand-400/50 hover:text-brand-400 transition-colors">
            Arnnik Islam Payel
          </a>
        </p>
        <div className="h-4" />
      </div>
      <BottomNav />
    </div>
  )
}
