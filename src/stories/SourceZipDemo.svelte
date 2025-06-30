<script lang="ts">
  import { onMount } from 'svelte';
  import { FileStorageAPI } from '$lib/storage';
  import { SourceManager } from '$lib/source';
  import { DEFAULT_SOURCE_SETTINGS } from '$lib/source';
  import './source-zip-demo.css';

  interface LogEntry {
    timestamp: string;
    type: 'info' | 'success' | 'error' | 'action';
    message: string;
  }

  // Component state
  let fileStorage: FileStorageAPI;
  let sourceManager: SourceManager;
  let logs: LogEntry[] = [];
  let isLoading = false;
  let currentWorkspaceId = '';
  let sourceFiles: any[] = [];
  let sourceStats: any = null;
  let validation: any = null;
  let uploadedFile: File | null = null;

  // Initialize storage and source manager
  onMount(async () => {
    try {
      fileStorage = new FileStorageAPI();
      await fileStorage.init();
      sourceManager = new SourceManager(fileStorage);
      addLog('success', 'SOURCE.zip manager initialized');
      
      // Create a demo workspace
      await createDemoWorkspace();
    } catch (error: any) {
      addLog('error', `Failed to initialize: ${error.message}`);
    }
  });

  // Demo operations
  async function createDemoWorkspace() {
    if (!fileStorage || isLoading) return;
    isLoading = true;
    addLog('action', 'Creating demo workspace...');

    try {
      // Create new workspace
      currentWorkspaceId = await fileStorage.createWorkspace();
      addLog('success', `Workspace created: ${currentWorkspaceId}`);

      // Initialize SOURCE/ structure
      await sourceManager.initializeSourceStructure(currentWorkspaceId);
      addLog('success', 'SOURCE/ directory structure initialized');

      // Add some demo content
      await createDemoContent();
      
      // Refresh stats
      await refreshSourceInfo();
    } catch (error: any) {
      addLog('error', `Failed to create workspace: ${error.message}`);
    } finally {
      isLoading = false;
    }
  }

  async function createDemoContent() {
    if (!currentWorkspaceId) return;
    
    addLog('action', 'Adding demo content to SOURCE/...');

    try {
      // Add text files
      await fileStorage.writeTextFile(currentWorkspaceId, 'SOURCE/text/chapter1.txt', 
        '# Chapter 1: Introduction\n\nWelcome to the world of EPUB creation...');
      await fileStorage.writeTextFile(currentWorkspaceId, 'SOURCE/text/chapter2.txt',
        '# Chapter 2: Getting Started\n\nLet\'s begin with the basics...');

      // Add script files
      await fileStorage.writeTextFile(currentWorkspaceId, 'SOURCE/scripts/markdown-transform.js',
        `function transformText(text) {
  return text.replace(/^# (.+)$/gm, '<h1>$1</h1>');
}
module.exports = { transformText };`);

      // Add extension
      await fileStorage.writeTextFile(currentWorkspaceId, 'SOURCE/extensions/highlight/package.json',
        JSON.stringify({ name: 'highlight-js', version: '1.0.0', main: 'index.js' }, null, 2));

      addLog('success', 'Demo content added to SOURCE/ directory');
    } catch (error: any) {
      addLog('error', `Failed to create demo content: ${error.message}`);
    }
  }

  async function createSourceZip() {
    if (!sourceManager || !currentWorkspaceId || isLoading) return;
    isLoading = true;
    addLog('action', 'Creating SOURCE.zip from workspace files...');

    try {
      const sourceZip = await sourceManager.createSourceZip(currentWorkspaceId);
      
      if (sourceZip) {
        addLog('success', `SOURCE.zip created successfully (${sourceZip.size} bytes)`);
        
        // Offer download
        const url = URL.createObjectURL(sourceZip);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'SOURCE.zip';
        a.click();
        URL.revokeObjectURL(url);
        
        addLog('info', 'SOURCE.zip download started');
      } else {
        addLog('info', 'No SOURCE/ files found to package');
      }
    } catch (error: any) {
      addLog('error', `Failed to create SOURCE.zip: ${error.message}`);
    } finally {
      isLoading = false;
    }
  }

  async function extractSourceZip() {
    if (!sourceManager || !currentWorkspaceId || !uploadedFile || isLoading) return;
    isLoading = true;
    addLog('action', 'Extracting uploaded SOURCE.zip...');

    try {
      await sourceManager.extractSourceZip(currentWorkspaceId, uploadedFile);
      addLog('success', 'SOURCE.zip extracted successfully');
      
      // Refresh stats
      await refreshSourceInfo();
      
      // Clear uploaded file
      uploadedFile = null;
    } catch (error: any) {
      addLog('error', `Failed to extract SOURCE.zip: ${error.message}`);
    } finally {
      isLoading = false;
    }
  }

  async function validateSourceStructure() {
    if (!sourceManager || !currentWorkspaceId || isLoading) return;
    isLoading = true;
    addLog('action', 'Validating SOURCE/ directory structure...');

    try {
      validation = await sourceManager.validateSourceStructure(currentWorkspaceId);
      
      if (validation.isValid) {
        addLog('success', `SOURCE/ structure is valid (${validation.fileCount} files, ${validation.totalSize} bytes)`);
      } else {
        addLog('error', `SOURCE/ validation failed: ${validation.errors.join(', ')}`);
      }
      
      if (validation.warnings.length > 0) {
        addLog('info', `Warnings: ${validation.warnings.join(', ')}`);
      }
    } catch (error: any) {
      addLog('error', `Failed to validate structure: ${error.message}`);
    } finally {
      isLoading = false;
    }
  }

  async function refreshSourceInfo() {
    if (!sourceManager || !currentWorkspaceId) return;
    
    try {
      // Get file listing
      sourceFiles = await sourceManager.listSourceFiles(currentWorkspaceId);
      
      // Get statistics
      sourceStats = await sourceManager.getSourceDirectoryStats(currentWorkspaceId);
      
      addLog('info', `Refreshed SOURCE/ info: ${sourceFiles.length} files`);
    } catch (error: any) {
      addLog('error', `Failed to refresh info: ${error.message}`);
    }
  }

  async function resetDemo() {
    if (isLoading) return;
    isLoading = true;
    addLog('action', 'Resetting demo...');

    try {
      // Clear current workspace
      if (currentWorkspaceId) {
        await fileStorage.deleteWorkspace(currentWorkspaceId);
        addLog('info', 'Previous workspace deleted');
      }

      // Reset state
      currentWorkspaceId = '';
      sourceFiles = [];
      sourceStats = null;
      validation = null;
      uploadedFile = null;
      
      // Create new demo workspace
      await createDemoWorkspace();
      
      addLog('success', 'Demo reset complete');
    } catch (error: any) {
      addLog('error', `Failed to reset demo: ${error.message}`);
    } finally {
      isLoading = false;
    }
  }

  function addLog(type: 'info' | 'success' | 'error' | 'action', message: string) {
    const timestamp = new Date().toLocaleTimeString();
    logs = [...logs, { timestamp, type, message }];
  }

  function handleFileUpload(event: Event) {
    const target = event.target as HTMLInputElement;
    if (target.files && target.files[0]) {
      uploadedFile = target.files[0];
      addLog('info', `File selected: ${uploadedFile.name} (${uploadedFile.size} bytes)`);
    }
  }

  function clearLogs() {
    logs = [];
    addLog('info', 'Console cleared');
  }
