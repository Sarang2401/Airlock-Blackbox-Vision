import type { DocumentKind } from '../contracts/types';

export const documentNames: Record<DocumentKind, string> = {
  BILL: 'Itemized bill',
  DENIAL_LETTER: 'Insurer decision',
  POLICY: 'Policy wording',
  DISCHARGE_SUMMARY: 'Discharge summary',
  NOTES: 'Notes',
};
