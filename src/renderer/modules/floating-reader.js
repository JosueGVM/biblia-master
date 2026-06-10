import { chapterCounts, currentBook, currentChapter, allAvailableVersions } from '../renderer.js';

let frBook = 'Génesis';
let frChapter = 1;
let frVersion = null;
let isSynced = false;

export function initFloatingReader() {
    const panel = document.getElementById('floating-reader');

    // Poblar selector de versiones
    const select = document.getElementById('fr-version-select');
    allAvailableVersions.forEach(v => {
        const opt = document.createElement('option');
        opt.value = v; opt.innerText = v;
        select.appendChild(opt);
    });
    frVersion = allAvailableVersions[0];
    select.onchange = (e) => { frVersion = e.target.value; loadFRContent(); };

    // Navegación
    document.getElementById('fr-prev').onclick = () => {
        if (frChapter > 1) { frChapter--; }
        else {
            const idx = bibleStructure.findIndex(b => b.name === frBook);
            if (idx > 0) { frBook = bibleStructure[idx - 1].name; frChapter = chapterCounts[frBook] || 1; }
        }
        updateFRHeader();
        loadFRContent();
    };

    document.getElementById('fr-next').onclick = () => {
        const max = chapterCounts[frBook] || 50;
        if (frChapter < max) { frChapter++; }
        else {
            const idx = bibleStructure.findIndex(b => b.name === frBook);
            if (idx < bibleStructure.length - 1) { frBook = bibleStructure[idx + 1].name; frChapter = 1; }
        }
        updateFRHeader();
        loadFRContent();
    };

    // Dropdowns título
    document.getElementById('fr-book-btn').onclick = function (e) {
        e.stopPropagation();
        let drop = document.getElementById('fr-books-dropdown');
        if (!drop) {
            drop = document.createElement('div');
            drop.id = 'fr-books-dropdown';
            drop.className = 'dropdown-overlay';
            document.body.appendChild(drop);
        }
        const rect = this.getBoundingClientRect();
        drop.innerHTML = "";
        bibleStructure.forEach(b => {
            const item = document.createElement('div');
            item.className = "dropdown-item";
            item.innerText = b.name;
            item.onclick = () => { frBook = b.name; frChapter = 1; drop.remove(); updateFRHeader(); loadFRContent(); };
            drop.appendChild(item);
        });
        drop.style.display = 'flex';
        drop.style.left = `${rect.left}px`;
        drop.style.top = `${rect.bottom + 5}px`;
        drop.style.maxHeight = '300px';
    };

    document.getElementById('fr-chapter-btn').onclick = function (e) {
        e.stopPropagation();
        let drop = document.getElementById('fr-chapters-dropdown');
        if (!drop) {
            drop = document.createElement('div');
            drop.id = 'fr-chapters-dropdown';
            drop.className = 'dropdown-overlay';
            document.body.appendChild(drop);
        }
        const rect = this.getBoundingClientRect();
        drop.innerHTML = "";
        const max = chapterCounts[frBook] || 50;
        for (let i = 1; i <= max; i++) {
            const item = document.createElement('div');
            item.className = "dropdown-item";
            item.innerText = i;
            item.onclick = () => { frChapter = i; drop.remove(); updateFRHeader(); loadFRContent(); };
            drop.appendChild(item);
        }
        drop.style.display = 'flex';
        drop.style.width = "80px";
        drop.style.left = `${rect.left}px`;
        drop.style.top = `${rect.bottom + 5}px`;
        drop.style.maxHeight = '300px';
    };

    // Cerrar dropdowns al click fuera
    document.addEventListener('click', (e) => {
        if (!e.target.closest('#fr-book-btn')) { const d = document.getElementById('fr-books-dropdown'); if (d) d.remove(); }
        if (!e.target.closest('#fr-chapter-btn')) { const d = document.getElementById('fr-chapters-dropdown'); if (d) d.remove(); }
    });

    // Botón sync
    document.getElementById('fr-sync-btn').onclick = () => {
        isSynced = !isSynced;
        document.getElementById('fr-sync-btn').classList.toggle('synced', isSynced);
        if (isSynced) syncWithMain();
    };

    // Cerrar
    document.getElementById('fr-close').onclick = () => panel.classList.add('hidden');

    // Drag
    setupDrag(panel, document.getElementById('floating-reader-titlebar'));

    loadFRContent();
}

export function openFloatingReader() {
    const panel = document.getElementById('floating-reader');
    panel.classList.remove('hidden');

    // Si el select no tiene opciones aún, inicializar
    const select = document.getElementById('fr-version-select');
    if (select.options.length === 0) initFloatingReader();
    else loadFRContent();
}

export function syncWithMain() {
    // Sincroniza el lector flotante con el libro/capítulo del lector principal
    frBook = currentBook;
    frChapter = currentChapter;
    updateFRHeader();
    loadFRContent();
}

function updateFRHeader() {
    document.getElementById('fr-book-btn').innerText = frBook;
    document.getElementById('fr-chapter-btn').innerText = frChapter;
}

async function loadFRContent() {
    if (!frVersion) return;
    const content = document.getElementById('floating-reader-content');
    content.innerHTML = "<p style='text-align:center; padding:20px; color:var(--text-muted); font-size:0.85rem;'>Cargando...</p>";

    try {
        const verses = await window.api.getChapter({ version: frVersion, book: frBook, chapter: frChapter });
        const highlights = await window.api.getHighlights({ book: frBook, chapter: frChapter });

        content.innerHTML = "";
        verses.forEach(v => {
            const div = document.createElement('div');
            div.classList.add('verse');
            div.dataset.verse = v.verse_number;
            div.innerHTML = `<span class="verse-number">${v.verse_number}</span>${v.text}`;

            const mark = highlights.find(h => h.verse_number === v.verse_number && h.version === frVersion);
            if (mark && mark.color !== 'transparent') {
                div.style.backgroundColor = mark.color;
                div.classList.add('highlighted');
            }

            content.appendChild(div);
        });
    } catch (err) {
        content.innerHTML = "<p style='text-align:center; padding:20px; color:var(--text-muted);'>Error al cargar</p>";
        console.error(err);
    }
}

function setupDrag(panel, handle) {
    let isDragging = false;
    let startX, startY, startLeft, startTop;

    handle.addEventListener('mousedown', (e) => {
        if (e.target.closest('button') || e.target.closest('select')) return;
        isDragging = true;
        startX = e.clientX;
        startY = e.clientY;
        const rect = panel.getBoundingClientRect();
        startLeft = rect.left;
        startTop = rect.top;
        panel.style.right = 'auto'; // ← desactiva right para usar left
    });

    document.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;
        const newLeft = Math.max(0, Math.min(window.innerWidth - panel.offsetWidth, startLeft + dx));
        const newTop = Math.max(0, Math.min(window.innerHeight - panel.offsetHeight, startTop + dy));
        panel.style.left = newLeft + 'px';
        panel.style.top = newTop + 'px';
    });

    document.addEventListener('mouseup', () => { isDragging = false; });
}