import React, { useEffect, useState } from 'react'
import {
  Heart, ListMusic, Search, Sparkles, RefreshCw, Play, Shuffle,
  Music2, Radio
} from 'lucide-react'
import { motion } from 'framer-motion'
import { useServicesStore } from '../../store/servicesStore'
import { usePlayerStore } from '../../store/playerStore'
import { useUIStore } from '../../store/uiStore'
import { TrackItem } from '../ui/TrackItem'
import { Track, yandexCover } from '../../types'

function vkTrackToTrack(vk: {
  id: number; owner_id: number; title: string; artist: string;
  duration: number; url: string;
  album?: { id: number; title: string; thumb?: { photo_300: string } }
}): Track {
  return {
    id: `vk_${vk.owner_id}_${vk.id}`,
    source: 'vk',
    title: vk.title,
    artist: vk.artist,
    album: vk.album?.title || '',
    albumId: vk.album?.id,
    duration: vk.duration,
    url: vk.url,
    cover: vk.album?.thumb?.photo_300 || null,
    vkOwnerId: vk.owner_id,
    vkId: vk.id,
  }
}

type VKTab = 'library' | 'playlists' | 'recommendations' | 'search'

export const VKMusicView: React.FC<{ initialTab?: VKTab }> = ({ initialTab = 'library' }) => {
  const { vkUser, vkTracks, vkPlaylists, setVKTracks, setVKPlaylists } = useServicesStore()
  const { playTrack, setQueue } = usePlayerStore()
  const { setView } = useUIStore()

  const [tab, setTab] = useState<VKTab>(initialTab)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Track[]>([])
  const [searching, setSearching] = useState(false)
  const [recommendations, setRecommendations] = useState<Track[]>([])
  const [loadedPlaylists, setLoadedPlaylists] = useState<{
    id: string; title: string; count: number; cover: string | null;
    vkOwnerId: number; vkId: number
  }[]>([])

  useEffect(() => {
    if (!vkUser) return
    if (tab === 'library' && vkTracks.length === 0) loadMyAudio()
    if (tab === 'playlists' && loadedPlaylists.length === 0) loadPlaylists()
    if (tab === 'recommendations' && recommendations.length === 0) loadRecommendations()
  }, [tab, vkUser])

  const loadMyAudio = async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await window.api.vk.getMyAudio(200)
      const tracks = ((result.items || []) as Parameters<typeof vkTrackToTrack>[0][]).map(vkTrackToTrack)
      setVKTracks(tracks)
    } catch (e: unknown) {
      const msg = (e as { message?: string })?.message || 'Ошибка загрузки'
      setError(msg)
    }
    setLoading(false)
  }

  const loadPlaylists = async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await window.api.vk.getPlaylists()
      type VKPlaylistRaw = { id: number; owner_id: number; title: string; count: number; photo?: { photo_300: string } }
      setLoadedPlaylists(
        ((result.items || []) as VKPlaylistRaw[]).map((p) => ({
          id: `vkpl_${p.owner_id}_${p.id}`,
          title: p.title,
          count: p.count,
          cover: p.photo?.photo_300 || null,
          vkOwnerId: p.owner_id,
          vkId: p.id,
        }))
      )
    } catch (e: unknown) {
      setError((e as { message?: string })?.message || 'Ошибка загрузки плейлистов')
    }
    setLoading(false)
  }

  const loadRecommendations = async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await window.api.vk.getRecommendations()
      setRecommendations(((result.items || []) as Parameters<typeof vkTrackToTrack>[0][]).map(vkTrackToTrack))
    } catch (e: unknown) {
      setError((e as { message?: string })?.message || 'Ошибка загрузки рекомендаций')
    }
    setLoading(false)
  }

  const handleSearch = async () => {
    if (!searchQuery.trim()) return
    setSearching(true)
    try {
      const result = await window.api.vk.search(searchQuery, 50)
      setSearchResults(((result.items || []) as Parameters<typeof vkTrackToTrack>[0][]).map(vkTrackToTrack))
    } catch {}
    setSearching(false)
  }

  const tabs = [
    { id: 'library', icon: <Heart size={14} />, label: 'Моя музыка' },
    { id: 'playlists', icon: <ListMusic size={14} />, label: 'Плейлисты' },
    { id: 'recommendations', icon: <Sparkles size={14} />, label: 'Рекомендации' },
    { id: 'search', icon: <Search size={14} />, label: 'Поиск' },
  ] as const

  const currentTracks =
    tab === 'library' ? vkTracks : tab === 'recommendations' ? recommendations : searchResults

  return (
    <div className="flex flex-col h-full">
      {/* Header with VK blue gradient */}
      <div className="px-6 py-4 border-b border-border/50 flex-shrink-0 bg-gradient-to-r from-vk/10 to-transparent">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-vk rounded-xl flex items-center justify-center shadow-lg">
            <span className="text-white font-bold text-sm">VK</span>
          </div>
          <div>
            <h1 className="text-xl font-bold text-text-primary">VK Музыка</h1>
            {vkUser && (
              <p className="text-sm text-text-muted">
                {vkUser.first_name} {vkUser.last_name}
              </p>
            )}
          </div>
          {tab !== 'search' && (
            <button
              onClick={() =>
                tab === 'library'
                  ? loadMyAudio()
                  : tab === 'playlists'
                    ? loadPlaylists()
                    : loadRecommendations()
              }
              className="ml-auto p-2 rounded-xl hover:bg-bg-hover text-text-muted hover:text-text-primary transition-colors"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            </button>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-1">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium transition-all
                ${tab === t.id ? 'bg-vk text-white' : 'text-text-muted hover:text-text-primary hover:bg-bg-hover'}`}
            >
              {t.icon}
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 py-3">
        {error && (
          <div className="mb-3 px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-xl text-sm text-red-400">
            {error === 'Access denied' || error === 'Invalid request'
              ? 'VK ограничил доступ к API музыки для сторонних приложений. Попробуйте повторно авторизоваться через OAuth.'
              : error}
          </div>
        )}
        {/* Library */}
        {tab === 'library' && (
          <>
            {vkTracks.length > 0 && (
              <div className="flex gap-2 mb-3">
                <button
                  onClick={() => setQueue(vkTracks, 0)}
                  className="flex items-center gap-2 px-4 py-2 bg-vk hover:bg-vk-dark rounded-xl text-white text-sm font-medium transition-colors"
                >
                  <Play size={14} className="fill-white" />
                  Слушать всё
                </button>
                <button
                  onClick={() => {
                    const idx = Math.floor(Math.random() * vkTracks.length)
                    usePlayerStore.getState().toggleShuffle()
                    setQueue(vkTracks, idx)
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-bg-elevated hover:bg-bg-hover border border-border rounded-xl text-sm text-text-secondary transition-colors"
                >
                  <Shuffle size={14} />
                  Перемешать
                </button>
                <span className="text-sm text-text-muted ml-2 flex items-center">
                  {vkTracks.length} треков
                </span>
              </div>
            )}
            {loading ? (
              <LoadingSpinner />
            ) : vkTracks.length === 0 ? (
              <EmptyState icon={<Music2 size={28} />} message="Нет сохранённой музыки" />
            ) : (
              <TrackList tracks={vkTracks} />
            )}
          </>
        )}

        {/* Playlists */}
        {tab === 'playlists' && (
          <>
            {loading ? (
              <LoadingSpinner />
            ) : loadedPlaylists.length === 0 ? (
              <EmptyState icon={<ListMusic size={28} />} message="Нет плейлистов" />
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {loadedPlaylists.map((pl) => (
                  <PlaylistCard
                    key={pl.id}
                    title={pl.title}
                    count={pl.count}
                    cover={pl.cover}
                    onClick={() => {
                      // Load playlist tracks
                    }}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {/* Recommendations */}
        {tab === 'recommendations' && (
          <>
            {loading ? (
              <LoadingSpinner />
            ) : recommendations.length === 0 ? (
              <EmptyState icon={<Sparkles size={28} />} message="Нет рекомендаций" />
            ) : (
              <TrackList tracks={recommendations} />
            )}
          </>
        )}

        {/* Search */}
        {tab === 'search' && (
          <>
            <div className="flex gap-2 mb-4">
              <div className="relative flex-1">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  placeholder="Поиск в VK Музыке..."
                  className="w-full bg-bg-elevated border border-border rounded-xl pl-9 pr-4 py-2.5 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-vk transition-colors"
                />
              </div>
              <button
                onClick={handleSearch}
                disabled={searching || !searchQuery.trim()}
                className="px-4 py-2 bg-vk hover:bg-vk-dark disabled:opacity-50 rounded-xl text-white text-sm transition-colors"
              >
                {searching ? (
                  <RefreshCw size={14} className="animate-spin" />
                ) : (
                  'Найти'
                )}
              </button>
            </div>
            {searchResults.length > 0 ? (
              <TrackList tracks={searchResults} />
            ) : !searching ? (
              <EmptyState icon={<Search size={28} />} message="Введите запрос для поиска" />
            ) : null}
          </>
        )}
      </div>
    </div>
  )
}

const TrackList: React.FC<{ tracks: Track[] }> = ({ tracks }) => (
  <div className="space-y-0.5">
    {tracks.map((track, i) => (
      <motion.div
        key={track.id}
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: Math.min(i * 0.01, 0.3) }}
      >
        <TrackItem track={track} index={i} queue={tracks} />
      </motion.div>
    ))}
  </div>
)

const LoadingSpinner: React.FC = () => (
  <div className="flex items-center justify-center h-40">
    <div className="w-8 h-8 border-2 border-vk border-t-transparent rounded-full animate-spin" />
  </div>
)

const EmptyState: React.FC<{ icon: React.ReactNode; message: string }> = ({ icon, message }) => (
  <div className="flex flex-col items-center justify-center h-40 gap-3 text-text-muted">
    <div className="w-14 h-14 bg-bg-elevated rounded-2xl flex items-center justify-center">{icon}</div>
    <p>{message}</p>
  </div>
)

const PlaylistCard: React.FC<{
  title: string; count: number; cover: string | null; onClick: () => void
}> = ({ title, count, cover, onClick }) => (
  <button
    onClick={onClick}
    className="flex flex-col gap-2 p-2 rounded-2xl hover:bg-bg-hover transition-colors text-left group"
  >
    <div className="aspect-square rounded-xl overflow-hidden bg-bg-active">
      {cover ? (
        <img src={cover} alt={title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          <ListMusic size={24} className="text-text-muted" />
        </div>
      )}
    </div>
    <div>
      <p className="text-sm font-medium text-text-primary truncate">{title}</p>
      <p className="text-xs text-text-muted">{count} треков</p>
    </div>
  </button>
)
