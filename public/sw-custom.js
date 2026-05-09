// Custom Service Worker for background notifications
// This runs even when the app is closed

const REMINDER_TIMES = [
  { hour: 14, minute: 0,  label: 'afternoon' },
  { hour: 18, minute: 0,  label: 'evening'   },
  { hour: 22, minute: 0,  label: 'night'      },
]

const PUSH_MESSAGES = {
  en: [
    "📚 Time to study! You haven't reached your daily goal yet.",
    "🎯 Keep going! Your HSC dream needs your focus today.",
    "💪 Don't stop now! Log your study hours.",
    "⏰ Daily check: Have you studied enough today?",
    "🔥 Every hour counts! Open HSC PathFinder.",
  ],
  bn: [
    "📚 পড়ার সময়! আজকের লক্ষ্য এখনো পূরণ হয়নি।",
    "🎯 চালিয়ে যাও! তোমার এইচএসসির স্বপ্ন তোমার মনোযোগ চায়।",
    "💪 থামবে না! পড়ার সময় লগ করো।",
    "⏰ দৈনিক চেক: আজ পর্যাপ্ত পড়েছো?",
    "🔥 প্রতিটি ঘণ্টা গুরুত্বপূর্ণ! HSC PathFinder খোলো।",
  ]
}

// Listen for messages from the main app
self.addEventListener('message', (event) => {
  if (event.data?.type === 'SCHEDULE_REMINDERS') {
    const { goalMinutes, lang } = event.data
    scheduleReminders(goalMinutes, lang)
  }
  if (event.data?.type === 'CANCEL_REMINDERS') {
    cancelAllReminders()
  }
})

// Store scheduled alarm IDs
let reminderTimers = []

function cancelAllReminders() {
  reminderTimers.forEach(id => clearTimeout(id))
  reminderTimers = []
}

function msUntilTime(hour, minute) {
  const now    = new Date()
  const target = new Date()
  target.setHours(hour, minute, 0, 0)
  if (now >= target) target.setDate(target.getDate() + 1)
  return target - now
}

function scheduleReminders(goalMinutes, lang) {
  cancelAllReminders()

  REMINDER_TIMES.forEach(({ hour, minute, label }) => {
    const ms = msUntilTime(hour, minute)

    const id = setTimeout(() => {
      showReminderNotification(label, lang)
      // Reschedule for next day
      const daily = setInterval(() => {
        showReminderNotification(label, lang)
      }, 24 * 60 * 60 * 1000)
      reminderTimers.push(daily)
    }, ms)

    reminderTimers.push(id)
    console.log(`[SW] Scheduled ${label} reminder in ${Math.round(ms/60000)} minutes`)
  })
}

function showReminderNotification(timeLabel, lang) {
  const messages  = PUSH_MESSAGES[lang] || PUSH_MESSAGES.en
  const idx       = Math.floor(Math.random() * messages.length)
  const timeEmoji = timeLabel === 'afternoon' ? '☀️' : timeLabel === 'evening' ? '🌆' : '🌙'

  self.registration.showNotification('HSC PathFinder ' + timeEmoji, {
    body:    messages[idx],
    icon:    '/logo.svg',
    badge:   '/logo.svg',
    tag:     'study-reminder-' + timeLabel,
    renotify: true,
    vibrate: [200, 100, 200, 100, 200],
    data:    { url: '/' },
    actions: [
      { action: 'open', title: '📖 Open App' },
      { action: 'dismiss', title: '✕ Dismiss'  },
    ]
  })
}

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  if (event.action === 'dismiss') return

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
      for (const client of clientList) {
        if (client.url.includes('hsc-pathfinder') && 'focus' in client) {
          return client.focus()
        }
      }
      if (clients.openWindow) {
        return clients.openWindow('/')
      }
    })
  )
})

// Fetch handler for offline support
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then(cached => cached || fetch(event.request))
  )
})
