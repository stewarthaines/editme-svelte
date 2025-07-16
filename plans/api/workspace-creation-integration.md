# Workspace Creation Integration API Documentation

## Overview

The Workspace Creation Integration orchestrates the enhanced "Create New" EPUB workspace feature by coordinating the Translation Content System, Universal Asset Generator, and enhanced WorkspaceManager with complete EPUB structure creation and SOURCE management. This component provides the user-facing API for creating complete, functional Active EPUB workspaces with localized sample content.

### Purpose

- Coordinate all components to create complete Active EPUB workspaces
- Provide enhanced "Create New" button functionality with immediate value
- Integrate seamlessly with existing WorkspaceManager and navigation systems
- Handle user experience flow from creation to first content interaction
- Ensure all components work together reliably with proper error handling

### Architectural Principles

- **Orchestration Pattern**: Coordinates multiple specialized components without duplicating functionality
- **User Experience First**: Prioritizes immediate value and intuitive workflow
- **Locale-Aware**: Automatically adapts to user's current locale
- **Progressive Enhancement**: Builds upon existing workspace infrastructure
- **Error Recovery**: Robust error handling with graceful degradation

## Integration Architecture

### Component Dependencies

```
WorkspaceCreationIntegration
├── Translation Content System    (localized content)
├── Universal Asset Generator     (CSS + transform scripts)
├── Existing WorkspaceManager     (enhanced for EPUB structure + sample content + SOURCE)
├── Existing SourceManager        (SOURCE.zip management)
└── Existing I18n System         (locale detection)
```

### User Experience Flow

```
1. User clicks "Create New" button
2. Detect current locale from i18n system
3. Show simple creation indicator
4. Create complete EPUB workspace structure via enhanced WorkspaceManager
   - Generate localized sample content and XHTML files
   - Install transform scripts and basic settings.json
   - Create EPUB structure (OPF, container.xml, nav.xhtml)
   - Initialize SOURCE directory structure
5. Navigate to first spine item for immediate content preview
6. Show success notification with workspace summary
```

## Core Interfaces

### WorkspaceCreationIntegration Class

```typescript
/**
 * Main orchestrator for enhanced workspace creation
 */
class WorkspaceCreationIntegration {
  constructor(
    private workspaceManager: WorkspaceManager,
    private contentGenerator: SampleContentGenerator,
    private assetGenerator: UniversalAssetGenerator,
    private sourceManager: SourceManager,
    private i18nSystem: I18nSystem,
    private navigationRouter: NavigationRouter
  );

  /**
   * Create complete Active EPUB workspace with localized sample content
   */
  async createLocalizedEPUBWorkspace(
    options?: WorkspaceCreationOptions
  ): Promise<WorkspaceCreationResult>;

  /**
   * Enhanced "Create New" button handler
   */
  async handleCreateNewWorkspace(
    event?: Event,
    options?: WorkspaceCreationOptions
  ): Promise<void>;



  /**
   * Get estimated creation time and resource requirements
   */
  async getCreationEstimates(locale?: string): Promise<CreationEstimates>;

  /**
   * Cancel in-progress workspace creation
   */
  async cancelCreation(creationId: string): Promise<void>;

  /**
   * Cleanup failed workspace creation
   */
  async cleanupFailedCreation(workspaceId: string): Promise<void>;
}
```

### WorkspaceCreationOptions Interface

```typescript
/**
 * Options for customizing workspace creation
 */
interface WorkspaceCreationOptions {
  /** Override automatic locale detection */
  locale?: string;

  /** Custom metadata overrides */
  metadata?: Partial<EPUBMetadata>;

  /** Navigation destination after creation */
  navigationTarget?: 'metadata' | 'first-spine-item' | 'manifest' | 'custom';

  /** Custom navigation path */
  customNavigationPath?: string;

  /** Whether to show success notification */
  showSuccessNotification?: boolean;

  /** Advanced creation options */
  advanced?: {
    /** Skip SOURCE directory creation */
    skipSourceCreation?: boolean;

    /** Skip sample content generation */
    skipSampleContent?: boolean;

    /** Use minimal EPUB structure */
    minimalStructure?: boolean;

    /** Custom transform scripts */
    customTransformScripts?: {
      text?: string;
      dom?: string;
    };
  };
}
```

### WorkspaceCreationResult Interface

