import { createContext, useContext, useEffect, useState } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { auth, db } from '../firebase/config'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  const loadProfile = async (uid) => {
    try {
      const snap = await getDoc(doc(db, 'users', uid))
      if (snap.exists()) {
        const data = snap.data()
        // Prefer Firestore photoURL (custom upload) over Google photo
        setProfile(data)
        return data
      } else {
        setProfile(null)
        return null
      }
    } catch (err) {
      console.error('loadProfile:', err)
      setProfile(null)
      return null
    }
  }

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser)
      if (firebaseUser) {
        await loadProfile(firebaseUser.uid)
      } else {
        setProfile(null)
      }
      setLoading(false)
    })
    return unsub
  }, [])

  const refreshProfile = async () => {
    const uid = auth.currentUser?.uid
    if (!uid) return
    await loadProfile(uid)
  }

  // Get the best available photo URL
  // Priority: Firestore custom upload > Firebase Auth > UI Avatars fallback
  const getPhotoURL = (name) => {
    if (profile?.photoURL) return profile.photoURL
    if (auth.currentUser?.photoURL) return auth.currentUser.photoURL
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name||'User')}&background=0ea5e9&color=fff&size=160`
  }

  return (
    <AuthContext.Provider value={{ user, profile, loading, refreshProfile, getPhotoURL }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
