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

export function useCoinCapPrices(ids: string[], refreshMs = 8000) {
  const [prices, setPrices] = useState<PriceMap>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Stabilize idsKey based on content, not array reference
  const idsKey = useMemo(() => JSON.stringify(ids.slice().sort()), [ids]);
  const idsJoined = useMemo(() => ids.join(','), [ids]);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastFetchTimeRef = useRef<number>(0);
  const isMountedRef = useRef(true);
  const abortRef = useRef<AbortController | null>(null);

  const fetchPrices = useCallback(async (forceRefresh = false) => {
    try {
      const now = Date.now();
      if (!forceRefresh && now - lastFetchTimeRef.current < 1000) {
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
      const nextPrices: PriceMap = {};

      if (json.data && Array.isArray(json.data)) {
        json.data.forEach((asset) => {
          nextPrices[asset.id] = {
            priceUsd: Number(asset.priceUsd),
            changePercent24Hr: Number(asset.changePercent24Hr),
            high24Hr: asset.high24Hr ? Number(asset.high24Hr) : undefined,
            low24Hr: asset.low24Hr ? Number(asset.low24Hr) : undefined,
            volume24Hr: asset.volume24Hr ? Number(asset.volume24Hr) : undefined,
            marketCap: asset.marketCap ? Number(asset.marketCap) : undefined,
          };
        });

        if (isMountedRef.current) {
          setPrices(nextPrices);
          setIsLoading(false);
          lastFetchTimeRef.current = now;
          
          if (typeof window !== 'undefined') {
            try {
              localStorage.setItem(STORAGE_KEY, JSON.stringify(nextPrices));
            } catch (e) {
              // localStorage full or unavailable
            }
          }
        }
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return;
      if (isMountedRef.current) {
        console.error('Error fetching prices:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
        setIsLoading(false);
      }
    }
  }, [idsJoined]);

  useEffect(() => {
    isMountedRef.current = true;

    let shouldFetchFresh = true;
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem(STORAGE_KEY);
        if (cached) {
          const cachedPrices = JSON.parse(cached);
          setPrices(cachedPrices);
          setIsLoading(false);
          shouldFetchFresh = false;
          lastFetchTimeRef.current = Date.now();
        }
      } catch (e) {
        // Ignore corrupted cache
      }
    }

    if (shouldFetchFresh) {
      fetchPrices(true);
    }

    const handleVisibilityChange = () => {
      if (document.hidden) {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      } else {
        const timeSinceLastFetch = Date.now() - lastFetchTimeRef.current;
        if (timeSinceLastFetch > 5000) {
          fetchPrices(true);
        }
        // Only create new interval if not already existing
        if (!intervalRef.current) {
          intervalRef.current = setInterval(() => {
            fetchPrices();
          }, refreshMs);
        }
      }
    };

    const handleWindowFocus = () => {
      const timeSinceLastFetch = Date.now() - lastFetchTimeRef.current;
      if (timeSinceLastFetch > 10000) {
        fetchPrices(true);
      }
    };

    intervalRef.current = setInterval(() => {
      fetchPrices();
    }, refreshMs);

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
