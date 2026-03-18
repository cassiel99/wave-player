import { create } from 'zustand'
import { Track, RepeatMode } from '../types'

interface PlayerStore {
  currentTrack: Track | null
  queue: Track[]
  queueIndex: number
  isPlaying: boolean
  progress: number
  duration: number
  volume: number
  isMuted: boolean
  repeat: RepeatMode
  shuffle: boolean
  isLoading: boolean
  shuffleOrder: number[]

  // Actions
  setTrack: (track: Track, queue?: Track[], index?: number) => void
  playTrack: (track: Track, queue?: Track[]) => void
  togglePlay: () => void
  setPlaying: (playing: boolean) => void
  next: () => Track | null
  prev: () => Track | null
  setProgress: (progress: number) => void
  setDuration: (duration: number) => void
  setVolume: (volume: number) => void
  toggleMute: () => void
  toggleRepeat: () => void
  toggleShuffle: () => void
  setLoading: (loading: boolean) => void
  addToQueue: (track: Track) => void
  removeFromQueue: (index: number) => void
  clearQueue: () => void
  setQueue: (tracks: Track[], startIndex?: number) => void
  jumpToIndex: (index: number) => Track | null
}

function generateShuffleOrder(length: number, currentIndex: number): number[] {
  const arr = Array.from({ length }, (_, i) => i).filter((i) => i !== currentIndex)
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return [currentIndex, ...arr]
}

export const usePlayerStore = create<PlayerStore>((set, get) => ({
  currentTrack: null,
  queue: [],
  queueIndex: 0,
  isPlaying: false,
  progress: 0,
  duration: 0,
  volume: 0.8,
  isMuted: false,
  repeat: 'none',
  shuffle: false,
  isLoading: false,
  shuffleOrder: [],

  setTrack: (track, queue?, index = 0) => {
    const q = queue || get().queue
    set({
      currentTrack: track,
      queue: q,
      queueIndex: index,
      progress: 0,
      isLoading: true,
      shuffleOrder: generateShuffleOrder(q.length, index),
    })
  },

  playTrack: (track, queue?) => {
    const q = queue || [track]
    const index = q.findIndex((t) => t.id === track.id)
    set({
      currentTrack: track,
      queue: q,
      queueIndex: Math.max(0, index),
      isPlaying: true,
      progress: 0,
      isLoading: true,
      shuffleOrder: generateShuffleOrder(q.length, Math.max(0, index)),
    })
  },

  togglePlay: () => set((s) => ({ isPlaying: !s.isPlaying })),
  setPlaying: (playing) => set({ isPlaying: playing }),

  next: () => {
    const { queue, queueIndex, repeat, shuffle, shuffleOrder } = get()
    if (!queue.length) return null

    if (repeat === 'one') {
      return get().currentTrack
    }

    let nextIndex: number
    if (shuffle && shuffleOrder.length > 0) {
      const currentPos = shuffleOrder.indexOf(queueIndex)
      const nextPos = (currentPos + 1) % shuffleOrder.length
      nextIndex = shuffleOrder[nextPos]
    } else {
      nextIndex = queueIndex + 1
      if (nextIndex >= queue.length) {
        if (repeat === 'all') nextIndex = 0
        else return null
      }
    }

    const nextTrack = queue[nextIndex]
    set({
      currentTrack: nextTrack,
      queueIndex: nextIndex,
      progress: 0,
      isLoading: true,
    })
    return nextTrack
  },

  prev: () => {
    const { queue, queueIndex, progress } = get()
    if (!queue.length) return null

    // If played more than 3s, restart current
    if (progress > 3) {
      set({ progress: 0 })
      return get().currentTrack
    }

    const prevIndex = Math.max(0, queueIndex - 1)
    const prevTrack = queue[prevIndex]
    set({
      currentTrack: prevTrack,
      queueIndex: prevIndex,
      progress: 0,
      isLoading: true,
    })
    return prevTrack
  },

  setProgress: (progress) => set({ progress }),
  setDuration: (duration) => set({ duration }),

  setVolume: (volume) => set({ volume: Math.max(0, Math.min(1, volume)), isMuted: false }),
  toggleMute: () => set((s) => ({ isMuted: !s.isMuted })),

  toggleRepeat: () =>
    set((s) => ({
      repeat: s.repeat === 'none' ? 'all' : s.repeat === 'all' ? 'one' : 'none',
    })),

  toggleShuffle: () =>
    set((s) => ({
      shuffle: !s.shuffle,
      shuffleOrder: generateShuffleOrder(s.queue.length, s.queueIndex),
    })),

  setLoading: (loading) => set({ isLoading: loading }),

  addToQueue: (track) => set((s) => ({ queue: [...s.queue, track] })),

  removeFromQueue: (index) =>
    set((s) => {
      const newQueue = s.queue.filter((_, i) => i !== index)
      const newIndex = index < s.queueIndex ? s.queueIndex - 1 : s.queueIndex
      return { queue: newQueue, queueIndex: Math.max(0, newIndex) }
    }),

  clearQueue: () => set({ queue: [], queueIndex: 0 }),

  setQueue: (tracks, startIndex = 0) =>
    set({
      queue: tracks,
      queueIndex: startIndex,
      currentTrack: tracks[startIndex] || null,
      progress: 0,
      isLoading: true,
      shuffleOrder: generateShuffleOrder(tracks.length, startIndex),
    }),

  jumpToIndex: (index) => {
    const { queue } = get()
    if (index < 0 || index >= queue.length) return null
    const track = queue[index]
    set({
      currentTrack: track,
      queueIndex: index,
      progress: 0,
      isLoading: true,
    })
    return track
  },
}))
