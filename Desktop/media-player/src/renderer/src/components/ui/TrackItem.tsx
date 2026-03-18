import React, { useState } from 'react'
import { Play, Pause, MoreHorizontal, Heart, Plus, ListMusic, Download } from 'lucide-react'
import { Track, formatDuration } from '../../types'
import { usePlayerStore } from '../../store/playerStore'
import { motion } from 'framer-motion'

interface TrackItemProps {
  track: Track
  index?: number
  queue?: Track[]
  showAlbum?: boolean
  showSource?: boolean
  compact?: boolean
  onLike?: (track: Track) => void
  onAddToQueue?: (track: Track) => void
  extra?: React.ReactNode
}

const Equalizer = () => (
  <div className="flex items-end gap-[2px] h-4">
    <div className="w-[3px] bg-primary-light rounded-sm animate-eq-1" />
    <div className="w-[3px] bg-primary-light rounded-sm animate-eq-2" />
    <div className="w-[3px] bg-primary-light rounded-sm animate-eq-3" />
  </div>
)

export const TrackItem: React.FC<TrackItemProps> = ({
  track,
  index,
  queue,
  showAlbum = true,
  compact = false,
  onLike,
  onAddToQueue,
}) => {
  const { currentTrack, isPlaying, playTrack, togglePlay, addToQueue } = usePlayerStore()
  const [menuOpen, setMenuOpen] = useState(false)
  const [liked, setLiked] = useState(track.liked || false)

  const isCurrentTrack = currentTrack?.id === track.id

  const handlePlay = () => {
    if (isCurrentTrack) {
      togglePlay()
    } else {
      playTrack(track, queue)
    }
  }

  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation()
    setLiked(!liked)
    onLike?.(track)
  }

  const coverUrl = track.cover || null

  return (
    <motion.div
      className={`group flex items-center gap-3 px-4 rounded-xl cursor-pointer transition-colors duration-150 relative overflow-hidden
        ${isCurrentTrack ? 'bg-primary/10 border border-primary/20' : 'hover:bg-bg-hover border border-transparent'}
        ${compact ? 'py-1.5' : 'py-2.5'}`}
      onClick={handlePlay}
      whileHover={{ x: 3 }}
      whileTap={{ scale: 0.985 }}
      transition={{ duration: 0.15 }}
    >
      {/* Hover shimmer */}
      {isCurrentTrack && (
        <motion.div
          className="absolute inset-0 pointer-events-none rounded-xl"
          animate={{ opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          style={{
            background:
              'linear-gradient(90deg, transparent 0%, rgba(124,58,237,0.06) 50%, transparent 100%)',
          }}
        />
      )}
      {/* Index / Play indicator */}
      <div className="w-8 flex-shrink-0 flex items-center justify-center">
        {isCurrentTrack && isPlaying ? (
          <Equalizer />
        ) : (
          <span className="text-text-muted text-sm group-hover:hidden">
            {index !== undefined ? index + 1 : ''}
          </span>
        )}
        <button className={`${isCurrentTrack && isPlaying ? 'hidden' : ''} hidden group-hover:flex items-center justify-center`}>
          {isCurrentTrack && !isPlaying ? (
            <Play size={14} className="text-primary-light fill-primary-light" />
          ) : (
            <Play size={14} className="text-text-primary fill-text-primary" />
          )}
        </button>
      </div>

      {/* Cover */}
      <div className="w-10 h-10 flex-shrink-0 rounded-lg overflow-hidden bg-bg-active">
        {coverUrl ? (
          <motion.img
            src={coverUrl}
            alt={track.album}
            className="w-full h-full object-cover"
            whileHover={{ scale: 1.1 }}
            transition={{ duration: 0.2 }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ListMusic size={16} className="text-text-muted" />
          </div>
        )}
      </div>

      {/* Title & Artist */}
      <div className="flex-1 min-w-0">
        <p
          className={`font-medium truncate text-sm ${isCurrentTrack ? 'text-primary-light' : 'text-text-primary'}`}
        >
          {track.title}
        </p>
        <p className="text-xs text-text-muted truncate">{track.artist}</p>
      </div>

      {/* Album (optional) */}
      {showAlbum && !compact && (
        <div className="hidden md:block flex-1 min-w-0 mr-4">
          <p className="text-xs text-text-muted truncate">{track.album}</p>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2 ml-auto">
        <button
          onClick={handleLike}
          className={`opacity-0 group-hover:opacity-100 transition-all p-1.5 rounded-full hover:bg-bg-active
            ${liked ? 'opacity-100 text-accent-pink' : 'text-text-muted hover:text-text-primary'}`}
        >
          <Heart size={14} className={liked ? 'fill-accent-pink' : ''} />
        </button>

        <span className="text-xs text-text-muted w-10 text-right">
          {formatDuration(track.duration)}
        </span>

        <div className="relative">
          <button
            onClick={(e) => {
              e.stopPropagation()
              setMenuOpen(!menuOpen)
            }}
            className="opacity-0 group-hover:opacity-100 p-1.5 rounded-full hover:bg-bg-active text-text-muted hover:text-text-primary transition-all"
          >
            <MoreHorizontal size={14} />
          </button>

          {menuOpen && (
            <div
              className="absolute right-0 bottom-full mb-1 w-48 bg-bg-elevated border border-border rounded-xl shadow-2xl z-50 py-1"
              onMouseLeave={() => setMenuOpen(false)}
            >
              <button
                className="w-full text-left px-3 py-2 text-sm text-text-secondary hover:text-text-primary hover:bg-bg-hover flex items-center gap-2"
                onClick={(e) => {
                  e.stopPropagation()
                  addToQueue(track)
                  onAddToQueue?.(track)
                  setMenuOpen(false)
                }}
              >
                <Plus size={14} />
                Добавить в очередь
              </button>
              {track.source === 'local' && (
                <button
                  className="w-full text-left px-3 py-2 text-sm text-text-secondary hover:text-text-primary hover:bg-bg-hover flex items-center gap-2"
                  onClick={(e) => {
                    e.stopPropagation()
                    setMenuOpen(false)
                  }}
                >
                  <Download size={14} />
                  Показать в папке
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}
