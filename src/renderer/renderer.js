let activeVersions = ['RV1960']; 
let allAvailableVersions = [];
let currentBook = 'Génesis';
let currentChapter = 1;
let selectedVerses = [];

const columnsContainer = document.getElementById('text-columns-container');
const leftSidebar = document.getElementById('prev-books');
const rightSidebar = document.getElementById('next-books');

const chapterCounts = { "Génesis": 50, "Éxodo": 40, "Levítico": 27, "Números": 36, "Deuteronomio": 34, "Josué": 24, "Jueces": 21, "Rut": 4, "1 Samuel": 31, "2 Samuel": 24, "1 Reyes": 22, "2 Reyes": 25, "1 Crónicas": 29, "2 Crónicas": 36, "Esdras": 10, "Nehemías": 13, "Ester": 10, "Job": 42, "Salmos": 150, "Proverbios": 31, "Eclesiastés": 12, "Cantares": 8, "Isaías": 66, "Jeremías": 52, "Lamentaciones": 5, "Ezequiel": 48, "Daniel": 12, "Oseas": 14, "Joel": 3, "Amós": 9, "Abdías": 1, "Jonás": 4, "Miqueas": 7, "Nahúm": 3, "Habacuc": 3, "Sofonías": 3, "Hageo": 2, "Zacarías": 14, "Malaquías": 4, "Mateo": 28, "Marcos": 16, "Lucas": 24, "Juan": 21, "Hechos": 28, "Romanos": 16, "1 Corintios": 16, "2 Corintios": 13, "Gálatas": 6, "Efesios": 6, "Filipenses": 4, "Colosenses": 4, "1 Tesalonicenses": 5, "2 Tesalonicenses": 3, "1 Timoteo": 6, "2 Timoteo": 4, "Tito": 3, "Filemón": 1, "Hebreos": 13, "Santiago": 5, "1 Pedro": 5, "2 Pedro": 3, "1 Juan": 5, "2 Juan": 1, "3 Juan": 1, "Judas": 1, "Apocalipsis": 22 };

async function init() {
    allAvailableVersions = await window.api.getVersions();
    loadAppSettings();
    setupStaticEventListeners();
    loadContent();
}

