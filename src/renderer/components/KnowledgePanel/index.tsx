import React, { useState, useMemo } from 'react'
import { useKnowledgeStore } from '../../stores/knowledgeStore'
import { searchPdfContent } from '../../services/chatService'
import type { KnowledgeBlock } from '../../../shared/types/knowledge'
import {
  Box,
  Typography,
  Tabs,
  Tab,
  TextField,
  IconButton,
  Card,
  CardContent,
  Chip,
  InputAdornment,
  List,
  ListItem,
  ListItemText,
  Collapse,
  Button,
  LinearProgress
} from '@mui/material'
import {
  TextFields as TextIcon,
  Image as ImageIcon,
  TableChart as TableIcon,
  Search as SearchIcon,
  Close as CloseIcon,
  Download as DownloadIcon,
  Delete as DeleteIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  ChevronRight as ChevronRightIcon
} from '@mui/icons-material'

interface TabPanelProps {
  children?: React.ReactNode
  index: number
  value: number
}

function TabPanel({ children, value, index }: TabPanelProps) {
  return (
    <div hidden={value !== index} style={{ height: '100%', overflow: 'auto' }}>
      {value === index && <Box sx={{ p: 2, height: '100%' }}>{children}</Box>}
    </div>
  )
}

const BlockTypeIcon = ({ type }: { type: KnowledgeBlock['type'] }) => {
  switch (type) {
    case 'figure':
      return <ImageIcon fontSize="small" sx={{ color: 'primary.main' }} />
    case 'table':
      return <TableIcon fontSize="small" sx={{ color: 'secondary.main' }} />
    default:
      return <TextIcon fontSize="small" sx={{ color: 'text.secondary' }} />
  }
}

interface BlockCardProps {
  block: KnowledgeBlock
  onNavigate: (page: number) => void
}

