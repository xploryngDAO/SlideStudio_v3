import React, { useState } from 'react';
import { X, Copy, Check, Code, FileText } from 'lucide-react';
import { SlideData } from '../types/presentation';

interface CodeViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentSlide: SlideData;
  fullHtml: string;
  onUpdateCurrentSlideHtml: (newHtml: string) => void;
}

export const CodeViewModal: React.FC<CodeViewModalProps> = ({
  isOpen,
  onClose,
  currentSlide,
  fullHtml,
  onUpdateCurrentSlideHtml,
}) => {
  const [activeTab, setActiveTab] = useState<'currentSlide' | 'fullDeck'>('currentSlide');
  const [slideHtmlInput, setSlideHtmlInput] = useState(currentSlide.htmlContent);
  const [copied, setCopied] = useState(false);

  React.useEffect(() => {
    setSlideHtmlInput(currentSlide.htmlContent);
  }, [currentSlide.htmlContent]);

  if (!isOpen) return null;

  const handleCopy = () => {
    const textToCopy = activeTab === 'currentSlide' ? slideHtmlInput : fullHtml;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleApplySlideCode = () => {
    onUpdateCurrentSlideHtml(slideHtmlInput);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-[var(--cv-color-scrim)] backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[var(--cv-color-surface)] text-[var(--cv-color-text)] rounded-[var(--cv-radius-panel)] shadow-[var(--cv-shadow-floating)] border border-[var(--cv-color-border)] w-full max-w-4xl overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[var(--cv-color-border)] flex items-center justify-between bg-[var(--cv-color-surface-subtle)]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-[var(--cv-radius-control)] bg-[var(--cv-color-accent)] text-white flex items-center justify-center shadow-xs">
              <Code className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[var(--cv-color-text)] tracking-tight">Editor de Código HTML</h2>
              <p className="text-xs text-[var(--cv-color-text-muted)]">Inspecione ou edite a estrutura HTML bruta dos slides</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--cv-radius-control)] text-xs font-semibold bg-[var(--cv-color-surface)] border border-[var(--cv-color-border)] hover:bg-[var(--cv-color-surface-hover)] text-[var(--cv-color-text)] transition cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copiado!' : 'Copiar'}</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-[var(--cv-radius-control)] text-[var(--cv-color-text-muted)] hover:text-[var(--cv-color-text)] hover:bg-[var(--cv-color-surface-hover)] transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab switch */}
        <div className="flex border-b border-[var(--cv-color-border)] bg-[var(--cv-color-surface-subtle)] px-6 gap-2">
          <button
            onClick={() => setActiveTab('currentSlide')}
            className={`py-2.5 px-3 text-xs font-semibold border-b-2 transition cursor-pointer ${
              activeTab === 'currentSlide'
                ? 'border-[var(--cv-color-accent)] text-[var(--cv-color-accent)] bg-[var(--cv-color-surface)]'
                : 'border-transparent text-[var(--cv-color-text-muted)] hover:text-[var(--cv-color-text)]'
            }`}
          >
            HTML do Slide Atual ({currentSlide.title})
          </button>
          <button
            onClick={() => setActiveTab('fullDeck')}
            className={`py-2.5 px-3 text-xs font-semibold border-b-2 transition cursor-pointer ${
              activeTab === 'fullDeck'
                ? 'border-[var(--cv-color-accent)] text-[var(--cv-color-accent)] bg-[var(--cv-color-surface)]'
                : 'border-transparent text-[var(--cv-color-text-muted)] hover:text-[var(--cv-color-text)]'
            }`}
          >
            HTML Completo da Apresentação
          </button>
        </div>

        {/* Editor Body */}
        <div className="p-4 flex-1 overflow-hidden flex flex-col bg-[#0b0f19]">
          {activeTab === 'currentSlide' ? (
            <textarea
              className="w-full flex-1 bg-transparent text-emerald-400 font-mono text-xs p-2 outline-none resize-none border-0 leading-relaxed selection:bg-[var(--cv-color-accent)]/40"
              value={slideHtmlInput}
              onChange={(e) => setSlideHtmlInput(e.target.value)}
              spellCheck={false}
            />
          ) : (
            <textarea
              readOnly
              className="w-full flex-1 bg-transparent text-emerald-400 font-mono text-xs p-2 outline-none resize-none border-0 leading-relaxed selection:bg-[var(--cv-color-accent)]/40"
              value={fullHtml}
              spellCheck={false}
            />
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-[var(--cv-color-border)] bg-[var(--cv-color-surface-subtle)] flex items-center justify-between">
          <span className="text-xs text-[var(--cv-color-text-muted)]">
            {activeTab === 'currentSlide'
              ? 'Edições feitas aqui serão refletidas visualmente no slide.'
              : 'Código completo pronto para exportação.'}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-[var(--cv-color-text-muted)] hover:text-[var(--cv-color-text)] hover:bg-[var(--cv-color-surface-hover)] rounded-[var(--cv-radius-control)] transition cursor-pointer"
            >
              Fechar
            </button>
            {activeTab === 'currentSlide' && (
              <button
                onClick={handleApplySlideCode}
                className="px-4 py-2 text-xs font-bold text-white bg-[var(--cv-color-accent)] hover:opacity-90 rounded-[var(--cv-radius-control)] shadow-xs transition active:scale-95 cursor-pointer"
              >
                Aplicar Alterações
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
