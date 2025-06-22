import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { translations } from '../data/translations';

const LanguageContext = createContext();

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
};

export const LanguageProvider = ({ children }) => {
  const [currentLang, setCurrentLang] = useState('en');

  const t = useCallback((key, replacements = {}) => {
    let text = translations[currentLang]?.[key] || translations['en']?.[key] || key;
    Object.keys(replacements).forEach(placeholder => {
      text = text.replace(`{${placeholder}}`, replacements[placeholder]);
    });
    return text;
  }, [currentLang]);

  const value = useMemo(() => ({
    t,
    currentLang,
    setCurrentLang,
  }), [t, currentLang, setCurrentLang]);

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};