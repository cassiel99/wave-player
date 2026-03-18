import React from 'react'
import {
  Play, Pause, SkipBack, SkipForward, Shuffle, Repeat, Repeat1,
  ListMusic, Heart, Music2
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { usePlayerStore } from '../store/playerStore'
import { useUIStore } from '../store/uiStore'
import { ProgressBar } from './player/ProgressBar'
import { VolumeControl } from './player/VolumeControl'
import { formatDuration } from '../types'

interface PlayerBarProps {
  onSeek: (time: number) => void
}

const Equalizer = () => (
  <div className="flex items-end gap-[2px] h-3 px-1">
    <div className="w-[2px] bg-primary-light rounded-sm animate-eq-1" />
    <div className="w-[2px] bg-primary-light rounded-sm animate-eq-2" />
    <div className="w-[2px] bg-primary-light rounded-sm animate-eq-3" />
  </div>
)

export const PlayerBar: React.FC<PlayerBarProps> = ({ onSeek }) => {
  const {
    currentTrack, isPlaying, progress, duration, repeat, shuffle,
    isLoading, togglePlay, next, prev, toggleRepeat, toggleShuffle,
  } = usePlayerStore()
  const { toggleQueue } = useUIStore()

  const coverUrl = currentTrack?.cover

  return (
    <motion.div
      className="h-20 border-t border-border/50 bg-bg-base/90 backdrop-blur-xl flex items-center px-4 gap-4 relative z-30"
      initial={{ y: 80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.1, duration: 0.5, ease: [0.34, 1.2, 0.64, 1] }}
    >
      {/* Ambient glow */}
      <AnimatePresence>
        {coverUrl && (
          <motion.div
            key={currentTrack?.id}
            className="absolute inset-0 opacity-5 pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.05 }}
            exit={{ opacity: 0 }}
            style={{
              background: `radial-gradient(ellipse at 20% 50%, rgba(124,58,237,0.6) 0%, transparent 70%)`,
            }}
          />
        )}
      </AnimatePresence>

      {/* Track info */}
      <div className="flex items-center gap-3 w-72 min-w-0">
        <AnimatePresence mode="wait">
          {currentTrack ? (
            <motion.div
              key={currentTrack.id}
              initial={{ opacity: 0, scale: 0.75, rotate: -10 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              exit={{ opacity: 0, scale: 0.75, rotate: 10 }}
              transition={{ duration: 0.3, ease: [0.34, 1.4, 0.64, 1] }}
              className="flex-shrink-0 relative w-12 h-12"
            >
              {/* Vinyl disc */}
              <div
                className="w-12 h-12 rounded-full overflow-hidden bg-bg-active shadow-xl border border-white/5"
                style={{
                  animation: isPlaying ? 'spin-vinyl 8s linear infinite' : 'none',
                }}
              >
                {coverUrl ? (
                  <img src={coverUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-bg-active">
                    <Music2 size={18} className="text-text-muted" />
                  </div>
                )}
              </div>
              {/* Center dot */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-2 h-2 rounded-full bg-bg-base border border-white/10" />
              </div>
              {/* Playing glow ring */}
              {isPlaying && (
                <div className="absolute inset-0 rounded-full animate-pulse-glow pointer-events-none" />
              )}
            </motion.div>
          ) : (
            <div className="w-12 h-12 rounded-full bg-bg-active flex-shrink-0 flex items-center justify-center">
              <Music2 size={18} className="text-text-muted" />
            </div>
          )}
        </AnimatePresence>

        <div className="min-w-0 flex-1">
          <AnimatePresence mode="wait">
            {currentTrack ? (
              <motion.div
                key={currentTrack.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.2 }}
              >
                <div className="flex items-center gap-1">
                  {isPlaying && <Equalizer />}
                  <p className="text-sm font-medium text-text-primary truncate">{currentTrack.title}</p>
                </div>
                <p className="text-xs text-text-muted truncate">{currentTrack.artist}</p>
              </motion.div>
            ) : (
              <p className="text-sm text-text-muted">Ничего не играет</p>
            )}
          </AnimatePresence>
        </div>

        {currentTrack && (
          <motion.button
            className="text-text-muted hover:text-accent-pink transition-colors ml-auto flex-shrink-0"
            whileHover={{ scale: 1.2 }}
            whileTap={{ scale: 0.9 }}
          >
            <Heart size={14} />
          </motion.button>
        )}
      </div>

      {/* Center controls */}
      <div className="flex-1 flex flex-col items-center gap-1 max-w-xl mx-auto">
        <div className="flex items-center gap-2">
          {/* Shuffle */}
          <motion.button
            onClick={toggleShuffle}
            className={`p-1.5 rounded-full transition-all ${shuffle ? 'text-primary-light' : 'text-text-muted hover:text-text-primary'}`}
            title="Перемешать (S)"
            whileHover={{ scale: 1.15 }}
            whileTap={{ scale: 0.85 }}
          >
            <Shuffle size={16} />
          </motion.button>

          {/* Prev */}
          <motion.button
            onClick={prev}
            disabled={!currentTrack}
            className="p-2 rounded-full text-text-secondary hover:text-text-primary disabled:opacity-30 transition-colors"
            title="Предыдущий (Alt+Left)"
            whileHover={{ scale: 1.15, x: -2 }}
            whileTap={{ scale: 0.85 }}
          >
            <SkipBack size={20} />
          </motion.button>

          {/* Play/Pause */}
          <div className="relative">
            {isPlaying && (
              <motion.div
                className="absolute inset-0 rounded-full bg-white/10"
                animate={{ scale: [1, 1.4, 1], opacity: [0.3, 0, 0.3] }}
                transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
              />
            )}
            <motion.button
              onClick={togglePlay}
              disabled={!currentTrack}
              className="w-10 h-10 bg-white hover:bg-white/90 rounded-full flex items-center justify-center disabled:opacity-30 shadow-lg relative z-10"
              title="Играть/Пауза (Space)"
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.92 }}
            >
              <AnimatePresence mode="wait">
                {isLoading ? (
                  <motion.div
                    key="loading"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="w-4 h-4 border-2 border-gray-800 border-t-transparent rounded-full animate-spin"
                  />
                ) : isPlaying ? (
                  <motion.div key="pause" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} transition={{ duration: 0.15 }}>
                    <Pause size={18} className="text-gray-900 fill-gray-900" />
                  </motion.div>
                ) : (
                  <motion.div key="play" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} transition={{ duration: 0.15 }}>
                    <Play size={18} className="text-gray-900 fill-gray-900 translate-x-0.5" />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.button>
          </div>

          {/* Next */}
          <motion.button
            onClick={next}
            disabled={!currentTrack}
            className="p-2 rounded-full text-text-secondary hover:text-text-primary disabled:opacity-30 transition-colors"
            title="Следующий (Alt+Right)"
            whileHover={{ scale: 1.15, x: 2 }}
            whileTap={{ scale: 0.85 }}
          >
            <SkipForward size={20} />
          </motion.button>

          {/* Repeat */}
          <motion.button
            onClick={toggleRepeat}
            className={`p-1.5 rounded-full transition-all ${repeat !== 'none' ? 'text-primary-light' : 'text-text-muted hover:text-text-primary'}`}
            title="Повтор"
            whileHover={{ scale: 1.15 }}
            whileTap={{ scale: 0.85 }}
          >
            {repeat === 'one' ? <Repeat1 size={16} /> : <Repeat size={16} />}
          </motion.button>
        </div>

        {/* Progress bar */}
        <ProgressBar
          progress={progress}
          duration={duration}
          onSeek={onSeek}
          isLoading={isLoading && !!(currentTrack)}
        />
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-2 w-72 justify-end">
        <span className="text-xs text-text-muted tabular-nums">
          {currentTrack ? `${formatDuration(progress)} / ${formatDuration(duration)}` : ''}
        </span>

        <VolumeControl />

        <motion.button
          onClick={toggleQueue}
          className="p-2 rounded-full text-text-muted hover:text-text-primary hover:bg-bg-hover transition-colors"
          title="Очередь"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <ListMusic size={16} />
        </motion.button>
      </div>
    </motion.div>
  )
}
