import { useLanguage } from '../../i18n/LanguageContext';

export function LanguageSwitch() {
  const { language, setLanguage } = useLanguage();

  return (
    <button
      onClick={() => setLanguage(language === 'de' ? 'en' : 'de')}
      className="flex items-center gap-1.5 px-2 py-1 rounded-md text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors"
      title={language === 'de' ? 'Switch to English' : 'Auf Deutsch wechseln'}
    >
      <span className={`fi fi-${language === 'de' ? 'de' : 'gb'} text-base`}></span>
      <span className="hidden sm:inline">{language === 'de' ? 'DE' : 'EN'}</span>
      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
      </svg>
    </button>
  );
}
