export interface MediaAttachment {
  id: string
  type: 'image' | 'audio'
  data: string
  mimeType: string
  size: number
  name?: string
}

export interface ScreenCaptureResult {
  success: boolean
  data?: MediaAttachment
  error?: string
}

export interface ImageFileResult {
  success: boolean
  data?: MediaAttachment
  error?: string
}

export const MAX_IMAGE_SIZE = 5 * 1024 * 1024

export const SUPPORTED_IMAGE_FORMATS = [
  'image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp',
  'image/bmp', 'image/x-icon', 'image/tiff'
]

export function isImageSizeValid(size: number): boolean {
  return size <= MAX_IMAGE_SIZE
}

export function isImageFormatValid(mimeType: string): boolean {
  return SUPPORTED_IMAGE_FORMATS.includes(mimeType)
}