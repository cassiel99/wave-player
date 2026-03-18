import React, { useState, useEffect, useRef } from 'react'
import { Search, Music2, RefreshCw } from 'lucide-react'
import { motion } from 'framer-motion'
import { useLibraryStore } from '../../store/libraryStore'
import { useServicesStore } from '../../store/servicesStore'
import { TrackItem } from '../ui/TrackItem'
import { Track } from '../../types'

function yandexTrackToTrack(t: {
  id: number; title: string; durationMs: number;
  coverUri?: string;
  artists: { name: string }[];
  albums: { id: number; title: string; year?: number }[];
}): Track {
  return {
    id: `yandex_${t.id}`,
    source: 'yandex',
    title: t.title,
    artist: t.artists?.map((a) => a.name).join(', ') || 'Unknown',
    album: t.albums?.[0]?.title || '',
    duration: Math.floor((t.durationMs || 0) / 1000),
    cover: t.coverUri ? `https://${t.coverUri.replace('%%', '300x300')}` : null,
    yandexId: t.id,
  }
}

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
    duration: vk.duration,
    url: vk.url,
    cover: vk.album?.thumb?.photo_300 || null,
    vkOwnerId: vk.owner_id,
    vkId: vk.id,
  }
}

export const SearchView: React.FC = () => {
  const { localTracks } = useLibraryStore()
  const { vkUser, yandexAccount } = useServicesStore()

  const [query, setQuery] = useState('')
  const [localResults, setLocalResults] = useState<Track[]>([])
  const [vkResults, setVkResults] = useState<Track[]>([])
  const [yandexResults, setYandexResults] = useState<Track[]>([])
  const [loading, setLoading] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Local search (instant)
  useEffect(() => {
    if (!query) {
      setLocalResults([])
      return
    }
    const q = query.toLowerCase()
    setLocalResults(
      localTracks
        .filter(
          (t) =>
            t.title.toLowerCase().includes(q) ||
            t.artist.toLowerCase().includes(q) ||
            t.album.toLowerCase().includes(q)
        )
        .slice(0, 20)
    )
  }, [query, localTracks])

  // Remote search with debounce
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (!query || query.length < 2) {
      setVkResults([])
      setYandexResults([])
      return
    }

    debounceRef.current = setTimeout(async () => {
      setLoading(true)
      const promises: Promise<void>[] = []

      if (vkUser) {
        promises.push(
          window.api.vk
            .search(query, 20)
            .then((r) => {
              const items = (r.items || []) as Parameters<typeof vkTrackToTrack>[0][]
              setVkResults(items.map(vkTrackToTrack))
            })
            .catch(() => {})
        )
      }

      if (yandexAccount) {
        promises.push(
          window.api.yandex
            .search(query, 'all')
            .then((r) => {
              const results = ((r as Record<string, { results?: unknown[] }>).tracks?.results || []) as Parameters<typeof yandexTrackToTrack>[0][]
              setYandexResults(results.map(yandexTrackToTrack).slice(0, 20))
            })
            .catch(() => {})
        )
      }

      await Promise.all(promises)
      setLoading(false)
    }, 500)
  }, [query, vkUser, yandexAccount])

  const hasResults = localResults.length > 0 || vkResults.length > 0 || yandexResults.length > 0

  return (
    <div className="flex flex-col h-full">
      {/* Search bar */}
      <div className="px-6 py-4 border-b border-border/50">
        <div className="relative max-w-2xl">
          <Search
            size={18}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted"
          />
          <input
            autoFocus
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Поиск по всем источникам..."
            className="w-full bg-bg-elevated border border-border rounded-2xl pl-11 pr-4 py-3 text-text-primary placeholder-text-muted focus:outline-none focus:border-primary/50 text-base transition-colors"
          />
          {loading && (
            <RefreshCw
              size={14}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted animate-spin"
            />
          )}
        </div>
      </div>

      {/* Results */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        {!query ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-text-muted">
            <Search size={36} strokeWidth={1.5} />
            <p className="text-lg">Начните вводить для поиска</p>
            <p className="text-sm text-text-muted">
              Поиск по локальным файлам
              {vkUser ? ', VK Музыке' : ''}
              {yandexAccount ? ', Яндекс Музыке' : ''}
            </p>
          </div>
        ) : !hasResults && !loading ? (
          <div className="flex flex-col items-center justify-center h-40 gap-3 text-text-muted">
            <p>Ничего не найдено для «{query}»</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Local results */}
            {localResults.length > 0 && (
              <ResultSection title="Локальная библиотека" tracks={localResults} />
            )}

            {/* VK results */}
            {vkResults.length > 0 && (
              <ResultSection
                title="VK Музыка"
                tracks={vkResults}
                badge={<span className="px-2 py-0.5 bg-vk/20 text-vk text-xs rounded-full">VK</span>}
              />
            )}

            {/* Yandex results */}
            {yandexResults.length > 0 && (
              <ResultSection
                title="Яндекс Музыка"
                tracks={yandexResults}
                badge={<span className="px-2 py-0.5 bg-yandex/20 text-yandex text-xs rounded-full">Я</span>}
              />
            )}
          </div>
        )}
      </div>
    </div>
  )
}

const ResultSection: React.FC<{
  title: string
  tracks: Track[]
  badge?: React.ReactNode
}> = ({ title, tracks, badge }) => (
  <section>
    <div className="flex items-center gap-2 mb-2">
      <h3 className="font-semibold text-text-primary">{title}</h3>
      {badge}
      <span className="text-xs text-text-muted">({tracks.length})</span>
    </div>
    <div className="space-y-0.5">
      {tracks.map((track, i) => (
        <motion.div
          key={track.id}
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.02 }}
        >
          <TrackItem track={track} index={i} queue={tracks} />
        </motion.div>
      ))}
    </div>
  </section>
)
