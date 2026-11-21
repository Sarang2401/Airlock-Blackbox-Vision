import { useState, useEffect } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { Header } from './components/Header';
import { BillDecoder } from './components/BillDecoder';
import { SafePasteView } from './components/SafePasteView';
import { BlackBoxDashboard } from './components/BlackBoxDashboard';
import { ReceiptsView } from './components/ReceiptsView';
import { BenchmarkView } from './components/BenchmarkView';
import { CapabilityTier } from './contracts/types';
import { remoteConfigManager } from './firebase/remoteConfig';
import { initAppCheck } from './firebase/config';
import { ShieldCheck, Lock } from 'lucide-react';

export function AppContent() {
  const [activeTab, setActiveTab] = useState<'decoder' | 'safepaste' | 'blackbox' | 'receipts' | 'benchmark'>('decoder');
  const [tier, setTier] = useState<CapabilityTier>('TIER_A_NANO');
  const [cloudEnabled, setCloudEnabled] = useState(true);

  useEffect(() => {
    initAppCheck();
    setCloudEnabled(remoteConfigManager.isCloudEnabled());
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-void-950 text-slate-800 dark:text-slate-100 flex flex-col transition-colors duration-200">
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        tier={tier}
        setTier={setTier}
        cloudEnabled={cloudEnabled}
        setCloudEnabled={setCloudEnabled}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
        {activeTab === 'decoder' && <BillDecoder tier={tier} />}
        {activeTab === 'safepaste' && <SafePasteView />}
        {activeTab === 'blackbox' && <BlackBoxDashboard />}
        {activeTab === 'receipts' && <ReceiptsView />}
        {activeTab === 'benchmark' && <BenchmarkView />}
      </main>

      <footer className="border-t border-slate-200/80 dark:border-void-border bg-white/80 dark:bg-void-950/80 py-6 mt-12 transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            <span className="font-bold text-slate-800 dark:text-slate-200">Airlock + Black Box</span>
            <span>—</span>
            <span>#BuildHybridAI 2026 Hackathon</span>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <span className="flex items-center gap-1 font-mono text-cyan-700 dark:text-cyan-400 font-medium">
              <Lock className="h-3 w-3" />
              Fail-Closed Privacy Gateway
            </span>
            <span className="text-slate-300 dark:text-slate-700">|</span>
            <span className="font-mono text-slate-600 dark:text-slate-400">Firebase AI Logic Hybrid Inference</span>
            <span className="text-slate-300 dark:text-slate-700">|</span>
            <span className="text-slate-600 dark:text-slate-400 font-semibold">Apache-2.0 Open Source</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}

export default App;
