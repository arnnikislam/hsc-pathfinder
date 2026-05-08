import { useState, useEffect } from 'react'
import { collection, query, where, getDocs } from 'firebase/firestore'
import { db } from '../firebase/config'
import { useAuth } from '../contexts/AuthContext'
import { useTranslation } from 'react-i18next'
import { format, startOfDay, startOfWeek, startOfMonth } from 'date-fns'
import BottomNav from '../components/BottomNav'
import { Trophy, Medal, Crown, RefreshCw } from 'lucide-react'

const TABS   = ['today','this_week','this_month','all_time']
const GROUPS = ['all_groups','science','arts','commerce']

const GROUP_META = {
  science:  { label: 'Science',  icon: '🔬', color: 'bg-blue-500/20 text-blue-300 border-blue-500/30'   },
  arts:     { label: 'Arts',     icon: '🎨', color: 'bg-purple-500/20 text-purple-300 border-purple-500/30' },
  commerce: { label: 'Commerce', icon: '💼', color: 'bg-green-500/20 text-green-300 border-green-500/30'  },
}

const GROUP_META_BN = {
  science:  'বিজ্ঞান',
  arts:     'মানবিক',
  commerce: 'ব্যবসায়',
}

function RankIcon({ rank }) {
  if (rank === 1) return <Crown  size={18} className="text-yellow-400" />
  if (rank === 2) return <Medal  size={18} className="text-gray-300"   />
  if (rank === 3) return <Medal  size={18} className="text-amber-600"  />
  return <span className="text-white/40 font-display font-bold text-sm w-5 text-center">{rank}</span>
}

function fmtMin(m) {
  const h = Math.floor(m / 60), min = m % 60
  if (h > 0 && min > 0) return `${h}h ${min}m`
  if (h > 0) return `${h}h`
  return `${min}m`
}

