import { vi } from './vi';
import { en } from './en';
import { ja } from './ja';
import { LanguageCode } from '../types';

export const translations = {
  vi,
  en,
  ja
};

export function getTranslation(lang: LanguageCode, key: keyof typeof vi, params?: Record<string, string | number>): string {
  const dict = translations[lang] || translations.vi;
  let text = dict[key] || translations.vi[key] || key;
  
  if (params) {
    Object.entries(params).forEach(([pKey, pVal]) => {
      text = text.replace(new RegExp(`\\{${pKey}\\}`, 'g'), String(pVal));
    });
  }
  return text;
}
