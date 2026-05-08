import { useState, useEffect, useRef } from 'react'
import { doc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore'
import { signOut } from 'firebase/auth'
import { db, auth } from '../firebase/config'
import { useAuth } from '../contexts/AuthContext'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { format } from 'date-fns'
import BottomNav from '../components/BottomNav'
import PhotoCropper from '../components/PhotoCropper'
import { exportStudyReport } from '../utils/pdfExport'
import { uploadProfilePhoto } from '../utils/photoUpload'
import toast from 'react-hot-toast'
import { User, Edit3, LogOut, Download, Target, Flame, TrendingUp, Calendar, Camera, Loader2 } from 'lucide-react'

const GROUPS = ['science', 'arts', 'commerce']
const GOALS  = [4, 6, 8, 10, 12, 14, 16]

export default function Account() {
  const { user, profile, refreshProfile, getPhotoURL } = useAuth()
  const { t, i18n } = useTranslation()
  const navigate     = useNavigate()
  const isBn         = i18n.language === 'bn'
  const fileInputRef = useRef(null)

  const [editing,       setEditing]       = useState(false)
  const [form,          setForm]          = useState({ name:'', college:'', group:'', dailyGoal:8 })
  const [saving,        setSaving]        = useState(false)
  const [exporting,     setExporting]     = useState(false)
  const [allLogs,       setAllLogs]       = useState([])
  const [rawImageSrc,   setRawImageSrc]   = useState(null)
  const [showCropper,   setShowCropper]   = useState(false)
  const [uploadingPhoto,setUploadingPhoto]= useState(false)

  useEffect(() => {
    if (profile) {
      setForm({ name:profile.name||'', college:profile.college||'', group:profile.group||'', dailyGoal:profile.dailyGoal||8 })
      fetchAllLogs()
    }
  }, [profile])

  const fetchAllLogs = async () => {
    if (!user) return
    try {
      const snap = await getDocs(query(collection(db,'studyLogs'), where('userId','==',user.uid)))
      const logs = snap.docs.map(d=>({id:d.id,...d.data()}))
      logs.sort((a,b)=>(b.date||'').localeCompare(a.date||''))
      setAllLogs(logs)
    } catch (err) { console.error(err) }
  }

  // ── Photo ──────────────────────────────────────────────────
  const handlePhotoClick = () => fileInputRef.current?.click()

  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) { toast.error('Please select an image'); return }
    const reader = new FileReader()
    reader.onload = () => { setRawImageSrc(reader.result); setShowCropper(true) }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  const handleCropDone = async (blob) => {
    setShowCropper(false)
    setRawImageSrc(null)
    setUploadingPhoto(true)
    try {
      await uploadProfilePhoto(user.uid, blob)
      await refreshProfile()
      toast.success(isBn ? 'প্রোফাইল ফটো সেট হয়েছে! 📸' : 'Profile photo updated! 📸')
    } catch (err) {
      console.error(err)
      toast.error(err.message || 'Upload failed. Try again.')
    } finally {
      setUploadingPhoto(false)
    }
  }

  const handleCropCancel = () => { setShowCropper(false); setRawImageSrc(null) }

  // ── Profile edit ───────────────────────────────────────────
  const handleSave = async () => {
    if (!form.name.trim() || !form.college.trim()) { toast.error('Fill all fields'); return }
    setSaving(true)
    try {
      await updateDoc(doc(db,'users',user.uid), {
        name:form.name.trim(), college:form.college.trim(), group:form.group, dailyGoal:form.dailyGoal
      })
      await refreshProfile()
      setEditing(false)
      toast.success('Profile updated! ✅')
    } catch(err) { toast.error('Update failed') }
    finally { setSaving(false) }
  }

  const handleExportPDF = async () => {
    setExporting(true)
    try { await exportStudyReport({ profile, allLogs, t }); toast.success('Report downloaded! 📄') }
    catch(err) { console.error(err); toast.error('Export failed.') }
    finally { setExporting(false) }
  }

  const handleLogout = async () => { await signOut(auth); navigate('/login') }

  const currentPhoto = getPhotoURL(profile?.name)
  const totalHours   = Math.floor((profile?.totalMinutes||0)/60)
  const daysStudied  = profile?.daysStudied||0
  const avgMins      = daysStudied>0 ? Math.round((profile?.totalMinutes||0)/daysStudied) : 0
  const joinedDate   = profile?.joinedAt ? format(new Date(profile.joinedAt),'dd MMM yyyy') : '—'
  const groupLabel   = { science:'Science 🔬', arts:'Arts 🎨', commerce:'Commerce 💼' }

  if (showCropper && rawImageSrc) {
    return <PhotoCropper imageSrc={rawImageSrc} onCropDone={handleCropDone} onCancel={handleCropCancel} isBn={isBn} />
  }

  return (
    <div className="min-h-screen bg-surface-900">
      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />

      <div className="page-container pt-6">

        {/* Header */}
        <div className="flex items-center justify-between mb-5 pr-14">
          <div className="flex items-center gap-2">
            <User size={20} className="text-brand-400" />
            <h1 className={`text-xl font-display font-bold text-white ${isBn?'font-bengali':''}`}>
              {t('account.title')}
            </h1>
          </div>
          <button onClick={() => { setEditing(!editing); setForm({name:profile?.name||'',college:profile?.college||'',group:profile?.group||'',dailyGoal:profile?.dailyGoal||8}) }}
            className="flex items-center gap-1.5 text-brand-400 text-xs font-display">
            <Edit3 size={14}/>
            <span className={isBn?'font-bengali':''}>{editing?t('account.cancel'):t('account.edit')}</span>
          </button>
        </div>

        {/* Profile card */}
        <div className="card mb-4">
          <div className="flex items-center gap-4 mb-4">

            {/* Avatar */}
            <div className="relative flex-shrink-0">
              <div className={`w-20 h-20 rounded-2xl border-2 border-brand-500/40 overflow-hidden ${uploadingPhoto?'opacity-50':''}`}>
                <img
                  src={currentPhoto}
                  alt="avatar"
                  className="w-full h-full object-cover"
                  onError={e => {
                    e.target.onerror = null
                    e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(profile?.name||'User')}&background=0ea5e9&color=fff&size=160`
                  }}
                />
              </div>
              {uploadingPhoto && (
                <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-black/50">
                  <Loader2 size={22} className="text-white animate-spin"/>
                </div>
              )}
              {/* Camera button */}
              <button onClick={handlePhotoClick} disabled={uploadingPhoto}
                className="absolute -bottom-2 -right-2 w-7 h-7 bg-brand-500 hover:bg-brand-600 rounded-full border-2 border-surface-800 flex items-center justify-center transition-colors active:scale-90 disabled:opacity-50 shadow-lg">
                <Camera size={12} className="text-white"/>
              </button>
            </div>

            <div className="flex-1 min-w-0">
              {editing ? (
                <input type="text" value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))}
                  className="input-field text-sm mb-1" placeholder="Your name"/>
              ) : (
                <h2 className="text-lg font-display font-bold text-white truncate">{profile?.name}</h2>
              )}
              <p className="text-white/40 text-xs truncate">{user?.email}</p>
              {!editing && (
                <>
                  <span className="inline-block mt-1 text-xs bg-brand-500/20 text-brand-300 px-2 py-0.5 rounded-full">
                    {groupLabel[profile?.group]||'—'}
                  </span>
                  <button onClick={handlePhotoClick} disabled={uploadingPhoto}
                    className="flex items-center gap-1 mt-1.5 text-white/30 hover:text-white/60 text-[10px] font-display transition-colors">
                    <Camera size={10}/>
                    <span className={isBn?'font-bengali':''}>
                      {uploadingPhoto?(isBn?'আপলোড হচ্ছে...':'Saving...'):(isBn?'ফটো পরিবর্তন করো':'Change photo')}
                    </span>
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Edit form */}
          {editing ? (
            <div className="space-y-3">
              <div>
                <label className={`block text-white/50 text-xs mb-1.5 ${isBn?'font-bengali':''}`}>{t('onboarding.college')}</label>
                <input type="text" value={form.college} onChange={e=>setForm(f=>({...f,college:e.target.value}))} className="input-field" placeholder="Your college"/>
              </div>
              <div>
                <label className={`block text-white/50 text-xs mb-1.5 ${isBn?'font-bengali':''}`}>{t('onboarding.group')}</label>
                <div className="grid grid-cols-3 gap-2">
                  {GROUPS.map(g=>(
                    <button key={g} onClick={()=>setForm(f=>({...f,group:g}))}
                      className={`py-2.5 rounded-xl text-xs font-display border transition-all ${form.group===g?'bg-brand-500 border-brand-400 text-white':'bg-surface-700 border-white/10 text-white/50'}`}>
                      <span className={isBn?'font-bengali':''}>{t(`onboarding.groups.${g}`)}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className={`block text-white/50 text-xs mb-1.5 ${isBn?'font-bengali':''}`}>
                  {t('onboarding.daily_goal')} — <span className="text-brand-400 font-bold">{form.dailyGoal}h</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {GOALS.map(g=>(
                    <button key={g} onClick={()=>setForm(f=>({...f,dailyGoal:g}))}
                      className={`w-11 h-9 rounded-lg text-xs font-display font-semibold border transition-all ${form.dailyGoal===g?'bg-accent-500 border-accent-400 text-white':'bg-surface-700 border-white/10 text-white/50'}`}>
                      {g}h
                    </button>
                  ))}
                </div>
              </div>
              <button onClick={handleSave} disabled={saving} className="btn-primary w-full">
                {saving?<div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto"/>:<span className={isBn?'font-bengali':''}>{t('account.save')}</span>}
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {[
                {label:t('onboarding.college'), value:profile?.college||'—',       color:'text-white'       },
                {label:t('account.goal'),       value:`${profile?.dailyGoal||8}h/day`, color:'text-accent-400'  },
                {label:t('account.joined'),     value:joinedDate,                  color:'text-white'       },
                {label:'Days Studied',          value:`${daysStudied}`,            color:'text-green-400'   },
              ].map(({label,value,color})=>(
                <div key={label} className="bg-surface-700 rounded-xl p-3">
                  <p className="text-white/40 text-[10px] mb-0.5">{label}</p>
                  <p className={`font-display font-semibold text-xs truncate ${color}`}>{value}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Stats */}
        {!editing && (
          <div className="card mb-4">
            <h3 className={`text-sm font-display font-semibold text-white/80 mb-3 ${isBn?'font-bengali':''}`}>{t('account.stats')}</h3>
            <div className="grid grid-cols-2 gap-3">
              {[
                {icon:TrendingUp, label:t('account.total_study'), value:`${totalHours}h`,                  color:'text-brand-400',  bg:'bg-brand-500/10' },
                {icon:Target,     label:t('account.daily_avg'),   value:`${Math.floor(avgMins/60)}h ${avgMins%60}m`, color:'text-accent-400', bg:'bg-accent-500/10'},
                {icon:Flame,      label:t('account.streak'),      value:`${profile?.streak||0} days 🔥`,    color:'text-orange-400', bg:'bg-orange-500/10'},
                {icon:Calendar,   label:'Days Studied',           value:`${daysStudied} days`,               color:'text-green-400',  bg:'bg-green-500/10' },
              ].map(({icon:Icon,label,value,color,bg})=>(
                <div key={label} className={`${bg} rounded-xl p-3 flex items-center gap-3`}>
                  <Icon size={16} className={`${color} flex-shrink-0`}/>
                  <div className="min-w-0">
                    <p className={`text-[10px] text-white/40 ${isBn?'font-bengali':''}`}>{label}</p>
                    <p className={`font-display font-bold text-sm ${color}`}>{value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        {!editing && (
          <div className="space-y-3 mb-6">
            <button onClick={handleExportPDF} disabled={exporting}
              className="w-full flex items-center justify-center gap-2 bg-green-500/15 border border-green-500/25 text-green-400 py-3.5 rounded-xl font-display font-semibold text-sm active:scale-95 transition-all disabled:opacity-60">
              {exporting?<Loader2 size={16} className="animate-spin"/>:<Download size={16}/>}
              <span className={isBn?'font-bengali':''}>{exporting?(isBn?'তৈরি হচ্ছে...':'Generating...'):t('account.export_pdf')}</span>
            </button>
            <button onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 bg-red-500/10 border border-red-500/20 text-red-400 py-3.5 rounded-xl font-display font-semibold text-sm active:scale-95 transition-all">
              <LogOut size={16}/>
              <span className={isBn?'font-bengali':''}>{t('account.logout')}</span>
            </button>
          </div>
        )}

        <p className="text-center text-white/20 text-xs mb-4">
          Built with ❤️ by{' '}
          <a href="https://arnnikislam.vercel.app" target="_blank" rel="noopener noreferrer"
            className="text-brand-400/50 hover:text-brand-400 transition-colors">
            Arnnik Islam Payel
          </a>
        </p>
        <div className="h-4"/>
      </div>
      <BottomNav/>
    </div>
  )
}
