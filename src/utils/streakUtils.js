import { collection, query, where, getDocs, doc, updateDoc } from 'firebase/firestore'
import { db } from '../firebase/config'
import { format, subDays } from 'date-fns'

// Calculate streak from all study logs
// Streak = consecutive days studied up to today
export async function calculateAndSaveStreak(uid) {
  try {
    const snap = await getDocs(query(
      collection(db, 'studyLogs'),
      where('userId', '==', uid)
    ))

    // Get unique dates that have study logs
    const datesWithStudy = new Set(
      snap.docs.map(d => d.data().date).filter(Boolean)
    )

    if (datesWithStudy.size === 0) {
      await updateDoc(doc(db, 'users', uid), { streak: 0 })
      return 0
    }

    // Count streak going back from today
    let streak = 0
    let checkDate = new Date()

    // Check today first — if no study today, start from yesterday
    const todayStr = format(checkDate, 'yyyy-MM-dd')
    if (!datesWithStudy.has(todayStr)) {
      checkDate = subDays(checkDate, 1)
    }

    // Count consecutive days going backward
    while (true) {
      const dateStr = format(checkDate, 'yyyy-MM-dd')
      if (datesWithStudy.has(dateStr)) {
        streak++
        checkDate = subDays(checkDate, 1)
      } else {
        break
      }
    }

    await updateDoc(doc(db, 'users', uid), { streak })
    return streak
  } catch (err) {
    console.error('Streak calc error:', err)
    return 0
  }
}
