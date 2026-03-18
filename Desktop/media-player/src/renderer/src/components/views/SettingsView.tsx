import React, { useState, useEffect } from 'react'
import { Settings, FolderOpen, Trash2, LogOut, Monitor, Volume2 } from 'lucide-react'
import { useLibraryStore } from '../../store/libraryStore'
import { useServicesStore } from '../../store/servicesStore'
import { usePlayerStore } from '../../store/playerStore'

export const SettingsView: React.FC = () => {
  const { directories, setDirectories, setLocalTracks } = useLibraryStore()
  const { vkUser, yandexAccount, logoutVK, logoutYandex } = useServicesStore()
  const { volume, setVolume } = usePlayerStore()
  const [dirs, setDirs] = useState<string[]>([])

  useEffect(() => {
    window.api.fs.getDirectories().then(setDirs)
  }, [])

  const handleAddDir = async () => {
    const result = await window.api.fs.addDirectory()
    if (result) {
      setDirs(result.directories)
      setDirectories(result.directories)
    }
  }

  const handleRemoveDir = async (dir: string) => {
    const newDirs = dirs.filter((d) => d !== dir)
    setDirs(newDirs)
    await window.api.store.set('musicDirectories', newDirs)
    setDirectories(newDirs)
  }

  const handleVKLogout = async () => {
    await window.api.vk.logout()
    logoutVK()
  }

  const handleYandexLogout = async () => {
    await window.api.yandex.logout()
    logoutYandex()
  }

  return (
    <div className="px-6 py-6 overflow-y-auto h-full max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <Settings size={24} className="text-primary-light" />
        <h1 className="text-2xl font-bold text-text-primary">Настройки</h1>
      </div>

      <div className="space-y-6">
        {/* Music directories */}
        <Section title="Папки с музыкой">
          <div className="space-y-2">
            {dirs.map((dir) => (
              <div
                key={dir}
                className="flex items-center gap-3 px-3 py-2.5 bg-bg-elevated border border-border rounded-xl group"
              >
                <FolderOpen size={14} className="text-text-muted flex-shrink-0" />
                <span className="text-sm text-text-secondary flex-1 truncate">{dir}</span>
                <button
                  onClick={() => handleRemoveDir(dir)}
                  className="opacity-0 group-hover:opacity-100 p-1 rounded-full hover:bg-bg-hover text-text-muted hover:text-red-400 transition-all"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
            <button
              onClick={handleAddDir}
              className="flex items-center gap-2 w-full px-3 py-2.5 border border-dashed border-border hover:border-primary/40 rounded-xl text-sm text-text-muted hover:text-text-primary transition-colors"
            >
              <FolderOpen size={14} />
              Добавить папку
            </button>
          </div>
        </Section>

        {/* Volume */}
        <Section title="Громкость по умолчанию">
          <div className="flex items-center gap-3">
            <Volume2 size={16} className="text-text-muted" />
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={volume}
              onChange={(e) => setVolume(Number(e.target.value))}
              className="flex-1 accent-primary"
            />
            <span className="text-sm text-text-muted w-12 text-right">
              {Math.round(volume * 100)}%
            </span>
          </div>
        </Section>

        {/* Connected services */}
        <Section title="Подключённые сервисы">
          {vkUser ? (
            <div className="flex items-center justify-between px-3 py-3 bg-vk/10 border border-vk/20 rounded-xl">
              <div className="flex items-center gap-3">
                <img src={vkUser.photo_100} className="w-8 h-8 rounded-full" alt="" />
                <div>
                  <p className="text-sm font-medium text-text-primary">
                    {vkUser.first_name} {vkUser.last_name}
                  </p>
                  <p className="text-xs text-vk">VK Музыка</p>
                </div>
              </div>
              <button
                onClick={handleVKLogout}
                className="flex items-center gap-1.5 text-xs text-red-400 hover:text-red-300 transition-colors"
              >
                <LogOut size={12} />
                Выйти
              </button>
            </div>
          ) : (
            <div className="px-3 py-3 bg-bg-elevated border border-dashed border-border rounded-xl text-sm text-text-muted">
              VK Музыка не подключена
            </div>
          )}

          {yandexAccount ? (
            <div className="flex items-center justify-between px-3 py-3 bg-yandex/10 border border-yandex/20 rounded-xl mt-2">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-yandex rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-bold">Я</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-text-primary">
                    {yandexAccount.display_name || yandexAccount.login}
                  </p>
                  <p className="text-xs text-yandex">Яндекс Музыка</p>
                </div>
              </div>
              <button
                onClick={handleYandexLogout}
                className="flex items-center gap-1.5 text-xs text-red-400 hover:text-red-300 transition-colors"
              >
                <LogOut size={12} />
                Выйти
              </button>
            </div>
          ) : (
            <div className="px-3 py-3 bg-bg-elevated border border-dashed border-border rounded-xl text-sm text-text-muted mt-2">
              Яндекс Музыка не подключена
            </div>
          )}
        </Section>

        {/* About */}
        <Section title="О программе">
          <div className="px-3 py-3 bg-bg-elevated border border-border rounded-xl space-y-1">
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium text-text-primary">Wave Player</p>
              <span className="text-[10px] px-1.5 py-0.5 rounded-full border border-accent-amber/50 text-accent-amber font-semibold uppercase tracking-widest">
                alpha
              </span>
            </div>
            <p className="text-xs text-text-muted">Версия 0.1.0-alpha</p>
            <p className="text-xs text-text-muted mt-2">
              Поддерживаемые форматы: MP3, FLAC, WAV, OGG, AAC, M4A, WMA, APE, OPUS, AIFF и другие
            </p>
          </div>
        </Section>
      </div>
    </div>
  )
}

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="space-y-3">
    <h2 className="text-sm font-semibold text-text-muted uppercase tracking-wider">{title}</h2>
    {children}
  </div>
)
