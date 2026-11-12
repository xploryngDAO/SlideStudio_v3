import { PresentationDoc, SlideData } from '../types/presentation';
import { CASAS_BAHIA_HTML } from './casasBahiaSample';
import { BUILTIN_CHART_PRESETS } from './chartHelper';

// Generate unique IDs for tracking elements in the visual canvas
export const generateId = (prefix = 'el'): string => {
  return `${prefix}-${Math.random().toString(36).substring(2, 9)}`;
};

/**
 * Parses raw HTML string (uploaded, pasted, or loaded) into a structured PresentationDoc
 * Preserves 100% of styles, CSS variables, fonts, scripts, and corporate presentation frames.
 */
export function parseHtmlPresentation(rawHtml: string): PresentationDoc {
  const parser = new DOMParser();
  const doc = parser.parseFromString(rawHtml, 'text/html');

  // 1. Extract Title
  const title = doc.querySelector('title')?.textContent?.trim() || 'Apresentação SlideStudio';

  // 2. Extract Head tags (styles, links to fonts/css, script tags with src)
  let headHtml = '';

  // Extract ALL styles wherever they appear in the document (head, body, or root)
  const allStyles = Array.from(doc.querySelectorAll('style'));
  allStyles.forEach((el) => {
    headHtml += el.outerHTML + '\n';
  });

  // Extract ALL external links (Google Fonts, stylesheets, preconnect)
  const allLinks = Array.from(doc.querySelectorAll('link'));
  allLinks.forEach((el) => {
    headHtml += el.outerHTML + '\n';
  });

  // Extract external scripts (Chart.js, Tailwind CDN, etc.)
  const allScriptsWithSrc = Array.from(doc.querySelectorAll('script[src]'));
  allScriptsWithSrc.forEach((el) => {
    headHtml += el.outerHTML + '\n';
  });

  // 3. Extract Embedded Scripts (for charts, interactive widgets)
  let scriptContent = '';
  const inlineScripts = Array.from(doc.querySelectorAll('script:not([src])'));
  inlineScripts.forEach((el) => {
    scriptContent += (el.textContent || '') + '\n';
  });

  // 4. Check for Presentation Container & Corporate Header Frame
  let headerHtml = '';
  let footerHtml = '';
  let containerClass = '';
  let containerStyle = '';
  let viewportClass = '';
  let viewportStyle = '';

  const containerEl = doc.querySelector('.presentation-container, .deck-container, .presentation-wrapper');
  if (containerEl) {
    containerClass = containerEl.getAttribute('class') || '';
    containerStyle = containerEl.getAttribute('style') || '';

    // Extract corporate persistent header outside slide viewport
    const headerEl = containerEl.querySelector('header, .header-bar, .presentation-header');
    if (headerEl) {
      headerHtml = headerEl.outerHTML;
    }

    // Extract persistent footer if any
    const footerEl = containerEl.querySelector('footer, .footer-bar, .presentation-footer');
    if (footerEl) {
      footerHtml = footerEl.outerHTML;
    }

    // Extract viewport classes and styles
    const viewportEl = containerEl.querySelector('.slide-viewport, main, .slides-viewport');
    if (viewportEl) {
      viewportClass = viewportEl.getAttribute('class') || '';
      viewportStyle = viewportEl.getAttribute('style') || '';
    }
  }

  // Fallback to top-level doc queries if not found inside containerEl
  if (!headerHtml) {
    const headerEl = doc.querySelector('body > header, .header-bar, header');
    if (headerEl) headerHtml = headerEl.outerHTML;
  }
  if (!footerHtml) {
    const footerEl = doc.querySelector('body > footer, .footer-bar, footer');
    if (footerEl) footerHtml = footerEl.outerHTML;
  }

  // If containerEl only held slides (e.g. <main class="deck-container">) and header/footer are outside it,
  // then containerEl is the slide viewport, NOT the outer presentation container wrapper!
  if (containerEl && (headerHtml || footerHtml)) {
    const containsHeader = headerHtml ? Boolean(containerEl.querySelector('header, .header-bar, .presentation-header')) : true;
    const containsFooter = footerHtml ? Boolean(containerEl.querySelector('footer, .footer-bar, .presentation-footer')) : true;

    if (!containsHeader || !containsFooter) {
      viewportClass = containerClass;
      viewportStyle = containerStyle;
      containerClass = 'presentation-container';
      containerStyle = '';
    }
  }

  // 5. Find slide containers:
  let slideElements: Element[] = [];

  // If slide viewport exists, look inside it first
  const viewport = doc.querySelector('.slide-viewport, main, .slides-container');
  if (viewport) {
    const directSlides = Array.from(viewport.querySelectorAll(':scope > section, :scope > .slide, :scope > div.slide'));
    if (directSlides.length > 0) {
      slideElements = directSlides;
    }
  }

  if (slideElements.length === 0) {
    const sections = Array.from(doc.querySelectorAll('section'));
    const slideClassElements = Array.from(doc.querySelectorAll('.slide, [data-slide], .slides-item, .presentation-slide'));

    if (sections.length > 0) {
      slideElements = sections;
    } else if (slideClassElements.length > 0) {
      slideElements = slideClassElements;
    } else {
      const main = doc.querySelector('main') || doc.body;
      const directChildren = Array.from(main.children).filter(
        (child) => !['STYLE', 'SCRIPT', 'LINK', 'HEADER', 'FOOTER'].includes(child.tagName)
      );

      if (directChildren.length > 1) {
        slideElements = directChildren;
      } else if (directChildren.length === 1 && directChildren[0].children.length > 1) {
        slideElements = Array.from(directChildren[0].children);
      } else {
        slideElements = [doc.body];
      }
    }
  }

  const slides: SlideData[] = slideElements.map((el, index) => {
    const tagName = el.tagName.toLowerCase();
    const className = el.getAttribute('class') || 'slide';
    const style = el.getAttribute('style') || '';

    // Auto-detect canvases and attach matching presets as data-chart-data
    const canvases = el.querySelectorAll('canvas');
    canvases.forEach((cv) => {
      if (!cv.getAttribute('data-chart-data')) {
        const preset =
          (cv.id && BUILTIN_CHART_PRESETS[cv.id]) ||
          (cv.getAttribute('data-chart') && BUILTIN_CHART_PRESETS[cv.getAttribute('data-chart')!]);
        if (preset) {
          cv.setAttribute('data-chart-data', JSON.stringify(preset));
        }
      }
    });

    // Extract attributes
    const attributes: Record<string, string> = {};
    for (let i = 0; i < el.attributes.length; i++) {
      const attr = el.attributes[i];
      if (attr.name !== 'class' && attr.name !== 'style') {
        attributes[attr.name] = attr.value;
      }
    }

    // Extract slide title: look for .slide-title, h1, h2, h3, .cover-tagline, .slide-eyebrow
    const titleEl = el.querySelector('.slide-title, h2, h1, .cover-tagline, h3, .title, [data-title]');
    let slideTitle = titleEl?.textContent?.trim() || '';
    if (!slideTitle) {
      const eyebrow = el.querySelector('.slide-eyebrow, .badge');
      slideTitle = eyebrow?.textContent?.trim() || `Slide ${index + 1}`;
    }

    // Extract speaker notes if any
    const notesEl = el.querySelector('aside.notes, .speaker-notes, [data-notes]');
    const notes = notesEl?.textContent?.trim() || el.getAttribute('data-notes') || '';

    return {
      id: generateId('slide'),
      title: slideTitle.length > 50 ? slideTitle.substring(0, 50) + '...' : slideTitle,
      htmlContent: el.innerHTML,
      tagName: tagName === 'body' ? 'section' : tagName,
      className,
      style,
      attributes,
      notes,
    };
  });

  // Extract theme colors from CSS if available
  const primaryMatch = rawHtml.match(/--color-primary:\s*(#[0-9a-fA-F]{3,8}|rgba?\([^)]+\))/);
  const accentMatch = rawHtml.match(/--color-accent:\s*(#[0-9a-fA-F]{3,8}|rgba?\([^)]+\))/);
  const bgMatch = rawHtml.match(/--color-bg:\s*(#[0-9a-fA-F]{3,8}|rgba?\([^)]+\))/);
  const textMatch = rawHtml.match(/--color-text:\s*(#[0-9a-fA-F]{3,8}|rgba?\([^)]+\))/);

  // Ensure default fonts or tailwind fallback in head if empty
  if (!headHtml.includes('fonts.googleapis.com') && !headHtml.includes('font-family')) {
    headHtml += `
      <link rel="preconnect" href="https://fonts.googleapis.com">
      <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
      <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
    `;
  }

  return {
    title,
    headHtml,
    slides: slides.length > 0 ? slides : [createDefaultSlide(1)],
    globalStyles: '',
    headerHtml,
    footerHtml,
    containerClass,
    containerStyle,
    viewportClass,
    viewportStyle,
    scriptContent,
    theme: {
      primaryColor: primaryMatch ? primaryMatch[1] : '#002b66',
      accentColor: accentMatch ? accentMatch[1] : '#e31c2d',
      bgColor: bgMatch ? bgMatch[1] : '#f8fafc',
      textColor: textMatch ? textMatch[1] : '#0f172a',
      fontFamily: 'Inter, sans-serif',
    },
  };
}

/**
 * Creates an empty default slide with high standard design
 */
export function createDefaultSlide(index = 1, title = 'Novo Slide'): SlideData {
  return {
    id: generateId('slide'),
    title: `${title} ${index}`,
    tagName: 'section',
    className: 'slide-item p-12 bg-white text-slate-800 flex flex-col justify-between min-h-[560px] rounded-xl shadow-lg border border-slate-100',
    style: 'font-family: "Plus Jakarta Sans", sans-serif;',
    attributes: {},
    htmlContent: `
      <div class="mb-6">
        <span class="text-xs uppercase tracking-wider font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full">Seção 0${index}</span>
        <h2 class="text-3xl font-extrabold text-slate-900 mt-3">${title}</h2>
        <p class="text-slate-500 text-sm mt-1">Clique duas vezes em qualquer texto para editar diretamente ou use a barra lateral para estilizar.</p>
      </div>
      <div class="grid grid-cols-2 gap-6 my-auto">
        <div class="p-6 bg-slate-50 rounded-xl border border-slate-200">
          <h3 class="text-lg font-bold text-slate-800 mb-2">Tópico Principal A</h3>
          <p class="text-sm text-slate-600">Insira aqui os dados, insights ou pontos-chave que você quer apresentar para a sua equipe.</p>
        </div>
        <div class="p-6 bg-slate-50 rounded-xl border border-slate-200">
          <h3 class="text-lg font-bold text-slate-800 mb-2">Tópico Principal B</h3>
          <p class="text-sm text-slate-600">Adicione métricas, estatísticas ou passos de ação com apoio visual e facilidade de leitura.</p>
        </div>
      </div>
      <div class="pt-6 border-t border-slate-100 flex justify-between items-center text-xs text-slate-400">
        <span>SlideStudio HTML</span>
        <span>Slide ${index}</span>
      </div>
    `.trim(),
  };
}

/**
 * Creates a clean blank presentation with 1 starter slide
 */
export function createBlankPresentation(): PresentationDoc {
  const initialSlide = createDefaultSlide(1, 'Slide Inicial');
  return {
    title: 'Apresentação em Branco',
    headHtml: `
      <link rel="preconnect" href="https://fonts.googleapis.com">
      <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
      <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
    `.trim(),
    slides: [initialSlide],
    globalStyles: '',
    headerHtml: '',
    footerHtml: '',
    containerClass: '',
    containerStyle: '',
    viewportClass: '',
    viewportStyle: '',
    scriptContent: '',
    theme: {
      primaryColor: '#2563eb',
      accentColor: '#3b82f6',
      bgColor: '#ffffff',
      textColor: '#0f172a',
      fontFamily: 'Inter, sans-serif',
    },
  };
}

/**
 * Serializes the complete presentation document into a self-contained, offline-ready HTML file
 */
export function serializePresentationToHtml(doc: PresentationDoc): string {
  const commonMobileStyles = `
    /* ========================================================
       SLIDESTUDIO FULL RESPONSIVE MOBILE ENGINE
       ======================================================== */
    @media (max-width: 768px), screen and (max-device-width: 768px) {
      body {
        overflow-x: hidden !important;
        overflow-y: auto !important;
        -webkit-overflow-scrolling: touch;
      }
      #presentation-viewport, .presentation-container, .deck-container {
        display: block !important;
        width: 100vw !important;
        height: auto !important;
        min-height: 100vh !important;
        overflow-y: auto !important;
        overflow-x: hidden !important;
        padding: 0 !important;
      }
      #presentation-scaler {
        width: 100% !important;
        max-width: 100vw !important;
        height: auto !important;
        min-height: 100vh !important;
        transform: none !important;
        margin: 0 !important;
        position: relative !important;
      }
      .presentation-slide, .slide {
        width: 100% !important;
        max-width: 100vw !important;
        height: auto !important;
        min-height: 100vh !important;
        position: relative !important;
        border-radius: 0 !important;
        box-shadow: none !important;
        padding: 16px 14px 84px 14px !important;
        box-sizing: border-box !important;
        overflow-y: auto !important;
        overflow-x: hidden !important;
      }
      .presentation-slide.active-slide, .slide.active {
        display: flex !important;
        flex-direction: column !important;
        opacity: 1 !important;
      }
      .slide-viewport, main, .deck-container {
        height: auto !important;
        min-height: 100vh !important;
        overflow: visible !important;
        width: 100% !important;
        max-width: 100vw !important;
      }
      .slide-content {
        height: auto !important;
        min-height: auto !important;
        overflow: visible !important;
        gap: 12px !important;
        display: flex !important;
        flex-direction: column !important;
      }
      .slide-cover {
        height: auto !important;
        min-height: 100% !important;
        padding: 16px 12px 24px 12px !important;
        display: flex !important;
        flex-direction: column !important;
        justify-content: flex-start !important;
        align-items: center !important;
        text-align: center !important;
        gap: 12px !important;
        box-sizing: border-box !important;
      }
      .cover-title {
        font-size: 1.45rem !important;
        line-height: 1.25 !important;
        max-width: 100% !important;
      }
      .cover-subtitle {
        font-size: 0.85rem !important;
        line-height: 1.4 !important;
        max-width: 100% !important;
      }

      /* Automatic Multi-Column Grid Collapse to 1 Column */
      .grid, [class*="grid-cols-"] {
        grid-template-columns: 1fr !important;
        gap: 10px !important;
      }
      .kpi-row, .kpi-row-6, .cover-grid, .kpi-grid {
        grid-template-columns: repeat(2, 1fr) !important;
        gap: 8px !important;
      }
      [class*="col-span-"] {
        grid-column: span 1 / span 1 !important;
      }
      .split-view, .split-view-equal {
        display: flex !important;
        flex-direction: column !important;
        gap: 12px !important;
        height: auto !important;
      }
      .flex-row:not(.mobile-keep-row) {
        flex-direction: column !important;
      }
      .kpi-card {
        padding: 10px 12px !important;
        min-width: 0 !important;
      }
      .kpi-val {
        font-size: 1.35rem !important;
        line-height: 1.2 !important;
      }
      .card, .metric-card, .chart-card {
        width: 100% !important;
        max-width: 100% !important;
        box-sizing: border-box !important;
        height: auto !important;
      }
      .table-container {
        max-height: 380px !important;
        width: 100% !important;
        overflow-x: auto !important;
        -webkit-overflow-scrolling: touch;
      }
      .chart-container {
        height: 210px !important;
        min-height: 210px !important;
        width: 100% !important;
      }
      img {
        max-width: 100% !important;
        height: auto !important;
      }
      h1 { font-size: 1.5rem !important; line-height: 1.25 !important; }
      h2 { font-size: 1.25rem !important; line-height: 1.3 !important; }
      h3 { font-size: 1.1rem !important; line-height: 1.35 !important; }
      .text-4xl, .text-5xl, .text-6xl { font-size: 1.75rem !important; line-height: 1.2 !important; }
      .text-2xl, .text-3xl { font-size: 1.35rem !important; line-height: 1.25 !important; }

      /* Mobile Navigation Floating Bar */
      .nav-controls, .footer-bar {
        position: fixed !important;
        bottom: 12px !important;
        left: 50% !important;
        transform: translateX(-50%) !important;
        right: auto !important;
        width: calc(100vw - 24px) !important;
        max-width: 440px !important;
        display: flex !important;
        align-items: center !important;
        justify-content: space-between !important;
        padding: 6px 12px !important;
        background: rgba(15, 23, 42, 0.92) !important;
        backdrop-filter: blur(12px) !important;
        border-radius: 9999px !important;
        border: 1px solid rgba(255, 255, 255, 0.18) !important;
        box-shadow: 0 10px 30px rgba(0,0,0,0.45) !important;
        z-index: 99999 !important;
      }
      .nav-controls button, .footer-bar button {
        padding: 6px 12px !important;
        font-size: 13px !important;
      }
      .nav-counter, #slideCounter {
        font-size: 12px !important;
      }
    }

    /* Force Mobile Mode Class (when user clicks mobile switcher on desktop) */
    body.force-mobile-mode #presentation-viewport,
    body.force-mobile-mode .presentation-container {
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      background: #0b0f19 !important;
      padding: 16px !important;
    }
    body.force-mobile-mode #presentation-scaler,
    body.force-mobile-mode .presentation-container > * {
      width: 390px !important;
      max-width: 390px !important;
      height: 844px !important;
      max-height: 90vh !important;
      border-radius: 40px !important;
      border: 4px solid #1e293b !important;
      box-shadow: 0 25px 60px rgba(0,0,0,0.6) !important;
      transform: none !important;
      overflow-y: auto !important;
      overflow-x: hidden !important;
      background: #ffffff !important;
    }
    body.force-mobile-mode .presentation-slide,
    body.force-mobile-mode .slide {
      width: 100% !important;
      height: auto !important;
      min-height: 100% !important;
      border-radius: 0 !important;
      box-shadow: none !important;
      padding: 20px 14px 70px 14px !important;
      position: relative !important;
    }
    body.force-mobile-mode .grid,
    body.force-mobile-mode [class*="grid-cols-"] {
      grid-template-columns: 1fr !important;
      gap: 10px !important;
    }
    body.force-mobile-mode .kpi-row,
    body.force-mobile-mode .cover-grid {
      grid-template-columns: repeat(2, 1fr) !important;
    }
    body.force-mobile-mode [class*="col-span-"] {
      grid-column: span 1 / span 1 !important;
    }
    body.force-mobile-mode .split-view {
      flex-direction: column !important;
    }
    body.force-mobile-mode .card,
    body.force-mobile-mode .metric-card {
      width: 100% !important;
    }
  `;

  // Branch 1: Corporate Container / Header Frame (Casas Bahia format)
  if (doc.headerHtml) {
    const slidesHtml = doc.slides
      .map((slide, index) => {
        const attrs = Object.entries(slide.attributes || {})
          .map(([k, v]) => `${k}="${v}"`)
          .join(' ');

        return `
      <!-- SLIDE ${index + 1}: ${slide.title} -->
      <${slide.tagName} id="${slide.id}" class="${slide.className || 'slide'} ${index === 0 ? 'active' : ''}" style="${slide.style || ''}" ${attrs}>
        ${slide.htmlContent}
      </${slide.tagName}>`;
      })
      .join('\n\n');

    return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes">
  <title>${doc.title || 'Apresentação em Slides'}</title>
  
  <!-- Tailwind CSS CDN para renderização utilitária de ponta -->
  <script src="https://cdn.tailwindcss.com"></script>
  <!-- Chart.js para renderização interativa de gráficos corporativos -->
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>

  ${doc.headHtml || ''}

  <style>
    *, *::before, *::after {
      box-sizing: border-box;
    }
    html, body {
      margin: 0;
      padding: 0;
      width: 100%;
      height: 100%;
      background: #f8fafc;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    }
    .presentation-container {
      display: flex;
      flex-direction: column;
      height: 100vh;
      overflow: hidden;
      width: 100vw;
    }
    .slide {
      display: none;
      width: 100%;
      height: 100%;
      opacity: 0;
      transition: opacity 0.2s ease-in-out;
    }
    .slide.active {
      display: flex;
      flex-direction: column;
      opacity: 1;
    }

    @keyframes ss-fade-in { from { opacity: 0; } to { opacity: 1; } }
    @keyframes ss-slide-up { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes ss-slide-down { from { opacity: 0; transform: translateY(-30px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes ss-slide-left { from { opacity: 0; transform: translateX(30px); } to { opacity: 1; transform: translateX(0); } }
    @keyframes ss-slide-right { from { opacity: 0; transform: translateX(-30px); } to { opacity: 1; transform: translateX(0); } }
    @keyframes ss-zoom-in { from { opacity: 0; transform: scale(0.84); } to { opacity: 1; transform: scale(1); } }
    @keyframes ss-zoom-out { from { opacity: 0; transform: scale(1.16); } to { opacity: 1; transform: scale(1); } }
    @keyframes ss-bounce-in { 0% { opacity: 0; transform: scale(0.35); } 50% { opacity: 1; transform: scale(1.05); } 75% { transform: scale(0.96); } 100% { opacity: 1; transform: scale(1); } }

    ${commonMobileStyles}
    ${doc.globalStyles || ''}
  </style>
</head>
<body>

  <div class="presentation-container ${doc.containerClass || ''}" style="${doc.containerStyle || ''}">
    ${doc.headerHtml || ''}

    <main class="slide-viewport ${doc.viewportClass || ''}" style="${doc.viewportStyle || ''}">
${slidesHtml}
    </main>

    ${doc.footerHtml || `
    <footer class="footer-bar" style="height:48px; display:flex; align-items:center; justify-content:space-between; padding:0 24px; font-size:12px; background:#ffffff; border-top:1px solid #e2e8f0;">
      <div style="color:#64748b;" class="hidden sm:block">Navegação: ◀ ▶, Espaço ou Arraste no celular</div>
      <div id="slideCounter" style="font-weight:700; color:#0f172a;">Slide 1 de ${doc.slides.length}</div>
      <div style="display:flex; gap:8px; align-items:center;">
        <button id="prevBtn" style="padding:6px 12px; cursor:pointer; background:#f1f5f9; border:1px solid #cbd5e1; border-radius:6px; font-weight:600;">❮ Anterior</button>
        <button id="deviceToggleBtn" style="padding:6px 10px; cursor:pointer; background:#e0f2fe; color:#0369a1; border:1px solid #bae6fd; border-radius:6px; font-weight:600; display:flex; align-items:center; gap:4px;">📱 Mobile</button>
        <button id="nextBtn" style="padding:6px 12px; cursor:pointer; background:#0066cc; color:#fff; border:none; border-radius:6px; font-weight:600;">Próximo ❯</button>
      </div>
    </footer>`}
  </div>

  <script>
    (function() {
      let currentSlide = 0;
      const slides = document.querySelectorAll('.slide');
      const totalSlides = slides.length;
      const prevBtn = document.getElementById('prevBtn') || document.getElementById('btn-prev');
      const nextBtn = document.getElementById('nextBtn') || document.getElementById('btn-next');
      const slideCounter = document.getElementById('slideCounter') || document.getElementById('slide-counter') || document.querySelector('.slide-counter');
      const progressBar = document.getElementById('progressBar') || document.querySelector('.progress-bar');
      const deviceToggleBtn = document.getElementById('deviceToggleBtn') || document.getElementById('btn-device');
      const fullscreenBtn = document.getElementById('fullscreenBtn') || document.getElementById('btn-fullscreen');

      const CHART_PRESETS = ${JSON.stringify(BUILTIN_CHART_PRESETS)};

      function initSlideCharts(slideEl) {
        if (!slideEl || typeof Chart === 'undefined') return;
        const canvases = slideEl.querySelectorAll('canvas');
        canvases.forEach(function(canvas) {
          try {
            const existing = Chart.getChart(canvas);
            if (existing) {
              existing.resize();
              return;
            }
            let config = null;
            const dataAttr = canvas.getAttribute('data-chart-data');
            if (dataAttr) {
              try { config = JSON.parse(dataAttr); } catch(e) {}
            }
            if (!config && canvas.id && CHART_PRESETS[canvas.id]) {
              config = JSON.parse(JSON.stringify(CHART_PRESETS[canvas.id]));
            }
            if (!config && canvas.getAttribute('data-chart') && CHART_PRESETS[canvas.getAttribute('data-chart')]) {
              config = JSON.parse(JSON.stringify(CHART_PRESETS[canvas.getAttribute('data-chart')]));
            }
            if (config) {
              if (canvas.parentElement && canvas.parentElement.clientHeight === 0) {
                canvas.parentElement.style.minHeight = '220px';
              }
              new Chart(canvas, {
                type: config.type,
                data: config.data,
                options: Object.assign({
                  responsive: true,
                  maintainAspectRatio: false,
                  animation: { duration: 350 },
                }, config.options || {})
              });
            }
          } catch(err) {
            console.warn('Erro ao inicializar gráfico na apresentação:', err);
          }
        });
      }

      function triggerSlideAnimations(slideEl) {
        if (!slideEl) return;
        const animatedEls = slideEl.querySelectorAll('[data-animate]');
        animatedEls.forEach(function(el) {
          const anim = el.getAttribute('data-animate');
          if (!anim || anim === 'none') return;
          const dur = el.getAttribute('data-animate-duration') || '0.6s';
          const delay = el.getAttribute('data-animate-delay') || '0s';
          const easing = el.getAttribute('data-animate-easing') || 'cubic-bezier(0.16, 1, 0.3, 1)';
          const kf = 'ss-' + (anim === 'zoom' ? 'zoom-in' : anim);
          el.style.animation = 'none';
          void el.offsetWidth;
          el.style.animation = kf + ' ' + dur + ' ' + easing + ' ' + delay + ' both';
        });
      }

      function updateSlide(index) {
        if (index < 0 || index >= totalSlides) return;
        slides[currentSlide]?.classList.remove('active');
        currentSlide = index;
        const activeSlide = slides[currentSlide];
        activeSlide?.classList.add('active');
        triggerSlideAnimations(activeSlide);
        setTimeout(function() { initSlideCharts(activeSlide); }, 40);
        if (slideCounter) slideCounter.textContent = 'Slide ' + (currentSlide + 1) + ' de ' + totalSlides;
        if (progressBar) progressBar.style.width = (((currentSlide + 1) / totalSlides) * 100) + '%';
        if (prevBtn) prevBtn.disabled = (currentSlide === 0);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }

      // Expose globally for inline onclick="changeSlide(1)" and onclick="toggleFullScreen()"
      window.changeSlide = function(delta) {
        updateSlide(currentSlide + delta);
      };
      window.goToSlide = function(index) {
        updateSlide(index);
      };
      window.toggleFullScreen = function() {
        if (!document.fullscreenElement) {
          document.documentElement.requestFullscreen().catch(function() {});
        } else {
          document.exitFullscreen().catch(function() {});
        }
      };

      if (prevBtn) prevBtn.addEventListener('click', () => updateSlide(currentSlide - 1));
      if (nextBtn) nextBtn.addEventListener('click', () => updateSlide((currentSlide + 1) % totalSlides));
      if (fullscreenBtn) fullscreenBtn.addEventListener('click', window.toggleFullScreen);

      // Support interactive tabs (.tab-btn)
      document.addEventListener('click', function(e) {
        const tabBtn = e.target.closest('.tab-btn');
        if (tabBtn) {
          const container = tabBtn.closest('.tabs-container') || tabBtn.closest('.slide') || document;
          container.querySelectorAll('.tab-btn').forEach(function(b) { b.classList.remove('active'); });
          tabBtn.classList.add('active');
          const targetId = tabBtn.getAttribute('data-target');
          if (targetId) {
            container.querySelectorAll('.tab-content').forEach(function(c) { c.classList.remove('active'); });
            const targetEl = container.querySelector('#' + targetId);
            if (targetEl) targetEl.classList.add('active');
          }
        }
      });

      // Device Switcher
      if (deviceToggleBtn) {
        deviceToggleBtn.addEventListener('click', () => {
          document.body.classList.toggle('force-mobile-mode');
          const isForced = document.body.classList.contains('force-mobile-mode');
          deviceToggleBtn.textContent = isForced ? '🖥️ Desktop' : '📱 Mobile';
          if (slides[currentSlide]) {
            setTimeout(function() { initSlideCharts(slides[currentSlide]); }, 60);
          }
        });
      }

      window.addEventListener('resize', function() {
        if (slides[currentSlide]) {
          initSlideCharts(slides[currentSlide]);
        }
      });

      // Touch Swipe Gestures for Mobile
      let touchStartX = 0;
      let touchStartY = 0;
      document.addEventListener('touchstart', (e) => {
        if (e.touches && e.touches.length > 0) {
          touchStartX = e.touches[0].clientX;
          touchStartY = e.touches[0].clientY;
        }
      }, { passive: true });

      document.addEventListener('touchend', (e) => {
        if (e.changedTouches && e.changedTouches.length > 0) {
          const dx = e.changedTouches[0].clientX - touchStartX;
          const dy = e.changedTouches[0].clientY - touchStartY;
          if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy) * 1.5) {
            if (dx < 0) updateSlide((currentSlide + 1) % totalSlides); // Swipe Left -> Next
            else updateSlide(currentSlide - 1); // Swipe Right -> Prev
          }
        }
      }, { passive: true });

      document.addEventListener('keydown', (e) => {
        if (['ArrowRight', ' ', 'PageDown'].includes(e.key)) updateSlide((currentSlide + 1) % totalSlides);
        if (['ArrowLeft', 'PageUp'].includes(e.key)) updateSlide(currentSlide - 1);
      });

      function start() {
        updateSlide(0);
        setTimeout(function() {
          if (slides[0]) initSlideCharts(slides[0]);
        }, 80);
      }

      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', start);
      } else {
        start();
      }
    })();
  </script>
</body>
</html>`;
  }

  // Branch 2: Standard Slide Format
  const slidesHtml = doc.slides
    .map((slide, index) => {
      const attrs = Object.entries(slide.attributes || {})
        .map(([k, v]) => `${k}="${v}"`)
        .join(' ');

      return `
    <${slide.tagName} id="${slide.id}" class="presentation-slide ${slide.className}" style="${slide.style}" data-slide-index="${index}" ${attrs}>
      ${slide.htmlContent}
    </${slide.tagName}>`;
    })
    .join('\n\n');

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes">
  <title>${doc.title || 'Apresentação em Slides'}</title>
  
  <!-- Tailwind CSS CDN para renderização perfeita de estilos utilitários -->
  <script src="https://cdn.tailwindcss.com"></script>
  <!-- Chart.js para renderização interativa de gráficos -->
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
  
  ${doc.headHtml || ''}

  <style>
    /* Reset & Base Presentation Styles */
    *, *::before, *::after {
      box-sizing: border-box;
    }
    html, body {
      margin: 0;
      padding: 0;
      width: 100%;
      height: 100%;
      background: #090d16;
      color: #0f172a;
      overflow: hidden;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    }

    #presentation-viewport {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 100vw;
      height: 100vh;
      position: relative;
      overflow: hidden;
    }

    #presentation-scaler {
      width: 1280px;
      height: 720px;
      position: relative;
      transform-origin: center center;
      flex-shrink: 0;
      transition: transform 0.15s ease-out;
    }

    .presentation-slide {
      display: none;
      width: 1280px;
      height: 720px;
      position: absolute;
      top: 0;
      left: 0;
      overflow: hidden;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.45);
      border-radius: 16px;
      transition: opacity 0.2s ease-in-out;
      opacity: 0;
      background: #ffffff;
    }

    .presentation-slide.active-slide {
      display: flex;
      flex-direction: column;
      opacity: 1;
    }

    /* SlideStudio Entry Keyframes */
    @keyframes ss-fade-in { from { opacity: 0; } to { opacity: 1; } }
    @keyframes ss-slide-up { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes ss-slide-down { from { opacity: 0; transform: translateY(-30px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes ss-slide-left { from { opacity: 0; transform: translateX(30px); } to { opacity: 1; transform: translateX(0); } }
    @keyframes ss-slide-right { from { opacity: 0; transform: translateX(-30px); } to { opacity: 1; transform: translateX(0); } }
    @keyframes ss-zoom-in { from { opacity: 0; transform: scale(0.84); } to { opacity: 1; transform: scale(1); } }
    @keyframes ss-zoom-out { from { opacity: 0; transform: scale(1.16); } to { opacity: 1; transform: scale(1); } }
    @keyframes ss-bounce-in { 0% { opacity: 0; transform: scale(0.35); } 50% { opacity: 1; transform: scale(1.05); } 75% { transform: scale(0.96); } 100% { opacity: 1; transform: scale(1); } }

    /* Navigation Controls overlay */
    .nav-controls {
      position: fixed;
      bottom: 24px;
      right: 24px;
      display: flex;
      align-items: center;
      gap: 8px;
      z-index: 9999;
      background: rgba(15, 23, 42, 0.88);
      backdrop-filter: blur(12px);
      padding: 6px 14px;
      border-radius: 9999px;
      border: 1px solid rgba(255, 255, 255, 0.18);
      box-shadow: 0 10px 30px rgba(0,0,0,0.4);
    }
    .nav-controls button {
      background: transparent;
      border: none;
      color: #ffffff;
      padding: 6px 10px;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      border-radius: 6px;
      transition: background 0.15s;
      display: flex;
      align-items: center;
      gap: 4px;
    }
    .nav-controls button:hover {
      background: rgba(255, 255, 255, 0.2);
    }
    .nav-counter {
      color: #cbd5e1;
      display: flex;
      align-items: center;
      padding: 0 8px;
      font-size: 13px;
      font-weight: 600;
      font-family: monospace;
    }

    /* Print / PDF Export Styles */
    @media print {
      body, #presentation-viewport, #presentation-scaler {
        background: transparent !important;
        height: auto !important;
        overflow: visible !important;
        display: block !important;
        transform: none !important;
        width: 100% !important;
      }
      .nav-controls {
        display: none !important;
      }
      .presentation-slide {
        display: flex !important;
        opacity: 1 !important;
        position: relative !important;
        page-break-after: always !important;
        break-after: page !important;
        width: 100% !important;
        height: 100vh !important;
        max-width: none !important;
        max-height: none !important;
        box-shadow: none !important;
        border-radius: 0 !important;
        border: none !important;
        margin: 0 !important;
      }
    }

    ${commonMobileStyles}
    ${doc.globalStyles || ''}
  </style>
</head>
<body>

  <div id="presentation-viewport">
    <div id="presentation-scaler">
      ${slidesHtml}
    </div>
  </div>

  <div class="nav-controls">
    <button id="btn-prev" title="Slide Anterior (Seta Esquerda)">❮</button>
    <div id="slide-indicator" class="nav-counter">1 / ${doc.slides.length}</div>
    <button id="btn-next" title="Próximo Slide (Seta Direita / Espaço)">❯</button>
    <button id="btn-device" title="Alternar entre visualização Desktop (16:9) e Mobile (Smartphone)">📱 Mobile</button>
    <button id="btn-fullscreen" title="Tela Cheia (F)">⛶</button>
  </div>

  <script>
    (function() {
      const slides = document.querySelectorAll('.presentation-slide');
      const indicator = document.getElementById('slide-indicator');
      const btnPrev = document.getElementById('btn-prev');
      const btnNext = document.getElementById('btn-next');
      const btnFullscreen = document.getElementById('btn-fullscreen');
      const btnDevice = document.getElementById('btn-device');
      const scaler = document.getElementById('presentation-scaler');
      let currentIndex = 0;

      // Auto-fit scale calculator for desktop resolution
      function scaleToFit() {
        if (!scaler) return;
        if (window.innerWidth <= 768 || document.body.classList.contains('force-mobile-mode')) {
          scaler.style.transform = 'none';
          return;
        }
        const availW = window.innerWidth * 0.96;
        const availH = window.innerHeight * 0.92;
        const scale = Math.min(availW / 1280, availH / 720);
        scaler.style.transform = 'scale(' + scale + ')';
      }
      window.addEventListener('resize', scaleToFit);
      scaleToFit();

      function triggerSlideAnimations(slideEl) {
        if (!slideEl) return;
        const animatedEls = slideEl.querySelectorAll('[data-animate]');
        animatedEls.forEach(function(el) {
          const anim = el.getAttribute('data-animate');
          if (!anim || anim === 'none') return;
          const dur = el.getAttribute('data-animate-duration') || '0.6s';
          const delay = el.getAttribute('data-animate-delay') || '0s';
          const easing = el.getAttribute('data-animate-easing') || 'cubic-bezier(0.16, 1, 0.3, 1)';
          const kf = 'ss-' + (anim === 'zoom' ? 'zoom-in' : anim);
          el.style.animation = 'none';
          void el.offsetWidth;
          el.style.animation = kf + ' ' + dur + ' ' + easing + ' ' + delay + ' both';
        });
      }

      const CHART_PRESETS = ${JSON.stringify(BUILTIN_CHART_PRESETS)};

      function initSlideCharts(slideEl) {
        if (!slideEl || typeof Chart === 'undefined') return;
        const canvases = slideEl.querySelectorAll('canvas');
        canvases.forEach(function(canvas) {
          try {
            const existing = Chart.getChart(canvas);
            if (existing) {
              existing.resize();
              return;
            }
            let config = null;
            const dataAttr = canvas.getAttribute('data-chart-data');
            if (dataAttr) {
              try { config = JSON.parse(dataAttr); } catch(e) {}
            }
            if (!config && canvas.id && CHART_PRESETS[canvas.id]) {
              config = JSON.parse(JSON.stringify(CHART_PRESETS[canvas.id]));
            }
            if (!config && canvas.getAttribute('data-chart') && CHART_PRESETS[canvas.getAttribute('data-chart')]) {
              config = JSON.parse(JSON.stringify(CHART_PRESETS[canvas.getAttribute('data-chart')]));
            }
            if (config) {
              if (canvas.parentElement && canvas.parentElement.clientHeight === 0) {
                canvas.parentElement.style.minHeight = '220px';
              }
              new Chart(canvas, {
                type: config.type,
                data: config.data,
                options: Object.assign({
                  responsive: true,
                  maintainAspectRatio: false,
                  animation: { duration: 350 },
                }, config.options || {})
              });
            }
          } catch(err) {
            console.warn('Erro ao inicializar gráfico na apresentação:', err);
          }
        });
      }

      function updateSlide(index) {
        if (index < 0) index = 0;
        if (index >= slides.length) index = slides.length - 1;
        currentIndex = index;

        slides.forEach((slide, i) => {
          if (i === currentIndex) {
            slide.classList.add('active-slide');
            triggerSlideAnimations(slide);
            setTimeout(function() { initSlideCharts(slide); }, 40);
          } else {
            slide.classList.remove('active-slide');
          }
        });

        if (indicator) {
          indicator.textContent = (currentIndex + 1) + ' / ' + slides.length;
        }
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }

      window.changeSlide = function(delta) {
        updateSlide(currentIndex + delta);
      };
      window.goToSlide = function(index) {
        updateSlide(index);
      };
      window.toggleFullScreen = function() {
        if (!document.fullscreenElement) {
          document.documentElement.requestFullscreen().catch(() => {});
        } else {
          document.exitFullscreen().catch(() => {});
        }
      };

      // Support interactive tabs (.tab-btn)
      document.addEventListener('click', function(e) {
        const tabBtn = e.target.closest('.tab-btn');
        if (tabBtn) {
          const container = tabBtn.closest('.tabs-container') || tabBtn.closest('.presentation-slide') || document;
          container.querySelectorAll('.tab-btn').forEach(function(b) { b.classList.remove('active'); });
          tabBtn.classList.add('active');
          const targetId = tabBtn.getAttribute('data-target');
          if (targetId) {
            container.querySelectorAll('.tab-content').forEach(function(c) { c.classList.remove('active'); });
            const targetEl = container.querySelector('#' + targetId);
            if (targetEl) targetEl.classList.add('active');
          }
        }
      });

      // Initialize
      function start() {
        updateSlide(0);
        setTimeout(function() { if (slides[0]) initSlideCharts(slides[0]); }, 100);
      }

      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', start);
      } else {
        start();
      }

      window.addEventListener('resize', function() {
        if (slides[currentIndex]) {
          initSlideCharts(slides[currentIndex]);
        }
      });

      btnPrev?.addEventListener('click', () => updateSlide(currentIndex - 1));
      btnNext?.addEventListener('click', () => updateSlide(currentIndex + 1));

      // Device Switcher
      btnDevice?.addEventListener('click', () => {
        document.body.classList.toggle('force-mobile-mode');
        const isForced = document.body.classList.contains('force-mobile-mode');
        btnDevice.textContent = isForced ? '🖥️ Desktop' : '📱 Mobile';
        scaleToFit();
        if (slides[currentIndex]) {
          setTimeout(function() { initSlideCharts(slides[currentIndex]); }, 60);
        }
      });

      // Touch Swipe Gestures
      let touchStartX = 0;
      let touchStartY = 0;
      window.addEventListener('touchstart', (e) => {
        if (e.touches && e.touches.length > 0) {
          touchStartX = e.touches[0].clientX;
          touchStartY = e.touches[0].clientY;
        }
      }, { passive: true });

      window.addEventListener('touchend', (e) => {
        if (e.changedTouches && e.changedTouches.length > 0) {
          const dx = e.changedTouches[0].clientX - touchStartX;
          const dy = e.changedTouches[0].clientY - touchStartY;
          if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy) * 1.5) {
            if (dx < 0) updateSlide(currentIndex + 1); // Swipe Left -> Next
            else updateSlide(currentIndex - 1); // Swipe Right -> Prev
          }
        }
      }, { passive: true });

      btnFullscreen?.addEventListener('click', window.toggleFullScreen);

      // Keyboard Controls
      window.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'PageDown') {
          e.preventDefault();
          updateSlide(currentIndex + 1);
        } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
          e.preventDefault();
          updateSlide(currentIndex - 1);
        } else if (e.key === 'f' || e.key === 'F') {
          window.toggleFullScreen();
        } else if (e.key === 'Home') {
          e.preventDefault();
          updateSlide(0);
        } else if (e.key === 'End') {
          e.preventDefault();
          updateSlide(slides.length - 1);
        }
      });
    })();
  </script>
</body>
</html>`;
}

/**
 * Built-in Sample Presentations so users can immediately test and enjoy the tool without having to upload
 */
export const SAMPLE_PRESENTATIONS: Record<string, { name: string; description: string; rawHtml: string }> = {
  casasBahia: {
    name: 'Casas Bahia - CX & NPS Regional 122',
    description: 'Diagnóstico analítico com 12 slides completos, evolução temporal, gráficos Chart.js responsivos, dispersão de lojas e 5W2H.',
    rawHtml: CASAS_BAHIA_HTML,
  },
  executive: {
    name: 'Relatório Executivo Q3',
    description: 'Relatório trimestral moderno com capa executiva, KPIs de receita, gráfico vetorial e metas.',
    rawHtml: `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Relatório de Desempenho Executivo - Q3 2026</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body style="font-family: 'Plus Jakarta Sans', sans-serif;">

  <!-- Slide 1: Cover -->
  <section class="slide p-14 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white flex flex-col justify-between min-h-[580px] rounded-2xl relative overflow-hidden shadow-2xl">
    <div class="absolute -right-20 -top-20 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none"></div>
    <div class="flex items-center justify-between z-10">
      <div class="flex items-center gap-3">
        <div class="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center font-bold text-white shadow-lg shadow-blue-500/30">▲</div>
        <span class="text-sm font-semibold tracking-wide text-indigo-200 uppercase">Nexus Strategic Global</span>
      </div>
      <span class="text-xs font-medium px-3 py-1 bg-white/10 rounded-full border border-white/10 text-indigo-200">Confidencial • Q3 2026</span>
    </div>

    <div class="my-auto z-10 max-w-3xl">
      <span class="text-xs font-bold tracking-widest text-blue-400 uppercase mb-3 inline-block">Relatório de Desempenho & Resultados</span>
      <h1 class="text-5xl font-extrabold leading-tight text-white mb-6 tracking-tight">Expansão de Mercado & Aceleração Operacional</h1>
      <p class="text-lg text-slate-300 font-light leading-relaxed">
        Análise dos principais indicadores de crescimento, receita recorrente anual (ARR) e novos marcos de rentabilidade operacional do terceiro trimestre.
      </p>
    </div>

    <div class="pt-6 border-t border-white/10 flex justify-between items-center text-xs text-slate-400 z-10">
      <div>Apresentado por: <strong>Diretoria de Estratégia</strong></div>
      <div>São Paulo, Brasil • Setembro 2026</div>
    </div>
  </section>

  <!-- Slide 2: Metrics / KPIs -->
  <section class="slide p-12 bg-white text-slate-800 flex flex-col justify-between min-h-[580px] rounded-2xl border border-slate-100 shadow-xl">
    <div>
      <div class="flex items-center justify-between">
        <span class="text-xs font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-3 py-1 rounded-full">Painel Executivo</span>
        <span class="text-xs text-slate-400 font-medium">Atualizado em 28/09/2026</span>
      </div>
      <h2 class="text-3xl font-extrabold text-slate-900 mt-3">Indicadores Chave de Performance (KPIs)</h2>
      <p class="text-sm text-slate-500 mt-1">Superamos as metas projetadas em todas as três linhas estratégicas de negócio.</p>
    </div>

    <div class="grid grid-cols-3 gap-6 my-auto">
      <div class="p-6 bg-slate-50 rounded-2xl border border-slate-200/80 hover:border-blue-400 transition-all">
        <span class="text-xs font-bold uppercase text-slate-400">Receita Recorrente (ARR)</span>
        <div class="text-4xl font-extrabold text-slate-900 mt-2">R$ 14,8 M</div>
        <div class="flex items-center gap-1.5 mt-3 text-xs font-bold text-emerald-600">
          <span class="bg-emerald-100 px-2 py-0.5 rounded-full">▲ +24,2%</span>
          <span class="text-slate-500 font-normal">vs. trimestre anterior</span>
        </div>
      </div>

      <div class="p-6 bg-slate-50 rounded-2xl border border-slate-200/80 hover:border-blue-400 transition-all">
        <span class="text-xs font-bold uppercase text-slate-400">Margem EBITDA</span>
        <div class="text-4xl font-extrabold text-blue-600 mt-2">31,5%</div>
        <div class="flex items-center gap-1.5 mt-3 text-xs font-bold text-emerald-600">
          <span class="bg-emerald-100 px-2 py-0.5 rounded-full">▲ +4,8 p.p.</span>
          <span class="text-slate-500 font-normal">ganho de escala</span>
        </div>
      </div>

      <div class="p-6 bg-slate-50 rounded-2xl border border-slate-200/80 hover:border-blue-400 transition-all">
        <span class="text-xs font-bold uppercase text-slate-400">Net Retention Rate (NRR)</span>
        <div class="text-4xl font-extrabold text-slate-900 mt-2">118%</div>
        <div class="flex items-center gap-1.5 mt-3 text-xs font-bold text-emerald-600">
          <span class="bg-emerald-100 px-2 py-0.5 rounded-full">▲ +6%</span>
          <span class="text-slate-500 font-normal">expansão de carteira</span>
        </div>
      </div>
    </div>

    <div class="p-4 bg-blue-50/70 rounded-xl border border-blue-100 flex items-center justify-between text-xs text-blue-900">
      <span class="font-semibold">💡 Destaque Estratégico:</span>
      <span>A taxa de cancelamento (Churn anualizado) recuou para a mínima histórica de 1,2%.</span>
    </div>
  </section>

  <!-- Slide 3: Chart & Analysis -->
  <section class="slide p-12 bg-slate-900 text-white flex flex-col justify-between min-h-[580px] rounded-2xl border border-slate-800 shadow-2xl">
    <div class="flex justify-between items-start">
      <div>
        <span class="text-xs font-bold uppercase tracking-wider text-emerald-400 bg-emerald-950/60 border border-emerald-800 px-3 py-1 rounded-full">Evolução de Mercado</span>
        <h2 class="text-3xl font-extrabold text-white mt-3">Trajetória de Crescimento Trimestral</h2>
      </div>
      <div class="flex items-center gap-3 text-xs">
        <span class="flex items-center gap-1.5"><span class="w-3 h-3 bg-blue-500 rounded-sm"></span> Realizado</span>
        <span class="flex items-center gap-1.5"><span class="w-3 h-3 bg-slate-600 rounded-sm"></span> Meta Inicial</span>
      </div>
    </div>

    <div class="grid grid-cols-12 gap-8 items-center my-auto">
      <div class="col-span-7 bg-slate-800/80 p-6 rounded-2xl border border-slate-700">
        <!-- Modern SVG Bar Chart -->
        <svg viewBox="0 0 500 240" class="w-full h-auto">
          <!-- Grid lines -->
          <line x1="40" y1="40" x2="480" y2="40" stroke="#334155" stroke-dasharray="4" />
          <line x1="40" y1="100" x2="480" y2="100" stroke="#334155" stroke-dasharray="4" />
          <line x1="40" y1="160" x2="480" y2="160" stroke="#334155" stroke-dasharray="4" />
          <line x1="40" y1="210" x2="480" y2="210" stroke="#475569" stroke-width="1.5" />

          <!-- Q1 -->
          <rect x="75" y="130" width="30" height="80" rx="4" fill="#475569" opacity="0.6" />
          <rect x="110" y="115" width="30" height="95" rx="4" fill="#3b82f6" />
          <text x="107" y="230" fill="#94a3b8" font-size="12" text-anchor="middle">Q1 2026</text>

          <!-- Q2 -->
          <rect x="175" y="105" width="30" height="105" rx="4" fill="#475569" opacity="0.6" />
          <rect x="210" y="85" width="30" height="125" rx="4" fill="#3b82f6" />
          <text x="207" y="230" fill="#94a3b8" font-size="12" text-anchor="middle">Q2 2026</text>

          <!-- Q3 -->
          <rect x="275" y="80" width="30" height="130" rx="4" fill="#475569" opacity="0.6" />
          <rect x="310" y="50" width="30" height="160" rx="4" fill="#10b981" />
          <text x="307" y="230" fill="#94a3b8" font-size="12" text-anchor="middle">Q3 2026</text>

          <!-- Q4 Forecast -->
          <rect x="375" y="60" width="30" height="150" rx="4" fill="#475569" opacity="0.4" />
          <rect x="410" y="30" width="30" height="180" rx="4" fill="#6366f1" opacity="0.7" stroke-dasharray="3" />
          <text x="407" y="230" fill="#94a3b8" font-size="12" text-anchor="middle">Q4 (Proj)</text>
        </svg>
      </div>

      <div class="col-span-5 space-y-4">
        <div class="p-4 bg-slate-800/50 rounded-xl border border-slate-700/70">
          <h4 class="text-sm font-bold text-emerald-400">Eficiência de Aquisição</h4>
          <p class="text-xs text-slate-300 mt-1">CAC Payback reduzido de 14 para 9 meses graças a canais orgânicos e parcerias.</p>
        </div>
        <div class="p-4 bg-slate-800/50 rounded-xl border border-slate-700/70">
          <h4 class="text-sm font-bold text-blue-400">Aceleração B2B Enterprise</h4>
          <p class="text-xs text-slate-300 mt-1">Ticket médio por contrato expandiu 38% com adoção de produtos avançados.</p>
        </div>
      </div>
    </div>

    <div class="pt-4 border-t border-slate-800 text-xs text-slate-500 flex justify-between">
      <span>Fonte: Controladoria & BI</span>
      <span>Slide 3 de 4</span>
    </div>
  </section>

  <!-- Slide 4: Key Takeaways & Action Plan -->
  <section class="slide p-12 bg-white text-slate-800 flex flex-col justify-between min-h-[580px] rounded-2xl border border-slate-100 shadow-xl">
    <div>
      <span class="text-xs font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">Próximos Passos</span>
      <h2 class="text-3xl font-extrabold text-slate-900 mt-3">Plano de Ação para o Q4</h2>
      <p class="text-sm text-slate-500 mt-1">Três prioridades não-negociáveis para consolidar a liderança.</p>
    </div>

    <div class="grid grid-cols-3 gap-6 my-auto">
      <div class="p-6 rounded-2xl bg-gradient-to-b from-indigo-50/50 to-white border border-indigo-100">
        <div class="w-8 h-8 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-sm mb-4">1</div>
        <h3 class="text-base font-bold text-slate-900 mb-2">Expansão Internacional</h3>
        <p class="text-xs text-slate-600 leading-relaxed">Início das operações comerciais no México e Colômbia com equipe dedicada e parcerias locais.</p>
      </div>

      <div class="p-6 rounded-2xl bg-gradient-to-b from-blue-50/50 to-white border border-blue-100">
        <div class="w-8 h-8 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-sm mb-4">2</div>
        <h3 class="text-base font-bold text-slate-900 mb-2">Lançamento Suite IA</h3>
        <p class="text-xs text-slate-600 leading-relaxed">Disponibilização do módulo de automação inteligente e relatórios preditivos para a base.</p>
      </div>

      <div class="p-6 rounded-2xl bg-gradient-to-b from-emerald-50/50 to-white border border-emerald-100">
        <div class="w-8 h-8 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-sm mb-4">3</div>
        <h3 class="text-base font-bold text-slate-900 mb-2">Otimização de Infraestrutura</h3>
        <p class="text-xs text-slate-600 leading-relaxed">Migração de workloads para nuvem elástica gerando economia prevista de 18% em servidores.</p>
      </div>
    </div>

    <div class="pt-6 border-t border-slate-100 flex justify-between items-center text-xs text-slate-400">
      <span>SlideStudio Executive Report</span>
      <span class="font-medium text-slate-600">Obrigado pela atenção!</span>
    </div>
  </section>

</body>
</html>`,
  },
  pitchDeck: {
    name: 'Pitch Deck de Inovação & Startup',
    description: 'Apresentação impactante de captação de investimentos, proposta de valor e produto.',
    rawHtml: `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Pitch Deck - Lumina AI</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-black text-white font-sans">
  <section class="slide p-14 bg-gradient-to-tr from-zinc-950 via-purple-950 to-zinc-900 text-white flex flex-col justify-between min-h-[580px] rounded-2xl border border-zinc-800">
    <div class="flex justify-between items-center">
      <div class="text-lg font-bold tracking-tight text-purple-400">✦ LUMINA AI</div>
      <span class="text-xs bg-purple-500/20 text-purple-300 px-3 py-1 rounded-full border border-purple-500/30">Seed Round 2026</span>
    </div>
    <div class="my-auto max-w-2xl">
      <h1 class="text-5xl font-black tracking-tight leading-tight">Automatizando Relatórios Estratégicos com Agentes Inteligentes</h1>
      <p class="text-zinc-400 text-lg mt-4 font-light">Eliminando mais de 15 horas semanais gastas em formatação manual de slides por executivos.</p>
    </div>
    <div class="flex justify-between text-xs text-zinc-500 border-t border-zinc-800 pt-4">
      <span>lumina.ai</span>
      <span>Confidencial para Investidores</span>
    </div>
  </section>
  <section class="slide p-12 bg-zinc-900 text-white flex flex-col justify-between min-h-[580px] rounded-2xl border border-zinc-800">
    <div>
      <span class="text-xs uppercase font-bold tracking-wider text-rose-400 bg-rose-950/60 px-3 py-1 rounded-full border border-rose-800">O Problema</span>
      <h2 class="text-3xl font-extrabold mt-3">A Geração de Apresentações Está Quebrada</h2>
    </div>
    <div class="grid grid-cols-3 gap-6 my-auto">
      <div class="p-6 bg-zinc-800/80 rounded-xl border border-zinc-700">
        <div class="text-3xl font-bold text-rose-400 mb-2">12h+</div>
        <h4 class="font-bold text-sm">Tempo Desperdiçado</h4>
        <p class="text-xs text-zinc-400 mt-1">Profissionais perdem meio expediente tentando ajustar caixas de texto e alinhamentos.</p>
      </div>
      <div class="p-6 bg-zinc-800/80 rounded-xl border border-zinc-700">
        <div class="text-3xl font-bold text-amber-400 mb-2">78%</div>
        <h4 class="font-bold text-sm">Design Inconsistente</h4>
        <p class="text-xs text-zinc-400 mt-1">Apresentações não refletem a qualidade do trabalho executivo por falta de templates ágeis.</p>
      </div>
      <div class="p-6 bg-zinc-800/80 rounded-xl border border-zinc-700">
        <div class="text-3xl font-bold text-purple-400 mb-2">0 Flexibilidade</div>
        <h4 class="font-bold text-sm">Bloqueio de Código</h4>
        <p class="text-xs text-zinc-400 mt-1">Relatórios gerados por agentes de IA ficam estáticos em HTML sem ferramenta visual de ajuste.</p>
      </div>
    </div>
    <div class="text-xs text-zinc-500 border-t border-zinc-800 pt-4">Slide 2 de 2</div>
  </section>
</body>
</html>`,
  },
};
