import React, { useState, useRef, useEffect, useCallback } from 'react'
import * as pdfjsLib from 'pdfjs-dist'
import {
  Box,
  Button,
  IconButton,
  Typography,
  CircularProgress,
  TextField,
  Divider,
  Snackbar,
  Alert
} from '@mui/material'
import {
  FileOpen as FileOpenIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  ZoomIn as ZoomInIcon,
  ZoomOut as ZoomOutIcon
} from '@mui/icons-material'
import { useConversationImageStore } from '../../stores/conversationImageStore'

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString()

const STORAGE_KEY = 'ebook-buddy-pdf-state'

interface PDFState {
  filePath: string
  page: number
  scale: number
}

interface PDFViewerProps {
  onPageChange?: (page: number) => void
}

export function PDFViewer({ onPageChange }: PDFViewerProps) {
  const [pdfDoc, setPdfDoc] = useState<pdfjsLib.PDFDocumentProxy | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(0)
  const [scale, setScale] = useState(1.5)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pageInput, setPageInput] = useState('1')
  const [currentFilePath, setCurrentFilePath] = useState<string>('')
  const [canvasWidth, setCanvasWidth] = useState(0)
  const [containerWidth, setContainerWidth] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const renderTaskRef = useRef<any>(null)
  const scaleRef = useRef(scale)
  const currentPageRef = useRef(currentPage)
  const filePathRef = useRef(currentFilePath)
  const [notification, setNotification] = useState<{ open: boolean; message: string; severity: 'success' | 'error' | 'info' }>({ open: false, message: '', severity: 'info' })
  
  const addImage = useConversationImageStore((state) => state.addImage)
  
  useEffect(() => {
    filePathRef.current = currentFilePath
  }, [currentFilePath])
  
  const handleCaptureCurrentPage = useCallback(async () => {
    if (!pdfDoc || !currentPage || !filePathRef.current) {
      setNotification({ open: true, message: 'Please open a PDF first', severity: 'error' })
      return
    }
    
    try {
      const page = await pdfDoc.getPage(currentPage)
      const viewport = page.getViewport({ scale: 1.5 })
      
      const canvas = document.createElement('canvas')
      canvas.width = viewport.width
      canvas.height = viewport.height
      
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        throw new Error('Failed to get canvas context')
      }
      
      await page.render({
        canvasContext: ctx,
        viewport
      }).promise
      
      const imageData = canvas.toDataURL('image/png')
      page.cleanup()
      
      const result = addImage(currentPage, imageData, filePathRef.current)
      
      if (result.success) {
        setNotification({ open: true, message: `Page ${currentPage} added to chat`, severity: 'success' })
      } else {
        setNotification({ open: true, message: result.message || 'Failed to add page', severity: 'error' })
      }
    } catch (err) {
      console.error('Failed to capture page:', err)
      setNotification({ open: true, message: 'Failed to capture page', severity: 'error' })
    }
  }, [pdfDoc, currentPage, addImage])
  
  const handleCaptureMultiplePages = useCallback(async (count: number) => {
    if (!pdfDoc || !currentPage || !filePathRef.current) {
      setNotification({ open: true, message: 'Please open a PDF first', severity: 'error' })
      return
    }
    
    const store = useConversationImageStore.getState()
    const remainingSlots = 10 - store.images.length
    const pagesToCapture = Math.min(count || remainingSlots, remainingSlots, totalPages - currentPage + 1)
    
    let addedCount = 0
    for (let i = 0; i < pagesToCapture && useConversationImageStore.getState().images.length < 10; i++) {
      const pageNum = currentPage + i
      try {
        const page = await pdfDoc.getPage(pageNum)
        const viewport = page.getViewport({ scale: 1.5 })
        
        const canvas = document.createElement('canvas')
        canvas.width = viewport.width
        canvas.height = viewport.height
        
        const ctx = canvas.getContext('2d')
        if (!ctx) continue
        
        await page.render({ canvasContext: ctx, viewport }).promise
        const imageData = canvas.toDataURL('image/png')
        page.cleanup()
        
        const result = addImage(pageNum, imageData, filePathRef.current)
        if (result.success) addedCount++
      } catch (err) {
        console.error(`Failed to capture page ${pageNum}:`, err)
      }
    }
    
    if (addedCount > 0) {
      setNotification({ open: true, message: `Added ${addedCount} pages to chat`, severity: 'success' })
    } else {
      setNotification({ open: true, message: 'Failed to add pages', severity: 'error' })
    }
  }, [pdfDoc, currentPage, totalPages, addImage])
  
  useEffect(() => {
    if (window.electronAPI?.onPageCaptureTrigger) {
      const unsubscribe = window.electronAPI.onPageCaptureTrigger(handleCaptureCurrentPage)
      return unsubscribe
    }
  }, [handleCaptureCurrentPage])
  
  useEffect(() => {
    if (window.electronAPI?.onPageCaptureMultiple) {
      const unsubscribe = window.electronAPI.onPageCaptureMultiple((count: number) => handleCaptureMultiplePages(count))
      return unsubscribe
    }
  }, [handleCaptureMultiplePages])
  
  useEffect(() => {
    if (window.electronAPI?.onGetMaxPages) {
      const unsubscribe = window.electronAPI.onGetMaxPages(() => {
        const remaining = useConversationImageStore.getState().maxLimit - useConversationImageStore.getState().images.length
        const available = Math.min(remaining, totalPages - currentPage + 1)
        window.electronAPI?.sendMaxPages(available)
      })
      return unsubscribe
    }
  }, [totalPages, currentPage])

  useEffect(() => {
    scaleRef.current = scale
  }, [scale])

  useEffect(() => {
    currentPageRef.current = currentPage
  }, [currentPage])

  useEffect(() => {
    const updateWidths = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.clientWidth - 40)
      }
      if (canvasRef.current) {
        setCanvasWidth(canvasRef.current.width)
      }
    }
    updateWidths()
    const observer = new ResizeObserver(updateWidths)
    if (containerRef.current) {
      observer.observe(containerRef.current)
    }
    return () => observer.disconnect()
  }, [pdfDoc])

  useEffect(() => {
    const handleContextMenu = async (e: MouseEvent) => {
      e.preventDefault()
      if (window.electronAPI?.showContextMenu) {
        await window.electronAPI.showContextMenu()
      }
    }

    const container = containerRef.current
    if (container) {
      container.addEventListener('contextmenu', handleContextMenu)
      return () => container.removeEventListener('contextmenu', handleContextMenu)
    }
  }, [pdfDoc, currentPage])

  const saveState = (filePath: string, page: number, scaleValue: number) => {
    const state: PDFState = { filePath, page, scale: scaleValue }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  }

  const loadSavedState = (): PDFState | null => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      return saved ? JSON.parse(saved) : null
    } catch {
      return null
    }
  }

  const loadPDF = async (filePathOrUrl: string, preservePage = false) => {
    try {
      setLoading(true)
      setError(null)
      
      let fileData: ArrayBuffer
      if (window.electronAPI?.readFile) {
        fileData = await window.electronAPI.readFile(filePathOrUrl)
      } else {
        // Browser: filePathOrUrl is actually a blob URL
        const response = await fetch(filePathOrUrl)
        fileData = await response.arrayBuffer()
      }
      
      const loadingTask = pdfjsLib.getDocument({ data: fileData })
      const pdf = await loadingTask.promise
      
      setPdfDoc(pdf)
      setTotalPages(pdf.numPages)
      setCurrentFilePath(filePathOrUrl)
      
      if (preservePage) {
        const saved = loadSavedState()
        const page = saved?.filePath === filePathOrUrl ? saved.page : 1
        const scaleValue = saved?.filePath === filePathOrUrl ? saved.scale : scale
        setCurrentPage(page)
        setPageInput(String(page))
        setScale(scaleValue)
        saveState(filePathOrUrl, page, scaleValue)
      } else {
        setCurrentPage(1)
        setPageInput('1')
        saveState(filePathOrUrl, 1, scale)
      }
    } catch (err) {
      setError('Failed to load PDF')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const saved = loadSavedState()
    if (saved?.filePath) {
      loadPDF(saved.filePath, true)
    }
  }, [])

  const handleOpenFile = async () => {
    try {
      if (window.electronAPI?.openFileDialog) {
        const result = await window.electronAPI.openFileDialog()
        if (!result.canceled && result.filePaths.length > 0) {
          await loadPDF(result.filePaths[0])
        }
      } else {
        const input = document.createElement('input')
        input.type = 'file'
        input.accept = '.pdf'
        input.onchange = async () => {
          const file = input.files?.[0]
          if (file) {
            const arrayBuffer = await file.arrayBuffer()
            // For browser, we need to use FileReader or pass ArrayBuffer directly
            loadPDF(URL.createObjectURL(new Blob([arrayBuffer], { type: 'application/pdf' })))
          }
        }
        input.click()
      }
    } catch (err) {
      setError('Failed to open file dialog')
    }
  }

  const renderPage = async (pageNum: number) => {
    if (!pdfDoc || !canvasRef.current) return

    try {
      if (renderTaskRef.current) {
        await renderTaskRef.current.cancel()
      }

      const page = await pdfDoc.getPage(pageNum)
      console.log('Rendering page', pageNum, 'with scale:', scaleRef.current)
      const viewport = page.getViewport({ scale: scaleRef.current * window.devicePixelRatio })
      
      const canvas = canvasRef.current
      const context = canvas.getContext('2d')
      if (!context) return

      canvas.height = viewport.height
      canvas.width = viewport.width

      const renderContext = {
        canvasContext: context,
        viewport: viewport
      }

      const task = page.render(renderContext)
      renderTaskRef.current = task
      await task.promise
    } catch (err: any) {
      if (err?.name !== 'RenderingCancelledException') {
        console.error('Failed to render page:', err)
      }
    }
  }

  useEffect(() => {
    if (pdfDoc && currentPage) {
      renderPage(currentPage)
    }
  }, [pdfDoc, currentPage, scale])

  const goToPrevPage = () => {
    if (currentPage > 1) {
      const newPage = currentPage - 1
      setCurrentPage(newPage)
      setPageInput(String(newPage))
      onPageChange?.(newPage)
      if (currentFilePath) {
        saveState(currentFilePath, newPage, scale)
      }
    }
  }

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      const newPage = currentPage + 1
      setCurrentPage(newPage)
      setPageInput(String(newPage))
      onPageChange?.(newPage)
      if (currentFilePath) {
        saveState(currentFilePath, newPage, scale)
      }
    }
  }

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement
      const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable
      if (isInput) return

      if (e.key === 'ArrowLeft' && currentPage > 1) {
        goToPrevPage()
      } else if (e.key === 'ArrowRight' && currentPage < totalPages) {
        goToNextPage()
      } else if (e.key === '+' || e.key === '=') {
        zoomIn()
      } else if (e.key === '-' || e.key === '_') {
        zoomOut()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [currentPage, totalPages, scale])

const handlePageInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPageInput(e.target.value)
  }

  const handlePageInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handlePageInputBlur()
    }
  }

  const handlePageInputBlur = () => {
    const page = parseInt(pageInput, 10)
    if (!isNaN(page) && page >= 1 && page <= totalPages) {
      setCurrentPage(page)
      onPageChange?.(page)
      if (currentFilePath) {
        saveState(currentFilePath, page, scale)
      }
    } else {
      setPageInput(String(currentPage))
    }
  }

  const zoomIn = () => {
    const newScale = Math.min(scale + 0.25, 4)
    setScale(newScale)
    if (currentFilePath) {
      saveState(currentFilePath, currentPage, newScale)
    }
    setTimeout(() => renderPage(currentPageRef.current), 0)
  }
  const zoomOut = () => {
    const newScale = Math.max(scale - 0.25, 0.5)
    setScale(newScale)
    if (currentFilePath) {
      saveState(currentFilePath, currentPage, newScale)
    }
    setTimeout(() => renderPage(currentPageRef.current), 0)
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          p: 1.5,
          borderBottom: 1,
          borderColor: 'divider',
          bgcolor: 'background.paper'
        }}
      >
        <Button
          variant="contained"
          startIcon={<FileOpenIcon />}
          onClick={handleOpenFile}
          size="small"
        >
          打开 PDF
        </Button>

        <Divider orientation="vertical" flexItem />

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <IconButton
            onClick={goToPrevPage}
            disabled={currentPage <= 1}
            size="small"
            title="上一页"
          >
            <ChevronLeftIcon />
          </IconButton>
          
          <TextField
            value={pageInput}
            onChange={handlePageInputChange}
            onBlur={handlePageInputBlur}
            onKeyDown={handlePageInputKeyDown}
            size="small"
            sx={{
              width: 60,
              '& input': {
                textAlign: 'center',
                py: 0.5
              }
            }}
          />
          <Typography variant="body2" sx={{ mx: 0.5 }}>
            / {totalPages}
          </Typography>
          
          <IconButton
            onClick={goToNextPage}
            disabled={currentPage >= totalPages}
            size="small"
            title="下一页"
          >
            <ChevronRightIcon />
          </IconButton>
        </Box>

        <Divider orientation="vertical" flexItem />

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <IconButton onClick={zoomOut} disabled={scale <= 0.5} size="small" title="缩小">
            <ZoomOutIcon />
          </IconButton>
          
          <Typography variant="body2" sx={{ minWidth: 50, textAlign: 'center' }}>
            {Math.round(scale * 100)}%
          </Typography>
          
          <IconButton onClick={zoomIn} disabled={scale >= 4} size="small" title="放大">
            <ZoomInIcon />
          </IconButton>
        </Box>
      </Box>

      <Box
        ref={containerRef}
        sx={{
          flex: 1,
          overflow: 'auto',
          p: 2.5,
          bgcolor: '#f5f5f5',
          minWidth: 'min-content'
        }}
      >
        {loading && (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
            <CircularProgress />
          </Box>
        )}
        
        {error && (
          <Typography color="error">{error}</Typography>
        )}
        
        {!pdfDoc && !loading && !error && (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 2 }}>
            <Typography variant="h6" color="text.secondary">
              暂无打开的 PDF
            </Typography>
            <Button variant="outlined" onClick={handleOpenFile}>
              选择文件
            </Button>
          </Box>
        )}
        
        <Box 
          sx={{ 
            display: 'flex',
            justifyContent: canvasWidth > containerWidth && containerWidth > 0 ? 'flex-start' : 'center'
          }}
        >
          <canvas ref={canvasRef} style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }} />
        </Box>
        
        <Snackbar
          open={notification.open}
          autoHideDuration={3000}
          onClose={() => setNotification((prev) => ({ ...prev, open: false }))}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert severity={notification.severity} onClose={() => setNotification((prev) => ({ ...prev, open: false }))}>
            {notification.message}
          </Alert>
        </Snackbar>
      </Box>
    </Box>
  )
}