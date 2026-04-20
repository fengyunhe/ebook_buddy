# IPC Contracts: Research Assistant

**Feature**: 006-research-assistant  
**Date**: 2026-04-20

---

## New IPC Handlers (main process)

### file:stat — Get file metadata for cache invalidation

**Direction**: Renderer → Main  
**Purpose**: Get file size and mtime for cache validity check

**Invoke**:
```typescript
ipcRenderer.invoke('file:stat', filePath: string)
```

**Payload (Main → Renderer)**:
```json
{
  "size": 12345678,
  "mtime": 1713580800000,
  "error": null
}
```

**Error cases**:
```json
{
  "size": 0,
  "mtime": 0,
  "error": "ENOENT: no such file or directory"
}
```

---

## Existing IPC Handlers (no changes)

| Handler | Direction | Purpose |
|---------|-----------|---------|
| `dialog:openFile` | Main → Renderer | File open dialog |
| `file:read` | Main → Renderer | Read file as ArrayBuffer |
| `api:fetch` | Renderer → Main | Server-side HTTP fetch |

No existing handlers need modification for this feature.
