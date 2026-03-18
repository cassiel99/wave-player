import axios, { AxiosInstance } from 'axios'

const VK_API_BASE = 'https://api.vk.com/method'
const VK_API_VERSION = '5.131'

// Using Kate Mobile client for audio access (widely used approach in open-source VK clients)
export const VK_AUTH_URL = (redirectUri: string) =>
  `https://oauth.vk.com/authorize?client_id=2685278&scope=audio,friends,wall,offline&redirect_uri=${encodeURIComponent(redirectUri)}&display=page&response_type=token&v=${VK_API_VERSION}`

export interface VKUser {
  id: number
  first_name: string
  last_name: string
  photo_100: string
  photo_200: string
}

export interface VKAudio {
  id: number
  owner_id: number
  artist: string
  title: string
  duration: number
  url: string
  album_id?: number
  album?: {
    id: number
    title: string
    owner_id: number
    thumb?: { photo_135?: string; photo_300?: string }
  }
  main_artists?: { id: string; name: string; domain: string }[]
  is_licensed: boolean
  date: number
}

export interface VKPlaylist {
  id: number
  owner_id: number
  title: string
  description: string
  count: number
  photo?: { photo_135: string; photo_300: string; photo_600: string }
}

class VKApi {
  private token: string | null = null
  private userId: number | null = null
  private client: AxiosInstance

  constructor() {
    this.client = axios.create({
      baseURL: VK_API_BASE,
      timeout: 15000,
      headers: {
        'User-Agent': 'KateMobileAndroid/56 lite-460 (Android 4.4.2; SDK 19; x86; unknown Android SDK built for x86; en)',
      },
    })
  }

  setToken(token: string) {
    this.token = token
  }