export default function Leaderboard() {
  const { user }    = useAuth()
  const { t, i18n } = useTranslation()
  const isBn        = i18n.language === 'bn'

  const [activeTab,   setActiveTab]   = useState('today')
  const [activeGroup, setActiveGroup] = useState('all_groups')
  const [entries,     setEntries]     = useState([])
  const [loading,     setLoading]     = useState(true)
  const [errMsg,      setErrMsg]      = useState('')

  useEffect(() => { fetchLeaderboard() }, [activeTab, activeGroup])

  const getDateFrom = () => {
    const now = new Date()
    if (activeTab === 'today')      return format(startOfDay(now),                      'yyyy-MM-dd')
    if (activeTab === 'this_week')  return format(startOfWeek(now,{weekStartsOn:6}),    'yyyy-MM-dd')
    if (activeTab === 'this_month') return format(startOfMonth(now),                    'yyyy-MM-dd')
    return '2025-01-01'
  }

  const fetchLeaderboard = async () => {
    setLoading(true); setErrMsg('')
    try {
      const dateFrom  = getDateFrom()
      const logsSnap  = await getDocs(query(
        collection(db, 'studyLogs'),
        where('date', '>=', dateFrom)
      ))

      if (logsSnap.empty) { setEntries([]); return }

      // Aggregate minutes per userId
      const userMins = {}
      logsSnap.docs.forEach(d => {
        const { userId, minutes } = d.data()
        if (userId && minutes > 0) userMins[userId] = (userMins[userId] || 0) + minutes
      })

      if (!Object.keys(userMins).length) { setEntries([]); return }

      // Fetch all user profiles
      const usersSnap = await getDocs(collection(db, 'users'))
      const usersMap  = {}
      usersSnap.docs.forEach(d => { usersMap[d.id] = d.data() })

      // Build board
      let board = Object.entries(userMins)
        .map(([uid, minutes]) => ({ uid, minutes, ...usersMap[uid] }))
        .filter(e => e.name)

      // Filter by group
      if (activeGroup !== 'all_groups') {
        board = board.filter(e => e.group === activeGroup)
      }

      board.sort((a, b) => b.minutes - a.minutes)
      setEntries(board.slice(0, 50))
    } catch (err) {
      console.error('Leaderboard:', err)
      setErrMsg(err.message || 'Failed to load')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-surface-900">
      <div className="page-container pt-6">

        {/* Header */}
        <div className="flex items-center justify-between mb-5 pr-14">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <Trophy size={20} className="text-yellow-400" />
              <h1 className={`text-xl font-display font-bold text-white ${isBn?'font-bengali':''}`}>
                {t('leaderboard.title')}
              </h1>
            </div>
            <p className={`text-white/40 text-xs ${isBn?'font-bengali':''}`}>
              {t('leaderboard.subtitle')}
            </p>
          </div>
          <button onClick={fetchLeaderboard}
            className="text-white/30 hover:text-white transition-colors p-2 active:scale-90">
            <RefreshCw size={16} />
          </button>
        </div>

        {/* Time tabs */}
        <div className="flex gap-1 mb-3 bg-surface-800 p-1 rounded-xl">
          {TABS.map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2 rounded-lg text-[10px] font-display font-semibold transition-all ${
                activeTab === tab ? 'bg-brand-500 text-white shadow-lg' : 'text-white/40 hover:text-white/60'
              }`}>
              <span className={isBn?'font-bengali':''}>{t(`leaderboard.${tab}`)}</span>
            </button>
          ))}
        </div>

        {/* Group filter */}
        <div className="flex gap-2 mb-4 overflow-x-auto no-scrollbar pb-1">
          {GROUPS.map(g => (
            <button key={g} onClick={() => setActiveGroup(g)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-display font-medium transition-all border ${
                activeGroup === g
                  ? 'bg-accent-500 border-accent-400 text-white'
                  : 'bg-surface-700 border-white/10 text-white/50'
              }`}>
              <span className={isBn?'font-bengali':''}>{t(`leaderboard.${g}`)}</span>
            </button>
          ))}
        </div>

        {/* Error */}
        {errMsg && (
          <div className="card bg-red-500/10 border-red-500/20 mb-4 text-center">
            <p className="text-red-400 text-xs">{errMsg}</p>
          </div>
        )}

        {/* List */}
        {loading ? (
          <div className="space-y-3">
            {[1,2,3,4,5].map(i => <div key={i} className="h-20 rounded-2xl shimmer" />)}
          </div>
        ) : entries.length === 0 && !errMsg ? (
          <div className="text-center py-16">
            <Trophy size={44} className="text-white/10 mx-auto mb-3" />
            <p className={`text-white/30 text-sm ${isBn?'font-bengali':''}`}>{t('leaderboard.empty')}</p>
            <p className="text-white/20 text-xs mt-1 font-display">
              {isBn ? 'প্রথমে পড়া লগ করো!' : 'Log some study time to appear here!'}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {entries.map((entry, idx) => {
              const rank    = idx + 1
              const isMe    = entry.uid === user?.uid
              const grpMeta = GROUP_META[entry.group]
              const grpLabel = isBn
                ? (GROUP_META_BN[entry.group] || entry.group)
                : (grpMeta?.label || entry.group)

              return (
                <div key={entry.uid}
                  className={`flex items-center gap-3 rounded-2xl px-4 py-3 border transition-all ${
                    isMe    ? 'bg-brand-500/10 border-brand-500/30' :
                    rank<=3 ? 'bg-surface-700 border-white/10'     :
                              'bg-surface-800 border-white/5'
                  }`}>

                  {/* Rank */}
                  <div className="w-5 flex justify-center flex-shrink-0">
                    <RankIcon rank={rank} />
                  </div>

                  {/* Avatar */}
                  <img
                    src={entry.photoURL && entry.photoURL.length < 500 ? entry.photoURL : (entry.photoURL?.startsWith("data:") ? entry.photoURL : `https://ui-avatars.com/api/?name=${encodeURIComponent(entry.name)}&background=0ea5e9&color=fff&size=40`)}
                    alt={entry.name}
                    className={`w-11 h-11 rounded-full flex-shrink-0 border-2 object-cover ${
                      rank===1?'border-yellow-400':rank===2?'border-gray-300':rank===3?'border-amber-600':'border-white/10'
                    }`}
                    onError={e => {
                      e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(entry.name)}&background=0ea5e9&color=fff&size=40`
                    }}
                  />

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    {/* Name */}
                    <p className={`text-sm font-display font-semibold truncate ${isMe?'text-brand-300':'text-white'}`}>
                      {entry.name}{isMe ? ' 👤' : ''}
                    </p>

                    {/* College + Group badge on same row */}
                    <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                      <p className="text-[10px] text-white/40 truncate max-w-[120px]">
                        {entry.college}
                      </p>
                      {grpMeta && (
                        <span className={`inline-flex items-center gap-0.5 text-[9px] font-display font-semibold px-1.5 py-0.5 rounded-full border ${grpMeta.color}`}>
                          <span>{grpMeta.icon}</span>
                          <span className={isBn?'font-bengali':''}>{grpLabel}</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Hours */}
                  <div className="text-right flex-shrink-0">
                    <p className={`font-display font-bold text-base ${
                      rank===1?'text-yellow-400':rank===2?'text-gray-300':rank===3?'text-amber-500':'text-brand-400'
                    }`}>
                      {fmtMin(entry.minutes)}
                    </p>
                    <p className="text-[9px] text-white/30 font-display">{t('leaderboard.hours')}</p>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Footer credit */}
        <p className="text-center text-white/15 text-[10px] mt-6 mb-2 font-display">
          Built with ❤️ by Arnnik Islam Payel
        </p>
        <div className="h-4" />
      </div>
      <BottomNav />
    </div>
  )
}
