export const CSV_SCHEMAS = {
  entradas: {
    file: "entradas.csv",
    columns: ["id", "ano", "mes", "descricao", "tipo", "valor_centavos", "criado_em", "atualizado_em"],
    numeric: ["ano", "mes", "valor_centavos"]
  },
  gastos: {
    file: "gastos.csv",
    columns: [
      "id",
      "grupo_id",
      "descricao",
      "categoria_id",
      "data_pagamento",
      "ano",
      "mes",
      "destino_id",
      "valor_centavos",
      "tipo_pagamento",
      "tipo_gasto",
      "parcela_atual",
      "parcelas_total",
      "criado_em",
      "pago",
      "atualizado_em"
    ],
    numeric: ["ano", "mes", "valor_centavos", "parcela_atual", "parcelas_total"]
  },
  categorias: {
    file: "categorias.csv",
    columns: ["id", "nome", "tipo", "parcelas_padrao", "ativo", "criado_em"],
    numeric: ["parcelas_padrao"]
  },
  destinos: {
    file: "destinos.csv",
    columns: ["id", "nome", "tipo", "limite_centavos", "ativo", "criado_em"],
    numeric: ["limite_centavos"]
  },
  recorrencias_fixas: {
    file: "recorrencias_fixas.csv",
    columns: [
      "id",
      "descricao",
      "categoria_id",
      "destino_id",
      "valor_centavos",
      "tipo_pagamento",
      "dia_pagamento",
      "mes_inicio",
      "mes_fim",
      "tipo_recorrencia",
      "parcelas_total",
      "ativo",
      "criado_em"
    ],
    numeric: ["valor_centavos", "dia_pagamento", "mes_inicio", "mes_fim", "parcelas_total"]
  }
};

export const COLLECTIONS = Object.keys(CSV_SCHEMAS);
