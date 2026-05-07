import { collection, query, where, getDocs, doc, updateDoc } from 'firebase/firestore'
import { db } from '../firebase/config'
import { format, subDays, parseISO } from 'date-fns'

export async function calculateAndSaveStreak(uid) {
  try {
    const snap = await getDocs(query(
      collection(db, 'studyLogs'),
      where('userId', '==', uid)
    ))

    // Unique dates sorted newest → oldest
    const datesWithStudy = [
      ...new Set(snap.docs.map(d => d.data().date).filter(Boolean))
    ].sort((a, b) => b.localeCompare(a))

    if (datesWithStudy.length === 0) {
      await updateDoc(doc(db, 'users', uid), { streak: 0 })
      return 0
    }

    const today     = format(new Date(), 'yyyy-MM-dd')
    const yesterday = format(subDays(new Date(), 1), 'yyyy-MM-dd')
    const mostRecent = datesWithStudy[0]

    // If last study was more than yesterday, streak is 0
    if (mostRecent !== today && mostRecent !== yesterday) {
      await updateDoc(doc(db, 'users', uid), { streak: 0 })
      return 0
    }

    // Walk backward counting consecutive days
    let streak  = 0
    let expected = mostRecent  // the date we expect next

    for (const date of datesWithStudy) {
      if (date === expected) {
        streak++
        // next expected date is one day earlier
        expected = format(subDays(parseISO(expected), 1), 'yyyy-MM-dd')
      } else if (date < expected) {
        // gap — stop counting
        break
      }
      // date > expected means duplicate dates in sorted list — skip
    }

    await updateDoc(doc(db, 'users', uid), { streak })
    console.log(`Streak for ${uid}: ${streak}`)
    return streak
  } catch (err) {
    console.error('Streak error:', err)
    return 0
  }
}
