import React, { useRef, useState } from 'react';
import {
  Button,
  IconButton,
  Badge,
  Card,
  Icon,
  Text,
  Heading,
  useTheme,
  useThemeActions,
} from '../convergencia';

interface WelcomeScreenProps {
  onUploadHtml: (file: File) => void;
  onStartCreatePresentation: () => void;
  onLoadSample: (sampleKey: string) => void;
  onStartBlank: () => void;
  onOpenStudio?: () => void;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({
  onUploadHtml,
  onStartCreatePresentation,
  onLoadSample,
  onStartBlank,
  onOpenStudio,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const theme = useTheme();
  const { toggleTheme } = useThemeActions();

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      const name = file.name.toLowerCase();
      if (name.endsWith('.html') || name.endsWith('.htm') || name.endsWith('.pptx')) {
        onUploadHtml(file);
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onUploadHtml(e.target.files[0]);
    }
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className="cv-root min-h-screen flex flex-col justify-between bg-[var(--cv-color-background)] text-[var(--cv-color-text)] transition-colors p-4 sm:p-8 cv-bg-grid relative overflow-x-hidden"
    >
      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".html,.htm,.pptx"
        className="hidden"
        onChange={handleFileSelect}
      />

      {/* Drag & Drop Overlay */}
      {isDragging && (
        <div className="absolute inset-0 z-50 bg-[var(--cv-color-accent)]/15 backdrop-blur-sm border-4 border-dashed border-[var(--cv-color-accent)] flex flex-col items-center justify-center pointer-events-none transition-all animate-in fade-in">
          <div className="w-16 h-16 rounded-2xl bg-[var(--cv-color-surface)] text-[var(--cv-color-accent)] flex items-center justify-center shadow-xl mb-4">
            <Icon name="upload" size={32} />
          </div>
          <Heading level={2} className="text-xl sm:text-2xl font-bold text-[var(--cv-color-text)]">
            Solte o arquivo PowerPoint (.pptx) ou HTML aqui
          </Heading>
          <Text muted className="text-sm mt-1">
            O SlideStudio converterá sua apresentação automaticamente
          </Text>
        </div>
      )}

      {/* =========================================================================
          TOP HEADER
      ========================================================================= */}
      <header className="w-full max-w-5xl mx-auto flex items-center justify-between py-2 relative z-10">
        <div className="flex items-center gap-3">
          <span className="w-9 h-9 rounded-xl bg-[var(--cv-color-accent-soft)] text-[var(--cv-color-accent-text)] flex items-center justify-center font-bold shadow-sm">
            <Icon name="layers" size={20} />
          </span>
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-base tracking-tight text-[var(--cv-color-text)]">
              SlideStudio
            </span>
            <Badge tone="accent">HTML</Badge>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <IconButton
            variant="ghost"
            icon="sun"
            label={theme === 'dark' ? 'Mudar para Tema Claro' : 'Mudar para Tema Escuro'}
            onClick={toggleTheme}
          />
        </div>
      </header>

      {/* =========================================================================
          CENTRAL LAUNCHPAD (Focused only on the 3 core actions)
      ========================================================================= */}
      <main className="w-full max-w-4xl mx-auto my-auto py-8 sm:py-12 relative z-10">
        {/* Title & Editorial Subtext */}
        <div className="text-center mb-10 sm:mb-14">
          <div className="inline-flex items-center gap-2 bg-[var(--cv-color-surface)] border border-[var(--cv-color-border)] px-3.5 py-1 rounded-full text-xs font-semibold text-[var(--cv-color-text-muted)] mb-4 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-[var(--cv-color-success)]" />
            <span className="cv-block-kicker text-[10px] m-0">Convergência Design System</span>
          </div>

          <Heading level={1} className="text-3xl sm:text-5xl font-extrabold tracking-tight text-[var(--cv-color-text)] mb-3 [text-wrap:balance]">
            Editor Visual de Slides Executivos
          </Heading>
          <Text muted className="text-sm sm:text-base max-w-lg mx-auto leading-relaxed [text-wrap:balance]">
            Apresentações em HTML vivo com suporte nativo a gráficos Chart.js, visualização dupla 16:9 e mobile 390px, e exportação vetorial para PowerPoint.
          </Text>
        </div>

        {/* 3 Main Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-10">
          {/* Action 1: Acessar o SlideStudio */}
          <Card
            onClick={onOpenStudio || onStartBlank}
            className="p-6 flex flex-col justify-between hover:border-[var(--cv-color-accent)] hover:shadow-xl transition-all cursor-pointer group bg-[var(--cv-color-surface)] border-[var(--cv-color-border)]"
          >
            <div>
              <div className="w-12 h-12 rounded-xl bg-[var(--cv-color-accent-soft)] text-[var(--cv-color-accent-text)] flex items-center justify-center mb-5 group-hover:scale-105 transition-transform">
                <Icon name="presentation" size={24} />
              </div>
              <Heading level={3} className="text-lg font-bold text-[var(--cv-color-text)] mb-2 group-hover:text-[var(--cv-color-accent-text)] transition-colors">
                Acessar o SlideStudio
              </Heading>
              <Text muted className="text-xs leading-relaxed mb-6">
                Abra diretamente o editor visual com tela interativa, navegação de lâminas e inspetor de formatação.
              </Text>
            </div>
            <Button
              variant="primary"
              icon="arrow"
              className="w-full justify-center"
              onClick={(e) => {
                e.stopPropagation();
                if (onOpenStudio) onOpenStudio();
                else onStartBlank();
              }}
            >
              Acessar o SlideStudio
            </Button>
          </Card>

          {/* Action 2: Criar com Agentes IA */}
          <Card
            onClick={onStartCreatePresentation}
            className="p-6 flex flex-col justify-between hover:border-[var(--cv-color-accent)] hover:shadow-xl transition-all cursor-pointer group bg-[var(--cv-color-surface)] border-[var(--cv-color-border)]"
          >
            <div>
              <div className="w-12 h-12 rounded-xl bg-[var(--cv-color-warning-soft)] text-[var(--cv-color-warning)] flex items-center justify-center mb-5 group-hover:scale-105 transition-transform">
                <Icon name="spark" size={24} />
              </div>
              <Heading level={3} className="text-lg font-bold text-[var(--cv-color-text)] mb-2 group-hover:text-[var(--cv-color-accent-text)] transition-colors">
                Criar com Agentes IA
              </Heading>
              <Text muted className="text-xs leading-relaxed mb-6">
                Assistente inteligente guiado para sintetizar relatórios, gerar narrativas executivas e construir gráficos automaticamente.
              </Text>
            </div>
            <Button
              variant="secondary"
              icon="spark"
              className="w-full justify-center"
              onClick={(e) => {
                e.stopPropagation();
                onStartCreatePresentation();
              }}
            >
              Criar com Agentes IA
            </Button>
          </Card>

          {/* Action 3: Subir PPTX ou HTML */}
          <Card
            onClick={() => fileInputRef.current?.click()}
            className="p-6 flex flex-col justify-between hover:border-[var(--cv-color-accent)] hover:shadow-xl transition-all cursor-pointer group bg-[var(--cv-color-surface)] border-[var(--cv-color-border)]"
          >
            <div>
              <div className="w-12 h-12 rounded-xl bg-[var(--cv-color-success-soft)] text-[var(--cv-color-success)] flex items-center justify-center mb-5 group-hover:scale-105 transition-transform">
                <Icon name="upload" size={24} />
              </div>
              <Heading level={3} className="text-lg font-bold text-[var(--cv-color-text)] mb-2 group-hover:text-[var(--cv-color-accent-text)] transition-colors">
                Subir PPTX ou HTML
              </Heading>
              <Text muted className="text-xs leading-relaxed mb-6">
                Importe um arquivo existente de PowerPoint (.pptx) ou código HTML para editar sem perder estrutura ou textos.
              </Text>
            </div>
            <Button
              variant="secondary"
              icon="upload"
              className="w-full justify-center"
              onClick={(e) => {
                e.stopPropagation();
                fileInputRef.current?.click();
              }}
            >
              Subir PPTX ou HTML
            </Button>
          </Card>
        </div>

        {/* Quick Sample Link */}
        <div className="text-center text-xs text-[var(--cv-color-text-muted)]">
          <span>Deseja testar com dados prontos? </span>
          <button
            onClick={() => onLoadSample('casas_bahia')}
            className="text-[var(--cv-color-accent-text)] font-semibold hover:underline cursor-pointer"
          >
            Carregar modelo Casas Bahia Regional 120
          </button>
        </div>
      </main>

      {/* =========================================================================
          FOOTER
      ========================================================================= */}
      <footer className="w-full max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 py-3 border-t border-[var(--cv-color-border)] text-xs text-[var(--cv-color-text-muted)] relative z-10">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-[var(--cv-color-text)]">SlideStudio HTML</span>
          <span className="text-[var(--cv-color-border-strong)]">·</span>
          <span>Convergência Design System</span>
        </div>

        <div className="flex items-center gap-4 text-[11px] font-mono text-[var(--cv-color-text-subtle)]">
          <span>100% Compatível com PowerPoint (.pptx)</span>
          <span className="text-[var(--cv-color-border-strong)]">·</span>
          <span>Dual-Screen (16:9 + 390px)</span>
        </div>
      </footer>
    </div>
  );
};
