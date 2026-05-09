import { useEffect, useRef } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { collection, query, where, getDocs } from 'firebase/firestore'
import { db } from '../firebase/config'
import { format } from 'date-fns'
import { sendStudyReminder } from '../utils/emailReminder'
import toast from 'react-hot-toast'

// 3 reminder times
const REMINDER_TIMES = [
  { hour: 14, minute: 0,  label: 'afternoon' },
  { hour: 18, minute: 0,  label: 'evening'   },
  { hour: 22, minute: 0,  label: 'night'     },
]

const PUSH_EN = [
  "📚 Time to study! You haven't reached your daily goal yet.",
  "🎯 Keep going! Your HSC dream needs your focus today.",
  "💪 Don't stop now! Log your study hours and stay on track.",
  "⏰ Daily check: Have you studied enough today?",
  "🔥 Every hour counts! Open HSC PathFinder and log your study.",
]
const PUSH_BN = [
  "📚 পড়ার সময়! আজকের লক্ষ্য এখনো পূরণ হয়নি।",
  "🎯 চালিয়ে যাও! তোমার এইচএসসির স্বপ্ন তোমার মনোযোগ চায়।",
  "💪 থামবে না! পড়ার সময় লগ করো।",
  "⏰ দৈনিক চেক: আজ পর্যাপ্ত পড়েছো?",
  "🔥 প্রতিটি ঘণ্টা গুরুত্বপূর্ণ! HSC PathFinder খোলো।",
]

async function getTodayMinutes(uid) {
  try {
    const today = format(new Date(), 'yyyy-MM-dd')
    const snap  = await getDocs(query(
      collection(db, 'studyLogs'),
      where('userId', '==', uid),
      where('date',   '==', today)
    ))
    return snap.docs.reduce((s, d) => s + (d.data().minutes || 0), 0)
  } catch { return 0 }
}

function getReminderKey(label) {
  const today = format(new Date(), 'yyyy-MM-dd')
  return `reminder_${today}_${label}`
}

function msUntilTime(hour, minute) {
  const now    = new Date()
  const target = new Date()
  target.setHours(hour, minute, 0, 0)
  if (now >= target) target.setDate(target.getDate() + 1)
  return target - now
}

// Register service worker and schedule background reminders
async function registerServiceWorkerReminders(goalMinutes, lang) {
  if (!('serviceWorker' in navigator)) return

  try {
    // Register our custom SW
    const reg = await navigator.serviceWorker.register('/sw-custom.js', { scope: '/' })
    await navigator.serviceWorker.ready

    console.log('[SW] Registered, scheduling reminders...')

    // Tell SW to schedule the reminders
    if (reg.active) {
      reg.active.postMessage({
        type: 'SCHEDULE_REMINDERS',
        goalMinutes,
        lang,
      })
    } else if (reg.installing || reg.waiting) {
      const sw = reg.installing || reg.waiting
      sw.addEventListener('statechange', () => {
        if (sw.state === 'activated') {
          sw.postMessage({ type: 'SCHEDULE_REMINDERS', goalMinutes, lang })
        }
      })
    }
  } catch (err) {
    console.error('[SW] Registration failed:', err)
  }
}

// Show notification via SW (works when app is open)
async function showPushNotification(title, body, label) {
  if (!('Notification' in window)) return false

  if (Notification.permission === 'default') {
    const perm = await Notification.requestPermission()
    if (perm !== 'granted') return false
  }

  if (Notification.permission !== 'granted') return false

  try {
    if ('serviceWorker' in navigator) {
      const reg = await navigator.serviceWorker.ready
      await reg.showNotification(title, {
        body,
        icon:    '/logo.svg',
        badge:   '/logo.svg',
        tag:     'study-reminder-' + label,
        renotify: true,
        vibrate: [200, 100, 200],
        actions: [
          { action: 'open',    title: '📖 Open App' },
          { action: 'dismiss', title: '✕ Dismiss'   },
        ]
      })
      return true
    }
    new Notification(title, { body, icon: '/logo.svg' })
    return true
  } catch (err) {
    console.error('Push failed:', err)
    return false
  }
}

