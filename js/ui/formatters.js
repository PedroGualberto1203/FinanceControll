export const MONTHS = [
  "Janeiro",
  "Fevereiro",
  "Marco",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro"
];

export const SHORT_MONTHS = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

export function formatCurrency(cents) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL"
  }).format((Number(cents) || 0) / 100);
}

export function parseCurrencyToCents(value) {
  if (typeof value === "number") {
    return Math.round(value * 100);
  }

  const normalized = String(value || "")
    .trim()
    .replace(/[^\d,.-]/g, "")
    .replace(/\./g, "")
    .replace(",", ".");

  const numeric = Number.parseFloat(normalized);
  return Number.isFinite(numeric) ? Math.round(numeric * 100) : 0;
}

export function formatDate(value) {
  if (!value) {
    return "-";
  }

  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  return new Intl.DateTimeFormat("pt-BR").format(date);
}

export function getCurrentYear() {
  return new Date().getFullYear();
}

export function getCurrentMonth() {
  return new Date().getMonth() + 1;
}

export function makeId(prefix) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function todayIso() {
  const date = new Date();
  const offsetDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return offsetDate.toISOString().slice(0, 10);
}

export function monthFromDate(value) {
  const [, month] = String(value).split("-").map(Number);
  return Number.isFinite(month) ? month : getCurrentMonth();
}

export function yearFromDate(value) {
  const [year] = String(value).split("-").map(Number);
  return Number.isFinite(year) ? year : getCurrentYear();
}

export function addMonthsToDate(value, amount) {
  const [year, month, day] = String(value).split("-").map(Number);
  const date = new Date(year, month - 1 + amount, day || 1);
  const offsetDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return offsetDate.toISOString().slice(0, 10);
}

export function toBoolean(value) {
  return value === true || value === "true" || value === "1" || value === 1;
}
