import JSZip from 'jszip';
import { PresentationDoc, SlideData } from '../types/presentation';
import { generateId } from './slideParser';

export interface PptxRun {
  text: string;
  fontSize?: number;
  isBold?: boolean;
  isItalic?: boolean;
  color?: string;
  typeface?: string;
}

export interface PptxParagraph {
  text: string;
  runs: PptxRun[];
  isBullet?: boolean;
  bulletChar?: string;
  level?: number;
  alignment?: 'left' | 'center' | 'right' | 'justify';
}

export interface PptxShape {
  id: string;
  type: 'title' | 'subtitle' | 'body' | 'kpi' | 'text' | 'card' | 'badge' | 'header' | 'footer';
  text: string;
  paragraphs: string[];
  richParagraphs?: PptxParagraph[];
  isTitle?: boolean;
  isSubtitle?: boolean;
  isKpi?: boolean;
  fontSize?: number;
  isBold?: boolean;
  color?: string;
  fillColor?: string;
  borderColor?: string;
  alignment?: 'left' | 'center' | 'right' | 'justify';
  // Normalized spatial coordinates (0 to 100%)
  xPct: number;
  yPct: number;
  wPct: number;
  hPct: number;
  col: 'left' | 'right' | 'full';
  quadrant: 'tl' | 'tr' | 'bl' | 'br';
  zone: 'header' | 'footer' | 'body';
}

export interface PptxTable {
  headers: string[];
  headerBgColor?: string;
  rows: string[][];
  alignments?: Array<'left' | 'center' | 'right'>;
  xPct?: number;
  yPct?: number;
  wPct?: number;
  hPct?: number;
  col?: 'left' | 'right' | 'full';
}

export interface PptxImage {
  id: string;
  name: string;
  dataUrl: string;
  width?: number;
  height?: number;
  xPct?: number;
  yPct?: number;
  wPct?: number;
  hPct?: number;
  col?: 'left' | 'right' | 'full';
}

export interface PptxSlideParsed {
  slideIndex: number;
  title: string;
  subtitle?: string;
  category?: string;
  rightHeaderBadge?: string;
  headerBadge?: { text: string; bg?: string; color?: string };
  statusPill?: string;
  shapes: PptxShape[];
  bottomCards: PptxShape[];
  tables: PptxTable[];
  images: PptxImage[];
  kpis: Array<{ label: string; value: string; change?: string; positive?: boolean }>;
  isTitleSlide: boolean;
  rawText: string;
  backgroundColor?: string;
  isDark?: boolean;
  footerText?: string;
}

export type PptxProgressCallback = (message: string, percent: number) => void;

/**
 * Robust XML helper that retrieves elements by localName regardless of XML namespace prefixes
 */
function findElementsByLocalName(parent: Document | Element, localName: string): Element[] {
  try {
    const nsResults = Array.from(parent.getElementsByTagNameNS('*', localName));
    if (nsResults.length > 0) return nsResults;
  } catch (_) {}

  try {
    const prefixed = [
      ...Array.from(parent.getElementsByTagName(`p:${localName}`)),
      ...Array.from(parent.getElementsByTagName(`a:${localName}`)),
      ...Array.from(parent.getElementsByTagName(localName)),
    ];
    if (prefixed.length > 0) return prefixed;
  } catch (_) {}

  try {
    return Array.from(parent.querySelectorAll(`${localName}, *|${localName}`));
  } catch (_) {
    return Array.from(parent.querySelectorAll(localName));
  }
}

/**
 * Extracts and maps color scheme from ppt/theme/theme1.xml
 */
async function parseThemeColors(zip: JSZip, parser: DOMParser): Promise<Record<string, string>> {
  const defaults: Record<string, string> = {
    dk1: '#0F172A',
    lt1: '#FFFFFF',
    dk2: '#1E293B',
    lt2: '#F8FAFC',
    accent1: '#0033C6',
    accent2: '#E71A3B',
    accent3: '#059669',
    accent4: '#D97706',
    accent5: '#4F46E5',
    accent6: '#64748B',
    hlink: '#0033C6',
    folHlink: '#7C3AED',
  };

  const themeFile = zip.file('ppt/theme/theme1.xml');
  if (!themeFile) return defaults;

  try {
    const xml = await themeFile.async('text');
    const doc = parser.parseFromString(xml, 'text/xml');
    const clrScheme = findElementsByLocalName(doc, 'clrScheme')[0];
    if (!clrScheme) return defaults;

    const schemeNames = [
      'dk1', 'lt1', 'dk2', 'lt2',
      'accent1', 'accent2', 'accent3', 'accent4', 'accent5', 'accent6',
      'hlink', 'folHlink',
    ];

    schemeNames.forEach((name) => {
      const el = findElementsByLocalName(clrScheme, name)[0];
      if (el) {
        const srgb = findElementsByLocalName(el, 'srgbClr')[0]?.getAttribute('val');
        const sys = findElementsByLocalName(el, 'sysClr')[0]?.getAttribute('lastClr');
        if (srgb) defaults[name] = `#${srgb}`;
        else if (sys) defaults[name] = `#${sys}`;
      }
    });
  } catch (err) {
    console.warn('Failed to parse theme colors, using defaults:', err);
  }

  return defaults;
}

/**
 * Resolves color from OpenXML node using theme mapping
 */
function resolveColor(node: Element | null | undefined, themeColors: Record<string, string>): string | undefined {
  if (!node) return undefined;

  const srgb = findElementsByLocalName(node, 'srgbClr')[0]?.getAttribute('val');
  if (srgb) return `#${srgb}`;

  const scheme = findElementsByLocalName(node, 'schemeClr')[0]?.getAttribute('val');
  if (scheme && themeColors[scheme]) return themeColors[scheme];

  const sys = findElementsByLocalName(node, 'sysClr')[0]?.getAttribute('lastClr');
  if (sys) return `#${sys}`;

  return undefined;
}

/**
 * Parses slide dimensions in EMUs from ppt/presentation.xml (default 16:9: 12192000 x 6858000)
 */