```typescript
/**
 * Complete result of workspace creation process
 */
interface WorkspaceCreationResult {
  /** Created workspace identifier */
  workspaceId: string;

  /** Workspace metadata */
  metadata: EPUBMetadata;

  /** Locale used for content generation */
  locale: string;

  /** Whether locale uses RTL text direction */
  isRTL: boolean;

  /** EPUB structure results */
  epub: {
    manifestItems: ManifestItem[];
    spineItems: SpineItem[];
    generatedFiles: GeneratedFile[];
    totalSize: number;
  };

  /** SOURCE structure results */
  source: {
    hasSourceStructure: boolean;
    basicSettingsCreated: boolean;
    totalSize: number;
  };

  /** Creation timing and performance */
  performance: {
    totalTime: number;
    contentGenerationTime: number;
    epubBuildTime: number;
    sourceCreationTime: number;
    navigationTime: number;
  };

  /** Navigation information */
  navigation: {
    currentView: string;
    firstSpineItem?: string;
    recommendedStartPath: string;
  };

  /** Creation timestamp */
  createdAt: Date;

  /** Success metrics */
  success: {
    allComponentsSucceeded: boolean;
    warnings: string[];
    recoveredErrors: string[];
  };
}
```

## Public API Methods

### createLocalizedEPUBWorkspace()

```typescript
/**
 * Create complete Active EPUB workspace with localized sample content
 *
 * @param options - Creation customization options
 * @returns Promise resolving to complete creation results
 * @throws WorkspaceCreationError if creation fails
 */
async createLocalizedEPUBWorkspace(
  options: WorkspaceCreationOptions = {}
): Promise<WorkspaceCreationResult> {
  const creationId = generateId();
  const startTime = Date.now();

  // 1. Detect locale

  const locale = options.locale || this.i18nSystem.getCurrentLocale();
  const isRTL = this.i18nSystem.isRTL(locale);

  // 3. Generate workspace ID
  const workspaceId = this.workspaceManager.generateWorkspaceId();

  try {
    // 3. Generate localized content

    const contentStartTime = Date.now();
    const sampleContent = await this.contentGenerator.generateLocalizedContent(locale);
    const contentGenerationTime = Date.now() - contentStartTime;

    // 4. Create complete EPUB workspace structure (includes SOURCE if not skipped)

    const epubStartTime = Date.now();
    const workspaceId = await this.workspaceManager.createLocalizedEPUBWorkspace(
      options.metadata || {},
      locale,
      this.assetGenerator,
      this.sourceManager
    );
    const epubBuildTime = Date.now() - epubStartTime;

    // Note: SOURCE directory creation is now included in createLocalizedEPUBWorkspace
    const sourceCreationTime = 0; // Included in epubBuildTime
    const sourceResult = null; // Not tracked separately anymore

    // 5. Validate complete workspace structure

    const epubValidation = await this.workspaceManager.validateWorkspaceStructure(workspaceId);
    const sourceValidation = await this.sourceManager.validateSourceStructure(workspaceId);

    if (!epubValidation.isValid) {
      throw new WorkspaceCreationError(
        `Invalid EPUB structure: ${epubValidation.errors.join(', ')}`,
        creationId,
        workspaceId
      );
    }

    // 6. Register workspace with WorkspaceManager
    await this.workspaceManager.registerWorkspace(workspaceId, {
      type: 'epub',
      locale,
      isRTL,
      metadata: options.metadata || {},
      createdAt: new Date(),
      hasSourceFiles: true
    });

    // 7. Navigate to appropriate view

    const navigationStartTime = Date.now();
    const navigationTarget = this.determineNavigationTarget(options);
    await this.navigateToWorkspace(workspaceId, navigationTarget);
    const navigationTime = Date.now() - navigationStartTime;

    // 8. Complete creation
    const totalTime = Date.now() - startTime;

    // 9. Show success notification
    if (options.showSuccessNotification !== false) {
      await this.showCreationSuccessNotification(workspaceId, locale, totalTime);
    }

    return {
      workspaceId,
      metadata: options.metadata || {},
      locale,
      isRTL,
      epub: {
        manifestItems: [], // Generated by WorkspaceManager internally
        spineItems: [], // Generated by WorkspaceManager internally
        generatedFiles: [], // Generated by WorkspaceManager internally
        totalSize: 0 // Would need to be queried from workspace
      },
      source: {
        hasSourceStructure: true,
        basicSettingsCreated: true,
        totalSize: 0 // Would need to be queried from SOURCE directory
      },
      performance: {
        totalTime,
        contentGenerationTime,
        epubBuildTime,
        sourceCreationTime,
        navigationTime
      },
      navigation: {
        currentView: navigationTarget.view || 'first-spine-item',
        firstSpineItem: 'prologue', // Default first chapter
        recommendedStartPath: navigationTarget.path || '/workspace/prologue'
      },
      createdAt: new Date(),
      success: {
        allComponentsSucceeded: true,
        warnings: [
          ...epubValidation.warnings,
          ...sourceValidation.warnings
        ],
        recoveredErrors: []
      }
    };

  } catch (error) {
    // Cleanup on failure
    await this.cleanupFailedCreation(workspaceId);


    throw new WorkspaceCreationError(
      `Workspace creation failed: ${error.message}`,
      creationId,
      workspaceId,
      error
    );
  }
}
```

