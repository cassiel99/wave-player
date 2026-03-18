import React, { useRef } from 'react'
import { Volume, Volume1, Volume2, VolumeX } from 'lucide-react'
import { usePlayerStore } from '../../store/playerStore'

export const VolumeControl: React.FC = () => {
  const { volume, isMuted, setVolume, toggleMute } = usePlayerStore()
  const barRef = useRef<HTMLDivElement>(null)

  const displayVolume = isMuted ? 0 : volume
  const percent = displayVolume * 100

  const handleBarClick = (e: React.MouseEvent) => {
    if (!barRef.current) return
    const rect = barRef.current.getBoundingClientRect()
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width))
    setVolume(x / rect.width)
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    handleBarClick(e)

    const handleMouseMove = (e: MouseEvent) => {
      if (!barRef.current) return
      const rect = barRef.current.getBoundingClientRect()
      const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width))
      setVolume(x / rect.width)
    }

    const handleMouseUp = () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
  }

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault()
    const delta = e.deltaY > 0 ? -0.05 : 0.05
    setVolume(volume + delta)
  }

  const Icon = isMuted || volume === 0 ? VolumeX : volume < 0.33 ? Volume : volume < 0.66 ? Volume1 : Volume2

  return (
    <div className="flex items-center gap-2 group" onWheel={handleWheel}>
      <button
        onClick={toggleMute}
        className="text-text-muted hover:text-text-primary transition-colors p-1"
        title={isMuted ? 'Включить звук' : 'Выключить звук'}
      >
        <Icon size={16} />
      </button>

      <div
        className="w-24 relative py-2 cursor-pointer"
        onMouseDown={handleMouseDown}
      >
        <div
          ref={barRef}
          className="h-1 bg-bg-active rounded-full overflow-visible group-hover:h-1.5 transition-all duration-150"
        >
          <div
            className="h-full bg-gradient-to-r from-primary to-primary-light rounded-full relative"
            style={{ width: `${percent}%` }}
          >
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </div>
      </div>

      <span className="text-xs text-text-muted w-7 tabular-nums">{Math.round(percent)}%</span>
    </div>
  )
}
