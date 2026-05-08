import { useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { collection, query, where, getDocs } from 'firebase/firestore'
import { db } from '../firebase/config'
import { format } from 'date-fns'
import { sendStudyReminder, scheduleDailyReminder } from '../utils/emailReminder'

const PUSH_EN = [
  "📚 Haven't reached your daily goal yet. Keep going!",
  "🎯 HSC 2026 is coming! Every hour of study counts.",
  "💪 Don't break your streak! Log your study hours.",
  "⏰ Daily reminder: Have you studied today?",
  "🔥 Your future self will thank you. Study now!",
]
const PUSH_BN = [
  "📚 আজকের লক্ষ্য এখনো পূরণ হয়নি। চালিয়ে যাও!",
  "🎯 এইচএসসি ২০২৬ — প্রতিটি ঘণ্টা মূল্যবান!",
  "💪 স্ট্রিক ধরে রাখো! পড়ার সময় লগ করো।",
  "⏰ দৈনিক রিমাইন্ডার: আজ পড়েছো?",
  "🔥 ভবিষ্যতের তুমি কৃতজ্ঞ থাকবে। এখনই পড়ো!",
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

function sendPush(isBn) {
  if (!('Notification' in window) || Notification.permission !== 'granted') return
  const idx = Math.floor(Math.random() * 5)
  try {
    new Notification('HSC PathFinder', {
      body:      isBn ? PUSH_BN[idx] : PUSH_EN[idx],
      icon:      '/logo.svg',
      tag:       'study-reminder',
      renotify:  true,
    })
  } catch (err) {
    console.log('Push failed:', err)
  }
}

export function requestNotificationPermission() {
  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission()
  }
}

export default function NotificationManager() {
  const { user, profile } = useAuth()

  useEffect(() => {
    if (!user || !profile) return

    // Ask for notification permission
    requestNotificationPermission()

    const isBn     = localStorage.getItem('hsc_lang') === 'bn'
    const goalMins = (profile.dailyGoal || 8) * 60

    const checkAndNotify = async () => {
      const studiedMins = await getTodayMinutes(user.uid)
      console.log(`Reminder check: studied=${studiedMins}m, goal=${goalMins}m`)

      if (studiedMins < goalMins) {
        // 1. Browser push notification
        sendPush(isBn)

        // 2. Email reminder
        if (profile.email) {
          await sendStudyReminder({
            name:           profile.name,
            email:          profile.email,
            studiedMinutes: studiedMins,
            goalMinutes:    goalMins,
          })
        }
      }
    }

    scheduleDailyReminder(checkAndNotify)
  }, [user?.uid, profile?.dailyGoal])

  return null
}
