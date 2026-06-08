import {
  renderCategoriesDestinations,
  renderDashboard,
  renderRecurring,
  renderSummaryProjection
} from "./screens/dashboard.js";
import { renderMonthlyControl } from "./screens/controle-mensal.js";
import { renderExpenses } from "./screens/gastos.js";
import { hydrateIcons } from "./ui/components.js";
import { enhanceFormControls } from "./ui/field-controls.js";

const ROUTES = {
  dashboard: {
    title: "Dashboard",
    template: "html/dashboard.html",
    render: renderDashboard
  },
  "categorias-destinos": {
    title: "Categorias e Destinos",
    template: "html/categorias-destinos.html",
    render: renderCategoriesDestinations
  },
  recorrentes: {
    title: "Recorrentes",
    template: "html/recorrentes.html",
    render: renderRecurring
  },
  "resumo-projecao": {
    title: "Resumo e Projecao",
    template: "html/resumo-projecao.html",
    render: renderSummaryProjection
  },
  "controle-mensal": {
    title: "Controle do Mes",
    template: "html/controle-mensal.html",
    render: renderMonthlyControl
  },
  gastos: {
    title: "Registro de Gastos",
    template: "html/gastos.html",
    render: renderExpenses
  }
};

let currentRoute = "";

export async function startRouter() {
  window.addEventListener("hashchange", () => navigate());
  await navigate();
}

export async function navigate(routeName = getRouteFromHash()) {
  const routeKey = ROUTES[routeName] ? routeName : "dashboard";
  const route = ROUTES[routeKey];
  const root = document.getElementById("view-root");
  const title = document.getElementById("page-title");

  if (currentRoute !== routeKey) {
    const response = await fetch(route.template, { cache: "no-store" });
    root.innerHTML = await response.text();
    currentRoute = routeKey;
  }

  title.textContent = route.title;
  updateActiveLinks(routeKey);
  route.render(root);
  hydrateIcons(root);
  enhanceFormControls(root);
  root.focus({ preventScroll: true });
}

export function rerenderCurrentRoute() {
  if (currentRoute && ROUTES[currentRoute]) {
    ROUTES[currentRoute].render(document.getElementById("view-root"));
    hydrateIcons(document.getElementById("view-root"));
    enhanceFormControls(document.getElementById("view-root"));
  }
}

function getRouteFromHash() {
  return window.location.hash.replace("#", "") || "dashboard";
}

function updateActiveLinks(routeKey) {
  document.querySelectorAll("[data-route-link]").forEach((link) => {
    link.classList.toggle("is-active", link.dataset.routeLink === routeKey);
  });
}
