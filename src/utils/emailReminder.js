import { init, send } from '@emailjs/browser'

const SERVICE_ID  = 'service_7jciy19'
const TEMPLATE_ID = 'template_afiithm'
const PUBLIC_KEY  = 'yUQ2uNvtu1OEbcXGv'

init(PUBLIC_KEY)

const MOTIVATIONS_EN = [
  "Every minute of study now saves hours of regret later. Keep going! 💪",
  "HSC 2026 is closer than you think. Don't let today slip away. 📚",
  "Your future self will thank you for studying today. 🌟",
  "Small steps every day lead to big results on exam day. 🎯",
  "The hard work you do today determines your result on results day. 💯",
]

const MOTIVATIONS_BN = [
  "প্রতিটি মিনিটের পড়া তোমার স্বপ্নকে বাস্তবে পরিণত করে। থামবে না! 💪",
  "এইচএসসি ২০২৬ খুব কাছে। আজকের সময়টা কাজে লাগাও। 📚",
  "আজকের পরিশ্রমই আগামীকালের সাফল্য। চালিয়ে যাও! 🌟",
  "ছোট ছোট পদক্ষেপই বড় সাফল্যের পথ দেখায়। লেগে থাকো! 🎯",
  "আজ যত কষ্ট করবে, ফলাফলের দিন তত হাসবে। এগিয়ে যাও! 💯",
]

function fmtMin(m) {
  const h = Math.floor(m / 60), min = m % 60
  if (h > 0 && min > 0) return `${h}h ${min}m`
  if (h > 0) return `${h}h`
  return `${min}m`
}

export async function sendStudyReminder({ name, email, studiedMinutes, goalMinutes }) {
  if (!email) { console.warn('No email'); return false }

  const idx = Math.floor(Math.random() * 5)

  // Match exactly what your EmailJS template uses:
  // {{name}} and {{email}} in the Content tab
  // "To Email" field must be changed to {{to_email}} in your template
  const templateParams = {
    name:           name || 'Student',     // matches {{name}} — From Name field
    email:          email,                 // matches {{email}} — Reply To field
    to_email:       email,                 // for To Email field (see instructions below)
    to_name:        name || 'Student',
    studied_time:   fmtMin(studiedMinutes),
    remaining_time: fmtMin(Math.max(0, goalMinutes - studiedMinutes)),
    goal_time:      fmtMin(goalMinutes),
    motivation_en:  MOTIVATIONS_EN[idx],
    motivation_bn:  MOTIVATIONS_BN[idx],
    app_url:        'https://hsc-pathfinder.vercel.app',
  }

  try {
    const res = await send(SERVICE_ID, TEMPLATE_ID, templateParams)
    console.log('Email sent:', res.status, 'to', email)
    return true
  } catch (err) {
    console.error('EmailJS failed:', err)
    return false
  }
}

export function scheduleDailyReminder(callback) {
  const now    = new Date()
  const target = new Date()
  target.setHours(22, 0, 0, 0)
  if (now >= target) target.setDate(target.getDate() + 1)
  const msUntil = target - now
  console.log(`Next email reminder in ${Math.round(msUntil / 1000 / 60)} minutes`)
  setTimeout(() => {
    callback()
    setInterval(callback, 24 * 60 * 60 * 1000)
  }, msUntil)
}
