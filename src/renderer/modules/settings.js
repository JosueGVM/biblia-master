export function loadAppSettings() {
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

    import('./favorites.js').then(m => m.loadFavorites());
}

export function setupTooltips() {
    const tooltip = document.getElementById('tooltip');
    document.querySelectorAll('[title]').forEach(el => {
        const text = el.getAttribute('title');
        el.removeAttribute('title');
        el.dataset.tooltip = text;
        el.addEventListener('mouseenter', (e) => { tooltip.innerText = el.dataset.tooltip; tooltip.classList.add('visible'); moveTooltip(e); });
        el.addEventListener('mousemove', moveTooltip);
        el.addEventListener('mouseleave', () => tooltip.classList.remove('visible'));
    });

    function moveTooltip(e) {
        const offset = 12;
        let x = e.clientX + offset;
        let y = e.clientY + offset;
        if (x + tooltip.offsetWidth > window.innerWidth) x = e.clientX - tooltip.offsetWidth - offset;
        if (y + tooltip.offsetHeight > window.innerHeight) y = e.clientY - tooltip.offsetHeight - offset;
        tooltip.style.left = x + 'px';
        tooltip.style.top = y + 'px';
    }
}