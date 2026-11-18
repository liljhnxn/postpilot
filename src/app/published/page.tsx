'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { AppLayout } from '@/components/layout/AppLayout';
import {
  CheckCircle2,
  AlertOctagon,
  ExternalLink,
  RefreshCw,
  PlusCircle,
  Users,
  Calendar,
  AlertCircle,
  Pencil,
  Trash2,
  X,
  Check,
  AlertTriangle,
  Send,
} from 'lucide-react';
import Link from 'next/link';
import { formatDate } from '@/lib/utils';
import { PostTarget } from '@/types';
import { getXCharacterCount } from '@/lib/x/character-counter';

function PublishedContent() {
  const searchParams = useSearchParams();
  const initialFilter = (searchParams?.get('filter') || 'all') as 'all' | 'published' | 'failed';

  const [historyList, setHistoryList] = useState<PostTarget[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'published' | 'failed'>(initialFilter);
  const [retryingId, setRetryingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Edit Modal State
  const [editingTarget, setEditingTarget] = useState<PostTarget | null>(null);
  const [editContent, setEditContent] = useState('');
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Bulk Clear Confirm Modal State
  const [confirmClearAllOpen, setConfirmClearAllOpen] = useState(false);
  const [isClearingAll, setIsClearingAll] = useState(false);

  const fetchHistory = async (selectedFilter: string) => {
    try {
      setLoading(true);
      const res = await fetch(`/api/posts/published?filter=${selectedFilter}`);
      if (res.ok) {
        const data = await res.json();
        setHistoryList(data.history || []);
      } else {
        const err = await res.json();
        setErrorMessage(err.error || 'Failed to fetch publishing history');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Error communicating with server');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory(filter);
  }, [filter]);

  // Open Edit Modal
  const handleOpenEdit = (target: PostTarget) => {
    setEditingTarget(target);
    setEditContent(target.post?.content || '');
    setErrorMessage(null);
  };

  // Close Edit Modal
  const handleCloseEdit = () => {
    setEditingTarget(null);
    setEditContent('');
  };

  // Save Edit (PATCH)
  const handleSaveEdit = async (andRetry: boolean = false) => {
    if (!editingTarget) return;

    const { isValid, count } = getXCharacterCount(editContent);
    if (!isValid) {
      setErrorMessage(`Post exceeds X's 280-weighted character limit (${count}/280).`);
      return;
    }

    try {
      setIsSavingEdit(true);
      setErrorMessage(null);

      const res = await fetch(`/api/posts/targets/${editingTarget.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: editContent }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update post content');
      }

      // Update local state
      setHistoryList((prev) =>
        prev.map((item) =>
          item.id === editingTarget.id
            ? { ...item, post: item.post ? { ...item.post, content: editContent } : item.post }
            : item
        )
      );

      const targetId = editingTarget.id;
      handleCloseEdit();

      if (andRetry) {
        setMessage('Post updated. Retrying dispatch to X...');
        await handleRetry(targetId);
      } else {
        setMessage('Post content successfully updated!');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to save changes');
    } finally {
      setIsSavingEdit(false);
    }
  };

  // Single Delete
  const handleDeleteTarget = async (targetId: string) => {
    if (!confirm('Are you sure you want to delete this post record?')) return;

    try {
      setDeletingId(targetId);
      setErrorMessage(null);

      const res = await fetch(`/api/posts/targets/${targetId}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to delete post target');
      }

      // Remove from list
      setHistoryList((prev) => prev.filter((item) => item.id !== targetId));
      setMessage('Post record deleted successfully.');
      if (editingTarget?.id === targetId) {
        handleCloseEdit();
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to delete record');
    } finally {
      setDeletingId(null);
    }
  };

  // Bulk Clear All Failed
  const handleClearAllFailed = async () => {
    try {
      setIsClearingAll(true);
      setErrorMessage(null);

      const res = await fetch('/api/posts/failed', {
        method: 'DELETE',
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to clear failed posts');
      }

      setMessage(`Cleared ${data.deletedCount || 0} failed post(s) successfully.`);
      setConfirmClearAllOpen(false);
      fetchHistory(filter);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to clear failed posts');
    } finally {
      setIsClearingAll(false);
    }
  };

  // Retry Single Target
  const handleRetry = async (targetId: string) => {
    try {
      setRetryingId(targetId);
      setMessage(null);
      setErrorMessage(null);

      const res = await fetch(`/api/posts/retry/${targetId}`, {
        method: 'POST',
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to retry publishing');
      }

      setMessage(`Post successfully published to @${data.username}!`);
      fetchHistory(filter);
    } catch (err: any) {
      setErrorMessage(err.message || 'Retry failed');
    } finally {
      setRetryingId(null);
    }
  };

  const failedCount = historyList.filter((item) => item.status === 'failed').length;

  return (
    <AppLayout title="Published">
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
        <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button
            onClick={() => setErrorMessage(null)}
            className="text-rose-400 hover:text-white font-semibold"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-[#F8FAFC]">
            Publishing History
          </h2>
          <p className="text-sm text-[#94A3B8] mt-1">
            Telemetry and management of published posts, edits, retries, and failed operations.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Status Filters */}
          <div className="flex items-center space-x-1 p-1 rounded-xl bg-[#121A2B] border border-[rgba(148,163,184,0.12)]">
            {(['all', 'published', 'failed'] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setFilter(tab)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${
                  filter === tab
                    ? 'bg-[#172137] text-[#F8FAFC] border border-[rgba(139,92,246,0.3)] shadow-glow'
                    : 'text-[#94A3B8] hover:text-[#F8FAFC]'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Bulk Clear Failed Button (visible when failed items exist) */}
          {(filter === 'failed' || failedCount > 0) && (
            <button
              type="button"
              onClick={() => setConfirmClearAllOpen(true)}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/20 text-xs font-semibold transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear Failed ({failedCount})</span>
            </button>
          )}
        </div>
      </div>

      {/* History List */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="luxury-card p-6 h-28 animate-pulse bg-[#172137]/50"
            />
          ))}
        </div>
      ) : historyList.length === 0 ? (
        /* Empty State */
        <div className="luxury-card p-12 text-center flex flex-col items-center justify-center max-w-xl mx-auto">
          <div className="w-16 h-16 rounded-2xl bg-[#121A2B] border border-[rgba(148,163,184,0.12)] flex items-center justify-center mb-4">
            <CheckCircle2 className="w-8 h-8 text-[#64748B]" />
          </div>
          <h3 className="text-lg font-bold text-[#F8FAFC]">
            No Publishing History Found
          </h3>
          <p className="text-xs text-[#94A3B8] max-w-sm mt-2 leading-relaxed">
            {filter === 'failed'
              ? 'No failed publishing operations on record.'
              : filter === 'published'
              ? 'No posts published yet. Create and dispatch your first post!'
              : 'Posts published across your X accounts will appear here with live links to X.'}
          </p>
          <Link
            href="/composer"
            className="mt-6 inline-flex items-center space-x-2 px-5 py-2.5 rounded-lg button-primary text-xs font-semibold"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Create a Post</span>
          </Link>
        </div>
      ) : (
        /* History Feed */
        <div className="space-y-3.5">
          {historyList.map((target) => {
            const isPublished = target.status === 'published';
            const isFailed = target.status === 'failed';
            const isDeleting = deletingId === target.id;
            const isRetrying = retryingId === target.id;

            return (
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

                    {/* Timestamp */}
                    <div className="flex items-center space-x-1.5 text-[#94A3B8]">
                      <Calendar className="w-3 h-3" />
                      <span>{formatDate(target.published_at || target.created_at)}</span>
                    </div>

                    {/* Status Badge */}
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        isPublished
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : isFailed
                          ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                          : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                      }`}
                    >
                      {target.status}
                    </span>

                    {/* Retry Counter */}
                    {target.retry_count > 0 && (
                      <span className="text-[11px] text-[#64748B]">
                        Retries: {target.retry_count}
                      </span>
                    )}
                  </div>

                  {/* Failure Reason Callout */}
                  {isFailed && target.error_message && (
                    <div className="mt-2.5 p-2 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs font-mono flex items-start space-x-1.5">
                      <AlertOctagon className="w-3.5 h-3.5 shrink-0 mt-0.5 text-rose-400" />
                      <span className="break-all">{target.error_message}</span>
                    </div>
                  )}
                </div>

                {/* Right Actions Bar */}
                <div className="flex flex-wrap items-center gap-2 flex-shrink-0 w-full md:w-auto justify-end pt-3 md:pt-0 border-t md:border-t-0 border-[rgba(148,163,184,0.08)]">
                  {/* Edit Button (Available for Failed or Any Post) */}
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(target)}
                    className="inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-[#121A2B] hover:bg-[#172137] text-xs font-medium text-[#94A3B8] hover:text-[#F8FAFC] border border-[rgba(148,163,184,0.12)] transition-colors"
                    title="Edit post text"
                  >
                    <Pencil className="w-3.5 h-3.5 text-[#8B5CF6]" />
                    <span>Edit</span>
                  </button>

                  {/* Retry Action if Failed */}
                  {isFailed && (
                    <button
                      type="button"
                      onClick={() => handleRetry(target.id)}
                      disabled={isRetrying}
                      className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg button-primary text-xs font-semibold disabled:opacity-50"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isRetrying ? 'animate-spin' : ''}`} />
                      <span>{isRetrying ? 'Retrying...' : 'Retry'}</span>
                    </button>
                  )}

                  {/* Direct Link to Live Tweet on X */}
                  {isPublished && target.x_post_id && target.x_account?.username && (
                    <a
                      href={`https://x.com/${target.x_account.username}/status/${target.x_post_id}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg button-secondary text-xs font-medium text-violet-300 hover:text-white"
                    >
                      <span>View on X</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}

                  {/* Delete Button */}
                  <button
                    type="button"
                    onClick={() => handleDeleteTarget(target.id)}
                    disabled={isDeleting}
                    className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 border border-rose-500/20 transition-colors disabled:opacity-50"
                    title="Delete post record"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Edit Post Modal */}
      {editingTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#121A2B] border border-[rgba(148,163,184,0.2)] rounded-2xl w-full max-w-lg p-6 shadow-2xl relative">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-[rgba(148,163,184,0.1)]">
              <div>
                <h3 className="text-base font-bold text-[#F8FAFC]">
                  Edit Post Content
                </h3>
                <p className="text-xs text-[#94A3B8] mt-0.5">
                  Target Account: <span className="text-[#8B5CF6] font-semibold">@{editingTarget.x_account?.username}</span>
                </p>
              </div>
              <button
                type="button"
                onClick={handleCloseEdit}
                className="p-1 rounded-lg text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#172137] transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* If Failed, Show Error Notice */}
            {editingTarget.status === 'failed' && editingTarget.error_message && (
              <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs">
                <span className="font-semibold block mb-0.5">Original Error:</span>
                <p className="font-mono text-[11px] leading-relaxed break-all">
                  {editingTarget.error_message}
                </p>
              </div>
            )}

            {/* Editable Textarea */}
            <div className="relative mb-3">
              <textarea
                rows={5}
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                placeholder="Type your revised X post here..."
                className="w-full p-3 rounded-xl bg-[#0B1020] border border-[rgba(148,163,184,0.15)] text-sm text-[#F8FAFC] placeholder-[#64748B] focus:outline-none focus:border-[#8B5CF6] transition-colors resize-none"
              />
              <div className="flex items-center justify-between text-xs px-1 text-[#94A3B8] mt-1">
                <span>Edit text before retrying or archiving.</span>
                <span
                  className={`font-mono text-xs font-semibold ${
                    getXCharacterCount(editContent).isValid ? 'text-[#94A3B8]' : 'text-rose-400'
                  }`}
                >
                  {getXCharacterCount(editContent).count}/280
                </span>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-3 border-t border-[rgba(148,163,184,0.1)]">
              {/* Delete inside modal */}
              <button
                type="button"
                onClick={() => handleDeleteTarget(editingTarget.id)}
                className="inline-flex items-center justify-center space-x-1.5 px-3 py-2 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 text-xs font-semibold border border-rose-500/20 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Post</span>
              </button>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={handleCloseEdit}
                  className="px-3 py-2 rounded-lg bg-[#172137] hover:bg-[#1E293B] text-xs font-medium text-[#94A3B8] hover:text-[#F8FAFC] transition-colors"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={() => handleSaveEdit(false)}
                  disabled={isSavingEdit || !editContent.trim()}
                  className="px-3 py-2 rounded-lg bg-[#172137] hover:bg-[#1E293B] text-xs font-semibold text-[#F8FAFC] border border-[rgba(148,163,184,0.2)] transition-colors disabled:opacity-50"
                >
                  Save Only
                </button>

                {/* Save & Retry */}
                <button
                  type="button"
                  onClick={() => handleSaveEdit(true)}
                  disabled={isSavingEdit || !editContent.trim()}
                  className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-lg button-primary text-xs font-semibold disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Save & Retry</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Clear All Failed */}
      {confirmClearAllOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#121A2B] border border-rose-500/30 rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#F8FAFC]">Clear All Failed Posts?</h3>
                <p className="text-xs text-[#94A3B8]">This will permanently delete {failedCount} failed post records.</p>
              </div>
            </div>

            <p className="text-xs text-[#94A3B8] leading-relaxed mb-6">
              Deleting failed posts will remove the error alerts from your publishing history and clean up your analytics metrics. This action cannot be undone.
            </p>

            <div className="flex items-center justify-end space-x-3">
              <button
                type="button"
                onClick={() => setConfirmClearAllOpen(false)}
                disabled={isClearingAll}
                className="px-3.5 py-2 rounded-lg bg-[#172137] hover:bg-[#1E293B] text-xs font-medium text-[#94A3B8] hover:text-[#F8FAFC] transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleClearAllFailed}
                disabled={isClearingAll}
                className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold transition-colors disabled:opacity-50"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{isClearingAll ? 'Clearing...' : 'Yes, Delete All Failed'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}

export default function PublishedPage() {
  return (
    <Suspense fallback={<div className="text-sm text-[#94A3B8]">Loading history...</div>}>
      <PublishedContent />
    </Suspense>
  );
}
