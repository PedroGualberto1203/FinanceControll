import { MONTHS } from "../ui/formatters.js";

export function getProjection(data, year) {
  return MONTHS.map((monthName, index) => {
    const month = index + 1;
    const installments = (data.gastos || []).filter((row) => Number(row.ano) === year && Number(row.mes) === month && row.tipo_gasto === "parcelada");
    const fixedRows = (data.gastos || []).filter((row) => Number(row.ano) === year && Number(row.mes) === month && row.tipo_gasto === "fixa");
    const total = [...installments, ...fixedRows].reduce((sum, row) => sum + Number(row.valor_centavos || 0), 0);

    return {
      month,
      monthName,
      recurring: [],
      installments,
      fixedRows,
      total
    };
  });
}
