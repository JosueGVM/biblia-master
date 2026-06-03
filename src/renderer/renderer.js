let activeVersions = ['RV1960']; 
let allAvailableVersions = [];
let currentBook = 'Génesis';
let currentChapter = 1;
let selectedVerses = []; // Array para guardar {version, book, chapter, verse, text}

// Nodos DOM
const columnsContainer = document.getElementById('text-columns-container');
const currentTitleLabel = document.getElementById('current-title');
const leftSidebar = document.getElementById('prev-books');
const rightSidebar = document.getElementById('next-books');
const addVersionBtn = document.getElementById('add-version');
const searchInput = document.getElementById('search-input');
const searchBtn = document.getElementById('search-btn');
const searchContainer = document.getElementById('search-results-container');
const resultsList = document.getElementById('results-list');
const closeSearchBtn = document.getElementById('close-search');
const settingsBtn = document.getElementById('settings-btn');
const settingsModal = document.getElementById('settings-modal');
const closeSettingsBtn = document.getElementById('close-settings');
const fontSizeSlider = document.getElementById('font-size-slider');
const fontSizeValue = document.getElementById('font-size-value');
const fontFamilySelect = document.getElementById('font-family-select');
const themeDots = document.querySelectorAll('.theme-dot');

async function init() {
    allAvailableVersions = await window.api.getVersions();
    loadAppSettings();
    loadContent();
    setupEventListeners();
}

async function loadContent() {
    columnsContainer.innerHTML = "";
    currentTitleLabel.innerText = `${currentBook} ${currentChapter}`;

    // 1. Traer versículos de la Biblia
    const promises = activeVersions.map(v => window.api.getChapter({ version: v, book: currentBook, chapter: currentChapter }));
    
    // 2. Traer marcas del usuario
    const hightlights = await window.api.getHightlights({book: currentBook, chapter: currentChapter });
    
    try {
        const results = await Promise.all(promises);
        results.forEach((verses, index) => {
            renderColumn(index, activeVersions[index], verses, hightlights); //Pasamos las marcas
        });

        updateSidebars(currentBook);
        setupScrollSync();
        setupActionEvents(); // Asegurar que los botones de la barra funcionen
    } catch (err) {
        console.error(err);
    }

    const results = await Promise.all(promises);
    results.forEach((verses, index) => renderColumn(index, activeVersions[index], verses));
    updateSidebars(currentBook);
    setupScrollSync();
}

function renderColumn(index, selectedVersion, verses) {
    const col = document.createElement('div');
    col.classList.add('version-column');
    const header = document.createElement('div');
    header.classList.add('column-header');
    const select = document.createElement('select');
    select.classList.add('version-select');
    allAvailableVersions.forEach(v => {
        const opt = document.createElement('option');
        opt.value = v; opt.innerText = v;
        if (v === selectedVersion) opt.selected = true;
        select.appendChild(opt);
    });
    select.addEventListener('change', (e) => { activeVersions[index] = e.target.value; loadContent(); });
    const removeBtn = document.createElement('span');
    removeBtn.classList.add('remove-col');
    removeBtn.innerHTML = '✕';
    removeBtn.onclick = () => { if (activeVersions.length > 1) { activeVersions.splice(index, 1); loadContent(); }};
    header.appendChild(select); header.appendChild(removeBtn);
    const body = document.createElement('div');
    
    verses.forEach(v => {
        const vDiv = document.createElement('div');
        vDiv.classList.add('verse');
        vDiv.dataset.verse = v.verse_number;
        vDiv.innerHTML = `<span class="verse-number">${v.verse_number}</span>${v.text}`;
        
        //BUSCAR SI EL VERSÍCULO TIENE MARCA
        const h = hightlights.find(h => h.verse_number === v.verse_number && h.version === selectedVersion);
        if (h) {
            vDiv.style.backgroundColor = h.color;
        }

        //CLIC PARA SELECCIÓN
        vDiv.onclick = (e) => {
            toggleVerseSelection(vDiv, selectedVersion, v.verse_number, v.text);
            body.appendChild(vDiv);
        };

        body.appendChild(vDiv);
    });
    
    col.appendChild(header); col.appendChild(body);
    columnsContainer.appendChild(col);
}

function toggleVerseSelection(element, version, verseNum, text) {
    const verseData = {
        version: version,
        book: currentBook,
        chapter: currentChapter,
        verse: verseNum,
        text: text
    };

    const isSelected = element.classList.toggle('selected');

    if (isSelected) {
        selectedVerses.push(verseData);
    } else {
        selectedVerses = selectedVerses.filter(v => v.verse !== verseNum || v.version !== version);
    }

    updateActionToolbar()
}