function BlockCard({ block, onNavigate }: BlockCardProps) {
  const [expanded, setExpanded] = useState(false)

  const preview = block.text.slice(0, 300) + (block.text.length > 300 ? '...' : '')
  const wordCount = block.text.split(/\s+/).filter(Boolean).length

  return (
    <Card
      variant="outlined"
      sx={{ mb: 1, cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' } }}
      onClick={() => onNavigate(block.pageNumber)}
    >
      <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
          <BlockTypeIcon type={block.type} />
          <Typography variant="caption" color="text.secondary">
            Page {block.pageNumber}
          </Typography>
          <Chip label={block.type} size="small" sx={{ height: 20, fontSize: 10 }} />
          <Typography variant="caption" color="text.disabled">
            {wordCount} words
          </Typography>
        </Box>
        <Typography variant="body2" sx={{
          display: '-webkit-box',
          WebkitLineClamp: expanded ? undefined : 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden'
        }}>
          {preview}
        </Typography>
        {block.text.length > 150 && (
          <Button
            size="small"
            onClick={(e) => { e.stopPropagation(); setExpanded(!expanded) }}
            sx={{ mt: 0.5, p: 0, minHeight: 20 }}
          >
            {expanded ? 'Show less' : 'Show more'}
          </Button>
        )}
      </CardContent>
    </Card>
  )
}

interface KnowledgePanelProps {
  onClose?: () => void
}

export function KnowledgePanel({ onClose }: KnowledgePanelProps) {
  const [tab, setTab] = useState(0)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<KnowledgeBlock[]>([])
  const [searching, setSearching] = useState(false)
  const [searchPerformed, setSearchPerformed] = useState(false)

  const currentPdf = useKnowledgeStore((state) => state.currentPdfId)
  const blocks = useKnowledgeStore((state) => state.blocks)
  const analysisProgress = useKnowledgeStore((state) => state.analysisProgress)
  const analysisStatus = analysisProgress.status
  const currentPage = useKnowledgeStore((state) => state.currentPage)
  const goToPage = useKnowledgeStore((state) => state.goToPage)

  const blocksByPage = useMemo(() => {
    const grouped: Record<number, KnowledgeBlock[]> = {}
    for (const block of blocks) {
      if (!grouped[block.pageNumber]) {
        grouped[block.pageNumber] = []
      }
      grouped[block.pageNumber].push(block)
    }
    return grouped
  }, [blocks])

  const pageNumbers = Object.keys(blocksByPage).map(Number).sort((a, b) => a - b)

  const handleSearch = async () => {
    if (!currentPdf || !searchQuery.trim()) return

    setSearching(true)
    setSearchPerformed(true)

    try {
      const results = await searchPdfContent(currentPdf, searchQuery, { topK: 20 })
      setSearchResults(results)
    } catch (err) {
      console.error('Search failed:', err)
    } finally {
      setSearching(false)
    }
  }

  const handleNavigate = (page: number) => {
    goToPage(page)
  }

  const handleExport = () => {
    const content = blocks
      .map(b => `# Page ${b.pageNumber} (${b.type})\n\n${b.text}\n`)
      .join('\n---\n\n')

    const blob = new Blob([content], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'knowledge-export.md'
    a.click()
    URL.revokeObjectURL(url)
  }

  if (!currentPdf) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography color="text.secondary">
          No PDF loaded
        </Typography>
      </Box>
    )
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Box sx={{ borderBottom: 1, borderColor: 'divider', display: 'flex', alignItems: 'center' }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ flex: 1 }}>
          <Tab label="Knowledge" />
          <Tab label="Search" />
        </Tabs>
        {onClose && (
          <IconButton size="small" onClick={onClose}>
            <CloseIcon />
          </IconButton>
        )}
      </Box>

      <TabPanel value={tab} index={0}>
        {analysisStatus === 'analyzing' ? (
          <Box sx={{ p: 3 }}>
            <Typography color="text.secondary" sx={{ mb: 2 }}>
              Analyzing PDF...
            </Typography>
            <LinearProgress
              variant="determinate"
              value={Math.min(100, Math.round((analysisProgress.currentBlock / analysisProgress.totalBlocks) * 100) || 0)}
              sx={{ mb: 1, borderRadius: 1, height: 6 }}
            />
            <Typography variant="caption" color="text.secondary">
              {Math.round((analysisProgress.currentBlock / analysisProgress.totalBlocks) * 100)}% complete
            </Typography>
          </Box>
        ) : (
          <>
            <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
              <Button size="small" startIcon={<DownloadIcon />} onClick={handleExport}>
                Export
              </Button>
            </Box>
            <Box sx={{ flex: 1, overflow: 'auto' }}>
              {pageNumbers.map(pageNum => (
                <Box key={pageNum} sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <ChevronRightIcon fontSize="small" />
                    Page {pageNum}
                    <Typography variant="caption" color="text.disabled">
                      ({blocksByPage[pageNum].length} blocks)
                    </Typography>
                  </Typography>
                  {blocksByPage[pageNum].map(block => (
                    <BlockCard key={block.id} block={block} onNavigate={handleNavigate} />
                  ))}
                </Box>
              ))}
            </Box>
          </>
        )}
      </TabPanel>

      <TabPanel value={tab} index={1}>
        <Box sx={{ display: 'flex', mb: 2 }}>
          <TextField
            fullWidth
            size="small"
            placeholder="Search PDF content..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            slotProps={{
              input: {
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={handleSearch}>
                      <SearchIcon />
                    </IconButton>
                  </InputAdornment>
                )
              }
            }}
          />
        </Box>
        <Box sx={{ flex: 1, overflow: 'auto' }}>
          {searching ? (
            <Typography color="text.secondary">Searching...</Typography>
          ) : searchPerformed && searchResults.length === 0 ? (
            <Typography color="text.secondary">No results found</Typography>
          ) : (
            searchResults.map(block => (
              <BlockCard key={block.id} block={block} onNavigate={handleNavigate} />
            ))
          )}
        </Box>
      </TabPanel>
    </Box>
  )
}
