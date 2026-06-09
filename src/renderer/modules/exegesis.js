    // ============================================
    // ✨ PANTALLA DE EXÉGESIS
    // ============================================


    let currentExegesisId = null;
    
    function openExegesisScreen() {
        document.getElementById('exegesis-screen').classList.remove('hidden');
        loadExegesisList();
    }
    
    function closeExegesisScreen() {
        document.getElementById('exegesis-screen').classList.add('hidden');
        currentExegesisId = null;
    }
    
    async function loadExegesisList() {
        showExegesisView('list');
        const grid = document.getElementById('exegesis-grid');
        grid.innerHTML = '';
    
        const list = await window.api.getExegesisList();
        if (!list || list.length === 0) return;
    
        list.forEach(e => {
            const card = document.createElement('div');
            card.classList.add('outline-card');
            card.innerHTML = `
                <div class="outline-card-type">📚 Análisis Exegético</div>
                <div class="outline-card-title">${e.title || 'Sin título'}</div>
                ${e.passage ? `<div style="font-size:0.8rem; color:var(--accent); font-weight:700;">${e.passage}</div>` : ''}
                <div class="outline-card-date">${new Date(e.updated_at).toLocaleDateString('es-MX', { year:'numeric', month:'long', day:'numeric' })}</div>
                <div class="outline-card-actions">
                    <button class="btn-small-action btn-edit-ex">✏️ Editar</button>
                    <button class="btn-small-action btn-delete-ex">🗑️ Eliminar</button>
                </div>
            `;
        
            card.querySelector('.btn-edit-ex').onclick = (e) => { e.stopPropagation(); openExegesisEditor(card._id); };
            card.querySelector('.btn-delete-ex').onclick = async (ev) => {
                ev.stopPropagation();
                if (confirm(`¿Eliminar "${e.title || 'Sin título'}"?`)) {
                    await window.api.deleteExegesis(e.id);
                    loadExegesisList();
                }
            };
        
            card._id = e.id;
            card.onclick = () => openExegesisEditor(e.id);
            grid.appendChild(card);
        });
    }
    
    function showExegesisView(view) {
        document.getElementById('exegesis-list-view').classList.toggle('hidden', view !== 'list');
        document.getElementById('exegesis-editor-view').classList.toggle('hidden', view !== 'editor');
    }
    
    const exegesisFields = [
        'delimitacion', 'proposito', 'tesis',
        'autoria', 'fecha-lugar', 'proposito-original',
        'genero', 'relacion', 'estructura',
        'analisis-palabras', 'gramatica', 'traduccion',
        'ensenanza-original', 'mensaje-central',
        'relevancia', 'ejemplos',
        'resumen', 'reflexion'
    ];
    
    function clearExegesisEditor() {
        document.getElementById('exegesis-title-input').value = '';
        document.getElementById('exegesis-passage-input').value = '';
        exegesisFields.forEach(f => {
            const el = document.getElementById(`ex-${f}`);
            if (el) el.value = '';
        });
    }
    
    async function openExegesisEditor(id = null) {
        currentExegesisId = id;
        clearExegesisEditor();
    
        if (id) {
            const data = await window.api.getExegesisById(id);
            document.getElementById('exegesis-title-input').value = data.title || '';
            document.getElementById('exegesis-passage-input').value = data.passage || '';
            document.getElementById('ex-delimitacion').value = data.delimitacion || '';
            document.getElementById('ex-proposito').value = data.proposito || '';
            document.getElementById('ex-tesis').value = data.tesis || '';
            document.getElementById('ex-autoria').value = data.autoria || '';
            document.getElementById('ex-fecha-lugar').value = data.fecha_lugar || '';
            document.getElementById('ex-proposito-original').value = data.proposito_original || '';
            document.getElementById('ex-genero').value = data.genero || '';
            document.getElementById('ex-relacion').value = data.relacion || '';
            document.getElementById('ex-estructura').value = data.estructura || '';
            document.getElementById('ex-analisis-palabras').value = data.analisis_palabras || '';
            document.getElementById('ex-gramatica').value = data.gramatica || '';
            document.getElementById('ex-traduccion').value = data.traduccion || '';
            document.getElementById('ex-ensenanza-original').value = data.ensenanza_original || '';
            document.getElementById('ex-mensaje-central').value = data.mensaje_central || '';
            document.getElementById('ex-relevancia').value = data.relevancia || '';
            document.getElementById('ex-ejemplos').value = data.ejemplos || '';
            document.getElementById('ex-resumen').value = data.resumen || '';
            document.getElementById('ex-reflexion').value = data.reflexion || '';
        }
    
        showExegesisView('editor');
    }
    
    function getExegesisData() {
        return {
            title: document.getElementById('exegesis-title-input').value.trim() || 'Sin título',
            passage: document.getElementById('exegesis-passage-input').value.trim(),
            delimitacion: document.getElementById('ex-delimitacion').value,
            proposito: document.getElementById('ex-proposito').value,
            tesis: document.getElementById('ex-tesis').value,
            autoria: document.getElementById('ex-autoria').value,
            fecha_lugar: document.getElementById('ex-fecha-lugar').value,
            proposito_original: document.getElementById('ex-proposito-original').value,
            genero: document.getElementById('ex-genero').value,
            relacion: document.getElementById('ex-relacion').value,
            estructura: document.getElementById('ex-estructura').value,
            analisis_palabras: document.getElementById('ex-analisis-palabras').value,
            gramatica: document.getElementById('ex-gramatica').value,
            traduccion: document.getElementById('ex-traduccion').value,
            ensenanza_original: document.getElementById('ex-ensenanza-original').value,
            mensaje_central: document.getElementById('ex-mensaje-central').value,
            relevancia: document.getElementById('ex-relevancia').value,
            ejemplos: document.getElementById('ex-ejemplos').value,
            resumen: document.getElementById('ex-resumen').value,
            reflexion: document.getElementById('ex-reflexion').value,
        };
    }
    
    async function saveCurrentExegesis() {
        const data = getExegesisData();
    
        try {
            if (currentExegesisId) {
                data.id = currentExegesisId;
                await window.api.updateExegesis(data);
            } else {
                const result = await window.api.saveExegesis(data);
                currentExegesisId = result.id;
            }
        
            const btn = document.getElementById('btn-save-exegesis');
            btn.innerText = '✅ Guardado';
            setTimeout(() => { btn.innerText = 'Guardar'; }, 1500);
        
        } catch (err) {
            console.error('Error al guardar exégesis:', err);
        }
    }
    
    async function exportExegesisToPdf() {
        const data = getExegesisData();
    
        const section = (num, title, fields) => {
            const content = fields.filter(f => f.value).map(f => `
                <div class="field">
                    <div class="field-label">${f.label}</div>
                    <div class="field-content">${f.value.replace(/\n/g, '<br>')}</div>
                </div>
            `).join('');
            if (!content) return '';
            return `
                <div class="section">
                    <div class="section-title"><span class="section-num">${num}</span>${title}</div>
                    ${content}
                </div>
            `;
        };
    
        const bodyHtml = [
            section(1, 'Introducción y Delimitación', [
                { label: 'Delimitación del texto', value: data.delimitacion },
                { label: 'Propósito', value: data.proposito },
                { label: 'Declaración de Tesis', value: data.tesis },
            ]),
            section(2, 'Contexto Histórico y Cultural', [
                { label: 'Autoría', value: data.autoria },
                { label: 'Fecha y Lugar', value: data.fecha_lugar },
                { label: 'Propósito Original', value: data.proposito_original },
            ]),
            section(3, 'Contexto Literario', [
                { label: 'Género', value: data.genero },
                { label: 'Relación con el libro', value: data.relacion },
                { label: 'Estructura', value: data.estructura },
            ]),
            section(4, 'Análisis Gramatical y Léxico', [
                { label: 'Análisis de Palabras', value: data.analisis_palabras },
                { label: 'Gramática', value: data.gramatica },
                { label: 'Comparación de Traducciones', value: data.traduccion },
            ]),
            section(5, 'Significado Teológico', [
                { label: 'Enseñanza Original', value: data.ensenanza_original },
                { label: 'Mensaje Central', value: data.mensaje_central },
            ]),
            section(6, 'Aplicación Contemporánea', [
                { label: 'Relevancia Actual', value: data.relevancia },
                { label: 'Ejemplos Prácticos', value: data.ejemplos },
            ]),
            section(7, 'Conclusión', [
                { label: 'Resumen', value: data.resumen },
                { label: 'Reflexión Final', value: data.reflexion },
            ]),
        ].join('');
    
        const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <style>
                    * { margin: 0; padding: 0; box-sizing: border-box; }
                    body { font-family: 'Georgia', serif; color: #222; font-size: 11pt; line-height: 1.7; }
    
                    .doc-header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 15px; margin-bottom: 30px; }
                    .doc-header .doc-type { font-size: 8pt; letter-spacing: 3px; text-transform: uppercase; color: #666; margin-bottom: 6px; }
                    .doc-header h1 { font-size: 20pt; font-weight: 900; margin-bottom: 5px; }
                    .doc-header .passage { font-size: 11pt; color: #555; font-style: italic; }
    
                    .section { margin-bottom: 25px; page-break-inside: avoid; }
                    .section-title { display: flex; align-items: center; gap: 10px; font-size: 12pt; font-weight: 800; margin-bottom: 12px; border-bottom: 1px solid #ddd; padding-bottom: 6px; }
                    .section-num { width: 22px; height: 22px; background: #333; color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 8pt; font-weight: 900; flex-shrink: 0; }
    
                    .field { margin-bottom: 12px; padding-left: 10px; }
                    .field-label { font-size: 8pt; font-weight: 900; letter-spacing: 1.5px; text-transform: uppercase; color: #555; margin-bottom: 4px; }
                    .field-content { font-size: 10.5pt; color: #222; }
    
                    .doc-footer { text-align: center; margin-top: 30px; padding-top: 10px; border-top: 1px solid #ccc; font-size: 8pt; color: #999; }
                </style>
            </head>
            <body>
                <div class="doc-header">
                    <div class="doc-type">Análisis Exegético</div>
                    <h1>${data.title}</h1>
                    ${data.passage ? `<div class="passage">${data.passage}</div>` : ''}
                </div>
                ${bodyHtml}
                <div class="doc-footer">Biblia Master — ${new Date().toLocaleDateString('es-MX', { year:'numeric', month:'long', day:'numeric' })}</div>
            </body>
            </html>
        `;
    
        try {
            const result = await window.api.exportOutlinePdf({ html, title: data.title });
            if (result.cancelled) return;
            const btn = document.getElementById('btn-export-exegesis-pdf');
            btn.innerText = '✅ Exportado';
            setTimeout(() => { btn.innerText = '📄 Exportar PDF'; }, 2000);
        } catch (err) {
            console.error('Error al exportar exégesis PDF:', err);
        }
    }


    // Eventos
    document.getElementById('btn-close-exegesis').onclick = closeExegesisScreen;
    document.getElementById('btn-back-exegesis').onclick = loadExegesisList;
    document.getElementById('btn-save-exegesis').onclick = saveCurrentExegesis;
    document.getElementById('btn-export-exegesis-pdf').onclick = exportExegesisToPdf;
    document.getElementById('btn-new-exegesis').onclick = () => openExegesisEditor();

export { 
    openExegesisScreen, 
    closeExegesisScreen, 
    loadExegesisList, 
    saveCurrentExegesis, 
    exportExegesisToPdf 
};