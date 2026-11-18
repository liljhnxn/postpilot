'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AppLayout } from '@/components/layout/AppLayout';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  CheckCircle2,
  Users,
  Plus,
  ExternalLink,
  RefreshCw,
  X,
  Send,
  Layers,
  Sparkles,
} from 'lucide-react';
import { formatDate } from '@/lib/utils';

interface CalendarItem {
  id: string;
  postId: string;
  content: string;
  date: string | null; // YYYY-MM-DD
  fullTimestamp: string | null;
  status: string;
  username: string;
  displayName: string;
  profileImageUrl: string | null;
  xPostId: string | null;
  errorMessage: string | null;
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const WEEKDAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function CalendarPage() {
  const router = useRouter();

  const today = new Date();
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth() + 1); // 1-12
  const [viewMode, setViewMode] = useState<'month' | 'week'>('month');

  const [items, setItems] = useState<CalendarItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Selected item modal
  const [selectedItem, setSelectedItem] = useState<CalendarItem | null>(null);

  const fetchCalendarData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/calendar?year=${currentYear}&month=${currentMonth}`);
      if (!res.ok) {
        throw new Error(`Failed to load calendar data: HTTP ${res.status}`);
      }
      const data = await res.json();
      setItems(data.items || []);
    } catch (err: any) {
      console.error('Error fetching calendar:', err);
      setError(err.message || 'Error communicating with server');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCalendarData();
  }, [currentYear, currentMonth]);

  // Navigation handlers
  const handlePrevMonth = () => {
    if (currentMonth === 1) {
      setCurrentMonth(12);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 12) {
      setCurrentMonth(1);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  const handleGoToToday = () => {
    setCurrentYear(today.getFullYear());
    setCurrentMonth(today.getMonth() + 1);
  };

  // Build Month Grid
  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month, 0).getDate();
  };

  const getFirstDayOfWeek = (year: number, month: number) => {
    // 0 = Sunday, 1 = Monday, etc.
    return new Date(year, month - 1, 1).getDay();
  };

  const daysInCurrentMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDayIndex = getFirstDayOfWeek(currentYear, currentMonth);

  // Previous month padding days
  const prevMonthDays = getDaysInMonth(
    currentMonth === 1 ? currentYear - 1 : currentYear,
    currentMonth === 1 ? 12 : currentMonth - 1
  );

  const calendarCells = [];

  // 1. Trailing days from previous month
  for (let i = firstDayIndex - 1; i >= 0; i--) {
    const dayNum = prevMonthDays - i;
    const m = currentMonth === 1 ? 12 : currentMonth - 1;
    const y = currentMonth === 1 ? currentYear - 1 : currentYear;
    const dateStr = `${y}-${String(m).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
    calendarCells.push({
      dayNum,
      isCurrentMonth: false,
      dateStr,
      isToday: false,
    });
  }

  // 2. Days of current month
  for (let i = 1; i <= daysInCurrentMonth; i++) {
    const dateStr = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
    const isToday =
      today.getFullYear() === currentYear &&
      today.getMonth() + 1 === currentMonth &&
      today.getDate() === i;

    calendarCells.push({
      dayNum: i,
      isCurrentMonth: true,
      dateStr,
      isToday,
    });
  }