### handleCreateNewWorkspace()

```typescript
/**
 * Enhanced "Create New" button handler with user experience optimizations
 *
 * @param event - Optional event from UI interaction
 * @param options - Creation options
 * @returns Promise that resolves when creation and navigation complete
 */
async handleCreateNewWorkspace(
  event?: Event,
  options: WorkspaceCreationOptions = {}
): Promise<void> {
  // 1. Prevent default if event provided
  if (event) {
    event.preventDefault();
  }

  // 2. Set up default UX options
  const enhancedOptions: WorkspaceCreationOptions = {
    showSuccessNotification: true,
    navigationTarget: 'first-spine-item',
    ...options
  };

  // 3. Show simple loading indicator
  const loadingIndicator = this.showSimpleLoadingIndicator();

  try {
    // 4. Create workspace
    const result = await this.createLocalizedEPUBWorkspace(enhancedOptions);

    // 5. Log success analytics
    this.logCreationSuccess(result);

    // 6. Update recent workspaces
    await this.workspaceManager.addToRecentWorkspaces(result.workspaceId);

  } catch (error) {
    // 7. Show user-friendly error message
    await this.showCreationErrorNotification(error);

    // 8. Log error for debugging
    this.logCreationError(error);

    throw error;

  } finally {
    // 9. Hide loading indicator
    loadingIndicator.hide();
  }
}
```

### getCreationEstimates()

```typescript
/**
 * Get estimated creation time and resource requirements
 *
 * @param locale - Target locale (defaults to current locale)
 * @returns Promise resolving to creation estimates
 */
async getCreationEstimates(locale?: string): Promise<CreationEstimates> {
  const targetLocale = locale || this.i18nSystem.getCurrentLocale();

  // Base estimates (in milliseconds)
  const baseEstimates = {
    contentGeneration: 500,
    epubCreation: 1000,
    sourceCreation: 800,
    validation: 200,
    navigation: 100
  };

  // Adjust for locale complexity
  const localeMultiplier = this.getLocaleComplexityMultiplier(targetLocale);

  // Adjust for system performance
  const performanceMultiplier = await this.getSystemPerformanceMultiplier();

  const adjustedEstimates = Object.entries(baseEstimates).reduce((acc, [key, value]) => {
    acc[key] = Math.round(value * localeMultiplier * performanceMultiplier);
    return acc;
  }, {} as Record<string, number>);

  const totalTime = Object.values(adjustedEstimates).reduce((sum, time) => sum + time, 0);

  return {
    locale: targetLocale,
    estimatedTotalTime: totalTime,
    breakdown: adjustedEstimates,
    resourceRequirements: {
      estimatedStorageSize: this.getEstimatedStorageSize(targetLocale),
      peakMemoryUsage: 10 * 1024 * 1024, // 10MB estimate
      temporaryFiles: 15
    },
    confidence: 0.8, // 80% confidence in estimates
    lastUpdated: new Date()
  };
}

private getLocaleComplexityMultiplier(locale: string): number {
  // RTL languages may take slightly longer due to additional processing
  if (this.i18nSystem.isRTL(locale)) {
    return 1.1;
  }

  // Languages with complex scripts may need more processing
  const complexScriptLocales = ['ja', 'zh-Hant', 'ka'];
  if (complexScriptLocales.includes(locale)) {
    return 1.2;
  }

  return 1.0;
}

private async getSystemPerformanceMultiplier(): Promise<number> {
  // Simple performance test
  const start = performance.now();

  // CPU intensive operation
  for (let i = 0; i < 100000; i++) {
    Math.random();
  }

  const duration = performance.now() - start;

  // Normalize based on expected performance
  // Faster systems get lower multiplier (faster creation)
  if (duration < 10) return 0.8;      // Fast system
  if (duration < 20) return 1.0;      // Normal system
  if (duration < 50) return 1.2;      // Slower system
  return 1.5;                         // Very slow system
}
```

