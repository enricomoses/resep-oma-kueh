export function formatIdr(amountIdr: number): string {
  if (!Number.isFinite(amountIdr) || amountIdr < 0) {
    return 'Rp0';
  }
  const digits = String(Math.floor(amountIdr)).replace(
    /\B(?=(\d{3})+(?!\d))/g,
    '.',
  );
  return `Rp${digits}`;
}
