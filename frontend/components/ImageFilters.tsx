'use client'

import { useState, useEffect, useCallback } from 'react'
import { applyFilters } from '@/lib/api'

interface ImageFiltersProps {
  imageSrc: string
  onFilterApply: (filteredImageUrl: string) => void
}

const filters = [
  { name: 'None', value: 'none' },
  { name: 'Grayscale', value: 'grayscale' },
  { name: 'Sepia', value: 'sepia' },
  { name: 'Blur', value: 'blur' },
  { name: 'Invert', value: 'invert' },
]

export default function ImageFilters({ imageSrc, onFilterApply }: ImageFiltersProps) {
  const [selectedFilter, setSelectedFilter] = useState<string>('none')
  const [brightness, setBrightness] = useState(100)
  const [contrast, setContrast] = useState(100)
  const [saturation, setSaturation] = useState(100)
  const [isProcessing, setIsProcessing] = useState(false)
  const [previewImage, setPreviewImage] = useState<string | null>(null)

  const processFilters = useCallback(async () => {
    if (!imageSrc) return

    setIsProcessing(true)
    try {
      const filterType = selectedFilter === 'none' ? undefined : selectedFilter
      const filteredImageUrl = await applyFilters(
        imageSrc,
        filterType,
        brightness,
        contrast,
        saturation
      )
      setPreviewImage(filteredImageUrl)
    } catch (error) {
      console.error('Error applying filters:', error)
      alert('Failed to apply filters. Please try again.')
    } finally {
      setIsProcessing(false)
    }
  }, [imageSrc, selectedFilter, brightness, contrast, saturation])

  useEffect(() => {
    // Debounce filter processing
    const timer = setTimeout(() => {
      processFilters()
    }, 300)

    return () => clearTimeout(timer)
  }, [processFilters])

  const handleApply = () => {
    if (previewImage) {
      onFilterApply(previewImage)
    }
  }

  return (
    <div className="bg-gray-700 rounded-lg p-4">
      <h3 className="text-lg font-semibold text-white mb-4">Filters</h3>
      
      {isProcessing && (
        <div className="mb-4 text-center text-gray-300">Processing...</div>
      )}

      {previewImage && !isProcessing && (
        <div className="mb-4 flex justify-center">
          <img
            src={previewImage}
            alt="Preview"
            className="max-w-full max-h-48 rounded-lg"
          />
        </div>
      )}

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

      <button
        onClick={handleApply}
        disabled={!previewImage || isProcessing}
        className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold py-2 px-4 rounded-lg transition-colors"
      >
        Apply Filters
      </button>
    </div>
  )
}
