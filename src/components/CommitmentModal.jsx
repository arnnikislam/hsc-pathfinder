import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { CheckCircle2, X } from 'lucide-react'

// Shows once per day — stored in localStorage with today's date
function shouldShowToday() {
  const last = localStorage.getItem('commitment_shown')
  const today = new Date().toDateString()
  return last !== today
}

function markShownToday() {
  localStorage.setItem('commitment_shown', new Date().toDateString())
}

export default function CommitmentModal() {
  const { i18n } = useTranslation()
  const isBn = i18n.language === 'bn'
  const [show,    setShow]    = useState(false)
  const [checked, setChecked] = useState(false)
  const [closing, setClosing] = useState(false)

  useEffect(() => {
    // Small delay so it doesn't flash on load
    const timer = setTimeout(() => {
      if (shouldShowToday()) setShow(true)
    }, 1200)
    return () => clearTimeout(timer)
  }, [])

  const handleClose = () => {
    if (!checked) return // must check the box first
    setClosing(true)
    markShownToday()
    setTimeout(() => setShow(false), 350)
  }

  if (!show) return null

  const commitments = [
    {
      en: 'I will log only real study hours — no fake data',
      bn: 'আমি শুধুমাত্র বাস্তব পড়ার সময় লগ করবো — কোনো মিথ্যা তথ্য নয়',
    },
    {
      en: 'I will stay consistent with my daily goal',
      bn: 'আমি আমার দৈনিক লক্ষ্যের প্রতি আন্তরিক থাকবো',
    },
    {
      en: 'I will use this tracker to improve myself, not to impress others',
      bn: 'আমি এই ট্র্যাকার নিজেকে উন্নত করতে ব্যবহার করবো — অন্যকে দেখানোর জন্য নয়',
    },
  ]

  return (
    <div className={`fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-4 transition-all duration-300 ${
      closing ? 'opacity-0' : 'opacity-100'
    }`}
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)' }}>

      <div className={`w-full max-w-sm bg-surface-800 border border-white/10 rounded-3xl overflow-hidden shadow-2xl transition-all duration-350 ${
        closing ? 'translate-y-8 opacity-0' : 'translate-y-0 opacity-100'
      }`}>

        {/* Top gradient bar */}
        <div className="h-1 bg-gradient-to-r from-brand-500 via-purple-500 to-accent-500"/>

        {/* Header */}
        <div className="px-5 pt-5 pb-4">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-2xl bg-brand-500/20 border border-brand-500/30 flex items-center justify-center text-xl flex-shrink-0">
              📚
            </div>
            <div>
              <h2 className="text-white font-display font-bold text-base leading-tight">
                Study Commitment
              </h2>
              <p className={`text-white/40 text-[11px] mt-0.5 ${isBn?'font-bengali':''}`}>
                {isBn ? 'আজকের প্রতিজ্ঞা' : "Today's Pledge"}
              </p>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="px-5 pb-4">

          {/* Bangla pledge text */}
          <div className="bg-brand-500/8 border border-brand-500/20 rounded-2xl p-4 mb-4">
            <p className="font-bengali text-white/80 text-[12px] leading-relaxed mb-3">
              আমি প্রতিজ্ঞা করছি যে, আমি প্রতিদিন আমার পড়াশোনার তথ্য সঠিক ও সততার সাথে প্রদান করবো।
            </p>
            <p className="font-bengali text-white/50 text-[11px] leading-relaxed">
              এই Study Tracker-এর উদ্দেশ্য নিজেকে উন্নত করা — অন্য কাউকে প্রভাবিত করা নয়। ভুল বা মিথ্যা তথ্য আমার নিজের অগ্রগতিকেই ক্ষতিগ্রস্ত করবে।
            </p>
          </div>

          {/* Commitment items */}
          <div className="space-y-2.5 mb-5">
            {commitments.map((c, i) => (
              <div key={i} className="flex items-start gap-2.5">
                <CheckCircle2 size={15} className="text-green-400 flex-shrink-0 mt-0.5"/>
                <p className={`text-white/70 text-xs leading-relaxed ${isBn?'font-bengali':''}`}>
                  {isBn ? c.bn : c.en}
                </p>
              </div>
            ))}
          </div>

          {/* Quote */}
          <div className="bg-surface-700 rounded-xl px-4 py-3 mb-5">
            <p className="text-white/50 text-[11px] text-center italic font-display">
              "Small progress every day leads to big success." 🚀
            </p>
          </div>

          {/* Checkbox agreement */}
          <label className="flex items-start gap-3 cursor-pointer mb-4 group">
            <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-all duration-200 ${
              checked
                ? 'bg-brand-500 border-brand-500'
                : 'border-white/20 group-hover:border-white/40'
            }`}
              onClick={() => setChecked(c => !c)}>
              {checked && (
                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7"/>
                </svg>
              )}
            </div>
            <span className={`text-white/60 text-xs leading-relaxed select-none ${isBn?'font-bengali':''}`}>
              {isBn
                ? 'আমি এই প্রতিজ্ঞা পালন করতে রাজি আছি এবং সৎভাবে পড়ার সময় লগ করবো।'
                : 'I agree to this commitment and will log my study hours honestly.'}
            </span>
          </label>

          {/* CTA button */}
          <button
            onClick={handleClose}
            disabled={!checked}
            className={`w-full py-3.5 rounded-2xl font-display font-bold text-sm transition-all duration-200 ${
              checked
                ? 'bg-gradient-to-r from-brand-500 to-brand-600 text-white shadow-lg shadow-brand-500/30 active:scale-95'
                : 'bg-surface-700 text-white/20 cursor-not-allowed'
            }`}>
            <span className={isBn?'font-bengali':''}>
              {checked
                ? (isBn ? '✅ প্রতিজ্ঞা করলাম — পড়া শুরু করি!' : '✅ I Commit — Let\'s Study!')
                : (isBn ? 'উপরের বাক্সে টিক দাও' : 'Check the box above to continue')}
            </span>
          </button>
        </div>
      </div>
    </div>
  )
}
