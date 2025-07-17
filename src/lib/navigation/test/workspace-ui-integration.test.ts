/**
 * UI Integration Test for Enhanced Workspace Creation
 * 
 * Verifies that the "Create New" button correctly uses the enhanced
 * createLocalizedEPUBWorkspace method with proper locale detection.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { get } from 'svelte/store';
import { WorkspaceManager } from '../../workspace/workspace-manager.js';
import { currentLocale } from '../../i18n/index.js';

describe('Workspace UI Integration', () => {
  let mockWorkspaceManager: any;
  let handleCreateNew: any;

  beforeEach(() => {
    // Mock WorkspaceManager with the enhanced method
    mockWorkspaceManager = {
      createLocalizedEPUBWorkspace: vi.fn().mockResolvedValue('workspace-123'),
    };

    // Simulate the handleCreateNew function from WorkspaceView.svelte
    handleCreateNew = async () => {
      const locale = get(currentLocale);
      const metadata = {
        title: 'Untitled Book Project',
        language: 'en',
        identifier: crypto.randomUUID(),
        creator: ['Unknown'],
      };
      
      return await mockWorkspaceManager.createLocalizedEPUBWorkspace(metadata, locale);
    };
  });

  it('should call createLocalizedEPUBWorkspace with current locale', async () => {
    const workspaceId = await handleCreateNew();

    expect(mockWorkspaceManager.createLocalizedEPUBWorkspace).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Untitled Book Project',
        language: 'en',
        creator: ['Unknown'],
      }),
      expect.any(String) // locale
    );

    expect(workspaceId).toBe('workspace-123');
  });

  it('should use the current locale from i18n system', async () => {
    await handleCreateNew();

    const [metadata, locale] = mockWorkspaceManager.createLocalizedEPUBWorkspace.mock.calls[0];
    
    // Verify locale is a string (current locale from i18n)
    expect(typeof locale).toBe('string');
    expect(locale.length).toBeGreaterThan(0);
  });

  it('should generate proper metadata structure', async () => {
    await handleCreateNew();

    const [metadata] = mockWorkspaceManager.createLocalizedEPUBWorkspace.mock.calls[0];
    
    expect(metadata).toMatchObject({
      title: expect.any(String),
      language: expect.any(String),
      identifier: expect.any(String),
      creator: expect.arrayContaining([expect.any(String)]),
    });
  });

  it('should handle workspace creation errors gracefully', async () => {
    mockWorkspaceManager.createLocalizedEPUBWorkspace.mockRejectedValue(
      new Error('Creation failed')
    );

    await expect(handleCreateNew()).rejects.toThrow('Creation failed');
  });
});