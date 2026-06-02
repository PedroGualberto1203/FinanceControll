import { MONTHS, SHORT_MONTHS, getCurrentMonth, getCurrentYear, todayIso } from "./formatters.js";
import { escapeHtml, icon } from "./components.js";

let generatedControlId = 0;
let globalListenersBound = false;
let activeShell = null;

export function enhanceFormControls(scope = document) {
  bindGlobalListeners();

  scope.querySelectorAll("select").forEach((select) => enhanceSelect(select));
  scope.querySelectorAll('input[type="date"], input[type="month"]').forEach((input) => enhanceTemporalInput(input));
}

function bindGlobalListeners() {
  if (globalListenersBound) {
    return;
  }

  globalListenersBound = true;

  document.addEventListener("click", (event) => {
    if (activeShell && !activeShell.contains(event.target)) {
      closeShell(activeShell);
    }
  });

  window.addEventListener("resize", () => closeShell(activeShell));
}

function enhanceSelect(select) {
  if (select.dataset.enhancedControl === "select") {
    renderSelect(select, getShell(select));
    return;
  }

  select.dataset.enhancedControl = "select";
  select.classList.add("fc-native-control");

  const shell = createShell(select, "select");
  shell.addEventListener("click", handleShellClick);
  shell.addEventListener("keydown", handleShellKeydown);
  select.addEventListener("change", () => renderSelect(select, shell));

  renderSelect(select, shell);
}

function enhanceTemporalInput(input) {
  const kind = input.type === "month" ? "month" : "date";
  if (input.dataset.enhancedControl === kind) {
    renderTemporal(input, getShell(input));
    return;
  }

  input.dataset.enhancedControl = kind;
  input.classList.add("fc-native-control");

  const shell = createShell(input, kind);
  shell.addEventListener("click", handleShellClick);
  shell.addEventListener("keydown", handleShellKeydown);
  input.addEventListener("change", () => renderTemporal(input, shell));

  renderTemporal(input, shell);
}

function createShell(control, type) {
  const controlId = ensureControlId(control);
  const shell = document.createElement("div");
  shell.className = `fc-control-shell fc-${type}-shell`;
  shell.dataset.controlFor = controlId;
  shell.dataset.controlType = type;
  control.insertAdjacentElement("afterend", shell);
  return shell;
}

function ensureControlId(control) {
  if (control.id) {
    return control.id;
  }

  if (!control.dataset.fcControlId) {
    generatedControlId += 1;
    control.dataset.fcControlId = `fc-native-${generatedControlId}`;
  }

  return control.dataset.fcControlId;
}

function getShell(control) {
  const controlId = ensureControlId(control);
  return control.parentElement?.querySelector(`.fc-control-shell[data-control-for="${cssEscape(controlId)}"]`);
}

function getControl(shell) {
  const controlId = shell.dataset.controlFor;
  return document.getElementById(controlId) || document.querySelector(`[data-fc-control-id="${cssEscape(controlId)}"]`);
}

function renderSelect(select, shell) {
  if (!shell) {
    return;
  }

  const options = Array.from(select.options);
  const selected = options.find((option) => option.selected) || options[select.selectedIndex] || options[0];
  const selectedIndex = Math.max(0, options.indexOf(selected));
  const controlId = ensureControlId(select);
  const listId = `${controlId}-listbox`;
  const isOpen = shell.dataset.open === "true";
  const activeIndex = Number.isFinite(Number(shell.dataset.activeIndex))
    ? Number(shell.dataset.activeIndex)
    : selectedIndex;

  shell.dataset.activeIndex = String(clampIndex(activeIndex, options));
  shell.innerHTML = `
    <div
      class="fc-control fc-select-control"
      role="combobox"
      tabindex="${select.disabled ? "-1" : "0"}"
      aria-controls="${escapeHtml(listId)}"
      aria-expanded="${isOpen}"
      aria-haspopup="listbox"
      aria-disabled="${select.disabled}"
      aria-activedescendant="${escapeHtml(optionId(controlId, Number(shell.dataset.activeIndex)))}"
      data-fc-trigger
    >
      <span class="fc-control-value">${escapeHtml(selected?.textContent || "Selecionar")}</span>
      <span class="fc-control-icon">${icon("chevron-down")}</span>
    </div>
    <div class="fc-popover fc-select-popover" id="${escapeHtml(listId)}" role="listbox" ${isOpen ? "" : "hidden"}>
      ${options.map((option, index) => renderSelectOption(controlId, option, index)).join("")}
    </div>
  `;

  if (isOpen) {
    setSelectActiveIndex(shell, Number(shell.dataset.activeIndex));
    alignPopover(shell);
  }
}

