import React from 'react'
import { Music2, FolderOpen, Play, ArrowRight } from 'lucide-react'
import { motion } from 'framer-motion'
import { usePlayerStore } from '../../store/playerStore'
import { useLibraryStore } from '../../store/libraryStore'
import { useServicesStore } from '../../store/servicesStore'
import { useUIStore } from '../../store/uiStore'
import { TrackItem } from '../ui/TrackItem'

export const HomeView: React.FC = () => {
  const { currentTrack, queue } = usePlayerStore()
  const { localTracks } = useLibraryStore()
  const { vkUser, vkTracks, yandexAccount, yandexLikes } = useServicesStore()
  const { setView } = useUIStore()

  const recentTracks = localTracks.slice(0, 8)
  const greeting = (() => {
    const h = new Date().getHours()
    if (h < 6) return 'Доброй ночи'
    if (h < 12) return 'Доброе утро'
    if (h < 18) return 'Добрый день'
    return 'Добрый вечер'
  })()

  return (
    <div className="flex flex-col gap-8 px-6 py-6 overflow-y-auto h-full">
      {/* Greeting */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold text-text-primary">{greeting}</h1>
        <p className="text-text-muted mt-1">
          {localTracks.length > 0
            ? `В вашей библиотеке ${localTracks.length} треков`
            : 'Добавьте музыку, чтобы начать'}
        </p>
      </motion.div>

      {/* Quick actions */}
      {localTracks.length === 0 && !vkUser && !yandexAccount && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 sm:grid-cols-3 gap-3"
        >
          <QuickActionCard
            icon={<FolderOpen size={22} />}
            title="Добавить музыку"
            desc="Сканируйте папки на вашем ПК"
            color="from-primary/20 to-primary/5"
            border="border-primary/20"
            onClick={() => setView('local')}
          />
          <QuickActionCard
            icon={<div className="w-6 h-6 bg-vk rounded flex items-center justify-center"><span className="text-white text-xs font-bold">VK</span></div>}
            title="VK Музыка"
            desc="Подключите вашу библиотеку VK"
            color="from-vk/20 to-vk/5"
            border="border-vk/20"
            onClick={() => setView('vk-library')}
          />
          <QuickActionCard
            icon={<div className="w-6 h-6 bg-yandex rounded flex items-center justify-center"><span className="text-white text-xs font-bold">Я</span></div>}
            title="Яндекс Музыка"
            desc="Подключите Яндекс Музыку"
            color="from-yandex/20 to-yandex/5"
            border="border-yandex/20"
            onClick={() => setView('yandex-likes')}
          />
        </motion.div>
      )}

      {/* Now playing */}
      {currentTrack && (
        <Section title="Сейчас играет" delay={0.05}>
          <motion.div
            className="bg-gradient-to-r from-primary/10 to-transparent border border-primary/20 rounded-2xl p-4 flex items-center gap-4"
            animate={{ borderColor: ['rgba(124,58,237,0.2)', 'rgba(124,58,237,0.5)', 'rgba(124,58,237,0.2)'] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          >
            <div className="w-16 h-16 rounded-xl overflow-hidden bg-bg-active flex-shrink-0 shadow-lg animate-pulse-glow">
              {currentTrack.cover ? (
                <img src={currentTrack.cover} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Music2 size={22} className="text-text-muted" />
                </div>
              )}
            </div>
            <div>
              <p className="font-semibold text-text-primary">{currentTrack.title}</p>
              <p className="text-sm text-text-muted">{currentTrack.artist}</p>
            </div>
          </motion.div>
        </Section>
      )}

      {/* Recent local tracks */}
      {recentTracks.length > 0 && (
        <Section
          title="Локальная музыка"
          action={{ label: 'Все треки', onClick: () => setView('local') }}
          delay={0.1}
        >
          <div className="space-y-0.5">
            {recentTracks.map((track, i) => (
              <TrackItem key={track.id} track={track} index={i} queue={localTracks} />
            ))}
          </div>
        </Section>
      )}

      {/* VK recent */}
      {vkTracks.length > 0 && (
        <Section
          title="VK Музыка"
          action={{ label: 'Все треки', onClick: () => setView('vk-library') }}
          delay={0.15}
        >
          <div className="space-y-0.5">
            {vkTracks.slice(0, 8).map((track, i) => (
              <TrackItem key={track.id} track={track} index={i} queue={vkTracks} />
            ))}
          </div>
        </Section>
      )}

      {/* Yandex recent */}
      {yandexLikes.length > 0 && (
        <Section
          title="Яндекс Музыка — Мне нравится"
          action={{ label: 'Все треки', onClick: () => setView('yandex-likes') }}
          delay={0.2}
        >
          <div className="space-y-0.5">
            {yandexLikes.slice(0, 8).map((track, i) => (
              <TrackItem key={track.id} track={track} index={i} queue={yandexLikes} />
            ))}
          </div>
        </Section>
      )}
    </div>
  )
}

const Section: React.FC<{
  title: string
  action?: { label: string; onClick: () => void }
  children: React.ReactNode
  delay?: number
}> = ({ title, action, children, delay = 0 }) => (
  <motion.section
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.4, ease: [0.34, 1.2, 0.64, 1] }}
    className="space-y-3"
  >
    <div className="flex items-center justify-between">
      <h2 className="text-lg font-semibold text-text-primary">{title}</h2>
      {action && (
        <button
          onClick={action.onClick}
          className="flex items-center gap-1 text-sm text-text-muted hover:text-primary-light transition-colors"
        >
          {action.label}
          <ArrowRight size={14} />
        </button>
      )}
    </div>
    {children}
  </motion.section>
)

const QuickActionCard: React.FC<{
  icon: React.ReactNode
  title: string
  desc: string
  color: string
  border: string
  onClick: () => void
}> = ({ icon, title, desc, color, border, onClick }) => (
  <motion.button
    onClick={onClick}
    whileHover={{ scale: 1.02 }}
    whileTap={{ scale: 0.98 }}
    className={`flex flex-col gap-3 p-4 rounded-2xl bg-gradient-to-br ${color} border ${border} text-left transition-all`}
  >
    <div className="text-text-primary">{icon}</div>
    <div>
      <p className="font-semibold text-text-primary text-sm">{title}</p>
      <p className="text-xs text-text-muted mt-0.5">{desc}</p>
    </div>
  </motion.button>
)
