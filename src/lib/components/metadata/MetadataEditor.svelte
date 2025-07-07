<script>
  import { onMount } from 'svelte';
  import { t } from '../../i18n';
  import MetadataTabBar from './MetadataTabBar.svelte';
  import BasicInfoFields from './BasicInfoFields.svelte';
  import AdvancedFields from './AdvancedFields.svelte';

  export let workspaceId = '';
  export let metadataManager = null;

  let metadata = {};
  let validationErrors = [];
  let activeTab = 'basic';
  let saving = false;
  let loading = true;
  let error = null;

  // Tab definitions with labels
  $: tabs = [
    { id: 'basic', label: $t('Basic Info') },
    { id: 'advanced', label: $t('Advanced') },
    { id: 'publication', label: $t('Publication Details') },
    { id: 'accessibility', label: $t('Accessibility') }
  ];

  const getTabFields = (tabId) => {
    switch (tabId) {
      case 'basic':
        return ['title', 'language', 'identifier', 'creator'];
      case 'advanced':
        return ['publisher', 'date', 'description', 'subject', 'rights', 'source', 'relation', 'coverage', 'type', 'format', 'contributor'];
      case 'publication':
        return ['series', 'seriesPosition', 'epubVersion', 'uniqueIdentifierScheme', 'primaryCreatorFileAs', 'creatorRoles'];
      case 'accessibility':
        return ['accessMode', 'accessModeSufficient', 'accessibilityFeature', 'accessibilityHazard', 'accessibilitySummary', 'accessibilityCertification', 'accessibilityCertifier'];
      default:
        return [];
    }
  };

  const validateCurrentTab = (tabId, metadata) => {
    const tabFields = getTabFields(tabId);
    return validationErrors.filter(error => 
      tabFields.includes(error.field)
    );
  };

  const loadMetadata = async () => {
    if (!metadataManager || !workspaceId) return;

    try {
      loading = true;
      metadata = await metadataManager.loadMetadata(workspaceId);
      validationErrors = metadataManager.validateMetadata(metadata);
      error = null;
    } catch (err) {
      console.error('Failed to load metadata:', err);
      error = $t('Failed to load metadata');
    } finally {
      loading = false;
    }
  };

  const handleFieldChange = (event) => {
    const { field, value } = event.detail;
    
    // Update local state immediately for UI responsiveness
    metadata = { ...metadata, [field]: value };
    
    // Update validation errors
    if (metadataManager) {
      validationErrors = metadataManager.validateMetadata(metadata);
    }
  };

  const handleFieldSave = async (event) => {
    const { field, value } = event.detail;
    
    if (!metadataManager || !workspaceId) return;

    try {
      // Save in background without blocking UI
      await metadataManager.updateField(workspaceId, field, value);
    } catch (err) {
      console.error(`Failed to save field ${field}:`, err);
      // Show error indicator - in a real implementation, you might want to 
      // show a toast notification or update the field with an error state
    }
  };

  const handleArrayAdd = async (event) => {
    const { field } = event.detail;
    
    if (!metadataManager || !workspaceId) return;

    try {
      saving = true;
      
      if (field === 'creator') {
        await metadataManager.addCreator(workspaceId);
      } else if (field === 'subject') {
        await metadataManager.addSubject(workspaceId);
      } else if (field === 'contributor') {
        await metadataManager.addContributor(workspaceId);
      }
      
      // Refresh metadata from manager
      metadata = await metadataManager.loadMetadata(workspaceId);
      validationErrors = metadataManager.validateMetadata(metadata);
    } catch (err) {
      console.error(`Failed to add ${field}:`, err);
    } finally {
      saving = false;
    }
  };

  const handleArrayRemove = async (event) => {
    const { field, index } = event.detail;
    
    if (!metadataManager || !workspaceId) return;

    try {
      saving = true;
      
      if (field === 'creator') {
        await metadataManager.removeCreator(workspaceId, index);
      } else if (field === 'subject') {
        await metadataManager.removeSubject(workspaceId, index);
      } else if (field === 'contributor') {
        await metadataManager.removeContributor(workspaceId, index);
      }
      
      // Refresh metadata from manager
      metadata = await metadataManager.loadMetadata(workspaceId);
      validationErrors = metadataManager.validateMetadata(metadata);
    } catch (err) {
      console.error(`Failed to remove ${field}:`, err);
    } finally {
      saving = false;
    }
  };

  const handleGenerateIdentifier = async () => {
    if (!metadataManager) return;

    const newIdentifier = metadataManager.generateIdentifier();
    handleFieldChange({ detail: { field: 'identifier', value: newIdentifier } });
    await handleFieldSave({ detail: { field: 'identifier', value: newIdentifier } });
  };

  const handleTabSwitch = async (event) => {
    const newTabId = event.detail.tabId;
    
    // Check for errors in current tab
    const currentTabErrors = validateCurrentTab(activeTab, metadata);
    if (currentTabErrors.length > 0) {
      // Show validation alert and prevent tab switch
      alert($t('Please fix errors before switching tabs'));
      return;
    }
    
    // Switch tab
    activeTab = newTabId;
  };

  // Load metadata when component mounts or dependencies change
  onMount(loadMetadata);
  $: if (workspaceId && metadataManager) {
    loadMetadata();
  }
