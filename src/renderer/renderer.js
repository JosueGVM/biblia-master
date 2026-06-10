import { loadContent, scrollToVerse } from './modules/content.js';
import { updateSidebars } from './modules/sidebar.js';
import { toggleVerseSelection, updateActionToolbar, applyHighlight, copySelected, cancelSelection } from './modules/selection.js';
import { addToFavorites, loadFavorites } from './modules/favorites.js';
import { loadNotes, openNoteEditor, saveCurrentNote } from './modules/notes.js';
import { loadHighlights } from './modules/highlights.js';
import { buildFilters, renderFilteredResults } from './modules/search.js';
import { loadAppSettings, setupTooltips } from './modules/settings.js';
import { openOutlinesScreen } from './modules/outlines.js';
import { openExegesisScreen } from './modules/exegesis.js';
import { openFloatingReader, syncWithMain, initFloatingReader } from './modules/floating-reader.js';

// ============================================
// ESTADO GLOBAL — exportado para módulos
// ============================================
export let activeVersions = [];
export let allAvailableVersions = [];
export let currentBook = 'Génesis';
export let currentChapter = 1;
export let selectedVerses = [];
export let favoritesCache = [];
export let editingNoteId = null;
export let searchAllVersions = false;
export let activeFilters = { testament: null, versions: new Set(), books: new Set() };
export let lastSearchResults = [];

// Setters
export const setCurrentBook = (v) => { currentBook = v; };
export const setCurrentChapter = (v) => { currentChapter = v; };
export const setSelectedVerses = (v) => { selectedVerses = v; };
export const setFavoritesCache = (v) => { favoritesCache = v; };
export const setEditingNoteId = (v) => { editingNoteId = v; };
export const setSearchAllVersions = (v) => { searchAllVersions = v; };
export const setActiveFilters = (v) => { activeFilters = v; };
export const setLastSearchResults = (v) => { lastSearchResults = v; };

export const chapterCounts = { "Génesis": 50, "Éxodo": 40, "Levítico": 27, "Números": 36, "Deuteronomio": 34, "Josué": 24, "Jueces": 21, "Rut": 4, "1 Samuel": 31, "2 Samuel": 24, "1 Reyes": 22, "2 Reyes": 25, "1 Crónicas": 29, "2 Crónicas": 36, "Esdras": 10, "Nehemías": 13, "Ester": 10, "Job": 42, "Salmos": 150, "Proverbios": 31, "Eclesiastés": 12, "Cantares": 8, "Isaías": 66, "Jeremías": 52, "Lamentaciones": 5, "Ezequiel": 48, "Daniel": 12, "Oseas": 14, "Joel": 3, "Amós": 9, "Abdías": 1, "Jonás": 4, "Miqueas": 7, "Nahúm": 3, "Habacuc": 3, "Sofonías": 3, "Hageo": 2, "Zacarías": 14, "Malaquías": 4, "Mateo": 28, "Marcos": 16, "Lucas": 24, "Juan": 21, "Hechos": 28, "Romanos": 16, "1 Corintios": 16, "2 Corintios": 13, "Gálatas": 6, "Efesios": 6, "Filipenses": 4, "Colosenses": 4, "1 Tesalonicenses": 5, "2 Tesalonicenses": 3, "1 Timoteo": 6, "2 Timoteo": 4, "Tito": 3, "Filemón": 1, "Hebreos": 13, "Santiago": 5, "1 Pedro": 5, "2 Pedro": 3, "1 Juan": 5, "2 Juan": 1, "3 Juan": 1, "Judas": 1, "Apocalipsis": 22 };

// ============================================
// INIT
// ============================================
async function init() {
    allAvailableVersions = await window.api.getVersions();
    loadAppSettings();
    setupStaticEventListeners();
    if (activeVersions.length === 0) showStartUpSelector();
    else loadContent();
    setupTooltips();
    initFloatingReader();
}

function showStartUpSelector() {
    const modal = document.getElementById('startup-modal');
    const list = document.getElementById('startup-version-list');
    if (!modal || !list) return;
    list.innerHTML = "";
    modal.classList.remove('hidden');
    allAvailableVersions.forEach(v => {
        const btn = document.createElement('button');
        btn.className = "startup-card-btn";
        btn.innerText = v;
        btn.onclick = () => { activeVersions = [v]; modal.classList.add('hidden'); loadContent(); };
        list.appendChild(btn);
    });
}

function getNextAvailableVersion() {
    return allAvailableVersions.find(v => !activeVersions.includes(v)) || allAvailableVersions[0];
}

