(function (root) {
  var icons = {
    "layout-dashboard": '<rect width="7" height="9" x="3" y="3" rx="1"></rect><rect width="7" height="5" x="14" y="3" rx="1"></rect><rect width="7" height="9" x="14" y="12" rx="1"></rect><rect width="7" height="5" x="3" y="16" rx="1"></rect>',
    receipt: '<path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z"></path><path d="M8 7h8"></path><path d="M8 11h8"></path><path d="M8 15h5"></path>',
    "folder-open": '<path d="m6 14 1.45-2.9A2 2 0 0 1 9.24 10H20a2 2 0 0 1 1.8 2.9l-2.2 4.4A3 3 0 0 1 16.9 19H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4l2 3h7a2 2 0 0 1 2 2v2"></path>',
    download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><path d="M7 10l5 5 5-5"></path><path d="M12 15V3"></path>',
    upload: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><path d="M17 8l-5-5-5 5"></path><path d="M12 3v12"></path>',
    "refresh-cw": '<path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"></path><path d="M3 21v-5h5"></path><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"></path><path d="M16 8h5V3"></path>',
    plus: '<path d="M5 12h14"></path><path d="M12 5v14"></path>',
    pencil: '<path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"></path><path d="m15 5 4 4"></path>',
    trash: '<path d="M3 6h18"></path><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"></path><path d="M10 11v6"></path><path d="M14 11v6"></path>',
    wallet: '<path d="M20 12V8H6a2 2 0 0 1 0-4h12v4"></path><path d="M4 6v14a2 2 0 0 0 2 2h14v-4"></path><path d="M18 12a2 2 0 0 0 0 4h4v-4Z"></path>',
    card: '<rect width="20" height="14" x="2" y="5" rx="2"></rect><path d="M2 10h20"></path>',
    calendar: '<path d="M8 2v4"></path><path d="M16 2v4"></path><rect width="18" height="18" x="3" y="4" rx="2"></rect><path d="M3 10h18"></path>'
  };

  function render(name) {
    var body = icons[name] || icons.wallet;
    return '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + body + "</svg>";
  }

  function hydrate(scope) {
    var rootNode = scope || document;
    rootNode.querySelectorAll("[data-icon]").forEach(function (node) {
      node.innerHTML = render(node.getAttribute("data-icon"));
    });
  }

  root.FCIcons = { render: render, hydrate: hydrate };
})(window);