  // 3. Leading days of next month to fill 35 or 42 grid slots
  const remainingSlots = (7 - (calendarCells.length % 7)) % 7;
  for (let i = 1; i <= remainingSlots; i++) {
    const m = currentMonth === 12 ? 1 : currentMonth + 1;
    const y = currentMonth === 12 ? currentYear + 1 : currentYear;
    const dateStr = `${y}-${String(m).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
    calendarCells.push({
      dayNum: i,
      isCurrentMonth: false,
      dateStr,
      isToday: false,
    });
  }

  // Map items to dateStr
  const itemsByDate: Record<string, CalendarItem[]> = {};
  items.forEach((item) => {
    if (item.date) {
      if (!itemsByDate[item.date]) itemsByDate[item.date] = [];
      itemsByDate[item.date].push(item);
    }
  });

  const formatItemTime = (isoString: string | null) => {
    if (!isoString) return '';
    try {
      const d = new Date(isoString);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  return (
    <AppLayout title="Content Calendar">
      <div className="space-y-6 max-w-7xl mx-auto">
        {/* Header & Controls Bar */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-2xl font-bold tracking-tight text-[#F8FAFC]">
                Interactive Content Calendar
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#8B5CF6]/15 text-[#A78BFA] border border-[#8B5CF6]/30">
                Visual Planner
              </span>
            </div>
            <p className="text-sm text-[#94A3B8] mt-1">
              Timeline view of your upcoming scheduled tweets and published archive.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Month Navigator */}
            <div className="flex items-center space-x-1.5 p-1 rounded-xl bg-[#121A2B] border border-[rgba(148,163,184,0.12)]">
              <button
                type="button"
                onClick={handlePrevMonth}
                className="p-1.5 rounded-lg hover:bg-[#172137] text-[#94A3B8] hover:text-[#F8FAFC] transition-colors"
                title="Previous Month"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={handleGoToToday}
                className="px-2.5 py-1 text-xs font-semibold rounded-lg text-[#F8FAFC] hover:bg-[#172137] transition-colors"
              >
                Today
              </button>

              <div className="px-3 py-1 font-semibold text-xs text-[#F8FAFC] min-w-[120px] text-center">
                {MONTH_NAMES[currentMonth - 1]} {currentYear}
              </div>

              <button
                type="button"
                onClick={handleNextMonth}
                className="p-1.5 rounded-lg hover:bg-[#172137] text-[#94A3B8] hover:text-[#F8FAFC] transition-colors"
                title="Next Month"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Refresh */}
            <button
              onClick={fetchCalendarData}
              disabled={loading}
              className="p-2 rounded-lg bg-[#121A2B] hover:bg-[#172137] text-[#94A3B8] hover:text-[#F8FAFC] border border-[rgba(148,163,184,0.12)] transition-colors disabled:opacity-50"
              title="Refresh Calendar"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>

            {/* Schedule Post Action */}
            <Link
              href="/composer"
              className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-lg button-primary text-xs font-semibold"
            >
              <Plus className="w-4 h-4" />
              <span>Schedule Post</span>
            </Link>
          </div>
        </div>

        {/* Calendar Grid Container */}
        <div className="luxury-card p-4 sm:p-6 overflow-hidden">
          {/* Weekday Names Header */}
          <div className="grid grid-cols-7 gap-2 mb-2 text-center text-xs font-semibold text-[#64748B] uppercase tracking-wider">
            {WEEKDAY_NAMES.map((name) => (
              <div key={name} className="py-2">
                {name}
              </div>
            ))}
          </div>

          {/* Month Days Grid */}
          <div className="grid grid-cols-7 gap-2 auto-rows-fr">
            {calendarCells.map((cell, idx) => {
              const dayItems = itemsByDate[cell.dateStr] || [];

              return (
                <div
                  key={idx}
                  className={`min-h-[105px] sm:min-h-[125px] p-2 rounded-xl border flex flex-col justify-between transition-all group relative ${
                    cell.isToday
                      ? 'bg-[#172137]/60 border-[#8B5CF6]/50 shadow-[0_0_15px_rgba(139,92,246,0.15)]'
                      : cell.isCurrentMonth
                      ? 'bg-[#0B1020]/70 border-[rgba(148,163,184,0.1)] hover:border-[rgba(139,92,246,0.3)]'
                      : 'bg-[#0B1020]/30 border-[rgba(148,163,184,0.04)] opacity-40'
                  }`}
                >
                  {/* Day Header Row */}
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full ${
                        cell.isToday
                          ? 'bg-[#8B5CF6] text-white'
                          : cell.isCurrentMonth
                          ? 'text-[#F8FAFC]'
                          : 'text-[#64748B]'
                      }`}
                    >
                      {cell.dayNum}
                    </span>