function renderSelectOption(controlId, option, index) {
  const selected = option.selected;
  return `
    <div
      class="fc-option ${selected ? "is-selected" : ""} ${option.disabled ? "is-disabled" : ""}"
      id="${escapeHtml(optionId(controlId, index))}"
      role="option"
      aria-selected="${selected}"
      data-fc-option
      data-index="${index}"
      data-value="${escapeHtml(option.value)}"
      data-disabled="${option.disabled}"
    >
      <span>${escapeHtml(option.textContent)}</span>
      ${selected ? `<span class="fc-option-check">${icon("check")}</span>` : ""}
    </div>
  `;
}

function renderTemporal(input, shell) {
  if (!shell) {
    return;
  }

  const type = shell.dataset.controlType;
  const isMonth = type === "month";
  const isOpen = shell.dataset.open === "true";
  const value = input.value;
  const selected = isMonth ? parseMonthValue(value) : parseDateValue(value);
  const fallback = new Date(getCurrentYear(), getCurrentMonth() - 1, 1);
  const view = getTemporalView(shell, selected || fallback, isMonth);
  const activeValue = shell.dataset.activeValue || value || (isMonth ? toMonthValue(fallback) : todayIso());
  const popoverId = `${ensureControlId(input)}-calendar`;

  shell.dataset.activeValue = activeValue;
  shell.innerHTML = `
    <div
      class="fc-control fc-date-control"
      role="button"
      tabindex="${input.disabled ? "-1" : "0"}"
      aria-expanded="${isOpen}"
      aria-haspopup="dialog"
      aria-controls="${escapeHtml(popoverId)}"
      aria-disabled="${input.disabled}"
      data-fc-trigger
    >
      <span class="fc-control-value">${escapeHtml(formatTemporalLabel(input))}</span>
      <span class="fc-control-icon">${icon(isMonth ? "calendar" : "calendar-days")}</span>
    </div>
    <div class="fc-popover fc-calendar" id="${escapeHtml(popoverId)}" role="dialog" ${isOpen ? "" : "hidden"}>
      ${isMonth ? renderMonthPicker(input, view, activeValue) : renderDatePicker(input, view, activeValue)}
    </div>
  `;

  if (isOpen) {
    setTemporalActiveValue(shell, activeValue);
    alignPopover(shell);
  }
}

