import pptxgen from 'pptxgenjs';
import html2canvas from 'html2canvas';
import { PresentationDoc, SlideData, ChartConfig } from '../types/presentation';
import { BUILTIN_CHART_PRESETS, initSlideCharts } from './chartHelper';
import { scopePresentationCss } from './styleInjector';

export interface ParsedColor {
  hex: string;
  alpha: number; // 0 to 1
  isTransparent: boolean;
  transparencyPct: number; // 0 to 100 for pptxgenjs
}

/**
 * Accurately parses any CSS color (hex, rgb, rgba with alpha, named, css variable, gradient)
 * into clean 6-char hex and transparency information.
 */
export function parseCssColor(colorStr: string | null | undefined, defaultColor = '0F172A'): ParsedColor {
  if (!colorStr) {
    return { hex: defaultColor, alpha: 1, isTransparent: false, transparencyPct: 0 };
  }
  let c = colorStr.trim();

  // Transparent keywords
  if (c === 'transparent' || c === 'rgba(0, 0, 0, 0)' || c === 'rgba(0,0,0,0)' || c === 'none') {
    return { hex: defaultColor, alpha: 0, isTransparent: true, transparencyPct: 100 };
  }

  // Linear gradient handling: extract primary color stop
  if (c.includes('gradient')) {
    const hexMatch = c.match(/#[0-9a-fA-F]{3,8}/);
    if (hexMatch) {
      c = hexMatch[0];
    } else {
      const rgbMatch = c.match(/rgba?\([^)]+\)/);
      if (rgbMatch) {
        c = rgbMatch[0];
      }
    }
  }

  // CSS variables handling
  if (c.includes('var(')) {
    if (c.includes('--cb-blue-navy')) return { hex: '00174F', alpha: 1, isTransparent: false, transparencyPct: 0 };
    if (c.includes('--cb-blue-primary') || c.includes('blue')) return { hex: '0033C6', alpha: 1, isTransparent: false, transparencyPct: 0 };
    if (c.includes('--cb-blue-dark')) return { hex: '002280', alpha: 1, isTransparent: false, transparencyPct: 0 };
    if (c.includes('--cb-light-blue')) return { hex: 'EEF3FF', alpha: 1, isTransparent: false, transparencyPct: 0 };
    if (c.includes('--cb-blue-border')) return { hex: 'C7D7FE', alpha: 1, isTransparent: false, transparencyPct: 0 };
    if (c.includes('--cb-red-primary') || c.includes('danger')) return { hex: 'E71A3B', alpha: 1, isTransparent: false, transparencyPct: 0 };
    if (c.includes('--cb-red-dark')) return { hex: 'C51330', alpha: 1, isTransparent: false, transparencyPct: 0 };
    if (c.includes('--cb-success') || c.includes('success')) return { hex: '059669', alpha: 1, isTransparent: false, transparencyPct: 0 };
    if (c.includes('--cb-warning') || c.includes('warning')) return { hex: 'D97706', alpha: 1, isTransparent: false, transparencyPct: 0 };
    if (c.includes('--cb-gray-900')) return { hex: '0F172A', alpha: 1, isTransparent: false, transparencyPct: 0 };
    if (c.includes('--cb-gray-700')) return { hex: '334155', alpha: 1, isTransparent: false, transparencyPct: 0 };
    if (c.includes('--cb-gray-600')) return { hex: '475569', alpha: 1, isTransparent: false, transparencyPct: 0 };
    if (c.includes('--cb-gray-500')) return { hex: '64748B', alpha: 1, isTransparent: false, transparencyPct: 0 };
    if (c.includes('--cb-gray-200')) return { hex: 'E2E8F0', alpha: 1, isTransparent: false, transparencyPct: 0 };
    if (c.includes('--cb-gray-100')) return { hex: 'F1F5F9', alpha: 1, isTransparent: false, transparencyPct: 0 };
    if (c.includes('--cb-gray-50')) return { hex: 'F8FAFC', alpha: 1, isTransparent: false, transparencyPct: 0 };
    if (c.includes('--cb-white')) return { hex: 'FFFFFF', alpha: 1, isTransparent: false, transparencyPct: 0 };
    // Convergência tokens
    if (c.includes('--cv-color-accent')) return { hex: '6367C9', alpha: 1, isTransparent: false, transparencyPct: 0 };
    if (c.includes('--cv-color-surface')) return { hex: 'FFFFFF', alpha: 1, isTransparent: false, transparencyPct: 0 };
    if (c.includes('--cv-color-background')) return { hex: 'F8FAFC', alpha: 1, isTransparent: false, transparencyPct: 0 };
    if (c.includes('--cv-color-text')) return { hex: '0F172A', alpha: 1, isTransparent: false, transparencyPct: 0 };
    if (c.includes('--cv-color-border')) return { hex: 'E2E8F0', alpha: 1, isTransparent: false, transparencyPct: 0 };
    return { hex: defaultColor, alpha: 1, isTransparent: false, transparencyPct: 0 };
  }

  // Hex format (#RGB, #RRGGBB, #RRGGBBAA)
  if (c.startsWith('#')) {
    let raw = c.substring(1);
    if (raw.length === 3) {
      raw = raw[0] + raw[0] + raw[1] + raw[1] + raw[2] + raw[2];
    } else if (raw.length === 8) {
      const alphaHex = raw.substring(6, 8);
      const alphaVal = parseInt(alphaHex, 16) / 255;
      return {
        hex: raw.substring(0, 6).toUpperCase(),
        alpha: alphaVal,
        isTransparent: alphaVal < 0.05,
        transparencyPct: Math.round((1 - alphaVal) * 100),
      };
    }
    return { hex: raw.toUpperCase().substring(0, 6), alpha: 1, isTransparent: false, transparencyPct: 0 };
  }

  // RGB / RGBA format
  if (c.startsWith('rgb')) {
    const match = c.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)(?:\s*,\s*([\d.]+))?\s*\)/);
    if (match) {
      const r = parseInt(match[1], 10).toString(16).padStart(2, '0');
      const g = parseInt(match[2], 10).toString(16).padStart(2, '0');
      const b = parseInt(match[3], 10).toString(16).padStart(2, '0');
      const a = match[4] !== undefined ? parseFloat(match[4]) : 1;
      return {
        hex: (r + g + b).toUpperCase(),
        alpha: a,
        isTransparent: a < 0.05,
        transparencyPct: Math.round((1 - a) * 100),
      };
    }
  }

  // Named colors
  const named: Record<string, string> = {
    white: 'FFFFFF',
    black: '000000',
    red: 'EF4444',
    blue: '0033C6',
    green: '10B981',
    yellow: 'F59E0B',
    amber: 'D97706',
    slate: '334155',
    gray: '64748B',
    indigo: '4F46E5',
    navy: '00174F',
    emerald: '059669',
  };
  const lower = c.toLowerCase();
  if (named[lower]) {
    return { hex: named[lower], alpha: 1, isTransparent: false, transparencyPct: 0 };
  }

  return { hex: defaultColor, alpha: 1, isTransparent: false, transparencyPct: 0 };
}

/**
 * Normalizes any CSS color string into a clean 6-character hex string without '#' required by pptxgenjs.
 */
export function toPptxHex(colorStr: string | null | undefined, defaultColor = '0F172A'): string {
  const parsed = parseCssColor(colorStr, defaultColor);
  return parsed.isTransparent ? defaultColor : parsed.hex;
}

/**
 * Cleans text: trims, unescapes entities, and strips excess whitespace.
 */