async function loadContent() {
    columnsContainer.innerHTML = "";
    document.getElementById('book-name-btn').innerText = currentBook;
    document.getElementById('chapter-num-btn').innerText = currentChapter;
    const bookData = bibleStructure.find(b => b.name === currentBook);
    document.getElementById('group-indicator').innerText = bookData ? `| ${bookData.group.toUpperCase()} |` : "";

    selectedVerses = [];
    updateActionToolbar();

    const biblePromise = Promise.all(activeVersions.map(v => window.api.getChapter({ version: v, book: currentBook, chapter: currentChapter })));
    const highlightsPromise = window.api.getHighlights({ book: currentBook, chapter: currentChapter });

    try {
        const [results, highlights] = await Promise.all([biblePromise, highlightsPromise]);
        results.forEach((verses, index) => renderColumn(index, activeVersions[index], verses, highlights));
        updateSidebars(currentBook);
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

    const wrap = document.createElement('div');
    wrap.style.display="flex"; wrap.style.alignItems="center"; wrap.style.gap="10px";
    wrap.appendChild(select); wrap.appendChild(removeBtn);
    header.appendChild(wrap);
    
    const body = document.createElement('div');
    verses.forEach(v => {
        const vDiv = document.createElement('div');
        vDiv.classList.add('verse');
        vDiv.dataset.verse = v.verse_number;
        vDiv.innerHTML = `<span class="verse-number">${v.verse_number}</span>${v.text}`;
        const mark = highlights.find(h => h.verse_number === v.verse_number && h.version === version);
        if (mark) { vDiv.style.backgroundColor = mark.color; vDiv.classList.add('highlighted'); }
        vDiv.onclick = () => toggleVerseSelection(vDiv, version, v.verse_number, v.text);
        body.appendChild(vDiv);
    });
    col.appendChild(header); col.appendChild(body);
    columnsContainer.appendChild(col);
}

function setupStaticEventListeners() {
    window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            document.querySelectorAll('.modal-overlay, .dropdown-overlay').forEach(m => m.classList.add('hidden'));
            cancelSelection();
        }
        if (e.code === 'Space' && document.activeElement.tagName !== 'INPUT') {
            e.preventDefault();
            document.getElementById('search-modal').classList.remove('hidden');
            document.getElementById('search-input').focus();
        }
    });

    document.getElementById('prev-chapter').onclick = () => {
        if (currentChapter > 1) { currentChapter--; loadContent(); }
        else {
            const idx = bibleStructure.findIndex(b => b.name === currentBook);
            if (idx > 0) { currentBook = bibleStructure[idx-1].name; currentChapter = chapterCounts[currentBook] || 1; loadContent(); }
        }
    };
    document.getElementById('next-chapter').onclick = () => {
        const max = chapterCounts[currentBook] || 50;
        if (currentChapter < max) { currentChapter++; loadContent(); }
        else {
            const idx = bibleStructure.findIndex(b => b.name === currentBook);
            if (idx < bibleStructure.length - 1) { currentBook = bibleStructure[idx+1].name; currentChapter = 1; loadContent(); }
        }
    };

    document.getElementById('add-version-left').onclick = () => { activeVersions.unshift(allAvailableVersions[0]); loadContent(); };
    document.getElementById('add-version-right').onclick = () => { activeVersions.push(allAvailableVersions[0]); loadContent(); };

    document.getElementById('btn-open-search').onclick = () => { document.getElementById('search-modal').classList.remove('hidden'); document.getElementById('search-input').focus(); };
    document.getElementById('btn-close-search').onclick = () => document.getElementById('search-modal').classList.add('hidden');
    document.getElementById('settings-btn').onclick = () => document.getElementById('settings-modal').classList.remove('hidden');
    document.getElementById('close-settings').onclick = () => document.getElementById('settings-modal').classList.add('hidden');

    document.querySelectorAll('.theme-dot').forEach(dot => {
        dot.onclick = () => {
            const theme = dot.dataset.theme;
            document.body.className = theme;
            localStorage.setItem('theme', theme);
            document.querySelectorAll('.theme-dot').forEach(d => d.classList.remove('active'));
            dot.classList.add('active');
        };
    });

    document.getElementById('font-size-slider').oninput = (e) => {
        const size = e.target.value;
        document.getElementById('font-size-value').innerText = size + 'px';
        document.documentElement.style.setProperty('--font-size', size + 'px');
        localStorage.setItem('fontSize', size);
    };

    document.getElementById('book-name-btn').onclick = function(e) {
        const drop = document.getElementById('books-dropdown');
        const rect = this.getBoundingClientRect();
        drop.classList.remove('hidden');
        drop.style.left = `${rect.left + (rect.width/2) - (drop.offsetWidth/2)}px`;
        drop.style.top = `${rect.bottom + 10}px`;
        drop.innerHTML = "";
        bibleStructure.forEach(b => {
            const item = document.createElement('div'); item.className = "dropdown-item"; item.innerText = b.name;
            item.onclick = () => { currentBook = b.name; currentChapter = 1; drop.classList.add('hidden'); loadContent(); };
            drop.appendChild(item);
        });
    };

    document.getElementById('chapter-num-btn').onclick = function(e) {
        const drop = document.getElementById('chapters-dropdown');
        const rect = this.getBoundingClientRect();
        drop.classList.remove('hidden');
        drop.style.width = "100px";
        drop.style.left = `${rect.left + (rect.width/2) - (50)}px`;
        drop.style.top = `${rect.bottom + 10}px`;
        drop.innerHTML = "";
        const max = chapterCounts[currentBook] || 50;
        for (let i = 1; i <= max; i++) {
            const item = document.createElement('div'); item.className = "dropdown-item"; item.innerText = i;
            item.onclick = () => { currentChapter = i; drop.classList.add('hidden'); loadContent(); };
            drop.appendChild(item);
        }
    };

    document.getElementById('search-input').onkeyup = async (e) => {
        if (e.key === "Enter") {
            const query = e.target.value.trim();
            if (query.length < 2) return;
            const results = await window.api.search({ version: activeVersions[0], keyword: query });
            const list = document.getElementById('results-list');
            list.innerHTML = "";
            document.getElementById('search-title-display').innerText = `"${query}"`;
            document.getElementById('results-count').innerText = `${results.length} resultados`;
            results.forEach(res => {
                const div = document.createElement('div');
                div.classList.add('search-item');
                div.innerHTML = `<span class="search-item-ref">${res.book_name} ${res.chapter}:${res.verse_number}</span><p>${res.text}</p>`;
                div.onclick = () => { currentBook = res.book_name; currentChapter = res.chapter; document.getElementById('search-modal').classList.add('hidden'); loadContent(); };
                list.appendChild(div);
            });
        }
    };

    document.querySelectorAll('.btn-color').forEach(btn => btn.onclick = () => applyHighlight(btn.dataset.color));
    document.querySelector('.btn-color-clear').onclick = () => applyHighlight('transparent');
    document.getElementById('action-copy').onclick = copySelected;
    document.getElementById('action-cancel').onclick = cancelSelection;
}

