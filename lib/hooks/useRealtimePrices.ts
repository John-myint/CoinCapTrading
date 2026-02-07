'use client';

import { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { CoinCapAsset } from '@/lib/types';

type PriceData = {
  priceUsd: number;
  changePercent24Hr: number;
};

type PriceMap = Record<string, PriceData>;

export function useRealtimePrices(ids: string[]) {
  const [prices, setPrices] = useState<PriceMap>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  // Stabilize ids to avoid re-renders when array ref changes but content is same
  const idsKey = useMemo(() => ids.join(','), [ids]);

  const fetchPrices = useCallback(async () => {
    // Cancel previous inflight request
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const response = await fetch(`/api/prices?ids=${idsKey}`, {
        signal: controller.signal,
      });
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      const data = await response.json();
      if (data.data && Array.isArray(data.data)) {
        const priceMap: PriceMap = {};
        data.data.forEach((asset: CoinCapAsset) => {
          priceMap[asset.id] = {
            priceUsd: Number(asset.priceUsd),
            changePercent24Hr: Number(asset.changePercent24Hr),
          };
        });
        setPrices(priceMap);
        setError(null);
      }
      setIsLoading(false);
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return;
      setError(err instanceof Error ? err.message : 'Unknown error');
      setIsLoading(false);
    }
  }, [idsKey]);

  useEffect(() => {
    fetchPrices();

    pollIntervalRef.current = setInterval(() => {
      fetchPrices();
    }, 5000);

    return () => {
      abortRef.current?.abort();
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, [fetchPrices]);

  return { prices, isLoading, error };
}
