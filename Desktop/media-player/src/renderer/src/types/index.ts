export type TrackSource = 'local' | 'vk' | 'yandex'

export interface Track {
  id: string
  source: TrackSource
  title: string
  artist: string
  album: string
  albumId?: string | number
  duration: number
  cover: string | null
  url?: string // direct URL (VK) or will be fetched (Yandex)
  filePath?: string // local files
  year?: number | null
  genre?: string
  liked?: boolean
  // VK specific
  vkOwnerId?: number
  vkId?: number
  // Yandex specific
  yandexId?: number
}

export interface Playlist {
  id: string
  source: TrackSource
  title: string
  cover: string | null
  trackCount: number
  // VK specific
  vkOwnerId?: number
  vkId?: number
  // Yandex specific
  yandexUid?: number
  yandexKind?: number
}

export interface Album {
  id: string
  source: TrackSource
  title: string
  artist: string
  year?: number
  cover: string | null
  trackCount: number
}

export interface Artist {
  id: string
  source: TrackSource
  name: string
  cover: string | null
}

export type RepeatMode = 'none' | 'one' | 'all'

export interface PlayerState {
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
}

export type View =
  | 'home'
  | 'local'
  | 'local-albums'
  | 'local-artists'
  | 'local-playlists'
  | 'vk-feed'
  | 'vk-library'
  | 'vk-playlists'
  | 'vk-search'
  | 'vk-recommendations'
  | 'yandex-likes'
  | 'yandex-playlists'
  | 'yandex-stations'
  | 'yandex-search'
  | 'queue'
  | 'search'
  | 'settings'
  | 'playlist-detail'

export interface VKUser {
  id: number
  first_name: string
  last_name: string
  photo_100: string
  photo_200: string
}

export interface YandexAccount {
  uid: number
  login: string
  full_name: string
  display_name: string
}

export interface YandexStation {
  station: {
    id: { type: string; tag: string }
    name: string
    icon?: { imageUrl: string }
  }
}

// Helper to get cover URL from Yandex
export function yandexCover(uri?: string, size = 300): string | null {
  if (!uri) return null
  return `https://${uri.replace('%%', `${size}x${size}`)}`
}

// Format duration from seconds
export function formatDuration(seconds: number): string {
  if (!seconds || isNaN(seconds) || !isFinite(seconds)) return '0:00'
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

// Format file size
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