## User Experience Integration

```typescript
/**
 * Show simple loading indicator during workspace creation
 */
private showSimpleLoadingIndicator() {
  const indicator = {
    element: null as HTMLElement | null,

    show() {
      // Create simple loading overlay
      this.element = document.createElement('div');
      this.element.className = 'workspace-creation-loading';
      this.element.innerHTML = `
        <div class="loading-modal">
          <div class="loading-header">
            <h3>Creating your EPUB workspace...</h3>
          </div>
          <div class="loading-content">
            <div class="loading-spinner"></div>
            <div class="loading-message">Please wait...</div>
          </div>
        </div>
      `;

      document.body.appendChild(this.element);
    },

    hide() {
      if (this.element) {
        this.element.remove();
        this.element = null;
      }
    }
  };

  indicator.show();
  return indicator;
}
```

### Navigation Integration

```typescript
/**
 * Determine optimal navigation target after workspace creation
 */
private determineNavigationTarget(
  options: WorkspaceCreationOptions,
  epubResult: EPUBStructureResult
): NavigationTarget {
  // 1. Use explicit navigation target if provided
  if (options.navigationTarget === 'custom' && options.customNavigationPath) {
    return {
      view: 'custom',
      path: options.customNavigationPath
    };
  }

  if (options.navigationTarget && options.navigationTarget !== 'custom') {
    return this.getStandardNavigationTarget(options.navigationTarget, epubResult);
  }

  // 2. Default to first spine item for immediate content preview
  if (epubResult.spineItems.length > 0) {
    const firstSpineItem = epubResult.spineItems[0];
    return {
      view: 'text-editor',
      path: `/workspace/${epubResult.workspaceId}/text/${firstSpineItem.idref}`
    };
  }

  // 3. Fallback to metadata view
  return {
    view: 'metadata',
    path: `/workspace/${epubResult.workspaceId}/metadata`
  };
}

/**
 * Navigate to workspace after creation
 */
private async navigateToWorkspace(
  workspaceId: string,
  target: NavigationTarget
): Promise<void> {
  // 1. Set active workspace
  await this.workspaceManager.setActiveWorkspace(workspaceId);

  // 2. Navigate to target view
  await this.navigationRouter.navigate(target.path);

  // 3. Update browser history
  if (window.history && window.history.pushState) {
    window.history.pushState(
      { workspaceId, view: target.view },
      `EDITME - ${target.view}`,
      target.path
    );
  }
}
```

### Success Notification

```typescript
/**
 * Show success notification after workspace creation
 */
private async showCreationSuccessNotification(
  workspaceId: string,
  locale: string,
  creationTime: number
): Promise<void> {
  const message = await this.i18nSystem.translate('workspace.creation.success', {
    locale,
    time: Math.round(creationTime / 1000)
  });

  // Show notification using existing notification system
  this.notificationSystem.show({
    type: 'success',
    title: await this.i18nSystem.translate('workspace.creation.success.title'),
    message,
    duration: 5000,
    actions: [
      {
        label: await this.i18nSystem.translate('workspace.creation.view.content'),
        action: () => this.navigationRouter.navigate(`/workspace/${workspaceId}/text`)
      },
      {
        label: await this.i18nSystem.translate('workspace.creation.view.manifest'),
        action: () => this.navigationRouter.navigate(`/workspace/${workspaceId}/manifest`)
      }
    ]
  });
}
```

## Error Handling

### Error Types

