// src/services/translateService.js
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebaseConfig";
import yorubaTranslations from './translations/yoruba';
import hausaTranslations from './translations/hausa';
import igboTranslations from './translations/igbo';

// Language mapping
export const LANGUAGE_CODES = {
  'English': 'en',
  'Yoruba': 'yo', 
  'Hausa': 'ha',
  'Igbo': 'ig'
};

export const LANGUAGE_NAMES = {
  'en': 'English',
  'yo': 'Yoruba',
  'ha': 'Hausa', 
  'ig': 'Igbo'
};

// Cache for translations
const translationCache = new Map();

// Get cached translation
const getCachedTranslation = (text, targetLang) => {
  const cacheKey = `${text}_${targetLang}`;
  return translationCache.get(cacheKey);
};

// Set cached translation
const setCachedTranslation = (text, targetLang, translation) => {
  const cacheKey = `${text}_${targetLang}`;
  translationCache.set(cacheKey, translation);
};

// Get translation from Firestore cache
export const getTranslationFromCache = async (text, targetLang) => {
  try {
    const cacheRef = doc(db, "translations", `${text}_${targetLang}`);
    const cacheDoc = await getDoc(cacheRef);
    
    if (cacheDoc.exists()) {
      const data = cacheDoc.data();
      // Check if cache is not expired (7 days)
      const cacheAge = Date.now() - data.timestamp.toMillis();
      if (cacheAge < 7 * 24 * 60 * 60 * 1000) {
        return data.translation;
      }
    }
    return null;
  } catch (error) {
    console.error("Error getting translation from cache:", error);
    return null;
  }
};

// Save translation to Firestore cache
export const saveTranslationToCache = async (text, targetLang, translation) => {
  try {
    const cacheRef = doc(db, "translations", `${text}_${targetLang}`);
    await setDoc(cacheRef, {
      originalText: text,
      targetLang,
      translation,
      timestamp: serverTimestamp()
    });
  } catch (error) {
    console.error("Error saving translation to cache:", error);
  }
};

// Simple translation function
export function translateText(text, targetLang) {
  // Don't translate if target is English or text is empty
  if (targetLang === 'en' || !text || text.trim() === '') {
    return text;
  }

  // Check memory cache first
  const cachedTranslation = getCachedTranslation(text, targetLang);
  if (cachedTranslation) {
    return cachedTranslation;
  }

  // Get translations based on target language
  const translations = {
    'yo': yorubaTranslations,
    'ha': hausaTranslations,
    'ig': igboTranslations
  }[targetLang] || {};

  // Check if we have a translation
  if (translations[text]) {
    const translation = translations[text];
    setCachedTranslation(text, targetLang, translation);
    return translation;
  }

  // If no translation found, return original text
  return text;
}

// Batch translate multiple texts - now synchronous
export function translateBatch(texts, targetLang) {
  return texts.map(text => translateText(text, targetLang));
}

// Translate object with text properties - now synchronous
export function translateObject(obj, targetLang, textKeys) {
  const translatedObj = { ...obj };
  for (const key of textKeys) {
    if (obj[key]) {
      translatedObj[key] = translateText(obj[key], targetLang);
    }
  }
  return translatedObj;
}

// Get user's preferred language
export const getUserLanguage = () => {
  // Check localStorage first
  const storedLang = localStorage.getItem('userLanguage');
  if (storedLang && LANGUAGE_CODES[storedLang]) {
    return LANGUAGE_CODES[storedLang];
  }
  
  // Check browser language
  const browserLang = navigator.language.split('-')[0];
  if (browserLang === 'yo' || browserLang === 'ha' || browserLang === 'ig') {
    return browserLang;
  }
  
  // Default to English
  return 'en';
};

// Set user's preferred language
export const setUserLanguage = (language) => {
  const langName = LANGUAGE_NAMES[language] || 'English';
  localStorage.setItem('userLanguage', langName);
  
  // Update user profile in Firestore if user is logged in
  // This will be handled by the language selector component
};

// Clear translation cache
export const clearTranslationCache = () => {
  translationCache.clear();
};

// Debounce function for performance
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

// Preload common translations
export const preloadCommonTranslations = (targetLang) => {
  if (targetLang === 'en') return;
  
  const commonTexts = [
    'Home', 'Scholarships', 'TVET', 'Community Forum', 'Quizzes', 'Settings',
    'Dashboard', 'Profile', 'Notifications', 'Logout', 'Save', 'Cancel',
    'Loading...', 'Error', 'Success', 'Welcome', 'Search', 'Filter'
  ];
  
  // Preload translations in background
  commonTexts.forEach(text => {
    translateText(text, targetLang);
  });
};