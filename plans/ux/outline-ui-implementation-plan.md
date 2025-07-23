# Outline UI Implementation Plan

## Overview

This document breaks down the Outline UI implementation into smaller, test-driven development (TDD) friendly pieces. Each phase can be developed and tested in isolation before integration, ensuring solid progression and maintainable code.

## Implementation Strategy

- **Test-First Development**: Write tests before implementation for each component
- **Isolated Development**: Each piece can be developed independently with mocked dependencies
- **Incremental Integration**: Components integrate one at a time with existing system
- **Clear Dependencies**: Each phase has explicit dependency requirements

## Phase Breakdown

### Phase 1: Core Utilities (No UI Dependencies)

#### 1.1 ✅ ContentPreview Component (COMPLETED)
**Location**: `src/lib/components/preview/ContentPreview.svelte`

**✅ Implementation Completed:**
- Device-aware XHTML preview with 6 device types (iPhone SE to iPad Pro 13")
- Iframe-based rendering with complete XHTML document support
- CSS injection system for device-specific styles and font families
- Real-time scaling algorithm with aspect ratio preservation
- Orientation toggle (portrait/landscape) with dimension swapping
- Font controls: family selection and size adjustment
- Responsive mode for full-width preview
- **Isolated**: No workspace dependencies, pure display component

**✅ Testing Completed:**
- Comprehensive Storybook testing with 12 interactive scenarios
- Real browser behavior testing (iframe rendering, CSS transforms)
- Device simulation, content rendering, and user interaction testing
- Complete API documentation with usage examples

**✅ Acceptance Criteria Met:**
- ✅ Renders valid XHTML navigation documents in iframe with device simulation
- ✅ Handles empty/invalid content without breaking
- ✅ Reactive to prop changes with real-time updates
- ✅ Reusable design for other features (extends beyond navigation to any XHTML content)

**✅ Completed**: ContentPreview provides enhanced functionality beyond original NavigationPreview specification

#### 1.2 OutlineGenerator Utility Service
**Location**: `src/lib/outline/OutlineGenerator.ts`

**Test-First Approach:**
- Create `OutlineGenerator.test.ts` with spine item mocking
- Test auto-generation: `generateFromSpine(mockSpineItems)` → valid XHTML
- Test metadata creation for navigation documents
- Test edge cases (empty spine, missing titles)

**Implementation:**
- Static method `generateFromSpine(spineItems)`
- Creates navigation-specific `ChapterMetadata` objects
- Generates complete EPUB navigation XHTML
- **Isolated**: Static methods, no UI or workspace state

**Acceptance Criteria:**
- ✅ Generates valid EPUB navigation from spine items
- ✅ Creates proper navigation metadata
- ✅ Handles empty/invalid spine data
- ✅ Produces EPUB-compliant XHTML structure

**Estimated Time**: 1-2 days

### Phase 2: Transform Pipeline Integration

#### 2.1 OutlineGenerator + Transform Pipeline Integration
**Location**: Extend existing `OutlineGenerator.ts`

**Test-First Approach:**
- Extend `OutlineGenerator.test.ts` with transform pipeline mocking
- Test `processUserContent()` with mock `TransformPipeline`
- Test error handling with `TransformError` scenarios
- Test library integration via mock `BlobUrlManager`

**Implementation:**
- Add method `processUserContent(navText, transformPipeline, workspaceId)`
- Integrate with existing `TransformPipeline` class
- Handle `TransformError` instances appropriately
- Support extension libraries via `BlobUrlManager`

**Dependencies**: 
- Mock `FileStorageAPI`
- Mock `BlobUrlManager` 
- Mock `TransformPipeline`

**Acceptance Criteria:**
- ✅ Processes user content through transform pipeline
- ✅ Handles transform errors gracefully
- ✅ Integrates with extension libraries
- ✅ Returns valid XHTML documents

**Estimated Time**: 2-3 days

### Phase 3: Editor Component

#### 3.1 OutlineEditor Component
**Location**: `src/lib/outline/OutlineEditor.svelte`

**Test-First Approach:**
- Create `OutlineEditor.test.ts` with user interaction tests
- Test textarea input handling and event emission
- Test debouncing behavior
- Test empty state detection (`content.trim() === ''`)
- Test placeholder text display

**Implementation:**
- Simple textarea for `nav.txt` content editing
- Debounced input handling to prevent rapid saves
- Placeholder text explaining auto-generation when empty
- Event emission for content changes
- **Isolated**: Simple form component with clear interface

**Acceptance Criteria:**
- ✅ Textarea handles user input correctly
- ✅ Debounced events prevent excessive updates
- ✅ Empty state detection triggers auto-generation
- ✅ Placeholder text guides user behavior

**Estimated Time**: 2-3 days

### Phase 4: Coordination Layer

#### 4.1 OutlineView Integration Component
**Location**: `src/lib/outline/OutlineView.svelte`

**Test-First Approach:**
- Create `OutlineView.test.ts` with full integration mocking
- Test mode switching (empty → auto-gen, typing → manual)
- Test file I/O operations with workspace APIs
- Test coordination between editor and preview
- Test error state handling

**Implementation:**
- Coordinates OutlineEditor and NavigationPreview
- Manages auto-generation vs manual mode switching
- Handles workspace file operations for `nav.txt` and `nav.xhtml`
- Integrates with transform pipeline for user content
- Manages OPF manifest registration

**Dependencies**: 
- Mock `workspaceManager`
- Mock `spineItemManager`
- Mock `TransformPipeline`
- Real `OutlineEditor` and `NavigationPreview` components

**Acceptance Criteria:**
- ✅ Switches between auto-generation and manual modes
- ✅ Coordinates editor and preview updates
- ✅ Handles workspace file operations correctly
- ✅ Manages transform pipeline integration
- ✅ Registers navigation in OPF manifest

**Estimated Time**: 2-3 days

### Phase 5: Layout Integration

#### 5.1 LayoutManager Integration
**Location**: Integration with existing `LayoutManager.svelte`

**Test-First Approach:**
- Create integration test with real `LayoutManager`
- Test split-pane behavior and responsive layout
- Test left-content and right-content slot usage
- Test header integration

**Implementation:**
- Integrate OutlineView with LayoutManager slots
- Use `left-content` slot for OutlineEditor
- Use `right-content` slot for NavigationPreview
- Optional `left-header` for minimal controls
- Standard responsive behavior

**Integration Dependencies**: 
- Real `LayoutManager` component
- Real split-pane behavior

**Acceptance Criteria:**
- ✅ Proper LayoutManager slot integration
- ✅ Split-pane resizing works correctly
- ✅ Responsive layout behavior
- ✅ Consistent with other editing interfaces

**Estimated Time**: 1 day

## Implementation Timeline

### Week 1: Foundation Components
**✅ Days 1-2**: ContentPreview component (COMPLETED)
- ✅ TDD: Comprehensive Storybook testing with 12 scenarios
- ✅ Implementation: Device-aware iframe XHTML rendering with scaling
- ✅ Integration: Isolated component with enhanced functionality

**Days 3-4**: OutlineGenerator spine generation  
- TDD: Write spine-to-navigation tests
- Implementation: Static generation methods
- Integration: None required (pure utility)

### Week 2: Transform Integration
**Days 5-7**: OutlineGenerator + Transform Pipeline
- TDD: Write transform pipeline integration tests
- Implementation: User content processing methods
- Integration: Mock transform pipeline dependencies

### Week 3: Editor Component
**Days 8-10**: OutlineEditor component
- TDD: Write user interaction and debouncing tests
- Implementation: Textarea with smart behavior
- Integration: Event-based interface design

### Week 4: System Integration
**Days 11-13**: OutlineView coordination
- TDD: Write full workflow integration tests
- Implementation: Component coordination and workspace I/O
- Integration: Real component assembly with mocked services

**Day 14**: LayoutManager integration
- TDD: Write layout integration tests
- Implementation: Slot-based integration
- Integration: Real layout system integration

## Testing Strategy

### Unit Testing
- Each component tested in isolation with mocked dependencies
- Focus on component behavior and interface contracts
- Comprehensive edge case coverage

### Integration Testing  
- Test component interactions with real implementations
- Verify workspace API integration
- Test transform pipeline integration

### End-to-End Testing
- Complete workflow testing (empty → auto-gen → manual → transform)
- Test error scenarios and recovery
- Verify EPUB compliance of generated navigation

## Success Criteria

### Technical Requirements
- ✅ All components pass comprehensive test suites
- ✅ Zero TypeScript errors maintained throughout development
- ✅ Clean separation of concerns between components
- ✅ Proper error handling and user messaging
- ✅ EPUB-compliant navigation generation

### Integration Requirements
- ✅ Seamless LayoutManager integration
- ✅ Consistent with existing EDITME design patterns
- ✅ Transform pipeline integration working correctly
- ✅ Workspace file operations functioning properly

### User Experience Requirements
- ✅ Intuitive auto-generation when editor is empty
- ✅ Smooth transition to manual editing mode
- ✅ Real-time preview updates
- ✅ Clear error messaging for transform failures

## Risk Mitigation

### Technical Risks
- **Transform Pipeline Complexity**: Phase 2 isolates this integration with comprehensive mocking
- **Layout Integration Issues**: Phase 5 defers layout concerns until components are solid
- **Workspace API Changes**: Mock-based testing allows adaptation to API changes

### Timeline Risks
- **Component Dependencies**: Each phase can be developed independently
- **Integration Challenges**: Incremental integration reduces big-bang risks
- **Testing Overhead**: TDD approach catches issues early, reducing debugging time

## Next Steps

1. **✅ Phase 1.1 Complete**: ContentPreview component implemented with enhanced device simulation capabilities
2. **✅ Testing Patterns Established**: Storybook-based testing approach validated and documented
3. **Current Focus - Phase 1.2**: Implement OutlineGenerator utility service for spine-to-navigation conversion
4. **Document API Contracts**: Define clear interfaces between components during development
5. **Regular Integration**: Test component interactions frequently as development progresses

---

This plan provides a clear roadmap for implementing the Outline UI with solid testing coverage and manageable complexity at each step.