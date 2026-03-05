import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState, useRef } from 'react';
import { useSounds } from '../hooks/useSounds';
import { useMediaQuery } from '../hooks/useMediaQuery';

// Contact modal icons - defined outside component to prevent recreation on each render

// Email: Gentle jiggle with notification badge popup
const MailIcon = ({ hovered }) => (
  <motion.svg
    width="19"
    height="19"
    viewBox="0 0 24 24"
    fill="none"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{ overflow: 'visible' }}
  >
    {/* Envelope group - jiggles */}
    <motion.g
      animate={hovered ? {
        rotate: [0, -3, 2.5, -2, 1.5, -1, 0],
        y: [0, -0.5, 0.3, -0.2, 0]
      } : { rotate: 0, y: 0 }}
      transition={{
        duration: 0.5,
        ease: "easeInOut"
      }}
      style={{ transformOrigin: '12px 12px' }}
    >
      {/* Envelope body - ORIGINAL */}
      <rect
        x="3" y="5" width="18" height="14" rx="2"
        stroke={hovered ? "#6b7280" : "#a3a3a3"}
        style={{ transition: 'stroke 300ms ease' }}
      />
      {/* Envelope flap - ORIGINAL */}
      <path
        d="M3 7l9 6 9-6"
        stroke={hovered ? "#6b7280" : "#a3a3a3"}
        fill="none"
        style={{ transition: 'stroke 300ms ease' }}
      />
    </motion.g>

    {/* Notification badge - pops up on hover */}
    <motion.g
      animate={hovered ? {
        scale: [0, 1.15, 1],
        opacity: [0, 1, 1]
      } : { scale: 0, opacity: 0 }}
      transition={{
        duration: 0.3,
        ease: [0.34, 1.5, 0.64, 1],
        delay: 0.1
      }}
      style={{ transformOrigin: '21px 3px' }}
    >
      {/* Badge shadow for depth */}
      <circle
        cx="21"
        cy="3.5"
        r="6"
        fill="rgba(0,0,0,0.1)"
      />
      {/* Red notification circle */}
      <circle
        cx="21"
        cy="3"
        r="6"
        fill="#ef4444"
      />
      {/* Subtle inner highlight for skeuomorphic style */}
      <circle
        cx="21"
        cy="2"
        r="4"
        fill="rgba(255,255,255,0.15)"
      />
      {/* White "1" */}
      <text
        x="21"
        y="5.5"
        textAnchor="middle"
        fontSize="8"
        fontWeight="600"
        fill="white"
        style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
      >
        1
      </text>
    </motion.g>
  </motion.svg>
);

// Instagram: Camera focus animation
const InstagramIcon = ({ hovered }) => (
  <motion.svg
    width="19"
    height="19"
    viewBox="0 0 24 24"
    fill="none"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    {/* Camera body */}
    <rect
      x="2" y="2" width="20" height="20" rx="5"
      stroke={hovered ? "#6b7280" : "#a3a3a3"}
      style={{ transition: 'stroke 300ms ease' }}
    />
    {/* Lens - focus animation, returns to default */}
    <motion.circle
      cx="12" cy="12"
      stroke={hovered ? "#6b7280" : "#a3a3a3"}
      style={{ transition: 'stroke 300ms ease' }}
      initial={{ r: 4 }}
      animate={hovered ? {
        r: [4, 3.2, 4.5, 4],
        strokeWidth: [1.5, 2, 1.5, 1.5]
      } : { r: 4, strokeWidth: 1.5 }}
      transition={{
        duration: 0.6,
        ease: [0.25, 0.46, 0.45, 0.94]
      }}
    />
    {/* Inner lens - appears then fades back out */}
    <motion.circle
      cx="12" cy="12"
      fill={hovered ? "#6b7280" : "transparent"}
      stroke="none"
      animate={hovered ? {
        r: [0, 2.2, 0],
        opacity: [0, 0.45, 0]
      } : { r: 0, opacity: 0 }}
      transition={{
        duration: 0.6,
        ease: [0.25, 0.46, 0.45, 0.94]
      }}
    />
    {/* Flash dot - pulses and returns */}
    <motion.circle
      cx="17.5" cy="6.5"
      fill={hovered ? "#6b7280" : "#a3a3a3"}
      stroke="none"
      style={{ transition: 'fill 300ms ease' }}
      initial={{ r: 1.5 }}
      animate={hovered ? {
        r: [1.5, 2.2, 1.5],
        opacity: [1, 0.5, 1]
      } : { r: 1.5, opacity: 1 }}
      transition={{
        duration: 0.4,
        ease: "easeOut",
        delay: 0.1
      }}
    />
  </motion.svg>
);

// LinkedIn: Bouncy wave animation
const LinkedInIcon = ({ hovered }) => (
  <motion.svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill={hovered ? "#6b7280" : "#a3a3a3"}
    style={{ transition: 'fill 300ms ease' }}
    animate={hovered ? {
      rotate: [0, -8, 6, -4, 3, 0],
      scale: [1, 1.1, 1.12, 1.08, 1.04, 1]
    } : { rotate: 0, scale: 1 }}
    transition={{
      duration: 0.55,
      ease: [0.36, 0.07, 0.19, 0.97]
    }}
  >
    <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.32 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.79M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z"/>
  </motion.svg>
);

// Twitter/X: Spin animation
const TwitterIcon = ({ hovered }) => (
  <motion.svg
    width="17"
    height="17"
    viewBox="0 0 24 24"
    fill={hovered ? "#6b7280" : "#a3a3a3"}
    style={{ transition: 'fill 300ms ease' }}
    animate={hovered ? {
      rotate: [0, 360],
      scale: [1, 0.95, 1.02, 1]
    } : { rotate: 0, scale: 1 }}
    transition={{
      duration: 0.7,
      ease: [0.4, 0, 0.2, 1]
    }}
  >
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
  </motion.svg>
);

