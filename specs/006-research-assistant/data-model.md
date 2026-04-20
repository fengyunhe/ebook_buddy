# Data Model: Research Assistant — Knowledge Vault

**Feature**: 006-research-assistant  
**Date**: 2026-04-20

---

## Core Entities

### KnowledgeBlock

A unit of analyzed PDF content. Three types: text, figure, table.

```typescript
interface KnowledgeBlock {
  // Identity
  id: string                    // UUID, "kb_<pdfId>_<page>_<blockIndex>"
  pdfId: string                 // SHA-256 of file path (or file hash)
  pdfPath: string               // Original file path (for display)
  pageNumber: number            // 1-based page number
  
  // Content
  type: 'text' | 'figure' | 'table'
  text: string                  // OCR text / extracted text / table markdown
  caption?: string              // Figure caption (figure blocks only)
  description?: string          // AI-generated figure description (figure blocks only)
  
  // Metadata
  boundingBox?: BoundingBox     // { x, y, width, height } in page coords
  wordCount: number
  tokenEstimate: number         // Estimated token count
  
  // Vector data (populated after embedding)
  textVector?: number[]         // 768-dim text embedding
  imageVector?: number[]        // 512-dim image embedding (figure blocks only)
  
  // Status
  status: 'pending' | 'analyzed' | 'error'
  error?: string                // Error message if status === 'error'
}

interface BoundingBox {
  x: number
  y: number
  width: number
  height: number
}
```

### KnowledgeIndex

The searchable representation of all blocks for a single PDF. Each PDF has its own isolated index in Qdrant.

```typescript
interface KnowledgeIndex {
  pdfId: string
  pdfPath: string
  totalPages: number
  blockCount: number
  status: 'empty' | 'building' | 'complete' | 'error'
  progress: { current: number; total: number }
  createdAt: number
  updatedAt: number
}
```

### CachedAnalysis

IndexedDB cache entry. Prevents re-analysis of the same PDF.

```typescript
interface CachedAnalysis {
  pdfPath: string
  fileHash: string              // SHA-256 of file size + mtime
  fileMtime: number             // Last modified timestamp
  totalPages: number
  blocks: Omit<KnowledgeBlock, 'textVector' | 'imageVector'>[]
  createdAt: number
  updatedAt: number
}
```

### AnalysisProgress

Tracks the state of PDF analysis in real-time.

```typescript
interface AnalysisProgress {
  pdfId: string | null
  status: 'idle' | 'analyzing' | 'completed' | 'error' | 'cancelled'
  currentBlock: number
  totalBlocks: number
  estimatedRemainingMs: number | null
  errorMessage: string | null
  // Cancellation support
  cancelled: boolean
  cancelRequested: boolean
}
```

---

## Relationships

```
PDF Document (filePath)
  │
  ├──→ KnowledgeIndex (pdfId)
  │      │
  │      └──→ KnowledgeBlock[] (one per content unit)
  │             ├── text (type='text')
  │             ├── figure (type='figure')
  │             └── table (type='table')
  │
  └──→ CachedAnalysis (pdfPath key)
         └── blocks[] (without vectors)
```

**Key rules:**
- One `KnowledgeIndex` per unique `pdfId`
- `KnowledgeBlock` belongs to exactly one `KnowledgeIndex`
- `CachedAnalysis` key = `pdfPath` (not `pdfId`, for cache invalidation)
- Vectors (`textVector`, `imageVector`) stored in Qdrant, not in cache

---

## Qdrant Payload Schema

```json
{
  "pdf_id": "sha256_hash",
  "pdf_path": "/Users/.../file.pdf",
  "page_number": 10,
  "block_type": "text",
  "block_index": 3,
  "text": "extracted text content...",
  "caption": "Figure 3.1: ...",
  "word_count": 240
}
```

**Qdrant vector names:**
- `"text"`: 768-dim (all-MiniLM-L6-v2 or LLM API)
- `"image"`: 512-dim (CLIP, figure blocks only)

---

## IndexedDB Schema

```javascript
// Database: ebook-buddy-knowledge
// Object store: analyses
// Key path: pdfPath (string)

// Schema:
// {
//   pdfPath: string,      // key
//   fileHash: string,
//   fileMtime: number,
//   totalPages: number,
//   blocks: [...],
//   createdAt: number,
//   updatedAt: number
// }
```

---

## State Transitions

### KnowledgeBlock
```
pending → analyzed (success)
pending → error (failure)
error → pending (user retry)
```

### KnowledgeIndex
```
empty → building (analysis starts)
building → complete (all blocks analyzed)
building → error (fatal error)
building → building (resume after cancel)
```

### AnalysisProgress
```
idle → analyzing (PDF opened)
analyzing → completed (all blocks done)
analyzing → cancelled (user cancelled)
analyzing → error (fatal error)
cancelled → idle (user closes PDF)
completed → idle (user closes PDF)
```
