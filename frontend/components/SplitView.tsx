'use client'

import { useState, useMemo } from 'react'

interface SplitViewProps {
  originalImage: string
  modifiedImage: string | null
  isLoading?: boolean
}

export default function SplitView({ originalImage, modifiedImage, isLoading }: SplitViewProps) {
  const [sliderPosition, setSliderPosition] = useState(50)
  
  // Memoize image sources to prevent unnecessary re-renders
  const originalImageKey = useMemo(() => originalImage, [originalImage])
  const modifiedImageKey = useMemo(() => modifiedImage, [modifiedImage])

  return (
    <div className="relative w-full h-full bg-gray-900 rounded-lg overflow-hidden">
      <div className="relative w-full h-full" style={{ minHeight: '500px' }}>
        {/* Original Image */}
        <div className="absolute inset-0">
          <img
            key={originalImageKey}
            src={originalImage}
            alt="Original"
            className="w-full h-full object-contain"
            style={{ 
              imageRendering: 'auto',
              transition: 'opacity 0.2s ease-in-out'
            }}
            onLoad={(e) => {
              // Prevent flickering by ensuring image is fully loaded
              e.currentTarget.style.opacity = '1'
            }}
          />
        </div>

        {/* Modified Image with clip-path */}
        {modifiedImage && (
          <div
            className="absolute inset-0"
            style={{
              clipPath: `inset(0 ${100 - sliderPosition}% 0 0)`,
            }}
          >
            <img
              key={modifiedImageKey}
              src={modifiedImage}
              alt="Modified"
              className="w-full h-full object-contain"
              style={{ 
                imageRendering: 'auto',
                transition: 'opacity 0.2s ease-in-out'
              }}
              onLoad={(e) => {
                // Prevent flickering by ensuring image is fully loaded
                e.currentTarget.style.opacity = '1'
              }}
            />
          </div>
        )}

        {/* Slider Control */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
          <div className="relative w-full h-full">
            <input
              type="range"
              min="0"
              max="100"
              value={sliderPosition}
              onChange={(e) => setSliderPosition(Number(e.target.value))}
              className="split-view-slider absolute top-1/2 left-0 w-full h-4 bg-transparent appearance-none cursor-ew-resize z-30 pointer-events-auto opacity-0"
              style={{
                transform: 'translateY(-50%)',
              }}
            />
            <div
              className="absolute top-0 bottom-0 w-1 bg-white/80 shadow-2xl z-20 pointer-events-none"
              style={{
                left: `${sliderPosition}%`,
                transform: 'translateX(-50%)',
              }}
            >
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-white rounded-full shadow-2xl flex items-center justify-center border-4 border-blue-500">
                <div className="w-6 h-6 flex items-center justify-center">
                  <svg className="w-4 h-4 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Labels */}
        <div className="absolute top-4 right-4 bg-black/50 text-white px-3 py-1 rounded text-sm">
          Original
        </div>
        {modifiedImage && (
          <div className="absolute top-4 left-4 bg-black/50 text-white px-3 py-1 rounded text-sm">
            Modified
          </div>
        )}

        {/* Loading Overlay */}
        {isLoading && (
          // <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="bg-gray-800 text-white px-4 py-2 rounded-lg">
              Processing...
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

