// Estado global
let activeVersions = ['RV1960']; 
let allAvailableVersions = [];
let currentBook = 'Génesis';
let currentChapter = 1;

// Elementos del DOM
const columnsContainer = document.getElementById('text-columns-container');
const currentTitleLabel = document.getElementById('current-title');
const leftSidebar = document.getElementById('prev-books');
const rightSidebar = document.getElementById('next-books');
const addVersionBtn = document.getElementById('add-version');

// Elementos del Buscador
const searchInput = document.getElementById('search-input');
const searchBtn = document.getElementById('search-btn');
const searchContainer = document.getElementById('search-results-container');
const resultsList = document.getElementById('results-list');
const closeSearchBtn = document.getElementById('close-search');
const resultsCount = document.getElementById('results-count');

/**
 * Inicialización
 */
async function init() {
    allAvailableVersions = await window.api.getVersions();
    // Validar que la versión inicial existe
    if (!allAvailableVersions.includes(activeVersions[0])) {
        activeVersions[0] = allAvailableVersions[0] || 'RV1960';
    }
    loadContent();
}

/**
 * Carga el contenido principal
 */
async function loadContent() {
    columnsContainer.innerHTML = "";
    currentTitleLabel.innerText = `${currentBook} ${currentChapter}`;

    const promises = activeVersions.map(v => 
        window.api.getChapter({ version: v, book: currentBook, chapter: currentChapter })
    );

    try {
        const results = await Promise.all(promises);
        results.forEach((verses, index) => {
            renderColumn(index, activeVersions[index], verses);
        });
        updateSidebars(currentBook);
        setupScrollSync();
    } catch (err) {
        console.error("Error al cargar contenido:", err);
    }
}

/**
 * Dibuja una columna
 */
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

    select.addEventListener('change', (e) => {
        activeVersions[index] = e.target.value;
        loadContent();
    });

    const removeBtn = document.createElement('span');
    removeBtn.classList.add('remove-col');
    removeBtn.innerHTML = '✕';
    removeBtn.onclick = () => removeVersion(index);

    header.appendChild(select);
    header.appendChild(removeBtn);

    const body = document.createElement('div');
    verses.forEach(v => {
        const vDiv = document.createElement('div');
        vDiv.classList.add('verse');
        vDiv.innerHTML = `<span class="verse-number">${v.verse_number}</span>${v.text}`;
        body.appendChild(vDiv);
    });

    col.appendChild(header);
    col.appendChild(body);
    columnsContainer.appendChild(col);
}

/**
 * Sincronización de Scroll por Porcentaje
 */
function setupScrollSync() {
    const columns = document.querySelectorAll('.version-column');
    let isSyncing = false;

    columns.forEach(col => {
        col.onscroll = () => {
            if (!isSyncing) {
                isSyncing = true;
                const percentage = col.scrollTop / (col.scrollHeight - col.clientHeight);
                columns.forEach(otherCol => {
                    if (otherCol !== col) {
                        otherCol.scrollTop = percentage * (otherCol.scrollHeight - otherCol.clientHeight);
                    }
                });
                requestAnimationFrame(() => isSyncing = false);
            }
        };
    });
}


/**
 * Función de Búsqueda con Diagnóstico
 */
async function performSearch() {
    const query = searchInput.value.trim();
    
    console.log("Iniciando búsqueda de:", query); // MENSAJE DE CONTROL

    if (query.length < 3) {
        console.warn("Búsqueda demasiado corta");
        return;
    }

    // Usamos la primera versión de la lista
    const versionBusqueda = activeVersions[0];

    try {
        // Llamada a la base de datos
        const results = await window.api.search({ version: versionBusqueda, keyword: query });
        
        console.log("Resultados recibidos de la DB:", results.length); // MENSAJE DE CONTROL

        resultsList.innerHTML = "";
        searchContainer.classList.remove('hidden');
        resultsCount.innerText = `${results.length} resultados en ${versionBusqueda}`;

        if (results.length === 0) {
            resultsList.innerHTML = `<div style="padding:20px; color:gray; text-align:center;">
                                        No se encontraron coincidencias para "${query}" en ${versionBusqueda}.
                                     </div>`;
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
        console.error("Error crítico en el buscador:", err);
    }
}

async function performSearch() {
    const query = searchInput.value.trim();
    console.log("1. Intentando buscar:", query);

    if (query.length < 3) {
        alert("Escribe al menos 3 letras para buscar.");
        return;
    }

    const versionParaBuscar = activeVersions[0];
    console.log("2. Buscando en versión:", versionParaBuscar);

    try {
        // Llamada a la API
        const results = await window.api.search({ version: versionParaBuscar, keyword: query });
        console.log("3. Resultados recibidos:", results.length);

        resultsList.innerHTML = "";
        searchContainer.classList.remove('hidden');
        resultsCount.innerText = `${results.length} resultados en ${versionParaBuscar}`;

        if (results.length === 0) {
            resultsList.innerHTML = `<div style="padding:20px; color:gray; text-align:center;">No hay resultados para "${query}"</div>`;
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

    } catch (error) {
        console.error("Error en la búsqueda:", error);
    }
}

// VINCULACIÓN DE EVENTOS (Pon esto al final del archivo)
if (searchBtn) searchBtn.onclick = performSearch;
if (searchInput) {
    searchInput.onkeyup = (e) => { if (e.key === "Enter") performSearch(); };
}
if (closeSearchBtn) {
    closeSearchBtn.onclick = () => searchContainer.classList.add('hidden');
}
/**
 * Lógica de Sidebars
 */
function updateSidebars(bookName) {
    leftSidebar.innerHTML = "";
    rightSidebar.innerHTML = "";
    const currentIndex = bibleStructure.findIndex(b => b.name === bookName);
    const prevBooks = bibleStructure.slice(0, currentIndex);
    const nextBooks = bibleStructure.slice(currentIndex + 1);
    renderSidebarGroups(prevBooks, leftSidebar, "prev");
    renderSidebarGroups(nextBooks, rightSidebar, "next");
}

function renderSidebarGroups(books, container, side) {
    if (books.length === 0) return;
    const groups = {};
    books.forEach(b => {
        if (!groups[b.group]) groups[b.group] = [];
        groups[b.group].push(b);
    });
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
        gDiv.appendChild(header);
        gDiv.appendChild(list);
        container.appendChild(gDiv);
    });
}


window.addEventListener('DOMContentLoaded', init);