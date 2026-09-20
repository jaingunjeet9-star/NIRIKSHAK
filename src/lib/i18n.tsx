import React, { createContext, useContext, useState, useEffect } from 'react';
import { en } from '../locales/en';
import { hi } from '../locales/hi';

export type Language = 'EN' | 'HI';

interface I18nContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, defaultValue?: string) => string;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY = 'nirikshak_lang_pref';

export const LanguageProvider: React.FC<{ children: React.ReactNode; initialLanguage?: Language }> = ({
  children,
  initialLanguage = 'EN',
}) => {
  const [language, setLanguageState] = useState<Language>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved === 'EN' || saved === 'HI') return saved;
    } catch {
      // Ignore localStorage errors
    }
    return initialLanguage;
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, lang);
    } catch (err) {
      console.warn('[i18n] Failed to persist language choice to localStorage:', err);
    }
  };

  // Helper: Resolve nested object path like "workspace.heroTitle"
  const resolveKey = (obj: any, path: string): string | undefined => {
    const parts = path.split('.');
    let current = obj;
    for (const part of parts) {
      if (current && typeof current === 'object' && part in current) {
        current = current[part];
      } else {
        return undefined;
      }
    }
    return typeof current === 'string' ? current : undefined;
  };

  const t = (key: string, defaultValue?: string): string => {
    const dict = language === 'HI' ? hi : en;
    const resolved = resolveKey(dict, key);
    if (resolved !== undefined) {
      return resolved;
    }

    if (language === 'HI') {
      console.warn(`[i18n MISSING HINDI KEY]: "${key}" is not translated in hi.ts`);
      // Fail loudly in dev/test for missing Hindi keys instead of silently showing English
      return defaultValue ? `[HI: ${defaultValue}]` : `[HI_MISSING: ${key}]`;
    }

    return defaultValue || key;
  };

  return (
    <I18nContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </I18nContext.Provider>
  );
};

export const useTranslation = () => {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useTranslation must be used within a LanguageProvider');
  }
  return context;
};
