let activeVersions = []; //Empezamos vacío, obliga a seleccionar una versión disponible para comenzar la lectura
let allAvailableVersions = [];
let currentBook = 'Génesis';
let currentChapter = 1;
let selectedVerses = [];
let favoritesCache = []; // ✨ para cachear favoritos
let editingNoteId = null; // ✨ para saber si estamos editando o creando una nota

const columnsContainer = document.getElementById('text-columns-container');
const leftSidebar = document.getElementById('prev-books');
const rightSidebar = document.getElementById('next-books');

// Mapeo de capítulos máximos para los dropdowns
const chapterCounts = { "Génesis": 50, "Éxodo": 40, "Levítico": 27, "Números": 36, "Deuteronomio": 34, "Josué": 24, "Jueces": 21, "Rut": 4, "1 Samuel": 31, "2 Samuel": 24, "1 Reyes": 22, "2 Reyes": 25, "1 Crónicas": 29, "2 Crónicas": 36, "Esdras": 10, "Nehemías": 13, "Ester": 10, "Job": 42, "Salmos": 150, "Proverbios": 31, "Eclesiastés": 12, "Cantares": 8, "Isaías": 66, "Jeremías": 52, "Lamentaciones": 5, "Ezequiel": 48, "Daniel": 12, "Oseas": 14, "Joel": 3, "Amós": 9, "Abdías": 1, "Jonás": 4, "Miqueas": 7, "Nahúm": 3, "Habacuc": 3, "Sofonías": 3, "Hageo": 2, "Zacarías": 14, "Malaquías": 4, "Mateo": 28, "Marcos": 16, "Lucas": 24, "Juan": 21, "Hechos": 28, "Romanos": 16, "1 Corintios": 16, "2 Corintios": 13, "Gálatas": 6, "Efesios": 6, "Filipenses": 4, "Colosenses": 4, "1 Tesalonicenses": 5, "2 Tesalonicenses": 3, "1 Timoteo": 6, "2 Timoteo": 4, "Tito": 3, "Filemón": 1, "Hebreos": 13, "Santiago": 5, "1 Pedro": 5, "2 Pedro": 3, "1 Juan": 5, "2 Juan": 1, "3 Juan": 1, "Judas": 1, "Apocalipsis": 22 };

async function init() {
    console.log("Iniciando aplicación...");
    //1. Cargamos las versiones de bibles.db
    allAvailableVersions = await window.api.getVersions();

    loadAppSettings();
    setupStaticEventListeners();

    //2. Verificamos si hay versiones encontradas
    if (activeVersions.length === 0) {
        showStartUpSelector();
    } else {
        console.error("No hay versiones activas disponibles.");
        // Fallback: si no hay nada, al menos intenta cargar Génesis con algo
        loadContent();
    }
}

function showStartUpSelector() {
    const modal = document.getElementById('startup-modal');
    const list = document.getElementById('startup-version-list');

    if (!modal || !list) return;

    list.innerHTML = ""; //Limpiamos
    modal.classList.remove('hidden'); //Aseguramos que se vea

    allAvailableVersions.forEach(v => {
        const btn = document.createElement('button');
        btn.className = "startup-card-btn";
        btn.innerText = v; // Siglas de la versión

        btn.onclick = () => {
            activeVersions = [v]; // Establecemos la versión elegida
            modal.classList.add('hidden'); // Ocultamos el modal
            loadContent(); // Cargamos Génesis 1 de esa versión
        };
        list.appendChild(btn);
    });
}

