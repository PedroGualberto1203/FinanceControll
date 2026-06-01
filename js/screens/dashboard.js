import { appState } from "../state.js";
import { getAnnualTotals, getMonthlySummary, sumCents } from "../services/finance-service.js";
import { getProjection } from "../services/projection-service.js";
import {
  addMonthsToPeriod,
  formatPeriod,
  getRecurringType,
  parseMonthPeriod
} from "../services/recurring-service.js";
import { clampParcelas, requireMoney, requireSelect, requireText } from "../services/validation-service.js";
import {
  MONTHS,
  formatCurrency,
  getCurrentMonth,
  getCurrentYear,
  makeId,
  todayIso,
  toBoolean
} from "../ui/formatters.js";
import {
  emptyState,
  escapeHtml,
  hydrateIcons,
  metricCard,
  monthOptions,
  rowAction,
  summaryLine,
  tag,
  yearOptions
} from "../ui/components.js";
import { notify } from "../ui/notifications.js";

let dashboardBound = false;
const CATALOG_VISIBLE_LIMIT = 5;
const expandedCatalogs = {
  categorias: false,
  destinos: false
};

export function renderDashboard(root) {
  const { year } = appState.getFilters();
  const data = appState.getData();

  setupStaticControls(root, year);
  renderOverview(data, year);
  renderIncome(data, year);
  renderCatalogs(data);
  renderRecurring(data);
  renderMonthlySummary(data, year);
  renderProjection(data, year);
  bindDashboardEvents(root);
  hydrateIcons(root);
}

function setupStaticControls(root, year) {
  const yearSelect = root.querySelector("#dashboard-year");
  const entryMonthSelect = root.querySelector('#entry-form [name="mes"]');

  if (yearSelect) {
    yearSelect.innerHTML = yearOptions(year);
    yearSelect.value = String(year);
  }

  if (entryMonthSelect) {
    entryMonthSelect.innerHTML = monthOptions(getCurrentMonth());
  }

  populateCategorySelect(root.querySelector('#recurring-form [name="categoria_id"]'), appState.getData().categorias);
  populateDestinationSelect(root.querySelector('#recurring-form [name="destino_id"]'), appState.getData().destinos);
  setupRecurringForm(root, year);
}

function setupRecurringForm(root, year) {
  const form = root.querySelector("#recurring-form");
  if (!form) {
    return;
  }

  setDefaultRecurringPeriods(form, year);
  syncRecurringTypeFields(form);
}

function renderOverview(data, year) {
  const node = document.getElementById("dashboard-overview");
  const summary = getMonthlySummary(data, year);
  const totals = getAnnualTotals(summary);
  const currentMonthSummary = summary[getCurrentMonth() - 1] || summary[0];

  node.innerHTML = [
    metricCard("Renda anual prevista", formatCurrency(totals.income), `${year}`, "blue"),
    metricCard("Saidas anuais", formatCurrency(totals.outgoing), "Fixas, variaveis e parcelas", "yellow"),
    metricCard("Disponivel anual", formatCurrency(totals.netCash), "Entradas menos saidas", totals.netCash >= 0 ? "green" : "red"),
    metricCard("Credito disponivel no mes", formatCurrency(currentMonthSummary.creditAvailable), MONTHS[getCurrentMonth() - 1], "blue")
  ].join("");
}

function renderIncome(data, year) {
  const node = document.getElementById("income-by-month");
  const rows = data.entradas || [];

  node.innerHTML = MONTHS.map((monthName, index) => {
    const month = index + 1;
    const monthRows = rows.filter((row) => Number(row.ano) === year && Number(row.mes) === month);
    const total = sumCents(monthRows);
    const details = monthRows.length
      ? monthRows
          .map(
            (row) => `
            <div class="data-row">
              <div>
                <div class="data-row-title">${escapeHtml(row.descricao)}</div>
                <div class="row-subtitle">${escapeHtml(row.tipo)} - ${formatCurrency(row.valor_centavos)}</div>
              </div>
              ${tag(MONTHS[month - 1].slice(0, 3), "blue")}
              ${rowAction(row.id, "entradas")}
            </div>
          `
          )
          .join("")
      : emptyState("Sem entradas neste mes.");

    return `
      <article class="month-card">
        <header>
          <h4>${monthName}</h4>
          ${tag(formatCurrency(total), total > 0 ? "green" : "")}
        </header>
        <div class="data-list">${details}</div>
      </article>
    `;
  }).join("");
}