function updateSidebars(bookName) {
    leftSidebar.innerHTML = ""; rightSidebar.innerHTML = "";
    const currentIndex = bibleStructure.findIndex(b => b.name === bookName);
    const currentGroup = bibleStructure[currentIndex].group;
    renderSidebarGroups(bibleStructure.slice(0, currentIndex), leftSidebar, "prev", currentGroup);
    renderSidebarGroups(bibleStructure.slice(currentIndex + 1), rightSidebar, "next", currentGroup);
}

function renderSidebarGroups(books, container, side, currentGroup) {
    if (books.length === 0) return;
    const groups = {};
    books.forEach(b => { if (!groups[b.group]) groups[b.group] = []; groups[b.group].push(b); });
    const groupNames = Object.keys(groups);
    groupNames.forEach((gName, idx) => {
        const isNeighbor = (side === "prev" && idx === groupNames.length - 1) || (side === "next" && idx === 0);
        const gDiv = document.createElement('div'); gDiv.classList.add('group-container');
        if (isNeighbor || gName === currentGroup) gDiv.classList.add('active');
        const header = document.createElement('div'); header.classList.add('group-header');
        header.innerHTML = `<span>${gName}</span><small>${gDiv.classList.contains('active') ? '▲' : '▼'}</small>`;
        header.onclick = () => { gDiv.classList.toggle('active'); header.querySelector('small').innerText = gDiv.classList.contains('active') ? '▲' : '▼'; };
        const list = document.createElement('div'); list.classList.add('book-list');
        groups[gName].forEach(b => {
            const item = document.createElement('div'); item.classList.add('book-item'); item.innerText = b.name;
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

function toggleVerseSelection(element, version, verseNum, text) {
    const isSelected = element.classList.toggle('selected');
    if (isSelected) { selectedVerses.push({ version, book: currentBook, chapter: currentChapter, verse: verseNum, text }); }
    else { selectedVerses = selectedVerses.filter(v => !(v.verse === verseNum && v.version === version)); }
    updateActionToolbar();
}

function updateActionToolbar() {
    const toolbar = document.getElementById('action-toolbar');
    if (selectedVerses.length > 0) { toolbar.classList.remove('hidden'); document.getElementById('selected-info').innerText = selectedVerses.length; }
    else { toolbar.classList.add('hidden'); }
}

async function applyHighlight(color) {
    for (const v of selectedVerses) {
        await window.api.saveHighlight({ book: v.book, chapter: v.chapter, verse: v.verse, version: v.version, color });
        const cols = document.querySelectorAll(`.version-column[data-version="${v.version}"]`);
        cols.forEach(col => {
            const vEl = col.querySelector(`.verse[data-verse="${v.verse}"]`);
            if (vEl) {
                vEl.style.backgroundColor = color === 'transparent' ? '' : color;
                if (color === 'transparent') vEl.classList.remove('highlighted'); else vEl.classList.add('highlighted');
                vEl.classList.remove('selected');
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

function loadAppSettings() {
    const savedSize = localStorage.getItem('fontSize') || '18';
    const savedTheme = localStorage.getItem('theme') || 'theme-dark';
    document.documentElement.style.setProperty('--font-size', savedSize + 'px');
    document.body.className = savedTheme;
    document.getElementById('font-size-slider').value = savedSize;
    document.getElementById('font-size-value').innerText = savedSize + 'px';
    document.querySelectorAll('.theme-dot').forEach(dot => { if (dot.dataset.theme === savedTheme) dot.classList.add('active'); });
}

window.addEventListener('DOMContentLoaded', init);