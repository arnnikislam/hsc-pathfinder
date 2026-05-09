import { useEffect, useRef, useState } from 'react'
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
  "💪 Don't stop now! Log your study hours.",
  "⏰ Daily check: Have you studied enough today?",
  "🔥 Every hour counts! Open HSC PathFinder.",
]
const PUSH_BN = [
  "📚 পড়ার সময়! আজকের লক্ষ্য এখনো পূরণ হয়নি।",
  "🎯 চালিয়ে যাও! তোমার এইচএসসির স্বপ্ন তোমার মনোযোগ চায়।",
  "💪 থামবে না! পড়ার সময় লগ করো।",
  "⏰ দৈনিক চেক: আজ পর্যাপ্ত পড়েছো?",
  "🔥 প্রতিটি ঘণ্টা গুরুত্বপূর্ণ!",
]

async function getTodayMinutes(uid) {
  try {
    const today = format(new Date(), 'yyyy-MM-dd')
    const snap  = await getDocs(query(
      collection(db, 'studyLogs'),
      where('userId', '==', uid),
      where('date', '==', today)
    ))
    return snap.docs.reduce((s, d) => s + (d.data().minutes || 0), 0)
  } catch (e) {
    console.error('getTodayMinutes error:', e)
    return 0
  }
}

function msUntilTime(hour, minute) {
  const now    = new Date()
  const target = new Date()
  target.setHours(hour, minute, 0, 0)
  if (now >= target) target.setDate(target.getDate() + 1)
  return target - now
}

function getReminderKey(label) {
  return `reminder_${format(new Date(), 'yyyy-MM-dd')}_${label}`
}

// Show browser notification — tries SW first, falls back to basic
async function showNotification(title, body, label) {
  const icon = '/logo.svg'

  // Try SW notification
  if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
    try {
      const reg = await navigator.serviceWorker.ready
      await reg.showNotification(title, {
        body, icon,
        tag:      'hsc-' + label,
        renotify: true,
        vibrate:  [300, 100, 300],
      })
      console.log('✅ SW notification shown')
      return true
    } catch (e) {
      console.log('SW notification failed:', e)
    }
  }

  // Fallback: basic Notification API
  if ('Notification' in window && Notification.permission === 'granted') {
    try {
      new Notification(title, { body, icon })
      console.log('✅ Basic notification shown')
      return true
    } catch (e) {
      console.log('Basic notification failed:', e)
    }
  }

  return false
}

export async function requestNotificationPermission() {
  if (!('Notification' in window)) {
    console.log('Notifications not supported')
    return 'unsupported'
  }
  if (Notification.permission === 'granted') return 'granted'
  if (Notification.permission === 'denied') return 'denied'
  const result = await Notification.requestPermission()
  console.log('Permission result:', result)
  return result
}

export default function NotificationManager() {
  const { user, profile } = useAuth()
  const timersRef = useRef([])
  const checkedRef = useRef(new Set())

  useEffect(() => {
    if (!user || !profile) return

    // Clear previous timers
    timersRef.current.forEach(clearTimeout)
    timersRef.current = []
    checkedRef.current = new Set()

    const isBn     = localStorage.getItem('hsc_lang') === 'bn'
    const goalMins = (profile.dailyGoal || 8) * 60

    // Step 1: Request notification permission immediately
    requestNotificationPermission()

    // Core function: check goal and fire all reminders
    const checkAndFire = async (label) => {
      const key = getReminderKey(label)

      // Skip if already fired today
      if (localStorage.getItem(key)) {
        console.log(`Reminder ${label} already sent today`)
        return
      }

      const studied = await getTodayMinutes(user.uid)
      console.log(`[${label}] Studied: ${studied}m / Goal: ${goalMins}m`)

      if (studied >= goalMins) {
        console.log(`[${label}] Goal met! No reminder needed.`)
        localStorage.setItem(key, 'goal_met')
        return
      }

      // Mark as sent
      localStorage.setItem(key, '1')

      const remaining = goalMins - studied
      const remH = Math.floor(remaining / 60)
      const remM = remaining % 60
      const remStr = remH > 0 ? `${remH}h ${remM}m` : `${remM}m`
      const timeEmoji = label === 'afternoon' ? '☀️' : label === 'evening' ? '🌆' : '🌙'
      const idx   = Math.floor(Math.random() * 5)
      const msgs  = isBn ? PUSH_BN : PUSH_EN
      const body  = `${msgs[idx]} (${isBn ? 'বাকি' : 'Remaining'}: ${remStr})`
      const title = `HSC PathFinder ${timeEmoji}`

      // 1. Push notification
      const pushed = await showNotification(title, body, label)

      // 2. In-app toast (ALWAYS show — even if push blocked)
      toast(
        (t) => (
          <div onClick={() => toast.dismiss(t.id)}>
            <p className="font-bold text-sm">{title}</p>
            <p className="text-xs mt-0.5 opacity-80">{body}</p>
          </div>
        ),
        {
          duration: 10000,
          icon: timeEmoji,
          style: {
            background: '#1e293b',
            color: '#fff',
            border: '1px solid #0ea5e9',
            maxWidth: '320px',
          }
        }
      )

      // 3. Email reminder
      if (profile.email) {
        console.log('Sending email to:', profile.email)
        const emailSent = await sendStudyReminder({
          name:           profile.name || 'Student',
          email:          profile.email,
          studiedMinutes: studied,
          goalMinutes:    goalMins,
        })
        console.log(`Email ${emailSent ? '✅ sent' : '❌ failed'}`)
      } else {
        console.warn('No email in profile — skipping email')
      }
    }

    // Step 2: Check for MISSED reminders (app opened after reminder time)
    const now = new Date()
    const nowHour = now.getHours()

    REMINDER_TIMES.forEach(({ hour, label }) => {
      if (nowHour >= hour) {
        const key = getReminderKey(label)
        if (!localStorage.getItem(key)) {
          console.log(`Missed ${label} reminder (now ${nowHour}:xx, reminder at ${hour}:00) — firing now`)
          // Small delay so app finishes loading first
          const delay = setTimeout(() => checkAndFire(label), 3000)
          timersRef.current.push(delay)
        }
      }
    })

    // Step 3: Schedule upcoming reminders today
    REMINDER_TIMES.forEach(({ hour, minute, label }) => {
      const ms = msUntilTime(hour, minute)
      if (ms < 24 * 60 * 60 * 1000) {
        console.log(`Scheduling ${label} in ${Math.round(ms / 60000)} min`)
        const id = setTimeout(() => {
          checkAndFire(label)
          // Repeat daily
          const daily = setInterval(() => checkAndFire(label), 24 * 60 * 60 * 1000)
          timersRef.current.push(daily)
        }, ms)
        timersRef.current.push(id)
      }
    })

    return () => {
      timersRef.current.forEach(clearTimeout)
      timersRef.current = []
    }
  }, [user?.uid, profile?.dailyGoal])

  return null
}
