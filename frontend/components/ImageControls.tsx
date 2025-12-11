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
    <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 border border-gray-700 shadow-xl sticky top-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg flex items-center justify-center">
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-white">Actions</h2>
      </div>

      {/* Transform Actions */}
      <div className="space-y-3 mb-6">
        <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wide mb-3">Transform</h3>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => onRotate(90)}
            className="group p-3 bg-gray-700/50 text-gray-300 rounded-lg hover:bg-gray-600/50 hover:text-white transition-all duration-200 transform hover:scale-105 border border-gray-600/50 hover:border-gray-500/50"
            title="Rotate 90° clockwise"
          >
            <div className="flex flex-col items-center gap-1">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span className="text-xs">90°</span>
            </div>
          </button>
          <button
            onClick={() => onRotate(-90)}
            className="group p-3 bg-gray-700/50 text-gray-300 rounded-lg hover:bg-gray-600/50 hover:text-white transition-all duration-200 transform hover:scale-105 border border-gray-600/50 hover:border-gray-500/50"
            title="Rotate 90° counter-clockwise"
          >
            <div className="flex flex-col items-center gap-1">
              <svg className="w-5 h-5 transform scale-x-[-1]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span className="text-xs">-90°</span>
            </div>
          </button>
          <button
            onClick={() => onFlip('horizontal')}
            className="group p-3 bg-gray-700/50 text-gray-300 rounded-lg hover:bg-gray-600/50 hover:text-white transition-all duration-200 transform hover:scale-105 border border-gray-600/50 hover:border-gray-500/50"
            title="Flip horizontally"
          >
            <div className="flex flex-col items-center gap-1">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 12h16M8 8l-4 4 4 4M16 8l4 4-4 4" />
              </svg>
              <span className="text-xs">H-Flip</span>
            </div>
          </button>
          <button
            onClick={() => onFlip('vertical')}
            className="group p-3 bg-gray-700/50 text-gray-300 rounded-lg hover:bg-gray-600/50 hover:text-white transition-all duration-200 transform hover:scale-105 border border-gray-600/50 hover:border-gray-500/50"
            title="Flip vertically"
          >
            <div className="flex flex-col items-center gap-1">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
              </svg>
              <span className="text-xs">V-Flip</span>
            </div>
          </button>
        </div>
      </div>

      {/* History Actions */}
      <div className="space-y-3 mb-6">
        <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wide mb-3">History</h3>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={onUndo}
            disabled={!canUndo}
            className="group p-3 bg-gray-700/50 text-gray-300 rounded-lg disabled:bg-gray-800 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105 disabled:hover:scale-100 border border-gray-600/50 disabled:border-gray-700"
            title="Undo last action"
          >
            <div className="flex flex-col items-center gap-1">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
              </svg>
              <span className="text-xs">Undo</span>
            </div>
          </button>
          <button
            onClick={onRedo}
            disabled={!canRedo}
            className="group p-3 bg-gray-700/50 text-gray-300 rounded-lg disabled:bg-gray-800 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105 disabled:hover:scale-100 border border-gray-600/50 disabled:border-gray-700"
            title="Redo last undone action"
          >
            <div className="flex flex-col items-center gap-1">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10H11a8 8 0 00-8 8v2m18-10l-6-6m6 6l-6 6" />
              </svg>
              <span className="text-xs">Redo</span>
            </div>
          </button>
        </div>
      </div>

      {/* Main Actions */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wide mb-3">Actions</h3>
        <button
          onClick={onReset}
          className="group w-full p-4 bg-gradient-to-r from-yellow-600 to-yellow-700 hover:from-yellow-700 hover:to-yellow-800 text-white rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-yellow-500/25"
          title="Reset image to original state"
        >
          <div className="flex items-center justify-center gap-3">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span className="font-semibold">Reset Image</span>
          </div>
          <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-yellow-600 to-yellow-700 opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
        </button>
        <button
          onClick={onDownload}
          className="group relative w-full p-4 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-green-500/25"
          title="Download edited image"
        >
          <div className="flex items-center justify-center gap-3">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            <span className="font-semibold">Download</span>
          </div>
          <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-green-600 to-green-700 opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
        </button>
      </div>
    </div>
  )
}

