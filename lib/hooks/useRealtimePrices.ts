'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { CoinCapAsset } from '@/lib/types';

type PriceData = {
  priceUsd: number;
  changePercent24Hr: number;
};

type PriceMap = Record<string, PriceData>;

const isBrowser = typeof window !== 'undefined';

export function useRealtimePrices(ids: string[]) {
  const [prices, setPrices] = useState<PriceMap>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const idsRef = useRef(ids.join(','));

  const fetchPrices = useCallback(async () => {
    try {
      const response = await fetch(`/api/prices?ids=${ids.join(',')}`);
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
      setError(err instanceof Error ? err.message : 'Unknown error');
      setIsLoading(false);
    }
  }, [ids]);

  useEffect(() => {
    idsRef.current = ids.join(',');
    
    fetchPrices();

    pollIntervalRef.current = setInterval(() => {
      fetchPrices();
    }, 5000);

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, [ids, fetchPrices]);

  return { prices, isLoading, error };
}
