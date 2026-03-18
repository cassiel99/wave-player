import React, { useEffect, useState, useMemo } from 'react'
import { FolderOpen, Music2, RefreshCw, Search, SortAsc, Filter, Play, Shuffle } from 'lucide-react'
import { motion } from 'framer-motion'
import { useLibraryStore } from '../../store/libraryStore'
import { usePlayerStore } from '../../store/playerStore'
import { TrackItem } from '../ui/TrackItem'
import { Track } from '../../types'

type SortBy = 'title' | 'artist' | 'album' | 'duration'
type LocalTrackExt = Track & { addedAt?: number }
type GroupBy = 'none' | 'artist' | 'album'

export const LocalLibrary: React.FC = () => {
  const { localTracks, isScanning, setLocalTracks, setScanning, setScanError, directories, setDirectories } =
    useLibraryStore()
  const { playTrack, setQueue } = usePlayerStore()

  const [query, setQuery] = useState('')
  const [sortBy, setSortBy] = useState<SortBy>('title')
  const [sortAsc, setSortAsc] = useState(true)
  const [groupBy, setGroupBy] = useState<GroupBy>('none')

  useEffect(() => {
    loadDirectories()
  }, [])

  const loadDirectories = async () => {
    const dirs = await window.api.fs.getDirectories()
    setDirectories(dirs)
  }

  const handleScan = async () => {
    setScanning(true)
    setScanError(null)
    try {
      const files = await window.api.fs.scan()
      if (files && files.length >= 0) {
        type RawFile = { id: string; filePath: string; title: string; artist: string; album: string; duration: number; cover: string | null; year?: number | null; genre?: string }
      const tracks: Track[] = (files as RawFile[]).map((f) => ({
          id: f.id,
          source: 'local' as const,
          title: f.title,
          artist: f.artist,
          album: f.album,
          duration: f.duration,
          cover: f.cover,
          filePath: f.filePath,
          year: f.year,
          genre: f.genre,
        }))
        setLocalTracks(tracks)
        const dirs = await window.api.fs.getDirectories()
        setDirectories(dirs)
      }
    } catch (e: unknown) {
      const err = e as { message?: string }
      setScanError(err?.message || 'Scan failed')
    } finally {
      setScanning(false)
    }
  }

  const handleAddDirectory = async () => {
    try {
      const result = await window.api.fs.addDirectory()
      if (result) {
        setDirectories(result.directories)
        type RawFile2 = { id: string; filePath: string; title: string; artist: string; album: string; duration: number; cover: string | null }
        const newTracks: Track[] = (result.files as RawFile2[]).map((f) => ({
          id: f.id,
          source: 'local' as const,
          title: f.title,
          artist: f.artist,
          album: f.album,
          duration: f.duration,
          cover: f.cover,
          filePath: f.filePath,
        }))
        setLocalTracks([...localTracks, ...newTracks])
      }
    } catch {}
  }

  const filtered = useMemo(() => {
    let tracks = localTracks as LocalTrackExt[]
    if (query) {
      const q = query.toLowerCase()
      tracks = tracks.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          t.artist.toLowerCase().includes(q) ||
          t.album.toLowerCase().includes(q)
      )
    }
    return [...tracks].sort((a, b) => {
      const va = a[sortBy] ?? ''
      const vb = b[sortBy] ?? ''
      if (sortBy === 'duration') {
        return sortAsc ? (va as number) - (vb as number) : (vb as number) - (va as number)
      }
      const cmp = String(va).localeCompare(String(vb), 'ru')
      return sortAsc ? cmp : -cmp
    })
  }, [localTracks, query, sortBy, sortAsc])

  const handlePlayAll = () => {
    if (filtered.length > 0) setQueue(filtered, 0)
  }

  const handleShuffle = () => {
    if (filtered.length > 0) {
      const idx = Math.floor(Math.random() * filtered.length)
      const store = usePlayerStore.getState()
      store.toggleShuffle()
      store.setQueue(filtered, idx)
    }
  }

  const totalDuration = useMemo(
    () => filtered.reduce((sum, t) => sum + t.duration, 0),
    [filtered]
  )

  const formatTotal = (seconds: number) => {
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    return h > 0 ? `${h} ч ${m} мин` : `${m} мин`
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-6 py-4 border-b border-border/50 flex-shrink-0">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-text-primary">Локальная библиотека</h1>
            <p className="text-sm text-text-muted mt-0.5">
              {localTracks.length} треков · {formatTotal(totalDuration)}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleAddDirectory}
              className="flex items-center gap-2 px-3 py-2 bg-bg-elevated hover:bg-bg-hover border border-border rounded-xl text-sm text-text-secondary hover:text-text-primary transition-all"
            >
              <FolderOpen size={15} />
              Добавить папку
            </button>
            <button
              onClick={handleScan}
              disabled={isScanning}
              className="flex items-center gap-2 px-3 py-2 bg-primary/20 hover:bg-primary/30 border border-primary/30 rounded-xl text-sm text-primary-light transition-all disabled:opacity-50"
            >
              <RefreshCw size={15} className={isScanning ? 'animate-spin' : ''} />
              {isScanning ? 'Сканирую...' : 'Сканировать'}
            </button>
          </div>
        </div>

        {/* Directories pills */}
        {directories.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {directories.map((dir) => (
              <span
                key={dir}
                className="text-xs px-2.5 py-1 bg-bg-hover border border-border rounded-full text-text-muted"
              >
                {dir.split(/[/\\]/).slice(-2).join('/')}
              </span>
            ))}
          </div>
        )}

        {/* Controls row */}
        <div className="flex items-center gap-3">
          {/* Play controls */}
          {filtered.length > 0 && (
            <>
              <button
                onClick={handlePlayAll}
                className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-light rounded-xl text-white text-sm font-medium transition-colors"
              >
                <Play size={14} className="fill-white" />
                Слушать все
              </button>
              <button
                onClick={handleShuffle}
                className="flex items-center gap-2 px-4 py-2 bg-bg-elevated hover:bg-bg-hover border border-border rounded-xl text-sm text-text-secondary transition-colors"
              >
                <Shuffle size={14} />
                Перемешать
              </button>
            </>
          )}

          <div className="flex-1" />

          {/* Search */}
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Поиск..."
              className="bg-bg-elevated border border-border rounded-xl pl-8 pr-4 py-2 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-primary/50 w-52 transition-colors"
            />
          </div>

          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortBy)}
            className="bg-bg-elevated border border-border rounded-xl px-3 py-2 text-sm text-text-secondary focus:outline-none"
          >
            <option value="title">По названию</option>
            <option value="artist">По исполнителю</option>
            <option value="album">По альбому</option>
            <option value="duration">По длительности</option>
            </select>

          <button
            onClick={() => setSortAsc(!sortAsc)}
            className="p-2 bg-bg-elevated border border-border rounded-xl text-text-muted hover:text-text-primary transition-colors"
          >
            <SortAsc size={14} className={sortAsc ? '' : 'rotate-180'} />
          </button>
        </div>
      </div>

      {/* Track list */}
      <div className="flex-1 overflow-y-auto px-4 py-2">
        {isScanning ? (
          <div className="flex flex-col items-center justify-center h-64 gap-4">
            <div className="w-12 h-12 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-text-muted">Сканируем файлы...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 gap-4">
            <div className="w-16 h-16 bg-bg-elevated rounded-2xl flex items-center justify-center">
              <Music2 size={28} className="text-text-muted" />
            </div>
            <div className="text-center">
              <p className="text-text-primary font-medium">
                {localTracks.length === 0 ? 'Нет музыки' : 'Ничего не найдено'}
              </p>
              <p className="text-text-muted text-sm mt-1">
                {localTracks.length === 0
                  ? 'Добавьте папку с музыкой или запустите сканирование'
                  : 'Попробуйте другой запрос'}
              </p>
            </div>
            {localTracks.length === 0 && (
              <button
                onClick={handleScan}
                className="px-4 py-2 bg-primary hover:bg-primary-light rounded-xl text-white text-sm transition-colors"
              >
                Добавить музыку
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-0.5">
            {/* Header */}
            <div className="flex items-center gap-3 px-4 py-2 text-xs text-text-muted uppercase tracking-wider border-b border-border/30 mb-1">
              <div className="w-8">#</div>
              <div className="w-10" />
              <div className="flex-1">Название</div>
              <div className="hidden md:block flex-1">Альбом</div>
              <div className="w-10 text-right" />
              <div className="w-10" />
              <div className="w-8" />
            </div>
            {filtered.map((track, i) => (
              <motion.div
                key={track.id}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.01, 0.3) }}
              >
                <TrackItem
                  track={track}
                  index={i}
                  queue={filtered}
                  showAlbum
                />
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