function renderCatalogs(data) {
  const categoryList = document.getElementById("category-list");
  const destinationList = document.getElementById("destination-list");
  const categoryControls = document.getElementById("category-list-controls");
  const destinationControls = document.getElementById("destination-list-controls");
  const categories = data.categorias || [];
  const destinations = data.destinos || [];

  categoryList.innerHTML = renderExpandableList(
    categories,
    "categorias",
    "Cadastre categorias para liberar os selects.",
    renderCategoryRow
  );
  if (categoryControls) {
    categoryControls.innerHTML = renderCatalogControls(categories, "categorias", "category-list");
  }

  destinationList.innerHTML = renderExpandableList(
    destinations,
    "destinos",
    "Cadastre destinos para registrar gastos.",
    renderDestinationRow
  );
  if (destinationControls) {
    destinationControls.innerHTML = renderCatalogControls(destinations, "destinos", "destination-list");
  }
}

function renderExpandableList(rows, collection, emptyMessage, renderRow) {
  if (!rows.length) {
    return emptyState(emptyMessage);
  }

  const expanded = Boolean(expandedCatalogs[collection]);
  const visibleRows = expanded ? rows : rows.slice(0, CATALOG_VISIBLE_LIMIT);

  return visibleRows.map(renderRow).join("");
}

function renderCatalogControls(rows, collection, controlsId) {
  if (!rows.length) {
    return "";
  }

  const expanded = Boolean(expandedCatalogs[collection]);
  const visibleTotal = expanded ? rows.length : Math.min(rows.length, CATALOG_VISIBLE_LIMIT);
  const count = `<span class="catalog-count">${visibleTotal} de ${rows.length}</span>`;
  const toggle = rows.length > CATALOG_VISIBLE_LIMIT ? renderListToggle(collection, controlsId, expanded) : "";

  return `${count}${toggle}`;
}

function renderCategoryRow(category) {
  const legacyInstallments = category.tipo === "parcelada" ? ` - ${category.parcelas_padrao}x` : "";

  return `
    <div class="data-row">
      <div>
        <div class="data-row-title">${escapeHtml(category.nome)}</div>
        <div class="row-subtitle">${escapeHtml(category.tipo)}${legacyInstallments}</div>
      </div>
      ${tag(toBoolean(category.ativo) ? "Ativa" : "Inativa", toBoolean(category.ativo) ? "green" : "red")}
      ${rowAction(category.id, "categorias")}
    </div>
  `;
}

function renderDestinationRow(destination) {
  return `
    <div class="data-row">
      <div>
        <div class="data-row-title">${escapeHtml(destination.nome)}</div>
        <div class="row-subtitle">${escapeHtml(destination.tipo)}</div>
      </div>
      ${tag(toBoolean(destination.ativo) ? "Ativo" : "Inativo", toBoolean(destination.ativo) ? "green" : "red")}
      ${rowAction(destination.id, "destinos")}
    </div>
  `;
}

function renderListToggle(collection, controlsId, expanded) {
  return `
    <button
      class="secondary-button list-toggle"
      type="button"
      data-catalog-toggle="${escapeHtml(collection)}"
      aria-controls="${escapeHtml(controlsId)}"
      aria-expanded="${expanded}"
    >
      <span data-icon="${expanded ? "chevron-up" : "chevron-down"}"></span>
      <span>${expanded ? "Ver menos" : "Ver mais"}</span>
    </button>
  `;
}

