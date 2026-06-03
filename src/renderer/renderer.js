let activeVersions = ['RV1960']; 
let allAvailableVersions = [];
let currentBook = 'Génesis';
let currentChapter = 1;

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
    const promises = activeVersions.map(v => window.api.getChapter({ version: v, book: currentBook, chapter: currentChapter }));
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
        vDiv.innerHTML = `<span class="verse-number">${v.verse_number}</span>${v.text}`;
        body.appendChild(vDiv);
    });
    col.appendChild(header); col.appendChild(body);
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

async function performSearch() {
    const query = searchInput.value.trim();
    if (query.length < 2) return;
    try {
        const results = await window.api.search({ version: activeVersions[0], keyword: query });
        resultsList.innerHTML = "";
        searchContainer.classList.remove('hidden');
        resultsCount.innerText = `${results.length} resultados en ${activeVersions[0]}`;
        results.forEach(res => {
            const div = document.createElement('div');
            div.classList.add('search-item');
            div.innerHTML = `<span class="search-item-ref">${res.book_name} ${res.chapter}:${res.verse_number}</span><p class="search-item-text">${res.text}</p>`;
            div.onclick = () => { currentBook = res.book_name; currentChapter = res.chapter; searchContainer.classList.add('hidden'); loadContent(); };
            resultsList.appendChild(div);
        });
    } catch (err) { console.error(err); }
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

window.addEventListener('DOMContentLoaded', init);