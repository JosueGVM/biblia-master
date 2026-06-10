import { setCurrentBook, setCurrentChapter } from '../renderer.js';
import { loadContent, scrollToVerse } from './content.js';

export async function loadHighlights() {
    try {
        const highlights = await window.api.getAllHighlights();
        const list = document.getElementById('highlights-list');
        list.innerHTML = "";

        if (!highlights || highlights.length === 0) {
            list.innerHTML = '<div style="text-align:center; color:var(--text-muted); padding:40px;">🖍️ No tienes highlights aún</div>';
            return;
        }

        highlights.forEach(h => {
            const div = document.createElement('div');
            div.classList.add('highlight-item');
            div.style.borderLeft = `4px solid ${h.color}`;
            div.dataset.color = h.color;
            div.innerHTML = `
                <div class="highlight-body">
                    <span class="highlight-ref">${h.book_name} ${h.chapter}:${h.verse_number} · </span>
                    <span class="highlight-ref-version"> ${h.version}</span>
                </div>
                <div class="item-footer-actions">
                    <button class="btn-small-action btn-hl-ir">📖 IR</button>
                    <button class="btn-small-action btn-hl-del">🗑️ ELIMINAR</button>
                </div>
            `;

            div.querySelector('.btn-hl-ir').onclick = async () => {
                setCurrentBook(h.book_name);
                setCurrentChapter(h.chapter);
                await loadContent();
                document.getElementById('highlights-modal').classList.add('hidden');
                setTimeout(() => scrollToVerse(h.verse_number), 200);
            };

            div.querySelector('.btn-hl-del').onclick = async () => {
                await window.api.saveHighlight({ book: h.book_name, chapter: h.chapter, verse: h.verse_number, version: h.version, color: 'transparent' });
                await loadHighlights();
                import('../renderer.js').then(m => {
                    if (m.currentBook === h.book_name && m.currentChapter === h.chapter) loadContent();
                });
            };

            list.appendChild(div);
        });
    } catch (err) { console.error("Error al cargar highlights:", err); }
}