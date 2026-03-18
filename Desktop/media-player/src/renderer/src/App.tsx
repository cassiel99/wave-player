import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { TitleBar } from './components/TitleBar'
import { Sidebar } from './components/Sidebar'
import { PlayerBar } from './components/PlayerBar'
import { SplashScreen } from './components/SplashScreen'
import { HomeView } from './components/views/HomeView'
import { LocalLibrary } from './components/views/LocalLibrary'
import { VKMusicView } from './components/views/VKMusicView'
import { YandexMusicView } from './components/views/YandexMusicView'
import { SearchView } from './components/views/SearchView'
import { QueueView } from './components/views/QueueView'
import { SettingsView } from './components/views/SettingsView'
import { useUIStore } from './store/uiStore'
import { useServicesStore } from './store/servicesStore'
import { useAudioEngine } from './hooks/useAudioEngine'
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts'
import { View, VKUser, YandexAccount } from './types'

const pageVariants = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -6 },
}

const MainContent: React.FC = () => {
  const { currentView } = useUIStore()

  const viewMap: Partial<Record<View, React.ReactNode>> = {
    home: <HomeView />,
    local: <LocalLibrary />,
    'local-albums': <LocalLibrary />,
    'local-artists': <LocalLibrary />,
    'local-playlists': <LocalLibrary />,
    'vk-library': <VKMusicView initialTab="library" />,
    'vk-playlists': <VKMusicView initialTab="playlists" />,
    'vk-recommendations': <VKMusicView initialTab="recommendations" />,
    'vk-search': <VKMusicView initialTab="search" />,
    'yandex-likes': <YandexMusicView initialTab="likes" />,
    'yandex-playlists': <YandexMusicView initialTab="playlists" />,
    'yandex-stations': <YandexMusicView initialTab="stations" />,
    'yandex-search': <YandexMusicView initialTab="search" />,
    search: <SearchView />,
    settings: <SettingsView />,
  }

  return (
    <div className="flex-1 min-w-0 overflow-hidden relative">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentView}
          variants={pageVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          transition={{ duration: 0.18, ease: 'easeInOut' }}
          className="absolute inset-0 overflow-hidden"
        >
          {viewMap[currentView] || <HomeView />}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

export const App: React.FC = () => {
  const [splashVisible, setSplashVisible] = useState(true)
  const { showQueue } = useUIStore()
  const { setVKUser, setYandexAccount } = useServicesStore()
  const { seek } = useAudioEngine()
  useKeyboardShortcuts(seek)

  useEffect(() => {
    const minDelay = new Promise<void>((resolve) => setTimeout(resolve, 2400))
    const sessions = restoreSessions()
    Promise.all([minDelay, sessions]).then(() => setSplashVisible(false))
  }, [])

  const restoreSessions = async () => {
    try {
      const vkToken = await window.api.store.get('vk:token') as string | undefined
      if (vkToken) {
        const result = await window.api.vk.getUser() as VKUser | null
        if (result) setVKUser(result, vkToken)
      }
    } catch {}

    try {
      const yandexToken = await window.api.store.get('yandex:token') as string | undefined
      if (yandexToken) {
        const result = await window.api.yandex.authToken(yandexToken)
        if (result.success && result.account) {
          setYandexAccount(result.account as YandexAccount, yandexToken)
        }
      }
    } catch {}
  }

  return (
    <>
      <div className="flex flex-col h-screen bg-bg-base text-text-primary overflow-hidden select-none">
        <TitleBar />

        <div className="flex flex-1 min-h-0 overflow-hidden">
          <Sidebar />

          <div className="flex flex-1 min-w-0 overflow-hidden">
            <MainContent />

            <AnimatePresence>
              {showQueue && <QueueView key="queue" />}
            </AnimatePresence>
          </div>
        </div>

        <PlayerBar onSeek={seek} />
      </div>

      <SplashScreen isVisible={splashVisible} />
    </>
  )
}
