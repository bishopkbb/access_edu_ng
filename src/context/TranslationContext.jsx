import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  getUserLanguage, 
  setUserLanguage,
  LANGUAGE_CODES,
  LANGUAGE_NAMES,
  translateText
} from '../services/translateService';

const TranslationContext = createContext();

export const useTranslation = () => {
  const context = useContext(TranslationContext);
  if (!context) {
    throw new Error('useTranslation must be used within a TranslationProvider');
  }
  return context;
};

export const TranslationProvider = ({ children }) => {
  const [currentLanguage, setCurrentLanguage] = useState('en');

  // Initialize language on mount
  useEffect(() => {
    const userLang = getUserLanguage();
    setCurrentLanguage(userLang);
  }, []);

  // Translation function with caching
  const t = React.useCallback((text, fallback = text) => {
    if (!text) return fallback;
    
    // Use the translation service
    return translateText(text, currentLanguage);
  }, [currentLanguage]);

  // Change language - simplified
  const changeLanguage = React.useCallback(async (languageCode) => {
    if (languageCode === currentLanguage) return;
    
    setCurrentLanguage(languageCode);
    setUserLanguage(languageCode);
    
    // Trigger page refresh to apply new language
    window.location.reload();
  }, [currentLanguage]);

  // Get current language name
  const getCurrentLanguageName = React.useCallback(() => {
    return LANGUAGE_NAMES[currentLanguage] || 'English';
  }, [currentLanguage]);

  // Get supported languages
  const getSupportedLanguages = React.useCallback(() => {
    return Object.entries(LANGUAGE_CODES).map(([name, code]) => ({
      name,
      code,
      isCurrent: code === currentLanguage
    }));
  }, [currentLanguage]);

  const value = React.useMemo(() => ({
    currentLanguage,
    changeLanguage,
    t,
    isLoading: false, // Always false for now
    getCurrentLanguageName,
    getSupportedLanguages
  }), [currentLanguage, changeLanguage, t, getCurrentLanguageName, getSupportedLanguages]);

  return (
    <TranslationContext.Provider value={value}>
      {children}
    </TranslationContext.Provider>
  );
};
