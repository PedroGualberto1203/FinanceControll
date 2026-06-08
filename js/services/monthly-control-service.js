import { getMonthlySummary, sumCents } from "./finance-service.js";

export const MONTHLY_CONTROL_SOURCES = ["credito", "pix"];

export function getMonthlyControl(data, year, month) {
  const selectedYear = Number(year);
  const selectedMonth = Number(month);
  const summary = getMonthlySummary(data, selectedYear)[selectedMonth - 1] || {};
  const rows = getMonthlyControlRows(data, selectedYear, selectedMonth);
  const spentBySource = {
    credito: sumCents(rows.filter((row) => row.fonte === "credito")),
    pix: sumCents(rows.filter((row) => row.fonte === "pix"))
  };
  const baseBySource = {
    credito: Number(summary.cardCreditAvailable || 0),
    pix: Number(summary.pixBalance || 0)
  };
  const remainingBySource = {
    credito: baseBySource.credito - spentBySource.credito,
    pix: baseBySource.pix - spentBySource.pix
  };

  return {
    year: selectedYear,
    month: selectedMonth,
    rows,
    baseBySource,
    spentBySource,
    remainingBySource,
    totalBase: baseBySource.credito + baseBySource.pix,
    totalSpent: spentBySource.credito + spentBySource.pix,
    totalRemaining: remainingBySource.credito + remainingBySource.pix
  };
}

export function getMonthlyControlRows(data, year, month) {
  return (data.controle_mensal_gastos || []).filter((row) => {
    const period = getMonthlyControlPeriod(row);
    return period.year === Number(year) && period.month === Number(month);
  });
}

export function isMonthlyControlCategoryUsed(data, categoryId) {
  return (data.controle_mensal_gastos || []).some((row) => row.categoria_id === categoryId);
}

function getMonthlyControlPeriod(row) {
  const fromDate = getPeriodFromDate(row.data_gasto);
  if (fromDate) {
    return fromDate;
  }

  return {
    year: Number(row.ano),
    month: Number(row.mes)
  };
}

function getPeriodFromDate(value) {
  const [year, month] = String(value || "").split("-").map(Number);
  if (!Number.isFinite(year) || !Number.isFinite(month) || month < 1 || month > 12) {
    return null;
  }

  return { year, month };
}
