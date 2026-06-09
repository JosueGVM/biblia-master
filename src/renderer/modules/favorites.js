import { selectedVerses, setFavoritesCache, currentBook, setCurrentBook, setCurrentChapter } from '../renderer.js';
import { loadContent, scrollToVerse } from './content.js';

export async function addToFavorites() {
    if (selectedVerses.length === 0) return;
    try {
        const grouped = {};
        selectedVerses.forEach(v => {
            const key = `${v.book}|${v.chapter}`;
            if (!grouped[key]) grouped[key] = [];
            grouped[key].push(v);
        });
        for (const key in grouped) {
            const verses = grouped[key];
            const first = verses[0];
            const combinedText = verses.map(v => `${v.verse}. ${v.text}`).join(" ");
            const verseRange = verses.length > 1 ? `${verses[0].verse}-${verses[verses.length - 1].verse}` : `${verses[0].verse}`;
            await window.api.saveFavorite({ book: first.book, chapter: first.chapter, verse: verseRange, text: combinedText, version: first.version });
        }
        const btn = document.getElementById('action-fav');
        const originalText = btn.innerText;
        btn.innerText = "✅";
        setTimeout(() => { btn.innerText = originalText; }, 1000);
        setFavoritesCache(await window.api.getFavorites());
    } catch (err) { console.error("Error al guardar favorito:", err); }
}

export async function loadFavorites() {
    try {
        const cache = await window.api.getFavorites();
        setFavoritesCache(cache);
        const list = document.getElementById('favorites-list');
        list.innerHTML = "";

        if (cache.length === 0) {
            list.innerHTML = '<div style="text-align:center; color:var(--text-muted); padding:40px;">📭 No tienes favoritos aún</div>';
            return;
        }

        cache.forEach(fav => {
            const div = document.createElement('div');
            div.classList.add('favorite-item');
            const ref = document.createElement('div');
            ref.classList.add('favorite-ref');
            ref.innerText = `${fav.book_name} ${fav.chapter}:${fav.verse_number}`;
            const text = document.createElement('div');
            text.classList.add('favorite-text');
            text.innerText = fav.text;
            const actions = document.createElement('div');
            actions.classList.add('favorite-actions');
            const goBtn = document.createElement('button');
            goBtn.classList.add('favorite-action-btn');
            goBtn.innerText = "📖 Ir";
            goBtn.onclick = (e) => { e.stopPropagation(); goToFavorite(fav); };
            const delBtn = document.createElement('button');
            delBtn.classList.add('favorite-action-btn');
            delBtn.innerText = "🗑️ Eliminar";
            delBtn.onclick = (e) => { e.stopPropagation(); deleteFavorite(fav); };
            actions.appendChild(goBtn);
            actions.appendChild(delBtn);
            div.appendChild(ref);
            div.appendChild(text);
            div.appendChild(actions);
            list.appendChild(div);
        });
    } catch (err) { console.error("Error al cargar favoritos:", err); }
}

export async function goToFavorite(fav) {
    setCurrentBook(fav.book_name);
    setCurrentChapter(fav.chapter);
    await loadContent();
    document.getElementById('favorites-modal').classList.add('hidden');
    setTimeout(() => scrollToVerse(fav.verse_number), 100);
}

export async function deleteFavorite(fav) {
    try {
        await window.api.removeFavorite({ book: fav.book_name, chapter: fav.chapter, verse: fav.verse_number, version: fav.version });
        await loadFavorites();
    } catch (err) { console.error("Error al eliminar favorito:", err); }
}