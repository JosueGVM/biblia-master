import { activeVersions, allAvailableVersions, currentBook, currentChapter, selectedVerses, setSelectedVerses } from '../renderer.js';
import { updateSidebars } from './sidebar.js';
import { updateActionToolbar } from './selection.js';

export async function loadContent(targetVerse = null) {
    const columnsContainer = document.getElementById('text-columns-container');
    columnsContainer.innerHTML = "";

    document.getElementById('book-name-btn').innerText = currentBook;
    document.getElementById('chapter-num-btn').innerText = currentChapter;

    const bookData = bibleStructure.find(b => b.name === currentBook);
    document.getElementById('group-indicator').innerText = bookData ? `| ${bookData.group.toUpperCase()} |` : "";

    setSelectedVerses([]);
    updateActionToolbar();

    const biblePromise = Promise.all(activeVersions.map(v =>
        window.api.getChapter({ version: v, book: currentBook, chapter: currentChapter })
    ));
    const highlightsPromise = window.api.getHighlights({ book: currentBook, chapter: currentChapter });

    try {
        const [results, highlights] = await Promise.all([biblePromise, highlightsPromise]);
        results.forEach((verses, index) => renderColumn(index, activeVersions[index], verses, highlights));
        updateSidebars(currentBook);
        setupScrollSync();

        if (targetVerse) {
            setTimeout(() => scrollToVerse(targetVerse), 200);
        }
    } catch (err) { console.error(err); }
}

export function renderColumn(index, version, verses, highlights) {
    const columnsContainer = document.getElementById('text-columns-container');
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

    const removeBtn = document.createElement('button');
    removeBtn.classList.add('remove-col');
    removeBtn.innerHTML = '✕';
    removeBtn.title = 'Eliminar columna';
    removeBtn.onclick = () => { if (activeVersions.length > 1) { activeVersions.splice(index, 1); loadContent(); } };

    const wrap = document.createElement('div');
    wrap.classList.add('column-header-full');
    wrap.style.display = "flex";
    wrap.style.alignItems = "center";
    wrap.style.gap = "10px";
    wrap.appendChild(select);
    wrap.appendChild(removeBtn);
    header.appendChild(wrap);

    const body = document.createElement('div');
    body.style.paddingTop = '10px';
    verses.forEach(v => {
        const vDiv = document.createElement('div');
        vDiv.classList.add('verse');
        vDiv.dataset.verse = v.verse_number;
        vDiv.innerHTML = `<span class="verse-number">${v.verse_number}</span>${v.text}`;

        const mark = highlights.find(h => h.verse_number === v.verse_number && h.version === version);
        if (mark) {
            vDiv.style.backgroundColor = mark.color;
            if (mark.color !== 'transparent') vDiv.classList.add('highlighted');
        }

        vDiv.onclick = () => {
            import('./selection.js').then(m => m.toggleVerseSelection(vDiv, version, v.verse_number, v.text));
        };
        body.appendChild(vDiv);
    });

    col.appendChild(header);
    col.appendChild(body);
    columnsContainer.appendChild(col);
}

export function setupScrollSync() {
    const columns = document.querySelectorAll('.version-column');
    let syncSource = null;

    columns.forEach(col => {
        col.onscroll = () => {
            columns.forEach(c => {
                const header = c.querySelector('.column-header');
                if (header) header.classList.toggle('compact', c.scrollTop > 30);
            });

            if (syncSource && syncSource !== col) return;
            syncSource = col;
            const percentage = col.scrollTop / (col.scrollHeight - col.clientHeight);
            columns.forEach(otherCol => {
                if (otherCol === col) return;
                otherCol.scrollTop = percentage * (otherCol.scrollHeight - otherCol.clientHeight);
            });

            clearTimeout(col._syncTimer);
            col._syncTimer = setTimeout(() => { syncSource = null; }, 50);
        };
    });
}

export function scrollToVerse(verseNumber) {
    const verseEl = document.querySelector(`.verse[data-verse="${verseNumber}"]`);
    if (!verseEl) return;
    const column = verseEl.closest('.version-column');
    if (!column) return;
    const targetScroll = verseEl.offsetTop - (column.clientHeight / 2) + (verseEl.offsetHeight / 2);
    column.scrollTo({ top: targetScroll, behavior: 'smooth' });
    verseEl.classList.add('selected');
    setTimeout(() => verseEl.classList.remove('selected'), 2000);
}