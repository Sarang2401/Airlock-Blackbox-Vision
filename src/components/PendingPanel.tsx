import { LockKeyhole } from 'lucide-react';

export function Spinner() {
  return <span className="spinner" aria-hidden="true" />;
}

export function nextPaint() {
  return new Promise<void>((resolve) => {
    if (document.hidden) {
      resolve();
      return;
    }
    // Yield to the browser so a pending state can paint before local work.
    const fallback = window.setTimeout(resolve, 80);
    window.requestAnimationFrame(() => window.requestAnimationFrame(() => {
      window.clearTimeout(fallback);
      resolve();
    }));
  });
}

export function PendingPanel({ label, scan = false }: { label: string; scan?: boolean }) {
  return (
    <div className="surface pending-panel" data-scan={scan}>
      <div className="pending-label" role="status">{scan ? <LockKeyhole size={18} aria-hidden="true" /> : <Spinner />}{label}</div>
      <div className="skeleton-lines" aria-hidden="true"><span /><span /><span /></div>
    </div>
  );
}