```typescript
/**
 * Error thrown when workspace creation fails
 */
class WorkspaceCreationError extends Error {
  constructor(
    message: string,
    public readonly creationId: string,
    public readonly workspaceId?: string,
    public readonly cause?: Error
  ) {
    super(message);
    this.name = 'WorkspaceCreationError';
  }
}

/**
 * Error thrown when creation is cancelled
 */
class CreationCancelledError extends Error {
  constructor(public readonly creationId: string) {
    super(`Workspace creation cancelled: ${creationId}`);
    this.name = 'CreationCancelledError';
  }
}
```

### Error Recovery

```typescript
/**
 * Handle creation errors with user-friendly messages and recovery options
 */
private async showCreationErrorNotification(error: Error): Promise<void> {
  let userMessage: string;
  let recoveryActions: NotificationAction[] = [];

  if (error instanceof CreationCancelledError) {
    userMessage = await this.i18nSystem.translate('workspace.creation.cancelled');

  } else if (error instanceof WorkspaceCreationError) {
    userMessage = await this.i18nSystem.translate('workspace.creation.error.general');

    recoveryActions.push({
      label: await this.i18nSystem.translate('workspace.creation.retry'),
      action: () => this.handleCreateNewWorkspace()
    });

  } else {
    userMessage = await this.i18nSystem.translate('workspace.creation.error.unknown');
  }

  // Add debug action in development
  if (process.env.NODE_ENV === 'development') {
    recoveryActions.push({
      label: 'Show Debug Info',
      action: () => console.error('Creation Error Details:', error)
    });
  }

  this.notificationSystem.show({
    type: 'error',
    title: await this.i18nSystem.translate('workspace.creation.error.title'),
    message: userMessage,
    duration: 10000,
    actions: recoveryActions
  });
}

/**
 * Cleanup after failed workspace creation
 */
async cleanupFailedCreation(workspaceId: string): Promise<void> {
  try {
    // Remove workspace from manager
    await this.workspaceManager.deleteWorkspace(workspaceId);

    // Clean up any partial files
    await this.workspaceManager.cleanupWorkspaceFiles(workspaceId);

    // Remove from recent workspaces if added
    await this.workspaceManager.removeFromRecentWorkspaces(workspaceId);

  } catch (cleanupError) {
    console.warn('Failed to cleanup workspace after creation error:', cleanupError);
  }
}
```

## Usage Examples

### Basic Integration with UI

```typescript
// In WorkspaceView component
export class WorkspaceView {
  private workspaceCreation: WorkspaceCreationIntegration;

  constructor() {
    this.workspaceCreation = new WorkspaceCreationIntegration(
      workspaceManager,
      contentGenerator,
      assetGenerator,
      sourceManager,
      i18nSystem,
      navigationRouter
    );
  }

  // Enhanced "Create New" button handler
  async handleCreateNew(event: Event): Promise<void> {
    await this.workspaceCreation.handleCreateNewWorkspace(event, {
      navigationTarget: 'first-spine-item',
    });
  }

  // Advanced creation with custom options
  async handleCreateAdvanced(options: WorkspaceCreationOptions): Promise<void> {
    const result = await this.workspaceCreation.createLocalizedEPUBWorkspace(options);

    // Custom post-creation handling
    this.showWorkspaceSummary(result);
    this.logAnalytics('workspace-created', {
      locale: result.locale,
      creationTime: result.performance.totalTime,
      hasSourceFiles: !!result.source,
    });
  }
}
```

### System Integration Example

```typescript
// Application initialization
export async function initializeWorkspaceCreation(): Promise<WorkspaceCreationIntegration> {
  const integration = new WorkspaceCreationIntegration(
    workspaceManager,
    contentGenerator,
    assetGenerator,
    sourceManager,
    i18nSystem,
    navigationRouter
  );

  // Integration is ready to use - no system validation needed

  return integration;
}
```

### Customized Creation Flow

```typescript
// Custom creation with specific requirements
async function createTechnicalManualWorkspace(): Promise<void> {
  const customOptions: WorkspaceCreationOptions = {
    locale: 'en',
    metadata: {
      title: 'Technical Manual Template',
      creator: ['Technical Writer'],
      subject: ['Technical Documentation', 'Manual', 'Template'],
      description: 'A template for creating technical manuals',
    },
    navigationTarget: 'metadata',
    advanced: {
      customTransformScripts: {
        text: await loadCustomTextTransform('technical-manual'),
        dom: await loadCustomDomTransform('technical-manual'),
      },
    },
  };

  const result = await workspaceCreation.createLocalizedEPUBWorkspace(customOptions);

  // Post-creation customization
  await addTechnicalManualExtensions(result.workspaceId);
  await setCustomStyling(result.workspaceId, 'technical-theme');
}
```