</script>

<div class="source-zip-demo">
  <div class="demo-header">
    <h2>📦 SOURCE.zip Management Demo</h2>
    <p>Interactive demonstration of SOURCE.zip creation, extraction, and management capabilities.</p>
  </div>

  <div class="demo-grid">
    <!-- Controls Panel -->
    <div class="controls-panel">
      <h3>🔧 Operations</h3>
      
      <div class="button-group">
        <button 
          on:click={createSourceZip} 
          disabled={isLoading || !currentWorkspaceId}
          class="btn-primary"
        >
          📦 Create SOURCE.zip
        </button>
        
        <button 
          on:click={validateSourceStructure} 
          disabled={isLoading || !currentWorkspaceId}
          class="btn-secondary"
        >
          ✅ Validate Structure
        </button>
        
        <button 
          on:click={refreshSourceInfo} 
          disabled={isLoading || !currentWorkspaceId}
          class="btn-secondary"
        >
          🔄 Refresh Info
        </button>
      </div>

      <div class="upload-section">
        <h4>📤 Upload SOURCE.zip</h4>
        <input 
          type="file" 
          accept=".zip" 
          on:change={handleFileUpload}
          disabled={isLoading}
        />
        {#if uploadedFile}
          <button 
            on:click={extractSourceZip} 
            disabled={isLoading}
            class="btn-primary"
          >
            📂 Extract ZIP
          </button>
        {/if}
      </div>

      <div class="reset-section">
        <button 
          on:click={resetDemo} 
          disabled={isLoading}
          class="btn-danger"
        >
          🔄 Reset Demo
        </button>
        
        <button 
          on:click={clearLogs} 
          disabled={isLoading}
          class="btn-secondary"
        >
          🧹 Clear Logs
        </button>
      </div>
    </div>

    <!-- Info Panel -->
    <div class="info-panel">
      <h3>📊 SOURCE/ Directory Info</h3>
      
      {#if sourceStats}
        <div class="stats-grid">
          <div class="stat-item">
            <span class="stat-label">Total Files:</span>
            <span class="stat-value">{sourceStats.totalFiles}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Total Size:</span>
            <span class="stat-value">{sourceStats.totalSize} bytes</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Text Files:</span>
            <span class="stat-value">{sourceStats.directories.text}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Scripts:</span>
            <span class="stat-value">{sourceStats.directories.scripts}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Extensions:</span>
            <span class="stat-value">{sourceStats.directories.extensions}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Has Settings:</span>
            <span class="stat-value">{sourceStats.hasSettingsFile ? '✅' : '❌'}</span>
          </div>
        </div>
      {:else}
        <p class="no-data">No SOURCE/ statistics available</p>
      {/if}

      {#if validation}
        <div class="validation-section">
          <h4>🔍 Validation Results</h4>
          <div class="validation-status" class:valid={validation.isValid} class:invalid={!validation.isValid}>
            {validation.isValid ? '✅ Valid' : '❌ Invalid'}
          </div>
          {#if validation.errors.length > 0}
            <div class="validation-errors">
              <strong>Errors:</strong>
              <ul>
                {#each validation.errors as error}
                  <li>{error}</li>
                {/each}
              </ul>
            </div>
          {/if}
          {#if validation.warnings.length > 0}
            <div class="validation-warnings">
              <strong>Warnings:</strong>
              <ul>
                {#each validation.warnings as warning}
                  <li>{warning}</li>
                {/each}
              </ul>
            </div>
          {/if}
        </div>
      {/if}
    </div>

    <!-- Files Panel -->
    <div class="files-panel">
      <h3>📁 SOURCE/ Files</h3>
      
      {#if sourceFiles.length > 0}
        <div class="files-list">
          {#each sourceFiles as file}
            <div class="file-item">
              <div class="file-info">
                <span class="file-path">{file.path}</span>
                <span class="file-type type-{file.type}">{file.type}</span>
              </div>
              <span class="file-size">{file.size} bytes</span>
            </div>
          {/each}
        </div>
      {:else}
        <p class="no-files">No SOURCE/ files found</p>
      {/if}
    </div>

    <!-- Console Panel -->
    <div class="console-panel">
      <h3>📟 Console Log</h3>
      <div class="console-log">
        {#each logs as log}
          <div class="log-entry log-{log.type}">
            <span class="log-time">{log.timestamp}</span>
            <span class="log-message">{log.message}</span>
          </div>
        {/each}
      </div>
    </div>
  </div>
</div>