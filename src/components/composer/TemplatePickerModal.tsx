'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Search,
  BookOpen,
  Sparkles,
  Check,
  Plus,
  Trash2,
  Copy,
} from 'lucide-react';
import { BUILT_IN_TEMPLATES, PostTemplate } from '@/data/templates';

interface TemplatePickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTemplate: (content: string) => void;
}

export function TemplatePickerModal({
  isOpen,
  onClose,
  onSelectTemplate,
}: TemplatePickerModalProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [customTemplates, setCustomTemplates] = useState<PostTemplate[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Load custom templates from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('postpilot_custom_templates');
      if (saved) {
        setCustomTemplates(JSON.parse(saved));
      }
    } catch {}
  }, [isOpen]);

  if (!isOpen) return null;

  const allTemplates = [...customTemplates, ...BUILT_IN_TEMPLATES];

  const filteredTemplates = allTemplates.filter((t) => {
    const matchesCat =
      selectedCategory === 'all' ||
      (selectedCategory === 'custom' ? t.isCustom : t.category === selectedCategory);

    const matchesSearch =
      !searchQuery.trim() ||
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.content.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesCat && matchesSearch;
  });

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#121A2B] border border-[rgba(148,163,184,0.2)] rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-[rgba(148,163,184,0.1)]">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-[#8B5CF6]/15 border border-[#8B5CF6]/30 text-[#A78BFA]">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#F8FAFC]">
                Post Templates & Frameworks
              </h3>
              <p className="text-xs text-[#94A3B8]">
                Proven copywriting structures and custom snippets
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#172137] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search & Category Filter Row */}
        <div className="p-4 border-b border-[rgba(148,163,184,0.08)] bg-[#0B1020]/40 space-y-3">
          <div className="relative">
            <Search className="w-4 h-4 text-[#64748B] absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search templates (e.g. hook, launch, lessons)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#0B1020] border border-[rgba(148,163,184,0.15)] text-xs text-[#F8FAFC] placeholder-[#64748B] focus:outline-none focus:border-[#8B5CF6]"
            />
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {[
              { id: 'all', label: 'All Frameworks' },
              { id: 'hooks', label: '⚡ Hooks' },
              { id: 'announcements', label: '🚀 Announcements' },
              { id: 'growth', label: '📈 Growth' },
              { id: 'engagement', label: '💬 Engagement' },
              { id: 'custom', label: '⭐ My Custom' },
            ].map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                  selectedCategory === cat.id
                    ? 'bg-[#8B5CF6] text-white shadow-sm'
                    : 'bg-[#172137] text-[#94A3B8] hover:text-[#F8FAFC]'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Templates Grid / List */}
        <div className="p-4 overflow-y-auto space-y-3 flex-1 custom-scrollbar">
          {filteredTemplates.length === 0 ? (
            <div className="py-12 text-center text-xs text-[#94A3B8]">
              No templates found matching your criteria.
            </div>
          ) : (
            filteredTemplates.map((template) => (
              <div
                key={template.id}
                className="p-4 rounded-xl bg-[#0B1020]/60 border border-[rgba(148,163,184,0.1)] hover:border-[rgba(139,92,246,0.3)] transition-all flex flex-col justify-between gap-3 group"
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm font-bold text-[#F8FAFC]">
                      {template.title}
                    </span>
                    <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full bg-[#8B5CF6]/10 text-[#A78BFA] border border-[#8B5CF6]/20">
                      {template.category}
                    </span>
                  </div>
                  <p className="text-xs text-[#94A3B8] mb-2.5">
                    {template.description}
                  </p>
                  <pre className="p-3 rounded-lg bg-[#121A2B] border border-[rgba(148,163,184,0.08)] text-xs text-[#F8FAFC] font-sans whitespace-pre-wrap leading-relaxed">
                    {template.content}
                  </pre>
                </div>

                <div className="flex items-center justify-end space-x-2 pt-2 border-t border-[rgba(148,163,184,0.06)]">
                  <button
                    type="button"
                    onClick={() => handleCopy(template.id, template.content)}
                    className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-[#172137] hover:bg-[#1E293B] text-xs font-medium text-[#94A3B8] hover:text-[#F8FAFC] transition-colors"
                  >
                    {copiedId === template.id ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => onSelectTemplate(template.content)}
                    className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg button-primary text-xs font-semibold"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Apply to Post</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

