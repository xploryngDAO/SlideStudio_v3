import React, { useState, useEffect } from 'react';
import {
  Download,
  Play,
  Undo2,
  Redo2,
  Home,
  Check,
  Printer,
  FileCode,
  Layers,
  Presentation,
  Sun,
  Moon,
  ChevronDown,
} from 'lucide-react';
import { PresentationDoc, ViewMode } from '../types/presentation';
import { Icon, useTheme, useThemeActions } from '../convergencia';

interface TopToolbarProps {
  presentation: PresentationDoc;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  onExportHtml: () => void;
  onPrintPdf: () => void;
  onExportPptxAll?: (mode?: 'high-fidelity' | 'vector') => void;
  onExportPptxCurrentSlide?: (mode?: 'high-fidelity' | 'vector') => void;
  onTitleChange: (newTitle: string) => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onGoHome?: () => void;
  onOpenExportModal?: () => void;
  // Optional legacy props kept for type compatibility
  deviceMode?: any;
  onChangeDeviceMode?: any;
  showNavigator?: boolean;
  onToggleNavigator?: () => void;
  showInspector?: boolean;
  onToggleInspector?: () => void;
  onFileUpload?: (file: File) => void;
  onLoadSample?: (key: string) => void;
  onOpenAiModal?: any;
  onOpenInsertModal?: () => void;
  onOpenChartModal?: () => void;
  onOpenCodeView?: () => void;
  onCopyElement?: () => void;
  onPasteElement?: () => void;
  hasClipboard?: boolean;
}

