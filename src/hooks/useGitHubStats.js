import { useState, useEffect } from 'react';

const CACHE_KEY = 'github-stats-cache';

// Max age for localStorage cache (10 minutes)
const MAX_CACHE_AGE_MS = 10 * 60 * 1000;

// Read cached stats from localStorage (only if not too old)
function getCachedStats() {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (!cached) return null;
    const parsed = JSON.parse(cached);
    // Ignore cache if older than MAX_CACHE_AGE_MS
    if (parsed.cachedAt && Date.now() - parsed.cachedAt > MAX_CACHE_AGE_MS) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

// Write stats to localStorage
function setCachedStats(stats) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({
      ...stats,
      cachedAt: Date.now(),
    }));
  } catch {
    // localStorage full or unavailable — ignore
  }
}

// GitHub stats hook to fetch weekly commit statistics
// Falls back to last cached stats when the API is unreachable
export function useGitHubStats() {
  const [stats, setStats] = useState(() => getCachedStats());
  const [isLoading, setIsLoading] = useState(!getCachedStats());
  const [error, setError] = useState(null);

  const fetchStats = async () => {
    if (!stats) {
      setIsLoading(true);
    }

    try {
      // Add cache-busting param to bypass stale edge cache
      const cacheBuster = Math.floor(Date.now() / 60000); // Changes every minute
      const response = await fetch(`/.netlify/functions/get-github-stats?_=${cacheBuster}`);

      if (!response.ok) {
        throw new Error(`API returned ${response.status}`);
      }

      const data = await response.json();

      // If the API returned an error field, treat as failure
      if (data.error) {
        throw new Error(data.error);
      }

      const freshStats = {
        added: data.added || 0,
        deleted: data.deleted || 0,
        pushCount: data.pushCount || 0,
        weekStart: data.weekStart,
        lastCommitAt: data.lastCommitAt,
        partial: data.partial || false,
      };

      // Only update cache if we got real data (not all zeros from a partial failure)
      if (!data.partial || freshStats.added > 0 || freshStats.deleted > 0) {
        setStats(freshStats);
        setCachedStats(freshStats);
      }
      setError(null);
    } catch (err) {
      setError(err.message);
      // Keep existing stats on error (either fresh or cached)
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();

    // Refresh every 10 minutes
    const interval = setInterval(fetchStats, 10 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  // In dev (no Netlify functions), provide fallback so UI is visible
  const effectiveStats = stats || (error && !isLoading ? {
    added: 0,
    deleted: 0,
    pushCount: 0,
    weekStart: new Date().toISOString(),
    lastCommitAt: new Date().toISOString(),
    partial: true,
  } : null);

  return {
    stats: effectiveStats,
    isLoading,
    error,
    refresh: fetchStats,
  };
}
