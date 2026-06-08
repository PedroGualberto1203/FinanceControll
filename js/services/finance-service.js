import { MONTHS } from "../ui/formatters.js";

export function getMonthlySummary(data, year) {
  return MONTHS.map((monthName, index) => {
    const month = index + 1;
    const entries = (data.entradas || []).filter((row) => Number(row.ano) === year && Number(row.mes) === month);
    const expenses = (data.gastos || []).filter((row) => Number(row.ano) === year && Number(row.mes) === month);

    const income = sumCents(entries);
    const fixedIncome = sumCents(entries.filter((row) => row.tipo === "fixa"));
    const variableIncome = sumCents(entries.filter((row) => row.tipo === "variavel"));
    const fixed = sumCents(expenses.filter((row) => row.tipo_gasto === "fixa"));
    const variable = sumCents(expenses.filter((row) => row.tipo_gasto === "variavel"));
    const installments = sumCents(expenses.filter((row) => row.tipo_gasto === "parcelada"));
    const outgoing = fixed + variable + installments;
    const cardCreditAvailable = fixedIncome - outgoing;
    const pixBalance = variableIncome;
    const generalCreditAvailable = income - outgoing;

    return {
      month,
      monthName,
      income,
      fixedIncome,
      variableIncome,
      fixed,
      variable,
      installments,
      outgoing,
      cardCreditAvailable,
      pixBalance,
      generalCreditAvailable,
      netCash: generalCreditAvailable,
      creditAvailable: generalCreditAvailable
    };
  });
}

export function getAnnualTotals(summary) {
  return summary.reduce(
    (totals, month) => {
      totals.income += month.income;
      totals.outgoing += month.outgoing;
      totals.netCash += month.netCash;
      totals.creditAvailable = month.creditAvailable;
      return totals;
    },
    { income: 0, outgoing: 0, netCash: 0, creditAvailable: 0 }
  );
}

export function sumCents(rows) {
  return (rows || []).reduce((sum, row) => sum + Number(row.valor_centavos || 0), 0);
}
