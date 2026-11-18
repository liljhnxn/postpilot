'use client';

import React from 'react';
import { AlertTriangle, Key, ExternalLink } from 'lucide-react';

interface ConfigNoticeProps {
  missingItems: string[];
}

export function ConfigNotice({ missingItems }: ConfigNoticeProps) {
  if (!missingItems || missingItems.length === 0) return null;

  return (
    <div className="mb-6 p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200">
      <div className="flex items-start space-x-3">
        <AlertTriangle className="w-5 h-5 text-amber-400 mt-0.5 flex-shrink-0" />
        <div className="space-y-1 text-sm flex-1">
          <p className="font-semibold text-amber-300">Environment Configuration Required</p>
          <p className="text-amber-200/80 text-xs leading-relaxed">
            PostPilot is running in configuration mode. To enable live X publishing and database persistence, configure the following keys in your <code className="px-1.5 py-0.5 rounded bg-black/40 text-amber-300 font-mono text-[11px]">.env.local</code> file:
          </p>
          <ul className="list-disc pl-5 mt-2 space-y-1 text-xs text-amber-300/90 font-mono">
            {missingItems.map((item, idx) => (
              <li key={idx}>{item}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

