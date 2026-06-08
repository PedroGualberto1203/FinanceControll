import { appState } from "../state.js";
import { getMonthlyControl, isMonthlyControlCategoryUsed } from "../services/monthly-control-service.js";
import { requireMoney, requireSelect, requireText } from "../services/validation-service.js";
import {
  MONTHS,
  formatCurrency,
  formatDate,
  makeId,
  monthFromDate,
  parseCurrencyToCents,
  todayIso,
  toBoolean,
  yearFromDate
} from "../ui/formatters.js";
import { emptyState, escapeHtml, hydrateIcons, icon, monthTabs, rowAction, summaryLine, tag, yearOptions } from "../ui/components.js";
import { enhanceFormControls } from "../ui/field-controls.js";
import { notify } from "../ui/notifications.js";

let monthlyControlBound = false;
let editingControlExpenseId = "";
let editingControlCategoryId = "";

export function renderMonthlyControl(root) {
  const data = appState.getData();
  const filters = appState.getFilters();

  setupMonthlyControl(root, data, filters);
  renderBalances(data, filters);
  renderCategoryList(data);
  renderExpenseTable(data, filters);
  bindMonthlyControlEvents(root);
  updateExpenseFormMode(root.querySelector("#monthly-control-form"));
  updateCategoryFormMode(root.querySelector("#monthly-control-category-form"));
  updateImpactPreview(root.querySelector("#monthly-control-form"));
  hydrateIcons(root);
}

function setupMonthlyControl(root, data, filters) {
  const yearSelect = root.querySelector("#monthly-control-year");
  const tabs = root.querySelector("#monthly-control-month-tabs");
  const dateInput = root.querySelector('#monthly-control-form [name="data_gasto"]');
  const categorySelect = root.querySelector('#monthly-control-form [name="categoria_id"]');
  const selectedCategoryId = categorySelect?.value || "";

  if (yearSelect) {
    yearSelect.innerHTML = yearOptions(filters.monthlyControlYear);
    yearSelect.value = String(filters.monthlyControlYear);
  }

  if (tabs) {
    tabs.innerHTML = monthTabs(filters.monthlyControlMonth);
  }

  syncDateInputWithFilters(dateInput, filters);
  populateCategorySelect(categorySelect, data.controle_mensal_categorias || [], selectedCategoryId);
}

function syncDateInputWithFilters(dateInput, filters) {
  if (!dateInput) {
    return;
  }

  if (editingControlExpenseId && dateInput.value) {
    return;
  }

  const currentYear = yearFromDate(dateInput.value);
  const currentMonth = monthFromDate(dateInput.value);
  if (dateInput.value && currentYear === filters.monthlyControlYear && currentMonth === filters.monthlyControlMonth) {
    return;
  }

  dateInput.value = `${filters.monthlyControlYear}-${String(filters.monthlyControlMonth).padStart(2, "0")}-01`;
}

function renderBalances(data, filters) {
  const node = document.getElementById("monthly-control-balances");
  if (!node) {
    return;
  }

  const control = getMonthlyControl(data, filters.monthlyControlYear, filters.monthlyControlMonth);
  node.innerHTML = [
    balanceCard("Credito", control.baseBySource.credito, control.spentBySource.credito, control.remainingBySource.credito, "blue"),
    balanceCard("Pix", control.baseBySource.pix, control.spentBySource.pix, control.remainingBySource.pix, "yellow"),
    balanceCard("Total do mes", control.totalBase, control.totalSpent, control.totalRemaining, control.totalRemaining >= 0 ? "green" : "red")
  ].join("");
}

function balanceCard(label, base, spent, remaining, tone) {
  const negative = remaining < 0;
  return `
    <article class="balance-card ${negative ? "is-negative" : ""}">
      ${tag(label, tone)}
      <strong>${formatCurrency(remaining)}</strong>
      ${summaryLine("Saldo base", base)}
      ${summaryLine("Registrado", spent)}
      ${summaryLine("Restante", remaining, { net: true })}
    </article>
  `;
}

function renderCategoryList(data) {
  const list = document.getElementById("monthly-control-category-list");
  const controls = document.getElementById("monthly-control-category-controls");
  const categories = data.controle_mensal_categorias || [];
  if (!list) {
    return;
  }

  list.innerHTML = categories.length
    ? categories.map((category) => renderCategoryRow(category)).join("")
    : emptyState("Cadastre categorias para usar nesta aba.");

  if (controls) {
    const activeTotal = categories.filter((category) => toBoolean(category.ativo)).length;
    controls.innerHTML = categories.length ? `<span class="catalog-count">${activeTotal} ativas de ${categories.length}</span>` : "";
  }
}

