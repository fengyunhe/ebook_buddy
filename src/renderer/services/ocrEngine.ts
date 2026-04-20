import Tesseract from 'tesseract.js'
import type { OcrEngine, OcrResult, BoundingBox } from '../../shared/types/knowledge'

const UMI_OCR_URL = 'http://localhost:1224'

let defaultOcrLanguages: string[] = ['eng', 'chi_sim']

export function setOcrLanguages(langs: string[]): void {
  defaultOcrLanguages = langs
}

export function getOcrLanguages(): string[] {
  return [...defaultOcrLanguages]
}

export interface OcrOptions {
  logger?: (info: unknown) => void
  gpuEnabled?: boolean
}

export async function getAvailableAccelerations(): Promise<{ type: string; score: number }[]> {
  const accel: { type: string; score: number }[] = []
  
  if (typeof navigator !== 'undefined' && navigator.gpu) {
    const gpu = navigator.gpu
    try {
      const adapter = await gpu.requestAdapter()
      if (adapter) {
        const info = await adapter.requestDevice()
        const isApple = info?.device?.label?.toLowerCase().includes('apple') || 
                      adapter.description.toLowerCase().includes('apple')
        const isMseries = adapter.description.toLowerCase().includes('m') ||
                          adapter.description.toLowerCase().includes('apple silicon')
        
        if (isMseries || isApple) {
          accel.push({ type: 'Apple M-Series GPU', score: 100 })
        } else {
          accel.push({ type: 'WebGPU', score: 90 })
        }
      }
    } catch {
      accel.push({ type: 'WebGPU Available', score: 80 })
    }
  }
  
  try {
    const { relaxedSimd, simd } = await import('wasm-feature-detect')
    if (await relaxedSimd()) {
      accel.push({ type: 'WASM Relaxed SIMD', score: 70 })
    } else if (await simd()) {
      accel.push({ type: 'WASM SIMD', score: 50 })
    }
  } catch {
    accel.push({ type: 'WASM Basic', score: 30 })
  }
  
  accel.push({ type: 'CPU Fallback', score: 10 })
  
  return accel.sort((a, b) => b.score - a.score)
}

export async function isAppleSilicon(): Promise<boolean> {
  if (typeof navigator === 'undefined') return false
  
  try {
    const gpu = navigator.gpu
    if (!gpu) return false
    
    const adapter = await gpu.requestAdapter()
    if (!adapter) return false
    
    const desc = adapter.description.toLowerCase()
    return desc.includes('apple') || desc.includes('m') || 
           desc.includes('mac') || desc.includes('silicon')
  } catch {
    return false
  }
}

class TesseractOcrEngine implements OcrEngine {
  name = 'tesseract' as const
  private worker: Tesseract.Worker | null = null
  private options: OcrOptions = {}
  private useWebGpu = false

  async isAvailable(): Promise<boolean> {
    return true
  }

  async init(lang: string[] = defaultOcrLanguages, options?: OcrOptions): Promise<void> {
    if (this.worker) return
    
    this.options = options || {}
    const logger = this.options.logger || undefined
    
    this.worker = await Tesseract.createWorker('eng+chi_sim', 1, logger ? { logger } : {})
  }

  async recognize(image: HTMLCanvasElement | Blob, lang: string[] = defaultOcrLanguages): Promise<OcrResult> {
    if (!this.worker) {
      await this.init(lang, this.options)
    }
    const { data } = await this.worker!.recognize(image)
    const boundingBoxes: BoundingBox[] = (data.words || [])
      .filter((w: any) => w.block && w.block.para)
      .map((w: any) => ({
        x: w.block.para.bbox.x0 || 0,
        y: w.block.para.bbox.y0 || 0,
        width: (w.block.para.bbox.x1 || 0) - (w.block.para.bbox.x0 || 0),
        height: (w.block.para.bbox.y1 || 0) - (w.block.para.bbox.y0 || 0)
      }))
    return {
      text: data.text || '',
      boundingBoxes,
      confidence: data.confidence || 0
    }
  }

  async terminate(): Promise<void> {
    if (this.worker) {
      await this.worker.terminate()
      this.worker = null
    }
  }
}

class UmiOcrEngine implements OcrEngine {
  name = 'umi-ocr' as const

  async isAvailable(): Promise<boolean> {
    try {
      const resp = await fetch(`${UMI_OCR_URL}/api/openapi/ocr/img`, {
        method: 'HEAD',
        headers: { 'Content-Type': 'application/json' }
      })
      return resp.ok
    } catch {
      return false
    }
  }

  async recognize(image: HTMLCanvasElement | Blob, lang: string[] = ['eng', 'chi_sim']): Promise<OcrResult> {
    const blob = image instanceof HTMLCanvasElement
      ? await new Promise<Blob>(resolve => image.toBlob(resolve!, 'image/png'))
      : image
    
    const arrayBuffer = await blob.arrayBuffer()
    const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)))
    
    const langMap: Record<string, string> = {
      'eng': 'models/config_en.txt',
      'chi_sim': 'models/config_chinese.txt'
    }
    const langFile = langMap[lang[0]] || langMap.chi_sim || 'models/config_chinese.txt'
    
    const resp = await fetch(`${UMI_OCR_URL}/api/ocr`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        base64,
        options: {
          'ocr.language': langFile,
          'data.format': 'text'
        }
      })
    })

    if (!resp.ok) {
      throw new Error(`Umi-OCR request failed: ${resp.status}`)
    }

    const result = await resp.json()
    const textItems = result?.data || []
    const boundingBoxes: BoundingBox[] = textItems.map((item: any) => ({
      x: item.box?.[0]?.[0] || 0,
      y: item.box?.[0]?.[1] || 0,
      width: Math.abs((item.box?.[1]?.[0] || 0) - (item.box?.[0]?.[0] || 0)),
      height: Math.abs((item.box?.[1]?.[1] || 0) - (item.box?.[0]?.[1] || 0))
    }))

    return {
      text: textItems.map((t: any) => t.text).join('\n'),
      boundingBoxes,
      confidence: result?.data?.confidence || 0
    }
  }
}

let tesseractEngine: TesseractOcrEngine | null = null
let detectedUmiOcr = false
let gpuEnabled = false

export async function createOcrEngine(useGpu = false): Promise<OcrEngine> {
  gpuEnabled = useGpu
  
  const umiAvailable = await new UmiOcrEngine().isAvailable()
  if (umiAvailable) {
    return new UmiOcrEngine()
  }
  
  const engine = new TesseractOcrEngine()
  await engine.init()
  return engine
}

export async function initTesseract(lang: string[] = ['eng', 'chi_sim']): Promise<void> {
  if (!tesseractEngine) {
    tesseractEngine = new TesseractOcrEngine()
    await tesseractEngine.init(lang)
  }
}

export async function destroyOcrEngine(): Promise<void> {
  if (tesseractEngine) {
    await tesseractEngine.terminate()
    tesseractEngine = null
  }
}
