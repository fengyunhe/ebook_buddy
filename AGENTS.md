# ebook-buddy Development Guidelines

Auto-generated from all feature plans. Last updated: 2026-04-16

## Active Technologies
- N/A (使用已有配置存储endpoint) (003-ai-chat-voice-image)
- TypeScript 5.3 + Electron 28, React 18, Zustand, @mui/material, electron-store (004-ai-settings-api-key)
- Electron safeStorage (加密) + 浏览器localStorage (fallback) (004-ai-settings-api-key)
- TypeScript 5.3 + Electron 28, React 18, Zustand, PDF.js (pdfjs-dist) (005-page-image-chat)
- In-memory state with Zustand (session-based) (005-page-image-chat)

- TypeScript 5.3 + Electron 28, React 18, Zustand (002-alt-voice-input)

- TypeScript 5.3 + Electron 28, React 18, Zustand, pdfjs-dist, tesseract.js, qdrant-client, idb, @xenova/transformers (006-research-assistant)
- IndexedDB (缓存), Qdrant (向量索引), OCR (Tesseract.js / Umi-OCR) (006-research-assistant)

## Project Structure

```text
src/
tests/
```

## Commands

npm test && npm run lint

## Code Style

TypeScript 5.3: Follow standard conventions

## Recent Changes
- 006-research-assistant: Added PDF auto-analysis engine, OCR (Tesseract.js/Umi-OCR), embedding service, Qdrant integration, knowledge store, analysis progress indicator
- 005-page-image-chat: Added TypeScript 5.3 + Electron 28, React 18, Zustand, PDF.js (pdfjs-dist)
- 004-ai-settings-api-key: Added TypeScript 5.3 + Electron 28, React 18, Zustand, @mui/material, electron-store
- 003-ai-chat-voice-image: Added TypeScript 5.3 + Electron 28, React 18, Zustand


<!-- MANUAL ADDITIONS START -->
<!-- MANUAL ADDITIONS END -->
