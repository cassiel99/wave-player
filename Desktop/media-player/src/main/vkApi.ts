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
    thumb?: { photo_135: string; photo_300: string }
  }
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
    return response[0] || null
  }

  async getMyAudio(count = 100, offset = 0): Promise<{ items: VKAudio[]; count: number }> {
    const params: Record<string, unknown> = { count, offset }
    if (this.userId) params.owner_id = this.userId
    return this.call('audio.get', params)
  }

  async searchAudio(query: string, count = 50): Promise<{ items: VKAudio[]; count: number }> {
    return this.call('audio.search', { q: query, count, sort: 2 })
  }

  async getPlaylists(): Promise<{ items: VKPlaylist[]; count: number }> {
    return this.call('audio.getPlaylists', { count: 50 })
  }

  async getPlaylistTracks(
    ownerId: number,
    albumId: number
  ): Promise<{ items: VKAudio[]; count: number }> {
    return this.call('audio.get', { owner_id: ownerId, album_id: albumId })
  }

  async getRecommendations(): Promise<{ items: VKAudio[]; count: number }> {
    return this.call('audio.getRecommendations', { count: 100 })
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
