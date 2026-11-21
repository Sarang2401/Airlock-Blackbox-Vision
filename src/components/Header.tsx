import React from 'react';
import { ShieldCheck, Activity, FileLock, Terminal, Cpu, Power } from 'lucide-react';
import { CapabilityTier } from '../contracts/types';
import { remoteConfigManager } from '../firebase/remoteConfig';

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
  const toggleKillSwitch = () => {
    const next = !cloudEnabled;
    remoteConfigManager.setKillSwitch(next);
    setCloudEnabled(next);
  };

  return (
    <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 py-3 flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Logo and Tagline */}
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-cyan-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <ShieldCheck className="h-6 w-6 text-white" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-extrabold text-lg text-white tracking-tight">AIRLOCK</span>
              <span className="text-slate-500 font-mono text-sm">+</span>
              <span className="font-bold text-lg text-cyan-400 tracking-tight">BLACK BOX</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800 font-mono">
                #BuildHybridAI
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Privacy Gateway & Hybrid Observability for Firebase AI Logic
            </p>
          </div>
        </div>

        {/* Global Controls & State */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Capability Tier Selector */}
          <div className="flex items-center space-x-1.5 bg-slate-950 px-2.5 py-1.5 rounded-lg border border-slate-800 text-xs">
            <Cpu className="h-3.5 w-3.5 text-slate-400" />
            <span className="text-slate-400 font-medium">Device:</span>
            <select
              aria-label="Device Capability Tier"
              value={tier}
              onChange={(e) => setTier(e.target.value as CapabilityTier)}
              className="bg-transparent text-slate-200 font-semibold focus:outline-none cursor-pointer"
            >
              <option value="TIER_A_NANO" className="bg-slate-900">Tier A: Gemini Nano</option>
              <option value="TIER_B_NO_NANO" className="bg-slate-900">Tier B: No-Nano (Judge Mode)</option>
              <option value="TIER_C_OFFLINE" className="bg-slate-900">Tier C: Offline Only</option>
            </select>
          </div>

          {/* Remote Config Kill Switch */}
          <button
            onClick={toggleKillSwitch}
            className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition ${
              cloudEnabled
                ? 'bg-emerald-950/60 border-emerald-800 text-emerald-300 hover:bg-emerald-900/60'
                : 'bg-rose-950/60 border-rose-800 text-rose-300 hover:bg-rose-900/60'
            }`}
            title="Remote Config Client Kill Switch"
          >
            <Power className="h-3.5 w-3.5" />
            <span>Cloud: {cloudEnabled ? 'ENABLED' : 'KILL SWITCH ACTIVE'}</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-4 flex space-x-1 overflow-x-auto border-t border-slate-800/60 pt-1 text-sm font-medium">
        <button
          onClick={() => setActiveTab('decoder')}
          className={`flex items-center space-x-2 px-3 py-2 border-b-2 transition ${
            activeTab === 'decoder'
              ? 'border-cyan-400 text-cyan-300'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <FileLock className="h-4 w-4" />
          <span>Bill & Claim Decoder</span>
        </button>

        <button
          onClick={() => setActiveTab('safepaste')}
          className={`flex items-center space-x-2 px-3 py-2 border-b-2 transition ${
            activeTab === 'safepaste'
              ? 'border-cyan-400 text-cyan-300'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Terminal className="h-4 w-4" />
          <span>Safe Paste (Chatbots)</span>
        </button>

        <button
          onClick={() => setActiveTab('blackbox')}
          className={`flex items-center space-x-2 px-3 py-2 border-b-2 transition ${
            activeTab === 'blackbox'
              ? 'border-cyan-400 text-cyan-300'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Activity className="h-4 w-4" />
          <span>Black Box Observability</span>
        </button>

        <button
          onClick={() => setActiveTab('receipts')}
          className={`flex items-center space-x-2 px-3 py-2 border-b-2 transition ${
            activeTab === 'receipts'
              ? 'border-cyan-400 text-cyan-300'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <ShieldCheck className="h-4 w-4" />
          <span>Privacy Receipts</span>
        </button>

        <button
          onClick={() => setActiveTab('benchmark')}
          className={`flex items-center space-x-2 px-3 py-2 border-b-2 transition ${
            activeTab === 'benchmark'
              ? 'border-cyan-400 text-cyan-300'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Cpu className="h-4 w-4" />
          <span>Airlock-Bench (105 Docs)</span>
        </button>
      </div>
    </header>
  );
};
