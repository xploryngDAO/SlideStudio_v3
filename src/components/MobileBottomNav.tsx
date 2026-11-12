import React from 'react';
import {
  Layers,
  Sliders,
  PlusCircle,
  Sparkles,
  Play,
  ChevronUp,
} from 'lucide-react';
import { SelectedElementInfo } from './SlideCanvas';

interface MobileBottomNavProps {
  currentSlideIndex: number;
  totalSlides: number;
  selectedElement: SelectedElementInfo | null;
  showNavigator: boolean;
  onToggleNavigator: () => void;
  showInspector: boolean;
  onToggleInspector: () => void;
  onOpenInsertModal: () => void;
  onOpenAiModal: () => void;
  onStartPresentation: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  currentSlideIndex,
  totalSlides,
  selectedElement,
  showNavigator,
  onToggleNavigator,
  showInspector,
  onToggleInspector,
  onOpenInsertModal,
  onOpenAiModal,
  onStartPresentation,
}) => {
  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-[var(--cv-color-surface)]/95 backdrop-blur-lg border-t border-[var(--cv-color-border)] shadow-[var(--cv-shadow-floating)] px-2 py-1 select-none text-[var(--cv-color-text)]">
      <div className="flex items-center justify-around max-w-lg mx-auto">
        {/* 1. Slides Navigator Button */}
        <button
          onClick={onToggleNavigator}
          className={`min-h-[44px] flex flex-col items-center justify-center py-1 px-2.5 rounded-[var(--cv-radius-control)] transition active:scale-95 ${
            showNavigator
              ? 'text-[var(--cv-color-accent-text)] bg-[var(--cv-color-accent-soft)] font-bold'
              : 'text-[var(--cv-color-text-muted)] hover:text-[var(--cv-color-text)]'
          }`}
          title="Ver todos os slides"
        >
          <div className="relative">
            <Layers className="w-5 h-5" />
            <span className="absolute -top-1 -right-2.5 bg-[var(--cv-color-text)] text-[var(--cv-color-surface)] font-mono text-[9px] font-bold px-1 rounded-full">
              {currentSlideIndex + 1}/{totalSlides}
            </span>
          </div>
          <span className="text-[10px] mt-1 font-medium">Slides</span>
        </button>

        {/* 2. Inspector / Style Button */}
        <button
          onClick={onToggleInspector}
          className={`min-h-[44px] flex flex-col items-center justify-center py-1 px-2.5 rounded-[var(--cv-radius-control)] transition active:scale-95 ${
            showInspector
              ? 'text-[var(--cv-color-accent-text)] bg-[var(--cv-color-accent-soft)] font-bold'
              : selectedElement
              ? 'text-[var(--cv-color-accent)] font-semibold'
              : 'text-[var(--cv-color-text-muted)] hover:text-[var(--cv-color-text)]'
          }`}
          title="Editar estilo do elemento ou slide"
        >
          <div className="relative">
            <Sliders className="w-5 h-5" />
            {selectedElement && (
              <span className="absolute -top-1 -right-2 w-2 h-2 rounded-full bg-[var(--cv-color-accent)] animate-pulse" />
            )}
          </div>
          <span className="text-[10px] mt-1 font-medium">
            {selectedElement ? (
              <span className="text-[var(--cv-color-accent)] font-bold truncate max-w-[50px] inline-block">
                &lt;{selectedElement.tagName.toLowerCase()}&gt;
              </span>
            ) : (
              'Estilo'
            )}
          </span>
        </button>

        {/* 3. Insert Elements Button */}
        <button
          onClick={onOpenInsertModal}
          className="min-h-[44px] flex flex-col items-center justify-center py-1 px-2.5 rounded-[var(--cv-radius-control)] text-[var(--cv-color-text-muted)] hover:text-[var(--cv-color-text)] transition active:scale-95"
          title="Inserir cards, gráficos ou blocos"
        >
          <PlusCircle className="w-5 h-5 text-[var(--cv-color-accent)]" />
          <span className="text-[10px] mt-1 font-medium">Inserir</span>
        </button>

        {/* 4. Gemini AI Button */}
        <button
          onClick={onOpenAiModal}
          className="min-h-[44px] flex flex-col items-center justify-center py-1 px-2.5 rounded-[var(--cv-radius-control)] text-[var(--cv-color-accent-text)] hover:brightness-95 transition active:scale-95"
          title="Superpoderes de IA Gemini"
        >
          <div className="w-5 h-5 rounded-[var(--cv-radius-small)] bg-[var(--cv-color-accent)] text-[var(--cv-color-on-accent)] flex items-center justify-center shadow-xs">
            <Sparkles className="w-3.5 h-3.5" />
          </div>
          <span className="text-[10px] mt-1 font-semibold text-[var(--cv-color-accent-text)]">IA</span>
        </button>

        {/* 5. Present Fullscreen Button */}
        <button
          onClick={onStartPresentation}
          className="min-h-[44px] flex flex-col items-center justify-center py-1 px-2.5 rounded-[var(--cv-radius-control)] text-[var(--cv-color-text-muted)] hover:text-[var(--cv-color-accent)] transition active:scale-95"
          title="Apresentar em tela cheia"
        >
          <div className="w-5 h-5 rounded-[var(--cv-radius-small)] bg-[var(--cv-color-accent-soft)] text-[var(--cv-color-accent-text)] flex items-center justify-center shadow-xs">
            <Play className="w-3 h-3 fill-current ml-0.5" />
          </div>
          <span className="text-[10px] mt-1 font-medium">Apresentar</span>
        </button>
      </div>
    </nav>
  );
};
