// src/components/Nav.tsx
import React, { useState } from 'react';
import { Globe, DollarSign, Menu, X, Download, Plus, GitBranch, BarChart3, HelpCircle, Layers, Info, Shield, FileText } from 'lucide-react';
import { SupportedLang, SupportedCurrency, CURRENCIES, translations } from '../i18n';

interface NavProps {
  currentView: string;
  onNavigate: (view: string) => void;
  lang: SupportedLang;
  onLangChange: (lang: SupportedLang) => void;
  currency: SupportedCurrency;
  onCurrencyChange: (curr: SupportedCurrency) => void;
  onNewSimulation: () => void;
  onDownloadSource?: () => void;
}

export const Nav: React.FC<NavProps> = ({
  currentView,
  onNavigate,
  lang,
  onLangChange,
  currency,
  onCurrencyChange,
  onNewSimulation,
  onDownloadSource
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const t = translations[lang];

  const handleNav = (v: string) => {
    onNavigate(v);
    setMobileMenuOpen(false);
  };

  return (
    <header className="fixed top-0 left-0 w-full h-16 border-b border-slate-800 bg-slate-950/85 backdrop-blur-xl z-50 transition-colors">
      <div className="max-w-7xl mx-auto h-full px-4 sm:px-6 flex items-center justify-between">
        {/* Brand / Logo */}
        <div className="flex items-center gap-6">
          <button
            id="nav-logo-btn"
            onClick={() => handleNav('home')}
            className="flex items-center gap-2.5 text-left group focus:outline-none"
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-600 to-sky-500 flex items-center justify-center font-black text-white text-base shadow-sm">
              ?
            </div>
            <div>
              <span className="font-extrabold text-white text-lg tracking-tight group-hover:text-indigo-400 transition-colors">
                {t.app_name}
              </span>
              <span className="hidden sm:block text-[9px] uppercase tracking-widest text-slate-400 font-semibold">
                {t.tagline}
              </span>
            </div>
          </button>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-5 text-xs font-semibold uppercase tracking-wider text-slate-400">
            <button
              id="nav-link-simulator"
              onClick={() => handleNav('simulator')}
              className={`hover:text-white transition-colors ${currentView === 'simulator' ? 'text-indigo-400' : ''}`}
            >
              {t.nav.simulator}
            </button>
            <button
              id="nav-link-compare"
              onClick={() => handleNav('compare')}
              className={`hover:text-white transition-colors ${currentView === 'compare' ? 'text-indigo-400' : ''}`}
            >
              {t.nav.compare}
            </button>
            <button
              id="nav-link-futures"
              onClick={() => handleNav('futures')}
              className={`hover:text-white transition-colors ${currentView === 'futures' ? 'text-indigo-400' : ''}`}
            >
              {t.nav.futures}
            </button>
            <button
              id="nav-link-how"
              onClick={() => handleNav('how')}
              className={`hover:text-white transition-colors ${currentView === 'how' ? 'text-indigo-400' : ''}`}
            >
              {t.nav.how}
            </button>
            <button
              id="nav-link-examples"
              onClick={() => handleNav('examples')}
              className={`hover:text-white transition-colors ${currentView === 'examples' ? 'text-indigo-400' : ''}`}
            >
              {t.nav.examples}
            </button>
            <button
              id="nav-link-faq"
              onClick={() => handleNav('faq')}
              className={`hover:text-white transition-colors ${currentView === 'faq' ? 'text-indigo-400' : ''}`}
            >
              {t.nav.faq}
            </button>
          </nav>
        </div>

        {/* Right Controls: Currency, Language, CTA */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Currency Selector */}
          <div className="flex items-center rounded-lg border border-slate-800 bg-slate-900/90 p-0.5">
            {CURRENCIES.map(c => (
              <button
                key={c.code}
                id={`currency-btn-${c.code.toLowerCase()}`}
                onClick={() => onCurrencyChange(c.code)}
                className={`px-2 py-1 text-[11px] font-bold rounded transition-colors ${
                  currency === c.code
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title={`${t.ui.currency_label}: ${c.label}`}
                aria-label={`Select currency ${c.code}`}
              >
                {c.code}
              </button>
            ))}
          </div>

          {/* Language Selector: EN / FR / ES */}
          <div className="flex items-center rounded-lg border border-slate-800 bg-slate-900/90 p-0.5">
            {(['en', 'fr', 'es'] as SupportedLang[]).map(l => (
              <button
                key={l}
                id={`lang-btn-${l}`}
                onClick={() => onLangChange(l)}
                className={`px-2 py-1 text-[11px] font-bold uppercase rounded transition-colors ${
                  lang === l
                    ? 'bg-slate-700 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title={`${t.ui.lang_label}: ${l.toUpperCase()}`}
                aria-label={`Change language to ${l.toUpperCase()}`}
              >
                {l}
              </button>
            ))}
          </div>

          {/* Quick New Simulation CTA */}
          <button
            id="nav-new-sim-btn"
            onClick={onNewSimulation}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-all shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{t.ui.new_sim}</span>
          </button>

          {/* Download TSX button (direct answer to user query) */}
          {onDownloadSource && (
            <button
              id="nav-download-source-btn"
              onClick={onDownloadSource}
              className="hidden md:flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-700 hover:border-slate-600 bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-medium transition-colors"
              title={t.futures.export_code}
              aria-label={t.futures.export_code}
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden xl:inline">.tsx</span>
            </button>
          )}

          {/* Mobile Menu Button */}
          <button
            id="mobile-menu-toggle-btn"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-slate-400 hover:text-white lg:hidden rounded-lg hover:bg-slate-800 transition-colors"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Dropdown Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-b border-slate-800 bg-slate-950/95 backdrop-blur-2xl px-6 py-5 flex flex-col gap-4 text-sm font-semibold uppercase tracking-wider text-slate-300 animate-in slide-in-from-top duration-150">
          <button
            id="mobile-link-simulator"
            onClick={() => handleNav('simulator')}
            className={`text-left py-2 hover:text-indigo-400 transition-colors ${currentView === 'simulator' ? 'text-indigo-400 font-bold' : ''}`}
          >
            {t.nav.simulator}
          </button>
          <button
            id="mobile-link-compare"
            onClick={() => handleNav('compare')}
            className={`text-left py-2 hover:text-indigo-400 transition-colors ${currentView === 'compare' ? 'text-indigo-400 font-bold' : ''}`}
          >
            {t.nav.compare}
          </button>
          <button
            id="mobile-link-futures"
            onClick={() => handleNav('futures')}
            className={`text-left py-2 hover:text-indigo-400 transition-colors ${currentView === 'futures' ? 'text-indigo-400 font-bold' : ''}`}
          >
            {t.nav.futures}
          </button>
          <button
            id="mobile-link-how"
            onClick={() => handleNav('how')}
            className={`text-left py-2 hover:text-indigo-400 transition-colors ${currentView === 'how' ? 'text-indigo-400 font-bold' : ''}`}
          >
            {t.nav.how}
          </button>
          <button
            id="mobile-link-examples"
            onClick={() => handleNav('examples')}
            className={`text-left py-2 hover:text-indigo-400 transition-colors ${currentView === 'examples' ? 'text-indigo-400 font-bold' : ''}`}
          >
            {t.nav.examples}
          </button>
          <button
            id="mobile-link-faq"
            onClick={() => handleNav('faq')}
            className={`text-left py-2 hover:text-indigo-400 transition-colors ${currentView === 'faq' ? 'text-indigo-400 font-bold' : ''}`}
          >
            {t.nav.faq}
          </button>
          <button
            id="mobile-link-about"
            onClick={() => handleNav('about')}
            className={`text-left py-2 hover:text-indigo-400 transition-colors ${currentView === 'about' ? 'text-indigo-400 font-bold' : ''}`}
          >
            {t.nav.about}
          </button>
          <button
            id="mobile-link-privacy"
            onClick={() => handleNav('privacy')}
            className={`text-left py-2 hover:text-indigo-400 transition-colors ${currentView === 'privacy' ? 'text-indigo-400 font-bold' : ''}`}
          >
            {t.nav.privacy}
          </button>
          <button
            id="mobile-link-terms"
            onClick={() => handleNav('terms')}
            className={`text-left py-2 hover:text-indigo-400 transition-colors ${currentView === 'terms' ? 'text-indigo-400 font-bold' : ''}`}
          >
            {t.nav.terms}
          </button>

          <div className="pt-2 border-t border-slate-800 flex flex-col gap-2">
            <button
              id="mobile-new-sim-btn"
              onClick={() => {
                onNewSimulation();
                setMobileMenuOpen(false);
              }}
              className="w-full py-2.5 rounded-lg bg-indigo-600 text-white font-bold text-center text-xs"
            >
              {t.ui.new_sim}
            </button>
            {onDownloadSource && (
              <button
                id="mobile-download-btn"
                onClick={() => {
                  onDownloadSource();
                  setMobileMenuOpen(false);
                }}
                className="w-full py-2 rounded-lg border border-slate-700 bg-slate-900 text-slate-300 font-semibold text-center text-xs flex items-center justify-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>{t.futures.export_code}</span>
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
