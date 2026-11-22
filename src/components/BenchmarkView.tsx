import { useState } from 'react';
import { Play } from 'lucide-react';
import { generateBenchmarkCorpus, BenchmarkDocument } from '../../benchmark/syntheticCorpus';
import { evaluateAirlockBench } from '../../benchmark/runner';
import { PageHeading } from './PageHeading';
import { nextPaint, Spinner } from './PendingPanel';
import { useToast } from './ToastProvider';

const categoryLabels = {
  ALL: 'All',
  BILL: 'Bills',
  DENIAL: 'Denials',
  POLICY: 'Policies',
  DISCHARGE: 'Discharge',
  PHARMACY: 'Pharmacy',
};

export function BenchmarkView() {
  const notify = useToast();
  const [corpus] = useState(generateBenchmarkCorpus);
  const [metrics, setMetrics] = useState(() => evaluateAirlockBench(corpus));
  const [category, setCategory] = useState<keyof typeof categoryLabels>('ALL');
  const [selectedId, setSelectedId] = useState(corpus[0].id);
  const [runCount, setRunCount] = useState(0);
  const [isRunning, setIsRunning] = useState(false);

  async function rerun() {
    setIsRunning(true);
    await nextPaint();
    try {
      setMetrics(evaluateAirlockBench(corpus));
      setRunCount((current) => current + 1);
    } catch {
      notify('The benchmark could not finish. Try running it again.', 'error');
    } finally {
      setIsRunning(false);
    }
  }
  const filteredDocs = category === 'ALL' ? corpus : corpus.filter((doc) => doc.category === category);
  const selectedDoc = filteredDocs.find((doc) => doc.id === selectedId) ?? filteredDocs[0];
  const stats = [
    { label: 'Fictional documents', value: metrics.totalDocuments },
    { label: 'Privacy leak rate', value: `${(metrics.leakRate * 100).toFixed(1)}%` },
    { label: 'Fixture-assisted recall', value: `${(metrics.recall * 100).toFixed(1)}%` },
    { label: 'Labeled entities', value: metrics.totalGroundTruthEntities },
    { label: 'Cloud eligibility', value: `${metrics.eligiblePercentage.toFixed(0)}%` },
  ];

  return (
    <div className="secondary-page">
      <PageHeading title="Airlock Benchmark" description="Evaluate redaction on 105 fictional documents. The recall pass uses fixture labels." actions={
        <button type="button" className="button button-primary" disabled={isRunning} onClick={() => void rerun()}>{isRunning ? <Spinner /> : <Play size={16} aria-hidden="true" />}{isRunning ? 'Evaluating…' : 'Run benchmark'}</button>
      } />
      <dl className="stats-grid">
        {stats.map(({ label, value }) => <div key={label} className="surface stat-card"><dt>{label}</dt><dd className={label === 'Privacy leak rate' ? 'accent' : undefined}>{value}</dd></div>)}
      </dl>
      {!isRunning && runCount > 0 && <p key={runCount} className="status-banner animate-receipt-stamp" role="status">Evaluation complete · {metrics.residualLeaksCount} of {metrics.totalDocuments} documents with a surviving labeled name or government identifier</p>}
      <section className="surface data-card">
        <h2 className="section-title">Browse the corpus</h2>
        <div className="filter-list" role="group" aria-label="Document categories">
          {Object.entries(categoryLabels).map(([value, label]) => (
            <button key={value} type="button" className="button button-secondary" aria-pressed={category === value} onClick={() => setCategory(value as keyof typeof categoryLabels)}>{label}</button>
          ))}
        </div>
        <div className="benchmark-layout">
          <div className="corpus-list" role="group" aria-label={`${filteredDocs.length} documents`}>
            {filteredDocs.map((doc: BenchmarkDocument) => (
              <button key={doc.id} type="button" className="button button-secondary" aria-pressed={doc.id === selectedDoc.id} onClick={() => setSelectedId(doc.id)}>
                {doc.id} <span className="muted">{doc.format}</span>
              </button>
            ))}
          </div>
          <div className="finding">
            <h3 className="font-semibold">{selectedDoc.id}</h3>
            <pre className="document-text mt-2" tabIndex={0} aria-label="Synthetic document text">{selectedDoc.text}</pre>
            <details>
              <summary>Expected redactions</summary>
              <ul>{selectedDoc.groundTruthEntities.map((entity, index) => <li key={index}><code>{entity.type}</code> · {entity.value}</li>)}</ul>
            </details>
          </div>
        </div>
      </section>
    </div>
  );
}