// ============================================
// EVENTOS ESTÁTICOS
// ============================================
function setupStaticEventListeners() {
    window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            document.querySelectorAll('.modal-overlay, .dropdown-overlay').forEach(m => m.classList.add('hidden'));
            cancelSelection();
        }
        if (e.code === 'Space') {
            const activeTag = document.activeElement.tagName;
            if (activeTag !== 'INPUT' && activeTag !== 'TEXTAREA') {
                e.preventDefault();
                const modal = document.getElementById('search-modal');
                if (modal) { modal.classList.remove('hidden'); document.getElementById('search-input').focus(); }
            }
        }
    });

    document.getElementById('prev-chapter').onclick = () => {
        if (currentChapter > 1) { currentChapter--; loadContent(); }
        else {
            const idx = bibleStructure.findIndex(b => b.name === currentBook);
            if (idx > 0) { currentBook = bibleStructure[idx - 1].name; currentChapter = chapterCounts[currentBook] || 1; loadContent(); }
        }
    };
    document.getElementById('next-chapter').onclick = () => {
        const max = chapterCounts[currentBook] || 50;
        if (currentChapter < max) { currentChapter++; loadContent(); }
        else {
            const idx = bibleStructure.findIndex(b => b.name === currentBook);
            if (idx < bibleStructure.length - 1) { currentBook = bibleStructure[idx + 1].name; currentChapter = 1; loadContent(); }
        }
    };

    document.getElementById('add-version-left').onclick = () => { activeVersions.unshift(getNextAvailableVersion()); loadContent(); };
    document.getElementById('add-version-right').onclick = () => { activeVersions.push(getNextAvailableVersion()); loadContent(); };

    document.getElementById('btn-open-search').onclick = () => { document.getElementById('search-modal').classList.remove('hidden'); document.getElementById('search-input').focus(); };
    document.getElementById('btn-close-search').onclick = () => document.getElementById('search-modal').classList.add('hidden');

    document.getElementById('btn-open-favorites').onclick = async () => { document.getElementById('favorites-modal').classList.remove('hidden'); await loadFavorites(); };
    document.getElementById('btn-close-favorites').onclick = () => document.getElementById('favorites-modal').classList.add('hidden');

    document.getElementById('btn-open-highlights').onclick = async () => { document.getElementById('highlights-modal').classList.remove('hidden'); await loadHighlights(); };
    document.getElementById('btn-close-highlights').onclick = () => document.getElementById('highlights-modal').classList.add('hidden');

    document.getElementById('btn-open-notes').onclick = loadNotes;
    document.getElementById('btn-close-notes').onclick = () => document.getElementById('notes-modal').classList.add('hidden');
    document.getElementById('action-note').onclick = () => openNoteEditor();
    document.getElementById('btn-cancel-note').onclick = () => document.getElementById('note-editor-modal').classList.add('hidden');
    document.getElementById('btn-save-note').onclick = saveCurrentNote;

    document.getElementById('settings-btn').onclick = () => document.getElementById('settings-modal').classList.remove('hidden');
    document.getElementById('close-settings').onclick = () => document.getElementById('settings-modal').classList.add('hidden');

    document.querySelectorAll('.theme-dot').forEach(dot => {
        dot.onclick = () => {
            document.body.className = dot.dataset.theme;
            localStorage.setItem('theme', dot.dataset.theme);
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

    document.getElementById('font-family-select').onchange = (e) => {
        document.documentElement.style.setProperty('--font-family', e.target.value);
        localStorage.setItem('fontFamily', e.target.value);
    };

    document.getElementById('book-name-btn').onclick = function (e) {
        e.stopPropagation();
        let drop = document.getElementById('books-dropdown');
        if (!drop) { drop = document.createElement('div'); drop.id = 'books-dropdown'; drop.className = 'dropdown-overlay'; document.body.appendChild(drop); }
        const rect = this.getBoundingClientRect();
        drop.innerHTML = "";
        bibleStructure.forEach(b => {
            const item = document.createElement('div');
            item.className = "dropdown-item";
            item.innerText = b.name;
            item.onclick = () => { currentBook = b.name; currentChapter = 1; drop.remove(); loadContent(); };
            drop.appendChild(item);
        });
        drop.style.display = 'flex';
        drop.style.left = `${rect.left + (rect.width / 2) - (drop.offsetWidth / 2)}px`;
        drop.style.top = `${rect.bottom + 10}px`;
    };

    document.getElementById('chapter-num-btn').onclick = function (e) {
        e.stopPropagation();
        let drop = document.getElementById('chapters-dropdown');
        if (!drop) { drop = document.createElement('div'); drop.id = 'chapters-dropdown'; drop.className = 'dropdown-overlay'; document.body.appendChild(drop); }
        const rect = this.getBoundingClientRect();
        drop.innerHTML = "";
        const max = chapterCounts[currentBook] || 50;
        for (let i = 1; i <= max; i++) {
            const item = document.createElement('div');
            item.className = "dropdown-item";
            item.innerText = i;
            item.onclick = () => { currentChapter = i; drop.remove(); loadContent(); };
            drop.appendChild(item);
        }
        drop.style.display = 'flex';
        drop.style.width = "100px";
        drop.style.left = `${rect.left + (rect.width / 2) - (drop.offsetWidth / 2)}px`;
        drop.style.top = `${rect.bottom + 10}px`;
    };

    document.addEventListener('click', (e) => {
        if (!e.target.closest('#book-name-btn') && !e.target.closest('.dropdown-overlay')) { const drop = document.getElementById('books-dropdown'); if (drop) drop.remove(); }
        if (!e.target.closest('#chapter-num-btn') && !e.target.closest('.dropdown-overlay')) { const drop = document.getElementById('chapters-dropdown'); if (drop) drop.remove(); }
    });

    document.getElementById('search-mode-toggle').onclick = () => {
        searchAllVersions = !searchAllVersions;
        const btn = document.getElementById('search-mode-toggle');
        btn.classList.toggle('active', searchAllVersions);
        btn.querySelector('span').innerText = searchAllVersions ? 'Todas' : 'Activas';
    };

    const searchInput = document.getElementById('search-input');
    searchInput.onkeyup = async (e) => {
        if (e.key !== "Enter") return;
        const query = e.target.value.trim();
        if (query.length < 2) return;
        const list = document.getElementById('results-list');
        list.innerHTML = "<p style='text-align:center; padding:20px; color:var(--text-muted);'>Buscando...</p>";
        document.getElementById('search-title-display').innerText = `"${query}"`;
        activeFilters = { testament: null, versions: new Set(), books: new Set() };
        lastSearchResults = searchAllVersions
            ? await window.api.searchAll({ keyword: query })
            : await window.api.search({ version: activeVersions[0], keyword: query });
        buildFilters(lastSearchResults);
        renderFilteredResults();
    };

    document.querySelectorAll('.btn-color').forEach(btn => btn.onclick = () => applyHighlight(btn.dataset.color));
    document.querySelector('.btn-color-clear').onclick = () => applyHighlight('transparent');
    document.getElementById('action-copy').onclick = copySelected;
    document.getElementById('action-fav').onclick = addToFavorites;
    document.getElementById('action-cancel').onclick = cancelSelection;

    document.querySelectorAll('.hl-filter-dot').forEach(dot => {
        dot.onclick = () => {
            document.querySelectorAll('.hl-filter-dot').forEach(d => d.classList.remove('active'));
            dot.classList.add('active');
            const color = dot.dataset.color;
            document.querySelectorAll('.highlight-item').forEach(item => {
                item.style.display = (color === 'all' || item.dataset.color === color) ? '' : 'none';
            });
        };
    });

    document.getElementById('btn-hamburger').onclick = (e) => { e.stopPropagation(); document.getElementById('hamburger-dropdown').classList.toggle('hidden'); };
    document.querySelectorAll('.hamburger-item').forEach(item => {
        item.onclick = () => { document.getElementById('hamburger-dropdown').classList.add('hidden'); document.getElementById(item.dataset.target).click(); };
    });
    document.addEventListener('click', (e) => { if (!e.target.closest('#header-hamburger-controls')) document.getElementById('hamburger-dropdown').classList.add('hidden'); });

    document.getElementById('btn-open-outlines').onclick = () => openOutlinesScreen();
    document.getElementById('btn-open-exegesis').onclick = () => openExegesisScreen();
        // Lector flotante (exégesis y bosquejo)
    document.querySelectorAll('.btn-open-floating-reader').forEach(btn => {
    btn.onclick = () => openFloatingReader(); 
    });
}

    document.getElementById('btn-minimize').onclick = () => window.api.windowMinimize();
    document.getElementById('btn-maximize').onclick = () => window.api.windowMaximize();
    document.getElementById('btn-close').onclick = () => window.api.windowClose();

window.addEventListener('DOMContentLoaded', init);