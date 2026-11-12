import React, { useState } from 'react';
import {
  X,
  Presentation,
  FileCode,
  Printer,
  Sparkles,
  Layers,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Download,
  Check,
} from 'lucide-react';
import { PresentationDoc, SlideData } from '../types/presentation';
import { exportPresentationToPptx, exportSlideToPptx, exportPresentationToPdf } from '../utils/pptxExport';
import { serializePresentationToHtml } from '../utils/slideParser';

export type ExportFormat = 'pptx-vector' | 'html' | 'pdf';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  presentation: PresentationDoc;
  activeSlideIndex: number;
  onShowToast: (message: string, type?: 'info' | 'success') => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  presentation,
  activeSlideIndex,
  onShowToast,
}) => {
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('pptx-vector');
  const [exportScope, setExportScope] = useState<'all' | 'current'>('all');
  const [customFileName, setCustomFileName] = useState(() => {
    return (presentation.title || 'apresentacao').toLowerCase().replace(/[^a-z0-9]/gi, '_');
  });

  const [isExporting, setIsExporting] = useState(false);
  const [progressMsg, setProgressMsg] = useState('');
  const [progressPct, setProgressPct] = useState(0);

  if (!isOpen) return null;

  const handleStartExport = async () => {
    setIsExporting(true);
    setProgressPct(10);
    setProgressMsg('Iniciando preparação dos arquivos...');

    const baseName = customFileName.trim() || 'apresentacao';
    const currentSlide = presentation.slides[activeSlideIndex] || presentation.slides[0];

    try {
      if (selectedFormat === 'pptx-vector') {
        setProgressMsg('Processando camadas e vetores editáveis do PowerPoint...');
        setProgressPct(30);

        if (exportScope === 'current') {
          await exportSlideToPptx(currentSlide, presentation, activeSlideIndex, {
            mode: 'vector',
            fileName: `${baseName}_slide_${activeSlideIndex + 1}_editavel.pptx`,
          });
        } else {
          await exportPresentationToPptx(presentation, {
            mode: 'vector',
            fileName: `${baseName}_editavel.pptx`,
            onProgress: (cur, tot) => {
              const pct = 30 + Math.round((cur / tot) * 65);
              setProgressPct(pct);
              setProgressMsg(`Convertendo slide ${cur} de ${tot} em camadas nativas...`);
            },
          });
        }
        setProgressPct(100);
        onShowToast('PowerPoint (.pptx) com camadas editáveis gerado com sucesso!');
      } else if (selectedFormat === 'html') {
        setProgressMsg('Compilando HTML auto-contido e estilos...');
        setProgressPct(60);

        let exportDoc = presentation;
        if (exportScope === 'current') {
          exportDoc = {
            ...presentation,
            slides: [currentSlide],
          };
        }

        const htmlString = serializePresentationToHtml(exportDoc);
        const blob = new Blob([htmlString], { type: 'text/html;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${baseName}${exportScope === 'current' ? `_slide_${activeSlideIndex + 1}` : ''}.html`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        setProgressPct(100);
        onShowToast('Arquivo HTML auto-contido baixado com sucesso!');
      } else if (selectedFormat === 'pdf') {
        setProgressMsg('Preparando layout para salvar em PDF / Imprimir...');
        setProgressPct(70);

        let exportDoc = presentation;
        if (exportScope === 'current') {
          exportDoc = {
            ...presentation,
            slides: [currentSlide],
          };
        }

        const htmlString = serializePresentationToHtml(exportDoc);
        await exportPresentationToPdf(htmlString);

        setProgressPct(100);
        onShowToast('Janela de impressão / salvar PDF aberta com sucesso!');
      }

      setTimeout(() => {
        setIsExporting(false);
        onClose();
      }, 400);
    } catch (err: any) {
      console.error('Erro ao exportar apresentação:', err);
      setIsExporting(false);
      onShowToast(`Falha na exportação: ${err?.message || 'Erro inesperado'}`, 'info');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-lg bg-[var(--cv-color-surface)] text-[var(--cv-color-text)] border border-[var(--cv-color-border)] rounded-[var(--cv-radius-panel)] shadow-[var(--cv-shadow-floating)] overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="px-6 py-4.5 border-b border-[var(--cv-color-border)] flex items-center justify-between bg-[var(--cv-color-surface-subtle)]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-[var(--cv-radius-control)] bg-[var(--cv-color-accent)] text-white flex items-center justify-center shadow-xs">
              <Download className="w-4.5 h-4.5" />
            </div>
            <div>
              <h3 className="text-sm font-bold tracking-tight">Exportar Apresentação</h3>
              <p className="text-[11px] text-[var(--cv-color-text-muted)]">
                Exporte em PowerPoint editável, HTML responsivo ou PDF
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isExporting}
            className="p-1.5 rounded-[var(--cv-radius-control)] text-[var(--cv-color-text-muted)] hover:text-[var(--cv-color-text)] hover:bg-[var(--cv-color-surface-hover)] transition cursor-pointer"
            title="Fechar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5">
          {/* Formats Grid */}
          <div className="space-y-2">
            <label className="text-[11px] font-bold text-[var(--cv-color-text-muted)] uppercase tracking-wider block">
              Selecione o Formato
            </label>
            <div className="grid grid-cols-1 gap-2.5">
              {/* Option 1: PowerPoint Editable Layers (Default & Recommended) */}
              <button
                type="button"
                onClick={() => setSelectedFormat('pptx-vector')}
                className={`w-full text-left p-3.5 rounded-xl border transition flex items-start gap-3 cursor-pointer ${
                  selectedFormat === 'pptx-vector'
                    ? 'border-[var(--cv-color-accent)] bg-[var(--cv-color-accent-soft)]/40 shadow-xs'
                    : 'border-[var(--cv-color-border)] bg-[var(--cv-color-surface)] hover:bg-[var(--cv-color-surface-subtle)]'
                }`}
              >
                <div className="w-8 h-8 rounded-lg bg-orange-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                  P
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-[var(--cv-color-text)]">
                      PowerPoint (.pptx) Editável
                    </span>
                    <span className="px-1.5 py-0.2 rounded text-[9px] font-extrabold uppercase bg-emerald-500/15 text-emerald-600 border border-emerald-500/30">
                      Recomendado
                    </span>
                  </div>
                  <p className="text-[11px] text-[var(--cv-color-text-muted)] mt-0.5 leading-relaxed">
                    Caixas de texto nativas, cartões, tabelas, formas e gráficos 100% editáveis no Microsoft PowerPoint.
                  </p>
                </div>
                <div className="shrink-0 pt-0.5">
                  <div
                    className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                      selectedFormat === 'pptx-vector'
                        ? 'border-[var(--cv-color-accent)] bg-[var(--cv-color-accent)] text-white'
                        : 'border-slate-300'
                    }`}
                  >
                    {selectedFormat === 'pptx-vector' && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                  </div>
                </div>
              </button>

              {/* Option 3: Standalone HTML */}
              <button
                type="button"
                onClick={() => setSelectedFormat('html')}
                className={`w-full text-left p-3.5 rounded-xl border transition flex items-start gap-3 cursor-pointer ${
                  selectedFormat === 'html'
                    ? 'border-[var(--cv-color-accent)] bg-[var(--cv-color-accent-soft)]/40 shadow-xs'
                    : 'border-[var(--cv-color-border)] bg-[var(--cv-color-surface)] hover:bg-[var(--cv-color-surface-subtle)]'
                }`}
              >
                <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <FileCode className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold text-[var(--cv-color-text)]">
                    Arquivo HTML Auto-contido (.html)
                  </div>
                  <p className="text-[11px] text-[var(--cv-color-text-muted)] mt-0.5 leading-relaxed">
                    Apresentação completa que abre diretamente em qualquer navegador, computador ou celular sem internet.
                  </p>
                </div>
                <div className="shrink-0 pt-0.5">
                  <div
                    className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                      selectedFormat === 'html'
                        ? 'border-[var(--cv-color-accent)] bg-[var(--cv-color-accent)] text-white'
                        : 'border-slate-300'
                    }`}
                  >
                    {selectedFormat === 'html' && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                  </div>
                </div>
              </button>

              {/* Option 4: PDF Print */}
              <button
                type="button"
                onClick={() => setSelectedFormat('pdf')}
                className={`w-full text-left p-3.5 rounded-xl border transition flex items-start gap-3 cursor-pointer ${
                  selectedFormat === 'pdf'
                    ? 'border-[var(--cv-color-accent)] bg-[var(--cv-color-accent-soft)]/40 shadow-xs'
                    : 'border-[var(--cv-color-border)] bg-[var(--cv-color-surface)] hover:bg-[var(--cv-color-surface-subtle)]'
                }`}
              >
                <div className="w-8 h-8 rounded-lg bg-sky-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <Printer className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold text-[var(--cv-color-text)]">
                    PDF Executivo / Impressão (.pdf)
                  </div>
                  <p className="text-[11px] text-[var(--cv-color-text-muted)] mt-0.5 leading-relaxed">
                    Abre a visualização de impressão nativa ajustada página por página em 16:9 para salvar em PDF.
                  </p>
                </div>
                <div className="shrink-0 pt-0.5">
                  <div
                    className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                      selectedFormat === 'pdf'
                        ? 'border-[var(--cv-color-accent)] bg-[var(--cv-color-accent)] text-white'
                        : 'border-slate-300'
                    }`}
                  >
                    {selectedFormat === 'pdf' && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Scope Selector */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-[var(--cv-color-text-muted)] uppercase tracking-wider block">
              Slides a Exportar
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setExportScope('all')}
                className={`p-2.5 rounded-lg border text-xs font-semibold flex items-center justify-center gap-2 transition cursor-pointer ${
                  exportScope === 'all'
                    ? 'border-[var(--cv-color-accent)] bg-[var(--cv-color-accent-soft)] text-[var(--cv-color-accent-text)]'
                    : 'border-[var(--cv-color-border)] text-[var(--cv-color-text-muted)] hover:bg-[var(--cv-color-surface-subtle)]'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Todos os Slides ({presentation.slides.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setExportScope('current')}
                className={`p-2.5 rounded-lg border text-xs font-semibold flex items-center justify-center gap-2 transition cursor-pointer ${
                  exportScope === 'current'
                    ? 'border-[var(--cv-color-accent)] bg-[var(--cv-color-accent-soft)] text-[var(--cv-color-accent-text)]'
                    : 'border-[var(--cv-color-border)] text-[var(--cv-color-text-muted)] hover:bg-[var(--cv-color-surface-subtle)]'
                }`}
              >
                <span>Apenas Slide Atual ({activeSlideIndex + 1})</span>
              </button>
            </div>
          </div>

          {/* File Name */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-[var(--cv-color-text-muted)] uppercase tracking-wider block">
              Nome do Arquivo
            </label>
            <input
              type="text"
              value={customFileName}
              onChange={(e) => setCustomFileName(e.target.value)}
              className="w-full px-3 py-2 text-xs font-medium rounded-lg border border-[var(--cv-color-border)] bg-[var(--cv-color-surface-subtle)] text-[var(--cv-color-text)] outline-none focus:border-[var(--cv-color-accent)]"
              placeholder="Nome do arquivo..."
            />
          </div>

          {/* Export Progress if active */}
          {isExporting && (
            <div className="space-y-2 pt-2 animate-in fade-in duration-200">
              <div className="flex items-center justify-between text-xs text-[var(--cv-color-text)] font-semibold">
                <span className="flex items-center gap-1.5">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-[var(--cv-color-accent)]" />
                  <span>{progressMsg}</span>
                </span>
                <span className="font-mono text-[var(--cv-color-accent)] font-bold">{progressPct}%</span>
              </div>
              <div className="w-full h-2 bg-[var(--cv-color-surface-subtle)] rounded-full overflow-hidden border border-[var(--cv-color-border)]">
                <div
                  className="h-full bg-[var(--cv-color-accent)] rounded-full transition-all duration-300"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-[var(--cv-color-surface-subtle)] border-t border-[var(--cv-color-border)] flex items-center justify-between gap-3">
          <button
            onClick={onClose}
            disabled={isExporting}
            className="px-4 py-2 text-xs font-semibold text-[var(--cv-color-text-muted)] hover:text-[var(--cv-color-text)] hover:bg-[var(--cv-color-surface-hover)] rounded-[var(--cv-radius-control)] transition cursor-pointer"
          >
            Cancelar
          </button>

          <button
            onClick={handleStartExport}
            disabled={isExporting}
            className="px-5 py-2.5 rounded-[var(--cv-radius-control)] bg-[var(--cv-color-accent)] hover:opacity-90 text-white font-bold text-xs flex items-center gap-2 shadow-xs transition active:scale-98 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isExporting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Exportando...</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>Baixar Apresentação</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