                    {/* Quick "+" action on hover to schedule for this day */}
                    <button
                      type="button"
                      onClick={() => router.push(`/composer?date=${cell.dateStr}`)}
                      title={`Schedule post for ${cell.dateStr}`}
                      className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-[#8B5CF6]/20 text-[#8B5CF6] hover:text-white transition-opacity"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Day Posts List */}
                  <div className="space-y-1.5 mt-1.5 flex-1 overflow-y-auto max-h-[80px] custom-scrollbar">
                    {dayItems.slice(0, 3).map((item) => {
                      const isPublished = item.status === 'published';
                      const isScheduled = item.status === 'scheduled';
                      const timeStr = formatItemTime(item.fullTimestamp);

                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setSelectedItem(item)}
                          className={`w-full text-left p-1.5 rounded-lg border text-[11px] transition-all truncate block ${
                            isPublished
                              ? 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border-emerald-500/20'
                              : isScheduled
                              ? 'bg-blue-500/10 hover:bg-blue-500/20 text-blue-300 border-blue-500/20'
                              : 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border-rose-500/20'
                          }`}
                        >
                          <div className="flex items-center space-x-1 font-semibold text-[10px]">
                            {isPublished ? (
                              <CheckCircle2 className="w-2.5 h-2.5 shrink-0" />
                            ) : (
                              <Clock className="w-2.5 h-2.5 shrink-0" />
                            )}
                            <span className="truncate">@{item.username}</span>
                            {timeStr && <span className="opacity-75">• {timeStr}</span>}
                          </div>
                          <div className="truncate text-[10px] opacity-85 mt-0.5">
                            {item.content}
                          </div>
                        </button>
                      );
                    })}

                    {dayItems.length > 3 && (
                      <div className="text-[10px] text-[#A78BFA] font-medium text-center">
                        +{dayItems.length - 3} more
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl bg-[#121A2B] border border-[rgba(148,163,184,0.1)] text-xs text-[#94A3B8]">
          <div className="flex items-center space-x-4">
            <span className="flex items-center space-x-1.5 text-blue-400">
              <span className="w-2.5 h-2.5 rounded-sm bg-blue-400 inline-block" />
              <span>Scheduled</span>
            </span>
            <span className="flex items-center space-x-1.5 text-emerald-400">
              <span className="w-2.5 h-2.5 rounded-sm bg-emerald-400 inline-block" />
              <span>Published</span>
            </span>
            <span className="flex items-center space-x-1.5 text-rose-400">
              <span className="w-2.5 h-2.5 rounded-sm bg-rose-400 inline-block" />
              <span>Failed</span>
            </span>
          </div>

          <div className="text-[11px] text-[#64748B]">
            Tip: Hover over any calendar day and click <strong>+</strong> to schedule directly for that date.
          </div>
        </div>

        {/* Post Detail Preview Modal */}
        {selectedItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
            <div className="bg-[#121A2B] border border-[rgba(148,163,184,0.2)] rounded-2xl w-full max-w-lg p-6 shadow-2xl relative">
              {/* Modal Header */}
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-[rgba(148,163,184,0.1)]">
                <div className="flex items-center space-x-3">
                  {selectedItem.profileImageUrl ? (
                    <img
                      src={selectedItem.profileImageUrl}
                      alt={selectedItem.username}
                      className="w-9 h-9 rounded-full border border-[rgba(148,163,184,0.2)]"
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-[#8B5CF6]/20 text-[#A78BFA] flex items-center justify-center font-bold text-xs">
                      {selectedItem.username.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <h3 className="text-sm font-bold text-[#F8FAFC]">
                      {selectedItem.displayName}
                    </h3>
                    <p className="text-xs text-[#8B5CF6]">@{selectedItem.username}</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedItem(null)}
                  className="p-1.5 rounded-lg text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#172137] transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Status and Time Pill */}
              <div className="flex items-center justify-between mb-4">
                <span
                  className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                    selectedItem.status === 'published'
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      : selectedItem.status === 'scheduled'
                      ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                      : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                  }`}
                >
                  Status: {selectedItem.status}
                </span>

                <span className="text-xs text-[#94A3B8] flex items-center space-x-1">
                  <Clock className="w-3.5 h-3.5 text-[#8B5CF6]" />
                  <span>{formatDate(selectedItem.fullTimestamp)}</span>
                </span>
              </div>

              {/* Tweet Content */}
              <div className="p-4 rounded-xl bg-[#0B1020] border border-[rgba(148,163,184,0.12)] text-sm text-[#F8FAFC] leading-relaxed whitespace-pre-wrap mb-4">
                {selectedItem.content}
              </div>

              {/* Error if Failed */}
              {selectedItem.errorMessage && (
                <div className="mb-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs font-mono">
                  {selectedItem.errorMessage}
                </div>
              )}

              {/* Modal Footer Actions */}
              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-[rgba(148,163,184,0.1)]">
                {selectedItem.status === 'published' && selectedItem.xPostId && (
                  <a
                    href={`https://x.com/${selectedItem.username}/status/${selectedItem.xPostId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg button-secondary text-xs font-medium"
                  >
                    <span>View on X</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}

                {selectedItem.status === 'scheduled' && (
                  <Link
                    href="/scheduled"
                    className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg button-secondary text-xs font-medium"
                  >
                    <span>Manage in Scheduled</span>
                  </Link>
                )}

                <button
                  type="button"
                  onClick={() => setSelectedItem(null)}
                  className="px-4 py-1.5 rounded-lg button-primary text-xs font-semibold"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}

