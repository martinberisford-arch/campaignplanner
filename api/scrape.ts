import type { VercelRequest, VercelResponse } from '@vercel/node';

// ─── Types ───────────────────────────────────────────────────────────────────

interface ScrapedData {
  title?: string;
  description?: string;
  price?: string;
  startDate?: string;
  endDate?: string;
  time?: string;
  location?: string;
  image?: string;
  siteName?: string;
  author?: string;
  url: string;
  extractionMethod: string;
  rawMeta?: Record<string, string>;
}

// ─── HTML parsing utilities (no external deps) ───────────────────────────────

function extractMeta(html: string, name: string): string | undefined {
  // Try name=
  let match = html.match(new RegExp(`<meta[^>]*name=["']${name}["'][^>]*content=["']([^"']+)["']`, 'i'));
  if (match) return decode(match[1]);
  // Try content= first, name= second
  match = html.match(new RegExp(`<meta[^>]*content=["']([^"']+)["'][^>]*name=["']${name}["']`, 'i'));
  if (match) return decode(match[1]);
  return undefined;
}

function extractOG(html: string, property: string): string | undefined {
  let match = html.match(new RegExp(`<meta[^>]*property=["']og:${property}["'][^>]*content=["']([^"']+)["']`, 'i'));
  if (match) return decode(match[1]);
  match = html.match(new RegExp(`<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:${property}["']`, 'i'));
  if (match) return decode(match[1]);
  return undefined;
}

function extractLD(html: string): Record<string, unknown> | null {
  const matches = html.match(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi);
  if (!matches) return null;
  for (const block of matches) {
    const inner = block.replace(/<script[^>]*>/, '').replace(/<\/script>/, '').trim();
    try {
      const obj = JSON.parse(inner);
      const items = Array.isArray(obj) ? obj : [obj];
      for (const item of items) {
        if (item['@type']) return item;
      }
    } catch { /* skip */ }
  }
  return null;
}

function extractH1(html: string): string | undefined {
  const match = html.match(/<h1[^>]*>([^<]+)<\/h1>/i);
  return match ? decode(match[1].trim()) : undefined;
}

function extractTitle(html: string): string | undefined {
  const match = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  return match ? decode(match[1].trim()) : undefined;
}

function decode(str: string): string {
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(parseInt(code)))
    .trim();
}

// Format a date string to UK-friendly format
function formatDate(raw: string): string {
  if (!raw) return raw;
  try {
    const d = new Date(raw);
    if (isNaN(d.getTime())) return raw;
    return d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  } catch {
    return raw;
  }
}

// Format time from ISO or time string
function formatTime(raw: string): string {
  if (!raw) return raw;
  try {
    if (raw.includes('T')) {
      const d = new Date(raw);
      if (!isNaN(d.getTime())) {
        return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: true });
      }
    }
    // Already a time string like "09:00"
    const parts = raw.split(':');
    if (parts.length >= 2) {
      const h = parseInt(parts[0]);
      const m = parts[1].padStart(2, '0');
      const suffix = h >= 12 ? 'PM' : 'AM';
      const h12 = h > 12 ? h - 12 : h === 0 ? 12 : h;
      return `${h12}:${m} ${suffix}`;
    }
    return raw;
  } catch {
    return raw;
  }
}

// Extract price from various formats
function extractPriceFromText(text: string): string | undefined {
  // Look for £, $, € or "free" patterns
  const priceMatch = text.match(/(?:£|GBP\s*)?(\d+(?:\.\d{2})?)\s*(?:per\s+(?:person|delegate|attendee))?/i);
  const freeMatch = text.match(/\b(free|no charge|complimentary)\b/i);
  if (freeMatch) return 'Free';
  if (priceMatch) return `£${priceMatch[1]}`;
  return undefined;
}

