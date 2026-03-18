import React from 'react'
import { Minus, Square, X, Music2 } from 'lucide-react'

export const TitleBar: React.FC = () => {
  return (
    <div
      className="h-9 flex items-center justify-between px-4 border-b border-border/30 flex-shrink-0 bg-bg-base select-none"
      style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
    >
      <div className="flex items-center gap-2" style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
        <div className="w-5 h-5 bg-gradient-to-br from-primary to-accent-pink rounded flex items-center justify-center">
          <Music2 size={11} className="text-white" />
        </div>
        <span className="text-xs font-semibold text-text-muted">Wave Player</span>
      </div>

      {/* Window controls */}
      <div
        className="flex items-center gap-1"
        style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
      >
        <button
          onClick={() => window.api.window.minimize()}
          className="w-6 h-6 rounded-full flex items-center justify-center text-text-muted hover:bg-bg-hover hover:text-text-primary transition-colors"
        >
          <Minus size={11} />
        </button>
        <button
          onClick={() => window.api.window.maximize()}
          className="w-6 h-6 rounded-full flex items-center justify-center text-text-muted hover:bg-bg-hover hover:text-text-primary transition-colors"
        >
          <Square size={10} />
        </button>
        <button
          onClick={() => window.api.window.close()}
          className="w-6 h-6 rounded-full flex items-center justify-center text-text-muted hover:bg-red-500 hover:text-white transition-colors"
        >
          <X size={11} />
        </button>
      </div>
    </div>
  )
}
