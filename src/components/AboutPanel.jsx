import { useEffect, useRef, useState } from 'react'
import WatercolorFlowers from './WatercolorFlowers'

const AboutPanel = ({ isOpen, onClose }) => {
  const panelRef = useRef(null)
  const hasAnimatedRef = useRef(false)
  const hasRevealedRef = useRef(false)
  const imageRef = useRef(null)
  const [showFlowers, setShowFlowers] = useState(false)
  const [firstReveal, setFirstReveal] = useState(true)
  const [imageColorized, setImageColorized] = useState(false)
  const carouselRef = useRef(null)
  const carouselWrapRef = useRef(null)
  const carouselState = useRef({
    // Track geometry
    halfWidth: 0,
    // Position state — pos is the current offset in px (negative = scrolled left)
    pos: null,            // null = first open, will be initialized
    running: false,
    frame: null,
    lastTickTime: null,
    // Auto-scroll
    autoSpeed: 30,        // px/s — constant leftward drift
    // Drag
    dragging: false,
    dragStartX: 0,
    dragStartPos: 0,      // carousel pos when drag started
    // Velocity tracking — ring buffer of last N samples for reliable flick detection
    velSamples: [],       // [{dx, dt, time}] — last ~6 move events
    velMaxSamples: 6,
    // Momentum — per-frame deceleration for natural iOS-like feel
    velocity: 0,          // current velocity in px/s (positive = rightward)
    friction: 0.97,       // per-frame multiplier (~0.97 at 60fps = smooth coast)
  })
  const [decimalAge, setDecimalAge] = useState('')

  useEffect(() => {
    const birth = new Date('2000-04-21')
    const getAge = () => (Date.now() - birth.getTime()) / (1000 * 60 * 60 * 24 * 365.25)
    // Show enough decimals so one digit visibly ticks every ~1.3s
    // 1 year ≈ 31,557,600s → 8th decimal changes every ~0.32s, 7th every ~3.2s
    // We want ~1.3s per tick → show to 8 decimals (last digit ticks ~0.3s,
    // but the visible "slow roll" effect comes from the leading decimals being stable)
    // Actually: to tick every ~1.3s, we need fewer decimals.
    // 6th decimal changes every ~31.6s — too slow
    // 7th decimal changes every ~3.16s — close
    // Let's use a custom approach: update every 1300ms
    setDecimalAge(getAge().toFixed(9))
    const interval = setInterval(() => setDecimalAge(getAge().toFixed(9)), 1300)
    return () => clearInterval(interval)
  }, [])

  const facts = [
    { label: 'Current age', value: decimalAge },
    { label: 'School', value: 'Yonsei University' },
    { label: 'Favorite song', value: '夢中人 - Faye Wong' },
    { label: 'Can speak', value: '4 languages' },
    { label: 'Favorite author', value: 'Kazuo Ishiguro' },
    { label: 'Favorite movie', value: 'Cinema Paradiso' },
    { label: 'Favorite album', value: 'An Awesome Wave' },
    { label: 'Favorite camera', value: 'Leica Q2' },
    { label: 'Favorite anime', value: 'Cowboy Bebop' },
    { label: 'Favorite director', value: 'Hirokazu Koreeda' },
    { label: 'Sports I watch', value: 'ATP, WTA, LCK, PL' },
    { label: 'K-Drama pick', value: 'Reply 1988' },
    { label: 'K-Music pick', value: 'Last Night Story' },
    { label: 'Motivational anthem', value: "Fuckin' in the Bushes" },
    { label: 'Learning', value: 'Japanese' },
    { label: 'Military unit', value: '12th Infantry Division' },
    { label: 'Favorite show', value: 'Mad Men' },
    { label: 'LoL rank', value: 'Platinum (KR)' },
    { label: 'Favorite artist', value: 'The Strokes' },
    { label: 'Favorite dish to make', value: 'Doenjang-jjigae (된장찌개)' },
    { label: 'Favorite sports', value: 'Taekwondo, Table tennis' },
    { label: 'Favorite book', value: 'The Fellowship of the Ring' },
    { label: 'Currently watching', value: 'AKOTSK, Frieren, The Pitt' },
  ]

  // Track if we've animated before (skip on re-open within same session)
  useEffect(() => {
    if (isOpen && hasAnimatedRef.current === false) {
      const timer = setTimeout(() => {
        hasAnimatedRef.current = true
      }, 3500)
      return () => clearTimeout(timer)
    }
  }, [isOpen])

  // Mark text reveal as done after first open completes
  useEffect(() => {
    if (isOpen && !hasRevealedRef.current) {
      // Last element (index 7) finishes at: 700ms delay + 7*100ms stagger + 1400ms animation = 2800ms
      const timer = setTimeout(() => {
        hasRevealedRef.current = true
        setFirstReveal(false)
      }, 2900)
      return () => clearTimeout(timer)
    }
  }, [isOpen])

  // Delay flowers until panel has settled; reset immediately on close
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => setShowFlowers(true), 2900)
      return () => clearTimeout(timer)
    } else {
      setShowFlowers(false)
    }
  }, [isOpen])

  // Drag handlers — mouse + touch, attached once
  useEffect(() => {
    const wrap = carouselWrapRef.current
    if (!wrap) return
    const cs = carouselState.current

    const getX = (e) => e.touches ? e.touches[0].clientX : e.clientX

    const onDragStart = (e) => {
      if (e.type === 'mousedown') e.preventDefault()
      cs.dragging = true
      cs.velocity = 0              // kill any coasting momentum
      cs.dragStartX = getX(e)
      cs.dragStartPos = cs.pos     // snapshot current position
      cs.velSamples = []
      if (e.type === 'mousedown') wrap.style.cursor = 'grabbing'
    }

    const onDragMove = (e) => {
      if (!cs.dragging) return
      const now = performance.now()
      const x = getX(e)
      const dx = x - cs.dragStartX
      cs.pos = cs.dragStartPos + dx
      // Record sample for velocity estimation
      cs.velSamples.push({ x, time: now })
      if (cs.velSamples.length > cs.velMaxSamples) cs.velSamples.shift()
    }

    const onDragEnd = () => {
      if (!cs.dragging) return
      cs.dragging = false
      wrap.style.cursor = ''
      // Compute release velocity from recent samples (last ~80ms)
      const now = performance.now()
      const samples = cs.velSamples
      // Find the oldest sample within 100ms window
      let v = 0
      if (samples.length >= 2) {
        const cutoff = now - 100
        let oldest = samples[samples.length - 1]
        for (let i = samples.length - 2; i >= 0; i--) {
          if (samples[i].time < cutoff) break
          oldest = samples[i]
        }
        const newest = samples[samples.length - 1]
        const dt = newest.time - oldest.time
        if (dt > 5) {  // need at least 5ms of data
          v = ((newest.x - oldest.x) / dt) * 1000 // px/s
        }
      }
      // Only apply momentum if the flick was meaningful
      cs.velocity = Math.abs(v) > 20 ? v : 0
    }

    wrap.addEventListener('mousedown', onDragStart)
    wrap.addEventListener('touchstart', onDragStart, { passive: true })
    window.addEventListener('mousemove', onDragMove)
    window.addEventListener('touchmove', onDragMove, { passive: true })
    window.addEventListener('mouseup', onDragEnd)
    window.addEventListener('touchend', onDragEnd)

    return () => {
      wrap.removeEventListener('mousedown', onDragStart)
      wrap.removeEventListener('touchstart', onDragStart)
      window.removeEventListener('mousemove', onDragMove)
      window.removeEventListener('touchmove', onDragMove)
      window.removeEventListener('mouseup', onDragEnd)
      window.removeEventListener('touchend', onDragEnd)
    }
  }, [])

  // Per-frame animation tick — integrates velocity + auto-scroll each frame
  useEffect(() => {
    const track = carouselRef.current
    if (!track) return
    const cs = carouselState.current

    if (!isOpen) {
      cs.running = false
      cs.lastTickTime = null
      cancelAnimationFrame(cs.frame)
      return
    }

    const setupFrame = requestAnimationFrame(() => {
      cs.halfWidth = track.scrollWidth / 2
      if (!cs.halfWidth) return

      if (cs.pos === null) {
        cs.pos = -(cs.halfWidth - 110)
      }
      cs.lastTickTime = performance.now()
      cs.running = true

      const tick = (now) => {
        if (!cs.running) return
        const dt = (now - cs.lastTickTime) / 1000  // seconds
        cs.lastTickTime = now
        // Clamp dt to avoid jumps on tab-switch or stutter
        const dtClamped = Math.min(dt, 0.1)

        if (!cs.dragging) {
          // Apply momentum velocity (decays each frame via friction)
          if (Math.abs(cs.velocity) > 0.5) {
            cs.pos += cs.velocity * dtClamped
            // Frame-rate-independent friction: friction^(dt*60) for ~60fps baseline
            cs.velocity *= Math.pow(cs.friction, dtClamped * 60)
          } else {
            cs.velocity = 0
          }
          // Auto-scroll: constant leftward drift
          cs.pos -= cs.autoSpeed * dtClamped
        }

        // Seamless looping
        const h = cs.halfWidth
        let displayPos = cs.pos % h
        if (displayPos > 0) displayPos -= h
        track.style.transform = `translate3d(${displayPos}px, 0, 0)`
        cs.frame = requestAnimationFrame(tick)
      }

      cs.frame = requestAnimationFrame(tick)
    })

    return () => {
      cs.running = false
      cancelAnimationFrame(cs.frame)
      cancelAnimationFrame(setupFrame)
    }
  }, [isOpen])

  // Reset image color state when panel closes
  useEffect(() => {
    if (!isOpen) setImageColorized(false)
  }, [isOpen])

  // Colorize image when fully scrolled into view within the panel, revert when out
  useEffect(() => {
    if (!imageRef.current || !panelRef.current) return
    let timer
    const observer = new IntersectionObserver(
      ([entry]) => {
        clearTimeout(timer)
        if (entry.isIntersecting) {
          timer = setTimeout(() => setImageColorized(true), 250)
        } else {
          setImageColorized(false)
        }
      },
      { root: panelRef.current, threshold: 0.85 }
    )
    observer.observe(imageRef.current)
    return () => {
      observer.disconnect()
      clearTimeout(timer)
    }
  }, [isOpen])

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose()
        document.activeElement?.blur()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  return (
    <>
      {/* Backdrop */}
      <div
        className={`about-panel-backdrop ${isOpen ? 'open' : ''}`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Slide-out pill — two-layer anti-flicker pattern */}
      <div className={`about-panel-pill-outer ${isOpen ? 'open' : ''}`} onClick={onClose}>
        <button
          className="about-panel-pill"
          onClick={onClose}
          aria-label="Close about panel"
        >
          <span className="about-panel-pill-line" />
        </button>
      </div>

      {/* Panel */}
      <div
        ref={panelRef}
        className={`about-panel ${isOpen ? 'open' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label="About"
      >
        {/* Watercolor Flowers — archived, not rendered (restore by uncommenting)
        <div
          className={`about-flowers-wrap ${showFlowers ? 'visible' : ''}`}
          style={{ height: 'calc(38vh - 40px)' }}
        >
          <WatercolorFlowers
            isVisible={showFlowers}
            hasBeenSeen={hasAnimatedRef.current}
          />
        </div>
        */}

        {/* Header */}
        <header className="flex flex-col gap-[7px] px-[24px] pt-[calc(38vh-40px)]">
          <h1 className={`${firstReveal ? 'about-reveal' : ''} font-calluna text-[21px] text-[#333] leading-[1] whitespace-nowrap`} style={firstReveal ? { '--reveal-i': 0 } : undefined}>
            Greetings tourist, I'm Joonseo.
          </h1>
          <p className={`${firstReveal ? 'about-reveal' : ''} font-calluna text-[21px] text-[#a1a1a1] leading-[1] whitespace-nowrap`} style={firstReveal ? { '--reveal-i': 1 } : undefined}>
            But feel free to call me Joon.
          </p>
        </header>

        {/* Facts carousel — full-width, right-edge fade */}
        <div
          ref={carouselWrapRef}
          className={`${firstReveal ? 'about-reveal' : ''} w-full overflow-hidden mt-[18px] cursor-grab`}
          style={{
            maskImage: 'linear-gradient(to right, black 0%, black 72%, rgba(0,0,0,0.4) 88%, rgba(0,0,0,0) 100%)',
            WebkitMaskImage: 'linear-gradient(to right, black 0%, black 72%, rgba(0,0,0,0.4) 88%, rgba(0,0,0,0) 100%)',
            ...(firstReveal ? { '--reveal-i': 2 } : {}),
          }}
        >
          <div ref={carouselRef} className="fact-carousel-track gap-[25px] pl-[24px]">
            {[...facts, ...facts].map((fact, i) => {
              const isAge = fact.label === 'Current age'
              return (
                <div key={i} className="flex flex-col gap-[6px] shrink-0">
                  <span className="font-graphik text-[14px] leading-[15px] text-[#5b5b5e] whitespace-nowrap">{fact.label}</span>
                  <span
                    className="font-graphik text-[14px] leading-[15px] text-[#c3c3c3] whitespace-nowrap"
                    style={isAge ? { fontVariantNumeric: 'tabular-nums' } : undefined}
                  >{fact.value}</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Divider + body content */}
        <div className="flex flex-col gap-[15px] items-center mt-[16px] w-full">
          {/* Divider - full width, subtle skeuomorphic inset */}
          <div
            className={`${firstReveal ? 'about-reveal' : ''} w-full h-[2px]`}
            style={{
              background: 'linear-gradient(to bottom, rgba(0,0,0,0.04), rgba(255,255,255,0.8))',
              ...(firstReveal ? { '--reveal-i': 3 } : {}),
            }}
          />

          {/* Text content - 337px wide centered in 385px */}
          <div className="flex flex-col gap-[5px] w-[337px] leading-[25px] text-[14px]">
            <p className={`${firstReveal ? 'about-reveal' : ''} font-graphik font-medium text-[#333333]`} style={firstReveal ? { '--reveal-i': 4 } : undefined}>
              I've had a nomadic upbringing.
            </p>
            <div className="flex flex-col gap-[10px] font-graphik text-[#5b5b5e]">
              <p className={firstReveal ? 'about-reveal' : ''} style={firstReveal ? { '--reveal-i': 5 } : undefined}>I popped into existence in Bundang, South Korea, but then moved to John Hughes' suburbia of Northbrook, Chicago as an infant. Having barely attained object permanence, I suddenly found myself on another plane to Bogota, Colombia, the birthplace of magical realism and Shakira.</p>
              <p className={firstReveal ? 'about-reveal' : ''} style={firstReveal ? { '--reveal-i': 6 } : undefined}>Spanish became my first language, empanadas my religion, and I earned my first unpaid internship as a 6-year-old altar boy at the local church. Up until I boarded yet another plane, this time bound for the culturally oxymoronic setting of a British-Korean school in Weihai, China, where I wore a blazer and tie every day while munching on latiao.</p>
            </div>
          </div>
        </div>

        {/* Bottom image */}
        <div
          ref={imageRef}
          className={`${firstReveal ? 'about-reveal' : ''} w-full h-[240px] overflow-hidden mt-[25px]`}
          style={firstReveal ? { '--reveal-i': 7 } : undefined}
        >
          <img
            src="/images/about-panel.jpg"
            alt="Personal photo"
            className="w-full h-full object-cover"
            style={{
              filter: imageColorized ? 'grayscale(0%) brightness(1) contrast(1)' : 'grayscale(100%) brightness(0.75) contrast(1.05)',
              transform: imageColorized ? 'scale(1)' : 'scale(1.03)',
              transition: 'filter 950ms cubic-bezier(0.25, 0.46, 0.45, 0.94), transform 1100ms cubic-bezier(0.25, 0.46, 0.45, 0.94)',
            }}
            onError={(e) => { e.target.parentElement.style.display = 'none' }}
          />
        </div>

        {/* Placeholder — below image */}
        <div className="flex flex-col gap-[10px] font-graphik text-[14px] text-[#5b5b5e] leading-[25px] px-[24px] mt-[16px]">
          <p>After Weihai, I moved back to South Korea for university at Yonsei, where I studied and served my mandatory military assignment with the 12th Infantry Division. Between drills and lectures, I picked up a camera and started documenting the places and people around me.</p>
          <p>These days I'm based in Kagoshima, Japan, slowly learning the language, shooting on a Leica Q2, and building things for the web. Next stop is Saigon.</p>
        </div>

      </div>
    </>
  )
}

export default AboutPanel
