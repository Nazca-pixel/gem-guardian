// Centralized formatters for currency, percent, and compact numbers.
// Italian locale + EUR by default to match the app's audience.

const currencyFormatter = new Intl.NumberFormat("it-IT", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 2,
});

const currencyCompactFormatter = new Intl.NumberFormat("it-IT", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

const percentFormatter = new Intl.NumberFormat("it-IT", {
  style: "percent",
  maximumFractionDigits: 0,
});

export const formatCurrency = (value: number, opts?: { compact?: boolean }) => {
  if (!Number.isFinite(value)) return "€0";
  return (opts?.compact ? currencyCompactFormatter : currencyFormatter).format(value);
};

export const formatSignedCurrency = (value: number, opts?: { compact?: boolean }) => {
  const formatted = formatCurrency(Math.abs(value), opts);
  if (value > 0) return `+${formatted}`;
  if (value < 0) return `-${formatted}`;
  return formatted;
};

export const formatPercent = (ratio: number) => {
  if (!Number.isFinite(ratio)) return "0%";
  return percentFormatter.format(Math.max(0, Math.min(1, ratio)));
};
