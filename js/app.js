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
