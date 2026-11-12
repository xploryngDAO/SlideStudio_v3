import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  FileText,
  CheckCircle2,
  AlertCircle,
  X,
  Layers,
  Monitor,
  Smartphone,
  ArrowRight,
  Loader2,
  Sliders,
  Maximize2,
} from 'lucide-react';
import { importPptxToPresentation } from '../utils/pptxImport';
import { PresentationDoc } from '../types/presentation';

interface PptxImportModalProps {
  isOpen: boolean;
  file: File | null;
  onClose: () => void;
  onSuccess: (presentation: PresentationDoc) => void;
}

export const PptxImportModal: React.FC<PptxImportModalProps> = ({
  isOpen,
  file,
  onClose,
  onSuccess,
}) => {
  const [useAi, setUseAi] = useState(true);
  const [status, setStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [progressMsg, setProgressMsg] = useState('Pronto para iniciar...');
  const [progressPct, setProgressPct] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');
  const [importedDoc, setImportedDoc] = useState<PresentationDoc | null>(null);

  useEffect(() => {
    if (isOpen && file) {
      startImport();
    } else {
      setStatus('idle');
      setProgressMsg('Pronto para iniciar...');
      setProgressPct(0);
      setErrorMessage('');
      setImportedDoc(null);
    }
  }, [isOpen, file]);

  const startImport = async () => {
    if (!file) return;
    setStatus('processing');
    setProgressMsg('Iniciando análise da apresentação...');
    setProgressPct(5);
    setErrorMessage('');

    try {
      const doc = await importPptxToPresentation(file, {
        useAi,
        onProgress: (msg, pct) => {
          setProgressMsg(msg);
          setProgressPct(pct);
        },
      });

      setImportedDoc(doc);
      setStatus('success');
      setProgressMsg('Conversão concluída com sucesso!');
      setProgressPct(100);
    } catch (err: any) {
      console.error('Error importing PPTX:', err);
      setStatus('error');
      setErrorMessage(err.message || 'Falha ao processar arquivo PowerPoint.');
    }
  };

  const handleFinish = () => {
    if (importedDoc) {
      onSuccess(importedDoc);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[var(--cv-color-scrim)] backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-[var(--cv-color-surface)] text-[var(--cv-color-text)] border border-[var(--cv-color-border)] rounded-[var(--cv-radius-panel)] shadow-[var(--cv-shadow-floating)] overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-[var(--cv-color-border)] flex items-center justify-between bg-[var(--cv-color-surface-subtle)]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-[var(--cv-radius-control)] bg-[var(--cv-color-accent)] text-white flex items-center justify-center font-bold text-lg shadow-sm shrink-0">
              P
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-[var(--cv-color-text)] tracking-tight">
                  Importar PowerPoint (.pptx)
                </h3>
                <span className="px-2 py-0.5 rounded-[var(--cv-radius-badge)] bg-[var(--cv-color-surface)] text-[var(--cv-color-accent)] text-[10px] font-bold border border-[var(--cv-color-border)]">
                  Fiel em HTML & Mobile
                </span>
              </div>
              <p className="text-xs text-[var(--cv-color-text-muted)] mt-0.5 truncate max-w-sm">
                {file?.name || 'Apresentação PowerPoint'} •{' '}
                {file ? `${(file.size / (1024 * 1024)).toFixed(1)} MB` : ''}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-[var(--cv-radius-control)] text-[var(--cv-color-text-muted)] hover:text-[var(--cv-color-text)] hover:bg-[var(--cv-color-surface-hover)] transition cursor-pointer"
            title="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6">
          {/* Status Alert or Processing Indicator */}
          {status === 'processing' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-indigo-950/40 border border-indigo-500/30 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-7 h-7 rounded-lg bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center shrink-0">
                    <Sparkles className="w-4 h-4 text-indigo-400 animate-pulse" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-white flex items-center gap-1.5">
                      <span>Análise Semântica Ativa</span>
                      <span className="text-[9px] bg-indigo-500/20 text-indigo-300 px-1.5 py-0.5 rounded font-mono">
                        Gemini 3.8 Flash
                      </span>
                    </div>
                    <div className="text-[11px] text-indigo-200/80 truncate mt-0.5 font-medium">
                      {progressMsg}
                    </div>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <span className="font-mono text-sm text-indigo-300 font-bold">{progressPct}%</span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-700/50">
                <div
                  className="h-full bg-gradient-to-r from-blue-600 via-indigo-500 to-emerald-500 rounded-full transition-all duration-300 shadow-sm"
                  style={{ width: `${progressPct}%` }}
                />
              </div>

              {/* Steps Info */}
              <div className="grid grid-cols-3 gap-2 pt-1 text-[11px] text-slate-400">
                <div className={`flex items-center gap-1.5 ${progressPct >= 20 ? 'text-blue-400 font-semibold' : ''}`}>
                  <span className="w-1.5 h-1.5 rounded-full bg-current" />
                  <span>1. Descompactar</span>
                </div>
                <div className={`flex items-center gap-1.5 ${progressPct >= 30 && progressPct < 95 ? 'text-indigo-400 font-semibold' : progressPct >= 95 ? 'text-indigo-400 font-semibold' : ''}`}>
                  <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                  <span>2. Análise IA Slide a Slide</span>
                </div>
                <div className={`flex items-center gap-1.5 ${progressPct >= 95 ? 'text-emerald-400 font-semibold' : ''}`}>
                  <span className="w-1.5 h-1.5 rounded-full bg-current" />
                  <span>3. HTML & Mobile</span>
                </div>
              </div>
            </div>
          )}

          {status === 'success' && importedDoc && (
            <div className="space-y-5 animate-in fade-in duration-300">
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-start gap-3.5">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-bold text-white">Apresentação convertida com sucesso!</h4>
                  <p className="text-xs text-emerald-200/80 mt-1">
                    Detectados <strong>{importedDoc.slides.length} slides</strong> com estrutura
                    responsiva completa, tabelas, KPIs e suporte a visualização mobile.
                  </p>
                </div>
              </div>

              {/* Dual View Mock Preview */}
              <div className="bg-slate-950/70 rounded-xl p-4 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
                  <span className="flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-blue-400" />
                    <span>{importedDoc.title}</span>
                  </span>
                  <span className="text-[11px] text-slate-400 font-mono">
                    {importedDoc.slides.length} slides prontos
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div className="p-3 bg-slate-900 rounded-lg border border-slate-800 text-center">
                    <Monitor className="w-5 h-5 text-blue-400 mx-auto mb-1.5" />
                    <div className="text-xs font-bold text-white">Desktop 16:9</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">Layout Widescreen Executivo</div>
                  </div>
                  <div className="p-3 bg-slate-900 rounded-lg border border-slate-800 text-center">
                    <Smartphone className="w-5 h-5 text-emerald-400 mx-auto mb-1.5" />
                    <div className="text-xs font-bold text-white">Mobile 390px</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">Cards Empilhados & Legíveis</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {status === 'error' && (
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-3.5 text-rose-200">
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-bold text-white">Falha ao processar arquivo</h4>
                <p className="text-xs text-rose-200/90 mt-1">{errorMessage}</p>
                <button
                  onClick={startImport}
                  className="mt-3 text-xs font-bold text-rose-300 hover:text-white underline"
                >
                  Tentar novamente
                </button>
              </div>
            </div>
          )}

          {/* AI Settings Toggle */}
          <div className="pt-2 border-t border-slate-800">
            <label className="flex items-start gap-3 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={useAi}
                onChange={(e) => setUseAi(e.target.checked)}
                disabled={status === 'processing'}
                className="mt-1 w-4 h-4 rounded text-blue-600 bg-slate-800 border-slate-700 focus:ring-blue-500 focus:ring-offset-slate-900"
              />
              <div>
                <div className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Análise e refino inteligente com Gemini</span>
                  <span className="text-[9px] bg-indigo-500/30 text-indigo-300 font-bold px-1.5 py-0.2 rounded">
                    Recomendado
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                  Analisa a semântica de cada slide para reconstruir cartões KPI, tabelas estruturadas e
                  layouts fluidos que se adaptam automaticamente a telas de smartphone.
                </p>
              </div>
            </label>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-[var(--cv-color-surface-subtle)] border-t border-[var(--cv-color-border)] flex items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-[var(--cv-color-text-muted)] hover:text-[var(--cv-color-text)] hover:bg-[var(--cv-color-surface-hover)] rounded-[var(--cv-radius-control)] transition cursor-pointer"
          >
            Cancelar
          </button>

          {status === 'success' ? (
            <button
              onClick={handleFinish}
              className="px-5 py-2.5 rounded-[var(--cv-radius-control)] bg-[var(--cv-color-accent)] hover:opacity-90 text-white font-bold text-xs flex items-center gap-2 shadow-sm transition active:scale-98 cursor-pointer"
            >
              <span>Abrir Apresentação no Studio</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              disabled={status === 'processing'}
              onClick={startImport}
              className={`px-4 py-2 rounded-[var(--cv-radius-control)] text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                status === 'processing'
                  ? 'bg-[var(--cv-color-surface-hover)] text-[var(--cv-color-text-muted)] cursor-not-allowed'
                  : 'bg-[var(--cv-color-accent)] hover:opacity-90 text-white shadow-xs'
              }`}
            >
              {status === 'processing' ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Processando...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Converter Agora</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
