import { useRef, useCallback, useEffect } from 'react'

/**
 * Custom hook for generating warm, retro synth sound effects
 * Uses Web Audio API to create cozy, lo-fi synthesized sounds
 *
 * All oscillators route through a shared master gain → compressor → destination
 * chain. The compressor prevents clipping when rapid clicks overlap.
 */
export function useSounds() {
  const audioContextRef = useRef(null)
  const masterGainRef = useRef(null)
  const compressorRef = useRef(null)
  const isEnabledRef = useRef(true)
  const isInitializedRef = useRef(false)
  const lastPlayRef = useRef(0)
  const resumeTimestampRef = useRef(0)

  // Build (or return existing) master output chain: gain → compressor → destination
  const getMasterOutput = useCallback((ctx) => {
    if (!masterGainRef.current) {
      const gain = ctx.createGain()
      gain.gain.value = 0.6

      const comp = ctx.createDynamicsCompressor()
      comp.threshold.value = -18
      comp.knee.value = 12
      comp.ratio.value = 8
      comp.attack.value = 0.002
      comp.release.value = 0.15

      gain.connect(comp).connect(ctx.destination)
      masterGainRef.current = gain
      compressorRef.current = comp
    }
    return masterGainRef.current
  }, [])

  // Initialize audio context on first user interaction
  const initAudio = useCallback(() => {
    if (isInitializedRef.current) return

    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)()
      }
      if (audioContextRef.current.state === 'suspended') {
        audioContextRef.current.resume()
        resumeTimestampRef.current = performance.now()
      }
      getMasterOutput(audioContextRef.current)
      isInitializedRef.current = true
    } catch (e) {
      // Audio not supported
    }
  }, [getMasterOutput])

  // Set up global listeners to initialize audio on first interaction
  useEffect(() => {
    const events = ['click', 'touchstart', 'keydown']

    const handleInteraction = () => {
      initAudio()
      // Remove listeners after first interaction
      events.forEach(event => {
        document.removeEventListener(event, handleInteraction)
      })
    }

    events.forEach(event => {
      document.addEventListener(event, handleInteraction, { once: true })
    })

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleInteraction)
      })
      if (audioContextRef.current) {
        audioContextRef.current.close()
        masterGainRef.current = null
        compressorRef.current = null
      }
    }
  }, [initAudio])

  // Suspend AudioContext when tab goes hidden; resume (silently) when visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!audioContextRef.current) return
      if (document.hidden) {
        audioContextRef.current.suspend()
      } else {
        audioContextRef.current.resume()
        resumeTimestampRef.current = performance.now()
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [])

  // Get audio context if ready for sound playback
  // Returns null during cooldown after resume to avoid stale-clock crackling
  const getAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)()
      getMasterOutput(audioContextRef.current)
    }
    if (audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume()
      resumeTimestampRef.current = performance.now()
      return null
    }
    // Skip during cooldown after resume — internal clock may not have stabilized
    if (performance.now() - resumeTimestampRef.current < 350) {
      return null
    }
    return audioContextRef.current
  }, [getMasterOutput])

  /**
   * Hover sound - disabled (no-op)
   */
  const playHover = useCallback(() => {
    // No-op: hover sounds removed
  }, [])

  /**
   * Click sound - warm octave pop (C3→C4)
   * Routed through master gain + compressor to prevent clipping
   */
  const playClick = useCallback(() => {
    if (!isEnabledRef.current) return
    const now = performance.now()
    if (now - lastPlayRef.current < 80) return
    lastPlayRef.current = now

    try {
      const ctx = getAudioContext()
      if (!ctx || ctx.state === 'suspended') return

      const master = getMasterOutput(ctx)
      const t = ctx.currentTime

      // First tone: sine settling to C3 (~131Hz)
      const osc1 = ctx.createOscillator()
      osc1.type = 'sine'
      osc1.frequency.setValueAtTime(195, t)
      osc1.frequency.exponentialRampToValueAtTime(131, t + 0.04)
      const og1 = ctx.createGain()
      og1.gain.setValueAtTime(0, t)
      og1.gain.linearRampToValueAtTime(0.22, t + 0.006)
      og1.gain.exponentialRampToValueAtTime(0.001, t + 0.06)
      osc1.connect(og1).connect(master)
      osc1.start(t)
      osc1.stop(t + 0.06)

      // Second tone: C4 (262Hz) — octave up, delayed
      const d = 0.085
      const osc2 = ctx.createOscillator()
      osc2.type = 'sine'
      osc2.frequency.value = 262
      const og2 = ctx.createGain()
      og2.gain.setValueAtTime(0, t + d)
      og2.gain.linearRampToValueAtTime(0.12, t + d + 0.006)
      og2.gain.exponentialRampToValueAtTime(0.001, t + d + 0.055)
      const lp = ctx.createBiquadFilter()
      lp.type = 'lowpass'
      lp.frequency.value = 1100
      osc2.connect(og2).connect(lp).connect(master)
      osc2.start(t + d)
      osc2.stop(t + d + 0.055)
    } catch (e) {
      // Silently fail
    }
  }, [getAudioContext, getMasterOutput])

  /**
   * Arrow navigation - same octave pop, slightly softer
   */
  const playArrow = useCallback(() => {
    if (!isEnabledRef.current) return
    const now = performance.now()
    if (now - lastPlayRef.current < 80) return
    lastPlayRef.current = now

    try {
      const ctx = getAudioContext()
      if (!ctx || ctx.state === 'suspended') return

      const master = getMasterOutput(ctx)
      const t = ctx.currentTime

      const osc1 = ctx.createOscillator()
      osc1.type = 'sine'
      osc1.frequency.setValueAtTime(195, t)
      osc1.frequency.exponentialRampToValueAtTime(131, t + 0.04)
      const og1 = ctx.createGain()
      og1.gain.setValueAtTime(0, t)
      og1.gain.linearRampToValueAtTime(0.16, t + 0.006)
      og1.gain.exponentialRampToValueAtTime(0.001, t + 0.06)
      osc1.connect(og1).connect(master)
      osc1.start(t)
      osc1.stop(t + 0.06)

      const d = 0.085
      const osc2 = ctx.createOscillator()
      osc2.type = 'sine'
      osc2.frequency.value = 262
      const og2 = ctx.createGain()
      og2.gain.setValueAtTime(0, t + d)
      og2.gain.linearRampToValueAtTime(0.09, t + d + 0.006)
      og2.gain.exponentialRampToValueAtTime(0.001, t + d + 0.055)
      const lp = ctx.createBiquadFilter()
      lp.type = 'lowpass'
      lp.frequency.value = 1100
      osc2.connect(og2).connect(lp).connect(master)
      osc2.start(t + d)
      osc2.stop(t + d + 0.055)
    } catch (e) {
      // Silently fail
    }
  }, [getAudioContext, getMasterOutput])

  /**
   * Link hover - disabled (no-op)
   */
  const playLinkHover = useCallback(() => {
    // No-op: hover sounds removed
  }, [])

  /**
   * Video card hover - disabled (no-op)
   */
  const playCardHover = useCallback(() => {
    // No-op: hover sounds removed
  }, [])

  /**
   * Music player hover - disabled (no-op)
   */
  const playMusicHover = useCallback(() => {
    // No-op: hover sounds removed
  }, [])

  /**
   * Toggle/enable sounds
   */
  const setEnabled = useCallback((enabled) => {
    isEnabledRef.current = enabled
  }, [])

  return {
    playHover,
    playClick,
    playArrow,
    playLinkHover,
    playCardHover,
    playMusicHover,
    setEnabled,
  }
}

export default useSounds
