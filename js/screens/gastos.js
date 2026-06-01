import { appState } from "../state.js";
import { requireMoney, requireSelect, requireText } from "../services/validation-service.js";
import {
  MONTHS,
  formatCurrency,
  formatDate,
  makeId,
  monthFromDate,
  todayIso,
  toBoolean,
  yearFromDate
} from "../ui/formatters.js";
import { emptyState, escapeHtml, hydrateIcons, icon, monthTabs, rowAction, tag, yearOptions } from "../ui/components.js";
import { notify } from "../ui/notifications.js";

let expensesBound = false;
let editingExpenseId = "";

export function renderExpenses(root) {
  const data = appState.getData();
  const filters = appState.getFilters();

  setupControls(root, data, filters);
  renderExpenseTable(data, filters);
  bindExpenseEvents(root);
  updateExpenseFormMode(root.querySelector("#expense-form"));
  hydrateIcons(root);
}

function setupControls(root, data, filters) {
  const yearSelect = root.querySelector("#expenses-year");
  const tabs = root.querySelector("#expense-month-tabs");
  const dateInput = root.querySelector('#expense-form [name="data_pagamento"]');
  const categorySelect = root.querySelector('#expense-form [name="categoria_id"]');
  const destinationSelect = root.querySelector('#expense-form [name="destino_id"]');
  const selectedCategoryId = categorySelect?.value || "";
  const selectedDestinationId = destinationSelect?.value || "";

  if (yearSelect) {
    yearSelect.innerHTML = yearOptions(filters.expenseYear);
    yearSelect.value = String(filters.expenseYear);
  }

  if (tabs) {
    tabs.innerHTML = monthTabs(filters.expenseMonth);
  }

  syncDateInputWithFilters(dateInput, filters);

  populateCategorySelect(categorySelect, data.categorias || [], selectedCategoryId);
  populateDestinationSelect(destinationSelect, data.destinos || [], selectedDestinationId);
  updateInstallmentPreview(categorySelect);
}

function syncDateInputWithFilters(dateInput, filters) {
  if (!dateInput) {
    return;
  }

  if (editingExpenseId && dateInput.value) {
    return;
  }

  const currentYear = yearFromDate(dateInput.value);
  const currentMonth = monthFromDate(dateInput.value);
  if (dateInput.value && currentYear === filters.expenseYear && currentMonth === filters.expenseMonth) {
    return;
  }

  dateInput.value = `${filters.expenseYear}-${String(filters.expenseMonth).padStart(2, "0")}-01`;
}

function renderExpenseTable(data, filters) {
  const body = document.getElementById("expense-table-body");
  const title = document.getElementById("expense-list-title");
  const totals = document.getElementById("expense-list-totals");
  const categories = toLookup(data.categorias || []);
  const destinations = toLookup(data.destinos || []);
  const rows = (data.gastos || [])
    .filter((row) => isExpenseInPeriod(row, filters))
    .sort((a, b) => String(a.data_pagamento).localeCompare(String(b.data_pagamento)));

  title.textContent = `Gastos de ${MONTHS[filters.expenseMonth - 1]}`;
  totals.innerHTML = tag(formatCurrency(rows.reduce((sum, row) => sum + Number(row.valor_centavos || 0), 0)), "yellow");

  body.innerHTML = rows.length
    ? rows
        .map((row) => {
          const category = categories.get(row.categoria_id);
          const destination = destinations.get(row.destino_id);
          const installment = row.tipo_gasto === "parcelada" ? ` - ${row.parcela_atual}/${row.parcelas_total}` : "";
          const paid = toBoolean(row.pago);
          return `
            <tr class="${paid ? "is-paid" : ""}">
              <td>${formatDate(row.data_pagamento)}</td>
              <td>
                <strong>${escapeHtml(row.descricao)}</strong>
                <div class="row-subtitle">${escapeHtml(row.tipo_gasto)}${installment}</div>
              </td>
              <td>${escapeHtml(category?.nome || "Sem categoria")}</td>
              <td>${escapeHtml(destination?.nome || "Sem destino")}</td>
              <td>${tag(row.tipo_pagamento, row.tipo_pagamento === "credito" ? "blue" : "yellow")}</td>
              <td>
                <label class="paid-toggle">
                  <input
                    type="checkbox"
                    data-paid-id="${escapeHtml(row.id)}"
                    ${paid ? "checked" : ""}
                    aria-label="Marcar ${escapeHtml(row.descricao)} como pago"
                  />
                  <span>${paid ? "Pago" : "Pendente"}</span>
                </label>
              </td>
              <td><strong>${formatCurrency(row.valor_centavos)}</strong></td>
              <td>${expenseActions(row.id)}</td>
            </tr>
          `;
        })
        .join("")
    : `<tr><td colspan="8">${emptyState("Sem gastos neste mes.")}</td></tr>`;
}