function renderDatePicker(input, view, activeValue) {
  const selectedValue = input.value;
  const today = todayIso();
  const days = buildCalendarDays(view.year, view.monthIndex);
  const title = `${MONTHS[view.monthIndex]} ${view.year}`;

  return `
    <div class="fc-calendar-header">
      <div class="fc-calendar-title">${escapeHtml(title)}</div>
      <div class="fc-calendar-nav">
        <div class="fc-calendar-nav-button" role="button" tabindex="-1" aria-label="Mes anterior" data-fc-prev>${icon("chevron-left")}</div>
        <div class="fc-calendar-nav-button" role="button" tabindex="-1" aria-label="Proximo mes" data-fc-next>${icon("chevron-right")}</div>
      </div>
    </div>
    <div class="fc-calendar-weekdays">
      ${["D", "S", "T", "Q", "Q", "S", "S"].map((day) => `<span>${day}</span>`).join("")}
    </div>
    <div class="fc-calendar-grid">
      ${days
        .map((day) => {
          const className = [
            "fc-calendar-day",
            day.monthIndex !== view.monthIndex ? "is-muted" : "",
            day.value === selectedValue ? "is-selected" : "",
            day.value === activeValue ? "is-active" : "",
            day.value === today ? "is-today" : ""
          ]
            .filter(Boolean)
            .join(" ");
          return `<div class="${className}" role="button" tabindex="-1" data-fc-date="${day.value}">${day.date.getDate()}</div>`;
        })
        .join("")}
    </div>
    <div class="fc-calendar-footer">
      ${input.required ? "" : `<div class="fc-calendar-link" role="button" tabindex="-1" data-fc-clear>Limpar</div>`}
      <div class="fc-calendar-link" role="button" tabindex="-1" data-fc-today>Hoje</div>
    </div>
  `;
}

function renderMonthPicker(input, view, activeValue) {
  const selectedValue = input.value;
  return `
    <div class="fc-calendar-header">
      <div class="fc-calendar-title">${view.year}</div>
      <div class="fc-calendar-nav">
        <div class="fc-calendar-nav-button" role="button" tabindex="-1" aria-label="Ano anterior" data-fc-prev>${icon("chevron-left")}</div>
        <div class="fc-calendar-nav-button" role="button" tabindex="-1" aria-label="Proximo ano" data-fc-next>${icon("chevron-right")}</div>
      </div>
    </div>
    <div class="fc-month-grid">
      ${SHORT_MONTHS.map((month, index) => {
        const value = `${view.year}-${String(index + 1).padStart(2, "0")}`;
        const className = [
          "fc-month-option",
          value === selectedValue ? "is-selected" : "",
          value === activeValue ? "is-active" : ""
        ]
          .filter(Boolean)
          .join(" ");
        return `<div class="${className}" role="button" tabindex="-1" data-fc-month="${value}">${escapeHtml(month)}</div>`;
      }).join("")}
    </div>
    <div class="fc-calendar-footer">
      ${input.required ? "" : `<div class="fc-calendar-link" role="button" tabindex="-1" data-fc-clear>Limpar</div>`}
      <div class="fc-calendar-link" role="button" tabindex="-1" data-fc-this-month>Hoje</div>
    </div>
  `;
}

function handleShellClick(event) {
  const shell = event.currentTarget;
  const control = getControl(shell);

  if (!control || control.disabled) {
    return;
  }

  event.preventDefault();
  event.stopPropagation();

  const trigger = event.target.closest("[data-fc-trigger]");
  if (trigger) {
    toggleShell(shell);
    return;
  }

  const selectOption = event.target.closest("[data-fc-option]");
  if (selectOption && control.tagName === "SELECT") {
    if (selectOption.dataset.disabled === "true") {
      return;
    }
    chooseSelectOption(control, shell, Number(selectOption.dataset.index));
    return;
  }

  if (event.target.closest("[data-fc-prev]")) {
    shiftTemporalView(control, shell, -1);
    return;
  }

  if (event.target.closest("[data-fc-next]")) {
    shiftTemporalView(control, shell, 1);
    return;
  }

  const dateNode = event.target.closest("[data-fc-date]");
  if (dateNode && shell.dataset.controlType === "date") {
    chooseTemporalValue(control, shell, dateNode.dataset.fcDate);
    return;
  }

  const monthNode = event.target.closest("[data-fc-month]");
  if (monthNode && shell.dataset.controlType === "month") {
    chooseTemporalValue(control, shell, monthNode.dataset.fcMonth);
    return;
  }

  if (event.target.closest("[data-fc-today]")) {
    chooseTemporalValue(control, shell, todayIso());
    return;
  }

  if (event.target.closest("[data-fc-this-month]")) {
    chooseTemporalValue(control, shell, `${getCurrentYear()}-${String(getCurrentMonth()).padStart(2, "0")}`);
    return;
  }

  if (event.target.closest("[data-fc-clear]")) {
    chooseTemporalValue(control, shell, "");
  }
}

