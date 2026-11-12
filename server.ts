import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json({ limit: '50mb' }));

// Initialize Google GenAI client
const getAiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
};

// Helper to call Gemini with fallback across models if high demand (503) occurs
async function generateContentWithFallback(ai: GoogleGenAI, params: { prompt: string; systemInstruction?: string; responseMimeType?: string }) {
  const models = ['gemini-3.8-flash', 'gemini-flash-latest', 'gemini-3.1-flash-lite'];
  let lastError: any = null;

  for (const model of models) {
    try {
      const config: any = {};
      if (params.systemInstruction) config.systemInstruction = params.systemInstruction;
      if (params.responseMimeType) config.responseMimeType = params.responseMimeType;

      const response = await ai.models.generateContent({
        model,
        contents: params.prompt,
        config: Object.keys(config).length > 0 ? config : undefined,
      });

      if (response && response.text) {
        return response.text;
      }
    } catch (err: any) {
      console.warn(`Model ${model} failed, trying next fallback:`, err?.message || err);
      lastError = err;
    }
  }

  throw lastError || new Error('Todos os modelos de IA estão temporariamente indisponíveis.');
}


// Healthcheck
app.get('/api/health', (req, res) => {
  const hasKey = Boolean(process.env.GEMINI_API_KEY);
  res.json({ status: 'ok', hasGeminiKey: hasKey });
});

// 1. Text Rewriting & Enhancement
app.post('/api/gemini/rewrite', async (req, res) => {
  try {
    const ai = getAiClient();
    if (!ai) {
      return res.status(500).json({ error: 'GEMINI_API_KEY não configurada no servidor.' });
    }

    const { text, action, context } = req.body;
    if (!text) {
      return res.status(400).json({ error: 'Texto não fornecido.' });
    }

    const actionPrompts: Record<string, string> = {
      concise: 'Torne o texto muito mais conciso, direto ao ponto e impactante para slides executivos.',
      formal: 'Reescreva em tom corporativo, formal e profissional.',
      persuasive: 'Reescreva com técnicas de copywriting persuasivo, destacando benefícios e valor.',
      bullet_points: 'Transforme o conteúdo em 3 a 5 bullet points concisos e visualmente escaneáveis.',
      grammar: 'Corrija erros de pontuação, concordância e gramática mantendo o sentido original intacto.',
      translate_en: 'Traduza o texto perfeitamente para o inglês corporativo.',
      translate_pt: 'Traduza o texto perfeitamente para o português brasileiro fluente.',
      expand: 'Expanda o argumento com detalhes claros e objetivos adequados a um slide corporativo.',
    };

    const instruction = actionPrompts[action] || 'Melhore a clareza e impacto deste texto para uma apresentação em slides.';

    const prompt = `Você é um especialista em redação e design de apresentações de alto impacto.
Contexto do slide: ${context || 'Apresentação corporativa'}

Tarefa: ${instruction}

Texto original:
"${text}"

IMPORTANTE:
- Retorne APENAS o texto reescrito, sem aspas adicionais, sem preâmbulos ("Aqui está:"), sem explicações.`;

    const responseText = await generateContentWithFallback(ai, {
      prompt,
    });

    const rewritten = responseText ? responseText.trim() : text;
    res.json({ rewritten });
  } catch (error: any) {
    console.error('Error in /api/gemini/rewrite:', error);
    res.status(500).json({ error: error.message || 'Falha ao reescrever texto com IA.' });
  }
});

// 2. Generate New Slide or Modify Existing Slide HTML
app.post('/api/gemini/slide', async (req, res) => {
  try {
    const ai = getAiClient();
    if (!ai) {
      return res.status(500).json({ error: 'GEMINI_API_KEY não configurada no servidor.' });
    }

    const { prompt, slideType, existingSlideHtml, presentationContext } = req.body;

    const systemPrompt = `Você é um arquiteto e designer de apresentações em HTML de nível mundial.
Você gera ou refatora o código HTML puro de um slide individual (uma tag <section> ou <div> representativa).
O HTML deve ser auto-contido, com Tailwind CSS ou estilos inline limpos e modernos.
Use cores modernas, espaçamentos generosos (p-8 a p-12), tipografia harmoniosa, cartões com bordas sutis (border border-slate-200 ou slate-800), contrastes bem definidos e layout em Grid ou Flexbox.
Tamanho padrão do slide é 16:9 widescreen (aspect-video ou min-h-[540px]).
NÃO inclua <html>, <head> ou <body>. Retorne apenas o container do slide (ex: <section class="slide ...">...</section>).
NÃO use blocos de markdown (\`\`\`html) na resposta se possível, apenas retorne o código HTML puro.`;

    const userQuery = `
Contexto geral da apresentação:
${presentationContext || 'Apresentação profissional de negócios/relatório executivo'}

Ação solicitada:
${prompt || 'Crie um slide atraente e moderno'}

Tipo de slide: ${slideType || 'conteúdo com cartões'}

${existingSlideHtml ? `Slide de referência para manter estilos e classes parecidas:\n${existingSlideHtml}` : ''}

Retorne exclusivamente o código HTML do slide:`;

    const fullPrompt = `${systemPrompt}\n\n${userQuery}`;
    const rawHtml = await generateContentWithFallback(ai, { prompt: fullPrompt });

    let html = rawHtml ? rawHtml.trim() : '';
    // Strip markdown code fences if model returned them
    if (html.startsWith('```html')) {
      html = html.replace(/^```html\s*/, '').replace(/\s*```$/, '');
    } else if (html.startsWith('```')) {
      html = html.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }

    res.json({ html });
  } catch (error: any) {
    console.error('Error in /api/gemini/slide:', error);
    res.status(500).json({ error: error.message || 'Falha ao gerar slide com IA.' });
  }
});

// 3. Generate Visual Chart / Graphic (SVG + Data)
app.post('/api/gemini/chart', async (req, res) => {
  try {
    const ai = getAiClient();
    if (!ai) {
      return res.status(500).json({ error: 'GEMINI_API_KEY não configurada no servidor.' });
    }

    const { description, chartType, primaryColor } = req.body;

    const prompt = `Crie um gráfico vetorial em SVG moderno, limpo e profissional ou um componente de métricas em HTML para um slide de apresentação.
Tipo desejado: ${chartType || 'bar'} (ex: bar, pie/donut, line, kpi-cards, progress)
Descrição do dado: ${description || 'Comparativo trimestral de crescimento'}
Cor primária sugerida: ${primaryColor || '#3b82f6'}

Requisitos:
- Se for SVG: viewBox="0 0 600 320", largura="100%", responsivo, fontes legíveis, cores elegantes, labels visíveis.
- Se for KPI cards: grid com 3 a 4 indicadores com títulos, números grandes e badges de variação (+18%, etc.).
- Retorne APENAS o código HTML/SVG puro que pode ser inserido diretamente dentro do slide.
- Sem markdown, sem explicações.`;

    const rawChart = await generateContentWithFallback(ai, { prompt });

    let chartHtml = rawChart ? rawChart.trim() : '';
    if (chartHtml.startsWith('```html')) {
      chartHtml = chartHtml.replace(/^```html\s*/, '').replace(/\s*```$/, '');
    } else if (chartHtml.startsWith('```')) {
      chartHtml = chartHtml.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }

    res.json({ chartHtml });
  } catch (error: any) {
    console.error('Error in /api/gemini/chart:', error);
    res.status(500).json({ error: error.message || 'Falha ao gerar gráfico com IA.' });
  }
});

// 4. Slide & Presentation Analysis
app.post('/api/gemini/analyze', async (req, res) => {
  try {
    const ai = getAiClient();
    if (!ai) {
      return res.status(500).json({ error: 'GEMINI_API_KEY não configurada no servidor.' });
    }

    const { slidesContent } = req.body;

    const prompt = `Analise a seguinte apresentação de slides em HTML e forneça um diagnóstico executivo rápido e prático.
Conteúdo resumido dos slides:
${JSON.stringify(slidesContent).slice(0, 5000)}

Retorne um JSON com a estrutura:
{
  "overallScore": 85,
  "summary": "Resumo de 2 frases sobre a qualidade e clareza da apresentação",
  "strengths": ["Ponto forte 1", "Ponto forte 2"],
  "improvements": ["Oportunidade 1", "Oportunidade 2", "Oportunidade 3"],
  "designTips": ["Dica visual 1", "Dica visual 2"]
}
Retorne estritamente o JSON sem blocos markdown.`;

    const rawJson = await generateContentWithFallback(ai, {
      prompt,
      responseMimeType: 'application/json',
    });

    const parsed = JSON.parse(rawJson || '{}');
    res.json(parsed);
  } catch (error: any) {
    console.error('Error in /api/gemini/analyze:', error);
    res.status(500).json({ error: error.message || 'Falha na análise da apresentação.' });
  }
});

// 5. Parse and Convert PPTX Slide Data into High-Fidelity Mobile-Adapted HTML
app.post('/api/gemini/parse-pptx', async (req, res) => {
  try {
    const ai = getAiClient();
    if (!ai) {
      return res.status(500).json({ error: 'GEMINI_API_KEY não configurada no servidor.' });
    }

    const { slideData, presentationTitle, isTitleSlide, slideIndex, totalSlides } = req.body;
    if (!slideData) {
      return res.status(400).json({ error: 'slideData não fornecido.' });
    }

    const prompt = `Você é o mais avançado arquiteto de frontend e designer executivo de apresentações, especialista em converter slides do Microsoft PowerPoint (.pptx) em HTML moderno, de altíssima fidelidade e 100% responsivo para Desktop (16:9 widescreen) e Mobile (smartphones 390px).

DADOS ESTRUTURADOS DO SLIDE ORIGINAL (EXTRAÇÃO OPENXML EXATA):
${JSON.stringify(slideData, null, 2)}

INSTRUÇÕES ESSENCIAIS PARA MÁXIMA FIDELIDADE:
1. PRESERVAÇÃO TOTAL DE CONTEÚDO (ZERO PERDAS):
   - Mantenha rigorosamente todos os títulos, subtítulos, textos, marcadores (bullets), valores numéricos, métricas (R$, %, prazos, volumetria), tabelas e notas presentes nos dados.
   - Não resuma nem invente textos; use exatamente os termos corporativos, técnicos e percentuais do slide.

2. ARQUITETURA VISUAL E LAYOUT EXECUTIVO:
   - Container raiz obrigatório:
     <section class="slide-item p-6 sm:p-8 md:p-10 ${slideData.isDark ? 'bg-[#0038D1] text-white border-blue-900' : 'bg-[#F8F9FA] text-slate-900 border-slate-200'} flex flex-col justify-between h-full min-h-[540px] max-h-full rounded-2xl shadow-sm border w-full relative overflow-hidden box-border" style="${slideData.backgroundColor ? `background-color: ${slideData.backgroundColor};` : ''}">
   - Top Header Bar:
     Se houver categoria ou badge de cabeçalho, renderize no topo com badge estilizada (ex: <span class="bg-[#E71A3B] text-white font-bold text-xs px-3 py-1 rounded-md uppercase">...</span>).
   - Se for Slide de Capa (${isTitleSlide ? 'SIM' : 'NÃO'}):
     Destaque o título principal com 'text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight', subtítulo em destaque e cartões de status/frentes na base se houver.
   - Se houver Tabelas (slideData.tables):
     Gere uma tabela HTML profissional com '<div class="w-full overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-2xs my-auto"><table class="w-full text-left border-collapse">...</table></div>'. Use cabeçalhos estilizados, linhas com fundo alternado/hover e números alinhados à direita.
   - Se houver Indicadores / KPIs (ex: NPS 78,8 vs 68,8 ou volumetrias):
     Renderize números grandes ('text-4xl sm:text-5xl md:text-6xl font-black tracking-tight'), acompanhados de rótulos uppercase, badges coloridas (ex: verde para promotores, vermelho para detratores) e comparativos.
   - Se houver Quadrantes ou Colunas:
     Use grid responsivo ('grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 w-full my-auto').
   - Se houver Imagens:
     Insira os marcadores de imagem exatos (ex: <!--IMG_xxx-->) na posição onde a imagem pertence no layout.
   - Rodapé:
     Inclua a barra de rodapé com informações do documento, data e paginação:
     <div class="pt-3 border-t ${slideData.isDark ? 'border-white/10 text-white/50' : 'border-slate-200/80 text-slate-500'} flex items-center justify-between text-[11px] relative z-10 shrink-0">
       <span>${slideData.footerText || presentationTitle || 'Apresentação Corporativa'}</span>
       <span class="font-medium ${slideData.isDark ? 'text-white/40' : 'text-slate-400'}">Documento Corporativo</span>
       <span>Slide ${slideIndex || 1} de ${totalSlides || 1}</span>
     </div>

3. ADAPTAÇÃO MOBILE IMPECÁVEL:
   - Em Desktop (16:9), layout amplo, equilibrado e proporcional.
   - Em Mobile (smartphone), colunas empilham ('grid-cols-1 md:grid-cols-2'), tabelas têm rolagem horizontal ('overflow-x-auto') e fontes ajustam ('text-xl sm:text-2xl md:text-3xl').

4. FORMATO DA RESPOSTA:
   - Retorne EXCLUSIVAMENTE o código HTML iniciando em <section ...> e terminando em </section>.
   - Sem markdown (\`\`\`html), sem preâmbulos, sem explicações.`;

    const rawHtml = await generateContentWithFallback(ai, { prompt });
    let html = rawHtml ? rawHtml.trim() : '';
    if (html.startsWith('```html')) {
      html = html.replace(/^```html\s*/, '').replace(/\s*```$/, '');
    } else if (html.startsWith('```')) {
      html = html.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }

    res.json({ html });
  } catch (error: any) {
    console.error('Error in /api/gemini/parse-pptx:', error);
    res.status(500).json({ error: error.message || 'Falha ao converter slide PPTX com IA.' });
  }
});

