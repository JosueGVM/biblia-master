// Reemplazo Total de src/renderer/renderer.js

let activeVersions = ['RV1960']; 
let allAvailableVersions = [];
let currentBook = 'Génesis';
let currentChapter = 1;

const columnsContainer = document.getElementById('text-columns-container');
const currentTitleLabel = document.getElementById('current-title');
const leftSidebar = document.getElementById('prev-books');
const rightSidebar = document.getElementById('next-books');
const addVersionBtn = document.getElementById('add-version');

// Elementos de búsqueda
const searchInput = document.getElementById('search-input');
const searchBtn = document.getElementById('search-btn');
const searchContainer = document.getElementById('search-results-container');
const resultsList = document.getElementById('results-list');
const closeSearchBtn = document.getElementById('close-search');
const resultsCount = document.getElementById('results-count');

async function init() {
    allAvailableVersions = await window.api.getVersions();
    if (!allAvailableVersions.includes(activeVersions[0])) {
        activeVersions[0] = allAvailableVersions[0] || 'RV1960';
    }
    loadContent();
    setupEventListeners(); // Nueva función para organizar eventos
}

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
        // Usamos text-align: left para evitar espacios feos
        vDiv.innerHTML = `<span class="verse-number">${v.verse_number}</span>${v.text}`;
        body.appendChild(vDiv);
    });

    col.appendChild(header);
    col.appendChild(body);
    columnsContainer.appendChild(col);
}

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
 * LÓGICA DE BÚSQUEDA CORREGIDA
 */
async function performSearch() {
    const query = searchInput.value.trim();
    
    // CAMBIO: Ahora permite 2 letras para buscar "Fe"
    if (query.length < 2) return; 

    // Usamos la primera versión activa para buscar
    const versionBusqueda = activeVersions[0];

    try {
        const results = await window.api.search({ version: versionBusqueda, keyword: query });
        
        resultsList.innerHTML = "";
        searchContainer.classList.remove('hidden');
        resultsCount.innerText = `${results.length} resultados en ${versionBusqueda}`;

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
        console.error("Error en la búsqueda:", err);
    }
}

/**
 * CONFIGURACIÓN DE EVENTOS (Evita bloqueos de input)
 */
function setupEventListeners() {
    addVersionBtn.addEventListener('click', () => {
        const next = allAvailableVersions.find(v => !activeVersions.includes(v)) || allAvailableVersions[0];
        activeVersions.push(next);
        loadContent();
    });

    searchBtn.addEventListener('click', performSearch);

    searchInput.addEventListener('keyup', (e) => {
        if (e.key === "Enter") {
            performSearch();
            searchInput.blur(); // Quita el foco para que se vea el resultado
        }
    });

    closeSearchBtn.addEventListener('click', () => {
        searchContainer.classList.add('hidden');
    });
}

function removeVersion(index) {
    if (activeVersions.length > 1) {
        activeVersions.splice(index, 1);
        loadContent();
    }
}

/**
 * LÓGICA DE SIDEBAR
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