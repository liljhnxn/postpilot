'use client';

import React, { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import {
  Clock,
  Calendar,
  Trash2,
  ExternalLink,
  PlusCircle,
  AlertCircle,
  CheckCircle2,
  Users,
} from 'lucide-react';
import Link from 'next/link';
import { formatDate } from '@/lib/utils';
import { PostTarget } from '@/types';

export default function ScheduledPage() {
  const [scheduledList, setScheduledList] = useState<PostTarget[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchScheduled = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/posts/scheduled');
      if (res.ok) {
        const data = await res.json();
        setScheduledList(data.scheduled || []);
      } else {
        const err = await res.json();
        setErrorMessage(err.error || 'Failed to fetch scheduled posts');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Error communicating with server');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchScheduled();
  }, []);

  const handleCancelTarget = async (id: string) => {
    if (!window.confirm('Are you sure you want to cancel this scheduled post dispatch?')) {
      return;
    }

    try {
      setCancellingId(id);
      const res = await fetch(`/api/posts/targets/${id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setScheduledList((prev) => prev.filter((item) => item.id !== id));
        setMessage('Scheduled post was cancelled.');
      } else {
        const err = await res.json();
        setErrorMessage(err.error || 'Failed to cancel scheduled post');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to cancel post');
    } finally {
      setCancellingId(null);
    }
  };

  return (
    <AppLayout title="Scheduled">
      {/* Success Notification */}
      {message && (
        <div className="mb-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            <span>{message}</span>
          </div>
          <button
            onClick={() => setMessage(null)}
            className="text-emerald-400 hover:text-white font-semibold"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Error Notification */}
      {errorMessage && (
        <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-xs flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button
            onClick={() => setErrorMessage(null)}
            className="text-red-400 hover:text-white font-semibold"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-[#F8FAFC]">
            Scheduled Queue
          </h2>
          <p className="text-sm text-[#94A3B8] mt-1">
            Posts waiting for their scheduled dispatch time across target X accounts.
          </p>
        </div>

        <Link
          href="/composer"
          className="inline-flex items-center space-x-2 px-4 py-2 rounded-lg button-primary text-sm font-medium"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Schedule New Posts</span>
        </Link>
      </div>

      {/* List Container */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="luxury-card p-6 h-28 animate-pulse bg-[#172137]/50"
            />
          ))}
        </div>
      ) : scheduledList.length === 0 ? (
        /* Empty State */
        <div className="luxury-card p-12 text-center flex flex-col items-center justify-center max-w-xl mx-auto">
          <div className="w-16 h-16 rounded-2xl bg-[#121A2B] border border-[rgba(148,163,184,0.12)] flex items-center justify-center mb-4">
            <Clock className="w-8 h-8 text-[#64748B]" />
          </div>
          <h3 className="text-lg font-bold text-[#F8FAFC]">
            No Scheduled Posts
          </h3>
          <p className="text-xs text-[#94A3B8] max-w-sm mt-2 leading-relaxed">
            Use the Bulk Composer to set up interval scheduling or future dispatch times for your connected accounts.
          </p>
          <Link
            href="/composer"
            className="mt-6 inline-flex items-center space-x-2 px-5 py-2.5 rounded-lg button-primary text-xs font-semibold"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Create Scheduled Posts</span>
          </Link>
        </div>
      ) : (
        /* List-based Scheduled Queue */
        <div className="space-y-3.5">
          {scheduledList.map((target) => (
            <div
              key={target.id}
              className="luxury-card p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 group hover:border-[rgba(139,92,246,0.3)] transition-all"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm text-[#F8FAFC] leading-relaxed whitespace-pre-wrap">
                  {target.post?.content || 'No content'}
                </p>

                <div className="flex flex-wrap items-center gap-3 mt-3 text-xs text-[#94A3B8]">
                  {/* Account Badge */}
                  <div className="flex items-center space-x-1.5 bg-[#0B1020] px-2.5 py-1 rounded-md border border-[rgba(148,163,184,0.1)]">
                    <Users className="w-3 h-3 text-[#8B5CF6]" />
                    <span className="font-semibold text-violet-300">
                      @{target.x_account?.username || 'account'}
                    </span>
                  </div>

                  {/* Scheduled Time */}
                  <div className="flex items-center space-x-1.5 text-blue-400">
                    <Calendar className="w-3 h-3" />
                    <span>Due: {formatDate(target.scheduled_at)}</span>
                  </div>

                  {/* Status */}
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                    Scheduled
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center space-x-2 flex-shrink-0 w-full md:w-auto justify-end pt-3 md:pt-0 border-t md:border-t-0 border-[rgba(148,163,184,0.08)]">
                <button
                  type="button"
                  onClick={() => handleCancelTarget(target.id)}
                  disabled={cancellingId === target.id}
                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-[#94A3B8] hover:text-[#EF4444] hover:bg-red-500/10 transition-colors disabled:opacity-50"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{cancellingId === target.id ? 'Cancelling...' : 'Cancel'}</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </AppLayout>
  );
}

