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

const SlideUpModal = ({ isOpen, onClose, type, anchorRef, darkMode = false, children }) => {
  const [position, setPosition] = useState({ left: 0 });
  const popoverRef = useRef(null);
  const isMobile = useMediaQuery('(max-width: 813px)');

  // Calculate position based on anchor button
  useEffect(() => {
    const updatePosition = () => {
      if (isOpen && anchorRef?.current) {
        const rect = anchorRef.current.getBoundingClientRect();
        const buttonCenterX = rect.left + rect.width / 2;
        setPosition({ left: buttonCenterX });
      }
    };

    updatePosition();

    // Update position on window resize
    window.addEventListener('resize', updatePosition);
    return () => window.removeEventListener('resize', updatePosition);
  }, [isOpen, anchorRef, type]);

  // Click outside to close
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e) => {
      // Don't close if clicking inside the modal
      if (popoverRef.current?.contains(e.target)) {
        return;
      }

      // Don't close if clicking on the anchor button (toggling is handled by button's onClick)
      if (anchorRef?.current?.contains(e.target)) {
        return;
      }

      // For contact modal, close on any other outside click
      if (type === 'contact') {
        onClose();
        return;
      }

      // For other modals, don't close if clicking on bottom pill
      const bottomPill = e.target.closest('.bottom-pill-container');
      if (!bottomPill) {
        onClose();
      }
    };

    // Use a small delay to avoid immediate close when opening
    const timer = setTimeout(() => {
      document.addEventListener('click', handleClickOutside, true);
    }, 0);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('click', handleClickOutside, true);
    };
  }, [isOpen, onClose, type, anchorRef]);

  // Get modal title based on type
  const getTitle = () => {
    switch (type) {
      case 'music': return 'Now Playing';
      case 'activity': return 'Activity';
      case 'shortcuts': return 'Keyboard Shortcuts';
      case 'contact': return 'Get in Touch';
      default: return '';
    }
  };

  // Contact modal has a different design (no header)
  const isContactModal = type === 'contact';

  // Mobile: Same slide-up popover as desktop, but anchored to pill center
  if (isMobile) {
    return (
      <AnimatePresence mode="wait">
        {isOpen && (
          <motion.div
            ref={popoverRef}
            key={type}
            className="fixed z-[200]"
            style={{
              bottom: 'calc(24px + 64px + 10px)',
              left: '50%',
              x: '-50%',
              maxWidth: 'calc(100vw - 32px)'
            }}
            initial={isContactModal
              ? { opacity: 0, y: 24 }
              : { opacity: 0, y: 32, filter: 'blur(2px)' }
            }
            animate={isContactModal
              ? { opacity: 1, y: 0 }
              : { opacity: 1, y: 0, filter: 'blur(0px)' }
            }
            exit={isContactModal
              ? { opacity: 0, y: 16 }
              : { opacity: 0, y: 20, filter: 'blur(2px)' }
            }
            transition={isContactModal
              ? {
                  type: 'spring',
                  stiffness: 400,
                  damping: 35,
                  mass: 0.8
                }
              : {
                  type: 'tween',
                  duration: 0.25,
                  ease: [0.25, 0.46, 0.45, 0.94]
                }
            }
          >
            {isContactModal ? (
              <div className="contact-modal-outer rounded-[18px] flex justify-center">
                {children}
              </div>
            ) : (
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
                <div className="p-5 overflow-y-auto" style={{ maxHeight: 'calc(70vh - 60px)' }}>
                  {children}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    );
  }

  // Desktop: Original popover positioned above bottom pill
  return (
    <AnimatePresence mode="wait">
      {isOpen && (
        <motion.div
          ref={popoverRef}
          key={type}
          className="fixed z-[200]"
          style={{
            bottom: 'calc(50px + 64px + 10px)',
            left: position.left,
            x: '-50%'
          }}
          initial={isContactModal
            ? { opacity: 0, y: 24 }
            : { opacity: 0, y: 32, filter: 'blur(2px)' }
          }
          animate={isContactModal
            ? { opacity: 1, y: 0 }
            : { opacity: 1, y: 0, filter: 'blur(0px)' }
          }
          exit={isContactModal
            ? { opacity: 0, y: 16 }
            : { opacity: 0, y: 20, filter: 'blur(2px)' }
          }
          transition={isContactModal
            ? {
                type: 'spring',
                stiffness: 400,
                damping: 35,
                mass: 0.8
              }
            : {
                type: 'tween',
                duration: 0.25,
                ease: [0.25, 0.46, 0.45, 0.94]
              }
          }
        >
          {isContactModal ? (
            // Contact modal - skeuomorphic design
            <div className="contact-modal-outer rounded-[18px] flex justify-center">
              {children}
            </div>
          ) : (
            // Default modal with header
            <div className="bg-white rounded-[16px] shadow-[0_8px_40px_rgba(0,0,0,0.12),0_2px_8px_rgba(0,0,0,0.08)] overflow-hidden border border-black/[0.04]">
              {/* Header */}
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

              {/* Content */}
              <div className="p-5">
                {children}
              </div>
            </div>
          )}
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
        <p className="font-graphik text-[11px] text-[#999] uppercase tracking-wide px-1 mb-2">Recently Played</p>
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
                <p className="font-graphik text-[11px] text-[#999] truncate">{track.artist}</p>
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
        href="https://www.last.fm/user/joonzambia123"
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center gap-2 mt-4 pt-3 border-t border-black/[0.04] font-graphik text-[12px] text-[#999] hover:text-[#666] transition-colors"
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
        <span className="font-graphik text-[11px] text-[#999] uppercase tracking-wide">This Week</span>
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
            <p className="font-graphik text-[11px] text-[#999] mt-0.5">{activity.time}</p>
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

export const ShortcutsModalContent = ({ isMac }) => (
  <div className="w-[300px] space-y-2">
    {[
      { keys: isMac ? ['⌘', 'K'] : ['Ctrl', 'K'], action: 'Quick actions' },
      { keys: isMac ? ['⌘', '/'] : ['Ctrl', '/'], action: 'Search' },
      { keys: ['←', '→'], action: 'Navigate videos' },
      { keys: ['Space'], action: 'Play/Pause music' },
      { keys: ['Esc'], action: 'Close modal' },
      { keys: isMac ? ['⌘', 'D'] : ['Ctrl', 'D'], action: 'Toggle dark mode' },
    ].map((shortcut, i) => (
      <div key={i} className="flex items-center justify-between py-2 px-1">
        <span className="font-graphik text-[13px] text-[#666]">{shortcut.action}</span>
        <div className="flex gap-1">
          {shortcut.keys.map((key, j) => (
            <kbd
              key={j}
              className="min-w-[24px] h-6 px-1.5 rounded-[5px] bg-[#f0f0f0] border border-[#ddd] border-b-2 font-graphik text-[11px] text-[#555] flex items-center justify-center"
            >
              {key}
            </kbd>
          ))}
        </div>
      </div>
    ))}
  </div>
);

export const ContactModalContent = ({ darkMode = false }) => {
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [emailHover, setEmailHover] = useState(false);
  const [hoveredRow, setHoveredRow] = useState(null);
  const [activePanel, setActivePanel] = useState(null); // null | 'msg' | 'ext' | 'bot'
  const composing = activePanel === 'msg';
  const showMore = activePanel === 'ext';
  const showQR = activePanel === 'bot';
  const togglePanel = (panel) => { playClick(); setActivePanel(prev => prev === panel ? null : panel); };
  const [message, setMessage] = useState('');
  const [sendState, setSendState] = useState('idle'); // idle | sending | sent | error
  const { playClick } = useSounds();

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
    return '#B7B7B9';
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
      id: 'github',
      title: 'GitHub',
      description: '@joonseochang',
      href: 'https://github.com/joonseochang',
    },
    {
      id: 'readcv',
      title: 'Read.cv',
      description: '/joonseochang',
      href: 'https://read.cv/joonseochang',
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
              <span className="font-graphik text-[14px] leading-[18px] text-[#333333]">
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
              <span className="font-graphik text-[14px] leading-[18px] text-[#333333]">
                {item.title}
              </span>
              <span className="font-graphik text-[14px] leading-[20px] text-[#B7B7B9]">
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
          <div className="contact-view-anim pt-[15px] pb-[10px] flex flex-col items-center gap-[10px]">
            {contactItems.map((item, index) =>
              renderContactRow(item, index < contactItems.length - 1 || showMore)
            )}
            {showMore && extraItems.map((item, index) =>
              renderContactRow(item, index < extraItems.length - 1)
            )}
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
            className={`te-btn${composing ? ' on' : ''}`}
            onClick={() => togglePanel('msg')}
          >
            <span className="te-led" />
            <span className="te-btn-label">msg</span>
          </button>
          <button
            className={`te-btn${showMore ? ' on' : ''}`}
            onClick={() => togglePanel('ext')}
          >
            <span className="te-led" />
            <span className="te-btn-label">ext</span>
          </button>
          <button
            className={`te-btn${showQR ? ' on' : ''}`}
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
