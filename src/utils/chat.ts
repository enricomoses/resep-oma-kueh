import { CATALOG_LIMITS } from '@/constants/catalog.constant';
import { CHAT_LIMITS } from '@/constants/chat.constant';

const SAFE_INTERNAL_PREFIXES = [
  '/menu',
  '/classes',
  '/contact',
  '/faq',
  '/about',
  '/ordering-policy',
  '/privacy',
  '/cart',
] as const;

const UNSAFE_SCHEME_REGEX = /(?:javascript|vbscript|data)\s*:/gi;
const CONTROL_AND_BIDI_REGEX =
  /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F\u200B-\u200F\u202A-\u202E\u2066-\u2069\uFEFF]/g;

const SEARCH_STOP_WORDS = new Set([
  'oma',
  'ask',
  'halo',
  'hai',
  'tolong',
  'minta',
  'rekomendasi',
  'rekomendasikan',
  'cari',
  'carikan',
  'ada',
  'apa',
  'saja',
  'yang',
  'di',
  'ke',
  'dari',
  'untuk',
  'dengan',
  'atau',
  'dan',
  'berapa',
  'harganya',
  'harga',
  'produk',
  'kue',
  'menu',
  'detail',
  'bahan',
  'alergen',
  'alergi',
  'komposisi',
  'ingredients',
  'deskripsi',
  'ukuran',
  'info',
  'informasi',
  'tentang',
  'dibawah',
  'bawah',
  'maksimal',
  'budget',
  'kisaran',
  'under',
  'below',
  'cabang',
  'surabaya',
  'bintaro',
  'apakah',
  'bisa',
  'mau',
  'dong',
  'kak',
  'min',
  'ya',
  'yang',
  'rp',
]);

/**
 * Truncate text at a safe UTF-16 code-unit boundary without splitting surrogate pairs.
 */
export function truncateChatAnswer(
  text: string,
  maxLength: number = CHAT_LIMITS.MAX_ANSWER_LENGTH,
): string {
  if (text.length <= maxLength) {
    return text;
  }
  let end = maxLength;
  if (end > 0) {
    const code = text.charCodeAt(end - 1);
    if (code >= 0xd800 && code <= 0xdbff) {
      end -= 1;
    }
  }
  return text.slice(0, end).trimEnd();
}

export function sanitizeChatDisplayText(
  raw: string | null | undefined,
  maxLength: number = CHAT_LIMITS.MAX_ANSWER_LENGTH,
): string {
  if (!raw) return '';
  const cleaned = raw
    .replace(CONTROL_AND_BIDI_REGEX, '')
    .replace(/<[^>]*>/g, ' ')
    .replace(UNSAFE_SCHEME_REGEX, '')
    .replace(/[\r\n\t]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return truncateChatAnswer(cleaned, maxLength);
}

export function isSafeChatHref(href: string): boolean {
  const trimmed = href.trim();
  if (!trimmed || trimmed.length > 512) return false;
  if (trimmed.startsWith('//') || UNSAFE_SCHEME_REGEX.test(trimmed)) {
    return false;
  }
  if (/^https:\/\/wa\.me\/\d{8,15}(\?text=[^\s#]*)?$/i.test(trimmed)) {
    return true;
  }
  if (trimmed.startsWith('/')) {
    const pathname = trimmed.split(/[?#]/)[0];
    return SAFE_INTERNAL_PREFIXES.some(
      (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
    );
  }
  return false;
}

export function normalizeChatMatchText(text: string): string {
  return text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim();
}

export function buildSearchTokens(
  text: string,
  maxChars: number = CHAT_LIMITS.MAX_SEARCH_CHARS,
): string[] {
  const bounded = sanitizeChatDisplayText(text, maxChars);
  const normalized = normalizeChatMatchText(bounded);
  if (!normalized) return [];
  const rawTokens = normalized.split(' ').filter((token) => token.length >= 2);
  const meaningful = rawTokens.filter(
    (token) => !SEARCH_STOP_WORDS.has(token) && !/^\d+$/.test(token),
  );
  return [...new Set(meaningful)].slice(0, 8);
}

export function parseIdrBudgetFromQuery(text: string): number | null {
  const normalized = text.toLowerCase();
  const patterns: RegExp[] = [
    /(?:rp\.?\s*|under\s+|below\s+|budget\s+|maks(?:imal)?\s+|di\s*bawah\s+|dibawah\s+|kurang\s+dari\s+)(\d+(?:[.,]\d+)?)\s*(jt|juta|rb|ribu|k)?\b/i,
    /\b(\d+(?:[.,]\d+)?)\s*(jt|juta|rb|ribu|k)\b/i,
    /\b(\d{4,9}|\d{1,3}(?:[.,]\d{3})+)\b/,
  ];

  for (const pattern of patterns) {
    const match = normalized.match(pattern);
    if (!match) continue;
    const rawNum = match[1];
    const unit = match[2]?.toLowerCase() ?? '';
    let value: number;

    if (unit === 'jt' || unit === 'juta') {
      const parsed = Number.parseFloat(rawNum.replace(',', '.'));
      if (!Number.isFinite(parsed)) continue;
      value = Math.round(parsed * 1_000_000);
    } else if (unit === 'rb' || unit === 'ribu' || unit === 'k') {
      const parsed = Number.parseFloat(rawNum.replace(',', '.'));
      if (!Number.isFinite(parsed)) continue;
      value = Math.round(parsed * 1_000);
    } else {
      const digitsOnly = rawNum.replace(/[.,]/g, '');
      value = Number.parseInt(digitsOnly, 10);
    }

    if (
      Number.isSafeInteger(value) &&
      value > 0 &&
      value <= CATALOG_LIMITS.MAX_UNIT_IDR
    ) {
      return value;
    }
  }

  return null;
}

export function extractDietarySlugFromQuery(text: string): string | null {
  const lower = normalizeChatMatchText(text);
  if (
    lower.includes('gluten free') ||
    lower.includes('glutenfree') ||
    lower.includes('bebas gluten') ||
    /\bgf\b/.test(lower)
  ) {
    return 'gluten-free';
  }
  if (lower.includes('vegan')) {
    return 'vegan';
  }
  if (
    lower.includes('egg free') ||
    lower.includes('eggfree') ||
    lower.includes('tanpa telur') ||
    lower.includes('bebas telur')
  ) {
    return 'egg-free';
  }
  if (
    lower.includes('dairy free') ||
    lower.includes('dairyfree') ||
    lower.includes('tanpa susu') ||
    lower.includes('bebas susu') ||
    lower.includes('non dairy')
  ) {
    return 'dairy-free';
  }
  return null;
}
