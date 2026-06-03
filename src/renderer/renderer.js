let activeVersions = ['RV1960']; 
let allAvailableVersions = [];
let currentBook = 'Génesis';
let currentChapter = 1;
let selectedVerses = [];

const columnsContainer = document.getElementById('text-columns-container');
const currentTitleLabel = document.getElementById('current-title');
const leftSidebar = document.getElementById('prev-books');
const rightSidebar = document.getElementById('next-books');
const addVersionBtn = document.getElementById('add-version');
const actionToolbar = document.getElementById('action-toolbar');

async function init() {
    allAvailableVersions = await window.api.getVersions();
    loadAppSettings();
    setupStaticEventListeners();
    loadContent();
}

async function loadContent() {
    columnsContainer.innerHTML = "";
    currentTitleLabel.innerText = `${currentBook} ${currentChapter}`;
    selectedVerses = [];
    updateActionToolbar();

    const biblePromise = Promise.all(activeVersions.map(v => 
        window.api.getChapter({ version: v, book: currentBook, chapter: currentChapter })
    ));
    const highlightsPromise = window.api.getHighlights({ book: currentBook, chapter: currentChapter });

    try {
        const [results, highlights] = await Promise.all([biblePromise, highlightsPromise]);
        results.forEach((verses, index) => renderColumn(index, activeVersions[index], verses, highlights));
        updateSidebars(currentBook); // Restaurado
        setupScrollSync();
    } catch (err) { console.error(err); }
}

function renderColumn(index, version, verses, highlights) {
    const col = document.createElement('div');
    col.classList.add('version-column');
    col.dataset.version = version;

    const header = document.createElement('div');
    header.classList.add('column-header');
    const select = document.createElement('select');
    select.classList.add('version-select');
    allAvailableVersions.forEach(v => {
        const opt = document.createElement('option');
        opt.value = v; opt.innerText = v;
        if (v === version) opt.selected = true;
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

        // Lógica de Marcado con clase para contraste
        const mark = highlights.find(h => h.verse_number === v.verse_number && h.version === version);
        if (mark) {
            vDiv.style.backgroundColor = mark.color;
            if (mark.color !== 'transparent') vDiv.classList.add('highlighted');
        }

        vDiv.onclick = () => toggleVerseSelection(vDiv, version, v.verse_number, v.text);
        body.appendChild(vDiv);
    });
    col.appendChild(header); col.appendChild(body);
    columnsContainer.appendChild(col);
}

function toggleVerseSelection(element, version, verseNum, text) {
    const isSelected = element.classList.toggle('selected');
    if (isSelected) {
        selectedVerses.push({ version, book: currentBook, chapter: currentChapter, verse: verseNum, text });
    } else {
        selectedVerses = selectedVerses.filter(v => !(v.verse === verseNum && v.version === version));
    }
    updateActionToolbar();
}

function updateActionToolbar() {
    const info = document.getElementById('selected-info');
    if (selectedVerses.length > 0) {
        actionToolbar.classList.remove('hidden');
        info.innerText = `${selectedVerses.length} seleccionados`;
    } else {
        actionToolbar.classList.add('hidden');
    }
}

async function applyHighlight(color) {
    for (const v of selectedVerses) {
        await window.api.saveHighlight({ book: v.book, chapter: v.chapter, verse: v.verse, version: v.version, color });
        const cols = document.querySelectorAll(`.version-column[data-version="${v.version}"]`);
        cols.forEach(col => {
            const vEl = col.querySelector(`.verse[data-verse="${v.verse}"]`);
            if (vEl) {
                vEl.style.backgroundColor = color === 'transparent' ? '' : color;
                if (color === 'transparent') vEl.classList.remove('highlighted');
                else vEl.classList.add('highlighted');
            }
        });
    }
    cancelSelection();
}

async function copySelected() {
    if (selectedVerses.length === 0) return;
    selectedVerses.sort((a, b) => a.verse - b.verse);
    let text = selectedVerses.map(v => `${v.verse}. ${v.text}`).join(" ");
    const first = selectedVerses[0];
    text += `\n(${first.book} ${first.chapter}:${first.verse}${selectedVerses.length > 1 ? '-' + selectedVerses[selectedVerses.length-1].verse : ''}, ${first.version})`;
    await navigator.clipboard.writeText(text);
    const btn = document.getElementById('action-copy');
    btn.innerText = "✅"; setTimeout(() => { btn.innerText = "📋"; cancelSelection(); }, 1000);
}

