import { useEffect } from 'react'
import { usePlayerStore } from '../store/playerStore'

export function useKeyboardShortcuts(seek: (time: number) => void) {
  const { togglePlay, next, prev, setVolume, volume, toggleMute, progress, duration } =
    usePlayerStore()

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return

      switch (e.code) {
        case 'Space':
          e.preventDefault()
          togglePlay()
          break
        case 'ArrowRight':
          if (e.altKey) {
            e.preventDefault()
            next()
          } else if (e.shiftKey) {
            e.preventDefault()
            seek(Math.min(duration, progress + 30))
          } else {
            e.preventDefault()
            seek(Math.min(duration, progress + 5))
          }
          break
        case 'ArrowLeft':
          if (e.altKey) {
            e.preventDefault()
            prev()
          } else if (e.shiftKey) {
            e.preventDefault()
            seek(Math.max(0, progress - 30))
          } else {
            e.preventDefault()
            seek(Math.max(0, progress - 5))
          }
          break
        case 'ArrowUp':
          e.preventDefault()
          setVolume(Math.min(1, volume + 0.05))
          break
        case 'ArrowDown':
          e.preventDefault()
          setVolume(Math.max(0, volume - 0.05))
          break
        case 'KeyM':
          toggleMute()
          break
        case 'KeyN':
          if (e.altKey) next()
          break
        case 'KeyP':
          if (e.altKey) prev()
          break
      }
    }

    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [togglePlay, next, prev, setVolume, volume, toggleMute, progress, duration, seek])
}
