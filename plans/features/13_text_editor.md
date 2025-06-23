# 13. Text Editor

## Overview
Provides a textarea-based editor for plain text sources with debounced preview updates, auto-save functionality, and association with XHTML spine items.

## Requirements
- Textarea in iframe for plain text editing
- Debounced change event handling
- Auto-save functionality
- Association with corresponding XHTML spine item

## Dependencies
- **#12 Transform Pipeline** - for converting text to preview

## Technical Approach
- Iframe-based editor for security isolation
- Debounced change events to optimize performance
- Auto-save with conflict resolution
- Real-time preview updates via transform pipeline

## API Design
```typescript
interface TextEditor {
  // Editor management
  loadEditor(spineItemId: string, sourceFilePath: string): Promise<void>
  saveContent(): Promise<void>
  getContent(): string
  setContent(content: string): void
  
  // Auto-save
  enableAutoSave(interval?: number): void
  disableAutoSave(): void
  getAutoSaveStatus(): AutoSaveStatus
  
  // Change tracking
  hasUnsavedChanges(): boolean
  getChangeCount(): number
  markSaved(): void
  
  // Editor state
  focus(): void
  blur(): void
  setReadOnly(readOnly: boolean): void
  
  // Events
  onContentChange(callback: (content: string) => void): () => void
  onSave(callback: (success: boolean) => void): () => void
}

interface AutoSaveStatus {
  enabled: boolean
  interval: number
  lastSaved: Date | null
  isProcessing: boolean
  error?: string
}

interface EditorState {
  content: string
  cursorPosition: number
  scrollPosition: number
  hasChanges: boolean
  isLoading: boolean
}
```

## Editor Component Structure
```svelte
<script>
  import { onMount, onDestroy } from 'svelte'
  import { createEventDispatcher } from 'svelte'
  
  const dispatch = createEventDispatcher()
  
  export let spineItemId = ''
  export let sourceFilePath = ''
  export let readOnly = false
  export let autoSaveInterval = 2000
  
  let editorFrame
  let content = ''
  let hasUnsavedChanges = false
  let autoSaveEnabled = true
  let isLoading = true
  let saveTimeout
  let lastSaved = null
</script>

<div class="text-editor-container">
  <div class="editor-toolbar">
    <div class="editor-info">
      <span class="file-path">{sourceFilePath}</span>
      {#if hasUnsavedChanges}
        <span class="unsaved-indicator">●</span>
      {/if}
    </div>
    
    <div class="editor-actions">
      <button on:click={saveContent} disabled={!hasUnsavedChanges || readOnly}>
        Save
      </button>
      <button on:click={toggleAutoSave}>
        Auto-save: {autoSaveEnabled ? 'On' : 'Off'}
      </button>
      {#if lastSaved}
        <span class="last-saved">Saved {formatTime(lastSaved)}</span>
      {/if}
    </div>
  </div>
  
  <div class="editor-content">
    <iframe
      bind:this={editorFrame}
      src="about:blank"
      class="editor-iframe"
      title="Text Editor"
      on:load={initializeEditor}
    ></iframe>
  </div>
  
  <div class="editor-status">
    <span class="word-count">{getWordCount(content)} words</span>
    <span class="char-count">{content.length} characters</span>
  </div>
</div>
```

## Iframe Editor Implementation
```typescript
const initializeEditor = () => {
  const iframeDoc = editorFrame.contentDocument
  
  iframeDoc.open()
  iframeDoc.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body {
          margin: 0;
          padding: 16px;
          font-family: 'Monaco', 'Consolas', monospace;
          font-size: 14px;
          line-height: 1.5;
          background: var(--bg-primary);
          color: var(--text-primary);
        }
        
        #editor {
          width: 100%;
          height: calc(100vh - 32px);
          border: none;
          outline: none;
          resize: none;
          background: transparent;
          color: inherit;
          font-family: inherit;
          font-size: inherit;
          line-height: inherit;
        }
        
        #editor:focus {
          background: var(--bg-secondary);
        }
      </style>
    </head>
    <body>
      <textarea id="editor" placeholder="Start writing..."></textarea>
      
      <script>
        const editor = document.getElementById('editor')
        let debounceTimeout
        
        // Handle content changes with debouncing
        editor.addEventListener('input', (e) => {
          clearTimeout(debounceTimeout)
          debounceTimeout = setTimeout(() => {
            window.parent.postMessage({
              type: 'content-change',
              content: editor.value
            }, '*')
          }, 300)
        })
        
        // Handle cursor position changes
        editor.addEventListener('selectionchange', (e) => {
          window.parent.postMessage({
            type: 'selection-change',
            start: editor.selectionStart,
            end: editor.selectionEnd
          }, '*')
        })
        
        // Handle keyboard shortcuts
        editor.addEventListener('keydown', (e) => {
          if ((e.ctrlKey || e.metaKey) && e.key === 's') {
            e.preventDefault()
            window.parent.postMessage({
              type: 'save-request'
            }, '*')
          }
        })
        
        // Expose editor API to parent
        window.setContent = (content) => {
          editor.value = content
        }
        
        window.getContent = () => {
          return editor.value
        }
        
        window.focus = () => {
          editor.focus()
        }
        
        window.setReadOnly = (readOnly) => {
          editor.readOnly = readOnly
        }
      </script>
    </body>
    </html>
  `)
  iframeDoc.close()
  
  // Set up message handling
  window.addEventListener('message', handleEditorMessage)
  
  // Load initial content
  loadInitialContent()
}
```

## Debounced Change Handling
```typescript
let changeTimeout: number
let previewTimeout: number

