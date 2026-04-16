import type { MediaAttachment, ScreenCaptureResult, ImageFileResult } from '../../shared/types/media'
import { isImageSizeValid, isImageFormatValid, MAX_IMAGE_SIZE } from '../../shared/types/media'

export async function captureScreen(): Promise<ScreenCaptureResult> {
  try {
    const sources = await (window as any).electronAPI?.getDesktopSources?.()
    
    if (!sources || sources.length === 0) {
      return {
        success: false,
        error: 'No screen sources available'
      }
    }

    const primarySource = sources.find((s: any) => s.name.toLowerCase().includes('screen') || s.name.toLowerCase().includes('entire')) || sources[0]
    
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: false,
      video: {
        mandatory: {
          chromeMediaSource: 'desktop',
          chromeMediaSourceId: primarySource.id,
          minWidth: 1280,
          maxWidth: 1920,
          minHeight: 720,
          maxHeight: 1080
        }
      } as any
    })

    const video = document.createElement('video')
    video.srcObject = stream
    await video.play()

    const canvas = document.createElement('canvas')
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const ctx = canvas.getContext('2d')
    ctx?.drawImage(video, 0, 0)

    stream.getTracks().forEach(track => track.stop())

    const dataUrl = canvas.toDataURL('image/png')
    const base64 = dataUrl.split(',')[1]

    return {
      success: true,
      data: {
        id: crypto.randomUUID(),
        type: 'image',
        data: base64,
        mimeType: 'image/png',
        size: Math.ceil(base64.length * 0.75)
      }
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to capture screen'
    }
  }
}

export async function selectImageFile(): Promise<ImageFileResult> {
  try {
    const result = await (window as any).electronAPI?.openFileDialog?.({
      filters: [{ name: 'Images', extensions: ['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp', 'ico', 'tiff', 'tif'] }],
      properties: ['openFile']
    })

    if (result?.canceled || !result?.filePaths?.[0]) {
      return { success: false, error: 'No file selected' }
    }

    const filePath = result.filePaths[0]
    const fileData = await (window as any).electronAPI?.readFile?.(filePath)
    
    if (!fileData) {
      return { success: false, error: 'Failed to read file' }
    }

    const blob = new Blob([fileData])
    const size = blob.size

    if (!isImageSizeValid(size)) {
      return { success: false, error: `Image too large. Maximum size is ${MAX_IMAGE_SIZE / 1024 / 1024}MB` }
    }

    const base64 = await blobToBase64(blob)
    const fileName = filePath.split(/[\\/]/).pop() || 'image'

    return {
      success: true,
      data: {
        id: crypto.randomUUID(),
        type: 'image',
        data: base64,
        mimeType: getMimeType(fileName),
        size,
        name: fileName
      }
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to select image'
    }
  }
}

async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      resolve(result.split(',')[1])
    }
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

function getMimeType(fileName: string): string {
  const ext = fileName.split('.').pop()?.toLowerCase()
  const mimeTypes: Record<string, string> = {
    png: 'image/png',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    gif: 'image/gif',
    webp: 'image/webp',
    bmp: 'image/bmp',
    ico: 'image/x-icon',
    tiff: 'image/tiff',
    tif: 'image/tiff'
  }
  return mimeTypes[ext || ''] || 'image/png'
}

export function validateImage(attachment: MediaAttachment): { valid: boolean; error?: string } {
  if (!isImageSizeValid(attachment.size)) {
    return { valid: false, error: `Image too large. Maximum size is ${MAX_IMAGE_SIZE / 1024 / 1024}MB` }
  }
  
  if (!isImageFormatValid(attachment.mimeType)) {
    return { valid: false, error: 'Unsupported image format' }
  }
  
  return { valid: true }
}

export async function processClipboardImage(): Promise<ImageFileResult> {
  try {
    const items = await navigator.clipboard.read()
    
    for (const item of items) {
      for (const type of item.types) {
        if (type.startsWith('image/')) {
          const blob = await item.getType(type)
          const size = blob.size
          
          if (!isImageSizeValid(size)) {
            return { success: false, error: `Image too large. Maximum size is ${MAX_IMAGE_SIZE / 1024 / 1024}MB` }
          }
          
          const base64 = await blobToBase64(blob)
          const ext = type.split('/')[1] || 'png'
          const mimeType = `image/${ext}`
          
          return {
            success: true,
            data: {
              id: crypto.randomUUID(),
              type: 'image',
              data: base64,
              mimeType,
              size
            }
          }
        }
      }
    }
    
    return { success: false, error: 'No image in clipboard' }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Failed to process clipboard' }
  }
}