</script>

<div class="metadata-editor">
  <div class="pane-header" tabindex="-1">
    <MetadataTabBar
      {activeTab}
      {validationErrors}
      {tabs}
      on:tabClick={handleTabSwitch}
    />
  </div>

  <div class="pane-content">
    {#if loading}
      <div class="loading-state">
        <p>{$t('Loading metadata...')}</p>
      </div>
    {:else if error}
      <div class="error-state">
        <p class="error-message">{error}</p>
        <button 
          type="button" 
          class="retry-button"
          on:click={loadMetadata}
        >
          {$t('Retry')}
        </button>
      </div>
    {:else}
      <div 
        class="tab-panel" 
        id="metadata-panel-{activeTab}"
        aria-labelledby="metadata-tab-{activeTab}"
        tabindex="-1"
      >
        {#if activeTab === 'basic'}
          <BasicInfoFields
            {metadata}
            {validationErrors}
            {saving}
            on:fieldChange={handleFieldChange}
            on:fieldSave={handleFieldSave}
            on:arrayAdd={handleArrayAdd}
            on:arrayRemove={handleArrayRemove}
            on:generateIdentifier={handleGenerateIdentifier}
          />
        {:else if activeTab === 'advanced'}
          <AdvancedFields
            {metadata}
            {validationErrors}
            {saving}
            on:fieldChange={handleFieldChange}
            on:fieldSave={handleFieldSave}
            on:arrayAdd={handleArrayAdd}
            on:arrayRemove={handleArrayRemove}
          />
        {:else if activeTab === 'publication'}
          <div class="placeholder-panel">
            <p>{$t('Coming Soon')}</p>
            <p class="placeholder-description">{$t('Publication Details')} - {$t('Series information, EPUB version, and publication-specific metadata')}</p>
          </div>
        {:else if activeTab === 'accessibility'}
          <div class="placeholder-panel">
            <p>{$t('Coming Soon')}</p>
            <p class="placeholder-description">{$t('Accessibility')} - {$t('Accessibility features, hazards, and certification information')}</p>
          </div>
        {/if}
      </div>
    {/if}
  </div>
</div>

<style>
  .metadata-editor {
    display: flex;
    flex-direction: column;
    height: 100%;
    background-color: var(--color-surface-primary);
  }

  .pane-header {
    flex-shrink: 0;
    border-block-end: 1px solid var(--color-border-default);
  }

  .pane-content {
    flex: 1;
    overflow-y: auto;
    background-color: var(--color-background);
  }

  .tab-panel {
    height: 100%;
  }

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

  .placeholder-panel {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    padding: 2rem;
    text-align: center;
    color: var(--color-text-secondary);
  }

  .placeholder-panel p:first-child {
    font-size: 1.125rem;
    font-weight: 600;
    margin-block-end: 0.5rem;
  }

  .placeholder-description {
    font-size: 0.875rem;
    opacity: 0.8;
  }
</style>