function renderCategoryRow(category) {
  const active = toBoolean(category.ativo);
  return `
    <div class="data-row">
      <div>
        <div class="data-row-title">${escapeHtml(category.nome)}</div>
        <div class="row-subtitle">Exclusiva do controle mensal</div>
      </div>
      ${tag(active ? "Ativa" : "Inativa", active ? "green" : "red")}
      <div class="table-actions">
        <button
          class="icon-button"
          type="button"
          data-monthly-category-edit-id="${escapeHtml(category.id)}"
          aria-label="Editar categoria"
        >
          ${icon("pencil")}
        </button>
        ${rowAction(category.id, "controle_mensal_categorias", active ? "Remover categoria" : "Excluir categoria")}
      </div>
    </div>
  `;
}

function renderExpenseTable(data, filters) {
  const body = document.getElementById("monthly-control-table-body");
  const title = document.getElementById("monthly-control-list-title");
  const totals = document.getElementById("monthly-control-list-totals");
  if (!body || !title || !totals) {
    return;
  }

  const categories = toLookup(data.controle_mensal_categorias || []);
  const control = getMonthlyControl(data, filters.monthlyControlYear, filters.monthlyControlMonth);
  const rows = [...control.rows].sort((a, b) => String(a.data_gasto).localeCompare(String(b.data_gasto)));

  title.textContent = `Gastos de ${MONTHS[filters.monthlyControlMonth - 1]}`;
  totals.innerHTML = tag(formatCurrency(control.totalSpent), control.totalSpent > control.totalBase ? "red" : "yellow");

  body.innerHTML = rows.length
    ? rows
        .map((row) => {
          const category = categories.get(row.categoria_id);
          return `
            <tr>
              <td>${formatDate(row.data_gasto)}</td>
              <td>
                <strong>${escapeHtml(row.descricao)}</strong>
                <div class="row-subtitle">${escapeHtml(row.fonte === "credito" ? "Credito do mes" : "Pix do mes")}</div>
              </td>
              <td>${escapeHtml(category?.nome || "Sem categoria")}</td>
              <td>${tag(row.fonte === "credito" ? "Credito" : "Pix", row.fonte === "credito" ? "blue" : "yellow")}</td>
              <td>${escapeHtml(row.observacao || "-")}</td>
              <td><strong>${formatCurrency(row.valor_centavos)}</strong></td>
              <td>${expenseActions(row.id)}</td>
            </tr>
          `;
        })
        .join("")
    : `<tr><td colspan="7">${emptyState("Sem gastos neste mes.")}</td></tr>`;
}

function bindMonthlyControlEvents(root) {
  if (monthlyControlBound) {
    return;
  }

  monthlyControlBound = true;

  root.addEventListener("change", (event) => {
    if (!root.querySelector('[data-screen="controle-mensal"]')) {
      return;
    }

    if (event.target.id === "monthly-control-year") {
      changeMonthlyControlPeriod(root, { monthlyControlYear: event.target.value });
      return;
    }

    if (event.target.name === "data_gasto") {
      appState.setFilters({
        monthlyControlYear: yearFromDate(event.target.value),
        monthlyControlMonth: monthFromDate(event.target.value)
      });
      return;
    }

    if (event.target.closest("#monthly-control-form")) {
      updateImpactPreview(event.target.form);
    }
  });

  root.addEventListener("input", (event) => {
    if (!root.querySelector('[data-screen="controle-mensal"]')) {
      return;
    }

    if (event.target.closest("#monthly-control-form")) {
      updateImpactPreview(event.target.form);
    }
  });

  root.addEventListener("click", async (event) => {
    if (!root.querySelector('[data-screen="controle-mensal"]')) {
      return;
    }

    const tab = event.target.closest("[data-month]");
    if (tab) {
      changeMonthlyControlPeriod(root, { monthlyControlMonth: tab.dataset.month });
      return;
    }

    const cancelExpenseEdit = event.target.closest("#monthly-control-cancel-edit");
    if (cancelExpenseEdit) {
      resetExpenseForm(root.querySelector("#monthly-control-form"));
      return;
    }

    const cancelCategoryEdit = event.target.closest("#monthly-control-category-cancel-edit");
    if (cancelCategoryEdit) {
      resetCategoryForm(root.querySelector("#monthly-control-category-form"));
      return;
    }

    const editExpenseButton = event.target.closest("[data-monthly-expense-edit-id]");
    if (editExpenseButton) {
      startExpenseEdit(root, editExpenseButton.dataset.monthlyExpenseEditId);
      return;
    }

    const editCategoryButton = event.target.closest("[data-monthly-category-edit-id]");
    if (editCategoryButton) {
      startCategoryEdit(root, editCategoryButton.dataset.monthlyCategoryEditId);
      return;
    }

    const deleteButton = event.target.closest("[data-delete-id]");
    if (!deleteButton) {
      return;
    }

    await handleDelete(root, deleteButton);
  });

  root.addEventListener("submit", async (event) => {
    if (!root.querySelector('[data-screen="controle-mensal"]')) {
      return;
    }

    event.preventDefault();
    const repository = appState.getRepository();

    try {
      if (event.target.id === "monthly-control-form") {
        const form = event.target;
        const payload = buildExpensePayload(form);
        const existing = editingControlExpenseId
          ? (appState.getData().controle_mensal_gastos || []).find((item) => item.id === editingControlExpenseId)
          : null;
        const record = buildExpenseRecord(payload, existing);

        if (existing) {
          await repository.update("controle_mensal_gastos", existing.id, record);
          notify("Gasto atualizado");
        } else {
          await repository.append("controle_mensal_gastos", record);
          notify("Gasto registrado");
        }

        resetExpenseForm(form);
      }

      if (event.target.id === "monthly-control-category-form") {
        const form = event.target;
        const existing = editingControlCategoryId
          ? (appState.getData().controle_mensal_categorias || []).find((item) => item.id === editingControlCategoryId)
          : null;
        const category = buildCategory(form, existing);

        if (existing) {
          await repository.update("controle_mensal_categorias", existing.id, category);
          notify("Categoria atualizada");
        } else {
          await repository.append("controle_mensal_categorias", category);
          notify("Categoria adicionada");
        }

        resetCategoryForm(form);
      }
    } catch (error) {
      notify("Verifique o formulario", error.message, "error");
    }
  });
}

