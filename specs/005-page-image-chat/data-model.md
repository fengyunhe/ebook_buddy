# Data Model: Page Image Capture for AI Chat

## Entities

### PageImage
Represents a captured page image added to AI chat.

| Field | Type | Description |
|-------|------|-------------|
| id | string | Unique identifier (UUID) |
| pageNumber | number | Logical page number in ebook |
| imageData | string | Base64 data URL (image/png) |
| timestamp | number | Creation time (Unix ms) |
| bookId | string | Identifier of the ebook (for context) |

### ConversationImageList
Maintains the list of page images for the current AI conversation session.

| Field | Type | Description |
|-------|------|-------------|
| images | PageImage[] | Array of captured page images |
| maxLimit | number | Maximum allowed images (10) |
| addedPageNumbers | Set<number> | Set of already-added page numbers for O(1) lookup |

## Relationships

```
ConversationImageList 1 -- * PageImage
```

## Validation Rules

1. **Page number**: Must be positive integer
2. **Image data**: Must be valid base64 data URL (image/png format)
3. **Max limit**: Cannot exceed 10 images per conversation
4. **Duplicate**: Same page number cannot be added twice to same conversation

## State Transitions

```
Empty -> Adding First Image -> Images Added
        |
        v
   Max Limit Reached (10)
        |
        v
   New Conversation (reset)
```

## Integration with Existing Chat

The PageImage entity maps to the existing chat system's Message entity:
- When sending to chat, convert PageImage to Message with `type: 'image'` and `content: imageData`
- The existing ChatRequest format supports `image_url: { url: imageData }` in message content

## Types

```typescript
interface PageImage {
  id: string;
  pageNumber: number;
  imageData: string;  // base64 data URL
  timestamp: number;
  bookId: string;
}

interface ConversationImageState {
  images: PageImage[];
  maxLimit: number;
  addedPageNumbers: Set<number>;
}

interface AddImageResult {
  success: boolean;
  error?: 'duplicate' | 'limit_exceeded' | 'no_book_open' | 'capture_failed';
  message?: string;
}
```