// Extract location from LD object
function extractLocationFromLD(location: unknown): string | undefined {
  if (!location) return undefined;
  if (typeof location === 'string') return location;
  if (typeof location === 'object' && location !== null) {
    const loc = location as Record<string, unknown>;
    const parts: string[] = [];
    if (loc.name) parts.push(String(loc.name));
    if (loc.address) {
      const addr = loc.address as Record<string, unknown>;
      if (typeof addr === 'string') {
        parts.push(addr);
      } else {
        if (addr.streetAddress) parts.push(String(addr.streetAddress));
        if (addr.addressLocality) parts.push(String(addr.addressLocality));
        if (addr.addressRegion) parts.push(String(addr.addressRegion));
        if (addr.postalCode) parts.push(String(addr.postalCode));
      }
    }
    return parts.join(', ') || undefined;
  }
  return undefined;
}

// ─── Main handler ─────────────────────────────────────────────────────────────

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { url, fieldMap } = req.body as { url: string; fieldMap?: Record<string, string> };

  if (!url) {
    return res.status(400).json({ error: 'URL is required' });
  }

  // Validate URL
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(url);
  } catch {
    return res.status(400).json({ error: 'Invalid URL format. Please include https://' });
  }

  // Security: block private/internal IPs
  const hostname = parsedUrl.hostname;
  const blockedHosts = ['localhost', '127.0.0.1', '0.0.0.0'];
  const blockedPrefixes = ['192.168.', '10.', '172.16.', '172.17.', '172.18.', '172.19.', '172.20.'];
  if (blockedHosts.includes(hostname) || blockedPrefixes.some(p => hostname.startsWith(p))) {
    return res.status(403).json({ error: 'Internal/private URLs are not permitted for security reasons.' });
  }

  // Fetch the page
  let html: string;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; CommsDashboard/1.0; +https://comms-dashboard.vercel.app)',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-GB,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate',
        'Cache-Control': 'no-cache',
      },
    });

    clearTimeout(timeout);

    if (!response.ok) {
      return res.status(422).json({ error: `Page returned ${response.status}. The URL may be blocked or unavailable.` });
    }

    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('text/html') && !contentType.includes('text/plain')) {
      return res.status(422).json({ error: 'URL does not point to an HTML page.' });
    }

    html = await response.text();
  } catch (err: unknown) {
    if (err instanceof Error && err.name === 'AbortError') {
      return res.status(408).json({ error: 'Request timed out after 8 seconds. The site may be slow or blocking scrapers.' });
    }
    return res.status(422).json({ error: `Could not fetch URL: ${err instanceof Error ? err.message : 'Unknown error'}` });
  }

  // Sanitise: strip scripts and styles for safety (we only read meta/ld)
  const safeHtml = html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, '');

  const result: ScrapedData = { url, extractionMethod: '' };
  const methods: string[] = [];

  // ── 1. JSON-LD structured data (most reliable) ────────────────────────────
  const ld = extractLD(html); // Use original for LD parsing
  if (ld) {
    methods.push('JSON-LD');
    const type = String(ld['@type'] || '').toLowerCase();

    // Title
    if (ld.name) result.title = String(ld.name);
    else if (ld.headline) result.title = String(ld.headline);

    // Description
    if (ld.description) result.description = String(ld.description);

    // Dates
    if (ld.startDate) {
      const raw = String(ld.startDate);
      result.startDate = formatDate(raw);
      if (raw.includes('T')) result.time = formatTime(raw);
    }
    if (ld.endDate) result.endDate = formatDate(String(ld.endDate));

    // End time
    if (ld.endDate && String(ld.endDate).includes('T') && !result.time) {
      result.time = `${formatTime(String(ld.startDate || ''))} – ${formatTime(String(ld.endDate))}`;
    } else if (ld.endDate && String(ld.endDate).includes('T') && result.time) {
      result.time = `${result.time} – ${formatTime(String(ld.endDate))}`;
    }

    // Location
    if (ld.location) {
      result.location = extractLocationFromLD(ld.location);
    } else if (type.includes('event') && ld.venue) {
      result.location = extractLocationFromLD(ld.venue);
    }

    // Price
    if (ld.offers) {
      const offers = Array.isArray(ld.offers) ? ld.offers : [ld.offers];
      for (const offer of offers) {
        const o = offer as Record<string, unknown>;
        if (o.price !== undefined) {
          const price = Number(o.price);
          const currency = String(o.priceCurrency || 'GBP');
          if (price === 0) {
            result.price = 'Free';
          } else {
            result.price = currency === 'GBP' ? `£${price}` : `${currency} ${price}`;
          }
          break;
        }
      }
    }

    // Image
    if (ld.image) {
      if (typeof ld.image === 'string') result.image = ld.image;
      else if (Array.isArray(ld.image) && ld.image.length > 0) result.image = String(ld.image[0]);
      else if (typeof ld.image === 'object' && (ld.image as Record<string, unknown>).url) {
        result.image = String((ld.image as Record<string, unknown>).url);
      }
    }

    // Author/organiser
    if (ld.organizer) {
      const org = ld.organizer as Record<string, unknown>;
      result.author = org.name ? String(org.name) : undefined;
    } else if (ld.author) {
      const auth = ld.author as Record<string, unknown>;
      result.author = typeof auth === 'string' ? auth : auth.name ? String(auth.name) : undefined;
    }

    // Publisher
    if (ld.publisher) {
      const pub = ld.publisher as Record<string, unknown>;
      result.siteName = pub.name ? String(pub.name) : undefined;
    }
  }

  // ── 2. Domain priority custom field map ───────────────────────────────────
  if (fieldMap && Object.keys(fieldMap).length > 0) {
    methods.push('Domain Priority Map');
    for (const [systemField, metaName] of Object.entries(fieldMap)) {
      const val = extractMeta(safeHtml, metaName) || extractOG(safeHtml, metaName.replace('og:', ''));
      if (val) {
        (result as Record<string, unknown>)[systemField] = val;
      }
    }
  }

  // ── 3. OpenGraph ──────────────────────────────────────────────────────────
  const ogTitle = extractOG(safeHtml, 'title');
  const ogDesc = extractOG(safeHtml, 'description');
  const ogImage = extractOG(safeHtml, 'image');
  const ogSite = extractOG(safeHtml, 'site_name');

  if (ogTitle || ogDesc || ogImage || ogSite) methods.push('OpenGraph');

  if (!result.title && ogTitle) result.title = ogTitle;
  if (!result.description && ogDesc) result.description = ogDesc;
  if (!result.image && ogImage) result.image = ogImage;
  if (!result.siteName && ogSite) result.siteName = ogSite;

  // OG event-specific
  if (!result.startDate) {
    const ogDate = extractOG(safeHtml, 'event:start_time') || extractMeta(safeHtml, 'event:start_time');
    if (ogDate) { result.startDate = formatDate(ogDate); if (ogDate.includes('T')) result.time = formatTime(ogDate); }
  }

  // ── 4. Standard meta tags ─────────────────────────────────────────────────
  const metaDesc = extractMeta(safeHtml, 'description');
  const metaKeywords = extractMeta(safeHtml, 'keywords');
  const metaAuthor = extractMeta(safeHtml, 'author');

  if (metaDesc || metaKeywords || metaAuthor) methods.push('Meta Tags');

  if (!result.description && metaDesc) result.description = metaDesc;
  if (!result.author && metaAuthor) result.author = metaAuthor;

  // Try common date meta tags used by WordPress and event plugins
  if (!result.startDate) {
    const candidates = [
      extractMeta(safeHtml, 'event-date'),
      extractMeta(safeHtml, 'eventDate'),
      extractMeta(safeHtml, 'date'),
      extractMeta(safeHtml, 'article:published_time'),
      extractOG(safeHtml, 'article:published_time'),
    ].filter(Boolean) as string[];
    if (candidates.length > 0) result.startDate = formatDate(candidates[0]);
  }

  // Try common location/venue meta tags
  if (!result.location) {
    const candidates = [
      extractMeta(safeHtml, 'event-location'),
      extractMeta(safeHtml, 'eventLocation'),
      extractMeta(safeHtml, 'location'),
      extractMeta(safeHtml, 'venue'),
    ].filter(Boolean) as string[];
    if (candidates.length > 0) result.location = candidates[0];
  }

  // Try price meta tags
  if (!result.price) {
    const candidates = [
      extractMeta(safeHtml, 'price'),
      extractMeta(safeHtml, 'event-price'),
      extractMeta(safeHtml, 'product:price:amount'),
    ].filter(Boolean) as string[];
    if (candidates.length > 0) result.price = extractPriceFromText(candidates[0]) || candidates[0];
  }

  // ── 5. HTML fallback ──────────────────────────────────────────────────────
  if (!result.title) {
    const h1 = extractH1(safeHtml);
    const titleTag = extractTitle(safeHtml);
    if (h1 || titleTag) methods.push('HTML Fallback');
    result.title = h1 || titleTag;
  }

  // ── 6. Smarter content parsing for event-specific sites ───────────────────
  // Look for date patterns in page text
  if (!result.startDate) {
    // UK date patterns: "12th March 2026", "March 12, 2026", "12/03/2026"
    const datePatterns = [
      /(\d{1,2}(?:st|nd|rd|th)?\s+(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4})/i,
      /(\d{1,2}[\s\/\-](?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*[\s\/\-]\d{2,4})/i,
    ];
    const bodyText = safeHtml.replace(/<[^>]+>/g, ' ');
    for (const pattern of datePatterns) {
      const match = bodyText.match(pattern);
      if (match) {
        result.startDate = match[1];
        methods.push('HTML Content');
        break;
      }
    }
  }

  // Look for time patterns
  if (!result.time) {
    const bodyText = safeHtml.replace(/<[^>]+>/g, ' ');
    const timePattern = /(\d{1,2}[:.]\d{2}\s*(?:am|pm|AM|PM)?(?:\s*[-–]\s*\d{1,2}[:.]\d{2}\s*(?:am|pm|AM|PM)?)?)/;
    const match = bodyText.match(timePattern);
    if (match) result.time = match[1].trim();
  }

  // Look for price patterns in body
  if (!result.price) {
    const bodyText = safeHtml.replace(/<[^>]+>/g, ' ');
    const freeMatch = bodyText.match(/\b(free\s+(?:to\s+attend|entry|admission|event|workshop|webinar|course)|no\s+charge|complimentary)\b/i);
    const priceMatch = bodyText.match(/(?:Price|Cost|Fee|Ticket)[:\s]+£(\d+(?:\.\d{2})?)/i);
    if (freeMatch) result.price = 'Free';
    else if (priceMatch) result.price = `£${priceMatch[1]}`;
  }

  // Look for location in body
  if (!result.location) {
    const bodyText = safeHtml.replace(/<[^>]+>/g, ' ');
    const locationMatch = bodyText.match(/(?:Venue|Location|Where|Place|Address)[:\s]+([A-Z][^\n,]{5,60}(?:,\s*[A-Z][^\n,]{2,30})?)/);
    if (locationMatch) result.location = decode(locationMatch[1].trim());
  }

  // ── 7. Try URL slug for title hints ──────────────────────────────────────
  if (!result.title) {
    const slug = parsedUrl.pathname.split('/').filter(Boolean).pop() || '';
    if (slug) {
      result.title = slug
        .replace(/-/g, ' ')
        .replace(/_/g, ' ')
        .replace(/\b\w/g, c => c.toUpperCase())
        .trim();
      methods.push('URL Slug');
    }
  }

  // ── Build site name from domain if missing ────────────────────────────────
  if (!result.siteName) {
    result.siteName = hostname
      .replace(/^www\./, '')
      .split('.')[0]
      .replace(/-/g, ' ')
      .replace(/\b\w/g, c => c.toUpperCase());
  }

  result.extractionMethod = methods.length > 0 ? methods.join(' → ') : 'No structured data found';

  // Strip any empty fields
  const cleaned = Object.fromEntries(
    Object.entries(result).filter(([, v]) => v !== undefined && v !== '')
  ) as ScrapedData;

  // Determine missing fields the template needs
  const commonFields = ['title', 'description', 'startDate', 'time', 'location', 'price'];
  const missing = commonFields.filter(f => !(f in cleaned));

  return res.status(200).json({ data: cleaned, missing, method: result.extractionMethod });
}
