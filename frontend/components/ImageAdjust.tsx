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
    <div className="space-y-6">
      {/* Split View */}
      <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 border border-gray-700 shadow-xl">
        <SplitView
          originalImage={imageSrc}
          modifiedImage={previewImage}
          isLoading={isProcessing}
        />
      </div>

      {/* Adjustment Controls */}
      <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 border border-gray-700 shadow-xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-white">Advanced Processing</h3>
        </div>

        {/* Operation Selection */}
        <div className="mb-6">
          <h4 className="text-sm font-semibold text-gray-300 uppercase tracking-wide mb-3">Processing Operations</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {operations.map((op) => (
              <button
                key={op.value}
                onClick={() => setSelectedOperation(op.value)}
                className={`group p-3 rounded-xl transition-all duration-200 transform hover:scale-105 ${
                  selectedOperation === op.value
                    ? 'bg-gradient-to-r from-purple-600 to-purple-700 text-white shadow-lg shadow-purple-500/25'
                    : 'bg-gray-700/50 text-gray-300 hover:bg-gray-600/50 hover:text-white border border-gray-600/50 hover:border-gray-500/50'
                }`}
              >
                <div className="text-center">
                  <div className="font-medium text-sm">{op.label}</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Parameters */}
        <div className="space-y-5">
          <h4 className="text-sm font-semibold text-gray-300 uppercase tracking-wide mb-3">Parameters</h4>

          <div className="grid grid-cols-1 gap-4">
            {/* Threshold for thresholding and canny */}
            {(selectedOperation === 'thresholding' || selectedOperation === 'canny') && (
              <div className="bg-gray-800/50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-gray-300 text-sm font-medium">Threshold</label>
                  <span className="text-red-400 text-sm font-mono">{threshold}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="255"
                  value={threshold}
                  onChange={(e) => setThreshold(Number(e.target.value))}
                  className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
                />
              </div>
            )}

            {/* Kernel Size for convolution filters */}
            {['mean', 'gaussian', 'median', 'wiener', 'laplacian', 'prewitt', 'sobel'].includes(selectedOperation) && (
              <div className="bg-gray-800/50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-gray-300 text-sm font-medium">Kernel Size</label>
                  <span className="text-orange-400 text-sm font-mono">{kernelSize}</span>
                </div>
                <input
                  type="range"
                  min="3"
                  max="11"
                  step="2"
                  value={kernelSize}
                  onChange={(e) => setKernelSize(Number(e.target.value))}
                  className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
                />
              </div>
            )}

            {/* Sigma for Gaussian filter */}
            {selectedOperation === 'gaussian' && (
              <div className="bg-gray-800/50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-gray-300 text-sm font-medium">Sigma</label>
                  <span className="text-cyan-400 text-sm font-mono">{sigma}</span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="5.0"
                  step="0.1"
                  value={sigma}
                  onChange={(e) => setSigma(Number(e.target.value))}
                  className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
                />
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 pt-6 border-t border-gray-700">
          <div className="grid grid-cols-2 gap-4 mb-4">
            <button
              onClick={handlePreview}
              disabled={isProcessing}
              className="group relative p-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed text-white rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-blue-500/25"
            >
              <div className="flex flex-col items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                <span className="font-semibold text-sm">
                  {isProcessing ? 'Processing...' : 'Preview'}
                </span>
              </div>
              <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
            </button>

            <button
              onClick={handleApply}
              disabled={isProcessing}
              className="group relative p-4 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed text-white rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-green-500/25"
            >
              <div className="flex flex-col items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="font-semibold text-sm">Apply</span>
              </div>
              <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-green-600 to-green-700 opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