// Letterboxd: Film frame flicker
const LetterboxdIcon = ({ hovered }) => (
  <motion.svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    style={{ overflow: 'visible' }}
  >
    {/* Three overlapping circles - the Letterboxd logo */}
    <motion.circle
      cx="5" cy="12" r="5"
      fill={hovered ? "#FF8000" : "#a3a3a3"}
      style={{ transition: 'fill 300ms ease' }}
      animate={hovered ? { cx: [5, 3.5, 5], opacity: [0.85, 1, 0.85] } : { cx: 5, opacity: 0.85 }}
      transition={{ duration: 0.5, ease: "easeInOut" }}
    />
    <motion.circle
      cx="12" cy="12" r="5"
      fill={hovered ? "#00E054" : "#a3a3a3"}
      opacity={0.7}
      animate={hovered ? { scale: [1, 1.1, 1], opacity: [0.7, 0.9, 0.7] } : { scale: 1, opacity: 0.7 }}
      transition={{ duration: 0.5, ease: "easeInOut", delay: 0.05 }}
    />
    <motion.circle
      cx="19" cy="12" r="5"
      fill={hovered ? "#40BCF4" : "#a3a3a3"}
      style={{ transition: 'fill 300ms ease' }}
      animate={hovered ? { cx: [19, 20.5, 19], opacity: [0.85, 1, 0.85] } : { cx: 19, opacity: 0.85 }}
      transition={{ duration: 0.5, ease: "easeInOut", delay: 0.1 }}
    />
  </motion.svg>
);

// GitHub: Octocat tentacle wiggle
const GitHubIcon = ({ hovered }) => (
  <motion.svg
    width="19"
    height="19"
    viewBox="0 0 24 24"
    fill={hovered ? "#6b7280" : "#a3a3a3"}
    style={{ transition: 'fill 300ms ease' }}
    animate={hovered ? {
      rotate: [0, -6, 5, -3, 2, 0],
      y: [0, -1, 0.5, -0.3, 0]
    } : { rotate: 0, y: 0 }}
    transition={{
      duration: 0.55,
      ease: [0.36, 0.07, 0.19, 0.97]
    }}
  >
    <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/>
  </motion.svg>
);

// Chess.com: Official pawn logo with bounce
const ChessIcon = ({ hovered }) => (
  <motion.svg
    width="17"
    height="17"
    viewBox="0 0 24 24"
    fill={hovered ? "#81B64C" : "#a3a3a3"}
    style={{ transition: 'fill 300ms ease' }}
  >
    <motion.path
      d="M12 0a3.85 3.85 0 0 0-3.875 3.846A3.84 3.84 0 0 0 9.73 6.969l-2.79 1.85c0 .622.144 1.114.434 1.649H9.83c-.014.245-.014.549-.014.925 0 .025.003.048.006.071-.064 1.353-.507 3.472-3.62 5.842-.816.625-1.423 1.495-1.806 2.533a.33.33 0 0 0-.045.084 8.124 8.124 0 0 0-.39 2.516c0 .1.216 1.561 8.038 1.561s8.038-1.46 8.038-1.561c0-2.227-.824-4.048-2.24-5.133-4.034-3.08-3.586-5.74-3.644-6.838h2.458c.29-.535.434-1.027.434-1.649l-2.79-1.836a3.86 3.86 0 0 0 1.604-3.123A3.873 3.873 0 0 0 13.445.275c-.004-.002-.01.004-.015.004A3.76 3.76 0 0 0 12 0Z"
      animate={hovered ? {
        y: [0, -2.5, 0, -1, 0],
      } : { y: 0 }}
      transition={{
        duration: 0.5,
        ease: [0.25, 0.46, 0.45, 0.94]
      }}
    />
  </motion.svg>
);

// Hinge: Stylized H lettermark with tilt
const HingeIcon = ({ hovered }) => (
  <motion.svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill={hovered ? "#6b7280" : "#a3a3a3"}
    style={{ transition: 'fill 300ms ease' }}
    animate={hovered ? {
      rotate: [0, -8, 6, -3, 0],
      scale: [1, 1.08, 1.05, 1]
    } : { rotate: 0, scale: 1 }}
    transition={{
      duration: 0.5,
      ease: [0.36, 0.07, 0.19, 0.97]
    }}
  >
    {/* Stylized H - Hinge lettermark */}
    <path d="M4 2h3.5v8.5H16.5V2H20v20h-3.5v-8.5H7.5V22H4V2z"/>
  </motion.svg>
);

// Spotify: Sound wave pulse
const SpotifyIcon = ({ hovered }) => (
  <motion.svg
    width="19"
    height="19"
    viewBox="0 0 24 24"
    fill={hovered ? "#1DB954" : "#a3a3a3"}
    style={{ transition: 'fill 300ms ease' }}
    animate={hovered ? {
      scale: [1, 1.1, 1.05, 1],
      rotate: [0, -5, 3, 0]
    } : { scale: 1, rotate: 0 }}
    transition={{
      duration: 0.5,
      ease: [0.25, 0.46, 0.45, 0.94]
    }}
  >
    <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm4.586 14.424a.622.622 0 0 1-.857.207c-2.348-1.435-5.304-1.76-8.785-.964a.623.623 0 0 1-.277-1.215c3.809-.87 7.076-.496 9.712 1.115a.623.623 0 0 1 .207.857zm1.224-2.719a.78.78 0 0 1-1.072.257c-2.687-1.652-6.785-2.131-9.965-1.166a.78.78 0 0 1-.452-1.493c3.632-1.102 8.147-.568 11.234 1.329a.78.78 0 0 1 .255 1.073zm.105-2.835C14.692 8.95 9.375 8.775 6.297 9.71a.934.934 0 1 1-.542-1.79c3.533-1.072 9.404-.865 13.115 1.338a.934.934 0 0 1-1.955 1.611z"/>
  </motion.svg>
);