function bindExpenseEvents(root) {
  if (expensesBound) {
    return;
  }

  expensesBound = true;

  root.addEventListener("change", async (event) => {
    if (!root.querySelector('[data-screen="gastos"]')) {
      return;
    }

    const paidInput = event.target.closest("[data-paid-id]");
    if (paidInput) {
      await appState.getRepository().update("gastos", paidInput.dataset.paidId, {
        pago: paidInput.checked ? "true" : "false",
        atualizado_em: todayIso()
      });
      notify(paidInput.checked ? "Gasto marcado como pago" : "Gasto marcado como pendente");
      return;
    }

    if (event.target.id === "expenses-year") {
      changeExpensePeriod(root, { expenseYear: event.target.value });
      return;
    }

    if (event.target.name === "categoria_id") {
      updateInstallmentPreview(event.target);
    }

    if (event.target.name === "data_pagamento") {
      appState.setFilters({
        expenseYear: yearFromDate(event.target.value),
        expenseMonth: monthFromDate(event.target.value)
      });
    }
  });

  root.addEventListener("click", async (event) => {
    if (!root.querySelector('[data-screen="gastos"]')) {
      return;
    }

    const tab = event.target.closest("[data-month]");
    if (tab) {
      changeExpensePeriod(root, { expenseMonth: tab.dataset.month });
      return;
    }

    const cancelEditButton = event.target.closest("#expense-cancel-edit");
    if (cancelEditButton) {
      resetExpenseForm(root.querySelector("#expense-form"));
      return;
    }

    const editButton = event.target.closest("[data-edit-id]");
    if (editButton) {
      startExpenseEdit(root, editButton.dataset.editId);
      return;
    }

    const deleteButton = event.target.closest("[data-delete-id]");
    if (deleteButton) {
      await appState.getRepository().remove(deleteButton.dataset.deleteCollection, deleteButton.dataset.deleteId);
      if (editingExpenseId === deleteButton.dataset.deleteId) {
        resetExpenseForm(root.querySelector("#expense-form"));
      }
      notify("Gasto removido");
    }
  });

  root.addEventListener("submit", async (event) => {
    if (!root.querySelector('[data-screen="gastos"]')) {
      return;
    }

    event.preventDefault();
    if (event.target.id !== "expense-form") {
      return;
    }

    try {
      const form = event.target;
      const payload = buildExpensePayload(form);
      const data = appState.getData();
      const category = (data.categorias || []).find((item) => item.id === payload.categoria_id);
      const existing = editingExpenseId ? (data.gastos || []).find((item) => item.id === editingExpenseId) : null;
      const record = buildExpenseRecord(payload, category, existing);
      const repository = appState.getRepository();

      if (existing) {
        await repository.update("gastos", existing.id, record);
        notify("Gasto atualizado");
      } else {
        await repository.append("gastos", record);
        notify("Gasto registrado");
      }

      resetExpenseForm(form);
    } catch (error) {
      notify("Verifique o formulario", error.message, "error");
    }
  });
}

function changeExpensePeriod(root, patch) {
  const form = root.querySelector("#expense-form");
  editingExpenseId = "";
  appState.setFilters(patch);
  resetExpenseForm(form);
}

function buildExpensePayload(form) {
  const data = new FormData(form);
  requireText(data.get("descricao"), "Descricao");
  requireSelect(data.get("categoria_id"), "Categoria");
  requireSelect(data.get("destino_id"), "Destino");
  requireSelect(data.get("data_pagamento"), "Data de pagamento");
  const cents = requireMoney(data.get("valor"));
  const date = data.get("data_pagamento");

  return {
    descricao: data.get("descricao").trim(),
    categoria_id: data.get("categoria_id"),
    data_pagamento: date,
    ano: yearFromDate(date),
    mes: monthFromDate(date),
    destino_id: data.get("destino_id"),
    valor_centavos: cents,
    tipo_pagamento: data.get("tipo_pagamento")
  };
}

