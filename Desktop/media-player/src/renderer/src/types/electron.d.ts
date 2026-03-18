export {}

declare global {
  interface Window {
    api: {
      window: {
        minimize: () => void
        maximize: () => void
        close: () => void
      }
      fs: {
        scan: (directories?: string[]) => Promise<unknown[]>
        addDirectory: () => Promise<{ directories: string[]; files: unknown[] } | null>
        getDirectories: () => Promise<string[]>
        metadata: (filePath: string) => Promise<unknown>
        fileExists: (filePath: string) => Promise<boolean>
      }
      store: {
        get: (key: string) => Promise<unknown>
        set: (key: string, value: unknown) => Promise<boolean>
        delete: (key: string) => Promise<boolean>
      }
      vk: {
        auth: (token: string) => Promise<{ success: boolean; user?: unknown; error?: string }>
        getUser: () => Promise<unknown>
        getMyAudio: (count?: number, offset?: number) => Promise<{ items: unknown[]; count: number }>
        getPlaylists: () => Promise<{ items: unknown[]; count: number }>
        getPlaylistTracks: (ownerId: number, albumId: number) => Promise<{ items: unknown[]; count: number }>
        search: (query: string, count?: number) => Promise<{ items: unknown[]; count: number }>
        getRecommendations: () => Promise<{ items: unknown[]; count: number }>
        addAudio: (audioId: number, ownerId: number) => Promise<number>
        removeAudio: (audioId: number, ownerId: number) => Promise<number>
        getFriends: () => Promise<{ items: unknown[] }>
        getWall: (ownerId: number) => Promise<{ items: unknown[] }>
        logout: () => Promise<boolean>
      }
      yandex: {
        auth: (login: string, password: string) => Promise<{ success: boolean; token?: string; error?: string }>
        authToken: (token: string) => Promise<{ success: boolean; account?: unknown; error?: string }>
        getAccount: () => Promise<unknown>
        getLikes: () => Promise<{ library: { tracks: unknown[] } }>
        getPlaylists: () => Promise<unknown[]>
        getPlaylist: (uid: number, kind: number) => Promise<unknown>
        search: (query: string, type?: string) => Promise<Record<string, unknown>>
        getTrackUrl: (trackId: number) => Promise<string | null>
        likeTrack: (trackId: number) => Promise<boolean>
        unlikeTrack: (trackId: number) => Promise<boolean>
        getStations: () => Promise<unknown[]>
        getStationTracks: (stationId: string) => Promise<{ sequence: unknown[] }>
        getArtist: (artistId: number) => Promise<unknown>
        getAlbum: (albumId: number) => Promise<unknown>
        logout: () => Promise<boolean>
      }
    }
  }
}
