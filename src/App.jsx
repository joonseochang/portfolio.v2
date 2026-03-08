import { useState, useEffect, useRef, useMemo, useCallback, lazy, Suspense } from 'react'
import { toast, Toaster } from 'sonner'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useLastFm } from './hooks/useLastFm'
import { useGitHubStats } from './hooks/useGitHubStats'
import { useSounds } from './hooks/useSounds'
import { useMediaQuery } from './hooks/useMediaQuery'
import { useAmbientData } from './hooks/useAmbientData'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { Agentation } from 'agentation'
import About from './components/About/About'
import About2 from './components/About2/About2'
import About3 from './components/About3/About3'
import SoundtrackingPage from './components/SoundtrackingPage'
import AboutPanel from './components/AboutPanel'

// Lazy load modal components to defer Framer Motion loading
const SlideUpModal = lazy(() => import('./components/SlideUpModal').then(mod => ({ default: mod.default })))
const MusicModalContent = lazy(() => import('./components/SlideUpModal').then(mod => ({ default: mod.MusicModalContent })))
const ActivityModalContent = lazy(() => import('./components/SlideUpModal').then(mod => ({ default: mod.ActivityModalContent })))
const ShortcutsModalContent = lazy(() => import('./components/SlideUpModal').then(mod => ({ default: mod.ShortcutsModalContent })))
const ContactModalContent = lazy(() => import('./components/SlideUpModal').then(mod => ({ default: mod.ContactModalContent })))

// Preload modal components on hover for instant open
const preloadModalComponents = () => {
  import('./components/SlideUpModal');
};

