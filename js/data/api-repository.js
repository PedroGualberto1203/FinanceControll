import { COLLECTIONS, CSV_SCHEMAS } from "./csv-schema.js";
import { parseCsv, unparseCsv } from "./csv-utils.js";
import { synchronizeRecurringExpenses } from "../services/recurring-service.js";

const LEGACY_STORAGE_PREFIX = "financecontroll:csv:";
const SQLITE_MIGRATION_KEY = "financecontroll:sqlite:migrated:v1";

export class ApiRepository extends EventTarget {
  constructor() {
    super();
    this.data = emptyData();
    this.available = false;
    this.lastError = "";
  }

  async init() {
    await this.checkHealth();
    await this.migrateLocalStorageOnce();
    await this.reload({ emit: false });
    await this.syncRecurringGeneratedExpenses({ emit: false });
    this.emitChange();
    return this.getAll();
  }

  getAll() {
    return cloneData(this.data);
  }

  getStatusLabel() {
    if (this.available) {
      return "Banco SQLite local conectado";
    }
    return this.lastError ? `Banco local indisponivel: ${this.lastError}` : "Banco local indisponivel";
  }

  async request(path, options = {}) {
    try {
      const data = await requestJson(path, options);
      this.available = true;
      this.lastError = "";
      return data;
    } catch (error) {
      this.available = false;
      this.lastError = error.message;
      this.emitChange();
      throw error;
    }
  }

  async checkHealth() {
    try {
      await this.request("/api/health");
      this.available = true;
      this.lastError = "";
    } catch (error) {
      this.available = false;
      this.lastError = error.message;
      throw error;
    }
  }

  async reload(options = {}) {
    const { emit = true } = options;
    this.data = normalizeAll(await this.request("/api/data"));
    this.available = true;
    this.lastError = "";

    if (emit) {
      this.emitChange();
    }

    return this.getAll();
  }

  async connectDirectory() {
    throw new Error("O app agora usa SQLite local. Use exportacao/importacao CSV para backups.");
  }

  async replace(collection, rows, options = {}) {
    const { emit = true } = options;
    this.data[collection] = await this.request(`/api/collections/${encodeURIComponent(collection)}`, {
      method: "PUT",
      body: JSON.stringify(rows)
    });

    if (emit) {
      this.emitChange();
    }
  }

  async append(collection, row) {
    const saved = await this.request(`/api/collections/${encodeURIComponent(collection)}`, {
      method: "POST",
      body: JSON.stringify(row)
    });
    this.data[collection] = [...(this.data[collection] || []), saved];
    this.emitChange();
  }

  async appendMany(collection, rows) {
    const saved = await this.request(`/api/collections/${encodeURIComponent(collection)}/bulk`, {
      method: "POST",
      body: JSON.stringify(rows)
    });
    this.data[collection] = [...(this.data[collection] || []), ...saved];
    this.emitChange();
  }

  async syncRecurringGeneratedExpenses(options = {}) {
    const { emit = true } = options;
    const result = synchronizeRecurringExpenses(this.data);
    if (!result.added) {
      return result;
    }

    await this.replace("gastos", result.gastos, { emit: false });
    if (emit) {
      this.emitChange();
    }

    return result;
  }

  async update(collection, id, patch) {
    const saved = await this.request(`/api/collections/${encodeURIComponent(collection)}/${encodeURIComponent(id)}`, {
      method: "PATCH",
      body: JSON.stringify(patch)
    });

    let found = false;
    this.data[collection] = (this.data[collection] || []).map((row) => {
      if (row.id !== id) {
        return row;
      }

      found = true;
      return saved;
    });

    if (!found) {
      this.data[collection] = [...(this.data[collection] || []), saved];
    }

    this.emitChange();
  }

  async remove(collection, id) {
    await this.request(`/api/collections/${encodeURIComponent(collection)}/${encodeURIComponent(id)}`, {
      method: "DELETE"
    });
    this.data[collection] = (this.data[collection] || []).filter((row) => row.id !== id);
    this.emitChange();
  }

  exportAll() {
    COLLECTIONS.forEach((collection) => {
      const schema = CSV_SCHEMAS[collection];
      const csv = unparseCsv(collection, this.data[collection] || []);
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = schema.file;
      link.click();
      URL.revokeObjectURL(url);
    });
  }

