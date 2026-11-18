'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { AppLayout } from '@/components/layout/AppLayout';
import {
  Users2,
  CheckCircle2,
  Clock,
  AlertOctagon,
  PlusCircle,
  ExternalLink,
  ArrowUpRight,
  Send,
  Calendar,
  AlertCircle,
  RefreshCw,
  BarChart3,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { DashboardStats, RecentActivityItem } from '@/types';
import { formatDate } from '@/lib/utils';
import { ConfigNotice } from '@/components/ui/ConfigNotice';
import {
  getDashboardStats,
  getRecentActivities,
  getUpcomingPosts,
} from '@/lib/services/dashboard';

export default function DashboardPage() {
  const { user, isConfigured, isLoading: authLoading } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    connectedAccounts: 0,
    totalPublishedPosts: 0,
    scheduledPosts: 0,
    failedPosts: 0,
  });
  const [recentActivities, setRecentActivities] = useState<RecentActivityItem[]>([]);
  const [upcomingPosts, setUpcomingPosts] = useState<RecentActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [envWarnings, setEnvWarnings] = useState<string[]>([]);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      if (!isConfigured) {
        setLoading(false);
        return;
      }

      if (!user) {
        setLoading(false);
        return;
      }

      const supabase = createClient();
      const [statsData, activitiesData, upcomingData] = await Promise.all([
        getDashboardStats(supabase, user.id),
        getRecentActivities(supabase, user.id, 5),
        getUpcomingPosts(supabase, user.id, 5),
      ]);

      setStats(statsData);
      setRecentActivities(activitiesData);
      setUpcomingPosts(upcomingData);
    } catch (err: any) {
      console.error('Failed to load dashboard telemetry:', err);
      setError(err.message || 'Failed to query dashboard statistics from database');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetch('/api/health')
      .then((res) => res.json())
      .then((data) => {
        if (data.missingWarnings) setEnvWarnings(data.missingWarnings);
      })
      .catch(() => {});
    if (!authLoading) {
      fetchDashboardData();
    }
  }, [user, isConfigured, authLoading]);

  const statCards = [
    {
      label: 'Connected Accounts',
      value: stats.connectedAccounts,
      icon: Users2,
      color: 'text-violet-400',
      bgColor: 'bg-violet-500/10',
      borderColor: 'border-violet-500/20',
      href: '/accounts',
    },
    {
      label: 'Total Published Posts',
      value: stats.totalPublishedPosts,
      icon: CheckCircle2,
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-500/10',
      borderColor: 'border-emerald-500/20',
      href: '/published',
    },
    {
      label: 'Scheduled Posts',
      value: stats.scheduledPosts,
      icon: Clock,
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/10',
      borderColor: 'border-blue-500/20',
      href: '/scheduled',
    },
    {
      label: 'Failed Posts',
      value: stats.failedPosts,
      icon: AlertOctagon,
      color: 'text-rose-400',
      bgColor: 'bg-rose-500/10',
      borderColor: 'border-rose-500/20',
      href: '/published?filter=failed',
    },
  ];

  return (
    <AppLayout title="Overview">
      {/* Notice Banner if Environment keys need configuration */}
      <ConfigNotice missingItems={envWarnings} />

      {/* Error Banner */}
      {error && (
        <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-xs flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={fetchDashboardData}
            className="flex items-center space-x-1 underline hover:text-white"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Retry</span>
          </button>
        </div>
      )}

      {/* Header with Quick Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-[#F8FAFC]">
            Dashboard
          </h2>
          <p className="text-sm text-[#94A3B8] mt-1">
            Real-time publishing operations and multiple X account telemetry.
          </p>
        </div>

        {/* Quick Actions (Section 4) */}
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <Link
            href="/analytics"
            className="flex-1 sm:flex-none inline-flex items-center justify-center space-x-2 px-3.5 py-2 rounded-lg bg-[#121A2B] hover:bg-[#172137] text-sm font-medium text-[#F8FAFC] border border-[rgba(148,163,184,0.15)] transition-colors"
          >
            <BarChart3 className="w-4 h-4 text-[#8B5CF6]" />
            <span>Analytics</span>
          </Link>
          <Link
            href="/accounts"
            className="flex-1 sm:flex-none inline-flex items-center justify-center space-x-2 px-3.5 py-2 rounded-lg button-secondary text-sm font-medium"
          >
            <Users2 className="w-4 h-4 text-[#8B5CF6]" />
            <span>Connect X Account</span>
          </Link>
          <Link
            href="/composer"
            className="flex-1 sm:flex-none inline-flex items-center justify-center space-x-2 px-4 py-2 rounded-lg button-primary text-sm font-medium"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Create Posts</span>
          </Link>
        </div>
      </div>

      {/* 4 Statistics Cards (Section 4) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <Link
              key={idx}
              href={stat.href}
              className="luxury-card p-5 block relative group hover:border-[rgba(139,92,246,0.3)]"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-[#94A3B8]">
                  {stat.label}
                </span>
                <div className={`p-2 rounded-lg ${stat.bgColor} border ${stat.borderColor}`}>
                  <Icon className={`w-4 h-4 ${stat.color}`} />
                </div>
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-3xl font-bold text-[#F8FAFC] tracking-tight">
                  {loading ? (
                    <span className="inline-block w-8 h-8 rounded bg-[#121A2B] animate-pulse" />
                  ) : (
                    stat.value
                  )}
                </span>
                <span className="text-xs text-[#64748B] group-hover:text-[#8B5CF6] transition-colors flex items-center">
                  View <ArrowUpRight className="w-3.5 h-3.5 ml-0.5" />
                </span>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Two Column Layout: Recent Activity & Upcoming Posts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity (Section 4) */}
        <div className="luxury-card p-6 flex flex-col">
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-[rgba(148,163,184,0.1)]">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-[#8B5CF6]" />
              <h3 className="text-base font-semibold text-[#F8FAFC]">
                Recent Activity
              </h3>
            </div>
            <Link
              href="/published"
              className="text-xs text-[#8B5CF6] hover:text-[#A78BFA] transition-colors flex items-center space-x-1"
            >
              <span>View all</span>
              <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="flex-1">
            {loading ? (
              <div className="space-y-3 py-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-16 rounded-lg bg-[#121A2B]/40 animate-pulse border border-[rgba(148,163,184,0.06)]" />
                ))}
              </div>
            ) : recentActivities.length === 0 ? (
              <div className="py-12 text-center flex flex-col items-center justify-center">
                <div className="w-12 h-12 rounded-full bg-[#121A2B] border border-[rgba(148,163,184,0.1)] flex items-center justify-center mb-3">
                  <Send className="w-5 h-5 text-[#64748B]" />
                </div>
                <p className="text-sm font-medium text-[#F8FAFC]">No recent activity</p>
                <p className="text-xs text-[#94A3B8] max-w-xs mt-1">
                  Once you publish posts across your connected X accounts, live publishing history will appear here.
                </p>
                <Link
                  href="/composer"
                  className="mt-4 px-3 py-1.5 rounded-lg button-primary text-xs font-medium inline-flex items-center space-x-1.5"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>Draft your first post</span>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {recentActivities.map((act) => (
                  <div
                    key={act.id}
                    className="p-3.5 rounded-lg bg-[#121A2B]/60 border border-[rgba(148,163,184,0.08)] hover:border-[rgba(148,163,184,0.18)] transition-all flex items-start justify-between gap-3"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-[#F8FAFC] line-clamp-2 leading-relaxed">
                        {act.content}
                      </p>
                      <div className="flex items-center space-x-2 mt-2 text-[11px] text-[#94A3B8]">
                        <span className="font-semibold text-violet-400">@{act.username}</span>
                        <span>•</span>
                        <span>{formatDate(act.publishedAt || act.scheduledAt)}</span>
                      </div>
                    </div>
                    <div className="flex-shrink-0 flex items-center space-x-2">
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                          act.status === 'published'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : act.status === 'failed'
                            ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                            : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                        }`}
                      >
                        {act.status}
                      </span>
                      {act.xPostId && (
                        <a
                          href={`https://x.com/${act.username}/status/${act.xPostId}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[#64748B] hover:text-[#F8FAFC] transition-colors"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Upcoming Posts (Section 4) */}
        <div className="luxury-card p-6 flex flex-col">
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-[rgba(148,163,184,0.1)]">
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4 text-[#8B5CF6]" />
              <h3 className="text-base font-semibold text-[#F8FAFC]">
                Upcoming Scheduled Posts
              </h3>
            </div>
            <Link
              href="/scheduled"
              className="text-xs text-[#8B5CF6] hover:text-[#A78BFA] transition-colors flex items-center space-x-1"
            >
              <span>View all</span>
              <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="flex-1">
            {loading ? (
              <div className="space-y-3 py-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-16 rounded-lg bg-[#121A2B]/40 animate-pulse border border-[rgba(148,163,184,0.06)]" />
                ))}
              </div>
            ) : upcomingPosts.length === 0 ? (
              <div className="py-12 text-center flex flex-col items-center justify-center">
                <div className="w-12 h-12 rounded-full bg-[#121A2B] border border-[rgba(148,163,184,0.1)] flex items-center justify-center mb-3">
                  <Calendar className="w-5 h-5 text-[#64748B]" />
                </div>
                <p className="text-sm font-medium text-[#F8FAFC]">No scheduled posts</p>
                <p className="text-xs text-[#94A3B8] max-w-xs mt-1">
                  Queue and schedule posts with interval timing across multiple accounts.
                </p>
                <Link
                  href="/composer"
                  className="mt-4 px-3 py-1.5 rounded-lg button-secondary text-xs font-medium inline-flex items-center space-x-1.5"
                >
                  <Clock className="w-3.5 h-3.5 text-[#8B5CF6]" />
                  <span>Schedule a post</span>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {upcomingPosts.map((up) => (
                  <div
                    key={up.id}
                    className="p-3.5 rounded-lg bg-[#121A2B]/60 border border-[rgba(148,163,184,0.08)] hover:border-[rgba(148,163,184,0.18)] transition-all flex items-start justify-between gap-3"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-[#F8FAFC] line-clamp-2 leading-relaxed">
                        {up.content}
                      </p>
                      <div className="flex items-center space-x-2 mt-2 text-[11px] text-[#94A3B8]">
                        <span className="font-semibold text-violet-400">@{up.username}</span>
                        <span>•</span>
                        <span className="text-blue-400">Due: {formatDate(up.scheduledAt)}</span>
                      </div>
                    </div>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                      Scheduled
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
