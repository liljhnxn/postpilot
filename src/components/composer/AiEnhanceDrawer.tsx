'use client';

import React, { useState } from 'react';
import {
  Sparkles,
  Zap,
  Scissors,
  Layers,
  MessageCircle,
  Check,
  Copy,
  RotateCcw,
  X,
  ArrowRight,
  GitCommit,
} from 'lucide-react';
import { AIAction } from '@/app/api/ai/enhance/route';
import { getXCharacterCount } from '@/lib/x/character-counter';

interface AiEnhanceDrawerProps {
  currentText: string;
  isOpen: boolean;
  onClose: () => void;
  onApply: (newText: string) => void;
  onInsertThread?: (tweets: string[]) => void;
}

export function AiEnhanceDrawer({
  currentText,
  isOpen,
  onClose,
  onApply,
  onInsertThread,
}: AiEnhanceDrawerProps) {
  const [loading, setLoading] = useState(false);
  const [activeAction, setActiveAction] = useState<AIAction | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [variations, setVariations] = useState<{ label: string; text: string }[] | null>(null);
  const [threadTweets, setThreadTweets] = useState<string[] | null>(null);
  const [poweredBy, setPoweredBy] = useState<string>('PostPilot AI');
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [applied, setApplied] = useState(false);

  if (!isOpen) return null;

  const handleRunAction = async (action: AIAction) => {
    if (!currentText.trim()) return;

    setLoading(true);
    setActiveAction(action);
    setResult(null);
    setVariations(null);
    setThreadTweets(null);
    setApplied(false);

    try {
      // Check for user-saved Gemini key in localStorage
      let customKey: string | undefined;
      try {
        customKey = localStorage.getItem('postpilot_gemini_api_key') || undefined;
      } catch {}

      const res = await fetch('/api/ai/enhance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: currentText,
          action,
          customApiKey: customKey,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Enhancement failed');
      }

      setPoweredBy(data.poweredBy || 'AI Engine');

      if (data.type === 'variations' && data.variations) {
        setVariations(data.variations);
      } else if (data.type === 'thread' && data.tweets) {
        setThreadTweets(data.tweets);
      } else if (data.result) {
        setResult(data.result);
      }
    } catch (err: any) {
      console.error('Enhancement error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleApplySingle = (text: string) => {
    onApply(text);
    setApplied(true);
    setTimeout(() => {
      setApplied(false);
      onClose();
    }, 600);
  };

  return (
    <div className="mt-3 p-4 rounded-xl bg-gradient-to-b from-[#172137] to-[#121A2B] border border-[#8B5CF6]/40 shadow-xl shadow-[#8B5CF6]/10 animate-fade-in relative">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-[rgba(148,163,184,0.1)]">
        <div className="flex items-center space-x-2">
          <div className="w-6 h-6 rounded-lg bg-[#8B5CF6]/20 border border-[#8B5CF6]/40 flex items-center justify-center text-[#A78BFA]">
            <Sparkles className="w-3.5 h-3.5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-[#F8FAFC]">AI Copywriting Enhancer</h4>
            <span className="text-[10px] text-[#A78BFA] font-medium">Powered by {poweredBy}</span>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="p-1 rounded-md text-[#94A3B8] hover:text-[#F8FAFC] transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Action Buttons Row */}
      <div className="flex flex-wrap gap-2 mb-4">
        <button
          type="button"
          disabled={loading || !currentText.trim()}
          onClick={() => handleRunAction('hook')}
          className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            activeAction === 'hook' && loading
              ? 'bg-[#8B5CF6] text-white animate-pulse'
              : 'bg-[#0B1020] text-[#F8FAFC] hover:bg-[#1E293B] border border-[rgba(148,163,184,0.15)] hover:border-[#8B5CF6]/50'
          } disabled:opacity-40 disabled:cursor-not-allowed`}
        >
          <Zap className="w-3.5 h-3.5 text-amber-400" />
          <span>Viral Hook</span>
        </button>

        <button
          type="button"
          disabled={loading || !currentText.trim()}
          onClick={() => handleRunAction('shorten')}
          className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            activeAction === 'shorten' && loading
              ? 'bg-[#8B5CF6] text-white animate-pulse'
              : 'bg-[#0B1020] text-[#F8FAFC] hover:bg-[#1E293B] border border-[rgba(148,163,184,0.15)] hover:border-[#8B5CF6]/50'
          } disabled:opacity-40 disabled:cursor-not-allowed`}
        >
          <Scissors className="w-3.5 h-3.5 text-blue-400" />
          <span>Punchy & Trim</span>
        </button>

        <button
          type="button"
          disabled={loading || !currentText.trim()}
          onClick={() => handleRunAction('variations')}
          className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            activeAction === 'variations' && loading
              ? 'bg-[#8B5CF6] text-white animate-pulse'
              : 'bg-[#0B1020] text-[#F8FAFC] hover:bg-[#1E293B] border border-[rgba(148,163,184,0.15)] hover:border-[#8B5CF6]/50'
          } disabled:opacity-40 disabled:cursor-not-allowed`}
        >
          <Layers className="w-3.5 h-3.5 text-[#A78BFA]" />
          <span>3 Variations</span>
        </button>

        <button
          type="button"
          disabled={loading || !currentText.trim()}
          onClick={() => handleRunAction('cta')}
          className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            activeAction === 'cta' && loading
              ? 'bg-[#8B5CF6] text-white animate-pulse'
              : 'bg-[#0B1020] text-[#F8FAFC] hover:bg-[#1E293B] border border-[rgba(148,163,184,0.15)] hover:border-[#8B5CF6]/50'
          } disabled:opacity-40 disabled:cursor-not-allowed`}
        >
          <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
          <span>Add CTA Question</span>
        </button>

        <button
          type="button"
          disabled={loading || !currentText.trim()}
          onClick={() => handleRunAction('thread')}
          className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            activeAction === 'thread' && loading
              ? 'bg-[#8B5CF6] text-white animate-pulse'
              : 'bg-[#0B1020] text-[#F8FAFC] hover:bg-[#1E293B] border border-[rgba(148,163,184,0.15)] hover:border-[#8B5CF6]/50'
          } disabled:opacity-40 disabled:cursor-not-allowed`}
        >
          <GitCommit className="w-3.5 h-3.5 text-rose-400" />
          <span>Convert to Thread</span>
        </button>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="p-4 rounded-lg bg-[#0B1020]/60 border border-[rgba(148,163,184,0.1)] flex items-center justify-center space-x-2 text-xs text-[#A78BFA]">
          <Sparkles className="w-4 h-4 animate-spin text-[#8B5CF6]" />
          <span>Generating high-converting post copy...</span>
        </div>
      )}

      {/* Result Display: Single Result (Hook, Shorten, CTA) */}
      {!loading && result && (
        <div className="p-3 rounded-lg bg-[#0B1020] border border-[#8B5CF6]/30 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-[#A78BFA] uppercase tracking-wider">
              Enhanced Version:
            </span>
            <span className="text-[11px] text-[#94A3B8]">
              {getXCharacterCount(result).count}/280 chars
            </span>
          </div>

          <p className="text-xs text-[#F8FAFC] leading-relaxed whitespace-pre-wrap font-sans">
            {result}
          </p>

          <div className="flex items-center justify-end space-x-2 pt-2 border-t border-[rgba(148,163,184,0.1)]">
            <button
              type="button"
              onClick={() => handleCopy(result, 0)}
              className="px-2.5 py-1 rounded bg-[#172137] hover:bg-[#1E293B] text-[11px] text-[#94A3B8] hover:text-[#F8FAFC] flex items-center space-x-1"
            >
              {copiedIndex === 0 ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              <span>{copiedIndex === 0 ? 'Copied' : 'Copy'}</span>
            </button>

            <button
              type="button"
              onClick={() => handleApplySingle(result)}
              className="px-3 py-1 rounded-md button-primary text-xs font-semibold flex items-center space-x-1 shadow-sm"
            >
              {applied ? <Check className="w-3.5 h-3.5" /> : <ArrowRight className="w-3.5 h-3.5" />}
              <span>{applied ? 'Applied!' : 'Replace Post Text'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Result Display: 3 Variations */}
      {!loading && variations && (
        <div className="space-y-2.5">
          <div className="text-[11px] font-semibold text-[#A78BFA] uppercase tracking-wider">
            Pick a Variation Angle:
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
            {variations.map((v, i) => (
              <div
                key={i}
                className="p-3 rounded-lg bg-[#0B1020] border border-[rgba(148,163,184,0.1)] hover:border-[#8B5CF6]/50 flex flex-col justify-between transition-colors"
              >
                <div>
                  <div className="text-[11px] font-bold text-violet-300 mb-1">{v.label}</div>
                  <p className="text-xs text-[#F8FAFC] whitespace-pre-wrap leading-relaxed mb-2">
                    {v.text}
                  </p>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-[rgba(148,163,184,0.08)]">
                  <span className="text-[10px] text-[#64748B]">
                    {getXCharacterCount(v.text).count}/280
                  </span>
                  <button
                    type="button"
                    onClick={() => handleApplySingle(v.text)}
                    className="px-2.5 py-1 rounded button-primary text-[11px] font-medium"
                  >
                    Use This
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Result Display: Thread Tweets */}
      {!loading && threadTweets && (
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-[#A78BFA] uppercase tracking-wider">
              Thread Outline Generated:
            </span>
            {onInsertThread && (
              <button
                type="button"
                onClick={() => {
                  onInsertThread(threadTweets);
                  onClose();
                }}
                className="px-3 py-1 rounded button-primary text-xs font-semibold flex items-center space-x-1"
              >
                <GitCommit className="w-3.5 h-3.5" />
                <span>Replace Deck with this Thread</span>
              </button>
            )}
          </div>
          <div className="space-y-2">
            {threadTweets.map((tw, i) => (
              <div
                key={i}
                className="p-2.5 rounded-lg bg-[#0B1020] border border-[rgba(148,163,184,0.1)] text-xs text-[#F8FAFC] whitespace-pre-wrap"
              >
                {tw}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