function handleShellKeydown(event) {
  const shell = event.currentTarget;
  const control = getControl(shell);

  if (!control || control.disabled) {
    return;
  }

  if (control.tagName === "SELECT") {
    handleSelectKeydown(event, control, shell);
    return;
  }

  handleTemporalKeydown(event, control, shell);
}

function handleSelectKeydown(event, select, shell) {
  const isOpen = shell.dataset.open === "true";
  const options = Array.from(select.options);
  const currentIndex = Number(shell.dataset.activeIndex || select.selectedIndex || 0);

  if (["Enter", " ", "ArrowDown", "ArrowUp"].includes(event.key) && !isOpen) {
    event.preventDefault();
    openShell(shell);
    return;
  }

  if (!isOpen) {
    return;
  }

  if (event.key === "Escape") {
    event.preventDefault();
    closeShell(shell);
    focusTrigger(shell);
    return;
  }

  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    chooseSelectOption(select, shell, currentIndex);
    return;
  }

  const moves = {
    ArrowDown: 1,
    ArrowUp: -1
  };

  if (event.key in moves) {
    event.preventDefault();
    setSelectActiveIndex(shell, findNextEnabledIndex(options, currentIndex, moves[event.key]));
  }

  if (event.key === "Home") {
    event.preventDefault();
    setSelectActiveIndex(shell, findNextEnabledIndex(options, -1, 1));
  }

  if (event.key === "End") {
    event.preventDefault();
    setSelectActiveIndex(shell, findNextEnabledIndex(options, options.length, -1));
  }
}

function handleTemporalKeydown(event, input, shell) {
  const isOpen = shell.dataset.open === "true";

  if (["Enter", " ", "ArrowDown"].includes(event.key) && !isOpen) {
    event.preventDefault();
    openShell(shell);
    return;
  }

  if (!isOpen) {
    return;
  }

  if (event.key === "Escape") {
    event.preventDefault();
    closeShell(shell);
    focusTrigger(shell);
    return;
  }

  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    chooseTemporalValue(input, shell, shell.dataset.activeValue || input.value);
    return;
  }

  const type = shell.dataset.controlType;
  const dayMoves = {
    ArrowLeft: -1,
    ArrowRight: 1,
    ArrowUp: -7,
    ArrowDown: 7
  };
  const monthMoves = {
    ArrowLeft: -1,
    ArrowRight: 1,
    ArrowUp: -3,
    ArrowDown: 3
  };

  if (type === "date" && event.key in dayMoves) {
    event.preventDefault();
    setTemporalActiveValue(shell, addDays(shell.dataset.activeValue || input.value || todayIso(), dayMoves[event.key]));
    renderTemporal(input, shell);
  }

  if (type === "month" && event.key in monthMoves) {
    event.preventDefault();
    setTemporalActiveValue(shell, addMonths(shell.dataset.activeValue || input.value || `${getCurrentYear()}-${String(getCurrentMonth()).padStart(2, "0")}`, monthMoves[event.key]));
    renderTemporal(input, shell);
  }

  if (event.key === "Home") {
    event.preventDefault();
    const value = type === "month"
      ? `${getTemporalView(shell, parseMonthValue(input.value) || new Date(), true).year}-01`
      : firstDayOfMonth(shell.dataset.activeValue || input.value || todayIso());
    setTemporalActiveValue(shell, value);
    renderTemporal(input, shell);
  }

  if (event.key === "End") {
    event.preventDefault();
    const value = type === "month"
      ? `${getTemporalView(shell, parseMonthValue(input.value) || new Date(), true).year}-12`
      : lastDayOfMonth(shell.dataset.activeValue || input.value || todayIso());
    setTemporalActiveValue(shell, value);
    renderTemporal(input, shell);
  }
}