function renderRecurring(data) {
  const node = document.getElementById("recurring-list");
  const rows = data.recorrencias_fixas || [];
  const categories = toLookup(data.categorias || []);
  const destinations = toLookup(data.destinos || []);

  node.innerHTML = rows.length
    ? rows
        .map((row) => {
          const category = categories.get(row.categoria_id)?.nome || "Sem categoria";
          const destination = destinations.get(row.destino_id)?.nome || "Sem destino";
          const type = getRecurringType(row);
          const period = type === "parcelada"
            ? `${formatPeriod(row.mes_inicio)} - ${Number(row.parcelas_total) || 1}x`
            : `${formatPeriod(row.mes_inicio)} a ${formatPeriod(row.mes_fim)}`;
          return `
            <div class="data-row">
              <div>
                <div class="data-row-title">${escapeHtml(row.descricao)}</div>
                <div class="row-subtitle">${escapeHtml(type)} - ${escapeHtml(category)} - ${escapeHtml(destination)} - dia ${row.dia_pagamento} - ${escapeHtml(period)}</div>
              </div>
              ${tag(formatCurrency(row.valor_centavos), row.tipo_pagamento === "credito" ? "blue" : "yellow")}
              ${rowAction(row.id, "recorrencias_fixas")}
            </div>
          `;
        })
        .join("")
    : emptyState("Sem gastos recorrentes.");
}

function renderMonthlySummary(data, year) {
  const node = document.getElementById("monthly-summary");
  const summary = getMonthlySummary(data, year);

  node.innerHTML = summary
    .map(
      (month) => `
        <article class="month-card">
          <header>
            <h4>${month.monthName}</h4>
            ${tag(month.netCash >= 0 ? "Positivo" : "Atencao", month.netCash >= 0 ? "green" : "red")}
          </header>
          ${summaryLine("Renda total", month.income)}
          ${summaryLine("Saidas fixas", month.fixed)}
          ${summaryLine("Saidas variaveis", month.variable)}
          ${summaryLine("Parcelados", month.installments)}
          ${summaryLine("Saida geral", month.outgoing)}
          ${summaryLine("Credito disponivel", month.creditAvailable, { net: true })}
        </article>
      `
    )
    .join("");
}

function renderProjection(data, year) {
  const node = document.getElementById("projection-grid");
  const projection = getProjection(data, year);
  const categories = toLookup(data.categorias || []);

  node.innerHTML = projection
    .map((month) => {
      const items = [
        ...month.recurring.map((row) => ({ ...row, label: "Fixo" })),
        ...month.fixedRows.map((row) => ({ ...row, label: "Fixo lancado" })),
        ...month.installments.map((row) => ({ ...row, label: `${row.parcela_atual}/${row.parcelas_total}` }))
      ];

      return `
        <article class="projection-card">
          <header>
            <h4>${month.monthName}</h4>
            ${tag(formatCurrency(month.total), "yellow")}
          </header>
          <div class="projection-items">
            ${
              items.length
                ? items
                    .map((item) => {
                      const category = categories.get(item.categoria_id)?.nome || item.label;
                      const installment = item.tipo_gasto === "parcelada" ? ` - ${item.parcela_atual}/${item.parcelas_total}` : "";
                      return `
                        <div class="projection-item">
                          <span>${escapeHtml(item.descricao)} - ${escapeHtml(category)}${escapeHtml(installment)}</span>
                          <strong>${formatCurrency(item.valor_centavos)}</strong>
                        </div>
                      `;
                    })
                    .join("")
                : emptyState("Nada previsto.")
            }
          </div>
        </article>
      `;
    })
    .join("");
}

