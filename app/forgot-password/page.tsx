'use client';

import { useState } from 'react';
import { Mail, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle password reset logic here
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold leading-tight bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent mb-2">
            CryptoTrade
          </h1>
          <p className="text-gray-400">Reset your password</p>
        </div>

        {/* Forgot Password Form */}
        <div className="glass-card">
          {!submitted ? (
            <>
              <h2 className="text-2xl font-bold mb-2">Forgot Password?</h2>
              <p className="text-sm text-gray-400 mb-6">
                Enter your email address and we'll send you a link to reset your password.
              </p>

              <form className="space-y-4" onSubmit={handleSubmit}>
                {/* Email Input */}
                <div>
                  <label className="text-sm text-gray-400 block mb-2">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input
                      type="email"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="w-full pl-12 pr-4 py-3 rounded-lg bg-white/5 border border-white/10 focus:border-accent focus:outline-none min-h-[44px]"
                    />
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  className="w-full py-3 px-4 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold transition-all min-h-[44px] mt-6"
                >
                  Send Reset Link
                </button>
              </form>
            </>
          ) : (
            <>
              <div className="text-center py-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center mx-auto mb-4">
                  <Mail className="text-white" size={32} />
                </div>
                <h2 className="text-2xl font-bold mb-2">Check Your Email</h2>
                <p className="text-gray-400 mb-6">
                  We've sent a password reset link to <span className="text-white font-semibold">{email}</span>
                </p>
                <p className="text-sm text-gray-500 mb-6">
                  Didn't receive the email? Check your spam folder or try another email address.
                </p>
                <button
                  onClick={() => setSubmitted(false)}
                  className="w-full py-3 px-4 rounded-lg bg-white/10 hover:bg-white/20 text-white font-semibold transition-all min-h-[44px]"
                >
                  Try Another Email
                </button>
              </div>
            </>
          )}

          {/* Back to Login Link */}
          <div className="mt-6 text-center">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 text-accent hover:text-blue-300 transition-colors"
            >
              <ArrowLeft size={18} />
              Back to Login
            </Link>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-gray-500 mt-8">
          © 2024 CryptoTrade. All rights reserved.
        </p>
      </div>
    </div>
  );
}
