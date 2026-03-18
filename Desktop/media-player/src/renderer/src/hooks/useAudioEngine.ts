import { useEffect, useRef, useCallback } from 'react'
import { usePlayerStore } from '../store/playerStore'
import { Track } from '../types'

export function useAudioEngine() {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const {
    currentTrack,
    isPlaying,
    volume,
    isMuted,
    repeat,
    setProgress,
    setDuration,
    setPlaying,
    setLoading,
    next,
  } = usePlayerStore()

  // Initialize audio element
  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio()
      audioRef.current.preload = 'auto'
    }
    return () => {
      audioRef.current?.pause()
    }
  }, [])

  // Get playable URL for track
  const getTrackUrl = useCallback(async (track: Track): Promise<string | null> => {
    if (track.source === 'local' && track.filePath) {
      // Use query param to safely encode the path (handles spaces, #, ? etc.)
      return `media://local?p=${encodeURIComponent(track.filePath)}`
    }
    if (track.source === 'vk' && track.url) {
      return track.url
    }
    if (track.source === 'yandex' && track.yandexId) {
      try {
        const url = await window.api.yandex.getTrackUrl(track.yandexId)
        return url
      } catch {
        return null
      }
    }
    return null
  }, [])

  // Track change
  useEffect(() => {
    if (!currentTrack || !audioRef.current) return

    const audio = audioRef.current
    setLoading(true)

    getTrackUrl(currentTrack).then((url) => {
      if (!url) {
        setLoading(false)
        return
      }

      audio.src = url
      audio.load()

      if (isPlaying) {
        audio.play().catch(() => setPlaying(false))
      }
    })
  }, [currentTrack?.id])

  // Play/pause
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    if (isPlaying) {
      audio.play().catch(() => setPlaying(false))
    } else {
      audio.pause()
    }
  }, [isPlaying])

  // Volume
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume
    }
  }, [volume, isMuted])

  // Repeat
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.loop = repeat === 'one'
    }
  }, [repeat])

  // Audio event listeners
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const onTimeUpdate = () => setProgress(audio.currentTime)
    const onDurationChange = () => setDuration(audio.duration || 0)
    const onCanPlay = () => setLoading(false)
    const onEnded = () => {
      const nextTrack = next()
      if (!nextTrack) setPlaying(false)
    }
    const onError = () => {
      setLoading(false)
      setPlaying(false)
    }
    const onWaiting = () => setLoading(true)
    const onPlaying = () => {
      setLoading(false)
      setPlaying(true)
    }

    audio.addEventListener('timeupdate', onTimeUpdate)
    audio.addEventListener('durationchange', onDurationChange)
    audio.addEventListener('canplay', onCanPlay)
    audio.addEventListener('ended', onEnded)
    audio.addEventListener('error', onError)
    audio.addEventListener('waiting', onWaiting)
    audio.addEventListener('playing', onPlaying)

    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate)
      audio.removeEventListener('durationchange', onDurationChange)
      audio.removeEventListener('canplay', onCanPlay)
      audio.removeEventListener('ended', onEnded)
      audio.removeEventListener('error', onError)
      audio.removeEventListener('waiting', onWaiting)
      audio.removeEventListener('playing', onPlaying)
    }
  }, [])

  const seek = useCallback((time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time
      setProgress(time)
    }
  }, [])

  return { audioRef, seek }
}