function toggleShell(shell) {
  if (shell.dataset.open === "true") {
    closeShell(shell);
  } else {
    openShell(shell);
  }
}

function openShell(shell) {
  if (activeShell && activeShell !== shell) {
    closeShell(activeShell);
  }

  activeShell = shell;
  shell.dataset.open = "true";
  shell.classList.add("is-open");

  const control = getControl(shell);
  if (control?.tagName === "SELECT") {
    shell.dataset.activeIndex = String(Math.max(0, control.selectedIndex));
    renderSelect(control, shell);
  } else if (control) {
    const activeValue = control.value || (shell.dataset.controlType === "month"
      ? `${getCurrentYear()}-${String(getCurrentMonth()).padStart(2, "0")}`
      : todayIso());
    shell.dataset.activeValue = activeValue;
    setViewFromValue(shell, activeValue, shell.dataset.controlType === "month");
    renderTemporal(control, shell);
  }

  alignPopover(shell);
}

function closeShell(shell) {
  if (!shell) {
    return;
  }

  shell.dataset.open = "false";
  shell.classList.remove("is-open", "is-align-end");
  shell.querySelector("[data-fc-trigger]")?.setAttribute("aria-expanded", "false");
  const popover = shell.querySelector(".fc-popover");
  if (popover) {
    popover.hidden = true;
  }

  if (activeShell === shell) {
    activeShell = null;
  }
}

function chooseSelectOption(select, shell, index) {
  const option = select.options[index];
  if (!option || option.disabled) {
    return;
  }

  select.value = option.value;
  shell.dataset.activeIndex = String(index);
  renderSelect(select, shell);
  dispatchChange(select);
  closeShell(shell);
  focusTrigger(shell);
}

function chooseTemporalValue(input, shell, value) {
  input.value = value;
  shell.dataset.activeValue = value;
  setViewFromValue(shell, value, shell.dataset.controlType === "month");
  renderTemporal(input, shell);
  dispatchChange(input);
  closeShell(shell);
  focusTrigger(shell);
}

function dispatchChange(control) {
  control.dispatchEvent(new Event("change", { bubbles: true }));
}

function setSelectActiveIndex(shell, index) {
  const options = Array.from(getControl(shell)?.options || []);
  const activeIndex = clampIndex(index, options);
  shell.dataset.activeIndex = String(activeIndex);

  shell.querySelectorAll("[data-fc-option]").forEach((node) => {
    node.classList.toggle("is-active", Number(node.dataset.index) === activeIndex);
  });

  const trigger = shell.querySelector("[data-fc-trigger]");
  trigger?.setAttribute("aria-activedescendant", optionId(shell.dataset.controlFor, activeIndex));
  shell.querySelector(`[data-index="${activeIndex}"]`)?.scrollIntoView({ block: "nearest" });
}

function setTemporalActiveValue(shell, value) {
  shell.dataset.activeValue = value;

  shell.querySelectorAll("[data-fc-date], [data-fc-month]").forEach((node) => {
    node.classList.toggle("is-active", node.dataset.fcDate === value || node.dataset.fcMonth === value);
  });
}

function shiftTemporalView(input, shell, amount) {
  const isMonth = shell.dataset.controlType === "month";
  const view = getTemporalView(shell, isMonth ? parseMonthValue(input.value) : parseDateValue(input.value), isMonth);
  if (isMonth) {
    shell.dataset.viewYear = String(view.year + amount);
  } else {
    const shifted = new Date(view.year, view.monthIndex + amount, 1);
    shell.dataset.viewYear = String(shifted.getFullYear());
    shell.dataset.viewMonth = String(shifted.getMonth());
  }
  shell.dataset.open = "true";
  renderTemporal(input, shell);
}

