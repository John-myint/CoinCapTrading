export interface CryptoData {
  symbol: string;
  name: string;
  currentPrice: number;
  changePercent24Hr: number;
  marketCap: number;
}

export const formatPrice = (value: number): string => {
  if (Number.isNaN(value)) return '0.00';
  if (value >= 1000) {
    return value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  if (value >= 1) {
    return value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 });
  }
  return value.toLocaleString(undefined, { minimumFractionDigits: 4, maximumFractionDigits: 6 });
};

export const formatLargeNumber = (value: number): string => {
  if (value >= 1_000_000_000) {
    return (value / 1_000_000_000).toFixed(2) + 'B';
  }
  if (value >= 1_000_000) {
    return (value / 1_000_000).toFixed(2) + 'M';
  }
  if (value >= 1_000) {
    return (value / 1_000).toFixed(2) + 'K';
  }
  return value.toFixed(2);
};

export const fetchRealCryptoData = async (): Promise<CryptoData[]> => {
  // Map CoinGecko IDs to correct ticker symbols
  const symbolMap: Record<string, string> = {
    bitcoin: 'BTC',
    ethereum: 'ETH',
    binancecoin: 'BNB',
    solana: 'SOL',
    ripple: 'XRP',
    dogecoin: 'DOGE',
    cardano: 'ADA',
    tron: 'TRX',
    'avalanche-2': 'AVAX',
    chainlink: 'LINK',
    'shiba-inu': 'SHIB',
    polkadot: 'DOT',
    'bitcoin-cash': 'BCH',
    uniswap: 'UNI',
    litecoin: 'LTC',
    near: 'NEAR',
    'matic-network': 'MATIC',
    stellar: 'XLM',
    cosmos: 'ATOM',
    'internet-computer': 'ICP',
    filecoin: 'FIL',
    aptos: 'APT',
    arbitrum: 'ARB',
    optimism: 'OP',
    'hedera-hashgraph': 'HBAR',
    algorand: 'ALGO',
    vechain: 'VET',
    'render-token': 'RNDR',
    sui: 'SUI',
    pepe: 'PEPE',
    'pax-gold': 'PAXG',
  };

  try {
    const ids = Object.keys(symbolMap);
    const response = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${ids.join(',')}&vs_currencies=usd&include_market_cap=true&include_24hr_change=true`
    );

    if (!response.ok) {
      throw new Error('Failed to fetch crypto data');
    }

    const data = await response.json();

    return ids.map(id => ({
      symbol: symbolMap[id],
      name: id.charAt(0).toUpperCase() + id.slice(1),
      currentPrice: data[id]?.usd || 0,
      changePercent24Hr: data[id]?.['usd_24h_change'] || 0,
      marketCap: data[id]?.['usd_market_cap'] || 0,
    }));
  } catch (error) {
    console.error('Error fetching crypto data:', error);
    // Return mock data as fallback
    return [
      { symbol: 'BTC', name: 'Bitcoin', currentPrice: 67000, changePercent24Hr: 2.5, marketCap: 1300000000000 },
      { symbol: 'ETH', name: 'Ethereum', currentPrice: 3500, changePercent24Hr: 1.8, marketCap: 420000000000 },
      { symbol: 'BNB', name: 'BNB', currentPrice: 600, changePercent24Hr: 1.2, marketCap: 90000000000 },
      { symbol: 'SOL', name: 'Solana', currentPrice: 150, changePercent24Hr: 3.2, marketCap: 70000000000 },
      { symbol: 'XRP', name: 'XRP', currentPrice: 0.6, changePercent24Hr: -0.8, marketCap: 35000000000 },
      { symbol: 'DOGE', name: 'Dogecoin', currentPrice: 0.15, changePercent24Hr: 2.1, marketCap: 22000000000 },
      { symbol: 'ADA', name: 'Cardano', currentPrice: 0.45, changePercent24Hr: 0.5, marketCap: 16000000000 },
      { symbol: 'TRX', name: 'TRON', currentPrice: 0.12, changePercent24Hr: 0.7, marketCap: 11000000000 },
      { symbol: 'AVAX', name: 'Avalanche', currentPrice: 35, changePercent24Hr: 1.1, marketCap: 13000000000 },
      { symbol: 'LINK', name: 'Chainlink', currentPrice: 16, changePercent24Hr: 2.0, marketCap: 9000000000 },
      { symbol: 'SHIB', name: 'Shiba Inu', currentPrice: 0.000025, changePercent24Hr: 1.5, marketCap: 14000000000 },
      { symbol: 'DOT', name: 'Polkadot', currentPrice: 7.5, changePercent24Hr: 1.2, marketCap: 9000000000 },
      { symbol: 'BCH', name: 'Bitcoin Cash', currentPrice: 480, changePercent24Hr: 0.9, marketCap: 9500000000 },
      { symbol: 'UNI', name: 'Uniswap', currentPrice: 8.5, changePercent24Hr: 1.3, marketCap: 6500000000 },
      { symbol: 'LTC', name: 'Litecoin', currentPrice: 85, changePercent24Hr: 0.8, marketCap: 6300000000 },
      { symbol: 'NEAR', name: 'NEAR Protocol', currentPrice: 7.2, changePercent24Hr: 2.2, marketCap: 7300000000 },
      { symbol: 'MATIC', name: 'Polygon', currentPrice: 0.75, changePercent24Hr: 1.0, marketCap: 7000000000 },
      { symbol: 'XLM', name: 'Stellar', currentPrice: 0.11, changePercent24Hr: 0.6, marketCap: 3200000000 },
      { symbol: 'ATOM', name: 'Cosmos', currentPrice: 8.5, changePercent24Hr: 1.1, marketCap: 3300000000 },
      { symbol: 'ICP', name: 'Internet Computer', currentPrice: 12, changePercent24Hr: 1.4, marketCap: 5500000000 },
      { symbol: 'FIL', name: 'Filecoin', currentPrice: 6.2, changePercent24Hr: 1.2, marketCap: 3500000000 },
      { symbol: 'APT', name: 'Aptos', currentPrice: 9.5, changePercent24Hr: 1.3, marketCap: 4000000000 },
      { symbol: 'ARB', name: 'Arbitrum', currentPrice: 1.2, changePercent24Hr: 1.1, marketCap: 3500000000 },
      { symbol: 'OP', name: 'Optimism', currentPrice: 2.1, changePercent24Hr: 1.0, marketCap: 2200000000 },
      { symbol: 'HBAR', name: 'Hedera', currentPrice: 0.09, changePercent24Hr: 0.7, marketCap: 3200000000 },
      { symbol: 'ALGO', name: 'Algorand', currentPrice: 0.18, changePercent24Hr: 0.6, marketCap: 1400000000 },
      { symbol: 'VET', name: 'VeChain', currentPrice: 0.03, changePercent24Hr: 0.5, marketCap: 2200000000 },
      { symbol: 'RNDR', name: 'Render', currentPrice: 7.5, changePercent24Hr: 1.8, marketCap: 2800000000 },
      { symbol: 'SUI', name: 'Sui', currentPrice: 1.1, changePercent24Hr: 1.2, marketCap: 2500000000 },
      { symbol: 'PEPE', name: 'Pepe', currentPrice: 0.000012, changePercent24Hr: 1.7, marketCap: 500000000 },
      { symbol: 'PAXG', name: 'Pax Gold (Gold)', currentPrice: 2300, changePercent24Hr: 0.2, marketCap: 450000000 },
    ];
  }
};
