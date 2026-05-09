// EmailJS credentials
const SERVICE_ID  = 'service_7jciy19'
const TEMPLATE_ID = 'template_afiithm'
const PUBLIC_KEY  = 'yUQ2uNvtu1OEbcXGv'

function fmtMin(m) {
  const h = Math.floor(m / 60), min = m % 60
  if (h > 0 && min > 0) return `${h}h ${min}m`
  if (h > 0) return `${h}h`
  return `${min}m`
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
  "ছোট পদক্ষেপই বড় সাফল্যের পথ দেখায়। লেগে থাকো! 🎯",
  "আজ যত কষ্ট করবে, ফলাফলের দিন তত হাসবে। 💯",
]

export async function sendStudyReminder({ name, email, studiedMinutes, goalMinutes }) {
  if (!email) {
    console.error('sendStudyReminder: no email provided')
    return false
  }

  const idx = Math.floor(Math.random() * 5)

  // Build template params - use EXACTLY the variable names in your EmailJS template
  const templateParams = {
    // Standard EmailJS fields - these go to To/From/ReplyTo
    to_name:   name || 'Student',
    to_email:  email,
    from_name: 'HSC PathFinder',
    reply_to:  'noreply@hsc-pathfinder.com',

    // Content variables used in email body
    name:           name || 'Student',
    email:          email,
    studied_time:   fmtMin(studiedMinutes),
    remaining_time: fmtMin(Math.max(0, goalMinutes - studiedMinutes)),
    goal_time:      fmtMin(goalMinutes),
    motivation_en:  MOTIVATIONS_EN[idx],
    motivation_bn:  MOTIVATIONS_BN[idx],
    app_url:        'https://hsc-pathfinder.vercel.app',
    app_name:       'HSC PathFinder',
  }

  console.log('Sending email via EmailJS to:', email)
  console.log('Template params:', templateParams)

  try {
    // Use fetch directly - more reliable than the SDK on mobile
    const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        service_id:  SERVICE_ID,
        template_id: TEMPLATE_ID,
        user_id:     PUBLIC_KEY,
        template_params: templateParams,
      })
    })

    const responseText = await response.text()
    console.log('EmailJS response:', response.status, responseText)

    if (response.ok) {
      console.log('✅ Email sent successfully to', email)
      return true
    } else {
      console.error('❌ EmailJS error:', response.status, responseText)
      return false
    }
  } catch (err) {
    console.error('❌ EmailJS fetch failed:', err)
    return false
  }
}

export function scheduleDailyReminder() {
  // Deprecated — now handled by NotificationManager
}