export const TopToolbar: React.FC<TopToolbarProps> = ({
  presentation,
  viewMode,
  onViewModeChange,
  onExportHtml,
  onPrintPdf,
  onExportPptxAll,
  onExportPptxCurrentSlide,
  onTitleChange,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onGoHome,
  onOpenExportModal,
}) => {
  const [showExportDropdown, setShowExportDropdown] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState(presentation.title);
  const theme = useTheme();
  const { toggleTheme } = useThemeActions();

  useEffect(() => {
    setTitleInput(presentation.title);
  }, [presentation.title]);

  useEffect(() => {
    const handleGlobalClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('[data-export-dropdown]')) {
        setShowExportDropdown(false);
      }
    };
    if (showExportDropdown) {
      window.addEventListener('click', handleGlobalClick);
      return () => window.removeEventListener('click', handleGlobalClick);
    }
  }, [showExportDropdown]);

  const handleTitleSubmit = () => {
    setIsEditingTitle(false);
    if (titleInput.trim()) {
      onTitleChange(titleInput.trim());
    } else {
      setTitleInput(presentation.title);
    }
  };

  return (
    <header className="h-12 border-b border-[var(--cv-color-border)] bg-[var(--cv-color-surface)] px-3 sm:px-4 flex items-center justify-between select-none z-40 shrink-0 gap-3 text-[var(--cv-color-text)] transition-colors shadow-2xs">
      {/* Left: Home + Brand + Presentation Title */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        {onGoHome && (
          <button
            onClick={onGoHome}
            className="p-1.5 rounded-[var(--cv-radius-control)] text-[var(--cv-color-text-muted)] hover:text-[var(--cv-color-text)] hover:bg-[var(--cv-color-surface-subtle)] transition shrink-0 cursor-pointer"
            title="Voltar à tela inicial"
          >
            <Home className="w-4 h-4" />
          </button>
        )}

        <div className="flex items-center gap-2 shrink-0">
          <div className="w-6 h-6 rounded-[var(--cv-radius-small)] bg-[var(--cv-color-accent)] flex items-center justify-center text-white shadow-xs shrink-0">
            <Icon name="spark" size={13} />
          </div>
          <span className="font-bold text-xs tracking-tight text-[var(--cv-color-text)] hidden sm:inline">
            SlideStudio
          </span>
        </div>

        <div className="h-3.5 w-px bg-[var(--cv-color-border)] mx-0.5 hidden sm:block shrink-0" />

        {/* Title & Saved state */}
        <div className="flex items-center gap-1.5 min-w-0 max-w-[180px] sm:max-w-[260px] md:max-w-xs">
          {isEditingTitle ? (
            <div className="flex items-center gap-1 w-full">
              <input
                type="text"
                className="text-xs font-semibold text-[var(--cv-color-text)] border border-[var(--cv-color-accent)] rounded-[var(--cv-radius-small)] px-2 py-0.5 outline-none bg-[var(--cv-color-surface-subtle)] w-full"
                value={titleInput}
                autoFocus
                onChange={(e) => setTitleInput(e.target.value)}
                onBlur={handleTitleSubmit}
                onKeyDown={(e) => e.key === 'Enter' && handleTitleSubmit()}
              />
              <button
                onMouseDown={handleTitleSubmit}
                className="p-1 text-[var(--cv-color-accent)] hover:bg-[var(--cv-color-surface-subtle)] rounded-[var(--cv-radius-small)] cursor-pointer"
                title="Salvar título"
              >
                <Check className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setIsEditingTitle(true)}
              className="group flex items-center gap-1 text-xs font-semibold text-[var(--cv-color-text)] hover:text-[var(--cv-color-accent)] rounded-[var(--cv-radius-small)] px-1.5 py-0.5 hover:bg-[var(--cv-color-surface-subtle)] transition truncate text-left cursor-pointer"
              title="Clique para renomear"
            >
              <span className="truncate">{presentation.title || 'Apresentação Sem Título'}</span>
              <span className="text-[10px] text-[var(--cv-color-text-muted)] opacity-0 group-hover:opacity-100 transition shrink-0">
                ✎
              </span>
            </button>
          )}

          <div className="hidden lg:flex items-center gap-1 text-[10px] text-[var(--cv-color-text-muted)] shrink-0 pl-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span className="opacity-80">Salvo</span>
          </div>
        </div>
      </div>

      {/* Center: Clean Undo & Redo Controls */}
      <div className="flex items-center gap-1 bg-[var(--cv-color-surface-subtle)] rounded-[var(--cv-radius-control)] p-0.5 border border-[var(--cv-color-border)]">
        <button
          onClick={onUndo}
          disabled={!canUndo}
          title="Desfazer (Ctrl+Z)"
          className={`p-1.5 rounded-[var(--cv-radius-badge)] text-[var(--cv-color-text-muted)] transition cursor-pointer ${
            canUndo
              ? 'hover:bg-[var(--cv-color-surface)] hover:text-[var(--cv-color-text)] active:scale-95 shadow-2xs'
              : 'opacity-30 cursor-not-allowed'
          }`}
        >
          <Undo2 className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={onRedo}
          disabled={!canRedo}
          title="Refazer (Ctrl+Y)"
          className={`p-1.5 rounded-[var(--cv-radius-badge)] text-[var(--cv-color-text-muted)] transition cursor-pointer ${
            canRedo
              ? 'hover:bg-[var(--cv-color-surface)] hover:text-[var(--cv-color-text)] active:scale-95 shadow-2xs'
              : 'opacity-30 cursor-not-allowed'
          }`}
        >
          <Redo2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Right: Theme Toggle, Export Dropdown & Primary Present CTA */}
      <div className="flex items-center gap-2">
        {/* Theme Switcher */}
        <button
          onClick={toggleTheme}
          className="p-1.5 rounded-[var(--cv-radius-control)] text-[var(--cv-color-text-muted)] hover:text-[var(--cv-color-text)] hover:bg-[var(--cv-color-surface-subtle)] border border-[var(--cv-color-border)] transition cursor-pointer"
          title={`Alternar para tema ${theme === 'dark' ? 'claro' : 'escuro'}`}
        >
          {theme === 'dark' ? (
            <Sun className="w-4 h-4 text-amber-400" />
          ) : (
            <Moon className="w-4 h-4 text-slate-600" />
          )}
        </button>

        {/* Export Dropdown */}
        <div className="relative" data-export-dropdown>
          <button
            onClick={() => setShowExportDropdown(!showExportDropdown)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-[var(--cv-radius-control)] text-xs font-semibold text-[var(--cv-color-text)] hover:bg-[var(--cv-color-surface-subtle)] border border-[var(--cv-color-border)] transition cursor-pointer shadow-2xs"
            title="Opções de Download"
          >
            <Download className="w-3.5 h-3.5 text-[var(--cv-color-accent)]" />
            <span className="hidden sm:inline">Exportar</span>
            <ChevronDown className="w-3 h-3 text-[var(--cv-color-text-muted)]" />
          </button>

          {showExportDropdown && (
            <div className="absolute right-0 mt-1.5 w-76 bg-[var(--cv-color-surface)] rounded-[var(--cv-radius-panel)] shadow-[var(--cv-shadow-floating)] border border-[var(--cv-color-border)] py-1.5 z-50 text-[var(--cv-color-text)] animate-in fade-in zoom-in-95 duration-100">
              <div className="px-3 py-1 flex items-center justify-between border-b border-[var(--cv-color-border)] mb-1">
                <span className="text-[10px] font-bold text-[var(--cv-color-text-muted)] uppercase tracking-wider">
                  Exportar Apresentação
                </span>
                {onOpenExportModal && (
                  <button
                    onClick={() => {
                      setShowExportDropdown(false);
                      onOpenExportModal();
                    }}
                    className="text-[10px] text-[var(--cv-color-accent)] font-semibold hover:underline cursor-pointer"
                  >
                    Mais Opções
                  </button>
                )}
              </div>

              {/* 1. PowerPoint Editable Layers - ONLY & RECOMMENDED */}
              <button
                onClick={() => {
                  setShowExportDropdown(false);
                  onExportPptxAll?.('vector');
                }}
                className="w-full text-left px-3 py-2 text-xs flex items-center gap-2.5 hover:bg-[var(--cv-color-surface-subtle)] transition cursor-pointer"
              >
                <div className="w-5 h-5 rounded-[var(--cv-radius-badge)] bg-orange-600 text-white flex items-center justify-center font-bold text-[9px] shrink-0">
                  P
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-[var(--cv-color-text)]">PowerPoint (.pptx) Editável</span>
                    <span className="text-[9px] font-bold px-1 rounded bg-emerald-500/15 text-emerald-600">Recomendado</span>
                  </div>
                  <div className="text-[10px] text-[var(--cv-color-text-muted)]">Camadas nativas, textos, tabelas e gráficos</div>
                </div>
              </button>

              <div className="my-1 border-t border-[var(--cv-color-border)]" />

              {/* 4. Standalone HTML */}
              <button
                onClick={() => {
                  setShowExportDropdown(false);
                  onExportHtml();
                }}
                className="w-full text-left px-3 py-2 text-xs flex items-center gap-2.5 hover:bg-[var(--cv-color-surface-subtle)] transition cursor-pointer"
              >
                <FileCode className="w-4 h-4 text-emerald-500" />
                <div>
                  <div className="font-semibold text-[var(--cv-color-text)]">Arquivo HTML Auto-contido</div>
                  <div className="text-[10px] text-[var(--cv-color-text-muted)]">Abre em qualquer navegador offline</div>
                </div>
              </button>

              {/* 5. Print / PDF */}
              <button
                onClick={() => {
                  setShowExportDropdown(false);
                  onPrintPdf();
                }}
                className="w-full text-left px-3 py-2 text-xs flex items-center gap-2.5 hover:bg-[var(--cv-color-surface-subtle)] transition cursor-pointer"
              >
                <Printer className="w-4 h-4 text-blue-500" />
                <div>
                  <div className="font-semibold text-[var(--cv-color-text)]">Imprimir / Salvar em PDF</div>
                  <div className="text-[10px] text-[var(--cv-color-text-muted)]">Layout para impressão e PDF</div>
                </div>
              </button>
            </div>
          )}
        </div>

        {/* PRIMARY CTA: PRESENT BUTTON */}
        <button
          onClick={() => onViewModeChange('present')}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-[var(--cv-radius-control)] bg-[var(--cv-color-accent)] hover:opacity-90 text-white text-xs font-bold transition shadow-xs active:scale-98 cursor-pointer shrink-0"
          title="Iniciar Apresentação em Tela Cheia (F5)"
        >
          <Play className="w-3.5 h-3.5 fill-current" />
          <span>Apresentar</span>
        </button>
      </div>
    </header>
  );
};
