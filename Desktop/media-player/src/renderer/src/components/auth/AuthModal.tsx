import React, { useState } from 'react'
import { Modal } from '../ui/Modal'
import { useServicesStore } from '../../store/servicesStore'
import { useUIStore } from '../../store/uiStore'
import { Eye, EyeOff, ExternalLink, Key, User, AlertCircle } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface AuthModalProps {
  open: boolean
  onClose: () => void
  service: 'vk' | 'yandex' | null
}

const VK_AUTH_URL = `https://oauth.vk.com/authorize?client_id=2685278&scope=audio,friends,wall,offline&redirect_uri=https://oauth.vk.com/blank.html&display=page&response_type=token&v=5.199`
const YANDEX_AUTH_URL = `https://oauth.yandex.ru/authorize?response_type=token&client_id=c0ebe342af7d48fbbbfcf2d2eedb8f9e&force_confirm=false`

const VKAuthForm: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [token, setToken] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { setVKUser } = useServicesStore()

  const handleAuth = async () => {
    if (!token.trim()) return
    setLoading(true)
    setError(null)
    try {
      const result = await window.api.vk.auth(token.trim())
      if (result.success && result.user) {
        setVKUser(result.user as import('../../types').VKUser, token.trim())
        await window.api.store.set('vk:token', token.trim())
        onClose()
      } else {
        setError(result.error || 'Ошибка авторизации')
      }
    } catch (e: unknown) {
      const err = e as { message?: string }
      setError(err?.message || 'Ошибка соединения')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="bg-vk/10 border border-vk/20 rounded-xl p-4 text-sm text-text-secondary leading-relaxed">
        <p className="font-medium text-text-primary mb-2">Как получить токен VK:</p>
        <ol className="list-decimal list-inside space-y-1 text-xs">
          <li>Нажмите «Открыть VK OAuth» ниже</li>
          <li>Войдите в VK и разрешите доступ</li>
          <li>Страница станет белой — скопируйте адрес из браузера</li>
          <li>Найдите в нём <span className="text-text-primary font-mono">access_token=</span> и скопируйте значение до <span className="text-text-primary font-mono">&amp;</span></li>
          <li>Вставьте токен в поле ниже</li>
        </ol>
      </div>

      <a
        href={VK_AUTH_URL}
        target="_blank"
        rel="noreferrer"
        className="flex items-center justify-center gap-2 w-full py-2.5 bg-vk hover:bg-vk-dark rounded-xl text-white font-medium transition-colors text-sm"
      >
        <ExternalLink size={16} />
        Открыть VK OAuth
      </a>

      <div className="space-y-2">
        <label className="text-xs text-text-muted font-medium">Access Token</label>
        <div className="relative">
          <Key size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="Вставьте access_token..."
            className="w-full bg-bg-hover border border-border rounded-xl pl-9 pr-4 py-2.5 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-vk transition-colors"
          />
        </div>
      </div>

      {error && (
        <p className="text-red-400 text-sm bg-red-400/10 rounded-lg px-3 py-2">{error}</p>
      )}

      <button
        onClick={handleAuth}
        disabled={!token.trim() || loading}
        className="w-full py-2.5 bg-vk hover:bg-vk-dark disabled:opacity-50 disabled:cursor-not-allowed rounded-xl text-white font-medium transition-colors text-sm"
      >
        {loading ? 'Проверяем...' : 'Войти'}
      </button>
    </div>
  )
}