function buildExpenseRecord(payload, category, existing) {
  const today = todayIso();
  const base = {
    ...payload,
    id: existing?.id || makeId("gas"),
    grupo_id: existing?.grupo_id || "",
    criado_em: existing?.criado_em || today,
    pago: toBoolean(existing?.pago) ? "true" : "false",
    atualizado_em: today
  };

  if (existing?.tipo_gasto === "parcelada") {
    return {
      ...base,
      tipo_gasto: "parcelada",
      parcela_atual: Number(existing.parcela_atual) || 1,
      parcelas_total: Number(existing.parcelas_total) || 1
    };
  }

  return {
    ...base,
    tipo_gasto: existing?.tipo_gasto === "fixa" || category?.tipo === "fixa" ? "fixa" : "variavel",
    parcela_atual: 1,
    parcelas_total: 1
  };
}

function isExpenseInPeriod(row, filters) {
  const period = getExpensePeriod(row);
  return period.year === filters.expenseYear && period.month === filters.expenseMonth;
}

function getExpensePeriod(row) {
  return getPeriodFromDate(row.data_pagamento) || {
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

function startExpenseEdit(root, id) {
  const form = root.querySelector("#expense-form");
  const row = (appState.getData().gastos || []).find((item) => item.id === id);
  if (!form || !row) {
    return;
  }

  editingExpenseId = id;
  form.elements.descricao.value = row.descricao || "";
  form.elements.categoria_id.value = row.categoria_id || "";
  form.elements.data_pagamento.value = row.data_pagamento || "";
  form.elements.destino_id.value = row.destino_id || "";
  form.elements.valor.value = formatCurrency(row.valor_centavos);
  form.elements.tipo_pagamento.value = row.tipo_pagamento || "credito";
  updateInstallmentPreview(form.elements.categoria_id);
  updateExpenseFormMode(form);
  form.scrollIntoView({ block: "start", behavior: "smooth" });
}

function resetExpenseForm(form) {
  if (!form) {
    return;
  }

  editingExpenseId = "";
  form.reset();
  const filters = appState.getFilters();
  form.elements.data_pagamento.value = `${filters.expenseYear}-${String(filters.expenseMonth).padStart(2, "0")}-01`;
  updateInstallmentPreview(form.elements.categoria_id);
  updateExpenseFormMode(form);
}

function updateExpenseFormMode(form) {
  if (!form) {
    return;
  }

  const title = document.getElementById("expense-form-title");
  const submitLabel = document.getElementById("expense-submit-label");
  const cancelButton = document.getElementById("expense-cancel-edit");

  if (title) {
    title.textContent = editingExpenseId ? "Editar saida" : "Lancamento do mes";
  }
  if (submitLabel) {
    submitLabel.textContent = editingExpenseId ? "Salvar" : "Registrar";
  }
  cancelButton?.classList.toggle("is-hidden", !editingExpenseId);
}

function populateCategorySelect(select, categories, selectedId = "") {
  if (!select) {
    return;
  }

  const selected = selectedId || select.value;
  const active = categories.filter((category) => toBoolean(category.ativo) && category.tipo !== "parcelada");
  select.innerHTML = active.length
    ? active
        .map((category) => {
          return `<option value="${escapeHtml(category.id)}" data-tipo="${escapeHtml(category.tipo)}">${escapeHtml(category.nome)}</option>`;
        })
        .join("")
    : '<option value="">Cadastre uma categoria</option>';

  if (selected && active.some((category) => category.id === selected)) {
    select.value = selected;
  }
}

function populateDestinationSelect(select, destinations, selectedId = "") {
  if (!select) {
    return;
  }

  const selected = selectedId || select.value;
  const active = destinations.filter((destination) => toBoolean(destination.ativo));
  select.innerHTML = active.length
    ? active
        .map((destination) => `<option value="${escapeHtml(destination.id)}">${escapeHtml(destination.nome)}</option>`)
        .join("")
    : '<option value="">Cadastre um destino</option>';

  if (selected && active.some((destination) => destination.id === selected)) {
    select.value = selected;
  }
}

function updateInstallmentPreview(select) {
  const preview = document.getElementById("installment-preview");
  const option = select?.selectedOptions?.[0];
  if (!preview || !option) {
    return;
  }

  const tipo = option.dataset.tipo || "variavel";
  preview.textContent = `Tipo ${tipo}`;
}

function toLookup(rows) {
  return new Map((rows || []).map((row) => [row.id, row]));
}

function expenseActions(id) {
  return `
    <div class="table-actions">
      <button class="icon-button" type="button" data-edit-id="${escapeHtml(id)}" aria-label="Editar gasto">
        ${icon("pencil")}
      </button>
      ${rowAction(id, "gastos")}
    </div>
  `;
}
