import React, { useState } from 'react'
import {
  Home, Music2, Library, Search, Settings, ChevronLeft, ChevronRight,
  Plus, Radio, Heart, ListMusic, Users, Disc3, LogOut, User,
  Sparkles, Mic2, PlaySquare
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useUIStore } from '../store/uiStore'
import { useServicesStore } from '../store/servicesStore'
import { AuthModal } from './auth/AuthModal'
import { View } from '../types'

interface NavItem {
  icon: React.ReactNode
  label: string
  view: View
  badge?: number
}

const NavButton: React.FC<{
  item: NavItem
  active: boolean
  collapsed: boolean
  onClick: () => void
}> = ({ item, active, collapsed, onClick }) => (
  <motion.button
    onClick={onClick}
    title={collapsed ? item.label : undefined}
    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors duration-150 group relative
      ${active
        ? 'bg-primary/15 text-primary-light'
        : 'text-text-muted hover:text-text-primary hover:bg-bg-hover'}`}
    whileHover={{ x: 2 }}
    whileTap={{ scale: 0.97 }}
    transition={{ duration: 0.12 }}
  >
    <motion.div
      className="flex-shrink-0"
      animate={{ scale: active ? 1.1 : 1 }}
      transition={{ duration: 0.2 }}
    >
      {item.icon}
    </motion.div>
    <AnimatePresence>
      {!collapsed && (
        <motion.span
          initial={{ opacity: 0, width: 0 }}
          animate={{ opacity: 1, width: 'auto' }}
          exit={{ opacity: 0, width: 0 }}
          className="text-sm font-medium truncate overflow-hidden whitespace-nowrap"
        >
          {item.label}
        </motion.span>
      )}
    </AnimatePresence>
    <AnimatePresence>
      {active && (
        <motion.div
          layoutId="nav-active-bar"
          className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-primary-light rounded-r-full"
          initial={{ scaleY: 0 }}
          animate={{ scaleY: 1 }}
          exit={{ scaleY: 0 }}
          transition={{ duration: 0.2 }}
        />
      )}
    </AnimatePresence>
  </motion.button>
)

export const Sidebar: React.FC = () => {
  const { currentView, setView, sidebarCollapsed, toggleSidebar } = useUIStore()
  const { vkUser, yandexAccount, logoutVK, logoutYandex } = useServicesStore()
  const [authModal, setAuthModal] = useState<'vk' | 'yandex' | null>(null)

  const mainNav: NavItem[] = [
    { icon: <Home size={18} />, label: 'Главная', view: 'home' },
    { icon: <Search size={18} />, label: 'Поиск', view: 'search' },
  ]

  const localNav: NavItem[] = [
    { icon: <Music2 size={18} />, label: 'Треки', view: 'local' },
    { icon: <Disc3 size={18} />, label: 'Альбомы', view: 'local-albums' },
    { icon: <Mic2 size={18} />, label: 'Исполнители', view: 'local-artists' },
    { icon: <ListMusic size={18} />, label: 'Плейлисты', view: 'local-playlists' },
  ]

  const vkNav: NavItem[] = vkUser
    ? [
        { icon: <Heart size={18} />, label: 'Моя музыка', view: 'vk-library' },
        { icon: <Radio size={18} />, label: 'Рекомендации', view: 'vk-recommendations' },
        { icon: <ListMusic size={18} />, label: 'Плейлисты', view: 'vk-playlists' },
        { icon: <Search size={18} />, label: 'Поиск VK', view: 'vk-search' },
      ]
    : []

  const yandexNav: NavItem[] = yandexAccount
    ? [
        { icon: <Heart size={18} />, label: 'Мне нравится', view: 'yandex-likes' },
        { icon: <Radio size={18} />, label: 'Радиостанции', view: 'yandex-stations' },
        { icon: <ListMusic size={18} />, label: 'Плейлисты', view: 'yandex-playlists' },
        { icon: <Search size={18} />, label: 'Поиск Яндекс', view: 'yandex-search' },
      ]
    : []

  const w = sidebarCollapsed ? 64 : 240

  return (
    <>
      <motion.div
        animate={{ width: w, x: 0, opacity: 1 }}
        initial={{ x: -40, opacity: 0 }}
        transition={{ duration: 0.35, ease: [0.34, 1.2, 0.64, 1] }}
        className="flex-shrink-0 flex flex-col h-full bg-bg-surface border-r border-border/50 relative overflow-hidden"
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 h-14 border-b border-border/50 flex-shrink-0">
          <div className="w-8 h-8 bg-gradient-to-br from-primary to-accent-pink rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg">
            <Music2 size={16} className="text-white" />
          </div>
          <AnimatePresence>
            {!sidebarCollapsed && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="font-bold text-text-primary text-base whitespace-nowrap"
              >
                Caeli
              </motion.span>
            )}
          </AnimatePresence>
        </div>

        {/* Scrollable nav */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden py-3 space-y-1 px-2">
          {/* Main */}
          {mainNav.map((item) => (
            <NavButton
              key={item.view}
              item={item}
              active={currentView === item.view}
              collapsed={sidebarCollapsed}
              onClick={() => setView(item.view)}
            />
          ))}

          {/* Local Library */}
          {!sidebarCollapsed && (
            <p className="text-xs text-text-muted uppercase tracking-wider px-3 pt-4 pb-1 font-semibold">
              Локальная
            </p>
          )}
          {sidebarCollapsed && <div className="border-t border-border/50 mx-2 my-2" />}
          {localNav.map((item) => (
            <NavButton
              key={item.view}
              item={item}
              active={currentView === item.view}
              collapsed={sidebarCollapsed}
              onClick={() => setView(item.view)}
            />
          ))}

          {/* VK Music */}
          {(vkUser || !sidebarCollapsed) && (
            <>
              {!sidebarCollapsed && (
                <div className="flex items-center justify-between px-3 pt-4 pb-1">
                  <p className="text-xs text-text-muted uppercase tracking-wider font-semibold">
                    VK Музыка
                  </p>
                  {vkUser ? (
                    <button
                      onClick={() => { logoutVK(); window.api.vk.logout() }}
                      className="text-text-muted hover:text-red-400 transition-colors"
                      title="Выйти"
                    >
                      <LogOut size={12} />
                    </button>
                  ) : (
                    <button
                      onClick={() => setAuthModal('vk')}
                      className="text-text-muted hover:text-text-primary transition-colors"
                      title="Войти"
                    >
                      <Plus size={12} />
                    </button>
                  )}
                </div>
              )}

              {!vkUser && !sidebarCollapsed && (
                <button
                  onClick={() => setAuthModal('vk')}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-xl border border-border/50 hover:border-vk/50 hover:bg-vk/5 transition-all text-text-muted hover:text-text-primary text-sm"
                >
                  <div className="w-5 h-5 bg-vk rounded flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-xs font-bold">VK</span>
                  </div>
                  Войти в VK Музыку
                </button>
              )}

              {vkUser && !sidebarCollapsed && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-vk/10 border border-vk/20">
                  <img src={vkUser.photo_100} className="w-6 h-6 rounded-full" alt="" />
                  <span className="text-sm text-text-primary truncate">
                    {vkUser.first_name} {vkUser.last_name}
                  </span>
                </div>
              )}

              {vkNav.map((item) => (
                <NavButton
                  key={item.view}
                  item={item}
                  active={currentView === item.view}
                  collapsed={sidebarCollapsed}
                  onClick={() => setView(item.view)}
                />
              ))}
            </>
          )}

          {/* Yandex Music */}
          {(yandexAccount || !sidebarCollapsed) && (
            <>
              {!sidebarCollapsed && (
                <div className="flex items-center justify-between px-3 pt-4 pb-1">
                  <p className="text-xs text-text-muted uppercase tracking-wider font-semibold">
                    Яндекс Музыка
                  </p>
                  {yandexAccount ? (
                    <button
                      onClick={() => { logoutYandex(); window.api.yandex.logout() }}
                      className="text-text-muted hover:text-red-400 transition-colors"
                      title="Выйти"
                    >
                      <LogOut size={12} />
                    </button>
                  ) : (
                    <button
                      onClick={() => setAuthModal('yandex')}
                      className="text-text-muted hover:text-text-primary transition-colors"
                      title="Войти"
                    >
                      <Plus size={12} />
                    </button>
                  )}
                </div>
              )}

              {!yandexAccount && !sidebarCollapsed && (
                <button
                  onClick={() => setAuthModal('yandex')}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-xl border border-border/50 hover:border-yandex/50 hover:bg-yandex/5 transition-all text-text-muted hover:text-text-primary text-sm"
                >
                  <div className="w-5 h-5 bg-yandex rounded flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-xs font-bold">Я</span>
                  </div>
                  Войти в Яндекс Музыку
                </button>
              )}

              {yandexAccount && !sidebarCollapsed && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-yandex/10 border border-yandex/20">
                  <div className="w-6 h-6 rounded-full bg-yandex flex items-center justify-center">
                    <span className="text-white text-xs font-bold">Я</span>
                  </div>
                  <span className="text-sm text-text-primary truncate">
                    {yandexAccount.display_name || yandexAccount.login}
                  </span>
                </div>
              )}

              {yandexNav.map((item) => (
                <NavButton
                  key={item.view}
                  item={item}
                  active={currentView === item.view}
                  collapsed={sidebarCollapsed}
                  onClick={() => setView(item.view)}
                />
              ))}
            </>
          )}
        </div>

        {/* Bottom */}
        <div className="border-t border-border/50 p-2 space-y-1 flex-shrink-0">
          <NavButton
            item={{ icon: <Settings size={18} />, label: 'Настройки', view: 'settings' }}
            active={currentView === 'settings'}
            collapsed={sidebarCollapsed}
            onClick={() => setView('settings')}
          />
        </div>

        {/* Collapse toggle */}
        <button
          onClick={toggleSidebar}
          className="absolute -right-3 top-20 w-6 h-6 bg-bg-elevated border border-border rounded-full flex items-center justify-center text-text-muted hover:text-text-primary hover:border-border-strong transition-all z-10"
        >
          {sidebarCollapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
        </button>
      </motion.div>

      {/* Auth modal */}
      <AuthModal
        open={authModal !== null}
        onClose={() => setAuthModal(null)}
        service={authModal}
      />
    </>
  )
}
