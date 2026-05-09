import { useEffect, useRef } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { collection, query, where, getDocs } from 'firebase/firestore'
import { db } from '../firebase/config'
import { format } from 'date-fns'
import { sendStudyReminder } from '../utils/emailReminder'

// 3 reminder times per day: 2 PM, 6 PM, 10 PM
const REMINDER_TIMES = [
  { hour: 14, minute: 0,  label: 'Afternoon' },
  { hour: 18, minute: 0,  label: 'Evening'   },
  { hour: 22, minute: 0,  label: 'Night'     },
]

const PUSH_EN = [
  "📚 Time to study! You haven't reached your daily goal yet.",
  "🎯 Keep going! Your HSC dream needs your focus today.",
  "💪 Don't stop now! Log your study hours and stay on track.",
  "⏰ Reminder: Have you studied enough today? Check your goal!",
  "🔥 Every hour counts! Open HSC PathFinder and log your study.",
]
const PUSH_BN = [
  "📚 পড়ার সময়! আজকের লক্ষ্য এখনো পূরণ হয়নি।",
  "🎯 চালিয়ে যাও! তোমার এইচএসসির স্বপ্ন তোমার মনোযোগ চায়।",
  "💪 থামবে না! পড়ার সময় লগ করো এবং ট্র্যাকে থাকো।",
  "⏰ রিমাইন্ডার: আজ পর্যাপ্ত পড়েছো? তোমার লক্ষ্য দেখো!",
  "🔥 প্রতিটি ঘণ্টা গুরুত্বপূর্ণ! HSC PathFinder খোলো এবং লগ করো।",
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

async function requestAndSendPush(title, body) {
  // Request permission if not yet granted
  if (!('Notification' in window)) {
    console.log('Notifications not supported')
    return false
  }

  let permission = Notification.permission

  if (permission === 'default') {
    permission = await Notification.requestPermission()
  }

  if (permission !== 'granted') {
    console.log('Notification permission denied')
    return false
  }

  try {
    // Use ServiceWorker if available for better Android support
    if ('serviceWorker' in navigator) {
      const reg = await navigator.serviceWorker.ready
      await reg.showNotification(title, {
        body,
        icon:      '/logo.svg',
        badge:     '/logo.svg',
        tag:       'study-reminder',
        renotify:  true,
        vibrate:   [200, 100, 200],
        requireInteraction: false,
      })
      return true
    }
    // Fallback to basic Notification
    new Notification(title, { body, icon: '/logo.svg' })
    return true
  } catch (err) {
    console.error('Push failed:', err)
    // Try basic notification as last resort
    try { new Notification(title, { body }) } catch {}
    return false
  }
}

// Get ms until the next occurrence of a specific hour:minute
function msUntilTime(hour, minute) {
  const now    = new Date()
  const target = new Date()
  target.setHours(hour, minute, 0, 0)
  if (now >= target) target.setDate(target.getDate() + 1)
  return target - now
}

// Key to track if we already sent a reminder for this time slot today
function getReminderKey(hour) {
  const today = format(new Date(), 'yyyy-MM-dd')
  return `reminder_sent_${today}_${hour}`
}

export function requestNotificationPermission() {
  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission().then(p => {
      console.log('Notification permission:', p)
    })
  }
}

export default function NotificationManager() {
  const { user, profile } = useAuth()
  const timersRef = useRef([])

  useEffect(() => {
    if (!user || !profile) return

    // Clean up previous timers
    timersRef.current.forEach(clearTimeout)
    timersRef.current = []

    // Request permission immediately
    requestNotificationPermission()

    const isBn     = localStorage.getItem('hsc_lang') === 'bn'
    const goalMins = (profile.dailyGoal || 8) * 60

    const checkAndNotify = async (hour, label) => {
      const key = getReminderKey(hour)

      // Skip if already sent this slot today
      if (localStorage.getItem(key)) {
        console.log(`Already sent reminder for ${label} today`)
        return
      }

      const studiedMins = await getTodayMinutes(user.uid)
      console.log(`${label} check: studied=${studiedMins}m, goal=${goalMins}m`)

      if (studiedMins >= goalMins) {
        console.log(`Goal already met at ${label} check — skipping reminder`)
        return
      }

      // Mark as sent
      localStorage.setItem(key, '1')

      const remaining = goalMins - studiedMins
      const remH      = Math.floor(remaining / 60)
      const remM      = remaining % 60
      const remStr    = remH > 0 ? `${remH}h ${remM}m` : `${remM}m`

      const pushTitle = 'HSC PathFinder 📚'
      const idx       = Math.floor(Math.random() * PUSH_EN.length)
      const pushBody  = (isBn ? PUSH_BN[idx] : PUSH_EN[idx]) +
        (isBn ? ` (বাকি: ${remStr})` : ` (${remStr} remaining)`)

      // 1. Send push notification
      const pushSent = await requestAndSendPush(pushTitle, pushBody)
      console.log(`Push notification ${pushSent ? 'sent' : 'failed'} for ${label}`)

      // 2. Send email
      if (profile.email) {
        const sent = await sendStudyReminder({
          name:           profile.name,
          email:          profile.email,
          studiedMinutes: studiedMins,
          goalMinutes:    goalMins,
        })
        console.log(`Email ${sent ? 'sent' : 'failed'} for ${label}`)
      }
    }

    // Schedule all 3 reminder times
    REMINDER_TIMES.forEach(({ hour, minute, label }) => {
      const ms = msUntilTime(hour, minute)
      console.log(`Scheduling ${label} reminder in ${Math.round(ms/1000/60)} minutes (${hour}:${String(minute).padStart(2,'0')})`)

      const timerId = setTimeout(() => {
        checkAndNotify(hour, label)
        // Reschedule for next day
        const daily = setInterval(() => checkAndNotify(hour, label), 24 * 60 * 60 * 1000)
        timersRef.current.push(daily)
      }, ms)

      timersRef.current.push(timerId)
    })

    return () => {
      timersRef.current.forEach(clearTimeout)
      timersRef.current = []
    }
  }, [user?.uid, profile?.dailyGoal])

  return null
}
