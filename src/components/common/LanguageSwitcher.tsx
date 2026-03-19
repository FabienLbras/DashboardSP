import { useLanguage, Lang } from "../../context/LanguageContext";

const flags: Record<Lang, string> = {
  fr: "🇫🇷",
  en: "🇬🇧",
};

const labels: Record<Lang, string> = {
  fr: "FR",
  en: "EN",
};

export default function LanguageSwitcher() {
  const { lang, setLang } = useLanguage();
  const next: Lang = lang === "fr" ? "en" : "fr";

  return (
    <button
      onClick={() => setLang(next)}
      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-sm font-medium border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
      title={lang === "fr" ? "Switch to English" : "Passer en français"}
    >
      <span>{flags[lang]}</span>
      <span>{labels[lang]}</span>
    </button>
  );
}