async function parseSlideDimensions(zip: JSZip, parser: DOMParser): Promise<{ width: number; height: number }> {
  const defaults = { width: 12192000, height: 6858000 };
  const presFile = zip.file('ppt/presentation.xml');
  if (!presFile) return defaults;

  try {
    const xml = await presFile.async('text');
    const doc = parser.parseFromString(xml, 'text/xml');
    const sldSz = findElementsByLocalName(doc, 'sldSz')[0];
    if (sldSz) {
      const cx = parseInt(sldSz.getAttribute('cx') || '12192000', 10);
      const cy = parseInt(sldSz.getAttribute('cy') || '6858000', 10);
      return { width: cx || defaults.width, height: cy || defaults.height };
    }
  } catch (_) {}

  return defaults;
}

/**
 * Extracts raw structured slide data from a PPTX file with spatial geometry and formatting.
 */
export async function parsePptxArchive(
  file: File | ArrayBuffer,
  onProgress?: PptxProgressCallback
): Promise<{ title: string; slides: PptxSlideParsed[] }> {
  onProgress?.('Carregando e descompactando arquivo PowerPoint...', 10);

  const zip = await JSZip.loadAsync(file);
  const parser = new DOMParser();

  let presentationTitle = 'Apresentação PowerPoint';
  if (file instanceof File && file.name) {
    presentationTitle = file.name.replace(/\.pptx$/i, '').trim();
  }

  const dimensions = await parseSlideDimensions(zip, parser);
  const themeColors = await parseThemeColors(zip, parser);

  // Extract embedded images in ppt/media/*
  onProgress?.('Extraindo imagens e mídias embutidas...', 25);
  const mediaMap = new Map<string, string>();
  const mediaFiles = Object.keys(zip.files).filter((path) => path.startsWith('ppt/media/'));

  for (const mediaPath of mediaFiles) {
    const filename = mediaPath.replace('ppt/media/', '');
    const fileData = zip.file(mediaPath);
    if (fileData) {
      const ext = filename.split('.').pop()?.toLowerCase() || 'png';
      const mime = ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' : ext === 'svg' ? 'image/svg+xml' : 'image/png';
      const base64 = await fileData.async('base64');
      mediaMap.set(filename, `data:${mime};base64,${base64}`);
    }
  }

  // Find and sort slide files (canonical presentation order if available, else numeric order)
  let slidePaths: string[] = [];
  try {
    const presXml = await zip.file('ppt/presentation.xml')?.async('text');
    const presRelsXml = await zip.file('ppt/_rels/presentation.xml.rels')?.async('text');
    if (presXml && presRelsXml) {
      const presDoc = parser.parseFromString(presXml, 'text/xml');
      const presRelsDoc = parser.parseFromString(presRelsXml, 'text/xml');
      const rIdMap = new Map<string, string>();
      findElementsByLocalName(presRelsDoc, 'Relationship').forEach((r) => {
        const id = r.getAttribute('Id');
        const target = r.getAttribute('Target');
        if (id && target) {
          const normTarget = target.startsWith('ppt/') ? target : `ppt/${target.replace(/^\//, '')}`;
          rIdMap.set(id, normTarget);
        }
      });
      const sldIdEls = findElementsByLocalName(presDoc, 'sldId');
      for (const sld of sldIdEls) {
        const rId = sld.getAttribute('r:id') || sld.getAttribute('id');
        if (rId && rIdMap.has(rId)) {
          const path = rIdMap.get(rId)!;
          if (zip.file(path)) {
            slidePaths.push(path);
          }
        }
      }
    }
  } catch (_) {}

  if (slidePaths.length === 0) {
    slidePaths = Object.keys(zip.files)
      .filter((path) => path.match(/^ppt\/slides\/slide\d+\.xml$/))
      .sort((a, b) => {
        const numA = parseInt(a.match(/slide(\d+)\.xml/)?.[1] || '0', 10);
        const numB = parseInt(b.match(/slide(\d+)\.xml/)?.[1] || '0', 10);
        return numA - numB;
      });
  }

  if (slidePaths.length === 0) {
    throw new Error('Nenhum slide encontrado dentro do arquivo .pptx.');
  }

  onProgress?.(`Analisando ${slidePaths.length} slides e estruturas visuais...`, 40);

  const parsedSlides: PptxSlideParsed[] = [];

  for (let i = 0; i < slidePaths.length; i++) {
    const slidePath = slidePaths[i];
    const slideNum = parseInt(slidePath.match(/slide(\d+)\.xml/)?.[1] || `${i + 1}`, 10);
    const xmlContent = await zip.file(slidePath)?.async('text');

    if (!xmlContent) continue;

    // Load relationship file for this slide to map rIds to images
    const relsPath = `ppt/slides/_rels/slide${slideNum}.xml.rels`;
    const relsContent = await zip.file(relsPath)?.async('text');
    const relsMap = new Map<string, string>();

    if (relsContent) {
      const relsDoc = parser.parseFromString(relsContent, 'text/xml');
      const relElements = findElementsByLocalName(relsDoc, 'Relationship');
      for (const rel of relElements) {
        const id = rel.getAttribute('Id');
        const target = rel.getAttribute('Target');
        if (id && target) {
          const mediaName = target.replace(/.*\/media\//, '');
          relsMap.set(id, mediaName);
        }
      }
    }

    const slideDoc = parser.parseFromString(xmlContent, 'text/xml');

    // Slide Background Extraction from <p:bg>
    let slideBgColor: string | undefined = undefined;
    const bgPr = findElementsByLocalName(slideDoc, 'bgPr')[0] || findElementsByLocalName(slideDoc, 'bg')[0];
    if (bgPr) {
      slideBgColor = resolveColor(bgPr, themeColors);
    }

    // Helper: extracts normalized coordinates (0-100%) from <a:xfrm>
    const extractGeometry = (node: Element) => {
      const xfrm = findElementsByLocalName(node, 'xfrm')[0];
      if (!xfrm) {
        return {
          xPct: 0,
          yPct: 0,
          wPct: 100,
          hPct: 100,
          col: 'full' as const,
          quadrant: 'tl' as const,
          zone: 'body' as const,
        };
      }

      const off = findElementsByLocalName(xfrm, 'off')[0];
      const ext = findElementsByLocalName(xfrm, 'ext')[0];
      const x = parseInt(off?.getAttribute('x') || '0', 10);
      const y = parseInt(off?.getAttribute('y') || '0', 10);
      const cx = parseInt(ext?.getAttribute('cx') || `${dimensions.width}`, 10);
      const cy = parseInt(ext?.getAttribute('cy') || `${dimensions.height}`, 10);

      const xPct = Math.min(100, Math.max(0, Math.round((x / dimensions.width) * 100)));
      const yPct = Math.min(100, Math.max(0, Math.round((y / dimensions.height) * 100)));
      const wPct = Math.min(100, Math.max(0, Math.round((cx / dimensions.width) * 100)));
      const hPct = Math.min(100, Math.max(0, Math.round((cy / dimensions.height) * 100)));

      let col: 'left' | 'right' | 'full' = 'full';
      if (xPct < 48 && wPct < 60) col = 'left';
      else if (xPct >= 48 && wPct < 60) col = 'right';

      let quadrant: 'tl' | 'tr' | 'bl' | 'br' = 'tl';
      if (xPct < 50 && yPct < 56) quadrant = 'tl';
      else if (xPct >= 50 && yPct < 56) quadrant = 'tr';
      else if (xPct < 50 && yPct >= 56) quadrant = 'bl';
      else quadrant = 'br';

      let zone: 'header' | 'footer' | 'body' = 'body';
      if (yPct < 18) zone = 'header';
      else if (yPct > 88) zone = 'footer';

      return { xPct, yPct, wPct, hPct, col, quadrant, zone };
    };

    // Helper: extracts detailed paragraphs with line break preservation
    const extractParagraphs = (txBody: Element): { plain: string[]; rich: PptxParagraph[] } => {
      const plain: string[] = [];
      const rich: PptxParagraph[] = [];
      const pElements = findElementsByLocalName(txBody, 'p');

      pElements.forEach((p) => {
        const pPr = findElementsByLocalName(p, 'pPr')[0];
        const algn = pPr?.getAttribute('algn');
        const alignment: 'left' | 'center' | 'right' | 'justify' =
          algn === 'ctr' ? 'center' : algn === 'r' ? 'right' : algn === 'just' ? 'justify' : 'left';
        const level = parseInt(pPr?.getAttribute('lvl') || '0', 10);
        const hasBullet = Boolean(
          findElementsByLocalName(p, 'buChar').length > 0 ||
          findElementsByLocalName(p, 'buAutoNum').length > 0 ||
          level > 0
        );
        const bulletChar = findElementsByLocalName(p, 'buChar')[0]?.getAttribute('char') || '•';

        const runs: PptxRun[] = [];
        const rElements = findElementsByLocalName(p, 'r');

        rElements.forEach((r) => {
          const t = findElementsByLocalName(r, 't')[0]?.textContent || '';
          if (!t) return;

          const rPr = findElementsByLocalName(r, 'rPr')[0];
          const rawSz = rPr?.getAttribute('sz');
          const fontSize = rawSz ? Math.round(parseInt(rawSz, 10) / 100) : undefined;
          const isBold = rPr?.getAttribute('b') === '1';
          const isItalic = rPr?.getAttribute('i') === '1';
          const color = resolveColor(rPr, themeColors);
          const typeface = findElementsByLocalName(rPr || r, 'latin')[0]?.getAttribute('typeface') || undefined;

          runs.push({ text: t, fontSize, isBold, isItalic, color, typeface });
        });

        if (runs.length === 0) {
          const directT = findElementsByLocalName(p, 't').map((t) => t.textContent || '').join('');
          if (directT.trim()) {
            runs.push({ text: directT });
          }
        }

        const fullParaText = runs.map((r) => r.text).join('').trim();
        if (fullParaText) {
          plain.push(fullParaText);
          rich.push({
            text: fullParaText,
            runs,
            isBullet: hasBullet,
            bulletChar,
            level,
            alignment,
          });
        }
      });

      return { plain, rich };
    };

    // Process shapes (<p:sp>)
    const spElements = findElementsByLocalName(slideDoc, 'sp');
    const validShapes: PptxShape[] = [];
    const allTextPieces: string[] = [];

    for (const sp of spElements) {
      const geom = extractGeometry(sp);
      const spPr = findElementsByLocalName(sp, 'spPr')[0];
      const fillColor = resolveColor(spPr, themeColors);
      const ln = findElementsByLocalName(spPr || sp, 'ln')[0];
      const borderColor = resolveColor(ln, themeColors);

      const txBody = findElementsByLocalName(sp, 'txBody')[0];
      const { plain: paragraphs, rich: richParagraphs } = txBody ? extractParagraphs(txBody) : { plain: [], rich: [] };
      const text = paragraphs.join('\n').trim();

      // Detect full-bleed background shape
      if (geom.wPct >= 85 && geom.hPct >= 85 && geom.xPct <= 8 && geom.yPct <= 8) {
        if (fillColor && !text) {
          slideBgColor = fillColor;
          continue; // Don't treat background rectangle as a content shape
        }
      }

      // CRITICAL: Ignore shapes that have NO text and NO image (they are empty container rectangles)
      if (!text) {
        continue;
      }

      const ph = findElementsByLocalName(sp, 'ph')[0];
      const phType = ph?.getAttribute('type') || '';
      const isTitlePh = phType === 'title' || phType === 'ctrTitle';
      const isSubTitlePh = phType === 'subTitle';

      const firstRun = richParagraphs[0]?.runs[0];
      const fontSize = firstRun?.fontSize;
      const isBold = firstRun?.isBold;
      const color = firstRun?.color;

      allTextPieces.push(text);

      validShapes.push({
        id: generateId('shp'),
        type: isTitlePh ? 'title' : isSubTitlePh ? 'subtitle' : 'text',
        text,
        paragraphs,
        richParagraphs,
        isTitle: isTitlePh,
        isSubtitle: isSubTitlePh,
        fontSize,
        isBold,
        color,
        fillColor,
        borderColor,
        alignment: richParagraphs[0]?.alignment || 'left',
        ...geom,
      });
    }

    // Determine dark / light theme
    const isDark =
      Boolean(
        slideBgColor &&
        (slideBgColor.includes('0033C6') ||
         slideBgColor.includes('0038D1') ||
         slideBgColor.includes('00174F') ||
         slideBgColor.includes('0F172A') ||
         slideBgColor.includes('000000'))
      ) ||
      i === 0;

    if (i === 0 && !slideBgColor) {
      slideBgColor = '#0038D1';
    }

    // Intelligent shape classification
    let slideTitle = '';
    let slideSubtitle = '';
    let slideCategory = '';
    let rightHeaderBadge = '';
    let statusPill = '';
    let headerBadge: { text: string; bg?: string; color?: string } | undefined = undefined;
    let footerText = '';
    const bottomCards: PptxShape[] = [];

    // 1. Identify Status Pill on Slide 1 (e.g. "STATUS REPORT EXECUTIVO • CICLO JUL-OUT/2026")
    const pillShape = validShapes.find(
      (s) =>
        s.text.toUpperCase().includes('STATUS REPORT') ||
        s.text.toUpperCase().includes('CICLO') ||
        (s.yPct >= 18 && s.yPct <= 30 && s.text.length < 60 && s.xPct < 45)
    );
    if (pillShape) {
      statusPill = pillShape.text.replace(/^[•\s\-\*\.\(\)]+/, '').trim();
    }

    // 2. Identify Top Header Bar Elements (yPct <= 16)
    const headerCandidates = validShapes.filter((s) => s.yPct <= 16 && s !== pillShape);
    headerCandidates.forEach((s) => {
      const txt = s.text.trim();
      const isBrandBadge =
        s.fillColor?.toUpperCase().includes('E71A3B') ||
        s.fillColor?.toUpperCase().includes('RED') ||
        txt.toUpperCase().includes('GRUPO') ||
        txt.toUpperCase().includes('CASAS BAHIA');

      if (isBrandBadge && !headerBadge) {
        headerBadge = {
          text: txt,
          bg: s.fillColor || '#E71A3B',
          color: s.color || '#FFFFFF',
        };
      } else if (s.xPct >= 58 && !rightHeaderBadge) {
        rightHeaderBadge = txt;
      } else if (!slideCategory && txt !== headerBadge?.text) {
        slideCategory = txt;
      }
    });

    // 3. Identify Footer Notice (yPct >= 88 or text matches confidentiality/public doc)
    const footerShape = validShapes.find(
      (s) =>
        s.yPct >= 88 ||
        s.text.toLowerCase().includes('documento público') ||
        s.text.toLowerCase().includes('confidencial')
    );
    if (footerShape) {
      footerText = footerShape.text.trim();
    }

    // 4. Identify Bottom Cards (yPct >= 64, card-like text)
    const bottomCardCandidates = validShapes.filter(
      (s) =>
        s.yPct >= 64 &&
        s.yPct <= 88 &&
        s !== footerShape &&
        s !== pillShape &&
        !headerCandidates.includes(s) &&
        (s.text.includes('F1') || s.text.includes('F2') || s.text.includes('F3') || s.text.includes('F4') || s.text.length < 80)
    );

    if (bottomCardCandidates.length >= 2) {
      bottomCardCandidates.sort((a, b) => a.xPct - b.xPct);
      bottomCardCandidates.forEach((c) => bottomCards.push(c));
    }

    // 5. Identify Main Slide Title
    const candidatesForTitle = validShapes.filter(
      (s) =>
        !headerCandidates.includes(s) &&
        s !== footerShape &&
        s !== pillShape &&
        !bottomCards.includes(s) &&
        s.text.length >= 8 &&
        !s.text.startsWith('✔') &&
        !s.text.startsWith('⏸') &&
        !s.text.startsWith('⚡')
    );

    candidatesForTitle.sort((a, b) => (b.fontSize || 14) - (a.fontSize || 14));

    if (candidatesForTitle[0]) {
      slideTitle = candidatesForTitle[0].text;
      candidatesForTitle[0].isTitle = true;
    } else {
      slideTitle = `Slide ${i + 1}`;
    }

    // 6. Identify Subtitle (Lead paragraph directly below title, length >= 25)
    const remainingForSubtitle = candidatesForTitle.filter((s) => s.text !== slideTitle);
    const subtitleCandidate = remainingForSubtitle.find(
      (s) => s.yPct >= 25 && s.yPct <= 65 && s.text.length >= 25
    );

    if (subtitleCandidate) {
      slideSubtitle = subtitleCandidate.text;
      subtitleCandidate.isSubtitle = true;
    }

    // Process Pictures (<p:pic>)
    const picElements = findElementsByLocalName(slideDoc, 'pic');
    const images: PptxImage[] = [];

    for (const pic of picElements) {
      const blip = findElementsByLocalName(pic, 'blip')[0];
      const embedId =
        blip?.getAttribute('r:embed') ||
        blip?.getAttribute('embed') ||
        blip?.getAttributeNS('http://schemas.openxmlformats.org/officeDocument/2006/relationships', 'embed');
      if (embedId && relsMap.has(embedId)) {
        const mediaName = relsMap.get(embedId)!;
        const dataUrl = mediaMap.get(mediaName);
        if (dataUrl) {
          const geom = extractGeometry(pic);
          images.push({
            id: generateId('img'),
            name: mediaName,
            dataUrl,
            ...geom,
          });
        }
      }
    }

    // Process Tables (<a:tbl>)
    const tblElements = findElementsByLocalName(slideDoc, 'tbl');
    const tables: PptxTable[] = [];

    for (const tbl of tblElements) {
      const geom = extractGeometry(tbl.closest('graphicFrame') || tbl);
      const trElements = findElementsByLocalName(tbl, 'tr');
      if (trElements.length > 0) {
        const rows: string[][] = [];
        const alignments: Array<'left' | 'center' | 'right'> = [];

        trElements.forEach((tr, rIdx) => {
          const tcElements = findElementsByLocalName(tr, 'tc');
          const rowData = tcElements.map((tc, cIdx) => {
            const tRuns = findElementsByLocalName(tc, 't').map((t) => t.textContent || '');
            const cellText = tRuns.join(' ').trim();

            if (rIdx === 0) {
              const algn = findElementsByLocalName(tc, 'pPr')[0]?.getAttribute('algn');
              alignments[cIdx] = algn === 'ctr' ? 'center' : algn === 'r' ? 'right' : 'left';
            }
            return cellText;
          });
          rows.push(rowData);
        });

        const firstTc = findElementsByLocalName(trElements[0] || tbl, 'tc')[0];
        const tcPr = findElementsByLocalName(firstTc || tbl, 'tcPr')[0];
        const headerBgColor = resolveColor(tcPr, themeColors) || (isDark ? '#1E293B' : '#F1F5F9');

        if (rows.length > 0) {
          tables.push({
            headers: rows[0] || [],
            headerBgColor,
            rows: rows.slice(1),
            alignments,
            ...geom,
          });
        }
      }
    }

    // Slide 1 is ALWAYS Title/Cover slide
    const isTitleSlide = i === 0 || validShapes.some((s) => s.isTitle && s.fontSize && s.fontSize >= 32);

    parsedSlides.push({
      slideIndex: i + 1,
      title: slideTitle,
      subtitle: slideSubtitle,
      category: slideCategory,
      rightHeaderBadge,
      headerBadge,
      statusPill,
      footerText,
      shapes: validShapes,
      bottomCards,
      tables,
      images,
      kpis: [],
      isTitleSlide,
      backgroundColor: slideBgColor,
      isDark,
      rawText: allTextPieces.join(' '),
    });

    const progressPct = 40 + Math.round(((i + 1) / slidePaths.length) * 35);
    onProgress?.(`Processado slide ${i + 1} de ${slidePaths.length}...`, progressPct);
  }

  return {
    title: presentationTitle,
    slides: parsedSlides,
  };
}

/**
 * Renders status pill text with appropriate icons and colors
 */
function renderStatusPill(text: string): string {
  const lower = text.toLowerCase();
  let icon = '';
  let colorClass = 'bg-slate-100 text-slate-700 border-slate-200';

  if (lower.includes('ativa') || lower.includes('produção') || lower.includes('coletando') || lower.includes('concl')) {
    icon = '🟢';
    colorClass = 'bg-emerald-50 text-emerald-700 border-emerald-200';
  } else if (lower.includes('pausa') || lower.includes('ti') || lower.includes('aguard')) {
    icon = '⏸';
    colorClass = 'bg-amber-50 text-amber-700 border-amber-200';
  } else if (lower.includes('definição') || lower.includes('foco') || lower.includes('desenho')) {
    icon = '🧩';
    colorClass = 'bg-sky-50 text-sky-700 border-sky-200';
  } else if (lower.includes('transição') || lower.includes('solucx') || lower.includes('onda')) {
    icon = '⚡';
    colorClass = 'bg-rose-50 text-rose-700 border-rose-200';
  }

  return `<span class="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${colorClass}"><span>${icon}</span><span>${text.replace(/^[🟢⏸🧩⚡✔]\s*/, '')}</span></span>`;
}

/**
 * Calls Gemini server endpoint /api/gemini/parse-pptx to convert a single slide
 * into executive-grade HTML with Tailwind CSS, adapted for desktop and mobile.
 */
async function convertSlideWithAi(
  slide: PptxSlideParsed,
  presentationTitle: string,
  slideIndex: number,
  totalSlides: number
): Promise<string> {
  // Strip heavy base64 dataUrl before sending to server to avoid huge payloads
  const sanitizedImages = slide.images.map((img) => ({
    id: img.id,
    name: img.name,
    placeholder: `<!--IMG_${img.id}-->`,
    col: img.col,
    xPct: img.xPct,
    yPct: img.yPct,
    wPct: img.wPct,
    hPct: img.hPct,
  }));

  const sanitizedSlideData = {
    slideIndex,
    totalSlides,
    title: slide.title,
    subtitle: slide.subtitle,
    category: slide.category,
    rightHeaderBadge: slide.rightHeaderBadge,
    headerBadge: slide.headerBadge,
    statusPill: slide.statusPill,
    footerText: slide.footerText,
    isDark: slide.isDark,
    backgroundColor: slide.backgroundColor,
    isTitleSlide: slide.isTitleSlide,
    tables: slide.tables,
    images: sanitizedImages,
    shapes: slide.shapes.map((s) => ({
      text: s.text,
      paragraphs: s.paragraphs,
      isTitle: s.isTitle,
      isSubtitle: s.isSubtitle,
      isBold: s.isBold,
      fontSize: s.fontSize,
      fillColor: s.fillColor,
      borderColor: s.borderColor,
      col: s.col,
      quadrant: s.quadrant,
      zone: s.zone,
      xPct: s.xPct,
      yPct: s.yPct,
      wPct: s.wPct,
      hPct: s.hPct,
    })),
    bottomCards: slide.bottomCards.map((c) => ({
      text: c.text,
      paragraphs: c.paragraphs,
    })),
    rawText: slide.rawText,
  };

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 35000); // 35s timeout per slide

  try {
    const response = await fetch('/api/gemini/parse-pptx', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        slideData: sanitizedSlideData,
        presentationTitle,
        isTitleSlide: slide.isTitleSlide,
        slideIndex,
        totalSlides,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP ${response.status}`);
    }

    const data = await response.json();
    let html = data.html;
    if (!html || !html.trim()) {
      throw new Error('Retorno vazio do Gemini');
    }

    // Clean any markdown code blocks
    if (html.startsWith('```html')) {
      html = html.replace(/^```html\s*/, '').replace(/\s*```$/, '');
    } else if (html.startsWith('```')) {
      html = html.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }

    // Restore image data URLs into placeholders
    for (const img of slide.images) {
      const placeholder = `<!--IMG_${img.id}-->`;
      if (html.includes(placeholder)) {
        html = html.replace(
          new RegExp(placeholder, 'g'),
          `<img src="${img.dataUrl}" alt="${img.name}" class="rounded-xl object-contain max-h-48 md:max-h-64 shadow-xs" />`
        );
      }
    }

    return html;
  } catch (err) {
    clearTimeout(timeoutId);
    throw err;
  }
}

