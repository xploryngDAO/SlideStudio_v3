import React, { useState, useRef, useEffect } from 'react';
import {
  PanelLeft,
  Plus,
  BarChart2,
  Sparkles,
  LayoutTemplate,
  Code,
  Sliders,
  Upload,
  ChevronRight,
  FolderOpen,
  Download,
} from 'lucide-react';
import { SAMPLE_PRESENTATIONS } from '../utils/slideParser';

interface StudioLeftDockProps {
  showNavigator: boolean;
  onToggleNavigator: () => void;
  showInspector: boolean;
  onToggleInspector: () => void;
  onOpenInsertModal: () => void;
  onOpenChartModal: () => void;
  onOpenAiModal: (type: 'generate-slide' | 'generate-chart' | 'analyze') => void;
  onOpenCodeView: () => void;
  onLoadSample: (key: string) => void;
  onFileUpload: (file: File) => void;
  slideCount: number;
  onOpenExportModal?: () => void;
}

export const StudioLeftDock: React.FC<StudioLeftDockProps> = ({
  showNavigator,
  onToggleNavigator,
  showInspector,
  onToggleInspector,
  onOpenInsertModal,
  onOpenChartModal,
  onOpenAiModal,
  onOpenCodeView,
  onLoadSample,
  onFileUpload,
  slideCount,
  onOpenExportModal,
}) => {
  const [showSamplesMenu, setShowSamplesMenu] = useState(false);
  const [showAiMenu, setShowAiMenu] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('[data-left-dock]')) {
        setShowSamplesMenu(false);
        setShowAiMenu(false);
      }
    };
    if (showSamplesMenu || showAiMenu) {
      window.addEventListener('click', handleClickOutside);
      return () => window.removeEventListener('click', handleClickOutside);
    }
  }, [showSamplesMenu, showAiMenu]);

  const handleUploadClick = (accept: string) => {
    if (fileInputRef.current) {
      fileInputRef.current.accept = accept;
      fileInputRef.current.click();
    }
  };

  return (
    <aside
      data-left-dock
      className="hidden md:flex flex-col items-center justify-between w-13 h-full bg-[var(--cv-color-surface)] border-r border-[var(--cv-color-border)] py-3 px-1.5 select-none shrink-0 z-30 transition-colors"
      aria-label="Barra lateral de ferramentas"
    >
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        onChange={(e) => {
          if (e.target.files && e.target.files[0]) {
            onFileUpload(e.target.files[0]);
            e.target.value = '';
          }
        }}
      />

      {/* Top Group: Primary Creation Tools */}
      <div className="flex flex-col items-center gap-2 w-full">
        {/* Toggle Slides Navigator */}
        <div className="relative group">
          <button
            onClick={onToggleNavigator}
            className={`w-10 h-10 rounded-[var(--cv-radius-control)] flex flex-col items-center justify-center transition cursor-pointer relative ${
              showNavigator
                ? 'bg-[var(--cv-color-accent-soft)] text-[var(--cv-color-accent-text)] shadow-xs'
                : 'text-[var(--cv-color-text-muted)] hover:text-[var(--cv-color-text)] hover:bg-[var(--cv-color-surface-subtle)]'
            }`}
            title="Alternar lista de slides (Painel Esquerdo)"
          >
            <PanelLeft className="w-4 h-4" />
            <span className="text-[9px] font-bold mt-0.5">{slideCount}</span>
          </button>
          <span className="absolute left-full ml-2 px-2 py-1 bg-[var(--cv-color-surface)] text-[var(--cv-color-text)] text-[11px] font-medium rounded-[var(--cv-radius-badge)] border border-[var(--cv-color-border)] shadow-md whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50">
            {showNavigator ? 'Recolher Slides' : 'Ver Todos os Slides'}
          </span>
        </div>

        <div className="w-6 h-px bg-[var(--cv-color-border)] my-0.5" />

        {/* Insert Element / Component */}
        <div className="relative group">
          <button
            onClick={onOpenInsertModal}
            className="w-10 h-10 rounded-[var(--cv-radius-control)] flex items-center justify-center text-[var(--cv-color-text-muted)] hover:text-[var(--cv-color-accent)] hover:bg-[var(--cv-color-accent-soft)]/50 transition cursor-pointer"
            title="Inserir elemento (Cards de KPI, tabelas, formas)"
          >
            <Plus className="w-5 h-5 text-[var(--cv-color-accent)]" />
          </button>
          <span className="absolute left-full ml-2 px-2 py-1 bg-[var(--cv-color-surface)] text-[var(--cv-color-text)] text-[11px] font-medium rounded-[var(--cv-radius-badge)] border border-[var(--cv-color-border)] shadow-md whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50">
            Inserir Componente
          </span>
        </div>

        {/* Interactive Chart Editor */}
        <div className="relative group">
          <button
            onClick={onOpenChartModal}
            className="w-10 h-10 rounded-[var(--cv-radius-control)] flex items-center justify-center text-[var(--cv-color-text-muted)] hover:text-[var(--cv-color-text)] hover:bg-[var(--cv-color-surface-subtle)] transition cursor-pointer"
            title="Editor de Gráficos (Chart.js)"
          >
            <BarChart2 className="w-4.5 h-4.5 text-[var(--cv-color-accent)]" />
          </button>
          <span className="absolute left-full ml-2 px-2 py-1 bg-[var(--cv-color-surface)] text-[var(--cv-color-text)] text-[11px] font-medium rounded-[var(--cv-radius-badge)] border border-[var(--cv-color-border)] shadow-md whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50">
            Editor de Gráficos
          </span>
        </div>

        {/* Gemini AI Assistant */}
        <div className="relative">
          <button
            onClick={() => setShowAiMenu(!showAiMenu)}
            className={`w-10 h-10 rounded-[var(--cv-radius-control)] flex items-center justify-center transition cursor-pointer ${
              showAiMenu
                ? 'bg-[var(--cv-color-accent)] text-white shadow-xs'
                : 'text-[var(--cv-color-accent-text)] bg-[var(--cv-color-accent-soft)]/50 hover:bg-[var(--cv-color-accent-soft)]'
            }`}
            title="Assistente IA Gemini"
          >
            <Sparkles className="w-4.5 h-4.5" />
          </button>

          {showAiMenu && (
            <div className="absolute left-full ml-2 top-0 w-64 bg-[var(--cv-color-surface)] rounded-[var(--cv-radius-panel)] shadow-[var(--cv-shadow-floating)] border border-[var(--cv-color-border)] py-2 z-50 text-[var(--cv-color-text)] animate-in fade-in zoom-in-95 duration-100">
              <div className="px-3 py-1 text-[10px] font-bold text-[var(--cv-color-text-muted)] uppercase tracking-wider border-b border-[var(--cv-color-border)] mb-1">
                Assistente Gemini IA
              </div>
              <button
                onClick={() => {
                  setShowAiMenu(false);
                  onOpenAiModal('generate-slide');
                }}
                className="w-full text-left px-3 py-2 text-xs hover:bg-[var(--cv-color-surface-subtle)] transition flex items-center gap-2.5 cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-[var(--cv-color-accent)] shrink-0" />
                <div>
                  <div className="font-semibold text-[var(--cv-color-text)]">Gerar Slide com IA</div>
                  <div className="text-[10px] text-[var(--cv-color-text-muted)]">Crie layout completo via prompt</div>
                </div>
              </button>
              <button
                onClick={() => {
                  setShowAiMenu(false);
                  onOpenAiModal('generate-chart');
                }}
                className="w-full text-left px-3 py-2 text-xs hover:bg-[var(--cv-color-surface-subtle)] transition flex items-center gap-2.5 cursor-pointer"
              >
                <BarChart2 className="w-4 h-4 text-[var(--cv-color-accent)] shrink-0" />
                <div>
                  <div className="font-semibold text-[var(--cv-color-text)]">Gerar Gráfico / KPI</div>
                  <div className="text-[10px] text-[var(--cv-color-text-muted)]">Gráficos dinâmicos com dados</div>
                </div>
              </button>
              <button
                onClick={() => {
                  setShowAiMenu(false);
                  onOpenAiModal('analyze');
                }}
                className="w-full text-left px-3 py-2 text-xs hover:bg-[var(--cv-color-surface-subtle)] transition flex items-center gap-2.5 cursor-pointer"
              >
                <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                <div>
                  <div className="font-semibold text-[var(--cv-color-text)]">Diagnóstico do Deck</div>
                  <div className="text-[10px] text-[var(--cv-color-text-muted)]">Auditoria de clareza e ritmo</div>
                </div>
              </button>
            </div>
          )}
        </div>

        {/* Templates Selector */}
        <div className="relative">
          <button
            onClick={() => setShowSamplesMenu(!showSamplesMenu)}
            className={`w-10 h-10 rounded-[var(--cv-radius-control)] flex items-center justify-center transition cursor-pointer ${
              showSamplesMenu
                ? 'bg-[var(--cv-color-surface-subtle)] text-[var(--cv-color-text)]'
                : 'text-[var(--cv-color-text-muted)] hover:text-[var(--cv-color-text)] hover:bg-[var(--cv-color-surface-subtle)]'
            }`}
            title="Modelos Prontos"
          >
            <LayoutTemplate className="w-4.5 h-4.5" />
          </button>

          {showSamplesMenu && (
            <div className="absolute left-full ml-2 top-0 w-64 bg-[var(--cv-color-surface)] rounded-[var(--cv-radius-panel)] shadow-[var(--cv-shadow-floating)] border border-[var(--cv-color-border)] py-2 z-50 text-[var(--cv-color-text)] animate-in fade-in zoom-in-95 duration-100">
              <div className="px-3 py-1 text-[10px] font-bold text-[var(--cv-color-text-muted)] uppercase tracking-wider border-b border-[var(--cv-color-border)] mb-1">
                Modelos de Apresentação
              </div>
              {Object.entries(SAMPLE_PRESENTATIONS).map(([key, sample]) => (
                <button
                  key={key}
                  onClick={() => {
                    setShowSamplesMenu(false);
                    onLoadSample(key);
                  }}
                  className="w-full text-left px-3 py-2 text-xs hover:bg-[var(--cv-color-surface-subtle)] transition cursor-pointer"
                >
                  <div className="font-semibold text-[var(--cv-color-text)]">{sample.name}</div>
                  <div className="text-[10px] text-[var(--cv-color-text-muted)] line-clamp-1">{sample.description}</div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Upload File (PPTX or HTML) */}
        <div className="relative group">
          <button
            onClick={() => handleUploadClick('.pptx,.html,.htm')}
            className="w-10 h-10 rounded-[var(--cv-radius-control)] flex items-center justify-center text-[var(--cv-color-text-muted)] hover:text-[var(--cv-color-text)] hover:bg-[var(--cv-color-surface-subtle)] transition cursor-pointer"
            title="Subir arquivo PowerPoint (.pptx) ou HTML"
          >
            <Upload className="w-4.5 h-4.5" />
          </button>
          <span className="absolute left-full ml-2 px-2 py-1 bg-[var(--cv-color-surface)] text-[var(--cv-color-text)] text-[11px] font-medium rounded-[var(--cv-radius-badge)] border border-[var(--cv-color-border)] shadow-md whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50">
            Subir PPTX ou HTML
          </span>
        </div>

        {/* Central Export Hub */}
        {onOpenExportModal && (
          <div className="relative group">
            <button
              onClick={onOpenExportModal}
              className="w-10 h-10 rounded-[var(--cv-radius-control)] flex items-center justify-center text-[var(--cv-color-accent-text)] bg-[var(--cv-color-accent-soft)] hover:bg-[var(--cv-color-accent-emphasis)] hover:text-white transition cursor-pointer"
              title="Central de Exportação (PowerPoint nativo editável, HTML, PDF)"
            >
              <Download className="w-4.5 h-4.5" />
            </button>
            <span className="absolute left-full ml-2 px-2 py-1 bg-[var(--cv-color-surface)] text-[var(--cv-color-text)] text-[11px] font-medium rounded-[var(--cv-radius-badge)] border border-[var(--cv-color-border)] shadow-md whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50">
              Exportar (PPTX / HTML / PDF)
            </span>
          </div>
        )}

        {/* Code View */}
        <div className="relative group">
          <button
            onClick={onOpenCodeView}
            className="w-10 h-10 rounded-[var(--cv-radius-control)] flex items-center justify-center text-[var(--cv-color-text-muted)] hover:text-[var(--cv-color-text)] hover:bg-[var(--cv-color-surface-subtle)] transition cursor-pointer"
            title="Inspecionar código HTML bruto"
          >
            <Code className="w-4.5 h-4.5" />
          </button>
          <span className="absolute left-full ml-2 px-2 py-1 bg-[var(--cv-color-surface)] text-[var(--cv-color-text)] text-[11px] font-medium rounded-[var(--cv-radius-badge)] border border-[var(--cv-color-border)] shadow-md whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50">
            Código-Fonte HTML
          </span>
        </div>
      </div>

      {/* Bottom Group: Inspector Toggle */}
      <div className="flex flex-col items-center gap-2 w-full pt-2 border-t border-[var(--cv-color-border)]">
        <div className="relative group">
          <button
            onClick={onToggleInspector}
            className={`w-10 h-10 rounded-[var(--cv-radius-control)] flex items-center justify-center transition cursor-pointer ${
              showInspector
                ? 'bg-[var(--cv-color-accent-soft)] text-[var(--cv-color-accent-text)]'
                : 'text-[var(--cv-color-text-muted)] hover:text-[var(--cv-color-text)] hover:bg-[var(--cv-color-surface-subtle)]'
            }`}
            title="Alternar Painel de Propriedades (Inspetor à direita)"
          >
            <Sliders className="w-4.5 h-4.5" />
          </button>
          <span className="absolute left-full ml-2 px-2 py-1 bg-[var(--cv-color-surface)] text-[var(--cv-color-text)] text-[11px] font-medium rounded-[var(--cv-radius-badge)] border border-[var(--cv-color-border)] shadow-md whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50">
            {showInspector ? 'Ocultar Inspetor' : 'Abrir Inspetor'}
          </span>
        </div>
      </div>
    </aside>
  );
};
