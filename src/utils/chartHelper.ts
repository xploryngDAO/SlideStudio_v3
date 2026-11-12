import { Chart } from 'chart.js/auto';
import { ChartConfig } from '../types/presentation';

// Global Chart.js registry so window.Chart is always ready
if (typeof window !== 'undefined') {
  (window as any).Chart = Chart;
}

/**
 * Built-in standard chart configurations for corporate presentations
 */
export const BUILTIN_CHART_PRESETS: Record<string, ChartConfig> = {
  chartEvolucaoNPS: {
    type: 'line',
    customTitle: 'Trajetória Mensal de NPS (Jan - Out/2026)',
    suffix: 'pts',
    data: {
      labels: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set (F)', 'Out (P)'],
      datasets: [
        {
          label: 'NPS Real (%)',
          data: [59.1, 63.2, 61.8, 65.6, 72.7, 67.6, 69.1, 70.2, 71.8, 72.5],
          borderColor: '#0033C6',
          backgroundColor: 'rgba(0, 51, 198, 0.08)',
          borderWidth: 3,
          tension: 0.25,
          fill: true,
          pointBackgroundColor: '#0033C6',
          pointRadius: 5,
          pointHoverRadius: 7,
        },
        {
          label: 'Meta Corporativa',
          data: [75.0, 75.0, 75.0, 75.0, 75.0, 75.0, 75.0, 75.0, 75.0, 75.0],
          borderColor: '#DC2626',
          borderWidth: 1.5,
          borderDash: [5, 5],
          fill: false,
          pointRadius: 0,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,
          position: 'top',
          labels: { boxWidth: 12, font: { size: 10.5, family: 'Inter, sans-serif' }, color: '#334155' },
        },
        tooltip: {
          callbacks: {
            label: (ctx: any) => `${ctx.dataset.label}: ${ctx.parsed.y.toFixed(1)} pts`,
          },
        },
      },
      scales: {
        y: {
          min: 50,
          max: 85,
          ticks: {
            color: '#64748B',
            font: { size: 10 },
          },
          grid: { color: '#E2E8F0' },
        },
        x: {
          ticks: { color: '#64748B', font: { size: 10.5 } },
          grid: { display: false },
        },
      },
    },
  },

  chartDiaSemana: {
    type: 'bar',
    customTitle: 'Estresse Operacional por Dia da Semana',
    suffix: 'pts',
    data: {
      labels: ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'],
      datasets: [
        {
          label: 'NPS por Dia',
          data: [51.8, 74.0, 75.0, 78.3, 75.5, 78.5, 66.9],
          backgroundColor: [
            '#DC2626', // Dom - Crítico
            '#0033C6', // Seg
            '#0033C6', // Ter
            '#0033C6', // Qua
            '#0033C6', // Qui
            '#0033C6', // Sex
            '#D97706', // Sáb - Alerta
          ],
          borderRadius: 4,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (ctx: any) => `NPS: ${ctx.parsed.y.toFixed(1)} pts`,
          },
        },
      },
      scales: {
        y: {
          min: 40,
          max: 90,
          ticks: { color: '#64748B', font: { size: 10 } },
          grid: { color: '#E2E8F0' },
        },
        x: {
          ticks: { color: '#334155', font: { size: 10 } },
          grid: { display: false },
        },
      },
    },
  },

  chartMixSatisfacao: {
    type: 'doughnut',
    customTitle: 'Mix de Satisfação (Promotores vs Neutros vs Detratores)',
    suffix: '%',
    data: {
      labels: ['Promotores (Notas 9-10)', 'Neutros (Notas 7-8)', 'Detratores (Notas 0-6)'],
      datasets: [
        {
          label: 'Percentual',
          data: [82.1, 7.7, 10.2],
          backgroundColor: ['#059669', '#F59E0B', '#DC2626'],
          borderWidth: 2,
          borderColor: '#FFFFFF',
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: { boxWidth: 12, font: { size: 11, family: 'Inter, sans-serif' } },
        },
      },
      cutout: '65%',
    },
  },

  chartQ3Trend: {
    type: 'bar',
    customTitle: 'Evolução Q3 de NPS',
    suffix: 'pts',
    data: {
      labels: ['Julho/26 (14.462)', 'Agosto/26 (10.166)', 'Setembro/26 (5.176)', 'Média Trimestre Q3'],
      datasets: [
        {
          label: 'NPS Real',
          data: [61.3, 58.9, 60.7, 60.4],
          backgroundColor: ['#0066cc', '#e11d48', '#0284c7', '#002b66'],
          borderRadius: 4,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        y: { min: 50, max: 70 },
      },
    },
  },
};

/**
 * Creates a generic clean chart configuration when none is provided
 */
export function createDefaultChartConfig(type: 'bar' | 'line' | 'doughnut' | 'pie' = 'bar'): ChartConfig {
  if (type === 'line') {
    return {
      type: 'line',
      customTitle: 'Tendência Temporal',
      suffix: 'pts',
      data: {
        labels: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun'],
        datasets: [
          {
            label: 'Realizado',
            data: [65, 68, 72, 70, 75, 78],
            borderColor: '#0033C6',
            backgroundColor: 'rgba(0, 51, 198, 0.1)',
            fill: true,
            tension: 0.3,
            borderWidth: 3,
            pointRadius: 4,
          },
          {
            label: 'Meta',
            data: [70, 70, 70, 75, 75, 75],
            borderColor: '#DC2626',
            borderWidth: 2,
            borderDash: [5, 5],
            fill: false,
            pointRadius: 0,
          },
        ],
      },
    };
  }

  if (type === 'doughnut' || type === 'pie') {
    return {
      type,
      customTitle: 'Distribuição Percentual',
      suffix: '%',
      data: {
        labels: ['Promotores', 'Neutros', 'Detratores'],
        datasets: [
          {
            label: 'Share',
            data: [75, 15, 10],
            backgroundColor: ['#059669', '#F59E0B', '#DC2626'],
            borderWidth: 2,
            borderColor: '#FFFFFF',
          },
        ],
      },
    };
  }

  return {
    type: 'bar',
    customTitle: 'Comparativo por Categoria',
    suffix: 'pts',
    data: {
      labels: ['Grupo 1', 'Grupo 2', 'Grupo 3', 'Grupo 4', 'Grupo 5'],
      datasets: [
        {
          label: 'Performance',
          data: [72, 85, 64, 79, 91],
          backgroundColor: ['#0033C6', '#0033C6', '#DC2626', '#0033C6', '#059669'],
          borderRadius: 4,
        },
      ],
    },
  };
}

