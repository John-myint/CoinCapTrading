'use client';

import { useState } from 'react';
import { Mail, Lock, User, Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold leading-tight bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent mb-2">
            CryptoTrade
          </h1>
          <p className="text-gray-400">Create your account and start trading.</p>
        </div>

        {/* Register Form */}
        <div className="glass-card">
          <h2 className="text-2xl font-bold mb-6">Sign Up</h2>

          <form className="space-y-4">
            {/* Full Name Input */}
            <div>
              <label className="text-sm text-gray-400 block mb-2">Full Name</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Enter your full name"
                  className="w-full pl-12 pr-4 py-3 rounded-lg bg-white/5 border border-white/10 focus:border-accent focus:outline-none min-h-[44px]"
                />
              </div>
            </div>

            {/* Email Input */}
            <div>
              <label className="text-sm text-gray-400 block mb-2">Email</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="w-full pl-12 pr-4 py-3 rounded-lg bg-white/5 border border-white/10 focus:border-accent focus:outline-none min-h-[44px]"
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <label className="text-sm text-gray-400 block mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Create a password"
                  className="w-full pl-12 pr-12 py-3 rounded-lg bg-white/5 border border-white/10 focus:border-accent focus:outline-none min-h-[44px]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {/* Confirm Password Input */}
            <div>
              <label className="text-sm text-gray-400 block mb-2">Confirm Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Confirm your password"
                  className="w-full pl-12 pr-12 py-3 rounded-lg bg-white/5 border border-white/10 focus:border-accent focus:outline-none min-h-[44px]"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                >
                  {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {/* Terms & Conditions */}
            <label className="flex items-start gap-2 cursor-pointer">
              <input
                type="checkbox"
                className="w-4 h-4 mt-1 rounded bg-white/5 border-white/10 accent-accent"
              />
              <span className="text-sm text-gray-400">
                I agree to the{' '}
                <Link href="/terms" className="text-accent hover:text-accent/80">
                  Terms of Service
                </Link>{' '}
                and{' '}
                <Link href="/privacy" className="text-accent hover:text-accent/80">
                  Privacy Policy
                </Link>
              </span>
            </label>

            {/* Register Button */}
            <button
              type="submit"
              className="w-full py-3 rounded-lg bg-gradient-to-r from-accent to-purple-500 hover:from-accent/80 hover:to-purple-500/80 font-semibold transition-all min-h-[44px]"
            >
              Create Account
            </button>
          </form>

          {/* Sign In Link */}
          <p className="text-center mt-6 text-sm text-gray-400">
            Already have an account?{' '}
            <Link href="/login" className="text-accent hover:text-accent/80 font-semibold">
              Login
            </Link>
          </p>
        </div>

        {/* Additional Info */}
        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500">
            By signing up, you'll get access to advanced trading tools,
            real-time market data, and secure wallet management.
          </p>
        </div>
      </div>
    </div>
  );
}
