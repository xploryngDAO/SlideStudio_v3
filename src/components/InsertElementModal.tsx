import React from 'react';
import {
  X,
  CreditCard,
  Columns,
  ListOrdered,
  Quote,
  Table,
  BarChart,
  Image,
  Sliders,
  CheckCircle,
  TrendingUp,
  FileCode
} from 'lucide-react';

interface InsertElementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInsertHtml: (html: string) => void;
}

const TEMPLATE_ELEMENTS = [
  {
    category: 'Formas & Textos Estilo PowerPoint',
    items: [
      {
        title: 'Caixa de Texto Editável',
        icon: FileCode,
        description: 'Caixa de texto nativa com bordas sutis e tipografia ajustada.',
        html: `
<div class="p-4 my-3 bg-white/90 rounded-xl border border-slate-200/90 shadow-2xs max-w-xl">
  <p class="text-sm text-slate-800 leading-relaxed font-normal">
    Insira aqui o seu parágrafo ou argumento executivo. Dê duplo clique no slide para editar o texto livremente.
  </p>
</div>
        `.trim(),
      },
      {
        title: 'Título Executivo com Subtítulo',
        icon: Sliders,
        description: 'Cabeçalho de slide com hierarquia tipográfica clara.',
        html: `
<div class="my-4 space-y-1.5 max-w-3xl">
  <div class="text-[11px] font-extrabold uppercase tracking-wider text-blue-600">Categoria / Diretoria</div>
  <h2 class="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight leading-snug">
    Título de Destaque da Seção
  </h2>
  <p class="text-xs sm:text-sm text-slate-600 leading-relaxed">
    Subtítulo descritivo com contexto executivo, objetivos estratégicos e escopo da análise.
  </p>
</div>
        `.trim(),
      },
      {
        title: 'Cartão de Conteúdo com Borda Colorida',
        icon: CreditCard,
        description: 'Cartão com destaque lateral colorido para resumos e notas.',
        html: `
<div class="p-5 my-4 bg-white rounded-2xl border-l-4 border-l-blue-600 border border-slate-200 shadow-2xs w-full">
  <span class="text-[10px] font-bold uppercase tracking-wider text-blue-600 block mb-1">Destaque Operacional</span>
  <h4 class="text-base font-extrabold text-slate-900 mb-1.5">Conclusão Estratégica</h4>
  <p class="text-xs text-slate-600 leading-relaxed">
    Este cartão pode ser redimensionado, duplicado e reorganizado livremente na tela com snapping magnético.
  </p>
</div>
        `.trim(),
      },
      {
        title: 'Badge / Pílula de Status',
        icon: CheckCircle,
        description: 'Indicador visual de status com ponto animado.',
        html: `
<div class="my-3 inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold shadow-2xs">
  <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
  <span>STATUS: ENTREGUE CONFORME O SLA</span>
</div>
        `.trim(),
      },
      {
        title: 'Divisor Executivo de Seção',
        icon: Sliders,
        description: 'Linha elegante com etiqueta central para separar tópicos.',
        html: `
<div class="my-4 w-full flex items-center gap-3 select-none">
  <div class="h-px bg-slate-200 flex-1"></div>
  <span class="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">Próxima Etapa</span>
  <div class="h-px bg-slate-200 flex-1"></div>
</div>
        `.trim(),
      },
    ],
  },
  {
    category: 'Métricas & Indicadores',
    items: [
      {
        title: 'Card de KPI Único',
        icon: TrendingUp,
        description: 'Métrica com valor em destaque, título e percentual de crescimento.',
        html: `
<div class="p-6 bg-slate-50 rounded-2xl border border-slate-200/80 shadow-sm max-w-sm my-4">
  <span class="text-xs font-bold uppercase tracking-wider text-slate-400">Receita Anual (ARR)</span>
  <div class="text-4xl font-extrabold text-slate-900 mt-2">R$ 18,4 M</div>
  <div class="flex items-center gap-1.5 mt-3 text-xs font-bold text-emerald-600">
    <span class="bg-emerald-100 px-2 py-0.5 rounded-full">▲ +28,5%</span>
    <span class="text-slate-500 font-normal">vs. ano anterior</span>
  </div>
</div>
        `.trim(),
      },
      {
        title: 'Grade de 3 Indicadores',
        icon: CreditCard,
        description: '3 cartões de indicadores alinhados horizontalmente.',
        html: `
<div class="grid grid-cols-3 gap-4 my-4 w-full">
  <div class="p-5 bg-slate-50 rounded-xl border border-slate-200">
    <span class="text-xs font-bold uppercase text-slate-400">Novos Clientes</span>
    <div class="text-3xl font-extrabold text-slate-900 mt-1">+1.420</div>
    <span class="text-xs text-emerald-600 font-bold mt-1 block">▲ +15% no mês</span>
  </div>
  <div class="p-5 bg-slate-50 rounded-xl border border-slate-200">
    <span class="text-xs font-bold uppercase text-slate-400">NPS Global</span>
    <div class="text-3xl font-extrabold text-blue-600 mt-1">84 / 100</div>
    <span class="text-xs text-slate-500 font-normal mt-1 block">Zona de Excelência</span>
  </div>
  <div class="p-5 bg-slate-50 rounded-xl border border-slate-200">
    <span class="text-xs font-bold uppercase text-slate-400">Eficiência</span>
    <div class="text-3xl font-extrabold text-slate-900 mt-1">99,8%</div>
    <span class="text-xs text-emerald-600 font-bold mt-1 block">SLA cumprido</span>
  </div>
</div>
        `.trim(),
      },
      {
        title: 'Grade de 4 Métricas (KPIs)',
        icon: CreditCard,
        description: '4 métricas em grade fluida para visão executiva rápida.',
        html: `
<div class="grid grid-cols-4 gap-3 my-4 w-full">
  <div class="p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
    <span class="text-[10px] font-bold uppercase text-slate-400 block">Vendas Totais</span>
    <div class="text-2xl font-black text-slate-900 mt-1">R$ 4,8 M</div>
    <span class="text-[10px] text-emerald-600 font-bold mt-1 block">▲ +12% Meta</span>
  </div>
  <div class="p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
    <span class="text-[10px] font-bold uppercase text-slate-400 block">Ticket Médio</span>
    <div class="text-2xl font-black text-blue-600 mt-1">R$ 1.840</div>
    <span class="text-[10px] text-blue-600 font-bold mt-1 block">+8,4% no mês</span>
  </div>
  <div class="p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
    <span class="text-[10px] font-bold uppercase text-slate-400 block">Conversão</span>
    <div class="text-2xl font-black text-slate-900 mt-1">4,2%</div>
    <span class="text-[10px] text-slate-500 font-medium mt-1 block">Benchmark: 3,8%</span>
  </div>
  <div class="p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
    <span class="text-[10px] font-bold uppercase text-slate-400 block">CSAT / NPS</span>
    <div class="text-2xl font-black text-emerald-600 mt-1">88 pts</div>
    <span class="text-[10px] text-emerald-600 font-bold mt-1 block">Excelente</span>
  </div>
</div>
        `.trim(),
      },
    ],
  },
  {
    category: 'Layouts & Comparativos',
    items: [
      {
        title: 'Comparativo Lado a Lado (2 Colunas)',
        icon: Columns,
        description: 'Ideal para antes vs. depois, vantagens vs. desafios.',
        html: `
<div class="grid grid-cols-2 gap-6 my-4 w-full">
  <div class="p-6 bg-slate-50 rounded-2xl border border-slate-200">
    <div class="flex items-center gap-2 mb-3">
      <span class="w-3 h-3 rounded-full bg-slate-400"></span>
      <h3 class="text-lg font-bold text-slate-800">Cenário Tradicional</h3>
    </div>
    <ul class="space-y-2 text-xs text-slate-600">
      <li>• Processos manuais propensos a retrabalho</li>
      <li>• Alto tempo de resposta a demandas críticas</li>
      <li>• Custos operacionais elevados</li>
    </ul>
  </div>
  <div class="p-6 bg-blue-50/70 rounded-2xl border border-blue-200">
    <div class="flex items-center gap-2 mb-3">
      <span class="w-3 h-3 rounded-full bg-blue-600"></span>
      <h3 class="text-lg font-bold text-blue-950">Novo Modelo Automatizado</h3>
    </div>
    <ul class="space-y-2 text-xs text-blue-900">
      <li>• Redução de 80% no tempo de ciclo operacional</li>
      <li>• Padronização com auditoria em tempo real</li>
      <li>• Escalabilidade ilimitada sem gargalos</li>
    </ul>
  </div>
</div>
        `.trim(),
      },
      {
        title: '3 Pilares Estratégicos',
        icon: ListOrdered,
        description: 'Três blocos verticais numerados com títulos e descrições.',
        html: `
<div class="grid grid-cols-3 gap-6 my-4 w-full">
  <div class="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm">
    <div class="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 font-extrabold flex items-center justify-center text-sm mb-3">01</div>
    <h4 class="text-sm font-bold text-slate-900 mb-1.5">Foco no Cliente</h4>
    <p class="text-xs text-slate-500 leading-relaxed">Personalização de jornada orientada por inteligência preditiva.</p>
  </div>
  <div class="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm">
    <div class="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 font-extrabold flex items-center justify-center text-sm mb-3">02</div>
    <h4 class="text-sm font-bold text-slate-900 mb-1.5">Excelência Operacional</h4>
    <p class="text-xs text-slate-500 leading-relaxed">Simplificação contínua de fluxos de decisão e entregas ágeis.</p>
  </div>
  <div class="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm">
    <div class="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 font-extrabold flex items-center justify-center text-sm mb-3">03</div>
    <h4 class="text-sm font-bold text-slate-900 mb-1.5">Crescimento Sustentável</h4>
    <p class="text-xs text-slate-500 leading-relaxed">Equilíbrio rigoroso entre expansão de mercado e rentabilidade de caixa.</p>
  </div>
</div>
        `.trim(),
      },
    ],
  },
  {
    category: 'Destaques, Tabelas & Mídia',
    items: [
      {
        title: 'Caixa de Destaque / Callout',
        icon: Quote,
        description: 'Citação executiva ou lembrete de alto impacto.',
        html: `
<div class="p-5 my-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-blue-600 rounded-r-xl w-full">
  <div class="text-xs font-bold uppercase tracking-wider text-blue-700 mb-1">💡 Conclusão Principal</div>
  <p class="text-sm text-slate-800 font-medium italic">
    "A convergência de automação e dados reduziu em 64% o tempo gasto pela liderança em tarefas rotineiras neste trimestre."
  </p>
</div>
        `.trim(),
      },
      {
        title: 'Tabela de Dados Financeiros / Metas',
        icon: Table,
        description: 'Tabela elegante com cabeçalho e linhas zebradas.',
        html: `
<div class="my-4 overflow-hidden rounded-xl border border-slate-200 w-full">
  <table class="w-full text-left text-xs">
    <thead class="bg-slate-100 text-slate-700 font-bold uppercase text-[10px]">
      <tr>
        <th class="p-3">Unidade de Negócio</th>
        <th class="p-3">Meta Anual</th>
        <th class="p-3">Realizado (YTD)</th>
        <th class="p-3 text-right">Atingimento</th>
      </tr>
    </thead>
    <tbody class="divide-y divide-slate-100 text-slate-600 bg-white">
      <tr>
        <td class="p-3 font-semibold text-slate-800">Software & SaaS</td>
        <td class="p-3">R$ 12,0 M</td>
        <td class="p-3 font-bold text-emerald-600">R$ 13,4 M</td>
        <td class="p-3 text-right font-bold text-emerald-600">111%</td>
      </tr>
      <tr class="bg-slate-50/50">
        <td class="p-3 font-semibold text-slate-800">Serviços Profissionais</td>
        <td class="p-3">R$ 6,5 M</td>
        <td class="p-3 font-bold text-blue-600">R$ 6,2 M</td>
        <td class="p-3 text-right font-bold text-blue-600">95%</td>
      </tr>
    </tbody>
  </table>
</div>
        `.trim(),
      },
      {
        title: 'Gráfico Vetorial SVG (Barras Rápidas)',
        icon: BarChart,
        description: 'Gráfico vetorial leve e estilizado.',
        html: `
<div class="my-4 p-4 bg-slate-50 rounded-xl border border-slate-200 w-full">
  <div class="text-xs font-bold text-slate-700 mb-2">Desempenho por Trimestre</div>
  <svg viewBox="0 0 400 120" class="w-full h-24">
    <line x1="20" y1="100" x2="380" y2="100" stroke="#cbd5e1" stroke-width="1" />
    <rect x="50" y="50" width="36" height="50" rx="4" fill="#94a3b8" />
    <text x="68" y="115" text-anchor="middle" font-size="10" fill="#64748b">Q1</text>
    <rect x="130" y="35" width="36" height="65" rx="4" fill="#94a3b8" />
    <text x="148" y="115" text-anchor="middle" font-size="10" fill="#64748b">Q2</text>
    <rect x="210" y="20" width="36" height="80" rx="4" fill="#3b82f6" />
    <text x="228" y="115" text-anchor="middle" font-size="10" fill="#2563eb" font-weight="bold">Q3</text>
    <rect x="290" y="10" width="36" height="90" rx="4" fill="#10b981" />
    <text x="308" y="115" text-anchor="middle" font-size="10" fill="#059669" font-weight="bold">Q4 (Proj)</text>
  </svg>
</div>
        `.trim(),
      },
    ],
  },
];