function changeMonthlyControlPeriod(root, patch) {
  editingControlExpenseId = "";
  appState.setFilters(patch);
  resetExpenseForm(root.querySelector("#monthly-control-form"));
}

async function handleDelete(root, button) {
  const repository = appState.getRepository();
  const collection = button.dataset.deleteCollection;
  const id = button.dataset.deleteId;

  if (collection === "controle_mensal_gastos") {
    await repository.remove(collection, id);
    if (editingControlExpenseId === id) {
      resetExpenseForm(root.querySelector("#monthly-control-form"));
    }
    notify("Gasto removido");
    return;
  }

  if (collection !== "controle_mensal_categorias") {
    return;
  }

  if (editingControlCategoryId === id) {
    resetCategoryForm(root.querySelector("#monthly-control-category-form"));
  }

  if (isMonthlyControlCategoryUsed(appState.getData(), id)) {
    await repository.update(collection, id, {
      ativo: "false",
      atualizado_em: todayIso()
    });
    notify("Categoria inativada");
    return;
  }

  await repository.remove(collection, id);
  notify("Categoria excluida");
}

function buildExpensePayload(form) {
  const data = new FormData(form);
  requireText(data.get("descricao"), "Descricao");
  requireSelect(data.get("categoria_id"), "Categoria");
  requireSelect(data.get("data_gasto"), "Data");
  requireSelect(data.get("fonte"), "Fonte");
  const cents = requireMoney(data.get("valor"));
  const date = data.get("data_gasto");
  const fonte = data.get("fonte") === "pix" ? "pix" : "credito";

  return {
    descricao: data.get("descricao").trim(),
    categoria_id: data.get("categoria_id"),
    data_gasto: date,
    ano: yearFromDate(date),
    mes: monthFromDate(date),
    fonte,
    valor_centavos: cents,
    observacao: String(data.get("observacao") || "").trim()
  };
}

function buildExpenseRecord(payload, existing) {
  const today = todayIso();
  return {
    ...payload,
    id: existing?.id || makeId("cmg"),
    criado_em: existing?.criado_em || today,
    atualizado_em: today
  };
}

function buildCategory(form, existing) {
  const data = new FormData(form);
  requireText(data.get("nome"), "Nome");

  return {
    id: existing?.id || makeId("cmc"),
    nome: data.get("nome").trim(),
    ativo: data.get("ativo") === "false" ? "false" : "true",
    criado_em: existing?.criado_em || todayIso(),
    atualizado_em: todayIso()
  };
}

function startExpenseEdit(root, id) {
  const form = root.querySelector("#monthly-control-form");
  const row = (appState.getData().controle_mensal_gastos || []).find((item) => item.id === id);
  if (!form || !row) {
    return;
  }

  editingControlExpenseId = id;
  form.elements.descricao.value = row.descricao || "";
  populateCategorySelect(form.elements.categoria_id, appState.getData().controle_mensal_categorias || [], row.categoria_id || "");
  form.elements.categoria_id.value = row.categoria_id || "";
  form.elements.data_gasto.value = row.data_gasto || "";
  form.elements.fonte.value = row.fonte || "credito";
  form.elements.valor.value = formatCurrency(row.valor_centavos);
  form.elements.observacao.value = row.observacao || "";
  updateExpenseFormMode(form);
  updateImpactPreview(form);
  enhanceFormControls(form);
  form.scrollIntoView({ block: "start", behavior: "smooth" });
}

