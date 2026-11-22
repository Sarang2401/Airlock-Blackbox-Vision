import { Check, Clipboard, Download } from 'lucide-react';
import { DisputePack } from '../contracts/types';
import { downloadText } from './downloadText';
import { useToast } from './ToastProvider';

interface DisputePackViewProps {
  disputePack: DisputePack;
  source?: 'ON_DEVICE' | 'IN_CLOUD' | 'UNKNOWN';
  latencyMs?: number;
}

const routeLabels = { ON_DEVICE: 'On-device route', IN_CLOUD: 'Cloud route', UNKNOWN: 'Unknown route' };
const terms = {
  DUPLICATE_CHARGE: { name: 'Duplicate charge', explanation: 'The same service may appear twice. Ask the provider to check whether both entries represent separate visits or procedures.' },
  PACKAGE_OVERAGE: { name: 'Package overage', explanation: 'The billed amount may exceed a limit in the policy or bundled package. Compare the billed rate with the applicable limit.' },
  UNBUNDLED_ITEM: { name: 'Unbundled item', explanation: 'A service was billed separately from a group of services. Check whether the group already includes that charge.' },
  POLICY_EXCLUSION_DISPUTE: { name: 'Coverage dispute', explanation: 'The insurer treated a charge as excluded or assigned it to the patient. Ask for the policy terms and the calculation used to reach that decision.' },
  ARITHMETIC_ERROR: { name: 'Arithmetic error', explanation: 'The amounts or quantities may not add up. Compare each rate and quantity with the total.' },
};

export function DisputePackView({ disputePack, source = 'UNKNOWN', latencyMs }: DisputePackViewProps) {
  const notify = useToast();

  async function copyAppeal() {
    try {
      await navigator.clipboard.writeText(disputePack.draftAppealLetter);
      notify('Sample appeal copied.');
    } catch {
      notify('Could not copy the appeal. You can select the draft text.', 'error');
    }
  }

  function downloadAppeal() {
    downloadText('escrowhealth-sample-appeal.txt', disputePack.draftAppealLetter, 'text/plain');
    notify('Sample appeal download started.');
  }

  return (
    <div className="secondary-page">
      <p className="status-banner animate-receipt-stamp" role="status"><Check size={18} aria-hidden="true" /> Sample analysis complete · Simulated {routeLabels[source].toLowerCase()}{latencyMs === undefined ? '' : ` · ${latencyMs} ms`}</p>
      <section className="surface data-card">
        <h2 className="section-title" tabIndex={-1}>Sample dispute pack</h2>
        <p className="muted">{disputePack.summary}</p>
        <p className="muted">{disputePack.disclaimerNotice}</p>
      </section>
      <section className="surface data-card">
        <h2 className="section-title">Billing questions to check</h2>
        <ul className="finding-list">
          {disputePack.findings.map((finding) => (
            <li key={finding.findingId} className="finding">
              <h3 className="font-bold">{terms[finding.type].name}</h3>
              <p className="eyebrow">{[finding.lineItemRef ?? finding.policyClauseRef, finding.claimedAmount === undefined ? null : `${finding.currency} ${finding.claimedAmount}`].filter(Boolean).join(' · ')}</p>
              <p className="muted">{finding.description}</p>
              {finding.uncertaintyNotice && <p className="muted">{finding.uncertaintyNotice}</p>}
              <details>
                <summary>Evidence and term</summary>
                <p className="muted">{terms[finding.type].explanation}</p>
                <ul>{finding.evidenceQuotes.map((quote) => <li key={quote}><q>{quote}</q></li>)}</ul>
              </details>
            </li>
          ))}
        </ul>
      </section>
      {disputePack.policyClauseAnalysis.length > 0 && (
        <section className="surface data-card">
          <h2 className="section-title">Policy questions</h2>
          {disputePack.policyClauseAnalysis.map((clause) => (
            <details className="finding" key={clause.clauseId}>
              <summary>{clause.clauseId} · {clause.clauseTitle}</summary>
              <p className="muted">{clause.denialReasonMatched}</p>
              <p className="muted">{clause.analysisReasoning}</p>
              <p className="eyebrow">{clause.disputeStrength.replaceAll('_', ' ')}</p>
            </details>
          ))}
        </section>
      )}
      <section className="surface data-card">
        <h2 className="section-title">Draft appeal</h2>
        <p className="muted">Sample placeholders were restored on this device.</p>
        <pre className="document-text" tabIndex={0} aria-label="Draft appeal text">{disputePack.draftAppealLetter}</pre>
        <div className="page-actions">
          <button type="button" className="button button-secondary" onClick={() => void copyAppeal()}><Clipboard size={17} aria-hidden="true" /> Copy appeal</button>
          <button type="button" className="button button-primary" onClick={downloadAppeal}><Download size={17} aria-hidden="true" /> Download appeal</button>
        </div>
      </section>
      <section className="surface data-card">
        <h2 className="section-title">Documents to gather</h2>
        <ul className="list-disc pl-5 muted">{disputePack.supportingChecklist.map((item) => <li key={item}>{item}</li>)}</ul>
      </section>
    </div>
  );
}
