import { app, shell, BrowserWindow, ipcMain, dialog, protocol } from 'electron'
import { join, extname } from 'path'
import { existsSync, statSync, createReadStream } from 'fs'
import { Readable } from 'stream'
const isDev = !!process.env['ELECTRON_RENDERER_URL']
import Store from 'electron-store'
import { scanMusicFiles, getMusicMetadata } from './fileScanner'
import { vkApi } from './vkApi'
import { yandexApi } from './yandexApi'

const store = new Store()

// Must be called before app.whenReady() — enables range requests and secure origin for audio streaming
protocol.registerSchemesAsPrivileged([
  {
    scheme: 'media',
    privileges: {
      secure: true,
      standard: true,
      stream: true,
      supportFetchAPI: true,
      corsEnabled: true,
      bypassCSP: true,
    },
  },
])

let mainWindow: BrowserWindow | null = null

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 900,
    minHeight: 600,
    show: false,
    frame: false,
    backgroundColor: '#0a0a0f',
    titleBarStyle: 'hidden',
    trafficLightPosition: { x: 16, y: 16 },
    autoHideMenuBar: true,
    icon: join(__dirname, '../../resources/icon.png'),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      webSecurity: false,
      allowRunningInsecureContent: true,
    },
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow?.show()
  })

  mainWindow.webContents.on('did-fail-load', (_event, errorCode, errorDescription, validatedURL) => {
    console.error(`[main] did-fail-load: ${errorCode} ${errorDescription} url=${validatedURL}`)
    // Retry loading on failure (but not on aborted loads -3)
    if (isDev && process.env['ELECTRON_RENDERER_URL'] && errorCode !== -3) {
      setTimeout(() => {
        const rawUrl = process.env['ELECTRON_RENDERER_URL']!
        mainWindow?.loadURL(rawUrl.replace('localhost', '127.0.0.1')).catch(console.error)
      }, 1500)
    }
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (isDev && process.env['ELECTRON_RENDERER_URL']) {
    const rawUrl = process.env['ELECTRON_RENDERER_URL']!
    const url = rawUrl.replace('localhost', '127.0.0.1')
    console.log(`[main] Loading dev URL: ${url}`)
    // Small delay to ensure Vite dev server is fully ready before connecting
    setTimeout(() => {
      mainWindow?.loadURL(url).catch(console.error)
    }, 500)
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html')).catch(console.error)
  }
}

app.whenReady().then(() => {
  app.setAppUserModelId('com.waveplayer.app')

  const MIME: Record<string, string> = {
    mp3: 'audio/mpeg', flac: 'audio/flac', wav: 'audio/wav',
    ogg: 'audio/ogg', m4a: 'audio/mp4', aac: 'audio/aac',
    opus: 'audio/ogg; codecs=opus', wma: 'audio/x-ms-wma',
    ape: 'audio/ape', aiff: 'audio/aiff', aif: 'audio/aiff',
  }

  // Register file protocol for local audio — proper Range request support
  // URL format: media://local?p=<encoded-absolute-path>
  protocol.handle('media', (request) => {
    try {
      const urlObj = new URL(request.url)
      const filePath = urlObj.searchParams.get('p') || ''
      if (!filePath) return new Response('Not found', { status: 404 })

      const stat = statSync(filePath)
      const fileSize = stat.size
      const ext = extname(filePath).slice(1).toLowerCase()
      const mimeType = MIME[ext] || 'audio/mpeg'

      const rangeHeader = request.headers.get('range')
      if (rangeHeader) {
        const match = rangeHeader.match(/bytes=(\d+)-(\d*)/)
        if (!match) return new Response('Bad range', { status: 416 })
        const start = parseInt(match[1], 10)
        const end = match[2] !== '' ? parseInt(match[2], 10) : fileSize - 1
        const chunkSize = end - start + 1
        const nodeStream = createReadStream(filePath, { start, end })
        const webStream = Readable.toWeb(nodeStream) as ReadableStream
        return new Response(webStream, {
          status: 206,
          headers: {
            'Content-Type': mimeType,
            'Content-Length': String(chunkSize),
            'Content-Range': `bytes ${start}-${end}/${fileSize}`,
            'Accept-Ranges': 'bytes',
          },
        })
      }

      // Full file
      const nodeStream = createReadStream(filePath)
      const webStream = Readable.toWeb(nodeStream) as ReadableStream
      return new Response(webStream, {
        status: 200,
        headers: {
          'Content-Type': mimeType,
          'Content-Length': String(fileSize),
          'Accept-Ranges': 'bytes',
        },
      })
    } catch {
      return new Response('Not found', { status: 404 })
    }
  })

  setupIpcHandlers()
  createWindow()

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

function setupIpcHandlers() {
  // Window controls
  ipcMain.on('window:minimize', () => mainWindow?.minimize())
  ipcMain.on('window:maximize', () => {
    if (mainWindow?.isMaximized()) mainWindow.unmaximize()
    else mainWindow?.maximize()
  })
  ipcMain.on('window:close', () => mainWindow?.close())

  // File system - scan for music
  ipcMain.handle('fs:scan', async (_, directories?: string[]) => {
    const dirs = directories || (store.get('musicDirectories') as string[]) || []
    if (!dirs.length) {
      const result = await dialog.showOpenDialog(mainWindow!, {
        properties: ['openDirectory', 'multiSelections'],
        title: 'Выберите папки с музыкой',
      })
      if (result.canceled) return []
      dirs.push(...result.filePaths)
      store.set('musicDirectories', dirs)
    }
    return await scanMusicFiles(dirs)
  })

  ipcMain.handle('fs:addDirectory', async () => {
    const result = await dialog.showOpenDialog(mainWindow!, {
      properties: ['openDirectory', 'multiSelections'],
      title: 'Добавить папку с музыкой',
    })
    if (result.canceled) return null
    const dirs = (store.get('musicDirectories') as string[]) || []
    const newDirs = [...new Set([...dirs, ...result.filePaths])]
    store.set('musicDirectories', newDirs)
    return { directories: newDirs, files: await scanMusicFiles(result.filePaths) }
  })

  ipcMain.handle('fs:getDirectories', () => {
    return store.get('musicDirectories') || []
  })

  ipcMain.handle('fs:metadata', async (_, filePath: string) => {
    return await getMusicMetadata(filePath)
  })

  ipcMain.handle('fs:fileExists', (_, filePath: string) => {
    return existsSync(filePath)
  })

  // Store (settings)
  ipcMain.handle('store:get', (_, key: string) => store.get(key))
  ipcMain.handle('store:set', (_, key: string, value: unknown) => {
    store.set(key, value)
    return true
  })
  ipcMain.handle('store:delete', (_, key: string) => {
    store.delete(key)
    return true
  })

  // VK Music API
  ipcMain.handle('vk:auth', async (_, accessToken: string) => {
    return await vkApi.authenticate(accessToken)
  })
  ipcMain.handle('vk:getUser', async () => {
    return await vkApi.getUser()
  })
  ipcMain.handle('vk:getMyAudio', async (_, count = 100, offset = 0) => {
    return await vkApi.getMyAudio(count, offset)
  })
  ipcMain.handle('vk:getAllAudio', async (event) => {
    return await vkApi.getAllAudio((loaded, total) => {
      event.sender.send('vk:loadProgress', loaded, total)
    })
  })
  ipcMain.handle('vk:getPlaylists', async () => {
    return await vkApi.getPlaylists()
  })
  ipcMain.handle('vk:getPlaylistTracks', async (_, ownerId: number, albumId: number) => {
    return await vkApi.getPlaylistTracks(ownerId, albumId)
  })
  ipcMain.handle('vk:search', async (_, query: string, count = 50) => {
    return await vkApi.searchAudio(query, count)
  })
  ipcMain.handle('vk:getRecommendations', async () => {
    return await vkApi.getRecommendations()
  })
  ipcMain.handle('vk:getStreamMix', async (_, count = 50) => {
    return await vkApi.getStreamMixAudios(count)
  })
  ipcMain.handle('vk:addAudio', async (_, audioId: number, ownerId: number) => {
    return await vkApi.addAudio(audioId, ownerId)
  })
  ipcMain.handle('vk:removeAudio', async (_, audioId: number, ownerId: number) => {
    return await vkApi.removeAudio(audioId, ownerId)
  })
  ipcMain.handle('vk:getFriends', async () => {
    return await vkApi.getFriends()
  })
  ipcMain.handle('vk:getWall', async (_, ownerId: number) => {
    return await vkApi.getWall(ownerId)
  })
  ipcMain.handle('vk:logout', () => {
    vkApi.logout()
    store.delete('vk:token')
    return true
  })

  // Restore VK session
  const vkToken = store.get('vk:token') as string
  if (vkToken) vkApi.setToken(vkToken)

  // Yandex Music API
  ipcMain.handle('yandex:auth', async (_, login: string, password: string) => {
    const result = await yandexApi.authenticate(login, password)
    if (result.success && result.token) {
      store.set('yandex:token', result.token)
    }
    return result
  })
  ipcMain.handle('yandex:authToken', async (_, token: string) => {
    return await yandexApi.authenticateWithToken(token)
  })
  ipcMain.handle('yandex:getAccount', async () => {
    return await yandexApi.getAccount()
  })
  ipcMain.handle('yandex:getLikes', async () => {
    return await yandexApi.getLikedTracks()
  })
  ipcMain.handle('yandex:getPlaylists', async () => {
    return await yandexApi.getPlaylists()
  })
  ipcMain.handle('yandex:getPlaylist', async (_, uid: number, kind: number) => {
    return await yandexApi.getPlaylist(uid, kind)
  })
  ipcMain.handle('yandex:search', async (_, query: string, type = 'all') => {
    return await yandexApi.search(query, type)
  })
  ipcMain.handle('yandex:getTrackUrl', async (_, trackId: number) => {
    return await yandexApi.getTrackDownloadUrl(trackId)
  })
  ipcMain.handle('yandex:likeTrack', async (_, trackId: number) => {
    return await yandexApi.likeTrack(trackId)
  })
  ipcMain.handle('yandex:unlikeTrack', async (_, trackId: number) => {
    return await yandexApi.unlikeTrack(trackId)
  })
  ipcMain.handle('yandex:getStations', async () => {
    return await yandexApi.getStations()
  })
  ipcMain.handle('yandex:getStationTracks', async (_, stationId: string) => {
    return await yandexApi.getStationTracks(stationId)
  })
  ipcMain.handle('yandex:getArtist', async (_, artistId: number) => {
    return await yandexApi.getArtist(artistId)
  })
  ipcMain.handle('yandex:getAlbum', async (_, albumId: number) => {
    return await yandexApi.getAlbum(albumId)
  })
  ipcMain.handle('yandex:logout', () => {
    yandexApi.logout()
    store.delete('yandex:token')
    return true
  })

  // Restore Yandex session
  const yandexToken = store.get('yandex:token') as string
  if (yandexToken) yandexApi.setToken(yandexToken)
}
