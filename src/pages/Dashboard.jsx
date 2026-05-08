import { useState, useEffect } from 'react'
import { collection, addDoc, query, where, getDocs, Timestamp, doc, updateDoc, deleteDoc } from 'firebase/firestore'
import { db } from '../firebase/config'
import { useAuth } from '../contexts/AuthContext'
import { useTranslation } from 'react-i18next'
import { format } from 'date-fns'
import CountdownBanner from '../components/CountdownBanner'
import BottomNav from '../components/BottomNav'
import toast from 'react-hot-toast'
import { Plus, Clock, Flame, TrendingUp, CalendarDays, Trash2 } from 'lucide-react'
import { calculateAndSaveStreak } from '../utils/streakUtils'
import StudyGraph from '../components/StudyGraph'

function ProgressRing({ percent, size = 110, stroke = 9 }) {
  const capped = Math.min(percent, 100)
  const radius = (size - stroke) / 2
  const circ   = 2 * Math.PI * radius
  const offset = circ - (capped / 100) * circ
  const color  = capped >= 100 ? '#22c55e' : capped >= 60 ? '#0ea5e9' : '#f97316'
  return (
    <svg width={size} height={size} className="transform -rotate-90">
      <circle cx={size/2} cy={size/2} r={radius} stroke="rgba(255,255,255,0.08)" strokeWidth={stroke} fill="none"/>
      <circle cx={size/2} cy={size/2} r={radius} stroke={color} strokeWidth={stroke} fill="none"
        strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
        className="progress-ring__circle" style={{filter:`drop-shadow(0 0 6px ${color}80)`}}/>
    </svg>
  )
}

function getGreeting(t) {
  const h = new Date().getHours()
  if (h < 12) return t('dashboard.good_morning')
  if (h < 17) return t('dashboard.good_afternoon')
  return t('dashboard.good_evening')
}

function fmt(m, t) {
  const h   = Math.floor(m / 60)
  const min = m % 60
  const hs  = t('common.hours_short')
  const ms  = t('common.minutes_short')
  if (h > 0 && min > 0) return `${h}${hs} ${min}${ms}`
  if (h > 0) return `${h}${hs}`
  return `${min}${ms}`
}

// Recalculate totalMinutes + daysStudied from scratch — prevents drift
async function recalcStats(uid) {
  const snap  = await getDocs(query(collection(db, 'studyLogs'), where('userId','==',uid)))
  const total = snap.docs.reduce((s,d) => s + (d.data().minutes||0), 0)
  const dates = new Set(snap.docs.map(d => d.data().date).filter(Boolean))
  await updateDoc(doc(db,'users',uid), {
    totalMinutes: total,
    daysStudied:  dates.size,
  })
  return { total, daysStudied: dates.size }
}