function bindDashboardEvents(root) {
  if (dashboardBound) {
    return;
  }

  dashboardBound = true;

  root.addEventListener("change", (event) => {
    if (!root.querySelector('[data-screen="dashboard"]')) {
      return;
    }

    if (event.target.id === "dashboard-year") {
      appState.setFilter("year", event.target.value);
    }

    if (event.target.name === "tipo_recorrencia") {
      syncRecurringTypeFields(event.target.form);
    }
  });

  root.addEventListener("submit", async (event) => {
    if (!root.querySelector('[data-screen="dashboard"]')) {
      return;
    }

    event.preventDefault();
    const repository = appState.getRepository();
    const form = event.target;

    try {
      if (form.id === "entry-form") {
        await repository.append("entradas", buildEntry(form));
        form.reset();
        form.elements.mes.value = String(getCurrentMonth());
        notify("Entrada adicionada");
      }

      if (form.id === "category-form") {
        await repository.append("categorias", buildCategory(form));
        form.reset();
        notify("Categoria adicionada");
      }

      if (form.id === "destination-form") {
        await repository.append("destinos", buildDestination(form));
        form.reset();
        notify("Destino adicionado");
      }

      if (form.id === "recurring-form") {
        const recurring = buildRecurring(form);
        await repository.append("recorrencias_fixas", recurring);
        const { added } = await repository.syncRecurringGeneratedExpenses();
        form.reset();
        form.elements.tipo_recorrencia.value = "fixa";
        form.elements.dia_pagamento.value = "1";
        form.elements.parcelas_total.value = "1";
        setDefaultRecurringPeriods(form, appState.getFilters().year || getCurrentYear(), true);
        syncRecurringTypeFields(form);
        notify(getRecurringType(recurring) === "parcelada" ? `Parcelado adicionado: ${added} parcelas` : `Fixo adicionado: ${added} meses`);
      }
    } catch (error) {
      notify("Verifique o formulario", error.message, "error");
    }
  });

  root.addEventListener("click", async (event) => {
    if (!root.querySelector('[data-screen="dashboard"]')) {
      return;
    }

    const toggle = event.target.closest("[data-catalog-toggle]");
    if (toggle) {
      const collection = toggle.dataset.catalogToggle;
      expandedCatalogs[collection] = !expandedCatalogs[collection];
      renderCatalogs(appState.getData());
      hydrateIcons(root);
      return;
    }

    const button = event.target.closest("[data-delete-id]");
    if (!button) {
      return;
    }

    const repository = appState.getRepository();
    if (button.dataset.deleteCollection === "recorrencias_fixas") {
      const generatedExpenses = appState.getData().gastos || [];
      const remainingExpenses = generatedExpenses.filter((row) => {
        return row.grupo_id !== button.dataset.deleteId || toBoolean(row.pago);
      });
      const removedExpenses = generatedExpenses.length - remainingExpenses.length;

      await repository.remove(button.dataset.deleteCollection, button.dataset.deleteId);
      if (removedExpenses) {
        await repository.replace("gastos", remainingExpenses);
      }
      notify(removedExpenses ? `Registro removido e ${removedExpenses} lancamentos pendentes limpos` : "Registro removido");
      return;
    }

    await repository.remove(button.dataset.deleteCollection, button.dataset.deleteId);
    notify("Registro removido");
  });
}

function buildEntry(form) {
  const data = new FormData(form);
  requireText(data.get("descricao"), "Descricao");
  const cents = requireMoney(data.get("valor"));

  return {
    id: makeId("ent"),
    ano: appState.getFilters().year || getCurrentYear(),
    mes: Number(data.get("mes")),
    descricao: data.get("descricao").trim(),
    tipo: data.get("tipo"),
    valor_centavos: cents,
    criado_em: todayIso(),
    atualizado_em: todayIso()
  };
}

function buildCategory(form) {
  const data = new FormData(form);
  requireText(data.get("nome"), "Nome");
  const tipo = data.get("tipo");

  return {
    id: makeId("cat"),
    nome: data.get("nome").trim(),
    tipo,
    parcelas_padrao: 1,
    ativo: "true",
    criado_em: todayIso()
  };
}

function buildDestination(form) {
  const data = new FormData(form);
  requireText(data.get("nome"), "Nome");

  return {
    id: makeId("dst"),
    nome: data.get("nome").trim(),
    tipo: data.get("tipo"),
    limite_centavos: 0,
    ativo: "true",
    criado_em: todayIso()
  };
}

