'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Send, Lock, Mail, ArrowRight, AlertCircle, CheckCircle2, Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';

function LoginForm({ defaultSignUp = false }: { defaultSignUp?: boolean }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams?.get('redirectTo') || '/dashboard';
  const urlError = searchParams?.get('error');
  const modeParam = searchParams?.get('mode');

  const { signIn, signUp, user, isConfigured } = useAuth();
  const [isSignUp, setIsSignUp] = useState(defaultSignUp || modeParam === 'signup');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(urlError || null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Load remembered email on mount
  useEffect(() => {
    try {
      const savedEmail = localStorage.getItem('postpilot_remember_email');
      if (savedEmail) {
        setEmail(savedEmail);
        setRememberMe(true);
      }
    } catch {
      // LocalStorage unavailable in certain sandboxes
    }
  }, []);

  useEffect(() => {
    if (user) {
      router.push(redirectTo);
    }
  }, [user, redirectTo, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setLoading(true);

    // Handle "Remember Me" persistence
    try {
      if (rememberMe) {
        localStorage.setItem('postpilot_remember_email', email);
      } else {
        localStorage.removeItem('postpilot_remember_email');
      }
    } catch {
      // LocalStorage access ignore
    }

    try {
      if (isSignUp) {
        // Use server-side signup API to bypass Supabase's public email rate limit
        const res = await fetch('/api/auth/signup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });

        const data = await res.json();
        if (!res.ok) {
          setError(data.error || 'Failed to create account');
          return;
        }

        // Immediately sign the user in to establish session
        const { error: signInErr } = await signIn(email, password);
        if (signInErr) {
          setSuccessMessage('Account created! Please sign in with your password.');
          setIsSignUp(false);
        } else {
          router.push(redirectTo);
        }
      } else {
        const { error: signInErr } = await signIn(email, password);

        if (signInErr) {
          setError(signInErr.message);
        } else {
          router.push(redirectTo);
        }
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred during authentication.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md relative z-10">
      {/* Brand Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-[#8B5CF6] to-[#7C3AED] text-white shadow-xl shadow-[#8B5CF6]/25 mb-4">
          <Send className="w-6 h-6 -rotate-45 translate-x-0.5 -translate-y-0.5" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-[#F8FAFC]">
          Post<span className="text-[#8B5CF6]">Pilot</span>
        </h1>
        <p className="text-sm text-[#94A3B8] mt-1">
          One Dashboard. Multiple Accounts. Effortless Publishing.
        </p>
      </div>

      {/* Card */}
      <div className="p-8 rounded-2xl bg-[#172137]/90 border border-[rgba(148,163,184,0.12)] backdrop-blur-xl shadow-2xl">
        {/* Mode Tabs */}
        <div className="flex p-1 mb-6 rounded-xl bg-[#0B1020]/60 border border-[rgba(148,163,184,0.08)]">
          <button
            type="button"
            onClick={() => {
              setIsSignUp(false);
              setError(null);
              setSuccessMessage(null);
            }}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
              !isSignUp
                ? 'bg-[#172137] text-[#F8FAFC] shadow-sm border border-[rgba(148,163,184,0.15)]'
                : 'text-[#94A3B8] hover:text-[#F8FAFC]'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setIsSignUp(true);
              setError(null);
              setSuccessMessage(null);
            }}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
              isSignUp
                ? 'bg-[#172137] text-[#F8FAFC] shadow-sm border border-[rgba(148,163,184,0.15)]'
                : 'text-[#94A3B8] hover:text-[#F8FAFC]'
            }`}
          >
            Create Account
          </button>
        </div>

        {/* Feedback Alerts */}
        {error && (
          <div className="mb-5 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-300 text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successMessage && (
          <div className="mb-5 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-[#94A3B8] mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-[#64748B] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-[#0B1020] border border-[rgba(148,163,184,0.15)] text-[#F8FAFC] placeholder-[#64748B] text-sm focus:outline-none focus:border-[#8B5CF6] focus:ring-1 focus:ring-[#8B5CF6] transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#94A3B8] mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-[#64748B] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-10 py-2.5 rounded-lg bg-[#0B1020] border border-[rgba(148,163,184,0.15)] text-[#F8FAFC] placeholder-[#64748B] text-sm focus:outline-none focus:border-[#8B5CF6] focus:ring-1 focus:ring-[#8B5CF6] transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-[#64748B] hover:text-[#F8FAFC] transition-colors rounded focus:outline-none focus:ring-1 focus:ring-[#8B5CF6]/50"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {/* Remember Me Option */}
          <div className="flex items-center justify-between pt-1">
            <label className="flex items-center space-x-2 text-xs text-[#94A3B8] cursor-pointer select-none group">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded bg-[#0B1020] border-[rgba(148,163,184,0.25)] text-[#8B5CF6] focus:ring-[#8B5CF6] focus:ring-offset-0 focus:ring-1 cursor-pointer accent-[#8B5CF6]"
              />
              <span className="group-hover:text-[#F8FAFC] transition-colors">
                Remember me
              </span>
            </label>
            <span className="text-[11px] text-[#64748B]">
              {isSignUp ? 'Encrypted storage' : 'Secured session'}
            </span>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-2.5 rounded-lg button-primary text-sm font-semibold flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span>{loading ? 'Processing...' : isSignUp ? 'Create PostPilot Account' : 'Sign In to PostPilot'}</span>
            {!loading && <ArrowRight className="w-4 h-4" />}
          </button>
        </form>
      </div>

      {/* Footer info */}
      <p className="text-center text-xs text-[#64748B] mt-6">
        Protected by Supabase Auth and AES-256-GCM token encryption.
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-[#0B1020] flex flex-col justify-center items-center px-4 relative overflow-hidden">
      {/* Background Ambient Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#8B5CF6]/10 rounded-full blur-[120px] pointer-events-none" />

      <Suspense fallback={<div className="text-sm text-[#94A3B8]">Loading login...</div>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
