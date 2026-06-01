<script lang="ts">
  import { onMount } from 'svelte';
  import { t } from '../../i18n';
  import ManifestTable from './ManifestTable.svelte';
  import ManifestItemEditor from './ManifestItemEditor.svelte';
  import { ManifestUtils } from '../../manifest/utils.js';
  import { generateEPUBPath } from '../../epub/opf-utils.js';
  import type { ManifestItem, SourceItem, ValidationResult } from '../../manifest/types';
  import type { WorkspaceService, WorkspaceState } from '../../services/workspace/workspace.service.js';

  // Props using Svelte 5 runes syntax
  let {
    workspace = null,
    workspaceService,
    advancedMode = true,
    onItemSelect,
    onWorkspaceUpdate,
  }: {
    workspace?: WorkspaceState | null;
    workspaceService: WorkspaceService;
    advancedMode?: boolean;
    onItemSelect?: (event: { item: ManifestItem | SourceItem | any; type: 'manifest' | 'source' | 'opf' }) => void;
    onWorkspaceUpdate?: (workspace: WorkspaceState) => void;
  } = $props();

  // Component state using runes
  let manifestItems = $state<ManifestItem[]>([]);
  let sourceItems = $state<SourceItem[]>([]);
  let selectedItem = $state<ManifestItem | SourceItem | any | null>(null);
  let selectedItemType = $state<'manifest' | 'source' | 'opf' | null>(null);
  let validationErrors = $state<ValidationResult[]>([]);
  let loading = $state(true);
  let error = $state<string | null>(null);
  let showItemEditor = $state(false);
  let itemEditorMode = $state<'create-text' | 'create-file' | 'edit'>('create-text');

  const loadManifest = async () => {
    if (!workspace) return;

    try {
      loading = true;
      error = null;

      // Load manifest items directly from workspace state
      const baseManifestItems = workspace.opf.manifest;

      // Populate file sizes for manifest items
      const manifestItemsWithSizes = await Promise.all(
        baseManifestItems.map(async (item) => {
          try {
            // Resolve manifest item href to full workspace path
            const resolvedPath = workspace!.pathInfo.basePath 
              ? `${workspace!.pathInfo.basePath}/${item.href}`
              : item.href;
            
            // Get file info using workspace service method
            const fileInfo = await workspaceService.getFileInfo(workspace!.id, resolvedPath);
            
            return {
              ...item,
              size: fileInfo.size
            };
          } catch {
            // If file doesn't exist or can't be accessed, keep item without size
            return item;
          }
        })
      );

      manifestItems = manifestItemsWithSizes;

      // Load SOURCE items if advanced mode is enabled
      if (advancedMode) {
        try {
          sourceItems = await workspaceService.listSourceFiles(workspace);
        } catch (error) {
          console.warn('Failed to load SOURCE items:', error);
          sourceItems = [];
        }
      } else {
        sourceItems = [];
      }

      // Skip validation for now - not essential for basic functionality
      validationErrors = [];
    } catch {
      error = $t('Failed to load manifest');
    } finally {
      loading = false;
    }
  };

  const handleItemSelection = (event: {
    detail: { item: ManifestItem | SourceItem; type: 'manifest' | 'source' };
  }) => {
    selectedItem = event.detail.item;
    selectedItemType = event.detail.type;

    // Call the callback function to notify parent component
    onItemSelect?.({
      item: event.detail.item,
      type: event.detail.type,
    });
  };

  const handleItemCreate = (event: { detail: { mode: 'create-text' | 'create-file' } }) => {
    itemEditorMode = event.detail.mode;
    showItemEditor = true;
  };

  const handleItemEdit = (event: { detail: { item: ManifestItem } }) => {
    selectedItem = event.detail.item;
    selectedItemType = 'manifest';
    itemEditorMode = 'edit';
    showItemEditor = true;
  };

  const handleItemDelete = async (event: { detail: { itemId: string } }) => {
    if (!workspace) return;

    const confirmed = confirm($t('Are you sure you want to delete this item?'));
    if (!confirmed) return;

    try {
      workspace = await workspaceService.removeManifestItem(workspace, event.detail.itemId);
      // Keep global app state in sync with the persisted content.opf.
      onWorkspaceUpdate?.(workspace);
      await loadManifest(); // Refresh the manifest

      // Clear selection if deleted item was selected
      if (selectedItem && 'id' in selectedItem && selectedItem.id === event.detail.itemId) {
        selectedItem = null;
        selectedItemType = null;
      }
    } catch {
      error = $t('Failed to delete item');
    }
  };

  const handleItemSave = async (event: { detail: { item: ManifestItem } }) => {
    if (!workspace) return;

    try {
      const { item } = event.detail;

      if (itemEditorMode === 'edit' && selectedItem && 'id' in selectedItem) {
        workspace = await workspaceService.updateManifestItem(workspace, selectedItem.id, item);
      } else {
        // Create new item based on mode
        if (itemEditorMode === 'create-text') {
          // Add manifest item first (persists content.opf)
          workspace = await workspaceService.addManifestItem(workspace, item);
          const addedItemId = workspace.opf.manifest[workspace.opf.manifest.length - 1].id;

          // Write the file content; roll back the manifest entry if it fails
          // so content.opf never references a file that isn't in storage.
          const filePath = item.href.startsWith(workspace.pathInfo.basePath + '/') ?
            item.href :
            `${workspace.pathInfo.basePath}/${item.href}`;
          try {
            await workspaceService.writeFile(workspace.id, filePath, '');
          } catch (writeError) {
            workspace = await workspaceService.removeManifestItem(workspace, addedItemId);
            throw writeError;
          }
        }
      }

      showItemEditor = false;
      // Keep global app state in sync with the persisted content.opf.
      onWorkspaceUpdate?.(workspace);
      await loadManifest(); // Refresh the manifest
    } catch {
      error = $t('Failed to save item');
    }
  };

  const handleFileUpload = async (event: { detail: { files: File[] } }) => {
    if (!workspace) return;

    const files = event.detail.files;
    const successfulFiles: string[] = [];
    const failedFiles: { name: string; error: string }[] = [];

    for (const file of files) {
      try {
        // Create manifest item with reliable media type detection
        const browserType = file.type;
        const filenameType = ManifestUtils.detectMediaType(file.name);
        
        // For font files and JavaScript files, always use filename detection (browsers are unreliable)
        // For other files, prefer browser detection unless it's generic
        const isGeneric = !browserType || browserType === 'application/octet-stream';
        const isFontFile = filenameType.startsWith('font/');
        const isJavaScriptFile = filenameType === 'application/javascript' || filenameType === 'text/javascript';
        const reliableMediaType = (isGeneric || isFontFile || isJavaScriptFile) ? filenameType : browserType;
        
        const manifestItem = {
          href: generateEPUBPath(file.name, reliableMediaType),
          mediaType: reliableMediaType
        };

        // Step 1: Add to manifest (may fail on duplicate ID). This persists content.opf.
        workspace = await workspaceService.addManifestItem(workspace, manifestItem);
        // addManifestItem appends the new entry, so it is the last one.
        const addedItemId = workspace.opf.manifest[workspace.opf.manifest.length - 1].id;

        // Step 2: Write the file content. If this fails, roll back the manifest
        // entry so content.opf never references a file that isn't in storage.
        const filePath = `${workspace.pathInfo.basePath}/${manifestItem.href}`;
        try {
          if (file.type.startsWith('text/') || file.type.includes('json') || file.type.includes('xml')) {
            const text = await file.text();
            await workspaceService.writeFile(workspace.id, filePath, text);
          } else {
            // Handle binary files (images, fonts, etc.)
            const arrayBuffer = await file.arrayBuffer();
            await workspaceService.writeBinaryFile(workspace.id, filePath, arrayBuffer);
          }
        } catch (writeError) {
          // Undo the manifest entry we just added (also removes the absent file).
          workspace = await workspaceService.removeManifestItem(workspace, addedItemId);
          throw writeError;
        }

        // Both operations succeeded
        successfulFiles.push(file.name);
      } catch (fileError) {
        // Log specific file upload failure
        console.warn(`Failed to upload ${file.name}:`, fileError);
        failedFiles.push({
          name: file.name,
          error: fileError instanceof Error ? fileError.message : 'Unknown error'
        });
      }
    }

    // Push the persisted workspace back to global app state so a later save
    // can't overwrite content.opf with a stale copy that lacks these items.
    if (successfulFiles.length > 0) {
      onWorkspaceUpdate?.(workspace);
    }

    // Refresh the manifest to show successfully uploaded files
    await loadManifest();

    // Provide user feedback about upload results
    if (failedFiles.length === 0) {
      // All files succeeded
      console.log(`Successfully uploaded ${successfulFiles.length} files:`, successfulFiles);
    } else if (successfulFiles.length === 0) {
      // All files failed
      error = $t('Failed to upload all files');
      console.error('Upload failures:', failedFiles);
    } else {
      // Partial success
      console.log(`Uploaded ${successfulFiles.length} files successfully:`, successfulFiles);
      console.warn(`Failed to upload ${failedFiles.length} files:`, failedFiles);
      error = $t('Some files failed to upload - see console for details');
    }
  };

  const handleEditorClose = () => {
    showItemEditor = false;
  };

  // Load manifest when component mounts or dependencies change
  onMount(loadManifest);

  // React to workspace changes (e.g., after delete/add operations)
  $effect(() => {
    if (workspace) {
      loadManifest();
    }
  });

  // React to advancedMode changes
  $effect(() => {
    if (!workspace) return;

    // When advancedMode changes, reload source items
    if (advancedMode) {
      // Load SOURCE items if advanced mode is enabled
      workspaceService.listSourceFiles(workspace)
        .then(items => {
          sourceItems = items;
        })
        .catch(error => {
          console.warn('Failed to load SOURCE items:', error);
          sourceItems = [];
        });
    } else {
      // Clear SOURCE items if advanced mode is disabled
      sourceItems = [];
    }
  });
  
  // React to workspace changes
  $effect(() => {
    if (workspace) {
      loadManifest();
    }
  });
