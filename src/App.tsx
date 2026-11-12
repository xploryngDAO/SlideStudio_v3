import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { PresentationDoc, SlideData, ViewMode, DeviceMode, ChartConfig } from './types/presentation';
import {
  parseHtmlPresentation,
  serializePresentationToHtml,
  SAMPLE_PRESENTATIONS,
  createDefaultSlide,
  createBlankPresentation,
} from './utils/slideParser';
import { CASAS_BAHIA_HTML } from './utils/casasBahiaSample';
import { TopToolbar } from './components/TopToolbar';
import { SlideNavigator } from './components/SlideNavigator';
import { SlideCanvas, SelectedElementInfo } from './components/SlideCanvas';
import { InspectorSidebar } from './components/InspectorSidebar';
import { AIAssistantModal } from './components/AIAssistantModal';
import { InsertElementModal } from './components/InsertElementModal';
import { ChartEditorModal } from './components/ChartEditorModal';
import { PresentationMode } from './components/PresentationMode';
import { CodeViewModal } from './components/CodeViewModal';
import { MobileBottomNav } from './components/MobileBottomNav';
import { WelcomeScreen } from './components/WelcomeScreen';
import { PresentationCreatorWizard } from './components/PresentationCreatorWizard';
import { usePresentationStyles } from './utils/styleInjector';
import { exportSlideToPptx, exportPresentationToPptx, exportPresentationToPdf } from './utils/pptxExport';
import { PptxImportModal } from './components/PptxImportModal';
import { StudioLeftDock } from './components/StudioLeftDock';
import { ExportModal } from './components/ExportModal';
import { getChartConfigFromCanvas, initSlideCharts } from './utils/chartHelper';

