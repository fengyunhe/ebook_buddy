import type { MediaAttachment, ScreenCaptureResult, ImageFileResult } from '../../shared/types/media'
import { isImageSizeValid, isImageFormatValid, MAX_IMAGE_SIZE } from '../../shared/types/media'

const electronAPI = (window as any).electronAPI

function createInputElement(accept: string, multiple: boolean = false): HTMLInputElement {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = accept
  input.multiple = multiple
  input.style.display = 'none'
  document.body.appendChild(input)
  return input
}

function openFileDialog(options?: { filters?: { name: string; extensions: string[] }[]; properties?: string[] }): Promise<{ canceled: boolean; filePaths: string[] }> {
  return new Promise((resolve) => {
    const input = createInputElement(
      options?.filters?.[0]?.extensions?.map(ext => '.' + ext).join(',') || '',
      options?.properties?.includes('multiSelections')
    )
    input.onchange = async () => {
      const files = input.files
      if (!files || files.length === 0) {
        resolve({ canceled: true, filePaths: [] })
        return
      }
      const filePaths = Array.from(files).map(f => f.name)
      resolve({ canceled: false, filePaths })
    }
    input.oncancel = () => {
      resolve({ canceled: true, filePaths: [] })
    }
    input.click()
  })
}

function readFile(filePath: string): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const input = createInputElement('')
    input.onchange = async () => {
      const file = input.files?.[0]
      if (!file) {
        reject(new Error('No file selected'))
        return
      }
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as ArrayBuffer)
      reader.onerror = () => reject(new Error('Failed to read file'))
      reader.readAsArrayBuffer(file)
    }
    input.click()
  })
}

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
    let fileData: ArrayBuffer | null = null
    let fileName = 'image'

    if (electronAPI?.openFileDialog) {
      const result = await electronAPI.openFileDialog({
        filters: [{ name: 'Images', extensions: ['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp', 'ico', 'tiff', 'tif'] }],
        properties: ['openFile']
      })

      if (result?.canceled || !result?.filePaths?.[0]) {
        return { success: false, error: 'No file selected' }
      }

      const filePath = result.filePaths[0]
      fileData = await electronAPI.readFile(filePath)
      fileName = filePath.split(/[\\/]/).pop() || 'image'
    } else {
      const input = createInputElement('image/*')
      const file: File | null = await new Promise((resolve) => {
        input.onchange = () => resolve(input.files?.[0] || null)
        input.oncancel = () => resolve(null)
        input.click()
      })
      document.body.removeChild(input)

      if (!file) {
        return { success: false, error: 'No file selected' }
      }

      fileData = await file.arrayBuffer()
      fileName = file.name
    }
    
    if (!fileData) {
      return { success: false, error: 'Failed to read file' }
    }

    const blob = new Blob([fileData])
    const size = blob.size

    if (!isImageSizeValid(size)) {
      return { success: false, error: `Image too large. Maximum size is ${MAX_IMAGE_SIZE / 1024 / 1024}MB` }
    }

    const base64 = await blobToBase64(blob)

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