// Marquee text component - circular scroll (one loop) with subtle fade hint
// waitForSignal: if true, waits for onStartSignal to be called before scrolling
// onScrollComplete: callback fired when scroll animation finishes (for coordinating multiple marquees)
const MarqueeText = ({ children, className, style, maxWidth, delay = 0, waitForSignal = false, signalReady = false, onScrollComplete }) => {
  const containerRef = useRef(null);
  const textRef = useRef(null);
  const [isOverflowing, setIsOverflowing] = useState(false);
  const [scrollOffset, setScrollOffset] = useState(0);
  const [textWidth, setTextWidth] = useState(0);
  const [isScrolling, setIsScrolling] = useState(false);
  const animationRef = useRef(null);
  const hasCalledCompleteRef = useRef(false);
  const onScrollCompleteRef = useRef(onScrollComplete);

  // Keep ref updated without triggering effect
  useEffect(() => {
    onScrollCompleteRef.current = onScrollComplete;
  }, [onScrollComplete]);

  const GAP = 50; // Gap between text instances
  const SCROLL_SPEED = 35; // Uniform scroll speed in pixels per second

  useEffect(() => {
    const checkOverflow = () => {
      if (textRef.current && containerRef.current) {
        const width = textRef.current.scrollWidth;
        const containerWidth = containerRef.current.clientWidth;
        setTextWidth(width);
        setIsOverflowing(width > containerWidth);
      }
    };

    checkOverflow();
    const timeout = setTimeout(checkOverflow, 100);
    return () => clearTimeout(timeout);
  }, [children, maxWidth]);

  useEffect(() => {
    // If waiting for signal and signal not ready, don't start
    if (waitForSignal && !signalReady) {
      setScrollOffset(0);
      setIsScrolling(false);
      return;
    }

    if (!isOverflowing || !textWidth) {
      setScrollOffset(0);
      // If not overflowing, signal completion immediately so dependent marquees can start
      if (onScrollCompleteRef.current && !hasCalledCompleteRef.current) {
        hasCalledCompleteRef.current = true;
        setTimeout(() => onScrollCompleteRef.current?.(), 8000 + delay); // Still respect the initial wait
      }
      return;
    }

    hasCalledCompleteRef.current = false;
    const loopDistance = textWidth + GAP; // One full loop
    const scrollDuration = (loopDistance / SCROLL_SPEED) * 1000; // Duration based on uniform speed
    const initialWait = 8000 + delay; // First scroll after 8 seconds + any additional delay
    const pauseAfterScroll = 16000 + delay; // Keep same delay offset in subsequent cycles
    const cycleTime = scrollDuration + pauseAfterScroll; // Total cycle

    let startTime = null;
    let hasSignaledThisCycle = false;

    const animate = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const totalElapsed = timestamp - startTime;

      // Calculate where we are in the cycle
      let cycleElapsed;
      let currentWait;

      if (totalElapsed < initialWait + scrollDuration) {
        // First cycle
        cycleElapsed = totalElapsed;
        currentWait = initialWait;
      } else {
        // Subsequent cycles - pause happens AFTER the scroll
        const afterFirst = totalElapsed - initialWait - scrollDuration;
        cycleElapsed = afterFirst % cycleTime;
        currentWait = pauseAfterScroll; // Wait time AFTER scroll completes
        hasSignaledThisCycle = false; // Reset for new cycle
      }

      if (cycleElapsed < currentWait) {
        // Waiting phase
        setScrollOffset(0);
        setIsScrolling(false);
      } else if (cycleElapsed < currentWait + scrollDuration) {
        // Scrolling phase
        setIsScrolling(true);
        const scrollProgress = (cycleElapsed - currentWait) / scrollDuration;
        setScrollOffset(-loopDistance * scrollProgress);
      } else {
        // Completed loop - signal completion
        setScrollOffset(0);
        setIsScrolling(false);
        if (onScrollCompleteRef.current && !hasSignaledThisCycle) {
          hasSignaledThisCycle = true;
          onScrollCompleteRef.current();
        }
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isOverflowing, textWidth, delay, waitForSignal, signalReady]);

  return (
    <div
      ref={containerRef}
      className={className}
      style={{
        ...style,
        maxWidth,
        overflow: 'hidden',
        position: 'relative',
        // CSS mask - subtle right fade only (no left fade)
        maskImage: isOverflowing
          ? 'linear-gradient(to right, black 0%, black 82%, rgba(0,0,0,0.4) 94%, rgba(0,0,0,0) 100%)'
          : 'none',
        WebkitMaskImage: isOverflowing
          ? 'linear-gradient(to right, black 0%, black 82%, rgba(0,0,0,0.4) 94%, rgba(0,0,0,0) 100%)'
          : 'none'
      }}
    >
      <div
        style={{
          display: 'inline-flex',
          whiteSpace: 'nowrap',
          transform: `translateX(${scrollOffset}px)`,
          willChange: isOverflowing ? 'transform' : 'auto'
        }}
      >
        <span ref={textRef}>{children}</span>
        {/* Duplicate for seamless circular loop */}
        {isOverflowing && (
          <span style={{ marginLeft: GAP }}>{children}</span>
        )}
      </div>
    </div>
  );
};

// Image URLs from Figma (valid for 7 days)
const imgRectangle316 = "https://www.figma.com/api/mcp/asset/8d33530d-0256-40f5-be5d-e642c6a86c84";
const imgFrame223 = "https://www.figma.com/api/mcp/asset/30286a38-278c-48f0-9f18-06d88761b814";
const imgLine5 = "https://www.figma.com/api/mcp/asset/e24604e5-5571-4d0f-ab1d-aed70112aa6f";
const imgGroup = "https://www.figma.com/api/mcp/asset/61c7aa82-f3ce-422a-beda-513c99c4bdb8";

// Rewrite /about to / before React Router sees it — desktop only (overlay, not a route)
// On mobile, /about is a real route so we don't rewrite
const _isDesktop = window.matchMedia('(min-width: 814px)').matches;
const _initialAbout = window.location.pathname === '/about';
if (_initialAbout && _isDesktop) window.history.replaceState(null, '', '/');

function formatRelativeTime(dateString) {
  if (!dateString) return '';
  const now = Date.now();
  const then = new Date(dateString).getTime();
  const seconds = Math.floor((now - then) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes === 1) return '1 min';
  if (minutes < 60) return `${minutes} mins`;
  const hours = Math.floor(minutes / 60);
  if (hours === 1) return '1 hour';
  if (hours < 24) return `${hours} hours`;
  const days = Math.floor(hours / 24);
  if (days === 1) return '1 day';
  if (days < 30) return `${days} days`;
  const months = Math.floor(days / 30);
  if (months === 1) return '1 month';
  return `${months} months`;
}

function App() {
  const location = useLocation()
  const navigate = useNavigate()
  const [clockTimeString, setClockTimeString] = useState('');
  const [clockTime, setClockTime] = useState({ hours: 0, minutes: 0, seconds: 0, milliseconds: 0 });
  const [isClockHovered, setIsClockHovered] = useState(false);
  const [isClockPressed, setIsClockPressed] = useState(false);
  const clockCardRef = useRef(null);
  const clockPillRef = useRef(null);

  const [isLoading, setIsLoading] = useState(true);
  const [currentCoordIndex, setCurrentCoordIndex] = useState(0);
  const [coordFading, setCoordFading] = useState(false);
  const [loaderMessage, setLoaderMessage] = useState(''); // Encouraging messages after 5 seconds
  const videoCacheRef = useRef(new Map()); // Map<videoSrc, blobUrl> for instant playback
  const adjacentVideosReadyRef = useRef(0); // Track how many adjacent videos are ready during loader
  const fontsLoadedRef = useRef(false); // Track if fonts are loaded
  const [fontsReady, setFontsReady] = useState(false); // State to trigger re-render when fonts load
  const loaderMinTimeRef = useRef(false); // Minimum loader display time

  const isTabletOrBelow = useMediaQuery('(max-width: 813px)');
  const isMobileBreakpoint = useMediaQuery('(max-width: 480px)');

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const mobileMenuRef = useRef(null);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!isMobileMenuOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') { setIsMobileMenuOpen(false); document.activeElement?.blur(); }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isMobileMenuOpen]);

  useEffect(() => {
    if (!isMobileMenuOpen) return;
    const handleClickOutside = (e) => {
      // Ignore clicks on the hamburger button itself (it has its own toggle handler)
      if (e.target.closest('.mobile-hamburger')) return;
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(e.target)) {
        setIsMobileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isMobileMenuOpen]);

  const [searchFocused, setSearchFocused] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef(null);

  const shouldOpenAboutRef = useRef(_initialAbout);
  const [isAboutPanelOpen, setIsAboutPanelOpen] = useState(false);

  const [faceExpression, setFaceExpression] = useState('(=_=)');
  const [faceTransform, setFaceTransform] = useState({ scaleY: 1, scaleX: 1, translateX: 0, translateY: 0 });
  const [isMouseNearFace, setIsMouseNearFace] = useState(false);
  const [isHomeButtonHovered, setIsHomeButtonHovered] = useState(false);
  const [isFaceClicked, setIsFaceClicked] = useState(false);
  const [isFaceHoverExiting, setIsFaceHoverExiting] = useState(false);
  const [isSleepingTime, setIsSleepingTime] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false); // Nav background on scroll

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const checkSleepingTime = () => {
      const hour = new Date().getHours();
      setIsSleepingTime(hour >= 22 || hour < 6);
    };
    checkSleepingTime();
    const interval = setInterval(checkSleepingTime, 60000); // Check every minute
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleGlobalMouseUp = () => setIsFaceClicked(false);
    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => window.removeEventListener('mouseup', handleGlobalMouseUp);
  }, []);
  const [isCommitExpanded, setIsCommitExpanded] = useState(false);
  const faceHoverTimeoutRef = useRef(null);
  const faceEnterTimeoutRef = useRef(null);
  const faceZoneRef = useRef(null);
  const faceIconRef = useRef(null);

  const handleFaceZoneMouseMove = useCallback((e) => {
    if (!isMouseNearFace || !faceIconRef.current) return;

    const faceRect = faceIconRef.current.getBoundingClientRect();
    const faceCenter = {
      x: faceRect.left + faceRect.width / 2,
      y: faceRect.top + faceRect.height / 2,
    };

    // Calculate direction from face to mouse
    const dx = e.clientX - faceCenter.x;
    const dy = e.clientY - faceCenter.y;

    // Clamp eye movement to subtle range
    const eyeX = Math.max(-2, Math.min(2, dx / 50));
    const eyeY = Math.max(-1, Math.min(1, dy / 80));

    setFaceTransform(prev => ({
      ...prev,
      translateX: eyeX,
      translateY: eyeY,
    }));
  }, [isMouseNearFace]);

  useEffect(() => {
    // Wait until site is fully loaded before starting animations
    if (isLoading) return;

    // When hovering or clicked, perish with xx eyes and drift back to center
    if (isHomeButtonHovered || isFaceClicked) {
      setFaceExpression('(x_x)');
      setFaceTransform({ scaleY: 1, scaleX: 1, translateX: 0, translateY: 0 });
      return;
    }

    // When mouse is near face (but not hovering button), show startled expression
    if (isMouseNearFace) {
      setFaceExpression(isSleepingTime ? '(o_o)' : '(O_O)');
      return;
    }

    // Sleeping state (10PM - 6AM)
    if (isSleepingTime) {
      setFaceExpression('(-_-)');
      setFaceTransform({ scaleY: 1, scaleX: 1, translateX: 0, translateY: 0 });
      return;
    }

    // Reset to default when mouse leaves
    setFaceExpression('(=_=)');
    setFaceTransform({ scaleY: 1, scaleX: 1, translateX: 0, translateY: 0 });

    const expressions = {
      default: '(=_=)',
      blink: '(-_-)',
      content: '(=‿=)',
    };

    let blinkTimeout;
    let yawnTimeout;
    let lookTimeout;
    let contentTimeout;
    let isYawning = false;
    let isLooking = false;
    let isAnimating = false; // Prevent overlapping animations
    let lastAnimationEnd = 0; // Track when last animation ended
    let isFirstYawn = true; // Track if this is the first yawn

    const MIN_GAP = 1500; // Minimum 1.5s between different animations

    const canAnimate = () => {
      if (isAnimating || isYawning || isLooking) return false;
      if (Date.now() - lastAnimationEnd < MIN_GAP) return false;
      return true;
    };

    const blink = () => {
      if (!canAnimate()) {
        blinkTimeout = setTimeout(blink, 1000);
        return;
      }

      isAnimating = true;

      // Variety of blink types
      const blinkType = Math.random();

      if (blinkType < 0.15) {
        // Slow sleepy blink (15% chance)
        setFaceTransform(prev => ({ ...prev, scaleY: 0.97 }));
        setFaceExpression(expressions.blink);
        setTimeout(() => {
          setFaceTransform(prev => ({ ...prev, scaleY: 1 }));
          setFaceExpression(expressions.default);
          isAnimating = false;
          lastAnimationEnd = Date.now();
        }, 300);
      } else if (blinkType < 0.25) {
        // Double blink (10% chance)
        setFaceTransform(prev => ({ ...prev, scaleY: 0.96 }));
        setFaceExpression(expressions.blink);
        setTimeout(() => {
          setFaceTransform(prev => ({ ...prev, scaleY: 1 }));
          setFaceExpression(expressions.default);
        }, 100);
        setTimeout(() => {
          setFaceTransform(prev => ({ ...prev, scaleY: 0.96 }));
          setFaceExpression(expressions.blink);
        }, 250);
        setTimeout(() => {
          setFaceTransform(prev => ({ ...prev, scaleY: 1 }));
          setFaceExpression(expressions.default);
          isAnimating = false;
          lastAnimationEnd = Date.now();
        }, 350);
      } else {
        // Regular blink (75% chance)
        setFaceTransform(prev => ({ ...prev, scaleY: 0.96 }));
        setFaceExpression(expressions.blink);
        setTimeout(() => {
          setFaceTransform(prev => ({ ...prev, scaleY: 1 }));
          setFaceExpression(expressions.default);
          isAnimating = false;
          lastAnimationEnd = Date.now();
        }, 120);
      }

      // Next blink in 3-6 seconds
      blinkTimeout = setTimeout(blink, 3000 + Math.random() * 3000);
    };

    // Separate content smile - rare and independent
    const showContent = () => {
      if (!canAnimate()) {
        contentTimeout = setTimeout(showContent, 5000);
        return;
      }

      isAnimating = true;
      setFaceExpression(expressions.content);
      setTimeout(() => {
        setFaceExpression(expressions.default);
        isAnimating = false;
        lastAnimationEnd = Date.now();
      }, 1000);

      // Next content in 25-40 seconds (rare)
      contentTimeout = setTimeout(showContent, 25000 + Math.random() * 15000);
    };

    const yawn = () => {
      if (isLooking || isAnimating) {
        yawnTimeout = setTimeout(yawn, 2000);
        return;
      }
      isYawning = true;
      isAnimating = true;
      setFaceTransform(prev => ({ ...prev, scaleY: 1.02, scaleX: 0.99, translateY: -1 }));
      setTimeout(() => {
        setFaceExpression('(=.=)'); // Mouth slightly open
        setFaceTransform(prev => ({ ...prev, scaleY: 1.03, scaleX: 0.98, translateY: -1.5 }));
      }, 250);
      setTimeout(() => {
        setFaceExpression('(=0=)');
        setFaceTransform(prev => ({ ...prev, scaleY: 1.05, scaleX: 0.97, translateY: -2 }));
      }, 500);
      setTimeout(() => {
        setFaceExpression('(=O=)');
        setFaceTransform(prev => ({ ...prev, scaleY: 1.06, scaleX: 0.96, translateY: -2.5 }));
      }, 750);
      setTimeout(() => {
        setFaceTransform(prev => ({ ...prev, scaleY: 1.05, scaleX: 0.97, translateY: -2 }));
      }, 1100);
      setTimeout(() => {
        setFaceExpression('(=0=)');
        setFaceTransform(prev => ({ ...prev, scaleY: 1.03, scaleX: 0.98, translateY: -1.5 }));
      }, 1400);
      setTimeout(() => {
        setFaceExpression('(=.=)');
        setFaceTransform(prev => ({ ...prev, scaleY: 1.01, scaleX: 0.99, translateY: -0.5 }));
      }, 1650);
      setTimeout(() => {
        setFaceExpression(expressions.default);
        setFaceTransform(prev => ({ ...prev, scaleY: 0.99, scaleX: 1.01, translateY: 0.5 }));
      }, 1900);
      setTimeout(() => {
        setFaceTransform(prev => ({ ...prev, scaleY: 1, scaleX: 1, translateY: 0 }));
        isYawning = false;
        isAnimating = false;
        lastAnimationEnd = Date.now();
      }, 2100);
      // Next yawn in 20-35 seconds (after first yawn)
      isFirstYawn = false;
      yawnTimeout = setTimeout(yawn, 20000 + Math.random() * 15000);
    };

    const lookAround = () => {
      if (isYawning || isAnimating) {
        lookTimeout = setTimeout(lookAround, 2000);
        return;
      }
      isLooking = true;
      isAnimating = true;

      // Slow, gentle head drift patterns - very subtle movements
      const patterns = [
        // Slow drift left, hold, drift back
        [{ x: -0.8, duration: 1200 }, { x: -0.8, duration: 800 }, { x: 0, duration: 1000 }],
        // Slow drift right, hold, drift back
        [{ x: 0.8, duration: 1200 }, { x: 0.8, duration: 800 }, { x: 0, duration: 1000 }],
        // Gentle sway left to right
        [{ x: -0.6, duration: 1400 }, { x: 0.6, duration: 1800 }, { x: 0, duration: 1200 }],
        // Gentle sway right to left
        [{ x: 0.6, duration: 1400 }, { x: -0.6, duration: 1800 }, { x: 0, duration: 1200 }],
      ];

      const pattern = patterns[Math.floor(Math.random() * patterns.length)];
      let delay = 0;

      pattern.forEach((step, index) => {
        setTimeout(() => {
          setFaceTransform(prev => ({ ...prev, translateX: step.x }));
          if (index === pattern.length - 1) {
            // Last step - mark as done after it settles
            setTimeout(() => {
              isLooking = false;
              isAnimating = false;
              lastAnimationEnd = Date.now();
            }, 500);
          }
        }, delay);
        delay += step.duration;
      });

      // Next look in 8-15 seconds
      lookTimeout = setTimeout(lookAround, 8000 + Math.random() * 7000);
    };

    // Start animations with staggered initial delays
    blinkTimeout = setTimeout(blink, 2000 + Math.random() * 2000);
    // First yawn at 6 seconds so user sees it early
    yawnTimeout = setTimeout(yawn, 6000);
    lookTimeout = setTimeout(lookAround, 10000 + Math.random() * 4000);
    contentTimeout = setTimeout(showContent, 30000 + Math.random() * 20000);

    return () => {
      clearTimeout(blinkTimeout);
      clearTimeout(yawnTimeout);
      clearTimeout(lookTimeout);
      clearTimeout(contentTimeout);
    };
  }, [isLoading, isMouseNearFace, isFaceClicked, isHomeButtonHovered, isSleepingTime]);

  const { currentTrack, isLoading: musicLoading, error: musicError, isPlaying: isPreviewPlaying, isDataComplete, playPreview, stopPreview } = useLastFm();

  const { stats: githubStats } = useGitHubStats();

  const { playClick, playArrow } = useSounds();
  const videoRef1 = useRef(null);
  const videoRef2 = useRef(null);
  const [videoIndex, setVideoIndex] = useState(0);
  const [activeVideo, setActiveVideo] = useState(1); // 1 or 2, tracks which video element is visible
  const video1IndexRef = useRef(0); // Which video data index is in video1
  const video2IndexRef = useRef(1); // Which video data index is in video2
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [videoLoading, setVideoLoading] = useState(false); // Loading state during video transitions
  const [currentVideoPlaying, setCurrentVideoPlaying] = useState(false); // Track if current video is actually playing
  const firstVideoReadyRef = useRef(false); // Track if first video is ready for loader

  // Video warm-up tracking - briefly plays each video to initialize decoder
  const warmupCompleteRef = useRef(false);
  const warmupCountRef = useRef(0);

  // Page persistence - prevent video reset on route toggle
  const hasInitializedHomeRef = useRef(false);
  const scrollPositionsRef = useRef({ home: 0, about: 0 });

  const [loadedComponents, setLoadedComponents] = useState({
    timeComponent: false,
    h1: false,
    bodyParagraphs: false,
    videoFrame: false,
    bottomComponent: false,
    navBar: false
  });
  const [showJiggle, setShowJiggle] = useState(false);

  const [arrowKeyIndicator, setArrowKeyIndicator] = useState(null); // { direction: 'left' | 'right', key: number } | null
  const arrowKeyTimeoutRef = useRef(null);
  const arrowKeyCounterRef = useRef(0);
  const changeVideoRef = useRef(null);
  const [hasDiscoveredContent, setHasDiscoveredContent] = useState(false); // Once true, jiggle never triggers again
  const [isHovered, setIsHovered] = useState(false);
  const [mobileMetadataExpanded, setMobileMetadataExpanded] = useState(false); // Mobile: toggle metadata box on tap

  // Check if device is mobile/tablet
  const isMobileOrTablet = /iPhone|iPad|iPod|Android|webOS|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  const [isMusicHovered, setIsMusicHovered] = useState(false);
  const [artistMarqueeReady, setArtistMarqueeReady] = useState(false); // Signal for artist marquee to start after song title
  const [isModalExiting, setIsModalExiting] = useState(false);
  const [isShortcutsHovered, setIsShortcutsHovered] = useState(false);
  const [isShortcutsModalExiting, setIsShortcutsModalExiting] = useState(false);
  const [isShortcutsActive, setIsShortcutsActive] = useState(false);
  const [isMac, setIsMac] = useState(true);
  const [activeModal, setActiveModal] = useState(null); // 'music' | 'activity' | 'shortcuts' | 'contact' | null
  const [activeAnchorRef, setActiveAnchorRef] = useState(null);

  // Dynamic popup conflict detection — hides hover popups only when the open
  // modal actually overlaps them in the viewport. Reacts to pill width changes
  // (track title length) and window resizes.
  const [musicTabConflicts, setMusicTabConflicts] = useState(false);
  const [shortcutsTooltipConflicts, setShortcutsTooltipConflicts] = useState(false);

  const BUNNY_CDN_BASE = 'https://joonseo-videos.b-cdn.net';
  const musicButtonRef = useRef(null);
  const activityButtonRef = useRef(null);
  const contactButtonRef = useRef(null);
  const isHoveredRef = useRef(false);
  const videoFrameRef = useRef(null);
  const isTransitioningRef = useRef(false);
  const modalTimeoutRef = useRef(null);
  const musicEnterTimeoutRef = useRef(null);
  const shortcutsModalTimeoutRef = useRef(null);
  const shortcutsButtonRef = useRef(null);
  const barPoseRef = useRef(-1);
  const barIntervalRef = useRef(null);
  const barRefs = useRef([null, null, null]);
  const barPoses = [[8, 10, 5], [10, 5, 8], [5, 8, 10]];
  const setBarWidths = (widths) => {
    barRefs.current.forEach((el, i) => { if (el) el.style.width = widths[i] + 'px'; });
  };
  const onBarsEnter = () => {
    barPoseRef.current = 0;
    setBarWidths(barPoses[0]);
    barIntervalRef.current = setInterval(() => {
      barPoseRef.current = (barPoseRef.current + 1) % barPoses.length;
      setBarWidths(barPoses[barPoseRef.current]);
    }, 1800);
  };
  const onBarsLeave = () => {
    clearInterval(barIntervalRef.current);
    barPoseRef.current = -1;
    setBarWidths([10, 10, 10]);
  };

  const [videoData, setVideoData] = useState([]);
  const [websiteCopy, setWebsiteCopy] = useState({});
  const lastMediaHashRef = useRef('');
  const lastCopyHashRef = useRef('');

  const videoFailedTiersRef = useRef(new Map()); // Track which tiers failed for each video id
  
  // City to timezone mapping - automatically determines timezone from city name
  const getTimezoneFromCity = (cityName) => {
    if (!cityName) return 'UTC';
    
    const cityMap = {
      // Asia
      'saigon': 'Asia/Ho_Chi_Minh',
      'ho chi minh': 'Asia/Ho_Chi_Minh',
      'ho chi minh city': 'Asia/Ho_Chi_Minh',
      'hcmc': 'Asia/Ho_Chi_Minh',
      'tokyo': 'Asia/Tokyo',
      'japan': 'Asia/Tokyo',
      'kagoshima': 'Asia/Tokyo',
      'seoul': 'Asia/Seoul',
      'korea': 'Asia/Seoul',
      'beijing': 'Asia/Shanghai',
      'shanghai': 'Asia/Shanghai',
      'hong kong': 'Asia/Hong_Kong',
      'singapore': 'Asia/Singapore',
      'bangkok': 'Asia/Bangkok',
      'jakarta': 'Asia/Jakarta',
      'manila': 'Asia/Manila',
      'mumbai': 'Asia/Kolkata',
      'delhi': 'Asia/Kolkata',
      'dubai': 'Asia/Dubai',
      // Europe
      'london': 'Europe/London',
      'paris': 'Europe/Paris',
      'berlin': 'Europe/Berlin',
      'rome': 'Europe/Rome',
      'madrid': 'Europe/Madrid',
      'amsterdam': 'Europe/Amsterdam',
      'moscow': 'Europe/Moscow',
      // Americas
      'new york': 'America/New_York',
      'los angeles': 'America/Los_Angeles',
      'san francisco': 'America/Los_Angeles',
      'chicago': 'America/Chicago',
      'toronto': 'America/Toronto',
      'vancouver': 'America/Vancouver',
      'mexico city': 'America/Mexico_City',
      'sao paulo': 'America/Sao_Paulo',
      'buenos aires': 'America/Buenos_Aires',
      // Oceania
      'sydney': 'Australia/Sydney',
      'melbourne': 'Australia/Melbourne',
      'auckland': 'Pacific/Auckland',
    };
    
    const normalizedCity = cityName.toLowerCase().trim();
    return cityMap[normalizedCity] || 'UTC';
  };

  // City to coordinates mapping - derives lat/lng from CMS city name
  const getCoordsFromCity = (cityName) => {
    if (!cityName) return { lat: 0, lng: 0 };
    const coordsMap = {
      'saigon': { lat: 10.777, lng: 106.699 },
      'ho chi minh': { lat: 10.777, lng: 106.699 },
      'ho chi minh city': { lat: 10.777, lng: 106.699 },
      'hcmc': { lat: 10.777, lng: 106.699 },
      'tokyo': { lat: 35.682, lng: 139.692 },
      'japan': { lat: 35.682, lng: 139.692 },
      'kagoshima': { lat: 31.3937, lng: 130.5350 },
      'seoul': { lat: 37.566, lng: 126.978 },
      'korea': { lat: 37.566, lng: 126.978 },
      'beijing': { lat: 39.904, lng: 116.407 },
      'shanghai': { lat: 31.230, lng: 121.474 },
      'hong kong': { lat: 22.320, lng: 114.169 },
      'singapore': { lat: 1.352, lng: 103.820 },
      'bangkok': { lat: 13.756, lng: 100.502 },
      'jakarta': { lat: -6.175, lng: 106.845 },
      'manila': { lat: 14.599, lng: 120.984 },
      'mumbai': { lat: 19.076, lng: 72.878 },
      'delhi': { lat: 28.614, lng: 77.209 },
      'dubai': { lat: 25.205, lng: 55.270 },
      'london': { lat: 51.507, lng: -0.128 },
      'paris': { lat: 48.857, lng: 2.352 },
      'berlin': { lat: 52.520, lng: 13.405 },
      'rome': { lat: 41.902, lng: 12.496 },
      'madrid': { lat: 40.417, lng: -3.704 },
      'amsterdam': { lat: 52.370, lng: 4.895 },
      'moscow': { lat: 55.756, lng: 37.617 },
      'new york': { lat: 40.713, lng: -74.006 },
      'los angeles': { lat: 34.052, lng: -118.244 },
      'san francisco': { lat: 37.775, lng: -122.419 },
      'chicago': { lat: 41.878, lng: -87.630 },
      'toronto': { lat: 43.653, lng: -79.383 },
      'vancouver': { lat: 49.283, lng: -123.121 },
      'mexico city': { lat: 19.433, lng: -99.133 },
      'sao paulo': { lat: -23.551, lng: -46.634 },
      'buenos aires': { lat: -34.604, lng: -58.382 },
      'sydney': { lat: -33.869, lng: 151.209 },
      'melbourne': { lat: -37.814, lng: 144.963 },
      'auckland': { lat: -36.849, lng: 174.764 },
    };
    return coordsMap[cityName.toLowerCase().trim()] || { lat: 0, lng: 0 };
  };

  // Helper to get copy by key - use safeWebsiteCopy if available
  const getCopy = (key) => {
    const copy = websiteCopy[key] || '';
    return copy;
  };

  // Calculate time ago from Last.fm timestamp
  const getTimeAgo = (timestamp) => {
    if (!timestamp) return null;
    
    const now = new Date();
    const playedAt = new Date(timestamp);
    const diffMs = now - playedAt;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins} min${diffMins !== 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
    return 'recently';
  };
  
  // Helper to render copy with links: {text|url} becomes <a>, {text} becomes <span>
  const renderCopy = (key) => {
    const content = getCopy(key);
    if (!content) return null;

    // Parse {text|url} for links and {text} for styled spans
    const parts = content.split(/(\{[^}]+\})/g);
    return parts.map((part, i) => {
      const linkMatch = part.match(/^\{([^|]+)\|([^}]+)\}$/);
      const spanMatch = part.match(/^\{([^}]+)\}$/);

      if (linkMatch) {
        return (
          <a key={i} href={linkMatch[2]} target="_blank" rel="noopener noreferrer" className="dotted-underline-grey text-grey-dark" onClick={playClick}>
            {linkMatch[1]}
          </a>
        );
      } else if (spanMatch) {
        return <span key={i} className="dotted-underline-grey text-grey-dark">{spanMatch[1]}</span>;
      }
      
      // Check for "second breakfasts" easter egg (case-insensitive)
      if (/second breakfasts/i.test(part)) {
        const regex = /(second breakfasts)/gi;
        const splitParts = part.split(regex);
        return splitParts.map((splitPart, j) => {
          if (regex.test(splitPart)) {
            return (
              <a
                key={`${i}-${j}`}
                href="https://www.youtube.com/watch?v=gA8LV37QwxA"
                target="_blank"
                rel="noopener noreferrer"
                className="easter-egg-second-breakfast"
              >
                {splitPart}
              </a>
            );
          }
          return splitPart;
        });
      }
      
      return part;
    });
  };
  
  // Fetch CMS data on mount and poll for changes in dev mode
  useEffect(() => {
    const fetchWithTimeout = async (url, timeout = 5000) => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);
      
      try {
        const response = await fetch(url, { signal: controller.signal, cache: 'no-cache' });
        clearTimeout(timeoutId);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return await response.json();
      } catch (error) {
        clearTimeout(timeoutId);
        if (error.name === 'AbortError') {
          throw new Error('Request timeout');
        }
        throw error;
      }
    };

    const fetchCmsData = async () => {
      try {
        // Always fetch from static JSON files
        const [mediaJson, copyJson] = await Promise.allSettled([
          fetchWithTimeout('/cms-data/homepage-media.json', 5000),
          fetchWithTimeout('/cms-data/website-copy.json', 5000)
        ]);

        // Handle media data
        if (mediaJson.status === 'fulfilled') {
          const newMediaHash = JSON.stringify(mediaJson.value.data);
          if (newMediaHash !== lastMediaHashRef.current) {
            lastMediaHashRef.current = newMediaHash;
            setVideoData(mediaJson.value.data || []);
          }
        }

        // Handle website copy
        if (copyJson.status === 'fulfilled') {
          const newCopyHash = JSON.stringify(copyJson.value.data);
          if (newCopyHash !== lastCopyHashRef.current) {
            lastCopyHashRef.current = newCopyHash;
            const copyObj = {};
            (copyJson.value.data || []).forEach(item => {
              copyObj[item.key] = item.content;
            });
            if (copyJson.value.clock_facts) copyObj.clock_facts = copyJson.value.clock_facts;
            if (copyJson.value.clock_arrival_date) copyObj.clock_arrival_date = copyJson.value.clock_arrival_date;
            setWebsiteCopy(copyObj);
          }
        }
      } catch (error) {
        // Silent fail - data will remain unchanged
      }
    };

    fetchCmsData();

    // Poll every 2 seconds for changes (useful during development)
    let pollInterval = setInterval(fetchCmsData, 2000);
    
    // Also refetch when window regains focus
    const handleFocus = () => fetchCmsData();
    window.addEventListener('focus', handleFocus);
    
    return () => {
      window.removeEventListener('focus', handleFocus);
      if (pollInterval) clearInterval(pollInterval);
    };
  }, []);
  
  useEffect(() => {
    isHoveredRef.current = isHovered;
  }, [isHovered]);

  useEffect(() => {
    isTransitioningRef.current = isTransitioning;
  }, [isTransitioning]);

  useEffect(() => {
    return () => {
      videoCacheRef.current.forEach((blobUrl) => {
        URL.revokeObjectURL(blobUrl);
      });
    };
  }, []);

  // Track the last known width to prevent resetting during data refresh
  const lastMusicPillWidthRef = useRef(205);

  // Measure actual text width using canvas for accurate dynamic sizing
  const measureTextWidth = (text, font = '14px Graphik, sans-serif') => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    ctx.font = font;
    return ctx.measureText(text).width;
  };

  // Calculate music pill width dynamically based on actual text width
  // Measures text, adds padding for album art + gaps + hover box margin
  const musicPillWidth = useMemo(() => {
    // Don't update width until data is complete (album art preloaded)
    if (!isDataComplete) return lastMusicPillWidthRef.current;
    if (!currentTrack?.name || !currentTrack?.artist) return lastMusicPillWidthRef.current;

    // Measure actual pixel width of title and artist
    const titleWidth = measureTextWidth(currentTrack.name);
    const artistWidth = measureTextWidth(currentTrack.artist);
    const maxTextWidth = Math.max(titleWidth, artistWidth);

    const fixedOffset = 40 + 10 + 22 + 18 + 45;

    const calculatedWidth = Math.round(maxTextWidth + fixedOffset);
    const newWidth = Math.max(185, Math.min(265, calculatedWidth));

    // Update the ref for next time
    lastMusicPillWidthRef.current = newWidth;
    return newWidth;
  }, [currentTrack?.name, currentTrack?.artist, isDataComplete]);

  useEffect(() => {
    setArtistMarqueeReady(false);
  }, [currentTrack?.name]);

  useEffect(() => {
    return () => {
      if (modalTimeoutRef.current) {
        clearTimeout(modalTimeoutRef.current);
      }
      if (shortcutsModalTimeoutRef.current) {
        clearTimeout(shortcutsModalTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const checkIsMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0 ||
                       navigator.userAgent.toUpperCase().indexOf('MAC') >= 0;
    setIsMac(checkIsMac);
  }, []);
  // Get video source - unified premium quality for all browsers
  const getVideoSrc = (video) => {
    if (!video) return '';
    return video.src;
  };

  // Handle video load failure - fallback to standard tier
  const handleVideoError = (videoId, videoElement) => {
    // Log video errors for debugging
    console.warn(`Video ${videoId} failed to load:`, videoElement?.src);
  };

  // On mount: if URL was /about, open the panel once loader finishes
  useEffect(() => {
    if (isLoading) return;
    if (shouldOpenAboutRef.current) {
      shouldOpenAboutRef.current = false;
      if (!isTabletOrBelow) {
        setIsAboutPanelOpen(true);
      }
    }
  }, [isLoading]); // eslint-disable-line react-hooks/exhaustive-deps

  // Sync URL with about panel state (overlay, not a route change)
  useEffect(() => {
    if (isAboutPanelOpen) {
      window.history.replaceState(null, '', '/about');
    } else if (window.location.pathname === '/about') {
      window.history.replaceState(null, '', '/');
    }
  }, [isAboutPanelOpen])

  // Pause/resume video when about panel opens/closes
  useEffect(() => {
    const currentVideo = videoElementsRef.current[videoIndex];
    if (!currentVideo) return;
    if (isAboutPanelOpen) {
      currentVideo.pause();
    } else if (location.pathname === '/') {
      currentVideo.play().catch(() => {});
    }
  }, [isAboutPanelOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  // Keyboard shortcuts: Cmd+K / Ctrl+K and Escape to close modal
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Escape to close about panel
      if (e.code === 'Escape' && isAboutPanelOpen) {
        e.preventDefault();
        setIsAboutPanelOpen(false);
        document.activeElement?.blur();
        return;
      }

      // Escape to close modal
      if (e.code === 'Escape' && activeModal) {
        e.preventDefault();
        setActiveModal(null);
        document.activeElement?.blur();
        return;
      }

      // Cmd+J / Ctrl+J to toggle about panel
      if ((e.metaKey || e.ctrlKey) && e.code === 'KeyJ') {
        e.preventDefault();
        setIsAboutPanelOpen(prev => !prev);
        return;
      }

      // Check for Cmd+K (Mac) or Ctrl+K (Windows/Linux) — toggle shortcuts palette
      if ((e.metaKey || e.ctrlKey) && e.code === 'KeyK') {
        e.preventDefault();

        if (activeModal === 'shortcuts') {
          setActiveModal(null);
          setActiveAnchorRef(null);
        } else {
          setActiveModal('shortcuts');
          setActiveAnchorRef(shortcutsButtonRef);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeModal, isAboutPanelOpen]);

  // Compute whether the current modal's horizontal extent overlaps each hover popup.
  // Modals are ~340px wide (half = 170px). Music tab is ~120px wide (half = 60px).
  // ⌘K tooltip is ~50px wide (half = 25px). Overlap = intervals intersect.
  const updatePopupConflicts = useCallback(() => {
    if (!activeModal || !activeAnchorRef?.current) {
      setMusicTabConflicts(false);
      setShortcutsTooltipConflicts(false);
      return;
    }
    const anchorRect = activeAnchorRef.current.getBoundingClientRect();
    const anchorCenter = anchorRect.left + anchorRect.width / 2;
    const modalHalf = 170;

    if (musicButtonRef.current) {
      const r = musicButtonRef.current.getBoundingClientRect();
      const musicCenter = r.left + r.width / 2;
      const conflict = (anchorCenter - modalHalf) < (musicCenter + 60) &&
                       (anchorCenter + modalHalf) > (musicCenter - 60);
      setMusicTabConflicts(conflict);
      if (conflict) setIsMusicHovered(false);
    }

    if (activeModal === 'shortcuts') {
      setShortcutsTooltipConflicts(true);
      setIsShortcutsHovered(false);
      return;
    }
    if (shortcutsButtonRef.current) {
      const r = shortcutsButtonRef.current.getBoundingClientRect();
      const shortcutsCenter = r.left + r.width / 2;
      const conflict = (anchorCenter - modalHalf) < (shortcutsCenter + 25) &&
                       (anchorCenter + modalHalf) > (shortcutsCenter - 25);
      setShortcutsTooltipConflicts(conflict);
      if (conflict) setIsShortcutsHovered(false);
    }
  }, [activeModal, activeAnchorRef]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    updatePopupConflicts();
    window.addEventListener('resize', updatePopupConflicts);
    return () => window.removeEventListener('resize', updatePopupConflicts);
  }, [updatePopupConflicts]);

  // Handle video ended event - auto-advance to next video
  const handleVideoEnded = (e) => {
    // Prevent handling if we're already transitioning
    if (isTransitioningRef.current) {
      return;
    }
    
    const video = e.target;
    
    // Always advance to next video when current one ends
    if (video) {
      video.loop = false;
    }
    changeVideo('next');
  };

  // Track transition state for cancellation
  const transitionIdRef = useRef(0);
  const pendingDirectionRef = useRef(null);
  const targetVideoIndexRef = useRef(0); // Track ultimate target when clicking fast

  // Helper to encode video src - handles URL encoding for paths
  const encodeVideoSrc = (src) => {
    if (!src) return src;
    // Encode spaces in URL path segments
    const parts = src.split('/');
    return parts.map((part, i) => i === 0 ? part : encodeURIComponent(part)).join('/');
  };

  // Helper to get poster image from Bunny CDN
  const getPosterSrc = (src) => {
    if (!src) return '';
    // Extract filename from URL path, replace .mp4 with .jpg
    try {
      const urlPath = new URL(src, window.location.origin).pathname;
      const filename = urlPath.split('/').pop().replace('.mp4', '.jpg');
      return `${BUNNY_CDN_BASE}/posters/${filename}`;
    } catch {
      return '';
    }
  };

  // Warm up adjacent video by silently playing one frame (forces Safari decoder init)
  const warmUpAdjacentVideo = useCallback((videoEl) => {
    if (!videoEl) return;
    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
    if (!isSafari) return;
    // Already decoded enough data
    if (videoEl.readyState >= 4) return;

    videoEl.muted = true;
    videoEl.currentTime = 0;

    const onTimeUpdate = () => {
      videoEl.removeEventListener('timeupdate', onTimeUpdate);
      videoEl.pause();
      videoEl.currentTime = 0;
    };

    videoEl.addEventListener('timeupdate', onTimeUpdate, { once: true });
    videoEl.play().catch(() => {
      videoEl.removeEventListener('timeupdate', onTimeUpdate);
    });
  }, []);

  // Track which videos have been predictively preloaded to avoid duplicate fetches
  const predictivePreloadedRef = useRef(new Set());

  // Predictive preloading: preload next+1 video when current is 50% complete
  const handleVideoTimeUpdate = useCallback((e) => {
    const video = e.target;
    if (!video || !video.duration || videoData.length < 3) return;

    const progress = video.currentTime / video.duration;
    const currentIdx = videoElementsRef.current.findIndex(v => v === video);
    if (currentIdx === -1 || currentIdx !== videoIndex) return;

    // When 40% through, start preloading next video (in case not already loaded)
    if (progress >= 0.4 && progress < 0.5) {
      const nextIdx = (currentIdx + 1) % videoData.length;
      const nextVideoSrc = getVideoSrc(videoData[nextIdx]);
      if (!videoCacheRef.current.has(nextVideoSrc) && !predictivePreloadedRef.current.has(nextVideoSrc)) {
        predictivePreloadedRef.current.add(nextVideoSrc);
        const encodedSrc = encodeVideoSrc(nextVideoSrc);
        fetch(encodedSrc, { priority: 'high' }).then(res => {
          if (res.ok) return res.blob();
          throw new Error('fetch failed');
        }).then(blob => {
          const blobUrl = URL.createObjectURL(blob);
          videoCacheRef.current.set(nextVideoSrc, blobUrl);
          const videoEl = videoElementsRef.current[nextIdx];
          if (videoEl && nextIdx !== videoIndex) {
            videoEl.src = blobUrl;
            videoEl.load();
            warmUpAdjacentVideo(videoEl);
          }
        }).catch(() => {});
      }
    }

    // When 60% through, preload next+1 video for smoother experience
    if (progress >= 0.6 && progress < 0.7 && videoData.length > 3) {
      const nextPlusOneIdx = (currentIdx + 2) % videoData.length;
      const nextPlusOneSrc = getVideoSrc(videoData[nextPlusOneIdx]);
      if (!videoCacheRef.current.has(nextPlusOneSrc) && !predictivePreloadedRef.current.has(nextPlusOneSrc)) {
        predictivePreloadedRef.current.add(nextPlusOneSrc);
        // Use requestIdleCallback for next+1 to avoid competing with main thread
        const doPreload = () => {
          const encodedSrc = encodeVideoSrc(nextPlusOneSrc);
          fetch(encodedSrc).then(res => {
            if (res.ok) return res.blob();
            throw new Error('fetch failed');
          }).then(blob => {
            const blobUrl = URL.createObjectURL(blob);
            videoCacheRef.current.set(nextPlusOneSrc, blobUrl);
            const videoEl = videoElementsRef.current[nextPlusOneIdx];
            if (videoEl && nextPlusOneIdx !== videoIndex) {
              videoEl.src = blobUrl;
              videoEl.load();
            }
          }).catch(() => {});
        };
        if ('requestIdleCallback' in window) {
          requestIdleCallback(doPreload, { timeout: 3000 });
        } else {
          setTimeout(doPreload, 100);
        }
      }
    }
  }, [videoIndex, videoData, warmUpAdjacentVideo]);

  // Preload video on hover for faster transitions
  const preloadVideoOnHover = (direction) => {
    if (videoData.length === 0 || isTransitioningRef.current) return;

    const baseIndex = isTransitioningRef.current ? targetVideoIndexRef.current : videoIndex;
    const targetIndex = direction === 'next'
      ? (baseIndex + 1) % videoData.length
      : (baseIndex - 1 + videoData.length) % videoData.length;

    // Trigger preload on the target video element
    const targetVideoEl = videoElementsRef.current[targetIndex];
    if (targetVideoEl) {
      targetVideoEl.preload = 'auto';
      // Also warm up the video for faster switching on Safari
      warmUpAdjacentVideo(targetVideoEl);
    }

    // Also preload next+1 in the same direction for smoother multi-hop navigation
    if (videoData.length > 3) {
      const nextPlusOneIdx = direction === 'next'
        ? (baseIndex + 2) % videoData.length
        : (baseIndex - 2 + videoData.length) % videoData.length;
      const nextPlusOneSrc = getVideoSrc(videoData[nextPlusOneIdx]);
      if (!videoCacheRef.current.has(nextPlusOneSrc) && !predictivePreloadedRef.current.has(nextPlusOneSrc)) {
        predictivePreloadedRef.current.add(nextPlusOneSrc);
        const encodedSrc = encodeVideoSrc(nextPlusOneSrc);
        fetch(encodedSrc).then(res => res.ok ? res.blob() : Promise.reject()).then(blob => {
          const blobUrl = URL.createObjectURL(blob);
          videoCacheRef.current.set(nextPlusOneSrc, blobUrl);
          const videoEl = videoElementsRef.current[nextPlusOneIdx];
          if (videoEl && nextPlusOneIdx !== videoIndex) {
            videoEl.src = blobUrl;
            videoEl.load();
          }
        }).catch(() => {});
      }
    }
  };

  // Reference to all video elements for play/pause control
  const videoElementsRef = useRef([]);

  const changeVideo = (direction) => {
    // Don't change if no video data
    if (videoData.length === 0) return;

    // Calculate next index
    const nextIndex = direction === 'next'
      ? (videoIndex + 1) % videoData.length
      : (videoIndex - 1 + videoData.length) % videoData.length;

    // Get video elements
    const currentVideo = videoElementsRef.current[videoIndex];
    const nextVideo = videoElementsRef.current[nextIndex];

    const doSwitch = () => {
      // Now update index - this will swap z-index making next video visible
      setVideoIndex(nextIndex);

      // Hide and pause current video after switch
      if (currentVideo) {
        currentVideo.pause();
        currentVideo.style.visibility = 'hidden';
        currentVideo.style.opacity = '0';
      }
    };

    // Prepare and play next video
    if (nextVideo) {
      // IMPORTANT: Hide video first to prevent flicker of old frame
      nextVideo.style.visibility = 'hidden';
      nextVideo.style.opacity = '0';
      nextVideo.pause();

      // Function to show video and switch after seek is confirmed
      const showAndSwitch = () => {
        nextVideo.style.visibility = 'visible';
        nextVideo.style.opacity = '1';
        nextVideo.play().catch(() => {});
        // Use double rAF to ensure the frame is painted before switching
        requestAnimationFrame(() => {
          requestAnimationFrame(doSwitch);
        });
      };

      // If already at position 0 and has enough data, show immediately
      if (nextVideo.currentTime < 0.1 && nextVideo.readyState >= 3) {
        showAndSwitch();
      } else {
        // Seek to start and wait for seeked event before showing
        const onSeeked = () => {
          nextVideo.removeEventListener('seeked', onSeeked);
          // After seek completes, wait one frame to ensure new frame is rendered
          requestAnimationFrame(showAndSwitch);
        };

        nextVideo.addEventListener('seeked', onSeeked, { once: true });
        nextVideo.currentTime = 0;

        // Safety timeout in case seeked doesn't fire
        setTimeout(() => {
          nextVideo.removeEventListener('seeked', onSeeked);
          if (nextVideo.style.visibility === 'hidden') {
            nextVideo.currentTime = 0; // Force reset again
            showAndSwitch();
          }
        }, 200);
      }
    }
  };


  useEffect(() => {
    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
    if (isSafari) {
      document.documentElement.classList.add('safari');
    }
  }, []);

  useEffect(() => {
    changeVideoRef.current = changeVideo;
  });

  useEffect(() => {
    const handleKeyDown = (e) => {
      // Only on homepage and when not in an input/textarea or about panel
      if (location.pathname !== '/') return;
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if (isAboutPanelOpen) return;

      if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
        e.preventDefault();
        e.stopPropagation();

        if (document.activeElement && document.activeElement !== document.body) {
          document.activeElement.blur();
        }

        const direction = e.key === 'ArrowRight' ? 'next' : 'prev';
        changeVideoRef.current?.(direction);
        playArrow();

        arrowKeyCounterRef.current += 1;
        setArrowKeyIndicator({ direction: e.key === 'ArrowRight' ? 'right' : 'left', key: arrowKeyCounterRef.current });
        if (arrowKeyTimeoutRef.current) clearTimeout(arrowKeyTimeoutRef.current);
        arrowKeyTimeoutRef.current = setTimeout(() => setArrowKeyIndicator(null), 1000);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (arrowKeyTimeoutRef.current) clearTimeout(arrowKeyTimeoutRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname, isAboutPanelOpen]);

  // Track when current video is actually playing (for loading indicator)
  useEffect(() => {
    const currentVideo = videoElementsRef.current[videoIndex];
    // If video is already playing, set state immediately
    if (currentVideo && !currentVideo.paused && currentVideo.readyState >= 3) {
      setCurrentVideoPlaying(true);
    } else {
      setCurrentVideoPlaying(false);
    }
  }, [videoIndex]);

  // Save/restore scroll position when toggling between pages
  useEffect(() => {
    if (location.pathname === '/') {
      scrollPositionsRef.current.about = window.scrollY;
      window.scrollTo(0, scrollPositionsRef.current.home);
    } else if (location.pathname === '/about') {
      scrollPositionsRef.current.home = window.scrollY;
      window.scrollTo(0, scrollPositionsRef.current.about);
    }
  }, [location.pathname]);

  // Trigger component load animations in sequence
  // Left column cascades first, then video frame anchors the sequence,
  // nav and pill frame the viewport edges
  useEffect(() => {
    if (isLoading) return;

    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

    const startDelay = isSafari ? 450 : 350;
    const stagger = isSafari ? 150 : 130;

    // Nav drops in first so the page feels grounded
    setTimeout(() => {
      setLoadedComponents(prev => ({ ...prev, navBar: true }));
    }, startDelay);

    // Left column cascade — gentle stagger
    setTimeout(() => {
      setLoadedComponents(prev => ({ ...prev, timeComponent: true }));
    }, startDelay + stagger);

    setTimeout(() => {
      setLoadedComponents(prev => ({ ...prev, h1: true }));
    }, startDelay + stagger * 2);

    setTimeout(() => {
      setLoadedComponents(prev => ({ ...prev, bodyParagraphs: true }));
    }, startDelay + stagger * 3);

    // Video frame enters last — deliberate pause after left column settles
    setTimeout(() => {
      setLoadedComponents(prev => ({ ...prev, videoFrame: true }));
    }, startDelay + stagger * 3 + 400);

    // Bottom pill rises after video begins its entrance
    setTimeout(() => {
      setLoadedComponents(prev => ({ ...prev, bottomComponent: true }));
    }, startDelay + stagger * 3 + 580);
  }, [isLoading]);

  // Trigger subtle jiggle animation: initial 8s after loading completes, then every 5s. Stops permanently once user hovers.
  const jiggleIntervalRef = useRef(null);
  const jigglePauseTimeoutRef = useRef(null);
  const jiggleTimeoutRef = useRef(null);
  const jiggleInitialRef = useRef(null);

  // Single effect to manage all jiggle logic based on hover state
  useEffect(() => {
    const clearAllJiggleTimers = () => {
      if (jiggleTimeoutRef.current) {
        clearTimeout(jiggleTimeoutRef.current);
        jiggleTimeoutRef.current = null;
      }
      if (jiggleIntervalRef.current) {
        clearInterval(jiggleIntervalRef.current);
        jiggleIntervalRef.current = null;
      }
      if (jigglePauseTimeoutRef.current) {
        clearTimeout(jigglePauseTimeoutRef.current);
        jigglePauseTimeoutRef.current = null;
      }
      if (jiggleInitialRef.current) {
        clearTimeout(jiggleInitialRef.current);
        jiggleInitialRef.current = null;
      }
    };

    // If user has already discovered the content, never show jiggle again
    if (hasDiscoveredContent) {
      clearAllJiggleTimers();
      setShowJiggle(false);
      return;
    }

    const startJiggle = () => {
      // Don't jiggle if discovered or currently hovered
      if (isHoveredRef.current || hasDiscoveredContent) {
        setShowJiggle(false);
        return;
      }
      setShowJiggle(true);
      jiggleTimeoutRef.current = setTimeout(() => {
        if (!isHoveredRef.current) {
          setShowJiggle(false);
        }
        jiggleTimeoutRef.current = null;
      }, 600);
    };

    const startJiggleCycle = () => {
      if (jiggleIntervalRef.current) {
        clearInterval(jiggleIntervalRef.current);
      }
      jiggleIntervalRef.current = setInterval(() => {
        if (!isHoveredRef.current && !hasDiscoveredContent) {
          startJiggle();
        }
      }, 5000);
    };

    if (isHovered) {
      // User has discovered the content - permanently stop jiggle
      setHasDiscoveredContent(true);
      setShowJiggle(false);
      clearAllJiggleTimers();
    } else if (!hasDiscoveredContent && !isLoading) {
      // Only start jiggle cycle if user hasn't discovered content yet AND site has finished loading
      jigglePauseTimeoutRef.current = setTimeout(() => {
        if (!isHoveredRef.current && !hasDiscoveredContent) {
          startJiggle();
          startJiggleCycle();
        }
      }, 8000);
    }

    return () => {
      clearAllJiggleTimers();
    };
  }, [isHovered, hasDiscoveredContent, isLoading]);

  // Update clock time based on CMS city setting
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      
      // Get city from CMS, default to 'Saigon' if not set
      const clockCity = getCopy('clock_location') || 'Saigon';
      const timezone = getTimezoneFromCity(clockCity);
      
      // Get time string for the city's timezone
      const timeString = new Intl.DateTimeFormat('en-US', {
        timeZone: timezone,
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      }).format(now);
      setClockTimeString(timeString);

      // Get time for clock hands
      const timeForClock = now.toLocaleString('en-US', { timeZone: timezone });
      const localDate = new Date(timeForClock);
      const hours = localDate.getHours() % 12;
      const minutes = localDate.getMinutes();
      const seconds = localDate.getSeconds();
      // Get milliseconds from the original date (timezone conversion doesn't affect milliseconds)
      const milliseconds = now.getMilliseconds();
      
      setClockTime({ hours, minutes, seconds, milliseconds });
    };

    updateTime();
    // Update every 16ms (~60fps) for smooth second hand animation
    const interval = setInterval(updateTime, 16);
    return () => clearInterval(interval);
  }, [websiteCopy]); // Re-run when CMS data changes

  // Clock pill click — show random city fact as toast
  const handleClockClick = useCallback(() => {
    playClick();
  }, [playClick]);

  // Ambient data for expanded clock card
  const clockCity = getCopy('clock_location') || 'Saigon';
  const clockCoords = getCoordsFromCity(clockCity);
  const clockTimezone = getTimezoneFromCity(clockCity);
  // Preload weather on page load so it's ready when the clock card is opened
  const { weather: ambientWeather } = useAmbientData({
    lat: clockCoords.lat,
    lng: clockCoords.lng,
    timezone: clockTimezone,
    enabled: true,
  });

  // Close video metadata on tap outside (mobile/tablet)
  useEffect(() => {
    if (!mobileMetadataExpanded || !isMobileOrTablet) return;
    const handleTapOutside = (e) => {
      if (videoFrameRef.current && videoFrameRef.current.contains(e.target)) return;
      setMobileMetadataExpanded(false);
    };
    document.addEventListener('mousedown', handleTapOutside);
    document.addEventListener('touchstart', handleTapOutside);
    return () => {
      document.removeEventListener('mousedown', handleTapOutside);
      document.removeEventListener('touchstart', handleTapOutside);
    };
  }, [mobileMetadataExpanded, isMobileOrTablet]);

  // Font loading check - ensure fonts are loaded before loader animation
  useEffect(() => {
    // Wait for fonts to be ready
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(() => {
        // Small delay to ensure font is actually rendered in the DOM
        // This prevents FOUT (Flash of Unstyled Text) in the loader
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            fontsLoadedRef.current = true;
            setFontsReady(true);
          });
        });
      });
    } else {
      // Fallback for browsers without font loading API
      // Wait a bit for fonts to potentially load
      setTimeout(() => {
        fontsLoadedRef.current = true;
        setFontsReady(true);
      }, 200);
    }
  }, []);

  // Preload FIRST + ADJACENT videos during the loader to enable smooth toggling
  // Uses FETCH to fully download videos into HTTP cache (not just canplaythrough which is optimistic)
  useEffect(() => {
    if (videoData.length === 0) return;

    adjacentVideosReadyRef.current = 0;
    firstVideoReadyRef.current = false; // Reset on new video data
    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

    // Fetch video fully and create blob URL for instant playback
    const fetchVideoToCache = async (videoSrc, onComplete) => {
      try {
        if (videoCacheRef.current.has(videoSrc)) {
          onComplete(true);
          return true;
        }
        const encodedSrc = encodeVideoSrc(videoSrc);
        const response = await fetch(encodedSrc);
        if (response.ok) {
          const blob = await response.blob();
          const blobUrl = URL.createObjectURL(blob);
          videoCacheRef.current.set(videoSrc, blobUrl);

          // Update non-active video elements with blob URL for instant switching
          const idx = videoData.findIndex(v => getVideoSrc(v) === videoSrc);
          if (idx !== -1 && idx !== videoIndex) {
            const videoEl = videoElementsRef.current[idx];
            if (videoEl) {
              videoEl.src = blobUrl;
              videoEl.load();
            }
          }

          onComplete(true);
          return true;
        }
      } catch (e) {
        // Fetch failed
      }
      onComplete(false);
      return false;
    };

    // Preload first video - fetch MUST complete before we consider it ready
    const firstVideoSrc = getVideoSrc(videoData[0]);

    // Fetch first video (marks ready when complete)
    fetchVideoToCache(firstVideoSrc, (success) => {
      if (success) {
        firstVideoReadyRef.current = true;
      }
    });

    // Preload adjacent videos (next and previous) for smooth toggling
    if (videoData.length > 1) {
      const nextVideoSrc = getVideoSrc(videoData[1]);
      const prevVideoSrc = videoData.length > 2 ? getVideoSrc(videoData[videoData.length - 1]) : null;

      // Fetch next video (slightly staggered)
      setTimeout(() => {
        fetchVideoToCache(nextVideoSrc, (success) => {
          if (success) {
            adjacentVideosReadyRef.current += 1;
          }
        });
      }, 100);

      // Fetch previous video
      if (prevVideoSrc) {
        setTimeout(() => {
          fetchVideoToCache(prevVideoSrc, (success) => {
            if (success) {
              adjacentVideosReadyRef.current += 1;
            }
          });
        }, 200);
      }
    }

    // Fallback: mark as ready after timeout (in case fetch is slow)
    // Increased timeouts for unified premium quality (~4MB files)
    const fallbackTimer = setTimeout(() => {
      if (!firstVideoReadyRef.current) {
        console.log('Video preload timeout - marking as ready');
        firstVideoReadyRef.current = true;
      }
    }, isSafari ? 12000 : 10000);

    return () => {
      clearTimeout(fallbackTimer);
    };
  }, [videoData]);

  // Video warm-up during loader:
  // 1. First video: Fully decode frames (play briefly, then reset to ready state)
  // 2. Other videos: Preload data into browser cache (fast parallel fetch)
  useEffect(() => {
    if (!isLoading || videoData.length === 0) return;

    let isCancelled = false;

    // Decode first video frames by playing briefly
    const decodeFirstVideo = async (videoEl) => {
      if (!videoEl || isCancelled) return;

      return new Promise((resolve) => {
        let resolved = false;
        const done = () => {
          if (resolved) return;
          resolved = true;
          // Reset first video to ready state
          videoEl.pause();
          videoEl.currentTime = 0;
          videoEl.style.opacity = '1';
          videoEl.style.visibility = 'visible';
          firstVideoReadyRef.current = true;
          warmupCountRef.current += 1;
          resolve();
        };

        const timeout = setTimeout(done, 3000);

        videoEl.preload = 'auto';
        videoEl.muted = true;
        videoEl.load();

        const onCanPlay = () => {
          if (resolved || isCancelled) return;
          videoEl.play().then(() => {
            const onFrame = () => {
              videoEl.removeEventListener('timeupdate', onFrame);
              clearTimeout(timeout);
              // Small delay to ensure frame is rendered
              setTimeout(done, 100);
            };
            videoEl.addEventListener('timeupdate', onFrame, { once: true });
            setTimeout(() => {
              videoEl.removeEventListener('timeupdate', onFrame);
              if (!resolved) done();
            }, 500);
          }).catch(() => done());
        };

        if (videoEl.readyState >= 3) onCanPlay();
        else videoEl.addEventListener('canplay', onCanPlay, { once: true });
      });
    };

    // Preload other videos (just fetch data, don't play)
    const preloadVideo = async (videoEl) => {
      if (!videoEl || isCancelled) return;

      return new Promise((resolve) => {
        const timeout = setTimeout(() => {
          warmupCountRef.current += 1;
          resolve();
        }, 2000);

        videoEl.preload = 'auto';
        videoEl.load();

        const onLoaded = () => {
          clearTimeout(timeout);
          warmupCountRef.current += 1;
          resolve();
        };

        if (videoEl.readyState >= 2) onLoaded();
        else videoEl.addEventListener('loadeddata', onLoaded, { once: true });
      });
    };

    // Yield to main thread to prevent blocking
    const yieldToMain = () => new Promise(resolve => setTimeout(resolve, 0));

    const warmUpVideos = async () => {
      const videoElements = videoElementsRef.current;

      if (!videoElements || videoElements.length === 0 || !videoElements[0]) {
        if (!isCancelled) setTimeout(warmUpVideos, 100);
        return;
      }

      console.log('Warming up', videoElements.length, 'videos');

      // First: Decode first video fully
      await decodeFirstVideo(videoElements[0]);
      console.log('First video ready');

      // Yield after first video
      await yieldToMain();

      // Then: Preload other videos in batches, yielding between batches
      const otherVideos = videoElements.slice(1);
      const BATCH_SIZE = 4;

      for (let i = 0; i < otherVideos.length; i += BATCH_SIZE) {
        if (isCancelled) break;
        const batch = otherVideos.slice(i, i + BATCH_SIZE);
        await Promise.all(batch.map(v => preloadVideo(v)));
        // Yield to main thread between batches
        await yieldToMain();
      }

      if (!isCancelled) {
        warmupCompleteRef.current = true;
        console.log(`Warmup complete: ${warmupCountRef.current}/${videoElements.length} videos`);
      }
    };

    const timer = setTimeout(warmUpVideos, 100);
    return () => { isCancelled = true; clearTimeout(timer); };
  }, [isLoading, videoData]);

  // Background video preloading: Preload remaining videos AFTER loader completes
  // First 3 videos (current, next, prev) are preloaded during loader
  useEffect(() => {
    // Skip if still loading or not enough videos to preload
    if (isLoading || videoData.length <= 3) return;

    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
    let isCancelled = false;

    // Preload a single video via fetch and create blob URL
    const preloadVideo = async (video) => {
      if (isCancelled) return;
      try {
        const videoSrc = getVideoSrc(video);

        // Check if already cached during loader
        if (videoCacheRef.current.has(videoSrc)) return;

        const encodedSrc = encodeVideoSrc(videoSrc);
        const response = await fetch(encodedSrc);
        if (response.ok && !isCancelled) {
          const blob = await response.blob();
          const blobUrl = URL.createObjectURL(blob);
          videoCacheRef.current.set(videoSrc, blobUrl);

          // Update the corresponding non-active video element with blob URL
          const idx = videoData.findIndex(v => getVideoSrc(v) === videoSrc);
          if (idx !== -1 && idx !== videoIndex) {
            const videoEl = videoElementsRef.current[idx];
            if (videoEl) {
              videoEl.src = blobUrl;
              videoEl.load();
            }
          }
        }
      } catch (e) {
        // Don't mark as cached on error
      }
    };

    // Start preloading remaining videos 2 seconds after loader ends
    // Skip index 0 (first), 1 (next), and last (prev) - already preloaded during loader
    const remainingTimer = setTimeout(() => {
      if (isCancelled) return;

      // Get indices to preload (skip first, second, and last)
      const indicesToPreload = [];
      for (let i = 2; i < videoData.length - 1; i++) {
        indicesToPreload.push(i);
      }

      // Use requestIdleCallback for non-blocking background preloading
      let currentPreloadIndex = 0;
      const preloadNextVideo = (deadline) => {
        if (isCancelled || currentPreloadIndex >= indicesToPreload.length) return;

        // If we have time in this idle period, preload a video
        // Each video fetch takes time, so we only start one per idle callback
        if (deadline && deadline.timeRemaining() > 10) {
          const index = indicesToPreload[currentPreloadIndex];
          preloadVideo(videoData[index]);
          currentPreloadIndex++;
        }

        // Schedule next preload with a delay to avoid network congestion
        if (currentPreloadIndex < indicesToPreload.length && !isCancelled) {
          setTimeout(() => {
            if ('requestIdleCallback' in window) {
              requestIdleCallback(preloadNextVideo, { timeout: 5000 });
            } else {
              preloadNextVideo({ timeRemaining: () => 50 });
            }
          }, 1000); // 1 second stagger
        }
      };

      // Start the preload chain
      if ('requestIdleCallback' in window) {
        requestIdleCallback(preloadNextVideo, { timeout: 5000 });
      } else {
        // Fallback for Safari
        preloadNextVideo({ timeRemaining: () => 50 });
      }
    }, 1500);

    return () => {
      isCancelled = true;
      clearTimeout(remainingTimer);
    };
  }, [isLoading, videoData]);

  // Loader animation: Cycle through coordinates (only after fonts are loaded)
  useEffect(() => {
    if (!isLoading || videoData.length === 0) return;

    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
    let minTimeTimer = null;
    let coordInterval = null;
    let isMounted = true;

    // Wait for fonts to load before starting the animation
    const startAnimation = () => {
      if (!isMounted) return;

      // Set minimum loader time to allow videos to fully decode frames
      // Increased for unified premium quality (~4MB files): Safari 5s, Chrome 4s
      const minTime = isSafari ? 5000 : 4000;
      minTimeTimer = setTimeout(() => {
        if (isMounted) {
          loaderMinTimeRef.current = true;
        }
      }, minTime);
      
      // Cycle through coordinates
      coordInterval = setInterval(() => {
        if (!isMounted) return;
        setCoordFading(true);
        setTimeout(() => {
          if (isMounted) {
            setCurrentCoordIndex(prev => (prev + 1) % videoData.length);
            setCoordFading(false);
          }
        }, 300); // Fade out duration
      }, 600); // Change every 600ms
    };
    
    // Check if fonts are already loaded
    if (fontsLoadedRef.current) {
      startAnimation();
    } else {
      // Wait for fonts to load
      if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(() => {
          if (isMounted && isLoading && videoData.length > 0) {
            startAnimation();
          }
        });
      } else {
        // Fallback: start after a short delay if font API not available
        setTimeout(() => {
          if (isMounted) {
            startAnimation();
          }
        }, 100);
      }
    }
    
    return () => {
      isMounted = false;
      if (minTimeTimer) clearTimeout(minTimeTimer);
      if (coordInterval) clearInterval(coordInterval);
    };
  }, [isLoading, videoData]);

  // Encouraging messages after 5 seconds
  useEffect(() => {
    if (!isLoading) return;
    
    const encouragingMessages = [
      "Good things take time...",
      "Worth the wait, promise.",
      "Almost there...",
      "Patience is a virtue.",
      "Loading some cool stuff...",
      "Making it perfect for you...",
      "Just a moment more...",
    ];
    
    let messageIndex = 0;
    
    // Show first message at 5 seconds
    const firstMessageTimer = setTimeout(() => {
      setLoaderMessage(encouragingMessages[0]);
      messageIndex = 1;
    }, 5000);
    
    // Rotate messages every 2 seconds after that
    const messageInterval = setInterval(() => {
      if (messageIndex > 0 && messageIndex < encouragingMessages.length) {
        setLoaderMessage(encouragingMessages[messageIndex]);
        messageIndex++;
      }
    }, 2000);
    
    return () => {
      clearTimeout(firstMessageTimer);
      clearInterval(messageInterval);
      setLoaderMessage('');
    };
  }, [isLoading]);

  // Check if loading is complete - wait for video warm-up, fonts, and Last.fm
  useEffect(() => {
    if (!isLoading || videoData.length === 0) return;

    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

    // Check periodically if everything is ready:
    // 1. Minimum time has passed (6 seconds Safari, 5 seconds Chrome)
    // 2. First video is FULLY ready (decoded, can play)
    // 3. Videos are being cached (at least 50% fetched)
    // 4. Fonts are loaded
    // 5. Last.fm is done loading (or timed out)
    const checkLoading = setInterval(() => {
      const fontsReady = fontsLoadedRef.current;
      const lastFmReady = !musicLoading || isDataComplete;
      const firstVideoReady = firstVideoReadyRef.current;

      // Require 60% of videos preloaded (reduced from 80% for larger premium files)
      const minCached = Math.ceil(videoData.length * 0.6);
      const cacheReady = warmupCompleteRef.current || warmupCountRef.current >= minCached;

      // Exit loader once first video ready and enough cached
      if (loaderMinTimeRef.current && fontsReady && lastFmReady && firstVideoReady && cacheReady) {
        console.log(`Loader complete: ${warmupCountRef.current}/${videoData.length} videos cached`);
        setIsLoading(false);
      }
    }, 100);

    // Maximum loader time - increased for unified premium quality (~4MB files)
    const maxTime = isSafari ? 10000 : 8000;
    const maxTimer = setTimeout(() => {
      console.log(`Loader timeout: ${warmupCountRef.current}/${videoData.length} videos decoded`);
      setIsLoading(false);
    }, maxTime);

    return () => {
      clearInterval(checkLoading);
      clearTimeout(maxTimer);
    };
  }, [isLoading, videoData, musicLoading]);

  // Ensure browser-specific attributes are set on ALL video elements
  // Runs when loader finishes and videos are in DOM
  useEffect(() => {
    if (isLoading) return; // Wait for loader to finish

    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
    const isChrome = /chrome/i.test(navigator.userAgent) && !/edge|edg/i.test(navigator.userAgent);

    const setupVideoElement = (videoEl, index) => {
      if (!videoEl) return;

      // Standard attributes for all browsers
      videoEl.setAttribute('playsinline', 'true');
      videoEl.setAttribute('webkit-playsinline', 'true');
      videoEl.muted = true;
      videoEl.defaultMuted = true;

      // Disable picture-in-picture and remote playback for cleaner experience
      videoEl.disablePictureInPicture = true;
      videoEl.disableRemotePlayback = true;

      // Force hardware acceleration for all browsers
      videoEl.style.transform = 'translateZ(0)';
      videoEl.style.willChange = 'transform, opacity';

      if (isSafari) {
        // Safari-specific optimizations
        videoEl.setAttribute('x-webkit-airplay', 'allow');
        videoEl.style.webkitTransform = 'translateZ(0)';
        // All videos should preload in Safari for instant switching
        videoEl.preload = 'auto';
        // Reduce buffering aggressiveness slightly for non-current videos
        if (index !== videoIndex) {
          videoEl.setAttribute('autobuffer', 'true');
        }
      } else if (isChrome) {
        // Chrome-specific optimizations
        // Current and adjacent videos get full preload
        const isAdjacent = Math.abs(index - videoIndex) <= 1 ||
                           (videoIndex === 0 && index === videoData.length - 1) ||
                           (videoIndex === videoData.length - 1 && index === 0);

        videoEl.preload = isAdjacent ? 'auto' : 'metadata';
      } else {
        // Firefox and other browsers
        videoEl.preload = 'auto';
      }
    };

    // Setup ALL video elements
    videoElementsRef.current.forEach((videoEl, index) => {
      setupVideoElement(videoEl, index);
    });
  }, [isLoading, videoIndex, videoData.length]);

  // Ensure videos never loop - always advance to next
  useEffect(() => {
    if (videoRef1.current) {
      videoRef1.current.loop = false;
    }
    if (videoRef2.current) {
      videoRef2.current.loop = false;
    }
  }, []);

  // Preload adjacent videos for seamless transitions
  useEffect(() => {
    // Don't run during loading or transitions
    if (isLoading || isTransitioningRef.current || videoData.length === 0) return;

    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
    const isChrome = /chrome/i.test(navigator.userAgent) && !/edge|edg/i.test(navigator.userAgent);
    const nextIndex = (videoIndex + 1) % videoData.length;
    const prevIndex = (videoIndex - 1 + videoData.length) % videoData.length;

    // Safari: Trigger adjacent video elements to start buffering
    if (isSafari) {
      [nextIndex, prevIndex].forEach(idx => {
        const videoEl = videoElementsRef.current[idx];
        if (videoEl && videoEl.readyState < 3) {
          videoEl.preload = 'auto';
        }
      });
    }

    // Chrome: Smart preloading - adjacent videos get full preload, others get metadata only
    if (isChrome) {
      videoData.forEach((video, idx) => {
        const videoEl = videoElementsRef.current[idx];
        if (!videoEl) return;

        const isAdjacent = idx === nextIndex || idx === prevIndex;
        const isCurrent = idx === videoIndex;

        if (isCurrent || isAdjacent) {
          videoEl.preload = 'auto';
        } else {
          videoEl.preload = 'metadata';
        }
      });
    }

    // All browsers: Fetch adjacent videos and create blob URLs if not cached
    [nextIndex, prevIndex].forEach(idx => {
      if (videoData[idx]) {
        const videoSrc = getVideoSrc(videoData[idx]);
        if (!videoCacheRef.current.has(videoSrc)) {
          const encodedSrc = encodeVideoSrc(videoSrc);
          fetch(encodedSrc).then(res => {
            if (res.ok) return res.blob();
            throw new Error('fetch failed');
          }).then((blob) => {
            const blobUrl = URL.createObjectURL(blob);
            videoCacheRef.current.set(videoSrc, blobUrl);
            // Update non-active video element with blob URL
            if (idx !== videoIndex) {
              const videoEl = videoElementsRef.current[idx];
              if (videoEl) {
                videoEl.src = blobUrl;
                videoEl.load();
                // Warm up the video after blob loads for instant switching
                // Increased delay for larger premium files
                setTimeout(() => warmUpAdjacentVideo(videoEl), 300);
              }
            }
          }).catch(() => {});
        }
      }
    });
  }, [isLoading, videoIndex, videoData]);

  // Ensure videos play on mount - runs when loader finishes AND videoData is ready
  // On first init: full setup. On return from About: just resume playback (no reset).
  useEffect(() => {
    if (isLoading || videoData.length === 0) return;
    if (location.pathname !== '/') return;

    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

    // FIRST TIME: Full initialization (loader just finished)
    if (!hasInitializedHomeRef.current) {
      hasInitializedHomeRef.current = true;

      requestAnimationFrame(() => {
        video1IndexRef.current = 0;
        video2IndexRef.current = 1;
        setVideoIndex(0);
        setActiveVideo(1);

        const firstVideo = videoElementsRef.current[0] || videoRef1.current;

        if (firstVideo) {
          firstVideo.style.visibility = 'visible';
          firstVideo.style.opacity = '1';
          firstVideo.muted = true;
          firstVideo.currentTime = 0;

          const playPromise = firstVideo.play();
          if (playPromise !== undefined) {
            playPromise.catch(() => {
              setTimeout(() => firstVideo.play().catch(() => {}), 100);
            });
          }
        }

        videoElementsRef.current.forEach((videoEl, idx) => {
          if (idx !== 0 && videoEl) {
            videoEl.style.visibility = 'hidden';
            videoEl.style.opacity = '0';
            videoEl.pause();
          }
        });

        // Safari: Preload all other videos for instant switching
        // Increased stagger from 200ms to 300ms for larger premium files
        if (isSafari) {
          videoData.forEach((video, idx) => {
            if (idx === 0) return;
            setTimeout(() => {
              const videoEl = videoElementsRef.current[idx];
              if (videoEl) {
                videoEl.preload = 'auto';
                videoEl.load();
              }
            }, idx * 300);
          });
        }
      });
      return;
    }

    // RETURNING FROM ABOUT: Just resume the current video (no index reset, no re-preloading)
    requestAnimationFrame(() => {
      const currentVideo = videoElementsRef.current[videoIndex];
      if (currentVideo) {
        const playPromise = currentVideo.play();
        if (playPromise !== undefined) {
          playPromise.catch(() => {
            setTimeout(() => currentVideo.play().catch(() => {}), 100);
          });
        }
      }
    });
  }, [isLoading, videoData, location.pathname]);

  // Pause home video when navigating away to free decoder resources
  useEffect(() => {
    if (location.pathname !== '/') {
      const currentVideo = videoElementsRef.current[videoIndex];
      if (currentVideo) {
        currentVideo.pause();
      }
    }
  }, [location.pathname]);

  // Show loading state only if we have no data at all (allow partial rendering)
  const hasAnyData = videoData.length > 0 || Object.keys(websiteCopy).length > 0;

  // Use fallback data if missing
  const safeVideoData = videoData.length > 0 ? videoData : [];
  const safeWebsiteCopy = Object.keys(websiteCopy).length > 0 ? websiteCopy : {};

  // Coordinates for loader animation
  const loaderCoordinates = videoData.length > 0
    ? videoData.map(v => v.coordinates)
    : ['6.79770°S, 107.57870°E', '37.82975°N, 122.40606°W', '56.76040°N, 4.69090°W', '10.77700°N, 106.69860°E'];

  // If no data at all, show minimal loader
  if (!hasAnyData) {
    return (
      <div className="bg-[#FCFCFC] min-h-screen w-full flex flex-col items-center justify-center gap-4">
        <div className="h-[24px]" />
      </div>
    );
  }

  return (
    <>
    <div className="bg-[#FCFCFC] min-h-screen w-full">
      {/* Loader Overlay - covers content while videos load */}
      {isLoading && (
        <div
          className="fixed inset-0 z-[9999] bg-[#FCFCFC] flex flex-col items-center justify-center gap-4 transition-opacity duration-300"
          style={{ pointerEvents: 'auto' }}
        >
          {fontsReady ? (
            <>
              <div className={`coord-loader font-graphik text-[16px] text-[#91918e] ${coordFading ? 'coord-fade-out' : 'coord-fade-in'}`}>
                {loaderCoordinates[currentCoordIndex % loaderCoordinates.length]}
              </div>
              {loaderMessage && (
                <div className="font-graphik text-[13px] text-[#b5b5b5] animate-pulse">
                  {loaderMessage}
                </div>
              )}
            </>
          ) : (
            <div className="h-[24px]" />
          )}
        </div>
      )}

      {/* Skip link for keyboard users */}
      <a
        href="#main-content"
        className="skip-link sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100] focus:bg-white focus:px-4 focus:py-2 focus:rounded-lg focus:shadow-lg focus:text-[#333] focus:font-graphik focus:text-[14px]"
      >
        Skip to main content
      </a>

      {/* Navigation Bar - Light Mode */}
      <div
        className={`fixed top-0 left-0 right-0 z-50 top-nav-container ${loadedComponents.navBar ? 'component-loaded from-top' : 'component-hidden from-top'}`}
        style={{
          background: isScrolled ? 'rgba(252, 252, 252, 0.85)' : 'transparent',
          backdropFilter: isScrolled ? 'blur(12px)' : 'none',
          WebkitBackdropFilter: isScrolled ? 'blur(12px)' : 'none',
        }}
      >
        <div className="light-nav-bar pt-[8px] pb-[8px] w-full px-[15px] flex items-center">
          {/* Gary Section - Face Icon + Name + Hover Info Box */}
          <div className="gary-section relative">
            {/* Mouse proximity detection zone */}
            <div
              ref={faceZoneRef}
              className="face-detection-zone absolute pointer-events-auto z-10"
              style={{
                left: '-80px',
                top: '-80px',
                width: 'max(420px, 26vw)',
                height: 'max(340px, 24vh)',
              }}
              onMouseEnter={() => setIsMouseNearFace(true)}
              onMouseLeave={() => setIsMouseNearFace(false)}
              onMouseMove={handleFaceZoneMouseMove}
            />
            {/* Hover wrapper - handles hover for both button and dropdown */}
            <div
              className="gary-hover-wrapper relative z-20"
              onMouseEnter={() => {
                if (faceHoverTimeoutRef.current) {
                  clearTimeout(faceHoverTimeoutRef.current);
                  faceHoverTimeoutRef.current = null;
                }
                if (faceEnterTimeoutRef.current) {
                  clearTimeout(faceEnterTimeoutRef.current);
                }
                faceEnterTimeoutRef.current = setTimeout(() => {
                  setIsFaceHoverExiting(false);
                  setIsHomeButtonHovered(true);
                }, 40);
              }}
              onMouseLeave={() => {
                if (faceEnterTimeoutRef.current) {
                  clearTimeout(faceEnterTimeoutRef.current);
                  faceEnterTimeoutRef.current = null;
                }
                setIsFaceHoverExiting(true);
                faceHoverTimeoutRef.current = setTimeout(() => {
                  setIsHomeButtonHovered(false);
                  setIsFaceHoverExiting(false);
                }, 200);
              }}
            >
              <button
                className={`home-button flex items-center gap-[10px] px-[4px] py-[4px] rounded-[16px] cursor-pointer ${isHomeButtonHovered ? 'gary-active' : ''}`}
                onClick={() => { playClick(); navigate('/'); }}
                onMouseDown={() => setIsFaceClicked(true)}
                onMouseUp={() => setIsFaceClicked(false)}
                aria-label="Joonseo Chang - Home"
              >
                <div
                  ref={faceIconRef}
                  className={`face-icon-container h-[37px] w-[42px] flex items-center justify-center rounded-[12px] ${isMouseNearFace ? 'frightened' : ''} relative`}
                >
                  <div
                    className="flex items-center justify-center leading-none"
                    style={{
                      transform: `translateX(${faceTransform.translateX}px) translateY(${faceTransform.translateY}px) scaleX(${faceTransform.scaleX}) scaleY(${faceTransform.scaleY})`,
                      transition: (isMouseNearFace && !isHomeButtonHovered) ? 'none' : 'transform 400ms cubic-bezier(0.4, 0, 0.2, 1)',
                    }}
                  >
                    <span className="font-graphik text-[12px] text-[#8f8f8f] leading-none">
                      {faceExpression}
                    </span>
                  </div>
                  {/* Floating z's during sleeping time */}
                  {isSleepingTime && !isHomeButtonHovered && !isFaceClicked && !isMouseNearFace && (
                    <div className="absolute top-1 right-2 pointer-events-none">
                      <span className="sleep-z sleep-z-1 absolute font-graphik text-[8px] text-[#b0b0b0]">z</span>
                      <span className="sleep-z sleep-z-2 absolute font-graphik text-[10px] text-[#b0b0b0]">z</span>
                      <span className="sleep-z sleep-z-3 absolute font-graphik text-[7px] text-[#b0b0b0]">z</span>
                    </div>
                  )}
                </div>
                <span className="nav-name font-graphik text-[14px] text-[#5b5b5e] leading-none transition-colors duration-[250ms]">Joonseo Chang</span>
              </button>

            </div>
          </div>

          {/* Nav Links - inline after face section, separated by divider */}
          {!isTabletOrBelow && (
            <>
              <div className="h-[24px] w-[1.5px] ml-[6px] mr-[10px] relative z-20 rounded-full" style={{ background: 'rgba(0, 0, 0, 0.08)' }} />
              <nav className="flex items-center gap-[15px] relative z-20" aria-label="Main navigation">
                <button className="nav-text-link font-graphik text-[14px] cursor-pointer" onClick={playClick}>
                  Experience
                </button>
                <button className="nav-text-link font-graphik text-[14px] cursor-pointer" onClick={playClick}>
                  Research
                </button>
                <button className="nav-text-link font-graphik text-[14px] cursor-pointer" onClick={playClick}>
                  Gallery
                </button>
                <button className="nav-text-link font-graphik text-[14px] cursor-pointer" onClick={playClick}>
                  Notes
                </button>
                <button className="nav-text-link font-graphik text-[14px] cursor-pointer" onClick={playClick}>
                  Extra
                </button>
              </nav>
            </>
          )}

          {/* Spacer to push Introduction button to the right */}
          <div className="flex-1" />

          {/* Right - Commit tracker + Introduction button (hidden on mobile) */}
          {!isTabletOrBelow && githubStats && (
            <a
              href="https://github.com/joonseochang"
              target="_blank"
              rel="noopener noreferrer"
              className="nav-commit-button no-underline"
              onClick={playClick}
            >
              <div className="nav-commit-inner">
                <span className="nav-commit-text font-graphik text-[14px] text-[#8f8f8f] whitespace-nowrap transition-colors duration-[350ms]">
                  <span className="text-[#6bbf7b]">+{githubStats.added.toLocaleString()}</span><span className="inline-block w-[6px]" /><span className="text-[#e0736a]">-{githubStats.deleted.toLocaleString()}</span>
                </span>
                <span
                  className="nav-commit-badge font-graphik text-[12px] text-[#8f8f8f] h-[25px] rounded-[6px] flex items-center justify-center ml-[12px] overflow-hidden"
                  style={{
                    width: `${Math.ceil(measureTextWidth(formatRelativeTime(githubStats.lastCommitAt), '12px Graphik, sans-serif') + 12)}px`,
                    transition: 'width 500ms cubic-bezier(0.34, 1.2, 0.64, 1)',
                  }}
                >{formatRelativeTime(githubStats.lastCommitAt)}</span>
              </div>
            </a>
          )}
          {!isTabletOrBelow && (
            <button
              className="nav-intro-button"
              onClick={() => {
                playClick();
                setIsAboutPanelOpen(true);
              }}
              aria-label="Introduction"
            >
              <div className="nav-intro-inner">
                <span className="nav-intro-text font-graphik text-[14px] text-[#8f8f8f] whitespace-nowrap transition-colors duration-[350ms]">Introduction</span>
                <span className="nav-intro-kbd font-graphik text-[12px] text-[#8f8f8f] h-[25px] w-[29px] rounded-[6px] flex items-center justify-center ml-[12px] transition-colors duration-[350ms]">{isMac ? '⌘J' : '⌃J'}</span>
              </div>
            </button>
          )}

          {/* Hamburger Menu Button (mobile only) */}
          {isTabletOrBelow && (
            <button
              className="mobile-hamburger bottom-button w-[37px] h-[37px] flex items-center justify-center rounded-[8px] cursor-pointer active:scale-[0.96]"
              onClick={() => {
                playClick();
                setIsMobileMenuOpen(prev => !prev);
              }}
              aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={isMobileMenuOpen}
            >
              <div className={`hamburger-bars ${isMobileMenuOpen ? 'open' : ''}`} aria-hidden="true">
                <span /><span /><span />
              </div>
            </button>
          )}
        </div>

        {/* Mobile Navigation Drawer */}
        {isTabletOrBelow && (
          <div
            ref={mobileMenuRef}
            className={`mobile-nav-drawer ${isMobileMenuOpen ? 'open' : ''}`}
          >
            <div className="mobile-nav-drawer-inner">
              <nav className="flex flex-col px-[16px] pt-[8px] pb-[16px] gap-[4px]" aria-label="Mobile navigation">
                <button
                  className="mobile-nav-link font-graphik text-[15px] text-[#5b5b5e] py-[12px] px-[12px] rounded-[8px] text-left transition-colors"
                  onClick={() => { playClick(); navigate('/about'); setIsMobileMenuOpen(false); }}
                >
                  About
                </button>
                <button
                  className="mobile-nav-link font-graphik text-[15px] text-[#5b5b5e] py-[12px] px-[12px] rounded-[8px] text-left transition-colors"
                  onClick={() => { playClick(); setIsMobileMenuOpen(false); }}
                >
                  Experience
                </button>
                <button
                  className="mobile-nav-link font-graphik text-[15px] text-[#5b5b5e] py-[12px] px-[12px] rounded-[8px] text-left transition-colors"
                  onClick={() => { playClick(); setIsMobileMenuOpen(false); }}
                >
                  Gallery
                </button>
                <button
                  className="mobile-nav-link font-graphik text-[15px] text-[#5b5b5e] py-[12px] px-[12px] rounded-[8px] text-left transition-colors"
                  onClick={() => { playClick(); setIsMobileMenuOpen(false); }}
                >
                  Notes
                </button>
                <button
                  className="mobile-nav-link font-graphik text-[15px] text-[#5b5b5e] py-[12px] px-[12px] rounded-[8px] text-left transition-colors"
                  onClick={() => { playClick(); setIsMobileMenuOpen(false); }}
                >
                  Extra
                </button>
              </nav>
            </div>
          </div>
        )}

        {/* Bottom border line — skeuomorphic inset */}
        <div className="absolute bottom-0 left-0 right-0 h-[2px]" style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.04), rgba(255,255,255,0.8))' }}></div>
      </div>

      {/* Main Content - All pages always mounted, toggled via display */}
      {/* ARCHIVED: About3 experience page
      <div style={{ display: location.pathname === '/about' ? 'block' : 'none' }}>
        <About3 isVisible={location.pathname === '/about'} />
      </div>
      */}

      <div style={{ display: location.pathname === '/about2' ? 'block' : 'none' }}>
        <About isVisible={location.pathname === '/about2'} />
      </div>

      <div style={{ display: location.pathname === '/about3' ? 'block' : 'none' }}>
        <About2 isVisible={location.pathname === '/about3'} />
      </div>

      <div style={{ display: location.pathname === '/soundtracking' ? 'block' : 'none' }}>
        <SoundtrackingPage isVisible={location.pathname === '/soundtracking'} />
      </div>

      {/* Mobile About Page */}
      {isTabletOrBelow && location.pathname === '/about' && (
        <AboutPanel isOpen={true} onClose={() => navigate('/')} mobile={true} />
      )}

      <main id="main-content" className="page-enter w-full min-h-screen items-center justify-center py-[120px] mt-[-10px]" style={{ display: location.pathname === '/' ? 'flex' : 'none' }}>
        <div className="flex gap-[50px] items-start text-left main-content-wrapper">
          {/* Left Column - Text Content (display:contents on mobile for reordering) */}
          <div className="flex flex-col w-[375px] home-left-column">
            {/* Time Component - Hover to show weather */}
            <div
              ref={clockCardRef}
              className={`home-time-component mb-[12px] ${loadedComponents.timeComponent ? 'component-loaded from-left' : 'component-hidden from-left'}`}
            >
              {/* Clock Pill with hover expansion */}
              <div className="hover-trigger w-fit">
              <div
                ref={clockPillRef}
                className={`clock-pill bg-white border border-[#ebeef5] flex gap-[6px] h-[35px] items-center pl-[8px] pr-[12px] rounded-[20px] w-fit cursor-pointer select-none${isClockPressed ? ' clock-pill-pressed' : ''}`}
                style={{
                  boxShadow: '0 0.5px 1px rgba(0,0,0,0.03), 0 1px 1px rgba(0,0,0,0.02), inset 0 0.5px 0 rgba(255,255,255,0.6), inset 0 -0.5px 0 rgba(0,0,0,0.015)',
                }}
                onClick={handleClockClick}
                onMouseDown={() => setIsClockPressed(true)}
                onMouseUp={() => setIsClockPressed(false)}
                onMouseEnter={() => setIsClockHovered(true)}
                onMouseLeave={() => { setIsClockPressed(false); setIsClockHovered(false); }}
              >
                {/* Clock icon */}
                <div className="overflow-clip relative shrink-0 size-[20px]">
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" className="block max-w-none size-full">
                    {Array.from({ length: 60 }).map((_, i) => {
                      const angle = (i * 6 - 90) * (Math.PI / 180);
                      const isHourMarker = i % 5 === 0;
                      const outerRadius = 9.5;
                      const innerRadius = isHourMarker ? 8.5 : 9;
                      return (
                        <line key={`minute-${i}`} x1={10 + Math.cos(angle) * innerRadius} y1={10 + Math.sin(angle) * innerRadius} x2={10 + Math.cos(angle) * outerRadius} y2={10 + Math.sin(angle) * outerRadius} stroke="#C3C3C3" strokeWidth={isHourMarker ? "0.8" : "0.4"} strokeLinecap="round" />
                      );
                    })}
                    <line x1="10" y1="10" x2="10" y2="6" stroke="#111112" strokeWidth="0.8" strokeLinecap="round" transform={`rotate(${clockTime.hours * 30 + clockTime.minutes * 0.5} 10 10)`} />
                    <line x1="10" y1="10" x2="10" y2="3.5" stroke="#111112" strokeWidth="0.8" strokeLinecap="round" transform={`rotate(${clockTime.minutes * 6 + clockTime.seconds * 0.1} 10 10)`} />
                    <line x1="10" y1="10" x2="10" y2="2.5" stroke="#FF0000" strokeWidth="0.6" strokeLinecap="round" transform={`rotate(${(clockTime.seconds + clockTime.milliseconds / 1000) * 6} 10 10)`} />
                    <circle cx="10" cy="10" r="0.8" fill="#111112"/>
                  </svg>
                </div>
                {/* Time and City - isolated compositing layer to prevent distortion during weather animation */}
                <div
                  className="clock-pill-text flex font-graphik gap-[8px] items-center text-[14px] whitespace-nowrap"
                  style={{
                    // Create compositing layer without transform (avoids Safari 1px offset)
                    willChange: 'opacity',
                    isolation: 'isolate',
                    WebkitFontSmoothing: 'antialiased',
                    MozOsxFontSmoothing: 'grayscale',
                    lineHeight: '1',
                  }}
                >
                  <span className="text-[#5b5b5e]">{clockTimeString || '2:02 PM'}</span>
                  <span className="text-[#c3c3c3]">{getCopy('clock_location')}</span>
                </div>
                {/* Weather section - expands on hover with smooth animation */}
                {ambientWeather && (
                  <div
                    className="clock-weather-section overflow-hidden flex justify-end"
                    style={{
                      // Dynamic width based on actual temperature text (e.g. "9°C" vs "29°C" vs "-3°C")
                      // 1px divider + 8px gap + text + 8px gap from parent = measured + ~17px
                      width: isClockHovered ? `${Math.ceil(measureTextWidth(`${ambientWeather.temperature}℃`) + 17)}px` : '3px',
                      // Constant -8px margin fully compensates for parent's gap, extra -3px hides the 3px collapsed width
                      marginLeft: isClockHovered ? '-8px' : '-11px',
                      // Expand: 480ms with bounce, Collapse: 560ms with bounce
                      transition: isClockHovered
                        ? 'width 480ms cubic-bezier(0.22, 1.4, 0.36, 1), margin-left 480ms cubic-bezier(0.22, 1.4, 0.36, 1)'
                        : 'width 560ms cubic-bezier(0.22, 1.4, 0.36, 1), margin-left 560ms cubic-bezier(0.22, 1.4, 0.36, 1)',
                    }}
                  >
                    <div
                      className="flex items-center gap-[8px] whitespace-nowrap"
                      style={{
                        opacity: isClockHovered ? 1 : 0,
                        // visibility:hidden fully removes text from rendering when collapsed
                        visibility: isClockHovered ? 'visible' : 'hidden',
                        transition: isClockHovered
                          ? 'opacity 220ms ease 120ms, visibility 0ms ease 0ms'
                          : 'opacity 140ms ease, visibility 0ms ease 140ms',
                      }}
                    >
                      {/* Vertical divider */}
                      <div
                        className="h-[17px] w-[1px] shrink-0"
                        style={{ backgroundColor: '#ebeef5' }}
                      />
                      {/* Temperature */}
                      <span
                        className="font-graphik text-[14px] text-[#5b5b5e] leading-[normal]"
                        style={{
                          WebkitFontSmoothing: 'antialiased',
                        }}
                      >
                        {ambientWeather.temperature}&#8451;
                      </span>
                    </div>
                  </div>
                )}
              </div>
              </div>
            </div>
            <h1 className={`home-heading font-calluna font-normal leading-[29px] text-[#333] text-[21px] w-[317px] whitespace-pre-wrap mb-[10px] ${loadedComponents.h1 ? 'component-loaded from-left' : 'component-hidden from-left'}`}>
              {getCopy('hero_headline')}
            </h1>
            <div className={`home-bio font-graphik leading-[25px] text-[#5b5b5e] text-[14px] whitespace-pre-wrap ${loadedComponents.bodyParagraphs ? 'component-loaded from-left' : 'component-hidden from-left'}`}>
              <p className="mb-[10px]">
                {renderCopy('bio_intro')}
              </p>
              <p className="mb-[10px]">
                {renderCopy('bio_current')}
              </p>
              <p className="mb-[10px]">
                {renderCopy('bio_mobbin')}
              </p>
              <p className="mb-[10px]">
                {renderCopy('bio_hanriver')}
              </p>
              <p className="mb-[10px]">
                {renderCopy('bio_grants')}
              </p>
            </div>
          </div>

          {/* Right Column - Video Card */}
            <div
              ref={videoFrameRef}
              className={`home-video-frame group video-frame-hover flex flex-col h-[470px] items-start justify-end rounded-[14px] w-[346px] relative overflow-visible outline outline-1 outline-black/5 cursor-default -mt-[35px] ${loadedComponents.videoFrame ? `component-loaded ${isTabletOrBelow ? 'from-left' : 'from-right'}` : `component-hidden ${isTabletOrBelow ? 'from-left' : 'from-right'}`} ${isMobileOrTablet && mobileMetadataExpanded ? 'mobile-expanded' : ''}`}
              onMouseEnter={() => {
                if (isMobileOrTablet) return; // No hover on mobile
                // Set ref FIRST to prevent race condition with jiggle interval
                isHoveredRef.current = true;
                setShowJiggle(false);
                setIsHovered(true);
                // Preload both adjacent videos when hovering on video frame
                preloadVideoOnHover('next');
                preloadVideoOnHover('prev');
              }}
              onMouseLeave={() => {
                if (isMobileOrTablet) return; // No hover on mobile
                setIsHovered(false);
                isHoveredRef.current = false;
              }}
              onClick={() => {
                // Mobile/tablet: toggle metadata box on tap
                if (isMobileOrTablet) {
                  setMobileMetadataExpanded(prev => !prev);
                  setShowJiggle(false);
                  if (!hasDiscoveredContent) {
                    setHasDiscoveredContent(true);
                  }
                }
              }}
            >
              {/* Loading overlay during video transitions */}
              {videoLoading && (
                <div className="absolute inset-0 z-50 bg-black/10 rounded-[14px] pointer-events-none" />
              )}
            <div className="absolute inset-0 rounded-[14px] overflow-hidden z-0 bg-[#f5f5f5]">
              {/* Video loading shimmer - always visible when video isn't actively playing */}
              {!currentVideoPlaying && (
                <div className="absolute inset-0 z-30 pointer-events-none">
                  <div className="video-loading-shimmer absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                </div>
              )}
              {/* Poster background - shows while video loads */}
              {safeVideoData[videoIndex] && (
                <div
                  className="absolute inset-0 z-5 bg-cover bg-center"
                  style={{
                    backgroundImage: `url(${getPosterSrc(safeVideoData[videoIndex].src)})`,
                    filter: safeVideoData[videoIndex].noExposureBoost ? 'none' : 'brightness(1.10)'
                  }}
                />
              )}
              {/* Only mount active + adjacent videos to prevent Safari layout issues */}
              {safeVideoData.map((video, idx) => {
                const isActive = idx === videoIndex;
                const total = safeVideoData.length;
                const prevIdx = (videoIndex - 1 + total) % total;
                const prevIdx2 = (videoIndex - 2 + total) % total;
                const nextIdx = (videoIndex + 1) % total;
                const nextIdx2 = (videoIndex + 2) % total;
                const isNearby = idx === prevIdx || idx === nextIdx || idx === prevIdx2 || idx === nextIdx2;
                // Only mount active and adjacent videos
                if (!isActive && !isNearby) {
                  return null;
                }
                return (
                  <video
                    key={video.id || idx}
                    ref={el => {
                      videoElementsRef.current[idx] = el;
                      if (idx === 0) videoRef1.current = el;
                      if (idx === 1) videoRef2.current = el;
                    }}
                    className={`absolute inset-0 w-full h-full object-cover ${video.noExposureBoost ? '' : 'brightness-[1.10]'} ${!isMobileOrTablet ? 'group-hover:brightness-[1.20]' : ''}`}
                    style={{
                      zIndex: isActive ? 20 : 10,
                      opacity: isActive ? 1 : 0,
                      visibility: isActive ? 'visible' : 'hidden',
                      transition: 'filter 250ms ease-in-out',
                      objectFit: 'cover',
                      ...(video.objectPosition ? { objectPosition: video.objectPosition } : {}),
                      willChange: isActive ? 'auto' : 'opacity',
                      ...(isMobileOrTablet && mobileMetadataExpanded && { filter: video.noExposureBoost ? 'brightness(1.03)' : 'brightness(1.20)' })
                    }}
                    poster={getPosterSrc(getVideoSrc(video))}
                    muted
                    playsInline
                    preload="auto"
                    controls={false}
                    loop={false}
                    onEnded={handleVideoEnded}
                    onError={(e) => handleVideoError(video.id, e.target)}
                    onPlaying={() => { if (isActive) setCurrentVideoPlaying(true); }}
                    onWaiting={() => { if (isActive) setCurrentVideoPlaying(false); }}
                    onTimeUpdate={isActive ? handleVideoTimeUpdate : undefined}
                  >
                    <source src={encodeVideoSrc(getVideoSrc(video))} type="video/mp4" />
                  </video>
                );
              })}
            </div>

            {/* Liquid glass info button - archived for now
            <button
              className="info-glass-button absolute top-3 right-3 z-40 w-8 h-8 rounded-full flex items-center justify-center
                         opacity-0 scale-90 group-hover:opacity-100 group-hover:scale-100
                         transition-all duration-300 ease-out
                         hover:!scale-110 active:!scale-95 cursor-pointer"
              style={{
                background: 'rgba(255, 255, 255, 0.08)',
                backdropFilter: 'blur(20px) saturate(180%)',
                WebkitBackdropFilter: 'blur(20px) saturate(180%)',
                boxShadow: '0 4px 24px rgba(0, 0, 0, 0.06), inset 0 0 0 0.5px rgba(255, 255, 255, 0.15)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
              }}
              onClick={(e) => {
                e.stopPropagation();
                // Placeholder for future functionality
              }}
              aria-label="Video information"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="rgba(255, 255, 255, 0.85)"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="16" x2="12" y2="12" />
                <line x1="12" y1="8" x2="12.01" y2="8" />
              </svg>
            </button>
            */}

            <div
              className="relative z-30 w-full black-box-container" 
              onClick={(e) => e.stopPropagation()}
              onMouseEnter={() => {
                // Set ref FIRST to prevent race condition with jiggle interval
                isHoveredRef.current = true;
                setShowJiggle(false);
                setIsHovered(true);
              }}
            >
              <div
                className={`bg-[#222122] h-[40px] rounded-[14px] w-full black-box-slide overflow-hidden relative outline outline-1 outline-white/5 ${showJiggle ? 'black-box-jiggle' : ''} ${!isMobileOrTablet ? 'group-hover:h-[130px]' : ''}`}
                style={isMobileOrTablet ? { height: mobileMetadataExpanded ? '130px' : '40px' } : undefined}
              >
                <div className={`absolute left-[12px] right-[12px] top-[12px] flex items-center justify-between transition-all duration-300 ease-in-out min-w-0 max-w-full z-10 ${!isMobileOrTablet ? 'group-hover:items-start group-hover:justify-between' : ''} ${isMobileOrTablet && mobileMetadataExpanded ? 'items-start justify-between' : ''}`}>
                  {safeVideoData[videoIndex] && (
                    <>
                      <p key={videoIndex} className="black-box-text font-graphik leading-[normal] text-[#e6eaee] text-[14px] whitespace-nowrap shrink-0" style={{ color: 'rgba(230, 234, 238, 1)' }}>
                        {safeVideoData[videoIndex].location}
                      </p>
                      <div className="absolute right-0 flex items-center group/coord-wrapper">
                        <a
                          key={videoIndex}
                          href={safeVideoData[videoIndex].coordinatesUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="coord-link black-box-text font-graphik leading-[normal] text-[#969494] text-[14px] whitespace-nowrap group-hover/coord-wrapper:text-[#e6eaee] transition-colors duration-[400ms] ease-[cubic-bezier(0.4,0,0.2,1)] cursor-pointer group-hover/coord-wrapper:-translate-x-[14px] transition-transform duration-[400ms] ease-[cubic-bezier(0.4,0,0.2,1)] relative inline-block"
                          onClick={playClick}
                        >
                          {safeVideoData[videoIndex].coordinates}
                          <svg 
                            width="12" 
                            height="12" 
                            viewBox="0 0 12 12" 
                            fill="none" 
                            xmlns="http://www.w3.org/2000/svg" 
                            className="coord-arrow-svg absolute left-full opacity-0 group-hover/coord-wrapper:opacity-100 transition-opacity duration-[400ms] ease-[cubic-bezier(0.4,0,0.2,1)]"
                            style={{ marginLeft: '2px', top: 'calc(50% - 1px)', transform: 'translateY(-50%)' }}
                          >
                            <path d="M4 2L8 6L4 10" stroke="#E6EAEE" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                          </svg>
                        </a>
                      </div>
                    </>
                  )}
                </div>
                <div
                  className="absolute left-[12px] right-[12px] bottom-[15px] flex items-end justify-between metadata-fade z-10"
                  style={isMobileOrTablet ? { opacity: mobileMetadataExpanded ? 1 : 0, transition: 'opacity 200ms ease' } : undefined}
                >
                  <div className="flex flex-col gap-[8px]">
                    {safeVideoData[videoIndex] && (
                      <>
                        <p key={`camera-${videoIndex}`} className="black-box-text font-graphik leading-[normal] text-[#969494] text-[14px] whitespace-nowrap">
                          {safeVideoData[videoIndex].camera}
                        </p>
                        <p key={`settings-${videoIndex}`} className="black-box-text font-graphik leading-[normal] text-[#969494] text-[14px] whitespace-nowrap">
                          {safeVideoData[videoIndex].aperture} · {safeVideoData[videoIndex].shutter} · ISO <span style={{ color: '#F9F801' }}>{safeVideoData[videoIndex].iso}</span>
                        </p>
                      </>
                    )}
                  </div>
                  <div className={`flex items-center ${isMobileOrTablet ? 'gap-[10px]' : 'gap-[6px]'}`}>
                    <div className="hover-trigger">
                    <button
                      className={`arrow-button flex items-center justify-center cursor-pointer ${isMobileOrTablet ? 'h-[38px] w-[40px]' : 'h-[29px] w-[30px]'}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        playArrow();
                        changeVideo('prev');
                      }}
                      onMouseEnter={() => {
                        preloadVideoOnHover('prev');
                      }}
                      aria-label="Previous photo"
                    >
                      <svg width={isMobileOrTablet ? "40" : "30"} height={isMobileOrTablet ? "38" : "29"} viewBox="0 0 30 29" fill="none" xmlns="http://www.w3.org/2000/svg" className="arrow-svg" aria-hidden="true">
                        <rect x="0.7" y="0.7" width="28.6" height="27.6" rx="4.3" fill="#222122" className="arrow-fill"/>
                        <rect x="0.7" y="0.7" width="28.6" height="27.6" rx="4.3" stroke="#4A474A" strokeWidth="1.4" className="arrow-stroke"/>
                        <path d="M16.7706 9.24213C16.9175 9.39721 17 9.60751 17 9.8268C17 10.0461 16.9175 10.2564 16.7706 10.4115L12.8915 14.505L16.7706 18.5985C16.9133 18.7545 16.9923 18.9634 16.9905 19.1802C16.9887 19.397 16.9063 19.6045 16.761 19.7578C16.6157 19.9111 16.4192 19.9981 16.2137 20C16.0082 20.0019 15.8103 19.9185 15.6625 19.7679L11.2294 15.0897C11.0825 14.9346 11 14.7243 11 14.505C11 14.2857 11.0825 14.0754 11.2294 13.9203L15.6625 9.24213C15.8094 9.08709 16.0087 9 16.2165 9C16.4243 9 16.6236 9.08709 16.7706 9.24213Z" fill="#4A474A" className="arrow-path"/>
                      </svg>
                    </button>
                    </div>
                    <div className="hover-trigger">
                    <button
                      className={`arrow-button flex items-center justify-center cursor-pointer ${isMobileOrTablet ? 'h-[38px] w-[40px]' : 'h-[29px] w-[30px]'}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        playArrow();
                        changeVideo('next');
                      }}
                      onMouseEnter={() => {
                        preloadVideoOnHover('next');
                      }}
                      aria-label="Next photo"
                    >
                      <svg width={isMobileOrTablet ? "40" : "30"} height={isMobileOrTablet ? "38" : "29"} viewBox="0 0 30 29" fill="none" xmlns="http://www.w3.org/2000/svg" className="arrow-svg" aria-hidden="true">
                        <rect x="0.7" y="0.7" width="28.6" height="27.6" rx="4.3" fill="#222122" className="arrow-fill"/>
                        <rect x="0.7" y="0.7" width="28.6" height="27.6" rx="4.3" stroke="#4A474A" strokeWidth="1.4" className="arrow-stroke"/>
                        <path d="M12.5294 19.7579C12.3825 19.6028 12.3 19.3925 12.3 19.1732C12.3 18.9539 12.3825 18.7436 12.5294 18.5885L16.4085 14.495L12.5294 10.4015C12.3867 10.2455 12.3077 10.0366 12.3095 9.81979C12.3113 9.60296 12.3937 9.39554 12.539 9.24221C12.6843 9.08889 12.8808 9.00192 13.0863 9.00003C13.2918 8.99815 13.4897 9.0815 13.6375 9.23214L18.0706 13.9103C18.2175 14.0654 18.3 14.2757 18.3 14.495C18.3 14.7143 18.2175 14.9246 18.0706 15.0797L13.6375 19.7579C13.4906 19.9129 13.2913 20 13.0835 20C12.8757 20 12.6764 19.9129 12.5294 19.7579Z" fill="#4A474A" className="arrow-path"/>
                      </svg>
                    </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Bottom Component - Born Slippy, Activity, Shortcuts, Contact */}
      <div
        className={`bottom-pill-outer fixed bottom-[50px] left-1/2 h-[64px] ${loadedComponents.bottomComponent ? 'component-loaded from-bottom' : 'component-hidden from-bottom'}`}
        style={{
          width: isTabletOrBelow ? undefined : `${musicPillWidth + 1 + 292}px`,
          maxWidth: isTabletOrBelow ? 'calc(100vw - 32px)' : undefined,
          overflow: 'visible',
          transition: 'width 500ms cubic-bezier(0.34, 1.2, 0.64, 1), opacity 500ms cubic-bezier(0.4, 0, 0.2, 1), transform 500ms cubic-bezier(0.4, 0, 0.2, 1)'
        }}
      >
        <div className="flex h-full bottom-pill-container rounded-[14px] relative" style={{ '--music-pill-width': `${musicPillWidth}px` }}>
          {/* Status Tab - aligned to right edge of music hover box, 10px above pill */}
          {!musicTabConflicts && (isMusicHovered || isModalExiting) && currentTrack && (
            <div
              className={`music-status-tab absolute z-[100] ${isModalExiting ? 'exiting' : ''}`}
            >
              <div className="status-tab-inner rounded-[8px] px-[12px] py-[7px] flex items-center justify-center gap-[6px]">
                {currentTrack.isNowPlaying ? (
                  <>
                    <div className="audio-waveform flex items-end gap-[2px]">
                      <span className="waveform-bar bar-1"></span>
                      <span className="waveform-bar bar-2"></span>
                      <span className="waveform-bar bar-3"></span>
                      <span className="waveform-bar bar-4"></span>
                    </div>
                    <span className="font-graphik text-[14px] leading-[20px] text-[#e6eaee] whitespace-nowrap">Live now</span>
                  </>
                ) : (
                  <>
                    <span className="font-graphik text-[14px] leading-[20px] whitespace-nowrap">
                      <span className="text-[#969494]">Last seen:</span>
                      <span className="text-[#e6eaee]"> {currentTrack.playedAt ? getTimeAgo(currentTrack.playedAt) : 'recently'}</span>
                    </span>
                  </>
                )}
              </div>
            </div>
          )}
          
          <div
            className="music-pill-wrapper h-[64px] flex items-center pl-[6px] pr-[12px] relative flex-shrink-0"
            style={{ '--music-pill-width': `${musicPillWidth}px`, overflow: 'visible' }}
          >
            <button
              ref={musicButtonRef}
              className="music-player-button h-[48px] w-full cursor-pointer group/vinyl"
              onClick={(e) => {
                e.preventDefault();
                playClick();
                if (activeModal === 'music') {
                  setActiveModal(null);
                  setActiveAnchorRef(null);
                } else {
                  setActiveModal('music');
                  setActiveAnchorRef(musicButtonRef);
                }
              }}
              onMouseEnter={() => {
                preloadModalComponents();
                if (musicTabConflicts) return;
                if (modalTimeoutRef.current) {
                  clearTimeout(modalTimeoutRef.current);
                  modalTimeoutRef.current = null;
                }
                if (musicEnterTimeoutRef.current) {
                  clearTimeout(musicEnterTimeoutRef.current);
                }
                musicEnterTimeoutRef.current = setTimeout(() => {
                  setIsModalExiting(false);
                  setIsMusicHovered(true);
                }, 40);
                // playPreview(); // Disabled for now
              }}
              onMouseLeave={() => {
                if (musicEnterTimeoutRef.current) {
                  clearTimeout(musicEnterTimeoutRef.current);
                  musicEnterTimeoutRef.current = null;
                }
                stopPreview();
                setIsModalExiting(true);
                modalTimeoutRef.current = setTimeout(() => {
                  setIsMusicHovered(false);
                  setIsModalExiting(false);
                }, 200);
              }}
            >
            <div className="music-button-inner">
            <div className="vinyl-container relative shrink-0 w-[40px] h-[40px]">
              {/* Floating music notes - appear on hover */}
              <div className="music-notes-container absolute inset-0 pointer-events-none" style={{ overflow: 'visible' }}>
                <span className="music-note note-1" style={{ color: '#5B9FD8' }}>♪</span>
                <span className="music-note note-2" style={{ color: '#D67A9A' }}>♫</span>
                <span className="music-note note-3" style={{ color: '#6BB88A' }}>♪</span>
                <span className="music-note note-4" style={{ color: '#E8A85C' }}>♬</span>
              </div>
              
              {/* Vinyl record - always spinning */}
              <div className={`vinyl-record vinyl-spin absolute inset-0 rounded-full flex items-center justify-center ${isPreviewPlaying ? 'vinyl-playing' : ''}`}>
                {/* Vinyl base with sheen */}
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[#1a1a1a] via-[#252525] to-[#0d0d0d]"></div>
                <div className="vinyl-sheen absolute inset-0 rounded-full"></div>
                
                {/* Vinyl grooves - more visible */}
                <div className="absolute inset-[3px] rounded-full border-[0.5px] border-white/[0.07]"></div>
                <div className="absolute inset-[6px] rounded-full border-[0.5px] border-white/[0.05]"></div>
                <div className="absolute inset-[9px] rounded-full border-[0.5px] border-white/[0.06]"></div>
                
                {/* Center label with album art - more prominent */}
                <div className="relative w-[24px] h-[24px] rounded-full flex items-center justify-center overflow-hidden shadow-[0_1px_4px_rgba(0,0,0,0.5)] z-10 ring-1 ring-black/20">
                  {currentTrack?.albumArtSmall ? (
                    <img
                      src={currentTrack.albumArtSmall}
                      alt={currentTrack.album}
                      className="w-full h-full object-cover"
                      loading="lazy"
                      width="24"
                      height="24"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-red-500 to-orange-600 flex items-center justify-center">
                      <div className="text-white text-[8px] font-bold">
                        {musicLoading ? '...' : musicError ? '!' : '♪'}
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Center hole */}
                <div className="absolute w-[2px] h-[2px] rounded-full bg-[#0a0a0a] z-20"></div>
              </div>
            </div>
            <div className="music-text-container flex flex-col font-graphik text-[14px] justify-center gap-[2px] items-start min-w-0 flex-shrink">
              <MarqueeText
                className="text-[#333] leading-[1.2]"
                maxWidth="calc(var(--music-pill-width, 205px) - 100px)"
                onScrollComplete={() => setArtistMarqueeReady(true)}
              >
                {currentTrack?.name || (musicLoading ? 'Loading...' : 'No recent track')}
              </MarqueeText>
              <MarqueeText
                className="text-[#c3c3c3] leading-[1.2]"
                maxWidth="calc(var(--music-pill-width, 205px) - 100px)"
                waitForSignal={true}
                signalReady={artistMarqueeReady}
              >
                {currentTrack?.artist || (musicLoading ? '...' : 'Connect Last.fm')}
              </MarqueeText>
            </div>
          </div>
          </button>
          </div>

          {/* Divider line */}
          <div className="pill-divider w-[1px] h-full bg-[#ebeef5] flex-shrink-0"></div>

          {/* Right side - Buttons */}
          <div className={`pill-buttons-section h-[64px] flex items-center px-[12px] py-[14px] relative flex-shrink-0 ${isTabletOrBelow ? 'w-auto' : 'w-[292px]'}`}>
            {/* ⌘K indicator - desktop only */}
            {!isTabletOrBelow && !shortcutsTooltipConflicts && (isShortcutsHovered || isShortcutsModalExiting) && (
              <div
                className={`shortcuts-modal absolute z-[100] ${isShortcutsModalExiting ? 'exiting' : ''}`}
              >
                <div className="shortcuts-modal-inner rounded-[8px] px-[12px] py-[7px] flex items-center justify-center">
                  <span className="font-graphik text-[14px] leading-[20px] text-[#5b5b5e] whitespace-nowrap">{isMac ? '⌘K' : 'Ctrl+K'}</span>
                </div>
              </div>
            )}

            {/* Activity and Shortcuts buttons */}
            <div className={`pill-buttons-inner flex h-[37px] ${isTabletOrBelow ? 'w-auto' : 'w-[177px]'}`}>
              <div className={`hover-trigger ${isTabletOrBelow ? '' : 'flex-1'}`}>
              <button
                ref={activityButtonRef}
                className={`bottom-button h-[37px] w-full flex items-center justify-center cursor-pointer ${isTabletOrBelow ? 'w-[37px] rounded-[8px]' : 'rounded-l-[8px]'}`}
                onMouseEnter={preloadModalComponents}
                onClick={() => {
                  playClick();
                  if (activeModal === 'activity') {
                    setActiveModal(null);
                    setActiveAnchorRef(null);
                  } else {
                    setActiveModal('activity');
                    setActiveAnchorRef(activityButtonRef);
                  }
                }}
              >
                {isTabletOrBelow ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true" shapeRendering="geometricPrecision"><circle cx="12" cy="12" r="9" stroke="#aaa" strokeWidth="1.5"/><path d="M12 6V12H17" stroke="#aaa" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                ) : (
                  <p className="font-graphik text-[14px] text-[#5b5b5e]">Timeline</p>
                )}
              </button>
              </div>
              <div className={`hover-trigger ${isTabletOrBelow ? '' : 'flex-1'}`}>
              <button
                ref={shortcutsButtonRef}
                className={`bottom-button h-[37px] w-full flex items-center justify-center cursor-pointer ${isShortcutsActive ? 'active' : ''} ${isTabletOrBelow ? 'w-[37px] rounded-[8px]' : 'rounded-r-[8px]'}`}
                onMouseEnter={() => {
                  preloadModalComponents();
                  if (shortcutsTooltipConflicts) return;
                  if (shortcutsModalTimeoutRef.current) {
                    clearTimeout(shortcutsModalTimeoutRef.current);
                    shortcutsModalTimeoutRef.current = null;
                  }
                  setIsShortcutsModalExiting(false);
                  setIsShortcutsHovered(true);
                }}
                onClick={() => {
                  playClick();
                  if (activeModal === 'shortcuts') {
                    setActiveModal(null);
                    setActiveAnchorRef(null);
                  } else {
                    setActiveModal('shortcuts');
                    setActiveAnchorRef(shortcutsButtonRef);
                  }
                }}
                onMouseLeave={() => {
                  setIsShortcutsModalExiting(true);
                  shortcutsModalTimeoutRef.current = setTimeout(() => {
                    setIsShortcutsHovered(false);
                    setIsShortcutsModalExiting(false);
                  }, 200);
                }}
              >
                {isTabletOrBelow ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true" shapeRendering="geometricPrecision"><path d="M3 7.5C3 6.1 4.1 5 5.5 5H18.5C19.9 5 21 6.1 21 7.5V16.5C21 17.9 19.9 19 18.5 19H5.5C4.1 19 3 17.9 3 16.5V7.5Z" stroke="#aaa" strokeWidth="1.5"/><path d="M7 11H17M7 14.5H13" stroke="#aaa" strokeWidth="1.5" strokeLinecap="round"/></svg>
                ) : (
                  <p className="font-graphik text-[14px] text-[#5b5b5e]">Shortcuts</p>
                )}
              </button>
              </div>
            </div>

            {/* Contact button */}
            <div className="hover-trigger">
            <button
              ref={contactButtonRef}
              className={`bottom-button h-[37px] rounded-[8px] flex items-center justify-center cursor-pointer ${isTabletOrBelow ? 'w-[37px]' : 'w-[81px]'}`}
              onMouseEnter={preloadModalComponents}
              onClick={() => {
                playClick();
                if (activeModal === 'contact') {
                  setActiveModal(null);
                  setActiveAnchorRef(null);
                } else {
                  setActiveModal('contact');
                  setActiveAnchorRef(contactButtonRef);
                }
              }}
            >
              {isTabletOrBelow ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true" shapeRendering="geometricPrecision"><rect x="3" y="5" width="18" height="14" rx="2" stroke="#aaa" strokeWidth="1.5"/><path d="M3 7L12 14L21 7" stroke="#aaa" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              ) : (
                <p className="font-graphik text-[14px] text-[#5b5b5e]">Contact</p>
              )}
            </button>
            </div>
          </div>
        </div>
      </div>

    </div>

    {/* Slide Up Modal - outside bottom-pill-outer so its transform doesn't break position:fixed */}
    <Suspense fallback={null}>
      <SlideUpModal
        isOpen={activeModal !== null}
        onClose={() => setActiveModal(null)}
        type={activeModal || 'contact'}
        anchorRef={activeAnchorRef}
      >
        <Suspense fallback={<div className="p-4 text-center text-gray-400" role="status" aria-live="polite">Loading...</div>}>
          {activeModal === 'music' && <MusicModalContent currentTrack={currentTrack} />}
          {activeModal === 'activity' && <ActivityModalContent />}
          {activeModal === 'shortcuts' && (
            <ShortcutsModalContent
              isMac={isMac}
              onClose={() => setActiveModal(null)}
              onAction={(action, payload) => {
                switch (action) {
                  case 'navigate':
                    setActiveModal(null);
                    // Scroll to top for home navigation
                    if (payload === '/') window.scrollTo({ top: 0, behavior: 'smooth' });
                    break;
                  case 'openAboutPanel':
                    setActiveModal(null);
                    setIsAboutPanelOpen(true);
                    break;
                  case 'copyEmail':
                    navigator.clipboard.writeText('changjoonseo126@gmail.com').catch(() => {});
                    setActiveModal(null);
                    break;
                  case 'toggleDarkMode':
                    setActiveModal(null);
                    break;
                  case 'close':
                    setActiveModal(null);
                    break;
                }
              }}
            />
          )}
          {activeModal === 'contact' && <ContactModalContent />}
        </Suspense>
      </SlideUpModal>
    </Suspense>

    {/* Arrow Key Navigation Indicator */}
    {arrowKeyIndicator && (
      <div
        key={arrowKeyIndicator.key}
        className="arrow-key-indicator"
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          zIndex: 9999,
          pointerEvents: 'none',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '36px',
            height: '36px',
            borderRadius: '8px',
            background: 'linear-gradient(180deg, #ffffff 0%, #fcfcfc 100%)',
            border: '1px solid rgba(235, 238, 245, 0.85)',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08), 0 4px 16px rgba(0, 0, 0, 0.04), inset 0 0.5px 0 rgba(255, 255, 255, 0.6), inset 0 -0.5px 0 rgba(0, 0, 0, 0.015)',
            animation: 'arrowKeyAppear 1s cubic-bezier(0.34, 1.25, 0.64, 1) forwards',
          }}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            style={{
              transform: arrowKeyIndicator.direction === 'left' ? 'rotate(180deg)' : 'none',
            }}
          >
            <path
              d="M6 3L11 8L6 13"
              stroke="#5B5B5E"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </div>
    )}

    {/* About Panel (desktop slide-in) */}
    {!isTabletOrBelow && (
      <AboutPanel isOpen={isAboutPanelOpen} onClose={() => setIsAboutPanelOpen(false)} />
    )}

    <Toaster
      position="bottom-right"
      toastOptions={{
        style: {
          fontFamily: "'Graphik', -apple-system, sans-serif",
          fontSize: '14px',
          background: 'rgba(255,255,255,0.92)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          border: '1px solid rgba(235,238,245,0.85)',
          boxShadow: '0 2px 12px rgba(0,0,0,0.06), inset 0 0.5px 0 rgba(255,255,255,0.6)',
          color: '#5b5b5e',
          borderRadius: '12px',
          padding: '10px 14px',
        },
        duration: 4000,
      }}
    />
    {import.meta.env.DEV && <Agentation />}
    </>
  )
}

export default App

