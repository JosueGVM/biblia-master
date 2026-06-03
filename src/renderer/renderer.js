// src/renderer/renderer.js

// Referencias a los elementos del HTML
const textContainer = document.getElementById('text-container');
const currentTitle = document.getElementById('current-title');

/**
 * Función para cargar y mostrar un capítulo
 */
async function loadChapter(version, book, chapter) {
    // 1. Limpiamos el contenedor
    textContainer.innerHTML = "Cargando...";

    try {
        // 2. Llamamos a la base de datos a través del puente (API)
        // Estos son los mismos nombres que pusimos en preload.js y main.js
        const verses = await window.api.getChapter({ version, book, chapter });

        // 3. Actualizamos el título
        currentTitle.innerText = `${book} ${chapter}`;

        // 4. Limpiamos y dibujamos los versículos
        textContainer.innerHTML = "";
        
        verses.forEach(v => {
            const verseDiv = document.createElement('div');
            verseDiv.classList.add('verse');
            
            // Estructura del versículo: <small>1</small> En el principio...
            verseDiv.innerHTML = `<span class="verse-number">${v.verse_number}</span> 
                                  <span class="verse-text">${v.text}</span>`;
            
            textContainer.appendChild(verseDiv);
        });

    } catch (error) {
        console.error("Error cargando capítulo:", error);
        textContainer.innerHTML = "Error al cargar la base de datos.";
    }
}

// --- INICIO DE LA APP ---
// Al cargar, mostramos Génesis 1 de la versión RV1960 (o la que tengas)
window.addEventListener('DOMContentLoaded', () => {
    loadChapter('RV1960', 'Génesis', 1);
});