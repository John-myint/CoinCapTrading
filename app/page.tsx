'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  TrendingUp,
  TrendingDown,
  Zap,
  Shield,
  Globe,
  Smartphone,
  ArrowRight,
  Check,
  Users,
  BarChart3,
  Target,
} from 'lucide-react';
import Link from 'next/link';

export default function HomePage() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    setIsLoggedIn(!!token);
  }, []);

  const cryptoData = [
    { symbol: 'BTC', name: 'Bitcoin', price: '$43,250', change: '+2.5%', isPositive: true },
    { symbol: 'ETH', name: 'Ethereum', price: '$2,280', change: '+1.8%', isPositive: true },
    { symbol: 'SOL', name: 'Solana', price: '$98.75', change: '-1.2%', isPositive: false },
    { symbol: 'ADA', name: 'Cardano', price: '$0.456', change: '+3.2%', isPositive: true },
  ];

  const features = [
    {
      icon: Zap,
      title: 'Lightning Fast',
      description: 'Execute trades in milliseconds with our high-speed trading platform',
    },
    {
      icon: Shield,
      title: 'Secure & Safe',
      description: 'Military-grade encryption and 2FA protection for your account',
    },
    {
      icon: Globe,
      title: '24/7 Trading',
      description: 'Trade crypto anytime, anywhere with 24/7 market access',
    },
    {
      icon: Smartphone,
      title: 'Mobile Ready',
      description: 'Seamless experience across all devices and screen sizes',
    },
  ];

  const stats = [
    { label: 'Active Users', value: '50K+', icon: Users },
    { label: 'Total Trades', value: '2.5M+', icon: BarChart3 },
    { label: 'Trading Volume', value: '$5.2B+', icon: Target },
  ];

  return (
    <div className="min-h-screen bg-background overflow-hidden">
      {/* Navigation */}
      <nav className="sticky top-0 z-40 glass border-b border-white/10 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
            CoinCapTrading
          </h1>
          <div className="flex items-center gap-4">
            {isLoggedIn ? (
              <>
                <Link
                  href="/dashboard"
                  className="px-4 py-2 text-white hover:text-accent transition-colors"
                >
                  Dashboard
                </Link>
                <button
                  onClick={() => router.push('/profile')}
                  className="px-4 py-2 rounded-lg bg-accent/20 hover:bg-accent/30 text-accent font-semibold transition-colors"
                >
                  Profile
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => router.push('/login')}
                  className="px-4 py-2 text-white hover:text-accent transition-colors"
                >
                  Login
                </button>
                <button
                  onClick={() => router.push('/register')}
                  className="px-4 py-2 rounded-lg bg-gradient-to-r from-accent to-purple-500 hover:from-accent/80 hover:to-purple-500/80 text-white font-semibold transition-all"
                >
                  Sign Up
                </button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-[600px] flex items-center overflow-hidden py-20">
        {/* Background Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-10 left-10 w-72 h-72 bg-accent/20 rounded-full blur-3xl"></div>
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl"></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 relative z-10">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Left Side - Content */}
            <div className="space-y-6">
              <div className="space-y-4">
                <h2 className="text-5xl md:text-6xl font-bold text-white leading-tight">
                  Trade Crypto with
                  <span className="bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                    {' '}Confidence
                  </span>
                </h2>
                <p className="text-xl text-gray-400">
                  Experience the fastest, most secure cryptocurrency trading platform. Start with $10,000 virtual capital and master trading strategies.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                {isLoggedIn ? (
                  <button
                    onClick={() => router.push('/dashboard')}
                    className="px-8 py-3 rounded-lg bg-gradient-to-r from-accent to-purple-500 hover:from-accent/80 hover:to-purple-500/80 text-white font-semibold transition-all flex items-center justify-center gap-2"
                  >
                    Go to Dashboard
                    <ArrowRight size={20} />
                  </button>
                ) : (
                  <>
                    <button
                      onClick={() => router.push('/register')}
                      className="px-8 py-3 rounded-lg bg-gradient-to-r from-accent to-purple-500 hover:from-accent/80 hover:to-purple-500/80 text-white font-semibold transition-all flex items-center justify-center gap-2"
                    >
                      Get Started Free
                      <ArrowRight size={20} />
                    </button>
                    <button
                      onClick={() => router.push('/login')}
                      className="px-8 py-3 rounded-lg bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold transition-all"
                    >
                      Sign In
                    </button>
                  </>
                )}
              </div>

              {/* Trust Badges */}
              <div className="flex items-center gap-4 pt-4">
                <div className="flex items-center gap-2">
                  <Shield size={20} className="text-accent" />
                  <span className="text-sm text-gray-400">Bank-Level Security</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check size={20} className="text-accent" />
                  <span className="text-sm text-gray-400">Instant Verification</span>
                </div>
              </div>
            </div>

            {/* Right Side - Visual */}
            <div className="relative h-96">
              <div className="absolute inset-0 glass-card rounded-2xl overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-accent/20 to-purple-500/20"></div>
                <div className="relative h-full flex flex-col justify-between p-6">
                  {/* Chart Animation */}
                  <div className="space-y-2">
                    <p className="text-gray-400 text-sm">Portfolio Growth</p>
                    <div className="flex items-end gap-1 h-24">
                      {[40, 45, 35, 50, 55, 60, 65].map((height, i) => (
                        <div
                          key={i}
                          className="flex-1 bg-gradient-to-t from-accent to-purple-500 rounded-t opacity-70 hover:opacity-100 transition-opacity"
                          style={{ height: `${height}%` }}
                        ></div>
                      ))}
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-4 p-4 rounded-lg bg-white/5">
                    <div>
                      <p className="text-gray-400 text-xs">Portfolio Value</p>
                      <p className="text-xl font-bold text-white">$15,240</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-xs">24h Change</p>
                      <p className="text-xl font-bold text-green-400">+5.2%</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Live Markets Preview */}
      <section className="py-16 px-4">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="text-center space-y-3">
            <h3 className="text-3xl md:text-4xl font-bold text-white">Live Market Data</h3>
            <p className="text-gray-400 text-lg">Monitor top cryptocurrencies in real-time</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {cryptoData.map((crypto) => (
              <div key={crypto.symbol} className="glass-card p-4 hover:bg-white/10 transition-all">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-sm text-gray-400">{crypto.symbol}</p>
                    <p className="text-lg font-semibold text-white">{crypto.name}</p>
                  </div>
                  {crypto.isPositive ? (
                    <TrendingUp size={24} className="text-green-400" />
                  ) : (
                    <TrendingDown size={24} className="text-red-400" />
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-2xl font-bold text-white">{crypto.price}</p>
                  <p
                    className={`text-sm font-semibold ${
                      crypto.isPositive ? 'text-green-400' : 'text-red-400'
                    }`}
                  >
                    {crypto.change}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center space-y-3 mb-16">
            <h3 className="text-3xl md:text-4xl font-bold text-white">Why Choose CoinCapTrading?</h3>
            <p className="text-gray-400 text-lg">Everything you need for successful crypto trading</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div key={index} className="glass-card p-6 space-y-4 hover:bg-white/10 transition-all">
                  <div className="w-12 h-12 rounded-lg bg-accent/20 flex items-center justify-center">
                    <Icon size={24} className="text-accent" />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-white mb-2">{feature.title}</h4>
                    <p className="text-gray-400 text-sm">{feature.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Statistics Section */}
      <section className="py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="glass-card p-8 md:p-12">
            <div className="grid md:grid-cols-3 gap-8">
              {stats.map((stat, index) => {
                const Icon = stat.icon;
                return (
                  <div key={index} className="text-center space-y-4">
                    <div className="flex justify-center">
                      <div className="w-16 h-16 rounded-lg bg-accent/20 flex items-center justify-center">
                        <Icon size={32} className="text-accent" />
                      </div>
                    </div>
                    <div>
                      <p className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                        {stat.value}
                      </p>
                      <p className="text-gray-400 text-lg">{stat.label}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto glass-card p-12 text-center space-y-6">
          <h3 className="text-3xl md:text-4xl font-bold text-white">Ready to Start Trading?</h3>
          <p className="text-gray-400 text-lg">
            Join thousands of traders and start your crypto journey with $10,000 virtual capital
          </p>
          {!isLoggedIn && (
            <button
              onClick={() => router.push('/register')}
              className="px-8 py-3 rounded-lg bg-gradient-to-r from-accent to-purple-500 hover:from-accent/80 hover:to-purple-500/80 text-white font-semibold transition-all inline-flex items-center gap-2"
            >
              Create Free Account
              <ArrowRight size={20} />
            </button>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 px-4 py-8 mt-12">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div className="space-y-3">
              <h4 className="text-white font-bold">CoinCapTrading</h4>
              <p className="text-gray-400 text-sm">
                Your trusted crypto trading platform with virtual capital learning.
              </p>
            </div>
            <div className="space-y-3">
              <h5 className="text-white font-semibold">Product</h5>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><Link href="/dashboard" className="hover:text-accent transition-colors">Dashboard</Link></li>
                <li><Link href="/trade" className="hover:text-accent transition-colors">Trade</Link></li>
              </ul>
            </div>
            <div className="space-y-3">
              <h5 className="text-white font-semibold">Account</h5>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><Link href="/login" className="hover:text-accent transition-colors">Login</Link></li>
                <li><Link href="/register" className="hover:text-accent transition-colors">Sign Up</Link></li>
              </ul>
            </div>
            <div className="space-y-3">
              <h5 className="text-white font-semibold">Resources</h5>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><a href="#" className="hover:text-accent transition-colors">Docs</a></li>
                <li><a href="#" className="hover:text-accent transition-colors">Support</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-white/10 pt-8">
            <div className="flex flex-col md:flex-row items-center justify-between text-gray-400 text-sm">
              <p>&copy; 2026 CoinCapTrading. All rights reserved.</p>
              <div className="flex gap-6 mt-4 md:mt-0">
                <a href="#" className="hover:text-accent transition-colors">Privacy Policy</a>
                <a href="#" className="hover:text-accent transition-colors">Terms of Service</a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