  async importFiles(files) {
    const fileList = Array.from(files || []);
    const imported = [];
    const nextData = cloneData(this.data);

    for (const file of fileList) {
      const collection = COLLECTIONS.find((candidate) => CSV_SCHEMAS[candidate].file.toLowerCase() === file.name.toLowerCase());
      if (!collection) {
        continue;
      }

      const text = await file.text();
      nextData[collection] = parseCsvStrict(collection, text, file.name);
      imported.push(CSV_SCHEMAS[collection].file);
    }

    if (!imported.length) {
      throw new Error("Nenhum arquivo CSV reconhecido foi selecionado.");
    }

    this.data = normalizeAll(await this.request("/api/data", {
      method: "PUT",
      body: JSON.stringify(nextData)
    }));

    await this.syncRecurringGeneratedExpenses({ emit: false });
    this.emitChange();
    return imported;
  }

  async migrateLocalStorageOnce() {
    if (!canUseLocalStorage() || localStorage.getItem(SQLITE_MIGRATION_KEY) === "true") {
      return;
    }

    const legacyData = emptyData();
    let foundLegacyRows = false;

    COLLECTIONS.forEach((collection) => {
      const stored = localStorage.getItem(`${LEGACY_STORAGE_PREFIX}${collection}`);
      if (!stored || !stored.trim()) {
        return;
      }

      const rows = parseCsv(collection, stored).filter((row) => String(row.id || "").trim());
      legacyData[collection] = rows;
      foundLegacyRows = foundLegacyRows || rows.length > 0;
    });

    if (!foundLegacyRows) {
      localStorage.setItem(SQLITE_MIGRATION_KEY, "true");
      return;
    }

    const currentData = normalizeAll(await this.request("/api/data"));
    const mergedData = mergeData(currentData, legacyData);
    this.data = normalizeAll(await this.request("/api/data", {
      method: "PUT",
      body: JSON.stringify(mergedData)
    }));
    localStorage.setItem(SQLITE_MIGRATION_KEY, "true");
  }

  emitChange() {
    this.dispatchEvent(new CustomEvent("change", { detail: this.getAll() }));
  }
}

async function requestJson(path, options = {}, attempt = 0) {
  const headers = {
    Accept: "application/json",
    ...(options.body ? { "Content-Type": "application/json" } : {}),
    ...(options.headers || {})
  };

  let response;
  try {
    response = await fetch(path, { ...options, headers });
  } catch (error) {
    throw new Error("Servidor local indisponivel. Inicie o app por scripts/start-local.ps1.");
  }

  const payload = await response.json().catch(() => null);
  if ((response.status === 503 || payload?.error?.code === "database_busy") && attempt < 1) {
    await sleep(250);
    return requestJson(path, options, attempt + 1);
  }

  if (!response.ok || !payload?.ok) {
    const message = payload?.error?.message || "Falha ao acessar o banco local.";
    const error = new Error(message);
    error.status = response.status;
    error.code = payload?.error?.code || "api_error";
    throw error;
  }

  return payload.data;
}

function parseCsvStrict(collection, text, fileName) {
  const schema = CSV_SCHEMAS[collection];
  const source = text || schema.columns.join(";");
  const result = window.Papa.parse(source, {
    header: true,
    delimiter: ";",
    skipEmptyLines: true
  });

  if (result.errors?.length) {
    throw new Error(`CSV ${fileName} invalido: ${result.errors[0].message}`);
  }

  const fields = result.meta?.fields || [];
  const missing = schema.columns.filter((column) => !fields.includes(column));
  if (missing.length) {
    throw new Error(`CSV ${fileName} sem colunas obrigatorias: ${missing.join(", ")}`);
  }

  return parseCsv(collection, source);
}

function mergeData(currentData, legacyData) {
  return COLLECTIONS.reduce((output, collection) => {
    const rowsById = new Map();
    (currentData[collection] || []).forEach((row) => rowsById.set(row.id, row));
    (legacyData[collection] || []).forEach((row) => rowsById.set(row.id, row));
    output[collection] = Array.from(rowsById.values());
    return output;
  }, {});
}

function normalizeAll(data) {
  return COLLECTIONS.reduce((output, collection) => {
    output[collection] = Array.isArray(data?.[collection]) ? [...data[collection]] : [];
    return output;
  }, {});
}

function cloneData(data) {
  return COLLECTIONS.reduce((output, collection) => {
    output[collection] = [...(data[collection] || [])];
    return output;
  }, {});
}

function emptyData() {
  return normalizeAll({});
}

function canUseLocalStorage() {
  try {
    const key = "financecontroll:storage-test";
    localStorage.setItem(key, "1");
    localStorage.removeItem(key);
    return true;
  } catch {
    return false;
  }
}

function sleep(ms) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}
