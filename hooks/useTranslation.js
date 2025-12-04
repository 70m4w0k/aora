import { useLanguage } from '../context/LanguageProvider';

/**
 * Hook to access translations
 * Usage: const t = useTranslation(); t('auth.signIn.title')
 */
export const useTranslation = () => {
  const { t } = useLanguage();
  return t;
};

export default useTranslation;

