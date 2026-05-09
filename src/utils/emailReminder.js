import { init, send } from '@emailjs/browser'

const SERVICE_ID  = 'service_7jciy19'
const TEMPLATE_ID = 'template_afiithm'
const PUBLIC_KEY  = 'yUQ2uNvtu1OEbcXGv'

let initialized = false

function ensureInit() {
  if (!initialized) {
    init(PUBLIC_KEY)
    initialized = true
  }
}

const MOTIVATIONS_EN = [
  "Every minute of study now saves hours of regret later. Keep going! 💪",
  "HSC 2026 is closer than you think. Don't let today slip away. 📚",
  "Your future self will thank you for studying today. 🌟",
  "Small steps every day lead to big results on exam day. 🎯",
  "The hard work you do today determines your result. 💯",
]
const MOTIVATIONS_BN = [
  "প্রতিটি মিনিটের পড়া তোমার স্বপ্নকে বাস্তবে পরিণত করে। থামবে না! 💪",
  "এইচএসসি ২০২৬ খুব কাছে। আজকের সময়টা কাজে লাগাও। 📚",
  "আজকের পরিশ্রমই আগামীকালের সাফল্য। চালিয়ে যাও! 🌟",
  "ছোট ছোট পদক্ষেপই বড় সাফল্যের পথ দেখায়। লেগে থাকো! 🎯",
  "আজ যত কষ্ট করবে, ফলাফলের দিন তত হাসবে। 💯",
]

function fmtMin(m) {
  const h=Math.floor(m/60), min=m%60
  if(h>0&&min>0) return `${h}h ${min}m`
  if(h>0) return `${h}h`
  return `${min}m`
}

export async function sendStudyReminder({ name, email, studiedMinutes, goalMinutes }) {
  if (!email) { console.warn('sendStudyReminder: no email'); return false }
  ensureInit()

  const idx = Math.floor(Math.random() * 5)

  // These variable names MUST match your EmailJS template exactly
  const params = {
    name:           name || 'Student',   // {{name}} in template
    email:          email,               // {{email}} in reply-to
    to_email:       email,               // {{to_email}} in To field
    to_name:        name || 'Student',
    studied_time:   fmtMin(studiedMinutes),
    remaining_time: fmtMin(Math.max(0, goalMinutes - studiedMinutes)),
    goal_time:      fmtMin(goalMinutes),
    motivation_en:  MOTIVATIONS_EN[idx],
    motivation_bn:  MOTIVATIONS_BN[idx],
    app_url:        'https://hsc-pathfinder.vercel.app',
    app_name:       'HSC PathFinder',
  }

  try {
    const res = await send(SERVICE_ID, TEMPLATE_ID, params)
    console.log('Email sent successfully, status:', res.status, 'to:', email)
    return true
  } catch (err) {
    console.error('EmailJS error:', err?.text || err?.message || err)
    return false
  }
}

// Keep this for backward compat
export function scheduleDailyReminder(callback) {
  // Handled by NotificationManager now
  console.log('scheduleDailyReminder: now handled by NotificationManager')
}
