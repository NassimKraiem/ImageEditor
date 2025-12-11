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
  const wsRef = useRef<ImageProcessorWebSocket | null>(null)
  const updateTimerRef = useRef<NodeJS.Timeout | null>(null)
  const originalImageRef = useRef<string>(imageSrc)
  const isInitializedRef = useRef<boolean>(false)

  // Derive isProcessing from pendingOperationsCount for concurrency safety
  const isProcessing = pendingOperationsCount > 0

  // Clear preview when image changes
  useEffect(() => {
    setPreviewImage(null)
  }, [imageSrc])

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
      onFilterApply(previewImage)
      // Reset filters to default after applying
      setBrightness(100)
      setContrast(100)
      setSaturation(100)
      setSelectedFilter('none')
    }
  }


  return (
    <div className="space-y-6">
      {/* Split View */}
      <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 border border-gray-700 shadow-xl">
        <SplitView
          originalImage={imageSrc}
          modifiedImage={previewImage}
          isLoading={isProcessing}
        />
      </div>

      {/* Filter Controls */}
      <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 border border-gray-700 shadow-xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-white">Visual Filters</h3>
        </div>

        {/* Preset Filters */}
        <div className="mb-6">
          <h4 className="text-sm font-semibold text-gray-300 uppercase tracking-wide mb-3">Preset Filters</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {filters.map((filter) => (
              <button
                key={filter.value}
                onClick={() => setSelectedFilter(filter.value)}
                className={`group p-3 rounded-xl transition-all duration-200 transform hover:scale-105 ${
                  selectedFilter === filter.value
                    ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-500/25'
                    : 'bg-gray-700/50 text-gray-300 hover:bg-gray-600/50 hover:text-white border border-gray-600/50 hover:border-gray-500/50'
                }`}
              >
                <div className="text-center">
                  <div className="font-medium text-sm">{filter.name}</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Manual Adjustments */}
        <div className="space-y-5">
          <h4 className="text-sm font-semibold text-gray-300 uppercase tracking-wide mb-3">Manual Adjustments</h4>

          <div className="grid grid-cols-1 gap-4">
            <div className="bg-gray-800/50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <label className="text-gray-300 text-sm font-medium">Brightness</label>
                <span className="text-blue-400 text-sm font-mono">{brightness}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="200"
                value={brightness}
                onChange={(e) => setBrightness(Number(e.target.value))}
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
              />
            </div>

            <div className="bg-gray-800/50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <label className="text-gray-300 text-sm font-medium">Contrast</label>
                <span className="text-green-400 text-sm font-mono">{contrast}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="200"
                value={contrast}
                onChange={(e) => setContrast(Number(e.target.value))}
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
              />
            </div>

            <div className="bg-gray-800/50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <label className="text-gray-300 text-sm font-medium">Saturation</label>
                <span className="text-purple-400 text-sm font-mono">{saturation}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="200"
                value={saturation}
                onChange={(e) => setSaturation(Number(e.target.value))}
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
              />
            </div>
          </div>
        </div>

        {/* Apply Button */}
        <div className="mt-6 pt-6 border-t border-gray-700">
          <button
            onClick={handleApply}
            disabled={!previewImage || isProcessing}
            className="group relative w-full p-4 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed text-white rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-green-500/25"
          >
            <div className="flex items-center justify-center gap-3">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="font-semibold">
                {isProcessing ? 'Applying...' : 'Apply Filter'}
              </span>
            </div>
            <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-green-600 to-green-700 opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
          </button>
        </div>
      </div>
    </div>
  )
}
