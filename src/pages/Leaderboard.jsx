import { useState, useEffect } from 'react'
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore'
import { db } from '../firebase/config'
import { useAuth } from '../contexts/AuthContext'
import { useTranslation } from 'react-i18next'
import { format, startOfDay, startOfWeek, startOfMonth } from 'date-fns'
import BottomNav from '../components/BottomNav'
import { Trophy, Medal, Crown, RefreshCw } from 'lucide-react'

const TABS   = ['today','this_week','this_month','all_time']
const GROUPS = ['all_groups','science','arts','commerce']

function RankIcon({ rank }) {
  if (rank === 1) return <Crown  size={16} className="text-yellow-400" />
  if (rank === 2) return <Medal  size={16} className="text-gray-300"   />
  if (rank === 3) return <Medal  size={16} className="text-amber-600"  />
  return <span className="text-white/40 font-display text-sm w-4 text-center">{rank}</span>
}

function fmtMin(m) {
  const h = Math.floor(m/60), min = m%60
  if (h > 0 && min > 0) return `${h}h ${min}m`
  if (h > 0) return `${h}h`
  return `${min}m`
}

export default function Leaderboard() {
  const { user } = useAuth()
  const { t, i18n } = useTranslation()
  const isBn = i18n.language === 'bn'

  const [activeTab,   setActiveTab]   = useState('today')
  const [activeGroup, setActiveGroup] = useState('all_groups')
  const [entries,     setEntries]     = useState([])
  const [loading,     setLoading]     = useState(true)
  const [error,       setError]       = useState(null)

  useEffect(() => { fetchLeaderboard() }, [activeTab, activeGroup])

  const getDateFrom = () => {
    const now = new Date()
    if (activeTab === 'today')      return format(startOfDay(now),                          'yyyy-MM-dd')
    if (activeTab === 'this_week')  return format(startOfWeek(now, { weekStartsOn: 6 }),    'yyyy-MM-dd')
    if (activeTab === 'this_month') return format(startOfMonth(now),                        'yyyy-MM-dd')
    return '2025-01-01' // all time
  }

  const fetchLeaderboard = async () => {
    setLoading(true)
    setError(null)
    try {
      const dateFrom = getDateFrom()

      // Step 1: fetch logs from dateFrom
      const logsQ = query(
        collection(db, 'studyLogs'),
        where('date', '>=', dateFrom)
      )
      const logsSnap = await getDocs(logsQ)

      if (logsSnap.empty) { setEntries([]); setLoading(false); return }

      // Step 2: aggregate minutes per user
      const userMinutes = {}
      logsSnap.docs.forEach(d => {
        const { userId, minutes } = d.data()
        if (!userId || !minutes) return
        userMinutes[userId] = (userMinutes[userId] || 0) + minutes
      })

      if (Object.keys(userMinutes).length === 0) { setEntries([]); setLoading(false); return }

      // Step 3: fetch all user profiles
      const usersSnap = await getDocs(collection(db, 'users'))
      const usersMap = {}
      usersSnap.docs.forEach(d => { usersMap[d.id] = d.data() })

      // Step 4: build board
      let board = Object.entries(userMinutes)
        .map(([uid, minutes]) => ({ uid, minutes, ...usersMap[uid] }))
        .filter(e => e.name) // only users who completed onboarding

      // Step 5: group filter
      if (activeGroup !== 'all_groups') {
        board = board.filter(e => e.group === activeGroup)
      }

      // Step 6: sort desc
      board.sort((a, b) => b.minutes - a.minutes)

      setEntries(board.slice(0, 50))
    } catch (err) {
      console.error('Leaderboard error:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const groupIcon = { science:'🔬', arts:'🎨', commerce:'💼' }

  return (
    <div className="min-h-screen bg-surface-900">
      <div className="page-container pt-6">

        {/* Header */}
        <div className="flex items-center justify-between mb-5 pr-16">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <Trophy size={20} className="text-yellow-400" />
              <h1 className={`text-xl font-display font-bold text-white ${isBn ? 'font-bengali' : ''}`}>
                {t('leaderboard.title')}
              </h1>
            </div>
            <p className={`text-white/40 text-xs ${isBn ? 'font-bengali' : ''}`}>
              {t('leaderboard.subtitle')}
            </p>
          </div>
          <button onClick={fetchLeaderboard} className="text-white/30 hover:text-white transition-colors">
            <RefreshCw size={16} />
          </button>
        </div>

        {/* Time tabs */}
        <div className="flex gap-1 mb-3 bg-surface-800 p-1 rounded-xl">
          {TABS.map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2 rounded-lg text-[10px] font-display font-semibold transition-all duration-200 ${
                activeTab === tab ? 'bg-brand-500 text-white shadow-lg' : 'text-white/40 hover:text-white/70'
              }`}>
              <span className={isBn ? 'font-bengali' : ''}>{t(`leaderboard.${tab}`)}</span>
            </button>
          ))}
        </div>

        {/* Group filter */}
        <div className="flex gap-2 mb-4 overflow-x-auto no-scrollbar pb-1">
          {GROUPS.map(g => (
            <button key={g} onClick={() => setActiveGroup(g)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-display font-medium transition-all border ${
                activeGroup === g ? 'bg-accent-500 border-accent-400 text-white' : 'bg-surface-700 border-white/10 text-white/50 hover:text-white'
              }`}>
              <span className={isBn ? 'font-bengali' : ''}>{t(`leaderboard.${g}`)}</span>
            </button>
          ))}
        </div>

        {/* Error state */}
        {error && (
          <div className="card bg-red-500/10 border border-red-500/20 mb-4">
            <p className="text-red-400 text-xs text-center">Error: {error}</p>
            <p className="text-white/30 text-[10px] text-center mt-1">Check Firestore indexes in Firebase Console</p>
          </div>
        )}

        {/* List */}
        {loading ? (
          <div className="space-y-3">
            {[1,2,3,4,5].map(i => <div key={i} className="h-16 rounded-2xl shimmer" />)}
          </div>
        ) : entries.length === 0 ? (
          <div className="text-center py-16">
            <Trophy size={40} className="text-white/10 mx-auto mb-3" />
            <p className={`text-white/30 text-sm ${isBn ? 'font-bengali' : ''}`}>{t('leaderboard.empty')}</p>
            <p className="text-white/20 text-xs mt-1">
              {isBn ? 'প্রথমে পড়া লগ করো!' : 'Log some study time first!'}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {entries.map((entry, idx) => {
              const rank = idx + 1
              const isMe = entry.uid === user?.uid
              return (
                <div key={entry.uid}
                  className={`flex items-center gap-3 rounded-2xl px-4 py-3 border transition-all ${
                    isMe ? 'bg-brand-500/10 border-brand-500/30' :
                    rank <= 3 ? 'bg-surface-700 border-white/10' : 'bg-surface-800 border-white/5'
                  }`}>
                  <div className="w-5 flex justify-center flex-shrink-0">
                    <RankIcon rank={rank} />
                  </div>
                  <img
                    src={entry.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(entry.name)}&background=0ea5e9&color=fff&size=40`}
                    alt={entry.name}
                    className={`w-10 h-10 rounded-full flex-shrink-0 border-2 ${
                      rank===1?'border-yellow-400':rank===2?'border-gray-300':rank===3?'border-amber-600':'border-white/10'
                    }`}
                    onError={e => { e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(entry.name)}&background=0ea5e9&color=fff&size=40` }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className={`text-sm font-display font-semibold truncate ${isMe ? 'text-brand-300' : 'text-white'}`}>
                        {entry.name}{isMe ? ' (You)' : ''}
                      </p>
                      <span className="text-xs flex-shrink-0">{groupIcon[entry.group] || ''}</span>
                    </div>
                    <p className="text-[10px] text-white/40 truncate">{entry.college}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className={`font-display font-bold text-sm ${
                      rank===1?'text-yellow-400':rank===2?'text-gray-300':rank===3?'text-amber-500':'text-brand-400'
                    }`}>{fmtMin(entry.minutes)}</p>
                    <p className="text-[9px] text-white/30 font-display">{t('leaderboard.hours')}</p>
                  </div>
                </div>
              )
            })}
          </div>
        )}
        <div className="h-4" />
      </div>
      <BottomNav />
    </div>
  )
}