/**
 * Parses and returns ChartConfig from a canvas element's attributes or matching presets
 */
export function getChartConfigFromCanvas(canvas: HTMLCanvasElement): ChartConfig {
  // 1. Check data-chart-data attribute
  const dataAttr = canvas.getAttribute('data-chart-data');
  if (dataAttr) {
    try {
      const parsed = JSON.parse(dataAttr);
      if (parsed.type && parsed.data) {
        return parsed as ChartConfig;
      }
    } catch (_) {}
  }

  // 2. Check canvas ID in built-in presets
  if (canvas.id && BUILTIN_CHART_PRESETS[canvas.id]) {
    return JSON.parse(JSON.stringify(BUILTIN_CHART_PRESETS[canvas.id]));
  }

  // 3. Check data-chart attribute
  const chartTypeAttr = canvas.getAttribute('data-chart');
  if (chartTypeAttr && BUILTIN_CHART_PRESETS[chartTypeAttr]) {
    return JSON.parse(JSON.stringify(BUILTIN_CHART_PRESETS[chartTypeAttr]));
  }

  // 4. Default bar chart fallback
  return createDefaultChartConfig('bar');
}

/**
 * Applies ChartConfig to canvas as serialized data-chart-data attribute
 */
export function applyChartConfigToCanvas(canvas: HTMLCanvasElement, config: ChartConfig) {
  canvas.setAttribute('data-chart-data', JSON.stringify(config));
}

/**
 * Initializes Chart.js instances for all canvas elements in the slide container
 */
export function initSlideCharts(container: HTMLElement | null): (() => void) {
  if (!container) return () => {};

  const canvases = container.querySelectorAll('canvas');
  if (canvases.length === 0) return () => {};

  const chartsCreated: Chart[] = [];

  canvases.forEach((canvas) => {
    // Destroy any existing chart on this canvas before re-creating
    const existing = Chart.getChart(canvas);
    if (existing) {
      existing.destroy();
    }

    try {
      // Resolve configuration
      const config = getChartConfigFromCanvas(canvas);

      // Save resolved config onto data-chart-data so it persists in the slide HTML
      if (!canvas.getAttribute('data-chart-data')) {
        canvas.setAttribute('data-chart-data', JSON.stringify(config));
      }

      // Ensure canvas has responsive styling
      if (!canvas.style.width) canvas.style.width = '100%';
      if (!canvas.style.height) canvas.style.height = '100%';

      // Ensure chart container has height if empty
      const parent = canvas.parentElement;
      if (parent && parent.clientHeight === 0 && !parent.style.height) {
        parent.style.minHeight = '200px';
      }

      const chart = new Chart(canvas, {
        type: config.type,
        data: config.data as any,
        options: {
          responsive: true,
          maintainAspectRatio: false,
          animation: false, // instant rendering without jitter in editor
          ...config.options,
        },
      });

      chartsCreated.push(chart);
    } catch (err) {
      console.warn(`Failed to initialize chart on canvas #${canvas.id}:`, err);
    }
  });

  return () => {
    chartsCreated.forEach((c) => {
      try {
        c.destroy();
      } catch (_) {}
    });
  };
}

/**
 * Attaches interactive click handlers for slide tabs (.tabs-container, .tab-btn, .tab-content)
 */
export function initSlideTabs(container: HTMLElement | null): (() => void) {
  if (!container) return () => {};

  const tabButtons = container.querySelectorAll('.tab-btn');
  if (tabButtons.length === 0) return () => {};

  const handleClick = (e: Event) => {
    const btn = (e.currentTarget as HTMLElement) || (e.target as HTMLElement)?.closest('.tab-btn');
    if (!btn) return;

    const tabsContainer = btn.closest('.tabs-container') || container;
    const allBtns = tabsContainer.querySelectorAll('.tab-btn');
    const allContents = tabsContainer.querySelectorAll('.tab-content');

    allBtns.forEach((b) => b.classList.remove('active'));
    allContents.forEach((c) => c.classList.remove('active'));

    btn.classList.add('active');

    const onclickAttr = btn.getAttribute('onclick') || '';
    const match = onclickAttr.match(/['"]([^'"]+)['"]/);
    const targetId = btn.getAttribute('data-target') || (match ? match[1] : null);

    if (targetId) {
      const targetContent = tabsContainer.querySelector(`#${targetId}`);
      if (targetContent) {
        targetContent.classList.add('active');
      }
    } else {
      const btnIndex = Array.from(allBtns).indexOf(btn);
      if (allContents[btnIndex]) {
        allContents[btnIndex].classList.add('active');
      }
    }
  };

  tabButtons.forEach((btn) => {
    btn.addEventListener('click', handleClick);
  });

  return () => {
    tabButtons.forEach((btn) => {
      btn.removeEventListener('click', handleClick);
    });
  };
}
