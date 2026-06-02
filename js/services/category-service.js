import { todayIso, toBoolean } from "../ui/formatters.js";

export function reclassifyPendingManualCategoryExpenses(expenses = [], categoryId, type) {
  const nextType = type === "fixa" ? "fixa" : "variavel";

  return (expenses || []).map((row) => {
    const isSameCategory = row.categoria_id === categoryId;
    const isManualExpense = !String(row.grupo_id || "").trim();
    const isPending = !toBoolean(row.pago);
    const isSimpleExpense = row.tipo_gasto !== "parcelada";

    if (!isSameCategory || !isManualExpense || !isPending || !isSimpleExpense || row.tipo_gasto === nextType) {
      return row;
    }

    return {
      ...row,
      tipo_gasto: nextType,
      atualizado_em: todayIso()
    };
  });
}
