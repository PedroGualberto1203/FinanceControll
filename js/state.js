import { getCurrentMonth, getCurrentYear } from "./ui/formatters.js";

class AppState extends EventTarget {
  constructor() {
    super();
    this.repository = null;
    this.data = {};
    this.filters = {
      year: getCurrentYear(),
      expenseYear: getCurrentYear(),
      expenseMonth: getCurrentMonth()
    };
  }

  bindRepository(repository) {
    this.repository = repository;
    this.data = repository.getAll();
    repository.addEventListener("change", (event) => {
      this.data = event.detail;
      this.emit();
    });
  }

  getData() {
    return this.data;
  }

  getRepository() {
    return this.repository;
  }

  setFilter(key, value) {
    this.filters[key] = Number(value);
    this.emit();
  }

  setFilters(patch) {
    Object.entries(patch).forEach(([key, value]) => {
      this.filters[key] = Number(value);
    });
    this.emit();
  }

  getFilters() {
    return { ...this.filters };
  }

  subscribe(callback) {
    this.addEventListener("change", callback);
    return () => this.removeEventListener("change", callback);
  }

  emit() {
    this.dispatchEvent(new CustomEvent("change", { detail: { data: this.data, filters: this.getFilters() } }));
  }
}

export const appState = new AppState();
