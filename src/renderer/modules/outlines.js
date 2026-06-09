    // ============================================
    // ✨ PANTALLA DE BOSQUEJOS
    // ============================================


    let currentOutlineId = null;
    let currentOutlineType = null;


    function openOutlinesScreen() {
        document.getElementById('outlines-screen').classList.remove('hidden');
        loadOutlinesList();
    }


    function closeOutlinesScreen() {
        document.getElementById('outlines-screen').classList.add('hidden');
        currentOutlineId = null;
        currentOutlineType = null;
    }


    async function loadOutlinesList() {
        showOutlinesView('list');
        const grid = document.getElementById('outlines-grid');
        grid.innerHTML = "";


        const outlines = await window.api.getOutlines();
        if (!outlines || outlines.length === 0) return;


        const typeLabels = { full: '📖 Homilético', simple: '📝 Sencillo', free: '✏️ Libre' };


        outlines.forEach(o => {
            const card = document.createElement('div');
            card.classList.add('outline-card');
            card.innerHTML = `
                <div class="outline-card-type">${typeLabels[o.type] || o.type}</div>
                <div class="outline-card-title">${o.title || 'Sin título'}</div>
                <div class="outline-card-date">${new Date(o.updated_at).toLocaleDateString('es-MX', { year:'numeric', month:'long', day:'numeric' })}</div>
                <div class="outline-card-actions">
                    <button class="btn-small-action btn-edit-outline">✏️ Editar</button>
                    <button class="btn-small-action btn-delete-outline">🗑️ Eliminar</button>
                </div>
            `;


            card.querySelector('.btn-edit-outline').onclick = (e) => {
                e.stopPropagation();
                openOutlineEditor(o.type, o.id);
            };


            card.querySelector('.btn-delete-outline').onclick = async (e) => {
                e.stopPropagation();
                if (confirm(`¿Eliminar "${o.title || 'Sin título'}"?`)) {
                    await window.api.deleteOutline(o.id);
                    loadOutlinesList();
                }
            };


            card.onclick = () => openOutlineEditor(o.type, o.id);
            grid.appendChild(card);
        });
    }


    function showOutlinesView(view) {
        document.getElementById('outlines-list-view').classList.toggle('hidden', view !== 'list');
        document.getElementById('outlines-type-selector').classList.toggle('hidden', view !== 'type');
        document.getElementById('outlines-editor-view').classList.toggle('hidden', view !== 'editor');
    }


    async function openOutlineEditor(type, id = null) {
        currentOutlineType = type;
        currentOutlineId = id;


        // Ocultar todos los editores
        document.querySelectorAll('.editor-form').forEach(f => f.classList.add('hidden'));
        document.getElementById(`editor-${type}`).classList.remove('hidden');


        // Limpiar campos
        clearEditorFields(type);


        if (id) {
            // Cargar datos existentes
            let data;
            if (type === 'full') data = await window.api.getFullOutline(id);
            else if (type === 'simple') data = await window.api.getSimpleOutline(id);
            else data = await window.api.getFreeOutline(id);


            document.getElementById('outline-title-input').value = data.title || '';
            fillEditorFields(type, data);
            if (type !== 'free') renderPoints(type, data.points || []);
        }


        showOutlinesView('editor');
    }


    function clearEditorFields(type) {
        document.getElementById('outline-title-input').value = '';
        if (type === 'full') {
            ['theme','general-purpose','specific-purpose','bible-base','introduction',
             'sermon-question','proposition','transition-prayer','key-word',
             'conclusion-recap','conclusion-application','conclusion-invitation']
            .forEach(f => {
                const el = document.getElementById(`full-${f}`);
                if (el) el.value = '';
            });
            document.getElementById('points-list-full').innerHTML = '';
        } else if (type === 'simple') {
            document.getElementById('simple-bible-base').value = '';
            document.getElementById('points-list-simple').innerHTML = '';
        } else {
            document.getElementById('free-content').value = '';
        }
    }


    function fillEditorFields(type, data) {
        if (type === 'full') {
            document.getElementById('full-theme').value = data.theme || '';
            document.getElementById('full-general-purpose').value = data.general_purpose || '';
            document.getElementById('full-specific-purpose').value = data.specific_purpose || '';
            document.getElementById('full-bible-base').value = data.bible_base || '';
            document.getElementById('full-introduction').value = data.introduction || '';
            document.getElementById('full-sermon-question').value = data.sermon_question || '';
            document.getElementById('full-proposition').value = data.proposition || '';
            document.getElementById('full-transition-prayer').value = data.transition_prayer || '';
            document.getElementById('full-key-word').value = data.key_word || '';
            document.getElementById('full-conclusion-recap').value = data.conclusion_recap || '';
            document.getElementById('full-conclusion-application').value = data.conclusion_application || '';
            document.getElementById('full-conclusion-invitation').value = data.conclusion_invitation || '';
        } else if (type === 'simple') {
            document.getElementById('simple-bible-base').value = data.bible_base || '';
        } else {
            document.getElementById('free-content').value = data.content || '';
        }
    }


    function renderPoints(type, points) {
        const container = document.getElementById(`points-list-${type}`);
        container.innerHTML = '';
        points.forEach((p, i) => addPointToDOM(type, i + 1, p));
    }


    function addPointToDOM(type, num, data = {}) {
        const container = document.getElementById(`points-list-${type}`);
        const div = document.createElement('div');
        div.classList.add('point-item');
        div.innerHTML = `
            <div class="point-item-header">
                <span class="point-number">Punto ${num}</span>
            </div>
            <input type="text" class="outline-input point-title" placeholder="Título del punto..." value="${data.title || ''}">
            <input type="text" class="outline-input point-verse-ref" placeholder="Referencia (ej: Juan 3:16)" value="${data.verse_ref || ''}">
            <textarea class="outline-textarea point-verse-text" placeholder="Texto del versículo...">${data.verse_text || ''}</textarea>
            <textarea class="outline-textarea tall point-development" placeholder="Desarrollo y explicación...">${data.development || ''}</textarea>
            <textarea class="outline-textarea point-transition" placeholder="Oración de transición...">${data.transition || ''}</textarea>
            <div class="point-item-actions">
                <button class="btn-delete-point">🗑️ Eliminar punto</button>
            </div>
        `;


        div.querySelector('.btn-delete-point').onclick = () => {
            div.remove();
            // Renumerar
            container.querySelectorAll('.point-number').forEach((el, i) => {
                el.innerText = `Punto ${i + 1}`;
            });
        };


        container.appendChild(div);
    }


    function getPointsFromDOM(type) {
        const container = document.getElementById(`points-list-${type}`);
        return [...container.querySelectorAll('.point-item')].map(item => ({
            title: item.querySelector('.point-title').value,
            verse_ref: item.querySelector('.point-verse-ref').value,
            verse_text: item.querySelector('.point-verse-text').value,
            development: item.querySelector('.point-development').value,
            transition: item.querySelector('.point-transition').value,
        }));
    }


    async function saveCurrentOutline() {
        const title = document.getElementById('outline-title-input').value.trim() || 'Sin título';
        const type = currentOutlineType;


        let data = { title };


        if (type === 'full') {
            data = {
                ...data,
                theme: document.getElementById('full-theme').value,
                general_purpose: document.getElementById('full-general-purpose').value,
                specific_purpose: document.getElementById('full-specific-purpose').value,
                bible_base: document.getElementById('full-bible-base').value,
                introduction: document.getElementById('full-introduction').value,
                sermon_question: document.getElementById('full-sermon-question').value,
                proposition: document.getElementById('full-proposition').value,
                transition_prayer: document.getElementById('full-transition-prayer').value,
                key_word: document.getElementById('full-key-word').value,
                conclusion_recap: document.getElementById('full-conclusion-recap').value,
                conclusion_application: document.getElementById('full-conclusion-application').value,
                conclusion_invitation: document.getElementById('full-conclusion-invitation').value,
            };
        } else if (type === 'simple') {
            data.bible_base = document.getElementById('simple-bible-base').value;
        } else {
            data.content = document.getElementById('free-content').value;
        }


        try {
            if (currentOutlineId) {
                data.id = currentOutlineId;
                if (type === 'full') await window.api.updateFullOutline(data);
                else if (type === 'simple') await window.api.updateSimpleOutline(data);
                else await window.api.updateFreeOutline(data);
            } else {
                let result;
                if (type === 'full') result = await window.api.saveFullOutline(data);
                else if (type === 'simple') result = await window.api.saveSimpleOutline(data);
                else result = await window.api.saveFreeOutline(data);
                currentOutlineId = result.id;
            }


            // Guardar puntos si aplica
            if (type !== 'free') {
                const points = getPointsFromDOM(type);
                await window.api.saveOutlinePoints({ outlineId: currentOutlineId, points });
            }


            // Feedback
            const btn = document.getElementById('btn-save-outline');
            btn.innerText = '✅ Guardado';
            setTimeout(() => { btn.innerText = 'Guardar'; }, 1500);


        } catch (err) {
            console.error('Error al guardar bosquejo:', err);
        }
    }


    async function exportOutlineToPdf() {
    const type = currentOutlineType;
    const title = document.getElementById('outline-title-input').value || 'Sin título';


    let bodyHtml = '';


    if (type === 'full') {
        const theme = document.getElementById('full-theme').value;
        const generalPurpose = document.getElementById('full-general-purpose').value;
        const specificPurpose = document.getElementById('full-specific-purpose').value;
        const bibleBase = document.getElementById('full-bible-base').value;
        const introduction = document.getElementById('full-introduction').value;
        const sermonQuestion = document.getElementById('full-sermon-question').value;
        const proposition = document.getElementById('full-proposition').value;
        const transitionPrayer = document.getElementById('full-transition-prayer').value;
        const keyWord = document.getElementById('full-key-word').value;
        const conclusionRecap = document.getElementById('full-conclusion-recap').value;
        const conclusionApplication = document.getElementById('full-conclusion-application').value;
        const conclusionInvitation = document.getElementById('full-conclusion-invitation').value;
        const points = getPointsFromDOM('full');


        const pointsHtml = points.map((p, i) => `
            <div class="point">
                <div class="point-title">${i + 1}. ${p.title || ''} ${p.verse_ref ? `(${p.verse_ref})` : ''}</div>
                ${p.verse_text ? `<div class="verse-text">"${p.verse_text}"</div>` : ''}
                ${p.development ? `<div class="point-body">${p.development}</div>` : ''}
                ${p.transition ? `<div class="transition">— ${p.transition}</div>` : ''}
            </div>
        `).join('');


        bodyHtml = `
            ${theme ? `<div class="section"><span class="label">II. TEMA</span><p>${theme}</p></div>` : ''}
            ${generalPurpose ? `<div class="section"><span class="label">III. PROPÓSITO GENERAL</span><p>${generalPurpose}</p></div>` : ''}
            ${specificPurpose ? `<div class="section"><span class="label">IV. PROPÓSITO ESPECÍFICO</span><p>${specificPurpose}</p></div>` : ''}
            ${bibleBase ? `<div class="section"><span class="label">V. BASE BÍBLICA</span><p>${bibleBase}</p></div>` : ''}
            ${introduction ? `<div class="section"><span class="label">VI. INTRODUCCIÓN</span><p>${introduction}</p></div>` : ''}
            ${sermonQuestion ? `<div class="section"><span class="label">VII. INTERROGANTE SERMONARIA</span><p>${sermonQuestion}</p></div>` : ''}
            ${proposition ? `<div class="section"><span class="label">VIII. PROPOSICIÓN</span><p>${proposition}</p></div>` : ''}
            ${transitionPrayer ? `<div class="section"><span class="label">IX. ORACIÓN DE TRANSICIÓN</span><p>${transitionPrayer}</p></div>` : ''}
            ${keyWord ? `<div class="section"><span class="label">X. PALABRA CLAVE</span><p>${keyWord}</p></div>` : ''}
            ${points.length > 0 ? `
                <div class="section">
                    <span class="label">XI. CONTENIDO</span>
                    ${pointsHtml}
                </div>
            ` : ''}
            ${(conclusionRecap || conclusionApplication || conclusionInvitation) ? `
                <div class="section">
                    <span class="label">XII. CONCLUSIÓN</span>
                    ${conclusionRecap ? `<div class="conclusion-item"><span class="sublabel">A. Recapitulación</span><p>${conclusionRecap}</p></div>` : ''}
                    ${conclusionApplication ? `<div class="conclusion-item"><span class="sublabel">B. Aplicación</span><p>${conclusionApplication}</p></div>` : ''}
                    ${conclusionInvitation ? `<div class="conclusion-item"><span class="sublabel">C. Invitación</span><p>${conclusionInvitation}</p></div>` : ''}
                </div>
            ` : ''}
        `;


    } else if (type === 'simple') {
        const bibleBase = document.getElementById('simple-bible-base').value;
        const points = getPointsFromDOM('simple');


        const pointsHtml = points.map((p, i) => `
            <div class="point">
                <div class="point-title">${i + 1}. ${p.title || ''} ${p.verse_ref ? `(${p.verse_ref})` : ''}</div>
                ${p.verse_text ? `<div class="verse-text">"${p.verse_text}"</div>` : ''}
                ${p.development ? `<div class="point-body">${p.development}</div>` : ''}
                ${p.transition ? `<div class="transition">— ${p.transition}</div>` : ''}
            </div>
        `).join('');


        bodyHtml = `
            ${bibleBase ? `<div class="section"><span class="label">BASE BÍBLICA</span><p>${bibleBase}</p></div>` : ''}
            ${points.length > 0 ? `
                <div class="section">
                    <span class="label">PUNTOS PRINCIPALES</span>
                    ${pointsHtml}
                </div>
            ` : ''}
        `;


    } else {
        const content = document.getElementById('free-content').value;
        bodyHtml = `<div class="section"><p style="white-space: pre-wrap;">${content}</p></div>`;
    }


    const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <style>
                * { margin: 0; padding: 0; box-sizing: border-box; }
                body { font-family: 'Georgia', serif; color: #222; font-size: 11pt; line-height: 1.6; }
                
                .doc-header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 15px; margin-bottom: 25px; }
                .doc-header h1 { font-size: 18pt; font-weight: 900; margin-bottom: 5px; }
                .doc-header .doc-type { font-size: 8pt; letter-spacing: 3px; text-transform: uppercase; color: #666; }
                
                .section { margin-bottom: 18px; }
                .label { display: block; font-size: 7.5pt; font-weight: 900; letter-spacing: 2px; text-transform: uppercase; color: #555; margin-bottom: 5px; border-left: 3px solid #333; padding-left: 8px; }
                .sublabel { display: block; font-size: 8pt; font-weight: 700; color: #444; margin: 10px 0 4px 0; }
                
                .section p { font-size: 10.5pt; padding-left: 11px; }
                
                .point { margin: 12px 0; padding: 10px; border-left: 2px solid #ccc; padding-left: 12px; }
                .point-title { font-weight: 700; font-size: 10.5pt; margin-bottom: 5px; }
                .verse-text { font-style: italic; color: #444; margin: 5px 0; font-size: 10pt; }
                .point-body { font-size: 10pt; margin: 5px 0; }
                .transition { font-size: 9.5pt; color: #666; font-style: italic; margin-top: 8px; }
                
                .conclusion-item { margin-bottom: 10px; padding-left: 11px; }
                
                .doc-footer { text-align: center; margin-top: 30px; padding-top: 10px; border-top: 1px solid #ccc; font-size: 8pt; color: #999; }
            </style>
        </head>
        <body>
            <div class="doc-header">
                <div class="doc-type">I. TÍTULO</div>
                <h1>${title}</h1>
            </div>
            ${bodyHtml}
            <div class="doc-footer">Biblia Master — ${new Date().toLocaleDateString('es-MX', { year:'numeric', month:'long', day:'numeric' })}</div>
        </body>
        </html>
    `;


    try {
        const result = await window.api.exportOutlinePdf({ html, title });
        if (result.cancelled) return;


        const btn = document.getElementById('btn-export-outline-pdf');
        btn.innerText = '✅ Exportado';
        setTimeout(() => { btn.innerText = '📄 Exportar PDF'; }, 2000);
    } catch (err) {
        console.error('Error al exportar PDF:', err);
    }
}


    // Eventos de la pantalla
    document.getElementById('btn-close-outlines').onclick = closeOutlinesScreen;
    document.getElementById('btn-back-outlines').onclick = loadOutlinesList;
    document.getElementById('btn-save-outline').onclick = saveCurrentOutline;


    document.getElementById('btn-new-outline').onclick = () => {
        showOutlinesView('type');
    };


    document.getElementById('btn-cancel-type').onclick = () => {
        showOutlinesView('list');
    };


    document.querySelectorAll('.type-option').forEach(opt => {
        opt.onclick = () => openOutlineEditor(opt.dataset.type);
    });


    document.getElementById('btn-add-point-full').onclick = () => {
        const count = document.getElementById('points-list-full').querySelectorAll('.point-item').length;
        addPointToDOM('full', count + 1);
    };


    document.getElementById('btn-add-point-simple').onclick = () => {
        const count = document.getElementById('points-list-simple').querySelectorAll('.point-item').length;
        addPointToDOM('simple', count + 1);
    };


    document.getElementById('btn-export-outline-pdf').onclick = exportOutlineToPdf;

export {
    openOutlinesScreen,
    closeOutlinesScreen,
    loadOutlinesList,
    saveCurrentOutline,
    openOutlineEditor,
    exportOutlineToPdf
}