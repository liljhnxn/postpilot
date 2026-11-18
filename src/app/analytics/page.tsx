'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { AppLayout } from '@/components/layout/AppLayout';
import { useAuth } from '@/context/AuthContext';
import {
  BarChart3,
  TrendingUp,
  CheckCircle2,
  AlertOctagon,
  Clock,
  Users2,
  ExternalLink,
  Download,
  RefreshCw,
  Search,
  Filter,
  Layers,
  Sparkles,
  ArrowUpRight,
  Send,
  HelpCircle,
} from 'lucide-react';
import { formatDate } from '@/lib/utils';

interface AnalyticsData {
  success: boolean;
  timeframeDays: number;
  overview: {
    totalOperations: number;
    totalPublished: number;
    totalFailed: number;
    totalScheduled: number;
    totalPending: number;
    successRate: number;
    connectedAccountsCount: number;
  };
  formatBreakdown: {
    standalone: number;
    threads: number;
    media: number;
  };
  accountBreakdown: {
    id: string;
    username: string;
    displayName: string;
    profileImageUrl: string | null;
    published: number;
    failed: number;
    scheduled: number;
    totalOperations: number;
    successRate: number;
    lastActivity: string | null;
  }[];
  dailyVolume: {
    date: string;
    label: string;
    published: number;
    failed: number;
    scheduled: number;
  }[];
  auditLogs: {
    id: string;
    postId: string;
    content: string;
    username: string;
    displayName: string;
    profileImageUrl: string | null;
    status: string;
    scheduledAt: string | null;
    publishedAt: string | null;
    xPostId: string | null;
    errorMessage: string | null;
    retryCount: number;
    createdAt: string;
  }[];
}

