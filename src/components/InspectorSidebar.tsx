import React, { useState } from 'react';
import {
  Type,
  Palette,
  Maximize,
  Sliders,
  Image as ImageIcon,
  Layout,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Bold,
  Italic,
  Underline,
  Sparkles,
  Upload,
  Check,
  ChevronRight,
  HelpCircle,
  FileCode2,
  X,
  Copy,
  Trash2,
  Maximize2,
  MousePointer,
  Play,
  Eye,
  MoveUp,
  MoveDown,
  MoveLeft,
  ZoomIn,
  Zap,
  Ban,
  Clock,
  Timer,
  BarChart2,
  LayoutGrid,
  Columns,
  ArrowLeft,
  ArrowRight,
  ChevronsLeft,
  ChevronsRight,
  Scissors,
  ClipboardPaste,
  Plus,
  GripHorizontal,
  Magnet,
} from 'lucide-react';
import { SelectedElementInfo } from './SlideCanvas';
import { SlideData } from '../types/presentation';
import { cssStringToStyleObject } from '../utils/styleHelper';
import { Icon, Badge, Chip } from '../convergencia';

interface InspectorSidebarProps {
  selectedElement: SelectedElementInfo | null;
  currentSlide: SlideData;
  isOpen: boolean;
  onClose: () => void;
  onUpdateElementStyle: (styleProperty: string, value: string) => void;
  onUpdateElementClass: (className: string) => void;
  onUpdateElementText: (text: string) => void;
  onUpdateElementAttribute: (attr: string, value: string) => void;
  onUpdateSlideProps: (props: Partial<SlideData>) => void;
  onSelectBreadcrumb: (id: string) => void;
  onOpenAiAssistant: (action: string) => void;
  onDuplicateElement?: () => void;
  onDeleteElement?: () => void;
  onUpdateElementAnimation?: (type: string, duration?: string, delay?: string, easing?: string) => void;
  onPreviewAnimation?: () => void;
  onOpenChartEditor?: (canvas: HTMLCanvasElement) => void;
  onReorderElement?: (direction: 'prev' | 'next' | 'first' | 'last') => void;
  onSetGridSpan?: (cols: number) => void;
  onConvertParentToGrid?: (layoutType: 'grid-2' | 'grid-3' | 'grid-4' | 'split-60-40' | 'split-50-50' | 'flex-row') => void;
  onCopyElement?: () => void;
  onCutElement?: () => void;
  onPasteElement?: () => void;
  hasClipboard?: boolean;
  onOpenInsertModal?: () => void;
}

const FONT_OPTIONS = [
  { label: 'Segoe UI Variable (Convergência)', value: '"Segoe UI Variable", "Segoe UI", system-ui, sans-serif' },
  { label: 'Cascadia Code (Convergência Mono)', value: '"Cascadia Code", Consolas, monospace' },
  { label: 'Plus Jakarta Sans', value: '"Plus Jakarta Sans", sans-serif' },
  { label: 'Inter', value: '"Inter", sans-serif' },
  { label: 'Outfit', value: '"Outfit", sans-serif' },
  { label: 'Poppins', value: '"Poppins", sans-serif' },
  { label: 'Montserrat', value: '"Montserrat", sans-serif' },
  { label: 'Playfair Display (Serif)', value: '"Playfair Display", serif' },
  { label: 'Merriweather (Serif)', value: '"Merriweather", serif' },
  { label: 'Fira Code (Tech Mono)', value: '"Fira Code", monospace' },
];

const COLOR_SWATCHES = [
  '#28314d', // Convergência Ink
  '#65708a', // Convergência Muted
  '#6367c9', // Convergência Accent Indigo
  '#e9e9fa', // Convergência Accent Soft
  '#3c7059', // Convergência Success
  '#80613c', // Convergência Warning
  '#a14343', // Convergência Danger
  '#8d5363', // Convergência Rose
  '#ffffff', // Surface White
  '#f3f5fc', // Convergência Background
  '#182039', // Dark Slate
  'transparent',
];

const SLIDE_BACKGROUND_PRESETS = [
  { label: 'Convergência Light', style: 'background-color: #f3f5fc; color: #28314d;' },
  { label: 'Convergência Branco Puro', style: 'background-color: #ffffff; color: #28314d;' },
  { label: 'Convergência Dark Navy', style: 'background-color: #182039; color: #e3e6f4;' },
  { label: 'Convergência Índigo Suave', style: 'background: linear-gradient(135deg, #f3f5fc 0%, #e9e9fa 100%); color: #28314d;' },
  { label: 'Dark Navy Gradiente', style: 'background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%); color: #ffffff;' },
  { label: 'Grafite Executivo', style: 'background-color: #18181b; color: #f4f4f5;' },
];

