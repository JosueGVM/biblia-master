import { selectedVerses, setSelectedVerses, currentBook, currentChapter } from '../renderer.js';

export function toggleVerseSelection(element, version, verseNum, text) {
    const isSelected = element.classList.toggle('selected');
    if (isSelected) {
        selectedVerses.push({ version, book: currentBook, chapter: currentChapter, verse: verseNum, text });
    } else {
        setSelectedVerses(selectedVerses.filter(v => !(v.verse === verseNum && v.version === version)));
    }
    updateActionToolbar();
}

export function updateActionToolbar() {
    const toolbar = document.getElementById('action-toolbar');
    if (selectedVerses.length > 0) {
        toolbar.classList.remove('hidden');
        document.getElementById('selected-info').innerText = selectedVerses.length;
    } else {
        toolbar.classList.add('hidden');
    }
}

export async function applyHighlight(color) {
    for (const v of selectedVerses) {
        await window.api.saveHighlight({ book: v.book, chapter: v.chapter, verse: v.verse, version: v.version, color });
        const cols = document.querySelectorAll(`.version-column[data-version="${v.version}"]`);
        cols.forEach(col => {
            const vEl = col.querySelector(`.verse[data-verse="${v.verse}"]`);
            if (vEl) {
                vEl.style.backgroundColor = color === 'transparent' ? '' : color;
                if (color === 'transparent') vEl.classList.remove('highlighted');
                else vEl.classList.add('highlighted');
                vEl.classList.remove('selected');
            }
        });
    }
    cancelSelection();
}

export async function copySelected() {
    if (selectedVerses.length === 0) return;
    selectedVerses.sort((a, b) => a.verse - b.verse);
    let text = selectedVerses.map(v => `${v.verse}. ${v.text}`).join(" ");
    const first = selectedVerses[0];
    text += `\n(${first.book} ${first.chapter}:${first.verse}${selectedVerses.length > 1 ? '-' + selectedVerses[selectedVerses.length - 1].verse : ''}, ${first.version})`;
    await navigator.clipboard.writeText(text);
    const btn = document.getElementById('action-copy');
    btn.innerText = "✅";
    setTimeout(() => { btn.innerText = "📋"; cancelSelection(); }, 1000);
}

export function cancelSelection() {
    setSelectedVerses([]);
    document.querySelectorAll('.verse.selected').forEach(el => el.classList.remove('selected'));
    updateActionToolbar();
}