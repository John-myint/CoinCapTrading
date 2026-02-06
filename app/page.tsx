'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { TrendingUp, TrendingDown, BarChart3, DollarSign, Activity } from 'lucide-react';
import Image from 'next/image';
import { useCoinCapPrices } from '@/lib/hooks/useCoinCapPrices';
import { TradingViewChart } from '@/lib/components/TradingViewChart';
import { useSession } from 'next-auth/react';

const formatPrice = (value: number) => {
  if (Number.isNaN(value)) return '0.00';
  if (value >= 1000) {
    return value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  if (value >= 1) {
    return value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 });
  }
  return value.toLocaleString(undefined, { minimumFractionDigits: 4, maximumFractionDigits: 6 });
};

const formatChange = (value: number) => {
  if (Number.isNaN(value)) return '+0.00';
  const sign = value >= 0 ? '+' : '';
  return `${sign}${value.toFixed(2)}`;
};

export default function HomePage() {
  const router = useRouter();
  const { status } = useSession();
  
  // Quick Trade state
  const [quickTradeType, setQuickTradeType] = useState<'buy' | 'sell'>('buy');
  const [quickTradeCoin, setQuickTradeCoin] = useState('BTC');
  const [quickTradeAmount, setQuickTradeAmount] = useState<string>('');
  const [quickTradePrice, setQuickTradePrice] = useState<string>('');
  const [quickTradeLoading, setQuickTradeLoading] = useState(false);
  const [quickTradeMessage, setQuickTradeMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  const cryptoPrices = [
    { id: 'bitcoin', name: 'Bitcoin', symbol: 'BTC', price: '43,250.00', change: '+2.5', isUp: true, logo: 'https://assets.coingecko.com/coins/images/1/large/bitcoin.png' },
    { id: 'ethereum', name: 'Ethereum', symbol: 'ETH', price: '2,280.50', change: '+1.8', isUp: true, logo: 'https://assets.coingecko.com/coins/images/279/large/ethereum.png' },
    { id: 'ripple', name: 'Ripple', symbol: 'XRP', price: '0.5234', change: '-0.9', isUp: false, logo: 'https://assets.coingecko.com/coins/images/44/large/xrp.png' },
    { id: 'cardano', name: 'Cardano', symbol: 'ADA', price: '0.4567', change: '+3.2', isUp: true, logo: 'https://assets.coingecko.com/coins/images/975/large/cardano.png' },
    { id: 'solana', name: 'Solana', symbol: 'SOL', price: '98.75', change: '-1.2', isUp: false, logo: 'https://assets.coingecko.com/coins/images/4128/large/solana.png' },
    { id: 'polkadot', name: 'Polkadot', symbol: 'DOT', price: '6.89', change: '+0.5', isUp: true, logo: 'https://assets.coingecko.com/coins/images/12171/large/polkadot.png' },
  ];

  const { prices } = useCoinCapPrices(cryptoPrices.map((coin) => coin.id));

  const livePrices = cryptoPrices.map((coin) => {
    const live = prices[coin.id];
    if (!live) return coin;
    return {
      ...coin,
      price: formatPrice(live.priceUsd),
      change: formatChange(live.changePercent24Hr),
      isUp: live.changePercent24Hr >= 0,
    };
  });

  const recentTransactions = [
    { id: 1, type: 'Buy', coin: 'BTC', amount: '0.025', price: '$1,081.25', time: '2m ago', status: 'Completed' },
    { id: 2, type: 'Sell', coin: 'ETH', amount: '1.5', price: '$3,420.75', time: '15m ago', status: 'Completed' },
    { id: 3, type: 'Buy', coin: 'SOL', amount: '10', price: '$987.50', time: '1h ago', status: 'Pending' },
    { id: 4, type: 'Sell', coin: 'ADA', amount: '500', price: '$228.35', time: '2h ago', status: 'Completed' },
  ];

  // Quick trade handlers
  const handleQuickTrade = async () => {
    if (!quickTradeAmount || !quickTradePrice) {
      setQuickTradeMessage({ type: 'error', text: 'Please enter amount and price' });
      return;
    }

    if (parseFloat(quickTradeAmount) <= 0 || parseFloat(quickTradePrice) <= 0) {
      setQuickTradeMessage({ type: 'error', text: 'Amount and price must be greater than 0' });
      return;
    }

    setQuickTradeLoading(true);
    setQuickTradeMessage(null);

    try {
      if (status !== 'authenticated') {
        setQuickTradeMessage({ type: 'error', text: 'Please login to place trades' });
        setQuickTradeLoading(false);
        return;
      }

      const response = await fetch('/api/trades/place', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: quickTradeType,
          cryptoSymbol: quickTradeCoin,
          amount: parseFloat(quickTradeAmount),
          pricePerUnit: parseFloat(quickTradePrice),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setQuickTradeMessage({ type: 'error', text: data.error || 'Failed to place order' });
        return;
      }

      setQuickTradeMessage({ 
        type: 'success', 
        text: `${quickTradeType === 'buy' ? 'Buy' : 'Sell'} order placed!` 
      });

      setQuickTradeAmount('');
      setTimeout(() => {
        setQuickTradeMessage(null);
      }, 4000);

    } catch (error) {
      console.error('Trade error:', error);
      setQuickTradeMessage({ type: 'error', text: 'Network error. Please try again.' });
    } finally {
      setQuickTradeLoading(false);
    }
  };

  return (
    <div className="responsive-container max-w-7xl mx-auto space-y-1.5 md:space-y-2 pb-2 min-h-screen flex flex-col">
      {/* Price Ticker */}
      <div className="glass-card overflow-x-auto snap-x snap-mandatory p-2">
        <div className="flex gap-2 sm:gap-2.5 md:gap-3 min-w-max">
          {livePrices.slice(0, 4).map((crypto) => (
            <div key={crypto.symbol} className="flex items-center gap-1.5 snap-start shrink-0">
              <div className="relative w-6 h-6 flex-shrink-0">
                <Image
                  src={crypto.logo}
                  alt={crypto.name}
                  width={24}
                  height={24}
                  className="w-full h-full rounded-full object-cover"
                  priority={false}
                  loading="lazy"
                />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] text-gray-400 truncate leading-tight">{crypto.symbol}</p>
                <p className="text-xs font-semibold truncate leading-tight">${crypto.price}</p>
              </div>
              <span className={`text-[10px] flex items-center gap-0.5 whitespace-nowrap ${crypto.isUp ? 'text-success' : 'text-danger'}`}>
                {crypto.isUp ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                {crypto.change}%
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-1.5 md:gap-2">
        <div 
          className="glass-card p-2 md:p-2.5 cursor-pointer hover:bg-white/10 transition-colors"
          onClick={() => router.push('/wallet')}
        >
          <div className="flex items-center justify-between mb-1">
            <p className="text-[10px] text-gray-400 truncate">Total Balance</p>
            <DollarSign size={12} className="text-accent flex-shrink-0" />
          </div>
          <p className="text-sm font-bold truncate">$24,567.89</p>
          <p className="text-[10px] text-success truncate">+12.5%</p>
        </div>
        
        <div 
          className="glass-card p-2 md:p-2.5 cursor-pointer hover:bg-white/10 transition-colors"
          onClick={() => router.push('/trade')}
        >
          <div className="flex items-center justify-between mb-1">
            <p className="text-[10px] text-gray-400 truncate">24h Volume</p>
            <BarChart3 size={12} className="text-purple-400 flex-shrink-0" />
          </div>
          <p className="text-sm font-bold truncate">$8,429.12</p>
          <p className="text-[10px] text-gray-400 truncate">15 TX</p>
        </div>
        
        <div 
          className="glass-card p-2 md:p-2.5 cursor-pointer hover:bg-white/10 transition-colors"
          onClick={() => router.push('/trade')}
        >
          <div className="flex items-center justify-between mb-1">
            <p className="text-[10px] text-gray-400 truncate">Top Gainer</p>
            <TrendingUp size={12} className="text-success flex-shrink-0" />
          </div>
          <p className="text-sm font-bold">ADA</p>
          <p className="text-[10px] text-success">+3.2%</p>
        </div>
        
        <div 
          className="glass-card p-2 md:p-2.5 cursor-pointer hover:bg-white/10 transition-colors"
          onClick={() => router.push('/trade')}
        >
          <div className="flex items-center justify-between mb-1">
            <p className="text-[10px] text-gray-400 truncate">Active Orders</p>
            <Activity size={12} className="text-blue-400 flex-shrink-0" />
          </div>
          <p className="text-sm font-bold">7</p>
          <p className="text-[10px] text-gray-400">3 Pending</p>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid md:grid-cols-3 lg:grid-cols-3 gap-1.5 md:gap-2 flex-1">
        {/* Chart Section */}
        <div className="md:col-span-2 space-y-1.5 md:space-y-2">
          {/* Trading Chart */}
          <div 
            className="glass-card p-2 sm:p-2.5 cursor-pointer hover:bg-white/10 transition-colors overflow-hidden"
            onClick={() => router.push('/trade')}
          >
            <h2 className="text-xs sm:text-sm font-semibold mb-1.5">BTC/USD</h2>
            <TradingViewChart coinId="bitcoin" coinName="Bitcoin" height="h-40 sm:h-48 md:h-52" />
          </div>

          {/* Market Prices */}
          <div 
            className="glass-card p-2 sm:p-2.5 cursor-pointer hover:bg-white/10 transition-colors"
            onClick={() => router.push('/markets')}
          >
            <h2 className="text-xs font-semibold mb-1.5">Market Prices</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
              {livePrices.map((crypto) => (
                <div
                  key={crypto.symbol}
                  className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                  onClick={(e) => {
                    e.stopPropagation();
                    router.push('/markets');
                  }}
                >
                  <div className="flex items-center gap-1.5 mb-1">
                    <div className="relative w-6 h-6 flex-shrink-0">
                      <Image
                        src={crypto.logo}
                        alt={crypto.name}
                        width={24}
                        height={24}
                        className="w-6 h-6 rounded-full object-cover"
                        priority={false}
                        loading="lazy"
                      />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] font-semibold">{crypto.symbol}</p>
                      <p className="text-[9px] text-gray-400 truncate">{crypto.name}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold">${crypto.price}</p>
                    <p className={`text-[9px] flex items-center gap-0.5 ${crypto.isUp ? 'text-success' : 'text-danger'}`}>
                      {crypto.isUp ? <TrendingUp size={8} /> : <TrendingDown size={8} />}
                      {crypto.change}%
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Quick Trade Section */}
        <div className="space-y-1.5 md:space-y-2">
          {/* Buy/Sell Form */}
          <div className="glass-card p-2 sm:p-2.5">
            <h2 className="text-xs font-semibold mb-1.5">Quick Trade</h2>

            {/* Status Message */}
            {quickTradeMessage && (
              <div className={`mb-1.5 p-1.5 rounded text-[10px] ${quickTradeMessage.type === 'success' ? 'bg-success/20 text-success' : 'bg-danger/20 text-danger'}`}>
                {quickTradeMessage.text}
              </div>
            )}
            
            <div className="flex gap-1 mb-1.5">
              <button 
                onClick={() => setQuickTradeType('buy')}
                className={`flex-1 py-1.5 rounded-lg font-medium text-[10px] min-h-[32px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                  quickTradeType === 'buy' 
                    ? 'bg-success text-white' 
                    : 'bg-white/5 hover:bg-white/10'
                }`}
              >
                Buy
              </button>
              <button 
                onClick={() => setQuickTradeType('sell')}
                className={`flex-1 py-1.5 rounded-lg font-medium text-[10px] min-h-[32px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                  quickTradeType === 'sell' 
                    ? 'bg-danger text-white' 
                    : 'bg-white/5 hover:bg-white/10'
                }`}
              >
                Sell
              </button>
            </div>

            <div className="space-y-1.5">
              <div>
                <label className="text-[10px] text-gray-400 block mb-0.5 font-medium">Select Coin</label>
                <select 
                  value={quickTradeCoin}
                  onChange={(e) => setQuickTradeCoin(e.target.value)}
                  className="w-full px-2 py-1.5 rounded-lg bg-white/5 border border-white/10 focus:border-accent focus:outline-none text-[10px]"
                >
                  <option>BTC</option>
                  <option>ETH</option>
                  <option>XRP</option>
                  <option>ADA</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] text-gray-400 block mb-0.5 font-medium">Amount</label>
                <input
                  type="number"
                  placeholder="0.00"
                  value={quickTradeAmount}
                  onChange={(e) => setQuickTradeAmount(e.target.value)}
                  className="w-full px-2 py-1.5 rounded-lg bg-white/5 border border-white/10 focus:border-accent focus:outline-none text-[10px]"
                />
              </div>

              <div>
                <label className="text-[10px] text-gray-400 block mb-0.5 font-medium">Price (USD)</label>
                <input
                  type="number"
                  placeholder="0.00"
                  value={quickTradePrice}
                  onChange={(e) => setQuickTradePrice(e.target.value)}
                  className="w-full px-2 py-1.5 rounded-lg bg-white/5 border border-white/10 focus:border-accent focus:outline-none text-[10px]"
                />
              </div>

              <div className="flex items-center justify-between py-1.5 border-t border-white/10 text-[10px]">
                <p className="text-gray-400">Total</p>
                <p className="font-bold">${quickTradeAmount && quickTradePrice ? (parseFloat(quickTradeAmount) * parseFloat(quickTradePrice)).toFixed(2) : '0.00'}</p>
              </div>

              <button 
                onClick={handleQuickTrade}
                disabled={quickTradeLoading || !quickTradeAmount || !quickTradePrice}
                className="w-full py-1.5 rounded-lg bg-gradient-to-r from-accent to-purple-500 hover:from-accent/80 hover:to-purple-500/80 disabled:opacity-50 disabled:cursor-not-allowed font-semibold transition-all text-[10px] min-h-[32px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                {quickTradeLoading ? 'Processing...' : 'Place Order'}
              </button>
            </div>
          </div>

          {/* Order Book Preview */}
          <div 
            className="glass-card p-2 sm:p-2.5 cursor-pointer hover:bg-white/10 transition-colors"
            onClick={() => router.push('/trade')}
          >
            <h2 className="text-[10px] font-semibold mb-1.5">Order Book</h2>
            <div className="space-y-0.5 text-[10px]">
              <div className="flex justify-between text-gray-400 pb-0.5 border-b border-white/10">
                <span>Price</span>
                <span>Amount</span>
              </div>
              <div className="flex justify-between text-danger">
                <span>43,251.20</span>
                <span>0.125</span>
              </div>
              <div className="flex justify-between text-danger">
                <span>43,250.50</span>
                <span>0.567</span>
              </div>
              <div className="py-0.5 border-y border-white/10 text-center font-bold">
                43,250.00
              </div>
              <div className="flex justify-between text-success">
                <span>43,249.50</span>
                <span>0.234</span>
              </div>
              <div className="flex justify-between text-success">
                <span>43,248.80</span>
                <span>0.456</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
