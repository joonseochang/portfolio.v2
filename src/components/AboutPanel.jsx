import React, { useEffect, useRef, useState } from 'react'
import WatercolorFlowers from './WatercolorFlowers'

// Isolated age ticker — re-renders only itself, not the carousel
const AgeTicker = () => {
  const [age, setAge] = useState('')
  useEffect(() => {
    const birth = new Date('2000-04-21')
    const getAge = () => (Date.now() - birth.getTime()) / (1000 * 60 * 60 * 24 * 365.25)
    setAge(getAge().toFixed(9))
    const interval = setInterval(() => setAge(getAge().toFixed(9)), 1300)
    return () => clearInterval(interval)
  }, [])
  return <span style={{ fontVariantNumeric: 'tabular-nums' }}>{age}</span>
}

const AboutPanel = ({ isOpen, onClose }) => {
  const panelRef = useRef(null)
  const hasAnimatedRef = useRef(false)
  const hasRevealedRef = useRef(false)
  const imageRef = useRef(null)
  const [showFlowers, setShowFlowers] = useState(false)
  const [firstReveal, setFirstReveal] = useState(true)
  const [activePhotoIndex, setActivePhotoIndex] = useState(0)
  const [prevPhotoIndex, setPrevPhotoIndex] = useState(null)
  const [imageColorized, setImageColorized] = useState(false)
  const photoTimerRef = useRef(null)
  const pillFillRefs = useRef([])
  const carouselRef = useRef(null)
  const carouselWrapRef = useRef(null)
  const carouselState = useRef({
    // Auto-scroll (time-based — position is a pure function of wall-clock time)
    halfWidth: 0,
    speed: 38,            // px/s
    openTime: null,       // performance.now() when auto-scroll epoch started
    openPosition: null,   // position at epoch (px, negative); null = first open
    running: false,
    frame: null,
    // Drag
    dragging: false,
    dragStartX: 0,
    dragFrozenPos: 0,     // visual position frozen at drag start
    dragDelta: 0,
    // Velocity — ring buffer for reliable flick detection
    velSamples: [],
    velMaxSamples: 6,
    // Momentum (analytical — no per-frame accumulation)
    inMomentum: false,
    momentumV0: 0,        // px/s at release
    momentumStartTime: 0,
    momentumK: 1.8,       // exponential decay constant (lower = longer coast)
  })
  const facts = [
    { label: 'Current age', value: <AgeTicker /> },
    { label: 'School', value: 'Yonsei University' },
    { label: 'Favorite song', value: '夢中人 - Faye Wong' },
    { label: 'Can speak', value: '4 languages' },
    { label: 'Favorite author', value: 'Kazuo Ishiguro' },
    { label: 'Favorite movie', value: 'Cinema Paradiso' },
    { label: 'Favorite album', value: 'An Awesome Wave' },
    { label: 'Favorite camera', value: 'Leica Q2' },
    { label: 'Favorite anime', value: 'Cowboy Bebop' },
    { label: 'Favorite director', value: 'Park Chan-wook' },
    { label: 'Sports I watch', value: 'ATP, WTA, LCK, PL' },
    { label: 'K-Drama pick', value: 'Reply 1988' },
    { label: 'K-Music pick', value: '심야행 - SE SO NEON' },
    { label: 'Motivational anthem', value: "Fuckin' in the Bushes - Oasis" },
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

  const photos = [
    { src: '/images/about-panel.jpg', caption: 'Popped into existence in Bundang,\nSouth Korea in the spring of 2000.' },
    { src: '/images/about-panel.jpg', caption: 'Moved to Northbrook, Chicago as an infant.\nJohn Hughes suburbia, barely attained object permanence.' },
    { src: '/images/about-panel.jpg', caption: 'Grew up in Bogota, Colombia.\nSpanish became my first language, empanadas my religion.' },
    { src: '/images/about-panel.jpg', caption: 'British-Korean school in Weihai, China.\nBlazers, ties, and latiao every single day.' },
    { src: '/images/about-panel.jpg', caption: 'University years at Yonsei in Seoul.\nStudying and picking up a camera along the way.' },
    { src: '/images/about-panel.jpg', caption: 'Mandatory military service in the mountains\nwith the 12th Infantry Division.' },
    { src: '/images/about-panel.jpg', caption: 'Currently in Kagoshima, Japan.\nSlowly learning the language, shooting on a Leica Q2.' },
    { src: '/images/about-panel.jpg', caption: 'Next stop is Saigon. Building things\nfor the web and documenting along the way.' },
  ]

  const advancePhoto = (nextIndex) => {
    setActivePhotoIndex(prev => {
      setPrevPhotoIndex(prev)
      return typeof nextIndex === 'function' ? nextIndex(prev) : nextIndex
    })
  }

  const resetPhotoTimer = () => {
    clearInterval(photoTimerRef.current)
    photoTimerRef.current = setInterval(() => {
      advancePhoto(prev => (prev + 1) % photos.length)
    }, 5000)
  }

  const handlePhotoPillClick = (index) => {
    advancePhoto(index)
    resetPhotoTimer()
  }

  const goToNextPhoto = () => {
    advancePhoto(prev => (prev + 1) % photos.length)
    resetPhotoTimer()
  }

  const goToPrevPhoto = () => {
    advancePhoto(prev => (prev - 1 + photos.length) % photos.length)
    resetPhotoTimer()
  }

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

    // Compute the current visual position from time-based state
    const getCurrentPos = (now) => {
      const elapsed = cs.openTime ? (now - cs.openTime) * cs.speed / 1000 : 0
      let pos = (cs.openPosition ?? 0) - elapsed
      if (cs.inMomentum) {
        const t = (now - cs.momentumStartTime) / 1000
        pos += (cs.momentumV0 / cs.momentumK) * (1 - Math.exp(-cs.momentumK * t))
      }
      return pos
    }

    const onDragStart = (e) => {
      if (e.type === 'mousedown') e.preventDefault()
      const now = performance.now()
      cs.dragging = true
      cs.dragFrozenPos = getCurrentPos(now)  // snapshot exact visual position
      cs.inMomentum = false
      cs.dragDelta = 0
      cs.dragStartX = getX(e)
      cs.velSamples = []
      if (e.type === 'mousedown') wrap.style.cursor = 'grabbing'
    }

    const onDragMove = (e) => {
      if (!cs.dragging) return
      const now = performance.now()
      const x = getX(e)
      cs.dragDelta = x - cs.dragStartX
      cs.velSamples.push({ x, time: now })
      if (cs.velSamples.length > cs.velMaxSamples) cs.velSamples.shift()
    }

    const onDragEnd = () => {
      if (!cs.dragging) return
      cs.dragging = false
      wrap.style.cursor = ''
      const now = performance.now()
      // Rebase: absorb drag into openPosition, reset epoch
      cs.openPosition = cs.dragFrozenPos + cs.dragDelta
      cs.openTime = now
      cs.dragDelta = 0
      // Compute release velocity from ring buffer
      const samples = cs.velSamples
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
        if (dt > 5) v = ((newest.x - oldest.x) / dt) * 1000
      }
      if (Math.abs(v) > 20) {
        cs.inMomentum = true
        cs.momentumV0 = v
        cs.momentumStartTime = now
      }
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

  // Time-based animation tick — position is a pure function of wall-clock time
  useEffect(() => {
    const track = carouselRef.current
    if (!track) return
    const cs = carouselState.current

    if (!isOpen) {
      // Save current visual position for seamless resume
      if (cs.running && cs.openTime !== null) {
        const now = performance.now()
        const elapsed = (now - cs.openTime) * cs.speed / 1000
        let pos = (cs.openPosition - elapsed) % cs.halfWidth
        if (pos > 0) pos -= cs.halfWidth
        cs.openPosition = pos
        cs.inMomentum = false
      }
      cs.running = false
      cancelAnimationFrame(cs.frame)
      return
    }

    const setupFrame = requestAnimationFrame(() => {
      cs.halfWidth = track.scrollWidth / 2
      if (!cs.halfWidth) return

      if (cs.openPosition === null) {
        cs.openPosition = -(cs.halfWidth - 110)
      }
      cs.openTime = performance.now()
      cs.running = true

      const tick = (now) => {
        if (!cs.running) return
        const h = cs.halfWidth
        let pos

        if (cs.dragging) {
          pos = cs.dragFrozenPos + cs.dragDelta
        } else {
          // Auto-scroll: pure function of elapsed time (no accumulation)
          const elapsed = (now - cs.openTime) * cs.speed / 1000
          pos = cs.openPosition - elapsed

          // Momentum overlay (analytical exponential decay)
          if (cs.inMomentum) {
            const t = (now - cs.momentumStartTime) / 1000
            const k = cs.momentumK
            const offset = (cs.momentumV0 / k) * (1 - Math.exp(-k * t))
            pos += offset
            // Stop momentum when velocity < 1 px/s
            if (Math.abs(cs.momentumV0 * Math.exp(-k * t)) < 1) {
              const finalOffset = cs.momentumV0 / k
              cs.openPosition = cs.openPosition - elapsed + finalOffset
              cs.openTime = now
              cs.inMomentum = false
              pos = cs.openPosition
            }
          }
        }

        pos = pos % h
        if (pos > 0) pos -= h
        track.style.transform = `translate3d(${pos}px, 0, 0)`
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

  // Reset photo carousel when panel closes
  useEffect(() => {
    if (isOpen) {
      setActivePhotoIndex(0)
      setPrevPhotoIndex(null)
    } else {
      clearInterval(photoTimerRef.current)
      setImageColorized(false)
    }
    return () => clearInterval(photoTimerRef.current)
  }, [isOpen])

  // Progress pill fill animation — direct DOM manipulation
  useEffect(() => {
    pillFillRefs.current.forEach((el, idx) => {
      if (!el) return
      if (idx === activePhotoIndex && isOpen) {
        el.style.transition = 'none'
        el.style.width = '0%'
        el.style.opacity = '1'
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            if (!el) return
            el.style.transition = 'width 5000ms linear'
            el.style.width = '100%'
          })
        })
      } else {
        el.style.transition = 'none'
        el.style.width = '0%'
        el.style.opacity = '0'
      }
    })
  }, [activePhotoIndex, isOpen])

  // Intersection observer — colorize image + start/pause auto-advance
  useEffect(() => {
    if (!imageRef.current || !panelRef.current) return
    let colorTimer
    const observer = new IntersectionObserver(
      ([entry]) => {
        clearTimeout(colorTimer)
        if (entry.isIntersecting) {
          colorTimer = setTimeout(() => setImageColorized(true), 250)
          // Start auto-advance when visible
          clearInterval(photoTimerRef.current)
          photoTimerRef.current = setInterval(() => {
            advancePhoto(prev => (prev + 1) % photos.length)
          }, 5000)
        } else {
          setImageColorized(false)
          // Pause auto-advance when out of view
          clearInterval(photoTimerRef.current)
          // Pause fill animation on all pills
          pillFillRefs.current.forEach((el) => {
            if (!el) return
            el.style.transition = 'none'
            el.style.width = '0%'
            el.style.opacity = '0'
          })
        }
      },
      { root: panelRef.current, threshold: 0.5 }
    )
    observer.observe(imageRef.current)
    return () => {
      observer.disconnect()
      clearTimeout(colorTimer)
      clearInterval(photoTimerRef.current)
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
            {[...facts, ...facts].map((fact, i) => (
              <div key={i} className="flex flex-col gap-[6px] shrink-0">
                <span className="font-graphik text-[14px] leading-[15px] text-[#5b5b5e] whitespace-nowrap">{fact.label}</span>
                <span className="font-graphik text-[14px] leading-[15px] text-[#c3c3c3] whitespace-nowrap">{fact.value}</span>
              </div>
            ))}
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

        {/* Photo carousel */}
        <div className={`${firstReveal ? 'about-reveal' : ''} w-full mt-[25px]`} ref={imageRef}
          style={firstReveal ? { '--reveal-i': 7 } : undefined}>
          <div className="relative w-full h-[240px] overflow-hidden" style={{ backgroundColor: '#111' }}>
            {/* Photo slides — outgoing stays opaque, incoming fades in on top */}
            {photos.map((photo, i) => {
              const isActive = i === activePhotoIndex
              const isPrev = i === prevPhotoIndex
              const isVisible = isActive || isPrev
              return (
                <div key={i} className="absolute inset-0"
                  style={{
                    opacity: isActive ? 1 : isPrev ? 1 : 0,
                    zIndex: isActive ? 2 : isPrev ? 1 : 0,
                    transition: isActive ? 'opacity 600ms cubic-bezier(0.25, 0.46, 0.45, 0.94)' : 'none',
                    pointerEvents: isActive ? 'auto' : 'none',
                  }}>
                  {isVisible && (
                    <>
                      <img src={photo.src} alt={photo.caption.replace('\n', ' — ')}
                        className="w-full h-full object-cover"
                        style={{
                          filter: imageColorized ? 'grayscale(0%) brightness(1) contrast(1)' : 'grayscale(100%) brightness(0.75) contrast(1.05)',
                          transform: imageColorized ? 'scale(1)' : 'scale(1.03)',
                          transition: 'filter 950ms cubic-bezier(0.25, 0.46, 0.45, 0.94), transform 1100ms cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                        }} />
                      {/* Gradient overlay — taller for text breathing room */}
                      <div className="absolute bottom-0 left-0 right-0 h-[130px] pointer-events-none"
                        style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.15) 60%, transparent 100%)' }} />
                      {/* Two-line caption */}
                      <p className="absolute bottom-[22px] left-[16px] right-[16px] font-graphik text-[12px] text-white text-center leading-[17px]"
                        style={{ whiteSpace: 'pre-line', opacity: 0.85 }}>
                        {photo.caption}
                      </p>
                    </>
                  )}
                </div>
              )
            })}
            {/* Navigation arrows */}
            <button className="about-photo-arrow" style={{ left: '8px' }}
              onClick={goToPrevPhoto} aria-label="Previous photo">
              <svg width="7" height="12" viewBox="0 0 7 12" fill="none">
                <path d="M6 1L1 6L6 11" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            <button className="about-photo-arrow" style={{ right: '8px' }}
              onClick={goToNextPhoto} aria-label="Next photo">
              <svg width="7" height="12" viewBox="0 0 7 12" fill="none">
                <path d="M1 1L6 6L1 11" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            {/* Progress pills — inside photo frame */}
            <div className="absolute bottom-[8px] left-0 right-0 flex items-center justify-center z-10"
              style={{ gap: '3px' }}>
              {photos.map((_, i) => {
                const isActive = i === activePhotoIndex
                return (
                  <button key={i}
                    className="about-photo-pill"
                    onClick={() => handlePhotoPillClick(i)}
                    aria-label={`Photo ${i + 1}`}
                    style={{
                      width: isActive ? '24px' : '14px',
                      height: isActive ? '3px' : '2.5px',
                      backgroundColor: isActive ? 'rgba(255, 255, 255, 0.5)' : 'rgba(255, 255, 255, 0.25)',
                      position: 'relative',
                      overflow: 'hidden',
                    }}>
                    <div
                      ref={el => { pillFillRefs.current[i] = el }}
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        height: '100%',
                        borderRadius: '2px',
                        backgroundColor: 'rgba(255, 255, 255, 0.85)',
                        width: '0%',
                        opacity: 0,
                      }}
                    />
                  </button>
                )
              })}
            </div>
          </div>
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
