// src/renderer/renderer.js (REEMPLAZO TOTAL)

const textContainer = document.getElementById('text-container');
const currentTitle = document.getElementById('current-title');
const leftSidebar = document.getElementById('prev-books');
const rightSidebar = document.getElementById('next-books');

let currentVersion = 'RV1960'; 

async function loadChapter(version, book, chapter) {
    textContainer.innerHTML = "Cargando...";
    try {
        const verses = await window.api.getChapter({ version, book, chapter });
        currentTitle.innerText = `${book} ${chapter}`;
        textContainer.innerHTML = "";
        
        verses.forEach(v => {
            const verseDiv = document.createElement('div');
            verseDiv.classList.add('verse');
            verseDiv.innerHTML = `<span class="verse-number">${v.verse_number}</span> 
                                  <span class="verse-text">${v.text}</span>`;
            textContainer.appendChild(verseDiv);
        });

        updateSidebars(book);
        textContainer.scrollTop = 0;
    } catch (error) {
        console.error(error);
        textContainer.innerHTML = "Error al cargar datos.";
    }
}

function updateSidebars(currentBookName) {
    leftSidebar.innerHTML = "";
    rightSidebar.innerHTML = "";

    const currentIndex = bibleStructure.findIndex(b => b.name === currentBookName);
    
    // Identificamos el grupo del libro actual
    const currentGroup = bibleStructure[currentIndex].group;

    const prevBooks = bibleStructure.slice(0, currentIndex);
    const nextBooks = bibleStructure.slice(currentIndex + 1);

    // Renderizamos cada lado con su lógica de apertura
    renderGroups(prevBooks, leftSidebar, "prev", currentIndex);
    renderGroups(nextBooks, rightSidebar, "next", currentIndex);
}

function renderGroups(booksArray, container, side, currentIndex) {
    if (booksArray.length === 0) return;

    const groups = {};
    booksArray.forEach(book => {
        if (!groups[book.group]) groups[book.group] = [];
        groups[book.group].push(book);
    });

    const groupNames = Object.keys(groups);

    groupNames.forEach((groupName, index) => {
        const groupDiv = document.createElement('div');
        groupDiv.classList.add('group-container');

        // LÓGICA DE APERTURA AUTOMÁTICA:
        // Si es el lado IZQUIERDO, el ÚLTIMO grupo de la lista es el más cercano.
        // Si es el lado DERECHO, el PRIMER grupo de la lista es el más cercano.
        const isClosestGroup = (side === "prev" && index === groupNames.length - 1) || 
                               (side === "next" && index === 0);

        if (isClosestGroup) {
            groupDiv.classList.add('active', 'is-neighbor');
        }

        const header = document.createElement('div');
        header.classList.add('group-header');
        header.innerHTML = `<span>${groupName}</span> <small>${isClosestGroup ? '▲' : '▼'}</small>`;
        
        header.onclick = () => {
            groupDiv.classList.toggle('active');
            header.querySelector('small').innerText = groupDiv.classList.contains('active') ? '▲' : '▼';
        };

        const list = document.createElement('div');
        list.classList.add('book-list');

        groups[groupName].forEach(book => {
            const item = document.createElement('div');
            item.classList.add('book-item');
            item.innerText = book.name;
            item.onclick = (e) => {
                e.stopPropagation();
                loadChapter(currentVersion, book.name, 1);
            };
            list.appendChild(item);
        });

        groupDiv.appendChild(header);
        groupDiv.appendChild(list);
        container.appendChild(groupDiv);
    });
}

window.addEventListener('DOMContentLoaded', () => {
    loadChapter(currentVersion, 'Génesis', 1);
});