export default function App() {
  // Screen mode: 'welcome' (zero-scroll initial hub), 'creator' (AI Deck wizard), or 'studio' (editor)
  const [currentScreen, setCurrentScreen] = useState<'welcome' | 'creator' | 'studio'>('welcome');

  // Initialize presentation with Casas Bahia Regional 122 deck
  const [presentation, setPresentation] = useState<PresentationDoc>(() => {
    return parseHtmlPresentation(CASAS_BAHIA_HTML);
  });

  // Dynamically inject and scope presentation styles, fonts, and CSS variables
  usePresentationStyles(presentation.headHtml);

  const [activeSlideIndex, setActiveSlideIndex] = useState(0);
  const [selectedElement, setSelectedElement] = useState<SelectedElementInfo | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('edit');

  // Responsive panels visibility
  const [showNavigator, setShowNavigator] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth >= 1024 : true
  );
  const [showInspector, setShowInspector] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth >= 1280 : true
  );

  // Modals state
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [aiModalType, setAiModalType] = useState<'generate-slide' | 'generate-chart' | 'analyze'>('generate-slide');
  const [insertModalOpen, setInsertModalOpen] = useState(false);
  const [codeModalOpen, setCodeModalOpen] = useState(false);
  const [exportModalOpen, setExportModalOpen] = useState(false);

  // PowerPoint Import Modal state
  const [pptxModalOpen, setPptxModalOpen] = useState(false);
  const [pptxUploadFile, setPptxUploadFile] = useState<File | null>(null);

  // Device Mode: Desktop (16:9 Widescreen) vs Mobile (Smartphone 390px)
  const [deviceMode, setDeviceMode] = useState<DeviceMode>('desktop');

  // Chart Editor modal state
  const [chartModalOpen, setChartModalOpen] = useState(false);
  const [editingChartConfig, setEditingChartConfig] = useState<ChartConfig | null>(null);
  const [editingCanvasId, setEditingCanvasId] = useState<string | undefined>(undefined);

  // History for Undo / Redo
  const [history, setHistory] = useState<PresentationDoc[]>([presentation]);
  const [historyIndex, setHistoryIndex] = useState(0);

  // Push new state to undo/redo history
  const pushHistory = useCallback((newDoc: PresentationDoc) => {
    setHistory((prev) => {
      const truncated = prev.slice(0, historyIndex + 1);
      return [...truncated, newDoc].slice(-30); // keep last 30 states
    });
    setHistoryIndex((prev) => Math.min(prev + 1, 29));
  }, [historyIndex]);

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  const handleUndo = () => {
    if (!canUndo) return;
    const targetIndex = historyIndex - 1;
    setHistoryIndex(targetIndex);
    setPresentation(history[targetIndex]);
    setSelectedElement(null);
  };

  const handleRedo = () => {
    if (!canRedo) return;
    const targetIndex = historyIndex + 1;
    setHistoryIndex(targetIndex);
    setPresentation(history[targetIndex]);
    setSelectedElement(null);
  };

  // Element Clipboard State (Copy, Cut, Paste)
  const [clipboardElement, setClipboardElement] = useState<{
    html: string;
    tagName: string;
    title?: string;
  } | null>(null);

  // Floating Feedback Toast State
  const [toast, setToast] = useState<{ message: string; type?: 'info' | 'success' } | null>(null);

  const showToast = useCallback((message: string, type: 'info' | 'success' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast((prev) => (prev?.message === message ? null : prev));
    }, 2500);
  }, []);

  // Keyboard shortcut for Undo, Redo, Copy, Cut, Paste, Duplicate
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeTag = document.activeElement?.tagName?.toUpperCase();
      const isInputFocused =
        activeTag === 'INPUT' ||
        activeTag === 'TEXTAREA' ||
        (document.activeElement as HTMLElement)?.isContentEditable;

      if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
        if (!isInputFocused) {
          e.preventDefault();
          if (e.shiftKey) {
            handleRedo();
          } else {
            handleUndo();
          }
        }
      } else if ((e.metaKey || e.ctrlKey) && e.key === 'y') {
        if (!isInputFocused) {
          e.preventDefault();
          handleRedo();
        }
      } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'c') {
        if (!isInputFocused && selectedElement) {
          e.preventDefault();
          handleCopySelectedElement();
        }
      } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'x') {
        if (!isInputFocused && selectedElement) {
          e.preventDefault();
          handleCutSelectedElement();
        }
      } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'v') {
        if (!isInputFocused) {
          e.preventDefault();
          handlePasteElement();
        }
      } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'd') {
        if (!isInputFocused && selectedElement) {
          e.preventDefault();
          handleDuplicateSelectedElement();
        }
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        if (!isInputFocused && selectedElement) {
          e.preventDefault();
          handleDeleteSelectedElement();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  // Current active slide
  const currentSlide: SlideData = useMemo(() => {
    if (presentation.slides.length === 0) {
      return createDefaultSlide(1);
    }
    const safeIndex = Math.min(Math.max(0, activeSlideIndex), presentation.slides.length - 1);
    return presentation.slides[safeIndex];
  }, [presentation.slides, activeSlideIndex]);

  // Update HTML content of current slide
  const handleUpdateCurrentSlideHtml = (newHtml: string) => {
    setPresentation((prev) => {
      const updatedSlides = [...prev.slides];
      updatedSlides[activeSlideIndex] = {
        ...updatedSlides[activeSlideIndex],
        htmlContent: newHtml,
      };
      const updatedDoc = { ...prev, slides: updatedSlides };
      pushHistory(updatedDoc);
      return updatedDoc;
    });
  };

  // Update properties of current slide (e.g. style, title, notes)
  const handleUpdateSlideProps = (props: Partial<SlideData>) => {
    setPresentation((prev) => {
      const updatedSlides = [...prev.slides];
      updatedSlides[activeSlideIndex] = {
        ...updatedSlides[activeSlideIndex],
        ...props,
      };
      const updatedDoc = { ...prev, slides: updatedSlides };
      pushHistory(updatedDoc);
      return updatedDoc;
    });
  };

  // Update selected element inline style (e.g., color, fontSize, background, etc.)
  const handleUpdateElementStyle = (property: string, value: string) => {
    if (!selectedElement?.element) return;
    // Apply style to the live DOM node
    (selectedElement.element.style as any)[property] = value;

    // Refresh selected element computed styles
    const computed = window.getComputedStyle(selectedElement.element);
    setSelectedElement((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        computedStyle: {
          ...prev.computedStyle,
          [property]: value,
          color: computed.color,
          backgroundColor: computed.backgroundColor,
          fontSize: computed.fontSize,
          fontWeight: computed.fontWeight,
          textAlign: computed.textAlign,
          fontFamily: computed.fontFamily,
          borderRadius: computed.borderRadius,
          padding: computed.padding,
        },
      };
    });

    // Sync to slide container
    const slideContainer = document.getElementById(currentSlide.id);
    if (slideContainer) {
      handleUpdateCurrentSlideHtml(slideContainer.innerHTML);
    }
  };

  // Update element text content directly
  const handleUpdateElementText = (text: string) => {
    if (!selectedElement?.element) return;
    selectedElement.element.textContent = text;
    setSelectedElement((prev) => (prev ? { ...prev, textContent: text } : null));

    const slideContainer = document.getElementById(currentSlide.id);
    if (slideContainer) {
      handleUpdateCurrentSlideHtml(slideContainer.innerHTML);
    }
  };

  // Update element attribute (e.g. src for images)
  const handleUpdateElementAttribute = (attr: string, value: string) => {
    if (!selectedElement?.element) return;
    selectedElement.element.setAttribute(attr, value);

    const slideContainer = document.getElementById(currentSlide.id);
    if (slideContainer) {
      handleUpdateCurrentSlideHtml(slideContainer.innerHTML);
    }
  };

  // Update entrance animation on selected element
  const handleUpdateElementAnimation = (
    animType: string,
    duration = '0.6s',
    delay = '0s',
    easing = 'cubic-bezier(0.16, 1, 0.3, 1)'
  ) => {
    if (!selectedElement?.element) return;
    const target = selectedElement.element;

    if (!animType || animType === 'none') {
      target.removeAttribute('data-animate');
      target.removeAttribute('data-animate-duration');
      target.removeAttribute('data-animate-delay');
      target.removeAttribute('data-animate-easing');
      target.style.removeProperty('animation');
      target.style.removeProperty('animation-name');
      target.style.removeProperty('animation-duration');
      target.style.removeProperty('animation-delay');
      target.style.removeProperty('animation-timing-function');
      target.style.removeProperty('animation-fill-mode');
    } else {
      target.setAttribute('data-animate', animType);
      target.setAttribute('data-animate-duration', duration);
      target.setAttribute('data-animate-delay', delay);
      target.setAttribute('data-animate-easing', easing);

      const animKeyframe = 'ss-' + (animType === 'zoom' ? 'zoom-in' : animType);
      target.style.animation = `${animKeyframe} ${duration} ${easing} ${delay} both`;
    }

    // Refresh selectedElement state
    setSelectedElement((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        animation:
          animType && animType !== 'none'
            ? { type: animType, duration, delay, easing }
            : undefined,
      };
    });

    // Sync to slide container
    const slideContainer = document.getElementById(currentSlide.id);
    if (slideContainer) {
      handleUpdateCurrentSlideHtml(slideContainer.innerHTML);
    }
  };

  // Preview or replay animation on the canvas element
  const handlePreviewAnimation = () => {
    if (!selectedElement?.element) return;
    const target = selectedElement.element;
    const animType = target.getAttribute('data-animate') || selectedElement.animation?.type;
    if (!animType || animType === 'none') return;

    const duration = target.getAttribute('data-animate-duration') || selectedElement.animation?.duration || '0.6s';
    const delay = target.getAttribute('data-animate-delay') || selectedElement.animation?.delay || '0s';
    const easing = target.getAttribute('data-animate-easing') || selectedElement.animation?.easing || 'cubic-bezier(0.16, 1, 0.3, 1)';
    const animKeyframe = 'ss-' + (animType === 'zoom' ? 'zoom-in' : animType);

    target.style.animation = 'none';
    void target.offsetWidth;
    target.style.animation = `${animKeyframe} ${duration} ${easing} ${delay} both`;
  };

  // Open Chart Editor Modal for active canvas or new chart
  const handleOpenChartEditor = (canvas?: HTMLCanvasElement) => {
    if (canvas) {
      setEditingCanvasId(canvas.id || undefined);
      const cfg = getChartConfigFromCanvas(canvas);
      setEditingChartConfig(cfg);
    } else {
      setEditingCanvasId(undefined);
      setEditingChartConfig(null);
    }
    setChartModalOpen(true);
  };

  // Save chart configuration and apply directly into slide DOM
  const handleSaveChart = (config: ChartConfig, targetCanvasId?: string) => {
    const slideContainer = document.getElementById(currentSlide.id);
    if (!slideContainer) return;

    let targetCanvas: HTMLCanvasElement | null = null;
    if (targetCanvasId) {
      targetCanvas = slideContainer.querySelector(`#${targetCanvasId}`) as HTMLCanvasElement;
    }
    if (!targetCanvas && selectedElement?.element) {
      targetCanvas =
        selectedElement.tagName === 'CANVAS'
          ? (selectedElement.element as HTMLCanvasElement)
          : (selectedElement.element.querySelector('canvas') as HTMLCanvasElement);
    }
    if (!targetCanvas) {
      targetCanvas = slideContainer.querySelector('canvas');
    }

    if (targetCanvas) {
      targetCanvas.setAttribute('data-chart-data', JSON.stringify(config));
      if (config.customTitle) {
        const chartCard = targetCanvas.closest('.chart-card');
        const header = chartCard?.querySelector('.chart-header');
        if (header) {
          header.textContent = config.customTitle;
        }
      }
      handleUpdateCurrentSlideHtml(slideContainer.innerHTML);
    } else {
      // Create new chart card in the slide
      const newChartId = `chart-${Date.now().toString(36)}`;
      const titleHtml = config.customTitle ? `<div class="chart-header">${config.customTitle}</div>` : '';
      const newChartBlock = `
<div class="chart-card my-4 p-4 bg-white rounded-xl border border-slate-200 shadow-sm w-full">
  ${titleHtml}
  <div class="chart-container" style="min-height: 240px; height: 260px; position: relative; width: 100%;">
    <canvas id="${newChartId}" data-chart-data='${JSON.stringify(config).replace(/'/g, '&apos;')}'></canvas>
  </div>
</div>`.trim();

      handleUpdateCurrentSlideHtml(slideContainer.innerHTML + '\n' + newChartBlock);
    }
  };

  // Select element from breadcrumb click
  const handleSelectBreadcrumb = (elementId: string) => {
    const el = document.querySelector(`[data-edit-id="${elementId}"]`) as HTMLElement;
    if (el) {
      el.click();
    }
  };

  // Add a new slide
  const handleAddSlide = () => {
    const newSlide = createDefaultSlide(presentation.slides.length + 1);
    setPresentation((prev) => {
      const updated = { ...prev, slides: [...prev.slides, newSlide] };
      pushHistory(updated);
      return updated;
    });
    setActiveSlideIndex(presentation.slides.length);
    setSelectedElement(null);
  };

  // Duplicate slide
  const handleDuplicateSlide = (index: number) => {
    const sourceSlide = presentation.slides[index];
    const duplicated: SlideData = {
      ...sourceSlide,
      id: `slide-${Math.random().toString(36).substring(2, 9)}`,
      title: `${sourceSlide.title} (Cópia)`,
    };

    setPresentation((prev) => {
      const nextSlides = [...prev.slides];
      nextSlides.splice(index + 1, 0, duplicated);
      const updated = { ...prev, slides: nextSlides };
      pushHistory(updated);
      return updated;
    });
    setActiveSlideIndex(index + 1);
  };

  // Delete slide
  const handleDeleteSlide = (index: number) => {
    if (presentation.slides.length <= 1) return;
    setPresentation((prev) => {
      const nextSlides = prev.slides.filter((_, i) => i !== index);
      const updated = { ...prev, slides: nextSlides };
      pushHistory(updated);
      return updated;
    });
    setActiveSlideIndex((prev) => Math.min(prev, presentation.slides.length - 2));
    setSelectedElement(null);
  };

  // Reorder slide up/down
  const handleMoveSlide = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= presentation.slides.length) return;
    setPresentation((prev) => {
      const nextSlides = [...prev.slides];
      const [moved] = nextSlides.splice(fromIndex, 1);
      nextSlides.splice(toIndex, 0, moved);
      const updated = { ...prev, slides: nextSlides };
      pushHistory(updated);
      return updated;
    });
    setActiveSlideIndex(toIndex);
  };

  // Insert generated slide from AI
  const handleInsertNewSlide = (newSlide: SlideData) => {
    setPresentation((prev) => {
      const nextSlides = [...prev.slides];
      nextSlides.splice(activeSlideIndex + 1, 0, newSlide);
      const updated = { ...prev, slides: nextSlides };
      pushHistory(updated);
      return updated;
    });
    setActiveSlideIndex(activeSlideIndex + 1);
  };

  // Insert HTML block into active slide (context-aware: after/inside selected element, or at bottom)
  const handleInsertHtmlIntoActiveSlide = (html: string) => {
    const slideContainer = document.getElementById(currentSlide.id);
    if (!slideContainer) return;

    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html.trim();
    const insertedNode = tempDiv.firstElementChild as HTMLElement;
    if (!insertedNode) return;

    // Refresh unique edit IDs for all elements in the inserted component
    insertedNode.querySelectorAll('*').forEach((el, idx) => {
      el.setAttribute('data-edit-id', `el-${Date.now().toString(36)}-${idx}`);
    });
    const newRootId = `el-${Date.now().toString(36)}-root`;
    insertedNode.setAttribute('data-edit-id', newRootId);

    // If an element is currently selected:
    // If it is a container (like grid, flex row, section, article), append inside it!
    // Otherwise, insert immediately after the selected element.
    if (selectedElement?.element && selectedElement.element.parentElement) {
      const target = selectedElement.element;
      const isContainer =
        target.classList.contains('grid') ||
        target.classList.contains('split-view') ||
        target.classList.contains('kpi-row') ||
        ['SECTION', 'ARTICLE', 'MAIN'].includes(target.tagName) ||
        (target.children.length > 0 && !target.classList.contains('card') && !target.classList.contains('kpi-card'));

      if (isContainer) {
        target.appendChild(insertedNode);
      } else {
        target.after(insertedNode);
      }
    } else {
      slideContainer.appendChild(insertedNode);
    }

    handleUpdateCurrentSlideHtml(slideContainer.innerHTML);
    showToast('Novo componente inserido com sucesso!');

    // Automatically select the inserted element so the user can immediately customize and resize it
    setTimeout(() => {
      const liveNode = slideContainer.querySelector(`[data-edit-id="${newRootId}"]`) as HTMLElement;
      if (liveNode) {
        liveNode.click();
      }
    }, 60);
  };

  // File upload handler - sets presentation and navigates to Studio (supports HTML and PPTX)
  const handleFileUpload = (file: File) => {
    if (file.name.toLowerCase().endsWith('.pptx')) {
      setPptxUploadFile(file);
      setPptxModalOpen(true);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      if (text) {
        const parsed = parseHtmlPresentation(text);
        setPresentation(parsed);
        pushHistory(parsed);
        setActiveSlideIndex(0);
        setSelectedElement(null);
        setCurrentScreen('studio');
      }
    };
    reader.readAsText(file);
  };

  // Callback when PPTX import succeeds
  const handlePptxImportSuccess = (newDoc: PresentationDoc) => {
    setPresentation(newDoc);
    pushHistory(newDoc);
    setActiveSlideIndex(0);
    setSelectedElement(null);
    setCurrentScreen('studio');
    showToast(`Apresentação "${newDoc.title}" convertida e importada com sucesso!`);
  };

  // Load sample presentation - sets presentation and navigates to Studio
  const handleLoadSample = (sampleKey: string) => {
    const sample = SAMPLE_PRESENTATIONS[sampleKey];
    if (sample) {
      const parsed = parseHtmlPresentation(sample.rawHtml);
      setPresentation(parsed);
      pushHistory(parsed);
      setActiveSlideIndex(0);
      setSelectedElement(null);
      setCurrentScreen('studio');
    }
  };

  // Start with a blank presentation
  const handleStartBlank = () => {
    const blank = createBlankPresentation();
    setPresentation(blank);
    pushHistory(blank);
    setActiveSlideIndex(0);
    setSelectedElement(null);
    setCurrentScreen('studio');
  };

  // Callback when AI Creator Wizard finishes generating presentation
  const handleCompleteWizard = (generatedDoc: PresentationDoc) => {
    setPresentation(generatedDoc);
    pushHistory(generatedDoc);
    setActiveSlideIndex(0);
    setSelectedElement(null);
    setCurrentScreen('studio');
  };

  // Return to Welcome Screen
  const handleGoHome = () => {
    setCurrentScreen('welcome');
  };

  // Export Standalone HTML
  const handleExportHtml = () => {
    const htmlString = serializePresentationToHtml(presentation);
    const blob = new Blob([htmlString], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${presentation.title.toLowerCase().replace(/[^a-z0-9]/g, '_') || 'apresentacao'}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Print / Save as PDF (Safe iframe printer avoiding window.open)
  const handlePrintPdf = async () => {
    const htmlString = serializePresentationToHtml(presentation);
    showToast('Preparando impressão / salvamento em PDF...', 'info');
    const ok = await exportPresentationToPdf(htmlString);
    if (ok) {
      showToast('Janela de impressão aberta com sucesso!');
    }
  };

  // Export Entire Presentation to PowerPoint (.pptx)
  const handleExportPptxAll = async (mode: 'high-fidelity' | 'vector' = 'vector') => {
    try {
      showToast(
        mode === 'vector'
          ? 'Gerando apresentação com camadas 100% editáveis no PowerPoint...'
          : 'Renderizando apresentação em alta definição (1920x1080)...',
        'info'
      );
      await exportPresentationToPptx(presentation, {
        mode,
        onProgress: (current, total) => {
          showToast(`Processando slide ${current} de ${total} em camadas nativas...`, 'info');
        },
      });
      showToast('Apresentação PowerPoint (.pptx) gerada com sucesso!');
    } catch (err) {
      console.error('Erro ao exportar PPTX:', err);
      showToast('Falha ao exportar apresentação para PowerPoint.', 'info');
    }
  };

  // Export Current Slide to PowerPoint (.pptx)
  const handleExportPptxCurrentSlide = async (
    index = activeSlideIndex,
    mode: 'high-fidelity' | 'vector' = 'vector'
  ) => {
    try {
      const targetSlide = presentation.slides[index] || currentSlide;
      showToast(`Exportando slide ${index + 1} em camadas nativas...`, 'info');
      await exportSlideToPptx(targetSlide, presentation, index, { mode });
      showToast(`Slide ${index + 1} exportado com sucesso em .pptx!`);
    } catch (err) {
      console.error('Erro ao exportar slide para PPTX:', err);
      showToast('Falha ao exportar slide para PowerPoint.', 'info');
    }
  };

  // Quick actions for selected element
  const handleDuplicateSelectedElement = useCallback(() => {
    if (!selectedElement?.element) return;
    const clone = selectedElement.element.cloneNode(true) as HTMLElement;
    clone.setAttribute('data-edit-id', `el-${Date.now().toString(36)}`);
    selectedElement.element.after(clone);
    const container = document.getElementById(currentSlide.id);
    if (container) handleUpdateCurrentSlideHtml(container.innerHTML);
  }, [selectedElement, currentSlide.id, handleUpdateCurrentSlideHtml]);

  const handleDeleteSelectedElement = useCallback(() => {
    if (!selectedElement?.element) return;
    selectedElement.element.remove();
    setSelectedElement(null);
    const container = document.getElementById(currentSlide.id);
    if (container) handleUpdateCurrentSlideHtml(container.innerHTML);
  }, [selectedElement, currentSlide.id, handleUpdateCurrentSlideHtml]);

  // Copy selected element
  const handleCopySelectedElement = useCallback(() => {
    if (!selectedElement?.element) return;
    const html = selectedElement.element.outerHTML;
    setClipboardElement({
      html,
      tagName: selectedElement.tagName,
      title: (selectedElement.textContent || selectedElement.tagName).trim().slice(0, 30),
    });
    try {
      if (navigator.clipboard?.writeText) {
        navigator.clipboard.writeText(html);
      }
    } catch (_) {}
    showToast(`Elemento <${selectedElement.tagName.toLowerCase()}> copiado! Pressione Ctrl+V para colar.`);
  }, [selectedElement, showToast]);

  // Cut selected element
  const handleCutSelectedElement = useCallback(() => {
    if (!selectedElement?.element) return;
    const html = selectedElement.element.outerHTML;
    setClipboardElement({
      html,
      tagName: selectedElement.tagName,
      title: (selectedElement.textContent || selectedElement.tagName).trim().slice(0, 30),
    });
    try {
      if (navigator.clipboard?.writeText) {
        navigator.clipboard.writeText(html);
      }
    } catch (_) {}
    selectedElement.element.remove();
    setSelectedElement(null);
    const container = document.getElementById(currentSlide.id);
    if (container) handleUpdateCurrentSlideHtml(container.innerHTML);
    showToast('Elemento recortado! Pressione Ctrl+V para colar.');
  }, [selectedElement, currentSlide.id, handleUpdateCurrentSlideHtml, showToast]);

  // Paste element into active slide
  const handlePasteElement = useCallback(() => {
    if (!clipboardElement?.html) {
      showToast('Área de transferência vazia. Copie um elemento primeiro (Ctrl+C).', 'info');
      return;
    }
    const slideContainer = document.getElementById(currentSlide.id);
    if (!slideContainer) return;

    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = clipboardElement.html;
    const pastedNode = tempDiv.firstElementChild as HTMLElement;
    if (!pastedNode) return;

    // Refresh unique edit IDs
    pastedNode.querySelectorAll('*').forEach((el, idx) => {
      el.setAttribute('data-edit-id', `el-${Date.now().toString(36)}-${idx}`);
    });
    const newRootId = `el-${Date.now().toString(36)}-root`;
    pastedNode.setAttribute('data-edit-id', newRootId);

    // If an element is selected, paste right after it. Otherwise, append to slide.
    if (selectedElement?.element && selectedElement.element.parentElement) {
      selectedElement.element.after(pastedNode);
    } else {
      slideContainer.appendChild(pastedNode);
    }

    handleUpdateCurrentSlideHtml(slideContainer.innerHTML);
    showToast(`Elemento <${clipboardElement.tagName.toLowerCase()}> colado com sucesso!`);

    // Auto-select pasted element
    setTimeout(() => {
      const liveNode = slideContainer.querySelector(`[data-edit-id="${newRootId}"]`) as HTMLElement;
      if (liveNode) {
        liveNode.click();
      }
    }, 60);
  }, [clipboardElement, selectedElement, currentSlide.id, handleUpdateCurrentSlideHtml, showToast]);

  // Reorder selected element within its parent container
  const handleReorderElement = useCallback((direction: 'prev' | 'next' | 'first' | 'last') => {
    if (!selectedElement?.element) return;
    const el = selectedElement.element;
    const parent = el.parentElement;
    if (!parent) return;

    if (direction === 'prev') {
      const prev = el.previousElementSibling;
      if (prev) {
        parent.insertBefore(el, prev);
      }
    } else if (direction === 'next') {
      const next = el.nextElementSibling;
      if (next) {
        parent.insertBefore(el, next.nextSibling);
      }
    } else if (direction === 'first') {
      if (parent.firstElementChild && parent.firstElementChild !== el) {
        parent.insertBefore(el, parent.firstElementChild);
      }
    } else if (direction === 'last') {
      parent.appendChild(el);
    }

    const slideContainer = document.getElementById(currentSlide.id);
    if (slideContainer) {
      initSlideCharts(slideContainer);
      handleUpdateCurrentSlideHtml(slideContainer.innerHTML);
    }
  }, [selectedElement, currentSlide.id, handleUpdateCurrentSlideHtml]);

  // Set 12-column responsive grid span
  const handleSetGridSpan = useCallback((cols: number) => {
    if (!selectedElement?.element) return;
    const el = selectedElement.element;
    const parent = el.parentElement;
    const parentStyle = parent ? window.getComputedStyle(parent) : null;
    const isGrid = parentStyle?.display === 'grid';

    const safeCols = Math.min(12, Math.max(1, cols));
    const pct = Number(((safeCols / 12) * 100).toFixed(1));

    if (isGrid) {
      el.style.gridColumn = `span ${safeCols} / span ${safeCols}`;
    }

    // Set width percentage for responsive adaptation across viewports
    if (safeCols === 12) {
      el.style.width = '100%';
    } else {
      el.style.width = `${pct}%`;
    }
    el.style.maxWidth = '100%';
    el.style.boxSizing = 'border-box';

    const slideContainer = document.getElementById(currentSlide.id);
    if (slideContainer) {
      handleUpdateCurrentSlideHtml(slideContainer.innerHTML);
    }
  }, [selectedElement, currentSlide.id, handleUpdateCurrentSlideHtml]);

  // Convert parent container into responsive CSS grid
  const handleConvertParentToGrid = useCallback((
    layoutType: 'grid-2' | 'grid-3' | 'grid-4' | 'split-60-40' | 'split-50-50' | 'flex-row'
  ) => {
    if (!selectedElement?.element) return;
    const el = selectedElement.element;
    const container = el.parentElement || el;

    container.classList.remove('kpi-row', 'kpi-row-6', 'split-view', 'split-view-equal', 'cover-grid', 'matrix-grid');

    if (layoutType === 'grid-2') {
      container.style.display = 'grid';
      container.style.gridTemplateColumns = 'repeat(2, 1fr)';
      container.style.gap = '14px';
      container.style.width = '100%';
    } else if (layoutType === 'grid-3') {
      container.style.display = 'grid';
      container.style.gridTemplateColumns = 'repeat(3, 1fr)';
      container.style.gap = '12px';
      container.style.width = '100%';
    } else if (layoutType === 'grid-4') {
      container.style.display = 'grid';
      container.style.gridTemplateColumns = 'repeat(4, 1fr)';
      container.style.gap = '12px';
      container.style.width = '100%';
    } else if (layoutType === 'split-60-40') {
      container.style.display = 'grid';
      container.style.gridTemplateColumns = '1.4fr 1fr';
      container.style.gap = '16px';
      container.style.width = '100%';
    } else if (layoutType === 'split-50-50') {
      container.style.display = 'grid';
      container.style.gridTemplateColumns = '1fr 1fr';
      container.style.gap = '16px';
      container.style.width = '100%';
    } else if (layoutType === 'flex-row') {
      container.style.display = 'flex';
      container.style.flexWrap = 'wrap';
      container.style.gap = '12px';
      container.style.width = '100%';
    }

    const slideContainer = document.getElementById(currentSlide.id);
    if (slideContainer) {
      handleUpdateCurrentSlideHtml(slideContainer.innerHTML);
    }
  }, [selectedElement, currentSlide.id, handleUpdateCurrentSlideHtml]);

  // 1. Initial Zero-Scroll Welcome Hub
  if (currentScreen === 'welcome') {
    return (
      <>
        <WelcomeScreen
          onUploadHtml={handleFileUpload}
          onStartCreatePresentation={() => setCurrentScreen('creator')}
          onLoadSample={handleLoadSample}
          onStartBlank={handleStartBlank}
          onOpenStudio={() => setCurrentScreen('studio')}
        />
        <PptxImportModal
          isOpen={pptxModalOpen}
          file={pptxUploadFile}
          onClose={() => {
            setPptxModalOpen(false);
            setPptxUploadFile(null);
          }}
          onSuccess={handlePptxImportSuccess}
        />
      </>
    );
  }

  // 2. Creator Wizard Screen (Overlaid on top of Welcome Screen)
  if (currentScreen === 'creator') {
    return (
      <div className="relative h-screen w-screen overflow-hidden">
        <WelcomeScreen
          onUploadHtml={handleFileUpload}
          onStartCreatePresentation={() => setCurrentScreen('creator')}
          onLoadSample={handleLoadSample}
          onStartBlank={handleStartBlank}
          onOpenStudio={() => setCurrentScreen('studio')}
        />
        <PresentationCreatorWizard
          isOpen={true}
          onClose={() => setCurrentScreen('welcome')}
          onComplete={handleCompleteWizard}
        />
        <PptxImportModal
          isOpen={pptxModalOpen}
          file={pptxUploadFile}
          onClose={() => {
            setPptxModalOpen(false);
            setPptxUploadFile(null);
          }}
          onSuccess={handlePptxImportSuccess}
        />
      </div>
    );
  }

  // 3. Studio Workspace
  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[var(--cv-color-background)] font-sans antialiased text-[var(--cv-color-text)] transition-colors">
      {/* Top Application Toolbar (Streamlined & Minimal) */}
      <TopToolbar
        presentation={presentation}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onExportHtml={handleExportHtml}
        onPrintPdf={handlePrintPdf}
        onExportPptxAll={handleExportPptxAll}
        onExportPptxCurrentSlide={(mode) => handleExportPptxCurrentSlide(activeSlideIndex, mode)}
        onTitleChange={(title) => {
          setPresentation((prev) => {
            const updated = { ...prev, title };
            pushHistory(updated);
            return updated;
          });
        }}
        canUndo={canUndo}
        canRedo={canRedo}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onGoHome={handleGoHome}
        onOpenExportModal={() => setExportModalOpen(true)}
      />

      {/* Main Workspace: Left Activity Dock + Navigator + Canvas + Inspector */}
      <div className="flex flex-col md:flex-row flex-1 overflow-hidden relative">
        {/* Left Activity Dock for creation tools & utilities */}
        <StudioLeftDock
          showNavigator={showNavigator}
          onToggleNavigator={() => setShowNavigator((prev) => !prev)}
          showInspector={showInspector}
          onToggleInspector={() => setShowInspector((prev) => !prev)}
          onOpenInsertModal={() => setInsertModalOpen(true)}
          onOpenChartModal={() => handleOpenChartEditor()}
          onOpenAiModal={(type) => {
            setAiModalType(type);
            setAiModalOpen(true);
          }}
          onOpenCodeView={() => setCodeModalOpen(true)}
          onLoadSample={handleLoadSample}
          onFileUpload={handleFileUpload}
          slideCount={presentation.slides.length}
          onOpenExportModal={() => setExportModalOpen(true)}
        />

        {/* Left Thumbnails Navigator */}
        <SlideNavigator
          slides={presentation.slides}
          presentation={presentation}
          activeSlideIndex={activeSlideIndex}
          isOpen={showNavigator}
          onClose={() => setShowNavigator(false)}
          onSelectSlide={(idx) => {
            setActiveSlideIndex(idx);
            setSelectedElement(null);
          }}
          onAddSlide={handleAddSlide}
          onAddAiSlide={() => {
            setAiModalType('generate-slide');
            setAiModalOpen(true);
          }}
          onDuplicateSlide={handleDuplicateSlide}
          onDeleteSlide={handleDeleteSlide}
          onMoveSlide={handleMoveSlide}
          onExportSlidePptx={(idx) => handleExportPptxCurrentSlide(idx)}
        />

        {/* Center Interactive Visual Canvas */}
        <SlideCanvas
          slide={currentSlide}
          slideIndex={activeSlideIndex}
          totalSlides={presentation.slides.length}
          presentation={presentation}
          deviceMode={deviceMode}
          onChangeDeviceMode={setDeviceMode}
          onOpenChartEditor={handleOpenChartEditor}
          isCompactMode={showInspector || showNavigator}
          onUpdateSlideHtml={handleUpdateCurrentSlideHtml}
          onUpdateSlideProps={handleUpdateSlideProps}
          selectedElement={selectedElement}
          onSelectElement={(info) => {
            setSelectedElement(info);
            // On mobile, selecting an element opens inspector below and closes navigator so slide stays visible
            if (info) {
              if (window.innerWidth < 768) {
                setShowNavigator(false);
              }
              setShowInspector(true);
            }
          }}
          onPrevSlide={() => {
            setActiveSlideIndex((prev) => Math.max(0, prev - 1));
            setSelectedElement(null);
          }}
          onNextSlide={() => {
            setActiveSlideIndex((prev) => Math.min(presentation.slides.length - 1, prev + 1));
            setSelectedElement(null);
          }}
          onCopyElement={handleCopySelectedElement}
          onCutElement={handleCutSelectedElement}
          onPasteElement={handlePasteElement}
          hasClipboard={Boolean(clipboardElement)}
          onOpenInsertModal={() => setInsertModalOpen(true)}
        />

        {/* Right Styling Inspector & Slide Properties */}
        <InspectorSidebar
          selectedElement={selectedElement}
          currentSlide={currentSlide}
          isOpen={showInspector}
          onClose={() => setShowInspector(false)}
          onUpdateElementStyle={handleUpdateElementStyle}
          onUpdateElementClass={(cls) => {
            if (selectedElement?.element) {
              selectedElement.element.className = cls;
              const container = document.getElementById(currentSlide.id);
              if (container) handleUpdateCurrentSlideHtml(container.innerHTML);
            }
          }}
          onUpdateElementText={handleUpdateElementText}
          onUpdateElementAttribute={handleUpdateElementAttribute}
          onUpdateSlideProps={handleUpdateSlideProps}
          onSelectBreadcrumb={handleSelectBreadcrumb}
          onOpenAiAssistant={(action) => {
            setAiModalType('generate-slide');
            setAiModalOpen(true);
          }}
          onOpenChartEditor={handleOpenChartEditor}
          onDuplicateElement={handleDuplicateSelectedElement}
          onDeleteElement={handleDeleteSelectedElement}
          onUpdateElementAnimation={handleUpdateElementAnimation}
          onPreviewAnimation={handlePreviewAnimation}
          onReorderElement={handleReorderElement}
          onSetGridSpan={handleSetGridSpan}
          onConvertParentToGrid={handleConvertParentToGrid}
          onCopyElement={handleCopySelectedElement}
          onCutElement={handleCutSelectedElement}
          onPasteElement={handlePasteElement}
          hasClipboard={Boolean(clipboardElement)}
          onOpenInsertModal={() => setInsertModalOpen(true)}
        />
      </div>

      {/* Mobile-First Bottom Navigation Dock */}
      <MobileBottomNav
        currentSlideIndex={activeSlideIndex}
        totalSlides={presentation.slides.length}
        selectedElement={selectedElement}
        showNavigator={showNavigator}
        onToggleNavigator={() => {
          // If inspector is open on mobile, close it so only one bottom sheet is active
          if (!showNavigator && showInspector && window.innerWidth < 768) {
            setShowInspector(false);
          }
          setShowNavigator((prev) => !prev);
        }}
        showInspector={showInspector}
        onToggleInspector={() => {
          // If navigator is open on mobile, close it so only one bottom sheet is active
          if (!showInspector && showNavigator && window.innerWidth < 768) {
            setShowInspector(false);
          }
          setShowInspector((prev) => !prev);
        }}
        onOpenInsertModal={() => setInsertModalOpen(true)}
        onOpenAiModal={() => {
          setAiModalType('generate-slide');
          setAiModalOpen(true);
        }}
        onStartPresentation={() => setViewMode('present')}
      />

      {/* Fullscreen Presentation Mode */}
      {viewMode === 'present' && (
        <PresentationMode
          slides={presentation.slides}
          presentation={presentation}
          initialSlideIndex={activeSlideIndex}
          defaultDeviceMode={deviceMode}
          onClose={() => setViewMode('edit')}
        />
      )}

      {/* Chart Editor & Customizer Modal */}
      <ChartEditorModal
        isOpen={chartModalOpen}
        onClose={() => setChartModalOpen(false)}
        initialConfig={editingChartConfig}
        canvasId={editingCanvasId}
        onSaveChart={handleSaveChart}
      />

      {/* AI Assistant Modal (Generate Slide, Chart, Diagnostic) */}
      <AIAssistantModal
        isOpen={aiModalOpen}
        onClose={() => setAiModalOpen(false)}
        initialType={aiModalType}
        activeSlide={currentSlide}
        allSlides={presentation.slides}
        onInsertNewSlide={handleInsertNewSlide}
        onInsertHtmlIntoActiveSlide={handleInsertHtmlIntoActiveSlide}
      />

      {/* Insert Component Library Modal */}
      <InsertElementModal
        isOpen={insertModalOpen}
        onClose={() => setInsertModalOpen(false)}
        onInsertHtml={handleInsertHtmlIntoActiveSlide}
      />

      {/* Code Inspector Modal */}
      <CodeViewModal
        isOpen={codeModalOpen}
        onClose={() => setCodeModalOpen(false)}
        currentSlide={currentSlide}
        fullHtml={serializePresentationToHtml(presentation)}
        onUpdateCurrentSlideHtml={handleUpdateCurrentSlideHtml}
      />

      {/* PowerPoint (.pptx) Import Modal */}
      <PptxImportModal
        isOpen={pptxModalOpen}
        file={pptxUploadFile}
        onClose={() => {
          setPptxModalOpen(false);
          setPptxUploadFile(null);
        }}
        onSuccess={handlePptxImportSuccess}
      />

      {/* Complete PowerPoint & Multi-Format Export Center */}
      <ExportModal
        isOpen={exportModalOpen}
        onClose={() => setExportModalOpen(false)}
        presentation={presentation}
        activeSlideIndex={activeSlideIndex}
        onShowToast={showToast}
      />

      {/* Floating Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-slate-900/95 text-white px-4 py-2 rounded-full shadow-2xl border border-slate-700 text-xs font-semibold flex items-center gap-2 z-50 animate-in fade-in slide-in-from-bottom-2 duration-150 select-none">
          <span className={`w-2 h-2 rounded-full ${toast.type === 'info' ? 'bg-blue-400' : 'bg-emerald-400'} animate-pulse`} />
          <span>{toast.message}</span>
        </div>
      )}
    </div>
  );
}