export default function AnalyticsPage() {
  const { user } = useAuth();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [days, setDays] = useState<number>(14);

  // Audit filter state
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'failed' | 'scheduled'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchAnalytics = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/analytics?days=${days}`);
      if (!res.ok) {
        throw new Error(`Failed to load analytics: HTTP ${res.status}`);
      }
      const json = await res.json();
      setData(json);
    } catch (err: any) {
      console.error('Error fetching analytics:', err);
      setError(err.message || 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [days]);

  // Export CSV Handler
  const handleExportCSV = () => {
    if (!data || !data.auditLogs.length) return;

    const headers = ['ID', 'Date', 'Account', 'Status', 'Content Snippet', 'X Post ID', 'Error Reason'];
    const rows = data.auditLogs.map((log) => [
      `"${log.id}"`,
      `"${log.publishedAt || log.scheduledAt || log.createdAt}"`,
      `"@${log.username}"`,
      `"${log.status}"`,
      `"${log.content.replace(/"/g, '""').replace(/\n/g, ' ')}"`,
      `"${log.xPostId || ''}"`,
      `"${(log.errorMessage || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `postpilot-audit-report-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filtered audit logs
  const filteredLogs = (data?.auditLogs || []).filter((log) => {
    const matchesStatus = statusFilter === 'all' || log.status === statusFilter;
    const matchesSearch =
      !searchQuery.trim() ||
      log.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (log.errorMessage && log.errorMessage.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesStatus && matchesSearch;
  });

  // Calculate highest volume in daily chart for scale
  const maxDailyVolume = Math.max(
    1,
    ...(data?.dailyVolume.map((v) => v.published + v.failed + v.scheduled) || [1])
  );

  return (
    <AppLayout title="Analytics & Performance">
      <div className="space-y-8 max-w-7xl mx-auto">
        {/* Header & Controls */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-2xl font-bold tracking-tight text-[#F8FAFC]">
                Performance & Telemetry
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#8B5CF6]/15 text-[#A78BFA] border border-[#8B5CF6]/30">
                Live Insights
              </span>
            </div>
            <p className="text-sm text-[#94A3B8] mt-1">
              Multi-account publishing metrics, delivery reliability, format breakdown, and dispatch logs.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Timeframe Selector */}
            <div className="inline-flex rounded-lg bg-[#121A2B] p-1 border border-[rgba(148,163,184,0.12)]">
              {[
                { label: '7 Days', val: 7 },
                { label: '14 Days', val: 14 },
                { label: '30 Days', val: 30 },
              ].map((t) => (
                <button
                  key={t.val}
                  onClick={() => setDays(t.val)}
                  className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                    days === t.val
                      ? 'bg-[#8B5CF6] text-white shadow-sm'
                      : 'text-[#94A3B8] hover:text-[#F8FAFC]'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Refresh Button */}
            <button
              onClick={fetchAnalytics}
              disabled={loading}
              className="p-2 rounded-lg bg-[#121A2B] hover:bg-[#172137] text-[#94A3B8] hover:text-[#F8FAFC] border border-[rgba(148,163,184,0.12)] transition-colors disabled:opacity-50"
              title="Refresh Telemetry"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>

            {/* Export CSV Button */}
            <button
              onClick={handleExportCSV}
              disabled={!data?.auditLogs.length}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-[#121A2B] hover:bg-[#172137] text-[#94A3B8] hover:text-[#F8FAFC] border border-[rgba(148,163,184,0.12)] text-xs font-medium transition-colors disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5 text-[#8B5CF6]" />
              <span>Export CSV</span>
            </button>

            {/* Compose Shortcut */}
            <Link
              href="/composer"
              className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg button-primary text-xs font-semibold"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Create Post</span>
            </Link>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center justify-between">
            <span>{error}</span>
            <button onClick={fetchAnalytics} className="underline hover:text-white">
              Retry
            </button>
          </div>
        )}

        {/* 4 Key Performance Metrics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* 1. Success Rate */}
          <div className="luxury-card p-5 relative overflow-hidden group">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-[#94A3B8]">Delivery Success Rate</span>
              <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline space-x-2">
              <span className="text-3xl font-bold text-[#F8FAFC]">
                {loading ? '...' : `${data?.overview.successRate || 100}%`}
              </span>
              <span className="text-xs text-emerald-400 font-medium">Reliable</span>
            </div>
            <div className="w-full bg-[#121A2B] h-1.5 rounded-full mt-3 overflow-hidden">
              <div
                className="bg-emerald-400 h-full rounded-full transition-all duration-500"
                style={{ width: `${data?.overview.successRate || 100}%` }}
              />
            </div>
          </div>

          {/* 2. Total Published Posts */}
          <div className="luxury-card p-5 relative overflow-hidden group">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-[#94A3B8]">Published Operations</span>
              <div className="p-2 rounded-lg bg-violet-500/10 border border-violet-500/20 text-violet-400">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline space-x-2">
              <span className="text-3xl font-bold text-[#F8FAFC]">
                {loading ? '...' : data?.overview.totalPublished || 0}
              </span>
              <span className="text-xs text-[#94A3B8]">Dispatched to X</span>
            </div>
            <p className="text-[11px] text-[#64748B] mt-2">
              Total successful tweets published across all accounts
            </p>
          </div>

          {/* 3. Scheduled Queue */}
          <div className="luxury-card p-5 relative overflow-hidden group">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-[#94A3B8]">Scheduled Pipeline</span>
              <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline space-x-2">
              <span className="text-3xl font-bold text-[#F8FAFC]">
                {loading ? '...' : data?.overview.totalScheduled || 0}
              </span>
              <span className="text-xs text-blue-400">Queued</span>
            </div>
            <p className="text-[11px] text-[#64748B] mt-2">
              Automated interval posts waiting to be broadcast
            </p>
          </div>

          {/* 4. Active Accounts */}
          <div className="luxury-card p-5 relative overflow-hidden group">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-[#94A3B8]">Connected Profiles</span>
              <div className="p-2 rounded-lg bg-[#8B5CF6]/15 border border-[#8B5CF6]/30 text-[#A78BFA]">
                <Users2 className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline space-x-2">
              <span className="text-3xl font-bold text-[#F8FAFC]">
                {loading ? '...' : data?.overview.connectedAccountsCount || 0}
              </span>
              <span className="text-xs text-violet-400">Channels</span>
            </div>
            <p className="text-[11px] text-[#64748B] mt-2">
              AES-256-GCM protected authentications
            </p>
          </div>
        </div>

        {/* Middle Row: Publishing Velocity Chart & Content Format Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Daily Publishing Velocity (2 Columns) */}
          <div className="lg:col-span-2 luxury-card p-6 flex flex-col justify-between">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-[rgba(148,163,184,0.1)]">
              <div>
                <h3 className="text-base font-semibold text-[#F8FAFC]">
                  Publishing Velocity
                </h3>
                <p className="text-xs text-[#94A3B8]">
                  Daily volume over the past {days} days
                </p>
              </div>
              <div className="flex items-center space-x-4 text-xs">
                <span className="flex items-center space-x-1.5 text-emerald-400">
                  <span className="w-2.5 h-2.5 rounded-sm bg-emerald-400 inline-block" />
                  <span>Published</span>
                </span>
                <span className="flex items-center space-x-1.5 text-blue-400">
                  <span className="w-2.5 h-2.5 rounded-sm bg-blue-400 inline-block" />
                  <span>Scheduled</span>
                </span>
                <span className="flex items-center space-x-1.5 text-rose-400">
                  <span className="w-2.5 h-2.5 rounded-sm bg-rose-400 inline-block" />
                  <span>Failed</span>
                </span>
              </div>
            </div>

            {/* Custom SVG Bar Chart */}
            <div className="py-2">
              {loading ? (
                <div className="h-48 flex items-center justify-center text-xs text-[#94A3B8]">
                  Loading velocity metrics...
                </div>
              ) : !data?.dailyVolume.length ? (
                <div className="h-48 flex items-center justify-center text-xs text-[#94A3B8]">
                  No publishing activity in this timeframe
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="h-48 flex items-end justify-between gap-1 sm:gap-2 pt-6 px-2">
                    {data.dailyVolume.map((item, idx) => {
                      const total = item.published + item.failed + item.scheduled;
                      const barHeight = total > 0 ? Math.max(12, (total / maxDailyVolume) * 160) : 4;

                      return (
                        <div
                          key={idx}
                          className="flex-1 flex flex-col items-center group relative cursor-pointer"
                        >
                          {/* Tooltip Hover Bubble */}
                          <div className="absolute -top-12 z-20 hidden group-hover:flex flex-col items-center pointer-events-none">
                            <div className="bg-[#0B1020] border border-[#8B5CF6]/40 text-[#F8FAFC] text-[10px] py-1 px-2 rounded-md shadow-xl whitespace-nowrap">
                              <span className="font-semibold text-[#A78BFA]">{item.label}</span>
                              <div className="text-[9px] text-[#94A3B8] mt-0.5">
                                Pub: {item.published} • Sch: {item.scheduled} • Fail: {item.failed}
                              </div>
                            </div>
                            <div className="w-1.5 h-1.5 bg-[#0B1020] border-r border-b border-[#8B5CF6]/40 rotate-45 -mt-0.5" />
                          </div>

                          {/* Stacked Bar */}
                          <div
                            className="w-full max-w-[28px] rounded-t-sm transition-all duration-300 flex flex-col-reverse overflow-hidden"
                            style={{ height: `${barHeight}px` }}
                          >
                            {item.published > 0 && (
                              <div
                                className="bg-emerald-400 w-full"
                                style={{ height: `${(item.published / (total || 1)) * 100}%` }}
                              />
                            )}
                            {item.scheduled > 0 && (
                              <div
                                className="bg-blue-400 w-full"
                                style={{ height: `${(item.scheduled / (total || 1)) * 100}%` }}
                              />
                            )}
                            {item.failed > 0 && (
                              <div
                                className="bg-rose-400 w-full"
                                style={{ height: `${(item.failed / (total || 1)) * 100}%` }}
                              />
                            )}
                            {total === 0 && (
                              <div className="bg-[#172137] hover:bg-[#8B5CF6]/30 h-full w-full rounded-t-sm" />
                            )}
                          </div>

                          {/* Date Label */}
                          <span className="text-[10px] text-[#64748B] mt-2 group-hover:text-[#F8FAFC] truncate w-full text-center">
                            {item.label.split(' ')[1] || item.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-[rgba(148,163,184,0.06)] flex items-center justify-between text-xs text-[#64748B]">
              <span>Timeline: Past {days} calendar days</span>
              <span>Total Volume: {data?.overview.totalOperations || 0} operations</span>
            </div>
          </div>

          {/* Content Format Distribution (1 Column) */}
          <div className="luxury-card p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center space-x-2 pb-4 mb-4 border-b border-[rgba(148,163,184,0.1)]">
                <Layers className="w-4 h-4 text-[#8B5CF6]" />
                <h3 className="text-base font-semibold text-[#F8FAFC]">
                  Content Formats
                </h3>
              </div>
              <p className="text-xs text-[#94A3B8] mb-6">
                Breakdown of how your content was formatted and packaged.
              </p>

              <div className="space-y-4">
                {/* Standalone Posts */}
                <div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-[#F8FAFC] font-medium">Standalone Posts</span>
                    <span className="text-[#94A3B8] font-mono">
                      {data?.formatBreakdown.standalone || 0}
                    </span>
                  </div>
                  <div className="w-full bg-[#121A2B] h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-[#8B5CF6] h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${
                          data?.overview.totalOperations
                            ? ((data.formatBreakdown.standalone / data.overview.totalOperations) * 100).toFixed(0)
                            : 0
                        }%`,
                      }}
                    />
                  </div>
                </div>

                {/* X Threads */}
                <div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-[#F8FAFC] font-medium flex items-center space-x-1">
                      <span>🧵 Multi-Tweet Threads</span>
                    </span>
                    <span className="text-[#94A3B8] font-mono">
                      {data?.formatBreakdown.threads || 0}
                    </span>
                  </div>
                  <div className="w-full bg-[#121A2B] h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-blue-400 h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${
                          data?.overview.totalOperations
                            ? ((data.formatBreakdown.threads / data.overview.totalOperations) * 100).toFixed(0)
                            : 0
                        }%`,
                      }}
                    />
                  </div>
                </div>

                {/* Media Attachments */}
                <div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-[#F8FAFC] font-medium flex items-center space-x-1">
                      <span>🖼️ Posts with Media</span>
                    </span>
                    <span className="text-[#94A3B8] font-mono">
                      {data?.formatBreakdown.media || 0}
                    </span>
                  </div>
                  <div className="w-full bg-[#121A2B] h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-emerald-400 h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${
                          data?.overview.totalOperations
                            ? ((data.formatBreakdown.media / data.overview.totalOperations) * 100).toFixed(0)
                            : 0
                        }%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-[#0B1020]/60 border border-[rgba(148,163,184,0.08)] mt-6 text-[11px] text-[#94A3B8] flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-[#A78BFA] shrink-0" />
              <span>Use the AI Enhancer in the composer to optimize engagement across formats.</span>
            </div>
          </div>
        </div>

        {/* Multi-Account Comparison Matrix */}
        <div className="luxury-card p-6">
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-[rgba(148,163,184,0.1)]">
            <div className="flex items-center space-x-2">
              <Users2 className="w-4 h-4 text-[#8B5CF6]" />
              <h3 className="text-base font-semibold text-[#F8FAFC]">
                Channel Breakdown & Reliability
              </h3>
            </div>
            <Link
              href="/accounts"
              className="text-xs text-[#8B5CF6] hover:text-[#A78BFA] transition-colors flex items-center space-x-1"
            >
              <span>Manage Accounts</span>
              <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[rgba(148,163,184,0.08)] text-[#64748B] uppercase tracking-wider text-[10px]">
                  <th className="pb-3 font-semibold">Account Profile</th>
                  <th className="pb-3 font-semibold">Total Operations</th>
                  <th className="pb-3 font-semibold">Published</th>
                  <th className="pb-3 font-semibold">Scheduled</th>
                  <th className="pb-3 font-semibold">Failed</th>
                  <th className="pb-3 font-semibold">Success Rate</th>
                  <th className="pb-3 font-semibold">Last Activity</th>
                  <th className="pb-3 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[rgba(148,163,184,0.06)]">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="py-6 text-center text-[#94A3B8]">
                      Loading channel metrics...
                    </td>
                  </tr>
                ) : !data?.accountBreakdown.length ? (
                  <tr>
                    <td colSpan={8} className="py-6 text-center text-[#94A3B8]">
                      No accounts connected yet.{' '}
                      <Link href="/accounts" className="text-[#8B5CF6] underline">
                        Connect an X account
                      </Link>
                    </td>
                  </tr>
                ) : (
                  data.accountBreakdown.map((acc) => (
                    <tr key={acc.id} className="hover:bg-[#121A2B]/40 transition-colors">
                      <td className="py-3.5 pr-4">
                        <div className="flex items-center space-x-2.5">
                          {acc.profileImageUrl ? (
                            <img
                              src={acc.profileImageUrl}
                              alt={acc.username}
                              className="w-7 h-7 rounded-full border border-[rgba(148,163,184,0.15)]"
                            />
                          ) : (
                            <div className="w-7 h-7 rounded-full bg-[#8B5CF6]/20 text-[#A78BFA] flex items-center justify-center font-bold text-xs">
                              {acc.username.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div>
                            <div className="font-semibold text-[#F8FAFC]">
                              {acc.displayName}
                            </div>
                            <div className="text-[11px] text-[#8B5CF6]">@{acc.username}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 font-mono text-[#F8FAFC]">{acc.totalOperations}</td>
                      <td className="py-3.5 font-mono text-emerald-400 font-medium">
                        {acc.published}
                      </td>
                      <td className="py-3.5 font-mono text-blue-400">{acc.scheduled}</td>
                      <td className="py-3.5 font-mono text-rose-400">{acc.failed}</td>
                      <td className="py-3.5">
                        <div className="flex items-center space-x-2">
                          <span
                            className={`font-semibold ${
                              acc.successRate >= 90
                                ? 'text-emerald-400'
                                : acc.successRate >= 70
                                ? 'text-amber-400'
                                : 'text-rose-400'
                            }`}
                          >
                            {acc.successRate}%
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 text-[#94A3B8]">
                        {acc.lastActivity ? formatDate(acc.lastActivity) : '—'}
                      </td>
                      <td className="py-3.5 text-right">
                        <a
                          href={`https://x.com/${acc.username}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center space-x-1 text-[#8B5CF6] hover:text-[#A78BFA] transition-colors"
                        >
                          <span>Profile</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Detailed Delivery Audit Trail Log */}
        <div className="luxury-card p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 mb-4 border-b border-[rgba(148,163,184,0.1)]">
            <div>
              <h3 className="text-base font-semibold text-[#F8FAFC]">
                Live Dispatch Audit Trail
              </h3>
              <p className="text-xs text-[#94A3B8]">
                Real-time execution log of publishing dispatches, statuses, and external IDs.
              </p>
            </div>

            {/* Filter Pills and Search */}
            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-48">
                <Search className="w-3.5 h-3.5 text-[#64748B] absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  placeholder="Search logs..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-[#0B1020] border border-[rgba(148,163,184,0.15)] text-xs text-[#F8FAFC] placeholder-[#64748B] focus:outline-none focus:border-[#8B5CF6]"
                />
              </div>

              <div className="inline-flex rounded-lg bg-[#0B1020] p-1 border border-[rgba(148,163,184,0.12)]">
                {(['all', 'published', 'failed', 'scheduled'] as const).map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setStatusFilter(filter)}
                    className={`px-2.5 py-1 text-[11px] font-semibold rounded capitalize transition-all ${
                      statusFilter === filter
                        ? 'bg-[#8B5CF6] text-white shadow-sm'
                        : 'text-[#94A3B8] hover:text-[#F8FAFC]'
                    }`}
                  >
                    {filter}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[rgba(148,163,184,0.08)] text-[#64748B] uppercase tracking-wider text-[10px]">
                  <th className="pb-3 font-semibold">Account</th>
                  <th className="pb-3 font-semibold">Post Content Snippet</th>
                  <th className="pb-3 font-semibold">Status</th>
                  <th className="pb-3 font-semibold">Dispatched / Due</th>
                  <th className="pb-3 font-semibold text-right">External Link</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[rgba(148,163,184,0.06)]">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-[#94A3B8]">
                      Loading audit records...
                    </td>
                  </tr>
                ) : filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-[#94A3B8]">
                      No audit logs matching this query
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-[#121A2B]/40 transition-colors">
                      <td className="py-3 pr-4 font-semibold text-violet-400 whitespace-nowrap">
                        @{log.username}
                      </td>
                      <td className="py-3 pr-4 max-w-md">
                        <p className="text-xs text-[#F8FAFC] line-clamp-1">{log.content}</p>
                        {log.errorMessage && (
                          <p className="text-[11px] text-rose-400 mt-0.5 line-clamp-1">
                            Error: {log.errorMessage}
                          </p>
                        )}
                      </td>
                      <td className="py-3 pr-4">
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                            log.status === 'published'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : log.status === 'failed'
                              ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                              : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                          }`}
                        >
                          {log.status}
                        </span>
                      </td>
                      <td className="py-3 pr-4 text-[#94A3B8] whitespace-nowrap">
                        {formatDate(log.publishedAt || log.scheduledAt || log.createdAt)}
                      </td>
                      <td className="py-3 text-right">
                        {log.xPostId ? (
                          <a
                            href={`https://x.com/${log.username}/status/${log.xPostId}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center space-x-1 text-[#8B5CF6] hover:text-[#A78BFA] transition-colors"
                          >
                            <span>View Tweet</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        ) : (
                          <span className="text-[#64748B]">—</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