function buildRecurring(form) {
  const data = new FormData(form);
  requireText(data.get("descricao"), "Descricao");
  requireSelect(data.get("categoria_id"), "Categoria");
  requireSelect(data.get("destino_id"), "Destino");
  const cents = requireMoney(data.get("valor"));
  const type = data.get("tipo_recorrencia") === "parcelada" ? "parcelada" : "fixa";
  const startPeriod = parseMonthPeriod(data.get("mes_inicio"), "Inicio");
  const installments = type === "parcelada" ? clampParcelas(data.get("parcelas_total")) : 1;
  const endPeriod = type === "parcelada"
    ? addMonthsToPeriod(startPeriod, installments - 1)
    : parseMonthPeriod(data.get("mes_fim"), "Fim");

  if (endPeriod < startPeriod) {
    throw new Error("Fim precisa ser igual ou posterior ao inicio.");
  }

  return {
    id: makeId(type === "parcelada" ? "par" : "fix"),
    descricao: data.get("descricao").trim(),
    categoria_id: data.get("categoria_id"),
    destino_id: data.get("destino_id"),
    valor_centavos: cents,
    tipo_pagamento: data.get("tipo_pagamento"),
    dia_pagamento: Math.min(31, Math.max(1, Number(data.get("dia_pagamento")) || 1)),
    mes_inicio: startPeriod,
    mes_fim: endPeriod,
    tipo_recorrencia: type,
    parcelas_total: installments,
    ativo: "true",
    criado_em: todayIso()
  };
}

function setDefaultRecurringPeriods(form, year, force = false) {
  const selectedYear = Number(year) || getCurrentYear();
  const start = `${selectedYear}-01`;
  const end = `${selectedYear}-12`;

  if (force || !form.elements.mes_inicio.value) {
    form.elements.mes_inicio.value = start;
  }

  if (force || !form.elements.mes_fim.value) {
    form.elements.mes_fim.value = end;
  }
}

function syncRecurringTypeFields(form) {
  const isInstallment = form.elements.tipo_recorrencia.value === "parcelada";
  const valueLabel = form.querySelector("[data-recurring-value-label]");
  const badge = document.getElementById("recurring-mode-badge");

  form.querySelectorAll("[data-recurring-fixed]").forEach((field) => setFieldVisibility(field, !isInstallment));
  form.querySelectorAll("[data-recurring-installment]").forEach((field) => setFieldVisibility(field, isInstallment));

  if (valueLabel) {
    valueLabel.textContent = isInstallment ? "Valor da parcela" : "Valor mensal";
  }

  if (badge) {
    badge.textContent = isInstallment ? "Parcelas mensais" : "Fixa mensal";
  }
}

function setFieldVisibility(field, visible) {
  field.classList.toggle("is-hidden", !visible);
  field.querySelectorAll("input, select").forEach((input) => {
    input.disabled = !visible;
    input.required = visible;
  });
}

function populateCategorySelect(select, categories = [], preferredType) {
  if (!select) {
    return;
  }

  const active = categories.filter((category) => toBoolean(category.ativo) && category.tipo !== "parcelada");
  const filtered = active.filter((category) => !preferredType || category.tipo === preferredType);
  const source = filtered.length ? filtered : active;
  select.innerHTML = source.length
    ? source.map((category) => `<option value="${escapeHtml(category.id)}">${escapeHtml(category.nome)}</option>`).join("")
    : '<option value="">Cadastre uma categoria</option>';
}

function populateDestinationSelect(select, destinations = []) {
  if (!select) {
    return;
  }

  const active = destinations.filter((destination) => toBoolean(destination.ativo));
  select.innerHTML = active.length
    ? active.map((destination) => `<option value="${escapeHtml(destination.id)}">${escapeHtml(destination.nome)}</option>`).join("")
    : '<option value="">Cadastre um destino</option>';
}

function toLookup(rows) {
  return new Map((rows || []).map((row) => [row.id, row]));
}
