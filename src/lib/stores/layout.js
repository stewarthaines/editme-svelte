import { writable } from 'svelte/store'

// Storage keys for persistence
const STORAGE_KEYS = {
  SIDEBAR_EXPANDED: 'editme_sidebar_expanded',
  SIDEBAR_SECTION: 'editme_sidebar_section'
}

// Default layout state
const DEFAULT_STATE = {
  sidebar: {
    isExpanded: true,
    activeSection: 'workspace'
  },
  isInitialized: false
}

// Create the writable store
function createLayoutStore() {
  const { subscribe, set, update } = writable(DEFAULT_STATE)
  
  return {
    subscribe,
    
    // Initialize from localStorage
    initialize() {
      let savedExpanded = DEFAULT_STATE.sidebar.isExpanded
      let savedSection = DEFAULT_STATE.sidebar.activeSection
      
      try {
        const expandedValue = localStorage.getItem(STORAGE_KEYS.SIDEBAR_EXPANDED)
        if (expandedValue) {
          savedExpanded = JSON.parse(expandedValue)
        }
      } catch (error) {
        // Ignore localStorage errors and use default
        console.warn('Failed to load sidebar expanded state:', error)
      }
      
      try {
        const sectionValue = localStorage.getItem(STORAGE_KEYS.SIDEBAR_SECTION)
        if (sectionValue) {
          savedSection = sectionValue
        }
      } catch (error) {
        // Ignore localStorage errors and use default
        console.warn('Failed to load sidebar section:', error)
      }
      
      update(state => ({
        ...state,
        sidebar: {
          isExpanded: savedExpanded,
          activeSection: savedSection
        },
        isInitialized: true
      }))
    },
    
    // Toggle sidebar expanded/collapsed
    toggleSidebar() {
      update(state => {
        const newExpanded = !state.sidebar.isExpanded
        
        try {
          localStorage.setItem(STORAGE_KEYS.SIDEBAR_EXPANDED, JSON.stringify(newExpanded))
        } catch (error) {
          console.warn('Failed to save sidebar expanded state:', error)
        }
        
        return {
          ...state,
          sidebar: {
            ...state.sidebar,
            isExpanded: newExpanded
          }
        }
      })
    },
    
    // Set active sidebar section
    setSidebarSection(section) {
      update(state => {
        try {
          localStorage.setItem(STORAGE_KEYS.SIDEBAR_SECTION, section)
        } catch (error) {
          console.warn('Failed to save sidebar section:', error)
        }
        
        return {
          ...state,
          sidebar: {
            ...state.sidebar,
            activeSection: section
          }
        }
      })
    }
  }
}

export const layoutStore = createLayoutStore()

// Initialize on first import (browser only)
if (typeof window !== 'undefined') {
  layoutStore.initialize()
}