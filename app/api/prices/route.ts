import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';

type CoinCapAsset = {
  id: string;
  priceUsd: string;
  changePercent24Hr: string;
  high24Hr?: string;
  low24Hr?: string;
  volume24Hr?: string;
  marketCap?: string;
};

type PriceResult = {
  id: string;
  price: number;
  change24h: number;
  high24h: number;
  low24h: number;
  volume24h: number;
  marketCap: number;
};

// Map our coin IDs to Binance trading pair symbols
const SYMBOL_MAP: Record<string, string> = {
  bitcoin: 'BTCUSDT',
  ethereum: 'ETHUSDT',
  ripple: 'XRPUSDT',
  cardano: 'ADAUSDT',
  solana: 'SOLUSDT',
  polkadot: 'DOTUSDT',
};

// Reverse map: Binance symbol -> our coin id
const REVERSE_SYMBOL_MAP: Record<string, string> = Object.fromEntries(
  Object.entries(SYMBOL_MAP).map(([id, sym]) => [sym, id])
);

// CoinGecko ID map (most match but some differ)
const COINGECKO_ID_MAP: Record<string, string> = {
  bitcoin: 'bitcoin',
  ethereum: 'ethereum',
  ripple: 'ripple',
  cardano: 'cardano',
  solana: 'solana',
  polkadot: 'polkadot',
};

// Server-side price cache (survives across requests within same serverless instance)
let priceCache: { data: CoinCapAsset[]; timestamp: number } | null = null;
const CACHE_TTL_MS = 4000; // 4 seconds

// --- Strategy 1: Binance BATCH endpoint (single HTTP request for all coins) ---
async function fetchFromBinanceBatch(idsArray: string[]): Promise<PriceResult[]> {
  const symbols = idsArray
    .map((id) => SYMBOL_MAP[id.toLowerCase()])
    .filter(Boolean);

  if (symbols.length === 0) return [];

  const symbolsParam = JSON.stringify(symbols);
  const url = `https://api.binance.com/api/v3/ticker/24hr?symbols=${encodeURIComponent(symbolsParam)}`;

  const response = await fetch(url, {
    method: 'GET',
    cache: 'no-store',
    signal: AbortSignal.timeout(6000),
  });

  if (!response.ok) {
    throw new Error(`Binance batch API error: ${response.status}`);
  }

  const data = await response.json();

  if (!Array.isArray(data)) {
    throw new Error('Binance returned non-array response');
  }

  return data.map((ticker: Record<string, string>) => {
    const id = REVERSE_SYMBOL_MAP[ticker.symbol];
    if (!id) return null;
    return {
      id,
      price: parseFloat(ticker.lastPrice) || 0,
      change24h: parseFloat(ticker.priceChangePercent) || 0,
      high24h: parseFloat(ticker.highPrice) || 0,
      low24h: parseFloat(ticker.lowPrice) || 0,
      volume24h: parseFloat(ticker.quoteVolume) || 0,
      marketCap: 0,
    };
  }).filter(Boolean) as PriceResult[];
}

// --- Strategy 2: CoinGecko batch endpoint (single HTTP request) ---
async function fetchFromCoinGecko(idsArray: string[]): Promise<PriceResult[]> {
  const geckoIds = idsArray
    .map((id) => COINGECKO_ID_MAP[id.toLowerCase()] || id.toLowerCase())
    .join(',');

  const url = `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${geckoIds}&order=market_cap_desc&per_page=20&page=1&sparkline=false&price_change_percentage=24h`;

  const response = await fetch(url, {
    cache: 'no-store',
    signal: AbortSignal.timeout(8000),
  });

  if (!response.ok) {
    throw new Error(`CoinGecko API error: ${response.status}`);
  }

  const data = await response.json();

  if (!Array.isArray(data)) {
    throw new Error('CoinGecko returned non-array response');
  }

  return data.map((coin: Record<string, unknown>) => ({
    id: String(coin.id),
    price: Number(coin.current_price) || 0,
    change24h: Number(coin.price_change_percentage_24h) || 0,
    high24h: Number(coin.high_24h) || 0,
    low24h: Number(coin.low_24h) || 0,
    volume24h: Number(coin.total_volume) || 0,
    marketCap: Number(coin.market_cap) || 0,
  }));
}