## Testing Specifications

### Integration Tests

```typescript
describe('WorkspaceCreationIntegration', () => {
  test('should create complete workspace for all supported locales', async () => {
    const locales = ['en', 'de', 'ar', 'he', 'ja', 'ka', 'zh-Hant'];

    for (const locale of locales) {
      const result = await integration.createLocalizedEPUBWorkspace({ locale });

      expect(result.workspaceId).toBeTruthy();
      expect(result.locale).toBe(locale);
      expect(result.epub.manifestItems.length).toBeGreaterThan(0);
      expect(result.epub.spineItems.length).toBeGreaterThan(0);
      expect(result.source.hasSourceStructure).toBe(true);
      expect(result.success.allComponentsSucceeded).toBe(true);

      // Verify workspace is accessible
      const workspace = await workspaceManager.getWorkspace(result.workspaceId);
      expect(workspace).toBeDefined();
      expect(workspace.locale).toBe(locale);
    }
  });

  test('should handle creation errors gracefully', async () => {
    // Mock component failure
    const failingContentGenerator = {
      generateLocalizedContent: () => Promise.reject(new Error('Content generation failed')),
    };

    const failingIntegration = new WorkspaceCreationIntegration(
      workspaceManager,
      failingContentGenerator,
      assetGenerator,
      sourceManager,
      i18nSystem,
      navigationRouter
    );

    await expect(failingIntegration.createLocalizedEPUBWorkspace()).rejects.toThrow(
      WorkspaceCreationError
    );

    // Verify no partial workspace remains
    const workspaces = await workspaceManager.listWorkspaces();
    expect(workspaces).toHaveLength(0);
  });

  test('should navigate to correct view after creation', async () => {
    const navigationSpy = jest.spyOn(navigationRouter, 'navigate');

    const result = await integration.createLocalizedEPUBWorkspace({
      navigationTarget: 'first-spine-item',
    });

    expect(navigationSpy).toHaveBeenCalledWith(
      `/workspace/${result.workspaceId}/text/${result.navigation.firstSpineItem}`
    );
  });
});
```

### Performance Tests

```typescript
describe('Performance', () => {
  test('should create workspace within reasonable time', async () => {
    const startTime = Date.now();

    const result = await integration.createLocalizedEPUBWorkspace();

    const actualTime = Date.now() - startTime;
    const reportedTime = result.performance.totalTime;

    expect(actualTime).toBeLessThan(10000); // Under 10 seconds
    expect(Math.abs(actualTime - reportedTime)).toBeLessThan(1000); // Accurate timing
  });

  test('should provide accurate time estimates', async () => {
    const estimates = await integration.getCreationEstimates('en');

    expect(estimates.estimatedTotalTime).toBeGreaterThan(0);
    expect(estimates.confidence).toBeGreaterThan(0.5);
    expect(estimates.breakdown).toHaveProperty('contentGeneration');
    expect(estimates.breakdown).toHaveProperty('epubCreation');

    // Test estimate accuracy
    const startTime = Date.now();
    await integration.createLocalizedEPUBWorkspace();
    const actualTime = Date.now() - startTime;

    const errorMargin =
      Math.abs(actualTime - estimates.estimatedTotalTime) / estimates.estimatedTotalTime;
    expect(errorMargin).toBeLessThan(0.5); // Within 50% of estimate
  });
});
```

### User Experience Tests

```typescript
describe('User Experience', () => {
  // Note: Progress tracking has been simplified - no detailed progress tests needed

  test('should handle button click events correctly', async () => {
    const mockEvent = new Event('click');
    const preventDefaultSpy = jest.spyOn(mockEvent, 'preventDefault');

    await integration.handleCreateNewWorkspace(mockEvent);

    expect(preventDefaultSpy).toHaveBeenCalled();
  });
});
```

## Dependencies

### Required Dependencies

- **WorkspaceManager**: Enhanced with complete EPUB structure creation, localized sample content generation, and transform script installation
- **Translation Content System**: For localized content generation
- **Universal Asset Generator**: For CSS and transform scripts
- **SourceManager**: For SOURCE.zip structure creation (existing API)
- **I18n System**: For locale detection and translations
- **Navigation Router**: For post-creation navigation

