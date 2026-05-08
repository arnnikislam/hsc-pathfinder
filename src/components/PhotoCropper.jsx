import { useState, useCallback } from 'react'
import Cropper from 'react-easy-crop'
import { X, Check, ZoomIn, ZoomOut, RotateCw } from 'lucide-react'

// Generate cropped image blob from canvas
async function getCroppedImg(imageSrc, pixelCrop) {
  const image = await createImageBitmap(await fetch(imageSrc).then(r => r.blob()))
  const canvas = document.createElement('canvas')
  const size = 400 // output size 400x400px
  canvas.width  = size
  canvas.height = size
  const ctx = canvas.getContext('2d')

  ctx.drawImage(
    image,
    pixelCrop.x, pixelCrop.y,
    pixelCrop.width, pixelCrop.height,
    0, 0,
    size, size
  )

  return new Promise((resolve) => {
    canvas.toBlob(blob => resolve(blob), 'image/jpeg', 0.85)
  })
}

export default function PhotoCropper({ imageSrc, onCropDone, onCancel, isBn }) {
  const [crop,       setCrop]       = useState({ x: 0, y: 0 })
  const [zoom,       setZoom]       = useState(1)
  const [rotation,   setRotation]   = useState(0)
  const [croppedArea, setCroppedArea] = useState(null)
  const [processing, setProcessing] = useState(false)

  const onCropComplete = useCallback((_, croppedAreaPixels) => {
    setCroppedArea(croppedAreaPixels)
  }, [])

  const handleDone = async () => {
    if (!croppedArea) return
    setProcessing(true)
    try {
      const blob = await getCroppedImg(imageSrc, croppedArea)
      onCropDone(blob)
    } catch (err) {
      console.error('Crop error:', err)
    } finally {
      setProcessing(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-surface-900/80 backdrop-blur-sm">
        <button onClick={onCancel}
          className="flex items-center gap-1.5 text-white/60 hover:text-white transition-colors">
          <X size={18} />
          <span className={`text-sm font-display ${isBn?'font-bengali':''}`}>
            {isBn ? 'বাতিল' : 'Cancel'}
          </span>
        </button>
        <p className={`text-white font-display font-semibold text-sm ${isBn?'font-bengali':''}`}>
          {isBn ? 'ফটো ক্রপ করো' : 'Crop Photo'}
        </p>
        <button onClick={handleDone} disabled={processing}
          className="flex items-center gap-1.5 text-brand-400 hover:text-brand-300 transition-colors disabled:opacity-50">
          {processing
            ? <div className="w-4 h-4 border-2 border-brand-400/30 border-t-brand-400 rounded-full animate-spin"/>
            : <Check size={18} />
          }
          <span className={`text-sm font-display font-semibold ${isBn?'font-bengali':''}`}>
            {isBn ? 'সম্পন্ন' : 'Done'}
          </span>
        </button>
      </div>

      {/* Cropper */}
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
          onCropComplete={onCropComplete}
          style={{
            containerStyle: { background: '#000' },
            cropAreaStyle:  { border: '2px solid #0ea5e9', boxShadow: '0 0 0 9999px rgba(0,0,0,0.7)' },
          }}
        />
      </div>

      {/* Controls */}
      <div className="bg-surface-900/80 backdrop-blur-sm px-6 py-4 space-y-4">
        {/* Zoom */}
        <div className="flex items-center gap-3">
          <ZoomOut size={16} className="text-white/40 flex-shrink-0" />
          <input type="range" min={1} max={3} step={0.05}
            value={zoom}
            onChange={e => setZoom(parseFloat(e.target.value))}
            className="flex-1 h-1 rounded-full accent-brand-500 cursor-pointer"
          />
          <ZoomIn size={16} className="text-white/40 flex-shrink-0" />
        </div>

        {/* Rotate */}
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => setRotation(r => r - 90)}
            className="flex items-center gap-1.5 bg-surface-700 px-4 py-2 rounded-xl text-white/60 hover:text-white text-xs font-display">
            <RotateCw size={14} className="scale-x-[-1]" />
            {isBn ? 'বামে ঘোরাও' : 'Rotate Left'}
          </button>
          <button
            onClick={() => setRotation(r => r + 90)}
            className="flex items-center gap-1.5 bg-surface-700 px-4 py-2 rounded-xl text-white/60 hover:text-white text-xs font-display">
            <RotateCw size={14} />
            {isBn ? 'ডানে ঘোরাও' : 'Rotate Right'}
          </button>
        </div>

        <p className={`text-white/30 text-[10px] text-center font-display ${isBn?'font-bengali':''}`}>
          {isBn
            ? 'ছবি সরাতে ড্র্যাগ করো • জুম করতে পিঞ্চ করো'
            : 'Drag to reposition • Pinch to zoom'}
        </p>
      </div>
    </div>
  )
}