const SlideUpModal = ({ isOpen, onClose, type, anchorRef, darkMode = false, children }) => {
  const popoverRef = useRef(null);
  const positionRef = useRef(0);
  const positionDivRef = useRef(null);
  const isMobile = useMediaQuery('(max-width: 813px)');
  const prevTypeRef = useRef(null);
  const switchedTypesRef = useRef(new Set());

  const isContactModal = type === 'contact';
  const isShortcutsModal = type === 'shortcuts';

  // Track which modal types were reached via switching (not fresh open)
  // so we can suppress their content-level CSS entry animations
  if (isOpen && prevTypeRef.current !== null && prevTypeRef.current !== type) {
    switchedTypesRef.current.add(type);
  }
  if (!isOpen) {
    switchedTypesRef.current.clear();
  }
  prevTypeRef.current = isOpen ? type : null;

  const wasSwitchedTo = switchedTypesRef.current.has(type);

  // Calculate position synchronously — read from anchor ref during render
  if (isOpen && anchorRef?.current) {
    const rect = anchorRef.current.getBoundingClientRect();
    positionRef.current = rect.left + rect.width / 2;
  }

  // Keep position updated on resize
  useEffect(() => {
    if (!isOpen) return;
    const onResize = () => {
      if (anchorRef?.current && positionDivRef.current) {
        const rect = anchorRef.current.getBoundingClientRect();
        positionDivRef.current.style.left = (rect.left + rect.width / 2) + 'px';
      }
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [isOpen, anchorRef]);

  // Update position div immediately when anchor changes (for switching modals)
  useEffect(() => {
    if (isOpen && anchorRef?.current && positionDivRef.current && !isMobile) {
      const rect = anchorRef.current.getBoundingClientRect();
      positionDivRef.current.style.left = (rect.left + rect.width / 2) + 'px';
    }
  }, [isOpen, anchorRef, type, isMobile]);

  // Click outside to close
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e) => {
      if (popoverRef.current?.contains(e.target)) return;
      if (anchorRef?.current?.contains(e.target)) return;

      // Don't close if clicking on bottom pill — button handlers manage modal switching
      const bottomPill = e.target.closest('.bottom-pill-container');
      if (bottomPill) return;

      onClose();
    };

    const timer = setTimeout(() => {
      document.addEventListener('click', handleClickOutside, true);
    }, 0);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('click', handleClickOutside, true);
    };
  }, [isOpen, onClose, type, anchorRef]);

  const getTitle = () => {
    switch (type) {
      case 'music': return 'Now Playing';
      case 'activity': return 'Activity';
      case 'contact': return 'Get in Touch';
      default: return '';
    }
  };

  // Content wrapper based on modal type
  const renderContent = () => {
    if (isContactModal) {
      return (
        <div className="contact-modal-outer rounded-[20px] flex justify-center">
          {children}
        </div>
      );
    }
    if (isShortcutsModal) {
      return (
        <div className="shortcuts-palette-outer flex justify-center">
          {children}
        </div>
      );
    }
    // Default modal with header
    return (
      <div className="bg-white rounded-[16px] shadow-[0_8px_40px_rgba(0,0,0,0.12),0_2px_8px_rgba(0,0,0,0.08)] overflow-hidden border border-black/[0.04]">
        <div className="px-5 pt-4 pb-3 border-b border-black/[0.06]">
          <div className="flex items-center justify-between gap-8">
            <h2 className="font-graphik text-[15px] font-medium text-[#1a1a1a]">
              {getTitle()}
            </h2>
            <button
              onClick={onClose}
              className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-black/[0.04] transition-colors"
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M9 3L3 9M3 3L9 9" stroke="#999" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </button>
          </div>
        </div>
        <div className={`p-5${isMobile ? ' overflow-y-auto' : ''}`} style={isMobile ? { maxHeight: 'calc(70vh - 60px)' } : undefined}>
          {children}
        </div>
      </div>
    );
  };

  const bottomOffset = isMobile ? 'calc(24px + 64px + 10px)' : 'calc(50px + 64px + 10px)';

  // Separate positioning (plain div, instant) from animation (motion.div, spring)
  // This prevents Framer Motion from animating position changes when switching modals
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="modal-container"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 16 }}
          transition={{
            type: 'spring',
            stiffness: 400,
            damping: 35,
            mass: 0.8,
          }}
          style={{ position: 'fixed', zIndex: 200, bottom: bottomOffset, left: 0, right: 0, pointerEvents: 'none' }}
        >
          <div
            ref={(el) => { popoverRef.current = el; positionDivRef.current = el; }}
            style={isMobile
              ? { position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)', maxWidth: 'calc(100vw - 32px)', pointerEvents: 'auto' }
              : { position: 'absolute', bottom: 0, left: positionRef.current, transform: 'translateX(-50%)', pointerEvents: 'auto' }
            }
          >
            <div className={wasSwitchedTo ? 'modal-switched' : undefined}>
              {renderContent()}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// Music modal with current track and recent tracks list
