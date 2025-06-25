<script lang="ts">
  import LayoutManager from './lib/LayoutManager.svelte';
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
    <div class="placeholder-content">
      <h3>Text Editor</h3>
      <p>Plain text editor will go here</p>
    </div>
  </svelte:fragment>

  <svelte:fragment slot="right-content">
    <div class="placeholder-content">
      <h3>Preview Pane</h3>
      <p>XHTML preview will go here</p>
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
</style>
