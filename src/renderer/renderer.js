// Reemplazo Total de src/renderer/renderer.js

let activeVersions = ['RV1960']; 
let allAvailableVersions = []; // Se llenará desde la DB
let currentBook = 'Génesis';
let currentChapter = 1;

const columnsContainer = document.getElementById('text-columns-container');
const currentTitleLabel = document.getElementById('current-title');
const leftSidebar = document.getElementById('prev-books');
const rightSidebar = document.getElementById('next-books');
const addVersionBtn = document.getElementById('add-version');

/**
 * Función inicial: Carga versiones de la DB y luego el contenido
 */
async function init() {
    allAvailableVersions = await window.api.getVersions();
    // Si la versión por defecto no existe en tu DB, usamos la primera que encuentre
    if (!allAvailableVersions.includes(activeVersions[0])) {
        activeVersions[0] = allAvailableVersions[0];
    }
    loadContent();
}

async function loadContent() {
    columnsContainer.innerHTML = "";
    currentTitleLabel.innerText = `${currentBook} ${currentChapter}`;

    const promises = activeVersions.map(v => 
        window.api.getChapter({ version: v, book: currentBook, chapter: currentChapter })
    );

    const results = await Promise.all(promises);
    results.forEach((verses, index) => {
        renderColumn(index, activeVersions[index], verses);
    });
    updateSidebars(currentBook);
}

function renderColumn(index, selectedVersion, verses) {
    const col = document.createElement('div');
    col.classList.add('version-column');

    const header = document.createElement('div');
    header.classList.add('column-header');

    // SELECTOR
    const select = document.createElement('select');
    select.classList.add('version-select');
    
    allAvailableVersions.forEach(v => {
        const opt = document.createElement('option');
        opt.value = v;
        opt.innerText = v;
        if (v === selectedVersion) opt.selected = true;
        select.appendChild(opt);
    });

    // CORRECCIÓN: Evento de cambio que SÍ funciona
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

function removeVersion(index) {
    if (activeVersions.length > 1) {
        activeVersions.splice(index, 1);
        loadContent();
    }
}

addVersionBtn.onclick = () => {
    // Busca una versión que no esté abierta, si todas están abiertas, repite la primera
    const proxima = allAvailableVersions.find(v => !activeVersions.includes(v)) || allAvailableVersions[0];
    activeVersions.push(proxima);
    loadContent();
};

/* --- MANTENER FUNCIONES DE SIDEBAR IGUAL QUE ANTES --- */
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

// Cambiamos el inicio
window.addEventListener('DOMContentLoaded', init);