'use client';

import React from 'react';
import { useLanguage, Locale } from '../context/LanguageContext';

export const LanguageSelector: React.FC = () => {
  const { locale, setLocale } = useLanguage();

  const handleSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setLocale(e.target.value as Locale);
  };

  return (
    <div className="relative inline-block text-left">
      <select
        value={locale}
        onChange={handleSelect}
        className="appearance-none bg-transparent text-gray-400 hover:text-white font-medium text-sm border border-white/10 hover:border-white/20 rounded px-3 py-1.5 pr-8 focus:outline-none transition-colors cursor-pointer"
        style={{ minWidth: '90px' }}
      >
        <option value="en">🇺🇸 EN</option>
        <option value="es">🇪🇸 ES</option>
        <option value="pt-BR">🇧🇷 PT</option>
      </select>
      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-400">
        <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
          <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
        </svg>
      </div>
    </div>
  );
};
