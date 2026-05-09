import { useState, useEffect } from 'react'
import { collection, getDocs, doc, updateDoc, deleteDoc, addDoc, Timestamp, query, orderBy } from 'firebase/firestore'
import { db } from '../firebase/config'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import toast from 'react-hot-toast'
import {
  Shield, Users, BarChart2, Megaphone, Search,
  Ban, CheckCircle, Trash2, Eye, X, ChevronDown,
  TrendingUp, Clock, BookOpen, RefreshCw, LogOut
} from 'lucide-react'

const ADMIN_UID = '9vzlZq07o4MCRMm50zdTnYwFSLI2'

function fmtMin(m) {
  const h = Math.floor((m||0)/60), min = (m||0)%60
  if (h>0&&min>0) return `${h}h ${min}m`
  if (h>0) return `${h}h`
  return `${min}m`
}

function StatCard({ icon: Icon, label, value, color = 'text-brand-400', bg = 'bg-brand-500/10' }) {
  return (
    <div className={`${bg} rounded-2xl p-4 flex items-center gap-3`}>
      <Icon size={20} className={color} />
      <div>
        <p className="text-white/40 text-[10px] font-display">{label}</p>
        <p className={`text-xl font-display font-bold ${color}`}>{value}</p>
      </div>
    </div>
  )
}

