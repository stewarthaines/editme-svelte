<script lang="ts">
  import LayoutManager from './lib/LayoutManager.svelte';
  import { navigationStore } from './lib/navigation';
  import WorkspaceView from './lib/navigation/views/WorkspaceView.svelte';
  import MetadataView from './lib/navigation/views/MetadataView.svelte';
  import PlaceholderView from './lib/navigation/views/PlaceholderView.svelte';

  // Subscribe to navigation state
  $: currentView = $navigationStore.currentView;
</script>

<LayoutManager>
  <svelte:fragment slot="sidebar-workspace">
    <div class="placeholder-content">
      <h3>Workspace</h3>
      <p>Workspace selector placeholder</p>
    </div>
  </svelte:fragment>

  <svelte:fragment slot="sidebar-metadata">
    <div class="placeholder-content">
      <h3>Metadata</h3>
      <p>Metadata editor placeholder</p>
    </div>
  </svelte:fragment>

  <svelte:fragment slot="sidebar-manifest">
    <div class="placeholder-content">
      <h3>Manifest</h3>
      <p>File manifest placeholder</p>
    </div>
  </svelte:fragment>

  <svelte:fragment slot="sidebar-nav">
    <div class="placeholder-content">
      <h3>Navigation</h3>
      <p>TOC editor placeholder</p>
    </div>
  </svelte:fragment>

  <svelte:fragment slot="sidebar-spine">
    <div class="placeholder-content">
      <h3>Spine Items</h3>
      <p>Chapter ordering placeholder</p>
    </div>
  </svelte:fragment>

  <svelte:fragment slot="sidebar-settings">
    <div class="placeholder-content">
      <h3>Settings</h3>
      <p>App settings placeholder</p>
    </div>
  </svelte:fragment>

  <svelte:fragment slot="left-content">
    <!-- Main content area - switches based on current view -->
    {#if currentView === 'workspace'}
      <WorkspaceView />
    {:else if currentView === 'metadata'}
      <MetadataView />
    {:else if currentView === 'manifest'}
      <PlaceholderView 
        viewType="manifest" 
        title="File Manifest" 
        description="Manage EPUB files and resources"
        icon="📋" 
      />
    {:else if currentView === 'navigation'}
      <PlaceholderView 
        viewType="navigation" 
        title="Table of Contents" 
        description="Edit navigation structure and TOC"
        icon="📖" 
      />
    {:else if currentView === 'spine'}
      <PlaceholderView 
        viewType="spine" 
        title="Spine Items" 
        description="Manage chapter ordering and spine structure"
        icon="📚" 
      />
    {:else if currentView === 'settings'}
      <PlaceholderView 
        viewType="settings" 
        title="Application Settings" 
        description="Configure preferences and options"
        icon="⚙️" 
      />
    {:else}
      <div class="placeholder-content">
        <h3>Unknown View</h3>
        <p>View type: {currentView}</p>
      </div>
    {/if}
  </svelte:fragment>

  <svelte:fragment slot="right-content">
    <div class="placeholder-content">
      <h3>Preview Pane</h3>
      <p>XHTML preview will go here (Phase 4)</p>
      <p class="current-view-info">Current view: <strong>{currentView}</strong></p>
    </div>
  </svelte:fragment>
</LayoutManager>

<style>
  .placeholder-content {
    padding: 1rem;
    color: #666;
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
    background: #f0f0f0;
    border-radius: 4px;
    font-size: 0.75rem !important;
  }
</style>
