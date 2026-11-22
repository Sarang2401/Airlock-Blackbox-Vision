import { useState } from 'react';
import { Braces, RefreshCw } from 'lucide-react';
import { blackBoxStore, generateRecommendedPolicy } from '../../packages/black-box';
import { PageHeading } from './PageHeading';
import { downloadText } from './downloadText';
import { useToast } from './ToastProvider';

export function BlackBoxDashboard() {
  const notify = useToast();
  const [summary, setSummary] = useState(() => blackBoxStore.computeSummary());
  const [policyJson, setPolicyJson] = useState<string | null>(null);
  const routePercent = (count: number) => summary.totalCalls ? Math.round(count / summary.totalCalls * 100) : 0;
  const stats = [
    { label: 'Total inferences', value: summary.totalCalls },
    { label: 'On-device route', value: summary.onDeviceCalls },
    { label: 'Cloud route', value: summary.inCloudCalls },
    { label: 'Cloud calls avoided', value: summary.cloudCallsAvoided },
  ];
  const latency = [
    { label: 'Overall p50', value: summary.totalCalls ? summary.p50LatencyMs : null },
    { label: 'Overall p95', value: summary.totalCalls ? summary.p95LatencyMs : null },
    { label: 'On-device p50', value: summary.onDeviceCalls ? summary.onDeviceP50LatencyMs : null },
    { label: 'Cloud p50', value: summary.inCloudCalls ? summary.inCloudP50LatencyMs : null },
  ];
  const fallbacks = Object.entries(summary.fallbackBreakdown);

  return (
    <div className="secondary-page">
      <PageHeading title="Black Box" description="Inspect local telemetry from simulated inference. Events contain route and timing metadata." actions={
        <>
          <button className="button button-secondary" type="button" onClick={() => {
            setSummary(blackBoxStore.computeSummary());
            setPolicyJson(null);
            notify('Telemetry refreshed.');
          }}><RefreshCw size={16} aria-hidden="true" /> Refresh metrics</button>
          <button className="button button-primary" type="button" onClick={() => setPolicyJson(policyJson ? null : JSON.stringify(generateRecommendedPolicy(summary), null, 2))} aria-expanded={Boolean(policyJson)}>
            <Braces size={17} aria-hidden="true" /> {policyJson ? 'Hide policy JSON' : 'Show policy JSON'}
          </button>
        </>
      } />
      <dl className="stats-grid">
        {stats.map(({ label, value }) => <div key={label} className="surface stat-card"><dt>{label}</dt><dd>{value}</dd></div>)}
      </dl>
      <section className="surface data-card">
        <h2 className="section-title">Route mix</h2>
        {summary.totalCalls ? (
          <>
            <div className="route-track" aria-hidden="true">
              <span style={{ width: `${routePercent(summary.onDeviceCalls)}%` }} />
              <span style={{ width: `${routePercent(summary.inCloudCalls)}%` }} />
            </div>
            <p className="muted">On-device {routePercent(summary.onDeviceCalls)}% · Cloud {routePercent(summary.inCloudCalls)}% · Unknown {routePercent(summary.unknownCalls)}%</p>
          </>
        ) : <p className="muted">Approve a sample analysis in Bill Decoder to record your first route event.</p>}
      </section>
      <div className="tool-grid">
        <section className="surface data-card">
          <h2 className="section-title">Latency</h2>
          <dl className="data-list">{latency.map(({ label, value }) => <div key={label}><dt>{label}</dt><dd>{value === null ? '—' : `${value} ms`}</dd></div>)}</dl>
        </section>
        <section className="surface data-card">
          <h2 className="section-title">Fallback reasons</h2>
          {fallbacks.length > 0
            ? <dl className="data-list">{fallbacks.map(([reason, count]) => <div key={reason}><dt><code>{reason}</code></dt><dd>{count}</dd></div>)}</dl>
            : <p className="muted">Sample analyses use a simulated cloud route. Fallback telemetry appears when a fallback is recorded.</p>}
        </section>
      </div>
      {policyJson && (
        <section className="surface data-card" aria-label="Recommended policy">
          <h2 className="section-title">Recommended Remote Config policy</h2>
          <pre className="document-text" tabIndex={0}>{policyJson}</pre>
          <button type="button" className="button button-secondary" onClick={() => {
            downloadText('escrowhealth-remote-config.json', policyJson, 'application/json');
            notify('Policy JSON download started.');
          }}>Download policy JSON</button>
        </section>
      )}
    </div>
  );
}
