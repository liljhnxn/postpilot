/**
 * Accurate X (Twitter) character counter adhering to X's official counting algorithm:
 * - Total limit: 280 weighted characters
 * - URLs (http/https): Exactly 23 characters (t.co length)
 * - Standard ASCII / Latin: 1 character
 * - CJK characters and complex glyphs: 2 characters
 * - Emojis & emoji sequences: 2 characters
 */

const URL_REGEX = /https?:\/\/[^\s]+/gi;
const TCO_LENGTH = 23;

export function getXCharacterCount(text: string): {
  count: number;
  remaining: number;
  isValid: boolean;
  max: number;
  percentage: number;
} {
  const MAX_LIMIT = 280;
  if (!text) {
    return {
      count: 0,
      remaining: MAX_LIMIT,
      isValid: false,
      max: MAX_LIMIT,
      percentage: 0,
    };
  }

  // 1. Replace all URLs with a placeholder of length TCO_LENGTH
  let modifiedText = text.replace(URL_REGEX, 'x'.repeat(TCO_LENGTH));

  // 2. Count weighted characters using Unicode code points
  let weightedCount = 0;
  // Use Array.from or Intl.Segmenter if available to handle graphemes & surrogate pairs
  if (typeof Intl !== 'undefined' && 'Segmenter' in Intl) {
    // Modern segmenter for accurate emoji & grapheme clusters
    const segmenter = new (Intl as any).Segmenter('en', { granularity: 'grapheme' });
    const segments = Array.from(segmenter.segment(modifiedText)) as { segment: string }[];

    for (const { segment } of segments) {
      if (segment.length > 1 || isCjkOrWide(segment.codePointAt(0) || 0)) {
        // Multi-byte emoji cluster or CJK
        weightedCount += 2;
      } else {
        const codePoint = segment.codePointAt(0) || 0;
        if (codePoint >= 0 && codePoint <= 4351) {
          weightedCount += 1;
        } else if (codePoint >= 8192 && codePoint <= 8205) {
          weightedCount += 1;
        } else if (codePoint >= 8208 && codePoint <= 8223) {
          weightedCount += 1;
        } else if (codePoint >= 8242 && codePoint <= 8247) {
          weightedCount += 1;
        } else {
          weightedCount += 2;
        }
      }
    }
  } else {
    // Fallback using code points
    for (const char of modifiedText) {
      const codePoint = char.codePointAt(0) || 0;
      if (codePoint >= 0 && codePoint <= 4351) {
        weightedCount += 1;
      } else {
        weightedCount += 2;
      }
    }
  }

  const remaining = MAX_LIMIT - weightedCount;
  const isValid = weightedCount > 0 && weightedCount <= MAX_LIMIT;
  const percentage = Math.min(Math.round((weightedCount / MAX_LIMIT) * 100), 100);

  return {
    count: weightedCount,
    remaining,
    isValid,
    max: MAX_LIMIT,
    percentage,
  };
}

function isCjkOrWide(codePoint: number): boolean {
  return (
    (codePoint >= 0x4e00 && codePoint <= 0x9fff) || // CJK Unified Ideographs
    (codePoint >= 0x3400 && codePoint <= 0x4dbf) || // CJK Extension A
    (codePoint >= 0x20000 && codePoint <= 0x2a6df) || // CJK Extension B
    (codePoint >= 0xf900 && codePoint <= 0xfaff) || // CJK Compatibility Ideographs
    (codePoint >= 0x3040 && codePoint <= 0x309f) || // Hiragana
    (codePoint >= 0x30a0 && codePoint <= 0x30ff) || // Katakana
    (codePoint >= 0xac00 && codePoint <= 0xd7af) || // Hangul Syllables
    (codePoint >= 0xff01 && codePoint <= 0xff60) || // Fullwidth Forms
    (codePoint >= 0xffe0 && codePoint <= 0xffe6) ||
    codePoint >= 0x1f300 // Emojis & Symbols
  );
}

