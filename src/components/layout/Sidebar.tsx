'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users2,
  PenSquare,
  Clock,
  CheckCircle2,
  Settings,
  LogOut,
  Send,
  X,
  BarChart3,
  Calendar,
  BookOpen,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  userEmail?: string | null;
  onSignOut?: () => void;
}

const navItems = [
  {
    name: 'Overview',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    name: 'Accounts',
    href: '/accounts',
    icon: Users2,
  },
  {
    name: 'Create Posts',
    href: '/composer',
    icon: PenSquare,
  },
  {
    name: 'Scheduled',
    href: '/scheduled',
    icon: Clock,
  },
  {
    name: 'Calendar',
    href: '/calendar',
    icon: Calendar,
  },
  {
    name: 'Published',
    href: '/published',
    icon: CheckCircle2,
  },
  {
    name: 'Templates',
    href: '/templates',
    icon: BookOpen,
  },
  {
    name: 'Analytics',
    href: '/analytics',
    icon: BarChart3,
  },
];

export function Sidebar({ isOpen, onClose, userEmail, onSignOut }: SidebarProps) {
  const pathname = usePathname();

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={cn(
          'fixed top-0 bottom-0 left-0 z-50 flex flex-col w-64 bg-[#0B1020] border-r border-[rgba(148,163,184,0.12)] transition-transform duration-300 ease-in-out lg:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Brand Header */}
        <div className="flex items-center justify-between h-16 px-6 border-b border-[rgba(148,163,184,0.1)]">
          <Link href="/dashboard" className="flex items-center space-x-3 group">
            <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-[#8B5CF6] to-[#7C3AED] text-white shadow-lg shadow-[#8B5CF6]/20">
              <Send className="w-5 h-5 -rotate-45 translate-x-0.5 -translate-y-0.5" />
            </div>
            <div>
              <span className="text-lg font-bold tracking-tight text-[#F8FAFC]">
                Post<span className="text-[#8B5CF6]">Pilot</span>
              </span>
              <p className="text-[10px] text-[#94A3B8] font-medium tracking-wider uppercase">
                Multi-Account X
              </p>
            </div>
          </Link>

          {/* Close button for mobile */}
          <button
            onClick={onClose}
            className="p-1.5 text-[#94A3B8] hover:text-[#F8FAFC] lg:hidden rounded-lg hover:bg-[#172137]"
            aria-label="Close navigation"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Links */}
        <div className="flex-1 px-3 py-6 space-y-1.5 overflow-y-auto">
          <div className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-[#64748B]">
            Navigation
          </div>
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname?.startsWith(item.href));
            const Icon = item.icon;

            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={onClose}
                className={cn(
                  'flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group relative',
                  isActive
                    ? 'text-[#F8FAFC] bg-[#172137] border border-[rgba(139,92,246,0.3)] shadow-[0_0_15px_-3px_rgba(139,92,246,0.15)]'
                    : 'text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#121A2B]'
                )}
              >
                {isActive && (
                  <span className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-[#8B5CF6] rounded-r-full shadow-glow" />
                )}
                <Icon
                  className={cn(
                    'w-4 h-4 mr-3 transition-colors',
                    isActive ? 'text-[#8B5CF6]' : 'text-[#64748B] group-hover:text-[#94A3B8]'
                  )}
                />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </div>

        {/* Bottom Actions & User Profile */}
        <div className="p-3 border-t border-[rgba(148,163,184,0.1)] space-y-1.5 bg-[#080C18]">
          <Link
            href="/settings"
            className={cn(
              'flex items-center px-3 py-2 rounded-lg text-sm font-medium text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#121A2B] transition-colors',
              pathname === '/settings' && 'text-[#F8FAFC] bg-[#172137]'
            )}
          >
            <Settings className="w-4 h-4 mr-3 text-[#64748B]" />
            <span>Settings</span>
          </Link>

          {/* User Info & Sign Out */}
          <div className="pt-2 mt-2 border-t border-[rgba(148,163,184,0.08)] flex items-center justify-between px-2">
            <div className="flex items-center space-x-2.5 overflow-hidden">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#1E293B] to-[#334155] flex items-center justify-center text-xs font-semibold text-[#8B5CF6] border border-[rgba(139,92,246,0.25)] flex-shrink-0">
                {userEmail ? userEmail.charAt(0).toUpperCase() : 'U'}
              </div>
              <div className="overflow-hidden">
                <p className="text-xs font-medium text-[#F8FAFC] truncate">
                  {userEmail || 'User'}
                </p>
                <p className="text-[10px] text-[#64748B] truncate">Active Session</p>
              </div>
            </div>

            {onSignOut && (
              <button
                onClick={onSignOut}
                title="Sign out"
                className="p-1.5 text-[#64748B] hover:text-[#EF4444] rounded-md hover:bg-[#172137] transition-colors"
                aria-label="Sign out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}

