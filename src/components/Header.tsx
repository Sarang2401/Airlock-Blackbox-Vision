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
  ChevronDown,
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
    { id: 'decoder', label: 'Bill Decoder', icon: FileText },
    { id: 'safepaste', label: 'Safe Paste', icon: Terminal },
    { id: 'blackbox', label: 'Black Box', icon: Activity },
    { id: 'receipts', label: 'Receipts', icon: ShieldCheck },
    { id: 'benchmark', label: 'Benchmark', icon: Cpu },
  ] as const;

  const handleSelectTab = (tab: typeof activeTab) => {
    setActiveTab(tab);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 border-b border-zinc-200 dark:border-zinc-800 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-14">
          {/* Brand */}
          <button
            onClick={() => handleSelectTab('decoder')}
            className="flex-shrink-0 btn-press"
          >
            <AirlockLogo size="md" />
          </button>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleSelectTab(item.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors btn-press ${
                    isActive
                      ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50'
                      : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-50 dark:hover:bg-zinc-800/60'
                  }`}
                >
                  <Icon className={`h-3.5 w-3.5 ${isActive ? 'text-emerald-500' : ''}`} />
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Desktop Controls */}
          <div className="hidden md:flex items-center gap-2">
            {/* Tier selector */}
            <div className="relative flex items-center gap-1.5 h-8 px-3 rounded-md border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/80 text-xs text-zinc-600 dark:text-zinc-400">
              <Cpu className="h-3.5 w-3.5 text-zinc-400 dark:text-zinc-500 flex-shrink-0" />
              <select
                aria-label="Hardware Inference Mode"
                value={tier}
                onChange={(e) => setTier(e.target.value as CapabilityTier)}
                className="bg-transparent text-zinc-700 dark:text-zinc-300 font-medium focus:outline-none cursor-pointer text-xs pr-1"
              >
                <option value="TIER_A_NANO">Nano On-Device</option>
                <option value="TIER_B_NO_NANO">Judge Mode</option>
                <option value="TIER_C_OFFLINE">Offline</option>
              </select>
              <ChevronDown className="h-3 w-3 text-zinc-400 pointer-events-none" />
            </div>

            {/* Kill switch */}
            <button
              onClick={toggleKillSwitch}
              className={`btn-press flex items-center gap-1.5 h-8 px-3 rounded-md text-xs font-medium border transition-colors ${
                cloudEnabled
                  ? 'border-emerald-200 dark:border-emerald-800/60 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/40'
                  : 'border-red-200 dark:border-red-800/60 bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40'
              }`}
            >
              <Power className="h-3.5 w-3.5" />
              <span>Cloud {cloudEnabled ? 'On' : 'Off'}</span>
            </button>

            {/* Theme */}
            <button
              onClick={toggleTheme}
              aria-label="Toggle theme"
              className="btn-press flex items-center justify-center h-8 w-8 rounded-md border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/80 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors"
            >
              {theme === 'dark' ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
            </button>
          </div>

          {/* Mobile controls */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={toggleTheme}
              className="flex items-center justify-center h-8 w-8 rounded-md border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800"
            >
              {theme === 'dark' ? <Sun className="h-3.5 w-3.5 text-zinc-400" /> : <Moon className="h-3.5 w-3.5 text-zinc-600" />}
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="flex items-center justify-center h-8 w-8 rounded-md border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800"
            >
              {mobileMenuOpen ? <X className="h-4 w-4 text-zinc-600 dark:text-zinc-400" /> : <Menu className="h-4 w-4 text-zinc-600 dark:text-zinc-400" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 animate-slide-down">
          <div className="max-w-7xl mx-auto px-4 py-3 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleSelectTab(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50'
                      : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800/60'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={`h-4 w-4 ${isActive ? 'text-emerald-500' : 'text-zinc-400'}`} />
                    {item.label}
                  </div>
                  {isActive && <CheckCircle2 className="h-4 w-4 text-emerald-500" />}
                </button>
              );
            })}

            <div className="pt-3 mt-2 border-t border-zinc-100 dark:border-zinc-800 space-y-2">
              <div className="flex items-center gap-2 px-3">
                <Cpu className="h-3.5 w-3.5 text-zinc-400" />
                <select
                  value={tier}
                  onChange={(e) => setTier(e.target.value as CapabilityTier)}
                  className="flex-1 bg-transparent text-sm font-medium text-zinc-700 dark:text-zinc-300 focus:outline-none"
                >
                  <option value="TIER_A_NANO">Nano On-Device</option>
                  <option value="TIER_B_NO_NANO">Judge Mode</option>
                  <option value="TIER_C_OFFLINE">Offline</option>
                </select>
              </div>
              <button
                onClick={toggleKillSwitch}
                className={`w-full flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-medium border transition-colors ${
                  cloudEnabled
                    ? 'border-emerald-200 dark:border-emerald-800/60 text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40'
                    : 'border-red-200 dark:border-red-800/60 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40'
                }`}
              >
                <Power className="h-4 w-4" />
                Cloud {cloudEnabled ? 'Enabled' : 'Disabled'}
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
