'use client';

import { useEffect, useRef, useState } from 'react';
import { BarChart3 } from 'lucide-react';

interface ChartData {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface TradingViewChartProps {
  coinId: string;
  coinName: string;
  height?: string;
}

export function TradingViewChart({ coinId, coinName, height = 'h-96' }: TradingViewChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<any>(null);
  const seriesRef = useRef<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initChart = async () => {
      try {
        // Dynamically load TradingView Lightweight Charts
        const script = document.createElement('script');
        script.src = 'https://unpkg.com/lightweight-charts@4/dist/lightweight-charts.standalone.production.js';
        script.async = true;
        script.onload = () => {
          if (!containerRef.current) return;
          
          // Initialize chart
          const LightweightCharts = (window as any).LightweightCharts;
          const chart = LightweightCharts.createChart(containerRef.current, {
            layout: {
              textColor: '#d1d5db',
              background: { type: 'solid', color: 'transparent' },
            },
            timeScale: {
              timeVisible: true,
              secondsVisible: false,
            },
            grid: {
              horzLines: { color: '#1f2937' },
              vertLines: { color: '#1f2937' },
            },
          });

          chartRef.current = chart;

          // Add candlestick series
          const candleSeries = chart.addCandlestickSeries({
            upColor: '#10b981',
            downColor: '#ef4444',
            borderDownColor: '#ef4444',
            borderUpColor: '#10b981',
            wickDownColor: '#ef4444',
            wickUpColor: '#10b981',
          });

          seriesRef.current = candleSeries;

          // Fetch historical data from CoinGecko
          fetchHistoricalData(coinId.toLowerCase()).then((data) => {
            if (data && data.length > 0) {
              candleSeries.setData(data);
              chart.timeScale().fitContent();
              setIsLoading(false);
            } else {
              setError('No data available');
              setIsLoading(false);
            }
          }).catch((err) => {
            console.error('Error fetching chart data:', err);
            setError('Failed to load chart data');
            setIsLoading(false);
          });

          // Auto resize chart
          const handleResize = () => {
            if (containerRef.current) {
              chart.applyOptions({
                width: containerRef.current.clientWidth,
                height: containerRef.current.clientHeight,
              });
            }
          };

          window.addEventListener('resize', handleResize);
          handleResize();

          return () => {
            window.removeEventListener('resize', handleResize);
            chart.remove();
          };
        };

        document.head.appendChild(script);
        return () => {
          if (document.head.contains(script)) {
            document.head.removeChild(script);
          }
        };
      } catch (err) {
        console.error('Chart initialization error:', err);
        setError('Failed to initialize chart');
        setIsLoading(false);
      }
    };

    initChart();
  }, [coinId]);

  return (
    <div className="w-full">
      {isLoading && (
        <div className={`${height} bg-black/20 rounded-lg border border-white/5 flex items-center justify-center`}>
          <div className="text-center">
            <div className="animate-spin mb-2 flex justify-center">
              <BarChart3 size={40} className="text-gray-600" />
            </div>
            <p className="text-gray-500 text-sm">Loading chart...</p>
          </div>
        </div>
      )}
      {error && (
        <div className={`${height} bg-black/20 rounded-lg border border-white/5 flex items-center justify-center`}>
          <div className="text-center">
            <BarChart3 size={40} className="mx-auto mb-2 text-gray-600" />
            <p className="text-gray-500 text-sm">{error}</p>
            <p className="text-xs text-gray-600 mt-1">Real-time {coinName} chart</p>
          </div>
        </div>
      )}
      {!isLoading && !error && (
        <div ref={containerRef} className={`${height} rounded-lg border border-white/5 overflow-hidden`} />
      )}
    </div>
  );
}

// Fetch 1-day candlestick data from CoinGecko
async function fetchHistoricalData(coinId: string) {
  try {
    // Fetch last 30 days of data for better context
    const response = await fetch(
      `https://api.coingecko.com/api/v3/coins/${coinId}/ohlc?vs_currency=usd&days=30`,
      {
        cache: 'no-store',
        headers: { 'Accept': 'application/json' },
      }
    );

    if (!response.ok) {
      console.warn(`CoinGecko OHLC API returned ${response.status}`);
      return generateMockData();
    }

    const data = await response.json();

    // CoinGecko returns [timestamp, open, high, low, close]
    const formattedData = data
      .filter((candle: number[]) => candle.length === 5)
      .map((candle: number[]) => ({
        time: Math.floor(candle[0] / 1000), // Convert ms to seconds
        open: candle[1],
        high: candle[2],
        low: candle[3],
        close: candle[4],
        volume: 0, // CoinGecko OHLC doesn't include volume
      }));

    return formattedData.length > 0 ? formattedData : generateMockData();
  } catch (error) {
    console.error('Error fetching historical data:', error);
    return generateMockData();
  }
}

// Generate realistic mock data if API fails
function generateMockData() {
  const data: ChartData[] = [];
  const basePrice = 43000;
  let currentPrice = basePrice;

  for (let i = 30; i >= 0; i--) {
    const randomChange = (Math.random() - 0.5) * 1000;
    const open = currentPrice;
    const close = currentPrice + randomChange;
    const high = Math.max(open, close) + Math.abs(randomChange) * 0.3;
    const low = Math.min(open, close) - Math.abs(randomChange) * 0.3;

    data.push({
      time: Math.floor(Date.now() / 1000) - i * 86400,
      open,
      high,
      low,
      close,
      volume: Math.random() * 1000000,
    });

    currentPrice = close;
  }

  return data;
}
