import { contextBridge, ipcRenderer } from 'electron'

const api = {
  // Window controls
  window: {
    minimize: () => ipcRenderer.send('window:minimize'),
    maximize: () => ipcRenderer.send('window:maximize'),
    close: () => ipcRenderer.send('window:close'),
  },

  // File system
  fs: {
    scan: (directories?: string[]) => ipcRenderer.invoke('fs:scan', directories),
    addDirectory: () => ipcRenderer.invoke('fs:addDirectory'),
    getDirectories: () => ipcRenderer.invoke('fs:getDirectories'),
    metadata: (filePath: string) => ipcRenderer.invoke('fs:metadata', filePath),
    fileExists: (filePath: string) => ipcRenderer.invoke('fs:fileExists', filePath),
  },

  // Store
  store: {
    get: (key: string) => ipcRenderer.invoke('store:get', key),
    set: (key: string, value: unknown) => ipcRenderer.invoke('store:set', key, value),
    delete: (key: string) => ipcRenderer.invoke('store:delete', key),
  },

  // VK Music
  vk: {
    auth: (token: string) => ipcRenderer.invoke('vk:auth', token),
    getUser: () => ipcRenderer.invoke('vk:getUser'),
    getMyAudio: (count?: number, offset?: number) =>
      ipcRenderer.invoke('vk:getMyAudio', count, offset),
    getAllAudio: () => ipcRenderer.invoke('vk:getAllAudio'),
    onLoadProgress: (cb: (loaded: number, total: number) => void) => {
      const handler = (_: Electron.IpcRendererEvent, loaded: number, total: number) => cb(loaded, total)
      ipcRenderer.on('vk:loadProgress', handler)
      return () => ipcRenderer.removeListener('vk:loadProgress', handler)
    },
    getPlaylists: () => ipcRenderer.invoke('vk:getPlaylists'),
    getPlaylistTracks: (ownerId: number, albumId: number) =>
      ipcRenderer.invoke('vk:getPlaylistTracks', ownerId, albumId),
    search: (query: string, count?: number) => ipcRenderer.invoke('vk:search', query, count),
    getRecommendations: () => ipcRenderer.invoke('vk:getRecommendations'),
    getStreamMix: (count?: number) => ipcRenderer.invoke('vk:getStreamMix', count),
    addAudio: (audioId: number, ownerId: number) =>
      ipcRenderer.invoke('vk:addAudio', audioId, ownerId),
    removeAudio: (audioId: number, ownerId: number) =>
      ipcRenderer.invoke('vk:removeAudio', audioId, ownerId),
    getFriends: () => ipcRenderer.invoke('vk:getFriends'),
    getWall: (ownerId: number) => ipcRenderer.invoke('vk:getWall', ownerId),
    logout: () => ipcRenderer.invoke('vk:logout'),
  },

  // Yandex Music
  yandex: {
    auth: (login: string, password: string) => ipcRenderer.invoke('yandex:auth', login, password),
    authToken: (token: string) => ipcRenderer.invoke('yandex:authToken', token),
    getAccount: () => ipcRenderer.invoke('yandex:getAccount'),
    getLikes: () => ipcRenderer.invoke('yandex:getLikes'),
    getPlaylists: () => ipcRenderer.invoke('yandex:getPlaylists'),
    getPlaylist: (uid: number, kind: number) =>
      ipcRenderer.invoke('yandex:getPlaylist', uid, kind),
    search: (query: string, type?: string) => ipcRenderer.invoke('yandex:search', query, type),
    getTrackUrl: (trackId: number) => ipcRenderer.invoke('yandex:getTrackUrl', trackId),
    likeTrack: (trackId: number) => ipcRenderer.invoke('yandex:likeTrack', trackId),
    unlikeTrack: (trackId: number) => ipcRenderer.invoke('yandex:unlikeTrack', trackId),
    getStations: () => ipcRenderer.invoke('yandex:getStations'),
    getStationTracks: (stationId: string) =>
      ipcRenderer.invoke('yandex:getStationTracks', stationId),
    getArtist: (artistId: number) => ipcRenderer.invoke('yandex:getArtist', artistId),
    getAlbum: (albumId: number) => ipcRenderer.invoke('yandex:getAlbum', albumId),
    logout: () => ipcRenderer.invoke('yandex:logout'),
  },
}

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore
  window.api = api
}
