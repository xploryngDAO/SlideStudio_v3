// Presentation 1: Casas Bahia - Diagnóstico Estratégico de CX & NPS (Regional 122) - 12 Slides com Gráficos Chart.js
export const CASAS_BAHIA_HTML = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
  <title>Grupo Casas Bahia - Diagnóstico Estratégico de CX & NPS (Regional 122)</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
  <style>
    :root {
      --cb-blue-primary: #0033C6;
      --cb-blue-dark: #002280;
      --cb-blue-navy: #00174F;
      --cb-light-blue: #EEF3FF;
      --cb-blue-border: #C7D7FE;
      --cb-red-primary: #E71A3B;
      --cb-red-dark: #C51330;
      --cb-gray-900: #0F172A;
      --cb-gray-700: #334155;
      --cb-gray-600: #475569;
      --cb-gray-500: #64748B;
      --cb-gray-200: #E2E8F0;
      --cb-gray-100: #F1F5F9;
      --cb-gray-50: #F8FAFC;
      --cb-white: #FFFFFF;
      --cb-success: #059669;
      --cb-danger: #DC2626;
      --cb-warning: #D97706;
      --cb-info: #0284C7;
    }

    * { box-sizing: border-box; margin: 0; padding: 0; }

    html, body {
      width: 100%;
      height: 100%;
      height: 100dvh;
      overflow: hidden;
      background-color: var(--cb-gray-50);
      color: var(--cb-gray-900);
      font-family: 'Inter', system-ui, -apple-system, sans-serif;
      -webkit-font-smoothing: antialiased;
    }

    body {
      display: flex;
      flex-direction: column;
    }

    /* Cabeçalho Fixo Superior */
    .header-bar {
      height: 52px;
      min-height: 52px;
      background: linear-gradient(90deg, var(--cb-blue-navy) 0%, var(--cb-blue-primary) 100%);
      color: var(--cb-white);
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 clamp(16px, 2vw, 28px);
      border-bottom: 3px solid var(--cb-red-primary);
      position: relative;
      z-index: 100;
      flex-shrink: 0;
    }
    .header-left {
      display: flex;
      align-items: center;
      gap: 14px;
    }
    .cb-badge {
      background: #FFFFFF;
      color: var(--cb-blue-dark);
      font-weight: 800;
      font-size: clamp(10px, 0.75vw, 11px);
      letter-spacing: 0.8px;
      padding: 4px 14px;
      border-radius: 9999px;
      text-transform: uppercase;
      display: inline-block;
      white-space: nowrap;
    }
    .header-tag {
      font-size: clamp(10px, 0.75vw, 11px);
      background: rgba(255,255,255,0.15);
      border: 1px solid rgba(255,255,255,0.25);
      padding: 3px 10px;
      border-radius: 4px;
      text-transform: uppercase;
      font-weight: 600;
      letter-spacing: 0.5px;
      white-space: nowrap;
    }
    .header-right {
      font-size: clamp(11px, 0.85vw, 13px);
      font-weight: 500;
      color: rgba(255,255,255,0.9);
      display: flex;
      align-items: center;
      gap: 8px;
      white-space: nowrap;
    }

    /* Deck Container */
    .deck-container {
      flex: 1;
      width: 100%;
      min-height: 0;
      position: relative;
      background: var(--cb-white);
      overflow: hidden;
    }
    .slide {
      display: none !important;
      width: 100%;
      height: 100%;
      padding: clamp(14px, 2vh, 24px) clamp(20px, 2.5vw, 36px);
      flex-direction: column;
      overflow: hidden;
    }
    .slide.active {
      display: flex !important;
    }

    /* Slide 1: Capa */
    .slide-cover {
      height: 100%;
      width: 100%;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      text-align: center;
      background: radial-gradient(circle at top right, #EEF3FF 0%, #FFFFFF 70%);
      border-radius: 8px;
      padding: clamp(16px, 2.5vh, 32px);
      position: relative;
      overflow: hidden;
    }
    .cover-tag {
      background: var(--cb-light-blue);
      color: var(--cb-blue-primary);
      border: 1px solid var(--cb-blue-border);
      padding: 5px 16px;
      border-radius: 999px;
      font-size: clamp(10px, 0.8vw, 12px);
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.6px;
      margin-bottom: clamp(10px, 1.4vh, 16px);
    }
    .cover-title {
      font-size: clamp(24px, 2.5vw, 34px);
      font-weight: 800;
      color: var(--cb-blue-navy);
      line-height: 1.15;
      max-width: 960px;
      margin-bottom: 10px;
      letter-spacing: -0.02em;
    }
    .cover-subtitle {
      font-size: clamp(12px, 1vw, 15px);
      color: var(--cb-gray-700);
      max-width: 860px;
      line-height: 1.45;
      margin-bottom: clamp(16px, 2.4vh, 24px);
      font-weight: 500;
    }
    .cover-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: clamp(10px, 1.2vw, 16px);
      width: 100%;
      max-width: 1000px;
      margin-bottom: clamp(12px, 1.8vh, 18px);
    }
    .cover-kpi {
      background: var(--cb-white);
      border: 1px solid var(--cb-gray-200);
      border-radius: 8px;
      padding: clamp(10px, 1.4vh, 16px);
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
      border-top: 3px solid var(--cb-blue-primary);
      text-align: left;
    }
    .cover-kpi-label {
      font-size: clamp(10px, 0.72vw, 11px);
      font-weight: 700;
      text-transform: uppercase;
      color: var(--cb-gray-500);
      letter-spacing: 0.5px;
    }
    .cover-kpi-val {
      font-size: clamp(1.4rem, 1.9vw, 1.9rem);
      font-weight: 800;
      color: var(--cb-blue-navy);
      margin: 4px 0;
      font-variant-numeric: tabular-nums;
    }
    .cover-kpi-sub {
      font-size: clamp(10px, 0.75vw, 11px);
      font-weight: 600;
      color: var(--cb-success);
    }
    .cover-meta-bar {
      display: flex;
      align-items: center;
      gap: 16px;
      font-size: clamp(10px, 0.75vw, 11px);
      color: var(--cb-gray-500);
      border-top: 1px solid var(--cb-gray-200);
      padding-top: 10px;
      margin-top: 4px;
    }

    /* Cabeçalhos Internos */
    .slide-header {
      margin-bottom: clamp(8px, 1.2vh, 12px);
      border-bottom: 1px solid var(--cb-gray-200);
      padding-bottom: 8px;
      flex-shrink: 0;
    }
    .slide-category {
      font-size: clamp(0.68rem, 0.8vw, 0.78rem);
      font-weight: 700;
      text-transform: uppercase;
      color: var(--cb-blue-primary);
      margin-bottom: 2px;
      display: flex;
      align-items: center;
      gap: 6px;
      letter-spacing: 0.5px;
    }
    .slide-category::before {
      content: "";
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: var(--cb-red-primary);
      display: inline-block;
    }
    .slide-title {
      font-size: clamp(1.18rem, 1.6vw, 1.5rem);
      font-weight: 700;
      color: var(--cb-gray-900);
      letter-spacing: -0.02em;
    }
    .slide-subtitle {
      font-size: clamp(0.74rem, 0.9vw, 0.86rem);
      color: var(--cb-gray-600);
      margin-top: 2px;
    }
    .slide-content {
      flex: 1;
      min-height: 0;
      height: 100%;
      display: flex;
      flex-direction: column;
      gap: clamp(8px, 1.2vh, 14px);
    }

    /* Faixas de KPIs */
    .kpi-row {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: clamp(8px, 1vw, 12px);
      flex-shrink: 0;
    }
    .kpi-row-6 {
      display: grid;
      grid-template-columns: repeat(6, 1fr);
      gap: clamp(6px, 0.8vw, 10px);
      flex-shrink: 0;
    }
    .kpi-card {
      background: var(--cb-white);
      border: 1px solid var(--cb-gray-200);
      border-radius: 6px;
      padding: clamp(8px, 1.1vh, 12px) clamp(10px, 1vw, 14px);
      border-top: 3px solid var(--cb-blue-primary);
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }
    .kpi-card.highlight { border-top-color: var(--cb-blue-primary); background: #F8FAFF; }
    .kpi-card.success { border-top-color: var(--cb-success); }
    .kpi-card.danger { border-top-color: var(--cb-danger); }
    .kpi-card.warning { border-top-color: var(--cb-warning); }
    .kpi-label {
      font-size: clamp(9px, 0.7vw, 10.5px);
      font-weight: 700;
      text-transform: uppercase;
      color: var(--cb-gray-500);
      letter-spacing: 0.4px;
    }
    .kpi-val {
      font-size: clamp(1.15rem, 1.5vw, 1.55rem);
      font-weight: 800;
      color: var(--cb-blue-navy);
      margin: 2px 0;
      font-variant-numeric: tabular-nums;
    }
    .kpi-delta {
      font-size: clamp(9.5px, 0.72vw, 11px);
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 4px;
    }
    .kpi-delta.pos { color: var(--cb-success); }
    .kpi-delta.neg { color: var(--cb-danger); }
    .kpi-delta.neu { color: var(--cb-gray-600); }

    /* Tabelas Corporativas & Scroll */
    .table-container {
      flex: 1;
      min-height: 0;
      height: 100%;
      overflow-y: auto;
      overflow-x: auto;
      border: 1px solid var(--cb-gray-200);
      border-radius: 6px;
      background: var(--cb-white);
    }
    .analise-table {
      width: 100%;
      border-collapse: collapse;
      font-size: clamp(10px, 0.78vw, 11.5px);
    }
    .analise-table thead th {
      position: sticky;
      top: 0;
      background: var(--cb-gray-100);
      z-index: 2;
      padding: 7px 10px;
      text-transform: uppercase;
      font-size: clamp(9px, 0.68vw, 10px);
      font-weight: 700;
      color: var(--cb-gray-700);
      border-bottom: 2px solid var(--cb-gray-200);
      text-align: left;
      white-space: nowrap;
    }
    .analise-table thead th.text-right { text-align: right; }
    .analise-table thead th.text-center { text-align: center; }
    .analise-table tbody tr {
      border-bottom: 1px solid var(--cb-gray-200);
      transition: background-color 0.12s ease;
    }
    .analise-table tbody tr:nth-child(even) { background-color: #FAFCFF; }
    .analise-table tbody tr:hover { background-color: var(--cb-gray-100); }
    .analise-table tbody tr.row-highlight { background-color: #EEF4FF; font-weight: 600; }
    .analise-table tbody td {
      padding: 6px 10px;
      color: var(--cb-gray-700);
      vertical-align: middle;
    }
    .analise-table tbody td.text-right {
      text-align: right;
      font-variant-numeric: tabular-nums;
      font-weight: 600;
    }
    .analise-table tbody td.text-center { text-align: center; }

    /* Badges */
    .badge-nps-excelente {
      background: #DCFCE7; color: #15803D; border: 1px solid #BBF7D0; padding: 2px 7px; border-radius: 4px; font-size: 10px; font-weight: 700; display: inline-block; white-space: nowrap;
    }
    .badge-nps-qualidade {
      background: #DBEAFE; color: #1D4ED8; border: 1px solid #BFDBFE; padding: 2px 7px; border-radius: 4px; font-size: 10px; font-weight: 700; display: inline-block; white-space: nowrap;
    }
    .badge-nps-aperfeicoamento {
      background: #FEF3C7; color: #B45309; border: 1px solid #FDE68A; padding: 2px 7px; border-radius: 4px; font-size: 10px; font-weight: 700; display: inline-block; white-space: nowrap;
    }
    .badge-nps-critico {
      background: #FEE2E2; color: #B91C1C; border: 1px solid #FECACA; padding: 2px 7px; border-radius: 4px; font-size: 10px; font-weight: 700; display: inline-block; white-space: nowrap;
    }
    .badge-pos {
      background: #E8F5E9; color: #2E7D32; padding: 2px 6px; border-radius: 4px; font-weight: 700; font-size: 10px; display: inline-block; white-space: nowrap;
    }
    .badge-neg {
      background: #FFEBEE; color: #C62828; padding: 2px 6px; border-radius: 4px; font-weight: 700; font-size: 10px; display: inline-block; white-space: nowrap;
    }
    .badge-porte {
      background: var(--cb-gray-100); color: var(--cb-gray-700); border: 1px solid var(--cb-gray-200); padding: 1px 5px; border-radius: 3px; font-size: 10px; font-weight: 600; white-space: nowrap;
    }

    /* Split Views */
    .split-view {
      display: grid;
      grid-template-columns: 1.3fr 1fr;
      gap: clamp(12px, 1.5vw, 18px);
      flex: 1;
      min-height: 0;
      height: 100%;
    }
    .split-view-equal {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: clamp(12px, 1.5vw, 18px);
      flex: 1;
      min-height: 0;
      height: 100%;
    }
    .chart-card {
      background: var(--cb-white);
      border: 1px solid var(--cb-gray-200);
      border-radius: 6px;
      padding: clamp(10px, 1.2vw, 14px);
      display: flex;
      flex-direction: column;
      min-height: 0;
      height: 100%;
    }
    .chart-header {
      font-size: clamp(11px, 0.8vw, 12px);
      font-weight: 700;
      color: var(--cb-blue-navy);
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 8px;
    }
    .chart-container {
      position: relative;
      flex: 1;
      min-height: 0;
      width: 100%;
      height: 100%;
    }
    .side-panel {
      background: var(--cb-gray-50);
      border: 1px solid var(--cb-gray-200);
      border-radius: 6px;
      padding: clamp(12px, 1.4vw, 16px);
      display: flex;
      flex-direction: column;
      gap: clamp(8px, 1.2vh, 12px);
      overflow-y: auto;
      min-height: 0;
      height: 100%;
    }
    .side-panel-title {
      font-size: clamp(11px, 0.85vw, 13px);
      font-weight: 700;
      color: var(--cb-blue-navy);
      text-transform: uppercase;
      letter-spacing: 0.5px;
      border-bottom: 2px solid var(--cb-blue-primary);
      padding-bottom: 4px;
      flex-shrink: 0;
    }
    .takeaway-list {
      list-style: none;
      display: flex;
      flex-direction: column;
      gap: 8px;
      font-size: clamp(10.5px, 0.8vw, 12px);
      color: var(--cb-gray-700);
    }
    .takeaway-list li {
      position: relative;
      padding-left: 16px;
      line-height: 1.4;
    }
    .takeaway-list li::before {
      content: "▪";
      color: var(--cb-blue-primary);
      position: absolute;
      left: 0;
      font-size: 13px;
    }
    .takeaway-list.danger li::before { color: var(--cb-danger); }
    .takeaway-list.success li::before { color: var(--cb-success); }

    /* Quotes */
    .quote-box {
      background: var(--cb-gray-50);
      border-left: 4px solid var(--cb-blue-primary);
      padding: 8px 12px;
      border-radius: 0 6px 6px 0;
      font-size: clamp(10.5px, 0.8vw, 12px);
      font-style: italic;
      color: var(--cb-gray-700);
      flex-shrink: 0;
      line-height: 1.4;
    }
    .quote-box.danger { border-left-color: var(--cb-danger); background: #FFF5F5; }
    .quote-box.success { border-left-color: var(--cb-success); background: #F0FDF4; }

    /* Grids Especiais */
    .matrix-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      grid-template-rows: 1fr 1fr;
      gap: 10px;
      flex: 1;
      min-height: 0;
      height: 100%;
    }
    .matrix-card {
      background: var(--cb-white);
      border: 1px solid var(--cb-gray-200);
      border-radius: 6px;
      padding: 10px 12px;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .matrix-card.q-critico { border-top: 3px solid var(--cb-danger); background: #FFFBFB; }
    .matrix-card.q-alerta { border-top: 3px solid var(--cb-warning); background: #FFFDF7; }
    .matrix-card.q-estavel { border-top: 3px solid var(--cb-info); background: #F7FAFC; }
    .matrix-card.q-fortaleza { border-top: 3px solid var(--cb-success); background: #F4FDF8; }
    .matrix-title {
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .journey-grid {
      display: grid;
      grid-template-columns: repeat(6, 1fr);
      gap: 8px;
      flex: 1;
      min-height: 0;
    }
    .journey-card {
      background: var(--cb-white);
      border: 1px solid var(--cb-gray-200);
      border-radius: 6px;
      padding: 10px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      border-top: 3px solid var(--cb-blue-primary);
    }
    .cluster-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      grid-template-rows: repeat(2, 1fr);
      gap: 12px;
      flex: 1;
      min-height: 0;
    }
    .cluster-card {
      background: var(--cb-white);
      border: 1px solid var(--cb-gray-200);
      border-radius: 6px;
      padding: 12px;
      display: flex;
      flex-direction: column;
      gap: 8px;
      border-top: 3px solid var(--cb-danger);
    }

    /* Rodapé Fixo */
    .footer-bar {
      height: 48px;
      min-height: 48px;
      background: var(--cb-white);
      border-top: 1px solid var(--cb-gray-200);
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 clamp(16px, 2vw, 28px);
      position: relative;
      z-index: 100;
      flex-shrink: 0;
    }
    .progress-bar {
      position: absolute;
      top: -1px;
      left: 0;
      height: 3px;
      background: var(--cb-red-primary);
      transition: width 0.25s ease;
    }
    .footer-meta {
      font-size: clamp(10px, 0.75vw, 12px);
      color: var(--cb-gray-500);
      font-weight: 600;
      white-space: nowrap;
    }
    .footer-controls {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .slide-counter {
      font-size: clamp(10px, 0.75vw, 12px);
      font-weight: 600;
      color: var(--cb-gray-600);
      font-variant-numeric: tabular-nums;
      margin-right: 6px;
      white-space: nowrap;
    }
    .btn-nav {
      background: var(--cb-gray-50);
      border: 1px solid var(--cb-gray-200);
      color: var(--cb-gray-700);
      padding: 5px 12px;
      border-radius: 5px;
      font-size: clamp(10px, 0.75vw, 12px);
      font-weight: 600;
      cursor: pointer;
      transition: all 0.15s;
      user-select: none;
      white-space: nowrap;
    }
    .btn-nav:hover { background: var(--cb-gray-200); color: var(--cb-gray-900); }
    .btn-nav-primary {
      background: var(--cb-blue-primary);
      color: var(--cb-white);
      border-color: var(--cb-blue-primary);
    }
    .btn-nav-primary:hover {
      background: var(--cb-blue-dark);
      color: var(--cb-white);
    }

    /* Media queries padrão */
    @media (max-width: 1024px) {
      .split-view, .split-view-equal {
        grid-template-columns: 1fr;
        height: auto;
      }
      .slide.active {
        overflow-y: auto !important;
        overflow-x: hidden !important;
        -webkit-overflow-scrolling: touch;
      }
      .chart-card {
        min-height: 280px;
        height: auto;
      }
      .chart-container {
        height: 240px;
        min-height: 240px;
      }
      .side-panel {
        height: auto;
        overflow-y: visible;
      }
      .journey-grid {
        grid-template-columns: repeat(3, 1fr);
        height: auto;
      }
      .matrix-grid {
        grid-template-columns: 1fr 1fr;
        grid-template-rows: auto;
        height: auto;
      }
      .cluster-grid {
        grid-template-columns: 1fr 1fr;
        grid-template-rows: auto;
        height: auto;
      }
    }

    @media (max-width: 768px) {
      .header-bar {
        height: auto;
        min-height: 40px;
        padding: 6px 10px;
        display: flex;
        flex-direction: column;
        gap: 3px;
        box-sizing: border-box;
      }
      .header-left {
        display: flex;
        align-items: center;
        justify-content: space-between;
        width: 100%;
        gap: 6px;
        flex-wrap: nowrap;
      }
      .cb-badge {
        font-size: 9px;
        padding: 3px 8px;
        letter-spacing: 0.4px;
        flex-shrink: 0;
        font-weight: 800;
      }
      .header-tag {
        font-size: 8.5px;
        padding: 2px 6px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        max-width: 135px;
        flex-shrink: 1;
      }
      .header-left > span:last-child {
        font-size: 9px;
        white-space: nowrap;
        opacity: 0.9;
        flex-shrink: 0;
        margin-left: auto;
        font-weight: 600;
      }
      .header-right {
        font-size: 8.5px;
        width: 100%;
        border-top: 1px solid rgba(255, 255, 255, 0.2);
        padding-top: 2px;
        margin-top: 1px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        line-height: 1.2;
        opacity: 0.92;
        text-align: center;
      }
      .slide {
        padding: 14px 14px 14px 14px;
        overflow-y: auto !important;
        overflow-x: hidden !important;
        -webkit-overflow-scrolling: touch;
        height: 100%;
        min-height: 100%;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        box-sizing: border-box;
      }
      .slide.active {
        display: flex !important;
      }
      .slide-content {
        height: 100%;
        min-height: 0;
        overflow: visible;
        gap: 10px;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        flex: 1 1 auto;
      }
      .slide-cover {
        height: 100%;
        min-height: 100%;
        padding: 16px 12px 12px 12px;
        justify-content: space-between;
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
        box-sizing: border-box;
        gap: 12px;
      }
      .cover-tag {
        font-size: 10px;
        padding: 4px 10px;
        margin-bottom: 8px;
        display: inline-block;
        line-height: 1.2;
        letter-spacing: 0.5px;
        font-weight: 700;
      }
      .cover-title {
        font-size: 1.35rem;
        line-height: 1.25;
        margin-bottom: 8px;
        font-weight: 800;
      }
      .cover-subtitle {
        font-size: 0.8rem;
        line-height: 1.45;
        margin-bottom: 0px;
        opacity: 0.88;
      }
      .cover-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 10px;
        margin: auto 0;
        width: 100%;
        flex: 1 0 auto;
        max-height: 260px;
        align-content: center;
      }
      .cover-kpi {
        padding: 12px 10px;
        border-radius: 14px;
        display: flex;
        flex-direction: column;
        justify-content: center;
        min-height: 90px;
        background: #FFFFFF;
        border: 1px solid #E2E8F0;
        box-shadow: 0 2px 4px rgba(0,0,0,0.04);
      }
      .cover-kpi-label {
        font-size: 8.5px;
        font-weight: 700;
        line-height: 1.2;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        color: #64748B;
        text-transform: uppercase;
      }
      .cover-kpi-val {
        font-size: 1.45rem;
        font-weight: 800;
        line-height: 1.15;
        margin: 3px 0;
        color: #0F172A;
      }
      .cover-kpi-sub {
        font-size: 8px;
        line-height: 1.2;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        color: #94A3B8;
      }
      .cover-meta-bar {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        justify-content: center;
        gap: 5px;
        font-size: 8.5px;
        padding: 8px 12px;
        background: #F8FAFC;
        border-radius: 8px;
        border: 1px solid #E2E8F0;
        color: #64748B;
        margin-top: auto;
        width: 100%;
        box-sizing: border-box;
      }
      .slide-header {
        margin-bottom: 6px;
        padding-bottom: 4px;
        border-bottom: 1px solid #E2E8F0;
      }
      .slide-title {
        font-size: 12.5px;
        font-weight: 800;
        line-height: 1.25;
        margin-bottom: 2px;
      }
      .slide-subtitle {
        font-size: 9px;
        line-height: 1.3;
        color: #64748B;
      }
      .kpi-row, .kpi-row-6 {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 5px;
        margin-bottom: 6px;
      }
      .kpi-card {
        padding: 5px 6px;
        border-radius: 6px;
      }
      .kpi-label {
        font-size: 7.5px;
        font-weight: 700;
        line-height: 1.1;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .kpi-val {
        font-size: 1rem;
        font-weight: 800;
        line-height: 1.1;
        margin: 1px 0;
      }
      .kpi-sub {
        font-size: 7px;
        line-height: 1.15;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .split-view, .split-view-equal {
        display: flex;
        flex-direction: column;
        gap: 8px;
        height: auto;
      }
      .chart-card {
        height: auto;
        min-height: auto;
        padding: 8px;
        border-radius: 8px;
        margin-bottom: 6px;
      }
      .chart-header {
        font-size: 10px;
        font-weight: 700;
        margin-bottom: 4px;
      }
      .chart-container {
        height: 185px !important;
        min-height: 185px !important;
        max-height: 195px !important;
        width: 100%;
        position: relative;
      }
      .side-panel {
        padding: 8px;
        border-radius: 8px;
        font-size: 9.5px;
      }
      .journey-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 5px;
        height: auto;
      }
      .matrix-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 5px;
        height: auto;
      }
      .cluster-grid {
        display: grid;
        grid-template-columns: 1fr;
        gap: 6px;
        height: auto;
      }
      .table-container {
        max-height: 260px;
        width: 100%;
        max-width: 100%;
        overflow-x: auto !important;
        overflow-y: auto !important;
        -webkit-overflow-scrolling: touch;
        border-radius: 6px;
        margin-bottom: 6px;
      }
      .analise-table {
        min-width: 460px;
        font-size: 9px;
      }
      .analise-table th, .analise-table td {
        padding: 4px 6px;
      }
      .footer-bar {
        height: 38px;
        min-height: 38px;
        padding: 4px 10px;
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: space-between;
        box-sizing: border-box;
        gap: 6px;
      }
      .footer-meta {
        font-size: 8.5px;
        text-align: left;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        flex: 1;
      }
      .footer-controls {
        display: flex;
        align-items: center;
        gap: 4px;
        flex-shrink: 0;
      }
      .slide-counter {
        font-size: 9.5px;
        margin-right: 2px;
      }
      .btn-nav {
        padding: 3px 8px;
        font-size: 9.5px;
        min-height: 24px;
        border-radius: 4px;
      }
      #btn-fullscreen {
        display: none;
      }
    }
  </style>
</head>
<body>

  <!-- Header Superior Corporativo -->
  <header class="header-bar">
    <div class="header-left">
      <span class="cb-badge">CASAS BAHIA</span>
      <span class="header-tag">CX & Estratégia de Operações</span>
      <span style="font-size: 11px; opacity: 0.85;">Diretoria 1 • Regional 122</span>
    </div>
    <div class="header-right">
      <span>Safra Fechada: <strong>Setembro/2026</strong> | Safra Parcial: <strong>Outubro/2026</strong></span>
    </div>
  </header>

  <!-- Container de Slides -->
  <main class="deck-container">

    <!-- SLIDE 1: CAPA EXECUTIVA & METADADOS -->
    <section class="slide active" data-slide="1">
      <div class="slide-cover">
        <span class="cover-tag">Diagnóstico Estratégico de CX & Performance de NPS</span>
        <h1 class="cover-title">Excelência Operacional & Alavancagem de NPS</h1>
        <p class="cover-subtitle">
          Análise multidimensional por safra estrita (<strong>DataCompra</strong>), decomposição de impacto líquido <strong>Leave-One-Out</strong> e plano de choque tático para filiais críticas da <strong>Regional 122 (Diretoria 1)</strong>.
        </p>

        <div class="cover-grid">
          <div class="cover-kpi">
            <div class="cover-kpi-label">NPS Consolidado (Set/26)</div>
            <div class="cover-kpi-val">71.8</div>
            <div class="cover-kpi-sub">+1.6 pts vs Ago/26 • Zona de Qualidade</div>
          </div>
          <div class="cover-kpi">
            <div class="cover-kpi-label">Prévia Parcial (Out/26)</div>
            <div class="cover-kpi-val">72.5</div>
            <div class="cover-kpi-sub">69 pesquisas • 8.7% Detratores</div>
          </div>
          <div class="cover-kpi">
            <div class="cover-kpi-label">Impacto na Diretoria 1</div>
            <div class="cover-kpi-val">-0.10 p.p.</div>
            <div class="cover-kpi-sub">Maior volume da D1 (13.37% share)</div>
          </div>
          <div class="cover-kpi">
            <div class="cover-kpi-label">Amostra Analisada (Set/26)</div>
            <div class="cover-kpi-val">586</div>
            <div class="cover-kpi-sub">481 Promotores (82.1%) • 60 Detratores</div>
          </div>
        </div>

        <div class="cover-meta-bar">
          <span><strong>Metodologia:</strong> Atribuição por DataCompra (Regra Estrita de Safra)</span>
          <span>•</span>
          <span><strong>Unidades:</strong> 19 Filiais Mapeadas</span>
          <span>•</span>
          <span><strong>Responsável:</strong> Inteligência de CX & Operações de Varejo</span>
          <span>•</span>
          <span><strong>Data de Fechamento:</strong> 09/10/2026</span>
        </div>
      </div>
    </section>

    <!-- SLIDE 2: PAINEL EXECUTIVO & EVOLUÇÃO TEMPORAL -->
    <section class="slide" data-slide="2">
      <div class="slide-header">
        <div class="slide-category">Performance Temporal</div>
        <h2 class="slide-title">Evolução Mensal do NPS & Mix de Satisfação (2026)</h2>
        <p class="slide-subtitle">Trajetória ascendente consistente: ganho acumulado de +12.7 pts desde Janeiro e alcance de 71.8 em Setembro</p>
      </div>
      <div class="slide-content">
        <div class="kpi-row-6">
          <div class="kpi-card">
            <div class="kpi-label">Média Histórica (9M)</div>
            <div class="kpi-val">66.7</div>
            <div class="kpi-delta neu">10.366 pesquisas</div>
          </div>
          <div class="kpi-card danger">
            <div class="kpi-label">Mínima (Jan/26)</div>
            <div class="kpi-val">59.1</div>
            <div class="kpi-delta neg">15.5% Detratores</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-label">Mês Anterior (Ago/26)</div>
            <div class="kpi-val">70.2</div>
            <div class="kpi-delta pos">+1.1 pts vs Jul</div>
          </div>
          <div class="kpi-card highlight">
            <div class="kpi-label">Safra Fechada (Set/26)</div>
            <div class="kpi-val">71.8</div>
            <div class="kpi-delta pos">+1.6 pts MoM</div>
          </div>
          <div class="kpi-card success">
            <div class="kpi-label">Prévia Parcial (Out/26)</div>
            <div class="kpi-val">72.5</div>
            <div class="kpi-delta pos">+0.7 pts (69 pesq)</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-label">Taxa Detração Set/26</div>
            <div class="kpi-val">10.2%</div>
            <div class="kpi-delta pos">-0.4 p.p. vs Ago</div>
          </div>
        </div>

        <div class="split-view">
          <div class="chart-card">
            <div class="chart-header">Trajetória Mensal de NPS (Jan - Out/2026)</div>
            <div class="chart-container">
              <canvas id="chartEvolucaoNPS"></canvas>
            </div>
          </div>
          <div class="side-panel">
            <div class="side-panel-title">Takeaways Executivos</div>
            <ul class="takeaway-list">
              <li><strong>Evolução Estrutural Consistente</strong>: A Regional 122 superou o patamar crítico de Q1 (<strong>59.1 a 63.2 NPS</strong>) e consolidou três meses consecutivos acima de 70 pontos (<strong>70.2 em Ago, 71.8 em Set e prévia de 72.5 em Out</strong>).</li>
              <li><strong>Compressão Contínua da Detração</strong>: O índice de clientes detratores caiu de <strong>15.5% em Janeiro</strong> e <strong>12.7% em Junho</strong> para <strong>10.2% em Setembro</strong>, com a prévia de Outubro apontando para <strong>8.7%</strong>.</li>
              <li><strong>Volume Core da Diretoria 1</strong>: A regional sustenta a maior base de clientes da D1 (<strong>586 pesquisas em Setembro</strong> e mais de 10.300 no ano), o que confere altíssima robustez estatística aos diagnósticos.</li>
              <li><strong>Gap para a Meta Corporativa</strong>: Apesar do progresso, a regional está a <strong>3.2 pontos da meta de 75.0 NPS</strong>. O foco deve ser a blindagem do final de semana e a erradicação de práticas de venda casada em balcão.</li>
            </ul>
          </div>
        </div>
      </div>
    </section>

    <!-- SLIDE 3: O PAPEL DA REGIONAL NO CONTEXTO DA DIRETORIA -->
    <section class="slide" data-slide="3">
      <div class="slide-header">
        <div class="slide-category">Benchmark Regional</div>
        <h2 class="slide-title">Posicionamento da Regional 122 na Diretoria 1 (Setembro/2026)</h2>
        <p class="slide-subtitle">Maior regional em volume da diretoria (13.37% share); tração de alavancagem neutra-ofensora (-0.10 p.p.)</p>
      </div>
      <div class="slide-content">
        <div class="kpi-row">
          <div class="kpi-card">
            <div class="kpi-label">NPS Consolidado Diretoria 1</div>
            <div class="kpi-val">72.5</div>
            <div class="kpi-delta neu">4.384 Pesquisas • 71.8% Promotores</div>
          </div>
          <div class="kpi-card highlight">
            <div class="kpi-label">NPS Regional 122</div>
            <div class="kpi-val">71.8</div>
            <div class="kpi-delta neg">-0.7 pts vs Diretoria 1</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-label">Posição no Ranking D1</div>
            <div class="kpi-val">#7*</div>
            <div class="kpi-delta neu">7º lugar geral (empatada tecnicamente com R119)</div>
          </div>
          <div class="kpi-card danger">
            <div class="kpi-label">Impacto Leave-One-Out</div>
            <div class="kpi-val">-0.10 p.p.</div>
            <div class="kpi-delta neg">Sem Reg 122, Diretoria 1 sobe para 72.62</div>
          </div>
        </div>

        <div class="table-container">
          <table class="analise-table">
            <thead>
              <tr>
                <th class="text-center">Pos</th>
                <th>Regional Filial</th>
                <th class="text-right">Pesquisas</th>
                <th class="text-right">Share D1 (%)</th>
                <th class="text-right">% Promotor</th>
                <th class="text-right">% Neutro</th>
                <th class="text-right">% Detrator</th>
                <th class="text-right">NPS Real</th>
                <th class="text-right">NPS s/ Regional</th>
                <th class="text-right">Impacto LOO (p.p.)</th>
                <th class="text-center">Classificação</th>
              </tr>
            </thead>
            <tbody>
              <tr style="opacity: 0.7;">
                <td class="text-center">-</td>
                <td>Regional 888 (Piloto/Online)</td>
                <td class="text-right">1</td>
                <td class="text-right">0.02%</td>
                <td class="text-right">100.0%</td>
                <td class="text-right">0.0%</td>
                <td class="text-right">0.0%</td>
                <td class="text-right">100.0</td>
                <td class="text-right">72.51</td>
                <td class="text-right badge-pos">+0.01</td>
                <td class="text-center"><span class="badge-nps-excelente">Piloto</span></td>
              </tr>
              <tr>
                <td class="text-center">1º</td>
                <td>Regional 110</td>
                <td class="text-right">196</td>
                <td class="text-right">4.47%</td>
                <td class="text-right">87.8%</td>
                <td class="text-right">6.6%</td>
                <td class="text-right">5.6%</td>
                <td class="text-right">82.1</td>
                <td class="text-right">72.06</td>
                <td class="text-right"><span class="badge-pos">+0.45</span></td>
                <td class="text-center"><span class="badge-nps-excelente">Excelente</span></td>
              </tr>
              <tr>
                <td class="text-center">2º</td>
                <td>Regional 114</td>
                <td class="text-right">283</td>
                <td class="text-right">6.46%</td>
                <td class="text-right">87.6%</td>
                <td class="text-right">6.4%</td>
                <td class="text-right">6.0%</td>
                <td class="text-right">81.6</td>
                <td class="text-right">71.88</td>
                <td class="text-right"><span class="badge-pos">+0.63</span></td>
                <td class="text-center"><span class="badge-nps-excelente">Excelente</span></td>
              </tr>
              <tr>
                <td class="text-center">3º</td>
                <td>Regional 115</td>
                <td class="text-right">245</td>
                <td class="text-right">5.59%</td>
                <td class="text-right">86.1%</td>
                <td class="text-right">6.5%</td>
                <td class="text-right">7.3%</td>
                <td class="text-right">78.8</td>
                <td class="text-right">72.14</td>
                <td class="text-right"><span class="badge-pos">+0.37</span></td>
                <td class="text-center"><span class="badge-nps-qualidade">Qualidade</span></td>
              </tr>
              <tr>
                <td class="text-center">4º</td>
                <td>Regional 117</td>
                <td class="text-right">252</td>
                <td class="text-right">5.75%</td>
                <td class="text-right">85.3%</td>
                <td class="text-right">7.1%</td>
                <td class="text-right">7.5%</td>
                <td class="text-right">77.8</td>
                <td class="text-right">72.19</td>
                <td class="text-right"><span class="badge-pos">+0.32</span></td>
                <td class="text-center"><span class="badge-nps-qualidade">Qualidade</span></td>
              </tr>
              <tr>
                <td class="text-center">5º</td>
                <td>Regional 113</td>
                <td class="text-right">285</td>
                <td class="text-right">6.50%</td>
                <td class="text-right">82.5%</td>
                <td class="text-right">7.7%</td>
                <td class="text-right">9.8%</td>
                <td class="text-right">72.6</td>
                <td class="text-right">72.51</td>
                <td class="text-right"><span class="badge-pos">+0.01</span></td>
                <td class="text-center"><span class="badge-nps-qualidade">Qualidade</span></td>
              </tr>
              <tr>
                <td class="text-center">6º</td>
                <td>Regional 119</td>
                <td class="text-right">451</td>
                <td class="text-right">10.29%</td>
                <td class="text-right">82.9%</td>
                <td class="text-right">6.0%</td>
                <td class="text-right">11.1%</td>
                <td class="text-right">71.8</td>
                <td class="text-right">72.59</td>
                <td class="text-right"><span class="badge-neg">-0.08</span></td>
                <td class="text-center"><span class="badge-nps-qualidade">Qualidade</span></td>
              </tr>
              <tr class="row-highlight">
                <td class="text-center"><strong>7º</strong></td>
                <td><strong>REGIONAL 122 (Foco do Estudo)</strong></td>
                <td class="text-right"><strong>586</strong></td>
                <td class="text-right"><strong>13.37%</strong></td>
                <td class="text-right"><strong>82.1%</strong></td>
                <td class="text-right"><strong>7.7%</strong></td>
                <td class="text-right"><strong>10.2%</strong></td>
                <td class="text-right"><strong>71.8</strong></td>
                <td class="text-right"><strong>72.62</strong></td>
                <td class="text-right"><span class="badge-neg">-0.10</span></td>
                <td class="text-center"><span class="badge-nps-qualidade">Qualidade (Líder Volume)</span></td>
              </tr>
              <tr>
                <td class="text-center">8º</td>
                <td>Regional 118</td>
                <td class="text-right">547</td>
                <td class="text-right">12.48%</td>
                <td class="text-right">81.2%</td>
                <td class="text-right">8.4%</td>
                <td class="text-right">10.4%</td>
                <td class="text-right">70.7</td>
                <td class="text-right">72.77</td>
                <td class="text-right"><span class="badge-neg">-0.25</span></td>
                <td class="text-center"><span class="badge-nps-qualidade">Qualidade</span></td>
              </tr>
              <tr>
                <td class="text-center">9º</td>
                <td>Regional 116</td>
                <td class="text-right">324</td>
                <td class="text-right">7.39%</td>
                <td class="text-right">79.9%</td>
                <td class="text-right">10.2%</td>
                <td class="text-right">9.9%</td>
                <td class="text-right">70.1</td>
                <td class="text-right">72.71</td>
                <td class="text-right"><span class="badge-neg">-0.20</span></td>
                <td class="text-center"><span class="badge-nps-qualidade">Qualidade</span></td>
              </tr>
              <tr>
                <td class="text-center">10º</td>
                <td>Regional 112</td>
                <td class="text-right">232</td>
                <td class="text-right">5.29%</td>
                <td class="text-right">81.5%</td>
                <td class="text-right">6.9%</td>
                <td class="text-right">11.6%</td>
                <td class="text-right">69.8</td>
                <td class="text-right">72.66</td>
                <td class="text-right"><span class="badge-neg">-0.15</span></td>
                <td class="text-center"><span class="badge-nps-aperfeicoamento">Aperfeiçoamento</span></td>
              </tr>
              <tr>
                <td class="text-center">11º</td>
                <td>Regional 120</td>
                <td class="text-right">575</td>
                <td class="text-right">13.12%</td>
                <td class="text-right">81.6%</td>
                <td class="text-right">5.9%</td>
                <td class="text-right">12.5%</td>
                <td class="text-right">69.0</td>
                <td class="text-right">73.04</td>
                <td class="text-right"><span class="badge-neg">-0.52</span></td>
                <td class="text-center"><span class="badge-nps-aperfeicoamento">Aperfeiçoamento</span></td>
              </tr>
              <tr>
                <td class="text-center">12º</td>
                <td>Regional 121</td>
                <td class="text-right">407</td>
                <td class="text-right">78.6%</td>
                <td class="text-right">9.28%</td>
                <td class="text-right">9.6%</td>
                <td class="text-right">11.8%</td>
                <td class="text-right">66.8</td>
                <td class="text-right">73.10</td>
                <td class="text-right"><span class="badge-neg">-0.58</span></td>
                <td class="text-center"><span class="badge-nps-aperfeicoamento">Aperfeiçoamento</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </section>

    <!-- SLIDE 4: RANKING, DISPERSÃO & POLARIZAÇÃO DAS FILIAIS -->
    <section class="slide" data-slide="4">
      <div class="slide-header">
        <div class="slide-category">Visão de Rede Interna</div>
        <h2 class="slide-title">Ranking Geral & Dispersão das 19 Filiais (Setembro/2026)</h2>
        <p class="slide-subtitle">Dispersão aguda de 57.9 p.p. entre a líder (NPS 100.0) e a ofensora crítica (NPS 42.1)</p>
      </div>
      <div class="slide-content">
        <div class="table-container">
          <table class="analise-table">
            <thead>
              <tr>
                <th class="text-center">Filial</th>
                <th>Tipo</th>
                <th>Porte</th>
                <th class="text-right">Pesquisas</th>
                <th class="text-right">Share Reg</th>
                <th class="text-right">Promotores</th>
                <th class="text-right">Neutros</th>
                <th class="text-right">Detratores</th>
                <th class="text-right">% Promotor</th>
                <th class="text-right">% Detrator</th>
                <th class="text-right">NPS Filial</th>
                <th class="text-center">Status NPS</th>
              </tr>
            </thead>
            <tbody>
              <tr style="background: #F0FDF4;">
                <td class="text-center"><strong>2032</strong></td>
                <td>SHOPPING</td>
                <td><span class="badge-porte">PORTE 3</span></td>
                <td class="text-right">13</td>
                <td class="text-right">2.2%</td>
                <td class="text-right">13</td>
                <td class="text-right">0</td>
                <td class="text-right">0</td>
                <td class="text-right">100.0%</td>
                <td class="text-right">0.0%</td>
                <td class="text-right"><strong>100.0</strong></td>
                <td class="text-center"><span class="badge-nps-excelente">Excelente (Líder)</span></td>
              </tr>
              <tr style="background: #F0FDF4;">
                <td class="text-center"><strong>1563</strong></td>
                <td>RUA</td>
                <td><span class="badge-porte">PORTE 3</span></td>
                <td class="text-right">16</td>
                <td class="text-right">2.7%</td>
                <td class="text-right">15</td>
                <td class="text-right">1</td>
                <td class="text-right">0</td>
                <td class="text-right">93.8%</td>
                <td class="text-right">0.0%</td>
                <td class="text-right"><strong>93.8</strong></td>
                <td class="text-center"><span class="badge-nps-excelente">Excelente</span></td>
              </tr>
              <tr style="background: #F0FDF4;">
                <td class="text-center"><strong>1613</strong></td>
                <td>RUA</td>
                <td><span class="badge-porte">PORTE 3</span></td>
                <td class="text-right">21</td>
                <td class="text-right">3.6%</td>
                <td class="text-right">19</td>
                <td class="text-right">1</td>
                <td class="text-right">1</td>
                <td class="text-right">90.5%</td>
                <td class="text-right">4.8%</td>
                <td class="text-right"><strong>85.7</strong></td>
                <td class="text-center"><span class="badge-nps-excelente">Excelente</span></td>
              </tr>
              <tr class="row-highlight">
                <td class="text-center"><strong>1456</strong></td>
                <td>RUA</td>
                <td><span class="badge-porte">PORTE 5</span></td>
                <td class="text-right"><strong>46</strong></td>
                <td class="text-right"><strong>7.8%</strong></td>
                <td class="text-right">41</td>
                <td class="text-right">2</td>
                <td class="text-right">3</td>
                <td class="text-right">89.1%</td>
                <td class="text-right">6.5%</td>
                <td class="text-right"><strong>82.6</strong></td>
                <td class="text-center"><span class="badge-nps-excelente">Excelente (Volume)</span></td>
              </tr>
              <tr>
                <td class="text-center"><strong>1103</strong></td>
                <td>SHOPPING</td>
                <td><span class="badge-porte">PORTE 4</span></td>
                <td class="text-right">15</td>
                <td class="text-right">2.6%</td>
                <td class="text-right">13</td>
                <td class="text-right">1</td>
                <td class="text-right">1</td>
                <td class="text-right">86.7%</td>
                <td class="text-right">6.7%</td>
                <td class="text-right"><strong>80.0</strong></td>
                <td class="text-center"><span class="badge-nps-excelente">Excelente</span></td>
              </tr>
              <tr>
                <td class="text-center"><strong>1116</strong></td>
                <td>RUA</td>
                <td><span class="badge-porte">PORTE 4</span></td>
                <td class="text-right">34</td>
                <td class="text-right">5.8%</td>
                <td class="text-right">29</td>
                <td class="text-right">3</td>
                <td class="text-right">2</td>
                <td class="text-right">85.3%</td>
                <td class="text-right">5.9%</td>
                <td class="text-right"><strong>79.4</strong></td>
                <td class="text-center"><span class="badge-nps-qualidade">Qualidade</span></td>
              </tr>
              <tr>
                <td class="text-center"><strong>1146</strong></td>
                <td>RUA</td>
                <td><span class="badge-porte">PORTE 3</span></td>
                <td class="text-right">24</td>
                <td class="text-right">4.1%</td>
                <td class="text-right">20</td>
                <td class="text-right">3</td>
                <td class="text-right">1</td>
                <td class="text-right">83.3%</td>
                <td class="text-right">4.2%</td>
                <td class="text-right"><strong>79.2</strong></td>
                <td class="text-center"><span class="badge-nps-qualidade">Qualidade</span></td>
              </tr>
              <tr>
                <td class="text-center"><strong>1603</strong></td>
                <td>SHOPPING</td>
                <td><span class="badge-porte">PORTE 4</span></td>
                <td class="text-right">28</td>
                <td class="text-right">4.8%</td>
                <td class="text-right">24</td>
                <td class="text-right">2</td>
                <td class="text-right">2</td>
                <td class="text-right">85.7%</td>
                <td class="text-right">7.1%</td>
                <td class="text-right"><strong>78.6</strong></td>
                <td class="text-center"><span class="badge-nps-qualidade">Qualidade</span></td>
              </tr>
              <tr>
                <td class="text-center"><strong>1218</strong></td>
                <td>RUA</td>
                <td><span class="badge-porte">PORTE 3</span></td>
                <td class="text-right">22</td>
                <td class="text-right">3.8%</td>
                <td class="text-right">18</td>
                <td class="text-right">2</td>
                <td class="text-right">2</td>
                <td class="text-right">81.8%</td>
                <td class="text-right">9.1%</td>
                <td class="text-right"><strong>72.7</strong></td>
                <td class="text-center"><span class="badge-nps-qualidade">Qualidade</span></td>
              </tr>
              <tr>
                <td class="text-center"><strong>1268</strong></td>
                <td>RUA</td>
                <td><span class="badge-porte">PORTE 5</span></td>
                <td class="text-right">29</td>
                <td class="text-right">4.9%</td>
                <td class="text-right">23</td>
                <td class="text-right">4</td>
                <td class="text-right">2</td>
                <td class="text-right">79.3%</td>
                <td class="text-right">6.9%</td>
                <td class="text-right"><strong>72.4</strong></td>
                <td class="text-center"><span class="badge-nps-qualidade">Qualidade</span></td>
              </tr>
              <tr class="row-highlight">
                <td class="text-center"><strong>3000</strong></td>
                <td>RUA</td>
                <td><span class="badge-porte">PORTE 6</span></td>
                <td class="text-right"><strong>142</strong></td>
                <td class="text-right"><strong>24.2%</strong></td>
                <td class="text-right">115</td>
                <td class="text-right">12</td>
                <td class="text-right">15</td>
                <td class="text-right">81.0%</td>
                <td class="text-right">10.6%</td>
                <td class="text-right"><strong>70.4</strong></td>
                <td class="text-center"><span class="badge-nps-qualidade">Qualidade (Mega Volume)</span></td>
              </tr>
              <tr>
                <td class="text-center"><strong>1086</strong></td>
                <td>RUA</td>
                <td><span class="badge-porte">PORTE 2</span></td>
                <td class="text-right">13</td>
                <td class="text-right">2.2%</td>
                <td class="text-right">11</td>
                <td class="text-right">0</td>
                <td class="text-right">2</td>
                <td class="text-right">84.6%</td>
                <td class="text-right">15.4%</td>
                <td class="text-right"><strong>69.2</strong></td>
                <td class="text-center"><span class="badge-nps-aperfeicoamento">Aperfeiçoamento</span></td>
              </tr>
              <tr>
                <td class="text-center"><strong>1366</strong></td>
                <td>RUA</td>
                <td><span class="badge-porte">PORTE 4</span></td>
                <td class="text-right">42</td>
                <td class="text-right">7.2%</td>
                <td class="text-right">34</td>
                <td class="text-right">2</td>
                <td class="text-right">6</td>
                <td class="text-right">81.0%</td>
                <td class="text-right">14.3%</td>
                <td class="text-right"><strong>66.7</strong></td>
                <td class="text-center"><span class="badge-nps-aperfeicoamento">Aperfeiçoamento</span></td>
              </tr>
              <tr>
                <td class="text-center"><strong>1535</strong></td>
                <td>RUA</td>
                <td><span class="badge-porte">PORTE 4</span></td>
                <td class="text-right">20</td>
                <td class="text-right">3.4%</td>
                <td class="text-right">15</td>
                <td class="text-right">3</td>
                <td class="text-right">2</td>
                <td class="text-right">75.0%</td>
                <td class="text-right">10.0%</td>
                <td class="text-right"><strong>65.0</strong></td>
                <td class="text-center"><span class="badge-nps-aperfeicoamento">Aperfeiçoamento</span></td>
              </tr>
              <tr>
                <td class="text-center"><strong>1269</strong></td>
                <td>RUA</td>
                <td><span class="badge-porte">PORTE 6</span></td>
                <td class="text-right">42</td>
                <td class="text-right">7.2%</td>
                <td class="text-right">32</td>
                <td class="text-right">5</td>
                <td class="text-right">5</td>
                <td class="text-right">76.2%</td>
                <td class="text-right">11.9%</td>
                <td class="text-right"><strong>64.3</strong></td>
                <td class="text-center"><span class="badge-nps-aperfeicoamento">Aperfeiçoamento</span></td>
              </tr>
              <tr>
                <td class="text-center"><strong>85</strong></td>
                <td>RUA</td>
                <td><span class="badge-porte">PORTE 2</span></td>
                <td class="text-right">13</td>
                <td class="text-right">2.2%</td>
                <td class="text-right">10</td>
                <td class="text-right">1</td>
                <td class="text-right">2</td>
                <td class="text-right">76.9%</td>
                <td class="text-right">15.4%</td>
                <td class="text-right"><strong>61.5</strong></td>
                <td class="text-center"><span class="badge-nps-aperfeicoamento">Aperfeiçoamento</span></td>
              </tr>
              <tr style="background: #FFF5F5;">
                <td class="text-center"><strong>1115</strong></td>
                <td>RUA</td>
                <td><span class="badge-porte">PORTE 5</span></td>
                <td class="text-right">36</td>
                <td class="text-right">6.1%</td>
                <td class="text-right">28</td>
                <td class="text-right">1</td>
                <td class="text-right">7</td>
                <td class="text-right">77.8%</td>
                <td class="text-right">19.4%</td>
                <td class="text-right"><strong>58.3</strong></td>
                <td class="text-center"><span class="badge-nps-critico">Crítico (Ofensora)</span></td>
              </tr>
              <tr style="background: #FFF5F5;">
                <td class="text-center"><strong>1593</strong></td>
                <td>RUA</td>
                <td><span class="badge-porte">PORTE 3</span></td>
                <td class="text-right">11</td>
                <td class="text-right">1.9%</td>
                <td class="text-right">8</td>
                <td class="text-right">1</td>
                <td class="text-right">2</td>
                <td class="text-right">72.7%</td>
                <td class="text-right">18.2%</td>
                <td class="text-right"><strong>54.5</strong></td>
                <td class="text-center"><span class="badge-nps-critico">Crítico (Ofensora)</span></td>
              </tr>
              <tr style="background: #FEE2E2;">
                <td class="text-center"><strong>1219</strong></td>
                <td>RUA</td>
                <td><span class="badge-porte">PORTE 4</span></td>
                <td class="text-right">19</td>
                <td class="text-right">3.2%</td>
                <td class="text-right">13</td>
                <td class="text-right">1</td>
                <td class="text-right">5</td>
                <td class="text-right">68.4%</td>
                <td class="text-right">26.3%</td>
                <td class="text-right"><strong>42.1</strong></td>
                <td class="text-center"><span class="badge-nps-critico">Crítico Extremo</span></td>
              </tr>
            </tbody>
          </table>
        </div>
        <div class="quote-box">
          <strong>Síntese de Dispersão:</strong> Enquanto as <strong>Top 4 lojas (2032, 1563, 1613, 1456)</strong> somam 96 pesquisas com média de 88.5 NPS e apenas 4 detratores (4.2%), as <strong>Bottom 3 (1219, 1593, 1115)</strong> concentram 14 dos 60 detratores com detração média de 21.2%.
        </div>
      </div>
    </section>

    <!-- SLIDE 5: DECOMPOSIÇÃO DE IMPACTO LÍQUIDO DAS FILIAIS (LEAVE-ONE-OUT) -->
    <section class="slide" data-slide="5">
      <div class="slide-header">
        <div class="slide-category">Diagnóstico Causal</div>
        <h2 class="slide-title">Decomposição de Impacto Leave-One-Out & Matriz de Urgência</h2>
        <p class="slide-subtitle">Isolamento matemático estrito: filiais que deprimem a nota regional e unidades de sustentação</p>
      </div>
      <div class="slide-content">
        <div class="split-view">
          <div class="table-container">
            <table class="analise-table">
              <thead>
                <tr>
                  <th>Filial Alvo</th>
                  <th class="text-right">Pesquisas</th>
                  <th class="text-right">NPS</th>
                  <th class="text-right">NPS s/ Loja</th>
                  <th class="text-right">Impacto LOO</th>
                  <th class="text-center">Ação Prioritária</th>
                </tr>
              </thead>
              <tbody>
                <tr style="background: #FEE2E2;">
                  <td><strong>Filial 1219 (Crítica)</strong></td>
                  <td class="text-right">19</td>
                  <td class="text-right" style="color: var(--cb-danger);">42.1</td>
                  <td class="text-right">72.84</td>
                  <td class="text-right"><span class="badge-neg">-1.00 p.p.</span></td>
                  <td class="text-center"><span class="badge-nps-critico">Intervenção Imediata</span></td>
                </tr>
                <tr style="background: #FFF5F5;">
                  <td><strong>Filial 1115</strong></td>
                  <td class="text-right">36</td>
                  <td class="text-right" style="color: var(--cb-danger);">58.3</td>
                  <td class="text-right">72.73</td>
                  <td class="text-right"><span class="badge-neg">-0.88 p.p.</span></td>
                  <td class="text-center"><span class="badge-nps-critico">Plano de Choque</span></td>
                </tr>
                <tr style="background: #FFF5F5;">
                  <td><strong>Filial 1269</strong></td>
                  <td class="text-right">42</td>
                  <td class="text-right" style="color: var(--cb-danger);">64.3</td>
                  <td class="text-right">72.43</td>
                  <td class="text-right"><span class="badge-neg">-0.58 p.p.</span></td>
                  <td class="text-center"><span class="badge-nps-critico">Plano de Choque</span></td>
                </tr>
                <tr style="background: #FFF5F5;">
                  <td><strong>Filial 3000 (Mega Loja)</strong></td>
                  <td class="text-right"><strong>142</strong></td>
                  <td class="text-right">70.4</td>
                  <td class="text-right">72.30</td>
                  <td class="text-right"><span class="badge-neg">-0.45 p.p.</span></td>
                  <td class="text-center"><span class="badge-nps-aperfeicoamento">Revisão de Escala</span></td>
                </tr>
                <tr>
                  <td><strong>Filial 1366</strong></td>
                  <td class="text-right">42</td>
                  <td class="text-right">66.7</td>
                  <td class="text-right">72.24</td>
                  <td class="text-right"><span class="badge-neg">-0.40 p.p.</span></td>
                  <td class="text-center"><span class="badge-nps-aperfeicoamento">Revisão Gerencial</span></td>
                </tr>
                <tr>
                  <td>Filial 1593</td>
                  <td class="text-right">11</td>
                  <td class="text-right">54.5</td>
                  <td class="text-right">72.17</td>
                  <td class="text-right"><span class="badge-neg">-0.33 p.p.</span></td>
                  <td class="text-center"><span class="badge-nps-aperfeicoamento">Auditoria Balcão</span></td>
                </tr>
                <tr class="row-highlight">
                  <td><strong>Filial 1456 (Impulsionadora)</strong></td>
                  <td class="text-right"><strong>46</strong></td>
                  <td class="text-right" style="color: var(--cb-success);"><strong>82.6</strong></td>
                  <td class="text-right"><strong>70.93</strong></td>
                  <td class="text-right"><span class="badge-pos"><strong>+0.92 p.p.</strong></span></td>
                  <td class="text-center"><span class="badge-nps-excelente">Benchmark Rede</span></td>
                </tr>
                <tr>
                  <td><strong>Filial 2032 (Shopping)</strong></td>
                  <td class="text-right">13</td>
                  <td class="text-right" style="color: var(--cb-success);">100.0</td>
                  <td class="text-right">71.20</td>
                  <td class="text-right"><span class="badge-pos">+0.64 p.p.</span></td>
                  <td class="text-center"><span class="badge-nps-excelente">Sustentação</span></td>
                </tr>
                <tr>
                  <td><strong>Filial 1563</strong></td>
                  <td class="text-right">16</td>
                  <td class="text-right" style="color: var(--cb-success);">93.8</td>
                  <td class="text-right">71.23</td>
                  <td class="text-right"><span class="badge-pos">+0.61 p.p.</span></td>
                  <td class="text-center"><span class="badge-nps-excelente">Sustentação</span></td>
                </tr>
                <tr>
                  <td><strong>Filial 1613</strong></td>
                  <td class="text-right">21</td>
                  <td class="text-right" style="color: var(--cb-success);">85.7</td>
                  <td class="text-right">71.33</td>
                  <td class="text-right"><span class="badge-pos">+0.52 p.p.</span></td>
                  <td class="text-center"><span class="badge-nps-excelente">Sustentação</span></td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="matrix-grid">
            <div class="matrix-card q-critico">
              <div class="matrix-title" style="color: var(--cb-danger);">
                <span>Q1: Urgência Crítica</span>
                <span class="badge-neg">-3.31 p.p.</span>
              </div>
              <p style="font-size: 11px; color: var(--cb-gray-700);"><strong>Filiais 1219, 1115, 1269, 1366 e 3000:</strong> Concentram 38 dos 60 detratores da regional. Sem este grupo, o NPS regional saltaria para <strong>75.15 (+3.3 p.p.)</strong>, atingindo a meta.</p>
            </div>
            <div class="matrix-card q-alerta">
              <div class="matrix-title" style="color: var(--cb-warning);">
                <span>Q2: Alerta Operacional</span>
                <span class="badge-neg">-0.86 p.p.</span>
              </div>
              <p style="font-size: 11px; color: var(--cb-gray-700);"><strong>Filiais 1593, 85, 1086 e 1535:</strong> Volume moderado/baixo, mas com taxas de detração entre 10.0% e 18.2%. Queixas de embutimento de serviços no balcão.</p>
            </div>
            <div class="matrix-card q-estavel">
              <div class="matrix-title" style="color: var(--cb-info);">
                <span>Q3: Estabilidade Neutra</span>
                <span>Neutro</span>
              </div>
              <p style="font-size: 11px; color: var(--cb-gray-700);"><strong>Filiais 1218, 1268, 1146, 1103:</strong> Impacto individual nulo ou ligeiramente positivo (+0.03 a +0.31 p.p.). Operação sob controle sem picos de detração.</p>
            </div>
            <div class="matrix-card q-fortaleza">
              <div class="matrix-title" style="color: var(--cb-success);">
                <span>Q4: Pilares de Sustentação</span>
                <span class="badge-pos">+3.16 p.p.</span>
              </div>
              <p style="font-size: 11px; color: var(--cb-gray-700);"><strong>Filiais 1456, 2032, 1563, 1613 e 1116:</strong> 130 pesquisas com NPS médio de 87.0. Sustentam o patamar positivo da Regional 122 na diretoria.</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- SLIDE 6: DIAGNÓSTICO DAS JORNADAS DE ATENDIMENTO E CUMPRIMENTO -->
    <section class="slide" data-slide="6">
      <div class="slide-header">
        <div class="slide-category">Jornadas do Cliente</div>
        <h2 class="slide-title">Desempenho por Modalidade de Cumprimento & Pontos de Fricção</h2>
        <p class="slide-subtitle">Retirada em loja lidera em volume; Vendedor Online com entrega CD e Cancelamento deprimem o resultado</p>
      </div>
      <div class="slide-content">
        <div class="journey-grid">
          <div class="journey-card" style="border-top-color: var(--cb-blue-primary);">
            <div>
              <div class="kpi-label">Retira Loja (Click & Collect)</div>
              <div class="kpi-val" style="color: var(--cb-blue-primary);">77.1</div>
              <div style="font-size: 10px; color: var(--cb-gray-600); margin-top: 3px;">
                <strong>192 Pesquisas</strong> (32.8% share)
              </div>
            </div>
            <div style="font-size: 10px; color: var(--cb-gray-700); line-height: 1.35; margin-top: 6px;">
              <strong>Maior canal da regional</strong>. 85.4% promotores e 8.3% detratores. Fricção em conferência demorada no pacote.
            </div>
          </div>

          <div class="journey-card" style="border-top-color: var(--cb-blue-primary);">
            <div>
              <div class="kpi-label">Saída Loja (Pronta Entrega)</div>
              <div class="kpi-val" style="color: var(--cb-blue-primary);">77.2</div>
              <div style="font-size: 10px; color: var(--cb-gray-600); margin-top: 3px;">
                <strong>92 Pesquisas</strong> (15.7% share)
              </div>
            </div>
            <div style="font-size: 10px; color: var(--cb-gray-700); line-height: 1.35; margin-top: 6px;">
              <strong>83.7% Promotores</strong> e apenas 6.5% detratores. Leva o produto no ato da aprovação CDC. Fluxo estável.
            </div>
          </div>

          <div class="journey-card" style="border-top-color: var(--cb-blue-primary);">
            <div>
              <div class="kpi-label">CDC c/ Entrega CD</div>
              <div class="kpi-val" style="color: var(--cb-blue-primary);">76.6</div>
              <div style="font-size: 10px; color: var(--cb-gray-600); margin-top: 3px;">
                <strong>64 Pesquisas</strong> (10.9% share)
              </div>
            </div>
            <div style="font-size: 10px; color: var(--cb-gray-700); line-height: 1.35; margin-top: 6px;">
              <strong>84.4% Promotores</strong> e 7.8% detratores. Boa precisão de frete financiado no carnê digital Casas Bahia.
            </div>
          </div>

          <div class="journey-card" style="border-top-color: var(--cb-warning);">
            <div>
              <div class="kpi-label">Entrega CD (Tradicional)</div>
              <div class="kpi-val" style="color: var(--cb-warning);">69.6</div>
              <div style="font-size: 10px; color: var(--cb-gray-600); margin-top: 3px;">
                <strong>92 Pesquisas</strong> (15.7% share)
              </div>
            </div>
            <div style="font-size: 10px; color: var(--cb-gray-700); line-height: 1.35; margin-top: 6px;">
              <strong>12.0% Detratores</strong>. Queixas de atraso no agendamento e avaria física de móveis durante o frete rodoviário.
            </div>
          </div>

          <div class="journey-card" style="border-top-color: var(--cb-danger); background: #FFFDFD;">
            <div>
              <div class="kpi-label">Vendedor Online / CD</div>
              <div class="kpi-val" style="color: var(--cb-danger);">66.4</div>
              <div style="font-size: 10px; color: var(--cb-gray-600); margin-top: 3px;">
                <strong>137 Pesquisas</strong> (23.4% share)
              </div>
            </div>
            <div style="font-size: 10px; color: var(--cb-gray-700); line-height: 1.35; margin-top: 6px;">
              <strong>Grande ofensor em escala</strong>. 12.4% detratores. Atrasos de até 10 dias na entrega e falta de pós-venda.
            </div>
          </div>

          <div class="journey-card" style="border-top-color: var(--cb-danger); background: #FFF5F5;">
            <div>
              <div class="kpi-label">Cancelamento Retorno Loja</div>
              <div class="kpi-val" style="color: var(--cb-danger);">-22.2</div>
              <div style="font-size: 10px; color: var(--cb-gray-600); margin-top: 3px;">
                <strong>9 Pesquisas</strong> (1.5% share)
              </div>
            </div>
            <div style="font-size: 10px; color: var(--cb-gray-700); line-height: 1.35; margin-top: 6px;">
              <strong>55.6% Detratores</strong>. Burocracia extrema no estorno do carnê e morosidade sistêmica para emissão de vale.
            </div>
          </div>
        </div>

        <div class="split-view" style="flex: 0.85;">
          <div class="side-panel" style="background: var(--cb-white);">
            <div class="side-panel-title">Diagnóstico de Estrangulamento: Físico vs Logística CD</div>
            <ul class="takeaway-list">
              <li><strong>Descompasso do Vendedor Online (66.4 NPS)</strong>: Canal representa <strong>23.4% do volume regional</strong> e puxa a nota para baixo com 17 detratores. O vendedor conclui a venda via link assistido, mas o fulfillment via CD falha em cumprir a data prometida.</li>
              <li><strong>Retira Loja é Fortaleza de Satisfação (77.1 NPS)</strong>: Com <strong>32.8% de todas as avaliações</strong>, a retirada na loja física gera 164 promotores, comprovando a eficiência do tráfego omnicanal na regional.</li>
            </ul>
          </div>
          <div class="side-panel" style="background: var(--cb-white);">
            <div class="side-panel-title">Diretrizes Imediatas por Modalidade</div>
            <ul class="takeaway-list">
              <li><strong>Rastreamento Ativo Vendedor Online</strong>: Disponibilizar notificação automática via WhatsApp para o cliente acompanhar o status do CD até a rota final.</li>
              <li><strong>Autonomia de Balcão para Troca Imediata</strong>: Delegar ao gerente de loja alçada de estorno sem exigência de protocolo em call center.</li>
            </ul>
          </div>
        </div>
      </div>
    </section>

    <!-- SLIDE 7: SEGMENTAÇÃO OPERACIONAL: PORTE, TIPO E DIA DA SEMANA -->
    <section class="slide" data-slide="7">
      <div class="slide-header">
        <div class="slide-category">Segmentação Operacional</div>
        <h2 class="slide-title">Estrutura de Loja, Canal Físico & Efeito Crítico de Final de Semana</h2>
        <p class="slide-subtitle">Shoppings lideram com 83.9 NPS; Domingo é o calcanhar de Aquiles operacional (51.8 NPS com 19.6% detração)</p>
      </div>
      <div class="slide-content">
        <div class="split-view-equal">
          <div class="chart-card">
            <div class="chart-header">Desempenho por Porte de Loja (Setembro/2026)</div>
            <div class="table-container" style="max-height: 180px;">
              <table class="analise-table">
                <thead>
                  <tr>
                    <th>Porte Loja</th>
                    <th class="text-right">Pesquisas</th>
                    <th class="text-right">Share (%)</th>
                    <th class="text-right">% Promotor</th>
                    <th class="text-right">% Detrator</th>
                    <th class="text-right">NPS</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style="background: #F0FDF4;">
                    <td><strong>PORTE 3</strong> (Intermediárias)</td>
                    <td class="text-right">107</td>
                    <td class="text-right">18.3%</td>
                    <td class="text-right">86.9%</td>
                    <td class="text-right">5.6%</td>
                    <td class="text-right"><span class="badge-pos">81.3</span></td>
                  </tr>
                  <tr>
                    <td><strong>PORTE 5</strong> (Megastores)</td>
                    <td class="text-right">111</td>
                    <td class="text-right">18.9%</td>
                    <td class="text-right">82.9%</td>
                    <td class="text-right">10.8%</td>
                    <td class="text-right">72.1</td>
                  </tr>
                  <tr>
                    <td><strong>PORTE 4</strong> (Grandes Lojas)</td>
                    <td class="text-right">158</td>
                    <td class="text-right">27.0%</td>
                    <td class="text-right">81.0%</td>
                    <td class="text-right">11.4%</td>
                    <td class="text-right">69.6</td>
                  </tr>
                  <tr class="row-highlight">
                    <td><strong>PORTE 6</strong> (Hiper Lojas / Hubs)</td>
                    <td class="text-right"><strong>184</strong></td>
                    <td class="text-right"><strong>31.4%</strong></td>
                    <td class="text-right">79.9%</td>
                    <td class="text-right">10.9%</td>
                    <td class="text-right"><strong>69.0</strong></td>
                  </tr>
                  <tr style="background: #FFF5F5;">
                    <td><strong>PORTE 2</strong> (Lojas Compactas)</td>
                    <td class="text-right">26</td>
                    <td class="text-right">4.4%</td>
                    <td class="text-right">80.8%</td>
                    <td class="text-right">15.4%</td>
                    <td class="text-right" style="color: var(--cb-danger);"><strong>65.4</strong></td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div style="margin-top: 10px; border-top: 1px solid var(--cb-gray-200); padding-top: 8px;">
              <div class="chart-header">Tipo de Loja: Rua vs Shopping</div>
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
                <div class="kpi-card" style="border-top-color: var(--cb-blue-primary);">
                  <div class="kpi-label">Lojas de Rua (530 pesq)</div>
                  <div class="kpi-val">70.6</div>
                  <div class="kpi-delta neu">10.8% Detratores • 90.4% Share</div>
                </div>
                <div class="kpi-card success">
                  <div class="kpi-label">Shopping (56 pesq)</div>
                  <div class="kpi-val" style="color: var(--cb-success);">83.9</div>
                  <div class="kpi-delta pos">5.4% Detratores • Gap de +13.3 p.p.</div>
                </div>
              </div>
            </div>
          </div>

          <div class="chart-card">
            <div class="chart-header">Estresse Operacional por Dia da Semana</div>
            <div class="chart-container" style="max-height: 140px;">
              <canvas id="chartDiaSemana"></canvas>
            </div>

            <div style="margin-top: 10px; display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
              <div class="kpi-card">
                <div class="kpi-label">Dias Úteis (Seg - Sex)</div>
                <div class="kpi-val">76.1</div>
                <div class="kpi-delta pos">406 pesq • 8.1% Detração</div>
              </div>
              <div class="kpi-card danger">
                <div class="kpi-label">Fim de Semana (Sáb - Dom)</div>
                <div class="kpi-val" style="color: var(--cb-danger);">62.2</div>
                <div class="kpi-delta neg">180 pesq • 15.0% Detração (-13.9 pts)</div>
              </div>
            </div>

            <div class="quote-box danger" style="margin-top: 8px;">
              <strong>Gargalo de Subdimensionamento:</strong> O Domingo desaba para <strong>51.8 NPS</strong> com <strong>19.6% de detratores</strong>, reflexo direto de escalas enxutas em operadores de caixa e ausência de apoio para retirada de pacotes.
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- SLIDE 8: SENSIBILIDADE POR CATEGORIA DE PRODUTO -->
    <section class="slide" data-slide="8">
      <div class="slide-header">
        <div class="slide-category">Inteligência de Sortimento</div>
        <h2 class="slide-title">Sensibilidade de NPS por Categoria de SKU & Fricções de Produto</h2>
        <p class="slide-subtitle">Linha Branca sustenta o core comercial; Móveis e Telas concentram atritos de entrega, avaria e garantia</p>
      </div>
      <div class="slide-content">
        <div class="split-view">
          <div class="table-container">
            <table class="analise-table">
              <thead>
                <tr>
                  <th>Categoria de SKU</th>
                  <th class="text-right">Pesquisas</th>
                  <th class="text-right">Share (%)</th>
                  <th class="text-right">% Promotor</th>
                  <th class="text-right">% Detrator</th>
                  <th class="text-right">NPS</th>
                  <th class="text-center">Nível de Risco</th>
                </tr>
              </thead>
              <tbody>
                <tr class="row-highlight">
                  <td><strong>LINHA BRANCA</strong></td>
                  <td class="text-right"><strong>146</strong></td>
                  <td class="text-right"><strong>24.9%</strong></td>
                  <td class="text-right">82.9%</td>
                  <td class="text-right">11.0%</td>
                  <td class="text-right"><strong>71.9</strong></td>
                  <td class="text-center"><span class="badge-nps-qualidade">Volume Core (16 Detratores)</span></td>
                </tr>
                <tr style="background: #F0FDF4;">
                  <td>COLCHÕES E INFANTIL</td>
                  <td class="text-right">29</td>
                  <td class="text-right">86.2%</td>
                  <td class="text-right">3.4%</td>
                  <td class="text-right"><span class="badge-pos">82.8</span></td>
                  <td class="text-center"><span class="badge-nps-excelente">Baixo Risco</span></td>
                </tr>
                <tr style="background: #FFFDF7;">
                  <td>QUARTO E MESAS/CADEIRAS</td>
                  <td class="text-right">43</td>
                  <td class="text-right">7.3%</td>
                  <td class="text-right">74.4%</td>
                  <td class="text-right">14.0%</td>
                  <td class="text-right" style="color: var(--cb-warning);"><strong>60.5</strong></td>
                  <td class="text-center"><span class="badge-nps-aperfeicoamento">Moderado (6 Detratores)</span></td>
                </tr>
                <tr style="background: #FFF5F5;">
                  <td>SALA, COZINHA E ESTOFADOS</td>
                  <td class="text-right">31</td>
                  <td class="text-right">5.3%</td>
                  <td class="text-right">71.0%</td>
                  <td class="text-right">19.4%</td>
                  <td class="text-right" style="color: var(--cb-danger);"><strong>51.6</strong></td>
                  <td class="text-center"><span class="badge-nps-critico">Crítico (6 Detratores)</span></td>
                </tr>
                <tr style="background: #FEE2E2;">
                  <td>TELAS (TVs / Monitores)</td>
                  <td class="text-right">12</td>
                  <td class="text-right">2.0%</td>
                  <td class="text-right">75.0%</td>
                  <td class="text-right">25.0%</td>
                  <td class="text-right" style="color: var(--cb-danger);"><strong>50.0</strong></td>
                  <td class="text-center"><span class="badge-nps-critico">Alto Risco (Tela Furada)</span></td>
                </tr>
                <tr>
                  <td>BELEZA E ELETROPORTÁTEIS</td>
                  <td class="text-right">5</td>
                  <td class="text-right">0.9%</td>
                  <td class="text-right">100.0%</td>
                  <td class="text-right">0.0%</td>
                  <td class="text-right"><span class="badge-pos">100.0</span></td>
                  <td class="text-center"><span class="badge-nps-excelente">Excelente</span></td>
                </tr>
                <tr>
                  <td>TELEFONIA E WEARABLES</td>
                  <td class="text-right">5</td>
                  <td class="text-right">0.9%</td>
                  <td class="text-right">100.0%</td>
                  <td class="text-right">0.0%</td>
                  <td class="text-right"><span class="badge-pos">100.0</span></td>
                  <td class="text-center"><span class="badge-nps-excelente">Excelente</span></td>
                </tr>
                <tr>
                  <td>LIVING E ENTERTAINMENT</td>
                  <td class="text-right">3</td>
                  <td class="text-right">0.5%</td>
                  <td class="text-right">100.0%</td>
                  <td class="text-right">0.0%</td>
                  <td class="text-right"><span class="badge-pos">100.0</span></td>
                  <td class="text-center"><span class="badge-nps-excelente">Excelente</span></td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="side-panel">
            <div class="side-panel-title">Mapeamento de Atritos por Categoria Core</div>
            <ul class="takeaway-list">
              <li><strong>Linha Branca (Maior Volume Regional)</strong>: Responde por 16 detratores em Setembro. Principais dores: <strong>atrasos severos na esteira de entrega CD (até 10 dias)</strong> e produto entregue amassado pela transportadora.</li>
              <li><strong>Móveis e Estofados (51.6 a 60.5 NPS)</strong>: Detração chega a <strong>19.4%</strong>. Clientes relatam falta de rastreamento de rota e desencontro de informações entre data de entrega e agendamento da montagem.</li>
              <li><strong>Telas e TV (25% de Detração)</strong>: Ponto de fricção em <strong>avaria oculta no transporte</strong>. Relato explícito de cliente com TV entregue com tela perfurada e demora de 3 meses para resolução do processo de garantia.</li>
            </ul>
          </div>
        </div>
      </div>
    </section>

    <!-- SLIDE 9: DIAGNÓSTICO DE FRICÇÃO: ATRIBUTOS FECHADOS -->
    <section class="slide" data-slide="9">
      <div class="slide-header">
        <div class="slide-category">Atributos de Pesquisa</div>
        <h2 class="slide-title">Alavancas de Encantamento vs. Detratores Fechados de Jornada</h2>
        <p class="slide-subtitle">Estrutura física e produtos sustentam a preferência; rastreamento e prazos de entrega geram atrito</p>
      </div>
      <div class="slide-content">
        <div class="split-view-equal">
          <div class="chart-card">
            <div class="chart-header" style="color: var(--cb-success);">Top Atributos de Encantamento ("O que Você Gostou")</div>
            <div class="table-container">
              <table class="analise-table">
                <thead>
                  <tr>
                    <th>Atributo Positivo Assinalado</th>
                    <th class="text-right">Menções</th>
                    <th class="text-right">% Base Voz</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><strong>Estrutura da Loja onde fez a compra</strong></td>
                    <td class="text-right"><strong>66</strong></td>
                    <td class="text-right"><span class="badge-pos">31.0%</span></td>
                  </tr>
                  <tr>
                    <td><strong>Produtos oferecidos pela loja</strong></td>
                    <td class="text-right">58</td>
                    <td class="text-right"><span class="badge-pos">27.2%</span></td>
                  </tr>
                  <tr>
                    <td>Disponibilidade do vendedor p/ necessidades futuras</td>
                    <td class="text-right">56</td>
                    <td class="text-right">26.3%</td>
                  </tr>
                  <tr>
                    <td>Atendimento na Loja física</td>
                    <td class="text-right">51</td>
                    <td class="text-right">23.9%</td>
                  </tr>
                  <tr>
                    <td>Cordialidade e atenção da equipe de atendimento</td>
                    <td class="text-right">39</td>
                    <td class="text-right">18.3%</td>
                  </tr>
                  <tr>
                    <td>Preços que a loja oferece</td>
                    <td class="text-right">36</td>
                    <td class="text-right">16.9%</td>
                  </tr>
                  <tr>
                    <td>Negociação e serviços adicionais (garantia/seguro)</td>
                    <td class="text-right">35</td>
                    <td class="text-right">16.4%</td>
                  </tr>
                  <tr>
                    <td>Facilidade para aprovação do crediário</td>
                    <td class="text-right">33</td>
                    <td class="text-right">15.5%</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div class="quote-box success" style="margin-top: 8px;">
              <strong>Fortaleza de Chão de Loja:</strong> Mais de 30% dos clientes exaltam a organização visual e a ambientação das lojas físicas da Regional 122.
            </div>
          </div>

          <div class="chart-card">
            <div class="chart-header" style="color: var(--cb-danger);">Top Atributos Ofensores ("O que Não Gostou")</div>
            <div class="table-container">
              <table class="analise-table">
                <thead>
                  <tr>
                    <th>Ofensor de Jornada Assinalado</th>
                    <th class="text-right">Menções</th>
                    <th class="text-right">% Base Voz</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style="background: #FFF5F5;">
                    <td><strong>Preços e Condições Comerciais na Loja</strong></td>
                    <td class="text-right"><strong>6</strong></td>
                    <td class="text-right"><span class="badge-neg">2.8%</span></td>
                  </tr>
                  <tr style="background: #FFF5F5;">
                    <td><strong>Acompanhamento do status de pedido e rastreamento</strong></td>
                    <td class="text-right">5</td>
                    <td class="text-right"><span class="badge-neg">2.3%</span></td>
                  </tr>
                  <tr>
                    <td>Produtos oferecidos pela loja (disponibilidade)</td>
                    <td class="text-right">5</td>
                    <td class="text-right">2.3%</td>
                  </tr>
                  <tr>
                    <td>Prazo de entrega: Prometido vs Realizado</td>
                    <td class="text-right">3</td>
                    <td class="text-right">1.4%</td>
                  </tr>
                  <tr>
                    <td>Processo de Pagamento / Meios de Pagamento</td>
                    <td class="text-right">3</td>
                    <td class="text-right">1.4%</td>
                  </tr>
                  <tr>
                    <td>Vendedor indisponível para pós-venda/apoio</td>
                    <td class="text-right">3</td>
                    <td class="text-right">1.4%</td>
                  </tr>
                  <tr>
                    <td>Clareza das condições, taxas e parcelas do carnê</td>
                    <td class="text-right">2</td>
                    <td class="text-right">0.9%</td>
                  </tr>
                  <tr>
                    <td>Dificuldades nos Canais de Cancelamento</td>
                    <td class="text-right">2</td>
                    <td class="text-right">0.9%</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div class="quote-box danger" style="margin-top: 8px;">
              <strong>Alerta Operacional:</strong> Falhas de rastreamento e quebras de prazo de frete estão 100% correlacionadas a notas 0 a 3 nos canais de entrega CD.
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- SLIDE 10: VOZ DO CLIENTE (VoC) EM PROFUNDIDADE -->
    <section class="slide" data-slide="10">
      <div class="slide-header">
        <div class="slide-category">Voz do Cliente (VoC)</div>
        <h2 class="slide-title">Mineração Semântica dos Comentários de Neutros e Detratores</h2>
        <p class="slide-subtitle">Extração contextual de causas-raiz a partir dos verbatins reais registrados na safra de Setembro/2026</p>
      </div>
      <div class="slide-content">
        <div class="cluster-grid">
          <div class="cluster-card">
            <div class="matrix-title" style="color: var(--cb-danger);">
              <span>Cluster 1: Venda Casada & Cobrança no Balcão</span>
              <span class="badge-neg">Alçada Loja (Crítico)</span>
            </div>
            <p style="font-size: 11px; color: var(--cb-gray-700);">
              <strong>Causa-Raiz:</strong> Embutimento indevido de seguros e cobrança de chip de operadora anunciado falsamente como brinde durante a venda CDC.
            </p>
            <div class="quote-box danger">
              "Em primeiro parar de fazer venda casada pois comprei um celular me disseram que estavam dando um chip de brinde e fui ver cobraram o valor do chip."<br>
              <strong>— Cliente Detrator (Nota 3), Filial 1219</strong>
            </div>
            <div class="quote-box danger" style="margin-top: -2px;">
              "Minha mãe fez uma compra e colocaram seguro sem a permissão dela, um absurdo."<br>
              <strong>— Cliente Detrator (Nota 3), Filial 1593</strong>
            </div>
          </div>

          <div class="cluster-card">
            <div class="matrix-title" style="color: var(--cb-danger);">
              <span>Cluster 2: Quebra Severa de SLA & Avaria</span>
              <span class="badge-neg">Alçada Corporativa / CD</span>
            </div>
            <p style="font-size: 11px; color: var(--cb-gray-700);">
              <strong>Causa-Raiz:</strong> Atrasos de até 10 dias úteis na esteira CD e mercadorias entregues com embalagem danificada ou amassada.
            </p>
            <div class="quote-box danger">
              "O meu pedido atrasou 10 dias e ainda foi amassada."<br>
              <strong>— Cliente Detrator (Nota 1), Filial 3000 (Vendedor Online / CD)</strong>
            </div>
            <div class="quote-box danger" style="margin-top: -2px;">
              "Honrando prazos e ter parceria com empresa de instalação melhor."<br>
              <strong>— Cliente Detrator (Nota 0), Filial 3000 (Telas)</strong>
            </div>
          </div>

          <div class="cluster-card">
            <div class="matrix-title" style="color: var(--cb-danger);">
              <span>Cluster 3: Morosidade no Pós-Venda e Garantia</span>
              <span class="badge-neg">Alçada Mista (Loja / SAC)</span>
            </div>
            <p style="font-size: 11px; color: var(--cb-gray-700);">
              <strong>Causa-Raiz:</strong> Falta de suporte pós-compra do vendedor e prazos excessivos (meses) para resolução de defeitos técnicos em produtos caros.
            </p>
            <div class="quote-box danger">
              "Atendendo com mais rapidez pedidos de garantia de produtos entregue com defeito!!! Comprei 2 Tvs uma chegou com a tela perfurada onde quando abri a caixa fiz a reclamação a empresa que levou cerca de 3 meses para resolver o caso!!"<br>
              <strong>— Cliente Neutro (Nota 8), Filial 3000</strong>
            </div>
          </div>

          <div class="cluster-card">
            <div class="matrix-title" style="color: var(--cb-danger);">
              <span>Cluster 4: Burocracia em Cancelamentos</span>
              <span class="badge-neg">Alçada Corporativa / Crédito</span>
            </div>
            <p style="font-size: 11px; color: var(--cb-gray-700);">
              <strong>Causa-Raiz:</strong> Burocracia na solicitação de estorno em loja e limites de crédito insuficientes no cartão Casas Bahia para recompra de Linha Branca.
            </p>
            <div class="quote-box danger">
              "Podiam melhorar a comunicação [Não gostou: Facilidade para cancelamento, prazo prometido de estorno, clareza e agilidade]."<br>
              <strong>— Cliente Detrator (Nota 3), Filial 3000 (Cancelamento)</strong>
            </div>
            <div class="quote-box danger" style="margin-top: -2px;">
              "Tenho o cartão casas Bahia, mas limite Bom só quando você faz o cartão... para comprar uma mercadoria mais cara tenho que usar outro cartão."<br>
              <strong>— Cliente Neutro (Nota 8), Filial 3000</strong>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- SLIDE 11: RISCO DE CHURN & MATRIZ DE ALÇADA -->
    <section class="slide" data-slide="11">
      <div class="slide-header">
        <div class="slide-category">Risco Comercial & Governança</div>
        <h2 class="slide-title">Modelagem de Risco de Churn & Segregação Estrita de Alçadas</h2>
        <p class="slide-subtitle">Exposição financeira anualizada de R$ 3,08M em GMV sob risco; matriz de governança executiva</p>
      </div>
      <div class="slide-content">
        <div class="split-view">
          <div class="chart-card">
            <div class="chart-header">Modelagem de Exposição Financeira & LTV</div>
            <div class="kpi-row" style="margin-bottom: 10px;">
              <div class="kpi-card danger">
                <div class="kpi-label">Clientes em Risco (Set/26)</div>
                <div class="kpi-val">105</div>
                <div class="kpi-delta neg">60 Detratores + 45 Neutros</div>
              </div>
              <div class="kpi-card danger">
                <div class="kpi-label">GMV sob Fricção Mensal</div>
                <div class="kpi-val">R$ 257K</div>
                <div class="kpi-delta neg">Ticket Médio R$ 2.450+</div>
              </div>
            </div>

            <div class="side-panel-title" style="margin-top: 4px;">Impacto Financeiro no Ciclo de Vida (LTV)</div>
            <ul class="takeaway-list" style="margin-top: 8px;">
              <li><strong>Taxa de Abandono Projetada</strong>: Clientes vítimas de cobrança indevida de seguro ou atraso logístico superior a 5 dias apresentam taxa de recompra em 12 meses <strong>65% menor</strong>.</li>
              <li><strong>Risco Financeiro Anualizado</strong>: A persistência de 105 clientes em risco/mês na Regional 122 expõe a marca a uma perda estimada de <strong>R$ 3,08 milhões em GMV anual direto</strong>.</li>
              <li><strong>Concentração nas Categorias Nobres</strong>: 68% do volume de clientes insatisfeitos concentra-se em Linha Branca, Estofados e Telas, afetando o segmento de maior margem de contribuição.</li>
            </ul>
          </div>

          <div class="side-panel" style="background: var(--cb-white);">
            <div class="side-panel-title">Matriz de Segregação Estrita de Alçadas</div>
            
            <div style="margin-top: 4px;">
              <div style="font-size: 11px; font-weight: 700; color: var(--cb-blue-navy); text-transform: uppercase; margin-bottom: 6px; display: flex; align-items: center; gap: 6px;">
                <span style="color: var(--cb-blue-primary);">●</span> Alçada de Loja / Regional (Ação Imediata)
              </div>
              <ul class="takeaway-list" style="font-size: 11px;">
                <li><strong>Tolerância Zero para Venda Casada</strong>: Auditoria rigorosa nos caixas das Filiais 1219 e 1593 para erradicar embutimento de seguro ou chip sem consentimento.</li>
                <li><strong>Reforço de Escalas no Domingo</strong>: Alocação emergencial de operadores de caixa e empacotadores para sanar a queda de satisfação para 51.8 NPS.</li>
                <li><strong>Pós-Venda Ativo do Vendedor</strong>: Vendedor deve manter canal direto de atendimento e acolhimento para clientes com dúvidas de montagem/entrega.</li>
              </ul>
            </div>

            <div style="margin-top: 10px; border-top: 1px solid var(--cb-gray-200); padding-top: 8px;">
              <div style="font-size: 11px; font-weight: 700; color: var(--cb-danger); text-transform: uppercase; margin-bottom: 6px; display: flex; align-items: center; gap: 6px;">
                <span style="color: var(--cb-danger);">●</span> Alçada Corporativa / Cadeia / Logística
              </div>
              <ul class="takeaway-list danger" style="font-size: 11px;">
                <li><strong>Auditoria em Transportadoras 3P</strong>: Penalização contratual para entregas com avaria física (amassados e telas perfuradas) e atrasos > 48h.</li>
                <li><strong>Rastreamento Ativo via WhatsApp</strong>: Envio automático de link de rastreamento com janela estimada de entrega em D-1.</li>
                <li><strong>Alçada de Crédito Casas Bahia Pay</strong>: Revisão de políticas de aumento de limite para clientes com histórico de pagamento pontual no carnê.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- SLIDE 12: PLANO DE AÇÃO TÁTICO (5W2H) -->
    <section class="slide" data-slide="12">
      <div class="slide-header">
        <div class="slide-category">Plano de Execução</div>
        <h2 class="slide-title">Plano Tático 5W2H de Choque Operacional & Compromissos</h2>
        <p class="slide-subtitle">Ações estruturadas para neutralizar ofensores críticos e alavancar a Regional 122 acima de 75.0 NPS</p>
      </div>
      <div class="slide-content">
        <div class="table-container">
          <table class="analise-table">
            <thead>
              <tr>
                <th>Ação Corretiva (O Quê)</th>
                <th>Filial Alvo</th>
                <th>Causa-Raiz (Por Quê)</th>
                <th>Responsável (Quem)</th>
                <th>Prazo (Quando)</th>
                <th>Métrica de Controle</th>
                <th class="text-center">Status</th>
              </tr>
            </thead>
            <tbody>
              <tr style="background: #FEE2E2;">
                <td><strong>Auditoria de Caixa & Extinção de Venda Casada</strong></td>
                <td>Filiais 1219 e 1593</td>
                <td>Queixas de seguro embutido e cobrança indevida de chips</td>
                <td>Gerente Regional + Compliance</td>
                <td><strong>Imediato (D+3)</strong></td>
                <td>Zerar queixas no Procon e VoC</td>
                <td class="text-center"><span class="badge-nps-critico">Prioridade 1</span></td>
              </tr>
              <tr style="background: #FFF5F5;">
                <td><strong>Choque de Escalas de Final de Semana</strong></td>
                <td>Rede Regional 122 (Geral)</td>
                <td>NPS de Domingo em 51.8 por subdimensionamento</td>
                <td>Gerentes de Loja + RH</td>
                <td><strong>D+5</strong></td>
                <td>NPS Domingo ≥ 70.0</td>
                <td class="text-center"><span class="badge-nps-critico">Prioridade 1</span></td>
              </tr>
              <tr style="background: #FFF5F5;">
                <td><strong>Força-Tarefa de Liberação em Mega Lojas</strong></td>
                <td>Filial 3000, 1269 e 1366</td>
                <td>Gargalos de fila e demora na expedição de pacotes</td>
                <td>Líderes de Operação e Estoque</td>
                <td><strong>D+7</strong></td>
                <td>Tempo de fila caixa < 4 min</td>
                <td class="text-center"><span class="badge-nps-critico">Prioridade 1</span></td>
              </tr>
              <tr>
                <td><strong>Notificação Prévia de Rota Logística</strong></td>
                <td>Cadeia Logística CD</td>
                <td>Atrasos de 10 dias e falta de rastreamento para o cliente</td>
                <td>Diretoria de Logística / CX</td>
                <td><strong>D+12</strong></td>
                <td>Atingir 98% entregas no prazo</td>
                <td class="text-center"><span class="badge-nps-qualidade">Em Rollout</span></td>
              </tr>
              <tr>
                <td><strong>Fast-Track de Troca por Avaria em Telas/Móveis</strong></td>
                <td>Filiais 3000, 1115 e 1603</td>
                <td>Morosidade extrema de até 3 meses para laudos</td>
                <td>Pós-Venda / SAC Corporativo</td>
                <td><strong>D+10</strong></td>
                <td>Resolução técnica em até 5 dias</td>
                <td class="text-center"><span class="badge-nps-qualidade">Em Andamento</span></td>
              </tr>
              <tr class="row-highlight">
                <td><strong>Disseminação de Práticas da Filial 1456 / 2032</strong></td>
                <td>Rede Regional 122</td>
                <td>Replicar método de acolhimento e agilidade no balcão</td>
                <td>Gerentes Filiais 1456 e 2032</td>
                <td><strong>D+15</strong></td>
                <td>NPS Regional ≥ 75.0</td>
                <td class="text-center"><span class="badge-nps-excelente">Contínuo</span></td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="kpi-row" style="flex-shrink: 0;">
          <div class="kpi-card highlight">
            <div class="kpi-label">Meta Fechamento Outubro/2026</div>
            <div class="kpi-val">≥ 75.0 NPS</div>
            <div class="kpi-delta pos">Convergência com a Meta Corporativa (+3.2 pts)</div>
          </div>
          <div class="kpi-card success">
            <div class="kpi-label">Meta Impacto Diretoria 1</div>
            <div class="kpi-val">+0.30 p.p.</div>
            <div class="kpi-delta pos">Reversão de ofensor para impulsionador</div>
          </div>
          <div class="kpi-card danger">
            <div class="kpi-label">Meta Filial 1219 (Ofensora)</div>
            <div class="kpi-val">≥ 65.0 NPS</div>
            <div class="kpi-delta pos">Recuperação de +22.9 pts vs Setembro</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-label">Meta NPS Domingos</div>
            <div class="kpi-val">≥ 70.0 NPS</div>
            <div class="kpi-delta pos">Redução da detração para menos de 10%</div>
          </div>
        </div>
      </div>
    </section>

  </main>

  <!-- Rodapé Fixo com Navegação Tátil -->
  <footer class="footer-bar">
    <div class="progress-bar" id="progressBar"></div>
    <div class="footer-meta">Grupo Casas Bahia • CX & Performance Operacional • Regional 122</div>
    <div class="footer-controls">
      <span class="slide-counter" id="slide-counter">Slide 1 de 12</span>
      <button class="btn-nav" id="btn-prev" onclick="changeSlide(-1)">◀ Anterior</button>
      <button class="btn-nav btn-nav-primary" id="btn-next" onclick="changeSlide(1)">Próximo ▶</button>
      <button class="btn-nav" id="btn-fullscreen" onclick="toggleFullScreen()">⛶ Tela Cheia</button>
    </div>
  </footer>

  <script>
    (() => {
      const state = { currentSlide: 0, totalSlides: 12 };
      const chartRegistry = {};
      const slides = document.querySelectorAll('.slide');
      state.totalSlides = slides.length;

      function initCharts(slideIndex) {
        // Slide 2: Evolução Temporal
        if (slideIndex === 1) {
          const canvas = document.getElementById('chartEvolucaoNPS');
          if (canvas) {
            if (chartRegistry['chartEvolucaoNPS']) {
              chartRegistry['chartEvolucaoNPS'].destroy();
            }
            const ctx = canvas.getContext('2d');
            chartRegistry['chartEvolucaoNPS'] = new Chart(ctx, {
              type: 'line',
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
                    pointHoverRadius: 7
                  },
                  {
                    label: 'Meta Corporativa',
                    data: [75.0, 75.0, 75.0, 75.0, 75.0, 75.0, 75.0, 75.0, 75.0, 75.0],
                    borderColor: '#DC2626',
                    borderWidth: 1.5,
                    borderDash: [5, 5],
                    fill: false,
                    pointRadius: 0
                  }
                ]
              },
              options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: 'top',
                    labels: { boxWidth: 12, font: { size: 10.5, family: 'Inter' }, color: '#334155' }
                  },
                  tooltip: {
                    callbacks: {
                      label: (ctx) => \`\${ctx.dataset.label}: \${ctx.parsed.y.toFixed(1)} pts\`
                    }
                  }
                },
                scales: {
                  y: {
                    min: 50,
                    max: 85,
                    ticks: {
                      callback: (val) => val + ' pts',
                      color: '#64748B',
                      font: { size: 10 }
                    },
                    grid: { color: '#E2E8F0' }
                  },
                  x: {
                    ticks: { color: '#64748B', font: { size: 10.5 } },
                    grid: { display: false }
                  }
                }
              }
            });
          }
        }

        // Slide 7: Dia da Semana
        if (slideIndex === 6) {
          const canvas = document.getElementById('chartDiaSemana');
          if (canvas) {
            if (chartRegistry['chartDiaSemana']) {
              chartRegistry['chartDiaSemana'].destroy();
            }
            const ctx = canvas.getContext('2d');
            chartRegistry['chartDiaSemana'] = new Chart(ctx, {
              type: 'bar',
              data: {
                labels: ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'],
                datasets: [{
                  label: 'NPS por Dia',
                  data: [51.8, 74.0, 75.0, 78.3, 75.5, 78.5, 66.9],
                  backgroundColor: [
                    '#DC2626', '#0033C6', '#0033C6', '#0033C6', '#0033C6', '#0033C6', '#D97706'
                  ],
                  borderRadius: 4
                }]
              },
              options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { display: false },
                  tooltip: {
                    callbacks: {
                      label: (ctx) => \`NPS: \${ctx.parsed.y.toFixed(1)} pts\`
                    }
                  }
                },
                scales: {
                  y: {
                    min: 40,
                    max: 90,
                    ticks: { callback: (v) => v + ' pts', color: '#64748B', font: { size: 10 } },
                    grid: { color: '#E2E8F0' }
                  },
                  x: {
                    ticks: { color: '#334155', font: { size: 10 } },
                    grid: { display: false }
                  }
                }
              }
            });
          }
        }
      }

      function updateUI() {
        slides.forEach((s, idx) => {
          s.classList.toggle('active', idx === state.currentSlide);
          if (idx === state.currentSlide) {
            s.scrollTop = 0;
          }
        });
        const counter = document.getElementById('slide-counter');
        if (counter) counter.textContent = \`Slide \${state.currentSlide + 1} de \${state.totalSlides}\`;
        const progress = ((state.currentSlide + 1) / state.totalSlides) * 100;
        const pBar = document.getElementById('progressBar');
        if (pBar) pBar.style.width = \`\${progress}%\`;
        initCharts(state.currentSlide);
      }

      function changeSlide(direction) {
        const target = state.currentSlide + direction;
        if (target >= 0 && target < state.totalSlides) {
          state.currentSlide = target;
          updateUI();
        }
      }

      function goToSlide(index) {
        if (index >= 0 && index < state.totalSlides) {
          state.currentSlide = index;
          updateUI();
        }
      }

      function toggleFullScreen() {
        if (!document.fullscreenElement) {
          document.documentElement.requestFullscreen().catch(() => {});
        } else {
          document.exitFullscreen().catch(() => {});
        }
      }

      window.changeSlide = changeSlide;
      window.goToSlide = goToSlide;
      window.toggleFullScreen = toggleFullScreen;

      window.addEventListener('keydown', (e) => {
        if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) return;
        if (e.key === 'ArrowRight' || e.key === 'PageDown' || e.key === ' ') {
          e.preventDefault();
          changeSlide(1);
        }
        if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
          e.preventDefault();
          changeSlide(-1);
        }
        if (e.key === 'Home') {
          e.preventDefault();
          goToSlide(0);
        }
        if (e.key === 'End') {
          e.preventDefault();
          goToSlide(state.totalSlides - 1);
        }
        if (e.key === 'f' || e.key === 'F') {
          e.preventDefault();
          toggleFullScreen();
        }
      });

      window.addEventListener('resize', () => {
        Object.values(chartRegistry).forEach(c => {
          if (c && typeof c.resize === 'function') c.resize();
        });
      });

      updateUI();
    })();
  </script>
</body>
</html>`;
