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
  const [isDragOver, setIsDragOver] = useState(false)
  const dragCounterRef = useRef(0)

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
      processFile(file)
    }
  }

  const processFile = (file: File) => {
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

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    dragCounterRef.current++
    if (dragCounterRef.current === 1) {
      setIsDragOver(true)
    }
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    dragCounterRef.current--
    if (dragCounterRef.current === 0) {
      setIsDragOver(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)
    dragCounterRef.current = 0 // Reset counter

    const files = Array.from(e.dataTransfer.files)
    const imageFiles = files.filter(file => file.type.startsWith('image/'))

    if (imageFiles.length > 0) {
      // Process the first image file
      processFile(imageFiles[0])
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
          <div className="flex flex-col items-center justify-center min-h-[80vh] relative overflow-hidden">
            {/* Animated background elements */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-blue-500 rounded-full blur-xl animate-pulse"></div>
              <div className="absolute top-1/3 right-1/4 w-24 h-24 bg-purple-500 rounded-full blur-xl animate-pulse delay-1000"></div>
              <div className="absolute bottom-1/4 left-1/3 w-40 h-40 bg-green-500 rounded-full blur-xl animate-pulse delay-500"></div>
            </div>

            {/* Main content */}
            <div className="relative z-10 text-center max-w-2xl mx-auto px-6">
              {/* Hero section */}
              <div className="mb-12">
                <h2 className="text-6xl font-bold text-white mb-4 bg-gradient-to-r from-blue-400 via-purple-500 to-green-400 bg-clip-text text-transparent">
                  Welcome to Image Editor
                </h2>
                <p className="text-xl text-gray-300 mb-8 leading-relaxed">
                  Transform your images with professional-grade editing tools.
                  Crop, filter, adjust, and enhance your photos with ease.
                </p>
              </div>

              {/* Upload section */}
              <div
                className={`bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-8 border-2 shadow-2xl transition-all duration-300 ${
                  isDragOver
                    ? 'border-blue-400 bg-gradient-to-br from-blue-900/20 to-purple-900/20 scale-105'
                    : 'border-gray-700'
                }`}
                onDragOver={handleDragOver}
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <div className="mb-8">
                  <div className={`w-24 h-24 mx-auto mb-6 rounded-full flex items-center justify-center shadow-lg transition-all duration-300 ${
                    isDragOver
                      ? 'bg-gradient-to-br from-green-500 to-blue-600 scale-110'
                      : 'bg-gradient-to-br from-blue-500 to-purple-600'
                  }`}>
                    <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={
                        isDragOver
                          ? "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" // Checkmark when dragging
                          : "M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" // Upload arrow normally
                      } />
                    </svg>
                  </div>

                  <h3 className={`text-2xl font-semibold mb-4 transition-colors duration-300 ${
                    isDragOver ? 'text-green-400' : 'text-white'
                  }`}>
                    {isDragOver ? 'Drop your image here!' : 'Start by uploading an image'}
                  </h3>
                  <p className={`mb-8 transition-colors duration-300 ${
                    isDragOver ? 'text-green-300' : 'text-gray-400'
                  }`}>
                    {isDragOver
                      ? 'Release to upload and start editing'
                      : 'Drag and drop an image here, or click to browse. Support for JPG, PNG, GIF, and more.'
                    }
                  </p>
                </div>

                {/* Upload button */}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="group relative bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-4 px-8 rounded-xl transition-all duration-300 transform hover:scale-105 hover:shadow-xl mb-6"
                >
                  <span className="flex items-center gap-3">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Choose Image to Upload
                  </span>
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
                </button>

                {/* Features grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
                  <div className="bg-gray-800/50 rounded-lg p-4">
                    <div className="w-10 h-10 mx-auto mb-3 bg-blue-500 rounded-lg flex items-center justify-center">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </div>
                    <h4 className="text-white font-medium mb-2">Advanced Editing</h4>
                    <p className="text-gray-400 text-sm">Professional tools for precise edits</p>
                  </div>

                  <div className="bg-gray-800/50 rounded-lg p-4">
                    <div className="w-10 h-10 mx-auto mb-3 bg-purple-500 rounded-lg flex items-center justify-center">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                    </div>
                    <h4 className="text-white font-medium mb-2">User Friendly</h4>
                    <p className="text-gray-400 text-sm">Smart adjustments and enhancements</p>
                  </div>

                  <div className="bg-gray-800/50 rounded-lg p-4">
                    <div className="w-10 h-10 mx-auto mb-3 bg-green-500 rounded-lg flex items-center justify-center">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                    <h4 className="text-white font-medium mb-2">Lightning Fast</h4>
                    <p className="text-gray-400 text-sm">Instant previews and real-time editing</p>
                  </div>
                </div>
              </div>

              {/* Footer text */}
              <p className="text-gray-500 text-sm mt-8">
                Drag and drop or click to upload • Supports JPG, PNG, GIF, and more
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

