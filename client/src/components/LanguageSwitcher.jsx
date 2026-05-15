import React from 'react';
import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';

const LanguageSwitcher = () => {
  const { i18n } = useTranslation();

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
  };

  const currentLanguage = i18n.language || 'fr';

  return (
    <div className="px-3 mb-6">
      <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-orange-50/50 border border-orange-100/50">
        <Globe size={16} className="text-orange-500" />
        <div className="flex items-center gap-1">
          <button
            onClick={() => changeLanguage('fr')}
            className={`text-xs font-semibold px-2 py-1 rounded-md transition-all duration-200 ${currentLanguage.startsWith('fr')
                ? 'bg-orange-500 text-white shadow-sm'
                : 'text-slate-500 hover:bg-orange-100/50 hover:text-orange-600'
              }`}
          >
            FR
          </button>
          <button
            onClick={() => changeLanguage('en')}
            className={`text-xs font-semibold px-2 py-1 rounded-md transition-all duration-200 ${currentLanguage.startsWith('en')
                ? 'bg-orange-500 text-white shadow-sm'
                : 'text-slate-500 hover:bg-orange-100/50 hover:text-orange-600'
              }`}
          >
            EN
          </button>
        </div>
      </div>
    </div>
  );
};

export default LanguageSwitcher;