</script>

{#if loading}
  <div class="loading-state">
    <p>{$t('Loading manifest…')}</p>
  </div>
{:else if error}
  <div class="error-state">
    <p class="error-message">{error}</p>
    <button type="button" class="retry-button" onclick={loadManifest}>
      {$t('Retry')}
    </button>
  </div>
{:else}
  <ManifestTable
    {manifestItems}
    {sourceItems}
    {advancedMode}
    {validationErrors}
    {selectedItem}
    {selectedItemType}
    on:itemSelect={handleItemSelection}
    on:itemCreate={handleItemCreate}
    on:itemEdit={handleItemEdit}
    on:itemDelete={handleItemDelete}
    on:fileUpload={handleFileUpload}
  />
{/if}

{#if showItemEditor}
  <ManifestItemEditor
    {itemEditorMode}
    item={itemEditorMode === 'edit' ? selectedItem : null}
    {validationErrors}
    on:save={handleItemSave}
    on:close={handleEditorClose}
  />
{/if}

<style>
  .loading-state,
  .error-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    padding: 2rem;
    text-align: center;
  }

  .error-message {
    color: var(--color-error);
    margin-block-end: 1rem;
  }

  .retry-button {
    padding: 0.75rem 1.5rem;
    border: 1px solid var(--color-primary);
    border-radius: var(--radius-sm);
    background-color: var(--color-primary);
    color: var(--color-surface);
    font-size: 0.875rem;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .retry-button:hover {
    background-color: var(--color-interactive-primary-hover);
    border-color: var(--color-interactive-primary-hover);
  }

  .retry-button:focus {
    outline: none;
    box-shadow: 0 0 0 2px var(--color-focus-ring);
  }
</style>
