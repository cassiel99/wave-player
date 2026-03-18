import { readdirSync, statSync } from 'fs'
import { join, extname, basename } from 'path'
import type { IAudioMetadata } from 'music-metadata'
// Dynamic import wrapper (music-metadata is ESM)
let mmModule: { parseFile: (p: string, opts?: Record<string, unknown>) => Promise<IAudioMetadata> } | null = null
async function getMM() {
  if (!mmModule) {
    const mod = await import('music-metadata')
    mmModule = mod as unknown as typeof mmModule
  }
  return mmModule!
}

const AUDIO_EXTENSIONS = new Set([
  '.mp3', '.flac', '.wav', '.ogg', '.aac', '.m4a', '.wma',
  '.ape', '.opus', '.aiff', '.aif', '.wv', '.mpc', '.mp4',
  '.m4b', '.mp2', '.alac', '.dsd', '.dsf', '.dff', '.ra',
  '.tta', '.tak', '.shn', '.ofr',
])

export interface LocalTrack {
  id: string
  filePath: string
  title: string
  artist: string
  album: string
  albumArtist: string
  year: number | null
  genre: string
  duration: number
  trackNumber: number | null
  diskNumber: number | null
  bitrate: number | null
  sampleRate: number | null
  format: string
  size: number
  cover: string | null
  addedAt: number
}

function generateId(filePath: string): string {
  let hash = 0
  for (let i = 0; i < filePath.length; i++) {
    const char = filePath.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  return `local_${Math.abs(hash)}`
}

export async function scanMusicFiles(directories: string[]): Promise<LocalTrack[]> {
  const tracks: LocalTrack[] = []
  const visited = new Set<string>()

  function scanDir(dir: string, depth = 0): void {
    if (depth > 10 || visited.has(dir)) return
    visited.add(dir)

    try {
      const entries = readdirSync(dir, { withFileTypes: true })
      for (const entry of entries) {
        const fullPath = join(dir, entry.name)
        if (entry.isDirectory() && !entry.name.startsWith('.')) {
          scanDir(fullPath, depth + 1)
        } else if (entry.isFile()) {
          const ext = extname(entry.name).toLowerCase()
          if (AUDIO_EXTENSIONS.has(ext)) {
            try {
              const stat = statSync(fullPath)
              tracks.push({
                id: generateId(fullPath),
                filePath: fullPath,
                title: basename(entry.name, ext),
                artist: 'Unknown Artist',
                album: 'Unknown Album',
                albumArtist: '',
                year: null,
                genre: '',
                duration: 0,
                trackNumber: null,
                diskNumber: null,
                bitrate: null,
                sampleRate: null,
                format: ext.replace('.', '').toUpperCase(),
                size: stat.size,
                cover: null,
                addedAt: Date.now(),
              })
            } catch {}
          }
        }
      }
    } catch {}
  }

  for (const dir of directories) {
    scanDir(dir)
  }

  // Load metadata in batches
  const batchSize = 50
  for (let i = 0; i < tracks.length; i += batchSize) {
    const batch = tracks.slice(i, i + batchSize)
    const mmLib = await getMM()
    await Promise.all(
      batch.map(async (track) => {
        try {
          const meta = await mmLib.parseFile(track.filePath, { skipCovers: false, duration: true })
          const common = meta.common
          const format = meta.format

          if (common.title) track.title = common.title
          if (common.artist) track.artist = common.artist
          if (common.album) track.album = common.album
          if (common.albumartist) track.albumArtist = common.albumartist
          if (common.year) track.year = common.year
          if (common.genre?.length) track.genre = common.genre[0]
          if (common.track.no) track.trackNumber = common.track.no
          if (common.disk?.no) track.diskNumber = common.disk.no
          if (format.duration) track.duration = format.duration
          if (format.bitrate) track.bitrate = Math.round(format.bitrate / 1000)
          if (format.sampleRate) track.sampleRate = format.sampleRate

          // Extract cover art
          if (common.picture?.length) {
            const pic = common.picture[0]
            const base64 = Buffer.from(pic.data).toString('base64')
            track.cover = `data:${pic.format};base64,${base64}`
          }
        } catch {}
      })
    )
  }

  return tracks
}

export async function getMusicMetadata(filePath: string): Promise<LocalTrack | null> {
  try {
    const ext = extname(filePath).toLowerCase()
    if (!AUDIO_EXTENSIONS.has(ext)) return null

    const stat = statSync(filePath)
    const mmLib = await getMM()
    const meta = await mmLib.parseFile(filePath, { skipCovers: false, duration: true })
    const common = meta.common
    const format = meta.format

    let cover: string | null = null
    if (common.picture?.length) {
      const pic = common.picture[0]
      cover = `data:${pic.format};base64,${Buffer.from(pic.data).toString('base64')}`
    }

    return {
      id: generateId(filePath),
      filePath,
      title: common.title || basename(filePath, ext),
      artist: common.artist || 'Unknown Artist',
      album: common.album || 'Unknown Album',
      albumArtist: common.albumartist || '',
      year: common.year || null,
      genre: common.genre?.[0] || '',
      duration: format.duration || 0,
      trackNumber: common.track.no || null,
      diskNumber: common.disk?.no || null,
      bitrate: format.bitrate ? Math.round(format.bitrate / 1000) : null,
      sampleRate: format.sampleRate || null,
      format: ext.replace('.', '').toUpperCase(),
      size: stat.size,
      cover,
      addedAt: Date.now(),
    }
  } catch {
    return null
  }
}
