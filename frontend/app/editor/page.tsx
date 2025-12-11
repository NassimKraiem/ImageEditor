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
  history: string[] // Array of previous edited URLs for undo
  historyIndex: number // Current position in history (-1 means at latest)
}

export default function ImageEditor() {
  const [images, setImages] = useState<ImageData[]>([])
  const [currentImageIndex, setCurrentImageIndex] = useState<number>(0)
  const [activeTool, setActiveTool] = useState<'crop' | 'filters' | 'adjust' | null>(null)
  const [isDragOver, setIsDragOver] = useState(false)
  const [showImageMenu, setShowImageMenu] = useState(false)
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
          originalImageElement: null,
          history: [],
          historyIndex: -1
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

  // Handle escape key to close menu
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showImageMenu) {
        setShowImageMenu(false)
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [showImageMenu])

  // Handle click outside to close menu
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (showImageMenu) {
        const target = e.target as HTMLElement
        const menu = document.querySelector('[data-image-menu]')
        const toggle = document.querySelector('[data-menu-toggle]')

        if (menu && toggle && !menu.contains(target) && !toggle.contains(target)) {
          setShowImageMenu(false)
        }
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showImageMenu])

  const handleCropComplete = (croppedImageUrl: string) => {
    if (currentImage) {
      const updatedImages = [...images]
      // Add current state to history before applying new edit
      const newHistory = [...currentImage.history]
      if (currentImage.historyIndex >= 0) {
        // If we're in middle of history, truncate future states
        newHistory.splice(currentImage.historyIndex + 1)
      }
      newHistory.push(currentImage.editedUrl)

      updatedImages[currentImageIndex] = {
        ...currentImage,
        editedUrl: croppedImageUrl,
        originalImageElement: null,
        history: newHistory,
        historyIndex: -1 // At latest state
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
      // Add current state to history before applying new edit
      const newHistory = [...currentImage.history]
      if (currentImage.historyIndex >= 0) {
        // If we're in middle of history, truncate future states
        newHistory.splice(currentImage.historyIndex + 1)
      }
      newHistory.push(currentImage.editedUrl)

      updatedImages[currentImageIndex] = {
        ...currentImage,
        editedUrl: filteredImageUrl,
        history: newHistory,
        historyIndex: -1 // At latest state
      }
      setImages(updatedImages)
    }
  }

  const handleAdjustApply = (adjustedImageUrl: string) => {
    if (currentImage) {
      const updatedImages = [...images]
      // Add current state to history before applying new edit
      const newHistory = [...currentImage.history]
      if (currentImage.historyIndex >= 0) {
        // If we're in middle of history, truncate future states
        newHistory.splice(currentImage.historyIndex + 1)
      }
      newHistory.push(currentImage.editedUrl)

      updatedImages[currentImageIndex] = {
        ...currentImage,
        editedUrl: adjustedImageUrl,
        history: newHistory,
        historyIndex: -1 // At latest state
      }
      setImages(updatedImages)
    }
  }

  // Centralized undo/redo functions for all tools
  const handleUndo = () => {
    if (currentImage && currentImage.history.length > 0) {
      const updatedImages = [...images]
      let newHistoryIndex: number

      if (currentImage.historyIndex === -1) {
        // At latest state, undo to last history item
        newHistoryIndex = currentImage.history.length - 1
      } else if (currentImage.historyIndex > 0) {
        // In middle of history, go back one more
        newHistoryIndex = currentImage.historyIndex - 1
      } else {
        // Already at beginning, can't undo further
        return
      }

      updatedImages[currentImageIndex] = {
        ...currentImage,
        editedUrl: currentImage.history[newHistoryIndex],
        historyIndex: newHistoryIndex
      }
      setImages(updatedImages)
    }
  }

  const handleRedo = () => {
    if (currentImage && currentImage.historyIndex >= 0) {
      const updatedImages = [...images]
      let newHistoryIndex: number
      let newEditedUrl: string

      if (currentImage.historyIndex < currentImage.history.length - 1) {
        // Can redo to next history item
        newHistoryIndex = currentImage.historyIndex + 1
        newEditedUrl = currentImage.history[newHistoryIndex]
      } else {
        // At end of history, redo to latest state (which is stored after history array)
        newHistoryIndex = -1
        newEditedUrl = currentImage.editedUrl
      }

      updatedImages[currentImageIndex] = {
        ...currentImage,
        editedUrl: newEditedUrl,
        historyIndex: newHistoryIndex
      }
      setImages(updatedImages)
    }
  }

  // Check if undo/redo are available
  const canUndo = currentImage && (currentImage.history.length > 0 || currentImage.historyIndex >= 0)
  const canRedo = currentImage && currentImage.historyIndex >= 0 && currentImage.historyIndex < currentImage.history.length - 1

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
      originalImageElement: null,
      history: [], // Clear edit history
      historyIndex: -1 // Reset to latest state
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
            {/* Floating Image Menu Toggle */}
            {images.length > 0 && (
              <div className="fixed top-4 left-4 z-50">
                <button
                  data-menu-toggle
                  onClick={() => setShowImageMenu(!showImageMenu)}
                  className="group relative bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-full p-3 shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-110"
                  title={showImageMenu ? "Hide image menu" : "Show image menu"}
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                  <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {images.length}
                  </div>
                </button>

                {/* Floating Image Menu */}
                {showImageMenu && (
                  <div data-image-menu className="absolute top-16 left-0 bg-gray-800 rounded-xl shadow-2xl border border-gray-700 p-4 min-w-64 max-w-sm">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-white font-semibold">Images</h3>
                      <button
                        onClick={() => setShowImageMenu(false)}
                        className="text-gray-400 hover:text-white"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>

                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {images.map((img, index) => (
                        <div
                          key={img.id}
                          className={`group flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all duration-200 ${
                            index === currentImageIndex
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                          }`}
                          onClick={() => {
                            setCurrentImageIndex(index)
                            setShowImageMenu(false)
                          }}
                        >
                          <div className="w-8 h-8 bg-gray-600 rounded-lg flex items-center justify-center flex-shrink-0">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm truncate">{img.name}</div>
                            <div className={`text-xs ${
                              index === currentImageIndex ? 'text-blue-200' : 'text-gray-400'
                            }`}>
                              Image {index + 1}
                            </div>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              const newImages = images.filter((_, i) => i !== index)
                              setImages(newImages)
                              if (currentImageIndex >= newImages.length) {
                                setCurrentImageIndex(Math.max(0, newImages.length - 1))
                              }
                              if (newImages.length === 0) {
                                setShowImageMenu(false)
                              }
                            }}
                            className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 transition-opacity"
                            title="Remove image"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>

                    <div className="mt-4 pt-4 border-t border-gray-700">
                      <button
                        onClick={() => {
                          fileInputRef.current?.click()
                          setShowImageMenu(false)
                        }}
                        className="w-full flex items-center justify-center gap-3 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white rounded-lg py-3 px-4 transition-all duration-200 transform hover:scale-105"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        Add New Image
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Sidebar Controls */}
            <div className="lg:col-span-1 space-y-4">
              <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 border border-gray-700 shadow-xl">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <h2 className="text-xl font-bold text-white">Tools</h2>
                </div>
                <div className="space-y-3">
                  <button
                    onClick={() => setActiveTool(activeTool === 'crop' ? null : 'crop')}
                    className={`group w-full p-4 rounded-xl transition-all duration-200 transform hover:scale-105 ${
                      activeTool === 'crop'
                        ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-500/25'
                        : 'bg-gray-700/50 text-gray-300 hover:bg-gray-600/50 hover:text-white border border-gray-600/50 hover:border-gray-500/50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
                        activeTool === 'crop'
                          ? 'bg-white/20'
                          : 'bg-gray-600 group-hover:bg-gray-500'
                      }`}>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <div className="text-left">
                        <div className="font-semibold">Crop</div>
                        <div className={`text-xs transition-colors ${
                          activeTool === 'crop' ? 'text-blue-200' : 'text-gray-400'
                        }`}>
                          Select & crop areas
                        </div>
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={() => setActiveTool(activeTool === 'filters' ? null : 'filters')}
                    className={`group w-full p-4 rounded-xl transition-all duration-200 transform hover:scale-105 ${
                      activeTool === 'filters'
                        ? 'bg-gradient-to-r from-green-600 to-green-700 text-white shadow-lg shadow-green-500/25'
                        : 'bg-gray-700/50 text-gray-300 hover:bg-gray-600/50 hover:text-white border border-gray-600/50 hover:border-gray-500/50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
                        activeTool === 'filters'
                          ? 'bg-white/20'
                          : 'bg-gray-600 group-hover:bg-gray-500'
                      }`}>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
                        </svg>
                      </div>
                      <div className="text-left">
                        <div className="font-semibold">Filters</div>
                        <div className={`text-xs transition-colors ${
                          activeTool === 'filters' ? 'text-green-200' : 'text-gray-400'
                        }`}>
                          Apply visual effects
                        </div>
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={() => setActiveTool(activeTool === 'adjust' ? null : 'adjust')}
                    className={`group w-full p-4 rounded-xl transition-all duration-200 transform hover:scale-105 ${
                      activeTool === 'adjust'
                        ? 'bg-gradient-to-r from-purple-600 to-purple-700 text-white shadow-lg shadow-purple-500/25'
                        : 'bg-gray-700/50 text-gray-300 hover:bg-gray-600/50 hover:text-white border border-gray-600/50 hover:border-gray-500/50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
                        activeTool === 'adjust'
                          ? 'bg-white/20'
                          : 'bg-gray-600 group-hover:bg-gray-500'
                      }`}>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
                        </svg>
                      </div>
                      <div className="text-left">
                        <div className="font-semibold">Adjust</div>
                        <div className={`text-xs transition-colors ${
                          activeTool === 'adjust' ? 'text-purple-200' : 'text-gray-400'
                        }`}>
                          Advanced processing
                        </div>
                      </div>
                    </div>
                  </button>
                </div>
              </div>

              <ImageControls
                onRotate={handleRotate}
                onFlip={handleFlip}
                onReset={handleReset}
                onDownload={handleDownload}
                onUndo={handleUndo}
                onRedo={handleRedo}
                canUndo={canUndo}
                canRedo={canRedo}
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

