/**
 * Módulo del Administrador (Dashboard y Estadísticas)
 */
const Admin = {
    async loadDashboard() {
        const content = document.getElementById('content-area');
        content.innerHTML = `
            <div class="page-header">
                <h1>Dashboard de Administración</h1>
                <p style="color:var(--text-muted); margin-top:5px;">Resumen en tiempo real de la Feria de Ingeniería.</p>
            </div>
            
            <div id="stats-grid" style="display:grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 40px;">
            </div>

            <div class="card">
                <h3 style="margin-bottom: 20px;">Acciones Rápidas</h3>
                <div style="display:flex; gap: 15px;">
                    <button class="btn btn-primary" onclick="UI.showToast('Exportando a Excel...', 'info')"><i class="fas fa-file-excel"></i> Exportar Resultados</button>
                    <button class="btn btn-primary" style="background:var(--success)" onclick="UI.showToast('Generando Ranking...', 'info')"><i class="fas fa-trophy"></i> Generar Ranking</button>
                </div>
            </div>
        `;

        UI.showLoader('stats-grid');

        try {
            const response = await API.get('getStats');
            if (response.success) {
                const grid = document.getElementById('stats-grid');
                grid.innerHTML = `
                    <div class="card" style="text-align:center; padding: 30px 20px;">
                        <i class="fas fa-project-diagram" style="font-size: 2rem; color: var(--primary); margin-bottom: 10px;"></i>
                        <h2 style="font-size: 32px; color: var(--text-dark);">${response.stats.totalProjects}</h2>
                        <p style="color: var(--text-muted);">Total Proyectos</p>
                    </div>
                    <div class="card" style="text-align:center; padding: 30px 20px;">
                        <i class="fas fa-clipboard-check" style="font-size: 2rem; color: var(--success); margin-bottom: 10px;"></i>
                        <h2 style="font-size: 32px; color: var(--text-dark);">${response.stats.totalEvaluations}</h2>
                        <p style="color: var(--text-muted);">Evaluaciones Realizadas</p>
                    </div>
                    <div class="card" style="text-align:center; padding: 30px 20px;">
                        <i class="fas fa-layer-group" style="font-size: 2rem; color: var(--warning); margin-bottom: 10px;"></i>
                        <h2 style="font-size: 32px; color: var(--text-dark);">${response.stats.categories || 0}</h2>
                        <p style="color: var(--text-muted);">Categorías Activas</p>
                    </div>
                `;
            }
        } catch(err) {
            document.getElementById('stats-grid').innerHTML = `<p class="error-msg">${err.message}</p>`;
        }
    },

    loadRankings() {
        const content = document.getElementById('content-area');
        content.innerHTML = `
            <div class="page-header">
                <h1>Rankings y Diplomas</h1>
                <p style="color:var(--text-muted); margin-top:5px;">Genera los diplomas para los proyectos ganadores de cada categoría.</p>
            </div>
            
            <div class="card" style="margin-bottom: 20px;">
                <h3 style="margin-bottom: 20px;">Configuración de Diplomas</h3>
                <div style="display: flex; gap: 20px; flex-wrap: wrap; align-items: center;">
                    <div style="flex: 1; min-width: 200px;">
                        <label for="ranking-category" style="display:block; margin-bottom: 5px; font-weight: 500;">Categoría:</label>
                        <select id="ranking-category" class="input-field">
                            <option value="">Seleccione una categoría...</option>
                            <option value="Basico">Básico</option>
                            <option value="Intermedio">Intermedio</option>
                            <option value="Avanzado">Avanzado</option>
                            <option value="Maestria">Maestría</option>
                        </select>
                    </div>
                    <div style="flex: 1; min-width: 200px;">
                        <label for="ranking-places" style="display:block; margin-bottom: 5px; font-weight: 500;">Lugares a premiar (del 1ro al...):</label>
                        <select id="ranking-places" class="input-field">
                            <option value="3">3er lugar</option>
                            <option value="5" selected>5to lugar</option>
                            <option value="10">10mo lugar</option>
                            <option value="all">Todos los evaluados</option>
                        </select>
                    </div>
                    <div style="display: flex; align-items: flex-end;">
                        <button id="btn-generate-diplomas" class="btn btn-primary" style="height: 42px; margin-top: auto;">
                            <i class="fas fa-certificate"></i> Generar Diplomas
                        </button>
                    </div>
                </div>
            </div>
            
            <div class="card">
                <h3 style="margin-bottom: 15px;">Previsualización de Ranking</h3>
                <div id="ranking-preview">
                    <p style="color:var(--text-muted); font-style:italic;">Selecciona una categoría y presiona Generar Diplomas para ver los resultados.</p>
                </div>
            </div>
        `;

        document.getElementById('btn-generate-diplomas').addEventListener('click', async () => {
            const categoria = document.getElementById('ranking-category').value;
            const places = document.getElementById('ranking-places').value;

            if (!categoria) {
                UI.showToast('Por favor selecciona una categoría', 'error');
                return;
            }

            const previewDiv = document.getElementById('ranking-preview');
            previewDiv.innerHTML = '<div class="loader" style="margin: 20px auto;"></div><p style="text-align:center;">Obteniendo ranking...</p>';

            try {
                const response = await API.get('getRankings', { categoria: categoria });
                
                if (response.success) {
                    let ranking = response.ranking;
                    let maxPlaces = places === 'all' ? ranking.length : parseInt(places, 10);
                    
                    const ganadores = ranking.slice(0, maxPlaces);
                    
                    if (ganadores.length === 0) {
                        previewDiv.innerHTML = '<p style="color:var(--text-muted); font-style:italic;">No hay proyectos evaluados en esta categoría todavía.</p>';
                        return;
                    }
                    
                    // Render preview table
                    let tableHTML = `
                        <div class="table-responsive">
                            <table class="table" style="width: 100%; border-collapse: collapse;">
                                <thead>
                                    <tr>
                                        <th style="padding: 10px; border-bottom: 2px solid #eee; text-align: left;">Lugar</th>
                                        <th style="padding: 10px; border-bottom: 2px solid #eee; text-align: left;">ID / Proyecto</th>
                                        <th style="padding: 10px; border-bottom: 2px solid #eee; text-align: left;">Detalles</th>
                                        <th style="padding: 10px; border-bottom: 2px solid #eee; text-align: center;">Promedio</th>
                                    </tr>
                                </thead>
                                <tbody>
                    `;
                    
                    ganadores.forEach((g, index) => {
                        let rowBg = index === 0 ? 'background-color: #f0fdf4;' : (index === 1 ? 'background-color: #fefce8;' : (index === 2 ? 'background-color: #fdf4ff;' : ''));
                        tableHTML += `
                            <tr style="border-bottom: 1px solid #eee; ${rowBg}">
                                <td style="padding: 12px 10px; font-weight: bold; font-size: 1.1em; color: var(--primary);">#${index + 1}</td>
                                <td style="padding: 12px 10px;">
                                    <div style="font-weight: 500;">${g.nombre}</div>
                                    <div style="font-size: 0.85em; color: var(--text-muted);">${g.id}</div>
                                </td>
                                <td style="padding: 12px 10px; font-size: 0.9em;">
                                    <div><strong>Carrera:</strong> ${g.carrera}</div>
                                    <div><strong>Asignatura:</strong> ${g.asignatura}</div>
                                </td>
                                <td style="padding: 12px 10px; text-align: center; font-weight: bold;">
                                    ${g.promedio.toFixed(3)}
                                </td>
                            </tr>
                        `;
                    });
                    
                    tableHTML += `</tbody></table></div>`;
                    tableHTML += `
                        <div style="margin-top: 20px; text-align: right;">
                            <button id="btn-print-diplomas" class="btn btn-primary" style="background:var(--success)">
                                <i class="fas fa-print"></i> Abrir Diplomas para Imprimir
                            </button>
                        </div>
                    `;
                    
                    previewDiv.innerHTML = tableHTML;
                    
                    document.getElementById('btn-print-diplomas').addEventListener('click', () => {
                        // Guardar ganadores en localStorage y abrir la ventana de diplomas
                        localStorage.setItem('diplomasData', JSON.stringify({
                            categoria: categoria,
                            ganadores: ganadores
                        }));
                        window.open('diploma.html', '_blank');
                    });
                    
                } else {
                    previewDiv.innerHTML = `<p class="error-msg">${response.error || 'Error al obtener ranking'}</p>`;
                }
            } catch (err) {
                previewDiv.innerHTML = `<p class="error-msg">${err.message}</p>`;
            }
        });
    }
};
