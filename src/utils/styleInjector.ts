import { useEffect } from 'react';

/**
 * Normalizes and scopes raw CSS from uploaded presentation HTML files
 * so that:
 * 1. CSS variables defined in :root or html/body are available everywhere and inside .slidestudio-scope
 * 2. body / html rules (background, color, font-family) apply to the slide canvas and presentation frame without breaking the outer React application UI
 * 3. * universal reset (margin: 0; padding: 0;) is scoped to .slidestudio-scope so it doesn't strip padding from editor buttons/inputs
 * 4. .presentation-container expands to 100% of the virtual slide canvas instead of enforcing 100vw/100vh
 * 5. .slide active/visibility rules ensure the current slide is always visible and rendered in full fidelity
 */
export function scopePresentationCss(rawCss: string): string {
  if (!rawCss || typeof rawCss !== 'string') return '';

  let scoped = rawCss;

  // 0. Sanitize viewport units on container dimensions (100vw, 100vh, calc(100vh...))
  // Within the virtual canvas and presentation viewports, 100vw references the host browser screen (e.g. 1920px),
  // which blows out containers and slides, displacing content severely to the right and bottom.
  scoped = scoped.replace(/width\s*:\s*100vw\s*(!important)?\s*;/gi, 'width: 100% !important;');
  scoped = scoped.replace(/max-width\s*:\s*100vw\s*(!important)?\s*;/gi, 'max-width: 100% !important;');
  scoped = scoped.replace(/min-width\s*:\s*100vw\s*(!important)?\s*;/gi, 'min-width: 0 !important;');
  scoped = scoped.replace(/height\s*:\s*100vh\s*(!important)?\s*;/gi, 'height: 100% !important;');
  scoped = scoped.replace(/height\s*:\s*calc\s*\(\s*100vh[^;}]*\)\s*(!important)?\s*;/gi, 'height: 100% !important;');
  scoped = scoped.replace(/min-height\s*:\s*100vh\s*(!important)?\s*;/gi, 'min-height: 100% !important;');
  scoped = scoped.replace(/max-height\s*:\s*100vh\s*(!important)?\s*;/gi, 'max-height: 100% !important;');

  // 1. Keep :root intact and also declare on .slidestudio-scope for maximum variable cascading
  scoped = scoped.replace(/:root\s*\{/g, ':root, .slidestudio-scope {');

  // 2. Rewrite body and html, body selectors so background, font, and text color apply to presentation frames
  // without affecting the editor's body layout
  scoped = scoped.replace(/html\s*,\s*body\s*\{/g, '.slidestudio-canvas-stage, .presentation-container, body.in-presentation-mode {');
  scoped = scoped.replace(/(^|[\s,;{}])body\s*\{/g, '$1.slidestudio-canvas-stage, .presentation-container, .slidestudio-body-mock, body.in-presentation-mode {');

  // 3. Rewrite universal selector * so resets (box-sizing, margin:0, padding:0) apply only inside presentations
  scoped = scoped.replace(/(^|[\s,;{}])\*\s*\{/g, '$1.slidestudio-scope, .slidestudio-scope * {');

  // 4. Scope container rules so it fits the editor canvas base resolution
  scoped += `
    /* SlideStudio Virtual Stage Canonical Fixed Resolution */
    .slidestudio-virtual-stage:not(.slidestudio-mobile-mode) {
      width: 960px !important;
      height: 540px !important;
      min-width: 960px !important;
      min-height: 540px !important;
      max-width: 960px !important;
      max-height: 540px !important;
      transform-origin: top left !important;
      box-sizing: border-box !important;
    }

    .slidestudio-virtual-stage.slidestudio-mobile-mode {
      width: 390px !important;
      height: 844px !important;
      min-width: 390px !important;
      min-height: 844px !important;
      max-width: 390px !important;
      max-height: 844px !important;
      transform-origin: top left !important;
      box-sizing: border-box !important;
    }

    /* Inner Presentation Container & Deck Overrides to fill virtual canvas completely without displacement */
    .slidestudio-virtual-stage .presentation-container,
    .slidestudio-virtual-stage .deck-container,
    .slidestudio-virtual-stage .presentation-wrapper,
    .slidestudio-virtual-stage .slides-container,
    .slidestudio-virtual-stage .slidestudio-viewport,
    .slidestudio-virtual-stage .slide-viewport,
    .slidestudio-virtual-stage main,
    .slidestudio-scope .deck-container,
    .slidestudio-scope .presentation-container,
    .slidestudio-scope .presentation-wrapper,
    .slidestudio-scope .slides-container,
    .slidestudio-scope .slidestudio-viewport,
    .slidestudio-scope .slide-viewport,
    .slidestudio-scope main {
      width: 100% !important;
      max-width: 100% !important;
      min-width: 0 !important;
      box-sizing: border-box !important;
      margin: 0 !important;
      box-shadow: none !important;
      border-radius: 0 !important;
    }

    .slidestudio-virtual-stage .presentation-container,
    .slidestudio-virtual-stage .deck-container,
    .slidestudio-scope .presentation-container,
    .slidestudio-scope .deck-container {
      height: 100% !important;
      max-height: 100% !important;
      display: flex !important;
      flex-direction: column !important;
      overflow: hidden !important;
    }

    .slidestudio-virtual-stage .slidestudio-viewport,
    .slidestudio-virtual-stage .slide-viewport,
    .slidestudio-scope .slidestudio-viewport,
    .slidestudio-scope .slide-viewport {
      flex: 1 1 0% !important;
      height: 100% !important;
      min-height: 0 !important;
      overflow: hidden !important;
      display: flex !important;
      flex-direction: column !important;
    }

    /* Guarantee visibility of slides inside editor and thumbnails */
    .slidestudio-scope .slide,
    .slidestudio-scope .slide.active,
    .slidestudio-viewport .slide,
    .slidestudio-viewport-wrapper .slide {
      display: flex !important;
      opacity: 1 !important;
      transform: none !important;
      visibility: visible !important;
    }

    /* Thumbnail specific styling to ensure contents fit scaled preview */
    .slidestudio-thumbnail-scope .slide,
    .slidestudio-thumbnail-scope .slide.active {
      display: flex !important;
      opacity: 1 !important;
      transform: none !important;
    }

    /* Smooth crisp rendering for tables, cards and badges */
    .slidestudio-scope table,
    .slidestudio-scope .card,
    .slidestudio-scope .kpi-card {
      box-sizing: border-box;
    }

    /* Chart Containers & Canvas Display Guarantee */
    .slidestudio-scope .chart-container,
    .slidestudio-viewport .chart-container {
      position: relative !important;
      width: 100% !important;
      min-height: 140px !important;
      flex: 1 1 auto !important;
    }

    .slidestudio-scope .chart-card,
    .slidestudio-viewport .chart-card {
      min-height: 200px !important;
      display: flex !important;
      flex-direction: column !important;
    }

    .slidestudio-scope canvas {
      display: block !important;
      max-width: 100% !important;
    }

    /* Mobile Simulation Mode when viewed/edited in desktop editor */
    .slidestudio-mobile-mode {
      width: 390px !important;
      min-width: 390px !important;
      max-width: 390px !important;
      height: 844px !important;
      min-height: 844px !important;
      max-height: 844px !important;
      border-radius: 44px !important;
      box-sizing: border-box !important;
    }

    /* Scrollable viewport on mobile with sleek modern scrollbars */
    .slidestudio-mobile-mode .slidestudio-viewport {
      overflow-y: auto !important;
      overflow-x: hidden !important;
      -webkit-overflow-scrolling: touch !important;
      scroll-behavior: smooth !important;
      flex: 1 1 auto !important;
      display: flex !important;
      flex-direction: column !important;
    }

    .slidestudio-mobile-mode .slidestudio-viewport::-webkit-scrollbar,
    .slidestudio-mobile-mode .slide::-webkit-scrollbar {
      width: 4px;
    }

    .slidestudio-mobile-mode .slidestudio-viewport::-webkit-scrollbar-track,
    .slidestudio-mobile-mode .slide::-webkit-scrollbar-track {
      background: rgba(0, 0, 0, 0.04);
    }

    .slidestudio-mobile-mode .slidestudio-viewport::-webkit-scrollbar-thumb,
    .slidestudio-mobile-mode .slide::-webkit-scrollbar-thumb {
      background: rgba(100, 116, 139, 0.4);
      border-radius: 9999px;
    }

    /* Sleek, non-wrapping corporate header on mobile */
    .slidestudio-mobile-mode .header-bar {
      height: auto !important;
      min-height: 40px !important;
      padding: 6px 10px !important;
      display: flex !important;
      flex-direction: column !important;
      gap: 3px !important;
      box-sizing: border-box !important;
    }

    .slidestudio-mobile-mode .header-left {
      display: flex !important;
      align-items: center !important;
      justify-content: space-between !important;
      width: 100% !important;
      gap: 6px !important;
      flex-wrap: nowrap !important;
    }

    .slidestudio-mobile-mode .cb-badge {
      font-size: 9px !important;
      padding: 3px 8px !important;
      letter-spacing: 0.4px !important;
      flex-shrink: 0 !important;
      font-weight: 800 !important;
    }

    .slidestudio-mobile-mode .header-tag {
      font-size: 8.5px !important;
      padding: 2px 6px !important;
      white-space: nowrap !important;
      overflow: hidden !important;
      text-overflow: ellipsis !important;
      max-width: 135px !important;
      flex-shrink: 1 !important;
    }

    .slidestudio-mobile-mode .header-left > span:last-child {
      font-size: 9px !important;
      white-space: nowrap !important;
      opacity: 0.9 !important;
      flex-shrink: 0 !important;
      margin-left: auto !important;
      font-weight: 600 !important;
    }

    .slidestudio-mobile-mode .header-right {
      font-size: 8.5px !important;
      width: 100% !important;
      border-top: 1px solid rgba(255, 255, 255, 0.2) !important;
      padding-top: 2px !important;
      margin-top: 1px !important;
      white-space: nowrap !important;
      overflow: hidden !important;
      text-overflow: ellipsis !important;
      line-height: 1.2 !important;
      opacity: 0.92 !important;
      text-align: center !important;
    }

    /* Slide container: fills viewport gracefully utilizing all vertical space with touch scrolling */
    .slidestudio-mobile-mode .slide {
      padding: 12px 12px 18px 12px !important;
      overflow-y: auto !important;
      overflow-x: hidden !important;
      -webkit-overflow-scrolling: touch !important;
      height: 100% !important;
      min-height: 100% !important;
      display: flex !important;
      flex-direction: column !important;
      justify-content: flex-start !important;
      box-sizing: border-box !important;
      gap: 10px !important;
    }

    .slidestudio-mobile-mode .slide-content {
      height: auto !important;
      min-height: auto !important;
      overflow: visible !important;
      gap: 10px !important;
      display: flex !important;
      flex-direction: column !important;
      justify-content: flex-start !important;
      flex: 1 0 auto !important;
    }

    /* Slide 1: Cover Page - Balanced layout utilizing vertical space with natural touch scrolling */
    .slidestudio-mobile-mode .slide-cover {
      width: 100% !important;
      max-width: 100% !important;
      height: auto !important;
      min-height: 100% !important;
      padding: 14px 10px 18px 10px !important;
      justify-content: flex-start !important;
      display: flex !important;
      flex-direction: column !important;
      align-items: center !important;
      text-align: center !important;
      box-sizing: border-box !important;
      gap: 8px !important;
      overflow: visible !important;
    }

    .slidestudio-mobile-mode .cover-tag {
      font-size: 10px !important;
      padding: 4px 10px !important;
      margin-bottom: 4px !important;
      display: inline-block !important;
      line-height: 1.2 !important;
      letter-spacing: 0.5px !important;
      font-weight: 700 !important;
    }

    .slidestudio-mobile-mode .cover-title {
      font-size: 1.35rem !important;
      line-height: 1.25 !important;
      margin-bottom: 6px !important;
      font-weight: 800 !important;
      max-width: 100% !important;
    }

    .slidestudio-mobile-mode .cover-subtitle {
      font-size: 0.8rem !important;
      line-height: 1.45 !important;
      margin-bottom: 6px !important;
      opacity: 0.88 !important;
      max-width: 100% !important;
    }

    /* Cover KPI Grid: 2x2 balanced layout utilizing vertical height */
    .slidestudio-mobile-mode .cover-grid {
      display: grid !important;
      grid-template-columns: repeat(2, 1fr) !important;
      gap: 8px !important;
      margin: 4px 0 !important;
      width: 100% !important;
      max-width: 100% !important;
      box-sizing: border-box !important;
      align-content: center !important;
    }

    .slidestudio-mobile-mode .cover-kpi {
      padding: 12px 10px !important;
      border-radius: 14px !important;
      display: flex !important;
      flex-direction: column !important;
      justify-content: center !important;
      min-height: 90px !important;
      background: #FFFFFF !important;
      border: 1px solid #E2E8F0 !important;
      box-shadow: 0 2px 4px rgba(0,0,0,0.04) !important;
    }

    .slidestudio-mobile-mode .cover-kpi-label {
      font-size: 8.5px !important;
      font-weight: 700 !important;
      line-height: 1.2 !important;
      white-space: nowrap !important;
      overflow: hidden !important;
      text-overflow: ellipsis !important;
      color: #64748B !important;
      text-transform: uppercase !important;
    }

    .slidestudio-mobile-mode .cover-kpi-val {
      font-size: 1.45rem !important;
      font-weight: 800 !important;
      line-height: 1.15 !important;
      margin: 3px 0 !important;
      color: #0F172A !important;
    }

    .slidestudio-mobile-mode .cover-kpi-sub {
      font-size: 8px !important;
      line-height: 1.2 !important;
      white-space: nowrap !important;
      overflow: hidden !important;
      text-overflow: ellipsis !important;
      color: #94A3B8 !important;
    }

    .slidestudio-mobile-mode .cover-meta-bar {
      display: flex !important;
      flex-wrap: wrap !important;
      align-items: center !important;
      justify-content: center !important;
      gap: 5px !important;
      font-size: 8.5px !important;
      padding: 8px 12px !important;
      background: #F8FAFC !important;
      border-radius: 8px !important;
      border: 1px solid #E2E8F0 !important;
      color: #64748B !important;
      margin-top: auto !important;
      width: 100% !important;
      box-sizing: border-box !important;
    }

    /* Standard Slide Header & Subtitle on Mobile */
    .slidestudio-mobile-mode .slide-header {
      margin-bottom: 8px !important;
      padding-bottom: 6px !important;
      border-bottom: 1px solid #E2E8F0 !important;
    }

    .slidestudio-mobile-mode .slide-title {
      font-size: 13.5px !important;
      font-weight: 800 !important;
      line-height: 1.25 !important;
      margin-bottom: 3px !important;
    }

    .slidestudio-mobile-mode .slide-subtitle {
      font-size: 9.5px !important;
      line-height: 1.35 !important;
      color: #64748B !important;
    }

    /* Mobile KPI Rows: 2x2 on mobile for 4 KPIs, clean and spacious */
    .slidestudio-mobile-mode .kpi-row {
      display: grid !important;
      grid-template-columns: repeat(2, 1fr) !important;
      gap: 8px !important;
      margin-bottom: 8px !important;
    }

    .slidestudio-mobile-mode .kpi-row-6 {
      display: grid !important;
      grid-template-columns: repeat(3, 1fr) !important;
      gap: 5px !important;
      margin-bottom: 6px !important;
    }

    /* Force any 4-column or 3-column Tailwind grid to adapt on mobile */
    .slidestudio-mobile-mode [class*="grid-cols-4"],
    .slidestudio-mobile-mode [class*="lg:grid-cols-4"],
    .slidestudio-mobile-mode [class*="md:grid-cols-4"] {
      grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
      gap: 8px !important;
    }

    .slidestudio-mobile-mode [class*="grid-cols-3"],
    .slidestudio-mobile-mode [class*="lg:grid-cols-3"],
    .slidestudio-mobile-mode [class*="md:grid-cols-3"] {
      grid-template-columns: repeat(1, minmax(0, 1fr)) !important;
      gap: 8px !important;
    }

    .slidestudio-mobile-mode .kpi-card {
      padding: 6px 8px !important;
      border-radius: 6px !important;
      min-height: 48px !important;
    }

    .slidestudio-mobile-mode .kpi-label {
      font-size: 8px !important;
      font-weight: 700 !important;
      line-height: 1.15 !important;
      white-space: nowrap !important;
      overflow: hidden !important;
      text-overflow: ellipsis !important;
    }

    .slidestudio-mobile-mode .kpi-val {
      font-size: 1.15rem !important;
      font-weight: 800 !important;
      line-height: 1.15 !important;
      margin: 2px 0 !important;
    }

    .slidestudio-mobile-mode .kpi-sub {
      font-size: 7.5px !important;
      line-height: 1.2 !important;
      white-space: nowrap !important;
      overflow: hidden !important;
      text-overflow: ellipsis !important;
    }

    /* Charts & Split Views on Mobile */
    .slidestudio-mobile-mode .split-view,
    .slidestudio-mobile-mode .split-view-equal {
      display: flex !important;
      flex-direction: column !important;
      gap: 8px !important;
      height: auto !important;
    }

    .slidestudio-mobile-mode .chart-card {
      height: auto !important;
      min-height: auto !important;
      padding: 8px !important;
      border-radius: 8px !important;
      margin-bottom: 6px !important;
    }

    .slidestudio-mobile-mode .chart-header {
      font-size: 10px !important;
      font-weight: 700 !important;
      margin-bottom: 4px !important;
    }

    .slidestudio-mobile-mode .chart-container {
      height: 185px !important;
      min-height: 185px !important;
      max-height: 195px !important;
      width: 100% !important;
      position: relative !important;
    }

    .slidestudio-mobile-mode .side-panel {
      padding: 8px !important;
      border-radius: 8px !important;
      font-size: 9.5px !important;
      height: auto !important;
    }

    /* Grids & Matrices on Mobile */
    .slidestudio-mobile-mode .journey-grid {
      display: grid !important;
      grid-template-columns: repeat(2, 1fr) !important;
      gap: 5px !important;
      height: auto !important;
    }

    .slidestudio-mobile-mode .journey-card {
      padding: 6px !important;
      font-size: 8.5px !important;
    }

    .slidestudio-mobile-mode .matrix-grid {
      display: grid !important;
      grid-template-columns: repeat(2, 1fr) !important;
      gap: 5px !important;
      height: auto !important;
    }

    .slidestudio-mobile-mode .matrix-card {
      padding: 6px 8px !important;
      font-size: 8.5px !important;
    }

    .slidestudio-mobile-mode .cluster-grid {
      display: grid !important;
      grid-template-columns: 1fr !important;
      gap: 6px !important;
      height: auto !important;
    }

    .slidestudio-mobile-mode .cluster-card {
      padding: 8px !important;
      font-size: 9px !important;
    }

    /* Tables on Mobile */
    .slidestudio-mobile-mode .table-container {
      max-height: 260px !important;
      width: 100% !important;
      max-width: 100% !important;
      overflow-x: auto !important;
      overflow-y: auto !important;
      -webkit-overflow-scrolling: touch !important;
      border-radius: 6px !important;
      margin-bottom: 6px !important;
    }

    .slidestudio-mobile-mode .analise-table {
      min-width: 460px !important;
      font-size: 9px !important;
    }

    .slidestudio-mobile-mode .analise-table th,
    .slidestudio-mobile-mode .analise-table td {
      padding: 4px 6px !important;
    }

    /* Compact, single-row Corporate Footer on Mobile */
    .slidestudio-mobile-mode .footer-bar {
      height: 38px !important;
      min-height: 38px !important;
      padding: 4px 10px !important;
      display: flex !important;
      flex-direction: row !important;
      align-items: center !important;
      justify-content: space-between !important;
      box-sizing: border-box !important;
      gap: 6px !important;
    }

    .slidestudio-mobile-mode .footer-meta {
      font-size: 8.5px !important;
      text-align: left !important;
      white-space: nowrap !important;
      overflow: hidden !important;
      text-overflow: ellipsis !important;
      flex: 1 !important;
    }

    .slidestudio-mobile-mode .footer-controls {
      display: flex !important;
      align-items: center !important;
      gap: 4px !important;
      flex-shrink: 0 !important;
    }

    .slidestudio-mobile-mode .slide-counter {
      font-size: 9.5px !important;
      margin-right: 2px !important;
    }

    .slidestudio-mobile-mode .btn-nav {
      padding: 3px 8px !important;
      font-size: 9.5px !important;
      min-height: 24px !important;
      border-radius: 4px !important;
    }

    .slidestudio-mobile-mode #btn-fullscreen {
      display: none !important;
    }

    /* SlideStudio Entry Keyframes for presentation slides */
    @keyframes ss-fade-in {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    @keyframes ss-slide-up {
      from { opacity: 0; transform: translateY(30px); }
      to { opacity: 1; transform: translateY(0); }
    }
    @keyframes ss-slide-down {
      from { opacity: 0; transform: translateY(-30px); }
      to { opacity: 1; transform: translateY(0); }
    }
    @keyframes ss-slide-left {
      from { opacity: 0; transform: translateX(30px); }
      to { opacity: 1; transform: translateX(0); }
    }
    @keyframes ss-slide-right {
      from { opacity: 0; transform: translateX(-30px); }
      to { opacity: 1; transform: translateX(0); }
    }
    @keyframes ss-zoom-in {
      from { opacity: 0; transform: scale(0.84); }
      to { opacity: 1; transform: scale(1); }
    }
    @keyframes ss-zoom-out {
      from { opacity: 0; transform: scale(1.16); }
      to { opacity: 1; transform: scale(1); }
    }
    @keyframes ss-bounce-in {
      0% { opacity: 0; transform: scale(0.35); }
      50% { opacity: 1; transform: scale(1.05); }
      75% { transform: scale(0.96); }
      100% { opacity: 1; transform: scale(1); }
    }
  `;

  return scoped;
}

/**
 * Extracts links, styles, and external script URLs from a raw headHtml string,
 * injecting them safely into the DOM.
 */
export function injectPresentationStyles(headHtml: string) {
  if (typeof document === 'undefined') return;

  const parser = new DOMParser();
  const doc = parser.parseFromString(headHtml || '', 'text/html');

  // 1. External links (fonts, stylesheets, preconnect)
  const existingLinks = document.querySelectorAll('link[data-slidestudio="external"]');
  existingLinks.forEach((el) => el.remove());

  const links = doc.querySelectorAll('link');
  links.forEach((link) => {
    const href = link.getAttribute('href');
    if (href) {
      const newLink = document.createElement('link');
      Array.from(link.attributes).forEach((attr) => {
        newLink.setAttribute(attr.name, attr.value);
      });
      newLink.setAttribute('data-slidestudio', 'external');
      document.head.appendChild(newLink);
    }
  });

  // 2. Extract and concatenate all style contents
  let combinedCss = '';
  const styles = doc.querySelectorAll('style');
  styles.forEach((s) => {
    combinedCss += (s.textContent || '') + '\n';
  });

  // If headHtml contains raw <style> tags without proper doc root parsing
  if (!combinedCss && headHtml && headHtml.includes('<style')) {
    const matches = headHtml.match(/<style[^>]*>([\s\S]*?)<\/style>/gi);
    if (matches) {
      matches.forEach((m) => {
        const content = m.replace(/<style[^>]*>/i, '').replace(/<\/style>/i, '');
        combinedCss += content + '\n';
      });
    }
  }

  // 3. Inject scoped CSS
  let styleEl = document.getElementById('slidestudio-presentation-styles') as HTMLStyleElement;
  if (!styleEl) {
    styleEl = document.createElement('style');
    styleEl.id = 'slidestudio-presentation-styles';
    document.head.appendChild(styleEl);
  }

  styleEl.textContent = scopePresentationCss(combinedCss);

  // 4. External scripts (e.g. Chart.js, Tailwind CDN)
  const scripts = doc.querySelectorAll('script[src]');
  scripts.forEach((script) => {
    const src = script.getAttribute('src');
    if (src && !document.querySelector(`script[src="${src}"]`)) {
      const newScript = document.createElement('script');
      newScript.src = src;
      newScript.async = true;
      document.head.appendChild(newScript);
    }
  });
}

/**
 * React hook to synchronize presentation styles dynamically
 */
export function usePresentationStyles(headHtml: string) {
  useEffect(() => {
    injectPresentationStyles(headHtml);

    return () => {
      // Optional cleanup on complete unmount
    };
  }, [headHtml]);
}