// --- Strategy 3: CoinCap API (coincap.io) as last-resort fallback ---
async function fetchFromCoinCap(idsArray: string[]): Promise<PriceResult[]> {
  const coinCapIds = idsArray.join(',');
  const url = `https://api.coincap.io/v2/assets?ids=${coinCapIds}`;

  const response = await fetch(url, {
    cache: 'no-store',
    signal: AbortSignal.timeout(6000),
  });

  if (!response.ok) {
    throw new Error(`CoinCap API error: ${response.status}`);
  }

  const json = await response.json();

  if (!json.data || !Array.isArray(json.data)) {
    throw new Error('CoinCap returned invalid response');
  }

  return json.data.map((asset: Record<string, string>) => ({
    id: asset.id,
    price: parseFloat(asset.priceUsd) || 0,
    change24h: parseFloat(asset.changePercent24Hr) || 0,
    high24h: 0,
    low24h: 0,
    volume24h: parseFloat(asset.volumeUsd24Hr) || 0,
    marketCap: parseFloat(asset.marketCapUsd) || 0,
  }));
}

function toAssetArray(results: PriceResult[]): CoinCapAsset[] {
  return results.map((item) => ({
    id: item.id,
    priceUsd: String(item.price),
    changePercent24Hr: String(item.change24h),
    high24Hr: String(item.high24h),
    low24Hr: String(item.low24h),
    volume24Hr: String(item.volume24h),
    marketCap: String(item.marketCap),
  }));
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const ids = searchParams.get('ids');

  if (!ids) {
    return NextResponse.json({ error: 'Missing ids parameter' }, { status: 400 });
  }

  const idsArray = ids.split(',').map((id) => id.trim().toLowerCase());

  // Return cache if still fresh
  if (priceCache && Date.now() - priceCache.timestamp < CACHE_TTL_MS) {
    // Filter to only requested ids
    const cached = priceCache.data.filter((a) => idsArray.includes(a.id));
    if (cached.length > 0) {
      return NextResponse.json({ data: cached }, { status: 200 });
    }
  }

  // Try APIs in order: Binance batch -> CoinGecko batch -> CoinCap
  let results: PriceResult[] = [];

  // Strategy 1: Binance batch (fastest, most reliable)
  try {
    results = await fetchFromBinanceBatch(idsArray);
    if (results.length > 0) {
      const transformed = toAssetArray(results);
      priceCache = { data: transformed, timestamp: Date.now() };
      return NextResponse.json({ data: transformed }, { status: 200 });
    }
  } catch (err) {
    console.warn('Binance batch failed:', err instanceof Error ? err.message : err);
  }

  // Strategy 2: CoinGecko batch
  try {
    results = await fetchFromCoinGecko(idsArray);
    if (results.length > 0) {
      const transformed = toAssetArray(results);
      priceCache = { data: transformed, timestamp: Date.now() };
      return NextResponse.json({ data: transformed }, { status: 200 });
    }
  } catch (err) {
    console.warn('CoinGecko batch failed:', err instanceof Error ? err.message : err);
  }

  // Strategy 3: CoinCap
  try {
    results = await fetchFromCoinCap(idsArray);
    if (results.length > 0) {
      const transformed = toAssetArray(results);
      priceCache = { data: transformed, timestamp: Date.now() };
      return NextResponse.json({ data: transformed }, { status: 200 });
    }
  } catch (err) {
    console.warn('CoinCap failed:', err instanceof Error ? err.message : err);
  }

  // All APIs failed — return stale cache if available
  if (priceCache && priceCache.data.length > 0) {
    console.warn('All price APIs failed, returning stale cache');
    const cached = priceCache.data.filter((a) => idsArray.includes(a.id));
    if (cached.length > 0) {
      return NextResponse.json({ data: cached }, { status: 200 });
    }
  }

  // Absolute last resort — return empty
  console.error('All price APIs failed and no cache available');
  return NextResponse.json({ data: [] }, { status: 200 });
}
