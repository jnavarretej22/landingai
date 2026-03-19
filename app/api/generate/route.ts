import { NextResponse } from 'next/server';
import { readFileSync } from 'fs';
import { join } from 'path';
import { callGenerateAI } from '@/lib/ai-client';
import { extractBusinessInfo } from '@/lib/prompts';
import { getSectorHero } from '@/lib/sectors';

interface LandingPageData {
  metaDescription?: string;
  metaKeywords?: string;
  name?: string;
  logoP1?: string;
  logoP2?: string;
  logoImage?: string;
  logoAlt?: string;
  businessTagline?: string;
  displayFont?: string;
  bodyFont?: string;
  bg?: string;
  surface?: string;
  surface2?: string;
  accent?: string;
  accent2?: string;
  textColor?: string;
  mutedColor?: string;
  navSolidBg?: string;
  btnText?: string;
  nav1?: string;
  nav2?: string;
  nav3?: string;
  navCta?: string;
  whatsapp?: string;
  heroEyebrow?: string;
  heroLine1?: string;
  heroLine2?: string;
  heroLine3?: string;
  heroSubtitle?: string;
  ctaPrimary?: string;
  ctaSecondary?: string;
  stat1num?: string;
  stat1lbl?: string;
  stat2num?: string;
  stat2lbl?: string;
  stat3num?: string;
  stat3lbl?: string;
  carouselTag?: string;
  carouselTitle?: string;
  productsTag?: string;
  productsTitle?: string;
  productsSub?: string;
  aboutTag?: string;
  aboutTitle?: string;
  aboutText?: string;
  aboutCta?: string;
  aboutImage?: string;
  businessInitials?: string;
  ctaTitle?: string;
  ctaSubtitle?: string;
  footerLogoP2?: string;
  footerLogoP1?: string;
  footerDesc?: string;
  templateStyle?: string;
  slides?: { url?: string; alt?: string }[];
  cards?: { icon?: string; title?: string; text?: string; price?: string }[];
  testimonials?: { text?: string; initials?: string; name?: string; role?: string }[];
}

interface BusinessInfo {
  name?: string;
  industry?: string;
  product?: string;
  sector?: string;
  audience?: string;
  differentiator?: string;
  bgColor?: string;
  accentColor?: string;
  colors?: string;
  whatsapp?: string;
  tone?: string;
}

// ── Template cache (cargado una vez al iniciar) ──────────
const PUBLIC = join(process.cwd(), 'public');

const TEMPLATES: Record<string, string> = {
  default:   'template-landing-v3.html',
  glass:     'template-glass.html',
  brutal:    'template-brutal.html',
  editorial: 'template-editorial.html',
  neon:      'template-neon.html',
  organic:   'template-organic.html',
};

const TEMPLATE_CACHE: Record<string, string> = {};
for (const [key, file] of Object.entries(TEMPLATES)) {
  try { TEMPLATE_CACHE[key] = readFileSync(join(PUBLIC, file), 'utf-8'); }
  catch { /* template missing — fallback handled at runtime */ }
}

// ── Color helpers ────────────────────────────────────────
function isLightColor(hex: string | undefined): boolean {
  if (!hex || !hex.startsWith('#') || hex.length < 7) return false;
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.5;
}

const DARK_PALETTES: Record<string, string> = {
  comida:      '#0A0800', bebidas: '#0A0800', restaurante: '#0A0700',
  moda:        '#080808', ropa:    '#080808', zapatos: '#080808', nike: '#080808', calzado: '#080808',
  tecnologia:  '#050510', tech:    '#050510', app: '#050510',
  salud:       '#06100A', belleza: '#06100A', spa: '#0F0A07',
  fitness:     '#060606', deporte: '#060606',
  servicios:   '#08080F',
};

function getDarkBgForIndustry(industry: string): string {
  const key = Object.keys(DARK_PALETTES).find(k =>
    (industry || '').toLowerCase().includes(k)
  );
  return key ? DARK_PALETTES[key] : '#080808';
}

