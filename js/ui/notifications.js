const DEFAULT_TIMEOUT = 3600;

export function notify(title, message = "", type = "success") {
  const region = document.getElementById("toast-region");
  if (!region) {
    return;
  }

  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  const heading = document.createElement("strong");
  heading.textContent = title;
  toast.appendChild(heading);

  if (message) {
    const copy = document.createElement("p");
    copy.textContent = message;
    toast.appendChild(copy);
  }

  region.appendChild(toast);

  window.setTimeout(() => {
    toast.remove();
  }, DEFAULT_TIMEOUT);
}
