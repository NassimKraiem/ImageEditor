'use client'

interface ImageControlsProps {
  onRotate: (degrees: number) => void
  onFlip: (direction: 'horizontal' | 'vertical') => void
  onReset: () => void
  onDownload: () => void
  onUndo?: () => void
  onRedo?: () => void
  canUndo?: boolean
  canRedo?: boolean
}

export default function ImageControls({
  onRotate,
  onFlip,
  onReset,
  onDownload,
  onUndo,
  onRedo,
  canUndo = false,
  canRedo = false,
}: ImageControlsProps) {
  return (
    <div className="bg-gray-800 rounded-lg p-4 space-y-4">
      <h2 className="text-xl font-semibold text-white mb-4">Transform</h2>
      
      <div className="space-y-2">
        <button
          onClick={() => onRotate(90)}
          className="w-full py-2 px-4 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors flex items-center justify-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" transform="scale(-1, 1)">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Rotate 90°
        </button>
        <button
          onClick={() => onRotate(-90)}
          className="w-full py-2 px-4 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors flex items-center justify-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" offset={10} strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Rotate -90°
        </button>
        <button
          onClick={() => onFlip('horizontal')}
          className="w-full py-2 px-4 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors flex items-center justify-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 12h16M8 8l-4 4 4 4M16 8l4 4-4 4" />
          </svg>
          Flip Horizontal
        </button>
        <button
          onClick={() => onFlip('vertical')}
          className="w-full py-2 px-4 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors flex items-center justify-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
          </svg>
          Flip Vertical
        </button>
      </div>

      <div className="pt-4 border-t border-gray-700 space-y-2">
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={onUndo}
            disabled={!canUndo}
            className="py-2 px-3 bg-gray-600 text-gray-300 rounded-lg hover:bg-gray-500 disabled:bg-gray-700 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-1"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
            </svg>
            Undo
          </button>
          <button
            onClick={onRedo}
            disabled={!canRedo}
            className="py-2 px-3 bg-gray-600 text-gray-300 rounded-lg hover:bg-gray-500 disabled:bg-gray-700 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-1"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10H11a8 8 0 00-8 8v2m18-10l-6-6m6 6l-6 6" />
            </svg>
            Redo
          </button>
        </div>
        <button
          onClick={onReset}
          className="w-full py-2 px-4 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
        >
          Reset
        </button>
        <button
          onClick={onDownload}
          className="w-full py-2 px-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Download
        </button>
      </div>
    </div>
  )
}

