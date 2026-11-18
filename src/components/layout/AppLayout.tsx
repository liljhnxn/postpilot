'use client';

import React, { useState, useEffect } from 'react';
import { Sidebar } from './Sidebar';
import { TopNav } from './TopNav';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/context/AuthContext';

interface AppLayoutProps {
  children: React.ReactNode;
  title?: string;
}

export function AppLayout({ children, title = 'Dashboard' }: AppLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [connectedCount, setConnectedCount] = useState<number>(0);
  const { user, signOut, isConfigured } = useAuth();

  useEffect(() => {
    async function loadAccountsCount() {
      if (!isConfigured || !user) return;
      try {
        const supabase = createClient();
        const { count, error } = await supabase
          .from('x_accounts')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('connection_status', 'connected');

        if (!error && count !== null) {
          setConnectedCount(count);
        }
      } catch (err) {
        console.warn('Could not load accounts count:', err);
      }
    }
    loadAccountsCount();
  }, [user, isConfigured]);

  return (
    <div className="min-h-screen bg-[#0B1020] text-[#F8FAFC]">
      {/* Sidebar */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        userEmail={user?.email || null}
        onSignOut={signOut}
      />

      {/* Main Content Area */}
      <div className="lg:pl-64 flex flex-col min-h-screen">
        <TopNav
          onOpenMobileMenu={() => setSidebarOpen(true)}
          title={title}
          connectedCount={connectedCount}
        />

        <main className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full">
          {children}
        </main>
      </div>
    </div>
  );
}