### Optional Dependencies

- **Notification System**: For user notifications
- **Analytics System**: For usage tracking
- **Performance Monitor**: For creation timing

## Future Enhancements

### Advanced Creation Options

- **Template System**: Multiple workspace templates (fiction, technical, academic)
- **Custom Content**: User-provided sample content instead of generated
- **Batch Creation**: Create multiple workspaces simultaneously
- **Import-Based Creation**: Create workspace from existing content

### Enhanced User Experience

- **Preview Mode**: Preview workspace before final creation
- **Creation Wizard**: Step-by-step guided creation process
- **Undo Creation**: Reverse workspace creation if not needed
- **Creation History**: Track and revisit previous creation sessions

### Performance Optimization

- **Background Creation**: Create workspaces in background threads
- **Incremental Loading**: Load workspace components progressively
- **Caching Strategy**: Cache generated content and assets
- **Predictive Creation**: Pre-create workspaces based on usage patterns

## WorkspaceManager Enhancements

To support the simplified SOURCE management and EPUB structure building approach, the existing WorkspaceManager requires the following enhancements:

### Enhanced Workspace Creation

```typescript
/**
 * Enhanced WorkspaceManager methods for creating complete EPUB workspaces
 */
interface EnhancedWorkspaceManager extends WorkspaceManager {
  /**
   * Create complete EPUB workspace with localized content and full structure
   */
  async createLocalizedEPUBWorkspace(
    metadata: EPUBMetadata,
    locale: string,
    assetGenerator: UniversalAssetGenerator,
    sourceManager: SourceManager
  ): Promise<string>;
}
```

### Implementation Requirements

#### 1. Complete EPUB Structure Creation

- Create standard EPUB directory structure (mimetype, META-INF/, OEBPS/)
- Use existing `opfUtils.generateContainerXML()` for container.xml
- Use existing `updateWorkspaceOPF()` method for content.opf generation
- Generate simple hardcoded nav.xhtml with localized "Table of Contents" title

#### 2. Localized Sample Content Generation

- Generate sample text files appropriate for the locale (chapter1.txt, prologue.txt, etc.)
- Transform to XHTML using existing transform pipeline (`TransformExecutor`)
- Use existing `generateXHTMLDocument()` for XHTML wrapping
- Create content in the target language with proper text direction

#### 3. Transform Script Installation

- Install transformText.js and transformDOM.js from Universal Asset Generator
- Place scripts in SOURCE/scripts/ directory
- Ensure scripts are compatible with existing transform pipeline

#### 4. Basic Settings.json Creation

- Create minimal settings.json with transform configuration only
- Include transform script references and basic enabled/disabled flags
- Exclude editor preferences and locale info (handled elsewhere)

#### 5. Integration Points

- Use existing SourceManager.initializeSourceStructure() for SOURCE directory creation
- Use existing transform pipeline instead of custom transform execution
- Use existing XHTML template system for document generation
- Coordinate with Universal Asset Generator for CSS and script content

### Sample Implementation

