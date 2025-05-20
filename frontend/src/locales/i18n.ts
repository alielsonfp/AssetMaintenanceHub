import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Importar arquivos de tradução
import translationPT from './pt/translation.json';
import translationEN from './en/translation.json';
import translationES from './es/translation.json';

// Recursos de linguagem
const resources = {
  pt: {
    translation: translationPT
  },
  en: {
    translation: translationEN
  },
  es: {
    translation: translationES
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: localStorage.getItem('language') || 'pt', // Idioma padrão
    fallbackLng: 'pt',
    interpolation: {
      escapeValue: false // React já faz escape
    }
  });

export default i18n;