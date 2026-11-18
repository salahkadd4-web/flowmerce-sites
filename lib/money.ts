// Montants en dinars : « 2 500 DA », espaces insécables (le montant ne se coupe pas).

const NBSP = " ";

export function formatDA(amount: number): string {
  const digits = Math.round(amount).toString().replace(/\B(?=(\d{3})+(?!\d))/g, NBSP);
  return `${digits}${NBSP}DA`;
}