function updateActionToolbar() {
    const toolbar = document.getElementById('action-toolbar');
    const info = document.getElementById('selected-info');

    if (selectedVerses.length > 0) {
        toolbar.classList.remove('hidden');
        info.innerText = `${selectedVerses.length} seleccionados`;
    } else {
        toolbar.classList.add('hidden');
    }
}

// Evento para el botón cancelar de la barra
document.getElementById('action-cancel').onclick = () => {
    selectedVerses = [];
    document.querySelectorAll('.verse.selected').forEach(el => el.classList.remove('selected'));
    updateActionToolbar();
};

function setupScrollSync() {
    const columns = document.querySelectorAll('.version-column');
    let isSyncing = false;
    columns.forEach(col => {
        col.onscroll = () => {
            if (!isSyncing) {
                isSyncing = true;
                const percentage = col.scrollTop / (col.scrollHeight - col.clientHeight);
                columns.forEach(otherCol => { if (otherCol !== col) otherCol.scrollTop = percentage * (otherCol.scrollHeight - otherCol.clientHeight); });
                requestAnimationFrame(() => isSyncing = false);
            }
        };
    });
}

function loadAppSettings() {
    const savedSize = localStorage.getItem('fontSize') || '18';
    const savedFont = localStorage.getItem('fontFamily') || "'Segoe UI', sans-serif";
    const savedTheme = localStorage.getItem('theme') || 'theme-dark';
    document.documentElement.style.setProperty('--font-size', savedSize + 'px');
    document.documentElement.style.setProperty('--font-family', savedFont);
    document.body.className = savedTheme;
    fontSizeSlider.value = savedSize;
    fontSizeValue.innerText = savedSize + 'px';
    fontFamilySelect.value = savedFont;
    themeDots.forEach(dot => { if(dot.getAttribute('data-theme') === savedTheme) dot.classList.add('active'); });
}

function setupEventListeners() {
    themeDots.forEach(dot => {
        dot.addEventListener('click', () => {
            themeDots.forEach(d => d.classList.remove('active'));
            dot.classList.add('active');
            const theme = dot.getAttribute('data-theme');
            document.body.className = theme;
            localStorage.setItem('theme', theme);
        });
    });
    fontSizeSlider.addEventListener('input', (e) => {
        const size = e.target.value;
        fontSizeValue.innerText = size + 'px';
        document.documentElement.style.setProperty('--font-size', size + 'px');
        localStorage.setItem('fontSize', size);
    });
    fontFamilySelect.addEventListener('change', (e) => {
        const font = e.target.value;
        document.documentElement.style.setProperty('--font-family', font);
        localStorage.setItem('fontFamily', font);
    });
    settingsBtn.onclick = () => settingsModal.classList.remove('hidden');
    closeSettingsBtn.onclick = () => settingsModal.classList.add('hidden');
    searchBtn.onclick = performSearch;
    searchInput.onkeyup = (e) => { if (e.key === "Enter") performSearch(); };
    closeSearchBtn.onclick = () => searchContainer.classList.add('hidden');
    addVersionBtn.onclick = () => {
        const next = allAvailableVersions.find(v => !activeVersions.includes(v)) || allAvailableVersions[0];
        activeVersions.push(next);
        loadContent();
    };
}

/**
 * BUSCADOR CORREGIDO PARA PRODUCCIÓN
 */
async function performSearch() {
    const query = searchInput.value.trim();
    if (query.length < 2) return;

    // Usamos la versión de la primera columna para buscar
    const versionBusqueda = activeVersions[0];
    const resultsCountLabel = document.getElementById('results-count');

    try {
        const results = await window.api.search({ version: versionBusqueda, keyword: query });
        
        resultsList.innerHTML = "";
        searchContainer.classList.remove('hidden');
        resultsCountLabel.innerText = `${results.length} resultados encontrados en ${versionBusqueda}`;

        if (results.length === 0) {
            resultsList.innerHTML = `<div style="padding:20px; color:gray; text-align:center;">No se encontraron resultados para "${query}".</div>`;
            return;
        }

        results.forEach(res => {
            const div = document.createElement('div');
            div.classList.add('search-item');
            div.innerHTML = `
                <span class="search-item-ref">${res.book_name} ${res.chapter}:${res.verse_number}</span>
                <p class="search-item-text">${res.text}</p>
            `;
            div.onclick = () => {
                currentBook = res.book_name;
                currentChapter = res.chapter;
                searchContainer.classList.add('hidden');
                loadContent();
            };
            resultsList.appendChild(div);
        });
    } catch (err) {
        console.error("Error en búsqueda:", err);
    }
}