function getTemporalView(shell, selected, isMonth) {
  const fallback = selected || new Date(getCurrentYear(), getCurrentMonth() - 1, 1);
  const year = Number(shell.dataset.viewYear);
  const month = Number(shell.dataset.viewMonth);

  if (Number.isFinite(year) && (isMonth || Number.isFinite(month))) {
    return { year, monthIndex: Number.isFinite(month) ? month : fallback.getMonth() };
  }

  return { year: fallback.getFullYear(), monthIndex: fallback.getMonth() };
}

function setViewFromValue(shell, value, isMonth) {
  const parsed = isMonth ? parseMonthValue(value) : parseDateValue(value);
  if (!parsed) {
    return;
  }

  shell.dataset.viewYear = String(parsed.getFullYear());
  shell.dataset.viewMonth = String(parsed.getMonth());
}

function buildCalendarDays(year, monthIndex) {
  const start = new Date(year, monthIndex, 1);
  start.setDate(start.getDate() - start.getDay());

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    return {
      date,
      monthIndex: date.getMonth(),
      value: toDateValue(date)
    };
  });
}

function formatTemporalLabel(input) {
  if (!input.value) {
    return input.type === "month" ? "Selecionar mes" : "Selecionar data";
  }

  if (input.type === "month") {
    const date = parseMonthValue(input.value);
    return date ? `${MONTHS[date.getMonth()]} ${date.getFullYear()}` : input.value;
  }

  const date = parseDateValue(input.value);
  return date
    ? new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" }).format(date)
    : input.value;
}

function parseDateValue(value) {
  const [year, month, day] = String(value || "").split("-").map(Number);
  if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) {
    return null;
  }

  return new Date(year, month - 1, day);
}

function parseMonthValue(value) {
  const [year, month] = String(value || "").split("-").map(Number);
  if (!Number.isFinite(year) || !Number.isFinite(month)) {
    return null;
  }

  return new Date(year, month - 1, 1);
}

function toDateValue(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function toMonthValue(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function addDays(value, amount) {
  const date = parseDateValue(value) || parseDateValue(todayIso());
  date.setDate(date.getDate() + amount);
  return toDateValue(date);
}

function addMonths(value, amount) {
  const date = parseMonthValue(value) || new Date(getCurrentYear(), getCurrentMonth() - 1, 1);
  date.setMonth(date.getMonth() + amount);
  return toMonthValue(date);
}

function firstDayOfMonth(value) {
  const date = parseDateValue(value) || parseDateValue(todayIso());
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-01`;
}

function lastDayOfMonth(value) {
  const date = parseDateValue(value) || parseDateValue(todayIso());
  return toDateValue(new Date(date.getFullYear(), date.getMonth() + 1, 0));
}

function alignPopover(shell) {
  shell.classList.remove("is-align-end");
  const popover = shell.querySelector(".fc-popover");
  if (!popover || popover.hidden) {
    return;
  }

  window.requestAnimationFrame(() => {
    const rect = popover.getBoundingClientRect();
    if (rect.right > window.innerWidth - 14) {
      shell.classList.add("is-align-end");
    }
  });
}

function focusTrigger(shell) {
  shell.querySelector("[data-fc-trigger]")?.focus();
}

function clampIndex(index, options) {
  if (!options.length) {
    return 0;
  }

  return Math.min(Math.max(index, 0), options.length - 1);
}

function findNextEnabledIndex(options, startIndex, direction) {
  if (!options.length) {
    return 0;
  }

  let index = startIndex;
  for (let step = 0; step < options.length; step += 1) {
    index = (index + direction + options.length) % options.length;
    if (!options[index].disabled) {
      return index;
    }
  }

  return clampIndex(startIndex, options);
}

function optionId(controlId, index) {
  return `${controlId}-option-${index}`;
}

function cssEscape(value) {
  return String(value).replace(/["\\]/g, "\\$&");
}
