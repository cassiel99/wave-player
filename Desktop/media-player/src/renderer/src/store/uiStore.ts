import { create } from 'zustand'
import { View } from '../types'

interface UIStore {
  currentView: View
  viewData: Record<string, unknown>
  sidebarCollapsed: boolean
  showQueue: boolean
  showSearch: boolean
  searchQuery: string
  activeModal: string | null

  setView: (view: View, data?: Record<string, unknown>) => void
  setSidebarCollapsed: (collapsed: boolean) => void
  toggleSidebar: () => void
  setShowQueue: (show: boolean) => void
  toggleQueue: () => void
  setShowSearch: (show: boolean) => void
  setSearchQuery: (q: string) => void
  openModal: (modal: string) => void
  closeModal: () => void
}

export const useUIStore = create<UIStore>((set) => ({
  currentView: 'home',
  viewData: {},
  sidebarCollapsed: false,
  showQueue: false,
  showSearch: false,
  searchQuery: '',
  activeModal: null,

  setView: (view, data = {}) => set({ currentView: view, viewData: data }),
  setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  setShowQueue: (show) => set({ showQueue: show }),
  toggleQueue: () => set((s) => ({ showQueue: !s.showQueue })),
  setShowSearch: (show) => set({ showSearch: show }),
  setSearchQuery: (q) => set({ searchQuery: q }),
  openModal: (modal) => set({ activeModal: modal }),
  closeModal: () => set({ activeModal: null }),
}))
