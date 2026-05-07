// ─────────────────────────────────────────────────────────────
// Email Reminders via EmailJS (free tier — 200 emails/month)
// Setup guide:
//   1. Create account at https://emailjs.com
//   2. Add a Gmail service → copy Service ID
//   3. Create a template with variables below → copy Template ID
//   4. Copy your Public Key from Account → API Keys
//   5. Replace the three constants below
// ─────────────────────────────────────────────────────────────

const SERVICE_ID  = 'YOUR_SERVICE_ID'   // e.g. 'service_abc123'
const TEMPLATE_ID = 'YOUR_TEMPLATE_ID'  // e.g. 'template_xyz789'
const PUBLIC_KEY  = 'YOUR_PUBLIC_KEY'   // e.g. 'AbCdEfGhIjKlMnOp'

// Template variables to use in EmailJS:
// {{to_name}}  {{to_email}}  {{studied_time}}  {{remaining_time}}
// {{motivation_en}}  {{motivation_bn}}  {{app_url}}

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
  const h=Math.floor(m/60), min=m%60
  if (h>0&&min>0) return `${h}h ${min}m`
  if (h>0) return `${h}h`
  return `${min}m`
}

export async function sendStudyReminder({ name, email, studiedMinutes, goalMinutes }) {
  if (!email) return false
  const idx = Math.floor(Math.random() * 5)
  const params = {
    to_name:        name,
    to_email:       email,
    studied_time:   fmtMin(studiedMinutes),
    remaining_time: fmtMin(Math.max(0, goalMinutes - studiedMinutes)),
    motivation_en:  MOTIVATIONS_EN[idx],
    motivation_bn:  MOTIVATIONS_BN[idx],
    app_url:        'https://hsc-pathfinder.vercel.app',
  }
  try {
    const emailjs = await import('@emailjs/browser')
    await emailjs.send(SERVICE_ID, TEMPLATE_ID, params, PUBLIC_KEY)
    console.log('Reminder sent to', email)
    return true
  } catch (err) {
    console.error('Email failed:', err)
    return false
  }
}

// Call this once when app loads — schedules a daily check at 10 PM
export function scheduleDailyReminder(callback) {
  const now    = new Date()
  const target = new Date()
  target.setHours(22, 0, 0, 0)
  if (now >= target) target.setDate(target.getDate() + 1)
  const msUntil = target - now
  setTimeout(() => {
    callback()
    setInterval(callback, 24 * 60 * 60 * 1000)
  }, msUntil)
}