function cancelSelection() {
    selectedVerses = [];
    document.querySelectorAll('.verse.selected').forEach(el => el.classList.remove('selected'));
    updateActionToolbar();
}

function setupStaticEventListeners() {
    document.querySelectorAll('.btn-color').forEach(btn => {
        btn.onclick = () => applyHighlight(btn.dataset.color);
    });
    document.querySelector('.btn-color-clear').onclick = () => applyHighlight('transparent');
    
    document.getElementById('action-copy').onclick = copySelected;
    document.getElementById('action-cancel').onclick = cancelSelection;

    document.getElementById('settings-btn').onclick = () => document.getElementById('settings-modal').classList.remove('hidden');
    document.getElementById('close-settings').onclick = () => document.getElementById('settings-modal').classList.add('hidden');

    document.querySelectorAll('.theme-dot').forEach(dot => {
        dot.onclick = () => {
            document.querySelectorAll('.theme-dot').forEach(d => d.classList.remove('active'));
            dot.classList.add('active');
            const theme = dot.dataset.theme;
            document.body.className = theme;
            localStorage.setItem('theme', theme);
        };
    });

    document.getElementById('font-size-slider').oninput = (e) => {
        const size = e.target.value;
        document.getElementById('font-size-value').innerText = size + 'px';
        document.documentElement.style.setProperty('--font-size', size + 'px');
        localStorage.setItem('fontSize', size);
    };

    document.getElementById('font-family-select').onchange = (e) => {
        document.documentElement.style.setProperty('--font-family', e.target.value);
        localStorage.setItem('fontFamily', e.target.value);
    };

    addVersionBtn.onclick = () => {
        const next = allAvailableVersions.find(v => !activeVersions.includes(v)) || allAvailableVersions[0];
        activeVersions.push(next);
        loadContent();
    };

    const searchInput = document.getElementById('search-input');
    const performSearch = async () => {
        const query = searchInput.value.trim();
        if (query.length < 2) return;
        const results = await window.api.search({ version: activeVersions[0], keyword: query });
        const list = document.getElementById('results-list');
        list.innerHTML = "";
        document.getElementById('search-results-container').classList.remove('hidden');
        results.forEach(res => {
            const div = document.createElement('div');
            div.classList.add('search-item');
            div.innerHTML = `<span class="search-item-ref">${res.book_name} ${res.chapter}:${res.verse_number}</span><p>${res.text}</p>`;
            div.onclick = () => { currentBook = res.book_name; currentChapter = res.chapter; document.getElementById('search-results-container').classList.add('hidden'); loadContent(); };
            list.appendChild(div);
        });
    };
    document.getElementById('search-btn').onclick = performSearch;
    searchInput.onkeyup = (e) => { if (e.key === "Enter") performSearch(); };
    document.getElementById('close-search').onclick = () => document.getElementById('search-results-container').classList.add('hidden');
}

function loadAppSettings() {
    const savedSize = localStorage.getItem('fontSize') || '18';
    const savedFont = localStorage.getItem('fontFamily') || "'Segoe UI', sans-serif";
    const savedTheme = localStorage.getItem('theme') || 'theme-dark';
    document.documentElement.style.setProperty('--font-size', savedSize + 'px');
    document.documentElement.style.setProperty('--font-family', savedFont);
    document.body.className = savedTheme;
    document.getElementById('font-size-slider').value = savedSize;
    document.getElementById('font-size-value').innerText = savedSize + 'px';
    document.getElementById('font-family-select').value = savedFont;
    document.querySelectorAll('.theme-dot').forEach(dot => { if (dot.dataset.theme === savedTheme) dot.classList.add('active'); });
}

// SIDEBARS INTELIGENTES (VALIDADOS)
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
        header.onclick = () => { gDiv.classList.toggle('active'); header.querySelector('small').innerText = gDiv.classList.contains('active') ? '▲' : '▼'; };
        const list = document.createElement('div');
        list.classList.add('book-list');
        groups[gName].forEach(b => {
            const item = document.createElement('div');
            item.classList.add('book-item');
            item.innerText = b.name;
            item.onclick = (e) => { e.stopPropagation(); currentBook = b.name; currentChapter = 1; loadContent(); };
            list.appendChild(item);
        });
        gDiv.appendChild(header); gDiv.appendChild(list); container.appendChild(gDiv);
    });
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

window.addEventListener('DOMContentLoaded', init);