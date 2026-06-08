import { parseCurrencyToCents } from "../ui/formatters.js";

export function requireText(value, label) {
  if (!String(value || "").trim()) {
    throw new Error(`${label} e obrigatorio.`);
  }
}

export function requireMoney(value, label = "Valor") {
  const cents = parseCurrencyToCents(value);
  if (cents <= 0) {
    throw new Error(`${label} precisa ser maior que zero.`);
  }
  return cents;
}

export function requireSelect(value, label) {
  if (!String(value || "").trim()) {
    throw new Error(`${label} e obrigatorio.`);
  }
}

export function clampParcelas(value) {
  const parcelas = Number(value) || 1;
  return Math.min(120, Math.max(1, parcelas));
}
