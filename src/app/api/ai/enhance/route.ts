import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export type AIAction = 'hook' | 'shorten' | 'variations' | 'cta' | 'thread';

interface EnhanceRequestBody {
  text: string;
  action: AIAction;
  customApiKey?: string;
}

// Intelligent heuristic transformations when no Gemini key is provided
function generateHeuristicEnhancement(text: string, action: AIAction) {
  const clean = text.trim();
  const firstSentence = clean.split(/[.?!]/)[0] || clean;

  switch (action) {
    case 'hook': {
      const hooks = [
        `Stop scrolling.\n\n${clean}`,
        `Most people don't realize this about ${firstSentence.toLowerCase()}:\n\n${clean}`,
        `Here is the unfiltered truth:\n\n${clean}`,
        `Game changer:\n\n${clean}`,
      ];
      return {
        result: hooks[Math.floor(Math.random() * hooks.length)],
        type: 'single',
      };
    }

    case 'shorten': {
      // Remove filler words and tighten
      let shortened = clean
        .replace(/\b(basically|literally|actually|really|very|just|in order to|due to the fact that)\b/gi, '')
        .replace(/\s+/g, ' ')
        .trim();
      if (shortened.length > 250) {
        shortened = shortened.slice(0, 240) + '...';
      }
      return {
        result: shortened,
        type: 'single',
      };
    }

    case 'variations': {
      return {
        type: 'variations',
        variations: [
          {
            label: 'Casual & High Energy',
            text: `Big news! 🔥\n\n${clean}\n\nLet me know what you think!`,
          },
          {
            label: 'Professional & Direct',
            text: `Key takeaway:\n\n${clean}\n\nFocusing on precision and execution.`,
          },
          {
            label: 'Engaging & Conversational',
            text: `Ever thought about this?\n\n${clean}\n\nWhat's your take? Drop a reply below 👇`,
          },
        ],
      };
    }

    case 'cta': {
      const ctas = [
        '\n\nWhat do you think? Drop your thoughts below 👇',
        '\n\nHit repost 🔁 if this resonated with you.',
        '\n\nBookmark this for later 🔖',
        '\n\nThoughts? Let us discuss in the replies.',
      ];
      return {
        result: `${clean}${ctas[Math.floor(Math.random() * ctas.length)]}`,
        type: 'single',
      };
    }

    case 'thread': {
      return {
        type: 'thread',
        tweets: [
          `1/3 🧵 Let's talk about ${firstSentence.toLowerCase()}...\n\nHere's what you need to know:`,
          `2/3 ${clean}\n\nThis changes the entire landscape if applied correctly.`,
          `3/3 TL;DR:\n• Focus on execution\n• Test continuously\n\nIf you found this valuable, repost for your network! 🔁`,
        ],
      };
    }

    default:
      return { result: clean, type: 'single' };
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: EnhanceRequestBody = await request.json();
    const { text, action, customApiKey } = body;

    if (!text || !text.trim()) {
      return NextResponse.json({ error: 'Please enter some text to enhance.' }, { status: 400 });
    }

    const apiKey = customApiKey || process.env.GEMINI_API_KEY;

    // If Gemini API key is configured, call official Gemini 1.5 Flash endpoint
    if (apiKey) {
      try {
        let systemPrompt = '';
        if (action === 'hook') {
          systemPrompt = 'Rewrite this draft into an irresistible, viral X post starting with a scroll-stopping hook line. Keep under 280 characters. Return ONLY the rewritten post, no explanation.';
        } else if (action === 'shorten') {
          systemPrompt = 'Shorten this draft into a punchy, concise X post under 220 characters with high impact. Cut all fluff. Return ONLY the rewritten post.';
        } else if (action === 'variations') {
          systemPrompt = 'Generate exactly 3 distinct variations of this X post in JSON format: {"variations":[{"label":"High Energy / Hype","text":"..."},{"label":"Analytical / Thought Leadership","text":"..."},{"label":"Question / Conversational","text":"..."}]}. Each under 280 chars. Return valid JSON only.';
        } else if (action === 'cta') {
          systemPrompt = 'Add a natural, high-converting call-to-action or engagement question to the end of this X post. Keep the total length under 280 characters. Return ONLY the finished post.';
        } else if (action === 'thread') {
          systemPrompt = 'Break down this idea into a compelling 3-tweet X thread in JSON format: {"tweets":["1/3 ...","2/3 ...","3/3 ..."]}. Each tweet must be under 280 characters. Return valid JSON only.';
        }

        const geminiRes = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [
                {
                  role: 'user',
                  parts: [
                    { text: `${systemPrompt}\n\nOriginal draft:\n"""${text.trim()}"""` },
                  ],
                },
              ],
              generationConfig: {
                temperature: 0.7,
                maxOutputTokens: 600,
              },
            }),
          }
        );

        if (geminiRes.ok) {
          const geminiData = await geminiRes.json();
          const rawText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';

          if (action === 'variations' || action === 'thread') {
            try {
              const cleanedJson = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
              const parsed = JSON.parse(cleanedJson);
              return NextResponse.json({
                success: true,
                poweredBy: 'Gemini 1.5 Flash',
                ...parsed,
              });
            } catch {
              // Fallback to text if JSON parsing fails
            }
          }

          return NextResponse.json({
            success: true,
            poweredBy: 'Gemini 1.5 Flash',
            result: rawText,
            type: 'single',
          });
        }
      } catch (geminiError) {
        console.warn('Gemini API call failed, falling back to heuristic enhancer:', geminiError);
      }
    }

    // Heuristic Smart Copywriting Fallback
    const fallbackResult = generateHeuristicEnhancement(text, action);
    return NextResponse.json({
      success: true,
      poweredBy: 'PostPilot Smart Engine',
      ...fallbackResult,
    });
  } catch (err: any) {
    console.error('AI Enhance error:', err);
    return NextResponse.json({ error: err.message || 'Internal AI Error' }, { status: 500 });
  }
}

