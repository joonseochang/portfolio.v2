import { useState, useEffect, useRef, useCallback } from 'react';

// Last.fm API hook to fetch recently played track with iTunes preview
export function useLastFm() {
  const [currentTrack, setCurrentTrack] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isDataComplete, setIsDataComplete] = useState(false);
  const audioRef = useRef(null);
  const fadeIntervalRef = useRef(null);
  const previousTrackRef = useRef(null);

  // Fetch iTunes preview URL for a track
  const getItunesPreview = async (trackName, artistName) => {
    try {
      // Clean up track name (remove features, remixes info in parentheses for better matching)
      const cleanTrackName = trackName.replace(/\s*\(.*?\)\s*/g, '').trim();
      const searchTerm = encodeURIComponent(`${artistName} ${cleanTrackName}`);

      const response = await fetch(
        `https://itunes.apple.com/search?term=${searchTerm}&media=music&entity=song&limit=5`
      );

      if (!response.ok) return null;

      const data = await response.json();

      if (data.results && data.results.length > 0) {
        // Try to find best match (prefer exact artist match)
        const exactMatch = data.results.find(
          r => r.artistName.toLowerCase() === artistName.toLowerCase()
        );
        const result = exactMatch || data.results[0];
        return result.previewUrl || null;
      }
      return null;
    } catch (err) {
      return null;
    }
  };

  // Get recently played track from Last.fm
  const getRecentlyPlayed = async () => {
    const apiKey = import.meta.env.VITE_LASTFM_API_KEY;
    const username = import.meta.env.VITE_LASTFM_USERNAME;

    if (!apiKey || !username) {
      setError('Missing Last.fm credentials in environment variables');
      setIsLoading(false);
      return;
    }

    // Only show loading state on initial fetch, not on refresh
    if (!currentTrack) {
      setIsLoading(true);
    }
    // Mark data as incomplete while fetching (to delay resize animation)
    setIsDataComplete(false);

    try {
      const response = await fetch(
        `https://ws.audioscrobbler.com/2.0/?method=user.getrecenttracks&user=${username}&api_key=${apiKey}&format=json&limit=1`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch from Last.fm');
      }

      const data = await response.json();

      if (data.error) {
        throw new Error(data.message || 'Last.fm API error');
      }

      if (data.recenttracks && data.recenttracks.track && data.recenttracks.track.length > 0) {
        const track = Array.isArray(data.recenttracks.track)
          ? data.recenttracks.track[0]
          : data.recenttracks.track;

        // Get the largest album art available
        const albumArt = track.image?.find(img => img.size === 'extralarge')?.['#text'] ||
                        track.image?.find(img => img.size === 'large')?.['#text'] ||
                        track.image?.find(img => img.size === 'medium')?.['#text'] ||
                        null;

        // Use medium or large for the vinyl (better quality than small)
        const albumArtSmall = track.image?.find(img => img.size === 'large')?.['#text'] ||
                              track.image?.find(img => img.size === 'medium')?.['#text'] ||
                              track.image?.find(img => img.size === 'small')?.['#text'] ||
                              albumArt;

        const trackName = track.name;
        const artistName = track.artist?.['#text'] || track.artist;

        // Check if track has changed (for smooth transitions)
        const trackChanged = previousTrackRef.current?.name !== trackName ||
                            previousTrackRef.current?.artist !== artistName;

        if (trackChanged && currentTrack) {
          previousTrackRef.current = currentTrack;
        }

        // Fetch iTunes preview URL
        const previewUrl = await getItunesPreview(trackName, artistName);

        // Preload album art before updating state
        const preloadImage = (src) => {
          return new Promise((resolve) => {
            if (!src) {
              resolve();
              return;
            }
            const img = new Image();
            img.onload = () => resolve();
            img.onerror = () => resolve(); // Resolve anyway on error
            img.src = src;
          });
        };

        // Preload the album art image used in the vinyl
        await preloadImage(albumArtSmall);

        setCurrentTrack({
          name: trackName,
          artist: artistName,
          album: track.album?.['#text'] || 'Unknown Album',
          albumArt: albumArt,
          albumArtSmall: albumArtSmall,
          playedAt: track.date?.uts ? new Date(track.date.uts * 1000).toISOString() : null,
          isNowPlaying: track['@attr']?.nowplaying === 'true',
          url: track.url,
          previewUrl: previewUrl
        });

        // Data is now complete - ready for resize animation
        setIsDataComplete(true);
      }

      setIsLoading(false);
      setError(null);
    } catch (err) {
      setError(err.message);
      setIsLoading(false);
      // Keep data complete if we had previous data (don't break existing display)
      if (currentTrack) {
        setIsDataComplete(true);
      }
    }
  };

  // Play preview with fade in
  const playPreview = useCallback(() => {
    if (!currentTrack?.previewUrl) return;

    // Create new audio element each time to avoid stale state
    if (audioRef.current) {
      audioRef.current.pause();
    }
    audioRef.current = new Audio(currentTrack.previewUrl);
    audioRef.current.volume = 0;

    // Clear any existing fade
    if (fadeIntervalRef.current) {
      clearInterval(fadeIntervalRef.current);
    }

    // Play and fade in
    audioRef.current.play().then(() => {
      setIsPlaying(true);
      // 10s ramp from 0 to 0.05
      const targetVolume = 0.05;
      const duration = 10000;
      const steps = 100;
      const stepTime = duration / steps;
      let currentStep = 0;

      fadeIntervalRef.current = setInterval(() => {
        currentStep++;
        if (currentStep >= steps || !audioRef.current) {
          if (audioRef.current) audioRef.current.volume = targetVolume;
          clearInterval(fadeIntervalRef.current);
        } else {
          // Linear ramp
          const progress = currentStep / steps;
          audioRef.current.volume = progress * targetVolume;
        }
      }, stepTime);
    }).catch(err => {
    });
  }, [currentTrack?.previewUrl]);

  // Stop preview with fade out
  const stopPreview = useCallback(() => {
    if (!audioRef.current) return;

    // Clear any existing fade
    if (fadeIntervalRef.current) {
      clearInterval(fadeIntervalRef.current);
    }

    // Fade out over 300ms
    const startVolume = audioRef.current.volume;
    const steps = 15;
    const stepTime = 300 / steps;
    const volumeStep = startVolume / steps;
    let currentStep = 0;

    fadeIntervalRef.current = setInterval(() => {
      currentStep++;
      if (currentStep >= steps) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        audioRef.current.volume = 0;
        setIsPlaying(false);
        clearInterval(fadeIntervalRef.current);
      } else {
        audioRef.current.volume = Math.max(startVolume - volumeStep * currentStep, 0);
      }
    }, stepTime);
  }, []);

  // Toggle preview playback
  const togglePreview = useCallback(() => {
    if (isPlaying) {
      stopPreview();
    } else {
      playPreview();
    }
  }, [isPlaying, stopPreview, playPreview]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (fadeIntervalRef.current) {
        clearInterval(fadeIntervalRef.current);
      }
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  // Fetch on mount and set up polling
  useEffect(() => {
    getRecentlyPlayed();

    // Poll every 30 seconds
    const interval = setInterval(() => {
      getRecentlyPlayed();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  return {
    currentTrack,
    isLoading,
    error,
    isPlaying,
    isDataComplete,
    playPreview,
    stopPreview,
    togglePreview,
    refresh: getRecentlyPlayed
  };
}
