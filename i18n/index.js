import enTranslations from './en.json';
import frTranslations from './fr.json';

export const translations = {
  en: enTranslations,
  fr: frTranslations,
};

export const supportedLanguages = ['en', 'fr'];

export const defaultLanguage = 'en';

/**
 * Get translation for a key
 * Supports nested keys like 'auth.signIn.title'
 * Supports parameters like 'shopping.deleteConfirm' with { name: 'Item' }
 */
export const getTranslation = (key, language = 'en', params = {}) => {
  const lang = translations[language] || translations[defaultLanguage];
  const keys = key.split('.');
  
  let value = lang;
  for (const k of keys) {
    if (value && typeof value === 'object' && k in value) {
      value = value[k];
    } else {
      // Fallback to English if translation not found
      const enLang = translations[defaultLanguage];
      let enValue = enLang;
      for (const enK of keys) {
        if (enValue && typeof enValue === 'object' && enK in enValue) {
          enValue = enValue[enK];
        } else {
          return key; // Return key if not found in English either
        }
      }
      value = enValue;
      break;
    }
  }
  
  let result = value || key;
  
  // Replace parameters like {{name}} with actual values
  if (typeof result === 'string' && Object.keys(params).length > 0) {
    Object.keys(params).forEach((paramKey) => {
      const regex = new RegExp(`\\{\\{${paramKey}\\}\\}`, 'g');
      result = result.replace(regex, params[paramKey]);
    });
  }
  
  return result;
};

/**
 * Get device language
 */
export const getDeviceLanguage = () => {
  // This will be handled by React Native's Localization API
  // For now, return default
  return defaultLanguage;
};

