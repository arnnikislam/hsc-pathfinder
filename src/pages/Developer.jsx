import { useTranslation } from 'react-i18next'
import BottomNav from '../components/BottomNav'
import { ExternalLink, Github, Youtube, Linkedin, Mail, Globe, Code2, Wifi, Video } from 'lucide-react'

// Developer photo direct URL from imgbb
const DEV_PHOTO = 'https://i.ibb.co/bt23vwDj/developer.jpg'
const DEV_PHOTO_FALLBACK = 'https://ui-avatars.com/api/?name=Arnnik+Islam+Payel&background=0ea5e9&color=fff&size=160'

const LINKS = [
  { icon: Globe,    label: 'Portfolio', url: 'https://arnnikislam.vercel.app',       color: 'text-brand-400',  bg: 'bg-brand-500/15'  },
  { icon: Github,   label: 'GitHub',    url: 'https://github.com/arnnikislam',       color: 'text-white/80',   bg: 'bg-white/10'      },
  { icon: Youtube,  label: 'YouTube',   url: 'https://youtube.com/@arnnikislam',     color: 'text-red-400',    bg: 'bg-red-500/15'    },
  { icon: Linkedin, label: 'LinkedIn',  url: 'https://linkedin.com/in/arnnikislam',  color: 'text-blue-400',   bg: 'bg-blue-500/15'   },
  { icon: Mail,     label: 'Email',     url: 'mailto:arnnikislam.socials@gmail.com', color: 'text-accent-400', bg: 'bg-accent-500/15' },
]

const SKILLS = [
  { icon: Code2, label: 'Web Developer',   desc: 'React, Node.js, Firebase' },
  { icon: Wifi,  label: 'Wi-Fi Pentester', desc: 'Ethical Hacking & Security' },
  { icon: Video, label: 'Content Creator', desc: 'Tech & Programming' },
]

export default function Developer() {
  const { t, i18n } = useTranslation()
  const isBn = i18n.language === 'bn'

  return (
    <div className="min-h-screen bg-surface-900">
      <div className="page-container pt-6">

        <div className="flex items-center gap-2 mb-5">
          <Code2 size={20} className="text-brand-400" />
          <h1 className={`text-xl font-display font-bold text-white ${isBn ? 'font-bengali' : ''}`}>
            {t('developer.title')}
          </h1>
        </div>

        {/* Profile card */}
        <div className="relative overflow-hidden card mb-4">
          <div className="absolute top-0 right-0 w-32 h-32 bg-brand-500/10 rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-accent-500/10 rounded-full translate-y-1/2 -translate-x-1/2 pointer-events-none" />

          <div className="relative flex items-center gap-4 mb-4">
            <div className="relative flex-shrink-0">
              <img
                src={DEV_PHOTO}
                alt="Arnnik Islam Payel"
                className="w-20 h-20 rounded-2xl object-cover border-2 border-brand-500/40"
                onError={e => { e.target.onerror = null; e.target.src = DEV_PHOTO_FALLBACK }}
              />
              <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-surface-800 flex items-center justify-center">
                <span className="text-[8px] text-white">✓</span>
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <h2 className={`text-lg font-display font-bold text-white ${isBn ? 'font-bengali' : ''}`}>
                {t('developer.name')}
              </h2>
              <p className={`text-white/50 text-[10px] leading-relaxed mt-0.5 ${isBn ? 'font-bengali' : ''}`}>
                {t('developer.role')}
              </p>
              <div className="flex items-center gap-1 mt-1.5 flex-wrap">
                <span className="text-[9px] bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full font-display">🇧🇩 Bangladesh</span>
                <span className="text-[9px] bg-brand-500/20 text-brand-300 px-2 py-0.5 rounded-full font-display">HSC 2026</span>
              </div>
            </div>
          </div>

          <div className="bg-surface-700 rounded-xl p-3 mb-4">
            <p className={`text-white/60 text-xs leading-relaxed ${isBn ? 'font-bengali' : ''}`}>
              {t('developer.bio')}
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2 mb-4">
            {SKILLS.map(({ icon: Icon, label, desc }) => (
              <div key={label} className="bg-surface-700 rounded-xl p-3 text-center">
                <Icon size={18} className="text-brand-400 mx-auto mb-1.5" />
                <p className="text-white text-[10px] font-display font-semibold leading-tight">{label}</p>
                <p className="text-white/30 text-[8px] mt-0.5">{desc}</p>
              </div>
            ))}
          </div>

          <div className="space-y-2">
            {LINKS.map(({ icon: Icon, label, url, color, bg }) => (
              <a key={label} href={url} target="_blank" rel="noopener noreferrer"
                className={`flex items-center gap-3 ${bg} rounded-xl px-4 py-3 hover:opacity-90 transition-opacity active:scale-95`}>
                <Icon size={16} className={color} />
                <span className={`font-display font-medium text-sm ${color}`}>{label}</span>
                <ExternalLink size={12} className="ml-auto text-white/20" />
              </a>
            ))}
          </div>
        </div>

        {/* App info */}
        <div className="card mb-4">
          <h3 className="text-sm font-display font-bold text-white mb-3">About HSC PathFinder</h3>
          <div className="space-y-2 text-xs text-white/50 leading-relaxed">
            <p>🎓 Built for <span className="text-white/80">HSC 2026</span> candidates in Bangladesh</p>
            <p>📱 Progressive Web App — install on any device</p>
            <p>🔐 Secured with Firebase Authentication</p>
            <p>🌐 Available in <span className="text-white/80">Bangla & English</span></p>
            <p>🏆 Real-time leaderboard across all HSC groups</p>
            <p>📄 Export personal study report as PDF</p>
          </div>
          <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between">
            <span className="text-white/30 text-[10px] font-display">Version 1.0.0</span>
            <span className="text-white/30 text-[10px] font-display">HSC 2026 Edition</span>
          </div>
        </div>

        <div className="text-center py-4">
          <p className={`text-white/30 text-xs mb-1 ${isBn ? 'font-bengali' : ''}`}>{t('developer.credit')}</p>
          <a href="https://arnnikislam.vercel.app" target="_blank" rel="noopener noreferrer"
            className="text-brand-400/60 hover:text-brand-400 text-xs font-display transition-colors">
            arnnikislam.vercel.app
          </a>
        </div>
        <div className="h-4" />
      </div>
      <BottomNav />
    </div>
  )
}
