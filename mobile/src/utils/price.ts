export function pricePerUnit(price: number, size: number) {
  if (!size || size <= 0) return price;
  return price / size;
}

export function formatCurrency(n: number) {
  try {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);
  } catch {
    return `$${n.toFixed(2)}`;
  }
}

