'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AppLayout } from '@/components/layout/AppLayout';
import {
  BookOpen,
  Search,
  Plus,
  Copy,
  Check,
  Send,
  Trash2,
  Sparkles,
  Layers,
  X,
} from 'lucide-react';
import { BUILT_IN_TEMPLATES, PostTemplate } from '@/data/templates';

export default function TemplatesPage() {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [customTemplates, setCustomTemplates] = useState<PostTemplate[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // New Custom Template Modal State
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState<PostTemplate['category']>('custom');
  const [newDescription, setNewDescription] = useState('');
  const [newContent, setNewContent] = useState('');

  // Load custom templates from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('postpilot_custom_templates');
      if (saved) {
        setCustomTemplates(JSON.parse(saved));
      }
    } catch {}
  }, []);

  // Save custom templates to localStorage
  const saveCustomTemplates = (updated: PostTemplate[]) => {
    setCustomTemplates(updated);
    try {
      localStorage.setItem('postpilot_custom_templates', JSON.stringify(updated));
    } catch {}
  };

  const handleCreateTemplate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) return;

    const newTemplate: PostTemplate = {
      id: `custom-${Date.now()}`,
      title: newTitle.trim(),
      category: newCategory,
      description: newDescription.trim() || 'Custom copywriting framework',
      content: newContent.trim(),
      isCustom: true,
    };

    saveCustomTemplates([newTemplate, ...customTemplates]);
    setNewTitle('');
    setNewDescription('');
    setNewContent('');
    setCreateModalOpen(false);
  };

  const handleDeleteCustom = (id: string) => {
    if (!confirm('Are you sure you want to delete this custom template?')) return;
    saveCustomTemplates(customTemplates.filter((t) => t.id !== id));
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleUseInComposer = (content: string) => {
    // Pass content to composer via query param or session
    sessionStorage.setItem('postpilot_composer_prefill', content);
    router.push('/composer');
  };

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

  return (
    <AppLayout title="Templates Library">
      <div className="space-y-8 max-w-7xl mx-auto">
        {/* Header & Controls Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-2xl font-bold tracking-tight text-[#F8FAFC]">
                Post Templates & Snippets Library
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#8B5CF6]/15 text-[#A78BFA] border border-[#8B5CF6]/30">
                Playbook
              </span>
            </div>
            <p className="text-sm text-[#94A3B8] mt-1">
              Battle-tested frameworks, recurring announcement formats, and custom snippets.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setCreateModalOpen(true)}
            className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-lg button-primary text-xs font-semibold"
          >
            <Plus className="w-4 h-4" />
            <span>New Custom Template</span>
          </button>
        </div>

        {/* Search & Categories Bar */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 p-4 rounded-xl bg-[#121A2B] border border-[rgba(148,163,184,0.12)]">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-[#64748B] absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search templates (e.g. hook, launch, lessons)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-[#0B1020] border border-[rgba(148,163,184,0.15)] text-xs text-[#F8FAFC] placeholder-[#64748B] focus:outline-none focus:border-[#8B5CF6]"
            />
          </div>

          {/* Category Pills */}
          <div className="flex flex-wrap items-center gap-1.5">
            {[
              { id: 'all', label: 'All Frameworks' },
              { id: 'hooks', label: '⚡ Viral Hooks' },
              { id: 'announcements', label: '🚀 Announcements' },
              { id: 'growth', label: '📈 Growth' },
              { id: 'engagement', label: '💬 Engagement' },
              { id: 'custom', label: `⭐ Custom (${customTemplates.length})` },
            ].map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
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

        {/* Templates Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTemplates.length === 0 ? (
            <div className="col-span-full py-16 text-center text-xs text-[#94A3B8]">
              No templates found matching your search.
            </div>
          ) : (
            filteredTemplates.map((template) => (
              <div
                key={template.id}
                className="luxury-card p-6 flex flex-col justify-between group hover:border-[rgba(139,92,246,0.3)] transition-all"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs uppercase font-semibold px-2 py-0.5 rounded-full bg-[#8B5CF6]/15 text-[#A78BFA] border border-[#8B5CF6]/20">
                      {template.category}
                    </span>
                    {template.isCustom && (
                      <button
                        type="button"
                        onClick={() => handleDeleteCustom(template.id)}
                        className="text-[#64748B] hover:text-rose-400 p-1 transition-colors"
                        title="Delete custom template"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <h3 className="text-base font-bold text-[#F8FAFC] mb-1">
                    {template.title}
                  </h3>
                  <p className="text-xs text-[#94A3B8] mb-4">
                    {template.description}
                  </p>

                  <div className="p-3.5 rounded-xl bg-[#0B1020] border border-[rgba(148,163,184,0.08)] text-xs text-[#F8FAFC] font-sans whitespace-pre-wrap leading-relaxed line-clamp-6">
                    {template.content}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 mt-4 border-t border-[rgba(148,163,184,0.08)]">
                  <button
                    type="button"
                    onClick={() => handleCopy(template.id, template.content)}
                    className="inline-flex items-center space-x-1.5 text-xs text-[#94A3B8] hover:text-[#F8FAFC] transition-colors"
                  >
                    {copiedId === template.id ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400 font-semibold">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Text</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleUseInComposer(template.content)}
                    className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg button-primary text-xs font-semibold"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Use Template</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Create Custom Template Modal */}
        {createModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
            <div className="bg-[#121A2B] border border-[rgba(148,163,184,0.2)] rounded-2xl w-full max-w-lg p-6 shadow-2xl relative">
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-[rgba(148,163,184,0.1)]">
                <div>
                  <h3 className="text-base font-bold text-[#F8FAFC]">
                    Create Custom Template
                  </h3>
                  <p className="text-xs text-[#94A3B8] mt-0.5">
                    Save your custom frameworks and recurring announcements
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="p-1 rounded-lg text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#172137] transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleCreateTemplate} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-[#94A3B8] mb-1">
                    Template Title *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Weekly Product Update"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-[#0B1020] border border-[rgba(148,163,184,0.15)] text-sm text-[#F8FAFC] placeholder-[#64748B] focus:outline-none focus:border-[#8B5CF6]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-[#94A3B8] mb-1">
                      Category
                    </label>
                    <select
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value as any)}
                      className="w-full px-3 py-2 rounded-lg bg-[#0B1020] border border-[rgba(148,163,184,0.15)] text-xs text-[#F8FAFC] focus:outline-none focus:border-[#8B5CF6]"
                    >
                      <option value="hooks">⚡ Hooks</option>
                      <option value="announcements">🚀 Announcements</option>
                      <option value="growth">📈 Growth</option>
                      <option value="engagement">💬 Engagement</option>
                      <option value="custom">⭐ Custom</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-[#94A3B8] mb-1">
                      Short Description
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Format for Friday releases"
                      value={newDescription}
                      onChange={(e) => setNewDescription(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-[#0B1020] border border-[rgba(148,163,184,0.15)] text-xs text-[#F8FAFC] placeholder-[#64748B] focus:outline-none focus:border-[#8B5CF6]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#94A3B8] mb-1">
                    Template Content *
                  </label>
                  <textarea
                    rows={6}
                    required
                    placeholder="Type your template text here with [placeholders]..."
                    value={newContent}
                    onChange={(e) => setNewContent(e.target.value)}
                    className="w-full p-3 rounded-lg bg-[#0B1020] border border-[rgba(148,163,184,0.15)] text-sm text-[#F8FAFC] placeholder-[#64748B] focus:outline-none focus:border-[#8B5CF6] resize-none"
                  />
                </div>

                <div className="flex items-center justify-end space-x-2 pt-3 border-t border-[rgba(148,163,184,0.1)]">
                  <button
                    type="button"
                    onClick={() => setCreateModalOpen(false)}
                    className="px-4 py-2 rounded-lg bg-[#172137] hover:bg-[#1E293B] text-xs font-medium text-[#94A3B8] hover:text-[#F8FAFC] transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-lg button-primary text-xs font-semibold"
                  >
                    Save Template
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}

