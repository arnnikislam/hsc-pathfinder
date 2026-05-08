import { doc, updateDoc } from 'firebase/firestore'
import { updateProfile } from 'firebase/auth'
import { db, auth } from '../firebase/config'

// Compress + convert image blob to base64 string using canvas
// Output is ~30-50KB which fits comfortably in Firestore (1MB limit)
function compressToBase64(blob) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(blob)

    img.onload = () => {
      URL.revokeObjectURL(url)

      // Max 200x200px for profile photo — keeps base64 small
      const MAX = 200
      let { width, height } = img
      if (width > height) { height = Math.round(height * MAX / width); width = MAX }
      else                { width = Math.round(width * MAX / height); height = MAX }

      const canvas  = document.createElement('canvas')
      canvas.width  = width
      canvas.height = height
      const ctx     = canvas.getContext('2d')

      // White background first (in case image has transparency)
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, width, height)
      ctx.drawImage(img, 0, 0, width, height)

      // Convert to base64 JPEG at 80% quality
      const base64 = canvas.toDataURL('image/jpeg', 0.80)
      console.log('Base64 size (chars):', base64.length, '≈', Math.round(base64.length * 0.75 / 1024), 'KB')
      resolve(base64)
    }

    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Image load failed'))
    }

    img.src = url
  })
}

export async function uploadProfilePhoto(uid, blob) {
  try {
    console.log('Starting photo upload, blob size:', blob.size)

    // Step 1: Compress to base64
    const base64 = await compressToBase64(blob)

    // Firestore document limit is 1MB = ~1,000,000 chars
    // Our photo should be ~40,000 chars — well within limit
    if (base64.length > 900000) {
      throw new Error('Image too large even after compression. Please use a smaller photo.')
    }

    // Step 2: Save base64 directly to Firestore user document
    await updateDoc(doc(db, 'users', uid), {
      photoURL:       base64,
      photoUpdatedAt: new Date().toISOString(),
    })
    console.log('Saved to Firestore successfully')

    // Step 3: Update Firebase Auth display (use a placeholder since Auth
    // doesn't accept base64 URLs — we use Firestore as source of truth)
    // We skip updateProfile here as base64 is too long for Auth profile

    return base64
  } catch (err) {
    console.error('uploadProfilePhoto failed:', err)
    throw err
  }
}
