'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Copy, Lock, Globe, Home, HelpCircle, Bell, Info, LogOut, Shield, Headphones } from 'lucide-react';
import Image from 'next/image';

export default function SettingsPage() {
  const router = useRouter();
  const [copied, setCopied] = useState<string | null>(null);

  const handleCopy = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleSignOut = () => {
    router.push('/login');
  };

  const handleBack = () => {
    router.push('/');
  };

  return (
    <div className="h-screen bg-[#0a0a0a] flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-50 flex items-center justify-between p-4 glass border-b border-white/10">
        <button
          onClick={handleBack}
          className="p-2 hover:bg-white/10 rounded-lg transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
        >
          <ArrowLeft size={24} className="text-white" />
        </button>
        <h1 className="text-white font-semibold text-lg">Account Settings</h1>
        <div className="w-10 h-10" />
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Profile Section */}
        <div className="p-6 space-y-4">
          <div className="glass-card">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-400 to-purple-600 flex items-center justify-center text-white text-2xl font-bold border-2 border-accent">
                KG
              </div>
              <div className="flex-1">
                <p className="text-white text-lg font-semibold">KG</p>
                <p className="text-xs text-gray-400">Premium Member</p>
              </div>
            </div>
          </div>

          {/* UID and Referral */}
          <div className="space-y-3">
            <div className="glass-card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-400">UID</p>
                  <p className="text-white font-semibold">1106103</p>
                </div>
                <button
                  onClick={() => handleCopy('1106103', 'uid')}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
                >
                  <Copy size={18} className={copied === 'uid' ? 'text-success' : 'text-gray-400'} />
                </button>
              </div>
            </div>

            <div className="glass-card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-400">Referral Code</p>
                  <p className="text-white font-semibold">REF1234567</p>
                </div>
                <button
                  onClick={() => handleCopy('REF1234567', 'referral')}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
                >
                  <Copy size={18} className={copied === 'referral' ? 'text-success' : 'text-gray-400'} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Settings Menu */}
        <div className="p-6 space-y-6 pb-20">
          {/* Account Section */}
          <div className="space-y-2">
            <p className="text-xs text-gray-400 font-semibold px-2">ACCOUNT</p>
            <div className="space-y-2">
              <button className="w-full glass-card flex items-center justify-between hover:bg-white/10 transition-colors">
                <div className="flex items-center gap-3">
                  <Shield size={18} className="text-accent" />
                  <p className="text-white font-medium text-sm">Authentication</p>
                </div>
                <span className="text-xs bg-success/20 text-success px-3 py-1 rounded-full font-semibold">Certified</span>
              </button>

              <button className="w-full glass-card flex items-center justify-between hover:bg-white/10 transition-colors">
                <div className="flex items-center gap-3">
                  <Globe size={18} className="text-purple-400" />
                  <p className="text-white font-medium text-sm">Language</p>
                </div>
                <span className="text-xs text-gray-400">English</span>
              </button>

              <button className="w-full glass-card flex items-center justify-between hover:bg-white/10 transition-colors">
                <div className="flex items-center gap-3">
                  <Home size={18} className="text-cyan-400" />
                  <p className="text-white font-medium text-sm">Withdrawal Address</p>
                </div>
              </button>

              <button className="w-full glass-card flex items-center justify-between hover:bg-white/10 transition-colors">
                <div className="flex items-center gap-3">
                  <Lock size={18} className="text-orange-400" />
                  <p className="text-white font-medium text-sm">Password Setting</p>
                </div>
              </button>
            </div>
          </div>

          {/* Support Section */}
          <div className="space-y-2">
            <p className="text-xs text-gray-400 font-semibold px-2">SUPPORT</p>
            <div className="space-y-2">
              <button className="w-full glass-card flex items-center justify-between hover:bg-white/10 transition-colors">
                <div className="flex items-center gap-3">
                  <HelpCircle size={18} className="text-green-400" />
                  <p className="text-white font-medium text-sm">Help Center</p>
                </div>
              </button>

              <button className="w-full glass-card flex items-center justify-between hover:bg-white/10 transition-colors">
                <div className="flex items-center gap-3">
                  <Bell size={18} className="text-yellow-400" />
                  <p className="text-white font-medium text-sm">Notification</p>
                </div>
                <span className="text-xs bg-accent/20 text-accent px-3 py-1 rounded-full font-semibold">New</span>
              </button>

              <button className="w-full glass-card flex items-center justify-between hover:bg-white/10 transition-colors">
                <div className="flex items-center gap-3">
                  <Info size={18} className="text-pink-400" />
                  <p className="text-white font-medium text-sm">About Us</p>
                </div>
              </button>

              <button className="w-full glass-card flex items-center justify-between hover:bg-white/10 transition-colors">
                <div className="flex items-center gap-3">
                  <Headphones size={18} className="text-indigo-400" />
                  <p className="text-white font-medium text-sm">MSB Certification</p>
                </div>
              </button>
            </div>
          </div>

          {/* Sign Out */}
          <div className="pt-4">
            <button
              onClick={handleSignOut}
              className="w-full glass-card flex items-center gap-3 p-4 rounded-lg hover:bg-danger/10 transition-colors text-danger font-medium"
            >
              <LogOut size={18} />
              <p>Sign Out</p>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