export const MusicModalContent = ({ currentTrack }) => {
  // Placeholder recent tracks for testing (will be replaced with real API data)
  const recentTracks = [
    { name: 'Born Slippy .NUXX', artist: 'Underworld', albumArt: null, isNowPlaying: true },
    { name: 'Windowlicker', artist: 'Aphex Twin', albumArt: null },
    { name: 'Around the World', artist: 'Daft Punk', albumArt: null },
    { name: 'Teardrop', artist: 'Massive Attack', albumArt: null },
    { name: 'Glory Box', artist: 'Portishead', albumArt: null },
    { name: 'Unfinished Sympathy', artist: 'Massive Attack', albumArt: null },
    { name: 'Bittersweet Symphony', artist: 'The Verve', albumArt: null },
    { name: 'Karma Police', artist: 'Radiohead', albumArt: null },
    { name: 'Paranoid Android', artist: 'Radiohead', albumArt: null },
    { name: 'Everything In Its Right Place', artist: 'Radiohead', albumArt: null },
  ];

  // Use current track if available, otherwise use first placeholder
  const nowPlaying = currentTrack || recentTracks[0];

  return (
    <div className="w-[340px]">
      {/* Now Playing Section */}
      <div className="flex items-center gap-4 p-4 rounded-[12px] bg-gradient-to-br from-[#fafafa] to-[#f5f5f5] border border-black/[0.04] mb-4">
        {/* Album Art */}
        <div className="w-16 h-16 rounded-[8px] bg-gradient-to-br from-[#e0e0e0] to-[#d0d0d0] flex items-center justify-center overflow-hidden shadow-sm flex-shrink-0">
          {nowPlaying.albumArt || nowPlaying.albumArtSmall ? (
            <img
              src={nowPlaying.albumArt || nowPlaying.albumArtSmall}
              alt={nowPlaying.album || nowPlaying.name}
              className="w-full h-full object-cover"
              width="64"
              height="64"
              loading="lazy"
            />
          ) : (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M9 18V5l12-2v13" stroke="#bbb" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <circle cx="6" cy="18" r="3" stroke="#bbb" strokeWidth="1.5"/>
              <circle cx="18" cy="16" r="3" stroke="#bbb" strokeWidth="1.5"/>
            </svg>
          )}
        </div>

        {/* Track Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {nowPlaying.isNowPlaying && (
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-[#22c55e] animate-pulse"/>
                <span className="font-graphik text-[11px] text-[#22c55e] uppercase tracking-wide">Live</span>
              </div>
            )}
          </div>
          <p className="font-graphik text-[15px] text-[#1a1a1a] font-medium truncate">{nowPlaying.name}</p>
          <p className="font-graphik text-[13px] text-[#888] truncate">{nowPlaying.artist}</p>
        </div>
      </div>

      {/* Recent Tracks List */}
      <div className="space-y-1">
        <p className="font-graphik text-[11px] text-[#ababab] uppercase tracking-wide px-1 mb-2">Recently Played</p>
        <div className="max-h-[280px] overflow-y-auto space-y-1 pr-1" style={{ scrollbarWidth: 'thin', scrollbarColor: '#ddd transparent' }}>
          {recentTracks.slice(1).map((track, i) => (
            <div
              key={i}
              className="flex items-center gap-3 p-2.5 rounded-[8px] hover:bg-[#f5f5f5] transition-colors cursor-pointer group"
            >
              {/* Small album art */}
              <div className="w-10 h-10 rounded-[6px] bg-gradient-to-br from-[#e8e8e8] to-[#ddd] flex items-center justify-center overflow-hidden flex-shrink-0">
                {track.albumArt ? (
                  <img src={track.albumArt} alt={track.name} className="w-full h-full object-cover" width="40" height="40" loading="lazy"/>
                ) : (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                    <path d="M9 18V5l12-2v13" stroke="#ccc" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <circle cx="6" cy="18" r="3" stroke="#ccc" strokeWidth="1.5"/>
                    <circle cx="18" cy="16" r="3" stroke="#ccc" strokeWidth="1.5"/>
                  </svg>
                )}
              </div>

              {/* Track info */}
              <div className="flex-1 min-w-0">
                <p className="font-graphik text-[13px] text-[#1a1a1a] truncate group-hover:text-[#0066cc] transition-colors">{track.name}</p>
                <p className="font-graphik text-[11px] text-[#ababab] truncate">{track.artist}</p>
              </div>

              {/* Play indicator on hover */}
              <div className="w-6 h-6 rounded-full bg-[#1a1a1a] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
                  <path d="M8 5V19L19 12L8 5Z" fill="white"/>
                </svg>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Last.fm link */}
      <a
        href="https://www.last.fm/user/joonzambia"
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center gap-2 mt-4 pt-3 border-t border-black/[0.04] font-graphik text-[12px] text-[#ababab] hover:text-[#666] transition-colors"
      >
        <span>View on Last.fm</span>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
          <path d="M7 17L17 7M17 7H7M17 7V17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </a>
    </div>
  );
};

export const ActivityModalContent = () => (
  <div className="w-[340px] space-y-4">
    {/* Code changes widget */}
    <div className="p-4 rounded-[12px] bg-gradient-to-br from-[#fafafa] to-[#f5f5f5] border border-black/[0.04]">
      <div className="flex items-center justify-between mb-3">
        <span className="font-graphik text-[11px] text-[#ababab] uppercase tracking-wide">This Week</span>
        <span className="font-graphik text-[11px] text-[#ccc]">Refreshes daily</span>
      </div>
      <div className="flex items-baseline gap-3">
        <div className="flex items-center gap-1.5">
          <span className="font-graphik text-[22px] font-medium text-[#22c55e]">+1,247</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="font-graphik text-[22px] font-medium text-[#ef4444]">-389</span>
        </div>
      </div>
      <p className="font-graphik text-[12px] text-[#888] mt-2">lines changed across 23 commits</p>
    </div>

    {/* Activity items */}
    <div className="space-y-2">
      {[
        { action: 'Updated', item: 'Homepage hero section', time: '2 hours ago', icon: '✏️' },
        { action: 'Deployed', item: 'Portfolio v2.3', time: '5 hours ago', icon: '🚀' },
        { action: 'Committed', item: 'Video optimization fixes', time: '1 day ago', icon: '📝' },
        { action: 'Designed', item: 'New modal components', time: '2 days ago', icon: '🎨' },
      ].map((activity, i) => (
        <div key={i} className="flex items-start gap-3 p-3 rounded-[10px] bg-[#fafafa] hover:bg-[#f5f5f5] transition-colors">
          <div className="w-8 h-8 rounded-full bg-white border border-black/[0.06] flex items-center justify-center text-sm">
            {activity.icon}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-graphik text-[13px] text-[#1a1a1a]">
              <span className="text-[#888]">{activity.action}</span> {activity.item}
            </p>
            <p className="font-graphik text-[11px] text-[#ababab] mt-0.5">{activity.time}</p>
          </div>
        </div>
      ))}
    </div>

    {/* View all link */}
    <button className="w-full py-2.5 rounded-[8px] bg-[#f5f5f5] hover:bg-[#eee] transition-colors font-graphik text-[13px] text-[#666]">
      View all activity
    </button>
  </div>
);

// Shortcut row sub-component
const ShortcutRow = ({ icon, label, subtitle, keys, isMac, onClick, href, isSelected, onMouseEnter }) => {
  const rowClass = `shortcut-row${isSelected ? ' shortcut-row-selected' : ''}`;
  const content = (
    <div className={`shortcut-row-inner w-full flex items-center gap-[10px] px-[10px] ${subtitle ? 'py-[7px]' : 'py-[5px]'}`}>
      <div className="shortcut-icon-box w-[30px] h-[28px] flex items-center justify-center rounded-[6px] flex-shrink-0">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <span className="font-graphik text-[14px] text-[#444] block truncate">{label}</span>
        {subtitle && (
          <span className="block font-graphik text-[12px] text-[#ababab] mt-[1px] truncate">{subtitle}</span>
        )}
      </div>
      {keys && (
        <div className="flex gap-1 flex-shrink-0">
          {keys.map((key, j) => (
            <kbd
              key={j}
              className="min-w-[22px] h-[20px] px-[5px] rounded-[5px] bg-[#f0f0f0] border border-[#ddd] border-b-[1.5px] font-graphik text-[11px] text-[#888] flex items-center justify-center"
            >
              {key}
            </kbd>
          ))}
        </div>
      )}
    </div>
  );

  if (href) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={rowClass} data-shortcut-row onMouseEnter={onMouseEnter}>
        {content}
      </a>
    );
  }
  return (
    <button onClick={onClick} className={`${rowClass} w-full text-left`} data-shortcut-row onMouseEnter={onMouseEnter}>
      {content}
    </button>
  );
};

// Palette section icons — 16x16, viewBox 0 0 24 24, stroke #a3a3a3, strokeWidth 1.5, strokeLinecap round
const PaletteIcons = {
  // Open book — Read latest writing
  book: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#a3a3a3" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
    </svg>
  ),
  // Play circle — Watch recent video
  video: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#a3a3a3" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="palette-video-icon">
      <circle cx="12" cy="12" r="10"/>
      <polygon points="10 8 16 12 10 16 10 8" fill="#a3a3a3" stroke="none"/>
    </svg>
  ),
  // Document with folded corner — View resume
  resume: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#a3a3a3" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14 2 14 8 20 8"/>
      <line x1="9" y1="13" x2="15" y2="13"/>
      <line x1="9" y1="17" x2="13" y2="17"/>
    </svg>
  ),
  // Expand arrows — Theater mode
  expand: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#a3a3a3" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 3 21 3 21 9"/>
      <polyline points="9 21 3 21 3 15"/>
      <line x1="21" y1="3" x2="14" y2="10"/>
      <line x1="3" y1="21" x2="10" y2="14"/>
    </svg>
  ),
  // Calendar — Book a call
  calendar: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#a3a3a3" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2"/>
      <line x1="16" y1="2" x2="16" y2="6"/>
      <line x1="8" y1="2" x2="8" y2="6"/>
      <line x1="3" y1="10" x2="21" y2="10"/>
    </svg>
  ),
  // Compass — What is Joon up to
  compass: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#a3a3a3" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" fill="none"/>
    </svg>
  ),
  // Download arrow — Time capsule
  download: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#a3a3a3" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
      <polyline points="7 10 12 15 17 10"/>
      <line x1="12" y1="15" x2="12" y2="3"/>
    </svg>
  ),
  // Speaker — Pronounce name
  speaker: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#a3a3a3" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill="none"/>
      <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
      <path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>
    </svg>
  ),
  // Paper airplane — Send a Wuphf
  paperPlane: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#a3a3a3" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="22" y1="2" x2="11" y2="13"/>
      <polygon points="22 2 15 22 11 13 2 9 22 2" fill="none"/>
    </svg>
  ),
  // Pen writing — Sign guestbook
  pen: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#a3a3a3" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 3a2.83 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5z"/>
    </svg>
  ),
};

