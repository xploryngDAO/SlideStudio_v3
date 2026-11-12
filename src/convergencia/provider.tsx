import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

export type ThemeMode = 'light' | 'dark';

const ThemeContext = createContext<ThemeMode>('light');
const ThemeActionContext = createContext<{
  theme: ThemeMode;
  setTheme: (t: ThemeMode) => void;
  toggleTheme: () => void;
}>({
  theme: 'light',
  setTheme: () => {},
  toggleTheme: () => {},
});

export const useTheme = () => useContext(ThemeContext);
export const useThemeActions = () => useContext(ThemeActionContext);

/** Wrap your product once. Portals retain the same theme without mutating document globals. */
export function DesignSystemProvider({
  children,
  theme: controlledTheme,
  className = '',
}: {
  children: ReactNode;
  theme?: ThemeMode;
  className?: string;
}) {
  const [internalTheme, setInternalTheme] = useState<ThemeMode>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('convergencia_theme');
      if (stored === 'dark' || stored === 'light') return stored;
    }
    return 'light';
  });

  const activeTheme = controlledTheme ?? internalTheme;

  const setTheme = (t: ThemeMode) => {
    setInternalTheme(t);
    if (typeof window !== 'undefined') {
      localStorage.setItem('convergencia_theme', t);
    }
  };

  const toggleTheme = () => {
    setTheme(activeTheme === 'light' ? 'dark' : 'light');
  };

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', activeTheme);
    }
  }, [activeTheme]);

  return (
    <ThemeActionContext.Provider value={{ theme: activeTheme, setTheme, toggleTheme }}>
      <ThemeContext.Provider value={activeTheme}>
        <div className={`cv-root min-h-screen ${className}`} data-theme={activeTheme}>
          {children}
        </div>
      </ThemeContext.Provider>
    </ThemeActionContext.Provider>
  );
}

