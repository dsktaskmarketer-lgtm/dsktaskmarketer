import React, { createContext, useContext } from 'react';
import { en } from './en';

export type Language = 'en';

interface LanguageContextType {
  t: (key: string, defaultText?: string) => string;
  language: string;
  setLanguage: (lang: string) => void;
}

const defaultT = (key: string, defaultText?: string): string => {
  if (en && (en as Record<string, string>)[key]) {
    return (en as Record<string, string>)[key];
  }
  return defaultText || key;
};

const LanguageContext = createContext<LanguageContextType>({
  t: defaultT,
  language: 'en',
  setLanguage: () => {}
});

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const t = (key: string, defaultText?: string): string => {
    if (en && (en as Record<string, string>)[key]) {
      return (en as Record<string, string>)[key];
    }
    return defaultText || key;
  };

  return (
    <LanguageContext.Provider value={{ t, language: 'en', setLanguage: () => {} }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useTranslation = () => useContext(LanguageContext);