// 6. Generate Full Presentation from Briefing & Files Context with AI Agents
app.post('/api/gemini/generate-presentation', async (req, res) => {
  try {
    const ai = getAiClient();
    const {
      topic = 'Apresentação Corporativa',
      objective = 'Apresentar resultados e metas estratégicas',
      audience = 'Diretoria e Liderança Executiva',
      tone = 'Corporativo e Direto ao Ponto',
      slideCount = 6,
      colorTheme = 'casasbahia',
      includeCharts = true,
      filesContext = [],
      additionalNotes = '',
    } = req.body;

    const count = Math.min(Math.max(Number(slideCount) || 6, 3), 12);

    // Color theme mapping matching Casas Bahia standards
    const themePalettes: Record<string, { primary: string; primaryNavy: string; accent: string; bg: string; text: string; name: string }> = {
      'casasbahia': {
        primary: '#0033C6',
        primaryNavy: '#00174F',
        accent: '#E71A3B',
        bg: '#F8FAFC',
        text: '#0F172A',
        name: 'Casas Bahia Oficial (Azul Royal & Vermelho)',
      },
      'corporate-blue': {
        primary: '#1D4ED8',
        primaryNavy: '#0F172A',
        accent: '#0284C7',
        bg: '#F8FAFC',
        text: '#0F172A',
        name: 'Corporativo Tech (Azul Cobalto & Slate)',
      },
      'emerald': {
        primary: '#059669',
        primaryNavy: '#064E3B',
        accent: '#10B981',
        bg: '#F8FAFC',
        text: '#064E3B',
        name: 'Emerald Growth (Verde Esmeralda)',
      },
      'minimal-dark': {
        primary: '#38BDF8',
        primaryNavy: '#090D16',
        accent: '#F59E0B',
        bg: '#090D16',
        text: '#F8FAFC',
        name: 'Minimal Dark (Fundo Escuro & Neon Accent)',
      },
      'sunset': {
        primary: '#7C3AED',
        primaryNavy: '#2E1065',
        accent: '#F59E0B',
        bg: '#FAF5FF',
        text: '#2E1065',
        name: 'Sunset Violet & Amber',
      },
    };

    const palette = themePalettes[colorTheme] || themePalettes['casasbahia'];

    // Extract real tabular data and textual context from uploaded files
    let filesSummary = '';
    let parsedCsvData: { headers: string[]; rows: string[][] } | null = null;

    if (Array.isArray(filesContext) && filesContext.length > 0) {
      filesSummary = filesContext
        .map((f: any, idx: number) => {
          const content = (f.textContent || f.summary || '').slice(0, 4000);
          // Auto-parse CSV if detected
          if (!parsedCsvData && (f.name?.endsWith('.csv') || content.includes(','))) {
            const lines = content.split('\n').filter((l: string) => l.trim().length > 0);
            if (lines.length > 1) {
              const delim = lines[0].includes(';') ? ';' : ',';
              const headers = lines[0].split(delim).map((h: string) => h.trim().replace(/^["']|["']$/g, ''));
              const rows = lines.slice(1, 6).map((l: string) => l.split(delim).map((c: string) => c.trim().replace(/^["']|["']$/g, '')));
              if (headers.length >= 2) {
                parsedCsvData = { headers, rows };
              }
            }
          }
          return `--- Arquivo ${idx + 1}: ${f.name} (${f.type || 'documento'}) ---\n${content}`;
        })
        .join('\n\n');
    }

    // Real Gemini AI Generation if client is configured
    if (ai) {
      try {
        const geminiPrompt = `Você é o Arquiteto Executivo Sênior de CX e Inteligência Estratégica da Casas Bahia / Via Varejo.
Sua missão é gerar os dados executivos de uma apresentação de alto impacto com exatamente ${count} slides, baseando-se estritamente no briefing e nos dados reais fornecidos pelo usuário.

REGRAS DE CONTEÚDO REAL E INTELIGÊNCIA:
1. NÃO utilize textos genéricos ("Empresa X", "Lorem ipsum", "Metas gerais").
2. Se o usuário forneceu arquivos (planilhas, CSVs, relatórios), extraia e use os dados, números, percentuais, nomes e métricas reais contidos neles.
3. Se o briefing trata de um tema específico (ex: Vendas, Logística, CX, Finanças, RH, Tecnologia), construa narrativas e métricas executivas condizentes e profundas.
4. Para os gráficos, forneça números coerentes em "data" e rótulos reais em "labels" (meses, canais, categorias ou unidades).

Retorne EXCLUSIVAMENTE um objeto JSON válido (sem tags markdown, sem explicações) com a seguinte estrutura:
{
  "headerTag": "${topic.slice(0, 32)}",
  "slides": [
    {
      "slideNumber": 1,
      "type": "cover",
      "tag": "${audience.toUpperCase()} • APRESENTAÇÃO ESTRATÉGICA",
      "title": "${topic}",
      "subtitle": "${objective}",
      "coverKpis": [
        { "label": "Nome do Indicador 1", "val": "Valor", "sub": "Variação / Detalhe" },
        { "label": "Nome do Indicador 2", "val": "Valor", "sub": "Variação / Detalhe" },
        { "label": "Nome do Indicador 3", "val": "Valor", "sub": "Variação / Detalhe" },
        { "label": "Nome do Indicador 4", "val": "Valor", "sub": "Variação / Detalhe" }
      ],
      "metaBar": [
        "Metodologia: Atribuição por Safra",
        "Público: ${audience}",
        "Data: Outubro/2026",
        "Classificação: Confidencial"
      ]
    },
    {
      "slideNumber": 2,
      "type": "kpis_and_chart",
      "category": "01. Panorama Executivo",
      "title": "Visão Consolidada de Desempenho",
      "subtitle": "Evolução dos principais indicadores e drivers de meta",
      "kpiRow": [
        { "label": "KPI 1", "val": "100", "delta": "+5%", "highlight": true },
        { "label": "KPI 2", "val": "200", "delta": "+3%", "highlight": false },
        { "label": "KPI 3", "val": "300", "delta": "+8%", "highlight": false },
        { "label": "KPI 4", "val": "400", "delta": "-2%", "highlight": false },
        { "label": "KPI 5", "val": "500", "delta": "+12%", "highlight": false },
        { "label": "KPI 6", "val": "600", "delta": "Meta batida", "highlight": true }
      ],
      "chart": {
        "title": "Evolução Temporal dos Resultados",
        "type": "line",
        "labels": ["Mai", "Jun", "Jul", "Ago", "Set", "Out"],
        "datasetLabel": "Realizado",
        "data": [65, 68, 72, 75, 78, 82]
      },
      "takeaways": [
        { "highlight": "Trajetória Ascendente", "text": "Crescimento contínuo alinhado com a meta corporativa." },
        { "highlight": "Eficiência Operacional", "text": "Redução sistemática de perdas e aumento da taxa de entrega." },
        { "highlight": "Foco Prioritário", "text": "Manter a consistência na reta final do trimestre." },
        { "highlight": "Próximos Passos", "text": "Alinhamento com as lideranças de campo." }
      ]
    },
    {
      "slideNumber": 3,
      "type": "table",
      "category": "02. Roteiro Tático 5W2H",
      "title": "Acompanhamento de Iniciativas & Metas",
      "subtitle": "Desdobramento das ações prioritárias por responsável e prazo",
      "kpiRow": [
        { "label": "Total Iniciativas", "val": "12", "delta": "100% mapeadas" },
        { "label": "Concluídas", "val": "8", "delta": "66% concluído" },
        { "label": "Em Andamento", "val": "4", "delta": "No cronograma" },
        { "label": "Aderência Geral", "val": "98.5%", "delta": "Meta superada" }
      ],
      "quote": "Aderência expressiva das equipes operacionais aos critérios do projeto, assegurando previsibilidade.",
      "table": {
        "headers": ["Iniciativa Prioritária (O Quê)", "Responsável (Quem)", "Aderência Real", "Meta", "Status"],
        "rows": [
          ["Aceleração de Processos Chave", "Operações", "102%", "100%", "Concluído"],
          ["Capacitação das Lideranças", "Treinamento", "98%", "95%", "Concluído"],
          ["Auditoria de Qualidade em Campo", "Qualidade", "94%", "90%", "Em Andamento"],
          ["Rollout de Novos Procedimentos", "Governança", "91%", "85%", "Em Andamento"]
        ]
      }
    }
    // E assim sucessivamente para os demais slides até totalizar ${count} slides, incluindo matrizes, análises comparativas e a conclusão final.
  ]
}

BRIEFING DETALHADO DO USUÁRIO:
Tema / Título: ${topic}
Objetivo: ${objective}
Público-Alvo: ${audience}
Tom: ${tone}
Quantidade de Slides: ${count}
${additionalNotes ? `Anotações extras: ${additionalNotes}` : ''}

${filesSummary ? `DADOS E ARQUIVOS REAIS DO USUÁRIO:\n${filesSummary}` : 'Sem arquivos adicionais fornecidos.'}`;

        const rawJson = await generateContentWithFallback(ai, {
          prompt: geminiPrompt,
          responseMimeType: 'application/json',
        });

        if (rawJson) {
          let cleanJson = rawJson.trim();
          if (cleanJson.startsWith('```json')) {
            cleanJson = cleanJson.replace(/^```json\s*/, '').replace(/\s*```$/, '');
          } else if (cleanJson.startsWith('```')) {
            cleanJson = cleanJson.replace(/^```\s*/, '').replace(/\s*```$/, '');
          }

          const parsedData = JSON.parse(cleanJson);
          if (parsedData && Array.isArray(parsedData.slides) && parsedData.slides.length > 0) {
            const compiledHtml = compilePresentationFromAiJson(parsedData, {
              topic,
              objective,
              audience,
              tone,
              palette,
              slideCount: count,
            });
            return res.json({
              html: compiledHtml,
              generatedBy: 'gemini',
              hasGeminiKey: true,
              slideCount: parsedData.slides.length,
            });
          }
        }
      } catch (geminiError: any) {
        console.warn('Gemini presentation generation failed, using intelligent domain synthesizer:', geminiError?.message || geminiError);
      }
    }

    // High-fidelity Domain Intelligence Synthesizer (dynamically customized to user topic & files, using Casas Bahia responsive classes)
    const customizedHtml = generateContextualPresentation({
      topic,
      objective,
      audience,
      tone,
      slideCount: count,
      palette,
      includeCharts,
      filesSummary,
      parsedCsvData,
      additionalNotes,
    });

    res.json({ html: customizedHtml, generatedBy: 'casasbahia-intelligence', hasGeminiKey: Boolean(ai), slideCount: count });
  } catch (error: any) {
    console.error('Error in /api/gemini/generate-presentation:', error);
    res.status(500).json({ error: error.message || 'Falha ao gerar apresentação.' });
  }
});

// Compiles structured Gemini AI JSON slides into complete, responsive Casas Bahia HTML
function compilePresentationFromAiJson(
  aiData: any,
  meta: {
    topic: string;
    objective: string;
    audience: string;
    tone: string;
    palette: { primary: string; primaryNavy: string; accent: string; bg: string; text: string; name: string };
    slideCount: number;
  }
): string {
  const { topic, objective, audience, tone, palette, slideCount } = meta;
  const rawSlides: any[] = Array.isArray(aiData.slides) ? aiData.slides : [];
  const compiledSlideSections: string[] = [];

  rawSlides.forEach((slide, idx) => {
    const sNum = idx + 1;
    const isActive = sNum === 1 ? ' active' : '';
    const type = slide.type || (sNum === 1 ? 'cover' : sNum === rawSlides.length ? 'conclusion' : 'kpis_and_chart');

    if (type === 'cover' || sNum === 1) {
      const coverKpis = Array.isArray(slide.coverKpis) && slide.coverKpis.length > 0
        ? slide.coverKpis
        : [
            { label: 'Indicador Principal', val: '98.5%', sub: 'Alta aderência' },
            { label: 'Amostra Auditada', val: '586', sub: 'Base consolidada' },
            { label: 'SLA Operacional', val: '99.2%', sub: 'Dentro da meta' },
            { label: 'Status Geral', val: 'Positivo', sub: 'Rollout liberado' },
          ];

      const metaBar = Array.isArray(slide.metaBar) && slide.metaBar.length > 0
        ? slide.metaBar
        : [`Safra: Outubro/2026`, `Público: ${audience}`, `Tom: ${tone}`, `Classificação: Confidencial`];

      compiledSlideSections.push(`
  <section class="slide${isActive}" id="slide-${sNum}" data-slide="${sNum}">
    <div class="slide-cover">
      <span class="cover-tag">${slide.tag || (audience.toUpperCase() + ' • APRESENTAÇÃO ESTRATÉGICA')}</span>
      <h1 class="cover-title">${slide.title || topic}</h1>
      <p class="cover-subtitle">${slide.subtitle || objective}</p>
      <div class="cover-grid">
        ${coverKpis.slice(0, 4).map((k: any, kIdx: number) => `
        <div class="cover-kpi" style="border-top: 3px solid ${kIdx % 2 === 0 ? palette.primary : palette.accent};">
          <div class="cover-kpi-label">${k.label}</div>
          <div class="cover-kpi-val">${k.val}</div>
          <div class="cover-kpi-sub" style="color: #059669;">${k.sub}</div>
        </div>`).join('')}
      </div>
      <div class="cover-meta-bar">
        ${metaBar.map((m: string) => `<span><strong>${m.split(':')[0] || ''}:</strong> ${m.split(':')[1] || m}</span>`).join('<span>•</span>')}
      </div>
    </div>
  </section>`);
    } else if (type === 'table' || slide.table) {
      const kpis = Array.isArray(slide.kpiRow) ? slide.kpiRow.slice(0, 4) : [];
      const headers = Array.isArray(slide.table?.headers) ? slide.table.headers : ['Iniciativa Prioritária', 'Responsável', 'Meta', 'Status'];
      const rows = Array.isArray(slide.table?.rows) ? slide.table.rows : [];

      compiledSlideSections.push(`
  <section class="slide${isActive}" id="slide-${sNum}" data-slide="${sNum}">
    <div class="slide-header">
      <div class="slide-category" style="color: ${palette.primary};">${slide.category || `0${sNum - 1}. Roteiro Tático`}</div>
      <h2 class="slide-title">${slide.title || 'Plano de Ação & Indicadores'}</h2>
      <p class="slide-subtitle">${slide.subtitle || 'Acompanhamento detalhado de entregas e metas'}</p>
    </div>
    <div class="slide-content">
      ${kpis.length > 0 ? `
      <div class="kpi-row">
        ${kpis.map((k: any) => `
        <div class="kpi-card">
          <div class="kpi-label">${k.label}</div>
          <div class="kpi-val">${k.val}</div>
          <div class="kpi-delta pos">${k.delta || '+'}</div>
        </div>`).join('')}
      </div>` : ''}

      ${slide.quote ? `
      <div class="quote-box" style="border-left-color: ${palette.primary}; background: #EEF4FF;">
        <strong>Destaque Executivo:</strong> ${slide.quote}
      </div>` : ''}

      <div class="table-container">
        <table class="analise-table">
          <thead>
            <tr>
              ${headers.map((h: string, hIdx: number) => `
                <th class="${hIdx >= 2 ? 'text-right' : ''}">${h}</th>
              `).join('')}
            </tr>
          </thead>
          <tbody>
            ${rows.map((row: string[], rIdx: number) => `
              <tr style="${rIdx === 0 ? 'background: #F0FDF4;' : ''}">
                ${row.map((cell: string, cIdx: number) => `
                  <td class="${cIdx >= 2 ? 'text-right' : ''}">
                    ${cIdx === 0 ? `<strong>${cell}</strong>` : cIdx === row.length - 1 ? `
                      <span style="background: ${cell.toLowerCase().includes('concl') || cell.toLowerCase().includes('super') || cell.toLowerCase().includes('ok') ? '#DCFCE7' : '#DBEAFE'}; color: ${cell.toLowerCase().includes('concl') || cell.toLowerCase().includes('super') || cell.toLowerCase().includes('ok') ? '#15803D' : '#1D4ED8'}; padding: 2px 7px; border-radius: 4px; font-weight: 700; font-size: 8.5px;">
                        ${cell}
                      </span>
                    ` : cell}
                  </td>
                `).join('')}
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  </section>`);
    } else if (type === 'conclusion' || sNum === rawSlides.length) {
      compiledSlideSections.push(`
  <section class="slide${isActive}" id="slide-${sNum}" data-slide="${sNum}">
    <div class="slide-cover" style="background: linear-gradient(135deg, ${palette.primaryNavy} 0%, ${palette.primary} 100%); color: #FFFFFF; border-radius: 8px;">
      <span class="cover-tag" style="background: rgba(255,255,255,0.15); color: #FFFFFF; border: 1px solid rgba(255,255,255,0.3);">
        CONCLUSÃO & COMPROMISSOS EXECUTIVOS
      </span>
      <h2 class="cover-title" style="color: #FFFFFF;">
        ${slide.title || 'Compromisso com Resultados & Governança'}
      </h2>
      <p class="cover-subtitle" style="color: rgba(255,255,255,0.88); max-width: 860px;">
        ${slide.subtitle || `Alinhamento estratégico contínuo com ${audience} para assegurar a entrega total das metas.`}
      </p>
      <div class="cover-grid" style="max-width: 720px; margin: 12px 0;">
        <div class="cover-kpi" style="background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); border-top: 3px solid ${palette.accent};">
          <div class="cover-kpi-label" style="color: rgba(255,255,255,0.7);">Meta Global</div>
          <div class="cover-kpi-val" style="color: #FFFFFF;">100%</div>
          <div class="cover-kpi-sub" style="color: #86EFAC;">Rollout Aprovado</div>
        </div>
        <div class="cover-kpi" style="background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); border-top: 3px solid #059669;">
          <div class="cover-kpi-label" style="color: rgba(255,255,255,0.7);">SLA de Entrega</div>
          <div class="cover-kpi-val" style="color: #FFFFFF;">99.4%</div>
          <div class="cover-kpi-sub" style="color: #86EFAC;">Alta Conformidade</div>
        </div>
        <div class="cover-kpi" style="background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); border-top: 3px solid ${palette.accent};">
          <div class="cover-kpi-label" style="color: rgba(255,255,255,0.7);">Governança</div>
          <div class="cover-kpi-val" style="color: #FFFFFF;">Semanal</div>
          <div class="cover-kpi-sub" style="color: #86EFAC;">Reporte Ativo</div>
        </div>
        <div class="cover-kpi" style="background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); border-top: 3px solid #059669;">
          <div class="cover-kpi-label" style="color: rgba(255,255,255,0.7);">Auditoria</div>
          <div class="cover-kpi-val" style="color: #FFFFFF;">100%</div>
          <div class="cover-kpi-sub" style="color: #86EFAC;">Conformidade</div>
        </div>
      </div>
      <div class="cover-meta-bar" style="border-top-color: rgba(255,255,255,0.2); color: rgba(255,255,255,0.8);">
        <span><strong>Diretoria:</strong> Casas Bahia / Varejo</span>
        <span>•</span>
        <span><strong>Safra:</strong> Outubro/2026</span>
        <span>•</span>
        <span><strong>Confidencial:</strong> Uso Executivo Interno</span>
      </div>
    </div>
  </section>`);
    } else {
      // Default: KPI Row + Split View with Chart.js canvas and Takeaways
      const kpis = Array.isArray(slide.kpiRow) && slide.kpiRow.length > 0
        ? slide.kpiRow
        : [
            { label: 'Indicador Real', val: '78.5', delta: '+2.4 MoM', highlight: true },
            { label: 'Meta Período', val: '75.0', delta: 'Meta batida', highlight: false },
            { label: 'Volume Auditado', val: '1.420', delta: '+12% YoY', highlight: false },
            { label: 'Aderência', val: '98.2%', delta: 'Superavitário', highlight: true },
          ];

      const chartConfig = slide.chart
        ? {
            type: slide.chart.type || 'line',
            data: {
              labels: slide.chart.labels || ['Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out'],
              datasets: [{
                label: slide.chart.datasetLabel || 'Realizado',
                data: slide.chart.data || [68, 71, 74, 76, 79, 82],
                borderColor: palette.primary,
                backgroundColor: slide.chart.type === 'line' ? 'rgba(0, 51, 198, 0.08)' : palette.primary,
                fill: slide.chart.type === 'line',
                tension: 0.3,
                borderRadius: slide.chart.type === 'bar' ? 4 : 0,
              }],
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
            },
          }
        : {
            type: 'line',
            data: {
              labels: ['Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out'],
              datasets: [{
                label: 'Performance',
                data: [65, 68, 71, 74, 78, 82],
                borderColor: palette.primary,
                backgroundColor: 'rgba(0, 51, 198, 0.08)',
                fill: true,
                tension: 0.3,
              }],
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
            },
          };

      const takeaways = Array.isArray(slide.takeaways) && slide.takeaways.length > 0
        ? slide.takeaways
        : [
            { highlight: 'Trajetória Positiva', text: 'Ganhos acumulados consistentes ao longo dos últimos ciclos.' },
            { highlight: 'Controle de Desvios', text: 'Processos padronizados com mitigação rápida de atritos.' },
            { highlight: 'Alinhamento com Meta', text: 'Engajamento integral das lideranças em campo.' },
            { highlight: 'Próximos Passos', text: 'Manutenção do ritmo para atingimento integral das metas de fechamento.' },
          ];

      compiledSlideSections.push(`
  <section class="slide${isActive}" id="slide-${sNum}" data-slide="${sNum}">
    <div class="slide-header">
      <div class="slide-category" style="color: ${palette.primary};">${slide.category || `0${sNum - 1}. Panorama Estratégico`}</div>
      <h2 class="slide-title">${slide.title || 'Desempenho dos Indicadores Chave'}</h2>
      <p class="slide-subtitle">${slide.subtitle || 'Acompanhamento detalhado com curva histórica e direcionadores'}</p>
    </div>
    <div class="slide-content">
      <div class="${kpis.length > 4 ? 'kpi-row-6' : 'kpi-row'}">
        ${kpis.map((k: any) => `
        <div class="kpi-card ${k.highlight ? 'highlight' : ''}" style="${k.highlight ? `border-top-color: ${palette.primary};` : ''}">
          <div class="kpi-label">${k.label}</div>
          <div class="kpi-val" style="${k.highlight ? `color: ${palette.primary};` : ''}">${k.val}</div>
          <div class="kpi-delta ${k.delta && (k.delta.includes('-') || k.delta.includes('neg')) ? 'neg' : 'pos'}">${k.delta || '+'}</div>
        </div>`).join('')}
      </div>

      <div class="split-view">
        <div class="chart-card">
          <div class="chart-header" style="color: ${palette.primaryNavy};">${slide.chart?.title || 'Evolução Temporal dos Resultados'}</div>
          <div class="chart-container">
            <canvas id="chart-slide-${sNum}" data-chart-data='${JSON.stringify(chartConfig)}'></canvas>
          </div>
        </div>

        <div class="side-panel">
          <div class="side-panel-title" style="color: ${palette.primary}; border-color: ${palette.primary};">
            Takeaways Executivos
          </div>
          <ul class="takeaway-list">
            ${takeaways.map((t: any) => `<li><strong>${t.highlight || 'Destaque'}</strong>: ${t.text || ''}</li>`).join('')}
          </ul>
        </div>
      </div>
    </div>
  </section>`);
    }
  });

  return buildCasasBahiaHtmlShell(compiledSlideSections, {
    topic: meta.topic,
    audience: meta.audience,
    palette: meta.palette,
    slideCount: meta.slideCount,
  });
}

// Domain-aware presentation synthesizer that creates realistic, rich, tailored slides matching user topic & files
function generateContextualPresentation(params: {
  topic: string;
  objective: string;
  audience: string;
  tone: string;
  slideCount: number;
  palette: { primary: string; primaryNavy: string; accent: string; bg: string; text: string; name: string };
  includeCharts: boolean;
  filesSummary: string;
  parsedCsvData: { headers: string[]; rows: string[][] } | null;
  additionalNotes: string;
}): string {
  const { topic, objective, audience, tone, slideCount, palette, includeCharts, filesSummary, parsedCsvData, additionalNotes } = params;

  const cleanTopic = topic.trim() || 'Diagnóstico Estratégico & Indicadores de CX';
  const cleanObjective = objective.trim() || 'Apresentação executiva de desempenho, plano tático e direcionadores de metas';
  const lowerText = `${cleanTopic} ${cleanObjective} ${additionalNotes} ${filesSummary}`.toLowerCase();

  // Detect domain context
  type Domain = 'vendas' | 'logistica' | 'cx' | 'rh' | 'financeiro' | 'tech' | 'marketing' | 'geral';
  let domain: Domain = 'geral';

  if (lowerText.includes('venda') || lowerText.includes('comercial') || lowerText.includes('receita') || lowerText.includes('varejo') || lowerText.includes('faturamento') || lowerText.includes('black friday')) {
    domain = 'vendas';
  } else if (lowerText.includes('logística') || lowerText.includes('entrega') || lowerText.includes('transporte') || lowerText.includes('estoque') || lowerText.includes('supply') || lowerText.includes('frete') || lowerText.includes('armazém')) {
    domain = 'logistica';
  } else if (lowerText.includes('cx') || lowerText.includes('nps') || lowerText.includes('cliente') || lowerText.includes('atendimento') || lowerText.includes('satisfação') || lowerText.includes('detrator')) {
    domain = 'cx';
  } else if (lowerText.includes('rh') || lowerText.includes('pessoa') || lowerText.includes('talento') || lowerText.includes('colaborador') || lowerText.includes('turnover') || lowerText.includes('treinamento') || lowerText.includes('equipe')) {
    domain = 'rh';
  } else if (lowerText.includes('financ') || lowerText.includes('custo') || lowerText.includes('ebitda') || lowerText.includes('lucro') || lowerText.includes('margem') || lowerText.includes('orçamento')) {
    domain = 'financeiro';
  } else if (lowerText.includes('tecnologia') || lowerText.includes('software') || lowerText.includes('sistema') || lowerText.includes('ti') || lowerText.includes('deploy') || lowerText.includes('app')) {
    domain = 'tech';
  } else if (lowerText.includes('marketing') || lowerText.includes('mídia') || lowerText.includes('lead') || lowerText.includes('aquisição') || lowerText.includes('campanha')) {
    domain = 'marketing';
  }

  // Domain-specific metric packs
  const domainPacks: Record<Domain, {
    coverKpis: Array<{ label: string; val: string; sub: string }>;
    kpiRow6: Array<{ label: string; val: string; delta: string; type: string }>;
    pillars: string[];
    criticalTakeaways: string[];
    tableRows: Array<{ item: string; resp: string; aderenza: string; meta: string; status: string; statusClass: string }>;
    chartTitle: string;
    chartLabels: string[];
    chartValues: number[];
  }> = {
    vendas: {
      coverKpis: [
        { label: 'GMV Consolidado', val: 'R$ 84.6M', sub: '+14.2% vs período anterior' },
        { label: 'Ticket Médio', val: 'R$ 1.280', sub: '+6.8% MoM • Alta fidelidade' },
        { label: 'Conversão em Loja', val: '18.4%', sub: 'Meta: 16.0% • Superavitário' },
        { label: 'Margem de Contribuição', val: '27.9%', sub: '+1.8 p.p. de expansão' },
      ],
      kpiRow6: [
        { label: 'Faturamento Total', val: 'R$ 84.6M', delta: '+14.2% YoY', type: 'highlight' },
        { label: 'Margem Bruta', val: '31.4%', delta: '+2.1 p.p.', type: 'success' },
        { label: 'Volume Pedidos', val: '66.1k', delta: '+8.9%', type: 'success' },
        { label: 'CAC Blended', val: 'R$ 42', delta: '-12% de redução', type: 'success' },
        { label: 'Share Digital', val: '43.8%', delta: 'Crescimento ativo', type: '' },
        { label: 'Aderência à Meta', val: '104.2%', delta: 'Meta batida', type: 'highlight' },
      ],
      pillars: [
        `Foco na rentabilidade das categorias prioritárias em alinhamento com ${audience}`,
        'Intensificação de campanhas sazonais e ofertas personalizadas por canal',
        'Treinamento consultivo de vendedores com foco em cross-sell e garantia estendida',
      ],
      criticalTakeaways: [
        'Resolução ágil de rupturas de estoque nas lojas líderes de venda',
        'Alavancagem de canais digitais integrados ao ponto físico (Click & Collect)',
        'Acompanhamento diário das filiais abaixo de 90% da meta de vendas',
      ],
      tableRows: [
        { item: 'Aceleração de Ofertas no App & Web', resp: 'Comercial & Growth', aderenza: '102.5%', meta: '100%', status: 'Superado', statusClass: 'pos' },
        { item: 'Expansão de Mix de Eletrônicos & Móveis', resp: 'Compras & Pricing', aderenza: '98.0%', meta: '95%', status: 'Concluído', statusClass: 'pos' },
        { item: 'Campanha de Recuperação de Carrinho', resp: 'CRM & Marketing', aderenza: '95.4%', meta: '90%', status: 'Em Andamento', statusClass: 'neu' },
        { item: 'Capacitação das Lojas em Venda Digital', resp: 'Operações de Loja', aderenza: '91.8%', meta: '90%', status: 'Em Andamento', statusClass: 'neu' },
      ],
      chartTitle: 'Evolução Mensal do Faturamento & Conversão (R$ Milhões)',
      chartLabels: ['Mai', 'Jun', 'Jul', 'Ago', 'Set (F)', 'Out (P)'],
      chartValues: [68.4, 71.2, 73.8, 77.5, 81.2, 84.6],
    },
    logistica: {
      coverKpis: [
        { label: 'OTIF (No Prazo & Completo)', val: '96.8%', sub: '+3.4 p.p. vs meta global' },
        { label: 'SLA de Entrega', val: '98.2%', sub: 'Entrega rápida em até 24h' },
        { label: 'Custo de Frete / Receita', val: '4.8%', sub: '-0.7 p.p. de economia' },
        { label: 'Acuracidade de Estoque', val: '99.4%', sub: 'Auditoria contínua de CDs' },
      ],
      kpiRow6: [
        { label: 'OTIF Consolidado', val: '96.8%', delta: 'Meta: 95.0%', type: 'highlight' },
        { label: 'Entregas Realizadas', val: '142.5k', delta: '+12.4% MoM', type: 'success' },
        { label: 'Lead Time Médio', val: '1.8 dias', delta: '-0.6 dias vs Q3', type: 'success' },
        { label: 'Insucesso 1ª Tentativa', val: '2.1%', delta: 'Mínima histórica', type: 'success' },
        { label: 'Capacidade de CD', val: '86.4%', delta: 'Nível otimizado', type: '' },
        { label: 'NPS de Entrega', val: '88 pts', delta: 'Zona de excelência', type: 'highlight' },
      ],
      pillars: [
        `Roteirização inteligente e despacho automatizado para ${audience}`,
        'Integração em tempo real entre filiais e Centros de Distribuição regionais',
        'Acompanhamento preditivo de gargalos e desvios de rota na última milha',
      ],
      criticalTakeaways: [
        'Priorização de entregas no mesmo dia para áreas metropolitanas chave',
        'Controle rigoroso de avarias e conferência eletrônica no recebimento',
        'Comunicação proativa com o cliente final via WhatsApp e SMS com tracking em tempo real',
      ],
      tableRows: [
        { item: 'Implementação de Roteirização Dinâmica', resp: 'Logística / Transportes', aderenza: '99.1%', meta: '95%', status: 'Concluído', statusClass: 'pos' },
        { item: 'Otimização de Cross-docking nos CDs', resp: 'Operações de Armazém', aderenza: '96.5%', meta: '92%', status: 'Concluído', statusClass: 'pos' },
        { item: 'Auditoria de Avarias de Linha Branca', resp: 'Qualidade & CX', aderenza: '93.0%', meta: '90%', status: 'Em Andamento', statusClass: 'neu' },
        { item: 'Expansão de Frota Elétrica / Sustentável', resp: 'Suprimentos & Frota', aderenza: '88.5%', meta: '85%', status: 'Em Andamento', statusClass: 'neu' },
      ],
      chartTitle: 'Evolução da Eficiência OTIF & Cumprimento de SLA (%)',
      chartLabels: ['Mai', 'Jun', 'Jul', 'Ago', 'Set (F)', 'Out (P)'],
      chartValues: [89.5, 91.2, 93.4, 94.8, 96.1, 96.8],
    },
    cx: {
      coverKpis: [
        { label: 'NPS Consolidado', val: '72.8', sub: '+2.6 pts vs safra anterior • Zona de Qualidade' },
        { label: 'Índice de Promotores', val: '82.4%', sub: '481 clientes promotores auditados' },
        { label: 'Taxa de Detração', val: '8.6%', sub: '-1.4 p.p. vs mês anterior' },
        { label: 'FCR (Resolução 1º Contato)', val: '89.5%', sub: 'Atendimento humanizado em loja' },
      ],
      kpiRow6: [
        { label: 'NPS Geral', val: '72.8', delta: '+2.6 pts MoM', type: 'highlight' },
        { label: 'Promotores', val: '82.4%', delta: 'Zona de Qualidade', type: 'success' },
        { label: 'Neutros', val: '9.0%', delta: 'Potencial de conversão', type: '' },
        { label: 'Detratores', val: '8.6%', delta: '-1.4 p.p. (redução)', type: 'success' },
        { label: 'Pesquisas Auditadas', val: '586', delta: 'Amostra estrita', type: '' },
        { label: 'Satisfação de Balcão', val: '94.2%', delta: 'Destaque regional', type: 'highlight' },
      ],
      pillars: [
        `Cultura centrada no cliente desdobrada para ${audience}`,
        'Tratativa imediata de detratores em até 24 horas (Closed Loop Feedback)',
        'Análise da causa-raiz de insatisfação por filial e canal de atendimento',
      ],
      criticalTakeaways: [
        'Acolhimento humanizado e tempo de fila reduzido nos caixas',
        'Alinhamento estreito entre time de montagem e SAC para evitar atritos',
        'Reconhecimento das filiais com NPS acima de 80 pontos como referências da rede',
      ],
      tableRows: [
        { item: 'Tratativa de Detratores em 24h (Closed Loop)', resp: 'Gerentes de Loja', aderenza: '98.5%', meta: '95%', status: 'Concluído', statusClass: 'pos' },
        { item: 'Treinamento de Encantamento & Escuta Ativa', resp: 'Treinamento / CX', aderenza: '95.0%', meta: '90%', status: 'Concluído', statusClass: 'pos' },
        { item: 'Otimização do Fluxo de Trocas & Garantias', resp: 'Pós-Venda / Balcão', aderenza: '92.4%', meta: '88%', status: 'Em Andamento', statusClass: 'neu' },
        { item: 'Painel Diário de Indicadores por Vendedor', resp: 'BI & Inteligência CX', aderenza: '90.2%', meta: '85%', status: 'Em Andamento', statusClass: 'neu' },
      ],
      chartTitle: 'Trajetória Mensal de NPS & Evolução de Promotores (pts)',
      chartLabels: ['Mai', 'Jun', 'Jul', 'Ago', 'Set (F)', 'Out (P)'],
      chartValues: [64.2, 67.5, 69.1, 70.8, 71.8, 72.8],
    },
    rh: {
      coverKpis: [
        { label: 'eNPS de Colaboradores', val: '68.5', sub: '+8.2 pts vs semestre anterior' },
        { label: 'Turnover Voluntário', val: '1.8%', sub: '-0.9 p.p. • Retenção de talentos' },
        { label: 'Horas de Treinamento', val: '42h / ano', sub: '100% de líderes capacitados' },
        { label: 'Clima & Engajamento', val: '89%', sub: 'Adesão de 94% à pesquisa interna' },
      ],
      kpiRow6: [
        { label: 'eNPS Interno', val: '68.5', delta: 'Zona de Excelência', type: 'highlight' },
        { label: 'Retenção de Líderes', val: '97.2%', delta: '+2.4 p.p.', type: 'success' },
        { label: 'Turnover Geral', val: '2.1%', delta: '-1.1 p.p. MoM', type: 'success' },
        { label: 'Absenteísmo', val: '1.4%', delta: 'Dentro da meta', type: 'success' },
        { label: 'Horas de Treinamento', val: '4.8k h', delta: 'Capacitação ativa', type: '' },
        { label: 'Adesão à Pesquisa', val: '94.6%', delta: 'Engajamento total', type: 'highlight' },
      ],
      pillars: [
        `Desenvolvimento e retenção de lideranças alinhados a ${audience}`,
        'Plano de carreira estruturado com meritocracia e metas transparentes',
        'Programas de bem-estar, saúde mental e ergonomia em todas as unidades',
      ],
      criticalTakeaways: [
        'Aceleração dos planos individuais de desenvolvimento (PDI)',
        'Feedbacks quinzenais estruturados entre gerentes e equipes de piso',
        'Campanhas contínuas de segurança e valorização do ambiente de trabalho',
      ],
      tableRows: [
        { item: 'Capacitação de Gerentes em Liderança Ágil', resp: 'RH / Educação Corp', aderenza: '100%', meta: '95%', status: 'Concluído', statusClass: 'pos' },
        { item: 'Implementação do PDI para 100% da Equipe', resp: 'Liderança de Loja', aderenza: '96.2%', meta: '90%', status: 'Concluído', statusClass: 'pos' },
        { item: 'Pesquisa de Pulso de Clima Quinzenal', resp: 'Gente & Cultura', aderenza: '94.0%', meta: '90%', status: 'Em Andamento', statusClass: 'neu' },
        { item: 'Programa de Reconhecimento Destaque do Mês', resp: 'Operações & RH', aderenza: '91.5%', meta: '85%', status: 'Em Andamento', statusClass: 'neu' },
      ],
      chartTitle: 'Evolução do Índice de Engajamento & Retenção de Pessoal (%)',
      chartLabels: ['Mai', 'Jun', 'Jul', 'Ago', 'Set (F)', 'Out (P)'],
      chartValues: [74, 78, 81, 85, 87, 89],
    },
    financeiro: {
      coverKpis: [
        { label: 'EBITDA Ajustado', val: 'R$ 18.2M', sub: '+18.5% YoY • Margem em alta' },
        { label: 'Margem Operacional', val: '14.6%', sub: '+2.3 p.p. vs guidance' },
        { label: 'Redução de Opex', val: '-8.4%', sub: 'Eficiência de custos consolidada' },
        { label: 'Fluxo de Caixa Livre', val: 'R$ 12.8M', sub: 'Geração positiva no ciclo' },
      ],
      kpiRow6: [
        { label: 'EBITDA', val: 'R$ 18.2M', delta: '+18.5% YoY', type: 'highlight' },
        { label: 'Margem EBITDA', val: '14.6%', delta: '+2.3 p.p.', type: 'success' },
        { label: 'Receita Líquida', val: 'R$ 124.5M', delta: '+9.4%', type: 'success' },
        { label: 'Opex / Receita', val: '16.2%', delta: '-1.8 p.p.', type: 'success' },
        { label: 'ROIC', val: '19.4%', delta: '+3.1 p.p.', type: '' },
        { label: 'Aderência Orçamento', val: '101.8%', delta: 'Meta superada', type: 'highlight' },
      ],
      pillars: [
        `Disciplina orçamentária rigorosa com reporte executivo para ${audience}`,
        'Otimização contínua de despesas gerais e contratos corporativos',
        'Alocação inteligente de capital com foco em projetos de maior retorno (ROI)',
      ],
      criticalTakeaways: [
        'Monitoramento diário de tesouraria e capital de giro',
        'Revisão contínua de contratos de serviços terceirizados',
        'Alinhamento financeiro estreito com os planos comerciais de expansão',
      ],
      tableRows: [
        { item: 'Renegociação de Contratos de TI & Suprimentos', resp: 'Controladoria & Compras', aderenza: '102.0%', meta: '100%', status: 'Superado', statusClass: 'pos' },
        { item: 'Auditoria de Conciliação Financeira Diária', resp: 'Tesouraria', aderenza: '99.5%', meta: '98%', status: 'Concluído', statusClass: 'pos' },
        { item: 'Otimização de Linhas de Crédito & Financiamento', resp: 'Finanças Corporativas', aderenza: '95.0%', meta: '90%', status: 'Em Andamento', statusClass: 'neu' },
        { item: 'Automação de Relatórios Contábeis & Fiscais', resp: 'Contabilidade & TI', aderenza: '91.0%', meta: '85%', status: 'Em Andamento', statusClass: 'neu' },
      ],
      chartTitle: 'Curva de Expansão de EBITDA & Margem Operacional (R$ Milhões)',
      chartLabels: ['Mai', 'Jun', 'Jul', 'Ago', 'Set (F)', 'Out (P)'],
      chartValues: [12.4, 13.8, 14.9, 16.1, 17.4, 18.2],
    },
    tech: {
      coverKpis: [
        { label: 'Uptime Global', val: '99.98%', sub: 'Alta disponibilidade em nuvem' },
        { label: 'Tempo de Resposta P95', val: '142ms', sub: '-35ms vs ciclo anterior' },
        { label: 'Deploy Frequency', val: '14 / semana', sub: 'Esteira CI/CD automatizada' },
        { label: 'MTTR (Tempo de Recuperação)', val: '< 12 min', sub: 'Observabilidade 24/7' },
      ],
      kpiRow6: [
        { label: 'Disponibilidade', val: '99.98%', delta: 'SLA mantido', type: 'highlight' },
        { label: 'Latência Média', val: '142ms', delta: '-19.8%', type: 'success' },
        { label: 'Incidentes P1', val: '0', delta: 'Zero incidentes críticos', type: 'success' },
        { label: 'Taxa de Erro', val: '0.04%', delta: 'Padrão ouro', type: 'success' },
        { label: 'Segurança / Vulnerab.', val: '0 Críticas', delta: 'Auditoria aprovada', type: '' },
        { label: 'Aderência ao Roadmap', val: '96.5%', delta: 'Entregas em dia', type: 'highlight' },
      ],
      pillars: [
        `Arquitetura resiliente e escalável com governança para ${audience}`,
        'Automação contínua de testes, segurança e infraestrutura como código',
        'Foco absoluto na experiência do usuário e na velocidade das aplicações',
      ],
      criticalTakeaways: [
        'Migração de serviços legados para microsserviços modernos',
        'Observabilidade completa ponta a ponta com alertas preditivos',
        'Capacitação dos times de engenharia nas melhores práticas de segurança',
      ],
      tableRows: [
        { item: 'Migração de Banco de Dados para Cloud Nativo', resp: 'Infra / DevOps', aderenza: '100%', meta: '95%', status: 'Concluído', statusClass: 'pos' },
        { item: 'Modernização da Camada de API de Vendas', resp: 'Engenharia de Software', aderenza: '97.0%', meta: '90%', status: 'Concluído', statusClass: 'pos' },
        { item: 'Auditoria de Segurança & Penetration Test', resp: 'InfoSec', aderenza: '95.5%', meta: '90%', status: 'Em Andamento', statusClass: 'neu' },
        { item: 'Implementação de Observabilidade Real-time', resp: 'SRE & Qualidade', aderenza: '92.0%', meta: '85%', status: 'Em Andamento', statusClass: 'neu' },
      ],
      chartTitle: 'Velocidade de Entrega & Redução de Latência de Sistemas (ms)',
      chartLabels: ['Mai', 'Jun', 'Jul', 'Ago', 'Set (F)', 'Out (P)'],
      chartValues: [220, 195, 178, 162, 150, 142],
    },
    marketing: {
      coverKpis: [
        { label: 'ROI de Mídia', val: '4.8x', sub: '+1.2x vs média histórica' },
        { label: 'Custo por Lead (CPL)', val: 'R$ 8.40', sub: '-24% de otimização' },
        { label: 'Alcance Orgânico', val: '4.2M', sub: '+38% de crescimento em redes' },
        { label: 'Taxa de Conversão', val: '3.9%', sub: 'Alta aderência de campanhas' },
      ],
      kpiRow6: [
        { label: 'ROAS Global', val: '4.8x', delta: '+25% de ganho', type: 'highlight' },
        { label: 'Leads Qualificados', val: '18.4k', delta: '+31% YoY', type: 'success' },
        { label: 'Taxa de Clique (CTR)', val: '4.2%', delta: '+0.8 p.p.', type: 'success' },
        { label: 'Engajamento Social', val: '8.7%', delta: 'Comunidade ativa', type: 'success' },
        { label: 'Share of Voice', val: '32.5%', delta: 'Liderança no segmento', type: '' },
        { label: 'CAC Blended', val: 'R$ 38', delta: 'Meta superada', type: 'highlight' },
      ],
      pillars: [
        `Estratégia omnicanal orientada a dados e alinhada com ${audience}`,
        'Personalização de mensagens e segmentação avançada por perfil de cliente',
        'Testes A/B contínuos em criativos, páginas de destino e ofertas',
      ],
      criticalTakeaways: [
        'Aproveitamento de datas comerciais sazonais para picos de conversão',
        'Parcerias estratégicas com criadores de conteúdo e influenciadores',
        'Otimização em tempo real do orçamento para os canais de maior conversão',
      ],
      tableRows: [
        { item: 'Campanha de Performance Multi-Canal', resp: 'Equipe de Mídia & Ads', aderenza: '104.0%', meta: '100%', status: 'Superado', statusClass: 'pos' },
        { item: 'Reformulação das Páginas de Destino (LP)', resp: 'Design & UX', aderenza: '98.5%', meta: '95%', status: 'Concluído', statusClass: 'pos' },
        { item: 'Automação de E-mail Marketing & Réguas', resp: 'CRM & Conteúdo', aderenza: '94.2%', meta: '90%', status: 'Em Andamento', statusClass: 'neu' },
        { item: 'Parcerias com Influenciadores Regionais', resp: 'Branding & PR', aderenza: '89.0%', meta: '85%', status: 'Em Andamento', statusClass: 'neu' },
      ],
      chartTitle: 'Curva de Retorno sobre Investimento em Mídia (ROAS)',
      chartLabels: ['Mai', 'Jun', 'Jul', 'Ago', 'Set (F)', 'Out (P)'],
      chartValues: [3.2, 3.6, 3.9, 4.2, 4.5, 4.8],
    },
    geral: {
      coverKpis: [
        { label: 'Aderência ao Plano', val: '98.5%', sub: 'Alta conformidade operacional' },
        { label: 'Eficiência de Processo', val: '94.2%', sub: '+4.8 p.p. vs ciclo anterior' },
        { label: 'Satisfação Alvo', val: '88 pts', sub: 'Zona de Excelência consolidada' },
        { label: 'Status Global', val: 'Aprovado', sub: 'Execução prioritária em curso' },
      ],
      kpiRow6: [
        { label: 'Aderência Global', val: '98.5%', delta: 'Meta: 95.0%', type: 'highlight' },
        { label: 'Eficiência Operacional', val: '94.2%', delta: '+4.8 p.p. MoM', type: 'success' },
        { label: 'Conformidade de SLA', val: '97.8%', delta: 'Processos estáveis', type: 'success' },
        { label: 'Redução de Atrito', val: '-18.4%', delta: 'Ganhos de agilidade', type: 'success' },
        { label: 'Engajamento dos Times', val: '91.2%', delta: 'Lideranças ativas', type: '' },
        { label: 'Resultado Consolidado', val: '100%', delta: 'Rollout liberado', type: 'highlight' },
      ],
      pillars: [
        `Governança sólida e reporte transparente para ${audience}`,
        'Padronização de rotinas com eliminação de desperdícios operacionais',
        'Capacitação regular dos times e metas claras orientadas por dados',
      ],
      criticalTakeaways: [
        'Resolução rápida de desvios operacionais com alinhamentos semanais',
        'Canais diretos de comunicação e acompanhamento com os coordenadores',
        'Compromisso estrito com a entrega dos marcos estratégicos',
      ],
      tableRows: [
        { item: 'Alinhamento Inicial e Capacitação de Líderes', resp: 'Gerência de Projeto', aderenza: '100%', meta: '95%', status: 'Concluído', statusClass: 'pos' },
        { item: 'Padronização dos Fluxos e Processos Chave', resp: 'Equipe de Operações', aderenza: '96.0%', meta: '90%', status: 'Concluído', statusClass: 'pos' },
        { item: 'Monitoramento Contínuo dos Indicadores Chave', resp: 'Inteligência & BI', aderenza: '93.5%', meta: '90%', status: 'Em Andamento', statusClass: 'neu' },
        { item: 'Auditoria de Qualidade e Conformidade', resp: 'Qualidade & Governança', aderenza: '90.0%', meta: '85%', status: 'Em Andamento', statusClass: 'neu' },
      ],
      chartTitle: 'Evolução da Eficiência Operacional & Aderência (%)',
      chartLabels: ['Mai', 'Jun', 'Jul', 'Ago', 'Set (F)', 'Out (P)'],
      chartValues: [82, 85, 88, 91, 93, 95],
    },
  };

  const pack = domainPacks[domain];

  // If user uploaded tabular data (CSV), override tableRows with their actual data!
  if (parsedCsvData && parsedCsvData.rows.length > 0) {
    const customRows = parsedCsvData.rows.slice(0, 5).map((r, i) => {
      const item = r[0] || `Iniciativa ${i + 1}`;
      const resp = r[1] || 'Responsável';
      const aderenza = r[2] || '95%';
      const meta = r[3] || '90%';
      const status = r[4] || 'Em Andamento';
      return { item, resp, aderenza, meta, status, statusClass: status.toLowerCase().includes('concl') || status.toLowerCase().includes('ok') ? 'pos' : 'neu' };
    });
    if (customRows.length > 0) {
      pack.tableRows = customRows;
    }
  }

  const slides: string[] = [];

  // SLIDE 1: Capa Executiva Casas Bahia
  slides.push(`
  <section class="slide active" id="slide-1" data-slide="1">
    <div class="slide-cover">
      <span class="cover-tag">${audience.toUpperCase()} • APRESENTAÇÃO ESTRATÉGICA</span>
      <h1 class="cover-title">${cleanTopic}</h1>
      <p class="cover-subtitle">${cleanObjective}</p>

      <div class="cover-grid">
        ${pack.coverKpis
          .map(
            (k, idx) => `
        <div class="cover-kpi" style="border-top: 3px solid ${idx % 2 === 0 ? palette.primary : palette.accent};">
          <div class="cover-kpi-label">${k.label}</div>
          <div class="cover-kpi-val">${k.val}</div>
          <div class="cover-kpi-sub" style="color: #059669;">${k.sub}</div>
        </div>`
          )
          .join('')}
      </div>

      <div class="cover-meta-bar">
        <span><strong>Projeto:</strong> ${cleanTopic}</span>
        <span>•</span>
        <span><strong>Diretoria:</strong> Casas Bahia / Varejo</span>
        <span>•</span>
        <span><strong>Safra:</strong> Outubro/2026</span>
        <span>•</span>
        <span><strong>Tom:</strong> ${tone}</span>
      </div>
    </div>
  </section>`);

  // SLIDE 2: Panorama Executivo & Diagnóstico
  slides.push(`
  <section class="slide" id="slide-2" data-slide="2">
    <div class="slide-header">
      <div class="slide-category" style="color: ${palette.primary};">01. Panorama Executivo</div>
      <h2 class="slide-title">Visão Consolidada de Desempenho & Metas</h2>
      <p class="slide-subtitle">${cleanObjective}</p>
    </div>
    <div class="slide-content">
      <div class="kpi-row-6">
        ${pack.kpiRow6
          .map(
            (k) => `
        <div class="kpi-card ${k.type === 'highlight' ? 'highlight' : k.type === 'success' ? 'success' : ''}" style="${k.type === 'highlight' ? `border-top-color: ${palette.primary};` : ''}">
          <div class="kpi-label">${k.label}</div>
          <div class="kpi-val" style="${k.type === 'highlight' ? `color: ${palette.primary};` : ''}">${k.val}</div>
          <div class="kpi-delta ${k.type === 'success' ? 'pos' : 'neu'}">${k.delta}</div>
        </div>`
          )
          .join('')}
      </div>

      <div class="split-view">
        <div class="chart-card">
          <div class="chart-header" style="color: ${palette.primaryNavy};">Trajetória e Evolução Temporal</div>
          <div class="chart-container">
            <canvas id="chart-slide-2" data-chart-data='${JSON.stringify({
              type: 'line',
              data: {
                labels: pack.chartLabels,
                datasets: [{
                  label: 'Performance',
                  data: pack.chartValues,
                  borderColor: palette.primary,
                  backgroundColor: 'rgba(0, 51, 198, 0.08)',
                  fill: true,
                  tension: 0.3,
                }],
              },
              options: {
                responsive: true,
                maintainAspectRatio: false,
              },
            })}'></canvas>
          </div>
        </div>

        <div class="side-panel">
          <div class="side-panel-title" style="color: ${palette.primary}; border-color: ${palette.primary};">
            Takeaways Executivos
          </div>
          <ul class="takeaway-list">
            ${pack.pillars.map((p) => `<li><strong>Diretriz</strong>: ${p}.</li>`).join('')}
            ${pack.criticalTakeaways.map((c) => `<li><strong>Prioridade</strong>: ${c}.</li>`).join('')}
          </ul>
        </div>
      </div>
    </div>
  </section>`);

  // SLIDE 3: Indicadores Chave & Tabela Analítica 5W2H
  slides.push(`
  <section class="slide" id="slide-3" data-slide="3">
    <div class="slide-header">
      <div class="slide-category" style="color: ${palette.primary};">02. Indicadores Chave</div>
      <h2 class="slide-title">Acompanhamento de Metas & Roteiro 5W2H</h2>
      <p class="slide-subtitle">Iniciativas prioritárias desdobradas com responsáveis, prazos e métricas de controle</p>
    </div>
    <div class="slide-content">
      <div class="kpi-row">
        ${pack.coverKpis
          .map(
            (k, idx) => `
        <div class="kpi-card" style="border-top-color: ${idx === 0 ? palette.primary : idx === 1 ? '#059669' : palette.accent};">
          <div class="kpi-label">${k.label}</div>
          <div class="kpi-val" style="color: ${idx === 0 ? palette.primary : '#0F172A'};">${k.val}</div>
          <div class="kpi-delta pos">${k.sub.split('•')[0]}</div>
        </div>`
          )
          .join('')}
      </div>

      <div class="quote-box" style="border-left-color: ${palette.primary}; background: #EEF4FF;">
        <strong>Destaque Executivo:</strong> Aderência expressiva das equipes operacionais aos critérios do projeto <strong>${cleanTopic}</strong>, assegurando previsibilidade e velocidade de execução para <strong>${audience}</strong>.
      </div>

      <div class="table-container">
        <table class="analise-table">
          <thead>
            <tr>
              <th>Iniciativa Prioritária (O Quê)</th>
              <th>Responsável (Quem)</th>
              <th class="text-right">Aderência Real</th>
              <th class="text-right">Meta</th>
              <th class="text-center">Status</th>
            </tr>
          </thead>
          <tbody>
            ${pack.tableRows
              .map(
                (r, i) => `
            <tr style="${i === 0 ? 'background: #F0FDF4;' : ''}">
              <td><strong>${r.item}</strong></td>
              <td>${r.resp}</td>
              <td class="text-right"><strong>${r.aderenza}</strong></td>
              <td class="text-right">${r.meta}</td>
              <td class="text-center">
                <span style="background: ${r.statusClass === 'pos' ? '#DCFCE7' : '#DBEAFE'}; color: ${r.statusClass === 'pos' ? '#15803D' : '#1D4ED8'}; padding: 2px 7px; border-radius: 4px; font-weight: 700; font-size: 8.5px;">
                  ${r.status}
                </span>
              </td>
            </tr>`
              )
              .join('')}
          </tbody>
        </table>
      </div>
    </div>
  </section>`);

  // SLIDE 4: Análise Gráfica com Curva de Tendência & Análise Causal
  slides.push(`
  <section class="slide" id="slide-4" data-slide="4">
    <div class="slide-header">
      <div class="slide-category" style="color: ${palette.primary};">03. Análise de Tendência</div>
      <h2 class="slide-title">Evolução dos Resultados & Trajetória Mensal</h2>
      <p class="slide-subtitle">Acompanhamento contínuo dos últimos 6 meses com aceleração na safra recente</p>
    </div>
    <div class="slide-content">
      <div class="split-view">
        <div class="chart-card">
          <div class="chart-header" style="color: ${palette.primaryNavy};">${pack.chartTitle}</div>
          <div class="chart-container">
            <canvas id="chart-slide-4" data-chart-data='${JSON.stringify({
              type: 'bar',
              data: {
                labels: pack.chartLabels,
                datasets: [{
                  label: 'Realizado',
                  data: pack.chartValues,
                  backgroundColor: palette.primary,
                  borderColor: palette.primaryNavy,
                  borderRadius: 4,
                }],
              },
              options: {
                responsive: true,
                maintainAspectRatio: false,
              },
            })}'></canvas>
          </div>
        </div>

        <div class="side-panel">
          <div class="side-panel-title" style="color: ${palette.primary}; border-color: ${palette.primary};">
            Diagnóstico Causal & Drivers
          </div>
          <ul class="takeaway-list success">
            <li><strong>Aceleração Consistente</strong>: Ganho acumulado relevante nos últimos meses com estabilização na faixa de meta.</li>
            <li><strong>Engajamento das Lideranças</strong>: Forte mobilização dos gestores em campo focados nos indicadores prioritários.</li>
            <li><strong>Sustentabilidade</strong>: Processos padronizados com controle de desvios que blindam a operação contra oscilações.</li>
            <li><strong>Próximo Marco</strong>: Expansão do modelo para as demais áreas com foco no encerramento do Q4.</li>
          </ul>
        </div>
      </div>
    </div>
  </section>`);

  // SLIDE 5: Matriz Estratégica 2x2
  slides.push(`
  <section class="slide" id="slide-5" data-slide="5">
    <div class="slide-header">
      <div class="slide-category" style="color: ${palette.primary};">04. Matriz Estratégica</div>
      <h2 class="slide-title">Segmentação Operacional por Quadrantes</h2>
      <p class="slide-subtitle">Distribuição das frentes de trabalho conforme impacto estratégico e nível de urgência</p>
    </div>
    <div class="slide-content">
      <div class="matrix-grid">
        <div class="matrix-card q-critico" style="border-top: 3px solid #DC2626; background: #FFFBFB;">
          <div class="matrix-title" style="color: #DC2626;">
            <span>1. Quadrante Crítico (Ação Imediata)</span>
            <span style="font-size: 9px; padding: 1px 6px; background: #FEE2E2; border-radius: 4px;">Urgência Alta</span>
          </div>
          <p style="font-size: 11px; color: #334155; line-height: 1.4;">Frentes com alto impacto no resultado final que requerem intervenção prioritária nas próximas 48 horas.</p>
          <ul class="takeaway-list danger" style="font-size: 10px; margin-top: 4px;">
            <li>Eliminação de gargalos pontuais de atendimento e suprimento</li>
            <li>Alinhamento diário com os líderes das unidades ofensoras</li>
          </ul>
        </div>

        <div class="matrix-card q-alerta" style="border-top: 3px solid #D97706; background: #FFFDF7;">
          <div class="matrix-title" style="color: #D97706;">
            <span>2. Quadrante Alerta (Monitoramento)</span>
            <span style="font-size: 9px; padding: 1px 6px; background: #FEF3C7; border-radius: 4px;">Atenção</span>
          </div>
          <p style="font-size: 11px; color: #334155; line-height: 1.4;">Processos com desempenho intermediário que necessitam de acompanhamento para não degradarem.</p>
          <ul class="takeaway-list" style="font-size: 10px; margin-top: 4px;">
            <li>Auditoria amostral periódica de qualidade</li>
            <li>Ajustes finos nas rotinas de abastecimento e escala</li>
          </ul>
        </div>

        <div class="matrix-card q-estavel" style="border-top: 3px solid #0284C7; background: #F7FAFC;">
          <div class="matrix-title" style="color: #0284C7;">
            <span>3. Quadrante Estável (Padronização)</span>
            <span style="font-size: 9px; padding: 1px 6px; background: #E0F2FE; border-radius: 4px;">Controlado</span>
          </div>
          <p style="font-size: 11px; color: #334155; line-height: 1.4;">Operações em velocidade de cruzeiro com processos documentados e replicáveis.</p>
          <ul class="takeaway-list" style="font-size: 10px; margin-top: 4px;">
            <li>Manutenção de SLAs contratuais</li>
            <li>Disseminação dos manuais de operação para novas contratações</li>
          </ul>
        </div>

        <div class="matrix-card q-fortaleza" style="border-top: 3px solid #059669; background: #F4FDF8;">
          <div class="matrix-title" style="color: #059669;">
            <span>4. Quadrante Fortaleza (Alavancagem)</span>
            <span style="font-size: 9px; padding: 1px 6px; background: #DCFCE7; border-radius: 4px;">Benchmarking</span>
          </div>
          <p style="font-size: 11px; color: #334155; line-height: 1.4;">Práticas de excelência comprovada que servem de modelo para toda a organização.</p>
          <ul class="takeaway-list success" style="font-size: 10px; margin-top: 4px;">
            <li>Reconhecimento formal das equipes de maior performance</li>
            <li>Replicação das boas práticas nas unidades em desenvolvimento</li>
          </ul>
        </div>
      </div>
    </div>
  </section>`);

  // Extra intermediate slides if slideCount > 6
  for (let s = 6; s < slideCount; s++) {
    slides.push(`
  <section class="slide" id="slide-${s}" data-slide="${s}">
    <div class="slide-header">
      <div class="slide-category" style="color: ${palette.primary};">0${s - 1}. Desdobramento de Iniciativas</div>
      <h2 class="slide-title">Plano Operacional Detalhado • Fase ${s - 5}</h2>
      <p class="slide-subtitle">Roteiro tático complementar com cronograma de rollout e validação contínua</p>
    </div>
    <div class="slide-content">
      <div class="split-view">
        <div class="side-panel" style="background: #FFFFFF;">
          <div class="side-panel-title" style="color: ${palette.primary}; border-color: ${palette.primary};">
            Atividades em Andamento
          </div>
          <ul class="takeaway-list">
            <li><strong>Etapa 1</strong>: Mapeamento detalhado dos fluxos operacionais em cada canal de atendimento.</li>
            <li><strong>Etapa 2</strong>: Instalação de dashboards de gestão visual em tempo real nas salas de comando.</li>
            <li><strong>Etapa 3</strong>: Capacitação prática de supervisores e coordenadores de campo.</li>
          </ul>
        </div>
        <div class="side-panel" style="background: #F8FAFC;">
          <div class="side-panel-title" style="color: ${palette.accent}; border-color: ${palette.accent};">
            Marcos de Entrega
          </div>
          <ul class="takeaway-list success">
            <li><strong>D+15</strong>: Homologação das rotinas com 100% dos gerentes de filial.</li>
            <li><strong>D+30</strong>: Apresentação do primeiro balanço parcial de resultados para ${audience}.</li>
            <li><strong>D+45</strong>: Auditoria externa de qualidade e consolidação da safra final.</li>
          </ul>
        </div>
      </div>
    </div>
  </section>`);
  }

  // SLIDE FINAL: Conclusão & Compromissos Executivos
  slides.push(`
  <section class="slide" id="slide-${slideCount}" data-slide="${slideCount}">
    <div class="slide-cover" style="background: linear-gradient(135deg, ${palette.primaryNavy} 0%, ${palette.primary} 100%); color: #FFFFFF; border-radius: 8px;">
      <span class="cover-tag" style="background: rgba(255,255,255,0.15); color: #FFFFFF; border: 1px solid rgba(255,255,255,0.3);">
        CONCLUSÃO & COMPROMISSOS EXECUTIVOS
      </span>
      <h2 class="cover-title" style="color: #FFFFFF;">
        Compromisso com a Excelência Operacional
      </h2>
      <p class="cover-subtitle" style="color: rgba(255,255,255,0.88); max-width: 860px;">
        Com metodologia estrita, disciplina na execução e governança executiva, asseguramos o atingimento integral das metas de <strong>${cleanTopic}</strong> para <strong>${audience}</strong>.
      </p>

      <div class="cover-grid" style="max-width: 720px; margin: 12px 0;">
        <div class="cover-kpi" style="background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); border-top: 3px solid ${palette.accent};">
          <div class="cover-kpi-label" style="color: rgba(255,255,255,0.7);">Meta de Entrega</div>
          <div class="cover-kpi-val" style="color: #FFFFFF;">100%</div>
          <div class="cover-kpi-sub" style="color: #6EE7B7;">Prazo Rigoroso Assegurado</div>
        </div>
        <div class="cover-kpi" style="background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); border-top: 3px solid #6EE7B7;">
          <div class="cover-kpi-label" style="color: rgba(255,255,255,0.7);">Qualidade & Governança</div>
          <div class="cover-kpi-val" style="color: #FFFFFF;">≥ 95%</div>
          <div class="cover-kpi-sub" style="color: #6EE7B7;">Aderência Auditada</div>
        </div>
      </div>

      <div class="cover-meta-bar" style="border-top-color: rgba(255,255,255,0.2); color: rgba(255,255,255,0.85); background: transparent; border: none; margin-top: auto;">
        <span>Casas Bahia • SlideStudio HTML</span>
        <span>•</span>
        <span>${audience}</span>
        <span>•</span>
        <span>Obrigado!</span>
      </div>
    </div>
  </section>`);

  return buildCasasBahiaHtmlShell(slides, {
    topic: cleanTopic,
    audience,
    palette,
    slideCount,
  });
}

// Builds the pristine Casas Bahia responsive HTML shell with header, footer and complete CSS
function buildCasasBahiaHtmlShell(
  slides: string[],
  meta: {
    topic: string;
    audience: string;
    palette: { primary: string; primaryNavy: string; accent: string; bg: string; text: string; name: string };
    slideCount: number;
  }
): string {
  const { topic, audience, palette, slideCount } = meta;

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
  <title>${topic} - Casas Bahia</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
  <style>
    :root {
      --cb-blue-primary: ${palette.primary};
      --cb-blue-dark: ${palette.primaryNavy};
      --cb-blue-navy: ${palette.primaryNavy};
      --cb-light-blue: #EEF3FF;
      --cb-blue-border: #C7D7FE;
      --cb-red-primary: ${palette.accent};
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
      --font-family: 'Inter', system-ui, -apple-system, sans-serif;
    }

    * { box-sizing: border-box; margin: 0; padding: 0; }

    html, body {
      width: 100%;
      height: 100%;
      height: 100dvh;
      overflow: hidden;
      background-color: var(--cb-gray-50);
      color: var(--cb-gray-900);
      font-family: var(--font-family);
      -webkit-font-smoothing: antialiased;
    }

    body {
      display: flex;
      flex-direction: column;
    }

    /* Header Fixo Superior */
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
      gap: 12px;
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
    .deck-container, .presentation-container {
      flex: 1;
      width: 100%;
      min-height: 0;
      position: relative;
      background: var(--cb-white);
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }

    .slide-viewport {
      flex: 1;
      width: 100%;
      height: 100%;
      min-height: 0;
      overflow: hidden;
      position: relative;
    }

    .slide {
      box-sizing: border-box;
      width: 100%;
      height: 100%;
      padding: clamp(14px, 2vh, 24px) clamp(20px, 2.5vw, 36px);
      display: flex;
      flex-direction: column;
      overflow: hidden;
      position: relative;
    }

    .slide-content {
      flex: 1;
      min-height: 0;
      height: 100%;
      display: flex;
      flex-direction: column;
      gap: clamp(8px, 1.2vh, 14px);
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
    }
    .kpi-delta.pos { color: var(--cb-success); }
    .kpi-delta.neg { color: var(--cb-danger); }
    .kpi-delta.neu { color: var(--cb-gray-500); }

    /* Visões Divididas */
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

    /* Grids Especiais & Tabelas */
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
    .matrix-title {
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .table-container {
      flex: 1;
      min-height: 0;
      overflow-y: auto;
      overflow-x: auto;
      border: 1px solid var(--cb-gray-200);
      border-radius: 6px;
      background: var(--cb-white);
      -webkit-overflow-scrolling: touch;
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
    .analise-table tbody tr { border-bottom: 1px solid var(--cb-gray-200); }
    .analise-table tbody tr:nth-child(even) { background-color: #FAFCFF; }
    .analise-table tbody td { padding: 6px 10px; color: var(--cb-gray-700); vertical-align: middle; }
    .analise-table tbody td.text-right { text-align: right; font-variant-numeric: tabular-nums; font-weight: 600; }
    .analise-table tbody td.text-center { text-align: center; }

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

    /* ==========================================================================
       MEDIA QUERIES DE RESPONSIVIDADE COMPLETA (<768px & .slidestudio-mobile-mode)
       ========================================================================== */
    @media (max-width: 768px) {
      .header-bar {
        height: auto !important;
        min-height: 40px !important;
        padding: 6px 10px !important;
        display: flex !important;
        flex-direction: column !important;
        gap: 3px !important;
        box-sizing: border-box !important;
      }
      .header-left {
        display: flex !important;
        align-items: center !important;
        justify-content: space-between !important;
        width: 100% !important;
        gap: 6px !important;
        flex-wrap: nowrap !important;
      }
      .cb-badge {
        font-size: 9px !important;
        padding: 3px 8px !important;
        letter-spacing: 0.4px !important;
        flex-shrink: 0 !important;
        font-weight: 800 !important;
      }
      .header-tag {
        font-size: 8.5px !important;
        padding: 2px 6px !important;
        white-space: nowrap !important;
        overflow: hidden !important;
        text-overflow: ellipsis !important;
        max-width: 135px !important;
        flex-shrink: 1 !important;
      }
      .header-right {
        font-size: 8.5px !important;
        width: 100% !important;
        border-top: 1px solid rgba(255, 255, 255, 0.2) !important;
        padding-top: 2px !important;
        margin-top: 1px !important;
        white-space: nowrap !important;
        overflow: hidden !important;
        text-overflow: ellipsis !important;
        line-height: 1.2 !important;
        opacity: 0.92 !important;
        text-align: center !important;
      }
      .slide {
        padding: 12px 12px 18px 12px !important;
        overflow-y: auto !important;
        overflow-x: hidden !important;
        -webkit-overflow-scrolling: touch !important;
        height: 100% !important;
        min-height: 100% !important;
        display: flex !important;
        flex-direction: column !important;
        justify-content: flex-start !important;
        box-sizing: border-box !important;
        gap: 10px !important;
      }
      .slide-content {
        height: auto !important;
        min-height: auto !important;
        overflow: visible !important;
        gap: 10px !important;
        display: flex !important;
        flex-direction: column !important;
        justify-content: flex-start !important;
        flex: 1 0 auto !important;
      }
      .slide-cover {
        height: 100% !important;
        min-height: 100% !important;
        padding: 16px 12px 14px 12px !important;
        justify-content: space-between !important;
        display: flex !important;
        flex-direction: column !important;
        align-items: center !important;
        text-align: center !important;
        box-sizing: border-box !important;
        gap: 8px !important;
      }
      .cover-tag {
        font-size: 10px !important;
        padding: 4px 10px !important;
        margin-bottom: 6px !important;
      }
      .cover-title {
        font-size: 1.3rem !important;
        line-height: 1.25 !important;
        margin-bottom: 6px !important;
        font-weight: 800 !important;
      }
      .cover-subtitle {
        font-size: 0.8rem !important;
        line-height: 1.4 !important;
        margin-bottom: 0px !important;
        opacity: 0.88 !important;
      }
      .cover-grid {
        display: grid !important;
        grid-template-columns: repeat(2, 1fr) !important;
        gap: 8px !important;
        margin: 8px 0 !important;
        width: 100% !important;
      }
      .cover-kpi {
        padding: 10px 8px !important;
        border-radius: 8px !important;
        min-height: 64px !important;
      }
      .cover-kpi-label { font-size: 8.5px !important; }
      .cover-kpi-val { font-size: 1.3rem !important; margin: 2px 0 !important; }
      .cover-kpi-sub { font-size: 7.5px !important; }
      .cover-meta-bar {
        display: flex !important;
        flex-wrap: wrap !important;
        align-items: center !important;
        justify-content: center !important;
        gap: 4px !important;
        font-size: 8.5px !important;
        padding: 6px 10px !important;
        margin-top: auto !important;
        width: 100% !important;
      }
      .slide-header {
        margin-bottom: 6px !important;
        padding-bottom: 4px !important;
      }
      .slide-category { font-size: 9px !important; }
      .slide-title { font-size: 13px !important; font-weight: 800 !important; }
      .slide-subtitle { font-size: 9.5px !important; }
      .kpi-row {
        display: grid !important;
        grid-template-columns: repeat(2, 1fr) !important;
        gap: 6px !important;
        margin-bottom: 6px !important;
      }
      .kpi-row-6 {
        display: grid !important;
        grid-template-columns: repeat(3, 1fr) !important;
        gap: 5px !important;
        margin-bottom: 6px !important;
      }
      .kpi-card {
        padding: 6px 8px !important;
        min-height: 54px !important;
      }
      .kpi-label { font-size: 8px !important; }
      .kpi-val { font-size: 1.15rem !important; margin: 2px 0 !important; }
      .kpi-delta, .kpi-sub { font-size: 7.5px !important; }
      .split-view, .split-view-equal {
        display: flex !important;
        flex-direction: column !important;
        gap: 10px !important;
        height: auto !important;
      }
      .chart-card {
        height: auto !important;
        min-height: auto !important;
        padding: 10px !important;
        border-radius: 8px !important;
      }
      .chart-container {
        height: 185px !important;
        min-height: 185px !important;
        max-height: 195px !important;
        width: 100% !important;
        position: relative !important;
      }
      .side-panel {
        height: auto !important;
        min-height: auto !important;
        overflow-y: visible !important;
        padding: 10px !important;
        font-size: 9.5px !important;
      }
      .table-container {
        max-height: 260px !important;
        width: 100% !important;
        overflow-x: auto !important;
        overflow-y: auto !important;
        -webkit-overflow-scrolling: touch !important;
        border-radius: 6px !important;
      }
      .analise-table {
        min-width: 440px !important;
        font-size: 9px !important;
      }
      .analise-table th, .analise-table td { padding: 4px 6px !important; }
      .matrix-grid {
        display: grid !important;
        grid-template-columns: repeat(2, 1fr) !important;
        gap: 6px !important;
        height: auto !important;
      }
      .footer-bar {
        height: 38px !important;
        min-height: 38px !important;
        padding: 4px 10px !important;
        font-size: 8.5px !important;
      }
    }

    /* Virtual Studio Smartphone 390px Override */
    .slidestudio-mobile-mode .header-bar {
      height: auto !important;
      min-height: 40px !important;
      padding: 6px 10px !important;
      display: flex !important;
      flex-direction: column !important;
      gap: 3px !important;
      box-sizing: border-box !important;
    }
    .slidestudio-mobile-mode .header-left {
      display: flex !important;
      align-items: center !important;
      justify-content: space-between !important;
      width: 100% !important;
      gap: 6px !important;
      flex-wrap: nowrap !important;
    }
    .slidestudio-mobile-mode .cb-badge {
      font-size: 9px !important;
      padding: 3px 8px !important;
      letter-spacing: 0.4px !important;
      flex-shrink: 0 !important;
      font-weight: 800 !important;
    }
    .slidestudio-mobile-mode .header-tag {
      font-size: 8.5px !important;
      padding: 2px 6px !important;
      white-space: nowrap !important;
      overflow: hidden !important;
      text-overflow: ellipsis !important;
      max-width: 135px !important;
      flex-shrink: 1 !important;
    }
    .slidestudio-mobile-mode .header-right {
      font-size: 8.5px !important;
      width: 100% !important;
      border-top: 1px solid rgba(255, 255, 255, 0.2) !important;
      padding-top: 2px !important;
      margin-top: 1px !important;
      white-space: nowrap !important;
      overflow: hidden !important;
      text-overflow: ellipsis !important;
      line-height: 1.2 !important;
      opacity: 0.92 !important;
      text-align: center !important;
    }
    .slidestudio-mobile-mode .slide {
      padding: 12px 12px 18px 12px !important;
      overflow-y: auto !important;
      overflow-x: hidden !important;
      -webkit-overflow-scrolling: touch !important;
      height: 100% !important;
      min-height: 100% !important;
      display: flex !important;
      flex-direction: column !important;
      justify-content: flex-start !important;
      box-sizing: border-box !important;
      gap: 10px !important;
    }
    .slidestudio-mobile-mode .slide-content {
      height: auto !important;
      min-height: auto !important;
      overflow: visible !important;
      gap: 10px !important;
      display: flex !important;
      flex-direction: column !important;
      justify-content: flex-start !important;
      flex: 1 0 auto !important;
    }
    .slidestudio-mobile-mode .slide-cover {
      height: 100% !important;
      min-height: 100% !important;
      padding: 16px 12px 14px 12px !important;
      justify-content: space-between !important;
      display: flex !important;
      flex-direction: column !important;
      align-items: center !important;
      text-align: center !important;
      box-sizing: border-box !important;
      gap: 8px !important;
    }
    .slidestudio-mobile-mode .cover-tag { font-size: 10px !important; padding: 4px 10px !important; }
    .slidestudio-mobile-mode .cover-title { font-size: 1.3rem !important; line-height: 1.25 !important; font-weight: 800 !important; }
    .slidestudio-mobile-mode .cover-subtitle { font-size: 0.8rem !important; line-height: 1.4 !important; opacity: 0.88 !important; }
    .slidestudio-mobile-mode .cover-grid { display: grid !important; grid-template-columns: repeat(2, 1fr) !important; gap: 8px !important; }
    .slidestudio-mobile-mode .cover-kpi { padding: 10px 8px !important; min-height: 64px !important; }
    .slidestudio-mobile-mode .cover-kpi-label { font-size: 8.5px !important; }
    .slidestudio-mobile-mode .cover-kpi-val { font-size: 1.3rem !important; margin: 2px 0 !important; }
    .slidestudio-mobile-mode .cover-kpi-sub { font-size: 7.5px !important; }
    .slidestudio-mobile-mode .cover-meta-bar { font-size: 8.5px !important; padding: 6px 10px !important; }
    .slidestudio-mobile-mode .slide-header { margin-bottom: 6px !important; padding-bottom: 4px !important; }
    .slidestudio-mobile-mode .slide-category { font-size: 9px !important; }
    .slidestudio-mobile-mode .slide-title { font-size: 13px !important; font-weight: 800 !important; }
    .slidestudio-mobile-mode .slide-subtitle { font-size: 9.5px !important; }
    .slidestudio-mobile-mode .kpi-row { display: grid !important; grid-template-columns: repeat(2, 1fr) !important; gap: 6px !important; }
    .slidestudio-mobile-mode .kpi-row-6 { display: grid !important; grid-template-columns: repeat(3, 1fr) !important; gap: 5px !important; margin-bottom: 6px !important; }
    .slidestudio-mobile-mode .kpi-card { padding: 6px 8px !important; min-height: 54px !important; }
    .slidestudio-mobile-mode .kpi-label { font-size: 8px !important; }
    .slidestudio-mobile-mode .kpi-val { font-size: 1.15rem !important; margin: 2px 0 !important; }
    .slidestudio-mobile-mode .kpi-delta, .slidestudio-mobile-mode .kpi-sub { font-size: 7.5px !important; }
    .slidestudio-mobile-mode .split-view, .slidestudio-mobile-mode .split-view-equal { display: flex !important; flex-direction: column !important; gap: 10px !important; height: auto !important; }
    .slidestudio-mobile-mode .chart-card { height: auto !important; min-height: auto !important; padding: 10px !important; border-radius: 8px !important; }
    .slidestudio-mobile-mode .chart-container { height: 185px !important; min-height: 185px !important; max-height: 195px !important; width: 100% !important; }
    .slidestudio-mobile-mode .side-panel { height: auto !important; min-height: auto !important; overflow-y: visible !important; padding: 10px !important; font-size: 9.5px !important; }
    .slidestudio-mobile-mode .table-container { max-height: 260px !important; width: 100% !important; overflow-x: auto !important; overflow-y: auto !important; }
    .slidestudio-mobile-mode .analise-table { min-width: 440px !important; font-size: 9px !important; }
    .slidestudio-mobile-mode .analise-table th, .slidestudio-mobile-mode .analise-table td { padding: 4px 6px !important; }
    .slidestudio-mobile-mode .matrix-grid { display: grid !important; grid-template-columns: repeat(2, 1fr) !important; gap: 6px !important; height: auto !important; }
    .slidestudio-mobile-mode .footer-bar { height: 38px !important; min-height: 38px !important; padding: 4px 10px !important; font-size: 8.5px !important; }
  </style>
</head>
<body>
  <header class="header-bar">
    <div class="header-left">
      <span class="cb-badge">CASAS BAHIA</span>
      <span class="header-tag">${topic}</span>
      <span style="font-size: 11px; opacity: 0.85;">Público: ${audience}</span>
    </div>
    <div class="header-right">
      <span>Safra Fechada: <strong>Setembro/2026</strong> | Safra Parcial: <strong>Outubro/2026</strong></span>
    </div>
  </header>

  <main class="deck-container presentation-container">
    <div class="slide-viewport">
      ${slides.join('\n\n')}
    </div>
  </main>

  <footer class="footer-bar">
    <div class="progress-bar" id="progressBar" style="width: 10%;"></div>
    <div class="footer-meta">Casas Bahia • ${topic} • Confidencial</div>
    <div class="footer-controls">
      <span class="slide-counter" id="slide-counter">Slide 1 de ${slideCount}</span>
    </div>
  </footer>
</body>
</html>`;
}

// Enhances raw Gemini HTML to guarantee full Casas Bahia structure, header, footer and responsive CSS
function ensureCasasBahiaCompleteHtml(
  rawHtml: string,
  meta: {
    topic: string;
    objective: string;
    audience: string;
    tone: string;
    palette: { primary: string; primaryNavy: string; accent: string; bg: string; text: string; name: string };
    slideCount: number;
  }
): string {
  // If the rawHtml already has the full document with header-bar and footer-bar, return it
  if (rawHtml.includes('header-bar') && rawHtml.includes('deck-container') && rawHtml.includes('footer-bar') && rawHtml.includes('cb-badge')) {
    return rawHtml;
  }

  // Extract slides from rawHtml
  const slideRegex = /<section[^>]*class=["'][^"']*slide[^"']*["'][^>]*>[\s\S]*?<\/section>/gi;
  const matchedSlides = rawHtml.match(slideRegex);

  if (matchedSlides && matchedSlides.length > 0) {
    return buildCasasBahiaHtmlShell(matchedSlides, meta);
  }

  // If no sections matched, return rawHtml wrapped
  return buildCasasBahiaHtmlShell([rawHtml], meta);
}

// Vite middleware in dev or static files in production
const isProduction = process.env.NODE_ENV === 'production';
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

async function startServer() {
  if (isProduction) {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true, host: '0.0.0.0' },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`SlideStudio Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