async function loadContent() {
    columnsContainer.innerHTML = "";
    
    // Actualizar Header
    document.getElementById('book-name-btn').innerText = currentBook;
    document.getElementById('chapter-num-btn').innerText = currentChapter;
    
    const bookData = bibleStructure.find(b => b.name === currentBook);
    document.getElementById('group-indicator').innerText = bookData ? `| ${bookData.group.toUpperCase()} |` : "";

    selectedVerses = [];
    updateActionToolbar();

    const biblePromise = Promise.all(activeVersions.map(v => 
        window.api.getChapter({ version: v, book: currentBook, chapter: currentChapter })
    ));
    const highlightsPromise = window.api.getHighlights({ book: currentBook, chapter: currentChapter });

    try {
        const [results, highlights] = await Promise.all([biblePromise, highlightsPromise]);
        results.forEach((verses, index) => renderColumn(index, activeVersions[index], verses, highlights));
        
        // Llamada a Sidebars con la nueva lógica de vecinos
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
    
    const removeBtn = document.createElement('button');  // ✅ Button en lugar de span
    removeBtn.classList.add('remove-col');
    removeBtn.innerHTML = '✕';
    removeBtn.title = 'Eliminar columna';  // ✅ Tooltip al pasar mouse
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

// --- LÓGICA DE SIDEBAR INTELIGENTE MEJORADA ---

function updateSidebars(bookName) {
    leftSidebar.innerHTML = ""; 
    rightSidebar.innerHTML = "";

    const currentIndex = bibleStructure.findIndex(b => b.name === bookName);
    if (currentIndex === -1) return;

    const currentGroup = bibleStructure[currentIndex].group;

    // 1. Identificar el orden real de todas las secciones
    const allGroupsOrdered = [];
    bibleStructure.forEach(b => {
        if (!allGroupsOrdered.includes(b.group)) {
            allGroupsOrdered.push(b.group);
        }
    });

    // 2. Encontrar quiénes son los vecinos de la sección actual en la Biblia completa
    const currentGroupIdx = allGroupsOrdered.indexOf(currentGroup);
    const globalPrevGroupName = allGroupsOrdered[currentGroupIdx - 1] || null;
    const globalNextGroupName = allGroupsOrdered[currentGroupIdx + 1] || null;

    const prevBooks = bibleStructure.slice(0, currentIndex);
    const nextBooks = bibleStructure.slice(currentIndex + 1);

    renderSidebarGroups(prevBooks, leftSidebar, "prev", currentGroup, globalPrevGroupName, globalNextGroupName);
    renderSidebarGroups(nextBooks, rightSidebar, "next", currentGroup, globalPrevGroupName, globalNextGroupName);
}

function renderSidebarGroups(books, container, side, currentGroup, globalPrevGroupName, globalNextGroupName) {
    if (books.length === 0) return;

    const groups = {};
    books.forEach(b => {
        if (!groups[b.group]) groups[b.group] = [];
        groups[b.group].push(b);
    });

    const groupNames = Object.keys(groups);

    groupNames.forEach((gName) => {
        // Apertura inteligente:
        // - El grupo actual siempre abierto.
        // - El grupo anterior global abierto en el sidebar izquierdo.
        // - El grupo posterior global abierto en el sidebar derecho.
        const isOpen = (gName === currentGroup) || 
                       (side === "prev" && gName === globalPrevGroupName) || 
                       (side === "next" && gName === globalNextGroupName);

        const gDiv = document.createElement('div');
        gDiv.className = `group-container ${isOpen ? 'active' : ''}`;

        const header = document.createElement('div');
        header.className = 'group-header';
        header.innerHTML = `<span>${gName}</span><small>${isOpen ? '▲' : '▼'}</small>`;
        
        header.onclick = () => {
            const nowActive = gDiv.classList.toggle('active');
            header.querySelector('small').innerText = nowActive ? '▲' : '▼';
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

        gDiv.appendChild(header);
        gDiv.appendChild(list);
        container.appendChild(gDiv);
    });
}

// --- EVENTOS ESTÁTICOS ---

function setupStaticEventListeners() {
    window.addEventListener('keydown', (e) => {
    // 1. Manejo de la tecla Escape (Cerrar todo)
    if (e.key === 'Escape') {
        // Añadimos el nuevo modal del editor de notas a la lista de lo que se cierra con ESC
        document.querySelectorAll('.modal-overlay, .dropdown-overlay').forEach(m => m.classList.add('hidden'));
        cancelSelection();
    }

    // 2. Manejo de la tecla Espacio (Buscador)
    // CORRECCIÓN: Ahora también comprobamos que NO estemos en un TEXTAREA
    if (e.code === 'Space') {
        const activeTag = document.activeElement.tagName;
        
        if (activeTag !== 'INPUT' && activeTag !== 'TEXTAREA') {
            e.preventDefault(); // Evita que la página salte hacia abajo
            const modal = document.getElementById('search-modal');
            if(modal) { 
                modal.classList.remove('hidden'); 
                document.getElementById('search-input').focus(); 
            }
        }
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
    
        // ✨ EVENTOS DE FAVORITOS
    document.getElementById('btn-open-favorites').onclick = async () => { 
        document.getElementById('favorites-modal').classList.remove('hidden'); 
        await loadFavorites(); 
    };
    document.getElementById('btn-close-favorites').onclick = () => document.getElementById('favorites-modal').classList.add('hidden');

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
    
    document.getElementById('font-family-select').onchange = (e) => {
        document.documentElement.style.setProperty('--font-family', e.target.value);
        localStorage.setItem('fontFamily', e.target.value);
    };

    // Dropdowns Título con centrado dinámico
    document.getElementById('book-name-btn').onclick = function(e) {
        e.stopPropagation();

        // Obtener o crear el dropdown si no existe
        let drop = document.getElementById('books-dropdown');
        if (!drop) {
            drop = document.createElement('div');
            drop.id = 'books-dropdown';
            drop.className = 'dropdown-overlay';
            document.body.appendChild(drop);
        }

        const rect = this.getBoundingClientRect();

        drop.innerHTML = "";
        bibleStructure.forEach(b => {
            const item = document.createElement('div'); 
            item.className = "dropdown-item"; 
            item.innerText = b.name;
            item.onclick = () => { 
                currentBook = b.name; 
                currentChapter = 1; 
                drop.remove();
                loadContent(); 
            };
            drop.appendChild(item);
        });

        // Mostrar y posicionar
        drop.style.display = 'flex';
        drop.style.left = `${rect.left + (rect.width/2) - (drop.offsetWidth/2)}px`;
        drop.style.top = `${rect.bottom + 10}px`;
    };

    document.getElementById('chapter-num-btn').onclick = function(e) {
        e.stopPropagation();

        // Obtener o crear el dropdown si no existe
        let drop = document.getElementById('chapters-dropdown');
        if (!drop) {
            drop = document.createElement('div');
            drop.id = 'chapters-dropdown';
            drop.className = 'dropdown-overlay';
            document.body.appendChild(drop);
        }

        const rect = this.getBoundingClientRect();
        drop.innerHTML = "";
        const max = chapterCounts[currentBook] || 50;
        for (let i = 1; i <= max; i++) {
            const item = document.createElement('div'); 
            item.className = "dropdown-item"; 
            item.innerText = i;
            item.onclick = () => { 
                currentChapter = i; 
                drop.remove();
                loadContent(); 
            };
            drop.appendChild(item);
        }

        // Mostrar y posicionar
        drop.style.display = 'flex';
        drop.style.width = "100px";
        drop.style.left = `${rect.left + (rect.width/2) - (drop.offsetWidth/2)}px`;
        drop.style.top = `${rect.bottom + 10}px`;
    };

    // Cerrar dropdowns al hacer clic fuera
    document.addEventListener('click', (e) => {
        if (!e.target.closest('#book-name-btn') && !e.target.closest('.dropdown-overlay')) {
            const drop = document.getElementById('books-dropdown');
            if (drop) drop.remove();
        }
        if (!e.target.closest('#chapter-num-btn') && !e.target.closest('.dropdown-overlay')) {
            const drop = document.getElementById('chapters-dropdown');
            if (drop) drop.remove();
        }
    });

    // Buscador
    const searchInput = document.getElementById('search-input');
    searchInput.onkeyup = async (e) => {
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
                div.innerHTML = `<span class="search-item-ref" style="font-weight:800;">${res.book_name} ${res.chapter}:${res.verse_number}</span><p>${res.text}</p>`;
                div.onclick = () => { currentBook = res.book_name; currentChapter = res.chapter; document.getElementById('search-modal').classList.add('hidden'); loadContent(); };
                list.appendChild(div);
            });
        }
    };

    // Marcatextos y Copiado
    document.querySelectorAll('.btn-color').forEach(btn => btn.onclick = () => applyHighlight(btn.dataset.color));
    document.querySelector('.btn-color-clear').onclick = () => applyHighlight('transparent');
    document.getElementById('action-copy').onclick = copySelected;
    document.getElementById('action-fav').onclick = addToFavorites; // ✨ NUEVA FUNCIÓN
    document.getElementById('action-cancel').onclick = cancelSelection;
    
     // Botón para abrir la lista de notas (Header)
    document.getElementById('btn-open-notes').onclick = loadNotes;
    document.getElementById('btn-close-notes').onclick = () => document.getElementById('notes-modal').classList.add('hidden');

    // Botón para abrir el editor de notas (Barra de acciones)
    document.getElementById('action-note').onclick = () => openNoteEditor();

    // Botones dentro del editor de notas
    document.getElementById('btn-cancel-note').onclick = () => document.getElementById('note-editor-modal').classList.add('hidden');
    document.getElementById('btn-save-note').onclick = saveCurrentNote;

}

// --- FUNCIONES DE SOPORTE ---

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
    const savedFont = localStorage.getItem('fontFamily') || "'Segoe UI', sans-serif";
    document.documentElement.style.setProperty('--font-size', savedSize + 'px');
    document.documentElement.style.setProperty('--font-family', savedFont);
    document.body.className = savedTheme;
    document.getElementById('font-size-slider').value = savedSize;
    document.getElementById('font-size-value').innerText = savedSize + 'px';
    document.getElementById('font-family-select').value = savedFont;
    document.querySelectorAll('.theme-dot').forEach(dot => { if (dot.dataset.theme === savedTheme) dot.classList.add('active'); });
      // ✨ Cargar favoritos al iniciar
    loadFavorites();
}

function showStartupSelector() {
    const modal = document.getElementById('startup-modal');
    const list = document.getElementById('startup-version-list');
    if (!modal || !list) return;

    list.innerHTML = "";
    modal.classList.remove('hidden');

    allAvailableVersions.forEach(v => {
        const btn = document.createElement('button');
        btn.className = "startup-card-btn";
        btn.innerText = v; // Siglas de la versión
        btn.onclick = () => {
            activeVersions = [v]; // Establecemos la versión elegida
            modal.classList.add('hidden'); // Ocultamos el modal
            loadContent(); // Cargamos Génesis 1 de esa versión
        };
        list.appendChild(btn);
    });
}

// ============================================
// ✨ FUNCIONES DE FAVORITOS - MEJORADO
// ============================================

async function addToFavorites() {
    if (selectedVerses.length === 0) return;
    
    try {
        // Agrupar versículos por libro y capítulo
        const grouped = {};
        selectedVerses.forEach(v => {
            const key = `${v.book}|${v.chapter}`;
            if (!grouped[key]) {
                grouped[key] = [];
            }
            grouped[key].push(v);
        });
        
        // Guardar como UN SOLO favorito agrupado
        for (const key in grouped) {
            const verses = grouped[key];
            const first = verses[0];
            
            // Crear texto concatenado de todos los versículos
            const combinedText = verses.map(v => `${v.verse}. ${v.text}`).join(" ");
            const verseRange = verses.length > 1 
                ? `${verses[0].verse}-${verses[verses.length-1].verse}`
                : `${verses[0].verse}`;
            
            await window.api.saveFavorite({ 
                book: first.book, 
                chapter: first.chapter, 
                verse: verseRange,  // Rango de versículos
                text: combinedText,  // Texto combinado
                version: first.version 
            });
        }
        
        // Feedback visual
        const btn = document.getElementById('action-fav');
        const originalText = btn.innerText;
        btn.innerText = "✅";
        setTimeout(() => { btn.innerText = originalText; }, 1000);
        
        // Recargar favoritos
        favoritesCache = await window.api.getFavorites();
        
    } catch (err) {
        console.error("Error al guardar favorito:", err);
    }
}

async function loadFavorites() {
    try {
        favoritesCache = await window.api.getFavorites();
        const list = document.getElementById('favorites-list');
        list.innerHTML = "";
        
        if (favoritesCache.length === 0) {
            list.innerHTML = '<div style="text-align: center; color: var(--text-muted); padding: 40px;">📭 No tienes favoritos aún</div>';
            return;
        }
        
        favoritesCache.forEach(fav => {
            const div = document.createElement('div');
            div.classList.add('favorite-item');
            
            // Referencia del libro y capítulo
            const ref = document.createElement('div');
            ref.classList.add('favorite-ref');
            ref.innerText = `${fav.book_name} ${fav.chapter}:${fav.verse_number}`;
            
            // Texto del/los versículo(s)
            const text = document.createElement('div');
            text.classList.add('favorite-text');
            text.innerText = fav.text;
            
            // Botones de acción
            const actions = document.createElement('div');
            actions.classList.add('favorite-actions');
            
            // Botón: Ir al versículo
            const goBtn = document.createElement('button');
            goBtn.classList.add('favorite-action-btn');
            goBtn.innerText = "📖 Ir";
            goBtn.onclick = (e) => {
                e.stopPropagation();
                goToFavorite(fav);
            };
            
            // Botón: Eliminar
            const delBtn = document.createElement('button');
            delBtn.classList.add('favorite-action-btn');
            delBtn.innerText = "🗑️ Eliminar";
            delBtn.onclick = (e) => {
                e.stopPropagation();
                deleteFavorite(fav);
            };
            
            actions.appendChild(goBtn);
            actions.appendChild(delBtn);
            
            // Armar el contenedor
            div.appendChild(ref);
            div.appendChild(text);
            div.appendChild(actions);
            
            list.appendChild(div);
        });
        
    } catch (err) {
        console.error("Error al cargar favoritos:", err);
    }
}

async function goToFavorite(fav) {
    // Cambiar libro y capítulo
    currentBook = fav.book_name;
    currentChapter = fav.chapter;
    
    // Cargar el contenido
    await loadContent();
    
    // Cerrar modal
    document.getElementById('favorites-modal').classList.add('hidden');
    
    // Esperar a que el DOM se renderice
    setTimeout(() => {
        scrollToVerse(fav.verse_number);
    }, 100);
}

function scrollToVerse(verseNumber) {
    // Encontrar el elemento del versículo
    const verseEl = document.querySelector(`.verse[data-verse="${verseNumber}"]`);
    
    if (!verseEl) {
        console.warn(`Versículo ${verseNumber} no encontrado`);
        return;
    }
    
    // Obtener el contenedor (columna)
    const column = verseEl.closest('.version-column');
    
    if (!column) return;
    
    // Calcular la posición para centrar
    const verseTop = verseEl.offsetTop;
    const columnHeight = column.clientHeight;
    const verseHeight = verseEl.offsetHeight;
    
    // Scroll suave al centro
    const targetScroll = verseTop - (columnHeight / 2) + (verseHeight / 2);
    
    column.scrollTo({
        top: targetScroll,
        behavior: 'smooth'
    });
    
    // Highlight temporal para indicar dónde estamos
    verseEl.classList.add('selected');
    setTimeout(() => {
        verseEl.classList.remove('selected');
    }, 2000);
}

async function deleteFavorite(fav) {
    try {
        await window.api.removeFavorite({
            book: fav.book_name,
            chapter: fav.chapter,
            verse: fav.verse_number,
            version: fav.version
        });
        
        // Recargar lista
        await loadFavorites();
        
    } catch (err) {
        console.error("Error al eliminar favorito:", err);
    }
}

// FUNCIONES DE EDITOR DE NOTAS
function openNoteEditor(existingNote = null) {
    const modal = document.getElementById('note-editor-modal');
    const textarea = document.getElementById('note-textarea');
    const refLabel = document.getElementById('note-editor-ref');

    if (existingNote) {
        // MODO EDICIÓN
        editingNoteId = existingNote.id;
        refLabel.innerText = `Editando: ${existingNote.ref}`;
        textarea.value = existingNote.content;
    } else {
        // MODO NUEVA NOTA
        if (selectedVerses.length === 0) return;
        editingNoteId = null;
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

async function saveCurrentNote() {
    const content = document.getElementById('note-textarea').value.trim();
    if (!content) return;

    if (editingNoteId) {
        // Actualizar nota existente
        await window.api.updateNote(editingNoteId, content);
        editingNoteId = null;
    } else {
        // Guardar nota nueva
        const first = selectedVerses[0];
        const last = selectedVerses[selectedVerses.length - 1];
        const range = selectedVerses.length > 1 ? `${first.verse}-${last.verse}` : first.verse;
        await window.api.saveNote({
            book: first.book, chapter: first.chapter, verse: range.toString(),
            content: content, version: first.version
        });
    }

    document.getElementById('note-editor-modal').classList.add('hidden');
    cancelSelection();
    // Si el modal de la lista estaba abierto, lo refrescamos
    if (!document.getElementById('notes-modal').classList.contains('hidden')) loadNotes();
}

// --- AYUDANTES PARA LOS BOTONES (Globales) ---
window.editNote = (id, ref, content) => {
    document.getElementById('notes-modal').classList.add('hidden');
    openNoteEditor({ id, ref, content });
};

window.deleteNoteBtn = async (id) => {
    if (confirm("¿Eliminar esta nota?")) {
        await window.api.deleteNote(id);
        loadNotes();
    }
};

async function loadNotes() {
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
        div.className = "note-item"; // Usamos la misma clase visual que favoritos
        div.innerHTML = `
            <div class="fav-item-header">
                <span class="note-item-ref" style="font-weight:800;">${n.book_name} ${n.chapter}:${n.verse_number} (${n.version})</span>
            </div>
            <p style="margin-top:10px; white-space: pre-wrap; color: var(--text-main);">${n.content}</p>
            
            <div class="item-footer-actions" style="display:flex; justify-content: flex-end; gap: 8px; margin-top: 15px;">
                <button class="btn-small-action" onclick="event.stopPropagation(); window.goToPassage('${n.book_name}', ${n.chapter}, '${n.verse_number}')">📖 IR</button>
                <button class="btn-small-action" onclick="event.stopPropagation(); window.editNote(${n.id}, '${n.book_name} ${n.chapter}:${n.verse_number}', \`${n.content.replace(/`/g, '\\`').replace(/\$/g, '\\$')}\`)">✏️ EDITAR</button>
                <button class="btn-small-action delete" onclick="event.stopPropagation(); window.deleteNoteBtn(${n.id})">🗑️ ELIMINAR</button>
            </div>
        `;
        list.appendChild(div);
    });
}

window.deleteNoteBtn = async (id) => {
    if(confirm("¿Eliminar esta nota?")) {
        await window.api.deleteNote(id);
        loadNotes();
    }
};

window.addEventListener('DOMContentLoaded', init);