export const InsertElementModal: React.FC<InsertElementModalProps> = ({
  isOpen,
  onClose,
  onInsertHtml,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-[var(--cv-color-scrim)] backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[var(--cv-color-surface)] text-[var(--cv-color-text)] rounded-[var(--cv-radius-panel)] shadow-[var(--cv-shadow-floating)] border border-[var(--cv-color-border)] w-full max-w-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[var(--cv-color-border)] flex items-center justify-between bg-[var(--cv-color-surface-subtle)]">
          <div>
            <h2 className="text-base font-bold text-[var(--cv-color-text)] tracking-tight">Biblioteca de Elementos</h2>
            <p className="text-xs text-[var(--cv-color-text-muted)]">
              Selecione um bloco pré-formatado para inserir instantaneamente no seu slide
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-[var(--cv-radius-control)] text-[var(--cv-color-text-muted)] hover:text-[var(--cv-color-text)] hover:bg-[var(--cv-color-surface-hover)] transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {TEMPLATE_ELEMENTS.map((section, sIdx) => (
            <div key={sIdx} className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--cv-color-text-muted)]">
                {section.category}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {section.items.map((item, iIdx) => {
                  const Icon = item.icon;
                  return (
                    <div
                      key={iIdx}
                      onClick={() => {
                        onInsertHtml(item.html);
                        onClose();
                      }}
                      className="group p-4 rounded-[var(--cv-radius-card)] border border-[var(--cv-color-border)] hover:border-[var(--cv-color-accent)] bg-[var(--cv-color-surface)] hover:bg-[var(--cv-color-surface-hover)] cursor-pointer transition shadow-xs hover:shadow-md flex flex-col justify-between"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-[var(--cv-radius-control)] bg-[var(--cv-color-surface-subtle)] text-[var(--cv-color-accent)] group-hover:bg-[var(--cv-color-accent)] group-hover:text-white flex items-center justify-center shrink-0 transition">
                          <Icon className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-[var(--cv-color-text)] group-hover:text-[var(--cv-color-accent)] transition">
                            {item.title}
                          </h4>
                          <p className="text-[11px] text-[var(--cv-color-text-muted)] mt-0.5 leading-relaxed">
                            {item.description}
                          </p>
                        </div>
                      </div>
                      <div className="mt-3 pt-2 border-t border-[var(--cv-color-border-subtle)] flex justify-end">
                        <span className="text-[10px] font-bold text-[var(--cv-color-accent)] group-hover:underline">
                          + Inserir
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
