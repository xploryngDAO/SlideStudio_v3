import React, { useState } from 'react';
import {
  Sparkles,
  Zap,
  Briefcase,
  Target,
  List,
  CheckCheck,
  Languages,
  Trash2,
  Copy,
  ChevronDown,
  Loader2,
  Maximize2,
  Scissors,
  ClipboardPaste,
  Plus,
  Bold,
  Italic,
  Underline,
  ArrowUp,
  ArrowDown,
  Palette,
} from 'lucide-react';

interface FloatingAIToolbarProps {
  position: { top: number; left: number; width: number; height: number };
  selectedTagName: string;
  selectedText: string;
  isTextElement: boolean;
  onApplyAiAction: (action: string) => Promise<void>;
  onDuplicateElement: () => void;
  onDeleteElement: () => void;
  onSelectParent: () => void;
  onCopyElement?: () => void;
  onCutElement?: () => void;
  onPasteElement?: () => void;
  hasClipboardContent?: boolean;
  onOpenInsertModal?: () => void;
  onToggleBold?: () => void;
  onToggleItalic?: () => void;
  onToggleUnderline?: () => void;
  onChangeFontSize?: (delta: number) => void;
  onBringForward?: () => void;
  onSendBackward?: () => void;
  onUpdateElementStyle?: (prop: string, val: string) => void;
}

const QUICK_COLORS = [
  '#0033C6', // Azul Corporativo
  '#E71A3B', // Vermelho Destaque
  '#059669', // Verde Sucesso
  '#D97706', // Âmbar Atenção
  '#0F172A', // Preto Grafite
  '#64748B', // Cinza Médio
  '#FFFFFF', // Branco
  'transparent',
];

