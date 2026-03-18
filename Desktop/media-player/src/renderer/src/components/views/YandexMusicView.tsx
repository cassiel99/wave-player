import React, { useEffect, useState } from 'react'
import {
  Heart, ListMusic, Search, Radio, RefreshCw, Play, Shuffle, Music2
} from 'lucide-react'
import { motion } from 'framer-motion'
import { useServicesStore } from '../../store/servicesStore'
import { usePlayerStore } from '../../store/playerStore'
import { TrackItem } from '../ui/TrackItem'
import { Track, yandexCover, YandexStation } from '../../types'

function yandexTrackToTrack(t: {
  id: number; title: string; durationMs: number; available: boolean;
  coverUri?: string;
  artists: { id: number; name: string }[];
  albums: { id: number; title: string; year?: number }[];
  liked?: boolean;
}): Track {
  return {
    id: `yandex_${t.id}`,
    source: 'yandex',
    title: t.title,
    artist: t.artists?.map((a) => a.name).join(', ') || 'Unknown',
    album: t.albums?.[0]?.title || '',
    albumId: t.albums?.[0]?.id,
    duration: Math.floor((t.durationMs || 0) / 1000),
    cover: yandexCover(t.coverUri),
    yandexId: t.id,
    year: t.albums?.[0]?.year,
    liked: t.liked,
  }
}

type YandexTab = 'likes' | 'playlists' | 'stations' | 'search'

