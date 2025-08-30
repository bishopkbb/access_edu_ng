import React, { useState, useCallback, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../context/TranslationContext';
import { upsertUserProfile } from '../services/profileService';
import { Globe, ChevronDown } from 'lucide-react';

const LanguageSelector = ({ className = "" }) => {
  const { user } = useAuth();
  const { currentLanguage, changeLanguage, getCurrentLanguageName } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const languages = useMemo(() => [
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'yo', name: 'Yoruba', flag: '🇳🇬' },
    { code: 'ha', name: 'Hausa', flag: '🇳🇬' },
    { code: 'ig', name: 'Igbo', flag: '🇳🇬' }
  ], []);

  const handleLanguageChange = useCallback(async (languageCode) => {
    try {
      setIsLoading(true);
      
      // Update user profile in Firestore if logged in (fire and forget)
      if (user && !user.isAnonymous) {
        upsertUserProfile(user.uid, {
          preferredLanguage: getCurrentLanguageName()
        }).catch(console.error);
      }
      
      // Change language using context
      changeLanguage(languageCode);
      
      // Close dropdown
      setIsOpen(false);
      
    } catch (error) {
      console.error('Error updating language:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user, getCurrentLanguageName, changeLanguage]);

  const currentLang = useMemo(() => 
    languages.find(lang => lang.code === currentLanguage), 
    [languages, currentLanguage]
  );

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isLoading}
        className="flex items-center space-x-2 px-3 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors min-w-[120px]"
      >
        <Globe className="w-4 h-4 text-gray-600" />
        <span className="text-sm font-medium text-gray-700">
          {currentLang?.flag} {currentLang?.name}
        </span>
        <ChevronDown className={`w-4 h-4 text-gray-600 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-300 rounded-lg shadow-lg z-50">
          <div className="py-1">
            {languages.map((language) => (
              <button
                key={language.code}
                onClick={() => handleLanguageChange(language.code)}
                disabled={isLoading}
                className={`w-full flex items-center space-x-3 px-4 py-2 text-left hover:bg-gray-100 transition-colors ${
                  currentLanguage === language.code 
                    ? 'bg-red-50 text-red-700' 
                    : 'text-gray-700'
                } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <span className="text-lg">{language.flag}</span>
                <span className="text-sm font-medium">{language.name}</span>
                {currentLanguage === language.code && (
                  <div className="ml-auto w-2 h-2 bg-red-500 rounded-full"></div>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center rounded-lg">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-500"></div>
        </div>
      )}
    </div>
  );
};

export default LanguageSelector;