export const ShortcutsModalContent = ({ isMac, onAction, onClose }) => {
  const { playClick } = useSounds();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);
  const listRef = useRef(null);
  const isKeyboardNavRef = useRef(false);
  const suppressMouseRef = useRef(false);
  const [isScrolledToBottom, setIsScrolledToBottom] = useState(false);
  const [placeholder, setPlaceholder] = useState('');

  const PHRASES = [
    'Scotland 2025',
    'Leave a message',
    'Notes on disappearing',
    'Student Machines',
    'Book a call',
    'Seoul photos',
    'Perplexity campaign',
    'Coffee order',
    'Sign the guestbook',
    'What I use',
    'Current playlist',
    'View resume',
    'Chess rating',
    'Japan trip',
  ];

  useEffect(() => {
    // Only animate placeholder when input is empty and unfocused
    let cancelled = false;
    let phraseIndex = 0;
    let charIndex = 0;
    let isDeleting = false;
    let timeoutId;

    const tick = () => {
      if (cancelled) return;
      const phrase = PHRASES[phraseIndex];

      if (!isDeleting) {
        charIndex++;
        setPlaceholder(phrase.slice(0, charIndex));
        if (charIndex === phrase.length) {
          // Fully typed — pause before deleting
          timeoutId = setTimeout(() => { isDeleting = true; tick(); }, 2000);
          return;
        }
        // Vary speed slightly for natural feel
        const typeSpeed = 55 + Math.random() * 30;
        timeoutId = setTimeout(tick, typeSpeed);
      } else {
        charIndex--;
        setPlaceholder(phrase.slice(0, charIndex));
        if (charIndex === 0) {
          // Fully deleted — pause then move to next phrase
          isDeleting = false;
          phraseIndex = (phraseIndex + 1) % PHRASES.length;
          timeoutId = setTimeout(tick, 450);
          return;
        }
        timeoutId = setTimeout(tick, 28);
      }
    };

    // Initial delay before starting
    timeoutId = setTimeout(tick, 900);
    return () => { cancelled = true; clearTimeout(timeoutId); };
  }, []);

  const handleAction = (action, payload) => {
    playClick();
    if (onAction) onAction(action, payload);
  };

  // Auto-focus search input on mount
  useEffect(() => {
    const timer = setTimeout(() => inputRef.current?.focus(), 50);
    return () => clearTimeout(timer);
  }, []);

  const sections = [
    {
      label: 'Navigation',
      items: [
        { icon: PaletteIcons.book, label: 'Read latest writing', subtitle: 'Notes on disappearing (03.03.25)', href: '#' },
        { icon: PaletteIcons.video, label: 'Watch recent video', subtitle: 'scotland-2025.mp4', href: '#' },
      ],
    },
    {
      label: 'Actions',
      items: [
        { icon: PaletteIcons.resume, label: 'View resume', action: () => handleAction('viewResume') },
        { icon: PaletteIcons.calendar, label: 'Book a call (30 mins)', href: '#' },
        { icon: PaletteIcons.expand, label: 'Enter theater mode', action: () => handleAction('enterTheaterMode') },
      ],
    },
    {
      label: 'Miscellaneous',
      items: [
        { icon: PaletteIcons.download, label: 'Download time capsule', action: () => handleAction('downloadTimeCapsule') },
        { icon: PaletteIcons.speaker, label: 'How to pronounce my name', action: () => handleAction('pronounceName') },
        { icon: PaletteIcons.paperPlane, label: 'Send a Wuphf', action: () => handleAction('sendWuphf') },
        { icon: PaletteIcons.pen, label: 'Sign guestbook', action: () => handleAction('signGuestbook') },
      ],
    },
  ];

  // Filter sections by query
  const q = query.toLowerCase().trim();
  const filteredSections = sections
    .map(section => ({
      ...section,
      items: q
        ? section.items.filter(item =>
            item.label.toLowerCase().includes(q) ||
            (item.subtitle && item.subtitle.toLowerCase().includes(q))
          )
        : section.items,
    }))
    .filter(section => section.items.length > 0);

  // Flat list of visible items for keyboard nav
  const flatItems = filteredSections.flatMap(s => s.items);

  // Reset selectedIndex when query changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Scroll selected row into view — only on keyboard nav, not mouse hover
  useEffect(() => {
    if (!isKeyboardNavRef.current) return;
    isKeyboardNavRef.current = false;
    const list = listRef.current;
    if (!list) return;
    if (selectedIndex === 0) {
      list.scrollTop = 0;
      return;
    }
    const rows = list.querySelectorAll('[data-shortcut-row]');
    // Last item: scroll fully to bottom so it isn't clipped
    if (selectedIndex === flatItemsRef.current.length - 1) {
      list.scrollTop = list.scrollHeight;
      return;
    }
    if (rows[selectedIndex]) {
      rows[selectedIndex].scrollIntoView({ block: 'nearest' });
    }
  }, [selectedIndex]);

  // Keep refs current for the document-level keydown listener
  const flatItemsRef = useRef(flatItems);
  const selectedIndexRef = useRef(selectedIndex);
  const queryRef = useRef(query);
  flatItemsRef.current = flatItems;
  selectedIndexRef.current = selectedIndex;
  queryRef.current = query;

  // Document-level keydown — works regardless of focus
  useEffect(() => {
    const handleKeyDown = (e) => {
      const items = flatItemsRef.current;
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        isKeyboardNavRef.current = true;
        suppressMouseRef.current = true;
        setSelectedIndex(prev => items.length ? (prev + 1) % items.length : 0);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        isKeyboardNavRef.current = true;
        suppressMouseRef.current = true;
        setSelectedIndex(prev => items.length ? (prev - 1 + items.length) % items.length : 0);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const item = items[selectedIndexRef.current];
        if (item) {
          playClick();
          if (item.href) {
            window.open(item.href, '_blank', 'noopener,noreferrer');
          } else if (item.action) {
            item.action();
          }
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        if (queryRef.current) {
          setQuery('');
          inputRef.current?.focus();
        } else if (onClose) {
          onClose();
        }
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose, playClick]);

  // Render filtered sections with flat index tracking
  let flatIndex = 0;
  const renderFilteredSections = () => {
    flatIndex = 0;
    return filteredSections.map((section, sIdx) => {
      const sectionRows = section.items.map((item) => {
        const currentFlatIndex = flatIndex;
        flatIndex++;
        return (
          <ShortcutRow
            key={`${section.label}-${item.label}`}
            icon={item.icon}
            label={item.label}
            subtitle={item.subtitle}
            keys={item.keys}
            isMac={isMac}
            onClick={item.action}
            href={item.href}
            isSelected={currentFlatIndex === selectedIndex}
            onMouseEnter={() => { if (!suppressMouseRef.current) setSelectedIndex(currentFlatIndex); }}
          />
        );
      });
      const isLast = sIdx === filteredSections.length - 1;
      return (
        <div key={section.label}>
          <div className="px-[14px] pb-[6px]">
            <span className="section-label">{section.label}</span>
          </div>
          {sectionRows}
          {!isLast && (
            <div className="w-full border-t border-dashed border-[#EBEEF5] my-[8px]" />
          )}
        </div>
      );
    });
  };

  return (
    <div className="flex flex-col items-center">
      {/* Inner white card */}
      <div className="shortcuts-palette-inner w-[355px] max-w-[calc(100vw-48px)]">
        {/* Search input */}
        <div className="px-[12px] pt-[12px] pb-[10px]" style={{ borderBottom: '1px solid rgba(235, 238, 245, 0.85)' }}>
          <div className="flex items-center gap-[8px] rounded-[8px] px-[10px] py-[8px]" style={{ background: '#f5f5f5', boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.06)', border: '1px solid #e0e0e0' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#a3a3a3" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
              <circle cx="11" cy="11" r="8"/>
              <line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder={placeholder}
              className="shortcuts-palette-search-input font-graphik text-[14px] text-[#444] bg-transparent outline-none w-full placeholder-[#b3b3b3]"
            />
          </div>
        </div>

        {/* Items list — height clips last visible item mid-row to hint scrollability */}
        <div className="shortcuts-palette-list-wrapper">
          <div
            ref={listRef}
            className="shortcuts-palette-list pt-[10px] pb-[10px] flex flex-col"
            onMouseMove={() => { suppressMouseRef.current = false; }}
            onScroll={(e) => {
              const el = e.target;
              setIsScrolledToBottom(el.scrollTop + el.clientHeight >= el.scrollHeight - 5);
            }}
          >
            {flatItems.length > 0 ? (
              renderFilteredSections()
            ) : (
              <div className="flex items-center justify-center py-[24px]">
                <span className="font-graphik text-[13px] text-[#ababab]">No results found</span>
              </div>
            )}
          </div>
          {!isScrolledToBottom && <div className="shortcuts-palette-list-fade" />}
        </div>
      </div>

      {/* Footer keyboard hints */}
      <div className="shortcuts-palette-footer">
        <div className="footer-hint">
          <kbd className="footer-kbd">↑↓</kbd>
          <span>navigate</span>
        </div>
        <span className="footer-dot" />
        <div className="footer-hint">
          <kbd className="footer-kbd" style={{ paddingTop: '2px' }}>↵</kbd>
          <span>open</span>
        </div>
        <span className="footer-dot" />
        <div className="footer-hint">
          <kbd className="footer-kbd">esc</kbd>
          <span>close</span>
        </div>
      </div>
    </div>
  );
};

// Module-level variable: persists panel state across component unmounts/remounts
// (switching modals, closing and reopening). Resets only on page refresh.
let _persistedContactPanel = null;

export const ContactModalContent = ({ darkMode = false }) => {
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [emailHover, setEmailHover] = useState(false);
  const [hoveredRow, setHoveredRow] = useState(null);
  const [activePanel, setActivePanel] = useState(_persistedContactPanel);
  const composing = activePanel === 'msg';
  const showMore = activePanel === 'ext';
  const showQR = activePanel === 'bot';
  const togglePanel = (panel) => {
    playClick();
    setScrolledToBottom(false);
    const next = activePanel === panel ? null : panel;
    _persistedContactPanel = next;
    setActivePanel(next);
  };
  const [message, setMessage] = useState('');
  const [sendState, setSendState] = useState('idle'); // idle | sending | sent | error
  const [scrolledToBottom, setScrolledToBottom] = useState(false);
  const scrollRef = useRef(null);
  const { playClick } = useSounds();

  // Track scroll position to hide fade when at bottom
  const handleContactScroll = (e) => {
    const el = e.target;
    setScrolledToBottom(el.scrollTop + el.clientHeight >= el.scrollHeight - 5);
  };

  // Check if device is mobile/tablet
  const isMobileOrTablet = /iPhone|iPad|iPod|Android|webOS|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

  const handleCopyEmail = async () => {
    playClick();

    try {
      await navigator.clipboard.writeText('changjoonseo126@gmail.com');
      setCopiedEmail(true);
      setTimeout(() => setCopiedEmail(false), 1500);
    } catch (err) {
      // Fallback for browsers that block clipboard API
      window.location.href = 'mailto:changjoonseo126@gmail.com';
    }
  };

  const handleEmailMouseEnter = () => {
    if (!isMobileOrTablet) {
      setEmailHover(true);
    }
    setHoveredRow('email');
  };

  const handleEmailMouseLeave = () => {
    setEmailHover(false);
    setHoveredRow(null);
  };

  // Get the email description text based on state
  const getEmailDescription = () => {
    if (copiedEmail) return isMobileOrTablet ? 'Copied! Talk soon :)' : 'Send me a digital raven';
    if (emailHover && !isMobileOrTablet) return 'Copy address';
    return 'changjoonseo126@gmail.com';
  };

  // Get the email description color based on state
  const getEmailDescriptionColor = () => {
    if (copiedEmail) return '#5AABEE';
    return '#ababab';
  };

  const contactItems = [
    {
      id: 'email',
      title: 'Email',
      Icon: MailIcon,
      onClick: handleCopyEmail,
    },
    {
      id: 'instagram',
      title: 'Instagram',
      description: '@joonseochang',
      Icon: InstagramIcon,
      href: isMobileOrTablet ? 'instagram://user?username=joonseochang' : 'https://instagram.com/joonseochang',
    },
    {
      id: 'linkedin',
      title: 'LinkedIn',
      description: '/in/joonseo-chang',
      Icon: LinkedInIcon,
      href: isMobileOrTablet ? 'linkedin://in/joonseo-chang' : 'https://linkedin.com/in/joonseo-chang',
    },
    {
      id: 'twitter',
      title: 'Twitter',
      description: '@joonseochang',
      Icon: TwitterIcon,
      href: isMobileOrTablet ? 'twitter://user?screen_name=joonseochang' : 'https://twitter.com/joonseochang',
    },
  ];

  const extraItems = [
    {
      id: 'letterboxd',
      title: 'Letterboxd',
      description: '/joonseochang',
      Icon: LetterboxdIcon,
      href: 'https://letterboxd.com/joonseochang',
    },
    {
      id: 'github',
      title: 'GitHub',
      description: '@joonseochang',
      Icon: GitHubIcon,
      href: 'https://github.com/joonseochang',
    },
    {
      id: 'chess',
      title: 'Chess',
      description: 'chess.com',
      Icon: ChessIcon,
      href: 'https://chess.com/member/joonseochang',
    },
    {
      id: 'hinge',
      title: 'Hinge',
      description: 'Designed to be deleted',
      Icon: HingeIcon,
      href: 'https://www.airbnb.com/users/profile/1495771288037820635',
    },
    {
      id: 'spotify',
      title: 'Spotify',
      description: '@joonseochang',
      Icon: SpotifyIcon,
      href: 'https://open.spotify.com/user/joonseochang',
    },
  ];

  const linkCount = contactItems.length + (showMore ? extraItems.length : 0);
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent('https://joonseochang.com')}&bgcolor=fafafa&color=333333&margin=8`;

  const handleSend = async () => {
    if (!message.trim() || sendState === 'sending') return;
    setSendState('sending');
    try {
      const res = await fetch('/.netlify/functions/send-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: message.trim() }),
      });
      if (!res.ok) throw new Error();
      setSendState('sent');
      setTimeout(() => {
        setActivePanel(null);
        setMessage('');
        setSendState('idle');
      }, 1500);
    } catch {
      setSendState('error');
      setTimeout(() => setSendState('idle'), 2000);
    }
  };

  // Render a contact row (shared between main + extra items)
  const renderContactRow = (item, showDividerAfter) => (
    <div key={item.title} className="contents">
      {item.onClick ? (
        <button
          onClick={item.onClick}
          onMouseEnter={handleEmailMouseEnter}
          onMouseLeave={handleEmailMouseLeave}
          className="contact-row w-full cursor-pointer text-left relative"
        >
          <div className="contact-row-inner w-full flex items-center gap-[10px] px-[10px] py-[4px] rounded-[10px]">
            <div className={`contact-icon-box contact-icon-${item.id} w-[37px] h-[35px] flex items-center justify-center rounded-[8px] shrink-0`}>
              <item.Icon hovered={hoveredRow === item.id} />
            </div>
            <div className="flex flex-col overflow-hidden">
              <span className="font-graphik text-[14px] leading-[18px] text-[#444]">
                {item.title}
              </span>
              <span
                className="font-graphik text-[14px] leading-[20px] transition-all duration-200 ease-out"
                style={{ color: getEmailDescriptionColor() }}
              >
                {getEmailDescription()}
              </span>
            </div>
          </div>
        </button>
      ) : (
        <a
          href={item.href}
          target={isMobileOrTablet ? "_self" : "_blank"}
          rel="noopener noreferrer"
          onClick={() => playClick()}
          onMouseEnter={() => setHoveredRow(item.id)}
          onMouseLeave={() => setHoveredRow(null)}
          className="contact-row w-full cursor-pointer relative"
        >
          <div className="contact-row-inner w-full flex items-center gap-[10px] px-[10px] py-[4px] rounded-[10px]">
            {item.Icon ? (
              <div className={`contact-icon-box contact-icon-${item.id} w-[37px] h-[35px] flex items-center justify-center rounded-[8px] shrink-0`}>
                <item.Icon hovered={hoveredRow === item.id} />
              </div>
            ) : (
              <div className={`contact-icon-box contact-icon-${item.id} w-[37px] h-[35px] flex items-center justify-center rounded-[8px] shrink-0`}>
                <span className="font-graphik text-[11px] text-[#a3a3a3] uppercase tracking-wide">{item.title.slice(0, 2)}</span>
              </div>
            )}
            <div className="flex flex-col">
              <span className="font-graphik text-[14px] leading-[18px] text-[#444]">
                {item.title}
              </span>
              <span className="font-graphik text-[14px] leading-[20px] text-[#ababab]">
                {item.description}
              </span>
            </div>
          </div>
        </a>
      )}
      {showDividerAfter && (
        <div className="w-full border-t border-dashed border-[#EBEEF5]" />
      )}
    </div>
  );

  return (
    <div className="flex flex-col items-center">
      {/* Inner card - skeuomorphic white card */}
      <div className="contact-modal-inner w-[280px]">

        {/* Contact links view */}
        {!composing && (
          <div className="contact-scroll-wrapper" style={{ position: 'relative' }}>
            <div
              ref={showMore ? scrollRef : undefined}
              onScroll={showMore ? handleContactScroll : undefined}
              className={`contact-view-anim pt-[12px] pb-[10px] flex flex-col items-center gap-[10px]${showMore ? ' contact-scrollable' : ''}`}
            >
              {contactItems.map((item, index) =>
                renderContactRow(item, index < contactItems.length - 1 || showMore)
              )}
              {showMore && extraItems.map((item, index) =>
                renderContactRow(item, index < extraItems.length - 1)
              )}
            </div>
            {showMore && !scrolledToBottom && <div className="contact-scroll-fade" />}
          </div>
        )}

        {/* Compose view */}
        {composing && (
          <div className="contact-view-anim py-[15px] px-[15px] flex flex-col gap-[10px]">
            <div className="flex flex-col gap-[2px]">
              <span className="font-graphik text-[14px] font-medium text-[#1a1a1a]">Leave a message</span>
              <span className="font-graphik text-[12px] text-[#b3b3b3]">I'll get back to you by email.</span>
            </div>
            <textarea
              className="contact-compose-textarea font-graphik text-[14px] text-[#5b5b5e] h-[110px] rounded-[10px] p-[10px] resize-none outline-none w-full"
              placeholder="Write something..."
              value={message}
              onChange={e => setMessage(e.target.value)}
              maxLength={1000}
              autoFocus
            />
            <button
              className={`contact-send-btn w-full h-[34px] rounded-[10px] font-graphik text-[14px]${sendState === 'sent' ? ' sent' : sendState === 'error' ? ' error' : ''}`}
              onClick={handleSend}
              disabled={!message.trim() || sendState === 'sending' || sendState === 'sent'}
            >
              {sendState === 'sending' ? 'Sending...' : sendState === 'sent' ? 'Sent!' : sendState === 'error' ? 'Failed — try again' : 'Send'}
            </button>
          </div>
        )}

      </div>

      {/* TE-inspired control strip */}
      <div className="te-strip flex items-center justify-end pt-[8px] pb-[9px] px-[14px] w-full" style={{ position: 'relative' }}>
        {/* QR popover */}
        {showQR && (
          <div className="te-qr-popover">
            <img src={qrUrl} width={120} height={120} alt="QR code" />
          </div>
        )}
        <div className="flex items-center gap-[5px]">
          <button
            className={`te-btn te-btn-ext${showMore ? ' on' : ''}`}
            onClick={() => togglePanel('ext')}
          >
            <span className="te-led" />
            <span className="te-btn-label">ext</span>
          </button>
          <button
            className={`te-btn te-btn-msg${composing ? ' on' : ''}`}
            onClick={() => togglePanel('msg')}
          >
            <span className="te-led" />
            <span className="te-btn-label">msg</span>
          </button>
          <button
            className={`te-btn te-btn-bot${showQR ? ' on' : ''}`}
            onClick={() => togglePanel('bot')}
          >
            <span className="te-led" />
            <span className="te-btn-label">bot</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default SlideUpModal;
