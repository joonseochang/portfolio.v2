import { useState, useEffect } from 'react';

// Module-level cache — persists across unmount/remount, resets on page reload
let visitorCoordsCache = null;

function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function roundDistance(km) {
  if (km >= 100) return Math.round(km / 50) * 50;
  return Math.round(km / 10) * 10;
}

/**
 * useVisitorDistance - fetches visitor IP location and computes distance to target
 * @param {Object} options
 * @param {number} options.targetLat - destination latitude
 * @param {number} options.targetLng - destination longitude
 * @param {boolean} options.enabled - only fetch when true (lazy load)
 * @returns {{ distance: number | null }}
 */
export function useVisitorDistance({ targetLat, targetLng, enabled }) {
  const [distance, setDistance] = useState(null);

  useEffect(() => {
    if (!enabled || !targetLat || !targetLng) return;

    // If we already have cached visitor coords, compute immediately
    if (visitorCoordsCache) {
      const km = haversineKm(visitorCoordsCache.lat, visitorCoordsCache.lng, targetLat, targetLng);
      setDistance(roundDistance(km));
      return;
    }

    let cancelled = false;

    const fetchVisitorLocation = async () => {
      try {
        const res = await fetch('https://ipapi.co/json/');
        if (!res.ok) return;
        const data = await res.json();
        if (cancelled) return;

        const lat = data.latitude;
        const lng = data.longitude;
        if (typeof lat !== 'number' || typeof lng !== 'number') return;

        visitorCoordsCache = { lat, lng };
        const km = haversineKm(lat, lng, targetLat, targetLng);
        setDistance(roundDistance(km));
      } catch {
        // Graceful: distance stays null, sentence is omitted
      }
    };

    fetchVisitorLocation();
    return () => { cancelled = true; };
  }, [targetLat, targetLng, enabled]);

  return { distance };
}
