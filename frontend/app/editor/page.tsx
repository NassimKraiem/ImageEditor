'use client'

import { useState, useRef, useEffect } from 'react'
import ImageCrop from '@/components/ImageCrop'
import ImageFilters from '@/components/ImageFilters'
import ImageControls from '@/components/ImageControls'
import ImageAdjust from '@/components/ImageAdjust'
import { rotateImage, flipImage } from '@/lib/api'

export default function ImageEditor() {
  const [image, setImage] = useState<string | null>(null)
  const [editedImage, setEditedImage] = useState<string | null>(null)
  const [originalImage, setOriginalImage] = useState<HTMLImageElement | null>(null)
  const [activeTool, setActiveTool] = useState<'crop' | 'filters' | 'adjust' | null>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const result = e.target?.result as string
        setImage(result)
        setEditedImage(result)
        
        const img = new Image()
        img.onload = () => {
          setOriginalImage(img)
          drawImageToCanvas(img)
        }
        img.src = result
      }
      reader.readAsDataURL(file)
    }
  }

  const drawImageToCanvas = (img: HTMLImageElement) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Set canvas size to match image
    canvas.width = img.width
    canvas.height = img.height

    // Clear and draw image
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.drawImage(img, 0, 0)
  }

  const handleCropComplete = (croppedImageUrl: string) => {
    setEditedImage(croppedImageUrl)

    const img = new Image()
    img.onload = () => {
      setOriginalImage(img)
      drawImageToCanvas(img)
    }
    img.src = croppedImageUrl
  }

  const handleFilterApply = (filteredImageUrl: string) => {
    setEditedImage(filteredImageUrl)

    const img = new Image()
    img.onload = () => {
      drawImageToCanvas(img)
    }
    img.src = filteredImageUrl
  }

  const handleAdjustApply = (adjustedImageUrl: string) => {
    setEditedImage(adjustedImageUrl)

    const img = new Image()
    img.onload = () => {
      drawImageToCanvas(img)
    }
    img.src = adjustedImageUrl
  }

  const handleAdjustUndo = (previousImageUrl: string) => {
    setEditedImage(previousImageUrl)

    const img = new Image()
    img.onload = () => {
      setOriginalImage(img)
      drawImageToCanvas(img)
    }
    img.src = previousImageUrl
  }

  const handleRotate = async (degrees: number) => {
    if (!editedImage) return

    try {
      const rotatedImageUrl = await rotateImage(editedImage, degrees)
      setEditedImage(rotatedImageUrl)
      
      const img = new Image()
      img.onload = () => {
        setOriginalImage(img)
        drawImageToCanvas(img)
      }
      img.src = rotatedImageUrl
    } catch (error) {
      console.error('Error rotating image:', error)
      alert('Failed to rotate image. Please try again.')
    }
  }

  const handleFlip = async (direction: 'horizontal' | 'vertical') => {
    if (!editedImage) return

    try {
      const flippedImageUrl = await flipImage(editedImage, direction)
      setEditedImage(flippedImageUrl)
      
      const img = new Image()
      img.onload = () => {
        setOriginalImage(img)
        drawImageToCanvas(img)
      }
      img.src = flippedImageUrl
    } catch (error) {
      console.error('Error flipping image:', error)
      alert('Failed to flip image. Please try again.')
    }
  }

  const handleDownload = () => {
    if (!editedImage) return

    const link = document.createElement('a')
    link.download = 'edited-image.png'
    link.href = editedImage
    link.click()
  }

  const handleReset = () => {
    if (!image) return
    
    const img = new Image()
    img.onload = () => {
      setOriginalImage(img)
      drawImageToCanvas(img)
      setEditedImage(image)
    }
    img.src = image
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-4">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-white text-center mb-8">
          Image Editor
        </h1>

        {!image ? (
          <div className="flex flex-col items-center justify-center min-h-[60vh]">
            <div className="bg-gray-800 rounded-lg p-12 border-2 border-dashed border-gray-600 hover:border-blue-500 transition-colors">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-lg transition-colors text-lg"
              >
                Upload Image
              </button>
              <p className="text-gray-400 text-center mt-4">
                Select an image to start editing
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Sidebar Controls */}
            <div className="lg:col-span-1 space-y-4">
              <div className="bg-gray-800 rounded-lg p-4">
                <h2 className="text-xl font-semibold text-white mb-4">Tools</h2>
                <div className="space-y-2">
                  <button
                    onClick={() => setActiveTool(activeTool === 'crop' ? null : 'crop')}
                    className={`w-full py-2 px-4 rounded-lg transition-colors ${
                      activeTool === 'crop'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    Crop
                  </button>
                  <button
                    onClick={() => setActiveTool(activeTool === 'filters' ? null : 'filters')}
                    className={`w-full py-2 px-4 rounded-lg transition-colors ${
                      activeTool === 'filters'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    Filters
                  </button>
                  <button
                    onClick={() => setActiveTool(activeTool === 'adjust' ? null : 'adjust')}
                    className={`w-full py-2 px-4 rounded-lg transition-colors ${
                      activeTool === 'adjust'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    Adjust
                  </button>
                </div>
              </div>

              <ImageControls
                onRotate={handleRotate}
                onFlip={handleFlip}
                onReset={handleReset}
                onDownload={handleDownload}
              />
            </div>

            {/* Main Editor Area */}
            <div className="lg:col-span-3">
              <div className="bg-gray-800 rounded-lg p-6">
                {activeTool === 'filters' && editedImage ? (
                  <ImageFilters
                    imageSrc={editedImage}
                    onFilterApply={handleFilterApply}
                    onUndo={(previousImageUrl) => {
                      // Undo the last applied filter by going back to the previous image
                      setEditedImage(previousImageUrl)
                      const img = new Image()
                      img.onload = () => {
                        setOriginalImage(img)
                        drawImageToCanvas(img)
                      }
                      img.src = previousImageUrl
                    }}
                  />
                ) : activeTool === 'crop' && editedImage ? (
                  <>
                    <div className="flex justify-center items-center bg-gray-900 rounded-lg p-4 min-h-[500px] overflow-auto">
                        <ImageCrop
                          imageSrc={editedImage}
                          onCropComplete={handleCropComplete}
                          onRevert={() => {
                            // Revert to original uncropped image
                            if (image) {
                              setEditedImage(image)
                              const img = new Image()
                              img.onload = () => {
                                setOriginalImage(img)
                                drawImageToCanvas(img)
                              }
                              img.src = image
                            }
                          }}
                        />
                    </div>
                  </>
                ) : activeTool === 'adjust' && editedImage ? (
                  <ImageAdjust
                    imageSrc={editedImage}
                    onAdjustApply={handleAdjustApply}
                    onUndo={handleAdjustUndo}
                  />
                ) : (
                  <canvas
                    ref={canvasRef}
                    className="max-w-full h-auto rounded-lg shadow-2xl"
                  />
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

