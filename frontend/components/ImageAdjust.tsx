'use client'

import { useState, useEffect } from 'react'
import { applyAdjustments } from '@/lib/api'
import SplitView from './SplitView'

interface ImageAdjustProps {
  imageSrc: string
  onAdjustApply: (adjustedImageUrl: string) => void
  onUndo?: (previousImageUrl: string) => void
}

export default function ImageAdjust({ imageSrc, onAdjustApply, onUndo }: ImageAdjustProps) {
  const [selectedOperation, setSelectedOperation] = useState<string>('equalization')
  const [threshold, setThreshold] = useState(128)
  const [kernelSize, setKernelSize] = useState(3)
  const [sigma, setSigma] = useState(1.0)
  const [isProcessing, setIsProcessing] = useState(false)
  const [previewImage, setPreviewImage] = useState<string | null>(null)

  // Clear preview when image changes
  useEffect(() => {
    setPreviewImage(null)
  }, [imageSrc])

  const operations = [
    { value: 'equalization', label: 'Histogram Equalization' },
    { value: 'stretching', label: 'Contrast Stretching' },
    { value: 'thresholding', label: 'Thresholding' },
    { value: 'mean', label: 'Mean Filter' },
    { value: 'gaussian', label: 'Gaussian Filter' },
    { value: 'median', label: 'Median Filter' },
    { value: 'sobel', label: 'Sobel Edge Detection' },
    { value: 'laplacian', label: 'Laplacian Filter' },
    { value: 'prewitt', label: 'Prewitt Edge Detection' },
    { value: 'canny', label: 'Canny Edge Detection' },
  ]

  const handlePreview = async () => {
    setIsProcessing(true)

    try {
      const adjustedImageUrl = await applyAdjustments(
        imageSrc,
        selectedOperation,
        threshold,
        kernelSize,
        sigma
      )
      setPreviewImage(adjustedImageUrl)
    } catch (error) {
      console.error('Error applying adjustment:', error)
      alert('Failed to preview adjustment. Please try again.')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleApply = async () => {
    setIsProcessing(true)

    try {
      const adjustedImageUrl = previewImage || await applyAdjustments(
        imageSrc,
        selectedOperation,
        threshold,
        kernelSize,
        sigma
      )
      setPreviewImage(null) // Clear preview after applying
      onAdjustApply(adjustedImageUrl)
    } catch (error) {
      console.error('Error applying adjustment:', error)
      alert('Failed to apply adjustment. Please try again.')
    } finally {
      setIsProcessing(false)
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

      {/* Operation Selection */}
      <div className="bg-gray-800 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-white mb-4">Image Adjustments</h3>

        <div className="grid grid-cols-2 gap-2 mb-4">
          {operations.map((op) => (
            <button
              key={op.value}
              onClick={() => setSelectedOperation(op.value)}
              className={`py-2 px-3 rounded-lg text-sm transition-colors ${
                selectedOperation === op.value
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
              }`}
            >
              {op.label}
            </button>
          ))}
        </div>
      </div>

      {/* Parameters */}
      <div className="bg-gray-700 rounded-lg p-4">
        <h4 className="text-md font-semibold text-white mb-4">Parameters</h4>

        <div className="space-y-4">
          {/* Threshold for thresholding */}
          {(selectedOperation === 'thresholding' || selectedOperation === 'canny') && (
            <div>
              <label className="block text-gray-300 text-sm mb-2">
                Threshold: {threshold}
              </label>
              <input
                type="range"
                min="0"
                max="255"
                value={threshold}
                onChange={(e) => setThreshold(Number(e.target.value))}
                className="w-full"
              />
            </div>
          )}

          {/* Kernel Size for convolution filters */}
          {['mean', 'gaussian', 'median', 'wiener', 'laplacian', 'prewitt', 'sobel'].includes(selectedOperation) && (
            <div>
              <label className="block text-gray-300 text-sm mb-2">
                Kernel Size: {kernelSize}
              </label>
              <input
                type="range"
                min="3"
                max="11"
                step="2"
                value={kernelSize}
                onChange={(e) => setKernelSize(Number(e.target.value))}
                className="w-full"
              />
            </div>
          )}

          {/* Sigma for Gaussian filter */}
          {selectedOperation === 'gaussian' && (
            <div>
              <label className="block text-gray-300 text-sm mb-2">
                Sigma: {sigma}
              </label>
              <input
                type="range"
                min="0.1"
                max="5.0"
                step="0.1"
                value={sigma}
                onChange={(e) => setSigma(Number(e.target.value))}
                className="w-full"
              />
            </div>
          )}
        </div>

        <div className="flex gap-2 mt-6">
          <button
            onClick={handlePreview}
            disabled={isProcessing}
            className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold py-2 px-4 rounded-lg transition-colors"
          >
            {isProcessing ? 'Processing...' : 'Preview'}
          </button>
          <button
            onClick={handleApply}
            disabled={isProcessing}
            className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold py-2 px-4 rounded-lg transition-colors"
          >
            Apply Adjustment
          </button>
        </div>
      </div>
    </div>
  )
}
