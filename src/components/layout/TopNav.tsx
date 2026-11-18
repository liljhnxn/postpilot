'use client';

import React from 'react';
import Link from 'next/link';
import { Menu, PlusCircle, Users, ExternalLink } from 'lucide-react';

interface TopNavProps {
  onOpenMobileMenu: () => void;
  title: string;
  connectedCount: number;
}

export function TopNav({ onOpenMobileMenu, title, connectedCount }: TopNavProps) {
  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-4 md:px-8 bg-[#0B1020]/80 backdrop-blur-md border-b border-[rgba(148,163,184,0.12)]">
      {/* Mobile Toggle & Page Title */}
      <div className="flex items-center space-x-3">
        <button
          onClick={onOpenMobileMenu}
          className="p-2 text-[#94A3B8] hover:text-[#F8FAFC] lg:hidden rounded-lg hover:bg-[#172137] transition-colors"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>
        <h1 className="text-lg md:text-xl font-semibold text-[#F8FAFC] tracking-tight">
          {title}
        </h1>
      </div>

      {/* Right Controls: Account badge & Quick Action */}
      <div className="flex items-center space-x-3">
        <Link
          href="/accounts"
          className="flex items-center space-x-2 px-3 py-1.5 rounded-full bg-[#121A2B] border border-[rgba(148,163,184,0.12)] hover:border-[rgba(139,92,246,0.3)] transition-all text-xs"
        >
          <Users className="w-3.5 h-3.5 text-[#8B5CF6]" />
          <span className="text-[#94A3B8]">Connected:</span>
          <span className="font-semibold text-[#F8FAFC]">{connectedCount}</span>
        </Link>

        <Link
          href="/composer"
          className="hidden sm:inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-lg button-primary text-xs font-medium"
        >
          <PlusCircle className="w-3.5 h-3.5" />
          <span>New Post</span>
        </Link>
      </div>
    </header>
  );
}

