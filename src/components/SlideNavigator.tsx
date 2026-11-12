import React, { useState } from 'react';
import {
  Plus,
  Trash2,
  Copy,
  ArrowUp,
  ArrowDown,
  Sparkles,
  X,
  LayoutGrid,
  Columns,
  Presentation,
} from 'lucide-react';
import { SlideData, PresentationDoc } from '../types/presentation';
import { cssStringToStyleObject } from '../utils/styleHelper';
import { Icon, Badge } from '../convergencia';

interface SlideNavigatorProps {
  slides: SlideData[];
  presentation?: PresentationDoc;
  activeSlideIndex: number;
  isOpen: boolean;
  onClose: () => void;
  onSelectSlide: (index: number) => void;
  onAddSlide: () => void;
  onAddAiSlide: () => void;
  onDuplicateSlide: (index: number) => void;
  onDeleteSlide: (index: number) => void;
  onMoveSlide: (fromIndex: number, toIndex: number) => void;
  onExportSlidePptx?: (index: number) => void;
}

interface SlideThumbnailProps {
  slide: SlideData;
  index: number;
  presentation?: PresentationDoc;
  isActive: boolean;
}

const SlideThumbnail: React.FC<SlideThumbnailProps> = ({ slide, index, presentation, isActive }) => {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [scale, setScale] = React.useState(0.2);

  React.useEffect(() => {
    if (!containerRef.current) return;
    const updateScale = () => {
      if (containerRef.current) {
        const w = containerRef.current.clientWidth;
        if (w > 0) {
          setScale(w / 960);
        }
      }
    };
    updateScale();
    const observer = new ResizeObserver(updateScale);
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={containerRef}
      className="w-full aspect-video bg-[var(--cv-color-surface)] rounded-[var(--cv-radius-card)] border border-[var(--cv-color-border)] overflow-hidden relative pointer-events-none select-none shadow-xs"
    >
      <div
        className="slidestudio-scope slidestudio-virtual-stage slidestudio-thumbnail-scope"
        style={{
          width: '960px',
          height: '540px',
          minWidth: '960px',
          minHeight: '540px',
          maxWidth: '960px',
          maxHeight: '540px',
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
          position: 'absolute',
          top: 0,
          left: 0,
        }}
      >
        <div
          className={`w-full h-full flex flex-col overflow-hidden relative ${
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
            <div
              className={`slide active ${slide.className || ''} w-full h-full`}
              style={{
                ...cssStringToStyleObject(slide.style),
                width: '100%',
                maxWidth: '100%',
                boxSizing: 'border-box',
              }}
              dangerouslySetInnerHTML={{ __html: slide.htmlContent }}
            />
          </main>
          {presentation?.footerHtml && (
            <div
              className="slidestudio-corporate-footer shrink-0 select-none w-full max-w-full"
              dangerouslySetInnerHTML={{ __html: presentation.footerHtml }}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export const SlideNavigator: React.FC<SlideNavigatorProps> = ({
  slides,
  presentation,
  activeSlideIndex,
  isOpen,
  onClose,
  onSelectSlide,
  onAddSlide,
  onAddAiSlide,
  onDuplicateSlide,
  onDeleteSlide,
  onMoveSlide,
  onExportSlidePptx,
}) => {
  // Mobile layout mode: 'strip' (horizontal bottom strip) or 'grid' (2-column drawer)
  const [mobileLayout, setMobileLayout] = useState<'strip' | 'grid'>('strip');

  if (!isOpen) return null;

  return (
    <aside
      className={`
        w-full md:w-56 lg:w-64
        bg-[var(--cv-color-surface-subtle)]
        border-t md:border-t-0 md:border-r border-[var(--cv-color-border)]
        flex flex-col shrink-0 select-none overflow-hidden
        ${mobileLayout === 'strip' ? 'h-[230px] sm:h-[250px]' : 'h-[50vh] sm:h-[45vh]'}
        md:h-full
        shadow-[var(--cv-shadow-card)]
        animate-in slide-in-from-bottom md:slide-in-from-left duration-200
        order-2 md:order-1 z-20
      `}
    >
      {/* Mobile Drag Handle (Click to minimize/collapse) */}
      <div
        className="pt-2 pb-1 md:hidden flex justify-center cursor-pointer hover:bg-[var(--cv-color-surface)] transition"
        onClick={onClose}
        title="Toque para recolher lista de slides"
      >
        <div className="w-12 h-1.5 bg-[var(--cv-color-border-strong)] rounded-full" />
      </div>

      {/* Top Header */}
      <div className="px-3 py-2 border-b border-[var(--cv-color-border)] flex items-center justify-between bg-[var(--cv-color-surface)]">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-[var(--cv-color-text)] uppercase tracking-wider">
            Slides ({slides.length})
          </span>

          {/* Mobile View Mode Switcher (Strip vs Grid) */}
          <div className="flex md:hidden items-center bg-[var(--cv-color-surface-subtle)] p-0.5 rounded-[var(--cv-radius-control)] border border-[var(--cv-color-border)]">
            <button
              onClick={() => setMobileLayout('strip')}
              className={`p-1 rounded text-[10px] font-bold flex items-center gap-1 transition ${
                mobileLayout === 'strip' ? 'bg-[var(--cv-color-surface)] text-[var(--cv-color-accent)] shadow-xs' : 'text-[var(--cv-color-text-muted)]'
              }`}
              title="Visualização em Fita Horizontal"
            >
              <Columns className="w-3 h-3" />
              <span>Fita</span>
            </button>
            <button
              onClick={() => setMobileLayout('grid')}
              className={`p-1 rounded text-[10px] font-bold flex items-center gap-1 transition ${
                mobileLayout === 'grid' ? 'bg-[var(--cv-color-surface)] text-[var(--cv-color-accent)] shadow-xs' : 'text-[var(--cv-color-text-muted)]'
              }`}
              title="Visualização em Grade"
            >
              <LayoutGrid className="w-3 h-3" />
              <span>Grade</span>
            </button>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={onAddAiSlide}
            className="p-1.5 rounded-[var(--cv-radius-control)] text-[var(--cv-color-accent-text)] hover:bg-[var(--cv-color-accent-soft)] transition border border-[var(--cv-color-accent)]/30 bg-[var(--cv-color-accent-soft)]/50"
            title="Criar slide com IA"
          >
            <Icon name="spark" size={14} />
          </button>
          <button
            onClick={onAddSlide}
            className="flex items-center gap-1 text-xs font-bold bg-[var(--cv-color-accent)] text-[var(--cv-color-on-accent)] px-2.5 py-1 rounded-[var(--cv-radius-control)] hover:brightness-105 shadow-xs transition active:scale-95"
            title="Adicionar slide em branco"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Novo</span>
          </button>
          <button
            onClick={onClose}
            className="p-1.5 rounded-[var(--cv-radius-control)] text-[var(--cv-color-text-muted)] hover:text-[var(--cv-color-text)] hover:bg-[var(--cv-color-surface-subtle)] transition"
            title="Fechar painel"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Content:
          - Desktop: Vertical scroll list
          - Mobile Strip: Horizontal thumbnail scroll carousel
          - Mobile Grid: 2-column scroll grid
      */}
      <div
        className={`
          flex-1 overflow-auto p-2.5 sm:p-3
          ${
            mobileLayout === 'strip'
              ? 'flex flex-row md:flex-col gap-3 overflow-x-auto overflow-y-hidden md:overflow-y-auto md:overflow-x-hidden'
              : 'grid grid-cols-2 md:grid-cols-1 gap-3 overflow-y-auto'
          }
        `}
      >
        {slides.map((slide, index) => {
          const isActive = index === activeSlideIndex;

          return (
            <div
              key={slide.id || index}
              onClick={() => onSelectSlide(index)}
              className={`
                group relative rounded-[var(--cv-radius-control)] transition-all cursor-pointer border-2 p-1.5 shrink-0 shadow-[var(--cv-shadow-card)]
                ${mobileLayout === 'strip' ? 'w-44 md:w-full' : 'w-full'}
                ${
                  isActive
                    ? 'border-[var(--cv-color-accent)] bg-[var(--cv-color-accent-soft)]/20 ring-2 ring-[var(--cv-color-accent)]/20'
                    : 'border-[var(--cv-color-border)] hover:border-[var(--cv-color-border-strong)] bg-[var(--cv-color-surface)]'
                }
              `}
            >
              {/* Slide Index and Title Header */}
              <div className="flex items-center justify-between mb-1 px-1">
                <Badge tone={isActive ? 'accent' : 'neutral'} className="text-[10px] py-0 px-1.5">
                  {index + 1}
                </Badge>
                <span className="text-[10px] font-medium text-[var(--cv-color-text-muted)] truncate max-w-[110px]">
                  {slide.title || `Slide ${index + 1}`}
                </span>
              </div>

              {/* Scaled Mini Preview */}
              <SlideThumbnail
                slide={slide}
                index={index}
                presentation={presentation}
                isActive={isActive}
              />

                {/* Quick action buttons (Duplicate, Move, Delete) */}
                <div
                  className={`absolute top-1.5 right-1.5 flex items-center gap-0.5 bg-slate-900/90 backdrop-blur-sm p-0.5 rounded-lg transition-opacity ${
                    isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                  }`}
                  onClick={(e) => e.stopPropagation()}
                >
                  {index > 0 && (
                    <button
                      onClick={() => onMoveSlide(index, index - 1)}
                      className="p-1 hover:bg-white/20 rounded text-slate-300 hover:text-white"
                      title="Mover para esquerda / cima"
                    >
                      <ArrowUp className="w-3 h-3" />
                    </button>
                  )}
                  {index < slides.length - 1 && (
                    <button
                      onClick={() => onMoveSlide(index, index + 1)}
                      className="p-1 hover:bg-white/20 rounded text-slate-300 hover:text-white"
                      title="Mover para direita / baixo"
                    >
                      <ArrowDown className="w-3 h-3" />
                    </button>
                  )}
                  <button
                    onClick={() => onDuplicateSlide(index)}
                    className="p-1 hover:bg-white/20 rounded text-slate-300 hover:text-white"
                    title="Duplicar slide"
                  >
                    <Copy className="w-3 h-3" />
                  </button>
                  {onExportSlidePptx && (
                    <button
                      onClick={() => onExportSlidePptx(index)}
                      className="p-1 hover:bg-orange-600 rounded text-slate-300 hover:text-white transition"
                      title="Exportar este slide para PowerPoint (.pptx)"
                    >
                      <Presentation className="w-3 h-3" />
                    </button>
                  )}
                  {slides.length > 1 && (
                    <button
                      onClick={() => onDeleteSlide(index)}
                      className="p-1 hover:bg-rose-600 rounded text-slate-300 hover:text-white"
                      title="Excluir slide"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom Bar on Desktop */}
        <div className="hidden md:block p-3 border-t border-slate-200 bg-white/50">
          <button
            onClick={onAddAiSlide}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold bg-gradient-to-r from-violet-600 to-indigo-600 text-white hover:from-violet-700 hover:to-indigo-700 shadow-sm transition active:scale-98"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Novo Slide com IA</span>
          </button>
        </div>
      </aside>
  );
};
