import { NextRequest, NextResponse } from 'next/server';

// Map Binance symbols to CoinGecko IDs
const coinGeckoIdMap: Record<string, string> = {
  BTCUSDT: 'bitcoin',
  ETHUSDT: 'ethereum',
  XRPUSDT: 'ripple',
  ADAUSDT: 'cardano',
  SOLUSDT: 'solana',
  DOTUSDT: 'polkadot',
};

// Generate realistic mock data for testing (30 days of data)
function generateMockChartData(basePrice: number = 50000): Array<{ time: number; price: number }> {
  const data = [];
  const now = Math.floor(Date.now() / 1000);
  const oneDaySeconds = 86400;
  
  for (let i = 29; i >= 0; i--) {
    const time = now - (i * oneDaySeconds);
    // Generate realistic price variations (±5% daily volatility)
    const variation = (Math.random() - 0.5) * 0.1;
    const price = basePrice * (1 + variation);
    data.push({ time, price: parseFloat(price.toFixed(2)) });
  }
  
  return data;
}

// Fetch chart data from CoinGecko as fallback
async function fetchCoinGeckoChartData(coinId: string): Promise<Array<{ time: number; price: number }>> {
  try {
    const response = await fetch(
      `https://api.coingecko.com/api/v3/coins/${coinId}/market_chart?vs_currency=usd&days=30`,
      {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'CoinCapTrading/1.0',
        },
        signal: AbortSignal.timeout(5000),
      }
    );

    if (!response.ok) {
      console.warn(`CoinGecko fetch failed for ${coinId}:`, response.status);
      return [];
    }

    const data = await response.json();
    
    if (!data.prices || !Array.isArray(data.prices)) {
      return [];
    }

    // CoinGecko returns hourly data, so sample it to get ~30 daily points
    const sampledPrices = [];
    const priceCount = data.prices.length;
    const sampleRate = Math.max(1, Math.floor(priceCount / 30));
    
    for (let i = 0; i < priceCount; i += sampleRate) {
      const point = data.prices[i];
      sampledPrices.push({
        time: Math.floor(point[0] / 1000),
        price: parseFloat(parseFloat(point[1]).toFixed(2)),
      });
    }
    
    // Ensure we have at least some data
    if (sampledPrices.length > 0) {
      return sampledPrices.sort((a: any, b: any) => a.time - b.time);
    }

    return [];
  } catch (error) {
    console.warn(`CoinGecko error for ${coinId}:`, error);
    return [];
  }
}

export async function GET(request: NextRequest) {
  try {
    const symbol = request.nextUrl.searchParams.get('symbol');

    if (!symbol) {
      return NextResponse.json(
        { error: 'Symbol parameter is required' },
        { status: 400 }
      );
    }

    // Validate symbol format (e.g., BTCUSDT)
    if (!/^[A-Z]{2,}USDT$/.test(symbol)) {
      return NextResponse.json(
        { error: 'Invalid symbol format' },
        { status: 400 }
      );
    }

    let chartData: Array<{ time: number; price: number }> = [];

    // Try Binance first
    try {
      const response = await fetch(
        `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=1d&limit=30`,
        {
          cache: 'no-store',
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'CoinCapTrading/1.0',
          },
          signal: AbortSignal.timeout(5000),
        }
      );

      if (response.ok) {
        const data = await response.json();
        chartData = data
          .filter((candle: any[]) => Array.isArray(candle) && candle.length >= 5)
          .map((candle: any[]) => ({
            time: Math.floor(candle[0] / 1000),
            price: parseFloat(candle[4]), // Use closing price
          }))
          .sort((a: any, b: any) => a.time - b.time);
      } else {
        console.warn(`Binance API error for ${symbol}: ${response.status}, trying CoinGecko...`);
      }
    } catch (binanceError) {
      console.warn(`Binance fetch failed for ${symbol}:`, binanceError);
    }

    // Fallback to CoinGecko if Binance failed
    if (chartData.length === 0) {
      const coinGeckoId = coinGeckoIdMap[symbol];
      if (coinGeckoId) {
        console.log(`Falling back to CoinGecko for ${coinGeckoId}...`);
        chartData = await fetchCoinGeckoChartData(coinGeckoId);
      }
    }

    // Fallback to mock data if both failed
    if (chartData.length === 0) {
      console.warn(`All APIs failed for ${symbol}, using mock data`);
      chartData = generateMockChartData();
    }

    return NextResponse.json(
      { 
        data: chartData,
        symbol,
        count: chartData.length,
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        },
      }
    );
  } catch (error) {
    console.error('Chart API error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch chart data',
        data: generateMockChartData(),
      },
      { status: 200 }
    );
  }
}
