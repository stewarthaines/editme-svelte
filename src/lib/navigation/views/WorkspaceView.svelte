<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { navigationStore } from '../navigation-store';
  import type { WorkspaceViewData } from '../types';

  // Component implements ViewComponent interface
  let viewData: WorkspaceViewData = {
    selectedWorkspace: null,
    recentWorkspaces: [],
  };
  
  let guardId: string;
  let hasUnsavedChanges = false;

  // ViewComponent interface implementation
  export function onViewEnter(data?: any): void {
    if (data) {
      viewData = { ...viewData, ...data };
    }
    
    // Restore saved data
    const saved = navigationStore.getViewData<WorkspaceViewData>('workspace');
    if (saved) {
      viewData = saved;
    }
  }

  export function onViewLeave(): void {
    // Save current state
    navigationStore.setViewData('workspace', viewData);
  }

  export function getViewData(): WorkspaceViewData {
    return viewData;
  }

  export function setViewData(data: any): void {
    viewData = { ...viewData, ...data };
  }

  export async function canLeave(): Promise<boolean> {
    if (hasUnsavedChanges) {
      return window.confirm('You have unsaved workspace changes. Continue?');
    }
    return true;
  }

  // Component lifecycle
  onMount(() => {
    // Register navigation guard
    guardId = navigationStore.addNavigationGuard(canLeave);
    
    // Call onViewEnter
    onViewEnter();
  });

  onDestroy(() => {
    // Clean up guard
    if (guardId) {
      navigationStore.removeNavigationGuard(guardId);
    }
    
    // Call onViewLeave
    onViewLeave();
  });

  // Example workspace operations
  function selectWorkspace(workspaceId: string) {
    viewData.selectedWorkspace = workspaceId;
    hasUnsavedChanges = false;
    navigationStore.setViewData('workspace', viewData);
  }

  function _addToRecent(workspaceId: string) {
    const recent = viewData.recentWorkspaces.filter(id => id !== workspaceId);
    recent.unshift(workspaceId);
    viewData.recentWorkspaces = recent.slice(0, 5); // Keep only 5 recent
    hasUnsavedChanges = true;
  }
</script>