function updateSidebars(bookName) {
    leftSidebar.innerHTML = ""; rightSidebar.innerHTML = "";
    const currentIndex = bibleStructure.findIndex(b => b.name === bookName);
    renderSidebarGroups(bibleStructure.slice(0, currentIndex), leftSidebar, "prev");
    renderSidebarGroups(bibleStructure.slice(currentIndex + 1), rightSidebar, "next");
}

function renderSidebarGroups(books, container, side) {
    if (books.length === 0) return;
    const groups = {};
    books.forEach(b => { if (!groups[b.group]) groups[b.group] = []; groups[b.group].push(b); });
    const groupNames = Object.keys(groups);
    groupNames.forEach((gName, idx) => {
        const isNeighbor = (side === "prev" && idx === groupNames.length - 1) || (side === "next" && idx === 0);
        const gDiv = document.createElement('div');
        gDiv.classList.add('group-container');
        if (isNeighbor) gDiv.classList.add('active');
        const header = document.createElement('div');
        header.classList.add('group-header');
        header.innerHTML = `<span>${gName}</span><small>${isNeighbor ? '▲' : '▼'}</small>`;
        header.onclick = () => {
            gDiv.classList.toggle('active');
            header.querySelector('small').innerText = gDiv.classList.contains('active') ? '▲' : '▼';
        };
        const list = document.createElement('div');
        list.classList.add('book-list');
        groups[gName].forEach(b => {
            const item = document.createElement('div');
            item.classList.add('book-item');
            item.innerText = b.name;
            item.onclick = (e) => {
                e.stopPropagation();
                currentBook = b.name;
                currentChapter = 1;
                loadContent();
            };
            list.appendChild(item);
        });
        gDiv.appendChild(header); gDiv.appendChild(list); container.appendChild(gDiv);
    });
}

/**
 * ACCIÓN: COPIAR AL PORTAPAPELES
 */
async function copySelectedVerses() {
    if (selectedVerses.length === 0) return;

    // Ordenamos por número de versículo para que la cita sea coherente
    selectedVerses.sort((a, b) => a.verse - b.verse);

    let textToCopy = "";
    const first = selectedVerses[0];
    
    // Construimos el cuerpo del texto
    selectedVerses.forEach(v => {
        textToCopy += `${v.verse}. ${v.text} `;
    });

    // Añadimos la referencia al final
    // Ejemplo: (Génesis 1:1-3, RV1960)
    const lastVerse = selectedVerses[selectedVerses.length - 1].verse;
    const range = selectedVerses.length > 1 ? `${first.verse}-${lastVerse}` : first.verse;
    
    textToCopy += `\n(${first.book} ${first.chapter}:${range}, ${first.version})`;

    await navigator.clipboard.writeText(textToCopy);
    
    // Feedback visual rápido y limpiar
    const copyBtn = document.getElementById('action-copy');
    const originalIcon = copyBtn.innerText;
    copyBtn.innerText = "✅";
    setTimeout(() => {
        copyBtn.innerText = originalIcon;
        clearSelection();
    }, 1000);
}

/**
 * ACCIÓN: MARCATEXTOS (HIGHLIGHTS)
 */
async function applyHighlight(color) {
    for (const v of selectedVerses) {
        // 1. Guardar en la base de datos de usuario
        await window.api.saveHighlight({
            book: v.book,
            chapter: v.chapter,
            verse: v.verse,
            version: v.version,
            color: color
        });

        // 2. Aplicar color en la interfaz inmediatamente
        const selector = `.version-column:has(.version-select[value="${v.version}"]) .verse[data-verse="${v.verse}"]`;
        // Nota: Como la UI es dinámica, buscamos el elemento actual
        const allColumns = document.querySelectorAll('.version-column');
        allColumns.forEach(col => {
            const select = col.querySelector('.version-select');
            if (select && select.value === v.version) {
                const vEl = col.querySelector(`.verse[data-verse="${v.verse}"]`);
                if (vEl) vEl.style.backgroundColor = color;
            }
        });
    }
    clearSelection();
}

/**
 * LIMPIAR SELECCIÓN
 */
function clearSelection() {
    selectedVerses = [];
    document.querySelectorAll('.verse.selected').forEach(el => el.classList.remove('selected'));
    updateActionToolbar();
}

// --- ACTUALIZAR EVENTOS ---
// Añade esto dentro de tu función setupEventListeners()
function setupActionEvents() {
    document.getElementById('action-copy').onclick = copySelectedVerses;

    // Colores del Marcatextos
    document.querySelectorAll('.btn-color').forEach(btn => {
        btn.onclick = () => applyHighlight(btn.dataset.color);
    });

    // Botón Favoritos (Próximamente)
    document.getElementById('action-fav').onclick = () => alert("Función Favoritos próximamente...");
}

window.addEventListener('DOMContentLoaded', init);