export default function Admin() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { i18n } = useTranslation()

  const [tab,           setTab]           = useState('overview')
  const [users,         setUsers]         = useState([])
  const [logs,          setLogs]          = useState([])
  const [loading,       setLoading]       = useState(true)
  const [search,        setSearch]        = useState('')
  const [selectedUser,  setSelectedUser]  = useState(null)
  const [userLogs,      setUserLogs]      = useState([])
  const [annoText,      setAnnoText]      = useState('')
  const [annoEn,        setAnnoEn]        = useState('')
  const [sendingAnno,   setSendingAnno]   = useState(false)
  const [announcements, setAnnouncements] = useState([])
  const [groupFilter,   setGroupFilter]   = useState('all')
  const [actionLoading, setActionLoading] = useState('')

  // Guard — only admin can access
  useEffect(() => {
    if (!user) { navigate('/login'); return }
    if (user.uid !== ADMIN_UID) { navigate('/dashboard'); return }
    fetchAll()
  }, [user])

  const fetchAll = async () => {
    setLoading(true)
    try {
      const [usersSnap, logsSnap, annoSnap] = await Promise.all([
        getDocs(collection(db, 'users')),
        getDocs(collection(db, 'studyLogs')),
        getDocs(collection(db, 'announcements')),
      ])
      const u = usersSnap.docs.map(d => ({ id: d.id, ...d.data() }))
      const l = logsSnap.docs.map(d => ({ id: d.id, ...d.data() }))
      const a = annoSnap.docs.map(d => ({ id: d.id, ...d.data() }))
      a.sort((x,y) => (y.createdAt?.seconds||0) - (x.createdAt?.seconds||0))
      setUsers(u)
      setLogs(l)
      setAnnouncements(a)
    } catch (err) {
      toast.error('Failed to load data: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  // ── Stats ────────────────────────────────────────────────────
  const totalUsers    = users.length
  const bannedUsers   = users.filter(u => u.isBanned).length
  const verifiedUsers = users.filter(u => u.isVerified).length
  const totalMinutes  = logs.reduce((s,l) => s + (l.minutes||0), 0)
  const today         = new Date().toISOString().slice(0,10)
  const activeToday   = new Set(logs.filter(l => l.date === today).map(l => l.userId)).size
  const scienceCount  = users.filter(u => u.group==='science').length
  const artsCount     = users.filter(u => u.group==='arts').length
  const commerceCount = users.filter(u => u.group==='commerce').length

  // College stats
  const collegeMap = {}
  users.forEach(u => {
    if (u.college) collegeMap[u.college] = (collegeMap[u.college]||0) + 1
  })
  const topColleges = Object.entries(collegeMap).sort((a,b)=>b[1]-a[1]).slice(0,5)

  // ── User actions ─────────────────────────────────────────────
  const toggleBan = async (u) => {
    setActionLoading(u.id + '_ban')
    try {
      await updateDoc(doc(db,'users',u.id), { isBanned: !u.isBanned })
      setUsers(prev => prev.map(x => x.id===u.id ? {...x, isBanned:!x.isBanned} : x))
      toast.success(`User ${u.isBanned ? 'unbanned' : 'banned'} ✅`)
    } catch(err) { toast.error('Failed: ' + err.message) }
    finally { setActionLoading('') }
  }

  const toggleVerify = async (u) => {
    setActionLoading(u.id + '_verify')
    try {
      await updateDoc(doc(db,'users',u.id), { isVerified: !u.isVerified })
      setUsers(prev => prev.map(x => x.id===u.id ? {...x, isVerified:!x.isVerified} : x))
      toast.success(`User ${u.isVerified ? 'unverified' : 'verified'} ✅`)
    } catch(err) { toast.error('Failed: ' + err.message) }
    finally { setActionLoading('') }
  }

  const deleteUserData = async (u) => {
    if (!window.confirm(`Delete ALL data for ${u.name}? This cannot be undone.`)) return
    setActionLoading(u.id + '_delete')
    try {
      // Delete all logs
      const userLogs = logs.filter(l => l.userId === u.id)
      await Promise.all(userLogs.map(l => deleteDoc(doc(db,'studyLogs',l.id))))
      // Reset user stats
      await updateDoc(doc(db,'users',u.id), { totalMinutes:0, daysStudied:0, streak:0 })
      setLogs(prev => prev.filter(l => l.userId !== u.id))
      toast.success(`All data deleted for ${u.name}`)
    } catch(err) { toast.error('Failed: ' + err.message) }
    finally { setActionLoading('') }
  }

  const viewUserLogs = (u) => {
    const ul = logs.filter(l => l.userId === u.id)
    ul.sort((a,b) => (b.date||'').localeCompare(a.date||''))
    setUserLogs(ul)
    setSelectedUser(u)
  }

  // ── Announcements ────────────────────────────────────────────
  const sendAnnouncement = async () => {
    if (!annoText.trim()) { toast.error('Enter announcement text'); return }
    setSendingAnno(true)
    try {
      await addDoc(collection(db,'announcements'), {
        text:      annoText.trim(),
        textEn:    annoEn.trim() || annoText.trim(),
        createdAt: Timestamp.now(),
        active:    true,
        adminId:   user.uid,
      })
      toast.success('Announcement sent to all users! 📢')
      setAnnoText('')
      setAnnoEn('')
      fetchAll()
    } catch(err) { toast.error('Failed: ' + err.message) }
    finally { setSendingAnno(false) }
  }

  const deleteAnnouncement = async (id) => {
    try {
      await deleteDoc(doc(db,'announcements',id))
      setAnnouncements(prev => prev.filter(a => a.id !== id))
      toast.success('Announcement deleted')
    } catch(err) { toast.error('Failed') }
  }

  // ── Filtered users ───────────────────────────────────────────
  const filteredUsers = users.filter(u => {
    const q = search.toLowerCase()
    const matchSearch = !q || u.name?.toLowerCase().includes(q) || u.college?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q)
    const matchGroup  = groupFilter === 'all' || u.group === groupFilter
    return matchSearch && matchGroup
  }).sort((a,b) => (b.totalMinutes||0) - (a.totalMinutes||0))

  const TABS = [
    { key:'overview',      label:'Overview',      icon:BarChart2  },
    { key:'users',         label:'Users',         icon:Users      },
    { key:'announcements', label:'Announce',      icon:Megaphone  },
  ]

  if (loading) {
    return (
      <div className="min-h-screen bg-surface-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-brand-400 border-t-transparent rounded-full animate-spin mx-auto mb-3"/>
          <p className="text-white/40 text-sm font-display">Loading admin panel...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-surface-900 pb-24">
      {/* Header */}
      <div className="bg-surface-800 border-b border-white/10 px-4 py-4 sticky top-0 z-40">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield size={20} className="text-brand-400"/>
            <div>
              <h1 className="text-white font-display font-bold text-base leading-none">Admin Panel</h1>
              <p className="text-white/30 text-[10px] font-display">HSC PathFinder</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={fetchAll} className="text-white/40 hover:text-white p-2 transition-colors">
              <RefreshCw size={15}/>
            </button>
            <button onClick={() => navigate('/dashboard')} className="text-white/40 hover:text-white p-2 transition-colors">
              <LogOut size={15}/>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 pt-4">

        {/* Tab bar */}
        <div className="flex bg-surface-800 rounded-xl p-1 gap-1 mb-4">
          {TABS.map(({ key, label, icon: Icon }) => (
            <button key={key} onClick={() => setTab(key)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-display font-semibold transition-all ${
                tab===key ? 'bg-brand-500 text-white shadow' : 'text-white/40 hover:text-white/70'
              }`}>
              <Icon size={13}/>
              {label}
            </button>
          ))}
        </div>

        {/* ── OVERVIEW ── */}
        {tab === 'overview' && (
          <div className="space-y-4">
            {/* Stats grid */}
            <div className="grid grid-cols-2 gap-3">
              <StatCard icon={Users}      label="Total Users"    value={totalUsers}          color="text-brand-400"  bg="bg-brand-500/10"/>
              <StatCard icon={Clock}      label="Active Today"   value={activeToday}         color="text-green-400"  bg="bg-green-500/10"/>
              <StatCard icon={TrendingUp} label="Total Hours"    value={fmtMin(totalMinutes)} color="text-accent-400" bg="bg-accent-500/10"/>
              <StatCard icon={Ban}        label="Banned Users"   value={bannedUsers}         color="text-red-400"    bg="bg-red-500/10"/>
            </div>

            {/* Group breakdown */}
            <div className="card">
              <h3 className="text-sm font-display font-semibold text-white/80 mb-3">Group Breakdown</h3>
              <div className="space-y-2">
                {[
                  { label:'Science 🔬', count:scienceCount,  color:'bg-blue-500',   pct: totalUsers > 0 ? Math.round(scienceCount/totalUsers*100) : 0 },
                  { label:'Arts 🎨',    count:artsCount,     color:'bg-purple-500', pct: totalUsers > 0 ? Math.round(artsCount/totalUsers*100) : 0 },
                  { label:'Commerce 💼',count:commerceCount, color:'bg-green-500',  pct: totalUsers > 0 ? Math.round(commerceCount/totalUsers*100) : 0 },
                ].map(({ label, count, color, pct }) => (
                  <div key={label}>
                    <div className="flex justify-between mb-1">
                      <span className="text-white/60 text-xs font-display">{label}</span>
                      <span className="text-white/60 text-xs font-display">{count} ({pct}%)</span>
                    </div>
                    <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                      <div className={`h-full ${color} rounded-full transition-all duration-700`} style={{width:`${pct}%`}}/>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Top colleges */}
            <div className="card">
              <h3 className="text-sm font-display font-semibold text-white/80 mb-3">Top Colleges</h3>
              {topColleges.length === 0 ? (
                <p className="text-white/30 text-xs text-center py-3">No data yet</p>
              ) : (
                <div className="space-y-2">
                  {topColleges.map(([college, count], i) => (
                    <div key={college} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                      <div className="flex items-center gap-2">
                        <span className="text-white/30 text-xs font-display w-4">#{i+1}</span>
                        <span className="text-white/70 text-xs font-display truncate max-w-[200px]">{college}</span>
                      </div>
                      <span className="text-brand-400 text-xs font-display font-bold">{count} users</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Recent users */}
            <div className="card">
              <h3 className="text-sm font-display font-semibold text-white/80 mb-3">Latest Registrations</h3>
              <div className="space-y-2">
                {[...users].sort((a,b) => (b.joinedAt||'').localeCompare(a.joinedAt||'')).slice(0,5).map(u => (
                  <div key={u.id} className="flex items-center gap-3 py-2 border-b border-white/5 last:border-0">
                    <img src={u.photoURL||`https://ui-avatars.com/api/?name=${encodeURIComponent(u.name||'U')}&background=0ea5e9&color=fff&size=32`}
                      className="w-7 h-7 rounded-full object-cover flex-shrink-0"
                      onError={e=>e.target.src=`https://ui-avatars.com/api/?name=U&background=0ea5e9&color=fff&size=32`}/>
                    <div className="flex-1 min-w-0">
                      <p className="text-white/80 text-xs font-display font-semibold truncate">{u.name}</p>
                      <p className="text-white/30 text-[10px] truncate">{u.college}</p>
                    </div>
                    <span className="text-[10px] text-white/30 font-display">
                      {u.joinedAt ? new Date(u.joinedAt).toLocaleDateString() : '—'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── USERS ── */}
        {tab === 'users' && (
          <div className="space-y-3">
            {/* Search + filter */}
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30"/>
                <input
                  type="text" value={search} onChange={e=>setSearch(e.target.value)}
                  placeholder="Search name, college, email..."
                  className="input-field pl-8 text-xs py-2.5"/>
              </div>
              <select value={groupFilter} onChange={e=>setGroupFilter(e.target.value)}
                className="input-field text-xs py-2.5 w-28 bg-surface-700 cursor-pointer">
                <option value="all">All</option>
                <option value="science">Science</option>
                <option value="arts">Arts</option>
                <option value="commerce">Commerce</option>
              </select>
            </div>

            <p className="text-white/30 text-[10px] font-display">{filteredUsers.length} users found</p>

            {/* User cards */}
            {filteredUsers.map(u => {
              const userMin = logs.filter(l=>l.userId===u.id).reduce((s,l)=>s+(l.minutes||0),0)
              const gIcon = {science:'🔬',arts:'🎨',commerce:'💼'}[u.group]||'📚'
              return (
                <div key={u.id} className={`card border transition-all ${
                  u.isBanned ? 'border-red-500/30 bg-red-500/5' : 'border-white/5'
                }`}>
                  <div className="flex items-start gap-3">
                    {/* Avatar */}
                    <div className="relative flex-shrink-0">
                      <img src={u.photoURL||`https://ui-avatars.com/api/?name=${encodeURIComponent(u.name||'U')}&background=0ea5e9&color=fff&size=40`}
                        className="w-10 h-10 rounded-xl object-cover"
                        onError={e=>e.target.src=`https://ui-avatars.com/api/?name=U&background=0ea5e9&color=fff&size=40`}/>
                      {u.isVerified && (
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center border border-surface-800">
                          <span className="text-[7px] text-white">✓</span>
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <p className="text-white font-display font-semibold text-sm truncate">{u.name}</p>
                        <span className="text-[10px]">{gIcon}</span>
                        {u.isBanned && <span className="text-[9px] bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded-full font-display">BANNED</span>}
                        {u.isVerified && <span className="text-[9px] bg-green-500/20 text-green-400 px-1.5 py-0.5 rounded-full font-display">✓ Verified</span>}
                      </div>
                      <p className="text-white/40 text-[10px] truncate">{u.college}</p>
                      <p className="text-white/30 text-[10px] truncate">{u.email}</p>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-brand-400 text-[10px] font-display font-bold">{fmtMin(userMin)}</span>
                        <span className="text-white/20 text-[10px]">•</span>
                        <span className="text-white/30 text-[10px] font-display">{u.streak||0}🔥 streak</span>
                        <span className="text-white/20 text-[10px]">•</span>
                        <span className="text-white/30 text-[10px] font-display">{u.daysStudied||0} days</span>
                      </div>
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="flex gap-2 mt-3 flex-wrap">
                    <button onClick={() => viewUserLogs(u)}
                      className="flex items-center gap-1 text-[10px] font-display bg-brand-500/15 text-brand-400 px-2.5 py-1.5 rounded-lg active:scale-95 transition-transform">
                      <Eye size={11}/> View Logs
                    </button>
                    <button onClick={() => toggleVerify(u)}
                      disabled={actionLoading === u.id+'_verify'}
                      className={`flex items-center gap-1 text-[10px] font-display px-2.5 py-1.5 rounded-lg active:scale-95 transition-all ${
                        u.isVerified ? 'bg-green-500/20 text-green-400' : 'bg-white/10 text-white/50'
                      }`}>
                      <CheckCircle size={11}/> {u.isVerified ? 'Unverify' : 'Verify'}
                    </button>
                    <button onClick={() => toggleBan(u)}
                      disabled={actionLoading === u.id+'_ban'}
                      className={`flex items-center gap-1 text-[10px] font-display px-2.5 py-1.5 rounded-lg active:scale-95 transition-all ${
                        u.isBanned ? 'bg-yellow-500/20 text-yellow-400' : 'bg-red-500/15 text-red-400'
                      }`}>
                      <Ban size={11}/> {u.isBanned ? 'Unban' : 'Ban'}
                    </button>
                    <button onClick={() => deleteUserData(u)}
                      disabled={actionLoading === u.id+'_delete'}
                      className="flex items-center gap-1 text-[10px] font-display bg-red-500/10 text-red-500 px-2.5 py-1.5 rounded-lg active:scale-95 transition-transform">
                      <Trash2 size={11}/> Delete Data
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* ── ANNOUNCEMENTS ── */}
        {tab === 'announcements' && (
          <div className="space-y-4">
            {/* Send new */}
            <div className="card">
              <h3 className="text-sm font-display font-semibold text-white/80 mb-3 flex items-center gap-2">
                <Megaphone size={15} className="text-accent-400"/>
                Send Announcement
              </h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-white/50 text-xs mb-1.5 font-display">Bangla Text *</label>
                  <textarea value={annoText} onChange={e=>setAnnoText(e.target.value)} rows={3}
                    placeholder="বাংলায় ঘোষণা লেখো..."
                    className="input-field resize-none font-bengali text-sm"/>
                </div>
                <div>
                  <label className="block text-white/50 text-xs mb-1.5 font-display">English Text (optional)</label>
                  <textarea value={annoEn} onChange={e=>setAnnoEn(e.target.value)} rows={2}
                    placeholder="English announcement..."
                    className="input-field resize-none text-sm"/>
                </div>
                <button onClick={sendAnnouncement} disabled={sendingAnno||!annoText.trim()}
                  className="btn-primary w-full flex items-center justify-center gap-2">
                  {sendingAnno
                    ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>
                    : <><Megaphone size={14}/> Send to All Users</>}
                </button>
              </div>
            </div>

            {/* Active announcements */}
            <div className="card">
              <h3 className="text-sm font-display font-semibold text-white/80 mb-3">Active Announcements</h3>
              {announcements.length === 0 ? (
                <p className="text-white/30 text-xs text-center py-4">No announcements yet</p>
              ) : (
                <div className="space-y-3">
                  {announcements.map(a => (
                    <div key={a.id} className="bg-surface-700 rounded-xl p-3">
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-bengali text-white/80 text-xs leading-relaxed flex-1">{a.text}</p>
                        <button onClick={() => deleteAnnouncement(a.id)}
                          className="text-red-400/50 hover:text-red-400 flex-shrink-0 p-0.5">
                          <X size={14}/>
                        </button>
                      </div>
                      {a.textEn && a.textEn !== a.text && (
                        <p className="text-white/40 text-[10px] mt-1.5 font-display italic">{a.textEn}</p>
                      )}
                      <p className="text-white/20 text-[10px] mt-2 font-display">
                        {a.createdAt?.toDate ? a.createdAt.toDate().toLocaleString() : '—'}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* User logs modal */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end justify-center p-4">
          <div className="w-full max-w-sm bg-surface-800 border border-white/10 rounded-3xl p-5 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-white font-display font-bold text-base">{selectedUser.name}</h3>
                <p className="text-white/40 text-xs">{selectedUser.college}</p>
              </div>
              <button onClick={() => { setSelectedUser(null); setUserLogs([]) }}
                className="text-white/40 hover:text-white p-1">
                <X size={18}/>
              </button>
            </div>
            {userLogs.length === 0 ? (
              <p className="text-white/30 text-sm text-center py-6">No study logs found</p>
            ) : (
              <div className="space-y-2">
                <p className="text-white/30 text-[10px] font-display mb-2">{userLogs.length} log entries</p>
                {userLogs.slice(0,30).map(l => (
                  <div key={l.id} className="flex justify-between items-center bg-surface-700 rounded-xl px-3 py-2.5">
                    <span className="text-white/50 text-xs font-display">{l.date}</span>
                    <span className="text-brand-400 font-display font-bold text-sm">{fmtMin(l.minutes)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
