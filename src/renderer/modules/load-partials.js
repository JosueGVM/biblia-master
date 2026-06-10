const PARTIAL_MANIFEST = [
  { target: 'app-container', url: 'partials/titlebar.html',       mode: 'append' },
  { target: 'app-container', url: 'partials/reader-main.html',     mode: 'append' },

  { target: 'app-modals',    url: 'partials/modals/search.html',         mode: 'append' },
  { target: 'app-modals',    url: 'partials/modals/settings.html',       mode: 'append' },
  { target: 'app-modals',    url: 'partials/modals/favorites.html',       mode: 'append' },
  { target: 'app-modals',    url: 'partials/modals/highlights.html',    mode: 'append' },
  { target: 'app-modals',    url: 'partials/modals/notes.html',          mode: 'append' },
  { target: 'app-modals',    url: 'partials/modals/note-editor.html',    mode: 'append' },
  { target: 'app-modals',    url: 'partials/action-toolbar.html',        mode: 'append' },

  { target: 'app-screens',   url: 'partials/screens/outlines.html',     mode: 'append' },
  { target: 'app-screens',   url: 'partials/screens/exegesis.html',      mode: 'append' },

  { target: 'app-floating',  url: 'partials/floating-reader.html',       mode: 'append' },
  { target: 'app-startup',   url: 'partials/startup.html',               mode: 'append' },
];

async function loadPartial({ target, url, mode }) {
  const container = document.getElementById(target);
  if (!container) {
    throw new Error(`[loadPartials] No existe el contenedor #${target}`);
  }

  const html = await window.api.loadPartialHtml(url);

  if (!html || !html.trim()) {
    throw new Error(`[loadPartials] Archivo vacío: ${url}`);
  }

  if (mode === 'replace') {
    container.innerHTML = html;
  } else {
    container.insertAdjacentHTML('beforeend', html);
  }
}

export async function loadPartials(manifest = PARTIAL_MANIFEST) {
  for (const entry of manifest) {
    try {
      await loadPartial(entry);
    } catch (err) {
      console.error(`[loadPartials] Falló: ${entry.url} → #${entry.target}`, err);
      throw err;
    }
  }
}