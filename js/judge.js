/**
 * Módulo del Juez (Dashboard y Evaluación)
 */
const Judge = {
    async loadDashboard() {
        const content = document.getElementById('content-area');
        content.innerHTML = `
            <div class="page-header">
                <h1>Mis Proyectos Asignados</h1>
                <p style="color:var(--text-muted); margin-top:5px;">Seleccione un proyecto para evaluar.</p>
            </div>
            <div id="projects-grid" class="projects-grid"></div>
        `;

        UI.showLoader('projects-grid');

        try {
            const response = await API.get('getProjects');
            if (response.success) {
                this.renderProjects(response.projects);
            } else {
                document.getElementById('projects-grid').innerHTML = `<p class="error-msg">${response.error}</p>`;
            }
        } catch (err) {
            document.getElementById('projects-grid').innerHTML = `<p class="error-msg">${err.message}</p>`;
        }
    },

    renderProjects(projects) {
        const grid = document.getElementById('projects-grid');
        grid.innerHTML = '';

        if (projects.length === 0) {
            grid.innerHTML = '<p>No hay proyectos asignados.</p>';
            return;
        }

        projects.forEach(p => {
            const isEvaluated = p.evaluado; // Dependerá de la lógica real en Google Sheets si devolvemos esto
            
            // Generación dinámica del QR
            const qrData = encodeURIComponent(`Código: ${p['ID_Proyecto']} | Proyecto: ${p['Nombre_Corto_Proyecto']} | Categoría: ${p['Categoria_Ingresada']}`);
            const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=90x90&data=${qrData}&color=007A33`;
            
            const card = document.createElement('div');
            card.className = `card ${isEvaluated ? 'evaluated' : ''}`;
            card.style.position = 'relative';
            
            card.innerHTML = `
                <div style="position: absolute; top: 20px; right: 20px; text-align: center;">
                    <img src="${qrUrl}" alt="QR Code" style="border-radius: 4px; border: 1px solid #eee; padding: 2px; background: white;">
                </div>
                <div class="card-header" style="padding-right: 100px;">
                    <span class="card-code">${p['ID_Proyecto']}</span>
                    ${isEvaluated ? '<span class="tag" style="background:var(--success); color:white;"><i class="fas fa-check"></i> Ya evaluado</span>' : ''}
                </div>
                <h3 class="card-title" style="margin-right: 100px;">${p['Nombre_Corto_Proyecto']}</h3>
                <div class="card-body">
                    <p><strong>Carrera:</strong> ${p['Carrera']}</p>
                    <p><strong>Campus:</strong> ${p['Campus']}</p>
                    <p><strong>Categoría:</strong> ${p['Categoria_Ingresada']}</p>
                    <p><strong>Profesor:</strong> ${p['Catedratico']}</p>
                </div>
                <button class="btn btn-primary btn-large" ${isEvaluated ? 'disabled' : ''} onclick="Judge.openEvaluation('${p['ID_Proyecto']}', '${p['Categoria_Ingresada']}')">
                    ${isEvaluated ? '<i class="fas fa-lock"></i> Proyecto Evaluado' : '<i class="fas fa-edit"></i> Evaluar'}
                </button>
            `;
            grid.appendChild(card);
        });
    },

    openEvaluation(codigo, categoria) {
        UI.showToast(`Abriendo evaluación para ${codigo}`, 'info');
        // Aquí se construiría dinámicamente el formulario según la categoría
        const content = document.getElementById('content-area');
        content.innerHTML = `
            <div class="page-header">
                <button class="btn btn-text" onclick="Judge.loadDashboard()" style="margin-bottom:15px; padding-left:0;">
                    <i class="fas fa-arrow-left"></i> Volver
                </button>
                <h1>Evaluación: ${codigo}</h1>
                <p style="color:var(--text-muted); margin-top:5px;">Categoría: ${categoria}</p>
            </div>
            <div class="card" style="max-width: 800px;">
                <h3 style="margin-bottom: 20px;">Formulario de Evaluación</h3>
                <form id="eval-form">
                    <div class="input-group">
                        <label>1. Presentación e Impacto (1-5)</label>
                        <input type="number" id="eval-presentacion" min="1" max="5" required>
                    </div>
                    <div class="input-group">
                        <label>2. Nivel de Innovación (1-5)</label>
                        <input type="number" id="eval-innovacion" min="1" max="5" required>
                    </div>
                    <div class="input-group">
                        <label>Observaciones</label>
                        <textarea id="eval-observaciones" style="width:100%; padding:10px; border-radius:var(--radius-sm); border:1px solid #ddd" rows="4"></textarea>
                    </div>
                    <button type="submit" class="btn btn-primary btn-large">Guardar Evaluación</button>
                </form>
            </div>
        `;

        document.getElementById('eval-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = e.target.querySelector('button');
            btn.disabled = true;
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Guardando...';

            const presentacion = document.getElementById('eval-presentacion').value;
            const innovacion = document.getElementById('eval-innovacion').value;
            const observaciones = document.getElementById('eval-observaciones').value;

            try {
                const response = await API.post('saveEvaluation', {
                    codigoProyecto: codigo,
                    correoJuez: Auth.user.email,
                    presentacion: presentacion,
                    innovacion: innovacion,
                    observaciones: observaciones
                });
                if(response.success) {
                    UI.showToast('Evaluación guardada con éxito', 'success');
                    this.loadDashboard();
                } else {
                    UI.showToast(response.error || 'Error desconocido al guardar', 'error');
                    btn.disabled = false;
                    btn.innerText = 'Guardar Evaluación';
                }
            } catch (err) {
                UI.showToast('Error al guardar', 'error');
                btn.disabled = false;
                btn.innerText = 'Guardar Evaluación';
            }
        });
    }
};