function lighten(hex: string | undefined, amount = 12): string {
  if (!hex || !hex.startsWith('#') || hex.length < 7) return '#111111';
  const r = Math.min(255, parseInt(hex.slice(1, 3), 16) + amount);
  const g = Math.min(255, parseInt(hex.slice(3, 5), 16) + amount);
  const b = Math.min(255, parseInt(hex.slice(5, 7), 16) + amount);
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

const FILLER_WORDS = new Set([
  'para', 'con', 'de', 'del', 'la', 'las', 'los', 'el', 'por', 'una', 'un', 'tu', 'sus', 'su', 'nuestro', 'nuestra',
  'nuestros', 'nuestras', 'y', 'en', 'lo', 'al', 'sobre'
]);

const HEADLINE_FIELDS: (keyof LandingPageData)[] = [
  'heroLine1', 'heroLine2', 'heroLine3', 'heroSubtitle', 'heroEyebrow',
  'nav1', 'nav2', 'nav3', 'navCta', 'ctaPrimary', 'ctaSecondary',
  'carouselTag', 'carouselTitle', 'productsTag', 'productsTitle', 'productsSub',
  'aboutTag', 'aboutTitle', 'aboutText', 'aboutCta',
  'stat1lbl', 'stat2lbl', 'stat3lbl', 'ctaTitle', 'ctaSubtitle',
  'footerDesc', 'businessTagline'
];

function compactHeadline(text?: string, minimumWords = 1): string {
  if (!text) return '';
  const normalized = text.replace(/[–—]/g, ' ').replace(/\s+/g, ' ').trim();
  if (!normalized) return '';
  const words = normalized.split(' ');
  if (words.length <= 3) return normalized;
  const target = Math.max(minimumWords, Math.floor(words.length * 0.7));
  const picked: string[] = [];
  for (let i = 0; i < words.length && picked.length < target; i++) {
    const word = words[i];
    const lower = word.toLowerCase();
    const remaining = words.length - i - 1;
    const canSkip = FILLER_WORDS.has(lower) && remaining >= (target - picked.length);
    if (canSkip) continue;
    picked.push(word);
  }
  if (picked.length === 0) {
    picked.push(...words.slice(0, target));
  }
  const compacted = picked.join(' ').replace(/\s+/g, ' ').trim();
  if (!compacted) return normalized;
  return compacted.charAt(0).toUpperCase() + compacted.slice(1);
}

function tightenCopy(data: LandingPageData): LandingPageData {
  for (const key of HEADLINE_FIELDS) {
    const value = data[key];
    if (typeof value === 'string' && value.trim().length > 0) {
      (data as Record<string, unknown>)[key] = compactHeadline(value);
    }
  }
  if (data.cards?.length) {
    data.cards = data.cards.map(card => ({
      ...card,
      title: compactHeadline(card.title),
      text: compactHeadline(card.text, 2),
      price: card.price ? compactHeadline(card.price) : card.price,
    }));
  }
  if (data.testimonials?.length) {
    data.testimonials = data.testimonials.map(testi => ({
      ...testi,
      text: compactHeadline(testi.text, 3),
      role: compactHeadline(testi.role),
    }));
  }
  return data;
}

const RESPONSIVE_COPY_STYLES = `
    /* Auto balance hero & headlines */
    .nav-logo {
      display:flex;
      align-items:center;
      gap:12px;
    }
    .nav-logo-img-wrap {
      display:inline-flex;
      align-items:center;
      justify-content:center;
      max-height:52px;
      max-width:180px;
    }
    .nav-logo-img-wrap img {
      max-height:52px;
      max-width:180px;
      width:auto;
      object-fit:contain;
    }
    .hero-title,
    .s-title,
    .about-title,
    .cta-title {
      text-wrap:balance;
      word-break:break-word;
    }
    .hero-title {
      max-width:min(900px, 92vw);
      margin-inline:auto;
    }
    .hero-sub,
    .s-sub,
    .about-text,
    .cta-sub {
      max-width:min(640px, 100%);
    }
    .card-title {
      text-wrap:balance;
      word-break:break-word;
    }
    @supports (-webkit-line-clamp: 3) {
      .hero-title,
      .s-title,
      .about-title,
      .cta-title {
        display:-webkit-box;
        -webkit-box-orient:vertical;
        -webkit-line-clamp:3;
        overflow:hidden;
      }
      .hero-sub,
      .s-sub,
      .about-text,
      .cta-sub {
        display:-webkit-box;
        -webkit-box-orient:vertical;
        -webkit-line-clamp:3;
        overflow:hidden;
      }
      .card-text {
        display:-webkit-box;
        -webkit-box-orient:vertical;
        -webkit-line-clamp:4;
        overflow:hidden;
      }
    }
`;

// ── Post-process: enforce color rules ───────────────────
function postProcess(data: LandingPageData, businessInfo: BusinessInfo): LandingPageData {
  const wantsLight = /blanco|claro|crema|fondo claro|fondo blanco|fondo amarillo/i
    .test(`${businessInfo.bgColor || ''} ${businessInfo.colors || ''}`);

  if (!wantsLight) {
    // Force dark bg if AI returned something light
    if (isLightColor(data.bg)) {
      data.bg = getDarkBgForIndustry(businessInfo.industry || '');
    }
    data.surface  = data.surface  || lighten(data.bg, 12);
    data.surface2 = data.surface2 || lighten(data.bg, 24);
    data.textColor  = '#FFFFFF';
    data.mutedColor = 'rgba(255,255,255,0.5)';
    data.navSolidBg = 'rgba(5,5,5,0.92)';
  } else {
    data.textColor  = data.textColor  || '#1A1A1A';
    data.mutedColor = data.mutedColor || 'rgba(0,0,0,0.5)';
    data.navSolidBg = data.navSolidBg || 'rgba(255,255,255,0.95)';
  }

  // Auto-detect btnText based on accent lightness
  data.btnText = isLightColor(data.accent || '') ? '#000000' : '#FFFFFF';

  // Guaranteed defaults
  data.whatsapp        = data.whatsapp || businessInfo.whatsapp || '0000000000';
  data.businessInitials = data.businessInitials ||
    (businessInfo.name || 'XX').replace(/[^a-zA-Z]/g, '').substring(0, 2).toUpperCase() || 'XX';

  // Safety truncation for Hero giant text (limit to impact words)
  const truncateWords = (str: unknown, max: number): string => {
    if (typeof str !== 'string' || !str) return '';
    const words = str.split(/\s+/).filter(Boolean);
    if (words.length <= max) return str;
    return words.slice(0, max).join(' ');
  };

  data.heroLine1   = truncateWords(data.heroLine1, 4);
  data.heroLine2   = truncateWords(data.heroLine2, 3);
  data.heroLine3   = truncateWords(data.heroLine3, 4);
  data.heroEyebrow = truncateWords(data.heroEyebrow, 4);

  return data;
}

// ── Fill template ────────────────────────────────────────
function escapeAttr(value: string | undefined): string {
  return (value ?? '').replace(/"/g, '&quot;');
}

function fillTemplate(template: string, data: LandingPageData, businessInfo: BusinessInfo, images: string[] = []): string {
  let html = template;

  const logoMarkup = data.logoImage
    ? `<span class="nav-logo-img-wrap"><img src="${data.logoImage}" alt="${escapeAttr(data.logoAlt || data.name || 'Logo')}" loading="lazy" decoding="async"></span>`
    : '';

  const simple: Record<string, string> = {
    '{{META_DESCRIPTION}}':   data.metaDescription    || '',
    '{{META_KEYWORDS}}':      data.metaKeywords        || '',
    '{{BUSINESS_NAME}}':      data.name || (data.logoP1 + ' ' + data.logoP2).trim() || '',
    '{{BUSINESS_TAGLINE}}':   data.businessTagline     || '',
    '{{DISPLAY_FONT}}':       data.displayFont         || 'Syne',
    '{{BODY_FONT}}':          data.bodyFont            || 'DM Sans',
    '{{BG_COLOR}}':           data.bg                  || '#080808',
    '{{SURFACE_COLOR}}':      data.surface             || '#111111',
    '{{SURFACE2_COLOR}}':     data.surface2            || '#1a1a1a',
    '{{ACCENT_COLOR}}':       data.accent              || '#FF4D00',
    '{{ACCENT2_COLOR}}':      data.accent2             || '#FF8C42',
    '{{TEXT_COLOR}}':         data.textColor           || '#FFFFFF',
    '{{MUTED_COLOR}}':        data.mutedColor          || 'rgba(255,255,255,0.5)',
    '{{NAV_SOLID_BG}}':       data.navSolidBg          || 'rgba(5,5,5,0.92)',
    '{{BTN_TEXT_COLOR}}':     data.btnText             || '#FFFFFF',
    '{{LOGO_P1}}':            data.logoP1              || '',
    '{{LOGO_P2}}':            data.logoP2              || '',
    '{{LOGO_IMAGE}}':         logoMarkup,
    '{{NAV_1}}':              data.nav1                || '',
    '{{NAV_2}}':              data.nav2                || '',
    '{{NAV_3}}':              data.nav3                || '',
    '{{NAV_CTA}}':            data.navCta              || 'Contactar',
    '{{WHATSAPP_NUMBER}}':    data.whatsapp            || '0000000000',
    '{{HERO_EYEBROW}}':       data.heroEyebrow         || '',
    '{{HERO_LINE_1}}':        data.heroLine1           || '',
    '{{HERO_LINE_2}}':        data.heroLine2           || '',
    '{{HERO_LINE_3}}':        data.heroLine3           || '',
    '{{HERO_SUBTITLE}}':      data.heroSubtitle        || '',
    '{{CTA_PRIMARY}}':        data.ctaPrimary          || 'Contáctanos',
    '{{CTA_SECONDARY}}':      data.ctaSecondary        || 'Ver más',
    '{{STAT_1_NUM}}':         data.stat1num            || '',
    '{{STAT_1_LBL}}':         data.stat1lbl            || '',
    '{{STAT_2_NUM}}':         data.stat2num            || '',
    '{{STAT_2_LBL}}':         data.stat2lbl            || '',
    '{{STAT_3_NUM}}':         data.stat3num            || '',
    '{{STAT_3_LBL}}':         data.stat3lbl            || '',
    '{{CAROUSEL_TAG}}':       data.carouselTag         || '',
    '{{CAROUSEL_TITLE}}':     data.carouselTitle       || '',
    '{{PRODUCTS_TAG}}':       data.productsTag         || '',
    '{{PRODUCTS_TITLE}}':     data.productsTitle       || '',
    '{{PRODUCTS_SUBTITLE}}':  data.productsSub         || '',
    '{{ABOUT_TAG}}':          data.aboutTag            || '',
    '{{ABOUT_TITLE}}':        data.aboutTitle          || '',
    '{{ABOUT_TEXT}}':         data.aboutText           || '',
    '{{ABOUT_CTA}}':          data.aboutCta            || 'Contáctanos',
    '{{ABOUT_IMAGE_URL}}':    data.aboutImage          || '',
    '{{BUSINESS_INITIALS}}':  data.businessInitials    || 'XX',
    '{{CTA_TITLE}}':          data.ctaTitle            || '',
    '{{CTA_SUBTITLE}}':       data.ctaSubtitle         || '',
    '{{FOOTER_LOGO_P1}}':     data.footerLogoP1        || '',
    '{{FOOTER_LOGO_P2}}':     data.footerLogoP2        || '',
    '{{FOOTER_DESC}}':        data.footerDesc          || '',
  };

  for (const [key, val] of Object.entries(simple)) {
    html = html.replaceAll(key, val);
  }

  if (html.includes('</style>')) {
    html = html.replace('</style>', `${RESPONSIVE_COPY_STYLES}\n  </style>`);
  }

  // Guarantee border-radius:50% on WhatsApp floating button
  html = html.replace(
    /\.wa-float\s*\{([^}]*)\}/,
    (match) => {
      if (!match.includes('border-radius')) {
        return match.replace('{', '{ border-radius:50%;')
      }
      return match
    }
  );

  // Inject --btn-text into :root
  html = html.replace(
    '--ease:    cubic-bezier(0.4, 0, 0.2, 1);',
    `--ease:    cubic-bezier(0.4, 0, 0.2, 1);\n      --btn-text: ${data.btnText || '#fff'};`
  );

  // Adjust nav.solid for light mode in v2-style templates
  if (data.textColor === '#1A1A1A') {
    html = html.replace(
      'background:rgba(5,5,5,0.92);',
      `background:${data.navSolidBg || 'rgba(255,255,255,0.95)'};`
    );
  }

  // Carousel injection
  if (images && images.length > 0) {
    const slidesHtml = images.map((b64, i) =>
      `<div class="c-slide"><img src="${b64}" alt="Foto ${i + 1}"><div class="c-slide-overlay"></div></div>`
    ).join('\n');

    html = html.replace(
      /<div class="carousel-track" id="cTrack">[\s\S]*?<\/div>(\s*<\/div>){1,2}\s*<div class="carousel-controls"/,
      `<div class="carousel-track" id="cTrack">${slidesHtml}\n        </div>\n      </div>\n      <div class="carousel-controls"`
    );

    // About image from first upload
    html = html.replace(
      '<div class="about-deco">{{BUSINESS_INITIALS}}</div>',
      `<img src="${images[0]}" alt="${data.name || ''}" style="width:100%;height:100%;object-fit:cover;">`
    );
  } else if (data.slides?.length) {
    data.slides.forEach((slide: { url?: string; alt?: string }, i: number) => {
      html = html.replaceAll(`{{SLIDE_${i + 1}_URL}}`, slide.url || '');
      html = html.replaceAll(`{{SLIDE_${i + 1}_ALT}}`, slide.alt || '');
    });
  }

  // Cards
  if (data.cards?.length) {
    data.cards.forEach((card: { icon?: string; title?: string; text?: string; price?: string }, i: number) => {
      html = html.replaceAll(`{{CARD_${i + 1}_ICON}}`,  card.icon  || '');
      html = html.replaceAll(`{{CARD_${i + 1}_TITLE}}`, card.title || '');
      html = html.replaceAll(`{{CARD_${i + 1}_TEXT}}`,  card.text  || '');
      html = html.replaceAll(`{{CARD_${i + 1}_PRICE}}`, card.price || '');
    });
  }

  // Testimonials
  if (data.testimonials?.length) {
    data.testimonials.forEach((t: { text?: string; initials?: string; name?: string; role?: string }, i: number) => {
      html = html.replaceAll(`{{TESTI_${i + 1}_TEXT}}`,     t.text     || '');
      html = html.replaceAll(`{{TESTI_${i + 1}_INITIALS}}`, t.initials || '');
      html = html.replaceAll(`{{TESTI_${i + 1}_NAME}}`,     t.name     || '');
      html = html.replaceAll(`{{TESTI_${i + 1}_ROLE}}`,     t.role     || '');
    });
  }

  // Ensure business name is set from businessInfo
  const businessNameFallback = businessInfo.name || '';
  const logoP1Fallback = data.logoP1 || (businessNameFallback.split(' ')[0]) || 'Mi';
  const logoP2Fallback = data.logoP2 || (businessNameFallback.split(' ').slice(1).join(' ')) || 'Negocio';
  
  // Final fallbacks
  html = html.replaceAll('{{LOGO_P1}}', data.logoP1 || logoP1Fallback);
  html = html.replaceAll('{{LOGO_P2}}', data.logoP2 || logoP2Fallback);
  html = html.replaceAll('{{FOOTER_LOGO_P1}}', data.footerLogoP1 || data.logoP1 || '');
  html = html.replaceAll('{{FOOTER_LOGO_P2}}', data.footerLogoP2 || data.logoP2 || '');
  html = html.replaceAll('{{BUSINESS_NAME}}', data.name || businessNameFallback);
  html = html.replaceAll('{{WHATSAPP_NUMBER}}', data.whatsapp || businessInfo.whatsapp || '0000000000');
  html = html.replaceAll('PHONENUMBER', data.whatsapp || businessInfo.whatsapp || '0000000000');

  // Strip ANY remaining placeholders that were not provided by the AI structure or static data
  html = html.replace(/{{[A-Z0-9_]+}}/g, '');

  return html;
}

// ── Color palette mapper ───────────────────────────────────────────
function mapColorsToCSS(colors: string | undefined, style: string | undefined): { bg: string; accent: string; accent2: string } {
  const isDark = style !== 'claro' && style !== 'organico';
  switch (colors) {
    case 'negro_dorado':    return { bg: '#0A0800', accent: '#C9A84C', accent2: '#F5E27A' };
    case 'blanco_amarillo': return { bg: '#FFFDF0', accent: '#F5C400', accent2: '#FFE566' };
    case 'azul_blanco':     return { bg: isDark ? '#050A1A' : '#F0F4FF', accent: '#2563EB', accent2: '#60A5FA' };
    case 'negro_llamativo': return { bg: '#080808', accent: '#FF4D00', accent2: '#FF8C42' };
    default:                return { bg: isDark ? '#080808' : '#FFFDF0', accent: '#FF4D00', accent2: '#FF8C42' };
  }
}

function mapStyleToTemplate(style: string | undefined, colors: string | undefined): string {
  switch (style) {
    case 'neon':     return 'neon';
    case 'organico': return 'organic';
    case 'brutal':   return 'brutal';
    case 'claro':    return colors === 'azul_blanco' ? 'editorial' : 'default';
    case 'oscuro':   return colors === 'negro_dorado' ? 'glass' : 'default';
    default:         return 'glass';
  }
}

type ExtBusinessInfo = BusinessInfo & { style?: string; colors?: string; tone?: string; differentiator?: string; cta?: string };

// ── Generation prompt — rich context from user conversation ──
function buildPrompt(businessInfo: ExtBusinessInfo, hasImages: boolean): string {
  const palette = mapColorsToCSS(businessInfo.colors, businessInfo.style);
  const suggestedTemplate = mapStyleToTemplate(businessInfo.style, businessInfo.colors);
  const nameParts = (businessInfo.name || 'Mi Negocio').split(' ');
  const logoP1 = nameParts[0] || 'Mi';
  const logoP2 = nameParts.slice(1).join(' ') || 'Negocio';
  const productHint = businessInfo.product
    ? `El negocio ofrece: ${businessInfo.product}. Usa nombres REALES de productos/servicios en las cards.`
    : 'Deduce 3 productos o servicios principales basados en la industria.';
  const toneGuide: Record<string, string> = {
    formal:   'Usa lenguaje formal y profesional.',
    amigable: 'Usa lenguaje cercano y amigable.',
    juvenil:  'Usa lenguaje dinámico, moderno y energético.',
    elegante: 'Usa lenguaje sofisticado y exclusivo.',
  };
  const toneInstruction = toneGuide[businessInfo.tone || ''] || 'Usa lenguaje profesional y directo.';

  return `Responde SOLO con JSON válido. No escribas texto antes ni después.

DATOS DEL NEGOCIO:
- Nombre: ${businessInfo.name || 'Sin nombre'}
- Industria: ${businessInfo.industry || 'General'}
- Producto/Servicio: ${businessInfo.product || 'No especificado'}
- Diferenciador clave: ${businessInfo.differentiator || 'No especificado'}
- Tono elegido: ${businessInfo.tone || 'profesional'}
- Colores preferidos: ${businessInfo.colors || 'ia_elige'}
- Estilo visual: ${businessInfo.style || 'oscuro'}
- Tipo de contacto: ${businessInfo.cta || 'whatsapp'}
- WhatsApp: ${businessInfo.whatsapp || '0000000000'}
${hasImages ? '- El usuario subíó fotos reales del negocio para el carrusel.' : ''}

COLORES SUGERIDOS (basados en su elección):
bg="${palette.bg}" accent="${palette.accent}" accent2="${palette.accent2}" templateStyle="${suggestedTemplate}"

INSTRUCCIONES:
1. ${productHint}
2. aboutText: describe el negocio brevemente. ${toneInstruction} Máx 2 oraciones. Menciona diferenciador si existe.
3. Las cards DEBEN tener titles y texts específicos para ESTE negocio (no genéricos).
4. stat1num/stat2num/stat3num: usa números relevantes del negocio (años de experiencia, clientes, etc.) si los mencionó el usuario. Si no, usa valores simbólicos como "5+", "100%", "24h".
5. Usa EXACTAMENTE los colores sugeridos a menos que contradigan claramente el estilo.

JSON completo:
{"bg":"${palette.bg}","accent":"${palette.accent}","accent2":"${palette.accent2}","templateStyle":"${suggestedTemplate}","logoP1":"${logoP1}","logoP2":"${logoP2}","whatsapp":"${businessInfo.whatsapp || '0000000000'}","aboutText":"","cards":[{"icon":"","title":"","text":"","price":""},{"icon":"","title":"","text":"","price":""},{"icon":"","title":"","text":"","price":""}],"stat1num":"","stat1lbl":"","stat2num":"","stat2lbl":"","stat3num":"","stat3lbl":"","testimonials":[{"text":"","initials":"","name":"","role":""},{"text":"","initials":"","name":"","role":""},{"text":"","initials":"","name":"","role":""},{"text":"","initials":"","name":"","role":""}]}`;
}

// ── POST handler ──────────────────────────────────────────
export async function POST(req: Request) {
  try {
    const { messages, images = [], forcedTemplate, logo } = await req.json();

    // 1. Extract business info (one AI call for extraction)
    let businessInfo: BusinessInfo;
    try {
      businessInfo = (await extractBusinessInfo(messages)) as BusinessInfo;
    } catch {
      businessInfo = {};
    }

    // Backup extraction: find business name directly from user messages
    const isOptionMessage = (msg: string): boolean => {
      const lowerMsg = msg.toLowerCase();
      // Check for common option patterns (colors, styles, sections, etc.)
      return (
        lowerMsg.includes('con color') || 
        lowerMsg.includes('llamativo') ||
        lowerMsg.includes('oscuro') ||
        lowerMsg.includes('claro') ||
        lowerMsg.includes('blanco') ||
        lowerMsg.includes('negro') ||
        lowerMsg.includes('amarillo') ||
        lowerMsg.includes('dorado') ||
        lowerMsg.includes('azul') ||
        lowerMsg.includes('fondo') ||
        lowerMsg.includes('estilo') ||
        lowerMsg.includes('opcion') ||
        lowerMsg.includes('celular') ||
        lowerMsg.includes('whatsapp') ||
        lowerMsg.includes('número') ||
        lowerMsg.includes('teléfono') ||
        // Common words that indicate it's not a business name
        lowerMsg.includes('gracias') ||
        lowerMsg.includes('sí') ||
        lowerMsg.includes('si ') ||
        lowerMsg.includes('tengo') && lowerMsg.length < 30 ||
        lowerMsg.includes('tengo un') ||
        lowerMsg.includes('vendo') && !msg.includes(' ')
      );
    };

    const extractNameFromMessages = (): string | null => {
      const userMessages = (messages || [])
        .filter((m: { role?: string }) => m.role === 'user')
        .map((m: { content?: string }) => m.content || '');
      
      // Go through messages in reverse order and find first valid business name
      for (const msg of userMessages.reverse()) {
        const trimmed = msg.trim();
        const words = trimmed.split(/\s+/);
        
        // Skip if too short, too long, or looks like an option
        if (words.length < 2 || words.length > 8) continue;
        if (isOptionMessage(trimmed)) continue;
        
        // Skip if it contains emojis (it's an option)
        const hasEmoji = msg.includes('📷') || msg.includes('🎨') || msg.includes('💻') || 
                        msg.includes('🍽️') || msg.includes('🍗') || msg.includes('🥩') ||
                        msg.includes('🌽') || msg.includes('🐾') || msg.includes('👗') ||
                        msg.includes('👟') || msg.includes('💅') || msg.includes('🎂') ||
                        msg.includes('💪') || msg.includes('🔨') || msg.includes('💊') ||
                        msg.includes('🏢') || msg.includes('✨') || msg.includes('🖤') ||
                        msg.includes('💛') || msg.includes('🥇') || msg.includes('🔵') ||
                        msg.includes('👔') || msg.includes('😊') || msg.includes('🔥') ||
                        msg.includes('🌙') || msg.includes('☀️') || msg.includes('⚡') ||
                        msg.includes('🌿') || msg.includes('💥') || msg.includes('📝') ||
                        msg.includes('📞') || msg.includes('🎯') || msg.includes('📸');
        if (hasEmoji) continue;
        
        // Skip if it matches common option phrases
        const lowerTrim = trimmed.toLowerCase();
        if (lowerTrim.startsWith('fondo') || 
            lowerTrim.startsWith('estilo') ||
            lowerTrim.includes('opciones') ||
            lowerTrim.includes('prefer')) continue;
        
        // This looks like a business name
        return trimmed;
      }
      return null;
    };

    if (!businessInfo.name || businessInfo.name.length < 3) {
      const extractedName = extractNameFromMessages();
      if (extractedName) {
        businessInfo.name = extractedName;
      }
    }

    // Also ensure sector is extracted if missing
    if (!businessInfo.sector && messages) {
      const allContent = (messages as { content?: string }[])
        .map(m => m.content || '')
        .join(' ')
        .toLowerCase();
      
      if (allContent.includes('tecnología') || allContent.includes('reparación')) businessInfo.sector = 'tecnologia';
      else if (allContent.includes('alitas') || allContent.includes('pollo')) businessInfo.sector = 'alitas_pollo';
      else if (allContent.includes('ropa') || allContent.includes('moda')) businessInfo.sector = 'ropa_moda';
      else if (allContent.includes('zapato') || allContent.includes('calzado')) businessInfo.sector = 'zapatos';
      else if (allContent.includes('restaurante')) businessInfo.sector = 'restaurante';
      else if (allContent.includes('belleza') || allContent.includes('spa')) businessInfo.sector = 'belleza_spa';
    }

    // Debug: verify businessInfo fields
    console.log('BusinessInfo received:', JSON.stringify({
      name: businessInfo.name,
      industry: businessInfo.industry,
      product: businessInfo.product,
      sector: (businessInfo as { sector?: string }).sector,
      whatsapp: businessInfo.whatsapp,
    }));

    // 2. Generate JSON data
    let rawText: string;
    try {
      rawText = await callGenerateAI([
        { role: 'system', content: 'IMPORTANTE: Responde SOLO con JSON válido. No escribas texto antes ni después. Solo el objeto JSON.' },
        { role: 'user',   content: buildPrompt(businessInfo, images.length > 0) },
      ]);
    } catch (err: unknown) {
      const error = err as { message?: string };
      console.error('Generate AI error:', error?.message);
      return NextResponse.json(
        { success: false, error: 'Servicio de IA no disponible. Intenta en un momento.', code: 'rate_limit' },
        { status: 503 }
      );
    }

    // 3. Parse JSON (with recovery for truncated responses)
    const cleanRaw = rawText.replace(/```json/gi, '').replace(/```/g, '').trim();
    let parsedData: LandingPageData;
    let parseSuccess = false;
    let clean = cleanRaw;
    
    // Try full parse first
    try {
      parsedData = JSON.parse(clean) as LandingPageData;
      parseSuccess = true;
    } catch {
      // Try recovery: find last complete "}" and try parsing up to there
      const lastValidIndex = clean.lastIndexOf('}');
      if (lastValidIndex > clean.length / 2) {
        clean = clean.substring(0, lastValidIndex + 1);
        console.log('Attempting JSON recovery, truncated length:', clean.length);
        try {
          parsedData = JSON.parse(clean) as LandingPageData;
          parseSuccess = true;
        } catch {
          parsedData = {} as LandingPageData;
        }
      } else {
        parsedData = {} as LandingPageData;
      }
    }
    
    if (!parseSuccess || Object.keys(parsedData).length === 0) {
      console.error('JSON parse error. Raw:', clean.slice(0, 300));
      return NextResponse.json(
        { success: false, error: 'Error de formato. Intenta de nuevo.', code: 'parse_error' },
        { status: 500 }
      );
    }

    // Phase 1: Get sector from businessInfo or detect from messages
    const industry = (businessInfo.industry || '').toLowerCase();
    const product = (businessInfo.product || '').toLowerCase();
    
    // Use sector directly from businessInfo if available
    let sectorId = (businessInfo as { sector?: string }).sector || '';
    
    // If sector not in businessInfo, try to detect from industry/product
    if (!sectorId) {
      if (industry.includes('comida') || industry.includes('alita') || industry.includes('pollo') || product.includes('alita')) sectorId = 'alitas_pollo';
      else if (industry.includes('restaurante') || industry.includes('comida preparada')) sectorId = 'restaurante';
      else if (industry.includes('carnicería') || industry.includes('carnes')) sectorId = 'venta_carnes';
      else if (industry.includes('agrícola') || industry.includes('campo')) sectorId = 'agricola';
      else if (industry.includes('mascota') || industry.includes('veterinaria') || industry.includes('pet')) sectorId = 'mascotas';
      else if (industry.includes('ropa') || industry.includes('moda') || industry.includes('boutique')) sectorId = 'ropa_moda';
      else if (industry.includes('zapato') || industry.includes('calzado') || industry.includes('nike') || industry.includes('tenis')) sectorId = 'zapatos';
      else if (industry.includes('belleza') || industry.includes('spa') || industry.includes('salón')) sectorId = 'belleza_spa';
      else if (industry.includes('tech') || industry.includes('tecnología') || industry.includes('comput') || industry.includes('reparación')) sectorId = 'tecnologia';
      else if (industry.includes('panader') || industry.includes('pastel') || industry.includes('reposter')) sectorId = 'panaderia_pasteleria';
      else if (industry.includes('gimnas') || industry.includes('fitness') || industry.includes('gym')) sectorId = 'gym_fitness';
      else if (industry.includes('ferreter')) sectorId = 'ferreteria';
      else if (industry.includes('farmacia')) sectorId = 'farmacia';
      else sectorId = 'otro';
    }
    
    // Backup: ONLY scan user messages for sector keywords (scanning AI messages causes false positives like 'tecnología')
    const userMessagesContent = (messages || [])
      .filter((m: { role?: string }) => m.role === 'user')
      .map((m: { content?: string }) => m.content || '')
      .join(' ')
      .toLowerCase();
      
    if (!sectorId || sectorId === 'otro') {
      if (userMessagesContent.includes('tecnología') || userMessagesContent.includes('reparación') || userMessagesContent.includes('celular')) sectorId = 'tecnologia';
      else if (userMessagesContent.includes('alitas') || userMessagesContent.includes('pollo')) sectorId = 'alitas_pollo';
      else if (userMessagesContent.includes('ropa') || userMessagesContent.includes('moda') || userMessagesContent.includes('boutique')) sectorId = 'ropa_moda';
      else if (userMessagesContent.includes('zapato') || userMessagesContent.includes('calzado') || userMessagesContent.includes('tenis')) sectorId = 'zapatos';
      else if (userMessagesContent.includes('restaurante') || userMessagesContent.includes('comida')) sectorId = 'restaurante';
      else if (userMessagesContent.includes('belleza') || userMessagesContent.includes('spa') || userMessagesContent.includes('salón')) sectorId = 'belleza_spa';
      else if (userMessagesContent.includes('farmacia') || userMessagesContent.includes('salud') || userMessagesContent.includes('medicamento')) sectorId = 'farmacia';
    }
    
    const sectorHero = getSectorHero(sectorId);

    // Phase 2: Apply sector-based hero copy with user personalization
    const extBusinessInfo = businessInfo as BusinessInfo & { differentiator?: string; cta?: string };
    parsedData.heroLine1 = sectorHero.line1;
    parsedData.heroLine2 = sectorHero.line2;
    parsedData.heroLine3 = sectorHero.line3;
    // Use user's differentiator as hero subtitle when meaningful (>10 chars)
    parsedData.heroSubtitle = (extBusinessInfo.differentiator && extBusinessInfo.differentiator.length > 10)
      ? extBusinessInfo.differentiator
      : sectorHero.subtitle;
    // Map CTA to contact preference
    const ctaLabelMap: Record<string, string> = {
      whatsapp:          'Escríbenos al WhatsApp',
      formulario:        'Contáctanos',
      telefono:          'Llámanos ahora',
      whatsapp_telefono: 'Contáctanos ahora',
    };
    parsedData.ctaPrimary  = ctaLabelMap[extBusinessInfo.cta || ''] || sectorHero.ctaPrimary;
    parsedData.productsTag   = sectorHero.productsTag;
    parsedData.productsTitle = sectorHero.productsTitle;
    parsedData.aboutTag      = sectorHero.aboutTag;

    // Phase 3: Fill other defaults and force User's Name
    const isEmpty = (val: string | undefined) => !val || 
      (typeof val === 'string' && (val.includes('{{') || val === 'undefined' || val === 'null' || val.trim() === ''));

    // If we have a genuine business name, force it on top of AI's hallucinations
    if (businessInfo.name && businessInfo.name.length > 2 && businessInfo.name.toLowerCase() !== 'sin nombre') {
      const parts = businessInfo.name.split(' ');
      parsedData.logoP1 = parts[0];
      parsedData.logoP2 = parts.slice(1).join(' ');
      parsedData.name = businessInfo.name;
    } else {
      if (isEmpty(parsedData.logoP1)) parsedData.logoP1 = 'Mi';
      if (isEmpty(parsedData.logoP2)) parsedData.logoP2 = 'Negocio';
      if (isEmpty(parsedData.name)) parsedData.name = 'Mi Negocio';
    }
    
    if (isEmpty(parsedData.whatsapp)) parsedData.whatsapp = businessInfo.whatsapp || '0000000000';

    parsedData = tightenCopy(parsedData);
    if (typeof logo === 'string' && logo.trim().length > 0) {
      parsedData.logoImage = logo;
    }
    parsedData.logoAlt = parsedData.logoAlt || businessInfo.name || parsedData.name || 'Logo';

    // 4. Post-process: enforce color rules & defaults
    parsedData = postProcess(parsedData, businessInfo);

    // 5. Select template — user choice overrides AI choice
    const styleToUse  = (forcedTemplate && TEMPLATE_CACHE[forcedTemplate])
      ? forcedTemplate
      : (parsedData.templateStyle && TEMPLATE_CACHE[parsedData.templateStyle])
      ? parsedData.templateStyle
      : 'default';
    const template = TEMPLATE_CACHE[styleToUse];

    if (!template) {
      console.error('Template not found:', styleToUse);
      return NextResponse.json(
        { success: false, error: 'Template no disponible.', code: 'template_error' },
        { status: 500 }
      );
    }

    // 6. Fill and return
    const html = fillTemplate(template, parsedData, businessInfo, images);
    return NextResponse.json({ html: html.trim(), success: true, templateUsed: styleToUse });

  } catch (err: unknown) {
    const error = err as { message?: string };
    console.error('Generate API error:', error?.message);
    return NextResponse.json(
      { success: false, error: 'Error inesperado. Por favor intenta de nuevo.', code: 'parse_error' },
      { status: 500 }
    );
  }
}
