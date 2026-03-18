import React from 'react'
import { X, ListMusic, Trash2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { usePlayerStore } from '../../store/playerStore'
import { useUIStore } from '../../store/uiStore'
import { TrackItem } from '../ui/TrackItem'
import { formatDuration } from '../../types'

export const QueueView: React.FC = () => {
  const { queue, queueIndex, clearQueue, removeFromQueue, jumpToIndex, currentTrack } =
    usePlayerStore()
  const { setShowQueue } = useUIStore()

  const upNext = queue.slice(queueIndex + 1)
  const played = queue.slice(0, queueIndex)

  return (
    <motion.div
      initial={{ x: '100%', opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: '100%', opacity: 0 }}
      transition={{ type: 'spring', damping: 25, stiffness: 250 }}
      className="w-80 flex-shrink-0 flex flex-col border-l border-border/50 bg-bg-surface h-full overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/50">
        <div className="flex items-center gap-2">
          <ListMusic size={16} className="text-primary-light" />
          <h2 className="font-semibold text-text-primary text-sm">Очередь воспроизведения</h2>
        </div>
        <div className="flex items-center gap-1">
          {queue.length > 0 && (
            <button
              onClick={clearQueue}
              className="p-1.5 rounded-full text-text-muted hover:text-red-400 hover:bg-bg-hover transition-colors"
              title="Очистить очередь"
            >
              <Trash2 size={14} />
            </button>
          )}
          <button
            onClick={() => setShowQueue(false)}
            className="p-1.5 rounded-full text-text-muted hover:text-text-primary hover:bg-bg-hover transition-colors"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Now Playing */}
        {currentTrack && (
          <div className="px-3 py-2">
            <p className="text-xs text-text-muted uppercase tracking-wider px-1 mb-1.5">
              Сейчас играет
            </p>
            <div className="bg-primary/10 border border-primary/20 rounded-xl">
              <TrackItem track={currentTrack} compact showAlbum={false} />
            </div>
          </div>
        )}

        {/* Up next */}
        {upNext.length > 0 && (
          <div className="px-3 py-2">
            <p className="text-xs text-text-muted uppercase tracking-wider px-1 mb-1.5">
              Далее • {upNext.length} треков
            </p>
            <AnimatePresence>
              {upNext.map((track, i) => (
                <motion.div
                  key={track.id + i}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  <div className="group relative">
                    <TrackItem
                      track={track}
                      index={queueIndex + 1 + i}
                      compact
                      showAlbum={false}
                    />
                    <button
                      onClick={() => removeFromQueue(queueIndex + 1 + i)}
                      className="absolute right-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 p-1 rounded-full hover:bg-bg-hover text-text-muted hover:text-red-400 transition-all"
                    >
                      <X size={12} />
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        {/* History */}
        {played.length > 0 && (
          <div className="px-3 py-2">
            <p className="text-xs text-text-muted uppercase tracking-wider px-1 mb-1.5">
              История
            </p>
            {played
              .slice()
              .reverse()
              .map((track, i) => (
                <div key={track.id + i} className="opacity-50">
                  <TrackItem track={track} compact showAlbum={false} />
                </div>
              ))}
          </div>
        )}

        {queue.length === 0 && (
          <div className="flex flex-col items-center justify-center h-40 gap-3 text-text-muted">
            <ListMusic size={24} strokeWidth={1.5} />
            <p className="text-sm">Очередь пуста</p>
          </div>
        )}
      </div>

      {/* Footer */}
      {queue.length > 0 && (
        <div className="border-t border-border/50 px-4 py-2">
          <p className="text-xs text-text-muted">
            {queue.length} треков ·{' '}
            {formatDuration(queue.reduce((s, t) => s + t.duration, 0))}
          </p>
        </div>
      )}
    </motion.div>
  )
}