  async authenticate(token: string): Promise<{ success: boolean; user?: VKUser; error?: string }> {
    this.token = token
    try {
      const user = await this.getUser()
      if (user) {
        this.userId = user.id
        return { success: true, user }
      }
      return { success: false, error: 'Failed to get user info' }
    } catch (e: unknown) {
      const err = e as { message?: string }
      return { success: false, error: err?.message || 'Auth failed' }
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }

  private async call<T>(method: string, params: Record<string, unknown> = {}): Promise<T> {
    if (!this.token) throw new Error('Not authenticated')
    const response = await this.client.get(`/${method}`, {
      params: {
        ...params,
        access_token: this.token,
        v: VK_API_VERSION,
      },
    })
    if (response.data.error) {
      throw new Error(response.data.error.error_msg || 'VK API Error')
    }
    return response.data.response
  }

  async getUser(): Promise<VKUser | null> {
    const response = await this.call<VKUser[]>('users.get', {
      fields: 'photo_100,photo_200',
    })
    const user = response[0] || null
    if (user) this.userId = user.id  // restore userId on every getUser call
    return user
  }

  // Batch-fetch artist photos via VK execute (25 per request) and attach as cover
  private async enrichWithArtistCovers(tracks: VKAudio[]): Promise<VKAudio[]> {
    const needCover = tracks.filter(t => !t.album?.thumb && t.main_artists?.length)
    if (!needCover.length) return tracks

    const uniqueIds = [...new Set(needCover.flatMap(t => t.main_artists!.map(a => a.id)))]
    const artistPhotos = new Map<string, string>()

    // Process in batches of 25 (VK execute limit), 1s between each to stay under rate limit
    for (let i = 0; i < uniqueIds.length; i += 25) {
      if (i > 0) await this.sleep(1000)
      const batch = uniqueIds.slice(i, i + 25)
      const code =
        batch.map((id, idx) => `var r${idx}=API.audio.getArtistById({"artist_id":"${id}"});`).join('') +
        'return [' + batch.map((_, idx) => `r${idx}`).join(',') + '];'
      let retries = 2
      while (retries-- > 0) {
        try {
          const result = await this.call<{ photo?: { url: string; width: number }[] }[]>('execute', { code })
          for (let j = 0; j < batch.length; j++) {
            const artist = result[j]
            if (artist?.photo?.length) {
              const best = artist.photo.slice().sort((a, b) => b.width - a.width)[0]
              if (best?.url) artistPhotos.set(batch[j], best.url)
            }
          }
          break // success
        } catch (e: unknown) {
          const msg = (e as { message?: string })?.message || ''
          if (msg.includes('Too many requests') && retries > 0) {
            await this.sleep(2000)
          } else {
            console.warn('[VK] execute artist photos failed:', e)
            break
          }
        }
      }
    }

    return tracks.map(track => {
      if (track.album?.thumb) return track
      const artistId = track.main_artists?.[0]?.id
      if (artistId && artistPhotos.has(artistId)) {
        return { ...track, album: { ...(track.album as VKAudio['album']), thumb: { photo_300: artistPhotos.get(artistId)! } } }
      }
      return track
    })
  }

  async getMyAudio(count = 100, offset = 0): Promise<{ items: VKAudio[]; count: number }> {
    const params: Record<string, unknown> = { count, offset }
    if (this.userId) params.owner_id = this.userId
    return this.call<{ items: VKAudio[]; count: number }>('audio.get', params)
  }

  // Fetches all tracks with pagination, then enriches covers once at the end
  async getAllAudio(
    onProgress?: (loaded: number, total: number) => void
  ): Promise<{ items: VKAudio[]; count: number }> {
    if (!this.userId) throw new Error('User ID not set — please re-authenticate')
    const first = await this.call<{ items: VKAudio[]; count: number }>('audio.get', {
      count: 300,
      owner_id: this.userId,
    })
    const total = first.count || 0
    let allItems: VKAudio[] = first.items || []
    onProgress?.(allItems.length, total)

    for (let offset = 300; offset < total; offset += 300) {
      await this.sleep(400) // stay under VK rate limit (3 req/sec)
      const batch = await this.call<{ items: VKAudio[]; count: number }>('audio.get', {
        count: 300,
        offset,
        owner_id: this.userId,
      })
      allItems = allItems.concat(batch.items || [])
      onProgress?.(allItems.length, total)
    }

    allItems = await this.enrichWithArtistCovers(allItems)
    return { items: allItems, count: total }
  }

  async searchAudio(query: string, count = 50): Promise<{ items: VKAudio[]; count: number }> {
    const result = await this.call<{ items: VKAudio[]; count: number }>('audio.search', { q: query, count, sort: 2 })
    result.items = await this.enrichWithArtistCovers(result.items || [])
    return result
  }

  async getPlaylists(): Promise<{ items: VKPlaylist[]; count: number }> {
    if (!this.userId) throw new Error('User ID not set — please re-authenticate')
    return this.call('audio.getPlaylists', { owner_id: this.userId, count: 50 })
  }

  async getPlaylistTracks(
    ownerId: number,
    albumId: number
  ): Promise<{ items: VKAudio[]; count: number }> {
    return this.call('audio.get', { owner_id: ownerId, album_id: albumId })
  }

  async getStreamMixAudios(count = 100): Promise<{ items: VKAudio[] }> {
    // audio.getCatalog doesn't exist in this API version; getStreamMixAudios returns empty for all known mix_ids.
    // Use getRecommendations (same concept) shuffled as the mix source.
    const recs = await this.call<{ items: VKAudio[]; count: number }>('audio.getRecommendations', { count })
    recs.items = await this.enrichWithArtistCovers(recs.items || [])
    // Fisher-Yates shuffle
    for (let i = recs.items.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [recs.items[i], recs.items[j]] = [recs.items[j], recs.items[i]]
    }
    return { items: recs.items }
  }

  async getRecommendations(): Promise<{ items: VKAudio[]; count: number }> {
    const result = await this.call<{ items: VKAudio[]; count: number }>('audio.getRecommendations', { count: 100 })
    result.items = await this.enrichWithArtistCovers(result.items || [])
    return result
  }

  async addAudio(audioId: number, ownerId: number): Promise<number> {
    return this.call('audio.add', { audio_id: audioId, owner_id: ownerId })
  }

  async removeAudio(audioId: number, ownerId: number): Promise<number> {
    return this.call('audio.delete', { audio_id: audioId, owner_id: ownerId })
  }

  async getFriends(): Promise<{ items: (VKUser & { audio?: VKAudio })[] }> {
    return this.call('friends.get', {
      fields: 'photo_100',
      count: 50,
    })
  }

  async getWall(ownerId: number): Promise<{ items: unknown[] }> {
    return this.call('wall.get', { owner_id: ownerId, count: 20, filter: 'owner' })
  }

  async getNewsFeed(): Promise<{ items: unknown[] }> {
    return this.call('newsfeed.get', { filters: 'audio', count: 50 })
  }

  logout() {
    this.token = null
    this.userId = null
  }
}

export const vkApi = new VKApi()
