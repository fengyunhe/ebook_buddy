# Quickstart: Page Image Capture for AI Chat

## Overview

This feature allows ebook readers to right-click on the current page to capture it as an image and add it to the AI chat's image input. Users can add multiple pages (up to 10) to a single conversation, with duplicate page numbers automatically prevented.

## Prerequisites

- Electron 28 + React 18 + TypeScript 5.3 environment
- Existing AI chat feature (003-ai-chat-voice-image) is functional
- PDF.js (pdfjs-dist) integrated for PDF rendering

## Usage

### Adding a Page Image

1. Open any ebook in the reader
2. Right-click on the current page
3. Select "Add to AI Chat" from the context menu
4. The page is captured and added to the AI chat image input

### Multiple Pages

Add up to 10 different page images to a single conversation:
- Navigate to different pages
- Right-click to add each page
- All images appear in the chat's image list

### Error Handling

- **Duplicate page**: "Page X has already been added" message
- **Limit reached**: "Maximum 10 images per conversation" message
- **No book open**: "Please open a book first" message

## Integration

The captured images integrate with the existing AI chat system:
- Images are sent as base64 data URLs
- Follows the existing `image_url: { url: string }` format in chat messages

## Testing

```bash
pnpm run test
pnpm run typecheck
```

## Configuration

No additional configuration required. Uses existing AI endpoint settings.