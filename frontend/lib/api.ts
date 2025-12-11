const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export async function cropImage(
  imageData: string,
  x: number,
  y: number,
  width: number,
  height: number
): Promise<string> {
  const formData = new FormData()
  formData.append('image_data', imageData)
  formData.append('x', x.toString())
  formData.append('y', y.toString())
  formData.append('width', width.toString())
  formData.append('height', height.toString())

  const response = await fetch(`${API_BASE_URL}/api/image/crop`, {
    method: 'POST',
    body: formData,
  })

  if (!response.ok) {
    throw new Error('Failed to crop image')
  }

  const data = await response.json()
  return data.image
}

export async function rotateImage(imageData: string, degrees: number): Promise<string> {
  const formData = new FormData()
  formData.append('image_data', imageData)
  formData.append('degrees', degrees.toString())

  const response = await fetch(`${API_BASE_URL}/api/image/rotate`, {
    method: 'POST',
    body: formData,
  })

  if (!response.ok) {
    throw new Error('Failed to rotate image')
  }

  const data = await response.json()
  return data.image
}

export async function flipImage(
  imageData: string,
  direction: 'horizontal' | 'vertical'
): Promise<string> {
  const formData = new FormData()
  formData.append('image_data', imageData)
  formData.append('direction', direction)

  const response = await fetch(`${API_BASE_URL}/api/image/flip`, {
    method: 'POST',
    body: formData,
  })

  if (!response.ok) {
    throw new Error('Failed to flip image')
  }

  const data = await response.json()
  return data.image
}

export async function applyFilters(
  imageData: string,
  filterType?: string,
  brightness?: number,
  contrast?: number,
  saturation?: number
): Promise<string> {
  const formData = new FormData()
  formData.append('image_data', imageData)
  if (filterType) formData.append('filter_type', filterType)
  if (brightness !== undefined) formData.append('brightness', brightness.toString())
  if (contrast !== undefined) formData.append('contrast', contrast.toString())
  if (saturation !== undefined) formData.append('saturation', saturation.toString())

  const response = await fetch(`${API_BASE_URL}/api/image/apply-filters`, {
    method: 'POST',
    body: formData,
  })

  if (!response.ok) {
    throw new Error('Failed to apply filters')
  }

  const data = await response.json()
  return data.image
}

export async function applyAdjustments(
  imageUrl: string,
  operation: string,
  threshold?: number,
  kernelSize?: number,
  sigma?: number
): Promise<string> {
  const formData = new FormData()
  formData.append('image_url', imageUrl)
  formData.append('operation', operation)
  formData.append('threshold', threshold?.toString() || '128')
  formData.append('kernel_size', kernelSize?.toString() || '3')
  formData.append('sigma', sigma?.toString() || '1.0')

  const response = await fetch(`${API_BASE_URL}/api/image/adjust`, {
    method: 'POST',
    body: formData,
  })

  if (!response.ok) {
    throw new Error('Failed to apply adjustments')
  }

  const data = await response.json()
  return data.image_url
}

