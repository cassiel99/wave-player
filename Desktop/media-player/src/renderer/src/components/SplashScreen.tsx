import React, { useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const NOTES = ['♪', '♫', '♩', '♬', '♭', '♮']

interface SplashScreenProps {
  isVisible: boolean
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ isVisible }) => {
  const particles = useMemo(
    () =>
      Array.from({ length: 18 }, (_, i) => ({
        note: NOTES[i % NOTES.length],
        x: 5 + (i / 18) * 90 + (Math.random() * 6 - 3),
        delay: 0.3 + Math.random() * 1.8,
        duration: 3.5 + Math.random() * 2.5,
        size: 12 + Math.floor(Math.random() * 14),
        opacity: 0.08 + Math.random() * 0.14,
      })),
    []
  )

  const eqBars = useMemo(
    () =>
      Array.from({ length: 28 }, (_, i) => ({
        h: Math.floor(Math.random() * 32) + 8,
        dur: 0.4 + Math.random() * 0.5,
        delay: i * 0.04,
      })),
    []
  )

  const letters = 'Caeli'.split('')

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          key="splash"
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-bg-base overflow-hidden"
          exit={{ opacity: 0, scale: 1.04 }}
          transition={{ duration: 0.7, ease: [0.4, 0, 0.2, 1] }}
        >
          {/* Deep background orb */}
          <motion.div
            className="absolute inset-0 pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 2 }}
            style={{
              background:
                'radial-gradient(ellipse 75% 60% at 50% 50%, rgba(124,58,237,0.25) 0%, rgba(236,72,153,0.08) 55%, transparent 100%)',
            }}
          />

          {/* Top ambient light */}
          <motion.div
            className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-64 pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 2.5, delay: 0.4 }}
            style={{
              background:
                'radial-gradient(ellipse at 50% 0%, rgba(124,58,237,0.15) 0%, transparent 70%)',
            }}
          />

          {/* Floating music notes */}
          {particles.map((p, i) => (
            <motion.span
              key={i}
              className="absolute bottom-0 select-none pointer-events-none"
              style={{ left: `${p.x}%`, fontSize: p.size, color: 'rgba(124,58,237,1)' }}
              initial={{ y: 0, opacity: 0 }}
              animate={{
                y: [0, -window.innerHeight - 80],
                opacity: [0, p.opacity, p.opacity, 0],
              }}
              transition={{
                duration: p.duration,
                delay: p.delay,
                repeat: Infinity,
                repeatDelay: Math.random() * 2,
                ease: 'linear',
              }}
            >
              {p.note}
            </motion.span>
          ))}

          {/* Logo icon */}
          <motion.div
            className="relative mb-7"
            initial={{ scale: 0.2, opacity: 0, rotate: -20 }}
            animate={{ scale: 1, opacity: 1, rotate: 0 }}
            transition={{ duration: 0.8, ease: [0.34, 1.56, 0.64, 1] }}
          >
            {/* Glow layers */}
            <motion.div
              className="absolute inset-0 rounded-3xl blur-2xl"
              animate={{ opacity: [0.4, 0.7, 0.4] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
              style={{
                background: 'linear-gradient(135deg, rgba(124,58,237,0.7), rgba(236,72,153,0.5))',
                transform: 'scale(1.4)',
              }}
            />

            <div
              className="w-24 h-24 rounded-3xl flex items-center justify-center shadow-2xl relative z-10"
              style={{
                background: 'linear-gradient(135deg, #7c3aed 0%, #a855f7 50%, #ec4899 100%)',
              }}
            >
              {/* Music waveform inside logo */}
              <div className="flex items-end gap-[3px] h-10">
                {[6, 12, 18, 24, 18, 14, 22, 16, 10].map((h, i) => (
                  <motion.div
                    key={i}
                    className="w-[3px] rounded-full bg-white"
                    animate={{ height: [h * 0.5, h, h * 0.6, h * 0.9, h * 0.5] }}
                    transition={{
                      duration: 0.7 + i * 0.08,
                      repeat: Infinity,
                      ease: 'easeInOut',
                      delay: i * 0.06,
                    }}
                    style={{ height: h }}
                  />
                ))}
              </div>

              {/* Shine overlay */}
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-white/25 via-transparent to-transparent pointer-events-none" />
            </div>

            {/* Pulse rings */}
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="absolute inset-0 rounded-3xl"
                style={{ border: '1.5px solid rgba(124,58,237,0.5)' }}
                initial={{ scale: 1, opacity: 0.5 }}
                animate={{ scale: 1.8 + i * 0.4, opacity: 0 }}
                transition={{
                  duration: 1.8,
                  repeat: Infinity,
                  delay: i * 0.5,
                  ease: 'easeOut',
                }}
              />
            ))}
          </motion.div>

          {/* App name — letter by letter */}
          <div className="flex items-baseline gap-[1px] mb-2">
            {letters.map((letter, i) => (
              <motion.span
                key={i}
                className="text-[3.2rem] font-bold text-text-primary tracking-tight leading-none"
                initial={{ opacity: 0, y: 24, scale: 0.7 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{
                  delay: 0.45 + i * 0.07,
                  duration: 0.45,
                  ease: [0.34, 1.4, 0.64, 1],
                }}
              >
                {letter}
              </motion.span>
            ))}
          </div>

          {/* Tagline */}
          <motion.p
            className="text-text-muted text-xs tracking-[0.28em] uppercase mb-9"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9, duration: 0.5 }}
          >
            by cassiel · music player
          </motion.p>

          {/* Loading bar */}
          <motion.div
            className="w-56 h-[3px] bg-bg-elevated rounded-full overflow-hidden"
            initial={{ opacity: 0, scaleX: 0.6 }}
            animate={{ opacity: 1, scaleX: 1 }}
            transition={{ delay: 0.6, duration: 0.3 }}
          >
            <motion.div
              className="h-full rounded-full"
              style={{
                background: 'linear-gradient(90deg, #7c3aed, #a855f7, #ec4899, #7c3aed)',
                backgroundSize: '300% 100%',
              }}
              initial={{ x: '-100%' }}
              animate={{ x: '0%' }}
              transition={{ delay: 0.7, duration: 1.8, ease: [0.4, 0, 0.2, 1] }}
            />
          </motion.div>

          <motion.p
            className="text-text-muted/35 text-[11px] mt-3 tracking-wide"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.1 }}
          >
            Загружаем...
          </motion.p>

          {/* Version badge */}
          <motion.div
            className="absolute bottom-6 right-6 flex items-center gap-2"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 0.6, y: 0 }}
            transition={{ delay: 1.3 }}
          >
            <span className="text-[10px] text-text-muted font-mono tracking-wider">v0.1.0</span>
            <span
              className="text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-widest"
              style={{
                border: '1px solid rgba(168,85,247,0.4)',
                color: 'rgba(168,85,247,0.9)',
                background: 'rgba(168,85,247,0.08)',
              }}
            >
              beta
            </span>
          </motion.div>

          {/* Equalizer bars at bottom centre */}
          <motion.div
            className="absolute bottom-6 flex items-end gap-[3px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.18 }}
            transition={{ delay: 1.0, duration: 0.7 }}
          >
            {eqBars.map((bar, i) => (
              <motion.div
                key={i}
                className="w-[3px] rounded-full"
                style={{ background: '#7c3aed', height: 4 }}
                animate={{ height: [4, bar.h, 4] }}
                transition={{
                  duration: bar.dur,
                  repeat: Infinity,
                  delay: bar.delay,
                  ease: 'easeInOut',
                  repeatType: 'reverse',
                }}
              />
            ))}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