export const YandexMusicView: React.FC<{ initialTab?: YandexTab }> = ({
  initialTab = 'likes',
}) => {
  const { yandexAccount, yandexLikes, yandexPlaylists, setYandexLikes, setYandexPlaylists } =
    useServicesStore()
  const { setQueue } = usePlayerStore()

  const [tab, setTab] = useState<YandexTab>(initialTab)
  const [loading, setLoading] = useState(false)
  const [stations, setStations] = useState<YandexStation[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Track[]>([])
  const [searching, setSearching] = useState(false)

  useEffect(() => {
    if (!yandexAccount) return
    if (tab === 'likes' && yandexLikes.length === 0) loadLikes()
    if (tab === 'playlists' && yandexPlaylists.length === 0) loadPlaylists()
    if (tab === 'stations' && stations.length === 0) loadStations()
  }, [tab, yandexAccount])

  const loadLikes = async () => {
    setLoading(true)
    try {
      const result = await window.api.yandex.getLikes()
      const tracks = ((result?.library?.tracks || []) as Parameters<typeof yandexTrackToTrack>[0][]).map(yandexTrackToTrack)
      setYandexLikes(tracks)
    } catch {}
    setLoading(false)
  }

  const loadPlaylists = async () => {
    setLoading(true)
    try {
      const playlists = await window.api.yandex.getPlaylists()
      type YandexPlaylistRaw = { uid: number; kind: number; title: string; trackCount: number; ogImage?: string; cover?: { uri: string } }
      setYandexPlaylists(
        ((playlists || []) as YandexPlaylistRaw[]).map((p) => ({
          id: `ypl_${p.uid}_${p.kind}`,
          source: 'yandex' as const,
          title: p.title,
          cover: yandexCover(p.ogImage || p.cover?.uri),
          trackCount: p.trackCount,
          yandexUid: p.uid,
          yandexKind: p.kind,
        }))
      )
    } catch {}
    setLoading(false)
  }

  const loadStations = async () => {
    setLoading(true)
    try {
      const result = await window.api.yandex.getStations()
      setStations((result || []) as YandexStation[])
    } catch {}
    setLoading(false)
  }

  const handleSearch = async () => {
    if (!searchQuery.trim()) return
    setSearching(true)
    try {
      const result = await window.api.yandex.search(searchQuery, 'all')
      const rawTracks = (result as Record<string, { results?: unknown[] }>)?.tracks?.results || []
      const tracks = (rawTracks as Parameters<typeof yandexTrackToTrack>[0][]).map(yandexTrackToTrack)
      setSearchResults(tracks)
    } catch {}
    setSearching(false)
  }

  const handleLike = async (track: Track) => {
    if (!track.yandexId) return
    try {
      if (track.liked) {
        await window.api.yandex.unlikeTrack(track.yandexId)
      } else {
        await window.api.yandex.likeTrack(track.yandexId)
      }
    } catch {}
  }

  const tabs = [
    { id: 'likes', icon: <Heart size={14} />, label: 'Мне нравится' },
    { id: 'playlists', icon: <ListMusic size={14} />, label: 'Плейлисты' },
    { id: 'stations', icon: <Radio size={14} />, label: 'Радио' },
    { id: 'search', icon: <Search size={14} />, label: 'Поиск' },
  ] as const

  return (
    <div className="flex flex-col h-full">
      {/* Header with Yandex orange */}
      <div className="px-6 py-4 border-b border-border/50 flex-shrink-0 bg-gradient-to-r from-yandex/10 to-transparent">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-yandex rounded-xl flex items-center justify-center shadow-lg">
            <span className="text-white font-bold text-lg">Я</span>
          </div>
          <div>
            <h1 className="text-xl font-bold text-text-primary">Яндекс Музыка</h1>
            {yandexAccount && (
              <p className="text-sm text-text-muted">
                {yandexAccount.display_name || yandexAccount.login}
              </p>
            )}
          </div>
          {tab !== 'search' && (
            <button
              onClick={() =>
                tab === 'likes' ? loadLikes() : tab === 'playlists' ? loadPlaylists() : loadStations()
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
                ${tab === t.id ? 'bg-yandex text-white' : 'text-text-muted hover:text-text-primary hover:bg-bg-hover'}`}
            >
              {t.icon}
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 py-3">
        {/* Likes */}
        {tab === 'likes' && (
          <>
            {yandexLikes.length > 0 && (
              <div className="flex gap-2 mb-3">
                <button
                  onClick={() => setQueue(yandexLikes, 0)}
                  className="flex items-center gap-2 px-4 py-2 bg-yandex hover:bg-yandex-dark rounded-xl text-white text-sm font-medium transition-colors"
                >
                  <Play size={14} className="fill-white" />
                  Слушать всё
                </button>
                <button
                  onClick={() => {
                    const idx = Math.floor(Math.random() * yandexLikes.length)
                    usePlayerStore.getState().toggleShuffle()
                    setQueue(yandexLikes, idx)
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-bg-elevated hover:bg-bg-hover border border-border rounded-xl text-sm text-text-secondary transition-colors"
                >
                  <Shuffle size={14} />
                  Перемешать
                </button>
                <span className="ml-2 text-sm text-text-muted flex items-center">
                  {yandexLikes.length} треков
                </span>
              </div>
            )}
            {loading ? (
              <LoadingSpinner color="yandex" />
            ) : yandexLikes.length === 0 ? (
              <EmptyState icon={<Heart size={28} />} message="Нет понравившихся треков" />
            ) : (
              <TrackList tracks={yandexLikes} onLike={handleLike} />
            )}
          </>
        )}

        {/* Playlists */}
        {tab === 'playlists' && (
          <>
            {loading ? (
              <LoadingSpinner color="yandex" />
            ) : yandexPlaylists.length === 0 ? (
              <EmptyState icon={<ListMusic size={28} />} message="Нет плейлистов" />
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {yandexPlaylists.map((pl) => (
                  <PlaylistCard
                    key={pl.id}
                    title={pl.title}
                    count={pl.trackCount}
                    cover={pl.cover}
                    onClick={() => {}}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {/* Radio Stations */}
        {tab === 'stations' && (
          <>
            {loading ? (
              <LoadingSpinner color="yandex" />
            ) : stations.length === 0 ? (
              <EmptyState icon={<Radio size={28} />} message="Нет радиостанций" />
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {stations.map((s, i) => {
                  const st = s.station
                  return (
                    <motion.button
                      key={i}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.03 }}
                      onClick={async () => {
                        const stId = `${st.id.type}:${st.id.tag}`
                        try {
                          const result = await window.api.yandex.getStationTracks(stId)
                          type SeqItem = { track: Parameters<typeof yandexTrackToTrack>[0] }
                          const tracks = ((result?.sequence || []) as SeqItem[])
                            .map((s) => yandexTrackToTrack(s.track))
                            .filter((t) => t.yandexId)
                          if (tracks.length) setQueue(tracks, 0)
                        } catch {}
                      }}
                      className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-bg-elevated hover:bg-bg-hover border border-border transition-all group text-left"
                    >
                      <div className="w-16 h-16 rounded-xl overflow-hidden bg-gradient-to-br from-yandex/20 to-yandex/5 flex items-center justify-center">
                        {st.icon?.imageUrl ? (
                          <img src={st.icon.imageUrl} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <Radio size={24} className="text-yandex" />
                        )}
                      </div>
                      <span className="text-xs text-text-secondary group-hover:text-text-primary text-center">
                        {st.name}
                      </span>
                    </motion.button>
                  )
                })}
              </div>
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
                  placeholder="Поиск в Яндекс Музыке..."
                  className="w-full bg-bg-elevated border border-border rounded-xl pl-9 pr-4 py-2.5 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-yandex transition-colors"
                />
              </div>
              <button
                onClick={handleSearch}
                disabled={searching || !searchQuery.trim()}
                className="px-4 py-2 bg-yandex hover:bg-yandex-dark disabled:opacity-50 rounded-xl text-white text-sm transition-colors"
              >
                {searching ? <RefreshCw size={14} className="animate-spin" /> : 'Найти'}
              </button>
            </div>
            {searchResults.length > 0 ? (
              <TrackList tracks={searchResults} onLike={handleLike} />
            ) : !searching ? (
              <EmptyState icon={<Search size={28} />} message="Введите запрос для поиска" />
            ) : null}
          </>
        )}
      </div>
    </div>
  )
}

const TrackList: React.FC<{ tracks: Track[]; onLike?: (t: Track) => void }> = ({
  tracks,
  onLike,
}) => (
  <div className="space-y-0.5">
    {tracks.map((track, i) => (
      <motion.div
        key={track.id}
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: Math.min(i * 0.01, 0.3) }}
      >
        <TrackItem track={track} index={i} queue={tracks} onLike={onLike} />
      </motion.div>
    ))}
  </div>
)

const LoadingSpinner: React.FC<{ color?: string }> = ({ color = 'primary' }) => (
  <div className="flex items-center justify-center h-40">
    <div
      className={`w-8 h-8 border-2 border-t-transparent rounded-full animate-spin`}
      style={{ borderColor: color === 'yandex' ? '#fc3f1d transparent transparent transparent' : undefined }}
    />
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
