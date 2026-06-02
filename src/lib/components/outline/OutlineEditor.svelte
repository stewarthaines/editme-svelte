<script lang="ts">
  import { onDestroy } from 'svelte';
  import type { TextEditorStore } from '../../stores/index.js';
  import './outline-editor.css';

  // Props interface matching API specification
  let {
    editorStore,
    placeholder = 'Navigation content will be auto-generated from your chapters...',
    onContentChanged,
  }: {
    editorStore: TextEditorStore;
    placeholder?: string;
    onContentChanged?: (detail: { editorId: string; timestamp: number; isEmpty: boolean }) => void;
  } = $props();

  // Debouncing timer for content updates
  let debounceTimer: ReturnType<typeof setTimeout>;

  // Subscribe to store for textarea synchronization
  const currentContent = $derived($editorStore.content);

  function handleTextareaInput(event: Event) {
    const target = event.target as HTMLTextAreaElement;

    // Clear existing timer
    clearTimeout(debounceTimer);

    // Debounce content updates (300ms per API specification)
    debounceTimer = setTimeout(() => {
      editorStore.updateContent(target.value);

      // Emit lightweight event without content duplication
      onContentChanged?.({
        editorId: 'outline-nav',
        timestamp: Date.now(),
        isEmpty: target.value.trim() === '',
      });
    }, 300);
  }

  // Cleanup timer on component destroy
  onDestroy(() => {
    clearTimeout(debounceTimer);
  });
</script>

<div class="outline-editor">
  <textarea
    class="outline-editor__textarea"
    value={currentContent}
    {placeholder}
    oninput={handleTextareaInput}
    aria-label="Navigation content editor"
    aria-describedby="editor-help"
    spellcheck="false"
    aria-multiline="true"
  ></textarea>

  <!-- Hidden help text for screen readers -->
  <div id="editor-help" class="sr-only">
    Enter navigation content in plain text. Leave empty to auto-generate from chapter titles. Press
    Ctrl+Enter (Cmd+Enter on Mac) to save navigation content.
  </div>
</div>
