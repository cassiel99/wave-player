import { create } from 'zustand'
import { VKUser, YandexAccount, Track, Playlist } from '../types'

interface ServicesStore {
  // VK
  vkUser: VKUser | null
  vkToken: string | null
  vkTracks: Track[]
  vkPlaylists: Playlist[]
  vkLoading: boolean
  vkError: string | null

  // Yandex
  yandexAccount: YandexAccount | null
  yandexToken: string | null
  yandexLikes: Track[]
  yandexPlaylists: Playlist[]
  yandexLoading: boolean
  yandexError: string | null

  // Actions
  setVKUser: (user: VKUser | null, token?: string) => void
  setVKTracks: (tracks: Track[]) => void
  setVKPlaylists: (playlists: Playlist[]) => void
  setVKLoading: (loading: boolean) => void
  setVKError: (error: string | null) => void
  logoutVK: () => void

  setYandexAccount: (account: YandexAccount | null, token?: string) => void
  setYandexLikes: (tracks: Track[]) => void
  setYandexPlaylists: (playlists: Playlist[]) => void
  setYandexLoading: (loading: boolean) => void
  setYandexError: (error: string | null) => void
  logoutYandex: () => void
}

export const useServicesStore = create<ServicesStore>((set) => ({
  vkUser: null,
  vkToken: null,
  vkTracks: [],
  vkPlaylists: [],
  vkLoading: false,
  vkError: null,

  yandexAccount: null,
  yandexToken: null,
  yandexLikes: [],
  yandexPlaylists: [],
  yandexLoading: false,
  yandexError: null,

  setVKUser: (user, token) => set({ vkUser: user, vkToken: token || null }),
  setVKTracks: (tracks) => set({ vkTracks: tracks }),
  setVKPlaylists: (playlists) => set({ vkPlaylists: playlists }),
  setVKLoading: (loading) => set({ vkLoading: loading }),
  setVKError: (error) => set({ vkError: error }),
  logoutVK: () => set({ vkUser: null, vkToken: null, vkTracks: [], vkPlaylists: [] }),

  setYandexAccount: (account, token) => set({ yandexAccount: account, yandexToken: token || null }),
  setYandexLikes: (tracks) => set({ yandexLikes: tracks }),
  setYandexPlaylists: (playlists) => set({ yandexPlaylists: playlists }),
  setYandexLoading: (loading) => set({ yandexLoading: loading }),
  setYandexError: (error) => set({ yandexError: error }),
  logoutYandex: () =>
    set({ yandexAccount: null, yandexToken: null, yandexLikes: [], yandexPlaylists: [] }),
}))
