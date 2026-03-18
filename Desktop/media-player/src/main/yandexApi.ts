import axios, { AxiosInstance } from 'axios'
import * as crypto from 'crypto'

const YANDEX_API_BASE = 'https://api.music.yandex.net'
const YANDEX_OAUTH_URL = 'https://oauth.yandex.ru/token'
export const YANDEX_OAUTH_CLIENT_ID = 'c0ebe342af7d48fbbbfcf2d2eedb8f9e'
export const YANDEX_AUTH_URL = `https://oauth.yandex.ru/authorize?response_type=token&client_id=${YANDEX_OAUTH_CLIENT_ID}&force_confirm=false`

export interface YandexAccount {
  uid: number
  login: string
  full_name: string
  display_name: string
}

export interface YandexArtist {
  id: number
  name: string
  cover?: { uri: string; prefix: string; type: string }
}

export interface YandexAlbum {
  id: number
  title: string
  year?: number
  coverUri?: string
  artists: YandexArtist[]
  trackCount?: number
}

export interface YandexTrack {
  id: number
  title: string
  artists: YandexArtist[]
  albums: YandexAlbum[]
  durationMs: number
  available: boolean
  coverUri?: string
  liked?: boolean
}

export interface YandexPlaylist {
  uid: number
  kind: number
  title: string
  trackCount: number
  cover?: { uri: string; type: string }
  ogImage?: string
  modified: string
}

export interface YandexStation {
  station: {
    id: { type: string; tag: string }
    name: string
    icon?: { imageUrl: string }
  }
  settings?: unknown
}

class YandexApi {
  private token: string | null = null
  private uid: number | null = null
  private client: AxiosInstance

  constructor() {
    this.client = axios.create({
      baseURL: YANDEX_API_BASE,
      timeout: 15000,
      headers: {
        'X-Yandex-Music-Client': 'WindowsPhone/3.20',
        'User-Agent': 'Windows 10',
        Accept: 'application/json',
      },
    })

    this.client.interceptors.request.use((config) => {
      if (this.token) {
        config.headers['Authorization'] = `OAuth ${this.token}`
      }
      return config
    })
  }

  setToken(token: string) {
    this.token = token
  }

  async authenticate(
    login: string,
    password: string
  ): Promise<{ success: boolean; token?: string; error?: string }> {
    try {
      // Yandex Music uses OAuth token
      // For direct login we use Yandex's password grant
      const response = await axios.post(
        YANDEX_OAUTH_URL,
        new URLSearchParams({
          grant_type: 'password',
          username: login,
          password: password,
          client_id: 'c0ebe342af7d48fbbbfcf2d2eedb8f9e', // Yandex Music client
          client_secret: 'ad0a908f0aa341a182a37ecd75bc319e',
        }),
        {
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        }
      )
      const { access_token } = response.data
      this.token = access_token
      return { success: true, token: access_token }
    } catch (e: unknown) {
      const err = e as { response?: { data?: { error_description?: string } }; message?: string }
      return {
        success: false,
        error: err?.response?.data?.error_description || err?.message || 'Auth failed',
      }
    }
  }

  async authenticateWithToken(
    token: string
  ): Promise<{ success: boolean; account?: YandexAccount; error?: string }> {
    this.token = token
    try {
      const account = await this.getAccount()
      if (account) {
        this.uid = account.uid
        return { success: true, account }
      }
      return { success: false, error: 'Failed to get account' }
    } catch (e: unknown) {
      const err = e as { message?: string }
      return { success: false, error: err?.message || 'Auth failed' }
    }
  }

  async getAccount(): Promise<YandexAccount | null> {
    try {
      const res = await this.client.get('/account/status')
      const account = res.data.result?.account
      if (account) {
        this.uid = account.uid
        return account
      }
      return null
    } catch {
      return null
    }
  }

  async getLikedTracks(): Promise<{ library: { tracks: YandexTrack[] } }> {
    const res = await this.client.get(`/users/${this.uid}/likes/tracks`)
    // Fetch full track info
    const ids = res.data.result?.library?.tracks?.map((t: { id: number }) => t.id) || []
    if (!ids.length) return { library: { tracks: [] } }
    const tracksRes = await this.client.post('/tracks', { "track-ids": ids.slice(0, 200) })
    return { library: { tracks: tracksRes.data.result || [] } }
  }

  async getPlaylists(): Promise<YandexPlaylist[]> {
    const res = await this.client.get(`/users/${this.uid}/playlists/list`)
    return res.data.result || []
  }

  async getPlaylist(uid: number, kind: number): Promise<{ tracks: YandexTrack[] } | null> {
    try {
      const res = await this.client.get(`/users/${uid}/playlists/${kind}`, {
        params: { 'with-tracks': true },
      })
      return res.data.result
    } catch {
      return null
    }
  }

  async search(query: string, type = 'all'): Promise<Record<string, unknown>> {
    const res = await this.client.get('/search', {
      params: { text: query, type, page: 0, 'no-correct': false },
    })
    return res.data.result || {}
  }

  async getTrackDownloadUrl(trackId: number): Promise<string | null> {
    try {
      const res = await this.client.get(`/tracks/${trackId}/download-info`)
      const infos = res.data.result || []
      // Pick best quality (MP3 320 > MP3 192 > MP3 128)
      const sorted = infos.sort(
        (a: { bitrateInKbps: number }, b: { bitrateInKbps: number }) =>
          b.bitrateInKbps - a.bitrateInKbps
      )
      const best = sorted[0]
      if (!best) return null

      // Get actual download URL
      const xmlRes = await axios.get(best.downloadInfoUrl + '&format=json')
      const info = xmlRes.data

      const path = info.path
      const s = info.s
      const ts = info.ts
      const host = info.host

      const sign = crypto
        .createHash('md5')
        .update(`XGRlBW9FXlekgbPrRHuSiA${path.slice(1)}${s}`)
        .digest('hex')

      return `https://${host}/get-mp3/${sign}/${ts}${path}`
    } catch {
      return null
    }
  }

  async likeTrack(trackId: number): Promise<boolean> {
    try {
      await this.client.post(`/users/${this.uid}/likes/tracks/add`, null, {
        params: { 'track-id': trackId },
      })
      return true
    } catch {
      return false
    }
  }

  async unlikeTrack(trackId: number): Promise<boolean> {
    try {
      await this.client.post(`/users/${this.uid}/likes/tracks/remove`, null, {
        params: { 'track-id': trackId },
      })
      return true
    } catch {
      return false
    }
  }

  async getStations(): Promise<YandexStation[]> {
    try {
      const res = await this.client.get('/rotor/stations/list', {
        params: { language: 'ru' },
      })
      return res.data.result || []
    } catch {
      return []
    }
  }

  async getStationTracks(stationId: string): Promise<{ sequence: { track: YandexTrack }[] }> {
    const [type, tag] = stationId.split(':')
    const res = await this.client.get(`/rotor/station/${type}:${tag}/tracks`)
    return res.data.result || { sequence: [] }
  }

  async getArtist(artistId: number): Promise<unknown> {
    const res = await this.client.get(`/artists/${artistId}/brief-info`)
    return res.data.result
  }

  async getAlbum(albumId: number): Promise<unknown> {
    const res = await this.client.get(`/albums/${albumId}/with-tracks`)
    return res.data.result
  }

  logout() {
    this.token = null
    this.uid = null
  }
}

export const yandexApi = new YandexApi()
