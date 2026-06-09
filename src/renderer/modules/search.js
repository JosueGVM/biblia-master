import { activeVersions, activeFilters, setActiveFilters, lastSearchResults, setLastSearchResults, searchAllVersions } from '../renderer.js';
import { loadContent } from './content.js';

const oldTestament = ["Génesis","Éxodo","Levítico","Números","Deuteronomio","Josué","Jueces","Rut","1 Samuel","2 Samuel","1 Reyes","2 Reyes","1 Crónicas","2 Crónicas","Esdras","Nehemías","Ester","Job","Salmos","Proverbios","Eclesiastés","Cantares","Isaías","Jeremías","Lamentaciones","Ezequiel","Daniel","Oseas","Joel","Amós","Abdías","Jonás","Miqueas","Nahúm","Habacuc","Sofonías","Hageo","Zacarías","Malaquías"];
const newTestament = ["Mateo","Marcos","Lucas","Juan","Hechos","Romanos","1 Corintios","2 Corintios","Gálatas","Efesios","Filipenses","Colosenses","1 Tesalonicenses","2 Tesalonicenses","1 Timoteo","2 Timoteo","Tito","Filemón","Hebreos","Santiago","1 Pedro","2 Pedro","1 Juan","2 Juan","3 Juan","Judas","Apocalipsis"];

export function getTestament(book) {
    if (oldTestament.includes(book)) return 'AT';
    if (newTestament.includes(book)) return 'NT';
    return null;
}

export function buildFilters(results) {
    const bar = document.getElementById('search-filters-bar');
    const scroll = document.getElementById('search-filters-scroll');
    scroll.innerHTML = "";
    if (!results || results.length === 0) { bar.classList.add('hidden'); return; }

    const versions = [...new Set(results.map(r => r.version))];
    const books = [...new Set(results.map(r => r.book_name))];
    const hasAT = books.some(b => oldTestament.includes(b));
    const hasNT = books.some(b => newTestament.includes(b));

    if (hasAT && hasNT) {
        scroll.appendChild(createFilterGroup('Testamento', [{ label: 'A.T.', key: 'AT' }, { label: 'N.T.', key: 'NT' }],
            (key) => { setActiveFilters({ ...activeFilters, testament: activeFilters.testament === key ? null : key }); renderFilteredResults(); updateFilterChips(); },
            (key) => activeFilters.testament === key));
        scroll.appendChild(createSeparator());
    }
    if (versions.length > 1) {
        scroll.appendChild(createFilterGroup('Versión', versions.map(v => ({ label: v, key: v })),
            (key) => { const s = new Set(activeFilters.versions); s.has(key) ? s.delete(key) : s.add(key); setActiveFilters({ ...activeFilters, versions: s }); renderFilteredResults(); updateFilterChips(); },
            (key) => activeFilters.versions.has(key)));
        scroll.appendChild(createSeparator());
    }
    if (books.length > 1) {
        scroll.appendChild(createFilterGroup('Libro', books.map(b => ({ label: b, key: b })),
            (key) => { const s = new Set(activeFilters.books); s.has(key) ? s.delete(key) : s.add(key); setActiveFilters({ ...activeFilters, books: s }); renderFilteredResults(); updateFilterChips(); },
            (key) => activeFilters.books.has(key)));
    }
    bar.classList.remove('hidden');
}

export function createFilterGroup(label, items, onToggle, isActive) {
    const group = document.createElement('div');
    group.classList.add('filter-group');
    const lbl = document.createElement('span');
    lbl.classList.add('filter-group-label');
    lbl.innerText = label;
    group.appendChild(lbl);
    items.forEach(item => {
        const chip = document.createElement('div');
        chip.classList.add('filter-chip');
        chip.innerText = item.label;
        chip.dataset.key = item.key;
        if (isActive(item.key)) chip.classList.add('active');
        chip.onclick = () => onToggle(item.key);
        group.appendChild(chip);
    });
    return group;
}

export function createSeparator() {
    const sep = document.createElement('div');
    sep.classList.add('filter-separator');
    return sep;
}

export function updateFilterChips() {
    document.querySelectorAll('.filter-chip').forEach(chip => {
        const key = chip.dataset.key;
        const isTestament = key === 'AT' || key === 'NT';
        if (isTestament) chip.classList.toggle('active', activeFilters.testament === key);
        else if (activeFilters.versions.has(key)) chip.classList.toggle('active', true);
        else if (activeFilters.books.has(key)) chip.classList.toggle('active', true);
        else chip.classList.toggle('active', false);
    });
}

export function applyFilters(results) {
    return results.filter(r => {
        if (activeFilters.testament && getTestament(r.book_name) !== activeFilters.testament) return false;
        if (activeFilters.versions.size > 0 && !activeFilters.versions.has(r.version)) return false;
        if (activeFilters.books.size > 0 && !activeFilters.books.has(r.book_name)) return false;
        return true;
    });
}

export function renderFilteredResults() {
    const list = document.getElementById('results-list');
    list.innerHTML = "";
    const filtered = applyFilters(lastSearchResults);
    document.getElementById('results-count').innerText = `${filtered.length} resultados`;

    if (filtered.length === 0) {
        list.innerHTML = "<p style='text-align:center; padding:20px; color:var(--text-muted);'>Sin resultados para estos filtros</p>";
        return;
    }

    if (searchAllVersions) {
        const grouped = {};
        filtered.forEach(r => { if (!grouped[r.version]) grouped[r.version] = []; grouped[r.version].push(r); });
        Object.keys(grouped).forEach(version => {
            const vHeader = document.createElement('div');
            vHeader.style.cssText = `padding:8px 0; margin:15px 0 8px 0; font-size:0.7rem; font-weight:800; letter-spacing:2px; color:var(--accent); text-transform:uppercase; border-bottom:1px solid var(--border);`;
            vHeader.innerText = `${version} — ${grouped[version].length} resultados`;
            list.appendChild(vHeader);
            grouped[version].forEach(res => list.appendChild(createResultItem(res, version)));
        });
    } else {
        filtered.forEach(res => list.appendChild(createResultItem(res, res.version)));
    }
}

export function createResultItem(res, version) {
    const div = document.createElement('div');
    div.classList.add('search-item');
    div.innerHTML = `<span class="search-item-ref">${res.book_name} ${res.chapter}:${res.verse_number}</span><p>${res.text}</p>`;
    div.onclick = () => {
        if (!activeVersions.includes(version)) activeVersions.push(version);
        import('../renderer.js').then(m => { m.setCurrentBook(res.book_name); m.setCurrentChapter(res.chapter); });
        document.getElementById('search-modal').classList.add('hidden');
        loadContent(res.verse_number);
    };
    return div;
}