import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  BarChart2,
  TrendingUp,
  PieChart,
  CircleDot,
  Radar,
  Plus,
  Trash2,
  Check,
  RotateCcw,
  Sliders,
  Palette,
  Sparkles,
  LayoutGrid,
} from 'lucide-react';
import { Chart } from 'chart.js/auto';
import { ChartConfig, ChartDataset } from '../types/presentation';
import { BUILTIN_CHART_PRESETS, createDefaultChartConfig } from '../utils/chartHelper';

interface ChartEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialConfig?: ChartConfig | null;
  canvasId?: string;
  onSaveChart: (config: ChartConfig, canvasId?: string) => void;
}

const COLOR_PALETTES = [
  { name: 'Casas Bahia Core', colors: ['#0033C6', '#DC2626', '#00174F', '#059669', '#D97706', '#64748B'] },
  { name: 'Oceano Corporativo', colors: ['#0284C7', '#0369A1', '#075985', '#38BDF8', '#BAE6FD'] },
  { name: 'Esmeralda & Crescimento', colors: ['#059669', '#10B981', '#34D399', '#6EE7B7', '#A7F3D0'] },
  { name: 'Performance de CX', colors: ['#059669', '#F59E0B', '#DC2626', '#0033C6', '#8B5CF6'] },
];

