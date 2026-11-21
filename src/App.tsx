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

export function AppContent() {
  const [activeTab, setActiveTab] = useState<'decoder' | 'safepaste' | 'blackbox' | 'receipts' | 'benchmark'>('decoder');
  const [tier, setTier] = useState<CapabilityTier>('TIER_A_NANO');
  const [cloudEnabled, setCloudEnabled] = useState(true);

  useEffect(() => {
    initAppCheck();
    setCloudEnabled(remoteConfigManager.isCloudEnabled());
  }, []);

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 flex flex-col">
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        tier={tier}
        setTier={setTier}
        cloudEnabled={cloudEnabled}
        setCloudEnabled={setCloudEnabled}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 space-y-4">
        {activeTab === 'decoder' && <BillDecoder tier={tier} />}
        {activeTab === 'safepaste' && <SafePasteView />}
        {activeTab === 'blackbox' && <BlackBoxDashboard />}
        {activeTab === 'receipts' && <ReceiptsView />}
        {activeTab === 'benchmark' && <BenchmarkView />}
      </main>

      <footer className="border-t border-zinc-200 dark:border-zinc-800 py-5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-zinc-500 dark:text-zinc-500">
          <span className="font-medium text-zinc-700 dark:text-zinc-400">Airlock + Black Box</span>
          <div className="flex items-center gap-4">
            <span className="font-mono">#BuildHybridAI 2026</span>
            <span className="text-zinc-300 dark:text-zinc-700">·</span>
            <span className="font-mono text-emerald-600 dark:text-emerald-500">0% PII Egress</span>
            <span className="text-zinc-300 dark:text-zinc-700">·</span>
            <span>Apache-2.0</span>
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
