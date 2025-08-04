<script lang="ts">
  import { onMount } from 'svelte';
  import LayoutManager from './lib/LayoutManager.svelte';
  import { navigationStore } from './lib/navigation';
  import WorkspaceView from './lib/navigation/views/WorkspaceView.svelte';
  import MetadataEditor from './lib/components/metadata/MetadataEditor.svelte';
  import PlaceholderView from './lib/navigation/views/PlaceholderView.svelte';
  import SpineView from './lib/navigation/views/SpineView.svelte';
  import SpineSidebar from './lib/components/SpineSidebar.svelte';
  import ManifestContainer from './lib/components/manifest/ManifestContainer.svelte';
  import ManifestPreview from './lib/components/manifest/ManifestPreview.svelte';
  import OutlineView from './lib/components/outline/OutlineView.svelte';
  import ContentPreview from './lib/components/preview/ContentPreview.svelte';
  import { layoutStore } from './lib/stores/layout';
  import { t } from './lib/i18n';
  import { EnhancedAppState } from './lib/app-state-enhanced.svelte.js';
  import { FileStorageAPI } from './lib/storage/index.js';
  import { TransformExecutor } from './lib/transform/transform-executor.js';
  import { i18nService } from './lib/i18n/index.js';
  import { WorkspaceService } from './lib/services/workspace/workspace.service.js';
  import { SpineService } from './lib/services/spine/spine.service.js';
  import { MetadataService } from './lib/services/metadata/metadata.service.js';

  // Simple implementations for required dependencies
  const simpleExtensionManager = {
    getAvailableTransforms: async () => []
  };
  
  const simpleThemeStore = {
    setTheme: () => {},
    useSystemPreference: () => {},
    getCurrentTheme: () => 'system'
  };
  
  const simpleI18nStore = {
    setLocale: () => {},
    getCurrentLocale: () => 'en'
  };

  // Create singleton FileStorageAPI and services with shared instance
  const fileStorage = FileStorageAPI.getInstance();
  const transformExecutor = new TransformExecutor();
  
  // Create services using shared FileStorageAPI
  const workspaceService = new WorkspaceService(fileStorage);
  const spineService = new SpineService(workspaceService);
  const metadataService = new MetadataService(workspaceService);
  
  const appState = new EnhancedAppState(
    fileStorage,
    transformExecutor,
    i18nService,
    simpleExtensionManager,
    simpleThemeStore,
    simpleI18nStore
  );

  // Reactive getters for template access
  let currentView = $derived($navigationStore.currentView);
  let isExpanded = $derived($layoutStore.sidebar.isExpanded);
  let currentWorkspaceId = $derived(appState.currentWorkspaceId);
  let selectedSpineItemId = $derived(appState.selectedChapterId); // renamed in enhanced
  let initialized = $derived(appState.initialized);
  let currentWorkspaceState = $derived(appState.workspace);
  
  // Manifest item selection state
  let selectedManifestItem = $state<any>(null);
  let selectedManifestItemType = $state<'manifest' | 'source' | null>(null);
  
  // Navigation preview state
  let navigationPreviewContent = $state<string | null>(null);
  
  // Services are private in EnhancedAppState - workspace operations go through app state methods
  // No direct service access needed since EnhancedAppState handles service coordination

  // Handle manifest item selection
  const handleManifestItemSelect = (event: CustomEvent<{ item: any; type: 'manifest' | 'source' }>) => {
    selectedManifestItem = event.detail.item;
    selectedManifestItemType = event.detail.type;
  };

  // Handle navigation preview update
  const handleNavigationPreviewUpdate = (event: CustomEvent<{ xhtml: string; warnings?: string[] }>) => {
    navigationPreviewContent = event.detail.xhtml;
  };

  // Initialize app state
  onMount(() => {
    // Async initialization
    (async () => {
      try {
        await appState.initialize();
      } catch (error) {
        console.error('Failed to initialize app state:', error);
      }
    })();

    // Listen for spine item selection events
    const handleSelectSpineItem = (event: Event) => {
      const customEvent = event as CustomEvent<{ itemId: string }>;
      appState.selectChapter(customEvent.detail.itemId);

      // Automatically navigate to spine view when a spine item is selected
      navigationStore.navigateTo('spine');
    };

    // Listen for spine item clear events
    const handleClearSpineSelection = () => {
      appState.selectChapter(null);
    };

    window.addEventListener('select-spine-item', handleSelectSpineItem);
    window.addEventListener('clear-spine-selection', handleClearSpineSelection);

    return () => {
      window.removeEventListener('select-spine-item', handleSelectSpineItem);
      window.removeEventListener('clear-spine-selection', handleClearSpineSelection);
      appState.cleanup();
    };
  });

</script>