/**
 * Local Dynamic Synthesis: generates clean, modern, 100% faithful HTML for a parsed slide
 * based purely on its actual parsed OpenXML shapes, tables, and images (no hardcoded fake text!).
 */
export function synthesizeSlideHtml(parsed: PptxSlideParsed, deckTitle?: string): string {
  const {
    title,
    subtitle,
    category,
    rightHeaderBadge,
    headerBadge,
    statusPill,
    footerText,
    bottomCards,
    shapes,
    tables,
    images,
    isTitleSlide,
    isDark,
    backgroundColor,
    slideIndex,
  } = parsed;

  const bgStyle = backgroundColor ? `background-color: ${backgroundColor};` : '';
  const themeClass = isDark
    ? 'bg-[#0038D1] text-white border-blue-900'
    : 'bg-[#F8F9FA] text-slate-900 border-slate-200';

  // 1. Top Header Bar
  let topHeaderHtml = '';
  const badgeText = headerBadge?.text || '';
  const badgeBg = headerBadge?.bg || '#E71A3B';
  const categoryText = category || '';
  const mottoText = rightHeaderBadge || '';

  if (isTitleSlide) {
    if (badgeText || mottoText || categoryText) {
      topHeaderHtml = `
  <div class="flex flex-wrap items-center justify-between w-full pb-3 select-none relative z-10 gap-2 shrink-0">
    <div class="flex items-center gap-3">
      ${
        badgeText
          ? `<span class="text-white font-extrabold text-[11px] sm:text-xs px-3 py-1 rounded-md uppercase tracking-wider shadow-sm" style="background-color: ${badgeBg}">
              ${badgeText}
            </span>`
          : ''
      }
      ${
        categoryText
          ? `<span class="text-xs sm:text-sm font-bold tracking-wider uppercase ${isDark ? 'text-white' : 'text-slate-800'}">
              ${categoryText}
            </span>`
          : ''
      }
    </div>
    ${
      mottoText
        ? `<div class="text-[11px] sm:text-xs font-semibold tracking-wider uppercase ${isDark ? 'text-white/90' : 'text-slate-600'}">
            ${mottoText}
          </div>`
        : ''
    }
  </div>`;
    }
  } else {
    topHeaderHtml = `
  <div class="flex items-start justify-between w-full pb-4 select-none relative z-10 gap-4 shrink-0">
    <div class="max-w-4xl">
      ${
        categoryText
          ? `<div class="text-[11px] sm:text-xs font-extrabold uppercase tracking-wider ${isDark ? 'text-blue-200' : 'text-blue-600'} mb-1">
              ${categoryText}
            </div>`
          : ''
      }
      <h2 class="text-xl sm:text-2xl md:text-3xl font-extrabold ${isDark ? 'text-white' : 'text-slate-900'} tracking-tight leading-snug">
        ${title || `Slide ${slideIndex}`}
      </h2>
      ${
        subtitle
          ? `<p class="text-xs sm:text-sm ${isDark ? 'text-white/80' : 'text-slate-600'} mt-1 max-w-3xl leading-relaxed">${subtitle}</p>`
          : ''
      }
    </div>
    ${
      mottoText
        ? `<div class="shrink-0 px-3.5 py-1.5 rounded-full ${isDark ? 'bg-white/10 text-white border-white/20' : 'bg-white text-slate-700 border-slate-200'} border text-xs font-semibold shadow-2xs">
            ${mottoText}
          </div>`
        : ''
    }
  </div>`;
  }

  // 2. Bottom Cards Row (if present)
  let bottomCardsHtml = '';
  if (bottomCards.length > 0) {
    const cardCols = Math.min(bottomCards.length, 4);
    const colsClass =
      cardCols === 4
        ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'
        : cardCols === 3
        ? 'grid-cols-1 sm:grid-cols-3'
        : 'grid-cols-1 sm:grid-cols-2';

    const cards = bottomCards
      .map((c) => {
        const lines = c.paragraphs.length > 0 ? c.paragraphs : c.text.split('\n').filter(Boolean);
        const topLabel = lines[0] || '';
        const statusValue = lines.slice(1).join(' ') || '';

        const cardBg = isDark
          ? 'bg-white/10 backdrop-blur-md border border-white/20 text-white'
          : 'bg-white border border-slate-200 text-slate-900 shadow-2xs';

        return `
      <div class="${cardBg} rounded-xl p-3 sm:p-3.5 transition flex flex-col justify-between">
        <div class="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider ${
          isDark ? 'text-white/70' : 'text-slate-500'
        } truncate">
          ${topLabel}
        </div>
        ${
          statusValue
            ? `<div class="text-xs sm:text-sm font-bold mt-1 truncate">
                ${statusValue}
              </div>`
            : ''
        }
      </div>`;
      })
      .join('\n');

    bottomCardsHtml = `
    <div class="grid ${colsClass} gap-2.5 sm:gap-3 w-full mt-auto pt-4 relative z-10 shrink-0">
      ${cards}
    </div>`;
  }

  // 3. EXECUTIVE TITLE SLIDE
  if (isTitleSlide) {
    const formattedTitle = (title || 'Apresentação Executiva').replace(/\n/g, '<br />');

    return `
<section class="slide-item p-6 sm:p-8 md:p-10 ${themeClass} flex flex-col justify-between h-full min-h-[540px] max-h-full rounded-2xl shadow-xl border w-full relative overflow-hidden box-border" style="${bgStyle}">
  ${topHeaderHtml}

  <div class="my-auto py-2 sm:py-3 relative z-10 max-w-4xl">
    ${
      statusPill
        ? `<div class="inline-flex items-center gap-2 px-4 py-1.5 rounded-full ${
            isDark ? 'bg-white/10 border-white/20 text-white' : 'bg-blue-50 border-blue-200 text-blue-700'
          } border mb-4 text-xs font-semibold backdrop-blur-xs shadow-2xs">
            <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>${statusPill}</span>
          </div>`
        : ''
    }

    <h1 class="text-3xl sm:text-4xl md:text-5xl lg:text-5.5xl font-extrabold ${isDark ? 'text-white' : 'text-slate-900'} tracking-tight leading-tight">
      ${formattedTitle}
    </h1>

    ${
      subtitle
        ? `<p class="mt-3 sm:mt-4 text-sm sm:text-base md:text-lg ${isDark ? 'text-white/90' : 'text-slate-600'} leading-relaxed font-normal max-w-3xl">
            ${subtitle}
          </p>`
        : ''
    }
  </div>

  ${bottomCardsHtml}

  <div class="text-center text-xs ${isDark ? 'text-white/40' : 'text-slate-400'} pt-2 font-medium relative z-10 shrink-0">
    ${footerText || 'Documento Confidencial / Corporativo'}
  </div>
</section>`.trim();
  }

  // 4. CONTENT SLIDES (Slide 2+)
  const bodyShapes = shapes.filter(
    (s) => !s.isTitle && !s.isSubtitle && !bottomCards.includes(s) && s.yPct > 12 && s.yPct < 90
  );

  let bodyContentHtml = '';

  // 4A. Tables
  if (tables.length > 0) {
    const tableBlocks = tables
      .map((tbl) => {
        const headerRow = tbl.headers
          .map(
            (h, idx) =>
              `<th class="px-3.5 py-2.5 text-xs font-bold uppercase tracking-wider ${
                isDark ? 'text-white bg-slate-800' : 'text-slate-700 bg-slate-100'
              } ${
                tbl.alignments?.[idx] === 'right'
                  ? 'text-right'
                  : tbl.alignments?.[idx] === 'center'
                  ? 'text-center'
                  : 'text-left'
              }">${h}</th>`
          )
          .join('');

        const bodyRows = tbl.rows
          .map((row) => {
            return `
        <tr class="border-t ${
          isDark ? 'border-slate-800 hover:bg-slate-800/40' : 'border-slate-100 hover:bg-slate-50/80'
        }">
          ${row
            .map((cell, cIdx) => {
              return `<td class="px-3.5 py-2.5 text-xs ${
                isDark ? 'text-slate-200' : 'text-slate-800'
              } font-medium ${
                tbl.alignments?.[cIdx] === 'right'
                  ? 'text-right'
                  : tbl.alignments?.[cIdx] === 'center'
                  ? 'text-center'
                  : 'text-left'
              }">${cell}</td>`;
            })
            .join('')}
        </tr>`;
          })
          .join('');

        return `
      <div class="w-full overflow-x-auto rounded-xl border ${
        isDark ? 'border-slate-800 bg-slate-900/80' : 'border-slate-200 bg-white'
      } shadow-2xs my-auto">
        <table class="w-full text-left border-collapse">
          <thead><tr>${headerRow}</tr></thead>
          <tbody>${bodyRows}</tbody>
        </table>
      </div>`;
      })
      .join('\n');

    // Extra summary cards if any
    const extraCards = bodyShapes.filter((s) => s.text.length > 10).slice(0, 3);
    const extraCardsHtml =
      extraCards.length > 0
        ? `<div class="grid grid-cols-1 md:grid-cols-${Math.min(extraCards.length, 3)} gap-3 w-full mt-3">
            ${extraCards
              .map(
                (c) => `
              <div class="p-3 ${
                isDark ? 'bg-slate-800 border-slate-700 text-slate-200' : 'bg-white border-slate-200 text-slate-700'
              } rounded-xl border text-xs shadow-2xs">
                <p class="leading-relaxed">${c.text}</p>
              </div>`
              )
              .join('')}
          </div>`
        : '';

    bodyContentHtml = `
    <div class="flex flex-col justify-between h-full w-full my-auto space-y-3">
      ${tableBlocks}
      ${extraCardsHtml}
    </div>`;
  } else if (bodyShapes.length > 0) {
    // 4B. Group shapes into Columns or Cards based on geometry
    const leftShapes = bodyShapes.filter((s) => s.col === 'left');
    const rightShapes = bodyShapes.filter((s) => s.col === 'right');
    const hasClearTwoColumns = leftShapes.length > 0 && rightShapes.length > 0;

    if (hasClearTwoColumns) {
      const renderShapeCol = (shapesList: PptxShape[]) => {
        return shapesList
          .map((s) => {
            const lines = s.paragraphs.length > 0 ? s.paragraphs : s.text.split('\n').filter(Boolean);
            const heading = lines[0] || '';
            const rest = lines.slice(1);

            return `
            <div class="${
              isDark ? 'bg-slate-800/80 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900'
            } rounded-2xl border p-4 sm:p-5 shadow-2xs space-y-2">
              <h3 class="text-sm sm:text-base font-extrabold ${isDark ? 'text-white' : 'text-slate-900'}">${heading}</h3>
              ${
                rest.length > 0
                  ? `<div class="text-xs ${isDark ? 'text-slate-300' : 'text-slate-600'} space-y-1 leading-relaxed">
                      ${rest.map((r) => `<p>${r}</p>`).join('')}
                    </div>`
                  : ''
              }
            </div>`;
          })
          .join('\n');
      };

      bodyContentHtml = `
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 w-full my-auto items-stretch">
        <div class="space-y-4 flex flex-col justify-center">
          ${renderShapeCol(leftShapes)}
        </div>
        <div class="space-y-4 flex flex-col justify-center">
          ${renderShapeCol(rightShapes)}
        </div>
      </div>`;
    } else {
      // General Grid of Cards
      const validCards = bodyShapes.filter((s) => s.text.length > 5);
      const cardCols = Math.min(Math.max(1, validCards.length), 3);
      const gridClass =
        cardCols === 3
          ? 'grid-cols-1 md:grid-cols-3'
          : cardCols === 2
          ? 'grid-cols-1 md:grid-cols-2'
          : 'grid-cols-1';

      bodyContentHtml = `
      <div class="grid ${gridClass} gap-4 w-full my-auto">
        ${validCards
          .map((s) => {
            const lines = s.paragraphs.length > 0 ? s.paragraphs : s.text.split('\n').filter(Boolean);
            const titleLine = lines[0] || '';
            const otherLines = lines.slice(1);

            return `
            <div class="${
              isDark ? 'bg-slate-800/80 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900'
            } rounded-2xl border p-4 sm:p-5 shadow-2xs space-y-2 flex flex-col justify-between">
              <div>
                <h3 class="text-sm sm:text-base font-extrabold ${isDark ? 'text-white' : 'text-slate-900'}">${titleLine}</h3>
                ${
                  otherLines.length > 0
                    ? `<div class="text-xs ${isDark ? 'text-slate-300' : 'text-slate-600'} mt-2 space-y-1.5 leading-relaxed">
                        ${otherLines.map((l) => `<p>${l}</p>`).join('')}
                      </div>`
                    : ''
                }
              </div>
            </div>`;
          })
          .join('\n')}
      </div>`;
    }
  }

  // 4C. Render any embedded images
  if (images.length > 0) {
    const imagesHtml = `
    <div class="flex flex-wrap items-center justify-center gap-4 my-2">
      ${images
        .map(
          (img) =>
            `<img src="${img.dataUrl}" alt="${img.name}" class="rounded-xl object-contain max-h-48 md:max-h-60 shadow-xs" />`
        )
        .join('\n')}
    </div>`;

    if (!bodyContentHtml) {
      bodyContentHtml = imagesHtml;
    } else {
      bodyContentHtml += imagesHtml;
    }
  }

  // Fallback if empty
  if (!bodyContentHtml) {
    bodyContentHtml = `
    <div class="my-auto p-6 ${isDark ? 'bg-slate-800 text-slate-200' : 'bg-white text-slate-700'} rounded-2xl border border-slate-200 shadow-2xs text-sm">
      <p>${parsed.rawText || 'Conteúdo do slide'}</p>
    </div>`;
  }

  return `
