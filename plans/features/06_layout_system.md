# 06. Layout System

## Overview
Implements the main application layout with collapsible sidebar and resizable panels, supporting both mouse and touch interactions with state persistence.

## Requirements
- Collapsible left sidebar
- Resizable panels with mouse and touch support
- Minimum/maximum panel sizes
- State persistence for panel positions

## Dependencies
- None (UI foundation feature)

## Technical Approach
- CSS Grid or Flexbox for main layout structure
- JavaScript event handling for resize interactions
- LocalStorage for state persistence
- Touch event support for mobile devices

## API Design
```typescript
interface LayoutSystem {
  // Sidebar management
  toggleSidebar(): void
  setSidebarCollapsed(collapsed: boolean): void
  getSidebarState(): boolean
  
  // Panel resizing
  initializeResizer(element: HTMLElement): void
  setPanelSizes(leftWidth: number, rightWidth: number): void
  getPanelSizes(): { left: number, right: number }
  
  // State persistence
  saveLayoutState(): void
  loadLayoutState(): void
  resetToDefaults(): void
}

interface LayoutConfig {
  sidebarWidth: number
  sidebarCollapsed: boolean
  leftPaneWidth: number
  rightPaneWidth: number
  minPaneWidth: number
  maxPaneWidth: number
}
```

## Layout Structure
```html
<div class="app-layout">
  <aside class="sidebar" class:collapsed={sidebarCollapsed}>
    <!-- Navigation and workspace selector -->
  </aside>
  
  <main class="main-content">
    <div class="left-pane" style="width: {leftPaneWidth}px">
      <!-- Content lists, text editor -->
    </div>
    
    <div class="resize-handle" 
         on:mousedown={startResize}
         on:touchstart={startResize}>
    </div>
    
    <div class="right-pane" style="width: {rightPaneWidth}px">
      <!-- Preview, metadata forms -->
    </div>
  </main>
</div>
```

## Resize Interaction Handling
- Mouse events: mousedown, mousemove, mouseup
- Touch events: touchstart, touchmove, touchend
- Prevent text selection during resize
- Visual feedback during resize operation
- Smooth animations for state changes

## Responsive Behavior
- Minimum panel widths (e.g., 200px)
- Maximum panel widths (e.g., 80% of viewport)
- Handle small screen sizes gracefully
- Collapse sidebar automatically on mobile
- Stack panels vertically on very small screens

## State Persistence
```typescript
interface LayoutState {
  sidebarCollapsed: boolean
  sidebarWidth: number
  leftPaneWidth: number
  rightPaneWidth: number
  version: number  // for migration
}

const STORAGE_KEY = 'editme-layout-state'
```

## CSS Implementation
```css
.app-layout {
  display: grid;
  grid-template-columns: var(--sidebar-width) 1fr;
  height: 100vh;
}

.sidebar {
  background: var(--sidebar-bg);
  transition: width 0.3s ease;
}

.sidebar.collapsed {
  width: 0;
  overflow: hidden;
}

.main-content {
  display: flex;
  min-width: 0; /* Allow flex items to shrink */
}

.resize-handle {
  width: 4px;
  background: var(--border-color);
  cursor: col-resize;
  user-select: none;
}

.resize-handle:hover {
  background: var(--accent-color);
}
```

## Touch Support
- Handle touch events alongside mouse events
- Prevent scrolling during resize on touch devices
- Larger touch targets for resize handles
- Visual feedback for touch interactions

## Accessibility
- Keyboard navigation support
- Screen reader announcements for layout changes
- Focus management during layout transitions
- ARIA labels for interactive elements

## Error Handling
- Invalid layout state recovery
- Viewport size change adaptation
- Storage quota issues for state persistence
- Malformed saved layout data

## Performance Considerations
- Debounce resize events
- Use CSS transforms for smooth animations
- Minimize layout recalculations
- Efficient event listener management

## Testing Considerations
- Test resize functionality with mouse and touch
- Test sidebar collapse/expand
- Test state persistence across sessions
- Test responsive behavior at different screen sizes
- Test accessibility features
- Test edge cases (very small/large panels)

## Implementation Notes
- Start with basic grid/flex layout
- Add resize functionality incrementally
- Implement touch support early
- Test on multiple devices and browsers
- Consider using CSS custom properties for dynamic sizing