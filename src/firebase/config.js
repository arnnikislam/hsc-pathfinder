import { initializeApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

// Firebase Storage removed — using Firestore base64 for photos instead
const firebaseConfig = {
  apiKey:            "AIzaSyD8q9mGo0vKMzP4YekndTr366R1vb7gy2w",
  authDomain:        "hsc-pathfinder.firebaseapp.com",
  projectId:         "hsc-pathfinder",
  storageBucket:     "hsc-pathfinder.firebasestorage.app",
  messagingSenderId: "339899723815",
  appId:             "1:339899723815:web:bb5644b3d0ae944fd3de02"
}

const app = initializeApp(firebaseConfig)

export const auth          = getAuth(app)
export const db            = getFirestore(app)
export const googleProvider = new GoogleAuthProvider()

export default app
