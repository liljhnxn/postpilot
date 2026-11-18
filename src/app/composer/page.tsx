'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AppLayout } from '@/components/layout/AppLayout';
import {
  PenSquare,
  PlusCircle,
  Copy,
  Trash2,
  ArrowUp,
  ArrowDown,
  Calendar,
  Clock,
  Send,
  Users,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ChevronDown,
  Sparkles,
  HelpCircle,
  Check,
  ImageIcon,
  X,
  Layers,
  GitCommit,
  Hash,
  CornerDownRight,
  BookOpen,
  FlaskConical,
} from 'lucide-react';
import { XAccount, ScheduleIntervalOption } from '@/types';
import { getXCharacterCount } from '@/lib/x/character-counter';
import Link from 'next/link';
import { ConfigNotice } from '@/components/ui/ConfigNotice';
import { AiEnhanceDrawer } from '@/components/composer/AiEnhanceDrawer';
import { TemplatePickerModal } from '@/components/composer/TemplatePickerModal';

interface ComposerPostItem {
  id: string; // client UUID
  content: string;
  selectedAccountIds: string[];
  media?: string[];
}

function ComposerContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Mode: Standalone Posts vs X Thread Builder
  const [composerMode, setComposerMode] = useState<'standalone' | 'thread'>('standalone');

  // AI Drawer state (which post card index has AI enhancer active)
  const [openAiIndex, setOpenAiIndex] = useState<number | null>(null);

  // Template Picker Modal state (which post card index has template modal open)
  const [templateModalIndex, setTemplateModalIndex] = useState<number | null>(null);

  // Simulation Mode detection (bypasses depleted X credits)
  const [simulationActive, setSimulationActive] = useState(false);

  // User connected accounts
  const [accounts, setAccounts] = useState<XAccount[]>([]);
  const [loadingAccounts, setLoadingAccounts] = useState(true);

  // Deck of posts
  const [posts, setPosts] = useState<ComposerPostItem[]>([
    {
      id: 'post-1',
      content: '',
      selectedAccountIds: [],
      media: [],
    },
  ]);

  // Hidden file input refs map
  const fileInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});

  // Scheduling State
  const [publishMode, setPublishMode] = useState<'now' | 'schedule'>('now');
  const [startDate, setStartDate] = useState<string>(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  });
  const [startTime, setStartTime] = useState<string>('09:00');
  const [intervalOption, setIntervalOption] = useState<ScheduleIntervalOption>('30m');
  const [customIntervalMinutes, setCustomIntervalMinutes] = useState<number>(45);

  // Review & Confirmation Modal
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishResults, setPublishResults] = useState<any | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Load connected accounts
  useEffect(() => {
    async function loadAccounts() {
      try {
        setLoadingAccounts(true);
        const res = await fetch('/api/accounts');
        if (res.ok) {
          const data = await res.json();
          const loadedAccounts: XAccount[] = data.accounts || [];
          setAccounts(loadedAccounts);

          // Auto-select first account for initial post if available
          if (loadedAccounts.length > 0) {
            setPosts((prev) =>
              prev.map((p, idx) =>
                idx === 0 && p.selectedAccountIds.length === 0
                  ? { ...p, selectedAccountIds: [loadedAccounts[0].id] }
                  : p
              )
            );
          }
        }
      } catch (err) {
        console.error('Failed to load accounts for composer:', err);
      } finally {
        setLoadingAccounts(false);
      }
    }
    loadAccounts();
  }, []);

  // Prefill from Calendar or Templates Library
  useEffect(() => {
    // 1. Check if calendar passed a date
    const dateParam = searchParams?.get('date');
    if (dateParam) {
      setStartDate(dateParam);
      setPublishMode('schedule');
    }

    // 2. Check if templates page passed content
    try {
      const prefill = sessionStorage.getItem('postpilot_composer_prefill');
      if (prefill) {
        setPosts((prev) =>
          prev.map((p, idx) => (idx === 0 ? { ...p, content: prefill } : p))
        );
        sessionStorage.removeItem('postpilot_composer_prefill');
      }
    } catch {}
    // 3. Check if simulation mode is active
    try {
      const isSim = localStorage.getItem('postpilot_simulation_mode') === 'true';
      setSimulationActive(isSim);
    } catch {}
  }, [searchParams]);

  // Deck Manipulation Functions
  const handleAddPost = () => {
    const newId = `post-${Date.now()}`;
    const defaultAccounts = accounts.length > 0 ? [accounts[0].id] : [];
    setPosts((prev) => [
      ...prev,
      {
        id: newId,
        content: '',
        selectedAccountIds: defaultAccounts,
        media: [],
      },
    ]);
  };

  const handleRemovePost = (index: number) => {
    if (posts.length <= 1) {
      setPosts([
        {
          id: 'post-1',
          content: '',
          selectedAccountIds: accounts.length > 0 ? [accounts[0].id] : [],
          media: [],
        },
      ]);
      return;
    }
    setPosts((prev) => prev.filter((_, i) => i !== index));
  };

  const handleDuplicatePost = (index: number) => {
    const source = posts[index];
    const duplicated: ComposerPostItem = {
      id: `post-${Date.now()}`,
      content: source.content,
      selectedAccountIds: [...source.selectedAccountIds],
      media: source.media ? [...source.media] : [],
    };
    const newPosts = [...posts];
    newPosts.splice(index + 1, 0, duplicated);
    setPosts(newPosts);
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const newPosts = [...posts];
    const temp = newPosts[index - 1];
    newPosts[index - 1] = newPosts[index];
    newPosts[index] = temp;
    setPosts(newPosts);
  };

  const handleMoveDown = (index: number) => {
    if (index === posts.length - 1) return;
    const newPosts = [...posts];
    const temp = newPosts[index + 1];
    newPosts[index + 1] = newPosts[index];
    newPosts[index] = temp;
    setPosts(newPosts);
  };

  const handleAutoNumberThread = () => {
    const total = posts.length;
    setPosts((prev) =>
      prev.map((p, idx) => {
        const cleaned = p.content.replace(/\s*\(\d+\/\d+\)$/, '').trim();
        return {
          ...p,
          content: cleaned ? `${cleaned} (${idx + 1}/${total})` : `(${idx + 1}/${total})`,
        };
      })
    );
  };

  const handleClearThreadNumbering = () => {
    setPosts((prev) =>
      prev.map((p) => ({
        ...p,
        content: p.content.replace(/\s*\(\d+\/\d+\)$/, '').trim(),
      }))
    );
  };

  const handleInsertThread = (threadTweets: string[]) => {
    if (!threadTweets || threadTweets.length === 0) return;
    setComposerMode('thread');
    const firstAccIds = posts[0]?.selectedAccountIds || (accounts[0] ? [accounts[0].id] : []);
    const newPosts: ComposerPostItem[] = threadTweets.map((tweetText, idx) => ({
      id: `post-${Date.now()}-${idx}`,
      content: tweetText,
      selectedAccountIds: [...firstAccIds],
      media: [],
    }));
    setPosts(newPosts);
    setOpenAiIndex(null);
  };

  const handleContentChange = (index: number, text: string) => {
    setPosts((prev) =>
      prev.map((p, i) => (i === index ? { ...p, content: text } : p))
    );
  };

  // Image Upload Handling (up to 4 images per X post)
  const handleImageUpload = (index: number, files: FileList | null) => {
    if (!files || files.length === 0) return;
    const currentMedia = posts[index].media || [];
    const remainingSlots = 4 - currentMedia.length;
    if (remainingSlots <= 0) {
      setErrorMessage('Maximum of 4 images allowed per X post.');
      return;
    }

    const filesToProcess = Array.from(files).slice(0, remainingSlots);

    filesToProcess.forEach((file) => {
      if (file.size > 5 * 1024 * 1024) {
        setErrorMessage(`Image "${file.name}" exceeds maximum allowed size of 5MB.`);
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const base64 = e.target?.result as string;
        if (base64) {
          setPosts((prev) =>
            prev.map((p, i) =>
              i === index
                ? { ...p, media: [...(p.media || []), base64].slice(0, 4) }
                : p
            )
          );
        }
      };
      reader.readAsDataURL(file);
    });

    // Reset file input value
    if (fileInputRefs.current[posts[index].id]) {
      fileInputRefs.current[posts[index].id]!.value = '';
    }
  };

  const handleRemoveImage = (postIndex: number, imageIndex: number) => {
    setPosts((prev) =>
      prev.map((p, i) => {
        if (i !== postIndex) return p;
        const updated = (p.media || []).filter((_, imgIdx) => imgIdx !== imageIndex);
        return { ...p, media: updated };
      })
    );
  };

  const handleToggleAccount = (postIndex: number, accountId: string) => {
    setPosts((prev) =>
      prev.map((p, i) => {
        if (i !== postIndex) return p;
        const exists = p.selectedAccountIds.includes(accountId);
        const updated = exists
          ? p.selectedAccountIds.filter((id) => id !== accountId)
          : [...p.selectedAccountIds, accountId];
        return { ...p, selectedAccountIds: updated };
      })
    );
  };

  const handleApplyToAllPosts = (accountIds: string[]) => {
    setPosts((prev) =>
      prev.map((p) => ({ ...p, selectedAccountIds: [...accountIds] }))
    );
  };

  // Interval Calculation
  const getIntervalMinutes = (): number => {
    switch (intervalOption) {
      case '15m': return 15;
      case '30m': return 30;
      case '1h': return 60;
      case '2h': return 120;
      case '3h': return 180;
      case 'custom': return Math.max(1, customIntervalMinutes);
      default: return 0;
    }
  };

  // Calculate planned schedule time for post at given index
  const calculateScheduledTime = (index: number): Date => {
    const base = new Date(`${startDate}T${startTime}:00`);
    const intervalMins = getIntervalMinutes();
    const planned = new Date(base.getTime() + index * intervalMins * 60 * 1000);
    return planned;
  };

  // Validation before opening review modal
  const validateBeforeReview = (): string | null => {
    if (accounts.length === 0) {
      return 'You must connect at least one X account before publishing.';
    }

    for (let i = 0; i < posts.length; i++) {
      const p = posts[i];
      if (!p.content.trim() && (!p.media || p.media.length === 0)) {
        return `Post #${i + 1} is empty. Please add text or an image.`;
      }
      const { count, isValid } = getXCharacterCount(p.content);
      if (p.content.trim() && !isValid) {
        return `Post #${i + 1} exceeds official X 280-weighted character limit (${count}/280).`;
      }
      if (p.selectedAccountIds.length === 0) {
        return `Post #${i + 1} has no target X account selected.`;
      }
    }

    if (publishMode === 'schedule') {
      const firstTime = calculateScheduledTime(0);
      if (isNaN(firstTime.getTime())) {
        return 'Please select a valid scheduled date and time.';
      }
      if (firstTime.getTime() < Date.now()) {
        return 'Scheduled start time must be in the future.';
      }
    }

    return null;
  };

  const handleOpenReview = () => {
    setErrorMessage(null);
    const error = validateBeforeReview();
    if (error) {
      setErrorMessage(error);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    setShowReviewModal(true);
  };

  // Execute Bulk Publishing
  const handleConfirmPublish = async () => {
    setIsPublishing(true);
    setErrorMessage(null);

    try {
      let payloadPosts;
      if (composerMode === 'thread') {
        const targetAccounts = Array.from(
          new Set(posts.flatMap((p) => p.selectedAccountIds))
        );
        if (targetAccounts.length === 0) {
          throw new Error('Please select at least one target X account for your thread.');
        }

        payloadPosts = [
          {
            content: posts[0].content,
            accountIds: targetAccounts,
            media: posts[0].media || [],
            isThread: true,
            threadTweets: posts.map((p) => ({
              text: p.content,
              media: p.media || [],
            })),
            scheduledAt:
              publishMode === 'schedule'
                ? calculateScheduledTime(0).toISOString()
                : null,
          },
        ];
      } else {
        payloadPosts = posts.map((p, idx) => ({
          content: p.content,
          accountIds: p.selectedAccountIds,
          media: p.media || [],
          scheduledAt:
            publishMode === 'schedule'
              ? calculateScheduledTime(idx).toISOString()
              : null,
        }));
      }

      const res = await fetch('/api/posts/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          posts: payloadPosts,
          isScheduled: publishMode === 'schedule',
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to execute publishing');
      }

      setPublishResults(data);
    } catch (err: any) {
      console.error('Publishing failed:', err);
      setErrorMessage(err.message || 'Error executing publishing operations.');
      setShowReviewModal(false);
    } finally {
      setIsPublishing(false);
    }
  };

  // Calculations for summary
  const totalOperations = posts.reduce((sum, p) => sum + p.selectedAccountIds.length, 0);

  return (
    <AppLayout title="Create Posts">
      {/* Error Alert */}
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

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center space-x-3 mb-1">
            <h2 className="text-2xl font-bold tracking-tight text-[#F8FAFC]">
              {composerMode === 'thread' ? '🧵 X Thread Builder' : 'Bulk Post Composer'}
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#8B5CF6]/20 text-[#A78BFA] border border-[#8B5CF6]/30">
              {composerMode === 'thread' ? 'Thread Mode' : 'Deck Mode'}
            </span>
          </div>
          <p className="text-sm text-[#94A3B8]">
            {composerMode === 'thread'
              ? 'Craft, structure, and chain multi-tweet stories and tutorials with connected previews.'
              : 'Prepare, assign, and dispatch multiple posts with image attachments simultaneously or with interval scheduling.'}
          </p>
        </div>

        {/* Global Stats & Format Selector */}
        <div className="flex items-center space-x-3 text-xs">
          {/* Format Selector: Standalone vs Thread */}
          <div className="flex p-1 rounded-xl bg-[#0B1020] border border-[rgba(148,163,184,0.12)]">
            <button
              type="button"
              onClick={() => setComposerMode('standalone')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                composerMode === 'standalone'
                  ? 'bg-[#172137] text-[#F8FAFC] border border-[rgba(139,92,246,0.35)] shadow-glow'
                  : 'text-[#94A3B8] hover:text-[#F8FAFC]'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-[#8B5CF6]" />
              <span>Standalone</span>
            </button>
            <button
              type="button"
              onClick={() => setComposerMode('thread')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                composerMode === 'thread'
                  ? 'bg-[#172137] text-[#F8FAFC] border border-[rgba(139,92,246,0.35)] shadow-glow'
                  : 'text-[#94A3B8] hover:text-[#F8FAFC]'
              }`}
            >
              <GitCommit className="w-3.5 h-3.5 text-[#8B5CF6]" />
              <span>Thread Builder</span>
            </button>
          </div>

          <div className="hidden sm:flex items-center px-3 py-2 rounded-lg bg-[#121A2B] border border-[rgba(148,163,184,0.12)] text-[#94A3B8]">
            {composerMode === 'thread' ? 'Tweets in Thread:' : 'Posts:'}{' '}
            <span className="font-semibold text-[#F8FAFC] ml-1">{posts.length}</span>
          </div>
        </div>
      </div>

      {/* Warning if no accounts connected */}
      {accounts.length === 0 && !loadingAccounts && (
        <div className="mb-6 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-amber-400" />
            <span>No connected X accounts detected. Connect your X account first to enable publishing.</span>
          </div>
          <Link
            href="/accounts"
            className="px-3 py-1 rounded-md button-primary text-xs font-semibold"
          >
            Connect Account
          </Link>
        </div>
      )}

      {/* Thread Controls Toolbar (only visible in Thread mode) */}
      {composerMode === 'thread' && (
        <div className="p-4 mb-6 rounded-xl bg-gradient-to-r from-[#172137] to-[#121A2B] border border-[#8B5CF6]/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-lg shadow-[#8B5CF6]/5">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-[#8B5CF6]/20 border border-[#8B5CF6]/40 flex items-center justify-center text-[#A78BFA]">
              <GitCommit className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-[#F8FAFC]">
                X Thread Chaining Active
              </div>
              <p className="text-[11px] text-[#94A3B8]">
                Every tweet below will be published as an automatic reply to the previous one.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleAutoNumberThread}
              className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-[#0B1020] hover:bg-[#172137] text-xs font-medium text-[#F8FAFC] border border-[rgba(148,163,184,0.15)] transition-colors"
              title="Automatically appends (1/N) to every tweet"
            >
              <Hash className="w-3.5 h-3.5 text-[#8B5CF6]" />
              <span>Auto-Number (1/{posts.length})</span>
            </button>
            <button
              type="button"
              onClick={handleClearThreadNumbering}
              className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-[#94A3B8] hover:text-[#F8FAFC] transition-colors"
              title="Remove numbering"
            >
              Clear Numbers
            </button>
            <button
              type="button"
              onClick={handleAddPost}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg button-primary text-xs font-semibold"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Add Tweet to Thread</span>
            </button>
          </div>
        </div>
      )}

      {/* Publishing Mode Bar */}
      <div className="luxury-card p-4 mb-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        {/* Toggle Mode & Simulation Indicator */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex p-1 rounded-xl bg-[#0B1020] border border-[rgba(148,163,184,0.12)]">
            <button
              type="button"
              onClick={() => setPublishMode('now')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                publishMode === 'now'
                  ? 'bg-[#172137] text-[#F8FAFC] border border-[rgba(139,92,246,0.35)] shadow-glow'
                  : 'text-[#94A3B8] hover:text-[#F8FAFC]'
              }`}
            >
              <Send className="w-3.5 h-3.5 text-[#8B5CF6]" />
              <span>Publish Now</span>
            </button>
            <button
              type="button"
              onClick={() => setPublishMode('schedule')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                publishMode === 'schedule'
                  ? 'bg-[#172137] text-[#F8FAFC] border border-[rgba(139,92,246,0.35)] shadow-glow'
                  : 'text-[#94A3B8] hover:text-[#F8FAFC]'
              }`}
            >
              <Clock className="w-3.5 h-3.5 text-[#8B5CF6]" />
              <span>Schedule {composerMode === 'thread' ? 'Thread' : 'Posts'}</span>
            </button>
          </div>

          {simulationActive && (
            <Link
              href="/settings"
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 transition-colors"
              title="Click to manage Simulation Mode in Settings"
            >
              <FlaskConical className="w-3.5 h-3.5 text-amber-400" />
              <span>🧪 Simulation Active (Free Unlimited)</span>
            </Link>
          )}
        </div>

        {/* Schedule Controls (if schedule mode is active) */}
        {publishMode === 'schedule' && (
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto text-xs">
            <div className="flex items-center space-x-1.5 bg-[#0B1020] px-3 py-1.5 rounded-lg border border-[rgba(148,163,184,0.12)]">
              <Calendar className="w-3.5 h-3.5 text-[#8B5CF6]" />
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-transparent text-[#F8FAFC] focus:outline-none"
              />
            </div>

            <div className="flex items-center space-x-1.5 bg-[#0B1020] px-3 py-1.5 rounded-lg border border-[rgba(148,163,184,0.12)]">
              <Clock className="w-3.5 h-3.5 text-[#8B5CF6]" />
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="bg-transparent text-[#F8FAFC] focus:outline-none"
              />
            </div>

            <div className="flex items-center space-x-1.5 bg-[#0B1020] px-3 py-1.5 rounded-lg border border-[rgba(148,163,184,0.12)]">
              <span className="text-[#94A3B8]">Interval:</span>
              <select
                value={intervalOption}
                onChange={(e) => setIntervalOption(e.target.value as ScheduleIntervalOption)}
                className="bg-transparent text-[#F8FAFC] focus:outline-none font-medium"
              >
                <option value="none" className="bg-[#172137]">All at once (None)</option>
                <option value="15m" className="bg-[#172137]">15 minutes</option>
                <option value="30m" className="bg-[#172137]">30 minutes</option>
                <option value="1h" className="bg-[#172137]">1 hour</option>
                <option value="2h" className="bg-[#172137]">2 hours</option>
                <option value="3h" className="bg-[#172137]">3 hours</option>
                <option value="custom" className="bg-[#172137]">Custom interval</option>
              </select>
            </div>

            {intervalOption === 'custom' && (
              <div className="flex items-center space-x-1 bg-[#0B1020] px-2.5 py-1.5 rounded-lg border border-[rgba(148,163,184,0.12)]">
                <input
                  type="number"
                  min={1}
                  max={1440}
                  value={customIntervalMinutes}
                  onChange={(e) => setCustomIntervalMinutes(parseInt(e.target.value) || 1)}
                  className="w-14 bg-transparent text-[#F8FAFC] text-center focus:outline-none"
                />
                <span className="text-[#94A3B8] text-[11px]">mins</span>
              </div>
            )}
          </div>
        )}

        {/* Global Review / Action Button */}
        <button
          type="button"
          onClick={handleOpenReview}
          className="w-full md:w-auto px-5 py-2.5 rounded-lg button-primary text-xs font-semibold flex items-center justify-center space-x-2 shadow-glow"
        >
          {publishMode === 'now' ? (
            <>
              <Send className="w-4 h-4" />
              <span>Review & Publish Now ({totalOperations})</span>
            </>
          ) : (
            <>
              <Clock className="w-4 h-4" />
              <span>Review & Schedule ({totalOperations})</span>
            </>
          )}
        </button>
      </div>

      {/* Posts Deck Container */}
      <div className="space-y-6">
        {posts.map((post, index) => {
          const charInfo = getXCharacterCount(post.content);
          const scheduledTime = calculateScheduledTime(index);
          const attachedMedia = post.media || [];

          // Color shift based on remaining characters
          const counterColor =
            charInfo.remaining < 0
              ? 'text-rose-400'
              : charInfo.remaining < 20
              ? 'text-amber-400'
              : 'text-[#94A3B8]';

          return (
            <React.Fragment key={post.id}>
              <div
                className={`luxury-card p-6 relative group transition-all ${
                  composerMode === 'thread'
                    ? 'border-l-4 border-l-[#8B5CF6] shadow-lg shadow-[#8B5CF6]/5'
                    : ''
                }`}
              >
                {/* Card Top Bar: Post Number, Reorder, Actions */}
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-[rgba(148,163,184,0.1)]">
                  <div className="flex items-center space-x-3">
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${
                        composerMode === 'thread'
                          ? 'bg-gradient-to-br from-[#8B5CF6] to-[#7C3AED] text-white shadow-md shadow-[#8B5CF6]/30'
                          : 'bg-[#8B5CF6]/15 border border-[#8B5CF6]/30 text-[#A78BFA]'
                      }`}
                    >
                      {index + 1}
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-[#F8FAFC]">
                        {composerMode === 'thread'
                          ? index === 0
                            ? 'Tweet 1 (The Hook)'
                            : index === posts.length - 1
                            ? `Tweet ${index + 1} (Conclusion / CTA)`
                            : `Tweet ${index + 1} (Body / Expansion)`
                          : `Post ${index + 1}`}
                      </h3>
                      <p className="text-[11px] text-[#94A3B8]">
                        {composerMode === 'thread'
                          ? index === 0
                            ? 'Opening tweet that captures attention in feeds'
                            : `Replies directly to Tweet #${index}`
                          : publishMode === 'schedule'
                          ? `Scheduled: ${scheduledTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} (${scheduledTime.toLocaleDateString()})`
                          : 'Standalone post'}
                      </p>
                    </div>
                  </div>

                {/* Deck Card Actions */}
                <div className="flex items-center space-x-1">
                  {/* Move Up */}
                  <button
                    type="button"
                    title="Move up"
                    disabled={index === 0}
                    onClick={() => handleMoveUp(index)}
                    className="p-1.5 rounded-md text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#121A2B] disabled:opacity-30 disabled:hover:bg-transparent"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>

                  {/* Move Down */}
                  <button
                    type="button"
                    title="Move down"
                    disabled={index === posts.length - 1}
                    onClick={() => handleMoveDown(index)}
                    className="p-1.5 rounded-md text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#121A2B] disabled:opacity-30 disabled:hover:bg-transparent"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>

                  {/* Duplicate */}
                  <button
                    type="button"
                    title="Duplicate post"
                    onClick={() => handleDuplicatePost(index)}
                    className="p-1.5 rounded-md text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#121A2B]"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>

                  {/* Delete */}
                  <button
                    type="button"
                    title="Remove post"
                    onClick={() => handleRemovePost(index)}
                    className="p-1.5 rounded-md text-[#94A3B8] hover:text-[#EF4444] hover:bg-red-500/10"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Textarea Input */}
              <div className="relative mb-3">
                <textarea
                  rows={4}
                  value={post.content}
                  onChange={(e) => handleContentChange(index, e.target.value)}
                  placeholder="What's happening? Type your X post here..."
                  className="w-full p-4 rounded-xl bg-[#0B1020] border border-[rgba(148,163,184,0.12)] text-[#F8FAFC] placeholder-[#64748B] text-sm focus:outline-none focus:border-[#8B5CF6] focus:ring-1 focus:ring-[#8B5CF6] resize-y transition-colors"
                />

                {/* Weighted Character Counter (Official X algorithm) */}
                <div className="absolute right-3 bottom-3 flex items-center space-x-2 bg-[#172137]/90 px-2.5 py-1 rounded-lg border border-[rgba(148,163,184,0.1)] backdrop-blur-sm">
                  {/* Mini Progress Ring */}
                  <div className="relative w-4 h-4 flex items-center justify-center">
                    <svg className="w-4 h-4 -rotate-90" viewBox="0 0 36 36">
                      <path
                        className="text-[#121A2B]"
                        strokeWidth="4"
                        stroke="currentColor"
                        fill="none"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                      <path
                        className={
                          charInfo.remaining < 0
                            ? 'text-rose-500'
                            : charInfo.remaining < 20
                            ? 'text-amber-500'
                            : 'text-[#8B5CF6]'
                        }
                        strokeDasharray={`${charInfo.percentage}, 100`}
                        strokeWidth="4"
                        strokeLinecap="round"
                        stroke="currentColor"
                        fill="none"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                    </svg>
                  </div>
                  <span className={`text-xs font-mono font-medium ${counterColor}`}>
                    {charInfo.remaining}
                  </span>
                </div>
              </div>

              {/* Image Previews Grid (if images attached) */}
              {attachedMedia.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4 p-3 rounded-xl bg-[#0B1020]/60 border border-[rgba(148,163,184,0.08)]">
                  {attachedMedia.map((imgBase64, imgIdx) => (
                    <div
                      key={imgIdx}
                      className="relative group/img aspect-video rounded-lg overflow-hidden border border-[rgba(148,163,184,0.15)] bg-[#121A2B]"
                    >
                      <img
                        src={imgBase64}
                        alt={`Attachment ${imgIdx + 1}`}
                        className="w-full h-full object-cover"
                      />
                      {/* Remove Image Button */}
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(index, imgIdx)}
                        title="Remove image"
                        className="absolute top-1.5 right-1.5 p-1 rounded-full bg-black/70 hover:bg-rose-600 text-white transition-colors"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Media & AI Action Toolbar */}
              <div className="flex flex-wrap items-center justify-between gap-2 pb-3 mb-3 border-b border-[rgba(148,163,184,0.08)]">
                {/* Hidden File Input */}
                <input
                  type="file"
                  accept="image/png, image/jpeg, image/jpg, image/webp, image/gif"
                  multiple
                  ref={(el) => {
                    fileInputRefs.current[post.id] = el;
                  }}
                  onChange={(e) => handleImageUpload(index, e.target.files)}
                  className="hidden"
                />

                <div className="flex items-center space-x-2">
                  {/* Add Image Button */}
                  <button
                    type="button"
                    disabled={attachedMedia.length >= 4}
                    onClick={() => fileInputRefs.current[post.id]?.click()}
                    className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      attachedMedia.length >= 4
                        ? 'opacity-40 cursor-not-allowed text-[#64748B]'
                        : 'bg-[#121A2B] text-[#94A3B8] hover:text-[#F8FAFC] hover:border-[rgba(139,92,246,0.3)] border border-[rgba(148,163,184,0.12)]'
                    }`}
                  >
                    <ImageIcon className="w-3.5 h-3.5 text-[#8B5CF6]" />
                    <span>
                      {attachedMedia.length === 0
                        ? 'Add Images'
                        : `Images (${attachedMedia.length}/4)`}
                    </span>
                  </button>

                  {/* AI Enhance Trigger Button */}
                  <button
                    type="button"
                    onClick={() => setOpenAiIndex(openAiIndex === index ? null : index)}
                    className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      openAiIndex === index
                        ? 'bg-[#8B5CF6] text-white border border-[#A78BFA] shadow-[0_0_15px_rgba(139,92,246,0.45)]'
                        : 'bg-gradient-to-r from-[#8B5CF6]/20 via-[#6366F1]/20 to-[#3B82F6]/20 hover:from-[#8B5CF6]/30 hover:to-[#3B82F6]/30 text-[#C4B5FD] hover:text-white border border-[#8B5CF6]/40 hover:border-[#8B5CF6] shadow-[0_0_10px_rgba(139,92,246,0.15)]'
                    }`}
                  >
                    <Sparkles className="w-3.5 h-3.5 text-[#A78BFA] animate-pulse" />
                    <span>✨ AI Enhance</span>
                  </button>

                  {/* Templates Picker Trigger */}
                  <button
                    type="button"
                    onClick={() => setTemplateModalIndex(index)}
                    className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#121A2B] hover:bg-[#172137] text-[#94A3B8] hover:text-[#F8FAFC] border border-[rgba(148,163,184,0.15)] transition-all"
                  >
                    <BookOpen className="w-3.5 h-3.5 text-[#8B5CF6]" />
                    <span>Templates</span>
                  </button>
                </div>

                <span className="text-[11px] text-[#64748B]">
                  Max 4 images • PNG, JPG, GIF, WEBP up to 5MB
                </span>
              </div>

              {/* AI Content Enhancer Drawer */}
              <AiEnhanceDrawer
                currentText={post.content}
                isOpen={openAiIndex === index}
                onClose={() => setOpenAiIndex(null)}
                onApply={(newText) => {
                  handleContentChange(index, newText);
                  setOpenAiIndex(null);
                }}
                onInsertThread={handleInsertThread}
              />

              {/* Target X Account Selector (Section 6) */}
              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <div className="flex items-center space-x-1.5 text-xs text-[#94A3B8]">
                    <Users className="w-3.5 h-3.5 text-[#8B5CF6]" />
                    <span>Target Accounts for Post #{index + 1}:</span>
                  </div>

                  {accounts.length > 1 && (
                    <button
                      type="button"
                      onClick={() =>
                        handleApplyToAllPosts(post.selectedAccountIds)
                      }
                      className="text-[11px] text-[#8B5CF6] hover:text-[#A78BFA] transition-colors"
                    >
                      Apply this selection to all posts
                    </button>
                  )}
                </div>

                {accounts.length === 0 ? (
                  <p className="text-xs text-[#64748B] italic">
                    No accounts available. Connect an account in the Accounts tab.
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {accounts.map((acc) => {
                      const isSelected = post.selectedAccountIds.includes(acc.id);
                      return (
                        <button
                          key={acc.id}
                          type="button"
                          onClick={() => handleToggleAccount(index, acc.id)}
                          className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                            isSelected
                              ? 'bg-violet-600/20 text-[#F8FAFC] border border-[#8B5CF6] shadow-sm'
                              : 'bg-[#0B1020] text-[#94A3B8] border border-[rgba(148,163,184,0.12)] hover:border-[rgba(148,163,184,0.25)]'
                          }`}
                        >
                          <div className={`w-3.5 h-3.5 rounded flex items-center justify-center text-[10px] ${
                            isSelected ? 'bg-[#8B5CF6] text-white' : 'border border-[rgba(148,163,184,0.3)]'
                          }`}>
                            {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                          </div>
                          {acc.profile_image_url && (
                            <img
                              src={acc.profile_image_url}
                              alt={acc.username}
                              className="w-4 h-4 rounded-full object-cover"
                            />
                          )}
                          <span>@{acc.username}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Thread Connecting Line between cards */}
            {composerMode === 'thread' && index < posts.length - 1 && (
              <div className="flex items-center justify-center my-[-10px] relative z-10">
                <div className="flex items-center space-x-2 px-3 py-1 rounded-full bg-[#0B1020] border border-[#8B5CF6]/40 text-[11px] text-[#A78BFA] font-medium shadow-md">
                  <CornerDownRight className="w-3.5 h-3.5 text-[#8B5CF6]" />
                  <span>Replies to Tweet #{index + 1}</span>
                </div>
              </div>
            )}
          </React.Fragment>
          );
        })}
      </div>

      {/* Add New Post / Tweet Trigger */}
      <div className="mt-6 flex items-center justify-between">
        <button
          type="button"
          onClick={handleAddPost}
          className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-lg button-secondary text-xs font-semibold"
        >
          <PlusCircle className="w-4 h-4 text-[#8B5CF6]" />
          <span>{composerMode === 'thread' ? 'Add Next Tweet to Thread' : 'Add Another Post'}</span>
        </button>

        <button
          type="button"
          onClick={handleOpenReview}
          className="px-6 py-2.5 rounded-lg button-primary text-xs font-semibold shadow-glow"
        >
          <span>Continue to Confirmation ({totalOperations})</span>
        </button>
      </div>

      {/* ==================================================================== */}
      {/* PRE-PUBLISH CONFIRMATION REVIEW MODAL (Section 6 Requirement)         */}
      {/* ==================================================================== */}
      {showReviewModal && !publishResults && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="w-full max-w-2xl luxury-card p-6 border border-[rgba(139,92,246,0.3)] shadow-2xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-4 border-b border-[rgba(148,163,184,0.12)]">
              <div>
                <h3 className="text-lg font-bold text-[#F8FAFC]">
                  {composerMode === 'thread' ? 'Review X Thread Before Publishing' : 'Review Before Publishing'}
                </h3>
                <p className="text-xs text-[#94A3B8]">
                  {composerMode === 'thread'
                    ? `Chained thread of ${posts.length} tweets connected sequentially.`
                    : 'Please verify your posts, images, and target accounts before executing.'}
                </p>
              </div>
              <div className="flex items-center space-x-2">
                {composerMode === 'thread' && (
                  <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-[#8B5CF6]/20 text-[#A78BFA] border border-[#8B5CF6]/30">
                    🧵 Thread Mode
                  </span>
                )}
                <div className="px-3 py-1 rounded-full text-xs font-semibold bg-violet-500/10 text-violet-300 border border-violet-500/20">
                  {publishMode === 'now' ? 'Publish Now' : 'Scheduled Queue'}
                </div>
              </div>
            </div>

            {/* Scrollable list of prepared posts */}
            <div className="flex-1 overflow-y-auto py-4 space-y-3.5 my-2">
              {posts.map((p, idx) => {
                const targetAccounts = accounts.filter((a) =>
                  p.selectedAccountIds.includes(a.id)
                );
                const scheduledTime = calculateScheduledTime(idx);

                return (
                  <div
                    key={p.id}
                    className="p-3.5 rounded-lg bg-[#0B1020] border border-[rgba(148,163,184,0.1)] text-xs"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-[#A78BFA]">
                        {composerMode === 'thread' ? `Tweet #${idx + 1} in Thread` : `Post #${idx + 1}`}
                      </span>
                      {publishMode === 'schedule' && (
                        <span className="text-[11px] text-blue-400">
                          Due: {scheduledTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ({scheduledTime.toLocaleDateString()})
                        </span>
                      )}
                    </div>
                    {p.content && (
                      <p className="text-[#F8FAFC] leading-relaxed mb-2.5 whitespace-pre-wrap">
                        {p.content}
                      </p>
                    )}

                    {/* Review Attached Images Preview */}
                    {p.media && p.media.length > 0 && (
                      <div className="flex items-center space-x-2 mb-2.5">
                        {p.media.map((img, imgI) => (
                          <img
                            key={imgI}
                            src={img}
                            alt="preview"
                            className="w-12 h-12 rounded-lg object-cover border border-[rgba(148,163,184,0.2)]"
                          />
                        ))}
                        <span className="text-[11px] text-[#94A3B8]">
                          {p.media.length} image(s) attached
                        </span>
                      </div>
                    )}

                    <div className="flex items-center space-x-1.5 flex-wrap gap-1">
                      <span className="text-[11px] text-[#64748B]">Target accounts:</span>
                      {targetAccounts.map((ta) => (
                        <span
                          key={ta.id}
                          className="px-2 py-0.5 rounded bg-[#172137] text-violet-300 text-[11px] border border-[rgba(139,92,246,0.2)]"
                        >
                          @{ta.username}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Operation Metrics */}
            <div className="p-3 rounded-lg bg-[#121A2B] border border-[rgba(148,163,184,0.1)] text-xs flex items-center justify-between mb-4">
              <span className="text-[#94A3B8]">Total Publishing Operations:</span>
              <span className="text-sm font-bold text-[#F8FAFC]">
                {totalOperations} operation(s)
              </span>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end space-x-3 pt-3 border-t border-[rgba(148,163,184,0.12)]">
              <button
                type="button"
                disabled={isPublishing}
                onClick={() => setShowReviewModal(false)}
                className="px-4 py-2 rounded-lg button-secondary text-xs font-semibold"
              >
                Back to Editing
              </button>

              <button
                type="button"
                disabled={isPublishing}
                onClick={handleConfirmPublish}
                className="px-6 py-2 rounded-lg button-primary text-xs font-semibold flex items-center space-x-2 disabled:opacity-50"
              >
                {isPublishing ? (
                  <span>Publishing to X API...</span>
                ) : publishMode === 'now' ? (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>{composerMode === 'thread' ? 'Confirm & Publish Thread' : 'Confirm & Publish Now'}</span>
                  </>
                ) : (
                  <>
                    <Clock className="w-3.5 h-3.5" />
                    <span>{composerMode === 'thread' ? 'Confirm & Schedule Thread' : 'Confirm & Schedule'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* LIVE PUBLISHING RESULTS MODAL                                        */}
      {/* ==================================================================== */}
      {publishResults && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-xl luxury-card p-6 border border-[rgba(139,92,246,0.3)] shadow-2xl">
            <div className="text-center mb-6">
              <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto mb-3">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-[#F8FAFC]">
                {publishResults.isScheduled ? 'Posts Successfully Scheduled!' : 'Publishing Complete!'}
              </h3>
              <p className="text-xs text-[#94A3B8] mt-1">
                {publishResults.message ||
                  `Completed ${publishResults.successfulOperations} of ${publishResults.totalOperations} operations successfully.`}
              </p>
            </div>

            {/* Results list if published now */}
            {publishResults.results && (
              <div className="max-h-60 overflow-y-auto space-y-2 mb-6">
                {publishResults.results.map((res: any, idx: number) => (
                  <div
                    key={idx}
                    className="p-3 rounded-lg bg-[#0B1020] border border-[rgba(148,163,184,0.1)] flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center space-x-2 truncate">
                      <span
                        className={`w-2 h-2 rounded-full ${
                          res.status === 'published' ? 'bg-emerald-400' : 'bg-rose-400'
                        }`}
                      />
                      <span className="font-semibold text-[#F8FAFC]">@{res.username}</span>
                      <span className="text-[#64748B] truncate">
                        {res.status === 'published' ? 'Published' : `Failed: ${res.error}`}
                      </span>
                    </div>

                    {res.tweetUrl && (
                      <a
                        href={res.tweetUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[#8B5CF6] hover:text-[#A78BFA] transition-colors flex items-center space-x-1 flex-shrink-0"
                      >
                        <span>View Tweet</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-center justify-end space-x-3">
              <button
                type="button"
                onClick={() => {
                  setPublishResults(null);
                  setShowReviewModal(false);
                  // Reset deck
                  setPosts([{ id: 'post-1', content: '', selectedAccountIds: accounts.length > 0 ? [accounts[0].id] : [], media: [] }]);
                  router.push(publishResults.isScheduled ? '/scheduled' : '/published');
                }}
                className="w-full py-2.5 rounded-lg button-primary text-xs font-semibold"
              >
                <span>Go to {publishResults.isScheduled ? 'Scheduled Posts' : 'Published Posts'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Template Picker Modal */}
      <TemplatePickerModal
        isOpen={templateModalIndex !== null}
        onClose={() => setTemplateModalIndex(null)}
        onSelectTemplate={(templateText) => {
          if (templateModalIndex !== null) {
            handleContentChange(templateModalIndex, templateText);
            setTemplateModalIndex(null);
          }
        }}
      />
    </AppLayout>
  );
}

export default function ComposerPage() {
  return (
    <Suspense fallback={<div className="text-sm text-[#94A3B8]">Loading Composer...</div>}>
      <ComposerContent />
    </Suspense>
  );
}
