import { MONTHS, SHORT_MONTHS, formatCurrency } from "./formatters.js";

export function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export function icon(name) {
  return window.FCIcons ? window.FCIcons.render(name) : "";
}

export function hydrateIcons(scope = document) {
  if (window.FCIcons) {
    window.FCIcons.hydrate(scope);
  }
}

export function monthOptions(selectedMonth = 1) {
  return MONTHS.map((month, index) => {
    const value = index + 1;
    return `<option value="${value}" ${value === Number(selectedMonth) ? "selected" : ""}>${month}</option>`;
  }).join("");
}

export function yearOptions(selectedYear) {
  const current = new Date().getFullYear();
  const years = Array.from({ length: 7 }, (_, index) => current - 2 + index);
  if (!years.includes(Number(selectedYear))) {
    years.push(Number(selectedYear));
  }

  return years
    .sort((a, b) => a - b)
    .map((year) => `<option value="${year}" ${year === Number(selectedYear) ? "selected" : ""}>${year}</option>`)
    .join("");
}

export function emptyState(message) {
  return `<div class="empty-state">${escapeHtml(message)}</div>`;
}

export function tag(label, tone = "") {
  return `<span class="tag ${tone}">${escapeHtml(label)}</span>`;
}

export function metricCard(label, value, detail, tone = "blue") {
  return `
    <article class="metric-card">
      ${tag(tone === "yellow" ? "Planejado" : "Atual", tone)}
      <strong>${escapeHtml(value)}</strong>
      <span>${escapeHtml(label)}</span>
      ${detail ? `<p class="row-subtitle">${escapeHtml(detail)}</p>` : ""}
    </article>
  `;
}

export function monthTabs(activeMonth) {
  return SHORT_MONTHS.map((month, index) => {
    const value = index + 1;
    return `
      <button
        class="month-tab ${value === Number(activeMonth) ? "is-active" : ""}"
        type="button"
        data-month="${value}"
        role="tab"
        aria-selected="${value === Number(activeMonth)}"
      >${month}</button>
    `;
  }).join("");
}

export function rowAction(id, collection, label = "Remover") {
  return `
    <button
      class="danger-button"
      type="button"
      data-delete-id="${escapeHtml(id)}"
      data-delete-collection="${escapeHtml(collection)}"
      aria-label="${escapeHtml(label)}"
    >${icon("trash")}</button>
  `;
}

export function summaryLine(label, cents, options = {}) {
  const className = ["summary-line", options.net ? "net" : "", cents < 0 ? "negative" : ""].filter(Boolean).join(" ");
  return `
    <div class="${className}">
      <span>${escapeHtml(label)}</span>
      <strong>${formatCurrency(cents)}</strong>
    </div>
  `;
}