const YandexAuthForm: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [tab, setTab] = useState<'login' | 'token'>('login')
  const [login, setLogin] = useState('')
  const [password, setPassword] = useState('')
  const [token, setToken] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { setYandexAccount } = useServicesStore()

  const handleLoginAuth = async () => {
    if (!login || !password) return
    setLoading(true)
    setError(null)
    try {
      const result = await window.api.yandex.auth(login, password)
      if (result.success && result.token) {
        const accResult = await window.api.yandex.authToken(result.token)
        if (accResult.success && accResult.account) {
          setYandexAccount(accResult.account as import('../../types').YandexAccount, result.token)
          onClose()
        }
      } else {
        setError(result.error || 'Неверный логин или пароль')
      }
    } catch (e: unknown) {
      const err = e as { message?: string }
      setError(err?.message || 'Ошибка соединения')
    } finally {
      setLoading(false)
    }
  }

  const handleTokenAuth = async () => {
    if (!token.trim()) return
    setLoading(true)
    setError(null)
    try {
      const result = await window.api.yandex.authToken(token.trim())
      if (result.success && result.account) {
        setYandexAccount(result.account as import('../../types').YandexAccount, token.trim())
        await window.api.store.set('yandex:token', token.trim())
        onClose()
      } else {
        setError(result.error || 'Недействительный токен')
      }
    } catch (e: unknown) {
      const err = e as { message?: string }
      setError(err?.message || 'Ошибка соединения')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="flex bg-bg-hover rounded-xl p-1 gap-1">
        {[
          { id: 'login', label: 'Логин/Пароль' },
          { id: 'token', label: 'Токен' },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id as 'login' | 'token')}
            className={`flex-1 py-2 text-sm rounded-lg font-medium transition-all ${tab === t.id ? 'bg-yandex text-white' : 'text-text-muted hover:text-text-primary'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {tab === 'login' ? (
          <motion.div
            key="login"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            className="space-y-3"
          >
            <div className="flex items-start gap-2 bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 text-xs text-amber-300 leading-relaxed">
              <AlertCircle size={13} className="mt-0.5 shrink-0" />
              <span>Если у вас включена двухфакторная аутентификация — используйте вкладку «Токен».</span>
            </div>
            <div className="space-y-2">
              <label className="text-xs text-text-muted font-medium">Логин (email / телефон)</label>
              <div className="relative">
                <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                <input
                  type="text"
                  value={login}
                  onChange={(e) => setLogin(e.target.value)}
                  placeholder="login@yandex.ru"
                  className="w-full bg-bg-hover border border-border rounded-xl pl-9 pr-4 py-2.5 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-yandex transition-colors"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs text-text-muted font-medium">Пароль</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleLoginAuth()}
                  placeholder="••••••••"
                  className="w-full bg-bg-hover border border-border rounded-xl px-4 py-2.5 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-yandex transition-colors pr-10"
                />
                <button
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary"
                >
                  {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>
            {error && (
              <p className="text-red-400 text-sm bg-red-400/10 rounded-lg px-3 py-2">{error}</p>
            )}
            <button
              onClick={handleLoginAuth}
              disabled={!login || !password || loading}
              className="w-full py-2.5 bg-yandex hover:bg-yandex-dark disabled:opacity-50 disabled:cursor-not-allowed rounded-xl text-white font-medium transition-colors text-sm"
            >
              {loading ? 'Входим...' : 'Войти'}
            </button>
          </motion.div>
        ) : (
          <motion.div
            key="token"
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            className="space-y-3"
          >
            <div className="bg-yandex/10 border border-yandex/20 rounded-xl p-3 text-xs text-text-secondary leading-relaxed space-y-1.5">
              <p className="font-medium text-text-primary">Как получить токен Яндекс:</p>
              <ol className="list-decimal list-inside space-y-1 text-xs">
                <li>Нажмите «Открыть Яндекс OAuth» ниже</li>
                <li>Войдите в аккаунт и разрешите доступ</li>
                <li>Скопируйте токен из адресной строки (параметр <span className="text-text-primary font-mono">access_token=...</span>)</li>
                <li>Вставьте его в поле ниже</li>
              </ol>
            </div>
            <a
              href={YANDEX_AUTH_URL}
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-center gap-2 w-full py-2.5 bg-yandex hover:bg-yandex-dark rounded-xl text-white font-medium transition-colors text-sm"
            >
              <ExternalLink size={16} />
              Открыть Яндекс OAuth
            </a>
            <div className="space-y-2">
              <label className="text-xs text-text-muted font-medium">OAuth Токен</label>
              <div className="relative">
                <Key size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                <input
                  type="text"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  placeholder="y0_AgAAAA..."
                  className="w-full bg-bg-hover border border-border rounded-xl pl-9 pr-4 py-2.5 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-yandex transition-colors"
                />
              </div>
            </div>
            {error && (
              <p className="text-red-400 text-sm bg-red-400/10 rounded-lg px-3 py-2">{error}</p>
            )}
            <button
              onClick={handleTokenAuth}
              disabled={!token.trim() || loading}
              className="w-full py-2.5 bg-yandex hover:bg-yandex-dark disabled:opacity-50 disabled:cursor-not-allowed rounded-xl text-white font-medium transition-colors text-sm"
            >
              {loading ? 'Проверяем...' : 'Войти'}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export const AuthModal: React.FC<AuthModalProps> = ({ open, onClose, service }) => {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={
        service === 'vk'
          ? '🎵 Войти в VK Музыку'
          : service === 'yandex'
            ? '🎵 Войти в Яндекс Музыку'
            : 'Авторизация'
      }
      width="max-w-sm"
    >
      {service === 'vk' && <VKAuthForm onClose={onClose} />}
      {service === 'yandex' && <YandexAuthForm onClose={onClose} />}
    </Modal>
  )
}