const handleContentChange = (newContent: string) => {
  content = newContent
  hasUnsavedChanges = true
  
  // Debounced auto-save
  if (autoSaveEnabled) {
    clearTimeout(changeTimeout)
    changeTimeout = setTimeout(() => {
      saveContent()
    }, autoSaveInterval)
  }
  
  // Debounced preview update
  clearTimeout(previewTimeout)
  previewTimeout = setTimeout(() => {
    updatePreview(newContent)
  }, 500)
  
  dispatch('content-change', { content: newContent })
}
```

## Auto-Save Implementation
```typescript
const saveContent = async (): Promise<boolean> => {
  if (!hasUnsavedChanges || readOnly) return true
  
  try {
    // Save to file storage
    await fileStorage.writeFile(
      currentWorkspaceId,
      sourceFilePath,
      content
    )
    
    // Update modification timestamp
    lastSaved = new Date()
    hasUnsavedChanges = false
    
    dispatch('save', { success: true, timestamp: lastSaved })
    return true
    
  } catch (error) {
    console.error('Failed to save content:', error)
    dispatch('save', { success: false, error: error.message })
    return false
  }
}

const enableAutoSave = (interval = 2000) => {
  autoSaveInterval = interval
  autoSaveEnabled = true
}

const disableAutoSave = () => {
  autoSaveEnabled = false
  clearTimeout(changeTimeout)
}
```

## Preview Integration
```typescript
const updatePreview = async (content: string) => {
  try {
    const transformResult = await transformPipeline.transformText(
      content,
      currentWorkspaceId,
      spineItemId
    )
    
    if (transformResult.success) {
      dispatch('preview-update', {
        xhtml: transformResult.xhtmlDocument,
        content: transformResult.transformedText
      })
    } else {
      dispatch('preview-error', {
        error: transformResult.error
      })
    }
    
  } catch (error) {
    dispatch('preview-error', {
      error: { message: error.message, stage: 'text' }
    })
  }
}
```

## Editor State Management
```svelte
<script>
  import { writable } from 'svelte/store'
  
  interface EditorState {
    content: string
    hasChanges: boolean
    cursorPosition: { start: number, end: number }
    scrollPosition: number
    isLoading: boolean
    lastSaved: Date | null
  }
  
  const createEditorStore = () => {
    const { subscribe, set, update } = writable<EditorState>({
      content: '',
      hasChanges: false,
      cursorPosition: { start: 0, end: 0 },
      scrollPosition: 0,
      isLoading: true,
      lastSaved: null
    })
    
    return {
      subscribe,
      setContent: (content: string) => update(state => ({ 
        ...state, 
        content, 
        hasChanges: content !== state.content 
      })),
      markSaved: () => update(state => ({ 
        ...state, 
        hasChanges: false, 
        lastSaved: new Date() 
      })),
      setCursorPosition: (start: number, end: number) => update(state => ({
        ...state,
        cursorPosition: { start, end }
      }))
    }
  }
  
  export const editorStore = createEditorStore()
</script>
```

## Conflict Resolution
```typescript
const handleSaveConflict = async (
  localContent: string,
  remoteContent: string
): Promise<'local' | 'remote' | 'merge'> => {
  
  // Show conflict resolution dialog
  const choice = await showConflictDialog({
    local: localContent,
    remote: remoteContent,
    lastSaved: lastSaved
  })
  
  switch (choice) {
    case 'keep-local':
      return 'local'
    case 'use-remote':
      setContent(remoteContent)
      return 'remote'
    case 'merge':
      const merged = await showMergeDialog(localContent, remoteContent)
      setContent(merged)
      return 'merge'
  }
}
```

## Keyboard Shortcuts
```typescript
const KEYBOARD_SHORTCUTS = {
  'Ctrl+S': () => saveContent(),
  'Ctrl+Z': () => undo(),
  'Ctrl+Y': () => redo(),
  'Ctrl+F': () => showFindDialog(),
  'Ctrl+H': () => showReplaceDialog(),
  'F11': () => toggleFullscreen()
}

const handleKeyboardShortcut = (event: KeyboardEvent) => {
  const key = `${event.ctrlKey ? 'Ctrl+' : ''}${event.key}`
  const handler = KEYBOARD_SHORTCUTS[key]
  
  if (handler) {
    event.preventDefault()
    handler()
  }
}
```

## Error Handling
- File loading failures
- Save operation errors
- Preview generation failures
- Network connectivity issues
- Storage quota exceeded
- Invalid content encoding

## Testing Considerations
- Test auto-save functionality
- Test debounced change handling
- Test keyboard shortcuts
- Test conflict resolution
- Test iframe security isolation
- Test with large documents
- Test performance under heavy editing

## Implementation Notes
- Implement iframe security carefully
- Test auto-save with various intervals
- Handle browser refresh/close gracefully
- Consider offline editing capabilities
- Test accessibility features thoroughly