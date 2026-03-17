import { NextResponse } from 'next/server';
import { readFileSync } from 'fs';
import { join } from 'path';
import { callGenerateAI } from '@/lib/ai-client';
import { extractBusinessInfo } from '@/lib/prompts';

interface LandingPageData {
  metaDescription?: string;
  metaKeywords?: string;
  name?: string;
  logoP1?: string;
  logoP2?: string;
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
  moda:        '#080808', ropa:    '#080808',
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
function fillTemplate(template: string, data: LandingPageData, images: string[] = []): string {
  let html = template;

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

  return html;
}

// ── Generation prompt (compact, ~550 tokens) ─────────────
function buildPrompt(businessInfo: BusinessInfo, hasImages: boolean): string {
  return `Eres un experto en diseño web. Genera SOLO JSON válido para una landing page.

NEGOCIO:
- Nombre: ${businessInfo.name || 'Sin nombre'}
- Industria: ${businessInfo.industry || 'General'}
- Producto: ${businessInfo.product || ''}
- Audiencia: ${businessInfo.audience || ''}
- Diferenciador: ${businessInfo.differentiator || ''}
- Fondo pedido: ${businessInfo.bgColor || 'no especificado'}
- Acento pedido: ${businessInfo.accentColor || 'no especificado'}
- Colores: ${businessInfo.colors || 'según industria'}
- WhatsApp: ${businessInfo.whatsapp || '0000000000'}
- Tono: ${businessInfo.tone || 'profesional'}
${hasImages ? '- El cliente subió fotos propias para el carrusel.' : '- Sin imágenes: usar Unsplash como respaldo.'}

COLORES — PRIORIDAD MÁXIMA:
Si "Fondo pedido" es claro (blanco/crema/amarillo claro) → MODO CLARO: bg claro, textColor:#1A1A1A, mutedColor:rgba(0,0,0,0.5), navSolidBg:rgba(255,255,255,0.95)
Si no → MODO OSCURO (default): bg muy oscuro, textColor:#FFFFFF, mutedColor:rgba(255,255,255,0.5), navSolidBg:rgba(5,5,5,0.92)
IMPORTANTE: "Acento pedido" es para botones/destaques, NO cambia el modo del fondo.

PALETAS OSCURAS:
comida:#0A0800 moda:#080808 tech:#050510 salud:#06100A fitness:#060606 restaurante:#0A0700

PALETAS CLARAS:
blanco+amarillo: bg:#FFFDF0 surface:#FFFFFF accent:#F5C400
blanco puro:     bg:#FFFFFF surface:#F8F8F8 accent:#222222
crema+naranja:   bg:#FFF8F0 surface:#FFFFFF accent:#FF6B00

TEMPLATE (campo "templateStyle"):
glass→tech/apps/foto | brutal→moda urbana/música/tattoo | editorial→abogados/coaches/finanzas
neon→gaming/crypto/clubs | organic→spa/comida natural/flores | default→delivery/zapatos/tiendas

IMÁGENES Unsplash: "https://images.unsplash.com/photo-{ID}?w=800&q=80" — NUNCA source.unsplash.com

HERO TEXT — MUY IMPORTANTE:
El hero usa tipografía gigante (clamp 52px–110px). Textos largos se deforman y ocupan toda la pantalla.
REGLAS ESTRICTAS para heroLine1/2/3:
- heroLine1: máx 4 palabras. Ejemplo: "Pan Fresco" / "Tu Tienda Online" / "Diseño Que Impacta"
- heroLine2: máx 3 palabras. Ejemplo: "Hecho con Amor" / "Para Ti" / "Sin Límites"
- heroLine3: máx 4 palabras. Sólo slogan corto o vacío "". Ejemplo: "Calidad Garantizada" / ""
- heroSubtitle: SÍ puede ser frase completa (font pequeño). Ej: "Encuentra el par perfecto para cada ocasión."
- heroEyebrow: máx 4 palabras en mayúsculas. Ej: "// Bienvenido a Geenra"
❌ PROHIBIDO en heroLine1/2/3: frases de más de 4 palabras, oraciones completas, proposiciones largas.
✅ CORRECTO: palabras de impacto, sustantivos, verbos solos, adjetivos directos.

JSON REQUERIDO (responde SOLO esto, sin markdown):
{"bg":"#...","surface":"#...","surface2":"#...","accent":"#...","accent2":"#...","templateStyle":"default","textColor":"#FFFFFF","mutedColor":"rgba(255,255,255,0.5)","navSolidBg":"rgba(5,5,5,0.92)","btnText":"#fff","displayFont":"Syne","bodyFont":"DM Sans","logoP1":"","logoP2":"","nav1":"","nav2":"","nav3":"","navCta":"","heroEyebrow":"","heroLine1":"","heroLine2":"","heroLine3":"","heroSubtitle":"","ctaPrimary":"","ctaSecondary":"","stat1num":"","stat1lbl":"","stat2num":"","stat2lbl":"","stat3num":"","stat3lbl":"","carouselTag":"","carouselTitle":"","slides":[{"url":"","alt":""},{"url":"","alt":""},{"url":"","alt":""},{"url":"","alt":""},{"url":"","alt":""}],"productsTag":"","productsTitle":"","productsSub":"","cards":[{"icon":"🔥","title":"","text":"","price":""},{"icon":"⭐","title":"","text":"","price":""},{"icon":"💎","title":"","text":"","price":""}],"aboutTag":"","aboutTitle":"","aboutText":"","aboutCta":"","aboutImage":"","businessInitials":"XX","testimonials":[{"stars":"★★★★★","text":"","initials":"XX","name":"","role":""},{"stars":"★★★★★","text":"","initials":"XX","name":"","role":""},{"stars":"★★★★★","text":"","initials":"XX","name":"","role":""},{"stars":"★★★★☆","text":"","initials":"XX","name":"","role":""}],"ctaTitle":"","ctaSubtitle":"","footerLogoP1":"","footerLogoP2":"","footerDesc":"","metaDescription":"","metaKeywords":"","businessTagline":""}`;
}

// ── POST handler ──────────────────────────────────────────
export async function POST(req: Request) {
  try {
    const { messages, images = [], forcedTemplate } = await req.json();

    // 1. Extract business info (one AI call for extraction)
    let businessInfo: BusinessInfo;
    try {
      businessInfo = (await extractBusinessInfo(messages)) as BusinessInfo;
    } catch {
      businessInfo = {};
    }

    // 2. Generate JSON data
    let rawText: string;
    try {
      rawText = await callGenerateAI([
        { role: 'system', content: 'Eres un generador JSON para landing pages. Solo JSON puro, sin markdown.' },
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

    // 3. Parse JSON
    const clean = rawText.replace(/```json/gi, '').replace(/```/g, '').trim();
    let parsedData: LandingPageData;
    try {
      parsedData = JSON.parse(clean) as LandingPageData;
    } catch {
      console.error('JSON parse error. Raw:', clean.slice(0, 200));
      return NextResponse.json(
        { success: false, error: 'Error interno de formato. Intenta de nuevo.', code: 'parse_error' },
        { status: 500 }
      );
    }

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
    const html = fillTemplate(template, parsedData, images);
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
