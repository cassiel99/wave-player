import { create } from 'zustand'
import { Track } from '../types'

interface LibraryStore {
  localTracks: Track[]
  isScanning: boolean
  scanError: string | null
  directories: string[]
  lastScanned: number | null

  setLocalTracks: (tracks: Track[]) => void
  setScanning: (scanning: boolean) => void
  setScanError: (error: string | null) => void
  setDirectories: (dirs: string[]) => void
  addTracks: (tracks: Track[]) => void
  setLastScanned: (time: number) => void
}

export const useLibraryStore = create<LibraryStore>((set) => ({
  localTracks: [],
  isScanning: false,
  scanError: null,
  directories: [],
  lastScanned: null,

  setLocalTracks: (tracks) => set({ localTracks: tracks }),
  setScanning: (scanning) => set({ isScanning: scanning }),
  setScanError: (error) => set({ scanError: error }),
  setDirectories: (dirs) => set({ directories: dirs }),
  addTracks: (tracks) =>
    set((s) => {
      const existing = new Set(s.localTracks.map((t) => t.id))
      const newTracks = tracks.filter((t) => !existing.has(t.id))
      return { localTracks: [...s.localTracks, ...newTracks] }
    }),
  setLastScanned: (time) => set({ lastScanned: time }),
}))
