import assert from "node:assert/strict";
import test from "node:test";

import { getMonthlySummary } from "../js/services/finance-service.js";
import { reconcileRecurringPendingExpenses } from "../js/services/recurring-service.js";
import { reclassifyPendingManualCategoryExpenses } from "../js/services/category-service.js";

test("monthly summary separates card credit, pix balance, and general credit", () => {
  const summary = getMonthlySummary(
    {
      entradas: [
        { ano: 2026, mes: 6, tipo: "fixa", valor_centavos: 300000 },
        { ano: 2026, mes: 6, tipo: "variavel", valor_centavos: 50000 }
      ],
      gastos: [
        { ano: 2026, mes: 6, tipo_gasto: "fixa", valor_centavos: 100000 },
        { ano: 2026, mes: 6, tipo_gasto: "variavel", valor_centavos: 20000 },
        { ano: 2026, mes: 6, tipo_gasto: "parcelada", valor_centavos: 30000 }
      ]
    },
    2026
  );

  const june = summary[5];

  assert.equal(june.fixedIncome, 300000);
  assert.equal(june.variableIncome, 50000);
  assert.equal(june.outgoing, 150000);
  assert.equal(june.cardCreditAvailable, 150000);
  assert.equal(june.pixBalance, 50000);
  assert.equal(june.generalCreditAvailable, 200000);
  assert.equal(june.creditAvailable, 200000);
});

test("recurring edit preserves paid expenses and recalculates pending generated expenses", () => {
  const recurring = {
    id: "rec-1",
    descricao: "Internet nova",
    categoria_id: "cat-1",
    destino_id: "dst-1",
    valor_centavos: 20000,
    tipo_pagamento: "credito",
    dia_pagamento: 10,
    mes_inicio: 202606,
    mes_fim: 202608,
    tipo_recorrencia: "fixa",
    parcelas_total: 1,
    ativo: "true",
    criado_em: "2026-01-01"
  };
  const gastos = [
    {
      id: "paid-jun",
      grupo_id: "rec-1",
      descricao: "Internet antiga",
      categoria_id: "cat-1",
      data_pagamento: "2026-06-05",
      ano: 2026,
      mes: 6,
      destino_id: "dst-1",
      valor_centavos: 10000,
      tipo_pagamento: "pix",
      tipo_gasto: "fixa",
      parcela_atual: 1,
      parcelas_total: 1,
      criado_em: "2026-01-01",
      pago: "true",
      atualizado_em: "2026-01-01"
    },
    {
      id: "pending-jul",
      grupo_id: "rec-1",
      descricao: "Internet antiga",
      categoria_id: "cat-1",
      data_pagamento: "2026-07-05",
      ano: 2026,
      mes: 7,
      destino_id: "dst-1",
      valor_centavos: 10000,
      tipo_pagamento: "pix",
      tipo_gasto: "fixa",
      parcela_atual: 1,
      parcelas_total: 1,
      criado_em: "2026-01-01",
      pago: "false",
      atualizado_em: "2026-01-01"
    },
    {
      id: "pending-sep",
      grupo_id: "rec-1",
      descricao: "Internet antiga",
      categoria_id: "cat-1",
      data_pagamento: "2026-09-05",
      ano: 2026,
      mes: 9,
      destino_id: "dst-1",
      valor_centavos: 10000,
      tipo_pagamento: "pix",
      tipo_gasto: "fixa",
      parcela_atual: 1,
      parcelas_total: 1,
      criado_em: "2026-01-01",
      pago: "false",
      atualizado_em: "2026-01-01"
    },
    {
      id: "manual",
      grupo_id: "",
      descricao: "Mercado",
      categoria_id: "cat-2",
      ano: 2026,
      mes: 7,
      valor_centavos: 30000,
      tipo_gasto: "variavel",
      pago: "false"
    }
  ];

  const next = reconcileRecurringPendingExpenses(
    {
      categorias: [{ id: "cat-1", tipo: "fixa", ativo: "true" }],
      gastos
    },
    recurring
  );

  assert.equal(next.find((row) => row.id === "paid-jun").valor_centavos, 10000);
  assert.equal(next.filter((row) => row.grupo_id === "rec-1" && Number(row.mes) === 6).length, 1);
  assert.equal(next.find((row) => row.id === "pending-jul").valor_centavos, 20000);
  assert.equal(next.find((row) => row.id === "pending-jul").descricao, "Internet nova");
  assert.ok(next.some((row) => row.grupo_id === "rec-1" && Number(row.mes) === 8 && row.valor_centavos === 20000));
  assert.ok(!next.some((row) => row.id === "pending-sep"));
  assert.ok(next.some((row) => row.id === "manual"));
});

test("category type edit reclassifies only pending manual non-installment expenses", () => {
  const next = reclassifyPendingManualCategoryExpenses(
    [
      { id: "manual-pending", categoria_id: "cat-1", grupo_id: "", tipo_gasto: "variavel", pago: "false" },
      { id: "manual-paid", categoria_id: "cat-1", grupo_id: "", tipo_gasto: "variavel", pago: "true" },
      { id: "generated-pending", categoria_id: "cat-1", grupo_id: "rec-1", tipo_gasto: "variavel", pago: "false" },
      { id: "installment-pending", categoria_id: "cat-1", grupo_id: "", tipo_gasto: "parcelada", pago: "false" },
      { id: "other-category", categoria_id: "cat-2", grupo_id: "", tipo_gasto: "variavel", pago: "false" }
    ],
    "cat-1",
    "fixa"
  );

  assert.equal(next.find((row) => row.id === "manual-pending").tipo_gasto, "fixa");
  assert.equal(next.find((row) => row.id === "manual-paid").tipo_gasto, "variavel");
  assert.equal(next.find((row) => row.id === "generated-pending").tipo_gasto, "variavel");
  assert.equal(next.find((row) => row.id === "installment-pending").tipo_gasto, "parcelada");
  assert.equal(next.find((row) => row.id === "other-category").tipo_gasto, "variavel");
});
