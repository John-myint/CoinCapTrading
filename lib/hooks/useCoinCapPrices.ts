'use client';

import { useEffect, useCallback, useMemo, useRef, useState } from 'react';

type CoinCapAsset = {
  id: string;
  priceUsd: string;
  changePercent24Hr: string;
  high24Hr?: string;
  low24Hr?: string;
  volume24Hr?: string;
  marketCap?: string;
};

type PriceMap = Record<
  string,
  {
    priceUsd: number;
    changePercent24Hr: number;
    high24Hr?: number;
    low24Hr?: number;
    volume24Hr?: number;
    marketCap?: number;
  }
>;

const STORAGE_KEY = 'coincap_prices';
const STORAGE_TS_KEY = 'coincap_prices_ts';
const CACHE_MAX_AGE_MS = 60_000; // Reject localStorage cache older than 60s

export function useCoinCapPrices(ids: string[], refreshMs = 5000) {
  const [prices, setPrices] = useState<PriceMap>(() => {
    // Initialize from localStorage synchronously (SSR-safe)
    if (typeof window === 'undefined') return {};
    try {
      const cached = localStorage.getItem(STORAGE_KEY);
      const ts = localStorage.getItem(STORAGE_TS_KEY);
      if (cached && ts) {
        const age = Date.now() - Number(ts);
        if (age < CACHE_MAX_AGE_MS) {
          return JSON.parse(cached);
        }
        // Stale cache — clear it
        localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem(STORAGE_TS_KEY);
      }
    } catch {
      // Ignore corrupted cache
    }
    return {};
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const idsKey = useMemo(() => JSON.stringify(ids.slice().sort()), [ids]);
  const idsJoined = useMemo(() => ids.join(','), [ids]);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastFetchTimeRef = useRef<number>(0);
  const isMountedRef = useRef(true);
  const abortRef = useRef<AbortController | null>(null);
  const retryCountRef = useRef(0);

  const fetchPrices = useCallback(async (forceRefresh = false) => {
    try {
      const now = Date.now();
      // Throttle rapid calls (but not forced refreshes)
      if (!forceRefresh && now - lastFetchTimeRef.current < 2000) {
        return;
      }

      // Abort previous inflight request
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setError(null);
      const response = await fetch(`/api/prices?ids=${idsJoined}`, {
        signal: controller.signal,
        cache: 'no-store',
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const json = (await response.json()) as { data: CoinCapAsset[] };

      if (json.data && Array.isArray(json.data) && json.data.length > 0) {
        const nextPrices: PriceMap = {};
        json.data.forEach((asset) => {
          const priceNum = Number(asset.priceUsd);
          // Skip assets with zero/NaN price
          if (!priceNum || isNaN(priceNum)) return;
          nextPrices[asset.id] = {
            priceUsd: priceNum,
            changePercent24Hr: Number(asset.changePercent24Hr) || 0,
            high24Hr: asset.high24Hr ? Number(asset.high24Hr) : undefined,
            low24Hr: asset.low24Hr ? Number(asset.low24Hr) : undefined,
            volume24Hr: asset.volume24Hr ? Number(asset.volume24Hr) : undefined,
            marketCap: asset.marketCap ? Number(asset.marketCap) : undefined,
          };
        });

        if (Object.keys(nextPrices).length > 0 && isMountedRef.current) {
          setPrices(nextPrices);
          setIsLoading(false);
          lastFetchTimeRef.current = now;
          retryCountRef.current = 0;

          // Persist to localStorage with timestamp
          try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(nextPrices));
            localStorage.setItem(STORAGE_TS_KEY, String(now));
          } catch {
            // localStorage full or unavailable
          }
        }
      } else {
        // API returned empty data — bump retry
        throw new Error('API returned empty price data');
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return;
      if (isMountedRef.current) {
        console.warn('Price fetch error:', err instanceof Error ? err.message : err);
        setError(err instanceof Error ? err.message : 'Unknown error');
        setIsLoading(false);
        retryCountRef.current += 1;
      }
    }
  }, [idsJoined]);

  useEffect(() => {
    isMountedRef.current = true;
    retryCountRef.current = 0;

    // ALWAYS fetch fresh data on mount — cache is only initial state
    fetchPrices(true);

    const handleVisibilityChange = () => {
      if (document.hidden) {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      } else {
        fetchPrices(true);
        if (!intervalRef.current) {
          intervalRef.current = setInterval(() => fetchPrices(), refreshMs);
        }
      }
    };

    const handleWindowFocus = () => {
      fetchPrices(true);
    };

    intervalRef.current = setInterval(() => fetchPrices(), refreshMs);

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleWindowFocus);

    return () => {
      isMountedRef.current = false;
      abortRef.current?.abort();
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleWindowFocus);
    };
  }, [idsKey, refreshMs, fetchPrices]);

  return { prices, isLoading, error };
}
