import React, { createContext, useState, useEffect, useMemo, ReactNode } from 'react';
import { ThemeProvider, PaletteMode } from '@mui/material';
import { getTheme } from '../theme';
import { useTranslation } from 'react-i18next';

interface AppContextType {
  themeMode: PaletteMode;
  toggleTheme: () => void;
  language: string;
  changeLanguage: (lng: string) => void;
}

export const AppContext = createContext<AppContextType>({
  themeMode: 'light',
  toggleTheme: () => { },
  language: 'pt',
  changeLanguage: () => { },
});

interface AppProviderProps {
  children: ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  const [themeMode, setThemeMode] = useState<PaletteMode>(
    (localStorage.getItem('themeMode') as PaletteMode) || 'light'
  );

  const { i18n } = useTranslation();

  const toggleTheme = () => {
    const newMode = themeMode === 'light' ? 'dark' : 'light';
    setThemeMode(newMode);
    localStorage.setItem('themeMode', newMode);
  };

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
    localStorage.setItem('language', lng);
  };

  useEffect(() => {
    // Inicializar com o tema salvo no localStorage
    const savedTheme = localStorage.getItem('themeMode') as PaletteMode;
    if (savedTheme) {
      setThemeMode(savedTheme);
    }

    // Inicializar com o idioma salvo no localStorage
    const savedLanguage = localStorage.getItem('language');
    if (savedLanguage) {
      i18n.changeLanguage(savedLanguage);
    }
  }, [i18n]);

  const theme = useMemo(() => getTheme(themeMode), [themeMode]);

  const contextValue = useMemo(
    () => ({
      themeMode,
      toggleTheme,
      language: i18n.language,
      changeLanguage,
    }),
    [themeMode, i18n.language]
  );

  return (
    <AppContext.Provider value={contextValue}>
      <ThemeProvider theme={theme}>
        {children}
      </ThemeProvider>
    </AppContext.Provider>
  );
};