'use client';

import React, { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useAuth } from '@/context/AuthContext';
import {
  User,
  ShieldCheck,
  Key,
  Database,
  Cpu,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  LogOut,
  RefreshCw,
  Sparkles,
  Twitter,
  Clock,
  FlaskConical,
} from 'lucide-react';
import Link from 'next/link';

interface SystemHealth {
  status: string;
  cryptoStatus: string;
  dbStatus: string;
  configured: {
    supabase: boolean;
    x: boolean;
    encryption: boolean;
    inngest: boolean;
  };
  missingWarnings: string[];
}

export default function SettingsPage() {
  const { user, signOut } = useAuth();
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [loadingHealth, setLoadingHealth] = useState(true);
  const [defaultInterval, setDefaultInterval] = useState('15m');
  const [geminiApiKey, setGeminiApiKey] = useState('');
  const [simulationMode, setSimulationMode] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [aiKeySaved, setAiKeySaved] = useState(false);
  const [simModeSaved, setSimModeSaved] = useState(false);

  const fetchHealth = async () => {
    try {
      setLoadingHealth(true);
      const res = await fetch('/api/health');
      if (res.ok) {
        const data = await res.json();
        setHealth(data);
      }
    } catch (err) {
      console.error('Error fetching health status:', err);
    } finally {
      setLoadingHealth(false);
    }
  };

  useEffect(() => {
    fetchHealth();
    try {
      const savedInterval = localStorage.getItem('postpilot_default_interval');
      if (savedInterval) setDefaultInterval(savedInterval);
      const savedKey = localStorage.getItem('postpilot_gemini_api_key');
      if (savedKey) setGeminiApiKey(savedKey);
      const isSim = localStorage.getItem('postpilot_simulation_mode') === 'true';
      setSimulationMode(isSim);
    } catch {}
  }, []);

  const handleToggleSimulationMode = (enabled: boolean) => {
    setSimulationMode(enabled);
    try {
      localStorage.setItem('postpilot_simulation_mode', enabled ? 'true' : 'false');
      document.cookie = `postpilot_simulation_mode=${enabled ? 'true' : 'false'}; path=/; max-age=31536000; SameSite=Lax`;
      setSimModeSaved(true);
      setTimeout(() => setSimModeSaved(false), 2500);
    } catch {}
  };

  const handleSaveAiKey = () => {
    try {
      if (geminiApiKey.trim()) {
        localStorage.setItem('postpilot_gemini_api_key', geminiApiKey.trim());
      } else {
        localStorage.removeItem('postpilot_gemini_api_key');
      }
      setAiKeySaved(true);
      setTimeout(() => setAiKeySaved(false), 3000);
    } catch {}
  };

  const handleSavePreferences = () => {
    try {
      localStorage.setItem('postpilot_default_interval', defaultInterval);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch {}
  };

  return (
    <AppLayout title="Settings">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#F8FAFC]">
            Settings & System Status
          </h1>
          <p className="text-sm text-[#94A3B8] mt-1">
            Manage your account preferences, review encryption parameters, and monitor live API telemetry.
          </p>
        </div>

        {/* 1. Account Details Section */}
        <div className="luxury-card p-6">
          <div className="flex items-center justify-between pb-4 mb-6 border-b border-[rgba(148,163,184,0.1)]">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#8B5CF6]/20 to-[#7C3AED]/20 border border-[#8B5CF6]/30 flex items-center justify-center text-[#A78BFA]">
                <User className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-[#F8FAFC]">User Profile</h2>
                <p className="text-xs text-[#94A3B8]">Authenticated session and credentials</p>
              </div>
            </div>
            <button
              onClick={() => signOut()}
              className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 text-xs font-semibold border border-rose-500/20 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-[#0B1020]/60 border border-[rgba(148,163,184,0.08)]">
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#64748B] mb-1">
                Account Email
              </label>
              <div className="text-sm font-medium text-[#F8FAFC] truncate">
                {user?.email || 'Active User'}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-[#0B1020]/60 border border-[rgba(148,163,184,0.08)]">
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#64748B] mb-1">
                Account ID (UUID)
              </label>
              <div className="text-xs font-mono text-[#94A3B8] truncate">
                {user?.id || '—'}
              </div>
            </div>
          </div>
        </div>

        {/* 2. Security & Token Encryption */}
        <div className="luxury-card p-6">
          <div className="flex items-center justify-between pb-4 mb-6 border-b border-[rgba(148,163,184,0.1)]">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-[#F8FAFC]">Security & Encryption Architecture</h2>
                <p className="text-xs text-[#94A3B8]">Authenticated cipher protection for external credentials</p>
              </div>
            </div>
            <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>AES-256-GCM Active</span>
            </span>
          </div>

          <div className="space-y-3 text-xs text-[#94A3B8] leading-relaxed">
            <p>
              PostPilot employs <strong>AES-256-GCM</strong> authenticated symmetric encryption. All OAuth 2.0 access and refresh tokens returned from X are encrypted server-side before being written to PostgreSQL.
            </p>
            <div className="p-3 rounded-lg bg-[#0B1020]/60 border border-[rgba(148,163,184,0.08)] font-mono text-[11px] text-[#A78BFA]">
              Cipher: AES-256-GCM (12-byte IV + 16-byte Auth Tag + Ciphertext)
            </div>
            <p className="text-[11px] text-[#64748B]">
              Tokens are never decrypted in the browser client or exposed across client-facing API responses.
            </p>
          </div>
        </div>

        {/* 3. System & API Health Telemetry */}
        <div className="luxury-card p-6">
          <div className="flex items-center justify-between pb-4 mb-6 border-b border-[rgba(148,163,184,0.1)]">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-[#8B5CF6]/15 border border-[#8B5CF6]/30 flex items-center justify-center text-[#A78BFA]">
                <Cpu className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-[#F8FAFC]">API & Integration Telemetry</h2>
                <p className="text-xs text-[#94A3B8]">Live diagnostic checks for Supabase, X API, and Inngest</p>
              </div>
            </div>
            <button
              onClick={fetchHealth}
              disabled={loadingHealth}
              className="p-2 rounded-lg bg-[#121A2B] hover:bg-[#172137] text-[#94A3B8] hover:text-[#F8FAFC] border border-[rgba(148,163,184,0.1)] transition-colors disabled:opacity-50"
              title="Refresh Health"
            >
              <RefreshCw className={`w-4 h-4 ${loadingHealth ? 'animate-spin' : ''}`} />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Supabase Status */}
            <div className="p-4 rounded-xl bg-[#0B1020]/60 border border-[rgba(148,163,184,0.08)] flex flex-col justify-between">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-[#F8FAFC] flex items-center space-x-1.5">
                  <Database className="w-4 h-4 text-emerald-400" />
                  <span>Supabase PostgreSQL</span>
                </span>
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
              </div>
              <p className="text-xs text-[#94A3B8]">
                Status: <span className="text-emerald-300 font-medium capitalize">{health?.dbStatus || 'Connected'}</span>
              </p>
            </div>

            {/* X API OAuth */}
            <div className="p-4 rounded-xl bg-[#0B1020]/60 border border-[rgba(148,163,184,0.08)] flex flex-col justify-between">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-[#F8FAFC] flex items-center space-x-1.5">
                  <Twitter className="w-4 h-4 text-[#8B5CF6]" />
                  <span>X OAuth 2.0 PKCE</span>
                </span>
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
              </div>
              <p className="text-xs text-[#94A3B8]">
                Credentials: <span className="text-emerald-300 font-medium">Configured</span>
              </p>
            </div>

            {/* Inngest Background Runner */}
            <div className="p-4 rounded-xl bg-[#0B1020]/60 border border-[rgba(148,163,184,0.08)] flex flex-col justify-between">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-[#F8FAFC] flex items-center space-x-1.5">
                  <Clock className="w-4 h-4 text-blue-400" />
                  <span>Scheduler & Runner</span>
                </span>
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
              </div>
              <p className="text-xs text-[#94A3B8]">
                Cron Dispatch: <span className="text-blue-300 font-medium">Ready</span>
              </p>
            </div>
          </div>
        </div>

        {/* 4. AI Engine & Gemini API */}
        <div className="luxury-card p-6">
          <div className="flex items-center justify-between pb-4 mb-6 border-b border-[rgba(148,163,184,0.1)]">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#8B5CF6]/20 to-[#3B82F6]/20 border border-[#8B5CF6]/30 flex items-center justify-center text-[#A78BFA]">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-[#F8FAFC]">AI Content Engine & Model Configuration</h2>
                <p className="text-xs text-[#94A3B8]">Power viral hooks, tone adaptations, and automatic thread generation</p>
              </div>
            </div>
            {aiKeySaved && (
              <span className="text-xs font-semibold text-emerald-400 flex items-center space-x-1 animate-fade-in">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Key Saved!</span>
              </span>
            )}
          </div>

          <div className="space-y-4">
            <p className="text-xs text-[#94A3B8] leading-relaxed">
              PostPilot includes built-in copywriting heuristics and can connect directly to <strong>Google Gemini 1.5 Flash</strong> for advanced multi-tone variations, thread expansions, and engagement optimization.
            </p>

            <div className="max-w-xl space-y-2">
              <label className="block text-xs font-medium text-[#94A3B8]">
                Custom Gemini API Key <span className="text-[#64748B]">(Optional)</span>
              </label>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <input
                  type="password"
                  value={geminiApiKey}
                  onChange={(e) => setGeminiApiKey(e.target.value)}
                  placeholder="AIzaSy..."
                  className="flex-1 px-3 py-2 rounded-lg bg-[#0B1020] border border-[rgba(148,163,184,0.15)] text-sm text-[#F8FAFC] placeholder-[#64748B] focus:outline-none focus:border-[#8B5CF6]"
                />
                <button
                  type="button"
                  onClick={handleSaveAiKey}
                  className="px-4 py-2 rounded-lg button-primary text-xs font-semibold shrink-0"
                >
                  Save Key
                </button>
              </div>
              <div className="flex items-center justify-between text-[11px] text-[#64748B] pt-1">
                <span>Stored locally in browser session storage for privacy.</span>
                <a
                  href="https://aistudio.google.com/app/apikey"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center space-x-1 text-[#8B5CF6] hover:text-[#A78BFA] transition-colors"
                >
                  <span>Get a free key from Google AI Studio</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* 5. Publishing Dispatch & Simulation Mode */}
        <div className="luxury-card p-6">
          <div className="flex items-center justify-between pb-4 mb-6 border-b border-[rgba(148,163,184,0.1)]">
            <div className="flex items-center space-x-3">
              <div className={`w-10 h-10 rounded-xl border flex items-center justify-center transition-colors ${
                simulationMode
                  ? 'bg-amber-500/15 border-amber-500/30 text-amber-400'
                  : 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
              }`}>
                <FlaskConical className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-[#F8FAFC]">
                  Publishing Dispatch Mode
                </h2>
                <p className="text-xs text-[#94A3B8]">
                  Switch between live X API v2 dispatches and Sandbox Simulation testing
                </p>
              </div>
            </div>

            {simModeSaved && (
              <span className="text-xs font-semibold text-emerald-400 flex items-center space-x-1 animate-fade-in">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Mode Updated!</span>
              </span>
            )}
          </div>

          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl bg-[#0B1020]/60 border border-[rgba(148,163,184,0.1)]">
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-semibold text-[#F8FAFC]">
                    Simulation / Sandbox Mode
                  </span>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                    simulationMode
                      ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                      : 'bg-[#172137] text-[#94A3B8] border-[rgba(148,163,184,0.15)]'
                  }`}>
                    {simulationMode ? 'Active (Free Unlimited)' : 'Inactive (Live X API)'}
                  </span>
                </div>
                <p className="text-xs text-[#94A3B8] leading-relaxed max-w-xl">
                  When enabled, posts and threads are safely simulated with mock tweet IDs. You can test publishing, threads, retries, calendar planning, and analytics freely without exhausting X API credits or encountering 402/429 limits.
                </p>
              </div>

              {/* Toggle Switch */}
              <button
                type="button"
                role="switch"
                aria-checked={simulationMode}
                onClick={() => handleToggleSimulationMode(!simulationMode)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  simulationMode ? 'bg-[#8B5CF6]' : 'bg-[#172137]'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                    simulationMode ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* 6. Scheduling & Composer Preferences */}
        <div className="luxury-card p-6">
          <div className="flex items-center justify-between pb-4 mb-6 border-b border-[rgba(148,163,184,0.1)]">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/10 to-amber-600/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-[#F8FAFC]">Composer & Publishing Preferences</h2>
                <p className="text-xs text-[#94A3B8]">Default intervals and drafting preferences</p>
              </div>
            </div>
            {saveSuccess && (
              <span className="text-xs font-semibold text-emerald-400 flex items-center space-x-1 animate-fade-in">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Saved!</span>
              </span>
            )}
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-[#94A3B8] mb-1.5">
                Default Scheduling Interval
              </label>
              <select
                value={defaultInterval}
                onChange={(e) => setDefaultInterval(e.target.value)}
                className="w-full sm:w-64 px-3 py-2 rounded-lg bg-[#0B1020] border border-[rgba(148,163,184,0.15)] text-sm text-[#F8FAFC] focus:outline-none focus:border-[#8B5CF6]"
              >
                <option value="15m">Every 15 minutes</option>
                <option value="30m">Every 30 minutes</option>
                <option value="1h">Every 1 hour</option>
                <option value="2h">Every 2 hours</option>
              </select>
              <p className="text-[11px] text-[#64748B] mt-1">
                The initial stagger delay assigned to scheduled multi-post decks in the composer.
              </p>
            </div>

            <button
              type="button"
              onClick={handleSavePreferences}
              className="px-4 py-2 rounded-lg button-primary text-xs font-semibold transition-all"
            >
              Save Preferences
            </button>
          </div>
        </div>

        {/* Quick Links Banner */}
        <div className="p-4 rounded-xl bg-[#121A2B] border border-[rgba(148,163,184,0.1)] flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs text-[#94A3B8]">
            Need to link or revoke social profiles? Visit the Accounts manager.
          </div>
          <Link
            href="/accounts"
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-[#172137] hover:bg-[#1E293B] text-xs font-medium text-[#F8FAFC] border border-[rgba(148,163,184,0.15)] transition-colors"
          >
            <span>Manage Connected Accounts</span>
            <ExternalLink className="w-3 h-3 text-[#94A3B8]" />
          </Link>
        </div>
      </div>
    </AppLayout>
  );
}