<div class="workspace-view">
  <header class="view-header">
    <h2>Workspace Management</h2>
    <p>Select and manage EPUB workspaces</p>
  </header>

  <main class="view-content">
    <section class="workspace-section">
      <h3>Current Workspace</h3>
      {#if viewData.selectedWorkspace}
        <div class="current-workspace">
          <span class="workspace-icon">📁</span>
          <span class="workspace-name">{viewData.selectedWorkspace}</span>
          <button 
            on:click={() => selectWorkspace('')}
            class="btn btn-secondary"
          >
            Close
          </button>
        </div>
      {:else}
        <div class="no-workspace">
          <span class="icon">📂</span>
          <p>No workspace selected</p>
          <button class="btn btn-primary">Create New Workspace</button>
        </div>
      {/if}
    </section>

    <section class="recent-section">
      <h3>Recent Workspaces</h3>
      {#if viewData.recentWorkspaces.length > 0}
        <ul class="recent-list">
          {#each viewData.recentWorkspaces as workspaceId}
            <li class="recent-item">
              <button 
                on:click={() => selectWorkspace(workspaceId)}
                class="recent-workspace"
              >
                <span class="workspace-icon">📁</span>
                <span class="workspace-name">{workspaceId}</span>
                <span class="workspace-date">Last opened: Recently</span>
              </button>
            </li>
          {/each}
        </ul>
      {:else}
        <p class="no-recent">No recent workspaces</p>
      {/if}
    </section>

    <section class="actions-section">
      <div class="action-buttons">
        <button class="btn btn-primary">
          <span class="btn-icon">➕</span>
          Create Workspace
        </button>
        <button class="btn btn-secondary">
          <span class="btn-icon">📁</span>
          Open Existing
        </button>
        <button class="btn btn-secondary">
          <span class="btn-icon">📥</span>
          Import EPUB
        </button>
      </div>
    </section>

    {#if hasUnsavedChanges}
      <div class="unsaved-indicator">
        <span class="indicator-icon">⚠️</span>
        <span>You have unsaved changes</span>
      </div>
    {/if}
  </main>
</div>

<style>
  .workspace-view {
    height: 100%;
    display: flex;
    flex-direction: column;
    background-color: var(--color-bg-primary);
    color: var(--color-text-primary);
  }

  .view-header {
    padding: var(--space-6);
    border-bottom: 1px solid var(--color-border-default);
    background-color: var(--color-bg-secondary);
  }

  .view-header h2 {
    margin: 0 0 var(--space-2) 0;
    font-size: var(--text-xl);
    font-weight: var(--font-semibold);
    color: var(--color-text-primary);
  }

  .view-header p {
    margin: 0;
    font-size: var(--text-sm);
    color: var(--color-text-secondary);
  }

  .view-content {
    flex: 1;
    padding: var(--space-6);
    overflow-y: auto;
  }

  .workspace-section,
  .recent-section,
  .actions-section {
    margin-bottom: var(--space-8);
  }

  .workspace-section h3,
  .recent-section h3 {
    margin: 0 0 var(--space-4) 0;
    font-size: var(--text-lg);
    font-weight: var(--font-medium);
    color: var(--color-text-primary);
  }

  .current-workspace {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    padding: var(--space-4);
    background-color: var(--color-bg-secondary);
    border: 1px solid var(--color-border-default);
    border-radius: var(--radius-md);
  }

  .workspace-icon {
    font-size: var(--text-lg);
  }

  .workspace-name {
    flex: 1;
    font-weight: var(--font-medium);
    color: var(--color-text-primary);
  }

  .no-workspace {
    text-align: center;
    padding: var(--space-8);
    color: var(--color-text-secondary);
  }

  .no-workspace .icon {
    display: block;
    font-size: 3rem;
    margin-bottom: var(--space-4);
  }

  .no-workspace p {
    margin: 0 0 var(--space-4) 0;
    font-size: var(--text-base);
  }

  .recent-list {
    list-style: none;
    margin: 0;
    padding: 0;
  }

  .recent-item {
    margin-bottom: var(--space-2);
  }

  .recent-workspace {
    width: 100%;
    display: flex;
    align-items: center;
    gap: var(--space-3);
    padding: var(--space-3);
    background: none;
    border: 1px solid var(--color-border-default);
    border-radius: var(--radius-md);
    cursor: pointer;
    transition: all var(--duration-fast) ease;
    text-align: left;
  }

  .recent-workspace:hover {
    background-color: var(--color-bg-secondary);
    border-color: var(--color-border-hover);
  }

  .workspace-date {
    font-size: var(--text-xs);
    color: var(--color-text-secondary);
    margin-left: auto;
  }

  .no-recent {
    color: var(--color-text-secondary);
    font-style: italic;
    text-align: center;
    padding: var(--space-4);
  }

  .action-buttons {
    display: flex;
    gap: var(--space-3);
    flex-wrap: wrap;
  }

  .btn {
    display: inline-flex;
    align-items: center;
    gap: var(--space-2);
    padding: var(--space-2) var(--space-4);
    border: none;
    border-radius: var(--radius-md);
    font-family: var(--font-sans);
    font-size: var(--text-sm);
    font-weight: var(--font-medium);
    cursor: pointer;
    transition: all var(--duration-fast) ease;
    text-decoration: none;
  }

  .btn-primary {
    background-color: var(--color-accent);
    color: white;
  }

  .btn-primary:hover {
    background-color: var(--color-accent-dark, var(--color-accent));
    transform: translateY(-1px);
    box-shadow: var(--shadow-sm);
  }

  .btn-secondary {
    background-color: var(--color-bg-secondary);
    color: var(--color-text-primary);
    border: 1px solid var(--color-border-default);
  }

  .btn-secondary:hover {
    background-color: var(--color-bg-tertiary);
    border-color: var(--color-border-hover);
  }

  .btn-icon {
    font-size: var(--text-base);
  }

  .unsaved-indicator {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    padding: var(--space-3);
    background-color: var(--color-warning-bg, #fef3cd);
    color: var(--color-warning-text, #856404);
    border: 1px solid var(--color-warning-border, #ffeaa7);
    border-radius: var(--radius-md);
    font-size: var(--text-sm);
  }

  .indicator-icon {
    font-size: var(--text-base);
  }
</style>