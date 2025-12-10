'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { ImageProcessorWebSocket } from '@/lib/websocket'
import SplitView from './SplitView'

interface ImageFiltersProps {
  imageSrc: string
  onFilterApply: (filteredImageUrl: string) => void
  onUndo?: (previousImageUrl: string) => void
}

const filters = [
  { name: 'None', value: 'none' },
  { name: 'Grayscale', value: 'grayscale' },
  { name: 'Sepia', value: 'sepia' },
  { name: 'Blur', value: 'blur' },
  { name: 'Invert', value: 'invert' },
]

export default function ImageFilters({ imageSrc, onFilterApply, onUndo }: ImageFiltersProps) {
  const [selectedFilter, setSelectedFilter] = useState<string>('none')
  const [brightness, setBrightness] = useState(100)
  const [contrast, setContrast] = useState(100)
  const [saturation, setSaturation] = useState(100)
  const [previewImage, setPreviewImage] = useState<string | null>(null)
  const [pendingOperationsCount, setPendingOperationsCount] = useState(0)
  const [appliedImagesHistory, setAppliedImagesHistory] = useState<string[]>([])
  const wsRef = useRef<ImageProcessorWebSocket | null>(null)
  const updateTimerRef = useRef<NodeJS.Timeout | null>(null)
  const originalImageRef = useRef<string>(imageSrc)
  const isInitializedRef = useRef<boolean>(false)

  // Derive isProcessing from pendingOperationsCount for concurrency safety
  const isProcessing = pendingOperationsCount > 0

  // Helper functions for managing pending operations (concurrency-safe)
  const startOperation = useCallback(() => {
    setPendingOperationsCount(prev => prev + 1)
  }, [])

  const endOperation = useCallback(() => {
    setPendingOperationsCount(prev => Math.max(0, prev - 1))
  }, [])

  // Initialize WebSocket connection and handle image changes
  useEffect(() => {
    const ws = new ImageProcessorWebSocket()
    wsRef.current = ws
    const currentImageSrc = imageSrc

    ws.connect()
      .then(() => {
        // Initialize with current image
        ws.initialize(currentImageSrc)
        originalImageRef.current = currentImageSrc
        isInitializedRef.current = true
        
        // Listen for filter results
        ws.on('filter_result', (data: any) => {
          setPreviewImage(data.image)
          endOperation()
        })

        ws.on('reset_result', (data: any) => {
          setPreviewImage(data.image)
          endOperation()
        })

        ws.on('error', (data: any) => {
          console.error('WebSocket error:', data.message)
          endOperation()
        })

        ws.on('initialized', () => {
          // Trigger initial filter application
          ws.applyFilters(selectedFilter === 'none' ? undefined : selectedFilter, brightness, contrast, saturation)
        })
      })
      .catch((error) => {
        console.error('Failed to connect WebSocket:', error)
      })

    return () => {
      if (updateTimerRef.current) {
        clearTimeout(updateTimerRef.current)
      }
      ws.disconnect()
      isInitializedRef.current = false
    }
  }, [imageSrc]) // Re-initialize when image changes

  // Update filters when parameters change
  useEffect(() => {
    if (!wsRef.current || !wsRef.current.isConnected() || !isInitializedRef.current) return

    // Clear previous timer
    if (updateTimerRef.current) {
      clearTimeout(updateTimerRef.current)
    }

    // Debounce rapid updates (50ms for real-time feel)
    updateTimerRef.current = setTimeout(() => {
      if (wsRef.current && wsRef.current.isConnected()) {
        startOperation()

        wsRef.current.applyFilters(
          selectedFilter === 'none' ? undefined : selectedFilter,
          brightness,
          contrast,
          saturation
        )
      }
    }, 50)

    return () => {
      if (updateTimerRef.current) {
        clearTimeout(updateTimerRef.current)
      }
    }
  }, [selectedFilter, brightness, contrast, saturation])

  const handleApply = () => {
    if (previewImage) {
      // Add current image to history before applying new one
      setAppliedImagesHistory(prev => [...prev, imageSrc])
      onFilterApply(previewImage)
      // Reset filters to default after applying
      setBrightness(100)
      setContrast(100)
      setSaturation(100)
      setSelectedFilter('none')
    }
  }

  const handleUndo = () => {
    if (appliedImagesHistory.length > 0) {
      // Get the last applied image from history
      const lastAppliedImage = appliedImagesHistory[appliedImagesHistory.length - 1]

      // Remove it from history
      setAppliedImagesHistory(prev => prev.slice(0, -1))

      // Call the undo callback with the previous image
      if (onUndo) {
        onUndo(lastAppliedImage)
      }
    }
  }

  return (
    <div className="space-y-4">
      {/* Split View */}
      <div className="bg-gray-800 rounded-lg p-4">
        <SplitView
          originalImage={imageSrc}
          modifiedImage={previewImage}
          isLoading={isProcessing}
        />
      </div>

      {/* Filter Controls */}
      <div className="bg-gray-700 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-white mb-4">Filters</h3>

        <div className="grid grid-cols-3 gap-2 mb-4">
          {filters.map((filter) => (
            <button
              key={filter.value}
              onClick={() => setSelectedFilter(filter.value)}
              className={`py-2 px-3 rounded-lg text-sm transition-colors ${
                selectedFilter === filter.value
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
              }`}
            >
              {filter.name}
            </button>
          ))}
        </div>

        <div className="space-y-4 mb-4">
          <div>
            <label className="block text-gray-300 text-sm mb-2">
              Brightness: {brightness}%
            </label>
            <input
              type="range"
              min="0"
              max="200"
              value={brightness}
              onChange={(e) => setBrightness(Number(e.target.value))}
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-gray-300 text-sm mb-2">
              Contrast: {contrast}%
            </label>
            <input
              type="range"
              min="0"
              max="200"
              value={contrast}
              onChange={(e) => setContrast(Number(e.target.value))}
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-gray-300 text-sm mb-2">
              Saturation: {saturation}%
            </label>
            <input
              type="range"
              min="0"
              max="200"
              value={saturation}
              onChange={(e) => setSaturation(Number(e.target.value))}
              className="w-full"
            />
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleUndo}
            disabled={appliedImagesHistory.length === 0}
            className="flex-1 bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold py-2 px-4 rounded-lg transition-colors"
          >
            Undo
          </button>
          <button
            onClick={handleApply}
            disabled={!previewImage || isProcessing}
            className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold py-2 px-4 rounded-lg transition-colors"
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  )
}
