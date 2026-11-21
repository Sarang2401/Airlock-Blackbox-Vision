/**
 * Verhoeff checksum algorithm for Aadhaar validation.
 * Used for 100% deterministic checking of 12-digit Indian Aadhaar numbers.
 */

const dTable: number[][] = [
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
  [1, 2, 3, 4, 0, 6, 7, 8, 9, 5],
  [2, 3, 4, 0, 1, 7, 8, 9, 5, 6],
  [3, 4, 0, 1, 2, 8, 9, 5, 6, 7],
  [4, 0, 1, 2, 3, 9, 5, 6, 7, 8],
  [5, 9, 8, 7, 6, 0, 4, 3, 2, 1],
  [6, 5, 9, 8, 7, 1, 0, 4, 3, 2],
  [7, 6, 5, 9, 8, 2, 1, 0, 4, 3],
  [8, 7, 6, 5, 9, 3, 2, 1, 0, 4],
  [9, 8, 7, 6, 5, 4, 3, 2, 1, 0],
];

const pTable: number[][] = [
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
  [1, 5, 7, 6, 2, 8, 3, 0, 9, 4],
  [5, 8, 0, 3, 7, 9, 6, 1, 4, 2],
  [8, 9, 1, 6, 0, 4, 3, 5, 2, 7],
  [9, 4, 5, 3, 1, 2, 6, 8, 7, 0],
  [4, 2, 8, 6, 5, 7, 3, 9, 0, 1],
  [2, 7, 9, 3, 8, 0, 6, 4, 1, 5],
  [7, 0, 4, 6, 9, 1, 3, 2, 5, 8],
];

const invTable: number[] = [0, 4, 3, 2, 1, 5, 6, 7, 8, 9];

export function computeVerhoeffCheckDigit(numStr: string): number {
  const clean = numStr.replace(/\D/g, '');
  let c = 0;
  const reversed = clean.split('').reverse().map(Number);
  for (let i = 0; i < reversed.length; i++) {
    c = dTable[c][pTable[(i + 1) % 8][reversed[i]]];
  }
  return invTable[c];
}

export function validateVerhoeff(numStr: string): boolean {
  const clean = numStr.replace(/\D/g, '');
  if (clean.length !== 12) return false;
  
  let c = 0;
  const reversed = clean.split('').reverse().map(Number);
  for (let i = 0; i < reversed.length; i++) {
    c = dTable[c][pTable[i % 8][reversed[i]]];
  }
  return c === 0;
}

export function validatePAN(pan: string): boolean {
  // 5 uppercase letters, 4 digits, 1 uppercase letter
  return /^[A-Z]{5}[0-9]{4}[A-Z]$/.test(pan.toUpperCase());
}

export function validateSSN(ssn: string): boolean {
  const clean = ssn.replace(/\D/g, '');
  if (clean.length !== 9) return false;
  const area = parseInt(clean.substring(0, 3), 10);
  if (area === 0 || area === 666 || area >= 900) return false;
  if (clean.substring(3, 5) === '00') return false;
  if (clean.substring(5, 9) === '0000') return false;
  return true;
}
