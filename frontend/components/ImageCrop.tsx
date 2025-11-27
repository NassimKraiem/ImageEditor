'use client'

import { useState, useRef, useCallback } from 'react'
import ReactCrop, { Crop, PixelCrop, makeAspectCrop, centerCrop } from 'react-image-crop'
import 'react-image-crop/dist/ReactCrop.css'
import { cropImage } from '@/lib/api'

interface ImageCropProps {
  imageSrc: string
  onCropComplete: (croppedImageUrl: string) => void
}

export default function ImageCrop({ imageSrc, onCropComplete }: ImageCropProps) {
  const [crop, setCrop] = useState<Crop>()
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>()
  const [isProcessing, setIsProcessing] = useState(false)
  const imgRef = useRef<HTMLImageElement>(null)

  const onImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = e.currentTarget
    const crop = makeAspectCrop(
      {
        unit: '%',
        width: 90,
      },
      16 / 9,
      width,
      height
    )
    setCrop(centerCrop(crop, width, height))
  }, [])

  const getCroppedImg = useCallback(async () => {
    if (!completedCrop || !imgRef.current) {
      return
    }

    setIsProcessing(true)

    try {
      const image = imgRef.current
      const crop = completedCrop

      // Calculate actual crop coordinates
      const scaleX = image.naturalWidth / image.width
      const scaleY = image.naturalHeight / image.height

      const x = Math.round(crop.x * scaleX)
      const y = Math.round(crop.y * scaleY)
      const width = Math.round(crop.width * scaleX)
      const height = Math.round(crop.height * scaleY)

      // Send to backend for cropping
      const croppedImageUrl = await cropImage(imageSrc, x, y, width, height)
      onCropComplete(croppedImageUrl)
    } catch (error) {
      console.error('Error cropping image:', error)
      alert('Failed to crop image. Please try again.')
    } finally {
      setIsProcessing(false)
    }
  }, [completedCrop, imageSrc, onCropComplete])

  return (
    <div className="w-full">
      <div className="flex justify-center mb-4">
        <ReactCrop
          crop={crop}
          onChange={(_, percentCrop) => setCrop(percentCrop)}
          onComplete={(c) => setCompletedCrop(c)}
          aspect={undefined}
          minWidth={50}
          minHeight={50}
        >
          <img
            ref={imgRef}
            alt="Crop me"
            src={imageSrc}
            style={{ maxWidth: '100%', maxHeight: '70vh' }}
            onLoad={onImageLoad}
          />
        </ReactCrop>
      </div>
      {completedCrop && (
        <div className="flex justify-center">
          <button
            onClick={getCroppedImg}
            disabled={isProcessing}
            className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold py-2 px-6 rounded-lg transition-colors"
          >
            {isProcessing ? 'Processing...' : 'Apply Crop'}
          </button>
        </div>
      )}
    </div>
  )
}
