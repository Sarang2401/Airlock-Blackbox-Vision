import React, { useState } from 'react';
import { AirlockLogo } from './brand/AirlockLogo';
import { CapabilityTier } from '../contracts/types';
import { remoteConfigManager } from '../firebase/remoteConfig';
import { useTheme } from '../context/ThemeContext';
import {
  FileText,
  Terminal,
  Activity,
  ShieldCheck,
  Cpu,
  Power,
  Sun,
  Moon,
  Menu,
  X,
  CheckCircle2,
} from 'lucide-react';

interface HeaderProps {
  activeTab: 'decoder' | 'safepaste' | 'blackbox' | 'receipts' | 'benchmark';
  setActiveTab: (tab: 'decoder' | 'safepaste' | 'blackbox' | 'receipts' | 'benchmark') => void;
  tier: CapabilityTier;
  setTier: (tier: CapabilityTier) => void;
  cloudEnabled: boolean;
  setCloudEnabled: (val: boolean) => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  tier,
  setTier,
  cloudEnabled,
  setCloudEnabled,
}) => {
  const { theme, toggleTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const toggleKillSwitch = () => {
    const next = !cloudEnabled;
    remoteConfigManager.setKillSwitch(next);
    setCloudEnabled(next);
  };

  const navItems = [
    { id: 'decoder', label: 'Bill & Claim Decoder', icon: FileText, badge: 'Core' },
    { id: 'safepaste', label: 'Safe Paste', icon: Terminal, badge: 'Chatbots' },
    { id: 'blackbox', label: 'Black Box', icon: Activity, badge: 'Hybrid AI' },
    { id: 'receipts', label: 'Privacy Receipts', icon: ShieldCheck, badge: 'SHA-256' },
    { id: 'benchmark', label: 'Airlock-Bench', icon: Cpu, badge: '105 Docs' },
  ] as const;

  const handleSelectTab = (tab: typeof activeTab) => {
    setActiveTab(tab);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/80 dark:border-void-border bg-white/90 dark:bg-void-950/90 backdrop-blur-md transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Brand Logo */}
          <div onClick={() => handleSelectTab('decoder')} className="cursor-pointer">
            <AirlockLogo size="md" />
          </div>

          {/* Desktop Controls (Right) */}
          <div className="hidden lg:flex items-center space-x-3">
            {/* Device Capability Tier Selector */}
            <div className="flex items-center space-x-2 bg-slate-100 dark:bg-void-card px-3 py-1.5 rounded-xl border border-slate-200 dark:border-void-border text-xs font-medium">
              <Cpu className="h-3.5 w-3.5 text-cyan-600 dark:text-cyan-400" />
              <span className="text-slate-500 dark:text-slate-400">Mode:</span>
              <select
                aria-label="Hardware Inference Mode"
                value={tier}
                onChange={(e) => setTier(e.target.value as CapabilityTier)}
                className="bg-transparent text-slate-800 dark:text-slate-200 font-semibold focus:outline-none cursor-pointer"
              >
                <option value="TIER_A_NANO" className="bg-white dark:bg-void-card">Tier A: Gemini Nano (On-Device)</option>
                <option value="TIER_B_NO_NANO" className="bg-white dark:bg-void-card">Tier B: Curated Judge Mode</option>
                <option value="TIER_C_OFFLINE" className="bg-white dark:bg-void-card">Tier C: Offline Only</option>
              </select>
            </div>

            {/* Remote Config Kill Switch */}
            <button
              onClick={toggleKillSwitch}
              className={`btn-tactile flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition ${
                cloudEnabled
                  ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/50'
                  : 'bg-rose-50 dark:bg-rose-950/50 border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900/50'
              }`}
              title="Remote Config Client-Side Kill Switch"
            >
              <Power className="h-3.5 w-3.5" />
              <span>Cloud: {cloudEnabled ? 'ENABLED' : 'HALTED'}</span>
            </button>

            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              aria-label="Toggle Theme"
              className="btn-tactile p-2 rounded-xl text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-void-card hover:bg-slate-200 dark:hover:bg-void-elevated border border-slate-200 dark:border-void-border transition"
            >
              {theme === 'dark' ? (
                <Sun className="h-4 w-4 text-amber-400 transition-transform rotate-0 hover:rotate-45" />
              ) : (
                <Moon className="h-4 w-4 text-indigo-600 transition-transform rotate-0 hover:-rotate-12" />
              )}
            </button>
          </div>

          {/* Mobile Actions Button */}
          <div className="flex lg:hidden items-center space-x-2">
            <button
              onClick={toggleTheme}
              aria-label="Toggle Dark/Light Mode"
              className="p-2 rounded-lg text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-void-card border border-slate-200 dark:border-void-border"
            >
              {theme === 'dark' ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4 text-indigo-600" />}
            </button>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Open Navigation Menu"
              className="p-2 rounded-lg text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-void-card border border-slate-200 dark:border-void-border"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Desktop Navigation Tabs */}
        <div className="hidden lg:flex space-x-1 border-t border-slate-200/60 dark:border-void-border/60 pt-1 text-sm font-medium">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleSelectTab(item.id)}
                className={`group relative flex items-center space-x-2 px-4 py-2.5 rounded-lg text-xs font-semibold transition duration-150 ${
                  isActive
                    ? 'text-cyan-700 dark:text-cyan-300 bg-cyan-50 dark:bg-cyan-950/40'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-void-card/60'
                }`}
              >
                <Icon className={`h-4 w-4 transition-transform group-hover:scale-110 ${isActive ? 'text-cyan-600 dark:text-cyan-400' : 'text-slate-400 dark:text-slate-500'}`} />
                <span>{item.label}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono font-medium ${
                  isActive
                    ? 'bg-cyan-200/60 dark:bg-cyan-900/60 text-cyan-800 dark:text-cyan-200'
                    : 'bg-slate-200/60 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400'
                }`}>
                  {item.badge}
                </span>

                {isActive && (
                  <span className="absolute bottom-0 left-2 right-2 h-0.5 bg-gradient-to-r from-cyan-500 to-indigo-500 rounded-full" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-200 dark:border-void-border bg-white dark:bg-void-950 px-4 pt-3 pb-6 space-y-4 shadow-2xl animate-fadeIn">
          <div className="space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-3">
              Navigation
            </span>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleSelectTab(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold transition ${
                    isActive
                      ? 'bg-cyan-50 dark:bg-cyan-950/60 text-cyan-700 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-void-card'
                  }`}
                >
                  <div className="flex items-center space-x-2.5">
                    <Icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </div>
                  {isActive && <CheckCircle2 className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />}
                </button>
              );
            })}
          </div>

          <div className="pt-3 border-t border-slate-200 dark:border-void-border space-y-3">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Hardware Inference Tier
              </span>
              <select
                aria-label="Hardware Inference Mode Selection"
                value={tier}
                onChange={(e) => setTier(e.target.value as CapabilityTier)}
                className="w-full bg-slate-100 dark:bg-void-card border border-slate-200 dark:border-void-border rounded-lg p-2 text-xs font-semibold text-slate-800 dark:text-slate-200"
              >
                <option value="TIER_A_NANO">Tier A: Gemini Nano (On-Device)</option>
                <option value="TIER_B_NO_NANO">Tier B: Curated Judge Mode</option>
                <option value="TIER_C_OFFLINE">Tier C: Offline Only</option>
              </select>
            </div>

            <button
              onClick={toggleKillSwitch}
              className={`w-full flex items-center justify-center space-x-2 p-2.5 rounded-lg text-xs font-semibold border transition ${
                cloudEnabled
                  ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300'
                  : 'bg-rose-50 dark:bg-rose-950/60 border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-300'
              }`}
            >
              <Power className="h-4 w-4" />
              <span>Remote Config Cloud Status: {cloudEnabled ? 'ENABLED' : 'HALTED'}</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
