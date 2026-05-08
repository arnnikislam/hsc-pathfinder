import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { doc, updateDoc } from 'firebase/firestore'
import { updateProfile } from 'firebase/auth'
import { storage, db, auth } from '../firebase/config'

// Compress image using canvas — no external library needed, works on all Android browsers
async function compressImage(blob, maxSizeKB = 300) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(blob)

    img.onload = () => {
      URL.revokeObjectURL(url)

      // Target max dimension 400px
      const MAX = 400
      let { width, height } = img
      if (width > MAX || height > MAX) {
        if (width > height) { height = Math.round(height * MAX / width); width = MAX }
        else                { width  = Math.round(width  * MAX / height); height = MAX }
      }

      const canvas = document.createElement('canvas')
      canvas.width  = width
      canvas.height = height
      const ctx = canvas.getContext('2d')
      ctx.drawImage(img, 0, 0, width, height)

      // Try quality levels until size is small enough
      let quality = 0.85
      const tryCompress = () => {
        canvas.toBlob(
          result => {
            if (!result) { reject(new Error('Compression failed')); return }
            if (result.size <= maxSizeKB * 1024 || quality <= 0.4) {
              resolve(result)
            } else {
              quality -= 0.1
              tryCompress()
            }
          },
          'image/jpeg',
          quality
        )
      }
      tryCompress()
    }

    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Image load failed during compression'))
    }

    img.src = url
  })
}

export async function uploadProfilePhoto(uid, blob) {
  try {
    // Step 1: Compress
    console.log('Compressing photo, original size:', blob.size)
    const compressed = await compressImage(blob, 300)
    console.log('Compressed size:', compressed.size)

    // Step 2: Upload to Firebase Storage
    const storageRef = ref(storage, `profilePhotos/${uid}.jpg`)
    const snapshot = await uploadBytes(storageRef, compressed, {
      contentType: 'image/jpeg',
      cacheControl: 'public,max-age=3600',
    })
    console.log('Upload successful:', snapshot.metadata.fullPath)

    // Step 3: Get download URL
    const url = await getDownloadURL(storageRef)
    console.log('Download URL:', url)

    // Step 4: Save to Firestore
    await updateDoc(doc(db, 'users', uid), { photoURL: url })

    // Step 5: Update Firebase Auth profile
    if (auth.currentUser) {
      await updateProfile(auth.currentUser, { photoURL: url })
    }

    return url
  } catch (err) {
    console.error('uploadProfilePhoto failed:', err)
    throw err
  }
}
