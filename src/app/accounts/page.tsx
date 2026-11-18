'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AppLayout } from '@/components/layout/AppLayout';
import {
  Users2,
  PlusCircle,
  ExternalLink,
  Trash2,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Twitter,
  Send,
} from 'lucide-react';
import { XAccount } from '@/types';
import Image from 'next/image';
import { ConfigNotice } from '@/components/ui/ConfigNotice';

function AccountsContent() {
  const searchParams = useSearchParams();
  const successParam = searchParams?.get('success');
  const errorParam = searchParams?.get('error');

  const [accounts, setAccounts] = useState<XAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);
  const [disconnectingId, setDisconnectingId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(successParam || null);
  const [errorMessage, setErrorMessage] = useState<string | null>(errorParam || null);
  const [envWarnings, setEnvWarnings] = useState<string[]>([]);

  const fetchAccounts = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/accounts');
      if (res.ok) {
        const data = await res.json();
        setAccounts(data.accounts || []);
      } else {
        const err = await res.json();
        setErrorMessage(err.error || 'Failed to fetch connected accounts');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Error communicating with server');
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
    fetchAccounts();
  }, []);

  const handleDisconnect = async (accountId: string, username: string) => {
    if (!window.confirm(`Are you sure you want to disconnect @${username}? Any scheduled posts for this account will remain pending.`)) {
      return;
    }

    try {
      setDisconnectingId(accountId);
      const res = await fetch(`/api/accounts/${accountId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setAccounts((prev) => prev.filter((acc) => acc.id !== accountId));
        setMessage(`Account @${username} was disconnected.`);
      } else {
        const err = await res.json();
        setErrorMessage(err.error || 'Failed to disconnect account');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to disconnect account');
    } finally {
      setDisconnectingId(null);
    }
  };

  return (
    <AppLayout title="Accounts">
      {/* Configuration notice if keys are missing */}
      <ConfigNotice missingItems={envWarnings} />

      {/* Success Notification */}
      {message && (
        <div className="mb-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            <span>{message}</span>
          </div>
          <button
            onClick={() => setMessage(null)}
            className="text-emerald-400 hover:text-emerald-200 text-xs font-semibold"
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
            className="text-red-400 hover:text-red-200 text-xs font-semibold"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-[#F8FAFC]">
            Connected X Accounts
          </h2>
          <p className="text-sm text-[#94A3B8] mt-1">
            Authorize and manage multiple X profiles for simultaneous publishing and scheduling.
          </p>
        </div>

        {/* Connect Action Button */}
        <button
          type="button"
          disabled={isConnecting}
          onClick={() => {
            setIsConnecting(true);
            window.location.href = '/api/auth/x/connect';
          }}
          className="inline-flex items-center space-x-2 px-4 py-2 rounded-lg button-primary text-sm font-medium transition-all disabled:opacity-60"
        >
          {isConnecting ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Redirecting to X...</span>
            </>
          ) : (
            <>
              <PlusCircle className="w-4 h-4" />
              <span>Connect X Account</span>
            </>
          )}
        </button>
      </div>

      {/* Accounts List / Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="luxury-card p-6 h-52 animate-pulse bg-[#172137]/50"
            />
          ))}
        </div>
      ) : accounts.length === 0 ? (
        /* Empty State */
        <div className="luxury-card p-12 text-center flex flex-col items-center justify-center max-w-xl mx-auto">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#8B5CF6]/20 to-[#7C3AED]/10 border border-[rgba(139,92,246,0.25)] flex items-center justify-center mb-4">
            <Users2 className="w-8 h-8 text-[#8B5CF6]" />
          </div>
          <h3 className="text-lg font-bold text-[#F8FAFC]">
            No X Accounts Connected
          </h3>
          <p className="text-xs text-[#94A3B8] max-w-sm mt-2 leading-relaxed">
            Connect your first X account to start drafting, multi-account publishing, and automated post scheduling.
          </p>
          <div className="mt-6 flex flex-col sm:flex-row items-center gap-3">
            <button
              type="button"
              disabled={isConnecting}
              onClick={() => {
                setIsConnecting(true);
                window.location.href = '/api/auth/x/connect';
              }}
              className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-lg button-primary text-sm font-medium shadow-glow disabled:opacity-60"
            >
              {isConnecting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Redirecting to X...</span>
                </>
              ) : (
                <>
                  <PlusCircle className="w-4 h-4" />
                  <span>Connect First Account</span>
                </>
              )}
            </button>
          </div>
          <div className="mt-8 pt-6 border-t border-[rgba(148,163,184,0.1)] flex items-center space-x-2 text-[11px] text-[#64748B]">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Tokens are encrypted with AES-256-GCM. Passwords are never stored.</span>
          </div>
        </div>
      ) : (
        /* Connected Accounts Cards Grid (Section 5) */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {accounts.map((account) => {
            const isConnected = account.connection_status === 'connected';
            const isExpired = account.connection_status === 'expired';

            return (
              <div
                key={account.id}
                className="luxury-card p-6 flex flex-col justify-between group hover:border-[rgba(139,92,246,0.3)]"
              >
                <div>
                  {/* Account Header */}
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="flex items-center space-x-3 min-w-0">
                      {account.profile_image_url ? (
                        <img
                          src={account.profile_image_url}
                          alt={account.display_name}
                          className="w-12 h-12 rounded-full border border-[rgba(148,163,184,0.15)] object-cover flex-shrink-0"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-[#121A2B] border border-[rgba(148,163,184,0.15)] flex items-center justify-center text-sm font-bold text-[#8B5CF6] flex-shrink-0">
                          {account.display_name.charAt(0)}
                        </div>
                      )}

                      <div className="min-w-0">
                        <h4 className="text-sm font-semibold text-[#F8FAFC] truncate">
                          {account.display_name}
                        </h4>
                        <a
                          href={`https://x.com/${account.username}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs text-[#94A3B8] hover:text-[#8B5CF6] transition-colors flex items-center space-x-1 truncate"
                        >
                          <span>@{account.username}</span>
                          <ExternalLink className="w-3 h-3 flex-shrink-0" />
                        </a>
                      </div>
                    </div>

                    {/* Status Badge */}
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${
                        isConnected
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : isExpired
                          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                      }`}
                    >
                      {account.connection_status}
                    </span>
                  </div>

                  {/* Telemetry Stats */}
                  <div className="my-4 p-3 rounded-lg bg-[#121A2B]/60 border border-[rgba(148,163,184,0.08)] flex items-center justify-between">
                    <span className="text-xs text-[#94A3B8]">Published via PostPilot</span>
                    <span className="text-sm font-bold text-[#F8FAFC]">
                      {account.published_count || 0}
                    </span>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="pt-4 border-t border-[rgba(148,163,184,0.1)] flex items-center justify-between gap-2">
                  {isExpired ? (
                    <a
                      href="/api/auth/x/connect"
                      className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 border border-amber-500/30 text-xs font-medium transition-colors"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Reconnect</span>
                    </a>
                  ) : (
                    <div className="text-[11px] text-[#64748B] flex items-center space-x-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Authorized</span>
                    </div>
                  )}

                  <button
                    onClick={() => handleDisconnect(account.id, account.username)}
                    disabled={disconnectingId === account.id}
                    className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-[#94A3B8] hover:text-[#EF4444] hover:bg-red-500/10 transition-colors disabled:opacity-50"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>{disconnectingId === account.id ? 'Disconnecting...' : 'Disconnect'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </AppLayout>
  );
}

export default function AccountsPage() {
  return (
    <Suspense fallback={<div className="text-sm text-[#94A3B8]">Loading accounts...</div>}>
      <AccountsContent />
    </Suspense>
  );
}

