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
                        <label for="ranking-places" style="display:block; margin-bottom: 5px; font-weight: 500;">Lugares a premiar:</label>
                        <select id="ranking-places" class="input-field">
                            <option value="5" selected>Del 1ro al 5to lugar</option>
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
                    
                    // Obtener fecha actual
                    const hoy = new Date();
                    const fechaStr = `${hoy.getDate()}/${hoy.getMonth() + 1}/${hoy.getFullYear()}`;
                    
                    function getPlaceText(index) {
                        const places = ["1er.", "2do.", "3er.", "4to.", "5to.", "6to.", "7mo.", "8vo.", "9no.", "10mo."];
                        if (index < places.length) return places[index];
                        return `${index + 1}º`;
                    }
                    
                    let diplomasHTML = '<div style="display: flex; flex-direction: column; gap: 30px; align-items: center;">';
                    
                    ganadores.forEach((g, index) => {
                        const placeText = getPlaceText(index);
                        
                        diplomasHTML += `
                            <div class="diploma-wrapper">
                                <div class="diploma-border-top-left"></div>
                                <div class="diploma-border-bottom-right"></div>
                                
                                <div class="diploma-content">
                                    <div class="diploma-header-row">
                                        <!-- Logo Izquierda (Logo UTH nuevo) -->
                                        <div class="diploma-logo-left">
                                            <img src="img/media__1786084541662.png" alt="Logo UTH" style="max-height: 100px; max-width: 180px;">
                                        </div>
                                        
                                        <!-- Estrellas -->
                                        <div class="diploma-stars">
                                            <i class="fas fa-star"></i>
                                            <i class="fas fa-star"></i>
                                            <i class="fas fa-star"></i>
                                        </div>
                                        
                                        <!-- Logo Derecha (Logo 40 años) -->
                                        <div class="diploma-logo-right">
                                            <img src="img/media__1786081543163.png" alt="40 Años UTH" style="max-height: 80px; max-width: 140px;" onerror="this.src='img/media__1786078272811.png'">
                                        </div>
                                    </div>
                                    
                                    <div class="diploma-title">Feria de Ingeniería</div>
                                    
                                    <div class="diploma-place">
                                        <span class="red">${placeText} Lugar | Categoria: ${categoria}</span>
                                    </div>
                                    
                                    <div class="diploma-certifies">CON ESTE DIPLOMA SE RECONOCE QUE</div>
                                    
                                    <div class="diploma-project">
                                        <div style="font-size: 24px; margin-bottom: 10px;">${g.nombre}</div>
                                        <div style="font-size: 16px; color: #333; font-weight: 600;">
                                            ${g.id} | ${g.nombre} | ${g.catedratico}
                                        </div>
                                    </div>
                                    
                                    <div class="diploma-footer">
                                        <div class="diploma-signature">
                                            <div class="diploma-signature-name">Dr. Dennis Aguilar</div>
                                            <div class="diploma-signature-title">Decano de Ingenierias</div>
                                        </div>
                                        <div class="diploma-date">
                                            <div class="diploma-date-value">${fechaStr}</div>
                                            <div class="diploma-date-label">Fecha</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        `;
                    });
                    
                    diplomasHTML += `
                        </div>
                        <div style="margin-top: 20px; text-align: center;" class="no-print">
                            <button id="btn-print-diplomas" class="btn btn-primary" style="background:var(--success)">
                                <i class="fas fa-print"></i> Imprimir Diplomas (Ctrl+P)
                            </button>
                            <p style="margin-top: 10px; font-size: 14px; color: #666;">
                                (Asegúrate de ajustar tu impresora a formato <strong>Horizontal (Landscape)</strong>, tamaño <strong>A4 o Carta</strong>, y activa "Gráficos de fondo".)
                            </p>
                        </div>
                    `;
                    
                    previewDiv.innerHTML = diplomasHTML;
                    
                    document.getElementById('btn-print-diplomas').addEventListener('click', () => {
                        window.print();
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
