import { initializeApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'
import { getMessaging, isSupported } from 'firebase/messaging'

const firebaseConfig = {
  apiKey: "AIzaSyD8q9mGo0vKMzP4YekndTr366R1vb7gy2w",
  authDomain: "hsc-pathfinder.firebaseapp.com",
  projectId: "hsc-pathfinder",
  storageBucket: "hsc-pathfinder.firebasestorage.app",
  messagingSenderId: "339899723815",
  appId: "1:339899723815:web:bb5644b3d0ae944fd3de02"
}

const app = initializeApp(firebaseConfig)

export const auth = getAuth(app)
export const db = getFirestore(app)
export const storage = getStorage(app)
export const googleProvider = new GoogleAuthProvider()

// Messaging only supported in browsers that support it
export const getFirebaseMessaging = async () => {
  const supported = await isSupported()
  if (supported) {
    return getMessaging(app)
  }
  return null
}

export default app
