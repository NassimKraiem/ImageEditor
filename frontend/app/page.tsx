import Link from 'next/link'

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm">
        <h1 className="text-4xl font-bold text-center mb-8 text-white">
          Welcome to Image Editor
        </h1>
        <p className="text-center text-lg text-gray-300 mb-8">
          A powerful image editing tool built with Next.js and FastAPI
        </p>
        <div className="flex justify-center">
          <Link
            href="/editor"
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-lg transition-colors text-lg"
          >
            Open Image Editor
          </Link>
        </div>
      </div>
    </main>
  )
}

