import { ApiRepository } from "./data/api-repository.js";
import { startRouter, rerenderCurrentRoute } from "./router.js";
import { appState } from "./state.js";
import { hydrateIcons } from "./ui/components.js";
import { notify } from "./ui/notifications.js";

async function bootstrap() {
  hydrateIcons(document);

  const repository = new ApiRepository();
  appState.bindRepository(repository);
  bindShellActions(repository);

  try {
    await repository.init();
  } catch (error) {
    updateSyncStatus(repository);
    throw error;
  }

  updateSyncStatus(repository);
  await startRouter();

  appState.subscribe(() => {
    updateSyncStatus(repository);
    rerenderCurrentRoute();
  });
}

function bindShellActions(repository) {
  bindDrawerActions();

  document.getElementById("export-all-data").addEventListener("click", () => {
    repository.exportAll();
    notify("Exportacao iniciada", "Os CSVs foram baixados pelo navegador.");
  });

  document.getElementById("import-data-files").addEventListener("click", () => {
    document.getElementById("csv-file-input").click();
  });

  document.getElementById("csv-file-input").addEventListener("change", async (event) => {
    try {
      const imported = await repository.importFiles(event.target.files);
      event.target.value = "";
      notify("CSVs importados", imported.join(", "));
    } catch (error) {
      notify("Importacao falhou", error.message, "error");
    }
  });

  document.getElementById("refresh-data").addEventListener("click", async () => {
    try {
      await repository.reload();
      notify("Dados recarregados");
    } catch (error) {
      notify("Falha ao recarregar", error.message, "error");
      updateSyncStatus(repository);
    }
  });
}

function bindDrawerActions() {
  const toggle = document.getElementById("mobile-drawer-toggle");
  const close = document.getElementById("close-mobile-drawer");
  const backdrop = document.getElementById("drawer-backdrop");
  const sidebar = document.getElementById("app-sidebar");

  if (!toggle || !backdrop || !sidebar) {
    return;
  }

  const setDrawerOpen = (open) => {
    document.body.classList.toggle("drawer-open", open);
    toggle.setAttribute("aria-expanded", String(open));
    backdrop.hidden = !open;
  };

  toggle.addEventListener("click", () => {
    setDrawerOpen(!document.body.classList.contains("drawer-open"));
  });

  close?.addEventListener("click", () => setDrawerOpen(false));
  backdrop.addEventListener("click", () => setDrawerOpen(false));

  sidebar.querySelectorAll("[data-route-link]").forEach((link) => {
    link.addEventListener("click", () => setDrawerOpen(false));
  });

  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && document.body.classList.contains("drawer-open")) {
      setDrawerOpen(false);
      toggle.focus();
    }
  });

  window.matchMedia("(min-width: 761px)").addEventListener("change", (event) => {
    if (event.matches) {
      setDrawerOpen(false);
    }
  });
}

function updateSyncStatus(repository) {
  const node = document.getElementById("sync-status");
  if (node) {
    node.textContent = repository.getStatusLabel();
  }
}

bootstrap().catch((error) => {
  console.error(error);
  notify("Falha ao iniciar", error.message, "error");
});
