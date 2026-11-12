import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  ZoomIn,
  ZoomOut,
  Monitor,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  RotateCcw,
  Smartphone,
  BarChart2,
  LayoutGrid,
  Magnet,
  GripHorizontal,
  Move,
  Check,
  Copy,
  Scissors,
  ClipboardPaste,
  Plus,
  Trash2,
  Layers,
  ArrowLeftRight,
  Lock,
  Unlock,
} from 'lucide-react';
import { SlideData, PresentationDoc, DeviceMode } from '../types/presentation';
import { FloatingAIToolbar } from './FloatingAIToolbar';
import { cssStringToStyleObject } from '../utils/styleHelper';
import { initSlideCharts, initSlideTabs } from '../utils/chartHelper';
import Chart from 'chart.js/auto';

// Ensure Chart.js is globally accessible for inline slide scripts
if (typeof window !== 'undefined') {
  (window as any).Chart = Chart;
}

export interface SelectedElementInfo {
  id: string;
  tagName: string;
  className: string;
  textContent: string;
  innerHTML: string;
  isTextElement: boolean;
  element: HTMLElement;
  breadcrumbs: Array<{ id: string; tagName: string; className: string }>;
  animation?: {
    type: string;
    duration: string;
    delay: string;
    easing: string;
  };
  computedStyle: {
    color: string;
    backgroundColor: string;
    fontSize: string;
    fontWeight: string;
    textAlign: string;
    fontFamily: string;
    borderRadius: string;
    padding: string;
    borderWidth: string;
    borderColor: string;
    width?: string;
    height?: string;
    display?: string;
    gridColumn?: string;
  };
  layoutInfo?: {
    width: string;
    height: string;
    display: string;
    gridColumn: string;
    parentDisplay: string;
    parentIsGrid: boolean;
    parentIsFlex: boolean;
    approxCols: number;
    canMovePrev: boolean;
    canMoveNext: boolean;
  };
}

export interface SmartGuide {
  id: string;
  type: 'vertical' | 'horizontal';
  coord: number;
  start: number;
  end: number;
  label: string;
  matchedElementName?: string;
  isCenter?: boolean;
}

export function calculateSmartGuides({
  dragBox,
  allCandidates,
  target,
  baseBounding,
  scale,
  baseWidth,
  baseHeight,
  snapThreshold = 8,
}: {
  dragBox: {
    left: number;
    top: number;
    width: number;
    height: number;
    right: number;
    bottom: number;
    centerX: number;
    centerY: number;
  };
  allCandidates: HTMLElement[];
  target: HTMLElement;
  baseBounding: DOMRect;
  scale: number;
  baseWidth: number;
  baseHeight: number;
  snapThreshold?: number;
}): {
  guides: SmartGuide[];
  snappedDeltaX: number;
  snappedDeltaY: number;
} {
  const guides: SmartGuide[] = [];
  let bestDistX = Infinity;
  let snappedDeltaX = 0;
  let bestDistY = Infinity;
  let snappedDeltaY = 0;

  // 1. Reference: Slide Canvas Center Axes
  const slideCenterX = baseWidth / 2;
  const slideCenterY = baseHeight / 2;

  // Check Slide Vertical Center
  const distSlideCenterX = Math.abs(dragBox.centerX - slideCenterX);
  if (distSlideCenterX <= snapThreshold && distSlideCenterX < bestDistX) {
    bestDistX = distSlideCenterX;
    snappedDeltaX = slideCenterX - dragBox.centerX;
    guides.push({
      id: 'guide-slide-center-x',
      type: 'vertical',
      coord: slideCenterX,
      start: 0,
      end: baseHeight,
      label: 'Centro do Slide (Vertical)',
      isCenter: true,
    });
  }

  // Check Slide Horizontal Center
  const distSlideCenterY = Math.abs(dragBox.centerY - slideCenterY);
  if (distSlideCenterY <= snapThreshold && distSlideCenterY < bestDistY) {
    bestDistY = distSlideCenterY;
    snappedDeltaY = slideCenterY - dragBox.centerY;
    guides.push({
      id: 'guide-slide-center-y',
      type: 'horizontal',
      coord: slideCenterY,
      start: 0,
      end: baseWidth,
      label: 'Centro do Slide (Horizontal)',
      isCenter: true,
    });
  }

  // 2. Check each candidate element on the slide (prioritizing direct siblings)
  for (const cand of allCandidates) {
    if (cand === target || target.contains(cand)) continue;
    const cRect = cand.getBoundingClientRect();
    if (cRect.width < 12 || cRect.height < 12) continue;

    const cLeft = (cRect.left - baseBounding.left) / scale;
    const cTop = (cRect.top - baseBounding.top) / scale;
    const cWidth = cRect.width / scale;
    const cHeight = cRect.height / scale;
    const cRight = cLeft + cWidth;
    const cBottom = cTop + cHeight;
    const cCenterX = cLeft + cWidth / 2;
    const cCenterY = cTop + cHeight / 2;

    const isSibling = Boolean(target.parentElement && cand.parentElement === target.parentElement);
    const candName = cand.classList.contains('card')
      ? 'card'
      : cand.classList.contains('kpi-card')
      ? 'card-kpi'
      : cand.classList.contains('chart-card')
      ? 'chart-card'
      : cand.tagName.toLowerCase();

    const siblingPrefix = isSibling ? 'Irmão ' : '';

    // Check X alignments (Vertical guidelines)
    // A) Centers align
    const dCenter = Math.abs(dragBox.centerX - cCenterX);
    if (dCenter <= snapThreshold) {
      if (dCenter < bestDistX) {
        bestDistX = dCenter;
        snappedDeltaX = cCenterX - dragBox.centerX;
      }
      guides.push({
        id: `guide-cx-${candName}-${Math.round(cCenterX)}`,
        type: 'vertical',
        coord: cCenterX,
        start: Math.min(dragBox.top, cTop) - 8,
        end: Math.max(dragBox.bottom, cBottom) + 8,
        label: `${siblingPrefix}Centro (${Math.round(cCenterX)}px)`,
        matchedElementName: candName,
        isCenter: true,
      });
    }

    // B) Left edges align
    const dLeftLeft = Math.abs(dragBox.left - cLeft);
    if (dLeftLeft <= snapThreshold) {
      if (dLeftLeft < bestDistX) {
        bestDistX = dLeftLeft;
        snappedDeltaX = cLeft - dragBox.left;
      }
      guides.push({
        id: `guide-ll-${candName}-${Math.round(cLeft)}`,
        type: 'vertical',
        coord: cLeft,
        start: Math.min(dragBox.top, cTop) - 8,
        end: Math.max(dragBox.bottom, cBottom) + 8,
        label: `${siblingPrefix}Borda Esq (${Math.round(cLeft)}px)`,
        matchedElementName: candName,
      });
    }

    // C) Right edges align
    const dRightRight = Math.abs(dragBox.right - cRight);
    if (dRightRight <= snapThreshold) {
      if (dRightRight < bestDistX) {
        bestDistX = dRightRight;
        snappedDeltaX = cRight - dragBox.right;
      }
      guides.push({
        id: `guide-rr-${candName}-${Math.round(cRight)}`,
        type: 'vertical',
        coord: cRight,
        start: Math.min(dragBox.top, cTop) - 8,
        end: Math.max(dragBox.bottom, cBottom) + 8,
        label: `${siblingPrefix}Borda Dir (${Math.round(cRight)}px)`,
        matchedElementName: candName,
      });
    }

    // D) Left edge aligns with cand's right edge (abutting / side-by-side collision)
    const dLeftRight = Math.abs(dragBox.left - cRight);
    if (dLeftRight <= snapThreshold) {
      if (dLeftRight < bestDistX) {
        bestDistX = dLeftRight;
        snappedDeltaX = cRight - dragBox.left;
      }
      guides.push({
        id: `guide-lr-${candName}-${Math.round(cRight)}`,
        type: 'vertical',
        coord: cRight,
        start: Math.min(dragBox.top, cTop) - 8,
        end: Math.max(dragBox.bottom, cBottom) + 8,
        label: `${siblingPrefix}Encostado à Dir (${Math.round(cRight)}px)`,
        matchedElementName: candName,
      });
    }

    // E) Right edge aligns with cand's left edge (abutting on left)
    const dRightLeft = Math.abs(dragBox.right - cLeft);
    if (dRightLeft <= snapThreshold) {
      if (dRightLeft < bestDistX) {
        bestDistX = dRightLeft;
        snappedDeltaX = cLeft - dragBox.right;
      }
      guides.push({
        id: `guide-rl-${candName}-${Math.round(cLeft)}`,
        type: 'vertical',
        coord: cLeft,
        start: Math.min(dragBox.top, cTop) - 8,
        end: Math.max(dragBox.bottom, cBottom) + 8,
        label: `${siblingPrefix}Encostado à Esq (${Math.round(cLeft)}px)`,
        matchedElementName: candName,
      });
    }

    // Check Y alignments (Horizontal guidelines)
    // A) Centers align
    const dCenterY = Math.abs(dragBox.centerY - cCenterY);
    if (dCenterY <= snapThreshold) {
      if (dCenterY < bestDistY) {
        bestDistY = dCenterY;
        snappedDeltaY = cCenterY - dragBox.centerY;
      }
      guides.push({
        id: `guide-cy-${candName}-${Math.round(cCenterY)}`,
        type: 'horizontal',
        coord: cCenterY,
        start: Math.min(dragBox.left, cLeft) - 8,
        end: Math.max(dragBox.right, cRight) + 8,
        label: `${siblingPrefix}Centro Y (${Math.round(cCenterY)}px)`,
        matchedElementName: candName,
        isCenter: true,
      });
    }

    // B) Top edges align
    const dTopTop = Math.abs(dragBox.top - cTop);
    if (dTopTop <= snapThreshold) {
      if (dTopTop < bestDistY) {
        bestDistY = dTopTop;
        snappedDeltaY = cTop - dragBox.top;
      }
      guides.push({
        id: `guide-tt-${candName}-${Math.round(cTop)}`,
        type: 'horizontal',
        coord: cTop,
        start: Math.min(dragBox.left, cLeft) - 8,
        end: Math.max(dragBox.right, cRight) + 8,
        label: `${siblingPrefix}Topo (${Math.round(cTop)}px)`,
        matchedElementName: candName,
      });
    }

    // C) Bottom edges align
    const dBottomBottom = Math.abs(dragBox.bottom - cBottom);
    if (dBottomBottom <= snapThreshold) {
      if (dBottomBottom < bestDistY) {
        bestDistY = dBottomBottom;
        snappedDeltaY = cBottom - dragBox.bottom;
      }
      guides.push({
        id: `guide-bb-${candName}-${Math.round(cBottom)}`,
        type: 'horizontal',
        coord: cBottom,
        start: Math.min(dragBox.left, cLeft) - 8,
        end: Math.max(dragBox.right, cRight) + 8,
        label: `${siblingPrefix}Base (${Math.round(cBottom)}px)`,
        matchedElementName: candName,
      });
    }

    // D) Top edge aligns with cand's bottom edge (stacked below collision)
    const dTopBottom = Math.abs(dragBox.top - cBottom);
    if (dTopBottom <= snapThreshold) {
      if (dTopBottom < bestDistY) {
        bestDistY = dTopBottom;
        snappedDeltaY = cBottom - dragBox.top;
      }
      guides.push({
        id: `guide-tb-${candName}-${Math.round(cBottom)}`,
        type: 'horizontal',
        coord: cBottom,
        start: Math.min(dragBox.left, cLeft) - 8,
        end: Math.max(dragBox.right, cRight) + 8,
        label: `${siblingPrefix}Abaixo de <${candName}> (${Math.round(cBottom)}px)`,
        matchedElementName: candName,
      });
    }

    // E) Bottom edge aligns with cand's top edge (stacked above collision)
    const dBottomTop = Math.abs(dragBox.bottom - cTop);
    if (dBottomTop <= snapThreshold) {
      if (dBottomTop < bestDistY) {
        bestDistY = dBottomTop;
        snappedDeltaY = cTop - dragBox.bottom;
      }
      guides.push({
        id: `guide-bt-${candName}-${Math.round(cTop)}`,
        type: 'horizontal',
        coord: cTop,
        start: Math.min(dragBox.left, cLeft) - 8,
        end: Math.max(dragBox.right, cRight) + 8,
        label: `${siblingPrefix}Acima de <${candName}> (${Math.round(cTop)}px)`,
        matchedElementName: candName,
      });
    }
  }

  // Deduplicate and filter to keep most accurate guides (up to 3 vertical and 3 horizontal)
  const uniqueGuidesMap = new Map<string, SmartGuide>();
  for (const g of guides) {
    const key = `${g.type}-${Math.round(g.coord)}`;
    if (!uniqueGuidesMap.has(key)) {
      uniqueGuidesMap.set(key, g);
    }
  }

  const allGuides = Array.from(uniqueGuidesMap.values());
  const verticalGuides = allGuides.filter((g) => g.type === 'vertical').slice(-3);
  const horizontalGuides = allGuides.filter((g) => g.type === 'horizontal').slice(-3);

  return {
    guides: [...verticalGuides, ...horizontalGuides],
    snappedDeltaX: bestDistX <= snapThreshold ? snappedDeltaX : 0,
    snappedDeltaY: bestDistY <= snapThreshold ? snappedDeltaY : 0,
  };
}

interface SlideCanvasProps {
  slide: SlideData;
  slideIndex: number;
  totalSlides: number;
  presentation?: PresentationDoc;
  isCompactMode?: boolean;
  deviceMode?: DeviceMode;
  onChangeDeviceMode?: (mode: DeviceMode) => void;
  onOpenChartEditor?: (canvas: HTMLCanvasElement) => void;
  onUpdateSlideHtml: (newHtml: string) => void;
  onUpdateSlideProps?: (props: Partial<SlideData>) => void;
  selectedElement: SelectedElementInfo | null;
  onSelectElement: (info: SelectedElementInfo | null) => void;
  onPrevSlide: () => void;
  onNextSlide: () => void;
  onCopyElement?: () => void;
  onCutElement?: () => void;
  onPasteElement?: () => void;
  hasClipboard?: boolean;
  onOpenInsertModal?: () => void;
}