export const FloatingAIToolbar: React.FC<FloatingAIToolbarProps> = ({
  position,
  selectedTagName,
  selectedText,
  isTextElement,
  onApplyAiAction,
  onDuplicateElement,
  onDeleteElement,
  onSelectParent,
  onCopyElement,
  onCutElement,
  onPasteElement,
  hasClipboardContent = false,
  onOpenInsertModal,
  onToggleBold,
  onToggleItalic,
  onToggleUnderline,
  onChangeFontSize,
  onBringForward,
  onSendBackward,
  onUpdateElementStyle,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [colorMode, setColorMode] = useState<'color' | 'backgroundColor'>('color');
  const [loadingAction, setLoadingAction] = useState<string | null>(null);

  const handleAction = async (action: string) => {
    try {
      setLoadingAction(action);
      await onApplyAiAction(action);
    } finally {
      setLoadingAction(null);
      setIsOpen(false);
    }
  };

  // Calculate toolbar position: above element if room, otherwise below, and constrained horizontally
  const topPos = position.top > 54 ? position.top - 46 : position.top + position.height + 10;
  const leftPos = Math.max(10, Math.min(position.left, 960 - 380));

  return (
    <div
      style={{
        position: 'absolute',
        top: `${topPos}px`,
        left: `${leftPos}px`,
        zIndex: 50,
      }}
      className="flex items-center gap-1 bg-[var(--cv-color-surface)] text-[var(--cv-color-text)] backdrop-blur-md px-2 py-1.5 rounded-[var(--cv-radius-card)] shadow-[var(--cv-shadow-floating)] border border-[var(--cv-color-border)] text-xs select-none animate-in fade-in duration-100 max-w-[calc(100%-20px)] overflow-x-auto"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Tag indicator badge */}
      <span className="text-[10px] font-mono uppercase bg-[var(--cv-color-surface-subtle)] text-[var(--cv-color-accent)] px-1.5 py-0.5 rounded-[var(--cv-radius-badge)] border border-[var(--cv-color-border)] font-semibold shrink-0">
        &lt;{selectedTagName.toLowerCase()}&gt;
      </span>

      {/* Select parent container button */}
      <button
        onClick={onSelectParent}
        className="px-1.5 py-1 text-[11px] text-[var(--cv-color-text-muted)] hover:text-[var(--cv-color-text)] hover:bg-[var(--cv-color-surface-hover)] rounded-[var(--cv-radius-control)] transition flex items-center gap-1 cursor-pointer shrink-0"
        title="Selecionar elemento pai (container superior)"
      >
        <Maximize2 className="w-3 h-3 text-[var(--cv-color-text-muted)]" />
        <span className="hidden sm:inline">Pai</span>
      </button>

      <div className="h-4 w-px bg-[var(--cv-color-border)] mx-0.5 shrink-0" />

      {/* PowerPoint Text Formatting Controls */}
      {isTextElement && (
        <div className="flex items-center gap-0.5 shrink-0">
          {onToggleBold && (
            <button
              onClick={onToggleBold}
              className="p-1.5 text-[var(--cv-color-text-muted)] hover:text-[var(--cv-color-text)] hover:bg-[var(--cv-color-surface-hover)] rounded-[var(--cv-radius-control)] transition font-bold text-xs cursor-pointer"
              title="Negrito (Ctrl+B)"
            >
              <Bold className="w-3.5 h-3.5" />
            </button>
          )}

          {onToggleItalic && (
            <button
              onClick={onToggleItalic}
              className="p-1.5 text-[var(--cv-color-text-muted)] hover:text-[var(--cv-color-text)] hover:bg-[var(--cv-color-surface-hover)] rounded-[var(--cv-radius-control)] transition italic text-xs cursor-pointer"
              title="Itálico (Ctrl+I)"
            >
              <Italic className="w-3.5 h-3.5" />
            </button>
          )}

          {onToggleUnderline && (
            <button
              onClick={onToggleUnderline}
              className="p-1.5 text-[var(--cv-color-text-muted)] hover:text-[var(--cv-color-text)] hover:bg-[var(--cv-color-surface-hover)] rounded-[var(--cv-radius-control)] transition underline text-xs cursor-pointer"
              title="Sublinhado (Ctrl+U)"
            >
              <Underline className="w-3.5 h-3.5" />
            </button>
          )}

          {onChangeFontSize && (
            <div className="flex items-center gap-0.5 ml-0.5">
              <button
                onClick={() => onChangeFontSize(-1)}
                className="px-1.5 py-0.5 text-[10px] font-bold text-[var(--cv-color-text-muted)] hover:text-[var(--cv-color-text)] hover:bg-[var(--cv-color-surface-hover)] rounded-[var(--cv-radius-badge)] border border-[var(--cv-color-border)] transition cursor-pointer"
                title="Diminuir tamanho da fonte"
              >
                A-
              </button>
              <button
                onClick={() => onChangeFontSize(1)}
                className="px-1.5 py-0.5 text-[10px] font-bold text-[var(--cv-color-text-muted)] hover:text-[var(--cv-color-text)] hover:bg-[var(--cv-color-surface-hover)] rounded-[var(--cv-radius-badge)] border border-[var(--cv-color-border)] transition cursor-pointer"
                title="Aumentar tamanho da fonte"
              >
                A+
              </button>
            </div>
          )}

          {/* Quick Color Picker */}
          {onUpdateElementStyle && (
            <div className="relative">
              <button
                onClick={() => setShowColorPicker(!showColorPicker)}
                className="p-1.5 text-[var(--cv-color-text-muted)] hover:text-[var(--cv-color-text)] hover:bg-[var(--cv-color-surface-hover)] rounded-[var(--cv-radius-control)] transition cursor-pointer"
                title="Cor do Texto ou Fundo"
              >
                <Palette className="w-3.5 h-3.5 text-[var(--cv-color-accent)]" />
              </button>

              {showColorPicker && (
                <div
                  className="absolute left-0 top-full mt-1.5 w-48 bg-[var(--cv-color-surface)] border border-[var(--cv-color-border)] rounded-[var(--cv-radius-card)] shadow-[var(--cv-shadow-floating)] p-2 z-50 text-[var(--cv-color-text)] text-xs animate-in fade-in duration-100"
                  onMouseLeave={() => setShowColorPicker(false)}
                >
                  <div className="flex items-center justify-between mb-2 pb-1 border-b border-[var(--cv-color-border)] text-[10px] font-bold">
                    <button
                      onClick={() => setColorMode('color')}
                      className={`px-1.5 py-0.5 rounded cursor-pointer ${colorMode === 'color' ? 'bg-[var(--cv-color-accent)] text-white' : 'text-[var(--cv-color-text-muted)]'}`}
                    >
                      Texto
                    </button>
                    <button
                      onClick={() => setColorMode('backgroundColor')}
                      className={`px-1.5 py-0.5 rounded cursor-pointer ${colorMode === 'backgroundColor' ? 'bg-[var(--cv-color-accent)] text-white' : 'text-[var(--cv-color-text-muted)]'}`}
                    >
                      Fundo
                    </button>
                  </div>
                  <div className="grid grid-cols-4 gap-1.5">
                    {QUICK_COLORS.map((hex) => (
                      <button
                        key={hex}
                        onClick={() => {
                          onUpdateElementStyle(colorMode, hex);
                          setShowColorPicker(false);
                        }}
                        className="w-8 h-6 rounded border border-slate-300 hover:scale-110 transition shadow-2xs cursor-pointer flex items-center justify-center"
                        style={{ backgroundColor: hex }}
                        title={hex}
                      >
                        {hex === 'transparent' && <span className="text-[8px] text-slate-500 font-bold">∅</span>}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="h-4 w-px bg-[var(--cv-color-border)] mx-0.5 shrink-0" />
        </div>
      )}

      {/* AI Quick Actions for Text elements */}
      {isTextElement && selectedText.trim().length > 0 && (
        <div className="relative shrink-0">
          <button
            onClick={() => setIsOpen(!isOpen)}
            disabled={loadingAction !== null}
            className="flex items-center gap-1.5 px-2.5 py-1 bg-[var(--cv-color-accent)] hover:opacity-90 text-white rounded-[var(--cv-radius-control)] font-semibold transition active:scale-95 shadow-xs cursor-pointer"
          >
            {loadingAction ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Sparkles className="w-3.5 h-3.5" />
            )}
            <span>Reescrever</span>
            <ChevronDown className="w-3 h-3 opacity-70" />
          </button>

          {isOpen && (
            <div
              className="absolute left-0 top-full mt-1.5 w-56 bg-[var(--cv-color-surface)] border border-[var(--cv-color-border)] rounded-[var(--cv-radius-card)] shadow-[var(--cv-shadow-floating)] p-1 z-50 text-[var(--cv-color-text)] text-xs"
              onMouseLeave={() => setIsOpen(false)}
            >
              <button
                onClick={() => handleAction('concise')}
                className="w-full text-left px-2.5 py-1.5 rounded-[var(--cv-radius-control)] hover:bg-[var(--cv-color-surface-hover)] flex items-center gap-2 transition cursor-pointer"
              >
                <Zap className="w-3.5 h-3.5 text-amber-500" />
                <span>Mais conciso & direto</span>
              </button>
              <button
                onClick={() => handleAction('formal')}
                className="w-full text-left px-2.5 py-1.5 rounded-[var(--cv-radius-control)] hover:bg-[var(--cv-color-surface-hover)] flex items-center gap-2 transition cursor-pointer"
              >
                <Briefcase className="w-3.5 h-3.5 text-[var(--cv-color-accent)]" />
                <span>Tom corporativo / formal</span>
              </button>
              <button
                onClick={() => handleAction('persuasive')}
                className="w-full text-left px-2.5 py-1.5 rounded-[var(--cv-radius-control)] hover:bg-[var(--cv-color-surface-hover)] flex items-center gap-2 transition cursor-pointer"
              >
                <Target className="w-3.5 h-3.5 text-rose-500" />
                <span>Mais persuasivo (Copy)</span>
              </button>
              <button
                onClick={() => handleAction('bullet_points')}
                className="w-full text-left px-2.5 py-1.5 rounded-[var(--cv-radius-control)] hover:bg-[var(--cv-color-surface-hover)] flex items-center gap-2 transition cursor-pointer"
              >
                <List className="w-3.5 h-3.5 text-emerald-500" />
                <span>Transformar em tópicos</span>
              </button>
              <button
                onClick={() => handleAction('grammar')}
                className="w-full text-left px-2.5 py-1.5 rounded-[var(--cv-radius-control)] hover:bg-[var(--cv-color-surface-hover)] flex items-center gap-2 transition cursor-pointer"
              >
                <CheckCheck className="w-3.5 h-3.5 text-teal-500" />
                <span>Corrigir gramática</span>
              </button>
              <button
                onClick={() => handleAction('translate_en')}
                className="w-full text-left px-2.5 py-1.5 rounded-[var(--cv-radius-control)] hover:bg-[var(--cv-color-surface-hover)] flex items-center gap-2 transition cursor-pointer"
              >
                <Languages className="w-3.5 h-3.5 text-cyan-500" />
                <span>Traduzir para Inglês</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Layer Arrange Buttons */}
      {(onBringForward || onSendBackward) && (
        <div className="flex items-center gap-0.5 shrink-0">
          {onBringForward && (
            <button
              onClick={onBringForward}
              className="p-1.5 text-[var(--cv-color-text-muted)] hover:text-[var(--cv-color-text)] hover:bg-[var(--cv-color-surface-hover)] rounded-[var(--cv-radius-control)] transition cursor-pointer"
              title="Avançar camada / Mover para cima"
            >
              <ArrowUp className="w-3.5 h-3.5" />
            </button>
          )}
          {onSendBackward && (
            <button
              onClick={onSendBackward}
              className="p-1.5 text-[var(--cv-color-text-muted)] hover:text-[var(--cv-color-text)] hover:bg-[var(--cv-color-surface-hover)] rounded-[var(--cv-radius-control)] transition cursor-pointer"
              title="Recuar camada / Mover para baixo"
            >
              <ArrowDown className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}

      <div className="h-4 w-px bg-[var(--cv-color-border)] mx-0.5 shrink-0" />

      {/* Copy Element */}
      {onCopyElement && (
        <button
          onClick={onCopyElement}
          className="p-1.5 text-[var(--cv-color-text-muted)] hover:text-[var(--cv-color-text)] hover:bg-[var(--cv-color-surface-hover)] rounded-[var(--cv-radius-control)] transition cursor-pointer shrink-0"
          title="Copiar elemento (Ctrl+C)"
        >
          <Copy className="w-3.5 h-3.5 text-[var(--cv-color-accent)]" />
        </button>
      )}

      {/* Cut Element */}
      {onCutElement && (
        <button
          onClick={onCutElement}
          className="p-1.5 text-[var(--cv-color-text-muted)] hover:text-[var(--cv-color-text)] hover:bg-[var(--cv-color-surface-hover)] rounded-[var(--cv-radius-control)] transition cursor-pointer shrink-0"
          title="Recortar elemento (Ctrl+X)"
        >
          <Scissors className="w-3.5 h-3.5 text-amber-500" />
        </button>
      )}

      {/* Paste Element (if clipboard has content) */}
      {hasClipboardContent && onPasteElement && (
        <button
          onClick={onPasteElement}
          className="flex items-center gap-1 px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-[var(--cv-radius-control)] transition text-[11px] font-bold shadow-xs cursor-pointer shrink-0"
          title="Colar elemento após o selecionado (Ctrl+V)"
        >
          <ClipboardPaste className="w-3.5 h-3.5 text-emerald-100" />
          <span>Colar</span>
        </button>
      )}

      {/* Insert Component Button */}
      {onOpenInsertModal && (
        <button
          onClick={onOpenInsertModal}
          className="p-1.5 text-[var(--cv-color-text-muted)] hover:text-[var(--cv-color-accent)] hover:bg-[var(--cv-color-surface-hover)] rounded-[var(--cv-radius-control)] transition cursor-pointer shrink-0"
          title="Inserir novo componente na apresentação"
        >
          <Plus className="w-3.5 h-3.5 text-[var(--cv-color-accent)]" />
        </button>
      )}

      {/* Duplicate Element */}
      <button
        onClick={onDuplicateElement}
        className="p-1.5 text-[var(--cv-color-text-muted)] hover:text-[var(--cv-color-text)] hover:bg-[var(--cv-color-surface-hover)] rounded-[var(--cv-radius-control)] transition cursor-pointer shrink-0"
        title="Duplicar elemento (Ctrl+D)"
      >
        <Copy className="w-3.5 h-3.5" />
      </button>

      {/* Delete Element */}
      <button
        onClick={onDeleteElement}
        className="p-1.5 text-rose-500 hover:text-white hover:bg-rose-600 rounded-[var(--cv-radius-control)] transition cursor-pointer shrink-0"
        title="Excluir elemento (Delete)"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