export default function Dashboard() {
  const { user, profile, refreshProfile, getPhotoURL } = useAuth()
  const { t, i18n } = useTranslation()
  const isBn = i18n.language === 'bn'

  const [todayMinutes, setTodayMinutes] = useState(0)
  const [todayLogs,    setTodayLogs]    = useState([])
  const [showModal,    setShowModal]    = useState(false)
  const [addHours,     setAddHours]     = useState('')
  const [addMins,      setAddMins]      = useState('')
  const [logging,      setLogging]      = useState(false)
  const [loadingLogs,  setLoadingLogs]  = useState(true)

  const goalMinutes = (profile?.dailyGoal || 8) * 60
  const percent     = goalMinutes > 0 ? Math.min(100, Math.round((todayMinutes / goalMinutes) * 100)) : 0
  const previewMins = (parseInt(addHours)||0)*60 + (parseInt(addMins)||0)
  const totalHours  = Math.floor((profile?.totalMinutes||0) / 60)
  const daysStudied = profile?.daysStudied || 0
  const streak      = profile?.streak || 0

  const fetchTodayLogs = async () => {
    if (!user) return
    setLoadingLogs(true)
    try {
      const today = format(new Date(), 'yyyy-MM-dd')
      const snap  = await getDocs(query(
        collection(db, 'studyLogs'),
        where('userId','==',user.uid),
        where('date','==',today)
      ))
      const logs = snap.docs.map(d => ({id:d.id,...d.data()}))
      logs.sort((a,b) => (b.createdAt?.seconds||0) - (a.createdAt?.seconds||0))
      setTodayLogs(logs)
      setTodayMinutes(logs.reduce((s,l) => s+l.minutes, 0))
    } catch (err) {
      console.error(err)
    } finally {
      setLoadingLogs(false)
    }
  }

  // On mount: recalc stats + streak to fix any existing wrong values
  useEffect(() => {
    if (!user) return
    fetchTodayLogs()
    recalcStats(user.uid).then(() => {
      calculateAndSaveStreak(user.uid).then(() => refreshProfile())
    })
  }, [user])

  const handleLog = async () => {
    const h    = Math.max(0, parseInt(addHours)||0)
    const m    = Math.max(0, parseInt(addMins)||0)
    const mins = h*60 + m

    if (mins <= 0)   { toast.error('Enter at least 1 minute'); return }
    if (m > 59)      { toast.error('Minutes must be 0–59');    return }
    if (mins > 960)  { toast.error('Max 16h per entry');       return }
    if (todayMinutes + mins > 1200) {
      toast.error(`Daily max is 20h. Remaining: ${fmt(Math.max(0,1200-todayMinutes),t)}`)
      return
    }

    setLogging(true)
    try {
      const today = format(new Date(), 'yyyy-MM-dd')
      await addDoc(collection(db,'studyLogs'), {
        userId: user.uid, minutes: mins, date: today, createdAt: Timestamp.now()
      })
      // Recalc stats + streak after every log
      await recalcStats(user.uid)
      await calculateAndSaveStreak(user.uid)

      toast.success(`${h>0?h+'h ':''  }${m>0?m+'m':''} logged! 📚`)
      setAddHours(''); setAddMins(''); setShowModal(false)
      await fetchTodayLogs()
      await refreshProfile()
    } catch (err) {
      console.error(err)
      toast.error('Failed to log. Try again.')
    } finally {
      setLogging(false)
    }
  }

  const handleDelete = async (log) => {
    try {
      await deleteDoc(doc(db,'studyLogs',log.id))
      await recalcStats(user.uid)
      await calculateAndSaveStreak(user.uid)
      toast.success('Entry deleted')
      await fetchTodayLogs()
      await refreshProfile()
    } catch (err) {
      toast.error('Could not delete')
    }
  }

  const f = (m) => fmt(m, t)

  return (
    <div className="min-h-screen bg-surface-900">
      <div className="page-container pt-6">

        {/* Header */}
        <div className="flex items-center justify-between mb-4 pr-14">
          <div>
            <p className={`text-white/50 text-xs ${isBn?'font-bengali':''}`}>{getGreeting(t)} 👋</p>
            <h1 className={`text-xl font-display font-bold text-white ${isBn?'font-bengali':''}`}>
              {profile?.name?.split(' ')[0] || user?.displayName?.split(' ')[0] || 'Student'}
            </h1>
          </div>
          <img
            src={getPhotoURL(profile?.name)}
            alt="avatar" className="w-10 h-10 rounded-full border-2 border-brand-500/50 flex-shrink-0 object-cover"
            onError={e=>{ e.target.src=`https://ui-avatars.com/api/?name=User&background=0ea5e9&color=fff` }}
          />
        </div>

        <CountdownBanner />

        {/* Progress card */}
        <div className="card mb-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className={`text-sm font-display font-semibold text-white/80 ${isBn?'font-bengali':''}`}>
              {t('dashboard.today_goal')}
            </h2>
            <span className="text-xs text-white/40 font-display">{format(new Date(),'dd MMM yyyy')}</span>
          </div>

          <div className="flex items-center gap-5">
            <div className="relative flex-shrink-0">
              <ProgressRing percent={percent}/>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-xl font-display font-bold text-white">{percent}%</span>
                <span className="text-[10px] text-white/40">{t('dashboard.studied')}</span>
              </div>
            </div>
            <div className="flex-1 space-y-2">
              <div>
                <p className={`text-[10px] text-white/40 ${isBn?'font-bengali':''}`}>{t('dashboard.studied')}</p>
                <p className="text-xl font-display font-bold text-white">{f(todayMinutes)}</p>
              </div>
              <div>
                <p className={`text-[10px] text-white/40 ${isBn?'font-bengali':''}`}>{t('dashboard.today_goal')}</p>
                <p className="text-base font-display font-semibold text-brand-400">{profile?.dailyGoal||8}h</p>
              </div>
              <div>
                <p className={`text-[10px] text-white/40 ${isBn?'font-bengali':''}`}>{t('dashboard.remaining')}</p>
                <p className="text-base font-display font-semibold text-accent-400">
                  {percent>=100 ? (isBn?'সম্পন্ন ✅':'Done ✅') : f(Math.max(0,goalMinutes-todayMinutes))}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-4 h-2 bg-white/5 rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all duration-700"
              style={{
                width:`${percent}%`,
                background: percent>=100
                  ? 'linear-gradient(90deg,#22c55e,#16a34a)'
                  : 'linear-gradient(90deg,#0ea5e9,#f97316)'
              }}/>
          </div>
          {percent>=100 && (
            <p className="text-center text-green-400 text-xs mt-2 font-display">
              🎉 {isBn?'আজকের লক্ষ্য পূরণ! অসাধারণ!':'Goal achieved! Amazing work!'}
            </p>
          )}
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          {[
            { icon: Flame,        label: t('dashboard.streak'),      value: streak>0 ? `${streak}🔥` : `0🔥`,  color:'text-orange-400' },
            { icon: TrendingUp,   label: t('dashboard.total_hours'), value: `${totalHours}h`,                    color:'text-brand-400'  },
            { icon: CalendarDays, label: 'Days Studied',             value: `${daysStudied}`,                    color:'text-green-400'  },
          ].map(({ icon:Icon, label, value, color }) => (
            <div key={label} className="card text-center py-4">
              <Icon size={16} className={`${color} mx-auto mb-1`}/>
              <p className={`text-[9px] text-white/40 mb-1 ${isBn?'font-bengali':''}`}>{label}</p>
              <p className={`text-lg font-display font-bold ${color}`}>{value}</p>
            </div>
          ))}
        </div>

        {/* Today's log */}
        <div className="card mb-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className={`text-sm font-display font-semibold text-white/80 ${isBn?'font-bengali':''}`}>
              {t('dashboard.todays_log')}
            </h3>
            <span className="text-[10px] text-white/30 font-display">{f(todayMinutes)} / 20h max</span>
          </div>

          {loadingLogs ? (
            <div className="space-y-2">{[1,2].map(i=><div key={i} className="h-10 rounded-lg shimmer"/>)}</div>
          ) : todayLogs.length===0 ? (
            <p className={`text-white/30 text-sm text-center py-6 ${isBn?'font-bengali':''}`}>
              {t('dashboard.no_logs')}
            </p>
          ) : (
            <div className="space-y-2">
              {todayLogs.map(log => (
                <div key={log.id} className="flex items-center justify-between bg-surface-700 rounded-xl px-4 py-3">
                  <span className="text-white/50 text-xs font-display">
                    {log.createdAt?.toDate ? format(log.createdAt.toDate(),'hh:mm a') : '—'}
                  </span>
                  <div className="flex items-center gap-3">
                    <span className="text-brand-400 font-display font-bold text-sm">{f(log.minutes)}</span>
                    <button onClick={()=>handleDelete(log)}
                      className="text-red-400/40 hover:text-red-400 transition-colors active:scale-90">
                      <Trash2 size={13}/>
                    </button>
                  </div>
                </div>
              ))}
              {todayLogs.length>1 && (
                <div className="flex justify-between border-t border-white/5 pt-2 mt-1">
                  <span className={`text-white/40 text-xs ${isBn?'font-bengali':''}`}>
                    {isBn?'আজকের মোট':'Total today'}
                  </span>
                  <span className="text-white font-display font-bold text-sm">{f(todayMinutes)}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Study Graph */}
        <StudyGraph uid={user?.uid} goalMinutes={goalMinutes} />

        {/* Honesty note */}
        <div className="p-3 bg-accent-500/5 border border-accent-500/15 rounded-xl mb-6">
          <p className={`text-accent-400/70 text-xs leading-relaxed ${isBn?'font-bengali':''}`}>
            📌 {isBn
              ? 'সততার সাথে পড়ার সময় লগ করো। সর্বোচ্চ দৈনিক লগ ২০ ঘণ্টা।'
              : 'Log honestly. Daily maximum is 20h.'}
          </p>
        </div>
      </div>

      {/* FAB */}
      <button onClick={()=>setShowModal(true)}
        className="fixed bottom-24 right-4 z-40 w-14 h-14 bg-gradient-to-br from-brand-500 to-brand-600 rounded-2xl shadow-lg shadow-brand-500/40 flex items-center justify-center active:scale-90 transition-transform">
        <Plus size={26} className="text-white"/>
      </button>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm bg-surface-800 border border-white/10 rounded-3xl p-6 animate-slide-up">
            <h3 className={`text-lg font-display font-bold text-white mb-1 text-center ${isBn?'font-bengali':''}`}>
              {t('dashboard.add_hours')}
            </h3>
            <p className="text-white/25 text-[11px] text-center mb-5 font-display">
              {isBn
                ? `আজ আরও লগ করা যাবে: ${f(Math.max(0,1200-todayMinutes))}`
                : `Remaining allowance today: ${f(Math.max(0,1200-todayMinutes))}`}
            </p>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className={`block text-white/50 text-xs mb-1.5 ${isBn?'font-bengali':''}`}>
                  {t('dashboard.hours')} (0–16)
                </label>
                <input type="number" min="0" max="16" value={addHours}
                  onChange={e=>setAddHours(e.target.value)}
                  className="input-field text-center text-2xl font-display font-bold" placeholder="0"/>
              </div>
              <div>
                <label className={`block text-white/50 text-xs mb-1.5 ${isBn?'font-bengali':''}`}>
                  {t('dashboard.minutes')} (0–59)
                </label>
                <input type="number" min="0" max="59" value={addMins}
                  onChange={e=>setAddMins(e.target.value)}
                  className="input-field text-center text-2xl font-display font-bold" placeholder="0"/>
              </div>
            </div>

            {previewMins>0 && (
              <div className="bg-brand-500/10 border border-brand-500/20 rounded-xl px-4 py-2 mb-3 text-center">
                <span className="text-brand-400 font-display font-semibold text-sm">
                  ✏️ {f(previewMins)} {isBn?'লগ হবে':'will be logged'}
                </span>
              </div>
            )}

            <p className={`text-accent-400/60 text-xs text-center mb-4 ${isBn?'font-bengali':''}`}>
              📌 {isBn?'সততার সাথে লগ করো!':'Log honestly — this is for YOUR growth!'}
            </p>

            <div className="grid grid-cols-2 gap-3">
              <button onClick={()=>{setShowModal(false);setAddHours('');setAddMins('')}} className="btn-secondary">
                <span className={isBn?'font-bengali':''}>{t('common.close')}</span>
              </button>
              <button onClick={handleLog} disabled={logging} className="btn-primary">
                {logging
                  ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto"/>
                  : <span className={isBn?'font-bengali':''}>{t('dashboard.log_study')}</span>}
              </button>
            </div>
          </div>
        </div>
      )}
      <BottomNav/>
    </div>
  )
}