export const SlideCanvas: React.FC<SlideCanvasProps> = ({
  slide,
  slideIndex,
  totalSlides,
  presentation,
  isCompactMode = false,
  deviceMode = 'desktop',
  onChangeDeviceMode,
  onOpenChartEditor,
  onUpdateSlideHtml,
  selectedElement,
  onSelectElement,
  onPrevSlide,
  onNextSlide,
  onCopyElement,
  onCutElement,
  onPasteElement,
  hasClipboard = false,
  onOpenInsertModal,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const stageAreaRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const slideRef = useRef<HTMLDivElement>(null);

  // Zoom & responsiveness state
  const [zoomMode, setZoomMode] = useState<'fit' | 'manual'>('fit');
  const [manualZoom, setManualZoom] = useState<number>(1);
  const [autoScale, setAutoScale] = useState<number>(1);
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '4:3'>('16:9');

  const [hoveredElement, setHoveredElement] = useState<HTMLElement | null>(null);
  const [hoverRect, setHoverRect] = useState<{ top: number; left: number; width: number; height: number } | null>(null);
  const [selectedRect, setSelectedRect] = useState<{ top: number; left: number; width: number; height: number } | null>(null);
  const [isEditingText, setIsEditingText] = useState(false);

  // Responsive Grid & Direct Manipulation state
  const [showGridOverlay, setShowGridOverlay] = useState<boolean>(false);
  const [snapToGrid, setSnapToGrid] = useState<boolean>(true);
  const [isResizing, setIsResizing] = useState<boolean>(false);
  const [resizeHUD, setResizeHUD] = useState<{
    width: number;
    height: number;
    cols: number;
    isSnapped: boolean;
    siblingWidth?: number;
    siblingPercent?: number;
    percent?: number;
    deltaW?: number;
    deltaH?: number;
    aspectLocked?: boolean;
  } | null>(null);
  const [multiSelectedElements, setMultiSelectedElements] = useState<HTMLElement[]>([]);
  const [isMultiSelectMode, setIsMultiSelectMode] = useState<boolean>(false);
  const [isDraggingElement, setIsDraggingElement] = useState<boolean>(false);
  const [dropTarget, setDropTarget] = useState<{
    element: HTMLElement;
    position: 'before' | 'after' | 'inside-start' | 'inside-end' | 'swap';
    orientation?: 'horizontal' | 'vertical';
    rect: { top: number; left: number; width: number; height: number };
    isContainer?: boolean;
    containerLabel?: string;
    isGridSlot?: boolean;
    isSwap?: boolean;
    swapWithLabel?: string;
    gridColIndex?: number;
    totalCols?: number;
    slotLabel?: string;
  } | null>(null);
  const dropTargetRef = useRef<typeof dropTarget>(null);
  const [dragCursorPos, setDragCursorPos] = useState<{ x: number; y: number } | null>(null);
  const [smartGuides, setSmartGuides] = useState<SmartGuide[]>([]);

  // Virtual slide canonical size: real smartphone 19.5:9 proportion (390 x 844)
  const isMobileView = deviceMode === 'mobile';
  const baseWidth = isMobileView ? 390 : 960;
  const baseHeight = isMobileView ? 844 : (aspectRatio === '16:9' ? 540 : 720);

  // Measure stage area directly and compute responsive scale factor
  const updateResponsiveScale = useCallback(() => {
    const targetEl = stageAreaRef.current || containerRef.current;
    if (!targetEl) return;
    const { clientWidth, clientHeight } = targetEl;
    if (clientWidth === 0 || clientHeight === 0) return;

    // In mobile view, expand vertically to utilize all available vertical height
    // leaving minimal vertical margin (8px top + 8px bottom = 16px) so the phone bezel & shadow are completely visible
    const paddingX = isMobileView ? 16 : 24;
    const paddingY = isMobileView ? 16 : 32;

    const availW = Math.max(120, clientWidth - paddingX);
    const availH = Math.max(120, clientHeight - paddingY);

    const scaleW = availW / baseWidth;
    const scaleH = availH / baseHeight;

    // On mobile view on desktop/laptop, available width is large, so scaleH governs height.
    // The phone mock expands vertically to occupy the entire available height.
    const fit = isMobileView
      ? Math.min(scaleW, scaleH)
      : Math.min(scaleW, scaleH, 1.35);

    setAutoScale(Math.max(0.3, Number(fit.toFixed(2))));
  }, [baseWidth, baseHeight, isMobileView]);

  // Reset zoom mode to fit and clear selection whenever deviceMode changes
  useEffect(() => {
    setZoomMode('fit');
    setHoveredElement(null);
    setHoverRect(null);
    const timer = setTimeout(() => {
      updateResponsiveScale();
    }, 20);
    return () => clearTimeout(timer);
  }, [deviceMode, aspectRatio, updateResponsiveScale]);

  useEffect(() => {
    updateResponsiveScale();

    const resizeObserver = new ResizeObserver(() => {
      updateResponsiveScale();
    });

    const targetEl = stageAreaRef.current || containerRef.current;
    if (targetEl) {
      resizeObserver.observe(targetEl);
    }

    return () => {
      resizeObserver.disconnect();
    };
  }, [updateResponsiveScale]);

  const effectiveZoom = zoomMode === 'fit' ? autoScale : manualZoom;

  // Sync element ID tag inside DOM
  const ensureEditIds = useCallback(() => {
    if (!slideRef.current) return;
    const elements = slideRef.current.querySelectorAll('*');
    elements.forEach((el, idx) => {
      if (!el.getAttribute('data-edit-id')) {
        el.setAttribute('data-edit-id', `el-${idx}-${Date.now().toString(36)}`);
      }
    });
  }, []);

  // Auto-initialize charts and tab switching on slide change or content update
  useEffect(() => {
    const timer = setTimeout(() => {
      const targetContainer = stageRef.current || slideRef.current;
      if (!targetContainer) return;
      const cleanupCharts = initSlideCharts(targetContainer);
      const cleanupTabs = initSlideTabs(targetContainer);

      return () => {
        cleanupCharts();
        cleanupTabs();
      };
    }, 60);

    return () => clearTimeout(timer);
  }, [slide.id, slideIndex, slide.htmlContent, deviceMode]);

  // Update selection rectangle normalized to base 960x540 coordinates
  const updateSelectedRect = useCallback(() => {
    const baseTarget = stageRef.current || slideRef.current;
    if (selectedElement?.element && baseTarget) {
      if (document.body.contains(selectedElement.element)) {
        const rect = selectedElement.element.getBoundingClientRect();
        const baseBounding = baseTarget.getBoundingClientRect();
        const scale = effectiveZoom > 0 ? effectiveZoom : 1;

        setSelectedRect({
          left: (rect.left - baseBounding.left) / scale,
          top: (rect.top - baseBounding.top) / scale,
          width: rect.width / scale,
          height: rect.height / scale,
        });
      } else {
        setSelectedRect(null);
      }
    } else {
      setSelectedRect(null);
    }
  }, [selectedElement, effectiveZoom]);

  useEffect(() => {
    ensureEditIds();
    updateSelectedRect();
  }, [slide.htmlContent, ensureEditIds, updateSelectedRect, effectiveZoom]);

  // Handle element selection
  const handleElementSelect = (target: HTMLElement) => {
    if (!slideRef.current || target === slideRef.current) {
      onSelectElement(null);
      return;
    }

    const editId = target.getAttribute('data-edit-id') || `el-${Date.now().toString(36)}`;
    target.setAttribute('data-edit-id', editId);

    // Build breadcrumbs
    const breadcrumbs: Array<{ id: string; tagName: string; className: string }> = [];
    let current: HTMLElement | null = target;
    while (current && current !== slideRef.current) {
      breadcrumbs.unshift({
        id: current.getAttribute('data-edit-id') || '',
        tagName: current.tagName.toLowerCase(),
        className: current.getAttribute('class') || '',
      });
      current = current.parentElement;
    }

    const computed = window.getComputedStyle(target);
    const tagName = target.tagName.toUpperCase();
    const isText = ['H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'P', 'SPAN', 'STRONG', 'EM', 'B', 'I', 'LI', 'LABEL', 'BUTTON'].includes(tagName);

    const animType = target.getAttribute('data-animate') || '';
    const animDuration = target.getAttribute('data-animate-duration') || '0.6s';
    const animDelay = target.getAttribute('data-animate-delay') || '0s';
    const animEasing = target.getAttribute('data-animate-easing') || 'cubic-bezier(0.16, 1, 0.3, 1)';

    // Layout & Grid Metrics
    const parent = target.parentElement;
    const parentComputed = parent ? window.getComputedStyle(parent) : null;
    const isParentGrid = parentComputed?.display === 'grid' || parentComputed?.display === 'inline-grid';
    const isParentFlex = parentComputed?.display === 'flex' || parentComputed?.display === 'inline-flex';

    let approxCols = 12;
    if (parent && parent.clientWidth > 0 && target.offsetWidth > 0) {
      const ratio = target.offsetWidth / parent.clientWidth;
      approxCols = Math.min(12, Math.max(1, Math.round(ratio * 12)));
    }

    const canMovePrev = Boolean(target.previousElementSibling);
    const canMoveNext = Boolean(target.nextElementSibling);

    const info: SelectedElementInfo = {
      id: editId,
      tagName,
      className: target.getAttribute('class') || '',
      textContent: target.textContent || '',
      innerHTML: target.innerHTML || '',
      isTextElement: isText,
      element: target,
      breadcrumbs,
      animation:
        animType && animType !== 'none'
          ? {
              type: animType,
              duration: animDuration,
              delay: animDelay,
              easing: animEasing,
            }
          : undefined,
      computedStyle: {
        color: computed.color,
        backgroundColor: computed.backgroundColor,
        fontSize: computed.fontSize,
        fontWeight: computed.fontWeight,
        textAlign: computed.textAlign,
        fontFamily: computed.fontFamily,
        borderRadius: computed.borderRadius,
        padding: computed.padding,
        borderWidth: computed.borderWidth,
        borderColor: computed.borderColor,
        width: computed.width,
        height: computed.height,
        display: computed.display,
        gridColumn: computed.gridColumn,
      },
      layoutInfo: {
        width: computed.width,
        height: computed.height,
        display: computed.display,
        gridColumn: computed.gridColumn,
        parentDisplay: parentComputed?.display || 'block',
        parentIsGrid: Boolean(isParentGrid),
        parentIsFlex: Boolean(isParentFlex),
        approxCols,
        canMovePrev,
        canMoveNext,
      },
    };

    onSelectElement(info);
  };

  // Interactive Resizing on Canvas with Proportional Grid Snapping & Aspect Ratio Locking
  const handleResizeStart = (
    dir: 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w',
    e: React.MouseEvent | React.TouchEvent
  ) => {
    e.preventDefault();
    e.stopPropagation();

    if (!selectedElement?.element || !slideRef.current) return;
    const target = selectedElement.element;
    const parent = target.parentElement || slideRef.current;
    const parentWidth = parent.clientWidth || baseWidth;

    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    const startWidth = target.offsetWidth;
    const startHeight = target.offsetHeight;
    const startX = clientX;
    const startY = clientY;
    const origRatio = startWidth > 0 && startHeight > 0 ? startWidth / startHeight : 1;

    // Detect if media, canvas, avatar or icon should naturally preserve aspect ratio
    const isNaturalMedia =
      target.tagName === 'IMG' ||
      target.tagName === 'CANVAS' ||
      target.classList.contains('avatar') ||
      target.classList.contains('icon') ||
      target.classList.contains('chart-container');

    setIsResizing(true);

    const onMouseMove = (moveEvent: MouseEvent | TouchEvent) => {
      const currX = 'touches' in moveEvent ? moveEvent.touches[0].clientX : moveEvent.clientX;
      const currY = 'touches' in moveEvent ? moveEvent.touches[0].clientY : moveEvent.clientY;
      const isShiftHeld = 'shiftKey' in moveEvent && moveEvent.shiftKey;
      const isAspectLocked = isShiftHeld || isNaturalMedia;

      const scale = effectiveZoom > 0 ? effectiveZoom : 1;
      const dx = (currX - startX) / scale;
      const dy = (currY - startY) / scale;

      let newWidth = startWidth;
      let newHeight = startHeight;

      if (dir.includes('e')) newWidth = startWidth + dx;
      if (dir.includes('w')) newWidth = startWidth - dx;
      if (dir.includes('s')) newHeight = startHeight + dy;
      if (dir.includes('n')) newHeight = startHeight - dy;

      // Smart minimum dimensions based on element nature
      const isCardWithChildren = target.children.length > 1;
      const minW = isCardWithChildren ? 100 : target.tagName.startsWith('H') ? 80 : 36;
      const minH = isCardWithChildren ? 60 : 20;

      newWidth = Math.max(minW, newWidth);
      newHeight = Math.max(minH, newHeight);

      // Aspect ratio constraint for diagonal resize
      const isDiagonal = ['nw', 'ne', 'se', 'sw'].includes(dir);
      if (isAspectLocked && isDiagonal) {
        if (Math.abs(dx) >= Math.abs(dy)) {
          newHeight = Math.max(minH, Math.round(newWidth / origRatio));
        } else {
          newWidth = Math.max(minW, Math.round(newHeight * origRatio));
        }
      }

      const parentComputed = window.getComputedStyle(parent);
      const isGrid = parentComputed.display === 'grid' || parent.classList.contains('split-view') || parent.classList.contains('split-view-equal');
      const gap = parseFloat(parentComputed.columnGap || parentComputed.gap || '16') || 16;

      // 12-Column Responsive Grid Snapping
      let isSnapped = false;
      const colUnit = (parentWidth - 11 * gap) / 12;
      let snappedCols = Math.min(12, Math.max(1, Math.round((newWidth + gap) / (colUnit + gap))));

      if (snapToGrid && !isAspectLocked) {
        const snapThresholdPx = 18;
        for (let c = 1; c <= 12; c++) {
          const colPx = Math.round(c * colUnit + (c - 1) * gap);
          if (Math.abs(newWidth - colPx) < snapThresholdPx) {
            newWidth = colPx;
            snappedCols = c;
            isSnapped = true;
            break;
          }
        }
      }

      // Sibling elements for smart complementary auto-resize in multi-column layouts
      const siblingElements = Array.from(parent.children).filter(
        (child) => child !== target && (child as HTMLElement).offsetWidth > 0
      ) as HTMLElement[];

      let siblingWidthInfo: number | undefined = undefined;
      let siblingPctInfo: number | undefined = undefined;
      const targetPct = Math.min(88, Math.max(12, Math.round((newWidth / parentWidth) * 100)));

      // Apply to element & auto-resize sibling cards
      if (dir.includes('e') || dir.includes('w')) {
        if (siblingElements.length === 1) {
          const sibling = siblingElements[0];
          const targetIdx = Array.from(parent.children).indexOf(target);
          const siblingPct = 100 - targetPct;
          siblingPctInfo = siblingPct;
          siblingWidthInfo = Math.round((parentWidth * siblingPct) / 100);

          if (isGrid) {
            // Use percentage columns so it remains completely responsive on all viewports!
            if (targetIdx === 0) {
              parent.style.gridTemplateColumns = `${targetPct}% ${siblingPct}%`;
            } else {
              parent.style.gridTemplateColumns = `${siblingPct}% ${targetPct}%`;
            }
            target.style.width = '100%';
            target.style.maxWidth = '100%';
            sibling.style.width = '100%';
            sibling.style.maxWidth = '100%';
          } else {
            target.style.width = `${targetPct}%`;
            target.style.maxWidth = '100%';
            target.style.flex = `0 0 ${targetPct}%`;
            target.style.boxSizing = 'border-box';

            sibling.style.width = `${siblingPct}%`;
            sibling.style.maxWidth = '100%';
            sibling.style.flex = `0 0 ${siblingPct}%`;
            sibling.style.minWidth = '0';
            sibling.style.boxSizing = 'border-box';
          }
        } else if (siblingElements.length > 1) {
          const totalSiblings = siblingElements.length;
          const remainingPct = Math.max(10 * totalSiblings, 100 - targetPct);
          const perSiblingPct = Math.round(remainingPct / totalSiblings);
          siblingPctInfo = perSiblingPct;
          siblingWidthInfo = Math.round((parentWidth * perSiblingPct) / 100);

          siblingElements.forEach((sib) => {
            sib.style.width = `${perSiblingPct}%`;
            sib.style.flex = `1 1 0%`;
            sib.style.minWidth = '0';
            sib.style.boxSizing = 'border-box';
          });
          target.style.width = `${targetPct}%`;
          target.style.maxWidth = '100%';
          target.style.boxSizing = 'border-box';
        } else {
          if (isSnapped) {
            const pct = Math.round((snappedCols / 12) * 100);
            target.style.width = snappedCols === 12 ? '100%' : `${pct}%`;
          } else {
            target.style.width = `${Math.round(newWidth)}px`;
          }
          target.style.maxWidth = '100%';
          target.style.boxSizing = 'border-box';
        }
      }

      if (dir.includes('s') || dir.includes('n')) {
        target.style.height = `${Math.round(newHeight)}px`;
        target.style.boxSizing = 'border-box';
      }

      setResizeHUD({
        width: Math.round(newWidth),
        height: Math.round(newHeight),
        cols: snappedCols,
        isSnapped,
        siblingWidth: siblingWidthInfo,
        siblingPercent: siblingPctInfo,
        percent: targetPct,
        deltaW: Math.round(newWidth - startWidth),
        deltaH: Math.round(newHeight - startHeight),
        aspectLocked: isAspectLocked,
      });

      updateSelectedRect();
    };

    const onMouseUp = () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('touchmove', onMouseMove);
      window.removeEventListener('touchend', onMouseUp);

      setIsResizing(false);
      setResizeHUD(null);
      setSmartGuides([]);

      if (slideRef.current) {
        onUpdateSlideHtml(slideRef.current.innerHTML);
      }
      handleElementSelect(target);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    window.addEventListener('touchmove', onMouseMove);
    window.addEventListener('touchend', onMouseUp);
  };

  // Drag and Drop Element Reordering on Canvas (Precision Grid, Containers & Responsive Free-flow)
  const handleDragStart = (e: React.MouseEvent | React.TouchEvent | MouseEvent | TouchEvent | { clientX: number; clientY: number; preventDefault?: () => void; stopPropagation?: () => void }) => {
    if ('preventDefault' in e && typeof e.preventDefault === 'function') e.preventDefault();
    if ('stopPropagation' in e && typeof e.stopPropagation === 'function') e.stopPropagation();

    if (!selectedElement?.element || !slideRef.current) return;
    const target = selectedElement.element;
    const baseTarget = stageRef.current || slideRef.current;

    const startClientX = 'touches' in e && e.touches && e.touches.length > 0 ? e.touches[0].clientX : (e as any).clientX;
    const startClientY = 'touches' in e && e.touches && e.touches.length > 0 ? e.touches[0].clientY : (e as any).clientY;
    setDragCursorPos({ x: startClientX, y: startClientY });

    // Ghost the original element visually so the user sees which one is moving
    target.style.opacity = '0.35';
    target.style.transition = 'opacity 0.15s ease';

    const scale = effectiveZoom > 0 ? effectiveZoom : 1;
    const baseBounding = baseTarget.getBoundingClientRect();
    const targetBounding = target.getBoundingClientRect();
    const initialStageRect = {
      left: (targetBounding.left - baseBounding.left) / scale,
      top: (targetBounding.top - baseBounding.top) / scale,
      width: targetBounding.width / scale,
      height: targetBounding.height / scale,
    };

    // Collect all candidates on the slide (excluding target and any children inside target)
    const allCandidates = Array.from(
      slideRef.current.querySelectorAll(
        '.card, .kpi-card, .chart-card, .metric-card, table, [data-edit-id], p, h1, h2, h3, h4, div, section, article, .grid > *, .split-view > *'
      )
    ).filter(
      (el) =>
        el !== target &&
        !target.contains(el) &&
        (el as HTMLElement).offsetWidth > 20 &&
        (el as HTMLElement).offsetHeight > 14
    ) as HTMLElement[];

    setIsDraggingElement(true);

    let rafId: number | null = null;

    const onMouseMove = (moveEvent: MouseEvent | TouchEvent) => {
      const currX = 'touches' in moveEvent ? moveEvent.touches[0].clientX : moveEvent.clientX;
      const currY = 'touches' in moveEvent ? moveEvent.touches[0].clientY : moveEvent.clientY;
      setDragCursorPos({ x: currX, y: currY });

      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        // Compute projected virtual box of the moving element on the canvas stage
        const dx = (currX - startClientX) / scale;
        const dy = (currY - startClientY) / scale;

        const dragBox = {
          left: initialStageRect.left + dx,
          top: initialStageRect.top + dy,
          width: initialStageRect.width,
          height: initialStageRect.height,
          right: initialStageRect.left + dx + initialStageRect.width,
          bottom: initialStageRect.top + dy + initialStageRect.height,
          centerX: initialStageRect.left + dx + initialStageRect.width / 2,
          centerY: initialStageRect.top + dy + initialStageRect.height / 2,
        };

        // Calculate Smart Snapping Guides (align with other components' edges and centers)
        if (snapToGrid) {
          const { guides } = calculateSmartGuides({
            dragBox,
            allCandidates,
            target,
            baseBounding,
            scale,
            baseWidth,
            baseHeight,
            snapThreshold: 10,
          });
          setSmartGuides(guides);
        } else {
          setSmartGuides([]);
        }

        // Find all elements under the cursor that belong to slideRef, excluding target and its children
        const elementsUnder = document.elementsFromPoint(currX, currY);
        const slideElements = elementsUnder.filter(
          (el) =>
            slideRef.current &&
            slideRef.current.contains(el) &&
            el !== target &&
            !target.contains(el)
        ) as HTMLElement[];

        const setTargetState = (info: typeof dropTarget) => {
          dropTargetRef.current = info;
          setDropTarget(info);
        };

        // Helper: get friendly label for an element
        const getFriendlyLabel = (el: HTMLElement) => {
          if (el.classList.contains('kpi-card')) return 'Card KPI';
          if (el.classList.contains('chart-card') || el.classList.contains('chart-container')) return 'Gráfico';
          if (el.classList.contains('card')) return 'Card';
          const headingText = el.querySelector('h1, h2, h3, h4, .kpi-label, .kpi-value')?.textContent?.trim();
          if (headingText && headingText.length <= 25) return `"${headingText}"`;
          return `<${el.tagName.toLowerCase()}>`;
        };

        // Helper: check if element is a droppable container
        const isContainerElement = (el: HTMLElement) => {
          if (el === slideRef.current) return false;
          const tag = el.tagName.toUpperCase();
          const cls = el.className || '';
          return (
            cls.includes('card') ||
            cls.includes('kpi-card') ||
            cls.includes('chart-card') ||
            cls.includes('metric-card') ||
            cls.includes('container') ||
            cls.includes('panel') ||
            cls.includes('box') ||
            ['SECTION', 'ARTICLE', 'FIELDSET', 'ASIDE', 'BLOCKQUOTE'].includes(tag) ||
            (tag === 'DIV' && (el.children.length > 0 || (el.getAttribute('data-edit-id') && el.offsetHeight > 40)))
          );
        };

        // 1. Check if hovering inside or over a GRID or SPLIT-VIEW container
        const gridContainer = slideElements.find(
          (el) =>
            el.classList.contains('grid') ||
            el.classList.contains('split-view') ||
            el.classList.contains('split-view-equal') ||
            el.classList.contains('kpi-row') ||
            el.classList.contains('kpi-row-6') ||
            el.className.includes('grid-cols') ||
            window.getComputedStyle(el).display === 'grid'
        );

        if (gridContainer) {
          const gRect = gridContainer.getBoundingClientRect();
          const colMatch = gridContainer.className.match(/grid-cols-(\d+)/);
          let numCols = colMatch ? parseInt(colMatch[1], 10) : 0;
          if (!numCols) {
            if (gridContainer.classList.contains('split-view') || gridContainer.classList.contains('split-view-equal')) {
              numCols = 2;
            } else if (gridContainer.classList.contains('kpi-row-6')) {
              numCols = 6;
            } else if (gridContainer.classList.contains('kpi-row')) {
              numCols = 4;
            } else {
              const tmplCols = window.getComputedStyle(gridContainer).gridTemplateColumns;
              if (tmplCols && tmplCols !== 'none') {
                numCols = tmplCols.split(/\s+/).filter(Boolean).length;
              }
            }
          }
          if (!numCols || numCols < 1) numCols = Math.max(1, gridContainer.children.length);

          const colWidth = gRect.width / numCols;
          const targetCol = Math.min(numCols - 1, Math.max(0, Math.floor((currX - gRect.left) / colWidth)));

          const gridChildren = Array.from(gridContainer.children).filter(
            (c) => c !== target && !target.contains(c)
          ) as HTMLElement[];

          const hitChild = gridChildren.find(
            (c) => c === slideElements[0] || c.contains(slideElements[0])
          );

          if (hitChild) {
            const chRect = hitChild.getBoundingClientRect();
            const childLabel = getFriendlyLabel(hitChild);
            const relX = (currX - chRect.left) / Math.max(1, chRect.width);

            // Center 56% = SWAP direct positions in grid!
            if (relX >= 0.22 && relX <= 0.78) {
              setTargetState({
                element: hitChild,
                position: 'swap',
                isSwap: true,
                swapWithLabel: childLabel,
                orientation: 'horizontal',
                isGridSlot: true,
                gridColIndex: targetCol,
                totalCols: numCols,
                slotLabel: `⇄ Trocar de lugar com ${childLabel} (Coluna ${targetCol + 1} de ${numCols})`,
                rect: {
                  left: (chRect.left - baseBounding.left) / scale,
                  top: (chRect.top - baseBounding.top) / scale,
                  width: chRect.width / scale,
                  height: chRect.height / scale,
                },
              });
              return;
            }

            const isBefore = relX < 0.22;
            setTargetState({
              element: hitChild,
              position: isBefore ? 'before' : 'after',
              orientation: 'horizontal',
              isGridSlot: true,
              gridColIndex: targetCol,
              totalCols: numCols,
              slotLabel: isBefore
                ? `Inserir antes de ${childLabel} (Coluna ${targetCol + 1} de ${numCols})`
                : `Inserir depois de ${childLabel} (Coluna ${targetCol + 1} de ${numCols})`,
              rect: {
                left: (gRect.left + targetCol * colWidth - baseBounding.left) / scale,
                top: (gRect.top - baseBounding.top) / scale,
                width: colWidth / scale,
                height: Math.max(gRect.height, chRect.height) / scale,
              },
            });
            return;
          } else {
            // Open slot in grid
            if (targetCol < gridChildren.length) {
              const targetChild = gridChildren[targetCol];
              setTargetState({
                element: targetChild,
                position: 'before',
                orientation: 'horizontal',
                isGridSlot: true,
                gridColIndex: targetCol,
                totalCols: numCols,
                slotLabel: `Posicionar na Coluna ${targetCol + 1} de ${numCols}`,
                rect: {
                  left: (gRect.left + targetCol * colWidth - baseBounding.left) / scale,
                  top: (gRect.top - baseBounding.top) / scale,
                  width: colWidth / scale,
                  height: gRect.height / scale,
                },
              });
            } else {
              setTargetState({
                element: gridContainer,
                position: 'inside-end',
                isContainer: true,
                isGridSlot: true,
                gridColIndex: targetCol,
                totalCols: numCols,
                containerLabel: `Grade (${numCols} colunas)`,
                slotLabel: `Inserir na Coluna ${targetCol + 1} de ${numCols}`,
                rect: {
                  left: (gRect.left + targetCol * colWidth - baseBounding.left) / scale,
                  top: (gRect.top - baseBounding.top) / scale,
                  width: colWidth / scale,
                  height: gRect.height / scale,
                },
              });
            }
            return;
          }
        }

        // 2. Check if hovering over or inside a CONTAINER or SIBLING CARD
        const targetContainer = slideElements.find(isContainerElement);
        if (targetContainer) {
          const cRect = targetContainer.getBoundingClientRect();
          const edgeThresholdY = Math.min(24, cRect.height * 0.16);
          const hasParent = targetContainer.parentElement && targetContainer.parentElement !== slideRef.current;
          const isDirectSibling = Boolean(target.parentElement && targetContainer.parentElement === target.parentElement);
          const containerTitle = getFriendlyLabel(targetContainer);

          // If dragging over a direct sibling card, allow direct SWAP when hovering in the body!
          if (isDirectSibling && cRect.width > 60 && cRect.height > 40) {
            const relY = (currY - cRect.top) / cRect.height;
            const relX = (currX - cRect.left) / cRect.width;

            if (relY > 0.18 && relY < 0.82 && relX > 0.15 && relX < 0.85) {
              setTargetState({
                element: targetContainer,
                position: 'swap',
                isSwap: true,
                swapWithLabel: containerTitle,
                slotLabel: `⇄ Trocar de lugar com ${containerTitle}`,
                rect: {
                  left: (cRect.left - baseBounding.left) / scale,
                  top: (cRect.top - baseBounding.top) / scale,
                  width: cRect.width / scale,
                  height: cRect.height / scale,
                },
              });
              return;
            }
          }

          // Extreme top edge: insert BEFORE this container in its parent
          if (currY < cRect.top + edgeThresholdY && hasParent) {
            setTargetState({
              element: targetContainer,
              position: 'before',
              orientation: 'vertical',
              slotLabel: `Inserir antes de ${containerTitle}`,
              rect: {
                left: (cRect.left - baseBounding.left) / scale,
                top: (cRect.top - baseBounding.top) / scale,
                width: cRect.width / scale,
                height: cRect.height / scale,
              },
            });
            return;
          }

          // Extreme bottom edge: insert AFTER this container in its parent
          if (currY > cRect.bottom - edgeThresholdY && hasParent) {
            setTargetState({
              element: targetContainer,
              position: 'after',
              orientation: 'vertical',
              slotLabel: `Inserir depois de ${containerTitle}`,
              rect: {
                left: (cRect.left - baseBounding.left) / scale,
                top: (cRect.top - baseBounding.top) / scale,
                width: cRect.width / scale,
                height: cRect.height / scale,
              },
            });
            return;
          }

          // INNER BODY: Drop INSIDE this container!
          const directChildren = Array.from(targetContainer.children).filter(
            (c) => c !== target && !target.contains(c)
          ) as HTMLElement[];

          if (directChildren.length === 0) {
            setTargetState({
              element: targetContainer,
              position: 'inside-end',
              isContainer: true,
              containerLabel: containerTitle,
              slotLabel: `Soltar dentro de ${containerTitle}`,
              rect: {
                left: (cRect.left - baseBounding.left) / scale,
                top: (cRect.top - baseBounding.top) / scale,
                width: cRect.width / scale,
                height: cRect.height / scale,
              },
            });
            return;
          }

          // Container has children: find if cursor is over or near a specific direct child
          const hitChild = directChildren.find(
            (c) => c === slideElements[0] || c.contains(slideElements[0])
          );

          if (hitChild) {
            const chRect = hitChild.getBoundingClientRect();
            const pComp = window.getComputedStyle(targetContainer);
            const isRow = pComp.display === 'flex' && !pComp.flexDirection.includes('column');
            const childName = getFriendlyLabel(hitChild);

            if (isRow) {
              const relX = (currX - chRect.left) / Math.max(1, chRect.width);
              if (relX >= 0.25 && relX <= 0.75 && hitChild.parentElement === target.parentElement) {
                setTargetState({
                  element: hitChild,
                  position: 'swap',
                  isSwap: true,
                  swapWithLabel: childName,
                  orientation: 'horizontal',
                  slotLabel: `⇄ Trocar posição com ${childName}`,
                  rect: {
                    left: (chRect.left - baseBounding.left) / scale,
                    top: (chRect.top - baseBounding.top) / scale,
                    width: chRect.width / scale,
                    height: chRect.height / scale,
                  },
                });
                return;
              }
              const isBefore = relX < 0.5;
              setTargetState({
                element: hitChild,
                position: isBefore ? 'before' : 'after',
                orientation: 'horizontal',
                isContainer: true,
                containerLabel: containerTitle,
                slotLabel: isBefore
                  ? `Dentro de ${containerTitle} (antes de ${childName})`
                  : `Dentro de ${containerTitle} (depois de ${childName})`,
                rect: {
                  left: (cRect.left - baseBounding.left) / scale,
                  top: (cRect.top - baseBounding.top) / scale,
                  width: cRect.width / scale,
                  height: cRect.height / scale,
                },
              });
            } else {
              const relY = (currY - chRect.top) / Math.max(1, chRect.height);
              if (relY >= 0.25 && relY <= 0.75 && hitChild.parentElement === target.parentElement) {
                setTargetState({
                  element: hitChild,
                  position: 'swap',
                  isSwap: true,
                  swapWithLabel: childName,
                  orientation: 'vertical',
                  slotLabel: `⇄ Trocar posição com ${childName}`,
                  rect: {
                    left: (chRect.left - baseBounding.left) / scale,
                    top: (chRect.top - baseBounding.top) / scale,
                    width: chRect.width / scale,
                    height: chRect.height / scale,
                  },
                });
                return;
              }
              const isBefore = relY < 0.5;
              setTargetState({
                element: hitChild,
                position: isBefore ? 'before' : 'after',
                orientation: 'vertical',
                isContainer: true,
                containerLabel: containerTitle,
                slotLabel: isBefore
                  ? `Dentro de ${containerTitle} (antes de ${childName})`
                  : `Dentro de ${containerTitle} (depois de ${childName})`,
                rect: {
                  left: (cRect.left - baseBounding.left) / scale,
                  top: (cRect.top - baseBounding.top) / scale,
                  width: cRect.width / scale,
                  height: cRect.height / scale,
                },
              });
            }
            return;
          } else {
            setTargetState({
              element: targetContainer,
              position: 'inside-end',
              isContainer: true,
              containerLabel: containerTitle,
              slotLabel: `Soltar no fim de ${containerTitle}`,
              rect: {
                left: (cRect.left - baseBounding.left) / scale,
                top: (cRect.top - baseBounding.top) / scale,
                width: cRect.width / scale,
                height: cRect.height / scale,
              },
            });
            return;
          }
        }

        // 3. Hovering over a specific element (heading, paragraph, table, button, image, etc.)
        const specificEl = slideElements.find(
          (el) =>
            el !== slideRef.current &&
            (el.hasAttribute('data-edit-id') ||
              ['P', 'H1', 'H2', 'H3', 'H4', 'TABLE', 'UL', 'OL', 'BUTTON', 'IMG', 'DIV', 'SPAN'].includes(
                el.tagName
              ))
        );

        if (specificEl) {
          const elRect = specificEl.getBoundingClientRect();
          const pComp = window.getComputedStyle(specificEl.parentElement || specificEl);
          const isRow = pComp.display === 'flex' && !pComp.flexDirection.includes('column');
          const isSibling = Boolean(target.parentElement && specificEl.parentElement === target.parentElement);
          const elLabel = getFriendlyLabel(specificEl);

          if (isRow) {
            const relX = (currX - elRect.left) / Math.max(1, elRect.width);
            if (isSibling && relX >= 0.25 && relX <= 0.75) {
              setTargetState({
                element: specificEl,
                position: 'swap',
                isSwap: true,
                swapWithLabel: elLabel,
                orientation: 'horizontal',
                slotLabel: `⇄ Trocar com ${elLabel}`,
                rect: {
                  left: (elRect.left - baseBounding.left) / scale,
                  top: (elRect.top - baseBounding.top) / scale,
                  width: elRect.width / scale,
                  height: elRect.height / scale,
                },
              });
              return;
            }
            const isBefore = relX < 0.5;
            setTargetState({
              element: specificEl,
              position: isBefore ? 'before' : 'after',
              orientation: 'horizontal',
              slotLabel: `${isBefore ? 'Antes' : 'Depois'} de ${elLabel}`,
              rect: {
                left: (elRect.left - baseBounding.left) / scale,
                top: (elRect.top - baseBounding.top) / scale,
                width: elRect.width / scale,
                height: elRect.height / scale,
              },
            });
          } else {
            const relY = (currY - elRect.top) / Math.max(1, elRect.height);
            if (isSibling && relY >= 0.25 && relY <= 0.75) {
              setTargetState({
                element: specificEl,
                position: 'swap',
                isSwap: true,
                swapWithLabel: elLabel,
                orientation: 'vertical',
                slotLabel: `⇄ Trocar com ${elLabel}`,
                rect: {
                  left: (elRect.left - baseBounding.left) / scale,
                  top: (elRect.top - baseBounding.top) / scale,
                  width: elRect.width / scale,
                  height: elRect.height / scale,
                },
              });
              return;
            }
            const isBefore = relY < 0.5;
            setTargetState({
              element: specificEl,
              position: isBefore ? 'before' : 'after',
              orientation: 'vertical',
              slotLabel: `${isBefore ? 'Antes' : 'Depois'} de ${elLabel}`,
              rect: {
                left: (elRect.left - baseBounding.left) / scale,
                top: (elRect.top - baseBounding.top) / scale,
                width: elRect.width / scale,
                height: elRect.height / scale,
              },
            });
          }
          return;
        }

        // 4. Cursor is on slide canvas background (free slide area)
        if (slideRef.current) {
          const sRect = slideRef.current.getBoundingClientRect();
          if (currY < sRect.top + sRect.height * 0.25) {
            setTargetState({
              element: slideRef.current,
              position: 'inside-start',
              isContainer: true,
              containerLabel: 'slide',
              slotLabel: 'Mover para o Topo do Slide',
              rect: {
                left: 12,
                top: 12,
                width: (sRect.width - 24) / scale,
                height: Math.min(60, sRect.height * 0.2) / scale,
              },
            });
          } else {
            setTargetState({
              element: slideRef.current,
              position: 'inside-end',
              isContainer: true,
              containerLabel: 'slide',
              slotLabel: 'Mover para o Fim do Slide',
              rect: {
                left: 12,
                top: (sRect.height - 72) / scale,
                width: (sRect.width - 24) / scale,
                height: 60 / scale,
              },
            });
          }
          return;
        }

        // 5. Fallback: closest candidate
        if (allCandidates.length > 0) {
          let closestCandidate = allCandidates[0];
          let closestDist = Infinity;
          allCandidates.forEach((cand) => {
            const r = cand.getBoundingClientRect();
            const dist = Math.hypot(currX - (r.left + r.width / 2), currY - (r.top + r.height / 2));
            if (dist < closestDist) {
              closestDist = dist;
              closestCandidate = cand;
            }
          });
          const cRect = closestCandidate.getBoundingClientRect();
          const isBefore = currY < cRect.top + cRect.height / 2;
          const candLabel = getFriendlyLabel(closestCandidate);
          setTargetState({
            element: closestCandidate,
            position: isBefore ? 'before' : 'after',
            orientation: 'vertical',
            slotLabel: `${isBefore ? 'Antes' : 'Depois'} de ${candLabel}`,
            rect: {
              left: (cRect.left - baseBounding.left) / scale,
              top: (cRect.top - baseBounding.top) / scale,
              width: cRect.width / scale,
              height: cRect.height / scale,
            },
          });
        }
      });
    };

    const onMouseUp = () => {
      if (rafId) cancelAnimationFrame(rafId);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('touchmove', onMouseMove);
      window.removeEventListener('touchend', onMouseUp);

      // Restore opacity
      target.style.opacity = '';
      target.style.transition = '';

      setIsDraggingElement(false);
      setDragCursorPos(null);
      setSmartGuides([]);

      // Read active target from mutable ref to avoid stale closure!
      const activeTarget = dropTargetRef.current;

      if (activeTarget && activeTarget.element && activeTarget.element !== target && !target.contains(activeTarget.element)) {
        if (activeTarget.position === 'swap') {
          const targetParent = target.parentElement;
          const siblingParent = activeTarget.element.parentElement;
          if (targetParent && siblingParent) {
            const tempPlaceholder = document.createElement('div');
            targetParent.insertBefore(tempPlaceholder, target);
            siblingParent.insertBefore(target, activeTarget.element);
            targetParent.insertBefore(activeTarget.element, tempPlaceholder);
            tempPlaceholder.remove();
          }
        } else if (activeTarget.position === 'before') {
          activeTarget.element.parentElement?.insertBefore(target, activeTarget.element);
        } else if (activeTarget.position === 'after') {
          activeTarget.element.parentElement?.insertBefore(target, activeTarget.element.nextSibling);
        } else if (activeTarget.position === 'inside-start') {
          activeTarget.element.prepend(target);
        } else if (activeTarget.position === 'inside-end') {
          activeTarget.element.appendChild(target);
        }

        // RESPONSIVE AUTO-ADAPTATION FOR ELEMENT AND ALL NESTED CHILDREN:
        // 1. Reset any fixed drag offsets or position styles
        target.style.position = '';
        target.style.top = '';
        target.style.left = '';
        target.style.right = '';
        target.style.bottom = '';
        target.style.transform = '';
        target.style.maxWidth = '100%';
        target.style.boxSizing = 'border-box';

        // 2. If moved into a grid, flex container, card, or column:
        const newParent = target.parentElement;
        if (newParent) {
          const parentComp = window.getComputedStyle(newParent);
          const isGrid = parentComp.display === 'grid' || newParent.classList.contains('grid');
          const isFlex = parentComp.display === 'flex';

          if (isGrid || isFlex || newParent.classList.contains('split-view') || newParent.classList.contains('card')) {
            // Remove hardcoded pixel width so it fluidly occupies the new column / card
            if (target.style.width && (target.style.width.endsWith('px') || parseInt(target.style.width, 10) > 400)) {
              target.style.width = '100%';
            }
          }

          // Adapt column spans if moving into a grid with specific number of columns
          const colsMatch = newParent.className.match(/grid-cols-(\d+)/);
          if (colsMatch) {
            const parentCols = parseInt(colsMatch[1], 10);
            Array.from(target.classList).forEach((cls) => {
              const spanMatch = cls.match(/col-span-(\d+)/);
              if (spanMatch && parseInt(spanMatch[1], 10) > parentCols) {
                target.classList.remove(cls);
                target.classList.add(`col-span-${Math.min(parentCols, 1)}`);
              }
            });
          }
        }

        // 3. Ensure all nested child elements adapt responsively to the new container width
        target.querySelectorAll('*').forEach((childNode) => {
          const child = childNode as HTMLElement;
          child.style.boxSizing = 'border-box';
          if (child.tagName === 'IMG') {
            child.style.maxWidth = '100%';
            child.style.height = 'auto';
            child.style.objectFit = child.style.objectFit || 'cover';
          } else if (child.tagName === 'TABLE') {
            child.style.width = '100%';
            child.style.tableLayout = child.style.tableLayout || 'auto';
          } else if (child.classList.contains('chart-container') || child.classList.contains('chart-card')) {
            child.style.width = '100%';
            child.style.maxWidth = '100%';
          }
        });

        // 4. Clean re-initialization of charts and immediate HTML update
        if (slideRef.current) {
          initSlideCharts(slideRef.current);
          onUpdateSlideHtml(slideRef.current.innerHTML);
        }

        setTimeout(() => {
          handleElementSelect(target);
        }, 50);
      }

      dropTargetRef.current = null;
      setDropTarget(null);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    window.addEventListener('touchmove', onMouseMove);
    window.addEventListener('touchend', onMouseUp);
  };

  // Surface Mouse Down handler: distinguishes between Click (to select child), Double-Click (to edit), and Click-and-Hold / Drag (to move)
  const handleSurfaceMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    const startX = e.clientX;
    const startY = e.clientY;
    let dragInitiated = false;

    // Timer: if held down for 100ms without releasing, initiate drag!
    const holdTimer = setTimeout(() => {
      dragInitiated = true;
      window.removeEventListener('mousemove', onSurfaceMouseMove);
      window.removeEventListener('mouseup', onSurfaceMouseUp);
      handleDragStart({ clientX: startX, clientY: startY, preventDefault: () => {}, stopPropagation: () => {} });
    }, 100);

    const onSurfaceMouseMove = (moveEvent: MouseEvent) => {
      const dx = Math.abs(moveEvent.clientX - startX);
      const dy = Math.abs(moveEvent.clientY - startY);
      if (dx > 3 || dy > 3) {
        clearTimeout(holdTimer);
        window.removeEventListener('mousemove', onSurfaceMouseMove);
        window.removeEventListener('mouseup', onSurfaceMouseUp);
        dragInitiated = true;
        handleDragStart(moveEvent);
      }
    };

    const onSurfaceMouseUp = (upEvent: MouseEvent) => {
      clearTimeout(holdTimer);
      window.removeEventListener('mousemove', onSurfaceMouseMove);
      window.removeEventListener('mouseup', onSurfaceMouseUp);

      if (!dragInitiated) {
        // Quick click! If the user clicked on a child element, select that child
        const elUnderPoint = document.elementFromPoint(upEvent.clientX, upEvent.clientY) as HTMLElement;
        if (
          elUnderPoint &&
          selectedElement?.element &&
          selectedElement.element.contains(elUnderPoint) &&
          elUnderPoint !== selectedElement.element
        ) {
          handleElementSelect(elUnderPoint);
        }
      }
    };

    window.addEventListener('mousemove', onSurfaceMouseMove);
    window.addEventListener('mouseup', onSurfaceMouseUp);
  };

  // Click on slide canvas with multi-selection support (Shift+Click or toggle)
  const handleSlideClick = (e: React.MouseEvent) => {
    if (isEditingText) return;
    const target = e.target as HTMLElement;

    if (!slideRef.current || target === slideRef.current) {
      onSelectElement(null);
      setMultiSelectedElements([]);
      return;
    }

    if (e.shiftKey || e.metaKey || e.ctrlKey || isMultiSelectMode) {
      setMultiSelectedElements((prev) => {
        const targetId = target.getAttribute('data-edit-id') || target.id;
        const exists = prev.some((el) => el === target || (targetId && (el.getAttribute('data-edit-id') === targetId || el.id === targetId)));
        if (exists) {
          const next = prev.filter((el) => el !== target && (targetId ? (el.getAttribute('data-edit-id') !== targetId && el.id !== targetId) : true));
          if (next.length === 0) onSelectElement(null);
          else handleElementSelect(next[next.length - 1]);
          return next;
        } else {
          const next = [...prev, target];
          handleElementSelect(target);
          return next;
        }
      });
    } else {
      setMultiSelectedElements([target]);
      handleElementSelect(target);
    }
  };

  // Smart Distribute Tool Handlers (evenly space multiple elements)
  const handleDistributeHorizontally = () => {
    if (multiSelectedElements.length < 2 || !slideRef.current) return;
    const baseTarget = stageRef.current || slideRef.current;
    const baseBounding = baseTarget.getBoundingClientRect();
    const scale = effectiveZoom > 0 ? effectiveZoom : 1;

    const items = multiSelectedElements.map((el) => {
      const r = el.getBoundingClientRect();
      return {
        el,
        left: (r.left - baseBounding.left) / scale,
        top: (r.top - baseBounding.top) / scale,
        width: r.width / scale,
        height: r.height / scale,
        right: (r.right - baseBounding.left) / scale,
      };
    });

    items.sort((a, b) => a.left - b.left);
    const minLeft = items[0].left;
    const maxRight = items[items.length - 1].right;
    const totalSpan = maxRight - minLeft;
    const totalWidth = items.reduce((acc, it) => acc + it.width, 0);
    const availableSpace = totalSpan - totalWidth;
    const gap = availableSpace / (items.length - 1);

    let currLeft = minLeft;
    items.forEach((item, idx) => {
      const comp = window.getComputedStyle(item.el);
      if (comp.position === 'absolute') {
        item.el.style.left = `${Math.round(currLeft)}px`;
      } else {
        if (idx > 0) {
          item.el.style.marginLeft = `${Math.max(4, Math.round(gap))}px`;
        }
      }
      currLeft += item.width + gap;
    });

    if (slideRef.current) {
      onUpdateSlideHtml(slideRef.current.innerHTML);
    }
    updateSelectedRect();
  };

  const handleDistributeVertically = () => {
    if (multiSelectedElements.length < 2 || !slideRef.current) return;
    const baseTarget = stageRef.current || slideRef.current;
    const baseBounding = baseTarget.getBoundingClientRect();
    const scale = effectiveZoom > 0 ? effectiveZoom : 1;

    const items = multiSelectedElements.map((el) => {
      const r = el.getBoundingClientRect();
      return {
        el,
        left: (r.left - baseBounding.left) / scale,
        top: (r.top - baseBounding.top) / scale,
        width: r.width / scale,
        height: r.height / scale,
        bottom: (r.bottom - baseBounding.top) / scale,
      };
    });

    items.sort((a, b) => a.top - b.top);
    const minTop = items[0].top;
    const maxBottom = items[items.length - 1].bottom;
    const totalSpan = maxBottom - minTop;
    const totalHeight = items.reduce((acc, it) => acc + it.height, 0);
    const availableSpace = totalSpan - totalHeight;
    const gap = availableSpace / (items.length - 1);

    let currTop = minTop;
    items.forEach((item, idx) => {
      const comp = window.getComputedStyle(item.el);
      if (comp.position === 'absolute') {
        item.el.style.top = `${Math.round(currTop)}px`;
      } else {
        if (idx > 0) {
          item.el.style.marginTop = `${Math.max(4, Math.round(gap))}px`;
        }
      }
      currTop += item.height + gap;
    });

    if (slideRef.current) {
      onUpdateSlideHtml(slideRef.current.innerHTML);
    }
    updateSelectedRect();
  };

  const handleAlignHorizontal = (type: 'left' | 'center' | 'right') => {
    if (multiSelectedElements.length < 2 || !slideRef.current) return;
    const baseTarget = stageRef.current || slideRef.current;
    const baseBounding = baseTarget.getBoundingClientRect();
    const scale = effectiveZoom > 0 ? effectiveZoom : 1;

    const items = multiSelectedElements.map((el) => {
      const r = el.getBoundingClientRect();
      return {
        el,
        left: (r.left - baseBounding.left) / scale,
        width: r.width / scale,
        right: (r.right - baseBounding.left) / scale,
      };
    });

    const minLeft = Math.min(...items.map((i) => i.left));
    const maxRight = Math.max(...items.map((i) => i.right));
    const centerX = (minLeft + maxRight) / 2;

    items.forEach((item) => {
      const comp = window.getComputedStyle(item.el);
      if (comp.position === 'absolute') {
        if (type === 'left') item.el.style.left = `${Math.round(minLeft)}px`;
        if (type === 'center') item.el.style.left = `${Math.round(centerX - item.width / 2)}px`;
        if (type === 'right') item.el.style.left = `${Math.round(maxRight - item.width)}px`;
      }
    });

    if (slideRef.current) onUpdateSlideHtml(slideRef.current.innerHTML);
    updateSelectedRect();
  };

  const handleAlignVertical = (type: 'top' | 'middle' | 'bottom') => {
    if (multiSelectedElements.length < 2 || !slideRef.current) return;
    const baseTarget = stageRef.current || slideRef.current;
    const baseBounding = baseTarget.getBoundingClientRect();
    const scale = effectiveZoom > 0 ? effectiveZoom : 1;

    const items = multiSelectedElements.map((el) => {
      const r = el.getBoundingClientRect();
      return {
        el,
        top: (r.top - baseBounding.top) / scale,
        height: r.height / scale,
        bottom: (r.bottom - baseBounding.top) / scale,
      };
    });

    const minTop = Math.min(...items.map((i) => i.top));
    const maxBottom = Math.max(...items.map((i) => i.bottom));
    const centerY = (minTop + maxBottom) / 2;

    items.forEach((item) => {
      const comp = window.getComputedStyle(item.el);
      if (comp.position === 'absolute') {
        if (type === 'top') item.el.style.top = `${Math.round(minTop)}px`;
        if (type === 'middle') item.el.style.top = `${Math.round(centerY - item.height / 2)}px`;
        if (type === 'bottom') item.el.style.top = `${Math.round(maxBottom - item.height)}px`;
      }
    });

    if (slideRef.current) onUpdateSlideHtml(slideRef.current.innerHTML);
    updateSelectedRect();
  };

  // Double click for direct inline text editing or chart opening
  const handleSlideDoubleClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (!slideRef.current || target === slideRef.current) return;

    // Check if target is a canvas or inside a chart container
    if (target.tagName.toUpperCase() === 'CANVAS') {
      if (onOpenChartEditor) {
        onOpenChartEditor(target as HTMLCanvasElement);
        return;
      }
    }
    const chartCard = target.closest('.chart-card, .chart-container');
    if (chartCard) {
      const cv = chartCard.querySelector('canvas');
      if (cv && onOpenChartEditor) {
        onOpenChartEditor(cv as HTMLCanvasElement);
        return;
      }
    }

    const tagName = target.tagName.toUpperCase();
    const isText = ['H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'P', 'SPAN', 'STRONG', 'EM', 'B', 'I', 'LI', 'TD', 'TH', 'BUTTON'].includes(tagName);

    if (isText) {
      setIsEditingText(true);
      target.contentEditable = 'true';
      target.focus();

      const onBlur = () => {
        target.contentEditable = 'false';
        setIsEditingText(false);
        if (slideRef.current) {
          onUpdateSlideHtml(slideRef.current.innerHTML);
        }
        target.removeEventListener('blur', onBlur);
      };

      target.addEventListener('blur', onBlur);
    }
  };

  // Mouse hover outline effect normalized to scale
  const handleMouseMove = (e: React.MouseEvent) => {
    if (isEditingText) return;
    const target = e.target as HTMLElement;
    const baseTarget = stageRef.current || slideRef.current;
    if (!baseTarget || !slideRef.current || target === slideRef.current || target === stageRef.current) {
      setHoveredElement(null);
      setHoverRect(null);
      return;
    }

    if (target !== hoveredElement) {
      setHoveredElement(target);
      const rect = target.getBoundingClientRect();
      const baseBounding = baseTarget.getBoundingClientRect();
      const scale = effectiveZoom > 0 ? effectiveZoom : 1;

      setHoverRect({
        left: (rect.left - baseBounding.left) / scale,
        top: (rect.top - baseBounding.top) / scale,
        width: rect.width / scale,
        height: rect.height / scale,
      });
    }
  };

  const handleMouseLeave = () => {
    setHoveredElement(null);
    setHoverRect(null);
  };

  // Mobile Touch Swipe Navigation
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      touchStartRef.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
        time: Date.now(),
      };
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStartRef.current || isEditingText) return;
    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - touchStartRef.current.x;
    const deltaY = touch.clientY - touchStartRef.current.y;
    const deltaTime = Date.now() - touchStartRef.current.time;

    // Minimum swipe distance of 45px, mostly horizontal, within 600ms
    if (Math.abs(deltaX) > 45 && Math.abs(deltaX) > Math.abs(deltaY) * 1.3 && deltaTime < 600) {
      if (deltaX < 0) {
        // Swiped Left -> Next Slide
        onNextSlide();
      } else {
        // Swiped Right -> Previous Slide
        onPrevSlide();
      }
    }
    touchStartRef.current = null;
  };

  // Keyboard navigation & element deletion
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isEditingText) return;

      if (e.key === 'Escape') {
        onSelectElement(null);
      }

      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedElement?.element) {
        if (selectedElement.element !== slideRef.current && slideRef.current) {
          e.preventDefault();
          selectedElement.element.remove();
          onSelectElement(null);
          onUpdateSlideHtml(slideRef.current.innerHTML);
        }
      }

      if (document.activeElement === document.body) {
        if (e.key === 'ArrowRight' || e.key === 'PageDown') {
          onNextSlide();
        } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
          onPrevSlide();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isEditingText, selectedElement, onSelectElement, onUpdateSlideHtml, onNextSlide, onPrevSlide]);

  // AI action rewriter handler
  const handleApplyAiAction = async (action: string) => {
    if (!selectedElement?.element || !slideRef.current) return;
    const currentText = selectedElement.element.textContent || '';
    if (!currentText.trim()) return;

    try {
      const res = await fetch('/api/gemini/rewrite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: currentText,
          action,
          context: slide.title,
        }),
      });

      const data = await res.json();
      if (data.rewritten) {
        selectedElement.element.textContent = data.rewritten;
        onUpdateSlideHtml(slideRef.current.innerHTML);
        updateSelectedRect();
      }
    } catch (err) {
      console.error('Error applying AI rewrite:', err);
    }
  };

  // Duplicate current selected element
  const handleDuplicateElement = () => {
    if (!selectedElement?.element || !slideRef.current) return;
    const clone = selectedElement.element.cloneNode(true) as HTMLElement;
    clone.setAttribute('data-edit-id', `el-${Date.now().toString(36)}`);
    selectedElement.element.after(clone);
    onUpdateSlideHtml(slideRef.current.innerHTML);
    handleElementSelect(clone);
  };

  // Delete current selected element
  const handleDeleteElement = () => {
    if (!selectedElement?.element || !slideRef.current) return;
    selectedElement.element.remove();
    onSelectElement(null);
    onUpdateSlideHtml(slideRef.current.innerHTML);
  };

  // Select parent container
  const handleSelectParent = () => {
    if (!selectedElement?.element || !slideRef.current) return;
    const parent = selectedElement.element.parentElement;
    if (parent && parent !== slideRef.current) {
      handleElementSelect(parent);
    }
  };

  // Toggle Bold
  const handleToggleBold = () => {
    if (!selectedElement?.element || !slideRef.current) return;
    const currentBold = parseInt(window.getComputedStyle(selectedElement.element).fontWeight, 10) >= 600;
    selectedElement.element.style.fontWeight = currentBold ? 'normal' : 'bold';
    onUpdateSlideHtml(slideRef.current.innerHTML);
    handleElementSelect(selectedElement.element);
  };

  // Toggle Italic
  const handleToggleItalic = () => {
    if (!selectedElement?.element || !slideRef.current) return;
    const currentItalic = window.getComputedStyle(selectedElement.element).fontStyle === 'italic';
    selectedElement.element.style.fontStyle = currentItalic ? 'normal' : 'italic';
    onUpdateSlideHtml(slideRef.current.innerHTML);
    handleElementSelect(selectedElement.element);
  };

  // Toggle Underline
  const handleToggleUnderline = () => {
    if (!selectedElement?.element || !slideRef.current) return;
    const currentUnderline = window.getComputedStyle(selectedElement.element).textDecoration.includes('underline');
    selectedElement.element.style.textDecoration = currentUnderline ? 'none' : 'underline';
    onUpdateSlideHtml(slideRef.current.innerHTML);
    handleElementSelect(selectedElement.element);
  };

  // Change Font Size
  const handleChangeFontSize = (delta: number) => {
    if (!selectedElement?.element || !slideRef.current) return;
    const currentPx = parseFloat(window.getComputedStyle(selectedElement.element).fontSize) || 16;
    const nextPx = Math.max(8, Math.min(96, Math.round(currentPx + delta)));
    selectedElement.element.style.fontSize = `${nextPx}px`;
    onUpdateSlideHtml(slideRef.current.innerHTML);
    handleElementSelect(selectedElement.element);
  };

  // Bring Forward / Send Backward
  const handleBringForward = () => {
    if (!selectedElement?.element || !slideRef.current) return;
    const el = selectedElement.element;
    if (el.nextElementSibling) {
      el.parentNode?.insertBefore(el.nextElementSibling, el);
      onUpdateSlideHtml(slideRef.current.innerHTML);
      handleElementSelect(el);
    }
  };

  const handleSendBackward = () => {
    if (!selectedElement?.element || !slideRef.current) return;
    const el = selectedElement.element;
    if (el.previousElementSibling) {
      el.parentNode?.insertBefore(el, el.previousElementSibling);
      onUpdateSlideHtml(slideRef.current.innerHTML);
      handleElementSelect(el);
    }
  };

  const handleUpdateElementInlineStyle = (prop: string, val: string) => {
    if (!selectedElement?.element || !slideRef.current) return;
    (selectedElement.element.style as any)[prop] = val;
    onUpdateSlideHtml(slideRef.current.innerHTML);
    handleElementSelect(selectedElement.element);
  };

  return (
    <div
      ref={containerRef}
      className={`flex-1 bg-[var(--cv-color-background)] relative overflow-hidden flex flex-col items-center w-full min-w-0 transition-all duration-150 order-1 md:order-2 ${
        isMobileView
          ? 'p-1.5 sm:p-2 pb-16 md:pb-14'
          : isCompactMode
          ? 'p-1.5 sm:p-2 pb-16 md:pb-14 max-h-[44vh] md:max-h-none justify-between'
          : 'p-2 sm:p-4 pb-16 md:pb-14 justify-between'
      }`}
    >

      {/* Slide Canvas Center Stage with Touch Gestures */}
      <div
        ref={stageAreaRef}
        className="flex-1 flex items-center justify-center w-full h-full relative overflow-hidden py-0.5 touch-pan-y"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* Floating Smart Distribute Toolbar (when multiple elements are selected) */}
        {multiSelectedElements.length >= 2 && (
          <div className="absolute top-2 left-1/2 -translate-x-1/2 z-50 bg-slate-900/95 backdrop-blur-md text-white px-3 py-1.5 rounded-xl shadow-2xl border border-indigo-500/60 flex items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-150">
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-indigo-300 pr-2 border-r border-slate-700">
              <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
              <span>Smart Distribute</span>
              <span className="bg-indigo-950 text-indigo-200 text-[10px] px-1.5 py-0.2 rounded border border-indigo-700 font-mono">
                {multiSelectedElements.length} itens
              </span>
            </div>

            {/* Distribute Horizontally */}
            <button
              onClick={handleDistributeHorizontally}
              className="flex items-center gap-1 bg-indigo-600 hover:bg-indigo-500 text-white px-2 py-1 rounded-lg text-[10px] font-semibold shadow transition active:scale-95 cursor-pointer"
              title="Distribuir espaçamento horizontal uniformemente entre os elementos selecionados"
            >
              <span>↔ Distribuir Horizontal</span>
            </button>

            {/* Distribute Vertically */}
            <button
              onClick={handleDistributeVertically}
              className="flex items-center gap-1 bg-indigo-600 hover:bg-indigo-500 text-white px-2 py-1 rounded-lg text-[10px] font-semibold shadow transition active:scale-95 cursor-pointer"
              title="Distribuir espaçamento vertical uniformemente entre os elementos selecionados"
            >
              <span>↕ Distribuir Vertical</span>
            </button>

            <div className="h-4 w-px bg-slate-700" />

            {/* Align Horizontal Buttons */}
            <div className="flex items-center gap-0.5">
              <button
                onClick={() => handleAlignHorizontal('left')}
                className="px-1.5 py-1 hover:bg-slate-700 text-slate-300 hover:text-white rounded text-[10px] font-medium transition cursor-pointer"
                title="Alinhar à Esquerda"
              >
                ⇤ Esq
              </button>
              <button
                onClick={() => handleAlignHorizontal('center')}
                className="px-1.5 py-1 hover:bg-slate-700 text-slate-300 hover:text-white rounded text-[10px] font-medium transition cursor-pointer"
                title="Centralizar Horizontalmente"
              >
                ⇥⇤ Centro
              </button>
              <button
                onClick={() => handleAlignHorizontal('right')}
                className="px-1.5 py-1 hover:bg-slate-700 text-slate-300 hover:text-white rounded text-[10px] font-medium transition cursor-pointer"
                title="Alinhar à Direita"
              >
                ⇥ Dir
              </button>
            </div>

            <div className="h-4 w-px bg-slate-700" />

            {/* Align Vertical Buttons */}
            <div className="flex items-center gap-0.5">
              <button
                onClick={() => handleAlignVertical('top')}
                className="px-1.5 py-1 hover:bg-slate-700 text-slate-300 hover:text-white rounded text-[10px] font-medium transition cursor-pointer"
                title="Alinhar ao Topo"
              >
                ⇡ Topo
              </button>
              <button
                onClick={() => handleAlignVertical('middle')}
                className="px-1.5 py-1 hover:bg-slate-700 text-slate-300 hover:text-white rounded text-[10px] font-medium transition cursor-pointer"
                title="Centralizar Verticalmente"
              >
                ↕ Meio
              </button>
              <button
                onClick={() => handleAlignVertical('bottom')}
                className="px-1.5 py-1 hover:bg-slate-700 text-slate-300 hover:text-white rounded text-[10px] font-medium transition cursor-pointer"
                title="Alinhar à Base"
              >
                ⇣ Base
              </button>
            </div>

            <div className="h-4 w-px bg-slate-700" />

            {/* Clear Selection */}
            <button
              onClick={() => {
                setMultiSelectedElements([]);
                onSelectElement(null);
              }}
              className="px-2 py-1 hover:bg-rose-500/20 text-rose-300 rounded text-[10px] font-semibold transition cursor-pointer"
              title="Limpar seleção múltipla"
            >
              ✕ Desmarcar
            </button>
          </div>
        )}

        {/* Navigation Previous Button */}
        <button
          onClick={onPrevSlide}
          disabled={slideIndex === 0}
          className={`absolute left-1 sm:left-2 z-20 p-2 sm:p-2.5 rounded-full bg-slate-800/80 text-white hover:bg-slate-700 shadow-xl border border-slate-700 backdrop-blur-md transition ${
            slideIndex === 0 ? 'opacity-20 cursor-not-allowed' : 'opacity-80 hover:opacity-100 hover:scale-105 active:scale-95'
          }`}
          title="Slide Anterior (←)"
        >
          <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>

        {/* Scaled Layout Wrapper: gives the browser exact scaled footprint to center perfectly */}
        <div
          style={{
            width: `${baseWidth * effectiveZoom}px`,
            height: `${baseHeight * effectiveZoom}px`,
            position: 'relative',
            flexShrink: 0,
            transition: 'width 0.15s ease-out, height 0.15s ease-out',
          }}
          className="mx-auto"
        >
          {/* Virtual Slide Container scaled from top-left */}
          <div
            ref={stageRef}
            style={{
              width: `${baseWidth}px`,
              height: `${baseHeight}px`,
              transform: `scale(${effectiveZoom})`,
              transformOrigin: 'top left',
              position: 'absolute',
              top: 0,
              left: 0,
            }}
            className={`slidestudio-scope slidestudio-virtual-stage ${
              isMobileView
                ? 'slidestudio-mobile-mode rounded-[44px] ring-10 ring-slate-800/90 shadow-2xl border-4 border-slate-900 bg-white'
                : 'rounded-2xl ring-1 ring-white/10 shadow-2xl bg-white'
            } overflow-hidden flex flex-col`}
          >
            {/* Mobile Status Bar with Dynamic Island */}
            {isMobileView && (
              <div className="w-full h-8 bg-slate-950 text-slate-100 flex items-center justify-between px-6 relative select-none shrink-0 z-50 text-[11px] font-semibold tracking-tight">
                <span className="font-mono text-[10px]">09:41</span>
                <div className="w-24 h-4 bg-black rounded-full flex items-center justify-between px-2.5 mx-auto border border-white/10 shadow-inner">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-800" />
                  <span className="w-2 h-2 rounded-full bg-slate-950 border border-slate-700" />
                </div>
                <div className="flex items-center gap-1.5 text-slate-300 text-[10px]">
                  <span>5G</span>
                  <div className="w-4 h-2.5 border border-slate-300 rounded-xs p-0.5 flex items-center">
                    <div className="w-full h-full bg-slate-200 rounded-2xs" />
                  </div>
                </div>
              </div>
            )}

            {/* Presentation container frame */}
            <div
              className={`w-full h-full flex flex-col overflow-hidden relative select-none ${
                presentation?.containerClass || 'presentation-container'
              }`}
              style={{
                ...cssStringToStyleObject(presentation?.containerStyle),
                width: '100%',
                maxWidth: '100%',
                height: '100%',
                maxHeight: '100%',
                boxSizing: 'border-box',
              }}
            >
              {/* If presentation has a corporate header bar, render it */}
              {presentation?.headerHtml && (
                <div
                  className="slidestudio-corporate-header shrink-0 select-none w-full max-w-full"
                  dangerouslySetInnerHTML={{ __html: presentation.headerHtml }}
                />
              )}

              <main
                className={`slidestudio-viewport flex-1 overflow-hidden relative flex flex-col w-full max-w-full ${
                  presentation?.viewportClass || 'slide-viewport'
                }`}
                style={{
                  ...cssStringToStyleObject(presentation?.viewportStyle),
                  width: '100%',
                  maxWidth: '100%',
                  flex: '1 1 0%',
                  minHeight: 0,
                  boxSizing: 'border-box',
                }}
              >
                <section
                  ref={slideRef}
                  id={slide.id}
                  className={`slide active ${slide.className || ''} w-full h-full relative select-none`}
                  style={{
                    ...cssStringToStyleObject(slide.style),
                    width: '100%',
                    maxWidth: '100%',
                    boxSizing: 'border-box',
                  }}
                  onClick={handleSlideClick}
                  onDoubleClick={handleSlideDoubleClick}
                  onMouseMove={handleMouseMove}
                  onMouseLeave={handleMouseLeave}
                  dangerouslySetInnerHTML={{ __html: slide.htmlContent }}
                />
              </main>

              {/* If presentation has a corporate footer bar, render it */}
              {presentation?.footerHtml && (
                <div
                  className="slidestudio-corporate-footer shrink-0 select-none w-full max-w-full"
                  dangerouslySetInnerHTML={{ __html: presentation.footerHtml }}
                />
              )}
            </div>

            {/* Mobile Home Indicator */}
            {isMobileView && (
              <div className="w-full h-4 bg-slate-50 flex items-center justify-center shrink-0 z-50 border-t border-slate-100">
                <div className="w-28 h-1 bg-slate-300 rounded-full" />
              </div>
            )}

            {/* Responsive 12-Column Visual Grid Overlay */}
            {(showGridOverlay || isResizing || isDraggingElement) && (
              <div
                className="absolute inset-0 pointer-events-none z-20 flex px-6 py-4 gap-2 transition-opacity duration-200"
                style={{ opacity: showGridOverlay ? 0.35 : 0.6 }}
              >
                {Array.from({ length: 12 }).map((_, i) => (
                  <div
                    key={i}
                    className="flex-1 h-full rounded border-x border-blue-400/40 bg-blue-500/5 relative flex flex-col justify-between items-center py-1 select-none"
                  >
                    <span className="text-[9px] font-mono font-bold text-blue-600 bg-white/80 px-1 rounded shadow-2xs">
                      {i + 1}
                    </span>
                    <span className="text-[8px] font-mono text-blue-500 font-semibold">
                      {Math.round(((i + 1) / 12) * 100)}%
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Smart Snapping Guides (Figma/Keynote-style magnetic alignment lines) */}
            {smartGuides.map((guide) =>
              guide.type === 'vertical' ? (
                <div
                  key={guide.id}
                  style={{
                    position: 'absolute',
                    left: `${guide.coord}px`,
                    top: `${guide.start}px`,
                    height: `${Math.max(20, guide.end - guide.start)}px`,
                    width: '1px',
                    pointerEvents: 'none',
                    zIndex: 60,
                  }}
                  className="border-l-2 border-dashed border-rose-500 shadow-[0_0_12px_rgba(244,63,94,0.95)] flex flex-col justify-between items-center animate-in fade-in duration-75"
                >
                  <span className="w-2 h-2 rounded-full bg-rose-500 border border-white shadow -ml-[3px]" />
                  <span className="bg-rose-600 text-white font-mono font-bold text-[9px] px-2 py-0.5 rounded-full shadow-lg whitespace-nowrap -ml-0.5 pointer-events-none flex items-center gap-1 z-50">
                    <Magnet className="w-2.5 h-2.5 text-rose-200" />
                    <span>{guide.label}</span>
                  </span>
                  <span className="w-2 h-2 rounded-full bg-rose-500 border border-white shadow -ml-[3px]" />
                </div>
              ) : (
                <div
                  key={guide.id}
                  style={{
                    position: 'absolute',
                    left: `${guide.start}px`,
                    top: `${guide.coord}px`,
                    width: `${Math.max(20, guide.end - guide.start)}px`,
                    height: '1px',
                    pointerEvents: 'none',
                    zIndex: 60,
                  }}
                  className="border-t-2 border-dashed border-rose-500 shadow-[0_0_12px_rgba(244,63,94,0.95)] flex items-center justify-between animate-in fade-in duration-75"
                >
                  <span className="w-2 h-2 rounded-full bg-rose-500 border border-white shadow -mt-[3px]" />
                  <span className="bg-rose-600 text-white font-mono font-bold text-[9px] px-2 py-0.5 rounded-full shadow-lg whitespace-nowrap -mt-5 pointer-events-none flex items-center gap-1 z-50">
                    <Magnet className="w-2.5 h-2.5 text-rose-200" />
                    <span>{guide.label}</span>
                  </span>
                  <span className="w-2 h-2 rounded-full bg-rose-500 border border-white shadow -mt-[3px]" />
                </div>
              )
            )}

            {/* Drop Target Guide Indicator */}
            {isDraggingElement && dropTarget && (
              dropTarget.position === 'swap' ? (
                /* Swapping Directly with Sibling or Grid Item */
                <div
                  style={{
                    position: 'absolute',
                    left: `${dropTarget.rect.left}px`,
                    top: `${dropTarget.rect.top}px`,
                    width: `${dropTarget.rect.width}px`,
                    height: `${dropTarget.rect.height}px`,
                    pointerEvents: 'none',
                  }}
                  className="border-2 border-dashed border-indigo-400 bg-indigo-500/20 rounded-xl z-50 animate-pulse flex flex-col items-center justify-center p-2 shadow-[0_0_24px_rgba(99,102,241,0.45)] ring-2 ring-indigo-400/40"
                >
                  <div className="bg-indigo-600 text-white font-bold text-[11px] px-3.5 py-1.5 rounded-full shadow-lg flex items-center gap-2 whitespace-nowrap">
                    <ArrowLeftRight className="w-4 h-4 text-indigo-200 animate-pulse" />
                    <span>{dropTarget.slotLabel || 'Trocar de lugar'}</span>
                  </div>
                  <span className="text-[10px] text-indigo-100 font-semibold mt-1 bg-slate-900/80 px-2 py-0.5 rounded shadow">
                    Solte para trocar de posição diretamente na grade
                  </span>
                </div>
              ) : dropTarget.isGridSlot ? (
                /* Dropping Inside a Grid Column Slot */
                <div
                  style={{
                    position: 'absolute',
                    left: `${dropTarget.rect.left}px`,
                    top: `${dropTarget.rect.top}px`,
                    width: `${dropTarget.rect.width}px`,
                    height: `${dropTarget.rect.height}px`,
                    pointerEvents: 'none',
                  }}
                  className="border-2 border-dashed border-blue-500 bg-blue-500/20 rounded-xl z-50 animate-pulse flex flex-col items-center justify-center p-2 shadow-[0_0_20px_rgba(37,99,235,0.35)]"
                >
                  <div className="bg-blue-600 text-white font-bold text-[11px] px-3 py-1 rounded-full shadow-lg flex items-center gap-1.5 whitespace-nowrap">
                    <LayoutGrid className="w-3.5 h-3.5" />
                    <span>{dropTarget.slotLabel || `Coluna ${(dropTarget.gridColIndex || 0) + 1} da Grade`}</span>
                  </div>
                  <span className="text-[9px] text-blue-700 font-bold mt-1 bg-white/90 px-2 py-0.5 rounded shadow-2xs">
                    Solte para ancorar nesta posição da grade
                  </span>
                </div>
              ) : dropTarget.isContainer ? (
                /* Dropping Inside Container Highlight */
                <div
                  style={{
                    position: 'absolute',
                    left: `${dropTarget.rect.left}px`,
                    top: `${dropTarget.rect.top}px`,
                    width: `${dropTarget.rect.width}px`,
                    height: `${dropTarget.rect.height}px`,
                    pointerEvents: 'none',
                  }}
                  className="border-2 border-dashed border-blue-500 bg-blue-500/15 rounded-2xl z-40 animate-pulse flex items-center justify-center shadow-[0_0_20px_rgba(37,99,235,0.25)]"
                >
                  <span className="text-[11px] font-bold bg-blue-600 text-white px-3.5 py-1.5 rounded-full shadow-lg flex items-center gap-1.5">
                    <Move className="w-3.5 h-3.5" />
                    <span>{dropTarget.slotLabel || `Soltar dentro deste container (${dropTarget.containerLabel || 'container'})`}</span>
                  </span>
                </div>
              ) : (
                /* Dropping Before / After Guide Line */
                <div
                  style={
                    dropTarget.orientation === 'horizontal'
                      ? {
                          position: 'absolute',
                          left:
                            dropTarget.position === 'before'
                              ? `${dropTarget.rect.left - 3}px`
                              : `${dropTarget.rect.left + dropTarget.rect.width - 2}px`,
                          top: `${dropTarget.rect.top}px`,
                          width: '6px',
                          height: `${dropTarget.rect.height}px`,
                          pointerEvents: 'none',
                        }
                      : {
                          position: 'absolute',
                          left: `${dropTarget.rect.left}px`,
                          top:
                            dropTarget.position === 'before'
                              ? `${dropTarget.rect.top - 4}px`
                              : `${dropTarget.rect.top + dropTarget.rect.height + 1}px`,
                          width: `${dropTarget.rect.width}px`,
                          height: '6px',
                          pointerEvents: 'none',
                        }
                  }
                  className="bg-blue-600 rounded-full shadow-[0_0_16px_rgba(37,99,235,0.95)] z-50 animate-pulse flex items-center justify-between"
                >
                  <span className="w-2.5 h-2.5 bg-blue-600 rounded-full -ml-1 border-2 border-white shadow" />
                  <span className="text-[10px] font-bold bg-blue-600 text-white px-2.5 py-0.5 rounded-full shadow -translate-y-4 whitespace-nowrap flex items-center gap-1">
                    <Move className="w-3 h-3" />
                    <span>{dropTarget.slotLabel || `Soltar aqui (${dropTarget.position === 'before' ? 'antes' : 'depois'})`}</span>
                  </span>
                  <span className="w-2.5 h-2.5 bg-blue-600 rounded-full -mr-1 border-2 border-white shadow" />
                </div>
              )
            )}

            {/* Live Dragging Floating Ghost Indicator */}
            {isDraggingElement && dragCursorPos && (
              <div
                style={{
                  position: 'fixed',
                  left: `${dragCursorPos.x + 16}px`,
                  top: `${dragCursorPos.y + 16}px`,
                  pointerEvents: 'none',
                  zIndex: 99999,
                }}
                className="bg-slate-900/95 text-white px-3 py-2 rounded-xl shadow-2xl border border-blue-500/80 backdrop-blur-md flex items-center gap-2.5 animate-in fade-in select-none"
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 shadow ${
                  smartGuides.length > 0 ? 'bg-rose-600 ring-2 ring-rose-400' : 'bg-blue-600'
                }`}>
                  {smartGuides.length > 0 ? (
                    <Magnet className="w-4 h-4 text-white animate-bounce" />
                  ) : (
                    <Move className="w-4 h-4 text-white animate-pulse" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-xs text-white">
                      &lt;{selectedElement?.tagName.toLowerCase()}&gt;
                    </span>
                    {selectedElement?.element && selectedElement.element.children.length > 0 && (
                      <span className="text-[10px] bg-blue-500/40 text-blue-200 px-1.5 py-0.2 rounded font-semibold">
                        +{selectedElement.element.children.length} filhos aninhados
                      </span>
                    )}
                    {smartGuides.length > 0 && (
                      <span className="text-[9px] bg-rose-500/90 text-white font-bold px-1.5 py-0.2 rounded-full flex items-center gap-0.5 shadow">
                        <Magnet className="w-2.5 h-2.5" />
                        <span>Snap</span>
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-blue-300 font-medium">
                    {smartGuides.length > 0
                      ? smartGuides[0].label
                      : dropTarget?.slotLabel
                      ? dropTarget.slotLabel
                      : 'Arraste para onde quiser na grade e solte'}
                  </div>
                </div>
              </div>
            )}

            {/* Hover outline overlay */}
            {hoverRect && !selectedRect && (
              <div
                style={{
                  position: 'absolute',
                  top: `${hoverRect.top}px`,
                  left: `${hoverRect.left}px`,
                  width: `${hoverRect.width}px`,
                  height: `${hoverRect.height}px`,
                  pointerEvents: 'none',
                }}
                className="border-2 border-dashed border-blue-400/80 bg-blue-500/10 rounded transition-all duration-75 z-30"
              />
            )}

            {/* Multi-selected Elements Outlines */}
            {multiSelectedElements.length > 1 &&
              multiSelectedElements.map((el, idx) => {
                if (!document.body.contains(el)) return null;
                const baseBounding = (stageRef.current || slideRef.current)?.getBoundingClientRect();
                if (!baseBounding) return null;
                const r = el.getBoundingClientRect();
                const scale = effectiveZoom > 0 ? effectiveZoom : 1;
                const top = (r.top - baseBounding.top) / scale;
                const left = (r.left - baseBounding.left) / scale;
                const width = r.width / scale;
                const height = r.height / scale;

                return (
                  <div
                    key={idx}
                    style={{
                      position: 'absolute',
                      top: `${top}px`,
                      left: `${left}px`,
                      width: `${width}px`,
                      height: `${height}px`,
                      pointerEvents: 'none',
                    }}
                    className="border-2 border-dashed border-indigo-500 bg-indigo-500/10 rounded shadow-xs z-35 flex items-start justify-end p-1 animate-in fade-in duration-75"
                  >
                    <span className="bg-indigo-600 text-white text-[9px] font-bold px-1.5 py-0.2 rounded-full shadow">
                      #{idx + 1}
                    </span>
                  </div>
                );
              })}

            {/* Selected Element outline overlay with 8 resize handles and drag handle */}
            {selectedRect && selectedElement && (
              <div
                style={{
                  position: 'absolute',
                  top: `${selectedRect.top}px`,
                  left: `${selectedRect.left}px`,
                  width: `${selectedRect.width}px`,
                  height: `${selectedRect.height}px`,
                  pointerEvents: 'none',
                }}
                className={`border-2 rounded transition-all duration-75 z-40 ${
                  isResizing
                    ? 'border-blue-600 ring-4 ring-blue-500/30'
                    : isDraggingElement
                    ? 'border-indigo-600 ring-4 ring-indigo-500/40 opacity-70'
                    : 'border-blue-600 ring-2 ring-blue-400/40'
                }`}
              >
                {/* Top Controls: Drag-to-Move Handle, Dimensions Pill, and Clipboard Actions */}
                <div
                  style={{ pointerEvents: 'auto' }}
                  className="absolute -top-7 left-0 flex items-center gap-1 select-none z-50 whitespace-nowrap"
                >
                  {/* Drag to Move / Reorder Handle */}
                  <div
                    onMouseDown={handleDragStart}
                    onTouchStart={handleDragStart}
                    className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white font-bold text-[10px] px-2 py-0.5 rounded-md shadow-md cursor-grab active:cursor-grabbing transition"
                    title="Clique e arraste para reposicionar no layout do slide"
                  >
                    <GripHorizontal className="w-3 h-3 text-blue-200" />
                    <span>Arrastar</span>
                  </div>

                  {/* Dimensions Badge & Grid Columns */}
                  <div className="bg-slate-900/95 text-slate-100 font-mono text-[10px] px-2 py-0.5 rounded-md border border-slate-700 shadow-md flex items-center gap-1.5">
                    <span>{Math.round(selectedRect.width)}×{Math.round(selectedRect.height)}px</span>
                    {selectedElement.layoutInfo?.approxCols && (
                      <span className="text-blue-300 font-bold border-l border-slate-700 pl-1.5">
                        {selectedElement.layoutInfo.approxCols}/12 cols
                      </span>
                    )}
                  </div>

                  {/* Copy Button */}
                  {onCopyElement && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onCopyElement();
                      }}
                      className="p-1 bg-slate-900/95 hover:bg-blue-600 text-slate-200 hover:text-white rounded-md border border-slate-700 shadow-md transition cursor-pointer"
                      title="Copiar elemento (Ctrl+C)"
                    >
                      <Copy className="w-3 h-3" />
                    </button>
                  )}

                  {/* Cut Button */}
                  {onCutElement && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onCutElement();
                      }}
                      className="p-1 bg-slate-900/95 hover:bg-amber-600 text-slate-200 hover:text-white rounded-md border border-slate-700 shadow-md transition cursor-pointer"
                      title="Recortar elemento (Ctrl+X)"
                    >
                      <Scissors className="w-3 h-3" />
                    </button>
                  )}

                  {/* Paste Button (if clipboard has content) */}
                  {hasClipboard && onPasteElement && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onPasteElement();
                      }}
                      className="flex items-center gap-1 px-1.5 py-0.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-[10px] font-bold shadow-md transition cursor-pointer animate-in fade-in"
                      title="Colar elemento após o selecionado (Ctrl+V)"
                    >
                      <ClipboardPaste className="w-3 h-3 text-emerald-100" />
                      <span>Colar</span>
                    </button>
                  )}

                  {/* Insert Element Button */}
                  {onOpenInsertModal && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenInsertModal();
                      }}
                      className="p-1 bg-slate-900/95 hover:bg-indigo-600 text-slate-200 hover:text-white rounded-md border border-slate-700 shadow-md transition cursor-pointer"
                      title="Inserir novo componente na apresentação"
                    >
                      <Plus className="w-3 h-3 text-indigo-300 hover:text-white" />
                    </button>
                  )}

                  {/* Duplicate Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDuplicateElement();
                    }}
                    className="p-1 bg-slate-900/95 hover:bg-slate-700 text-slate-200 hover:text-white rounded-md border border-slate-700 shadow-md transition cursor-pointer"
                    title="Duplicar elemento (Ctrl+D)"
                  >
                    <Copy className="w-3 h-3 text-slate-400" />
                  </button>

                  {/* Delete Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteElement();
                    }}
                    className="p-1 bg-slate-900/95 hover:bg-rose-600 text-rose-300 hover:text-white rounded-md border border-slate-700 shadow-md transition cursor-pointer"
                    title="Excluir elemento selecionado (Delete)"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>

                {/* Full-Body Direct Drag Surface: Click and hold ANYWHERE on the selected element to drag it and all nested children */}
                <div
                  style={{ pointerEvents: isDraggingElement ? 'none' : 'auto' }}
                  onMouseDown={handleSurfaceMouseDown}
                  onTouchStart={handleDragStart}
                  onDoubleClick={handleSlideDoubleClick}
                  className="absolute inset-0 cursor-grab active:cursor-grabbing bg-transparent hover:bg-blue-500/5 transition-colors z-20"
                  title="Clique e segure para movimentar este elemento (e todos os itens aninhados) pelo slide"
                />

                {/* Live Resizing HUD Tooltip */}
                {isResizing && resizeHUD && (
                  <div
                    style={{ pointerEvents: 'none' }}
                    className="absolute -top-14 left-1/2 -translate-x-1/2 bg-slate-950/95 text-white px-3 py-1.5 rounded-xl text-[11px] font-bold shadow-2xl border border-blue-500/80 backdrop-blur-md flex items-center gap-2 whitespace-nowrap z-50 animate-in fade-in zoom-in-95 duration-100 ring-2 ring-blue-500/20"
                  >
                    <div className="flex items-center gap-1 font-mono text-blue-200">
                      <span>↔ {resizeHUD.width}px</span>
                      {resizeHUD.percent !== undefined && (
                        <span className="text-[10px] text-blue-300 font-semibold">({resizeHUD.percent}%)</span>
                      )}
                      {resizeHUD.deltaW !== undefined && resizeHUD.deltaW !== 0 && (
                        <span className={`text-[9px] px-1 rounded font-mono ${resizeHUD.deltaW > 0 ? 'bg-emerald-500/30 text-emerald-300' : 'bg-amber-500/30 text-amber-300'}`}>
                          {resizeHUD.deltaW > 0 ? `+${resizeHUD.deltaW}` : resizeHUD.deltaW}px
                        </span>
                      )}
                    </div>
                    <span className="text-slate-600">|</span>
                    <div className="flex items-center gap-1 font-mono text-blue-200">
                      <span>↕ {resizeHUD.height}px</span>
                      {resizeHUD.deltaH !== undefined && resizeHUD.deltaH !== 0 && (
                        <span className={`text-[9px] px-1 rounded font-mono ${resizeHUD.deltaH > 0 ? 'bg-emerald-500/30 text-emerald-300' : 'bg-amber-500/30 text-amber-300'}`}>
                          {resizeHUD.deltaH > 0 ? `+${resizeHUD.deltaH}` : resizeHUD.deltaH}px
                        </span>
                      )}
                    </div>
                    {resizeHUD.isSnapped && (
                      <span className="bg-emerald-600 text-white text-[10px] px-2 py-0.5 rounded-md font-bold flex items-center gap-1 shadow-sm">
                        <Check className="w-2.5 h-2.5" />
                        {resizeHUD.cols}/12 col
                      </span>
                    )}
                    {resizeHUD.siblingPercent !== undefined && (
                      <span className="bg-indigo-600/90 text-indigo-100 text-[10px] px-2 py-0.5 rounded-md font-bold flex items-center gap-1 shadow-sm">
                        Irmão: {resizeHUD.siblingPercent}%
                      </span>
                    )}
                    {resizeHUD.aspectLocked && (
                      <span className="bg-amber-600/90 text-amber-100 text-[10px] px-1.5 py-0.5 rounded-md font-bold flex items-center gap-0.5 shadow-sm">
                        <Lock className="w-2.5 h-2.5" />
                        Proporcional
                      </span>
                    )}
                  </div>
                )}

                {/* 8 Interactive Resize Handles with Expanded 28px Hit Areas */}
                {/* 1. North-West (Top-Left) */}
                <div
                  style={{ pointerEvents: 'auto' }}
                  onMouseDown={(e) => handleResizeStart('nw', e)}
                  onTouchStart={(e) => handleResizeStart('nw', e)}
                  className="absolute -top-3.5 -left-3.5 w-7 h-7 flex items-center justify-center cursor-nwse-resize group z-50 select-none"
                  title="Redimensionar (Superior Esquerdo) • Segure Shift para travar proporção"
                >
                  <div className="w-3 h-3 bg-white border-2 border-blue-600 rounded-xs shadow-md group-hover:scale-125 group-active:scale-135 group-hover:bg-blue-500 group-hover:border-white transition-all duration-100" />
                </div>

                {/* 2. North (Top-Center) */}
                <div
                  style={{ pointerEvents: 'auto' }}
                  onMouseDown={(e) => handleResizeStart('n', e)}
                  onTouchStart={(e) => handleResizeStart('n', e)}
                  className="absolute -top-3.5 left-1/2 -translate-x-1/2 w-8 h-7 flex items-center justify-center cursor-ns-resize group z-50 select-none"
                  title="Ajustar Altura (Superior)"
                >
                  <div className="w-4 h-2 bg-white border-2 border-blue-600 rounded-full shadow-md group-hover:scale-125 group-active:scale-135 group-hover:bg-blue-500 group-hover:border-white transition-all duration-100" />
                </div>

                {/* 3. North-East (Top-Right) */}
                <div
                  style={{ pointerEvents: 'auto' }}
                  onMouseDown={(e) => handleResizeStart('ne', e)}
                  onTouchStart={(e) => handleResizeStart('ne', e)}
                  className="absolute -top-3.5 -right-3.5 w-7 h-7 flex items-center justify-center cursor-nesw-resize group z-50 select-none"
                  title="Redimensionar (Superior Direito) • Segure Shift para travar proporção"
                >
                  <div className="w-3 h-3 bg-white border-2 border-blue-600 rounded-xs shadow-md group-hover:scale-125 group-active:scale-135 group-hover:bg-blue-500 group-hover:border-white transition-all duration-100" />
                </div>

                {/* 4. East (Right-Center) */}
                <div
                  style={{ pointerEvents: 'auto' }}
                  onMouseDown={(e) => handleResizeStart('e', e)}
                  onTouchStart={(e) => handleResizeStart('e', e)}
                  className="absolute -right-3.5 top-1/2 -translate-y-1/2 w-7 h-8 flex items-center justify-center cursor-ew-resize group z-50 select-none"
                  title="Ajustar Largura na Grade (Direita) • Snapping automático de colunas"
                >
                  <div className="w-2 h-4 bg-white border-2 border-blue-600 rounded-full shadow-md group-hover:scale-125 group-active:scale-135 group-hover:bg-blue-500 group-hover:border-white transition-all duration-100" />
                </div>

                {/* 5. South-East (Bottom-Right) */}
                <div
                  style={{ pointerEvents: 'auto' }}
                  onMouseDown={(e) => handleResizeStart('se', e)}
                  onTouchStart={(e) => handleResizeStart('se', e)}
                  className="absolute -bottom-3.5 -right-3.5 w-7 h-7 flex items-center justify-center cursor-nwse-resize group z-50 select-none"
                  title="Redimensionar (Inferior Direito) • Segure Shift para travar proporção"
                >
                  <div className="w-3 h-3 bg-white border-2 border-blue-600 rounded-xs shadow-md group-hover:scale-125 group-active:scale-135 group-hover:bg-blue-500 group-hover:border-white transition-all duration-100" />
                </div>

                {/* 6. South (Bottom-Center) */}
                <div
                  style={{ pointerEvents: 'auto' }}
                  onMouseDown={(e) => handleResizeStart('s', e)}
                  onTouchStart={(e) => handleResizeStart('s', e)}
                  className="absolute -bottom-3.5 left-1/2 -translate-x-1/2 w-8 h-7 flex items-center justify-center cursor-ns-resize group z-50 select-none"
                  title="Ajustar Altura (Inferior)"
                >
                  <div className="w-4 h-2 bg-white border-2 border-blue-600 rounded-full shadow-md group-hover:scale-125 group-active:scale-135 group-hover:bg-blue-500 group-hover:border-white transition-all duration-100" />
                </div>

                {/* 7. South-West (Bottom-Left) */}
                <div
                  style={{ pointerEvents: 'auto' }}
                  onMouseDown={(e) => handleResizeStart('sw', e)}
                  onTouchStart={(e) => handleResizeStart('sw', e)}
                  className="absolute -bottom-3.5 -left-3.5 w-7 h-7 flex items-center justify-center cursor-nesw-resize group z-50 select-none"
                  title="Redimensionar (Inferior Esquerdo) • Segure Shift para travar proporção"
                >
                  <div className="w-3 h-3 bg-white border-2 border-blue-600 rounded-xs shadow-md group-hover:scale-125 group-active:scale-135 group-hover:bg-blue-500 group-hover:border-white transition-all duration-100" />
                </div>

                {/* 8. West (Left-Center) */}
                <div
                  style={{ pointerEvents: 'auto' }}
                  onMouseDown={(e) => handleResizeStart('w', e)}
                  onTouchStart={(e) => handleResizeStart('w', e)}
                  className="absolute -left-3.5 top-1/2 -translate-y-1/2 w-7 h-8 flex items-center justify-center cursor-ew-resize group z-50 select-none"
                  title="Ajustar Largura na Grade (Esquerda) • Snapping automático de colunas"
                >
                  <div className="w-2 h-4 bg-white border-2 border-blue-600 rounded-full shadow-md group-hover:scale-125 group-active:scale-135 group-hover:bg-blue-500 group-hover:border-white transition-all duration-100" />
                </div>

                {/* Edit Chart Quick Action Button if canvas or chart selected */}
                {(selectedElement.tagName === 'CANVAS' ||
                  Boolean(selectedElement.element?.querySelector('canvas')) ||
                  selectedElement.element?.classList.contains('chart-card') ||
                  selectedElement.element?.classList.contains('chart-container')) && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      const cv =
                        selectedElement.tagName === 'CANVAS'
                          ? (selectedElement.element as HTMLCanvasElement)
                          : (selectedElement.element.querySelector('canvas') as HTMLCanvasElement);
                      if (cv && onOpenChartEditor) {
                        onOpenChartEditor(cv);
                      }
                    }}
                    style={{ pointerEvents: 'auto' }}
                    className="absolute -top-7 right-0 flex items-center gap-1 text-[11px] font-bold bg-indigo-600 hover:bg-indigo-700 text-white px-2.5 py-0.5 rounded shadow cursor-pointer transition active:scale-95"
                    title="Abrir editor de dados e formato do gráfico"
                  >
                    <BarChart2 className="w-3 h-3" />
                    <span>Personalizar Gráfico</span>
                  </button>
                )}
              </div>
            )}

            {/* Floating AI Toolbar attached to selection */}
            {selectedRect && selectedElement && !isEditingText && (
              <FloatingAIToolbar
                position={{
                  top: selectedRect.top,
                  left: selectedRect.left,
                  width: selectedRect.width,
                  height: selectedRect.height,
                }}
                selectedTagName={selectedElement.tagName}
                selectedText={selectedElement.textContent}
                isTextElement={selectedElement.isTextElement}
                onApplyAiAction={handleApplyAiAction}
                onDuplicateElement={handleDuplicateElement}
                onDeleteElement={handleDeleteElement}
                onSelectParent={handleSelectParent}
                onCopyElement={onCopyElement}
                onCutElement={onCutElement}
                onPasteElement={onPasteElement}
                hasClipboardContent={hasClipboard}
                onOpenInsertModal={onOpenInsertModal}
                onToggleBold={handleToggleBold}
                onToggleItalic={handleToggleItalic}
                onToggleUnderline={handleToggleUnderline}
                onChangeFontSize={handleChangeFontSize}
                onBringForward={handleBringForward}
                onSendBackward={handleSendBackward}
                onUpdateElementStyle={handleUpdateElementInlineStyle}
              />
            )}
          </div>
        </div>
      </div>

      {/* Floating Canvas Control Dock (Slide Nav, Viewport Switcher, Snap, Zoom) */}
      <div className="absolute bottom-3 sm:bottom-4 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1.5 sm:gap-2.5 bg-[var(--cv-color-surface)]/95 backdrop-blur-md px-2.5 sm:px-3 py-1.5 rounded-[var(--cv-radius-card)] border border-[var(--cv-color-border)] shadow-[var(--cv-shadow-floating)] text-xs text-[var(--cv-color-text)] select-none max-w-[calc(100%-24px)] overflow-x-auto">
        {/* Slide Navigation */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={onPrevSlide}
            disabled={slideIndex === 0}
            className={`p-1 rounded-[var(--cv-radius-control)] transition ${
              slideIndex === 0
                ? 'opacity-30 cursor-not-allowed text-[var(--cv-color-text-muted)]'
                : 'text-[var(--cv-color-text)] hover:bg-[var(--cv-color-surface-subtle)] active:scale-95 cursor-pointer'
            }`}
            title="Slide Anterior (←)"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <span className="font-semibold text-[11px] text-[var(--cv-color-text)] px-1 font-mono whitespace-nowrap">
            {slideIndex + 1} / {totalSlides}
          </span>
          <button
            onClick={onNextSlide}
            disabled={slideIndex === totalSlides - 1}
            className={`p-1 rounded-[var(--cv-radius-control)] transition ${
              slideIndex === totalSlides - 1
                ? 'opacity-30 cursor-not-allowed text-[var(--cv-color-text-muted)]'
                : 'text-[var(--cv-color-text)] hover:bg-[var(--cv-color-surface-subtle)] active:scale-95 cursor-pointer'
            }`}
            title="Próximo Slide (→)"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="h-3.5 w-px bg-[var(--cv-color-border)] mx-0.5 shrink-0" />

        {/* Viewport Mode Switcher (Desktop 16:9 / Smartphone 390px) */}
        <div className="flex items-center bg-[var(--cv-color-surface-subtle)] p-0.5 rounded-[var(--cv-radius-control)] border border-[var(--cv-color-border)] shrink-0">
          <button
            onClick={() => {
              onChangeDeviceMode?.('desktop');
              setTimeout(updateResponsiveScale, 50);
            }}
            className={`flex items-center gap-1 px-2 py-0.5 rounded-[var(--cv-radius-badge)] text-[11px] font-semibold transition cursor-pointer ${
              !isMobileView
                ? 'bg-[var(--cv-color-surface)] text-[var(--cv-color-text)] shadow-xs'
                : 'text-[var(--cv-color-text-muted)] hover:text-[var(--cv-color-text)]'
            }`}
            title="Visualização Widescreen 16:9"
          >
            <Monitor className="w-3 h-3 text-[var(--cv-color-accent)]" />
            <span className="hidden sm:inline">16:9</span>
          </button>
          <button
            onClick={() => {
              onChangeDeviceMode?.('mobile');
              setTimeout(updateResponsiveScale, 50);
            }}
            className={`flex items-center gap-1 px-2 py-0.5 rounded-[var(--cv-radius-badge)] text-[11px] font-semibold transition cursor-pointer ${
              isMobileView
                ? 'bg-[var(--cv-color-surface)] text-[var(--cv-color-text)] shadow-xs'
                : 'text-[var(--cv-color-text-muted)] hover:text-[var(--cv-color-text)]'
            }`}
            title="Visualização Mobile (Smartphone 390px)"
          >
            <Smartphone className="w-3 h-3 text-emerald-500" />
            <span className="hidden sm:inline">Mobile</span>
          </button>
        </div>

        <div className="h-3.5 w-px bg-[var(--cv-color-border)] mx-0.5 shrink-0 hidden sm:block" />

        {/* Smart Guides & Grid Snapping Toggle */}
        <button
          onClick={() => setSnapToGrid((prev) => !prev)}
          className={`hidden sm:flex items-center gap-1 text-[11px] font-medium px-2 py-1 rounded-[var(--cv-radius-control)] transition cursor-pointer shrink-0 ${
            snapToGrid
              ? 'bg-[var(--cv-color-accent-soft)] text-[var(--cv-color-accent-text)] border border-[var(--cv-color-accent)]/30 font-semibold'
              : 'text-[var(--cv-color-text-muted)] hover:text-[var(--cv-color-text)] hover:bg-[var(--cv-color-surface-subtle)]'
          }`}
          title="Guias Inteligentes e Snapping Magnético"
        >
          <Magnet className="w-3 h-3 text-[var(--cv-color-accent)]" />
          <span className="hidden md:inline">Snap</span>
        </button>

        {/* 12-Column Responsive Grid Toggle */}
        <button
          onClick={() => setShowGridOverlay((prev) => !prev)}
          className={`hidden sm:flex items-center gap-1 text-[11px] font-medium px-2 py-1 rounded-[var(--cv-radius-control)] transition cursor-pointer shrink-0 ${
            showGridOverlay
              ? 'bg-[var(--cv-color-accent)] text-white font-semibold'
              : 'text-[var(--cv-color-text-muted)] hover:text-[var(--cv-color-text)] hover:bg-[var(--cv-color-surface-subtle)]'
          }`}
          title="Grade Guia de 12 Colunas"
        >
          <LayoutGrid className="w-3 h-3" />
          <span className="hidden md:inline">Grade</span>
        </button>

        <div className="h-3.5 w-px bg-[var(--cv-color-border)] mx-0.5 shrink-0" />

        {/* Zoom Controls */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => {
              setZoomMode('manual');
              setManualZoom((z) => Math.max(0.3, Number((effectiveZoom - 0.1).toFixed(2))));
            }}
            className="p-1 text-[var(--cv-color-text-muted)] hover:text-[var(--cv-color-text)] rounded-[var(--cv-radius-control)] hover:bg-[var(--cv-color-surface-subtle)] transition cursor-pointer"
            title="Diminuir Zoom"
          >
            <ZoomOut className="w-3 h-3" />
          </button>
          <span className="text-[10px] font-mono w-9 text-center text-[var(--cv-color-text)] font-semibold">
            {Math.round(effectiveZoom * 100)}%
          </span>
          <button
            onClick={() => {
              setZoomMode('manual');
              setManualZoom((z) => Math.min(1.8, Number((effectiveZoom + 0.1).toFixed(2))));
            }}
            className="p-1 text-[var(--cv-color-text-muted)] hover:text-[var(--cv-color-text)] rounded-[var(--cv-radius-control)] hover:bg-[var(--cv-color-surface-subtle)] transition cursor-pointer"
            title="Aumentar Zoom"
          >
            <ZoomIn className="w-3 h-3" />
          </button>
          <button
            onClick={() => {
              setZoomMode('fit');
              updateResponsiveScale();
            }}
            className={`text-[10px] font-bold px-1.5 py-0.5 rounded-[var(--cv-radius-badge)] transition flex items-center gap-1 cursor-pointer ${
              zoomMode === 'fit'
                ? 'bg-[var(--cv-color-accent-soft)] text-[var(--cv-color-accent-text)]'
                : 'text-[var(--cv-color-text-muted)] hover:text-[var(--cv-color-text)] hover:bg-[var(--cv-color-surface-subtle)]'
            }`}
            title="Ajustar automaticamente à tela"
          >
            <Maximize2 className="w-2.5 h-2.5" />
            <span className="hidden lg:inline">Ajustar</span>
          </button>
        </div>
      </div>
    </div>
  );
};
