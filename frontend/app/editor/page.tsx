'use client'

import { useState, useRef, useEffect } from 'react'
import ImageCrop from '@/components/ImageCrop'
import ImageFilters from '@/components/ImageFilters'
import ImageControls from '@/components/ImageControls'
import ImageAdjust from '@/components/ImageAdjust'
import { rotateImage, flipImage } from '@/lib/api'

interface ImageData {
  id: string
  name: string
  originalUrl: string
  editedUrl: string
  originalImageElement: HTMLImageElement | null
}

export default function ImageEditor() {
  const [images, setImages] = useState<ImageData[]>([])
  const [currentImageIndex, setCurrentImageIndex] = useState<number>(0)
  const [activeTool, setActiveTool] = useState<'crop' | 'filters' | 'adjust' | null>(null)

  // Computed properties for current image
  const currentImage = images[currentImageIndex]
  const image = currentImage?.originalUrl || null
  const editedImage = currentImage?.editedUrl || null
  const originalImage = currentImage?.originalImageElement || null
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const result = e.target?.result as string

        const newImage: ImageData = {
          id: Date.now().toString(),
          name: file.name,
          originalUrl: result,
          editedUrl: result,
          originalImageElement: null
        }

        const img = new Image()
        img.onload = () => {
          newImage.originalImageElement = img
          setImages(prev => [...prev, newImage])
          setCurrentImageIndex(images.length) // Switch to the new image
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

  // Update canvas when current image changes
  useEffect(() => {
    if (originalImage) {
      drawImageToCanvas(originalImage)
    }
  }, [currentImageIndex, originalImage])

  const handleCropComplete = (croppedImageUrl: string) => {
    if (currentImage) {
      const updatedImages = [...images]
      updatedImages[currentImageIndex] = {
        ...currentImage,
        editedUrl: croppedImageUrl,
        originalImageElement: null
      }

      const img = new Image()
      img.onload = () => {
        updatedImages[currentImageIndex].originalImageElement = img
        setImages(updatedImages)
      }
      img.src = croppedImageUrl
    }
  }

  const handleFilterApply = (filteredImageUrl: string) => {
    if (currentImage) {
      const updatedImages = [...images]
      updatedImages[currentImageIndex] = {
        ...currentImage,
        editedUrl: filteredImageUrl
      }
      setImages(updatedImages)
    }
  }

  const handleAdjustApply = (adjustedImageUrl: string) => {
    if (currentImage) {
      const updatedImages = [...images]
      updatedImages[currentImageIndex] = {
        ...currentImage,
        editedUrl: adjustedImageUrl
      }
      setImages(updatedImages)
    }
  }

  const handleAdjustUndo = (previousImageUrl: string) => {
    if (currentImage) {
      const updatedImages = [...images]
      updatedImages[currentImageIndex] = {
        ...currentImage,
        editedUrl: previousImageUrl
      }
      setImages(updatedImages)
    }
  }

  const handleRotate = async (degrees: number) => {
    if (!currentImage) return

    try {
      const rotatedImageUrl = await rotateImage(currentImage.editedUrl, degrees)

      const updatedImages = [...images]
      updatedImages[currentImageIndex] = {
        ...currentImage,
        editedUrl: rotatedImageUrl,
        originalImageElement: null
      }

      const img = new Image()
      img.onload = () => {
        updatedImages[currentImageIndex].originalImageElement = img
        setImages(updatedImages)
      }
      img.src = rotatedImageUrl
    } catch (error) {
      console.error('Error rotating image:', error)
      alert('Failed to rotate image. Please try again.')
    }
  }

  const handleFlip = async (direction: 'horizontal' | 'vertical') => {
    if (!currentImage) return

    try {
      const flippedImageUrl = await flipImage(currentImage.editedUrl, direction)

      const updatedImages = [...images]
      updatedImages[currentImageIndex] = {
        ...currentImage,
        editedUrl: flippedImageUrl,
        originalImageElement: null
      }

      const img = new Image()
      img.onload = () => {
        updatedImages[currentImageIndex].originalImageElement = img
        setImages(updatedImages)
      }
      img.src = flippedImageUrl
    } catch (error) {
      console.error('Error flipping image:', error)
      alert('Failed to flip image. Please try again.')
    }
  }

  const handleDownload = () => {
    if (!currentImage) return

    const link = document.createElement('a')
    link.download = `edited-${currentImage.name}`
    link.href = currentImage.editedUrl
    link.click()
  }

  const handleReset = () => {
    if (!currentImage) return

    const updatedImages = [...images]
    updatedImages[currentImageIndex] = {
      ...currentImage,
      editedUrl: currentImage.originalUrl,
      originalImageElement: null
    }

    const img = new Image()
    img.onload = () => {
      updatedImages[currentImageIndex].originalImageElement = img
      setImages(updatedImages)
    }
    img.src = currentImage.originalUrl
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-4">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-white text-center mb-8">
          Image Editor
        </h1>

        {/* Hidden file input - always available */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileUpload}
          className="hidden"
        />

        {!image ? (
          <div className="flex flex-col items-center justify-center min-h-[60vh]">
            <div className="bg-gray-800 rounded-lg p-12 border-2 border-dashed border-gray-600 hover:border-blue-500 transition-colors">
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
            {/* Image Tabs */}
            {images.length > 0 && (
              <div className="lg:col-span-4 mb-4">
                <div className="flex flex-wrap gap-2 bg-gray-800 rounded-lg p-4">
                  {images.map((img, index) => (
                    <button
                      key={img.id}
                      onClick={() => setCurrentImageIndex(index)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        index === currentImageIndex
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      }`}
                    >
                      {img.name}
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          const newImages = images.filter((_, i) => i !== index)
                          setImages(newImages)
                          if (currentImageIndex >= newImages.length) {
                            setCurrentImageIndex(Math.max(0, newImages.length - 1))
                          }
                        }}
                        className="ml-2 text-red-400 hover:text-red-300"
                      >
                        ×
                      </button>
                    </button>
                  ))}
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors"
                  >
                    + Add Image
                  </button>
                </div>
              </div>
            )}

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
              {images.length === 0 ? (
                <div className="flex justify-center items-center bg-gray-900 rounded-lg p-4 min-h-[500px]">
                  <div className="text-center">
                    <p className="text-gray-400 text-lg mb-4">No images loaded</p>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
                    >
                      Upload Your First Image
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-gray-800 rounded-lg p-6">
                  {activeTool === 'filters' && editedImage ? (
                    <ImageFilters
                      imageSrc={editedImage}
                      onFilterApply={handleFilterApply}
                      onUndo={(previousImageUrl) => {
                        // Undo the last applied filter by going back to the previous image
                        if (currentImage) {
                          const updatedImages = [...images]
                          updatedImages[currentImageIndex] = {
                            ...currentImage,
                            editedUrl: previousImageUrl
                          }
                          setImages(updatedImages)
                        }
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
                              if (currentImage) {
                                const updatedImages = [...images]
                                updatedImages[currentImageIndex] = {
                                  ...currentImage,
                                  editedUrl: currentImage.originalUrl,
                                  originalImageElement: null
                                }

                                const img = new Image()
                                img.onload = () => {
                                  updatedImages[currentImageIndex].originalImageElement = img
                                  setImages(updatedImages)
                                }
                                img.src = currentImage.originalUrl
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
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