export async function requestNotificationPermission() {
  if (!('Notification' in window)) return 'unsupported'
  if (Notification.permission !== 'default') return Notification.permission
  const perm = await Notification.requestPermission()
  console.log('Notification permission:', perm)
  return perm
}

export default function NotificationManager() {
  const { user, profile } = useAuth()
  const timersRef = useRef([])

  useEffect(() => {
    if (!user || !profile) return

    timersRef.current.forEach(clearTimeout)
    timersRef.current = []

    const isBn     = localStorage.getItem('hsc_lang') === 'bn'
    const lang     = isBn ? 'bn' : 'en'
    const goalMins = (profile.dailyGoal || 8) * 60

    // 1. Request notification permission
    requestNotificationPermission()

    // 2. Register SW for background notifications (even when app closed)
    registerServiceWorkerReminders(goalMins, lang)

    // 3. Also schedule in-app timers (when app IS open — more reliable)
    const checkAndNotify = async (label) => {
      const key = getReminderKey(label)
      if (localStorage.getItem(key)) {
        console.log(`Already notified for ${label} today`)
        return
      }

      const studiedMins = await getTodayMinutes(user.uid)
      if (studiedMins >= goalMins) {
        console.log(`Goal met — skipping ${label} reminder`)
        return
      }

      // Mark sent
      localStorage.setItem(key, '1')

      const remaining = goalMins - studiedMins
      const remH = Math.floor(remaining / 60)
      const remM = remaining % 60
      const remStr = remH > 0 ? `${remH}h ${remM}m` : `${remM}m`

      const idx     = Math.floor(Math.random() * 5)
      const msgs    = isBn ? PUSH_BN : PUSH_EN
      const timeEmoji = label==='afternoon' ? '☀️' : label==='evening' ? '🌆' : '🌙'
      const body    = msgs[idx] + (isBn ? ` বাকি: ${remStr}` : ` Remaining: ${remStr}`)

      // Push notification
      const pushed = await showPushNotification('HSC PathFinder ' + timeEmoji, body, label)
      console.log(`Push ${pushed?'✅':'❌'} for ${label}`)

      // In-app toast as fallback (always shows if app is open)
      toast(body, {
        icon: timeEmoji,
        duration: 8000,
        style: {
          background: '#1e293b',
          color: '#fff',
          border: '1px solid rgba(14,165,233,0.3)',
          maxWidth: '320px',
          fontSize: isBn ? '12px' : '13px',
          fontFamily: isBn ? 'Hind Siliguri, sans-serif' : 'Sora, sans-serif',
        }
      })

      // Email
      if (profile.email) {
        const sent = await sendStudyReminder({
          name:           profile.name,
          email:          profile.email,
          studiedMinutes: studiedMins,
          goalMinutes:    goalMins,
        })
        console.log(`Email ${sent?'✅':'❌'} for ${label}`)
      }
    }

    // Schedule timers for remaining reminder times today
    REMINDER_TIMES.forEach(({ hour, minute, label }) => {
      const ms = msUntilTime(hour, minute)
      if (ms < 24 * 60 * 60 * 1000) { // Only schedule today's remaining ones
        console.log(`Scheduling ${label} in ${Math.round(ms/60000)} min`)
        const id = setTimeout(() => {
          checkAndNotify(label)
          // Daily repeat
          const daily = setInterval(() => checkAndNotify(label), 24*60*60*1000)
          timersRef.current.push(daily)
        }, ms)
        timersRef.current.push(id)
      }
    })

    // Check if we MISSED any reminder today (app wasn't open)
    // E.g. it's 3PM — we missed the 2PM one
    const now = new Date()
    REMINDER_TIMES.forEach(({ hour, label }) => {
      const key = getReminderKey(label)
      if (now.getHours() > hour && !localStorage.getItem(key)) {
        // Missed — check and notify now
        console.log(`Missed ${label} reminder — checking now`)
        checkAndNotify(label)
      }
    })

    return () => {
      timersRef.current.forEach(clearTimeout)
      timersRef.current = []
    }
  }, [user?.uid, profile?.dailyGoal])

  return null
}
