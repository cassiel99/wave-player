import React, { useState, useRef } from 'react'
import { formatDuration } from '../../types'

interface ProgressBarProps {
  progress: number
  duration: number
  onSeek: (time: number) => void
  isLoading?: boolean
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  duration,
  onSeek,
  isLoading,
}) => {
  const barRef = useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [hoverTime, setHoverTime] = useState<number | null>(null)
  const [hoverX, setHoverX] = useState(0)

  const percent = duration > 0 ? (progress / duration) * 100 : 0

  const getTimeFromEvent = (e: React.MouseEvent): number => {
    if (!barRef.current) return 0
    const rect = barRef.current.getBoundingClientRect()
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width))
    return (x / rect.width) * duration
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    setIsDragging(true)
    const time = getTimeFromEvent(e)
    onSeek(time)

    const handleMouseMove = (e: MouseEvent) => {
      if (!barRef.current) return
      const rect = barRef.current.getBoundingClientRect()
      const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width))
      onSeek((x / rect.width) * duration)
    }

    const handleMouseUp = () => {
      setIsDragging(false)
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    const time = getTimeFromEvent(e)
    setHoverTime(time)
    setHoverX(e.clientX - (barRef.current?.getBoundingClientRect().left || 0))
  }

  return (
    <div className="flex items-center gap-3 w-full">
      <span className="text-xs text-text-muted w-10 text-right tabular-nums">
        {formatDuration(progress)}
      </span>

      <div className="flex-1 relative group py-2 cursor-pointer" onMouseDown={handleMouseDown}>
        {/* Hover tooltip */}
        {hoverTime !== null && (
          <div
            className="absolute -top-7 bg-bg-elevated border border-border rounded px-2 py-1 text-xs text-text-primary z-10 pointer-events-none"
            style={{ left: hoverX, transform: 'translateX(-50%)' }}
          >
            {formatDuration(hoverTime)}
          </div>
        )}

        <div
          ref={barRef}
          className="h-1 bg-bg-active rounded-full overflow-hidden group-hover:h-1.5 transition-all duration-150"
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setHoverTime(null)}
        >
          {/* Loading animation */}
          {isLoading && (
            <div className="h-full bg-gradient-to-r from-primary/40 to-primary-light/40 animate-pulse rounded-full" />
          )}

          {/* Progress */}
          {!isLoading && (
            <div
              className="h-full bg-gradient-to-r from-primary to-primary-light rounded-full relative transition-all duration-75"
              style={{ width: `${percent}%` }}
            >
              <div
                className={`absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-md
                  opacity-0 group-hover:opacity-100 ${isDragging ? 'opacity-100' : ''} transition-opacity`}
              />
            </div>
          )}
        </div>
      </div>

      <span className="text-xs text-text-muted w-10 tabular-nums">
        {formatDuration(duration)}
      </span>
    </div>
  )
}
