import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { doc, updateDoc } from 'firebase/firestore'
import { updateProfile } from 'firebase/auth'
import { storage, db, auth } from '../firebase/config'
import imageCompression from 'browser-image-compression'

export async function uploadProfilePhoto(uid, blob) {
  // Compress blob before uploading
  const compressed = await imageCompression(blob, {
    maxSizeMB: 0.3,
    maxWidthOrHeight: 400,
    useWebWorker: true,
  })

  // Upload to Firebase Storage
  const storageRef = ref(storage, `profilePhotos/${uid}.jpg`)
  await uploadBytes(storageRef, compressed, { contentType: 'image/jpeg' })

  // Get public URL
  const url = await getDownloadURL(storageRef)

  // Save to Firestore user doc
  await updateDoc(doc(db, 'users', uid), { photoURL: url })

  // Also update Firebase Auth profile
  if (auth.currentUser) {
    await updateProfile(auth.currentUser, { photoURL: url })
  }

  return url
}