<LayoutManager hasWorkspace={!!currentWorkspaceId}>
  <svelte:fragment slot="sidebar-spine">
    {#if !initialized}
      <div class="placeholder-content">
        <p>{$t('Loading workspace…')}</p>
      </div>
    {:else if !currentWorkspaceState}
      <div class="placeholder-content">
        <p>{$t('No workspace selected')}</p>
      </div>
    {:else if currentWorkspaceState}
      <SpineSidebar
        workspace={currentWorkspaceState}
        {spineService}
        selectedItemId={selectedSpineItemId}
        {isExpanded}
        onWorkspaceUpdate={(updatedWorkspace) => {
          appState.workspace = updatedWorkspace;
        }}
      />
    {:else}
      <div class="placeholder-content">
        <p>{$t('Loading workspace…')}</p>
      </div>
    {/if}
  </svelte:fragment>

  <svelte:fragment slot="left-content">
    <!-- Main content area - switches based on current view -->
    {#if currentView === 'workspace' && initialized}
      <WorkspaceView
        onListWorkspaces={() => appState.listWorkspaces()}
        onCreateWorkspace={(data) => appState.createWorkspace(data.title, data.language)}
        onDeleteWorkspace={(id) => appState.deleteWorkspace(id)}
        onLoadWorkspace={(id) => appState.loadWorkspace(id)}
        {currentWorkspaceId}
      />
    {:else if currentView === 'metadata'}
      {#if initialized && currentWorkspaceState}
        <MetadataEditor bind:workspace={currentWorkspaceState} {metadataService} />
      {:else}
        <PlaceholderView
          viewType="metadata"
          title={$t('EPUB Metadata')}
          description={$t('Configure publication metadata and details')}
          icon="📝"
        />
      {/if}
    {:else if currentView === 'manifest'}
      {#if initialized && currentWorkspaceState}
        <ManifestContainer
          workspace={currentWorkspaceState}
          {workspaceService}
          advancedMode={true}
          on:itemSelect={handleManifestItemSelect}
        />
      {:else}
        <PlaceholderView
          viewType="manifest"
          title={$t('File Manifest')}
          description={$t('Manage EPUB files and resources')}
          icon="📋"
        />
      {/if}
    {:else if currentView === 'navigation'}
      {#if initialized && currentWorkspaceState}
        <OutlineView
          workspace={currentWorkspaceState}
          {workspaceService}
          {spineService}
          on:previewUpdate={handleNavigationPreviewUpdate}
        />
      {:else}
        <PlaceholderView
          viewType="navigation"
          title={$t('Table of Contents')}
          description={$t('Loading workspace…')}
          icon="📖"
        />
      {/if}
    {:else if currentView === 'spine'}
      {#if initialized && currentWorkspaceState}
        <SpineView
          workspace={currentWorkspaceState}
          {workspaceService}
          {spineService}
          selectedItemId={selectedSpineItemId}
        />
      {:else}
        <PlaceholderView
          viewType="spine"
          title={$t('Spine Items')}
          description={$t('Loading workspace…')}
          icon="📚"
        />
      {/if}
    {:else if currentView === 'settings'}
      <PlaceholderView
        viewType="settings"
        title={$t('Application Settings')}
        description={$t('Configure preferences and options')}
        icon="⚙️"
      />
    {:else}
      <div class="placeholder-content">
        <h3>{$t('Unknown View')}</h3>
        <p>{$t('View type')}: {currentView}</p>
      </div>
    {/if}
  </svelte:fragment>

  <svelte:fragment slot="right-content">
    {#if currentView === 'manifest' && initialized && currentWorkspaceState}
      <ManifestPreview
        selectedItem={selectedManifestItem}
        selectedItemType={selectedManifestItemType}
        workspace={currentWorkspaceState}
        {workspaceService}
      />
    {:else if currentView === 'navigation'}
      {#if navigationPreviewContent}
        <ContentPreview
          content={navigationPreviewContent}
          contentType="xhtml"
          title={$t('Navigation Preview')}
        />
      {:else}
        <div class="placeholder-content">
          <h3>{$t('Navigation Preview')}</h3>
          <p>{$t('Generating navigation from chapters...')}</p>
        </div>
      {/if}
    {:else}
      <div class="placeholder-content">
        <h3>{$t('Preview Pane')}</h3>
        <p>{$t('XHTML preview will go here (Phase 4)')}</p>
        <p class="current-view-info">{$t('Current view')}: <strong>{currentView}</strong></p>
      </div>
    {/if}
  </svelte:fragment>
</LayoutManager>

<style>
  .placeholder-content {
    padding: 1rem;
    color: var(--color-text-secondary);
  }

  .placeholder-content h3 {
    margin: 0 0 0.5rem 0;
    font-size: 1rem;
    font-weight: 600;
  }

  .placeholder-content p {
    margin: 0;
    font-size: 0.875rem;
    opacity: 0.8;
  }

  .current-view-info {
    margin-top: 1rem !important;
    padding: 0.5rem;
    background: var(--color-bg-secondary);
    border-radius: 4px;
    font-size: 0.75rem !important;
  }
</style>
