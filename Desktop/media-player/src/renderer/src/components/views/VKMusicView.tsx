import React, { useEffect, useState } from 'react'
import {
  Heart, ListMusic, Search, Sparkles, RefreshCw, Play, Shuffle,
  Music2, ChevronLeft, Radio, Loader2
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useServicesStore } from '../../store/servicesStore'
import { usePlayerStore } from '../../store/playerStore'
import { TrackItem } from '../ui/TrackItem'
import { Track } from '../../types'

const toHttps = (url?: string) => url ? url.replace(/^http:\/\//, 'https://') : null

function vkTrackToTrack(vk: {
  id: number; owner_id: number; title: string; artist: string;
  duration: number; url: string;
  album?: { id: number; title: string; thumb?: { photo_300?: string; photo_135?: string } }
}): Track {
  const cover = toHttps(vk.album?.thumb?.photo_300 || vk.album?.thumb?.photo_135)
  return {
    id: `vk_${vk.owner_id}_${vk.id}`,
    source: 'vk',
    title: vk.title,
    artist: vk.artist,
    album: vk.album?.title || '',
    albumId: vk.album?.id,
    duration: vk.duration,
    url: vk.url,
    cover,
    vkOwnerId: vk.owner_id,
    vkId: vk.id,
  }
}

type VKTab = 'library' | 'playlists' | 'mix' | 'recommendations' | 'search'

type PlaylistMeta = {
  id: string; title: string; count: number; cover: string | null;
  vkOwnerId: number; vkId: number
}

export const VKMusicView: React.FC<{ initialTab?: VKTab }> = ({ initialTab = 'library' }) => {
  const { vkUser, vkTracks, setVKTracks } = useServicesStore()
  const { setQueue } = usePlayerStore()

  const [tab, setTab] = useState<VKTab>(initialTab)
  const [loading, setLoading] = useState(false)
  const [loadingProgress, setLoadingProgress] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Track[]>([])
  const [searching, setSearching] = useState(false)
  const [recommendations, setRecommendations] = useState<Track[]>([])
  const [loadedPlaylists, setLoadedPlaylists] = useState<PlaylistMeta[]>([])

  // Playlist detail view
  const [openPlaylist, setOpenPlaylist] = useState<PlaylistMeta | null>(null)
  const [playlistTracks, setPlaylistTracks] = useState<Track[]>([])
  const [playlistLoading, setPlaylistLoading] = useState(false)

  // VK Mix
  const [mixTracks, setMixTracks] = useState<Track[]>([])
  const [mixLoading, setMixLoading] = useState(false)

  useEffect(() => {
    if (!vkUser) return
    if (tab === 'library' && vkTracks.length === 0) loadMyAudio()
    if (tab === 'playlists' && loadedPlaylists.length === 0) loadPlaylists()
    if (tab === 'recommendations' && recommendations.length === 0) loadRecommendations()
    if (tab === 'mix' && mixTracks.length === 0) loadMix()
  }, [tab, vkUser])

  useEffect(() => { setOpenPlaylist(null) }, [tab])

  const loadMyAudio = async () => {
    setLoading(true)
    setError(null)
    setLoadingProgress(null)

    const unsubscribe = window.api.vk.onLoadProgress((loaded, total) => {
      if (total > 300) setLoadingProgress(`Загружено ${loaded} / ${total}`)
    })

    try {
      const result = await window.api.vk.getAllAudio()
      setVKTracks(((result.items || []) as Parameters<typeof vkTrackToTrack>[0][]).map(vkTrackToTrack))
    } catch (e: unknown) {
      setError((e as { message?: string })?.message || 'Ошибка загрузки')
    }

    unsubscribe()
    setLoading(false)
    setLoadingProgress(null)
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

  const loadMix = async () => {
    setMixLoading(true)
    setError(null)
    try {
      const result = await window.api.vk.getStreamMix(50)
      setMixTracks(((result.items || []) as Parameters<typeof vkTrackToTrack>[0][]).map(vkTrackToTrack))
    } catch (e: unknown) {
      setError((e as { message?: string })?.message || 'Ошибка загрузки VK Микс')
    }
    setMixLoading(false)
  }

  const openPlaylistDetail = async (pl: PlaylistMeta) => {
    setOpenPlaylist(pl)
    setPlaylistTracks([])
    setPlaylistLoading(true)
    try {
      const result = await window.api.vk.getPlaylistTracks(pl.vkOwnerId, pl.vkId)
      setPlaylistTracks(((result.items || []) as Parameters<typeof vkTrackToTrack>[0][]).map(vkTrackToTrack))
    } catch (e: unknown) {
      setError((e as { message?: string })?.message || 'Ошибка загрузки треков плейлиста')
    }
    setPlaylistLoading(false)
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
    { id: 'mix', icon: <Radio size={14} />, label: 'VK Микс' },
    { id: 'recommendations', icon: <Sparkles size={14} />, label: 'Рекомендации' },
    { id: 'search', icon: <Search size={14} />, label: 'Поиск' },
  ] as const

  const handleRefresh = () => {
    if (tab === 'library') loadMyAudio()
    else if (tab === 'playlists') openPlaylist ? openPlaylistDetail(openPlaylist) : loadPlaylists()
    else if (tab === 'mix') loadMix()
    else if (tab === 'recommendations') loadRecommendations()
  }

  const isLoading = loading || mixLoading || playlistLoading

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-6 py-4 border-b border-border/50 flex-shrink-0 bg-gradient-to-r from-vk/10 to-transparent">
        <div className="flex items-center gap-3 mb-4">
          {openPlaylist ? (
            <button
              onClick={() => setOpenPlaylist(null)}
              className="p-2 rounded-xl hover:bg-bg-hover text-text-muted hover:text-text-primary transition-colors"
            >
              <ChevronLeft size={18} />
            </button>
          ) : (
            <div className="w-10 h-10 bg-vk rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-sm">VK</span>
            </div>
          )}
          <div>
            {openPlaylist ? (
              <>
                <h1 className="text-xl font-bold text-text-primary">{openPlaylist.title}</h1>
                <p className="text-sm text-text-muted">{openPlaylist.count} треков</p>
              </>
            ) : (
              <>
                <h1 className="text-xl font-bold text-text-primary">VK Музыка</h1>
                {vkUser && (
                  <p className="text-sm text-text-muted">
                    {vkUser.first_name} {vkUser.last_name}
                  </p>
                )}
              </>
            )}
          </div>
          {tab !== 'search' && (
            <button
              onClick={handleRefresh}
              className="ml-auto p-2 rounded-xl hover:bg-bg-hover text-text-muted hover:text-text-primary transition-colors"
            >
              <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
            </button>
          )}
        </div>

        {!openPlaylist && (
          <div className="flex gap-1 flex-wrap">
            {tabs.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium transition-all
                  ${tab === t.id
                    ? t.id === 'mix'
                      ? 'text-white'
                      : 'bg-vk text-white'
                    : 'text-text-muted hover:text-text-primary hover:bg-bg-hover'
                  }`}
                style={tab === t.id && t.id === 'mix'
                  ? { background: 'linear-gradient(135deg, #7c3aed, #2563eb)' }
                  : undefined
                }
              >
                {t.icon}
                {t.label}
              </button>
            ))}
          </div>
        )}
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

        <AnimatePresence mode="wait">
          {openPlaylist ? (
            <motion.div
              key="playlist-detail"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.15 }}
            >
              {playlistTracks.length > 0 && (
                <div className="flex gap-2 mb-3">
                  <button
                    onClick={() => setQueue(playlistTracks, 0)}
                    className="flex items-center gap-2 px-4 py-2 bg-vk hover:bg-vk-dark rounded-xl text-white text-sm font-medium transition-colors"
                  >
                    <Play size={14} className="fill-white" />
                    Слушать всё
                  </button>
                  <button
                    onClick={() => {
                      const idx = Math.floor(Math.random() * playlistTracks.length)
                      usePlayerStore.getState().toggleShuffle()
                      setQueue(playlistTracks, idx)
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-bg-elevated hover:bg-bg-hover border border-border rounded-xl text-sm text-text-secondary transition-colors"
                  >
                    <Shuffle size={14} />
                    Перемешать
                  </button>
                </div>
              )}
              {playlistLoading ? (
                <LoadingSpinner color="vk" />
              ) : playlistTracks.length === 0 ? (
                <EmptyState icon={<ListMusic size={28} />} message="Нет треков в плейлисте" />
              ) : (
                <TrackList tracks={playlistTracks} />
              )}
            </motion.div>
          ) : (
            <motion.div
              key={`tab-${tab}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.1 }}
            >
              {/* Library */}
              {tab === 'library' && (
                <>
                  {vkTracks.length > 0 && (
                    <div className="flex gap-2 mb-3 flex-wrap">
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
                    <div className="flex flex-col items-center justify-center h-40 gap-3">
                      <div className="w-8 h-8 border-2 border-vk border-t-transparent rounded-full animate-spin" />
                      {loadingProgress && <p className="text-sm text-text-muted">{loadingProgress}</p>}
                    </div>
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
                    <LoadingSpinner color="vk" />
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
                          onClick={() => openPlaylistDetail(pl)}
                        />
                      ))}
                    </div>
                  )}
                </>
              )}

              {/* VK Mix */}
              {tab === 'mix' && (
                <MixTab
                  tracks={mixTracks}
                  loading={mixLoading}
                  onPlay={() => mixTracks.length > 0 && setQueue(mixTracks, 0)}
                  onShuffle={() => {
                    if (mixTracks.length === 0) return
                    const idx = Math.floor(Math.random() * mixTracks.length)
                    usePlayerStore.getState().toggleShuffle()
                    setQueue(mixTracks, idx)
                  }}
                  onRefresh={loadMix}
                />
              )}

              {/* Recommendations */}
              {tab === 'recommendations' && (
                <>
                  {loading ? (
                    <LoadingSpinner color="vk" />
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
                      {searching ? <RefreshCw size={14} className="animate-spin" /> : 'Найти'}
                    </button>
                  </div>
                  {searchResults.length > 0 ? (
                    <TrackList tracks={searchResults} />
                  ) : !searching ? (
                    <EmptyState icon={<Search size={28} />} message="Введите запрос для поиска" />
                  ) : null}
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

const MixTab: React.FC<{
  tracks: Track[]; loading: boolean
  onPlay: () => void; onShuffle: () => void; onRefresh: () => void
}> = ({ tracks, loading, onPlay, onShuffle, onRefresh }) => (
  <div>
    {/* Mix hero banner */}
    <div
      className="relative rounded-2xl overflow-hidden mb-4 p-5"
      style={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 30%, #0f3460 60%, #533483 100%)' }}
    >
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -left-8 -top-8 w-40 h-40 rounded-full opacity-40 animate-pulse"
          style={{ background: 'radial-gradient(circle, #7c3aed 0%, transparent 70%)' }} />
        <div className="absolute right-0 bottom-0 w-48 h-32 rounded-full opacity-30 animate-pulse"
          style={{ background: 'radial-gradient(circle, #2563eb 0%, transparent 70%)', animationDelay: '1s' }} />
        <div className="absolute right-1/3 top-0 w-32 h-32 rounded-full opacity-20 animate-pulse"
          style={{ background: 'radial-gradient(circle, #06b6d4 0%, transparent 70%)', animationDelay: '0.5s' }} />
      </div>
      <div className="relative flex items-center gap-4">
        <div className="w-14 h-14 rounded-2xl bg-white/15 backdrop-blur-sm flex items-center justify-center flex-shrink-0">
          <Radio size={24} className="text-white" />
        </div>
        <div className="flex-1">
          <p className="text-white font-bold text-lg">VK Микс</p>
          <p className="text-white/70 text-sm">Музыкальные рекомендации для вас</p>
        </div>
        <button
          onClick={onRefresh}
          className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors"
          title="Обновить микс"
        >
          <RefreshCw size={14} className={`text-white ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>
      {tracks.length > 0 && (
        <div className="relative flex gap-2 mt-4">
          <button
            onClick={onPlay}
            className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-xl text-white text-sm font-medium transition-colors"
          >
            <Play size={14} className="fill-white" />
            Слушать
          </button>
          <button
            onClick={onShuffle}
            className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-xl text-white/80 text-sm transition-colors"
          >
            <Shuffle size={14} />
            Перемешать
          </button>
          <span className="text-white/50 text-sm flex items-center ml-2">{tracks.length} треков</span>
        </div>
      )}
    </div>

    {loading ? (
      <div className="flex flex-col items-center justify-center h-40 gap-3">
        <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin"
          style={{ borderColor: '#7c3aed', borderTopColor: 'transparent' }} />
        <p className="text-sm text-text-muted">Подбираем музыку для вас...</p>
      </div>
    ) : tracks.length === 0 ? (
      <EmptyState icon={<Radio size={28} />} message="Нажмите обновить чтобы загрузить микс" />
    ) : (
      <TrackList tracks={tracks} />
    )}
  </div>
)

const TrackList: React.FC<{ tracks: Track[] }> = ({ tracks }) => (
  <div className="space-y-0.5">
    {tracks.map((track, i) => (
      <motion.div
        key={track.id}
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: Math.min(i * 0.01, 0.3) }}
      >
        <TrackItem track={track} index={i} queue={tracks} showAlbum={false} />
      </motion.div>
    ))}
  </div>
)

const LoadingSpinner: React.FC<{ color?: string }> = ({ color = 'vk' }) => (
  <div className="flex items-center justify-center h-40">
    <div className={`w-8 h-8 border-2 border-${color} border-t-transparent rounded-full animate-spin`} />
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
        <img src={cover} alt={title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
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
