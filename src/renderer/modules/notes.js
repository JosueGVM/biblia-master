import { selectedVerses, editingNoteId, setEditingNoteId, setCurrentBook, setCurrentChapter } from '../renderer.js';
import { loadContent, scrollToVerse } from './content.js';
import { cancelSelection } from './selection.js';

export function openNoteEditor(existingNote = null) {
    const modal = document.getElementById('note-editor-modal');
    const textarea = document.getElementById('note-textarea');
    const refLabel = document.getElementById('note-editor-ref');

    if (existingNote) {
        setEditingNoteId(existingNote.id);
        refLabel.innerText = `Editando: ${existingNote.ref}`;
        textarea.value = existingNote.content;
    } else {
        if (selectedVerses.length === 0) return;
        setEditingNoteId(null);
        selectedVerses.sort((a, b) => a.verse - b.verse);
        const first = selectedVerses[0];
        const last = selectedVerses[selectedVerses.length - 1];
        const range = selectedVerses.length > 1 ? `${first.verse}-${last.verse}` : first.verse;
        refLabel.innerText = `${first.book} ${first.chapter}:${range}`;
        textarea.value = "";
    }
    modal.classList.remove('hidden');
    textarea.focus();
}

export async function saveCurrentNote() {
    const content = document.getElementById('note-textarea').value.trim();
    if (!content) return;

    if (editingNoteId) {
        await window.api.updateNote(editingNoteId, content);
        setEditingNoteId(null);
    } else {
        const first = selectedVerses[0];
        const last = selectedVerses[selectedVerses.length - 1];
        const range = selectedVerses.length > 1 ? `${first.verse}-${last.verse}` : first.verse;
        await window.api.saveNote({ book: first.book, chapter: first.chapter, verse: range.toString(), content, version: first.version });
    }

    document.getElementById('note-editor-modal').classList.add('hidden');
    cancelSelection();
    if (!document.getElementById('notes-modal').classList.contains('hidden')) loadNotes();
}

export async function loadNotes() {
    const notes = await window.api.getNotes();
    const list = document.getElementById('notes-list');
    list.innerHTML = "";
    document.getElementById('notes-modal').classList.remove('hidden');

    if (!notes || notes.length === 0) {
        list.innerHTML = "<p style='text-align:center; padding:20px; color:gray;'>No tienes notas guardadas.</p>";
        return;
    }

    notes.forEach(n => {
        const div = document.createElement('div');
        div.className = "note-item";
        div.innerHTML = `
            <div class="fav-item-header">
                <span class="note-item-ref" style="font-weight:800; color:var(--accent);">${n.book_name} ${n.chapter}:${n.verse_number} (${n.version})</span>
            </div>
            <p style="margin-top:10px; white-space:pre-wrap; color:var(--text-main);">${n.content}</p>
            <div class="item-footer-actions" style="display:flex; justify-content:flex-end; gap:8px; margin-top:15px;">
                <button class="btn-small-action btn-ir">📖 IR</button>
                <button class="btn-small-action btn-editar">✏️ EDITAR</button>
                <button class="btn-small-action btn-eliminar">🗑️ ELIMINAR</button>
            </div>
        `;

        div.querySelector('.btn-ir').addEventListener('click', async () => {
            setCurrentBook(n.book_name);
            setCurrentChapter(n.chapter);
            await loadContent();
            document.getElementById('notes-modal').classList.add('hidden');
            setTimeout(() => scrollToVerse(n.verse_number), 100);
        });

        div.querySelector('.btn-eliminar').addEventListener('click', async () => {
            if (confirm("¿Eliminar esta nota?")) {
                await window.api.deleteNote(n.id);
                loadNotes();
            }
        });

        div.querySelector('.btn-editar').addEventListener('click', () => {
            document.getElementById('notes-modal').classList.add('hidden');
            openNoteEditor({ id: n.id, ref: `${n.book_name} ${n.chapter}:${n.verse_number}`, content: n.content });
        });

        list.appendChild(div);
    });
}