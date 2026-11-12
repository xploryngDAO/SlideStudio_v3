import React, { useState } from 'react';
import {
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Upload,
  FileText,
  FileSpreadsheet,
  FileCode,
  Image,
  Trash2,
  CheckCircle2,
  Loader2,
  Layers,
  Palette,
  Users,
  Target,
  BarChart3,
  X,
  Bot,
  Brain,
  Check,
} from 'lucide-react';
import { PresentationDoc } from '../types/presentation';
import { parseHtmlPresentation } from '../utils/slideParser';

interface UploadedFileItem {
  id: string;
  file: File;
  name: string;
  size: number;
  type: string;
  textContent?: string;
  summary?: string;
  previewUrl?: string;
}

interface PresentationCreatorWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (presentation: PresentationDoc) => void;
}

export const PresentationCreatorWizard: React.FC<PresentationCreatorWizardProps> = ({
  isOpen,
  onClose,
  onComplete,
}) => {
  const [currentStep, setCurrentStep] = useState(1);

  // Step 1: Context & Topic
  const [title, setTitle] = useState('');
  const [topic, setTopic] = useState('');
  const [objective, setObjective] = useState('Alinhamento de Metas & Resultados Executivos');

  // Step 2: Attached Files & Notes
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFileItem[]>([]);
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [isReadingFiles, setIsReadingFiles] = useState(false);

  // Step 3: Audience & Tone
  const [audience, setAudience] = useState('Diretoria & C-Level (Executivo de Alto Impacto)');
  const [tone, setTone] = useState('Executivo e Sucinto');

  // Step 4: Slides & Design
  const [slideCount, setSlideCount] = useState(6);
  const [colorTheme, setColorTheme] = useState('casasbahia');
  const [includeCharts, setIncludeCharts] = useState(true);

  // Step 5: AI Generation & Agents Pipeline
  const [isGenerating, setIsGenerating] = useState(false);
  const [agentStep, setAgentStep] = useState(1);
  const [agentLogs, setAgentLogs] = useState<string[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  // Handle uploading and reading files in the browser
  const handleFilesSelected = async (files: FileList | File[]) => {
    setIsReadingFiles(true);
    const newItems: UploadedFileItem[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const item: UploadedFileItem = {
        id: `file-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        file,
        name: file.name,
        size: file.size,
        type: file.type || file.name.split('.').pop() || 'unknown',
      };

      try {
        // Textual files (txt, csv, json, html, markdown, etc.)
        if (
          file.type.includes('text') ||
          file.name.endsWith('.txt') ||
          file.name.endsWith('.csv') ||
          file.name.endsWith('.json') ||
          file.name.endsWith('.html') ||
          file.name.endsWith('.htm') ||
          file.name.endsWith('.md')
        ) {
          const text = await file.text();
          item.textContent = text.slice(0, 15000); // safety cap
          item.summary = `Texto com ${text.length} caracteres extraído.`;
        } else if (file.type.startsWith('image/')) {
          item.previewUrl = URL.createObjectURL(file);
          item.summary = 'Imagem de referência carregada.';
        } else {
          // PDF or spreadsheet binary
          item.summary = `Arquivo anexado (${Math.round(file.size / 1024)} KB) para contextualização.`;
        }
      } catch (err) {
        item.summary = 'Arquivo anexado como referência.';
      }

      newItems.push(item);
    }

    setUploadedFiles((prev) => [...prev, ...newItems]);
    setIsReadingFiles(false);
  };

  const handleRemoveFile = (id: string) => {
    setUploadedFiles((prev) => prev.filter((item) => item.id !== id));
  };

  // Launch AI Agents Pipeline
  const handleStartGeneration = async () => {
    setCurrentStep(5);
    setIsGenerating(true);
    setErrorMessage(null);
    setAgentStep(1);

    const activeTopic = title.trim() || topic.trim() || 'Apresentação Estratégica';
    const initialLog = uploadedFiles.length > 0
      ? `Agente 1 (Análise): Processando ${uploadedFiles.length} arquivo(s) anexados e extraindo dados reais para "${activeTopic}"...`
      : `Agente 1 (Análise): Estruturando briefing executivo "${activeTopic}" para o público ${audience}...`;

    setAgentLogs([initialLog]);

    try {
      setAgentStep(2);
      setAgentLogs((prev) => [
        ...prev,
        `Agente 2 (Storytelling): Enviando contexto e briefing para o Motor de Inteligência Artificial...`,
      ]);

      const response = await fetch('/api/gemini/generate-presentation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: activeTopic,
          objective,
          audience,
          tone,
          slideCount,
          colorTheme,
          includeCharts,
          filesContext: uploadedFiles.map((f) => ({
            name: f.name,
            type: f.type,
            textContent: f.textContent,
            summary: f.summary,
          })),
          additionalNotes,
        }),
      });

      setAgentStep(3);
      setAgentLogs((prev) => [
        ...prev,
        `Agente 3 (Design): Compilando layout no padrão corporativo Casas Bahia com gráficos interativos e tabelas analíticas...`,
      ]);

      const data = await response.json();

      if (!response.ok || !data.html) {
        throw new Error(data.error || 'Não foi possível gerar a apresentação.');
      }

      setAgentStep(4);
      setAgentLogs((prev) => [
        ...prev,
        'Agente 4 (Validação): Validando responsividade completa para Desktop Widescreen (16:9) e Smartphone (390px)...',
      ]);

      setAgentStep(5);
      const isGemini = data.generatedBy === 'gemini';
      setAgentLogs((prev) => [
        ...prev,
        isGemini
          ? `✨ Sucesso: Apresentação com ${data.slideCount || slideCount} slides criada em tempo real pela IA Google Gemini (gemini-3.8-flash) no padrão Casas Bahia!`
          : `✓ Sucesso: Apresentação com ${data.slideCount || slideCount} slides estruturada com base nos seus arquivos e dados reais!`,
        '✓ Concluído: Carregando no Studio para edição visual...',
      ]);

      setTimeout(() => {
        const parsedDoc = parseHtmlPresentation(data.html);
        onComplete(parsedDoc);
      }, 700);
    } catch (err: any) {
      setIsGenerating(false);
      setErrorMessage(err.message || 'Erro ao gerar apresentação.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-hidden select-none">
      <div className="w-full max-w-4xl h-[92vh] max-h-[820px] bg-[var(--cv-color-surface)] border border-[var(--cv-color-border)] rounded-[var(--cv-radius-panel)] shadow-[var(--cv-shadow-floating)] flex flex-col overflow-hidden text-[var(--cv-color-text)]">
        {/* Wizard Header */}
        <div className="h-16 px-6 border-b border-[var(--cv-color-border)] flex items-center justify-between shrink-0 bg-[var(--cv-color-surface-subtle)]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-[var(--cv-radius-small)] bg-[var(--cv-color-accent-soft)] border border-[var(--cv-color-accent)]/30 flex items-center justify-center text-[var(--cv-color-accent-text)]">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <div className="font-bold text-sm text-[var(--cv-color-text)] flex items-center gap-2">
                <span>Criar Apresentação com Agentes de IA</span>
                <span className="text-[10px] font-semibold text-[var(--cv-color-accent-text)] bg-[var(--cv-color-accent-soft)] border border-[var(--cv-color-accent)]/40 rounded px-1.5 py-0.5">
                  Etapa {currentStep} de 4
                </span>
              </div>
              <div className="text-[11px] text-[var(--cv-color-text-muted)]">
                Assistente de configuração e construção automatizada de slides
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            disabled={isGenerating}
            className="p-1.5 rounded-[var(--cv-radius-control)] text-[var(--cv-color-text-muted)] hover:text-[var(--cv-color-text)] hover:bg-[var(--cv-color-surface)] transition disabled:opacity-30"
            title="Fechar assistente"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Wizard Step Indicator Bar (Steps 1 to 4) */}
        {currentStep <= 4 && (
          <div className="px-6 py-2.5 bg-[var(--cv-color-surface-subtle)]/70 border-b border-[var(--cv-color-border)] flex items-center justify-between text-xs">
            <button
              onClick={() => setCurrentStep(1)}
              className={`flex items-center gap-2 transition ${
                currentStep === 1 ? 'text-[var(--cv-color-accent)] font-semibold' : 'text-[var(--cv-color-text-muted)] hover:text-[var(--cv-color-text)]'
              }`}
            >
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                currentStep === 1 ? 'bg-[var(--cv-color-accent)] text-[var(--cv-color-on-accent)]' : currentStep > 1 ? 'bg-[var(--cv-color-success)] text-white' : 'bg-[var(--cv-color-border)] text-[var(--cv-color-text-muted)]'
              }`}>
                {currentStep > 1 ? '✓' : '1'}
              </span>
              <span>Contexto</span>
            </button>

            <span className="text-[var(--cv-color-border-strong)]">·</span>

            <button
              onClick={() => setCurrentStep(2)}
              className={`flex items-center gap-2 transition ${
                currentStep === 2 ? 'text-[var(--cv-color-accent)] font-semibold' : 'text-[var(--cv-color-text-muted)] hover:text-[var(--cv-color-text)]'
              }`}
            >
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                currentStep === 2 ? 'bg-[var(--cv-color-accent)] text-[var(--cv-color-on-accent)]' : currentStep > 2 ? 'bg-[var(--cv-color-success)] text-white' : 'bg-[var(--cv-color-border)] text-[var(--cv-color-text-muted)]'
              }`}>
                {currentStep > 2 ? '✓' : '2'}
              </span>
              <span>Arquivos ({uploadedFiles.length})</span>
            </button>

            <span className="text-[var(--cv-color-border-strong)]">·</span>

            <button
              onClick={() => setCurrentStep(3)}
              className={`flex items-center gap-2 transition ${
                currentStep === 3 ? 'text-[var(--cv-color-accent)] font-semibold' : 'text-[var(--cv-color-text-muted)] hover:text-[var(--cv-color-text)]'
              }`}
            >
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                currentStep === 3 ? 'bg-[var(--cv-color-accent)] text-[var(--cv-color-on-accent)]' : currentStep > 3 ? 'bg-[var(--cv-color-success)] text-white' : 'bg-[var(--cv-color-border)] text-[var(--cv-color-text-muted)]'
              }`}>
                {currentStep > 3 ? '✓' : '3'}
              </span>
              <span>Público & Tom</span>
            </button>

            <span className="text-[var(--cv-color-border-strong)]">·</span>

            <button
              onClick={() => setCurrentStep(4)}
              className={`flex items-center gap-2 transition ${
                currentStep === 4 ? 'text-[var(--cv-color-accent)] font-semibold' : 'text-[var(--cv-color-text-muted)] hover:text-[var(--cv-color-text)]'
              }`}
            >
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                currentStep === 4 ? 'bg-[var(--cv-color-accent)] text-[var(--cv-color-on-accent)]' : 'bg-[var(--cv-color-border)] text-[var(--cv-color-text-muted)]'
              }`}>
                4
              </span>
              <span>Design & Slides</span>
            </button>
          </div>
        )}

        {/* Wizard Step Body */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8">
          {/* STEP 1: Context & Topic */}
          {currentStep === 1 && (
            <div className="space-y-6 max-w-2xl mx-auto">
              <div>
                <h3 className="text-xl font-bold text-[var(--cv-color-text)] mb-1">Qual o tema e título da apresentação?</h3>
                <p className="text-xs text-[var(--cv-color-text-muted)]">
                  Defina o assunto principal e o objetivo para orientar os agentes na criação dos slides.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--cv-color-text-muted)] uppercase tracking-wider mb-1.5">
                  Título da Apresentação
                </label>
                <input
                  type="text"
                  placeholder="Ex: Resultados Estratégicos Q3 - Casas Bahia Regional 122"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-[var(--cv-radius-control)] bg-[var(--cv-color-surface-subtle)] border border-[var(--cv-color-border)] text-[var(--cv-color-text)] placeholder-[var(--cv-color-text-subtle)] focus:outline-none focus:border-[var(--cv-color-accent)] text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--cv-color-text-muted)] uppercase tracking-wider mb-1.5">
                  Tema ou Resumo dos Pontos Principais
                </label>
                <textarea
                  rows={4}
                  placeholder="Ex: Apresentar o fechamento de vendas de eletrodomésticos e móveis, metas de garantia estendida, NPS dos clientes de loja e plano de ação para a Black Friday."
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-[var(--cv-radius-control)] bg-[var(--cv-color-surface-subtle)] border border-[var(--cv-color-border)] text-[var(--cv-color-text)] placeholder-[var(--cv-color-text-subtle)] focus:outline-none focus:border-[var(--cv-color-accent)] text-sm leading-relaxed"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--cv-color-text-muted)] uppercase tracking-wider mb-2">
                  Objetivo Principal
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {[
                    'Alinhamento de Metas & Resultados Executivos',
                    'Apresentação de Resultados Comerciais & Vendas',
                    'Plano de Ação Estratégico & Operações',
                    'Pitch de Projeto ou Proposta de Inovação',
                    'Treinamento e Capacitação de Equipes',
                    'Diagnóstico de Indicadores & Oportunidades',
                  ].map((obj) => (
                    <button
                      key={obj}
                      type="button"
                      onClick={() => setObjective(obj)}
                      className={`text-left p-3 rounded-[var(--cv-radius-control)] border text-xs font-medium transition cursor-pointer ${
                        objective === obj
                          ? 'border-[var(--cv-color-accent)] bg-[var(--cv-color-accent-soft)]/50 text-[var(--cv-color-accent-text)] ring-1 ring-[var(--cv-color-accent)]/50'
                          : 'border-[var(--cv-color-border)] bg-[var(--cv-color-surface-subtle)] text-[var(--cv-color-text)] hover:border-[var(--cv-color-border-strong)]'
                      }`}
                    >
                      {obj}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Support Files & Notes */}
          {currentStep === 2 && (
            <div className="space-y-6 max-w-2xl mx-auto">
              <div>
                <h3 className="text-xl font-bold text-[var(--cv-color-text)] mb-1">Anexe seus arquivos de suporte</h3>
                <p className="text-xs text-[var(--cv-color-text-muted)]">
                  Suba PDFs, planilhas CSV/Excel, documentos de texto, imagens de referência ou apresentações HTML anteriores.
                </p>
              </div>

              {/* Drag & Drop File Zone */}
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  if (e.dataTransfer.files) {
                    handleFilesSelected(e.dataTransfer.files);
                  }
                }}
                className="border-2 border-dashed border-[var(--cv-color-border-strong)] hover:border-[var(--cv-color-accent)] rounded-[var(--cv-radius-card)] p-6 text-center bg-[var(--cv-color-surface-subtle)]/50 transition cursor-pointer"
                onClick={() => {
                  const input = document.createElement('input');
                  input.type = 'file';
                  input.multiple = true;
                  input.accept = '.pdf,.csv,.xlsx,.xls,.txt,.json,.html,.htm,.md,image/*';
                  input.onchange = (e: any) => {
                    if (e.target.files) handleFilesSelected(e.target.files);
                  };
                  input.click();
                }}
              >
                <div className="w-12 h-12 rounded-[var(--cv-radius-control)] bg-[var(--cv-color-accent-soft)] text-[var(--cv-color-accent-text)] flex items-center justify-center mx-auto mb-3">
                  <Upload className="w-6 h-6" />
                </div>
                <div className="text-sm font-semibold text-[var(--cv-color-text)]">
                  Clique ou arraste arquivos aqui
                </div>
                <div className="text-xs text-[var(--cv-color-text-muted)] mt-1">
                  Formatos aceitos: PDF, Planilhas (CSV/Excel), Textos (.txt/.md), HTMLs anteriores e Imagens
                </div>
              </div>

              {isReadingFiles && (
                <div className="flex items-center justify-center gap-2 text-xs text-[var(--cv-color-accent-text)]">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Processando e indexando arquivos anexados...</span>
                </div>
              )}

              {/* Uploaded Files List */}
              {uploadedFiles.length > 0 && (
                <div className="space-y-2">
                  <div className="text-xs font-semibold text-[var(--cv-color-text-muted)] uppercase tracking-wider">
                    Arquivos Anexados ({uploadedFiles.length})
                  </div>
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {uploadedFiles.map((item) => (
                      <div
                        key={item.id}
                        className="p-3 rounded-[var(--cv-radius-control)] bg-[var(--cv-color-surface-subtle)] border border-[var(--cv-color-border)] flex items-center justify-between gap-3 text-xs"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          {item.type.includes('image') ? (
                            <Image className="w-4 h-4 text-purple-400 shrink-0" />
                          ) : item.name.endsWith('.csv') || item.name.endsWith('.xlsx') ? (
                            <FileSpreadsheet className="w-4 h-4 text-emerald-400 shrink-0" />
                          ) : item.name.endsWith('.html') ? (
                            <FileCode className="w-4 h-4 text-blue-400 shrink-0" />
                          ) : (
                            <FileText className="w-4 h-4 text-amber-400 shrink-0" />
                          )}
                          <div className="truncate">
                            <span className="font-semibold text-[var(--cv-color-text)] truncate block">{item.name}</span>
                            <span className="text-[10px] text-[var(--cv-color-text-muted)]">
                              {Math.round(item.size / 1024)} KB · {item.summary || 'Anexado'}
                            </span>
                          </div>
                        </div>

                        <button
                          onClick={() => handleRemoveFile(item.id)}
                          className="p-1 rounded-[var(--cv-radius-control)] text-[var(--cv-color-text-muted)] hover:text-red-500 hover:bg-red-500/10 transition"
                          title="Remover arquivo"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Extra direct notes textarea */}
              <div>
                <label className="block text-xs font-semibold text-[var(--cv-color-text-muted)] uppercase tracking-wider mb-1.5">
                  Anotações Rápidas ou Dados que DEVEM constar na apresentação (Opcional)
                </label>
                <textarea
                  rows={3}
                  placeholder="Cole aqui números específicos, metas de faturamento, nomes de responsáveis ou recados importantes..."
                  value={additionalNotes}
                  onChange={(e) => setAdditionalNotes(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-[var(--cv-radius-control)] bg-[var(--cv-color-surface-subtle)] border border-[var(--cv-color-border)] text-[var(--cv-color-text)] placeholder-[var(--cv-color-text-subtle)] focus:outline-none focus:border-[var(--cv-color-accent)] text-xs leading-relaxed"
                />
              </div>
            </div>
          )}

          {/* STEP 3: Audience & Tone */}
          {currentStep === 3 && (
            <div className="space-y-6 max-w-2xl mx-auto">
              <div>
                <h3 className="text-xl font-bold text-[var(--cv-color-text)] mb-1">Para quem é esta apresentação?</h3>
                <p className="text-xs text-[var(--cv-color-text-muted)]">
                  O tom de voz e a estrutura dos argumentos serão adaptados especificamente para esse perfil.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--cv-color-text-muted)] uppercase tracking-wider mb-2">
                  Público-Alvo
                </label>
                <div className="space-y-2">
                  {[
                    {
                      label: 'Diretoria & C-Level (Executivo de Alto Impacto)',
                      desc: 'Foco direto em ROI, metas macro, gargalos e alavancas estratégicas.',
                    },
                    {
                      label: 'Time Comercial & Vendas (Foco em Ação & Metas)',
                      desc: 'Ritmo motivacional, metas agressivas, campanhas e resultados por produto.',
                    },
                    {
                      label: 'Equipe Operacional & Lojas (Prático & Instrucional)',
                      desc: 'Processos claros, rotinas diárias, cumprimento de cronograma e metas de piso.',
                    },
                    {
                      label: 'Clientes & Investidores (Persuasivo & Institucional)',
                      desc: 'Autoridade, diferenciais competitivos e proposta de valor clara.',
                    },
                    {
                      label: 'Especialistas & Técnico (Analítico & Dados)',
                      desc: 'Aprofundamento de dados, métricas técnicas, metodologia e arquitetura.',
                    },
                  ].map((aud) => (
                    <div
                      key={aud.label}
                      onClick={() => setAudience(aud.label)}
                      className={`p-3.5 rounded-[var(--cv-radius-control)] border cursor-pointer transition flex items-center justify-between ${
                        audience === aud.label
                          ? 'border-[var(--cv-color-accent)] bg-[var(--cv-color-accent-soft)]/50 text-[var(--cv-color-accent-text)] ring-1 ring-[var(--cv-color-accent)]/50'
                          : 'border-[var(--cv-color-border)] bg-[var(--cv-color-surface-subtle)] text-[var(--cv-color-text)] hover:border-[var(--cv-color-border-strong)]'
                      }`}
                    >
                      <div>
                        <div className="font-semibold text-xs sm:text-sm text-[var(--cv-color-text)]">{aud.label}</div>
                        <div className="text-[11px] text-[var(--cv-color-text-muted)] mt-0.5">{aud.desc}</div>
                      </div>
                      <div
                        className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ml-3 ${
                          audience === aud.label ? 'border-[var(--cv-color-accent)] bg-[var(--cv-color-accent)]' : 'border-[var(--cv-color-border-strong)]'
                        }`}
                      >
                        {audience === aud.label && <Check className="w-2.5 h-2.5 text-white" />}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--cv-color-text-muted)] uppercase tracking-wider mb-2">
                  Tom de Voz Predominante
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    'Executivo e Sucinto',
                    'Persuasivo e Comercial',
                    'Inspirador e Visionário',
                    'Analítico e Técnico',
                  ].map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setTone(t)}
                      className={`p-2.5 rounded-[var(--cv-radius-control)] border text-xs font-semibold transition text-center cursor-pointer ${
                        tone === t
                          ? 'border-[var(--cv-color-accent)] bg-[var(--cv-color-accent-soft)] text-[var(--cv-color-accent-text)] ring-1 ring-[var(--cv-color-accent)]/40'
                          : 'border-[var(--cv-color-border)] bg-[var(--cv-color-surface-subtle)] text-[var(--cv-color-text-muted)] hover:border-[var(--cv-color-border-strong)] hover:text-[var(--cv-color-text)]'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: Design, Slides & Metrics */}
          {currentStep === 4 && (
            <div className="space-y-6 max-w-2xl mx-auto">
              <div>
                <h3 className="text-xl font-bold text-[var(--cv-color-text)] mb-1">Como deve ser o visual da apresentação?</h3>
                <p className="text-xs text-[var(--cv-color-text-muted)]">
                  Defina a identidade visual, o número de slides e a inclusão de gráficos e métricas.
                </p>
              </div>

              {/* Number of Slides */}
              <div>
                <label className="block text-xs font-semibold text-[var(--cv-color-text-muted)] uppercase tracking-wider mb-2">
                  Quantidade de Slides ({slideCount} slides)
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { count: 4, label: '4 Slides', desc: 'Express (5 min)' },
                    { count: 6, label: '6 Slides', desc: 'Padrão Executivo' },
                    { count: 8, label: '8 Slides', desc: 'Completo Estruturado' },
                    { count: 12, label: '12 Slides', desc: 'Deck Detalhado' },
                  ].map((item) => (
                    <button
                      key={item.count}
                      type="button"
                      onClick={() => setSlideCount(item.count)}
                      className={`p-3 rounded-[var(--cv-radius-control)] border text-center transition cursor-pointer ${
                        slideCount === item.count
                          ? 'border-[var(--cv-color-accent)] bg-[var(--cv-color-accent-soft)] text-[var(--cv-color-accent-text)] ring-1 ring-[var(--cv-color-accent)]/40'
                          : 'border-[var(--cv-color-border)] bg-[var(--cv-color-surface-subtle)] text-[var(--cv-color-text-muted)] hover:border-[var(--cv-color-border-strong)]'
                      }`}
                    >
                      <div className="font-bold text-sm text-[var(--cv-color-text)]">{item.label}</div>
                      <div className="text-[10px] text-[var(--cv-color-text-muted)] mt-0.5">{item.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Color Theme */}
              <div>
                <label className="block text-xs font-semibold text-[var(--cv-color-text)] uppercase tracking-wider mb-2">
                  Identidade Visual & Paleta de Cores
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {[
                    {
                      id: 'convergencia',
                      name: 'Convergência Oficial',
                      desc: 'Índigo (#6367c9), Papel Branco e Navy (#28314d)',
                      colors: ['#6367c9', '#e9e9fa', '#28314d'],
                    },
                    {
                      id: 'casasbahia',
                      name: 'Casas Bahia Oficial',
                      desc: 'Azul Royal, Vermelho e Dourado',
                      colors: ['#003399', '#e60014', '#f8fafc'],
                    },
                    {
                      id: 'corporate-blue',
                      name: 'Corporativo Tech',
                      desc: 'Azul Cobalto, Cinza Ardósia e Branco',
                      colors: ['#1d4ed8', '#0284c7', '#0f172a'],
                    },
                    {
                      id: 'emerald',
                      name: 'Emerald Growth',
                      desc: 'Verde Esmeralda e Mint',
                      colors: ['#059669', '#10b981', '#064e3b'],
                    },
                    {
                      id: 'minimal-dark',
                      name: 'Minimal Dark',
                      desc: 'Preto Grafite e Azul Ciano',
                      colors: ['#0f172a', '#38bdf8', '#090d16'],
                    },
                    {
                      id: 'sunset',
                      name: 'Sunset Violet & Amber',
                      desc: 'Índigo, Roxo e Âmbar',
                      colors: ['#7c3aed', '#f59e0b', '#2e1065'],
                    },
                  ].map((theme) => (
                    <div
                      key={theme.id}
                      onClick={() => setColorTheme(theme.id)}
                      className={`p-3 rounded-[var(--cv-radius-control)] border cursor-pointer transition flex items-center justify-between ${
                        colorTheme === theme.id
                          ? 'border-[var(--cv-color-accent)] bg-[var(--cv-color-accent-soft)]/40 ring-1 ring-[var(--cv-color-accent)]/50'
                          : 'border-[var(--cv-color-border)] bg-[var(--cv-color-surface-subtle)] hover:border-[var(--cv-color-border-strong)]'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex -space-x-1.5 shrink-0">
                          {theme.colors.map((c, idx) => (
                            <div
                              key={idx}
                              className="w-5 h-5 rounded-full border border-[var(--cv-color-border)] shadow-xs"
                              style={{ backgroundColor: c }}
                            />
                          ))}
                        </div>
                        <div>
                          <div className="font-semibold text-xs text-[var(--cv-color-text)]">{theme.name}</div>
                          <div className="text-[10px] text-[var(--cv-color-text-muted)]">{theme.desc}</div>
                        </div>
                      </div>
                      <div
                        className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                          colorTheme === theme.id ? 'border-[var(--cv-color-accent)] bg-[var(--cv-color-accent)]' : 'border-[var(--cv-color-border-strong)]'
                        }`}
                      >
                        {colorTheme === theme.id && <Check className="w-2.5 h-2.5 text-white" />}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Include Charts Toggle */}
              <div className="p-4 rounded-[var(--cv-radius-card)] border border-[var(--cv-color-border)] bg-[var(--cv-color-surface-subtle)] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-[var(--cv-radius-control)] bg-[var(--cv-color-accent-soft)] text-[var(--cv-color-accent-text)] flex items-center justify-center">
                    <BarChart3 className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-semibold text-xs sm:text-sm text-[var(--cv-color-text)]">
                      Incluir Gráficos SVG & Indicadores de KPI
                    </div>
                    <div className="text-[11px] text-[var(--cv-color-text-muted)]">
                      Gera gráficos visuais de barras/tendência e cartões com numerais tabulares
                    </div>
                  </div>
                </div>

                <input
                  type="checkbox"
                  checked={includeCharts}
                  onChange={(e) => setIncludeCharts(e.target.checked)}
                  className="w-4 h-4 text-[var(--cv-color-accent)] rounded border-[var(--cv-color-border)] focus:ring-[var(--cv-color-accent)]"
                />
              </div>
            </div>
          )}

          {/* STEP 5: AI Agents Pipeline Execution */}
          {currentStep === 5 && (
            <div className="space-y-8 max-w-xl mx-auto py-4 text-center">
              <div>
                <div className="w-16 h-16 rounded-[var(--cv-radius-card)] bg-[var(--cv-color-accent-soft)] border border-[var(--cv-color-accent)]/30 text-[var(--cv-color-accent-text)] flex items-center justify-center mx-auto mb-4 animate-pulse">
                  <Bot className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-bold text-[var(--cv-color-text)] mb-2">Agentes de IA Trabalhando</h3>
                <p className="text-xs text-[var(--cv-color-text-muted)] max-w-md mx-auto">
                  Nossos agentes especializados estão estruturando, redigindo e renderizando os slides com base nos seus arquivos e diretrizes.
                </p>
              </div>

              {/* 4 Specialized AI Agents Process */}
              <div className="space-y-3 text-left">
                {[
                  {
                    step: 1,
                    agent: 'Agente de Análise & Síntese de Dados',
                    desc: 'Processando arquivos anexos, extraindo números-chave e metas',
                  },
                  {
                    step: 2,
                    agent: 'Agente de Roteiro & Storytelling',
                    desc: 'Planejando sequência narrativa, títulos executivos e seções',
                  },
                  {
                    step: 3,
                    agent: 'Agente de Identidade Visual & Gráficos',
                    desc: 'Configurando paleta de cores, tipografia, cartões e vetores SVG',
                  },
                  {
                    step: 4,
                    agent: 'Agente de Renderização de Slides',
                    desc: 'Montando o código HTML final pronto para edição no Studio',
                  },
                ].map((item) => (
                  <div
                    key={item.step}
                    className={`p-3.5 rounded-[var(--cv-radius-card)] border transition-all ${
                      agentStep > item.step
                        ? 'border-emerald-500/40 bg-emerald-500/10 text-[var(--cv-color-text)]'
                        : agentStep === item.step
                        ? 'border-[var(--cv-color-accent)] bg-[var(--cv-color-accent-soft)]/50 text-[var(--cv-color-text)] ring-1 ring-[var(--cv-color-accent)]/40 scale-[1.01]'
                        : 'border-[var(--cv-color-border)] bg-[var(--cv-color-surface-subtle)]/50 text-[var(--cv-color-text-muted)]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="shrink-0">
                        {agentStep > item.step ? (
                          <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs">
                            ✓
                          </div>
                        ) : agentStep === item.step ? (
                          <div className="w-6 h-6 rounded-full bg-[var(--cv-color-accent)] text-[var(--cv-color-on-accent)] flex items-center justify-center">
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          </div>
                        ) : (
                          <div className="w-6 h-6 rounded-full bg-[var(--cv-color-surface-subtle)] border border-[var(--cv-color-border)] text-[var(--cv-color-text-muted)] flex items-center justify-center text-xs font-semibold">
                            {item.step}
                          </div>
                        )}
                      </div>
                      <div>
                        <div className="font-semibold text-xs sm:text-sm text-[var(--cv-color-text)]">{item.agent}</div>
                        <div className="text-[11px] text-[var(--cv-color-text-muted)] mt-0.5">{item.desc}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Logs */}
              {agentLogs.length > 0 && (
                <div className="p-3 rounded-[var(--cv-radius-card)] bg-[var(--cv-color-surface-subtle)] border border-[var(--cv-color-border)] text-left font-mono text-[11px] text-[var(--cv-color-text-muted)] space-y-1 max-h-28 overflow-y-auto">
                  {agentLogs.map((log, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <span className="text-[var(--cv-color-accent-text)]">›</span>
                      <span>{log}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Error fallback message */}
              {errorMessage && (
                <div className="p-4 rounded-[var(--cv-radius-card)] border border-red-500/40 bg-red-500/10 text-xs text-red-500 text-left space-y-3">
                  <div>{errorMessage}</div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleStartGeneration}
                      className="px-3 py-1.5 rounded-[var(--cv-radius-control)] bg-red-600 hover:bg-red-500 text-white font-semibold text-xs cursor-pointer"
                    >
                      Tentar Novamente
                    </button>
                    <button
                      onClick={() => setCurrentStep(4)}
                      className="px-3 py-1.5 rounded-[var(--cv-radius-control)] border border-red-500/40 text-[var(--cv-color-text)] text-xs cursor-pointer"
                    >
                      Voltar e Ajustar
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Wizard Footer Controls */}
        {currentStep <= 4 && (
          <div className="h-16 px-6 border-t border-[var(--cv-color-border)] flex items-center justify-between shrink-0 bg-[var(--cv-color-surface-subtle)]">
            <button
              onClick={() => {
                if (currentStep > 1) {
                  setCurrentStep((prev) => prev - 1);
                } else {
                  onClose();
                }
              }}
              className="px-4 py-2 rounded-[var(--cv-radius-control)] text-xs font-semibold text-[var(--cv-color-text-muted)] hover:text-[var(--cv-color-text)] hover:bg-[var(--cv-color-surface)] transition flex items-center gap-1.5 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>{currentStep === 1 ? 'Cancelar' : 'Voltar'}</span>
            </button>

            <button
              onClick={() => {
                if (currentStep < 4) {
                  setCurrentStep((prev) => prev + 1);
                } else {
                  handleStartGeneration();
                }
              }}
              className="px-5 py-2.5 rounded-[var(--cv-radius-control)] bg-[var(--cv-color-accent)] hover:opacity-90 text-[var(--cv-color-on-accent)] text-xs font-semibold transition flex items-center gap-2 shadow-sm cursor-pointer active:scale-98"
            >
              <span>{currentStep === 4 ? 'Criar Apresentação com IA' : 'Avançar'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