<section class="slide-item p-6 sm:p-8 md:p-10 ${themeClass} flex flex-col justify-between h-full min-h-[540px] max-h-full rounded-2xl shadow-sm border w-full relative overflow-hidden box-border" style="${bgStyle}">
  <!-- Top Corporate Header -->
  ${topHeaderHtml}

  <!-- Body Content Zone -->
  <div class="flex-1 flex flex-col justify-center my-auto w-full relative z-10 overflow-hidden">
    ${bodyContentHtml}
  </div>

  <!-- Bottom Cards Row if present -->
  ${bottomCardsHtml}

  <!-- Footer Zone -->
  <div class="pt-3 border-t ${isDark ? 'border-white/10 text-white/50' : 'border-slate-200/80 text-slate-500'} flex items-center justify-between text-[11px] relative z-10 shrink-0">
    <span>${footerText || deckTitle || 'SlideStudio Apresentação'}</span>
    <span class="font-medium ${isDark ? 'text-white/40' : 'text-slate-400'}">Documento Corporativo</span>
    <span>Slide ${slideIndex}</span>
  </div>
</section>`.trim();
}

/**
 * Main Entry Point: Imports a PPTX file and returns a complete, editable PresentationDoc.
 * Analyzes each slide with Gemini AI when useAi is true, crafting tailored responsive HTML.
 */
export async function importPptxToPresentation(
  file: File | ArrayBuffer,
  options: {
    useAi?: boolean;
    onProgress?: PptxProgressCallback;
  } = {}
): Promise<PresentationDoc> {
  const { onProgress } = options;

  // Extract structured PPTX data with theme colors and spatial coordinates
  const { title, slides: rawSlides } = await parsePptxArchive(file, onProgress);

  const total = rawSlides.length;
  onProgress?.(`Estrutura descompactada: ${total} slides detectados.`, 28);

  const finalSlides: SlideData[] = [];

  for (let i = 0; i < total; i++) {
    const rawSlide = rawSlides[i];
    const slideTitleClean = rawSlide.title ? `"${rawSlide.title.substring(0, 32)}..."` : `Slide ${i + 1}`;
    let slideHtml = '';

    if (options.useAi !== false) {
      const progressPercent = 30 + Math.round(((i + 1) / total) * 65);
      onProgress?.(
        `Analisando com IA (${i + 1}/${total}): ${slideTitleClean}`,
        progressPercent
      );

      try {
        slideHtml = await convertSlideWithAi(rawSlide, title, i + 1, total);
      } catch (aiErr) {
        console.warn(`Análise com IA falhou para slide ${i + 1}, usando síntese dinâmica estruturada:`, aiErr);
        slideHtml = synthesizeSlideHtml(rawSlide, title);
      }
    } else {
      const progressPercent = 30 + Math.round(((i + 1) / total) * 65);
      onProgress?.(
        `Convertendo layout (${i + 1}/${total}): ${slideTitleClean}`,
        progressPercent
      );
      slideHtml = synthesizeSlideHtml(rawSlide, title);
    }

    // Sanitize any stray JSX comments
    slideHtml = slideHtml.replace(/\{\/\*[\s\S]*?\*\/\}/g, '');

    // Ensure all interactive elements have data-edit-id for instant visual editing in SlideStudio
    if (typeof document !== 'undefined') {
      try {
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = slideHtml;
        let counter = 0;
        tempDiv.querySelectorAll('h1, h2, h3, h4, h5, h6, p, span, div, tr, th, td, button, img, li, table').forEach((el) => {
          if (!el.getAttribute('data-edit-id')) {
            el.setAttribute('data-edit-id', `el-s${i + 1}-${counter++}`);
          }
        });
        if (tempDiv.firstElementChild) {
          slideHtml = tempDiv.innerHTML;
        }
      } catch (_) {}
    }

    finalSlides.push({
      id: generateId('slide'),
      title: rawSlide.title || `Slide ${i + 1}`,
      tagName: 'section',
      className: `slide-item p-4 sm:p-6 md:p-8 ${
        rawSlide.isDark ? 'bg-[#0038D1] text-white' : 'bg-[#F8F9FA] text-slate-900'
      } flex flex-col justify-between min-h-[540px] rounded-2xl shadow-sm border border-slate-200`,
      style: `font-family: "Plus Jakarta Sans", sans-serif; ${rawSlide.backgroundColor ? `background-color: ${rawSlide.backgroundColor};` : ''}`,
      attributes: {},
      htmlContent: slideHtml,
    });
  }

  onProgress?.('Apresentação pronta com fidelidade visual!', 100);

  return {
    title,
    headHtml: `
      <link rel="preconnect" href="https://fonts.googleapis.com">
      <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
      <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
      <style>
        :root {
          --primary-color: #0033c6;
          --accent-color: #e71a3b;
          --bg-color: #f8fafc;
          --text-color: #0f172a;
        }
        body {
          font-family: 'Plus Jakarta Sans', 'Inter', sans-serif;
          background-color: var(--bg-color);
          color: var(--text-color);
        }
      </style>
    `.trim(),
    slides: finalSlides,
    globalStyles: '',
    theme: {
      primaryColor: '#0033c6',
      accentColor: '#e71a3b',
      bgColor: '#f8fafc',
      textColor: '#0f172a',
      fontFamily: '"Plus Jakarta Sans", sans-serif',
    },
  };
}
