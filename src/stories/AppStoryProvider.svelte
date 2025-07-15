<!--
  AppStoryProvider - Context Provider for App Stories
  
  Provides mock managers via Svelte context for story demonstration.
  Wraps the production App.svelte component with story-specific dependencies.
-->
<script lang="ts">
  import { setContext } from 'svelte';
  import App from '../App.svelte';
  import {
    WORKSPACE_MANAGER_CONTEXT,
    MANIFEST_MANAGER_CONTEXT, 
    METADATA_MANAGER_CONTEXT,
    WORKSPACE_ID_CONTEXT
  } from '../lib/contexts';
  import {
    createVisualMockWorkspaceManager,
    createVisualMockManifestManager,
    createVisualMockMetadataManager,
    type VisualScenario
  } from './utils/visual-mock-data';

  // Story configuration prop
  export let scenario: VisualScenario = 'withContent';

  // Create mock managers based on scenario
  $: mockWorkspaceManager = createVisualMockWorkspaceManager(scenario);
  $: mockManifestManager = createVisualMockManifestManager(scenario);
  $: mockMetadataManager = createVisualMockMetadataManager(scenario);
  
  // Determine workspace ID based on scenario
  $: workspaceId = scenario === 'empty' 
    ? 'empty-workspace'
    : scenario === 'largeBook'
    ? 'large-book'
    : 'demo-workspace';

  // Provide managers via Svelte context
  setContext(WORKSPACE_MANAGER_CONTEXT, mockWorkspaceManager);
  setContext(MANIFEST_MANAGER_CONTEXT, mockManifestManager);
  setContext(METADATA_MANAGER_CONTEXT, mockMetadataManager);
  setContext(WORKSPACE_ID_CONTEXT, workspaceId);
</script>

<!-- Render App component with context-provided dependencies -->
<App />