```typescript
async createLocalizedEPUBWorkspace(
  metadata: EPUBMetadata,
  locale: string,
  assetGenerator: UniversalAssetGenerator,
  sourceManager: SourceManager
): Promise<string> {
  // 1. Create basic EPUB workspace structure
  const workspaceId = await this.createWorkspace(metadata);

  // 2. Create standard EPUB directory structure
  await this.createEPUBStructure(workspaceId);

  // 3. Generate localized sample content
  const sampleContent = this.generateLocalizedSampleContent(locale);

  // 4. Transform sample content to XHTML files
  const transformExecutor = new TransformExecutor();
  const assetBundle = await assetGenerator.generateAssetBundle();

  for (const [filename, content] of Object.entries(sampleContent)) {
    // Transform text to HTML
    const transformedText = await transformExecutor.executeTextTransform(
      assetBundle.transformText.content,
      'transformText.js',
      content,
      { locale }
    );

    // Transform DOM and wrap in XHTML
    const transformedDOM = await transformExecutor.executeDOMTransform(
      assetBundle.transformDom.content,
      'transformDom.js',
      new DOMParser().parseFromString(transformedText, 'text/html')
    );

    const xhtmlContent = generateXHTMLDocument(
      transformedDOM.documentElement.innerHTML,
      { title: this.getChapterTitle(filename, locale), language: locale }
    );

    // Write XHTML file
    const chapterId = filename.replace('.txt', '');
    await this.storage.writeTextFile(workspaceId, `OEBPS/Text/${chapterId}.xhtml`, xhtmlContent);

    // Write SOURCE text file
    await this.storage.writeTextFile(workspaceId, `SOURCE/text/${filename}`, content);
  }

  // 5. Create navigation document
  const navContent = this.generateSimpleNavDocument(locale, Object.keys(sampleContent));
  await this.storage.writeTextFile(workspaceId, 'OEBPS/Text/nav.xhtml', navContent);

  // 6. Install CSS and update OPF
  await this.storage.writeTextFile(workspaceId, 'OEBPS/Styles/page.css', assetBundle.css.content);
  await this.updateWorkspaceOPF(workspaceId, { language: locale, chapters: Object.keys(sampleContent) });

  // 7. Install transform scripts in SOURCE
  await this.storage.writeTextFile(workspaceId, 'SOURCE/scripts/transformText.js', assetBundle.transformText.content);
  await this.storage.writeTextFile(workspaceId, 'SOURCE/scripts/transformDom.js', assetBundle.transformDom.content);

  // 8. Create basic settings.json
  const basicSettings = {
    version: '1.0.0',
    transforms: {
      text: { script: 'transformText.js', enabled: true },
      dom: { script: 'transformDom.js', enabled: true }
    }
  };
  await this.storage.writeTextFile(workspaceId, 'SOURCE/settings.json', JSON.stringify(basicSettings, null, 2));

  // 9. Initialize remaining SOURCE structure
  await sourceManager.initializeSourceStructure(workspaceId);

  return workspaceId;
}

private async createEPUBStructure(workspaceId: string): Promise<void> {
  // Create standard EPUB directory structure
  await this.storage.writeTextFile(workspaceId, 'mimetype', 'application/epub+zip');

  // Create container.xml using existing utility
  const containerXML = opfUtils.generateContainerXML();
  await this.storage.writeTextFile(workspaceId, 'META-INF/container.xml', containerXML);

  // Create directories
  await this.storage.createDirectory(workspaceId, 'OEBPS/Text');
  await this.storage.createDirectory(workspaceId, 'OEBPS/Styles');
}

private generateLocalizedSampleContent(locale: string): Record<string, string> {
  // Generate sample content based on locale
  // This would contain the actual localization logic
  return {
    'prologue.txt': this.getLocalizedPrologue(locale),
    'chapter1.txt': this.getLocalizedChapter1(locale),
    'appendix.txt': this.getLocalizedAppendix(locale)
  };
}

private generateSimpleNavDocument(locale: string, chapterFiles: string[]): string {
  const tocTitle = this.getLocalizedTOCTitle(locale);
  const isRTL = this.isRTLLocale(locale);

  const tocEntries = chapterFiles.map(filename => {
    const chapterId = filename.replace('.txt', '');
    const chapterTitle = this.getChapterTitle(filename, locale);
    return `<li><a href="${chapterId}.xhtml">${chapterTitle}</a></li>`;
  }).join('\n      ');

  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops"
      lang="${locale}"${isRTL ? ' dir="rtl"' : ''}>
<head>
  <meta charset="UTF-8"/>
  <title>Navigation</title>
  <link rel="stylesheet" type="text/css" href="../Styles/page.css"/>
</head>
<body>
  <nav epub:type="toc" id="toc">
    <h1>${tocTitle}</h1>
    <ol>
      ${tocEntries}
    </ol>
  </nav>
</body>
</html>`;
}

private getLocalizedTOCTitle(locale: string): string {
  const titles = {
    'en': 'Table of Contents',
    'de': 'Inhaltsverzeichnis',
    'fr': 'Table des matières',
    'es': 'Índice',
    'ar': 'فهرس المحتويات',
    'he': 'תוכן עניינים',
    'ja': '目次',
    'zh-Hant': '目錄'
  };
  return titles[locale] || titles['en'];
}
```

This API documentation provides the foundation for implementing a comprehensive workspace creation system that orchestrates all components to deliver an exceptional user experience with localized, functional Active EPUB workspaces.
