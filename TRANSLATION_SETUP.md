# Translation Setup Guide

## Microsoft Translator Text API Setup

### 1. Get Microsoft Translator API Key

1. Go to [Azure Portal](https://portal.azure.com/)
2. Create a new "Translator" resource
3. Choose the free tier (F0) for development
4. Note down your:
   - API Key
   - Region (e.g., eastus, westeurope)
   - Endpoint URL

### 2. Environment Variables

Add these to your `.env` file:

```env
# Microsoft Translator Text API Configuration
VITE_TRANSLATOR_KEY=your_microsoft_translator_api_key
VITE_TRANSLATOR_ENDPOINT=https://api.cognitive.microsofttranslator.com
VITE_TRANSLATOR_REGION=your_azure_region
```

### 3. Supported Languages

The system supports:
- **English** (en) - Default
- **Yoruba** (yo) - Nigerian language
- **Hausa** (ha) - Nigerian language  
- **Igbo** (ig) - Nigerian language

### 4. Features

- **Automatic Translation**: Text is translated on-demand using Microsoft Translator API
- **Caching**: Translations are cached in memory and Firestore to reduce API calls
- **Fallback**: If translation fails, original English text is shown
- **User Preferences**: Language choice is saved to user profile and localStorage
- **Performance**: Batch translation support for multiple texts

### 5. Usage

```javascript
import { useTranslation } from '../context/TranslationContext';

const MyComponent = () => {
  const { t, currentLanguage, changeLanguage } = useTranslation();
  
  // Translate text
  const translatedText = await t("Hello World");
  
  // Change language
  changeLanguage('yo'); // Switch to Yoruba
};
```

### 6. API Limits

- **Free Tier**: 2 million characters per month
- **Caching**: Reduces API calls by storing translations
- **Fallback**: Graceful degradation when limits are exceeded

### 7. Testing

1. Set up your API credentials
2. Change language using the language selector
3. Verify translations appear correctly
4. Check browser console for any API errors