function cleanText(text: string | null | undefined): string {
  if (!text) return '';
  return text
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Renders a slide into an offscreen 16:9 staging container (960x540 px)
 * at 2x scale (1920x1080 px, Retina quality) using html2canvas.
 * This guarantees 100% visual fidelity: exact fonts, Chart.js charts, tables,
 * cards, gradients, borders, shadows, badges, and spatial layouts.
 */
export async function renderSlideToHighResImage(
  slide: SlideData,
  presentation: PresentationDoc
): Promise<string> {
  const staging = document.createElement('div');
  const uniqueId = `pptx-staging-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
  staging.id = uniqueId;
  // Position offscreen in viewport-safe coordinates to prevent html2canvas coordinate clipping
  staging.style.cssText = `
    position: fixed;
    left: 0;
    top: 0;
    width: 960px;
    height: 540px;
    min-width: 960px;
    min-height: 540px;
    max-width: 960px;
    max-height: 540px;
    overflow: hidden;
    z-index: -9999;
    opacity: 0.001;
    pointer-events: none;
    font-family: 'Inter', 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif;
    background-color: #FFFFFF;
    box-sizing: border-box;
  `;
  staging.className = 'slidestudio-scope slidestudio-virtual-stage';

  // Inject presentation styles, fonts, and scoped CSS
  const styleEl = document.createElement('style');
  styleEl.textContent = scopePresentationCss(
    (presentation.headHtml || '') + '\n' + (presentation.globalStyles || '')
  );
  staging.appendChild(styleEl);

  // Build the presentation container structure matching the live canvas
  const container = document.createElement('div');
  container.className = `presentation-container ${presentation.containerClass || ''} w-full h-full flex flex-col overflow-hidden`;
  container.style.cssText = `
    width: 960px !important;
    height: 540px !important;
    max-width: 960px !important;
    max-height: 540px !important;
    display: flex !important;
    flex-direction: column !important;
    overflow: hidden !important;
    box-sizing: border-box !important;
    ${presentation.containerStyle || ''}
  `;

  // 1. Corporate Header Bar (if present)
  if (presentation.headerHtml) {
    const headerWrapper = document.createElement('div');
    headerWrapper.className = 'slidestudio-corporate-header shrink-0 select-none w-full max-w-full';
    headerWrapper.innerHTML = presentation.headerHtml;
    container.appendChild(headerWrapper);
  }

  // 2. Viewport & Active Slide
  const viewport = document.createElement('main');
  viewport.className = `slidestudio-viewport flex-1 overflow-hidden relative flex flex-col w-full max-w-full ${
    presentation.viewportClass || 'slide-viewport'
  }`;
  viewport.style.cssText = `
    flex: 1 1 0% !important;
    width: 100% !important;
    height: 100% !important;
    display: flex !important;
    flex-direction: column !important;
    overflow: hidden !important;
    box-sizing: border-box !important;
    ${presentation.viewportStyle || ''}
  `;

  const slideWrapper = document.createElement('div');
  slideWrapper.id = slide.id;
  slideWrapper.className = `slide active flex flex-col w-full h-full ${slide.className || ''}`;
  slideWrapper.style.cssText = `
    display: flex !important;
    visibility: visible !important;
    width: 100% !important;
    height: 100% !important;
    flex-direction: column !important;
    box-sizing: border-box !important;
    ${slide.style || ''}
  `;
  slideWrapper.innerHTML = slide.htmlContent;

  viewport.appendChild(slideWrapper);
  container.appendChild(viewport);

  // 3. Corporate Footer Bar (if present)
  if (presentation.footerHtml) {
    const footerWrapper = document.createElement('div');
    footerWrapper.className = 'slidestudio-corporate-footer shrink-0 select-none w-full max-w-full';
    footerWrapper.innerHTML = presentation.footerHtml;
    // Strip web player navigation controls that should not be visible in presentation slides
    footerWrapper.querySelectorAll(
      '.footer-controls, .nav-controls, .btn-nav, button[onclick*="changeSlide"], button[onclick*="toggleFullScreen"], #btn-prev, #btn-next, #btn-fullscreen, .slide-counter, .progress-bar'
    ).forEach((el) => el.remove());
    container.appendChild(footerWrapper);
  }

  staging.appendChild(container);

  // Ensure images allow cross-origin rendering where possible
  staging.querySelectorAll('img').forEach((img) => {
    if (!img.src.startsWith('data:')) {
      img.crossOrigin = 'anonymous';
    }
  });

  document.body.appendChild(staging);

  // Initialize all Chart.js graphs inside the staging container
  const cleanupCharts = initSlideCharts(staging);

  // Wait for fonts and charts to settle
  await new Promise((resolve) => setTimeout(resolve, 160));

  try {
    const canvas = await html2canvas(staging, {
      scale: 2, // 1920x1080 resolution (Retina high-definition)
      useCORS: true,
      allowTaint: false, // Critical: must be false so canvas.toDataURL() never throws SecurityError
      logging: false,
      backgroundColor: '#FFFFFF',
      windowWidth: 960,
      windowHeight: 540,
      imageTimeout: 6000,
    });

    try {
      return canvas.toDataURL('image/png', 0.95);
    } catch (toDataErr) {
      console.warn('Canvas PNG export threw error, trying JPEG fallback:', toDataErr);
      return canvas.toDataURL('image/jpeg', 0.9);
    }
  } finally {
    try {
      cleanupCharts();
    } catch (_) {}
    staging.remove();
  }
}

/**
 * Builds a PowerPoint slide in High-Fidelity mode (1920x1080 crisp render)
 * preserving 100% of the visual styling, charts, layouts, shadows, badges, and fonts.
 * Seamlessly falls back to vector shapes if browser canvas rasterization fails.
 */
async function buildSlideHighFidelity(
  pres: pptxgen,
  slideData: SlideData,
  presentation: PresentationDoc,
  slideIndex: number,
  totalSlides: number
) {
  try {
    const pptSlide = pres.addSlide();

    // Standard 16:9 PowerPoint Dimensions
    const SLIDE_W = 10.0;
    const SLIDE_H = 5.625;

    // Detect dark or light theme for background
    const isDark =
      slideData.htmlContent.includes('bg-slate-900') ||
      slideData.htmlContent.includes('bg-slate-950') ||
      slideData.htmlContent.includes('bg-black') ||
      slideData.htmlContent.includes('#0F172A') ||
      slideData.className?.includes('dark');

    pptSlide.background = { color: isDark ? '0F172A' : 'FFFFFF' };

    // Generate crisp 1920x1080 capture
    const imgDataUrl = await renderSlideToHighResImage(slideData, presentation);

    if (imgDataUrl && imgDataUrl.startsWith('data:image/')) {
      // Add the high-resolution visual slide image filling the entire 16:9 widescreen canvas
      pptSlide.addImage({
        data: imgDataUrl,
        x: 0,
        y: 0,
        w: SLIDE_W,
        h: SLIDE_H,
      });

      // Extract clean slide title for PowerPoint native outline & accessibility
      const parser = new DOMParser();
      const doc = parser.parseFromString(slideData.htmlContent, 'text/html');
      const titleEl = doc.querySelector('.cover-title, .slide-title, h1, h2, h3');
      const slideTitle = cleanText(titleEl?.textContent) || slideData.title || `Slide ${slideIndex + 1}`;

      // Add invisible native title box so PowerPoint slide outline and search recognize the slide title
      pptSlide.addText(slideTitle, {
        x: 0.6,
        y: 0.2,
        w: 8.8,
        h: 0.4,
        fontFace: 'Arial',
        fontSize: 16,
        bold: true,
        color: 'FFFFFF',
        transparency: 100,
      });

      // Speaker notes
      if (slideData.notes) {
        try {
          (pptSlide as any).addNotes?.(slideData.notes);
        } catch (_) {}
      }
    } else {
      throw new Error('Falha ao gerar captura de imagem do slide');
    }
  } catch (err) {
    console.warn(`Alta fidelidade falhou para slide ${slideIndex + 1}, aplicando fallback vetorial:`, err);
    await buildSlideVector(pres, slideData, presentation, slideIndex, totalSlides);
  }
}

/**
 * Helper: Maps CSS font family string to standard cross-platform PowerPoint fonts
 */
function mapFontFamily(cssFontFamily: string | null | undefined): string {
  if (!cssFontFamily) return 'Arial';
  const f = cssFontFamily.toLowerCase();
  if (f.includes('plus jakarta sans')) return 'Plus Jakarta Sans';
  if (f.includes('inter')) return 'Inter';
  if (f.includes('trebuchet')) return 'Trebuchet MS';
  if (f.includes('calibri')) return 'Calibri';
  if (f.includes('segoe ui')) return 'Segoe UI';
  if (f.includes('roboto')) return 'Roboto';
  if (f.includes('helvetica')) return 'Arial';
  return 'Arial';
}

/**
 * Helper: extracts rich formatted text runs from a DOM text element.
 * If the element contains formatted children (strong, b, em, i, span, a),
 * returns an array of pptxgenjs TextItem objects preserving formatting within one unified text box.
 */
function extractElementTextRuns(
  el: Element,
  baseStyle: CSSStyleDeclaration,
  isDark: boolean
): Array<{ text: string; options: any }> {
  const runs: Array<{ text: string; options: any }> = [];

  const walk = (node: Node, parentIsBold = false, parentIsItalic = false, parentColor?: string) => {
    if (node.nodeType === Node.TEXT_NODE) {
      const raw = node.textContent || '';
      // Normalize internal whitespace but keep single spaces on boundaries
      const txt = raw
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/[ \t\r\n]+/g, ' ');

      if (txt && txt.length > 0) {
        runs.push({
          text: txt,
          options: {
            bold: parentIsBold,
            italic: parentIsItalic,
            color: parentColor || toPptxHex(baseStyle.color, isDark ? 'FFFFFF' : '0F172A'),
          },
        });
      }
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      const childEl = node as HTMLElement;
      const tag = childEl.tagName.toUpperCase();
      const childStyle = window.getComputedStyle(childEl);
      const isBold = parentIsBold || tag === 'STRONG' || tag === 'B' || parseInt(childStyle.fontWeight, 10) >= 600;
      const isItalic = parentIsItalic || tag === 'EM' || tag === 'I' || childStyle.fontStyle === 'italic';
      const childColor = childStyle.color && childStyle.color !== baseStyle.color ? toPptxHex(childStyle.color) : parentColor;

      for (let i = 0; i < childEl.childNodes.length; i++) {
        walk(childEl.childNodes[i], isBold, isItalic, childColor);
      }
    }
  };

  const hasFormattingChildren = Boolean(el.querySelector('strong, b, em, i, span, a, font, u'));
  if (hasFormattingChildren) {
    const isBaseBold = parseInt(baseStyle.fontWeight, 10) >= 600;
    const isBaseItalic = baseStyle.fontStyle === 'italic';
    const baseColor = toPptxHex(baseStyle.color, isDark ? 'FFFFFF' : '0F172A');
    for (let i = 0; i < el.childNodes.length; i++) {
      walk(el.childNodes[i], isBaseBold, isBaseItalic, baseColor);
    }
  }

  if (runs.length === 0) {
    const text = cleanText(el.textContent);
    if (text) {
      runs.push({
        text,
        options: {
          bold: parseInt(baseStyle.fontWeight, 10) >= 600,
          italic: baseStyle.fontStyle === 'italic',
          color: toPptxHex(baseStyle.color, isDark ? 'FFFFFF' : '0F172A'),
        },
      });
    }
  } else {
    // Only trim the very start of the first run and the very end of the last run
    if (runs[0]?.text) runs[0].text = runs[0].text.trimStart();
    if (runs[runs.length - 1]?.text) runs[runs.length - 1].text = runs[runs.length - 1].text.trimEnd();
  }

  return runs.filter(r => r.text.length > 0);
}

/**
 * Builds a PowerPoint slide with 100% editable visual layers:
 * - Native editable shapes (cards, KPI containers, badges, pills, divider lines)
 * - Native editable text boxes with rich formatting runs, exact fonts and colors
 * - Native editable tables with headers and row styling
 * - Positioned charts and images
 * - Slide speaker notes
 */
export async function buildSlideNativeFromDom(
  pres: pptxgen,
  slideData: SlideData,
  presentation: PresentationDoc,
  slideIndex: number,
  totalSlides: number
): Promise<void> {
  const pptSlide = pres.addSlide();

  // Standard 16:9 PowerPoint Dimensions
  const SLIDE_W = 10.0; // 10.0 inches width
  const SLIDE_H = 5.625; // 5.625 inches height
  const STAGE_W = 960;
  const STAGE_H = 540;
  const scaleX = SLIDE_W / STAGE_W; // ~0.010416667 in/px
  const scaleY = SLIDE_H / STAGE_H; // ~0.010416667 in/px

  // 1. Create Staging Environment
  const staging = document.createElement('div');
  const uniqueId = `pptx-dom-stage-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
  staging.id = uniqueId;
  staging.style.cssText = `
    position: fixed;
    left: 0;
    top: 0;
    width: ${STAGE_W}px;
    height: ${STAGE_H}px;
    min-width: ${STAGE_W}px;
    min-height: ${STAGE_H}px;
    max-width: ${STAGE_W}px;
    max-height: ${STAGE_H}px;
    overflow: hidden;
    z-index: -9999;
    opacity: 0.001;
    pointer-events: none;
    font-family: 'Inter', 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif;
    box-sizing: border-box;
  `;
  staging.className = 'slidestudio-scope slidestudio-virtual-stage';

  // Inject presentation styles, fonts, and scoped CSS + desktop widescreen overrides
  const styleEl = document.createElement('style');
  styleEl.textContent = scopePresentationCss(
    (presentation.headHtml || '') + '\n' + (presentation.globalStyles || '')
  ) + `
    /* Enforce desktop widescreen 16:9 presentation layout for PowerPoint export */
    .slidestudio-virtual-stage .split-view {
      display: grid !important;
      grid-template-columns: 1.28fr 1fr !important;
      gap: 16px !important;
      height: 100% !important;
    }
    .slidestudio-virtual-stage .split-view-equal {
      display: grid !important;
      grid-template-columns: 1fr 1fr !important;
      gap: 16px !important;
      height: 100% !important;
    }
    .slidestudio-virtual-stage .matrix-grid {
      display: grid !important;
      grid-template-columns: 1fr 1fr !important;
      grid-template-rows: 1fr 1fr !important;
      gap: 10px !important;
      height: 100% !important;
    }
    .slidestudio-virtual-stage .journey-grid {
      display: grid !important;
      grid-template-columns: repeat(6, 1fr) !important;
      gap: 8px !important;
    }
    .slidestudio-virtual-stage .cluster-grid {
      display: grid !important;
      grid-template-columns: repeat(2, 1fr) !important;
      grid-template-rows: repeat(2, 1fr) !important;
      gap: 12px !important;
    }
    .slidestudio-virtual-stage .kpi-row-6 {
      display: grid !important;
      grid-template-columns: repeat(6, 1fr) !important;
      gap: 10px !important;
    }
    .slidestudio-virtual-stage .kpi-row {
      display: grid !important;
      grid-template-columns: repeat(4, 1fr) !important;
      gap: 12px !important;
    }
    .slidestudio-virtual-stage .cover-grid {
      display: grid !important;
      grid-template-columns: repeat(4, 1fr) !important;
      gap: 14px !important;
    }
    .slidestudio-virtual-stage .table-container {
      max-height: none !important;
      overflow: visible !important;
      width: 100% !important;
    }
    .slidestudio-virtual-stage .analise-table {
      min-width: 0 !important;
      width: 100% !important;
    }
    .slidestudio-virtual-stage .slide {
      padding: 16px 28px !important;
      height: 100% !important;
      display: flex !important;
      flex-direction: column !important;
      justify-content: space-between !important;
      overflow: hidden !important;
    }
    .slidestudio-virtual-stage .slide-cover {
      height: 100% !important;
      width: 100% !important;
      display: flex !important;
      flex-direction: column !important;
      justify-content: space-between !important;
      align-items: center !important;
      padding: 24px 32px !important;
      box-sizing: border-box !important;
    }
  `;
  staging.appendChild(styleEl);

  // Build the complete presentation structure matching the live canvas
  const container = document.createElement('div');
  container.className = `presentation-container ${presentation.containerClass || ''} w-full h-full flex flex-col overflow-hidden`;
  container.style.cssText = `
    width: ${STAGE_W}px !important;
    height: ${STAGE_H}px !important;
    max-width: ${STAGE_W}px !important;
    max-height: ${STAGE_H}px !important;
    display: flex !important;
    flex-direction: column !important;
    overflow: hidden !important;
    box-sizing: border-box !important;
    ${presentation.containerStyle || ''}
  `;

  // 1. Corporate Header Bar (if present)
  if (presentation.headerHtml) {
    const headerWrapper = document.createElement('div');
    headerWrapper.className = 'slidestudio-corporate-header shrink-0 select-none w-full max-w-full';
    headerWrapper.innerHTML = presentation.headerHtml;
    container.appendChild(headerWrapper);
  }

  // 2. Viewport & Active Slide
  const viewport = document.createElement('main');
  viewport.className = `slidestudio-viewport flex-1 overflow-hidden relative flex flex-col w-full max-w-full ${
    presentation.viewportClass || 'slide-viewport'
  }`;
  viewport.style.cssText = `
    flex: 1 1 0% !important;
    width: 100% !important;
    height: 100% !important;
    display: flex !important;
    flex-direction: column !important;
    box-sizing: border-box !important;
    ${presentation.viewportStyle || ''}
  `;

  const slideWrapper = document.createElement('div');
  slideWrapper.id = slideData.id;
  slideWrapper.className = `slide active flex flex-col w-full h-full ${slideData.className || ''}`;
  slideWrapper.style.cssText = `
    display: flex !important;
    visibility: visible !important;
    width: 100% !important;
    height: 100% !important;
    flex: 1 1 0% !important;
    flex-direction: column !important;
    box-sizing: border-box !important;
    ${slideData.style || ''}
  `;
  slideWrapper.innerHTML = slideData.htmlContent;
  viewport.appendChild(slideWrapper);
  container.appendChild(viewport);

  // 3. Corporate Footer Bar (if present and NOT web player navigation chrome)
  const isWebPlayerFooter = Boolean(
    presentation.footerHtml &&
    (presentation.footerHtml.includes('btn-nav') ||
     presentation.footerHtml.includes('footer-controls') ||
     presentation.footerHtml.includes('progress-bar') ||
     presentation.footerHtml.includes('changeSlide'))
  );

  if (presentation.footerHtml && !isWebPlayerFooter) {
    const footerWrapper = document.createElement('div');
    footerWrapper.className = 'slidestudio-corporate-footer shrink-0 select-none w-full max-w-full';
    footerWrapper.innerHTML = presentation.footerHtml;
    container.appendChild(footerWrapper);
  }

  staging.appendChild(container);
  document.body.appendChild(staging);

  // Initialize any Chart.js graphs inside staging
  const cleanupCharts = initSlideCharts(staging);

  // Allow browser layout and fonts to compute
  await new Promise((resolve) => setTimeout(resolve, 220));

  try {
    const stageRect = staging.getBoundingClientRect();

    // 1. Detect & Apply Slide Background
    const computedSlide = window.getComputedStyle(slideWrapper.firstElementChild || slideWrapper);
    const computedContainer = window.getComputedStyle(container);
    const rawSlideBg = (!computedSlide.backgroundColor || computedSlide.backgroundColor === 'transparent' || computedSlide.backgroundColor === 'rgba(0, 0, 0, 0)')
      ? computedSlide.backgroundImage
      : computedSlide.backgroundColor;
    const rawContainerBg = (!computedContainer.backgroundColor || computedContainer.backgroundColor === 'transparent' || computedContainer.backgroundColor === 'rgba(0, 0, 0, 0)')
      ? computedContainer.backgroundImage
      : computedContainer.backgroundColor;

    const parsedSlideBg = parseCssColor(rawSlideBg);
    const parsedContainerBg = parseCssColor(rawContainerBg);

    let slideBgHex = 'F8FAFC';
    if (!parsedSlideBg.isTransparent && parsedSlideBg.hex) {
      slideBgHex = parsedSlideBg.hex;
    } else if (!parsedContainerBg.isTransparent && parsedContainerBg.hex) {
      slideBgHex = parsedContainerBg.hex;
    } else if (
      slideData.htmlContent.includes('bg-[#0038D1]') ||
      slideData.htmlContent.includes('bg-[#0033C6]') ||
      slideData.className?.includes('bg-[#0038D1]')
    ) {
      slideBgHex = '0038D1';
    } else if (slideData.htmlContent.includes('bg-slate-900') || slideData.htmlContent.includes('#0F172A')) {
      slideBgHex = '0F172A';
    }

    const isSlideDark = Boolean(
      slideBgHex === '0038D1' ||
      slideBgHex === '00174F' ||
      slideBgHex === '0F172A' ||
      slideBgHex === '000000' ||
      slideData.htmlContent.includes('bg-slate-900') ||
      slideData.htmlContent.includes('bg-[#0038D1]')
    );

    pptSlide.background = { color: slideBgHex };

    // Set of elements already handled
    const handledElements = new Set<Element>();

    // Mark any leftover web navigation chrome as handled so it is completely excluded
    staging.querySelectorAll(
      '.footer-controls, .nav-controls, .btn-nav, button[onclick*="changeSlide"], button[onclick*="toggleFullScreen"], #btn-prev, #btn-next, #btn-fullscreen, .slide-counter, .progress-bar'
    ).forEach((el) => {
      handledElements.add(el);
      el.querySelectorAll('*').forEach((c) => handledElements.add(c));
    });

    // -------------------------------------------------------------
    // LAYER 2: Container Cards, Shapes, Badges & Header Bars
    // Drawn FIRST so cards sit behind charts, tables, and text
    // -------------------------------------------------------------
    const allDivsAndContainers = Array.from(
      staging.querySelectorAll('div, section, article, header, footer, button, span, hr, aside')
    ).filter((el) => {
      if (handledElements.has(el)) return false;
      const rect = el.getBoundingClientRect();
      if (rect.width < 10 || rect.height < 3) return false;
      // Skip full-slide staging wrappers
      if (rect.width >= STAGE_W - 4 && rect.height >= STAGE_H - 4) return false;

      const style = window.getComputedStyle(el);
      // Support both backgroundColor and backgroundImage (for linear gradients like .header-bar!)
      const rawBg = (!style.backgroundColor || style.backgroundColor === 'transparent' || style.backgroundColor === 'rgba(0, 0, 0, 0)')
        ? style.backgroundImage
        : style.backgroundColor;
      const parsedBg = parseCssColor(rawBg);

      const borderTopW = parseFloat(style.borderTopWidth) || 0;
      const borderBottomW = parseFloat(style.borderBottomWidth) || 0;
      const borderLeftW = parseFloat(style.borderLeftWidth) || 0;
      const borderRightW = parseFloat(style.borderRightWidth) || 0;
      const borderW = Math.max(borderTopW, borderBottomW, borderLeftW, borderRightW);

      const parsedBorder = parseCssColor(style.borderColor);

      const hasVisibleFill = !parsedBg.isTransparent && parsedBg.alpha > 0.04;
      const hasVisibleBorder = borderW > 0.5 && !parsedBorder.isTransparent && parsedBorder.alpha > 0.05;

      return hasVisibleFill || hasVisibleBorder || el.tagName === 'HR';
    });

    // Sort by bounding box area descending (outer cards first, inner pills/buttons second)
    allDivsAndContainers.sort((a, b) => {
      const rectA = a.getBoundingClientRect();
      const rectB = b.getBoundingClientRect();
      return (rectB.width * rectB.height) - (rectA.width * rectA.height);
    });

    // Accent lines to be rendered right after container bodies
    const accentLinesToDraw: Array<{
      x: number;
      y: number;
      w: number;
      h: number;
      color: string;
      width: number;
    }> = [];

    for (const el of allDivsAndContainers) {
      const rect = el.getBoundingClientRect();
      const style = window.getComputedStyle(el);
      const rawBg = (!style.backgroundColor || style.backgroundColor === 'transparent' || style.backgroundColor === 'rgba(0, 0, 0, 0)')
        ? style.backgroundImage
        : style.backgroundColor;
      const parsedBg = parseCssColor(rawBg);

      const borderTopW = parseFloat(style.borderTopWidth) || 0;
      const borderBottomW = parseFloat(style.borderBottomWidth) || 0;
      const borderLeftW = parseFloat(style.borderLeftWidth) || 0;
      const borderRightW = parseFloat(style.borderRightWidth) || 0;

      const parsedTopBorder = parseCssColor(style.borderTopColor);
      const parsedBottomBorder = parseCssColor(style.borderBottomColor);
      const parsedLeftBorder = parseCssColor(style.borderLeftColor);
      const parsedRightBorder = parseCssColor(style.borderRightColor);

      const hasFill = !parsedBg.isTransparent && parsedBg.alpha > 0.04;

      const x = Math.max(0, (rect.left - stageRect.left) * scaleX);
      const y = Math.max(0, (rect.top - stageRect.top) * scaleY);
      const w = Math.min(SLIDE_W - x, rect.width * scaleX);
      const h = Math.min(SLIDE_H - y, rect.height * scaleY);

      const radius = parseFloat(style.borderRadius) || 0;
      const isPill = radius > 12 || 
        el.classList.contains('rounded-full') || 
        el.classList.contains('cb-badge') || 
        el.classList.contains('cover-tag') || 
        el.classList.contains('badge-neg') || 
        el.classList.contains('badge-pos') || 
        el.classList.contains('badge-nps-critico') || 
        el.classList.contains('badge-nps-aperfeicoamento') || 
        el.classList.contains('badge-nps-excelente') ||
        el.classList.contains('badge-pill') ||
        el.classList.contains('badge-neutral') ||
        el.classList.contains('badge-soft');

      // Use true roundRect in pptxgenjs: 0.45 for pills/capsules, 0.08 for modern cards, 0.05 for subtle boxes
      const rectRadius = isPill ? 0.45 : radius >= 6 ? 0.08 : radius > 2 ? 0.05 : 0;
      const shapeType = rectRadius > 0 ? 'roundRect' : 'rect';

      // Divider line
      if (el.tagName === 'HR' || (h <= 0.05 && w > 0.8)) {
        pptSlide.addShape('line', {
          x,
          y: y + h / 2,
          w,
          h: 0,
          line: {
            color: !parsedBottomBorder.isTransparent ? parsedBottomBorder.hex : (isSlideDark ? '334155' : 'E2E8F0'),
            width: Math.max(0.75, borderBottomW || 1),
          },
        });
        continue;
      }

      // Check for top accent stripe (common on corporate KPI cards, e.g. Casas Bahia .kpi-card, .cover-kpi, .matrix-card)
      const hasTopAccent = borderTopW > borderBottomW + 1.2 || (borderTopW >= 2.5 && !parsedTopBorder.isTransparent);
      // Check for bottom accent line (common on header bars, e.g. Casas Bahia .header-bar red bottom border)
      const hasBottomAccent = borderBottomW > borderTopW + 1.2 && !parsedBottomBorder.isTransparent;

      const bodyBorderColor = !parsedBottomBorder.isTransparent && parsedBottomBorder.alpha > 0.05
        ? parsedBottomBorder.hex
        : !parsedLeftBorder.isTransparent && parsedLeftBorder.alpha > 0.05
        ? parsedLeftBorder.hex
        : 'CBD5E1';
      const bodyBorderWidth = Math.max(0.75, borderBottomW || borderLeftW || borderRightW || 0.75);

      const isCardElement = el.classList.contains('kpi-card') || 
        el.classList.contains('matrix-card') || 
        el.classList.contains('cover-kpi') || 
        el.classList.contains('chart-card') ||
        el.classList.contains('card');

      const shouldHaveBorder = (borderBottomW > 0.4 || borderLeftW > 0.4 || borderRightW > 0.4 || hasTopAccent || isCardElement);

      // Add clean native shape for container body (uses 'roundRect' for true pill and card corners)
      pptSlide.addShape(shapeType, {
        x,
        y,
        w,
        h,
        fill: hasFill
          ? {
              color: parsedBg.hex,
              transparency: parsedBg.transparencyPct,
            }
          : { type: 'none' },
        line: shouldHaveBorder
          ? {
              color: bodyBorderColor,
              width: Math.max(0.75, Math.min(1.5, bodyBorderWidth * 0.75)),
            }
          : undefined,
        rectRadius: rectRadius > 0 ? rectRadius : undefined,
      });

      // If card has top accent line, draw top accent stripe flush on top of the card
      if (hasTopAccent) {
        accentLinesToDraw.push({
          x: x + 0.02,
          y: y + 0.02,
          w: Math.max(0.2, w - 0.04),
          h: 0,
          color: parsedTopBorder.hex,
          width: Math.max(2.5, Math.min(4.0, borderTopW)),
        });
      }

      // If container has bottom accent line (e.g. .header-bar red bottom line)
      if (hasBottomAccent) {
        accentLinesToDraw.push({
          x,
          y: y + h,
          w,
          h: 0,
          color: parsedBottomBorder.hex,
          width: Math.max(2.0, Math.min(3.5, borderBottomW)),
        });
      }
    }

    // Draw all accent stripes on top of card bodies
    for (const line of accentLinesToDraw) {
      pptSlide.addShape('line', {
        x: line.x,
        y: line.y,
        w: line.w,
        h: 0,
        line: {
          color: line.color,
          width: line.width,
        },
      });
    }

    // -------------------------------------------------------------
    // LAYER 3: Native Tables (<table>)
    // -------------------------------------------------------------
    const tableElements = Array.from(staging.querySelectorAll('table'));
    for (const tableEl of tableElements) {
      if (handledElements.has(tableEl)) continue;
      const rect = tableEl.getBoundingClientRect();
      const x = Math.max(0, Math.min(SLIDE_W - 0.5, (rect.left - stageRect.left) * scaleX));
      const y = Math.max(0, Math.min(SLIDE_H - 0.5, (rect.top - stageRect.top) * scaleY));
      const w = Math.min(SLIDE_W - x, rect.width * scaleX);
      const h = Math.min(SLIDE_H - y, rect.height * scaleY);

      if (rect.width > 20 && rect.height > 20) {
        const tableRows: any[][] = [];
        const trEls = Array.from(tableEl.querySelectorAll('tr'));

        // Measure actual column widths from first row header/cells for true proportional columns
        let headerCells: Element[] = Array.from(tableEl.querySelector('thead tr')?.querySelectorAll('th, td') || []);
        if (headerCells.length === 0) {
          headerCells = Array.from(tableEl.querySelector('tbody tr:first-child')?.querySelectorAll('th, td') || []);
        }
        if (headerCells.length === 0) {
          headerCells = Array.from(tableEl.querySelector('tr:first-child')?.querySelectorAll('th, td') || []);
        }

        const totalCellW = headerCells.reduce((sum, c) => sum + (c.getBoundingClientRect().width || 1), 0) || 1;
        const colW: number[] = headerCells.map((c) => {
          const cellRect = c.getBoundingClientRect();
          const ratio = (cellRect.width || 1) / totalCellW;
          return Math.max(0.45, Number((ratio * w).toFixed(2)));
        });

        trEls.slice(0, 24).forEach((tr, rIdx) => {
          const cells = Array.from(tr.querySelectorAll('th, td'));
          if (cells.length > 0) {
            const trStyle = window.getComputedStyle(tr);
            const parsedTrBg = parseCssColor(trStyle.backgroundColor);
            const isHeader = rIdx === 0 || tr.parentElement?.tagName === 'THEAD';

            const rowData = cells.map((cell) => {
              const cellStyle = window.getComputedStyle(cell);
              const text = cleanText(cell.textContent);
              const parsedCellBg = parseCssColor(cellStyle.backgroundColor);

              // Check cell bg first, then row bg (for #FEE2E2, #FFF5F5, #F0FDF4 etc)
              const cellBg = !parsedCellBg.isTransparent && parsedCellBg.alpha > 0.05
                ? parsedCellBg.hex
                : !parsedTrBg.isTransparent && parsedTrBg.alpha > 0.05
                ? parsedTrBg.hex
                : isHeader
                ? isSlideDark ? '1E293B' : 'F1F5F9'
                : isSlideDark ? '0F172A' : 'FFFFFF';

              const parsedCellColor = parseCssColor(cellStyle.color, isSlideDark ? 'FFFFFF' : '0F172A');
              let cellColor = parsedCellColor.hex;

              // Check for colored spans or badges inside cell:
              const badgeEl = cell.querySelector('.badge-neg, .badge-pos, .badge-nps-critico, .badge-nps-aperfeicoamento, .badge-nps-excelente, span[style*="color"], strong[style*="color"]');
              if (badgeEl) {
                const bStyle = window.getComputedStyle(badgeEl);
                const parsedBColor = parseCssColor(bStyle.color);
                if (!parsedBColor.isTransparent && parsedBColor.alpha > 0.1) {
                  cellColor = parsedBColor.hex;
                }
              }
              const inlineColor = (cell as HTMLElement).style.color;
              if (inlineColor) {
                const parsedInline = parseCssColor(inlineColor);
                if (!parsedInline.isTransparent && parsedInline.alpha > 0.1) {
                  cellColor = parsedInline.hex;
                }
              }

              const bold = parseInt(cellStyle.fontWeight, 10) >= 600 || isHeader || Boolean(cell.querySelector('strong, b'));
              const fontSize = Math.max(7, Math.round(parseFloat(cellStyle.fontSize) * 0.75));
              const align = (cellStyle.textAlign as any) || (text.match(/^[\d.,%R$+\-]+$/) ? 'right' : 'left');

              return {
                text,
                options: {
                  fill: { color: cellBg },
                  color: cellColor,
                  bold,
                  fontSize,
                  fontFace: mapFontFamily(cellStyle.fontFamily),
                  align: align === 'center' ? 'center' : align === 'right' ? 'right' : 'left',
                  valign: 'middle',
                  margin: [2, 3, 2, 3],
                },
              };
            });
            tableRows.push(rowData);
          }
        });

        if (tableRows.length > 0) {
          pptSlide.addTable(tableRows, {
            x,
            y,
            w,
            h,
            colW: colW.length === tableRows[0].length ? colW : undefined,
            border: { type: 'solid', pt: 0.75, color: isSlideDark ? '334155' : 'CBD5E1' },
            autoPage: false,
          });
        }
      }

      // Mark all elements inside table as handled
      tableEl.querySelectorAll('*').forEach((el) => handledElements.add(el));
      handledElements.add(tableEl);
    }

    // -------------------------------------------------------------
    // LAYER 4: Charts (<canvas>)
    // Added AFTER container cards so charts sit ON TOP of cards!
    // -------------------------------------------------------------
    const canvasElements = Array.from(staging.querySelectorAll('canvas'));
    for (const canvas of canvasElements) {
      if (handledElements.has(canvas)) continue;
      const rect = canvas.getBoundingClientRect();
      if (rect.width > 20 && rect.height > 20) {
        const x = (rect.left - stageRect.left) * scaleX;
        const y = (rect.top - stageRect.top) * scaleY;
        const w = rect.width * scaleX;
        const h = rect.height * scaleY;

        try {
          const chartDataUrl = canvas.toDataURL('image/png');
          if (chartDataUrl && chartDataUrl.startsWith('data:image/')) {
            pptSlide.addImage({
              data: chartDataUrl,
              x,
              y,
              w,
              h,
            });
          }
        } catch (_) {}
      }
      handledElements.add(canvas);
    }

    // -------------------------------------------------------------
    // LAYER 5: SVG Icons & Graphic Badges (<svg>)
    // Added AFTER container cards
    // -------------------------------------------------------------
    const svgElements = Array.from(staging.querySelectorAll('svg'));
    for (const svg of svgElements) {
      if (handledElements.has(svg)) continue;
      const rect = svg.getBoundingClientRect();
      if (rect.width >= 8 && rect.height >= 8 && rect.width < STAGE_W / 2) {
        const x = (rect.left - stageRect.left) * scaleX;
        const y = (rect.top - stageRect.top) * scaleY;
        const w = rect.width * scaleX;
        const h = rect.height * scaleY;

        try {
          const svgXml = new XMLSerializer().serializeToString(svg);
          const svgDataUrl = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgXml);
          pptSlide.addImage({
            data: svgDataUrl,
            x,
            y,
            w,
            h,
          });
        } catch (_) {}
      }
      handledElements.add(svg);
      svg.querySelectorAll('*').forEach((c) => handledElements.add(c));
    }

    // -------------------------------------------------------------
    // LAYER 6: Images (<img>)
    // Added AFTER container cards
    // -------------------------------------------------------------
    const imgElements = Array.from(staging.querySelectorAll('img'));
    for (const img of imgElements) {
      if (handledElements.has(img)) continue;
      const rect = img.getBoundingClientRect();
      if (rect.width > 10 && rect.height > 10 && img.src) {
        const x = (rect.left - stageRect.left) * scaleX;
        const y = (rect.top - stageRect.top) * scaleY;
        const w = rect.width * scaleX;
        const h = rect.height * scaleY;

        try {
          pptSlide.addImage({
            data: img.src,
            x,
            y,
            w,
            h,
          });
        } catch (_) {}
      }
      handledElements.add(img);
    }

    // -------------------------------------------------------------
    // LAYER 7: Native Editable Text Elements (with Leaf Div Support!)
    // Added ON TOP of all cards, shapes, charts, and tables
    // -------------------------------------------------------------

    // Pre-process any .cover-meta-bar into a single unified centered text run with top border
    const metaBars = Array.from(staging.querySelectorAll('.cover-meta-bar, .meta-bar'));
    for (const bar of metaBars) {
      if (handledElements.has(bar)) continue;
      const barRect = bar.getBoundingClientRect();
      if (barRect.width < 50 || barRect.height < 10) continue;

      const barX = Math.max(0, (barRect.left - stageRect.left) * scaleX);
      const barY = Math.max(0, (barRect.top - stageRect.top) * scaleY);
      const barW = Math.min(SLIDE_W - barX, barRect.width * scaleX);

      // Top divider line
      pptSlide.addShape('line', {
        x: Math.max(0.5, barX),
        y: barY,
        w: Math.min(9.0, barW),
        h: 0,
        line: { color: 'E2E8F0', width: 0.75 },
      });

      // Extract all child text runs with proper spacing and bolding
      const barChildren = Array.from(bar.querySelectorAll('span, p, div')).filter(
        (c) => c.children.length === 0 && cleanText(c.textContent).length > 0
      );
      const metaRuns: any[] = [];

      barChildren.forEach((child) => {
        const text = cleanText(child.textContent);
        if (!text) return;
        const cStyle = window.getComputedStyle(child);
        const bold = parseInt(cStyle.fontWeight, 10) >= 600 || Boolean(child.closest('strong, b'));
        const isBullet = text === '•';

        metaRuns.push({
          text: isBullet ? '   •   ' : text + ' ',
          options: {
            bold: isBullet ? false : bold,
            color: isBullet ? '94A3B8' : (bold ? '334155' : '64748B'),
            fontSize: 8.5,
            fontFace: 'Inter',
          },
        });
      });

      if (metaRuns.length > 0) {
        pptSlide.addText(metaRuns, {
          x: 0.5,
          y: barY + 0.05,
          w: 9.0,
          h: 0.35,
          align: 'center',
          valign: 'middle',
          wrap: false,
          margin: 0,
        });
      }

      handledElements.add(bar);
      bar.querySelectorAll('*').forEach((c) => handledElements.add(c));
    }

    const textElements = Array.from(staging.querySelectorAll('*')).filter((el) => {
      if (handledElements.has(el)) return false;

      const tag = el.tagName.toUpperCase();
      if (['SCRIPT', 'STYLE', 'SVG', 'CANVAS', 'IMG', 'TABLE', 'THEAD', 'TBODY', 'TR', 'TH', 'TD', 'UL', 'OL', 'BODY', 'HTML', 'HR'].includes(tag)) {
        return false;
      }

      const text = cleanText(el.textContent);
      if (!text || text.length === 0) return false;

      // Skip elements that contain block child elements (let child block elements be processed)
      const hasBlockChild = Boolean(
        el.querySelector('h1, h2, h3, h4, h5, h6, p, li, table, ul, ol, blockquote, hr')
      );
      if (hasBlockChild) return false;

      // If this element contains child divs/buttons that have their own text,
      // then this element is a multi-item container (e.g. .cover-kpi), NOT a leaf text block!
      const childContainers = Array.from(el.querySelectorAll('div, section, article, header, footer, button'));
      const hasChildContainerWithText = childContainers.some((child) => child !== el && cleanText(child.textContent).length > 0);
      if (hasChildContainerWithText) return false;

      // If element is flex/grid and contains multiple text-bearing child elements (e.g. .cover-meta-bar),
      // let each child span/div be processed individually at its own x, y position!
      const style = window.getComputedStyle(el);
      if (['flex', 'inline-flex', 'grid'].includes(style.display) && el.children.length > 1) {
        const textChildren = Array.from(el.children).filter((c) => cleanText(c.textContent).length > 0);
        if (textChildren.length > 1) return false;
      }

      // If parent is already a text element with identical or encompassing text, skip child
      let parent = el.parentElement;
      while (parent && parent !== slideWrapper && parent !== staging) {
        const pTag = parent.tagName.toUpperCase();
        if (['H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'P', 'LI', 'BUTTON', 'A', 'LABEL'].includes(pTag)) {
          return false; // Parent handles this formatted run
        }
        if (pTag === 'DIV' && cleanText(parent.textContent) === text && !parent.querySelector('h1, h2, h3, h4, h5, h6, p, li, table, ul, ol')) {
          return false;
        }
        parent = parent.parentElement;
      }

      return true;
    });

    for (const el of textElements) {
      if (handledElements.has(el)) continue;

      const rect = el.getBoundingClientRect();
      if (rect.width < 4 || rect.height < 4) continue;

      const style = window.getComputedStyle(el);
      const text = cleanText(el.textContent);
      if (!text) continue;

      const fontSize = Math.max(7.5, Math.round(parseFloat(style.fontSize) * 0.75));
      const fontFace = mapFontFamily(style.fontFamily);
      const align = (style.textAlign as any) || 'left';
      const isBullet = el.tagName === 'LI';
      const isSingleLine = rect.height <= 36 && !text.includes('\n');

      const x = Math.max(0, (rect.left - stageRect.left) * scaleX);
      const y = Math.max(0, (rect.top - stageRect.top) * scaleY);

      // Tight buffer that prevents kerning wrap without colliding with adjacent flex/grid items
      const widthBuffer = isSingleLine ? Math.min(0.06, Math.max(0.02, rect.width * 0.03 * scaleX)) : 0.05;
      const w = Math.min(SLIDE_W - x, (rect.width * scaleX) + widthBuffer);
      const h = Math.min(SLIDE_H - y, Math.max(0.24, (rect.height + 2) * scaleY));

      // Determine if this text sits on a dark container (e.g. .header-bar, dark badges, dark covers)
      let elBgIsDark = isSlideDark;
      let pEl: HTMLElement | null = el.parentElement;
      while (pEl && pEl !== staging) {
        const pStyle = window.getComputedStyle(pEl);
        const pRawBg = (!pStyle.backgroundColor || pStyle.backgroundColor === 'transparent' || pStyle.backgroundColor === 'rgba(0, 0, 0, 0)')
          ? pStyle.backgroundImage
          : pStyle.backgroundColor;
        const pBg = parseCssColor(pRawBg);
        if (!pBg.isTransparent && pBg.alpha > 0.1) {
          elBgIsDark = Boolean(
            pBg.hex === '00174F' ||
            pBg.hex === '002280' ||
            pBg.hex === '0033C6' ||
            pBg.hex === '0038D1' ||
            pBg.hex === '0F172A' ||
            pBg.hex === '1E293B' ||
            pBg.hex === '000000'
          );
          break;
        }
        pEl = pEl.parentElement;
      }

      const runs = extractElementTextRuns(el, style, elBgIsDark);

      // Contrast hardening: Only brighten text if it is actually against a dark background!
      // When against a light background (e.g. inside a white card like .kpi-val), preserve dark colors!
      const hardenedRuns = runs.map((r) => {
        let runColor = r.options.color;
        if (elBgIsDark && (runColor === '000000' || runColor === '0F172A' || runColor === '334155' || runColor === '475569')) {
          runColor = 'FFFFFF';
        }
        return {
          text: r.text,
          options: {
            ...r.options,
            color: runColor,
            fontSize,
            fontFace,
            bullet: isBullet,
          },
        };
      });

      // Prepend corporate red dot for category tags (.slide-category)
      const isSlideCategory = el.classList.contains('slide-category') || el.classList.contains('category-tag');
      if (isSlideCategory) {
        hardenedRuns.unshift({
          text: '●  ',
          options: {
            color: 'E71A3B',
            fontSize: Math.max(7, fontSize - 1),
            bold: true,
            fontFace: 'Arial',
          },
        });
      }

      pptSlide.addText(hardenedRuns, {
        x,
        y,
        w,
        h,
        align: align === 'center' ? 'center' : align === 'right' ? 'right' : 'left',
        valign: isSingleLine ? 'middle' : 'top',
        wrap: !isSingleLine, // Prevent single-line metrics, titles, and badges from wrapping prematurely
        margin: 0,
      });

      // Mark element and all its children as handled
      handledElements.add(el);
      el.querySelectorAll('*').forEach((c) => handledElements.add(c));
    }

    // 8. Speaker Notes
    if (slideData.notes) {
      try {
        (pptSlide as any).addNotes?.(slideData.notes);
      } catch (_) {}
    }
  } finally {
    try {
      cleanupCharts();
    } catch (_) {}
    staging.remove();
  }
}

/**
 * Builds a PowerPoint slide in Vector/Native Shapes mode
 */
async function buildSlideVector(
  pres: pptxgen,
  slideData: SlideData,
  presentation: PresentationDoc,
  slideIndex: number,
  totalSlides: number
) {
  await buildSlideNativeFromDom(pres, slideData, presentation, slideIndex, totalSlides);
}

/**
 * Renders a column/card content block containing text, cards, charts, or lists (Vector mode)
 */
async function renderContentBlock(
  pres: pptxgen,
  pptSlide: pptxgen.Slide,
  containerEl: Element,
  x: number,
  y: number,
  w: number,
  h: number,
  theme: {
    cardBgColor: string;
    cardBorderColor: string;
    defaultTextColor: string;
    mutedTextColor: string;
    accentColor: string;
    isDarkTheme: boolean;
  }
) {
  const table = containerEl.querySelector('table');
  if (table) {
    await renderTable(pptSlide, table, x, y, w, h, theme);
    return;
  }

  const canvas = containerEl.querySelector('canvas');
  if (canvas) {
    const chartTitle = cleanText(containerEl.querySelector('.chart-header, h3, h4')?.textContent);
    let chartY = y;
    let chartH = h;

    if (chartTitle) {
      pptSlide.addText(chartTitle, {
        x,
        y: chartY,
        w,
        h: 0.3,
        fontFace: 'Arial',
        fontSize: 11,
        bold: true,
        color: theme.defaultTextColor,
      });
      chartY += 0.35;
      chartH -= 0.35;
    }

    try {
      const chartImg = canvas.toDataURL('image/png');
      if (chartImg && chartImg.length > 50) {
        pptSlide.addImage({
          data: chartImg,
          x,
          y: chartY,
          w,
          h: Math.max(1.5, chartH - 0.1),
        });
      }
    } catch (_) {}
    return;
  }

  pptSlide.addShape('rect', {
    x,
    y,
    w,
    h,
    fill: { color: theme.cardBgColor },
    line: { color: theme.cardBorderColor, width: 1 },
    rectRadius: 0.08,
  });

  let innerY = y + 0.16;
  const innerW = w - 0.32;
  const innerX = x + 0.16;

  const cardTitleEl = containerEl.querySelector('h2, h3, h4, .card-title, .font-bold');
  if (cardTitleEl) {
    const title = cleanText(cardTitleEl.textContent);
    if (title) {
      pptSlide.addText(title, {
        x: innerX,
        y: innerY,
        w: innerW,
        h: 0.32,
        fontFace: 'Arial',
        fontSize: 12,
        bold: true,
        color: theme.defaultTextColor,
      });
      innerY += 0.36;
    }
  }

  const listItems = Array.from(containerEl.querySelectorAll('li'));
  if (listItems.length > 0) {
    const bulletTexts = listItems.map((li) => cleanText(li.textContent)).filter(Boolean);
    if (bulletTexts.length > 0) {
      const formattedBullets = bulletTexts.map((txt) => ({
        text: txt,
        options: {
          bullet: true,
          fontSize: 9.5,
          color: theme.defaultTextColor,
          fontFace: 'Arial',
        },
      }));

      pptSlide.addText(formattedBullets, {
        x: innerX,
        y: innerY,
        w: innerW,
        h: Math.max(1.0, h - (innerY - y) - 0.1),
      });
      return;
    }
  }

  const paragraphs = Array.from(containerEl.querySelectorAll('p'));
  if (paragraphs.length > 0) {
    const pText = paragraphs.map((p) => cleanText(p.textContent)).filter(Boolean).join('\n\n');
    if (pText) {
      pptSlide.addText(pText, {
        x: innerX,
        y: innerY,
        w: innerW,
        h: Math.max(1.0, h - (innerY - y) - 0.1),
        fontFace: 'Arial',
        fontSize: 10,
        color: theme.mutedTextColor,
      });
      return;
    }
  }
}

/**
 * Extracts and formats an HTML <table> into PowerPoint native table format
 */
async function renderTable(
  pptSlide: pptxgen.Slide,
  tableEl: HTMLTableElement,
  x: number,
  y: number,
  w: number,
  h: number,
  theme: {
    cardBgColor: string;
    cardBorderColor: string;
    defaultTextColor: string;
    mutedTextColor: string;
    accentColor: string;
    isDarkTheme: boolean;
  }
) {
  const tableRows: any[][] = [];

  const thEls = Array.from(tableEl.querySelectorAll('thead th, thead td, tr:first-child th'));
  if (thEls.length > 0) {
    const headerRow = thEls.map((th) => ({
      text: cleanText(th.textContent),
      options: {
        fill: { color: theme.isDarkTheme ? '1E293B' : '00174F' },
        color: 'FFFFFF',
        bold: true,
        fontSize: 9,
        fontFace: 'Arial',
        align: 'left',
        valign: 'middle',
      },
    }));
    tableRows.push(headerRow);
  }

  const trEls = Array.from(tableEl.querySelectorAll('tbody tr, tr:not(:first-child)'));
  trEls.slice(0, 10).forEach((tr, rowIdx) => {
    const cells = Array.from(tr.querySelectorAll('td, th'));
    if (cells.length > 0) {
      const isEven = rowIdx % 2 === 0;
      const rowData = cells.map((cell) => {
        const text = cleanText(cell.textContent);
        let cellColor = theme.defaultTextColor;
        let isBold = false;

        if (cell.classList.contains('font-bold') || cell.querySelector('strong, b')) {
          isBold = true;
        }
        if (
          text.includes('100%') ||
          text.includes('Meta') ||
          cell.classList.contains('text-emerald-500')
        ) {
          cellColor = '059669';
        } else if (text.includes('Crítico') || cell.classList.contains('text-red-500')) {
          cellColor = 'DC2626';
        }

        return {
          text,
          options: {
            fill: {
              color: isEven
                ? theme.isDarkTheme
                  ? '0F172A'
                  : 'FFFFFF'
                : theme.isDarkTheme
                ? '1E293B'
                : 'F8FAFC',
            },
            color: cellColor,
            bold: isBold,
            fontSize: 8.5,
            fontFace: 'Arial',
            align: 'left',
            valign: 'middle',
          },
        };
      });
      tableRows.push(rowData);
    }
  });

  if (tableRows.length > 0) {
    pptSlide.addTable(tableRows, {
      x,
      y,
      w,
      h: Math.min(h, tableRows.length * 0.3 + 0.4),
      border: { type: 'solid', pt: 1, color: theme.cardBorderColor },
      autoPage: false,
    });
  }
}

/**
 * Options for exporting PowerPoint files
 */
export interface PptxExportOptions {
  mode?: 'high-fidelity' | 'vector';
  fileName?: string;
  onProgress?: (current: number, total: number) => void;
}

/**
 * Exports a single slide to a PowerPoint (.pptx) file.
 * Defaults to 'vector' mode for 100% editable layers, shapes, text boxes, and tables in PowerPoint.
 */
export async function exportSlideToPptx(
  slide: SlideData,
  presentation: PresentationDoc,
  slideIndex: number,
  options: PptxExportOptions = {}
): Promise<void> {
  const mode = options.mode || 'vector';
  const pres = new pptxgen();
  pres.layout = 'LAYOUT_16x9';
  pres.title = slide.title || presentation.title || 'SlideStudio Slide';

  if (mode === 'high-fidelity') {
    await buildSlideHighFidelity(pres, slide, presentation, slideIndex, presentation.slides.length);
  } else {
    await buildSlideVector(pres, slide, presentation, slideIndex, presentation.slides.length);
  }

  const safeTitle = (slide.title || presentation.title || 'slide')
    .toLowerCase()
    .replace(/[^a-z0-9]/gi, '_')
    .substring(0, 40);

  const suffix = mode === 'high-fidelity' ? '_alta_fidelidade' : '_editavel';
  const fileName = options.fileName || `${safeTitle}_slide_${slideIndex + 1}${suffix}.pptx`;
  await pres.writeFile({ fileName });
}

/**
 * Exports the entire presentation to a PowerPoint (.pptx) file.
 * Defaults to 'vector' mode, generating native editable shapes, cards, text boxes, tables,
 * and charts so the user can freely edit all elements in Microsoft PowerPoint.
 */
export async function exportPresentationToPptx(
  presentation: PresentationDoc,
  options: PptxExportOptions = {}
): Promise<void> {
  const mode = options.mode || 'vector';
  const pres = new pptxgen();
  pres.layout = 'LAYOUT_16x9';
  pres.title = presentation.title || 'Apresentação SlideStudio';
  pres.company = 'SlideStudio HTML';

  const total = presentation.slides.length;
  for (let i = 0; i < total; i++) {
    if (options.onProgress) {
      options.onProgress(i + 1, total);
    }
    const slide = presentation.slides[i];
    if (mode === 'high-fidelity') {
      await buildSlideHighFidelity(pres, slide, presentation, i, total);
    } else {
      await buildSlideVector(pres, slide, presentation, i, total);
    }
  }

  const safeTitle = (presentation.title || 'apresentacao')
    .toLowerCase()
    .replace(/[^a-z0-9]/gi, '_')
    .substring(0, 45);

  const suffix = mode === 'high-fidelity' ? '_alta_fidelidade' : '_editavel';
  const fileName = options.fileName || `${safeTitle}${suffix}.pptx`;
  await pres.writeFile({ fileName });
}

/**
 * Exports/Prints the presentation as PDF using a sandbox-safe hidden iframe
 * avoiding window.open/popup blocker restrictions.
 */
export function exportPresentationToPdf(htmlString: string): Promise<boolean> {
  return new Promise((resolve) => {
    try {
      const iframe = document.createElement('iframe');
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = '0';
      iframe.style.opacity = '0';
      iframe.style.pointerEvents = 'none';
      document.body.appendChild(iframe);

      const doc = iframe.contentDocument || iframe.contentWindow?.document;
      if (!doc) {
        iframe.remove();
        resolve(false);
        return;
      }

      doc.open();
      doc.write(htmlString);
      doc.close();

      setTimeout(() => {
        try {
          iframe.contentWindow?.focus();
          iframe.contentWindow?.print();
          setTimeout(() => {
            iframe.remove();
            resolve(true);
          }, 2000);
        } catch (printErr) {
          console.warn('Iframe print error, falling back:', printErr);
          iframe.remove();
          resolve(false);
        }
      }, 500);
    } catch (err) {
      console.warn('PDF print initialization error:', err);
      resolve(false);
    }
  });
}
