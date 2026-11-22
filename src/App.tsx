import { useState, useEffect, useRef } from 'react';
import { LockKeyhole } from 'lucide-react';
import { ToastProvider } from './components/ToastProvider';
import { ThemeProvider } from './context/ThemeContext';
import { Header, WorkspaceBrand, WorkspaceNavigation, WorkspaceTab } from './components/Header';
import { BillDecoder } from './components/BillDecoder';
import { SafePasteView } from './components/SafePasteView';
import { BlackBoxDashboard } from './components/BlackBoxDashboard';
import { ReceiptsView } from './components/ReceiptsView';
import { BenchmarkView } from './components/BenchmarkView';
import { CapabilityTier } from './contracts/types';
import { remoteConfigManager } from './firebase/remoteConfig';
import { initAppCheck } from './firebase/config';

export function AppContent() {
  const [activeTab, setActiveTab] = useState<WorkspaceTab>('decoder');
  const [tier, setTier] = useState<CapabilityTier>('TIER_B_NO_NANO');
  const [cloudEnabled, setCloudEnabled] = useState(() => remoteConfigManager.isCloudEnabled());
  const [online, setOnline] = useState(() => navigator.onLine);
  const main = useRef<HTMLElement>(null);
  const shouldFocus = useRef(false);

  useEffect(() => {
    initAppCheck();
    const updateOnline = () => setOnline(navigator.onLine);
    window.addEventListener('online', updateOnline);
    window.addEventListener('offline', updateOnline);
    return () => {
      window.removeEventListener('online', updateOnline);
      window.removeEventListener('offline', updateOnline);
    };
  }, []);

  useEffect(() => {
    if (!shouldFocus.current) return;
    shouldFocus.current = false;
    main.current?.querySelector<HTMLElement>('[data-current-page] h1')?.focus({ preventScroll: true });
    window.scrollTo(0, 0);
  }, [activeTab]);

  const navigate = (tab: WorkspaceTab) => {
    if (tab === activeTab) return;
    shouldFocus.current = true;
    setActiveTab(tab);
  };

  const toggleCloud = () => {
    const next = !cloudEnabled;
    remoteConfigManager.setKillSwitch(next);
    setCloudEnabled(next);
  };

  return (
    <div className="app-shell">
      <a href="#workspace-content" className="skip-link">Skip to content</a>
      <aside className="sidebar">
        <WorkspaceBrand onClick={() => navigate('decoder')} />
        <WorkspaceNavigation activeTab={activeTab} onNavigate={navigate} />
        <div className="sidebar-note"><LockKeyhole size={16} aria-hidden="true" /> Original text stays in this browser</div>
      </aside>
      <div className="app-main">
        <Header activeTab={activeTab} onNavigate={navigate} tier={tier} onTierChange={setTier} cloudEnabled={cloudEnabled} onCloudToggle={toggleCloud} online={online} />
        <main id="workspace-content" ref={main} className="workspace-content" tabIndex={-1}>
          <div hidden={activeTab !== 'decoder'} data-current-page={activeTab === 'decoder' ? '' : undefined} className="workspace-view">
            <BillDecoder tier={tier} online={online} cloudEnabled={cloudEnabled} onOpenReceipts={() => navigate('receipts')} />
          </div>
          <div hidden={activeTab !== 'safepaste'} data-current-page={activeTab === 'safepaste' ? '' : undefined} className="workspace-view">
            <SafePasteView />
          </div>
          {activeTab !== 'decoder' && activeTab !== 'safepaste' && (
            <div key={activeTab} data-current-page className="workspace-view">
              {activeTab === 'blackbox' && <BlackBoxDashboard />}
              {activeTab === 'receipts' && <ReceiptsView />}
              {activeTab === 'benchmark' && <BenchmarkView />}
            </div>
          )}
        </main>
        <footer className="workspace-footer">
          <span>EscrowHealth <span aria-hidden="true">·</span> #BuildHybridAI 2026</span>
          <span>Apache-2.0</span>
        </footer>
      </div>
    </div>
  );
}

export function App() {
  return <ThemeProvider><ToastProvider><AppContent /></ToastProvider></ThemeProvider>;
}

export default App;
