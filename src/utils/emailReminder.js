// Email reminders via EmailJS
// Setup: https://www.emailjs.com — free tier (200 emails/month)
// Replace SERVICE_ID, TEMPLATE_ID, PUBLIC_KEY with your EmailJS credentials

const EMAILJS_SERVICE_ID = 'YOUR_SERVICE_ID'      // e.g. 'service_abc123'
const EMAILJS_TEMPLATE_ID = 'YOUR_TEMPLATE_ID'    // e.g. 'template_xyz789'
const EMAILJS_PUBLIC_KEY = 'YOUR_PUBLIC_KEY'       // e.g. 'user_abc...'

export async function sendStudyReminder({ name, email, studiedMinutes, goalMinutes, language = 'en' }) {
  const studied = Math.floor(studiedMinutes / 60)
  const studiedMin = studiedMinutes % 60
  const remaining = Math.max(0, goalMinutes - studiedMinutes)
  const remainH = Math.floor(remaining / 60)
  const remainMin = remaining % 60

  const motivations_en = [
    "Every minute of study now saves hours of regret later. You've got this! 💪",
    "HSC 2026 is closer than you think. Don't let today slip away. 📚",
    "Your future self will thank you for studying today. Keep going! 🌟",
    "Small steps every day lead to big results on exam day. Stay consistent! 🎯",
    "The hard work you do today determines the result you see on results day. 💯",
  ]

  const motivations_bn = [
    "প্রতিটি মিনিটের পড়া তোমার স্বপ্নকে বাস্তবে পরিণত করে। থামবে না! 💪",
    "এইচএসসি ২০২৬ খুব কাছে। আজকের সময়টা কাজে লাগাও। 📚",
    "আজকের পরিশ্রমই আগামীকালের সাফল্য। চালিয়ে যাও! 🌟",
    "ছোট ছোট পদক্ষেপই বড় সাফল্যের পথ দেখায়। লেগে থাকো! 🎯",
    "আজ যত কষ্ট করবে, ফলাফলের দিন তত হাসবে। এগিয়ে যাও! 💯",
  ]

  const randIdx = Math.floor(Math.random() * 5)
  const motivation_en = motivations_en[randIdx]
  const motivation_bn = motivations_bn[randIdx]

  const templateParams = {
    to_name: name,
    to_email: email,
    studied_time: `${studied}h ${studiedMin}m`,
    remaining_time: `${remainH}h ${remainMin}m`,
    motivation_en,
    motivation_bn,
    app_name: 'HSC PathFinder',
    app_url: 'https://hsc-pathfinder.vercel.app',
  }

  try {
    // Dynamically import emailjs to keep bundle small
    const emailjs = await import('@emailjs/browser')
    await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, templateParams, EMAILJS_PUBLIC_KEY)
    console.log('Reminder email sent to', email)
    return true
  } catch (err) {
    console.error('Email send failed:', err)
    return false
  }
}

// Check if reminder should be sent (called once at 10 PM)
export function shouldSendReminder(studiedMinutes, goalMinutes) {
  return studiedMinutes < goalMinutes
}

// Schedule daily check at 22:00 (10 PM)
export function scheduleDailyReminder(callback) {
  const now = new Date()
  const target = new Date()
  target.setHours(22, 0, 0, 0)
  if (now > target) target.setDate(target.getDate() + 1)
  const msUntil = target - now
  setTimeout(() => {
    callback()
    setInterval(callback, 24 * 60 * 60 * 1000) // repeat daily
  }, msUntil)
}