export const ChartEditorModal: React.FC<ChartEditorModalProps> = ({
  isOpen,
  onClose,
  initialConfig,
  canvasId,
  onSaveChart,
}) => {
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const chartInstanceRef = useRef<Chart | null>(null);

  // Active configuration state
  const [config, setConfig] = useState<ChartConfig>(() => {
    if (initialConfig) return JSON.parse(JSON.stringify(initialConfig));
    if (canvasId && BUILTIN_CHART_PRESETS[canvasId]) {
      return JSON.parse(JSON.stringify(BUILTIN_CHART_PRESETS[canvasId]));
    }
    return createDefaultChartConfig('bar');
  });

  const [activeTab, setActiveTab] = useState<'type' | 'data' | 'series' | 'axes'>('type');
  const [selectedDatasetIndex, setSelectedDatasetIndex] = useState(0);

  // Sync initial configuration whenever modal opens or initialConfig changes
  useEffect(() => {
    if (isOpen) {
      if (initialConfig) {
        setConfig(JSON.parse(JSON.stringify(initialConfig)));
      } else if (canvasId && BUILTIN_CHART_PRESETS[canvasId]) {
        setConfig(JSON.parse(JSON.stringify(BUILTIN_CHART_PRESETS[canvasId])));
      } else {
        setConfig(createDefaultChartConfig('bar'));
      }
      setSelectedDatasetIndex(0);
    }
  }, [isOpen, initialConfig, canvasId]);

  // Render / Update live preview Chart.js instance
  useEffect(() => {
    if (!isOpen || !previewCanvasRef.current) return;

    if (chartInstanceRef.current) {
      chartInstanceRef.current.destroy();
      chartInstanceRef.current = null;
    }

    try {
      const ctx = previewCanvasRef.current.getContext('2d');
      if (ctx) {
        chartInstanceRef.current = new Chart(ctx, {
          type: config.type,
          data: config.data as any,
          options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: { duration: 250 },
            plugins: {
              legend: {
                display: config.options?.plugins?.legend?.display !== false,
                position: config.options?.plugins?.legend?.position || 'top',
                labels: {
                  boxWidth: 12,
                  font: { family: 'Inter, sans-serif', size: 11 },
                  color: '#334155',
                },
              },
              tooltip: {
                callbacks: {
                  label: (ctx: any) => {
                    const suffix = config.suffix || '';
                    return ` ${ctx.dataset.label || ''}: ${ctx.parsed.y !== undefined ? ctx.parsed.y : ctx.parsed} ${suffix}`.trim();
                  },
                },
              },
            },
            scales:
              ['doughnut', 'pie', 'polarArea'].includes(config.type)
                ? undefined
                : {
                    y: {
                      min: config.options?.scales?.y?.min,
                      max: config.options?.scales?.y?.max,
                      ticks: {
                        callback: (v: any) => `${v} ${config.suffix || ''}`.trim(),
                        color: '#64748B',
                        font: { size: 10 },
                      },
                      grid: { color: '#E2E8F0' },
                    },
                    x: {
                      ticks: { color: '#64748B', font: { size: 10 } },
                      grid: { display: false },
                    },
                  },
          },
        });
      }
    } catch (err) {
      console.warn('Error rendering preview chart:', err);
    }

    return () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
        chartInstanceRef.current = null;
      }
    };
  }, [config, isOpen]);

  if (!isOpen) return null;

  // Chart type switcher
  const handleTypeChange = (newType: ChartConfig['type']) => {
    setConfig((prev) => {
      const updated = { ...prev, type: newType };
      // If changing to doughnut/pie, format single array background colors if needed
      if (['doughnut', 'pie', 'polarArea'].includes(newType)) {
        if (updated.data.datasets.length > 0 && !Array.isArray(updated.data.datasets[0].backgroundColor)) {
          const colors = ['#0033C6', '#DC2626', '#059669', '#F59E0B', '#64748B', '#8B5CF6'];
          updated.data.datasets[0].backgroundColor = updated.data.labels.map((_, i) => colors[i % colors.length]);
        }
      }
      return updated;
    });
  };

  // Load a preset template
  const handleApplyPreset = (presetKey: string) => {
    const preset = BUILTIN_CHART_PRESETS[presetKey];
    if (preset) {
      setConfig(JSON.parse(JSON.stringify(preset)));
      setSelectedDatasetIndex(0);
    }
  };

  // Update label
  const handleLabelChange = (index: number, newLabel: string) => {
    setConfig((prev) => {
      const labels = [...prev.data.labels];
      labels[index] = newLabel;
      return { ...prev, data: { ...prev.data, labels } };
    });
  };

  // Update value in dataset
  const handleValueChange = (datasetIdx: number, itemIdx: number, val: number) => {
    setConfig((prev) => {
      const datasets = [...prev.data.datasets];
      const data = [...datasets[datasetIdx].data];
      data[itemIdx] = isNaN(val) ? 0 : val;
      datasets[datasetIdx] = { ...datasets[datasetIdx], data };
      return { ...prev, data: { ...prev.data, datasets } };
    });
  };

  // Add data point
  const handleAddPoint = () => {
    setConfig((prev) => {
      const nextIndex = prev.data.labels.length + 1;
      const labels = [...prev.data.labels, `Ponto ${nextIndex}`];
      const datasets = prev.data.datasets.map((ds) => ({
        ...ds,
        data: [...ds.data, 50],
      }));
      return { ...prev, data: { ...prev.data, labels, datasets } };
    });
  };

  // Remove data point
  const handleRemovePoint = (index: number) => {
    if (config.data.labels.length <= 1) return;
    setConfig((prev) => {
      const labels = prev.data.labels.filter((_, i) => i !== index);
      const datasets = prev.data.datasets.map((ds) => ({
        ...ds,
        data: ds.data.filter((_, i) => i !== index),
      }));
      return { ...prev, data: { ...prev.data, labels, datasets } };
    });
  };

  // Add Dataset (Series)
  const handleAddDataset = () => {
    setConfig((prev) => {
      const colors = ['#0033C6', '#DC2626', '#059669', '#F59E0B', '#8B5CF6'];
      const nextColor = colors[prev.data.datasets.length % colors.length];
      const newDs: ChartDataset = {
        label: `Série ${prev.data.datasets.length + 1}`,
        data: prev.data.labels.map(() => Math.floor(Math.random() * 40 + 50)),
        borderColor: nextColor,
        backgroundColor: prev.type === 'line' ? 'transparent' : nextColor,
        borderWidth: 2,
        tension: 0.25,
      };
      return {
        ...prev,
        data: {
          ...prev.data,
          datasets: [...prev.data.datasets, newDs],
        },
      };
    });
    setSelectedDatasetIndex(config.data.datasets.length);
  };

  // Remove Dataset
  const handleRemoveDataset = (index: number) => {
    if (config.data.datasets.length <= 1) return;
    setConfig((prev) => ({
      ...prev,
      data: {
        ...prev.data,
        datasets: prev.data.datasets.filter((_, i) => i !== index),
      },
    }));
    setSelectedDatasetIndex(0);
  };

  // Update Dataset Props
  const handleUpdateDataset = (index: number, props: Partial<ChartDataset>) => {
    setConfig((prev) => {
      const datasets = [...prev.data.datasets];
      datasets[index] = { ...datasets[index], ...props };
      return { ...prev, data: { ...prev.data, datasets } };
    });
  };

  const currentDataset = config.data.datasets[selectedDatasetIndex] || config.data.datasets[0];

  return (
    <div className="fixed inset-0 z-50 bg-[var(--cv-color-scrim)] backdrop-blur-xs flex items-center justify-center p-3 sm:p-5">
      <div className="bg-[var(--cv-color-surface)] text-[var(--cv-color-text)] rounded-[var(--cv-radius-panel)] shadow-[var(--cv-shadow-floating)] border border-[var(--cv-color-border)] w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-150">
        {/* Top Header */}
        <div className="px-5 py-3.5 border-b border-[var(--cv-color-border)] flex items-center justify-between bg-[var(--cv-color-surface-subtle)]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-[var(--cv-radius-control)] bg-[var(--cv-color-accent)] flex items-center justify-center text-white shadow-xs">
              <BarChart2 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[var(--cv-color-text)] tracking-tight">Personalizar & Editar Gráfico</h2>
              <p className="text-[11px] text-[var(--cv-color-text-muted)]">
                Altere tipo, dados, cores e séries com visualização interativa instantânea
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[var(--cv-color-text-muted)] hover:text-[var(--cv-color-text)] hover:bg-[var(--cv-color-surface-hover)] rounded-[var(--cv-radius-control)] transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body: Split Live Preview and Controls */}
        <div className="flex-1 flex flex-col md:flex-row min-h-0 overflow-hidden">
          {/* Left: Real-time Live Chart Preview Panel */}
          <div className="w-full md:w-1/2 p-4 bg-[var(--cv-color-surface-subtle)] border-b md:border-b-0 md:border-r border-[var(--cv-color-border)] flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--cv-color-text-muted)]">
                  Pré-visualização em Tempo Real
                </span>
                <span className="text-[10px] font-semibold bg-[var(--cv-color-surface)] text-[var(--cv-color-accent)] px-2 py-0.5 rounded-[var(--cv-radius-badge)] border border-[var(--cv-color-border)]">
                  {config.type.toUpperCase()}
                </span>
              </div>

              {/* Title display */}
              <div className="mb-2">
                <input
                  type="text"
                  placeholder="Título do Gráfico (Opcional)"
                  value={config.customTitle || ''}
                  onChange={(e) => setConfig((prev) => ({ ...prev, customTitle: e.target.value }))}
                  className="w-full text-xs font-bold text-[var(--cv-color-text)] bg-transparent border-b border-dashed border-[var(--cv-color-border)] focus:border-[var(--cv-color-accent)] outline-none pb-1"
                />
              </div>
            </div>

            {/* Canvas Box */}
            <div className="flex-1 min-h-[220px] max-h-[340px] bg-[var(--cv-color-surface)] rounded-[var(--cv-radius-card)] border border-[var(--cv-color-border)] p-3 shadow-xs relative flex items-center justify-center">
              <canvas ref={previewCanvasRef} className="w-full h-full" />
            </div>

            <div className="mt-3 flex items-center justify-between text-[11px] text-[var(--cv-color-text-muted)]">
              <span>{config.data.labels.length} categorias cadastradas</span>
              <span>{config.data.datasets.length} série(s) de dados</span>
            </div>
          </div>

          {/* Right: Controls & Tabs */}
          <div className="w-full md:w-1/2 flex flex-col min-h-0 bg-[var(--cv-color-surface)]">
            {/* Tab navigation */}
            <div className="flex border-b border-[var(--cv-color-border)] px-4 pt-2 bg-[var(--cv-color-surface-subtle)] gap-2 shrink-0">
              <button
                onClick={() => setActiveTab('type')}
                className={`pb-2 px-2 text-xs font-semibold border-b-2 transition cursor-pointer ${
                  activeTab === 'type'
                    ? 'border-[var(--cv-color-accent)] text-[var(--cv-color-accent)]'
                    : 'border-transparent text-[var(--cv-color-text-muted)] hover:text-[var(--cv-color-text)]'
                }`}
              >
                Tipo & Modelos
              </button>
              <button
                onClick={() => setActiveTab('data')}
                className={`pb-2 px-2 text-xs font-semibold border-b-2 transition cursor-pointer ${
                  activeTab === 'data'
                    ? 'border-[var(--cv-color-accent)] text-[var(--cv-color-accent)]'
                    : 'border-transparent text-[var(--cv-color-text-muted)] hover:text-[var(--cv-color-text)]'
                }`}
              >
                Dados & Valores
              </button>
              <button
                onClick={() => setActiveTab('series')}
                className={`pb-2 px-2 text-xs font-semibold border-b-2 transition cursor-pointer ${
                  activeTab === 'series'
                    ? 'border-[var(--cv-color-accent)] text-[var(--cv-color-accent)]'
                    : 'border-transparent text-[var(--cv-color-text-muted)] hover:text-[var(--cv-color-text)]'
                }`}
              >
                Séries & Estilo
              </button>
              <button
                onClick={() => setActiveTab('axes')}
                className={`pb-2 px-2 text-xs font-semibold border-b-2 transition cursor-pointer ${
                  activeTab === 'axes'
                    ? 'border-[var(--cv-color-accent)] text-[var(--cv-color-accent)]'
                    : 'border-transparent text-[var(--cv-color-text-muted)] hover:text-[var(--cv-color-text)]'
                }`}
              >
                Eixos & Config
              </button>
            </div>

            {/* Tab 1: Types & Presets */}
            {activeTab === 'type' && (
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                <div>
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-2">
                    Escolha o Formato do Gráfico
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { type: 'bar', label: 'Barras', icon: BarChart2 },
                      { type: 'line', label: 'Linhas / Curvas', icon: TrendingUp },
                      { type: 'doughnut', label: 'Rosca', icon: CircleDot },
                      { type: 'pie', label: 'Pizza', icon: PieChart },
                      { type: 'polarArea', label: 'Área Polar', icon: CircleDot },
                      { type: 'radar', label: 'Radar', icon: Radar },
                    ].map((item) => (
                      <button
                        key={item.type}
                        onClick={() => handleTypeChange(item.type as any)}
                        className={`p-2.5 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition text-xs font-semibold ${
                          config.type === item.type
                            ? 'bg-blue-50 border-blue-500 text-blue-700 shadow-xs'
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <item.icon className="w-4 h-4" />
                        <span>{item.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-3">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-2">
                    Modelos Rápidos (Casas Bahia & NPS)
                  </label>
                  <div className="space-y-1.5">
                    <button
                      onClick={() => handleApplyPreset('chartEvolucaoNPS')}
                      className="w-full text-left p-2.5 rounded-xl border border-slate-200 hover:border-blue-300 hover:bg-blue-50/50 transition flex items-center justify-between"
                    >
                      <div>
                        <div className="text-xs font-bold text-slate-800">Evolução Mensal de NPS (2026)</div>
                        <div className="text-[10px] text-slate-500">Linha real (Jan a Out) + Meta tracejada de 75 pts</div>
                      </div>
                      <span className="text-xs text-blue-600 font-semibold">Usar ❯</span>
                    </button>
                    <button
                      onClick={() => handleApplyPreset('chartDiaSemana')}
                      className="w-full text-left p-2.5 rounded-xl border border-slate-200 hover:border-blue-300 hover:bg-blue-50/50 transition flex items-center justify-between"
                    >
                      <div>
                        <div className="text-xs font-bold text-slate-800">Estresse Operacional por Dia da Semana</div>
                        <div className="text-[10px] text-slate-500">Barras coloridas com destaque vermelho para Domingo</div>
                      </div>
                      <span className="text-xs text-blue-600 font-semibold">Usar ❯</span>
                    </button>
                    <button
                      onClick={() => handleApplyPreset('chartMixSatisfacao')}
                      className="w-full text-left p-2.5 rounded-xl border border-slate-200 hover:border-blue-300 hover:bg-blue-50/50 transition flex items-center justify-between"
                    >
                      <div>
                        <div className="text-xs font-bold text-slate-800">Mix de Satisfação (Promotores vs Neutros vs Detratores)</div>
                        <div className="text-[10px] text-slate-500">Gráfico de rosca com Verde (82%), Âmbar (8%) e Vermelho (10%)</div>
                      </div>
                      <span className="text-xs text-blue-600 font-semibold">Usar ❯</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Tab 2: Data Points & Values */}
            {activeTab === 'data' && (
              <div className="flex-1 overflow-y-auto p-4 flex flex-col">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    Categorias & Valores Numéricos
                  </span>
                  <button
                    onClick={handleAddPoint}
                    className="flex items-center gap-1 text-[11px] font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-2 py-1 rounded-md transition"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Adicionar Ponto</span>
                  </button>
                </div>

                {/* Table of labels and values */}
                <div className="flex-1 border border-slate-200 rounded-xl overflow-y-auto max-h-[300px]">
                  <table className="w-full text-xs">
                    <thead className="bg-slate-100 sticky top-0 border-b border-slate-200 text-slate-700 font-bold uppercase text-[10px]">
                      <tr>
                        <th className="p-2 text-left w-10">#</th>
                        <th className="p-2 text-left">Categoria / Rótulo</th>
                        {config.data.datasets.map((ds, idx) => (
                          <th key={idx} className="p-2 text-right">
                            {ds.label || `Série ${idx + 1}`}
                          </th>
                        ))}
                        <th className="p-2 text-center w-8"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {config.data.labels.map((label, itemIdx) => (
                        <tr key={itemIdx} className="hover:bg-slate-50">
                          <td className="p-2 text-slate-400 font-mono text-[10px]">{itemIdx + 1}</td>
                          <td className="p-1.5">
                            <input
                              type="text"
                              value={label}
                              onChange={(e) => handleLabelChange(itemIdx, e.target.value)}
                              className="w-full px-2 py-1 border border-slate-200 rounded text-xs outline-none focus:border-blue-500 bg-white"
                            />
                          </td>
                          {config.data.datasets.map((ds, dsIdx) => (
                            <td key={dsIdx} className="p-1.5 text-right">
                              <input
                                type="number"
                                step="any"
                                value={ds.data[itemIdx] ?? ''}
                                onChange={(e) => handleValueChange(dsIdx, itemIdx, parseFloat(e.target.value))}
                                className="w-20 px-2 py-1 border border-slate-200 rounded text-xs outline-none focus:border-blue-500 text-right font-mono bg-white"
                              />
                            </td>
                          ))}
                          <td className="p-1.5 text-center">
                            <button
                              onClick={() => handleRemovePoint(itemIdx)}
                              className="p-1 text-slate-300 hover:text-red-500 rounded transition"
                              title="Excluir ponto"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Tab 3: Series & Styling */}
            {activeTab === 'series' && (
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {/* Series Tabs */}
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {config.data.datasets.map((ds, idx) => (
                      <button
                        key={idx}
                        onClick={() => setSelectedDatasetIndex(idx)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                          selectedDatasetIndex === idx
                            ? 'bg-blue-600 text-white shadow-2xs'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {ds.label || `Série ${idx + 1}`}
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={handleAddDataset}
                    className="flex items-center gap-1 text-[11px] font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 px-2 py-1 rounded-md transition"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Nova Série</span>
                  </button>
                </div>

                {/* Series settings */}
                {currentDataset && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 mr-2">
                        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                          Nome da Série
                        </label>
                        <input
                          type="text"
                          value={currentDataset.label || ''}
                          onChange={(e) => handleUpdateDataset(selectedDatasetIndex, { label: e.target.value })}
                          className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs outline-none focus:border-blue-500"
                        />
                      </div>
                      {config.data.datasets.length > 1 && (
                        <button
                          onClick={() => handleRemoveDataset(selectedDatasetIndex)}
                          className="mt-5 p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition"
                          title="Remover série"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    {/* Color selection */}
                    <div>
                      <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                        Cor Primária da Série
                      </label>
                      <div className="flex items-center gap-2">
                        {['#0033C6', '#DC2626', '#059669', '#F59E0B', '#00174F', '#0284C7', '#8B5CF6', '#64748B'].map(
                          (color) => (
                            <button
                              key={color}
                              onClick={() => {
                                handleUpdateDataset(selectedDatasetIndex, {
                                  borderColor: color,
                                  backgroundColor: config.type === 'line' ? 'rgba(0,51,198,0.1)' : color,
                                  pointBackgroundColor: color,
                                });
                              }}
                              style={{ backgroundColor: color }}
                              className="w-6 h-6 rounded-full border-2 border-white shadow-xs hover:scale-110 transition shrink-0"
                            />
                          )
                        )}
                      </div>
                    </div>

                    {/* Specific line options */}
                    {config.type === 'line' && (
                      <div className="grid grid-cols-2 gap-3 pt-2">
                        <div>
                          <label className="text-[11px] font-bold text-slate-500 block mb-1">Preenchimento</label>
                          <button
                            onClick={() => handleUpdateDataset(selectedDatasetIndex, { fill: !currentDataset.fill })}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold w-full border ${
                              currentDataset.fill
                                ? 'bg-blue-50 border-blue-400 text-blue-700'
                                : 'bg-slate-50 border-slate-200 text-slate-600'
                            }`}
                          >
                            {currentDataset.fill ? 'Preenchido (Área)' : 'Apenas Linha'}
                          </button>
                        </div>
                        <div>
                          <label className="text-[11px] font-bold text-slate-500 block mb-1">Tracejado (Meta)</label>
                          <button
                            onClick={() =>
                              handleUpdateDataset(selectedDatasetIndex, {
                                borderDash: currentDataset.borderDash?.length ? [] : [5, 5],
                              })
                            }
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold w-full border ${
                              currentDataset.borderDash?.length
                                ? 'bg-blue-50 border-blue-400 text-blue-700'
                                : 'bg-slate-50 border-slate-200 text-slate-600'
                            }`}
                          >
                            {currentDataset.borderDash?.length ? 'Tracejado [5,5]' : 'Linha Contínua'}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Tab 4: Axes & Scale */}
            {activeTab === 'axes' && (
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                      Sufixo / Unidade
                    </label>
                    <input
                      type="text"
                      placeholder="ex: pts, %, R$"
                      value={config.suffix || ''}
                      onChange={(e) => setConfig((prev) => ({ ...prev, suffix: e.target.value }))}
                      className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                      Legenda
                    </label>
                    <select
                      value={config.options?.plugins?.legend?.position || 'top'}
                      onChange={(e) =>
                        setConfig((prev) => ({
                          ...prev,
                          options: {
                            ...prev.options,
                            plugins: {
                              ...prev.options?.plugins,
                              legend: {
                                ...prev.options?.plugins?.legend,
                                position: e.target.value,
                              },
                            },
                          },
                        }))
                      }
                      className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs outline-none focus:border-blue-500 bg-white"
                    >
                      <option value="top">Superior (Topo)</option>
                      <option value="bottom">Inferior (Rodapé)</option>
                      <option value="left">Esquerda</option>
                      <option value="right">Direita</option>
                    </select>
                  </div>
                </div>

                {/* Y-Axis Min / Max limits */}
                {!['doughnut', 'pie', 'polarArea'].includes(config.type) && (
                  <div className="border-t border-slate-100 pt-3">
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-2">
                      Limites do Eixo Vertical (Y)
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <span className="text-[10px] text-slate-500 block mb-0.5">Valor Mínimo</span>
                        <input
                          type="number"
                          placeholder="Automático"
                          value={config.options?.scales?.y?.min ?? ''}
                          onChange={(e) => {
                            const val = e.target.value === '' ? undefined : parseFloat(e.target.value);
                            setConfig((prev) => ({
                              ...prev,
                              options: {
                                ...prev.options,
                                scales: {
                                  ...prev.options?.scales,
                                  y: { ...prev.options?.scales?.y, min: val },
                                },
                              },
                            }));
                          }}
                          className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs font-mono outline-none focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 block mb-0.5">Valor Máximo</span>
                        <input
                          type="number"
                          placeholder="Automático"
                          value={config.options?.scales?.y?.max ?? ''}
                          onChange={(e) => {
                            const val = e.target.value === '' ? undefined : parseFloat(e.target.value);
                            setConfig((prev) => ({
                              ...prev,
                              options: {
                                ...prev.options,
                                scales: {
                                  ...prev.options?.scales,
                                  y: { ...prev.options?.scales?.y, max: val },
                                },
                              },
                            }));
                          }}
                          className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs font-mono outline-none focus:border-blue-500"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Bottom Actions */}
            <div className="p-3.5 border-t border-[var(--cv-color-border)] bg-[var(--cv-color-surface-subtle)] flex items-center justify-between shrink-0">
              <button
                onClick={onClose}
                className="px-3 py-1.5 rounded-[var(--cv-radius-control)] text-xs font-semibold text-[var(--cv-color-text-muted)] hover:text-[var(--cv-color-text)] hover:bg-[var(--cv-color-surface-hover)] transition cursor-pointer"
              >
                Cancelar
              </button>

              <button
                onClick={() => {
                  onSaveChart(config, canvasId);
                  onClose();
                }}
                className="flex items-center gap-1.5 px-4 py-2 rounded-[var(--cv-radius-control)] text-xs font-semibold bg-[var(--cv-color-accent)] text-white hover:opacity-90 shadow-xs transition active:scale-98 cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Aplicar no Slide</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
