import { useState, useCallback } from 'react'
import Cropper from 'react-easy-crop'
import { X, Check, ZoomIn, ZoomOut, RotateCw } from 'lucide-react'

// Fixed: use Image element instead of fetch() — works on mobile with base64 data URLs
function getCroppedImg(imageSrc, pixelCrop, rotation = 0) {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.setAttribute('crossOrigin', 'anonymous')

    image.onload = () => {
      const canvas  = document.createElement('canvas')
      const size    = 400
      canvas.width  = size
      canvas.height = size
      const ctx     = canvas.getContext('2d')

      // Rotate if needed
      ctx.translate(size / 2, size / 2)
      ctx.rotate((rotation * Math.PI) / 180)
      ctx.translate(-size / 2, -size / 2)

      // Scale factor between canvas output and original image crop area
      const scaleX = image.naturalWidth  / image.width  || 1
      const scaleY = image.naturalHeight / image.height || 1

      ctx.drawImage(
        image,
        pixelCrop.x * scaleX,
        pixelCrop.y * scaleY,
        pixelCrop.width  * scaleX,
        pixelCrop.height * scaleY,
        0, 0,
        size, size
      )

      canvas.toBlob(
        blob => {
          if (blob) resolve(blob)
          else reject(new Error('Canvas toBlob failed'))
        },
        'image/jpeg',
        0.88
      )
    }

    image.onerror = () => reject(new Error('Image load failed'))
    image.src = imageSrc
  })
}

export default function PhotoCropper({ imageSrc, onCropDone, onCancel, isBn }) {
  const [crop,        setCrop]        = useState({ x: 0, y: 0 })
  const [zoom,        setZoom]        = useState(1)
  const [rotation,    setRotation]    = useState(0)
  const [croppedArea, setCroppedArea] = useState(null)
  const [processing,  setProcessing]  = useState(false)
  const [error,       setError]       = useState('')

  const onCropComplete = useCallback((_, croppedAreaPixels) => {
    setCroppedArea(croppedAreaPixels)
  }, [])

  const handleDone = async () => {
    if (!croppedArea) return
    setProcessing(true)
    setError('')
    try {
      const blob = await getCroppedImg(imageSrc, croppedArea, rotation)
      onCropDone(blob)
    } catch (err) {
      console.error('Crop error:', err)
      setError(isBn ? 'ক্রপ করতে সমস্যা হয়েছে, আবার চেষ্টা করো' : 'Crop failed, please try again')
      setProcessing(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-surface-900/90 backdrop-blur-sm border-b border-white/10">
        <button onClick={onCancel}
          className="flex items-center gap-1.5 text-white/60 hover:text-white transition-colors px-2 py-1">
          <X size={18} />
          <span className={`text-sm font-display ${isBn?'font-bengali':''}`}>
            {isBn ? 'বাতিল' : 'Cancel'}
          </span>
        </button>

        <p className={`text-white font-display font-semibold text-sm ${isBn?'font-bengali':''}`}>
          {isBn ? 'ফটো ক্রপ করো' : 'Crop Photo'}
        </p>

        <button onClick={handleDone} disabled={processing}
          className="flex items-center gap-1.5 bg-brand-500 hover:bg-brand-600 text-white px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50 active:scale-95">
          {processing
            ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>
            : <Check size={16} />
          }
          <span className={`text-sm font-display font-semibold ${isBn?'font-bengali':''}`}>
            {processing ? (isBn?'হচ্ছে...':'Wait...') : (isBn?'সম্পন্ন':'Done')}
          </span>
        </button>
      </div>

      {/* Cropper area */}
      <div className="relative flex-1">
        <Cropper
          image={imageSrc}
          crop={crop}
          zoom={zoom}
          rotation={rotation}
          aspect={1}
          cropShape="round"
          showGrid={false}
          onCropChange={setCrop}
          onZoomChange={setZoom}
          onRotationChange={setRotation}
          onCropComplete={onCropComplete}
          style={{
            containerStyle: { background: '#000' },
            cropAreaStyle: {
              border: '3px solid #0ea5e9',
              boxShadow: '0 0 0 9999px rgba(0,0,0,0.75)',
            },
          }}
        />
      </div>

      {/* Controls */}
      <div className="bg-surface-900/90 backdrop-blur-sm px-5 py-4 space-y-3 border-t border-white/10">

        {error && (
          <p className="text-red-400 text-xs text-center">{error}</p>
        )}

        {/* Zoom slider */}
        <div className="flex items-center gap-3">
          <ZoomOut size={16} className="text-white/40 flex-shrink-0" />
          <input
            type="range" min={1} max={3} step={0.02}
            value={zoom}
            onChange={e => setZoom(parseFloat(e.target.value))}
            className="flex-1 cursor-pointer"
          />
          <ZoomIn size={16} className="text-white/40 flex-shrink-0" />
        </div>

        {/* Rotate buttons */}
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => setRotation(r => r - 90)}
            className="flex items-center justify-center gap-1.5 bg-surface-700 border border-white/10 py-2.5 rounded-xl text-white/60 hover:text-white text-xs font-display transition-colors active:scale-95">
            <RotateCw size={13} className="scale-x-[-1]" />
            {isBn ? 'বামে' : 'Rotate Left'}
          </button>
          <button
            onClick={() => setRotation(r => r + 90)}
            className="flex items-center justify-center gap-1.5 bg-surface-700 border border-white/10 py-2.5 rounded-xl text-white/60 hover:text-white text-xs font-display transition-colors active:scale-95">
            <RotateCw size={13} />
            {isBn ? 'ডানে' : 'Rotate Right'}
          </button>
        </div>

        <p className={`text-white/25 text-[10px] text-center ${isBn?'font-bengali':''}`}>
          {isBn ? 'ড্র্যাগ করো সরাতে • পিঞ্চ বা স্লাইডার দিয়ে জুম করো' : 'Drag to move • Pinch or use slider to zoom'}
        </p>
      </div>
    </div>
  )
}
