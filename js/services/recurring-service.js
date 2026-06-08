import { MONTHS, makeId, todayIso, toBoolean } from "../ui/formatters.js";

export function synchronizeRecurringExpenses(data) {
  const existingExpenses = data.gastos || [];
  const categories = toLookup(data.categorias || []);
  const missingExpenses = [];

  (data.recorrencias_fixas || []).forEach((row) => {
    const recurring = normalizeRecurring(row, categories);
    if (!recurring) {
      return;
    }

    buildRecurringExpenses(recurring).forEach((expense) => {
      if (!hasGeneratedExpense(existingExpenses, missingExpenses, expense)) {
        missingExpenses.push(expense);
      }
    });
  });

  return {
    added: missingExpenses.length,
    gastos: missingExpenses.length ? [...existingExpenses, ...missingExpenses] : existingExpenses
  };
}

export function reconcileRecurringPendingExpenses(data, recurring) {
  const existingExpenses = data.gastos || [];
  const categories = toLookup(data.categorias || []);
  const normalized = normalizeRecurring(recurring, categories);
  const paidPeriods = new Set(
    existingExpenses
      .filter((row) => row.grupo_id === recurring.id && toBoolean(row.pago))
      .map(periodExpenseKey)
  );
  const pendingByGeneratedKey = new Map(
    existingExpenses
      .filter((row) => row.grupo_id === recurring.id && !toBoolean(row.pago))
      .map((row) => [generatedExpenseKey(row), row])
  );
  const preservedExpenses = existingExpenses.filter((row) => {
    return row.grupo_id !== recurring.id || toBoolean(row.pago);
  });

  if (!normalized) {
    return preservedExpenses;
  }

  const nextExpenses = buildRecurringExpenses(normalized)
    .filter((expense) => !paidPeriods.has(periodExpenseKey(expense)))
    .map((expense) => {
      const previous = pendingByGeneratedKey.get(generatedExpenseKey(expense));

      return {
        ...expense,
        id: previous?.id || expense.id,
        criado_em: previous?.criado_em || expense.criado_em,
        pago: "false",
        atualizado_em: todayIso()
      };
    });

  return [...preservedExpenses, ...nextExpenses];
}

export function buildRecurringExpenses(recurring) {
  const type = getRecurringType(recurring);
  const periods = getPeriodsBetween(recurring.mes_inicio, recurring.mes_fim);
  const totalInstallments = type === "parcelada" ? Number(recurring.parcelas_total) || periods.length : 1;
  const createdAt = todayIso();

  return periods.map((period, index) => {
    const { year, month } = splitPeriod(period);

    return {
      id: makeId("gas"),
      grupo_id: recurring.id,
      descricao: recurring.descricao,
      categoria_id: recurring.categoria_id,
      data_pagamento: periodToDate(period, recurring.dia_pagamento),
      ano: year,
      mes: month,
      destino_id: recurring.destino_id,
      valor_centavos: recurring.valor_centavos,
      tipo_pagamento: recurring.tipo_pagamento,
      tipo_gasto: type,
      parcela_atual: type === "parcelada" ? index + 1 : 1,
      parcelas_total: totalInstallments,
      criado_em: createdAt,
      pago: "false",
      atualizado_em: createdAt
    };
  });
}

export function parseMonthPeriod(value, label) {
  const [year, month] = String(value || "").split("-").map(Number);
  if (!Number.isFinite(year) || !Number.isFinite(month) || month < 1 || month > 12) {
    throw new Error(`${label} precisa ter mes e ano validos.`);
  }

  return year * 100 + month;
}

export function addMonthsToPeriod(period, amount) {
  const { year, month } = splitPeriod(period);
  const zeroBasedMonth = year * 12 + month - 1 + amount;
  const nextYear = Math.floor(zeroBasedMonth / 12);
  const nextMonth = (zeroBasedMonth % 12) + 1;
  return nextYear * 100 + nextMonth;
}

export function getPeriodsBetween(startPeriod, endPeriod) {
  const periods = [];
  let current = Number(startPeriod);
  const end = Number(endPeriod);

  while (current <= end) {
    periods.push(current);
    current = addMonthsToPeriod(current, 1);
  }

  return periods;
}

export function splitPeriod(period) {
  const numeric = Number(period);
  return {
    year: Math.floor(numeric / 100),
    month: numeric % 100
  };
}

export function getRecurringType(row) {
  return row.tipo_recorrencia === "parcelada" || Number(row.parcelas_total) > 1 ? "parcelada" : "fixa";
}

export function formatPeriod(period) {
  const { year, month } = splitPeriod(period);
  if (!year || month < 1 || month > 12) {
    return "-";
  }

  return `${MONTHS[month - 1].slice(0, 3)}/${year}`;
}

function periodToDate(period, day) {
  const { year, month } = splitPeriod(period);
  const safeDay = Math.min(Math.max(Number(day) || 1, 1), daysInMonth(year, month));
  return `${year}-${String(month).padStart(2, "0")}-${String(safeDay).padStart(2, "0")}`;
}

function daysInMonth(year, month) {
  return new Date(year, month, 0).getDate();
}

function normalizeRecurring(row, categories) {
  if (!row?.id || !row?.descricao || !toBoolean(row.ativo)) {
    return null;
  }

  const start = Number(row.mes_inicio);
  if (!isValidPeriod(start)) {
    return null;
  }

  const category = categories.get(row.categoria_id);
  const categoryInstallments = Number(category?.parcelas_padrao) || 0;
  const isInstallment = row.tipo_recorrencia === "parcelada" || Number(row.parcelas_total) > 1 || category?.tipo === "parcelada";
  const installments = isInstallment ? Math.max(1, Number(row.parcelas_total) || categoryInstallments) : 1;
  const end = isInstallment ? addMonthsToPeriod(start, installments - 1) : Number(row.mes_fim);

  if (!isValidPeriod(end) || end < start) {
    return null;
  }

  return {
    ...row,
    mes_inicio: start,
    mes_fim: end,
    tipo_recorrencia: isInstallment ? "parcelada" : "fixa",
    parcelas_total: installments
  };
}

function hasGeneratedExpense(existingExpenses, pendingExpenses, expense) {
  return [...existingExpenses, ...pendingExpenses].some((row) => {
    if (row.grupo_id !== expense.grupo_id || row.tipo_gasto !== expense.tipo_gasto) {
      return false;
    }

    if (expense.tipo_gasto === "parcelada") {
      return Number(row.parcela_atual) === Number(expense.parcela_atual);
    }

    return Number(row.ano) === Number(expense.ano) && Number(row.mes) === Number(expense.mes);
  });
}

function generatedExpenseKey(row) {
  if (row.tipo_gasto === "parcelada") {
    return `parcelada:${Number(row.parcela_atual) || 1}`;
  }

  return `fixa:${Number(row.ano) || 0}:${Number(row.mes) || 0}`;
}

function periodExpenseKey(row) {
  return `${Number(row.ano) || 0}:${Number(row.mes) || 0}`;
}

function isValidPeriod(period) {
  const { year, month } = splitPeriod(period);
  return year > 0 && month >= 1 && month <= 12;
}

function toLookup(rows) {
  return new Map((rows || []).map((row) => [row.id, row]));
}
