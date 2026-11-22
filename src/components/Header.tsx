import { useEffect, useRef } from 'react';
import { Activity, ChevronDown, Cpu, FileText, FlaskConical, LockKeyhole, Menu, Moon, ScanLine, ShieldCheck, SlidersHorizontal, Sun, X } from 'lucide-react';
import { CapabilityTier } from '../contracts/types';
import { useTheme } from '../context/ThemeContext';
import { EscrowHealthLogo } from './brand/EscrowHealthLogo';

const navigation = [
  { title: 'Workspace', items: [
    { id: 'decoder', label: 'Bill Decoder', icon: FileText },
    { id: 'safepaste', label: 'Safe Paste', icon: ScanLine },
  ] },
  { title: 'Activity & evidence', items: [
    { id: 'receipts', label: 'Privacy Receipts', icon: ShieldCheck },
    { id: 'blackbox', label: 'Black Box', icon: Activity },
    { id: 'benchmark', label: 'Benchmark', icon: FlaskConical },
  ] },
] as const;

export type WorkspaceTab = typeof navigation[number]['items'][number]['id'];

interface NavigationProps {
  activeTab: WorkspaceTab;
  onNavigate: (tab: WorkspaceTab) => void;
}

export function WorkspaceNavigation({ activeTab, onNavigate }: NavigationProps) {
  return (
    <nav className="workspace-nav" aria-label="Workspace">
      {navigation.map(({ title, items }) => (
        <div className="nav-group" key={title}>
          <p className="eyebrow">{title}</p>
          {items.map(({ id, label, icon: Icon }) => (
            <button key={id} type="button" aria-current={activeTab === id ? 'page' : undefined} onClick={() => onNavigate(id)}>
              <Icon size={18} aria-hidden="true" />
              <span>{label}</span>
            </button>
          ))}
        </div>
      ))}
    </nav>
  );
}

export function WorkspaceBrand({ onClick }: { onClick: () => void }) {
  return (
    <button className="brand-button" type="button" onClick={onClick} aria-label="EscrowHealth home">
      <EscrowHealthLogo />
    </button>
  );
}

interface HeaderProps extends NavigationProps {
  tier: CapabilityTier;
  onTierChange: (tier: CapabilityTier) => void;
  cloudEnabled: boolean;
  onCloudToggle: () => void;
  online: boolean;
}

export function Header({ activeTab, onNavigate, tier, onTierChange, cloudEnabled, onCloudToggle, online }: HeaderProps) {
  const { theme, toggleTheme } = useTheme();
  const drawer = useRef<HTMLDialogElement>(null);
  const runtimeMenu = useRef<HTMLDetailsElement>(null);

  useEffect(() => {
    const desktop = window.matchMedia('(min-width: 1041px)');
    const closeDrawerOnDesktop = () => { if (desktop.matches) drawer.current?.close(); };
    const closeRuntimeOutside = (event: PointerEvent) => {
      const menu = runtimeMenu.current;
      if (menu?.open && event.target instanceof Node && !menu.contains(event.target)) menu.open = false;
    };
    const closeRuntimeOnEscape = (event: KeyboardEvent) => {
      const menu = runtimeMenu.current;
      if (event.key !== 'Escape' || !menu?.open) return;
      menu.open = false;
      if (menu.contains(document.activeElement)) menu.querySelector('summary')?.focus();
    };
    desktop.addEventListener('change', closeDrawerOnDesktop);
    document.addEventListener('pointerdown', closeRuntimeOutside);
    document.addEventListener('keydown', closeRuntimeOnEscape);
    return () => {
      desktop.removeEventListener('change', closeDrawerOnDesktop);
      document.removeEventListener('pointerdown', closeRuntimeOutside);
      document.removeEventListener('keydown', closeRuntimeOnEscape);
    };
  }, []);
  const activeLabel = navigation.flatMap(({ items }) => [...items]).find(({ id }) => activeTab === id)?.label;
  const navigateFromDrawer = (tab: WorkspaceTab) => {
    drawer.current?.close();
    onNavigate(tab);
  };

  return (
    <header className="topbar">
      <div className="topbar-inner">
        <div className="mobile-brand">
          <WorkspaceBrand onClick={() => onNavigate('decoder')} />
        </div>
        <div className="breadcrumbs" aria-label="Current workspace">
          <span>Workspace</span>
          <span aria-hidden="true">/</span>
          <strong>{activeLabel}</strong>
        </div>
        <div className="topbar-actions">
          <details ref={runtimeMenu} className="runtime-menu">
            <summary className="button button-secondary runtime-trigger" title="Preview settings">
              <span className="runtime-dot" aria-hidden="true" />
              <span className="runtime-label">{!online || tier === 'TIER_C_OFFLINE' ? 'Offline' : 'Simulation'}</span>
              <ChevronDown className="runtime-chevron" size={14} aria-hidden="true" />
              <SlidersHorizontal className="runtime-sliders" size={17} aria-hidden="true" />
              <span className="sr-only">settings</span>
            </summary>
            <div className="runtime-panel surface">
              <p className="runtime-title"><Cpu size={16} aria-hidden="true" /> Preview settings</p>
              <p className="muted">These controls change the fictional walkthrough. The local model and cloud route are simulated.</p>
              <label htmlFor="capability-tier">Preview scenario</label>
              <select id="capability-tier" className="field" value={tier} onChange={(event) => onTierChange(event.target.value as CapabilityTier)}>
                <option value="TIER_B_NO_NANO">Judge mode</option>
                <option value="TIER_A_NANO">Simulated Nano</option>
                <option value="TIER_C_OFFLINE">Offline preview</option>
              </select>
              <button className="button button-secondary" type="button" onClick={onCloudToggle} aria-pressed={cloudEnabled}>
                Simulated cloud route {cloudEnabled ? 'enabled' : 'paused'}
              </button>
            </div>
          </details>
          <button type="button" className="button button-secondary icon-button" onClick={toggleTheme} aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}>
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <button type="button" className="button button-secondary icon-button mobile-menu-button" aria-label="Open navigation" onClick={() => drawer.current?.showModal()}>
            <Menu size={20} />
          </button>
        </div>
      </div>
      <dialog ref={drawer} className="mobile-drawer" aria-label="Workspace navigation" onClick={(event) => {
        if (event.target === event.currentTarget) event.currentTarget.close();
      }}>
        <div className="drawer-content">
          <div className="drawer-heading">
            <WorkspaceBrand onClick={() => navigateFromDrawer('decoder')} />
            <button type="button" className="button button-secondary icon-button" aria-label="Close navigation" onClick={() => drawer.current?.close()}>
              <X size={20} />
            </button>
          </div>
          <WorkspaceNavigation activeTab={activeTab} onNavigate={navigateFromDrawer} />
          <div className="sidebar-note"><LockKeyhole size={16} aria-hidden="true" /> Original text stays in this browser</div>
        </div>
      </dialog>
    </header>
  );
}
