import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getLocales } from 'expo-localization';
import { supportedLanguages, defaultLanguage, getTranslation } from '../i18n';

const LanguageContext = createContext();

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
};

const LANGUAGE_STORAGE_KEY = '@tipi_language';

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState(defaultLanguage);
  const [loading, setLoading] = useState(true);

  // Load saved language preference
  useEffect(() => {
    const loadLanguage = async () => {
      try {
        const savedLanguage = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
        
        if (savedLanguage && supportedLanguages.includes(savedLanguage)) {
          setLanguage(savedLanguage);
        } else {
          // Try to detect device language
          try {
            const locales = getLocales();
            const deviceLanguage = locales?.[0]?.languageCode || defaultLanguage;
            if (supportedLanguages.includes(deviceLanguage)) {
              setLanguage(deviceLanguage);
            } else {
              setLanguage(defaultLanguage);
            }
          } catch (error) {
            console.error('Error detecting device language:', error);
            setLanguage(defaultLanguage);
          }
        }
      } catch (error) {
        console.error('Error loading language preference:', error);
        setLanguage(defaultLanguage);
      } finally {
        setLoading(false);
      }
    };

    loadLanguage();
  }, []);

  // Save language preference
  const changeLanguage = async (newLanguage) => {
    if (!supportedLanguages.includes(newLanguage)) {
      console.warn(`Language ${newLanguage} is not supported`);
      return;
    }

    try {
      await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, newLanguage);
      setLanguage(newLanguage);
    } catch (error) {
      console.error('Error saving language preference:', error);
    }
  };

  // Translation function
  const t = (key, params = {}) => {
    return getTranslation(key, language, params);
  };

  const value = {
    language,
    changeLanguage,
    t,
    loading,
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

