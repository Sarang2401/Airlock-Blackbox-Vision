import { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { BillDecoder } from './components/BillDecoder';
import { SafePasteView } from './components/SafePasteView';
import { BlackBoxDashboard } from './components/BlackBoxDashboard';
import { ReceiptsView } from './components/ReceiptsView';
import { BenchmarkView } from './components/BenchmarkView';
import { CapabilityTier } from './contracts/types';
import { remoteConfigManager } from './firebase/remoteConfig';
import { initAppCheck } from './firebase/config';

export function App() {
  const [activeTab, setActiveTab] = useState<'decoder' | 'safepaste' | 'blackbox' | 'receipts' | 'benchmark'>('decoder');
  const [tier, setTier] = useState<CapabilityTier>('TIER_A_NANO');
  const [cloudEnabled, setCloudEnabled] = useState(true);

  useEffect(() => {
    initAppCheck();
    setCloudEnabled(remoteConfigManager.isCloudEnabled());
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-cyan-500 selection:text-white">
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        tier={tier}
        setTier={setTier}
        cloudEnabled={cloudEnabled}
        setCloudEnabled={setCloudEnabled}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-6">
        {activeTab === 'decoder' && <BillDecoder tier={tier} />}
        {activeTab === 'safepaste' && <SafePasteView />}
        {activeTab === 'blackbox' && <BlackBoxDashboard />}
        {activeTab === 'receipts' && <ReceiptsView />}
        {activeTab === 'benchmark' && <BenchmarkView />}
      </main>

      <footer className="border-t border-slate-800 bg-slate-900/60 py-4 mt-8">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-400">
          <div>
            <span className="font-semibold text-slate-300">Airlock + Black Box</span> — #BuildHybridAI 2026 Hackathon Submission
          </div>
          <div className="flex items-center space-x-4">
            <span className="font-mono text-cyan-400">Firebase AI Logic Hybrid Inference</span>
            <span className="text-slate-600">|</span>
            <span>Apache-2.0 Open Source</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