const CURATED_IMAGES = [
  { url: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&w=800&q=80', label: 'Reunião de Equipe' },
  { url: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800&q=80', label: 'Dashboard & Gráficos' },
  { url: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=800&q=80', label: 'Inovação e Tech' },
  { url: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=800&q=80', label: 'Liderança' },
  { url: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=800&q=80', label: 'Arquitetura Moderna' },
  { url: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=800&q=80', label: 'Dados & Análise' },
];

export const ANIMATION_PRESETS = [
  { id: 'none', label: 'Nenhuma', icon: Ban, desc: 'Sem animação de entrada' },
  { id: 'fade-in', label: 'Fade In', icon: Eye, desc: 'Aparição gradual suave' },
  { id: 'slide-up', label: 'Slide Up', icon: MoveUp, desc: 'Deslizar de baixo para cima' },
  { id: 'zoom', label: 'Zoom In', icon: ZoomIn, desc: 'Aproximação suave com escala' },
  { id: 'slide-down', label: 'Slide Down', icon: MoveDown, desc: 'Deslizar de cima para baixo' },
  { id: 'slide-left', label: 'Slide Left', icon: MoveLeft, desc: 'Deslizar da direita para esquerda' },
  { id: 'bounce', label: 'Bounce', icon: Zap, desc: 'Entrada com impacto elástico' },
];

export const DURATION_OPTIONS = [
  { label: '0.3s (Rápida)', value: '0.3s' },
  { label: '0.6s (Padrão)', value: '0.6s' },
  { label: '0.9s (Suave)', value: '0.9s' },
  { label: '1.2s (Lenta)', value: '1.2s' },
];

export const DELAY_OPTIONS = [
  { label: '0s (Imediato)', value: '0s' },
  { label: '0.2s (+200ms)', value: '0.2s' },
  { label: '0.4s (+400ms)', value: '0.4s' },
  { label: '0.6s (+600ms)', value: '0.6s' },
  { label: '0.8s (+800ms)', value: '0.8s' },
  { label: '1.0s (+1s)', value: '1.0s' },
];

export const EASING_OPTIONS = [
  { label: 'Suave Natural (Ease Out)', value: 'cubic-bezier(0.16, 1, 0.3, 1)' },
  { label: 'Elástico Dinâmico (Spring)', value: 'cubic-bezier(0.34, 1.56, 0.64, 1)' },
  { label: 'Linear Uniforme', value: 'linear' },
];

export const InspectorSidebar: React.FC<InspectorSidebarProps> = ({
  selectedElement,
  currentSlide,
  isOpen,
  onClose,
  onUpdateElementStyle,
  onUpdateElementClass,
  onUpdateElementText,
  onUpdateElementAttribute,
  onUpdateSlideProps,
  onSelectBreadcrumb,
  onOpenAiAssistant,
  onDuplicateElement,
  onDeleteElement,
  onUpdateElementAnimation,
  onPreviewAnimation,
  onOpenChartEditor,
  onReorderElement,
  onSetGridSpan,
  onConvertParentToGrid,
  onCopyElement,
  onCutElement,
  onPasteElement,
  hasClipboard,
  onOpenInsertModal,
}) => {
  const [activeTab, setActiveTab] = useState<'element' | 'slide'>('element');
  const [showImagePicker, setShowImagePicker] = useState(false);

  const isImage = selectedElement?.tagName === 'IMG';
  const hasElement = Boolean(selectedElement);

  // If no element selected, default to slide tab
  const currentTab = hasElement ? activeTab : 'slide';

  // Animation state derived from selected element
  const activeAnimType = selectedElement?.animation?.type || selectedElement?.element?.getAttribute('data-animate') || 'none';
  const activeDuration = selectedElement?.animation?.duration || selectedElement?.element?.getAttribute('data-animate-duration') || '0.6s';
  const activeDelay = selectedElement?.animation?.delay || selectedElement?.element?.getAttribute('data-animate-delay') || '0s';
  const activeEasing = selectedElement?.animation?.easing || selectedElement?.element?.getAttribute('data-animate-easing') || 'cubic-bezier(0.16, 1, 0.3, 1)';

  const handleSelectAnimation = (animId: string) => {
    if (animId === 'none') {
      onUpdateElementAnimation?.('none');
    } else {
      onUpdateElementAnimation?.(animId, activeDuration, activeDelay, activeEasing);
      setTimeout(() => {
        onPreviewAnimation?.();
      }, 50);
    }
  };

  const handleUpdateDuration = (duration: string) => {
    onUpdateElementAnimation?.(activeAnimType, duration, activeDelay, activeEasing);
    setTimeout(() => {
      onPreviewAnimation?.();
    }, 50);
  };

  const handleUpdateDelay = (delay: string) => {
    onUpdateElementAnimation?.(activeAnimType, activeDuration, delay, activeEasing);
    setTimeout(() => {
      onPreviewAnimation?.();
    }, 50);
  };

  const handleUpdateEasing = (easing: string) => {
    onUpdateElementAnimation?.(activeAnimType, activeDuration, activeDelay, easing);
    setTimeout(() => {
      onPreviewAnimation?.();
    }, 50);
  };

  // Handle local image file upload
  const handleImageUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      if (dataUrl) {
        if (isImage) {
          onUpdateElementAttribute('src', dataUrl);
        } else {
          onUpdateElementStyle('backgroundImage', `url("${dataUrl}")`);
          onUpdateElementStyle('backgroundSize', 'cover');
          onUpdateElementStyle('backgroundPosition', 'center');
        }
      }
    };
    reader.readAsDataURL(file);
  };

  if (!isOpen) return null;

  return (
    <aside className="w-full md:w-72 lg:w-80 h-[52vh] sm:h-[48vh] md:h-full bg-[var(--cv-color-surface)] border-t md:border-t-0 md:border-l border-[var(--cv-color-border)] flex flex-col shrink-0 select-none overflow-hidden z-20 shadow-[var(--cv-shadow-card)] text-[var(--cv-color-text)] animate-in slide-in-from-bottom md:slide-in-from-right duration-200 order-2 md:order-3">
      {/* Mobile Drag Handle (Click to close/collapse and expand slide) */}
      <div
        className="pt-2 pb-1 md:hidden flex justify-center cursor-pointer hover:bg-[var(--cv-color-surface-subtle)] transition"
        onClick={onClose}
        title="Toque para recolher painel e ver slide completo"
      >
        <div className="w-12 h-1.5 bg-[var(--cv-color-border-strong)] rounded-full" />
      </div>

      {/* Top Tab Switcher & Close button */}
      <div className="flex items-center border-b border-[var(--cv-color-border)] bg-[var(--cv-color-surface-subtle)] p-1.5 gap-1.5 shrink-0">
        <button
          onClick={() => setActiveTab('element')}
          disabled={!hasElement}
          className={`flex-1 py-1.5 text-xs font-semibold rounded-[var(--cv-radius-control)] flex items-center justify-center gap-1.5 transition ${
            currentTab === 'element'
              ? 'bg-[var(--cv-color-surface)] text-[var(--cv-color-accent-text)] shadow-xs border border-[var(--cv-color-border)]'
              : hasElement
              ? 'text-[var(--cv-color-text-muted)] hover:text-[var(--cv-color-text)]'
              : 'text-[var(--cv-color-text-muted)] opacity-40 cursor-not-allowed'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>Elemento</span>
          {hasElement && (
            <span className="text-[10px] font-mono font-bold bg-[var(--cv-color-accent-soft)] text-[var(--cv-color-accent-text)] px-1.5 py-0.2 rounded-full">
              {selectedElement?.tagName.toLowerCase()}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('slide')}
          className={`flex-1 py-1.5 text-xs font-semibold rounded-[var(--cv-radius-control)] flex items-center justify-center gap-1.5 transition ${
            currentTab === 'slide'
              ? 'bg-[var(--cv-color-surface)] text-[var(--cv-color-accent-text)] shadow-xs border border-[var(--cv-color-border)]'
              : 'text-[var(--cv-color-text-muted)] hover:text-[var(--cv-color-text)]'
          }`}
        >
          <Layout className="w-3.5 h-3.5" />
          <span>Slide</span>
        </button>

        <button
          onClick={onClose}
          className="p-1.5 rounded-[var(--cv-radius-control)] text-[var(--cv-color-text-muted)] hover:text-[var(--cv-color-text)] hover:bg-[var(--cv-color-surface)] transition shrink-0"
          title="Recolher painel e expandir slide"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5 text-xs text-[var(--cv-color-text)]">
        {/* TAB 1: ELEMENT INSPECTOR */}
        {currentTab === 'element' && !selectedElement && (
          <div className="py-8 px-4 text-center space-y-3">
            <div className="w-12 h-12 rounded-[var(--cv-radius-card)] bg-[var(--cv-color-surface-subtle)] text-[var(--cv-color-accent-text)] flex items-center justify-center mx-auto border border-[var(--cv-color-border)] shadow-xs">
              <MousePointer className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-[var(--cv-color-text)] text-sm">Nenhum elemento selecionado</h3>
              <p className="text-xs text-[var(--cv-color-text-muted)] mt-1 max-w-xs mx-auto leading-relaxed">
                Toque ou clique em qualquer texto, card ou imagem no slide acima para editar cores, tamanhos e efeitos.
              </p>
            </div>
            <button
              onClick={() => setActiveTab('slide')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--cv-radius-control)] text-xs font-semibold bg-[var(--cv-color-accent-soft)] hover:bg-[var(--cv-color-accent)] hover:text-[var(--cv-color-on-accent)] text-[var(--cv-color-accent-text)] border border-[var(--cv-color-accent)]/30 transition"
            >
              <Layout className="w-3.5 h-3.5" />
              <span>Configurar Cores do Slide</span>
            </button>
          </div>
        )}

        {currentTab === 'element' && selectedElement && (
          <>
            {/* Quick Action Buttons for Element */}
            <div className="flex items-center gap-1.5 p-1.5 bg-[var(--cv-color-surface-subtle)] rounded-[var(--cv-radius-control)] border border-[var(--cv-color-border)]">
              {onDuplicateElement && (
                <button
                  onClick={onDuplicateElement}
                  className="flex-1 flex items-center justify-center gap-1 py-1.5 px-2 bg-[var(--cv-color-surface)] hover:bg-[var(--cv-color-surface-subtle)] text-[var(--cv-color-text)] border border-[var(--cv-color-border)] rounded-[var(--cv-radius-control)] font-semibold text-[11px] transition shadow-2xs active:scale-95"
                  title="Duplicar elemento selecionado"
                >
                  <Copy className="w-3.5 h-3.5 text-[var(--cv-color-accent-text)]" />
                  <span>Duplicar</span>
                </button>
              )}

              <button
                onClick={() => {
                  if (selectedElement.element && selectedElement.element.parentElement) {
                    const parent = selectedElement.element.parentElement;
                    const container = document.getElementById(currentSlide.id);
                    if (parent !== container) {
                      const editId = parent.getAttribute('data-edit-id');
                      if (editId) onSelectBreadcrumb(editId);
                    }
                  }
                }}
                className="flex-1 flex items-center justify-center gap-1 py-1.5 px-2 bg-[var(--cv-color-surface)] hover:bg-[var(--cv-color-surface-subtle)] text-[var(--cv-color-text)] border border-[var(--cv-color-border)] rounded-[var(--cv-radius-control)] font-semibold text-[11px] transition shadow-2xs active:scale-95"
                title="Selecionar elemento container pai"
              >
                <Maximize2 className="w-3.5 h-3.5 text-[var(--cv-color-accent)]" />
                <span>Pai</span>
              </button>

              {onDeleteElement && (
                <button
                  onClick={onDeleteElement}
                  className="flex items-center justify-center gap-1 py-1.5 px-2.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 border border-rose-500/30 rounded-[var(--cv-radius-control)] font-semibold text-[11px] transition active:scale-95"
                  title="Remover elemento"
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                  <span>Excluir</span>
                </button>
              )}
            </div>

            {/* Breadcrumb Hierarchy Navigation */}
            {selectedElement.breadcrumbs.length > 0 && (
              <div className="bg-[var(--cv-color-surface-subtle)] p-2.5 rounded-[var(--cv-radius-card)] border border-[var(--cv-color-border)]">
                <span className="text-[10px] uppercase font-bold text-[var(--cv-color-text-muted)] block mb-1">
                  Hierarquia do Elemento (Navegar no Container):
                </span>
                <div className="flex flex-wrap items-center gap-1">
                  {selectedElement.breadcrumbs.map((crumb, idx) => {
                    const isCurrent = idx === selectedElement.breadcrumbs.length - 1;
                    return (
                      <React.Fragment key={crumb.id || idx}>
                        {idx > 0 && <ChevronRight className="w-3 h-3 text-[var(--cv-color-text-subtle)]" />}
                        <button
                          onClick={() => onSelectBreadcrumb(crumb.id)}
                          className={`px-1.5 py-0.5 rounded-[var(--cv-radius-control)] text-[11px] font-mono transition ${
                            isCurrent
                              ? 'bg-[var(--cv-color-accent)] text-[var(--cv-color-on-accent)] font-bold'
                              : 'bg-[var(--cv-color-surface)] text-[var(--cv-color-text)] hover:bg-[var(--cv-color-surface-subtle)] border border-[var(--cv-color-border)]'
                          }`}
                          title={`Selecionar <${crumb.tagName}>`}
                        >
                          {crumb.tagName}
                        </button>
                      </React.Fragment>
                    );
                  })}
                </div>
              </div>
            )}

            {/* SECTION: ELEMENT ACTIONS & COMPONENT INSERTION */}
            <div className="p-3 bg-[var(--cv-color-surface)] rounded-[var(--cv-radius-card)] border border-[var(--cv-color-border)] shadow-xs space-y-2.5">
              <div className="flex items-center justify-between pb-1.5 border-b border-[var(--cv-color-border-subtle)]">
                <span className="text-xs font-bold text-[var(--cv-color-text)] flex items-center gap-1.5">
                  <GripHorizontal className="w-3.5 h-3.5 text-[var(--cv-color-accent)]" />
                  <span>Ações do Elemento</span>
                </span>
                <span className="text-[10px] text-[var(--cv-color-text-muted)] font-medium">
                  {selectedElement.element.children.length > 0
                    ? `${selectedElement.element.children.length} itens aninhados`
                    : 'Elemento simples'}
                </span>
              </div>

              {/* Action buttons: Copiar, Recortar, Colar, Duplicar, Excluir */}
              <div className="grid grid-cols-5 gap-1">
                {onCopyElement && (
                  <button
                    onClick={onCopyElement}
                    className="flex flex-col items-center justify-center p-1.5 bg-[var(--cv-color-surface-subtle)] hover:bg-[var(--cv-color-accent-soft)] hover:text-[var(--cv-color-accent-text)] text-[var(--cv-color-text)] rounded-[var(--cv-radius-control)] border border-[var(--cv-color-border)] transition cursor-pointer text-[10px] font-medium"
                    title="Copiar elemento e todos os filhos (Ctrl+C)"
                  >
                    <Copy className="w-3.5 h-3.5 mb-0.5" />
                    <span>Copiar</span>
                  </button>
                )}

                {onCutElement && (
                  <button
                    onClick={onCutElement}
                    className="flex flex-col items-center justify-center p-1.5 bg-[var(--cv-color-surface-subtle)] hover:bg-amber-500/10 hover:text-amber-500 text-[var(--cv-color-text)] rounded-[var(--cv-radius-control)] border border-[var(--cv-color-border)] transition cursor-pointer text-[10px] font-medium"
                    title="Recortar elemento (Ctrl+X)"
                  >
                    <Scissors className="w-3.5 h-3.5 mb-0.5" />
                    <span>Recortar</span>
                  </button>
                )}

                {onPasteElement && (
                  <button
                    onClick={onPasteElement}
                    disabled={!hasClipboard}
                    className={`flex flex-col items-center justify-center p-1.5 rounded-[var(--cv-radius-control)] border transition cursor-pointer text-[10px] font-medium ${
                      hasClipboard
                        ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30 hover:bg-emerald-500/20 shadow-2xs'
                        : 'bg-[var(--cv-color-surface-subtle)] text-[var(--cv-color-text-muted)] border-[var(--cv-color-border)] opacity-60 cursor-not-allowed'
                    }`}
                    title={hasClipboard ? 'Colar elemento (Ctrl+V)' : 'Área de transferência vazia'}
                  >
                    <ClipboardPaste className="w-3.5 h-3.5 mb-0.5" />
                    <span>Colar</span>
                  </button>
                )}

                {onDuplicateElement && (
                  <button
                    onClick={onDuplicateElement}
                    className="flex flex-col items-center justify-center p-1.5 bg-[var(--cv-color-surface-subtle)] hover:bg-[var(--cv-color-accent-soft)] hover:text-[var(--cv-color-accent-text)] text-[var(--cv-color-text)] rounded-[var(--cv-radius-control)] border border-[var(--cv-color-border)] transition cursor-pointer text-[10px] font-medium"
                    title="Duplicar elemento (Ctrl+D)"
                  >
                    <Copy className="w-3.5 h-3.5 mb-0.5 text-[var(--cv-color-accent-text)]" />
                    <span>Duplicar</span>
                  </button>
                )}

                {onDeleteElement && (
                  <button
                    onClick={onDeleteElement}
                    className="flex flex-col items-center justify-center p-1.5 bg-[var(--cv-color-surface-subtle)] hover:bg-rose-500/10 hover:text-rose-500 text-[var(--cv-color-text)] rounded-[var(--cv-radius-control)] border border-[var(--cv-color-border)] transition cursor-pointer text-[10px] font-medium"
                    title="Excluir elemento selecionado (Delete)"
                  >
                    <Trash2 className="w-3.5 h-3.5 mb-0.5 text-rose-500" />
                    <span>Excluir</span>
                  </button>
                )}
              </div>

              {/* Add New Component Button */}
              {onOpenInsertModal && (
                <button
                  onClick={onOpenInsertModal}
                  className="w-full py-2 px-3 bg-[var(--cv-color-accent)] hover:bg-[var(--cv-color-accent-hover,var(--cv-color-accent))] text-[var(--cv-color-on-accent)] rounded-[var(--cv-radius-control)] text-xs font-bold shadow-sm transition active:scale-98 flex items-center justify-center gap-2 cursor-pointer"
                  title="Inserir um novo componente (KPI, gráfico, tabela, comparativo)"
                >
                  <Plus className="w-4 h-4" />
                  <span>Adicionar Novo Componente</span>
                </button>
              )}
            </div>

            {/* SECTION: RESPONSIVE GRID & LAYOUT DIRECT CONTROLS */}
            <div className="p-3 bg-[var(--cv-color-surface)] rounded-[var(--cv-radius-card)] border border-[var(--cv-color-border)] shadow-xs space-y-3">
              <div className="flex items-center justify-between font-bold text-[var(--cv-color-text)] border-b border-[var(--cv-color-border-subtle)] pb-1.5">
                <div className="flex items-center gap-1.5 text-[var(--cv-color-text)]">
                  <LayoutGrid className="w-4 h-4 text-[var(--cv-color-accent)]" />
                  <span>Grade & Layout Responsivo</span>
                </div>
                <div className="flex items-center gap-1">
                  <Badge tone="accent" className="font-mono text-[10px]">
                    {selectedElement.layoutInfo?.approxCols || 12}/12 Colunas
                  </Badge>
                  <span
                    className="text-[10px] font-bold bg-rose-500/10 text-rose-500 border border-rose-500/30 px-1.5 py-0.5 rounded-[var(--cv-radius-control)] flex items-center gap-0.5"
                    title="Guias inteligentes e alinhamento magnético ativos no canvas"
                  >
                    <Magnet className="w-2.5 h-2.5" />
                    <span>Snap</span>
                  </span>
                </div>
              </div>

              {/* 1. Interactive 12-Column Occupation Bar */}
              <div>
                <div className="flex items-center justify-between mb-1.5 text-[11px]">
                  <span className="font-semibold text-[var(--cv-color-text-muted)] flex items-center gap-1">
                    <Columns className="w-3.5 h-3.5 text-[var(--cv-color-accent)]" />
                    <span>Ocupação na Grade (1 a 12):</span>
                  </span>
                  <span className="font-mono font-bold text-[var(--cv-color-accent-text)] text-[10px]">
                    {Math.round(((selectedElement.layoutInfo?.approxCols || 12) / 12) * 100)}% da largura
                  </span>
                </div>

                {/* Clickable 12-column segments */}
                <div className="grid grid-cols-12 gap-0.5 p-1 bg-[var(--cv-color-surface-subtle)] rounded-[var(--cv-radius-control)] border border-[var(--cv-color-border)] shadow-inner">
                  {Array.from({ length: 12 }).map((_, idx) => {
                    const colNum = idx + 1;
                    const currentSpan = selectedElement.layoutInfo?.approxCols || 12;
                    const isFilled = colNum <= currentSpan;
                    return (
                      <button
                        key={colNum}
                        type="button"
                        onClick={() => onSetGridSpan?.(colNum)}
                        className={`h-7 rounded-xs text-[9px] font-mono font-bold transition flex items-center justify-center cursor-pointer ${
                          isFilled
                            ? 'bg-[var(--cv-color-accent)] text-[var(--cv-color-on-accent)] shadow-2xs hover:opacity-90'
                            : 'bg-[var(--cv-color-surface)] hover:bg-[var(--cv-color-accent-soft)] text-[var(--cv-color-text-muted)]'
                        }`}
                        title={`Definir elemento para ocupar ${colNum} de 12 colunas (${Math.round((colNum / 12) * 100)}%)`}
                      >
                        {colNum}
                      </button>
                    );
                  })}
                </div>

                {/* Quick responsive width presets */}
                <div className="grid grid-cols-4 gap-1 mt-1.5">
                  {[
                    { label: '1/4 (25%)', cols: 3 },
                    { label: '1/3 (33%)', cols: 4 },
                    { label: '1/2 (50%)', cols: 6 },
                    { label: 'Total (100%)', cols: 12 },
                  ].map((preset) => (
                    <button
                      key={preset.cols}
                      onClick={() => onSetGridSpan?.(preset.cols)}
                      className={`py-1 px-1 rounded-[var(--cv-radius-control)] text-[10px] font-semibold border transition cursor-pointer ${
                        selectedElement.layoutInfo?.approxCols === preset.cols
                          ? 'bg-[var(--cv-color-accent)] text-[var(--cv-color-on-accent)] border-[var(--cv-color-accent)] shadow-2xs'
                          : 'bg-[var(--cv-color-surface)] hover:bg-[var(--cv-color-surface-subtle)] text-[var(--cv-color-text)] border-[var(--cv-color-border)]'
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 2. Responsive Dimensions (Width & Height) */}
              <div className="grid grid-cols-2 gap-2 pt-1 border-t border-[var(--cv-color-border-subtle)]">
                <div>
                  <label className="text-[10px] font-bold text-[var(--cv-color-text-muted)] uppercase tracking-wider block mb-1">
                    Largura (Width)
                  </label>
                  <select
                    className="w-full text-xs p-1.5 rounded-[var(--cv-radius-control)] border border-[var(--cv-color-border)] focus:border-[var(--cv-color-accent)] outline-none bg-[var(--cv-color-surface)] text-[var(--cv-color-text)] font-medium cursor-pointer"
                    value={selectedElement.element.style.width || ''}
                    onChange={(e) => {
                      onUpdateElementStyle('width', e.target.value);
                      onUpdateElementStyle('maxWidth', '100%');
                      onUpdateElementStyle('boxSizing', 'border-box');
                    }}
                  >
                    <option value="">Automático</option>
                    <option value="25%">25% (1/4)</option>
                    <option value="33.33%">33.3% (1/3)</option>
                    <option value="50%">50% (1/2)</option>
                    <option value="66.66%">66.7% (2/3)</option>
                    <option value="75%">75% (3/4)</option>
                    <option value="100%">100% (Total)</option>
                    <option value="180px">Fixo 180px</option>
                    <option value="280px">Fixo 280px</option>
                    <option value="380px">Fixo 380px</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-[var(--cv-color-text-muted)] uppercase tracking-wider block mb-1">
                    Altura (Height)
                  </label>
                  <select
                    className="w-full text-xs p-1.5 rounded-[var(--cv-radius-control)] border border-[var(--cv-color-border)] focus:border-[var(--cv-color-accent)] outline-none bg-[var(--cv-color-surface)] text-[var(--cv-color-text)] font-medium cursor-pointer"
                    value={selectedElement.element.style.height || ''}
                    onChange={(e) => {
                      if (e.target.value === 'auto') {
                        onUpdateElementStyle('height', 'auto');
                      } else {
                        onUpdateElementStyle('height', e.target.value);
                        onUpdateElementStyle('boxSizing', 'border-box');
                      }
                    }}
                  >
                    <option value="">Automático (Auto)</option>
                    <option value="80px">Baixo (80px)</option>
                    <option value="140px">Médio (140px)</option>
                    <option value="200px">Padrão (200px)</option>
                    <option value="280px">Alto (280px)</option>
                    <option value="360px">Destaque (360px)</option>
                    <option value="100%">Ocupar 100%</option>
                  </select>
                </div>
              </div>

              {/* 3. Reordering & Position in Slide */}
              <div className="pt-1 border-t border-[var(--cv-color-border-subtle)]">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-bold text-[var(--cv-color-text-muted)] uppercase tracking-wider">
                    Posicionamento no Slide:
                  </span>
                  <span className="text-[10px] text-[var(--cv-color-text-subtle)]">Reordenar</span>
                </div>
                <div className="grid grid-cols-4 gap-1">
                  <button
                    onClick={() => onReorderElement?.('first')}
                    className="flex flex-col items-center justify-center py-1.5 px-1 bg-[var(--cv-color-surface-subtle)] hover:bg-[var(--cv-color-surface)] text-[var(--cv-color-text)] border border-[var(--cv-color-border)] rounded-[var(--cv-radius-control)] text-[10px] font-medium transition active:scale-95 shadow-2xs cursor-pointer"
                    title="Mover para o primeiro lugar da grade / container"
                  >
                    <ChevronsLeft className="w-3.5 h-3.5 text-[var(--cv-color-accent-text)] mb-0.5" />
                    <span>Primeiro</span>
                  </button>

                  <button
                    onClick={() => onReorderElement?.('prev')}
                    className="flex flex-col items-center justify-center py-1.5 px-1 bg-[var(--cv-color-surface-subtle)] hover:bg-[var(--cv-color-surface)] text-[var(--cv-color-text)] border border-[var(--cv-color-border)] rounded-[var(--cv-radius-control)] text-[10px] font-medium transition active:scale-95 shadow-2xs cursor-pointer"
                    title="Mover uma posição para trás / esquerda"
                  >
                    <ArrowLeft className="w-3.5 h-3.5 text-[var(--cv-color-accent-text)] mb-0.5" />
                    <span>← Trás</span>
                  </button>

                  <button
                    onClick={() => onReorderElement?.('next')}
                    className="flex flex-col items-center justify-center py-1.5 px-1 bg-[var(--cv-color-surface-subtle)] hover:bg-[var(--cv-color-surface)] text-[var(--cv-color-text)] border border-[var(--cv-color-border)] rounded-[var(--cv-radius-control)] text-[10px] font-medium transition active:scale-95 shadow-2xs cursor-pointer"
                    title="Mover uma posição para frente / direita"
                  >
                    <ArrowRight className="w-3.5 h-3.5 text-[var(--cv-color-accent-text)] mb-0.5" />
                    <span>Frente →</span>
                  </button>

                  <button
                    onClick={() => onReorderElement?.('last')}
                    className="flex flex-col items-center justify-center py-1.5 px-1 bg-[var(--cv-color-surface-subtle)] hover:bg-[var(--cv-color-surface)] text-[var(--cv-color-text)] border border-[var(--cv-color-border)] rounded-[var(--cv-radius-control)] text-[10px] font-medium transition active:scale-95 shadow-2xs cursor-pointer"
                    title="Mover para o último lugar da grade / container"
                  >
                    <ChevronsRight className="w-3.5 h-3.5 text-[var(--cv-color-accent-text)] mb-0.5" />
                    <span>Último</span>
                  </button>
                </div>
              </div>

              {/* 4. Transform Parent Container into Responsive Grid */}
              <div className="pt-1 border-t border-[var(--cv-color-border-subtle)]">
                <span className="text-[10px] font-bold text-[var(--cv-color-text-muted)] uppercase tracking-wider block mb-1">
                  Converter Container em Grade:
                </span>
                <div className="grid grid-cols-3 gap-1">
                  <button
                    onClick={() => onConvertParentToGrid?.('grid-2')}
                    className="py-1 px-1.5 bg-[var(--cv-color-surface-subtle)] hover:bg-[var(--cv-color-accent-soft)] hover:text-[var(--cv-color-accent-text)] text-[var(--cv-color-text)] border border-[var(--cv-color-border)] rounded-[var(--cv-radius-control)] text-[10px] font-medium transition text-center shadow-2xs cursor-pointer"
                    title="Transformar container em grade de 2 colunas responsivas"
                  >
                    Grade 2 Cols
                  </button>
                  <button
                    onClick={() => onConvertParentToGrid?.('grid-3')}
                    className="py-1 px-1.5 bg-[var(--cv-color-surface-subtle)] hover:bg-[var(--cv-color-accent-soft)] hover:text-[var(--cv-color-accent-text)] text-[var(--cv-color-text)] border border-[var(--cv-color-border)] rounded-[var(--cv-radius-control)] text-[10px] font-medium transition text-center shadow-2xs cursor-pointer"
                    title="Transformar container em grade de 3 colunas responsivas"
                  >
                    Grade 3 Cols
                  </button>
                  <button
                    onClick={() => onConvertParentToGrid?.('grid-4')}
                    className="py-1 px-1.5 bg-[var(--cv-color-surface-subtle)] hover:bg-[var(--cv-color-accent-soft)] hover:text-[var(--cv-color-accent-text)] text-[var(--cv-color-text)] border border-[var(--cv-color-border)] rounded-[var(--cv-radius-control)] text-[10px] font-medium transition text-center shadow-2xs cursor-pointer"
                    title="Transformar container em grade de 4 colunas (KPIs)"
                  >
                    Grade 4 Cols
                  </button>
                  <button
                    onClick={() => onConvertParentToGrid?.('split-60-40')}
                    className="py-1 px-1.5 bg-[var(--cv-color-surface-subtle)] hover:bg-[var(--cv-color-accent-soft)] hover:text-[var(--cv-color-accent-text)] text-[var(--cv-color-text)] border border-[var(--cv-color-border)] rounded-[var(--cv-radius-control)] text-[10px] font-medium transition text-center shadow-2xs cursor-pointer"
                    title="Layout Split View 60% / 40%"
                  >
                    Split 60/40
                  </button>
                  <button
                    onClick={() => onConvertParentToGrid?.('split-50-50')}
                    className="py-1 px-1.5 bg-[var(--cv-color-surface-subtle)] hover:bg-[var(--cv-color-accent-soft)] hover:text-[var(--cv-color-accent-text)] text-[var(--cv-color-text)] border border-[var(--cv-color-border)] rounded-[var(--cv-radius-control)] text-[10px] font-medium transition text-center shadow-2xs cursor-pointer"
                    title="Layout Split View 50% / 50%"
                  >
                    Split 50/50
                  </button>
                  <button
                    onClick={() => onConvertParentToGrid?.('flex-row')}
                    className="py-1 px-1.5 bg-[var(--cv-color-surface-subtle)] hover:bg-[var(--cv-color-accent-soft)] hover:text-[var(--cv-color-accent-text)] text-[var(--cv-color-text)] border border-[var(--cv-color-border)] rounded-[var(--cv-radius-control)] text-[10px] font-medium transition text-center shadow-2xs cursor-pointer"
                    title="Layout Flex Linha Livre"
                  >
                    Flex Linha
                  </button>
                </div>
              </div>
            </div>

            {/* Chart Section (If Canvas or Chart container) */}
            {Boolean(
              selectedElement.tagName === 'CANVAS' ||
                selectedElement.element?.querySelector('canvas') ||
                selectedElement.element?.classList.contains('chart-card') ||
                selectedElement.element?.classList.contains('chart-container')
            ) && (
              <div className="p-3.5 bg-gradient-to-br from-indigo-50/70 to-blue-50/70 rounded-2xl border border-indigo-200/80 space-y-3">
                <div className="flex items-center justify-between font-bold text-indigo-950 pb-1 border-b border-indigo-100">
                  <div className="flex items-center gap-1.5">
                    <BarChart2 className="w-4 h-4 text-indigo-600" />
                    <span>Configuração do Gráfico</span>
                  </div>
                  <span className="text-[10px] font-mono uppercase bg-indigo-200/70 text-indigo-800 px-2 py-0.5 rounded-full font-bold">
                    Chart.js
                  </span>
                </div>

                <p className="text-xs text-indigo-900/80 leading-relaxed">
                  Edite os pontos de dados, rótulos, cores, eixos e formato do gráfico com atualização visual imediata.
                </p>

                <button
                  onClick={() => {
                    const cv =
                      selectedElement.tagName === 'CANVAS'
                        ? (selectedElement.element as HTMLCanvasElement)
                        : (selectedElement.element?.querySelector('canvas') as HTMLCanvasElement);
                    if (cv && onOpenChartEditor) {
                      onOpenChartEditor(cv);
                    }
                  }}
                  className="w-full py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-sm transition active:scale-98 cursor-pointer"
                >
                  <Sliders className="w-3.5 h-3.5" />
                  <span>Personalizar Gráfico</span>
                </button>
              </div>
            )}

            {/* Typography Section (If text or contains text) */}
            <div className="space-y-3">
              <div className="flex items-center justify-between font-bold text-[var(--cv-color-text)] border-b border-[var(--cv-color-border-subtle)] pb-1">
                <div className="flex items-center gap-1.5">
                  <Type className="w-3.5 h-3.5 text-[var(--cv-color-accent)]" />
                  <span>Tipografia & Texto</span>
                </div>
                {selectedElement.isTextElement && (
                  <button
                    onClick={() => onOpenAiAssistant('rewrite')}
                    className="flex items-center gap-1 text-[11px] text-[var(--cv-color-accent-text)] hover:underline font-semibold"
                    title="Pedir sugestão de texto com IA"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>IA Reescrever</span>
                  </button>
                )}
              </div>

              {/* Text content direct edit input */}
              {selectedElement.isTextElement && (
                <div>
                  <label className="text-[11px] text-[var(--cv-color-text-muted)] font-medium block mb-1">
                    Conteúdo do Texto
                  </label>
                  <textarea
                    rows={2}
                    className="w-full text-xs p-2 rounded-[var(--cv-radius-control)] border border-[var(--cv-color-border)] focus:border-[var(--cv-color-accent)] focus:ring-1 focus:ring-[var(--cv-color-accent)] outline-none resize-y bg-[var(--cv-color-surface)] text-[var(--cv-color-text)]"
                    value={selectedElement.textContent}
                    onChange={(e) => onUpdateElementText(e.target.value)}
                  />
                </div>
              )}

              {/* Font Family */}
              <div>
                <label className="text-[11px] text-[var(--cv-color-text-muted)] font-medium block mb-1">
                  Fonte
                </label>
                <select
                  className="w-full text-xs p-1.5 rounded-[var(--cv-radius-control)] border border-[var(--cv-color-border)] focus:border-[var(--cv-color-accent)] outline-none bg-[var(--cv-color-surface)] text-[var(--cv-color-text)] font-medium cursor-pointer"
                  value={selectedElement.computedStyle.fontFamily}
                  onChange={(e) => onUpdateElementStyle('fontFamily', e.target.value)}
                >
                  {FONT_OPTIONS.map((f) => (
                    <option key={f.label} value={f.value}>
                      {f.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Font Size & Weight */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] text-[var(--cv-color-text-muted)] font-medium block mb-1">
                    Tamanho (px)
                  </label>
                  <select
                    className="w-full text-xs p-1.5 rounded-[var(--cv-radius-control)] border border-[var(--cv-color-border)] focus:border-[var(--cv-color-accent)] outline-none bg-[var(--cv-color-surface)] text-[var(--cv-color-text)] cursor-pointer"
                    onChange={(e) => onUpdateElementStyle('fontSize', e.target.value)}
                    defaultValue=""
                  >
                    <option value="" disabled>Escolha...</option>
                    <option value="12px">Pequeno (12px)</option>
                    <option value="14px">Normal (14px)</option>
                    <option value="16px">Médio (16px)</option>
                    <option value="20px">Título Pequeno (20px)</option>
                    <option value="28px">Título Grande (28px)</option>
                    <option value="36px">Destaque (36px)</option>
                    <option value="48px">Gigante (48px)</option>
                    <option value="60px">Impacto (60px)</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] text-[var(--cv-color-text-muted)] font-medium block mb-1">
                    Peso
                  </label>
                  <select
                    className="w-full text-xs p-1.5 rounded-[var(--cv-radius-control)] border border-[var(--cv-color-border)] focus:border-[var(--cv-color-accent)] outline-none bg-[var(--cv-color-surface)] text-[var(--cv-color-text)] cursor-pointer"
                    onChange={(e) => onUpdateElementStyle('fontWeight', e.target.value)}
                    defaultValue=""
                  >
                    <option value="" disabled>Escolha...</option>
                    <option value="300">Leve (300)</option>
                    <option value="400">Normal (400)</option>
                    <option value="600">Seminegrito (600)</option>
                    <option value="700">Negrito (700)</option>
                    <option value="800">Extra Negrito (800)</option>
                  </select>
                </div>
              </div>

              {/* Text Align & Styles */}
              <div className="flex items-center justify-between bg-[var(--cv-color-surface-subtle)] p-1.5 rounded-[var(--cv-radius-control)] border border-[var(--cv-color-border)]">
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => onUpdateElementStyle('textAlign', 'left')}
                    className="p-1.5 hover:bg-[var(--cv-color-surface)] rounded-[var(--cv-radius-control)] text-[var(--cv-color-text-muted)] hover:text-[var(--cv-color-text)] transition"
                    title="Alinhar à Esquerda"
                  >
                    <AlignLeft className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => onUpdateElementStyle('textAlign', 'center')}
                    className="p-1.5 hover:bg-[var(--cv-color-surface)] rounded-[var(--cv-radius-control)] text-[var(--cv-color-text-muted)] hover:text-[var(--cv-color-text)] transition"
                    title="Centralizar"
                  >
                    <AlignCenter className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => onUpdateElementStyle('textAlign', 'right')}
                    className="p-1.5 hover:bg-[var(--cv-color-surface)] rounded-[var(--cv-radius-control)] text-[var(--cv-color-text-muted)] hover:text-[var(--cv-color-text)] transition"
                    title="Alinhar à Direita"
                  >
                    <AlignRight className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => onUpdateElementStyle('textAlign', 'justify')}
                    className="p-1.5 hover:bg-[var(--cv-color-surface)] rounded-[var(--cv-radius-control)] text-[var(--cv-color-text-muted)] hover:text-[var(--cv-color-text)] transition"
                    title="Justificado"
                  >
                    <AlignJustify className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="h-4 w-px bg-[var(--cv-color-border)] mx-1" />

                <div className="flex items-center gap-1">
                  <button
                    onClick={() =>
                      onUpdateElementStyle(
                        'fontWeight',
                        selectedElement.computedStyle.fontWeight === 'bold' ||
                          parseInt(selectedElement.computedStyle.fontWeight, 10) >= 700
                          ? 'normal'
                          : 'bold'
                      )
                    }
                    className="p-1.5 hover:bg-[var(--cv-color-surface)] rounded-[var(--cv-radius-control)] text-[var(--cv-color-text-muted)] hover:text-[var(--cv-color-text)] font-bold transition"
                    title="Negrito"
                  >
                    <Bold className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() =>
                      onUpdateElementStyle(
                        'fontStyle',
                        selectedElement.element.style.fontStyle === 'italic' ? 'normal' : 'italic'
                      )
                    }
                    className="p-1.5 hover:bg-[var(--cv-color-surface)] rounded-[var(--cv-radius-control)] text-[var(--cv-color-text-muted)] hover:text-[var(--cv-color-text)] italic transition"
                    title="Itálico"
                  >
                    <Italic className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() =>
                      onUpdateElementStyle(
                        'textDecoration',
                        selectedElement.element.style.textDecoration === 'underline' ? 'none' : 'underline'
                      )
                    }
                    className="p-1.5 hover:bg-[var(--cv-color-surface)] rounded-[var(--cv-radius-control)] text-[var(--cv-color-text-muted)] hover:text-[var(--cv-color-text)] underline transition"
                    title="Sublinhado"
                  >
                    <Underline className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Text Color Swatches & Picker */}
              <div>
                <label className="text-[11px] text-[var(--cv-color-text-muted)] font-medium block mb-1.5">
                  Cor do Texto
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    className="w-7 h-7 rounded-[var(--cv-radius-control)] border border-[var(--cv-color-border)] cursor-pointer p-0 bg-transparent"
                    onChange={(e) => onUpdateElementStyle('color', e.target.value)}
                  />
                  <div className="flex flex-wrap gap-1 flex-1">
                    {COLOR_SWATCHES.slice(0, 8).map((color) => (
                      <button
                        key={color}
                        onClick={() => onUpdateElementStyle('color', color)}
                        style={{ backgroundColor: color }}
                        className="w-5 h-5 rounded-[var(--cv-radius-control)] border border-[var(--cv-color-border)] shadow-xs hover:scale-110 transition"
                        title={color}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Colors, Box & Background Section */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-1.5 font-bold text-[var(--cv-color-text)] border-b border-[var(--cv-color-border-subtle)] pb-1">
                <Palette className="w-3.5 h-3.5 text-[var(--cv-color-accent)]" />
                <span>Cores & Fundo</span>
              </div>

              {/* Background Color */}
              <div>
                <label className="text-[11px] text-[var(--cv-color-text-muted)] font-medium block mb-1.5">
                  Cor de Fundo do Elemento
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    className="w-7 h-7 rounded-[var(--cv-radius-control)] border border-[var(--cv-color-border)] cursor-pointer p-0 bg-transparent"
                    onChange={(e) => onUpdateElementStyle('backgroundColor', e.target.value)}
                  />
                  <div className="flex flex-wrap gap-1 flex-1">
                    {COLOR_SWATCHES.map((color) => (
                      <button
                        key={color}
                        onClick={() => onUpdateElementStyle('backgroundColor', color)}
                        style={{ backgroundColor: color === 'transparent' ? '#ffffff' : color }}
                        className="w-5 h-5 rounded-[var(--cv-radius-control)] border border-[var(--cv-color-border)] shadow-xs hover:scale-110 transition relative"
                        title={color}
                      >
                        {color === 'transparent' && (
                          <span className="text-[9px] text-red-500 font-bold block text-center">⊘</span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Border & Corner Radius */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] text-[var(--cv-color-text-muted)] font-medium block mb-1">
                    Borda
                  </label>
                  <select
                    className="w-full text-xs p-1.5 rounded-[var(--cv-radius-control)] border border-[var(--cv-color-border)] focus:border-[var(--cv-color-accent)] outline-none bg-[var(--cv-color-surface)] text-[var(--cv-color-text)] cursor-pointer"
                    onChange={(e) => {
                      if (e.target.value === 'none') {
                        onUpdateElementStyle('border', 'none');
                      } else {
                        onUpdateElementStyle('border', e.target.value);
                      }
                    }}
                    defaultValue=""
                  >
                    <option value="" disabled>Escolha borda...</option>
                    <option value="none">Sem Borda</option>
                    <option value="1px solid var(--cv-color-border)">Fina Convergência (1px)</option>
                    <option value="2px solid var(--cv-color-accent)">Índigo Destaque (2px)</option>
                    <option value="1px solid var(--cv-color-text-muted)">Escura (1px)</option>
                    <option value="2px dashed var(--cv-color-border)">Tracejada (2px)</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] text-[var(--cv-color-text-muted)] font-medium block mb-1">
                    Cantos (Raio)
                  </label>
                  <select
                    className="w-full text-xs p-1.5 rounded-[var(--cv-radius-control)] border border-[var(--cv-color-border)] focus:border-[var(--cv-color-accent)] outline-none bg-[var(--cv-color-surface)] text-[var(--cv-color-text)] cursor-pointer"
                    onChange={(e) => onUpdateElementStyle('borderRadius', e.target.value)}
                    defaultValue=""
                  >
                    <option value="" disabled>Escolha canto...</option>
                    <option value="0px">Reto (0px)</option>
                    <option value="var(--cv-radius-control)">Controle (8px)</option>
                    <option value="var(--cv-radius-card)">Card (12px)</option>
                    <option value="var(--cv-radius-panel)">Painel (18px)</option>
                    <option value="9999px">Pílula Circular</option>
                  </select>
                </div>
              </div>

              {/* Shadow Preset */}
              <div>
                <label className="text-[11px] text-[var(--cv-color-text-muted)] font-medium block mb-1">
                  Sombra (Elevação)
                </label>
                <select
                  className="w-full text-xs p-1.5 rounded-[var(--cv-radius-control)] border border-[var(--cv-color-border)] focus:border-[var(--cv-color-accent)] outline-none bg-[var(--cv-color-surface)] text-[var(--cv-color-text)] cursor-pointer"
                  onChange={(e) => onUpdateElementStyle('boxShadow', e.target.value)}
                  defaultValue=""
                >
                  <option value="" disabled>Escolha sombra...</option>
                  <option value="none">Nenhuma</option>
                  <option value="var(--cv-shadow-card)">Suave Convergência (Card)</option>
                  <option value="var(--cv-shadow-popover)">Média Convergência (Popover)</option>
                  <option value="0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05)">Destaque</option>
                  <option value="0 20px 25px -5px rgba(0,0,0,0.25)">Flutuante Premium</option>
                </select>
              </div>

              {/* Padding */}
              <div>
                <label className="text-[11px] text-[var(--cv-color-text-muted)] font-medium block mb-1">
                  Espaçamento Interno (Padding)
                </label>
                <select
                  className="w-full text-xs p-1.5 rounded-[var(--cv-radius-control)] border border-[var(--cv-color-border)] focus:border-[var(--cv-color-accent)] outline-none bg-[var(--cv-color-surface)] text-[var(--cv-color-text)] cursor-pointer"
                  onChange={(e) => onUpdateElementStyle('padding', e.target.value)}
                  defaultValue=""
                >
                  <option value="" disabled>Escolha espaçamento...</option>
                  <option value="0px">Zero (0px)</option>
                  <option value="8px">Compacto (8px)</option>
                  <option value="16px">Padrão (16px)</option>
                  <option value="24px">Confortável (24px)</option>
                  <option value="36px">Amplo (36px)</option>
                </select>
              </div>
            </div>

            {/* Entrance Animations Section */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between font-bold text-[var(--cv-color-text)] border-b border-[var(--cv-color-border-subtle)] pb-1">
                <div className="flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[var(--cv-color-accent)]" />
                  <span>Animações de Entrada</span>
                </div>
                {activeAnimType && activeAnimType !== 'none' ? (
                  <div className="flex items-center gap-1">
                    <Badge tone="accent" className="text-[10px]">
                      {ANIMATION_PRESETS.find((p) => p.id === activeAnimType)?.label || activeAnimType}
                    </Badge>
                    {onPreviewAnimation && (
                      <button
                        onClick={onPreviewAnimation}
                        className="p-1 text-[var(--cv-color-accent-text)] hover:bg-[var(--cv-color-accent-soft)] rounded-[var(--cv-radius-control)] transition flex items-center"
                        title="Testar animação no slide"
                      >
                        <Play className="w-3 h-3 fill-current" />
                      </button>
                    )}
                  </div>
                ) : (
                  <span className="text-[10px] text-[var(--cv-color-text-subtle)] font-normal">Nenhuma</span>
                )}
              </div>

              {/* Animation Preset Buttons */}
              <div className="grid grid-cols-3 gap-1.5">
                {ANIMATION_PRESETS.map((preset) => {
                  const Icon = preset.icon;
                  const isSelected = activeAnimType === preset.id || (!activeAnimType && preset.id === 'none');
                  return (
                    <button
                      key={preset.id}
                      onClick={() => handleSelectAnimation(preset.id)}
                      className={`flex flex-col items-center justify-center p-2 rounded-[var(--cv-radius-control)] border text-center transition group relative ${
                        isSelected
                          ? 'bg-[var(--cv-color-accent-soft)] border-[var(--cv-color-accent)] text-[var(--cv-color-accent-text)] shadow-2xs font-semibold'
                          : 'bg-[var(--cv-color-surface)] hover:bg-[var(--cv-color-surface-subtle)] border-[var(--cv-color-border)] text-[var(--cv-color-text)]'
                      }`}
                      title={`${preset.label}: ${preset.desc}`}
                    >
                      <Icon className={`w-4 h-4 mb-1 transition-transform group-hover:scale-110 ${
                        isSelected ? 'text-[var(--cv-color-accent)]' : 'text-[var(--cv-color-text-muted)]'
                      }`} />
                      <span className="text-[11px] leading-tight block truncate w-full">
                        {preset.label}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Timing Controls (Duration, Delay, Easing) - only when animation is selected */}
              {activeAnimType && activeAnimType !== 'none' && (
                <div className="bg-[var(--cv-color-surface-subtle)] p-2.5 rounded-[var(--cv-radius-card)] border border-[var(--cv-color-border)] space-y-2.5 animate-in fade-in duration-150">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] font-bold text-[var(--cv-color-text-muted)] uppercase tracking-wider block mb-1 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-[var(--cv-color-text-subtle)]" />
                        <span>Duração</span>
                      </label>
                      <select
                        className="w-full text-xs p-1.5 rounded-[var(--cv-radius-control)] border border-[var(--cv-color-border)] focus:border-[var(--cv-color-accent)] outline-none bg-[var(--cv-color-surface)] text-[var(--cv-color-text)] font-medium cursor-pointer"
                        value={activeDuration}
                        onChange={(e) => handleUpdateDuration(e.target.value)}
                      >
                        {DURATION_OPTIONS.map((d) => (
                          <option key={d.value} value={d.value}>
                            {d.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-[var(--cv-color-text-muted)] uppercase tracking-wider block mb-1 flex items-center gap-1">
                        <Timer className="w-3 h-3 text-[var(--cv-color-text-subtle)]" />
                        <span>Atraso (Delay)</span>
                      </label>
                      <select
                        className="w-full text-xs p-1.5 rounded-[var(--cv-radius-control)] border border-[var(--cv-color-border)] focus:border-[var(--cv-color-accent)] outline-none bg-[var(--cv-color-surface)] text-[var(--cv-color-text)] font-medium cursor-pointer"
                        value={activeDelay}
                        onChange={(e) => handleUpdateDelay(e.target.value)}
                      >
                        {DELAY_OPTIONS.map((d) => (
                          <option key={d.value} value={d.value}>
                            {d.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-[var(--cv-color-text-muted)] uppercase tracking-wider block mb-1">
                      Curva de Movimento
                    </label>
                    <select
                      className="w-full text-xs p-1.5 rounded-[var(--cv-radius-control)] border border-[var(--cv-color-border)] focus:border-[var(--cv-color-accent)] outline-none bg-[var(--cv-color-surface)] text-[var(--cv-color-text)] font-medium cursor-pointer"
                      value={activeEasing}
                      onChange={(e) => handleUpdateEasing(e.target.value)}
                    >
                      {EASING_OPTIONS.map((eOpt) => (
                        <option key={eOpt.value} value={eOpt.value}>
                          {eOpt.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Actions: Replay preview & remove */}
                  <div className="flex items-center gap-2 pt-1 border-t border-[var(--cv-color-border-subtle)]">
                    <button
                      onClick={() => onPreviewAnimation?.()}
                      className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 bg-[var(--cv-color-accent)] hover:opacity-90 text-[var(--cv-color-on-accent)] rounded-[var(--cv-radius-control)] text-xs font-semibold shadow-xs transition active:scale-95 cursor-pointer"
                      title="Executar pré-visualização no slide agora"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Testar Animação</span>
                    </button>

                    <button
                      onClick={() => handleSelectAnimation('none')}
                      className="py-1.5 px-2.5 bg-[var(--cv-color-surface)] hover:bg-rose-500/10 text-[var(--cv-color-text-muted)] hover:text-rose-500 border border-[var(--cv-color-border)] rounded-[var(--cv-radius-control)] text-xs font-medium transition cursor-pointer"
                      title="Desativar animação do elemento"
                    >
                      Remover
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Image Tools (If <img> or can insert image) */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between font-bold text-[var(--cv-color-text)] border-b border-[var(--cv-color-border-subtle)] pb-1">
                <div className="flex items-center gap-1.5">
                  <ImageIcon className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Imagens & Mídia</span>
                </div>
                <button
                  onClick={() => setShowImagePicker(!showImagePicker)}
                  className="text-[11px] text-[var(--cv-color-accent-text)] font-semibold hover:underline cursor-pointer"
                >
                  {showImagePicker ? 'Fechar' : 'Galeria'}
                </button>
              </div>

              {/* Upload image from computer */}
              <div className="flex items-center gap-2">
                <label className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 bg-[var(--cv-color-surface-subtle)] hover:bg-[var(--cv-color-accent-soft)] hover:text-[var(--cv-color-accent-text)] text-[var(--cv-color-text)] border border-[var(--cv-color-border)] rounded-[var(--cv-radius-control)] cursor-pointer transition text-xs font-semibold">
                  <Upload className="w-3.5 h-3.5" />
                  <span>Subir Imagem</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        handleImageUpload(e.target.files[0]);
                      }
                    }}
                  />
                </label>
              </div>

              {/* Curated Unsplash Gallery */}
              {showImagePicker && (
                <div className="space-y-2 bg-[var(--cv-color-surface-subtle)] p-2.5 rounded-[var(--cv-radius-card)] border border-[var(--cv-color-border)]">
                  <span className="text-[10px] font-bold text-[var(--cv-color-text-muted)] uppercase block">
                    Fotos Executivas Curadas:
                  </span>
                  <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                    {CURATED_IMAGES.map((img, i) => (
                      <div
                        key={i}
                        onClick={() => {
                          if (isImage) {
                            onUpdateElementAttribute('src', img.url);
                          } else {
                            onUpdateElementStyle('backgroundImage', `url("${img.url}")`);
                            onUpdateElementStyle('backgroundSize', 'cover');
                            onUpdateElementStyle('backgroundPosition', 'center');
                          }
                        }}
                        className="group relative rounded-[var(--cv-radius-control)] overflow-hidden cursor-pointer aspect-video border border-[var(--cv-color-border)] hover:border-[var(--cv-color-accent)] shadow-xs"
                      >
                        <img src={img.url} alt={img.label} className="w-full h-full object-cover group-hover:scale-105 transition" />
                        <span className="absolute bottom-0 inset-x-0 bg-black/75 text-white text-[9px] px-1 py-0.5 truncate">
                          {img.label}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        {/* TAB 2: SLIDE SETTINGS */}
        {currentTab === 'slide' && (
          <div className="space-y-4">
            <div>
              <span className="text-xs font-bold text-[var(--cv-color-text)] block mb-1">
                Título do Slide
              </span>
              <input
                type="text"
                className="w-full text-xs p-2 rounded-[var(--cv-radius-control)] border border-[var(--cv-color-border)] focus:border-[var(--cv-color-accent)] outline-none bg-[var(--cv-color-surface)] text-[var(--cv-color-text)]"
                value={currentSlide.title}
                onChange={(e) => onUpdateSlideProps({ title: e.target.value })}
                placeholder="Nome do slide para navegação"
              />
            </div>

            {/* Slide Background Color Presets */}
            <div>
              <span className="text-xs font-bold text-[var(--cv-color-text)] block mb-2">
                Temas & Cores do Slide
              </span>
              <div className="space-y-1.5">
                {SLIDE_BACKGROUND_PRESETS.map((preset, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      onUpdateSlideProps({ style: `${preset.style} font-family: "Segoe UI Variable", system-ui, sans-serif;` });
                    }}
                    className="w-full text-left p-2 rounded-[var(--cv-radius-control)] border border-[var(--cv-color-border)] hover:border-[var(--cv-color-accent)] bg-[var(--cv-color-surface)] hover:bg-[var(--cv-color-surface-subtle)] flex items-center justify-between text-xs transition hover:shadow-xs group cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="w-6 h-6 rounded-[var(--cv-radius-control)] border border-[var(--cv-color-border)] shadow-xs"
                        style={cssStringToStyleObject(preset.style)}
                      />
                      <span className="font-semibold text-[var(--cv-color-text)]">{preset.label}</span>
                    </div>
                    <span className="text-[var(--cv-color-accent)] opacity-0 group-hover:opacity-100 transition">
                      <Check className="w-3.5 h-3.5" />
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Speaker Notes */}
            <div>
              <span className="text-xs font-bold text-[var(--cv-color-text)] block mb-1">
                Anotações do Apresentador (Notas)
              </span>
              <textarea
                rows={4}
                className="w-full text-xs p-2 rounded-[var(--cv-radius-control)] border border-[var(--cv-color-border)] focus:border-[var(--cv-color-accent)] outline-none resize-y bg-[var(--cv-color-surface)] text-[var(--cv-color-text)]"
                placeholder="Roteiro de fala, números complementares ou observações que auxiliam na hora de apresentar..."
                value={currentSlide.notes || ''}
                onChange={(e) => onUpdateSlideProps({ notes: e.target.value })}
              />
            </div>

            {/* Quick Tips */}
            <div className="p-3 bg-[var(--cv-color-accent-soft)] rounded-[var(--cv-radius-card)] border border-[var(--cv-color-accent)]/20 text-[var(--cv-color-text)] space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-[var(--cv-color-accent-text)] text-xs">
                <HelpCircle className="w-3.5 h-3.5" />
                <span>Dica de Design</span>
              </div>
              <p className="text-[11px] text-[var(--cv-color-text-muted)] leading-relaxed">
                Mantenha no máximo 3 ideias centrais por slide e valorize espaços em branco para maior retenção visual.
              </p>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};