function resetExpenseForm(form) {
  if (!form) {
    return;
  }

  editingControlExpenseId = "";
  form.reset();
  const filters = appState.getFilters();
  form.elements.data_gasto.value = `${filters.monthlyControlYear}-${String(filters.monthlyControlMonth).padStart(2, "0")}-01`;
  populateCategorySelect(form.elements.categoria_id, appState.getData().controle_mensal_categorias || []);
  updateExpenseFormMode(form);
  updateImpactPreview(form);
  enhanceFormControls(form);
}

function updateExpenseFormMode(form) {
  if (!form) {
    return;
  }

  const title = document.getElementById("monthly-control-form-title");
  const submitLabel = document.getElementById("monthly-control-submit-label");
  const cancelButton = document.getElementById("monthly-control-cancel-edit");

  if (title) {
    title.textContent = editingControlExpenseId ? "Editar gasto" : "Lancamento isolado";
  }
  if (submitLabel) {
    submitLabel.textContent = editingControlExpenseId ? "Salvar" : "Registrar";
  }
  cancelButton?.classList.toggle("is-hidden", !editingControlExpenseId);
}

function startCategoryEdit(root, id) {
  const form = root.querySelector("#monthly-control-category-form");
  const row = (appState.getData().controle_mensal_categorias || []).find((item) => item.id === id);
  if (!form || !row) {
    return;
  }

  editingControlCategoryId = id;
  form.elements.nome.value = row.nome || "";
  form.elements.ativo.value = toBoolean(row.ativo) ? "true" : "false";
  updateCategoryFormMode(form);
  enhanceFormControls(form);
  form.scrollIntoView({ block: "start", behavior: "smooth" });
}

function resetCategoryForm(form) {
  if (!form) {
    return;
  }

  editingControlCategoryId = "";
  form.reset();
  form.elements.ativo.value = "true";
  updateCategoryFormMode(form);
  enhanceFormControls(form);
}

function updateCategoryFormMode(form) {
  if (!form) {
    return;
  }

  const title = document.getElementById("monthly-control-category-title");
  const submitLabel = document.getElementById("monthly-control-category-submit-label");
  const cancelButton = document.getElementById("monthly-control-category-cancel-edit");

  if (title) {
    title.textContent = editingControlCategoryId ? "Editar categoria" : "Categorias do controle";
  }
  if (submitLabel) {
    submitLabel.textContent = editingControlCategoryId ? "Salvar" : "Adicionar";
  }
  cancelButton?.classList.toggle("is-hidden", !editingControlCategoryId);
}

function updateImpactPreview(form) {
  const preview = document.getElementById("monthly-control-impact");
  if (!preview || !form) {
    return;
  }

  const source = form.elements.fonte?.value === "pix" ? "pix" : "credito";
  const cents = parseCurrencyToCents(form.elements.valor?.value || "");
  const data = appState.getData();
  const filters = appState.getFilters();
  const control = getMonthlyControl(data, filters.monthlyControlYear, filters.monthlyControlMonth);
  const existing = editingControlExpenseId
    ? (data.controle_mensal_gastos || []).find((row) => row.id === editingControlExpenseId)
    : null;
  const restored = existing?.fonte === source ? Number(existing.valor_centavos || 0) : 0;
  const next = control.remainingBySource[source] + restored - cents;

  preview.textContent = cents > 0 ? `${source === "credito" ? "Credito" : "Pix"} ficara ${formatCurrency(next)}` : "Impacto no saldo";
  preview.classList.toggle("is-negative", next < 0 && cents > 0);
}

function populateCategorySelect(select, categories, selectedId = "") {
  if (!select) {
    return;
  }

  const selected = selectedId || select.value;
  const active = categories.filter((category) => toBoolean(category.ativo));
  const selectedInactive = selected
    ? categories.find((category) => category.id === selected && !toBoolean(category.ativo))
    : null;
  const source = selectedInactive ? [...active, selectedInactive] : active;

  select.innerHTML = source.length
    ? source
        .map((category) => {
          const suffix = toBoolean(category.ativo) ? "" : " (inativa)";
          return `<option value="${escapeHtml(category.id)}">${escapeHtml(category.nome)}${suffix}</option>`;
        })
        .join("")
    : '<option value="">Cadastre uma categoria</option>';

  if (selected && source.some((category) => category.id === selected)) {
    select.value = selected;
  }
}

function expenseActions(id) {
  return `
    <div class="table-actions">
      <button class="icon-button" type="button" data-monthly-expense-edit-id="${escapeHtml(id)}" aria-label="Editar gasto">
        ${icon("pencil")}
      </button>
      ${rowAction(id, "controle_mensal_gastos")}
    </div>
  `;
}

function toLookup(rows) {
  return new Map((rows || []).map((row) => [row.id, row]));
}
