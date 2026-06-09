import { currentBook } from '../renderer.js';
import { loadContent } from './content.js';

export function updateSidebars(bookName) {
    const leftSidebar = document.getElementById('prev-books');
    const rightSidebar = document.getElementById('next-books');
    leftSidebar.innerHTML = "";
    rightSidebar.innerHTML = "";

    const currentIndex = bibleStructure.findIndex(b => b.name === bookName);
    if (currentIndex === -1) return;

    const currentGroup = bibleStructure[currentIndex].group;
    const allGroupsOrdered = [];
    bibleStructure.forEach(b => { if (!allGroupsOrdered.includes(b.group)) allGroupsOrdered.push(b.group); });

    const currentGroupIdx = allGroupsOrdered.indexOf(currentGroup);
    const globalPrevGroupName = allGroupsOrdered[currentGroupIdx - 1] || null;
    const globalNextGroupName = allGroupsOrdered[currentGroupIdx + 1] || null;

    renderSidebarGroups(bibleStructure.slice(0, currentIndex), leftSidebar, "prev", currentGroup, globalPrevGroupName, globalNextGroupName);
    renderSidebarGroups(bibleStructure.slice(currentIndex + 1), rightSidebar, "next", currentGroup, globalPrevGroupName, globalNextGroupName);
}

export function renderSidebarGroups(books, container, side, currentGroup, globalPrevGroupName, globalNextGroupName) {
    if (books.length === 0) return;

    const groups = {};
    books.forEach(b => { if (!groups[b.group]) groups[b.group] = []; groups[b.group].push(b); });

    Object.keys(groups).forEach(gName => {
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
                import('../renderer.js').then(m => {
                    m.setCurrentBook(b.name);
                    m.setCurrentChapter(1);
                    loadContent();
                });
            };
            list.appendChild(item);
        });

        gDiv.appendChild(header);
        gDiv.appendChild(list);
        container.appendChild(gDiv);
    });
}