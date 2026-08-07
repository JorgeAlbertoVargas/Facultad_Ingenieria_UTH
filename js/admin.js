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
                        <label for="ranking-places" style="display:block; margin-bottom: 5px; font-weight: 500;">Seleccionar lugar a mostrar:</label>
                        <select id="ranking-places" class="input-field">
                            <option value="5">5to lugar</option>
                            <option value="4">4to lugar</option>
                            <option value="3">3er lugar</option>
                            <option value="2">2do lugar</option>
                            <option value="1">1er lugar</option>
                        </select>
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
                    if (ranking.length === 0) {
                        previewDiv.innerHTML = '<p style="color:var(--text-muted); font-style:italic;">No hay proyectos evaluados en esta categoría todavía.</p>';
                        return;
                    }
                    
                    const placeIndex = parseInt(places, 10) - 1;
                    
                    if (placeIndex >= ranking.length) {
                        previewDiv.innerHTML = `<p style="color:var(--text-muted); font-style:italic;">Solo hay ${ranking.length} proyecto(s) evaluado(s). No hay un ganador para el lugar ${places}.</p>`;
                        return;
                    }
                    
                    const g = ranking[placeIndex];
                    
                    // Obtener fecha actual
                    const hoy = new Date();
                    const fechaStr = `${hoy.getDate()}/${hoy.getMonth() + 1}/${hoy.getFullYear()}`;
                    
                    function getPlaceText(index) {
                        const placesArr = ["1er.", "2do.", "3er.", "4to.", "5to.", "6to.", "7mo.", "8vo.", "9no.", "10mo."];
                        if (index < placesArr.length) return placesArr[index];
                        return `${index + 1}º`;
                    }
                    
                    const placeText = getPlaceText(placeIndex);
                    
                    let diplomasHTML = '<div style="display: flex; flex-direction: column; gap: 30px; align-items: center;">';
                    
                    diplomasHTML += `
                        <div class="diploma-wrapper">
                            <div class="diploma-border-top-left"></div>
                            <div class="diploma-border-bottom-right"></div>
                            
                            <div class="diploma-content">
                                <div class="diploma-header-row">
                                    <!-- Logo Izquierda (Logo UTH nuevo doble de grande) -->
                                    <div class="diploma-logo-left">
                                        <img src="img/media__1786084541662.png" alt="Logo UTH Nuevo" style="max-height: 280px; max-width: 500px;">
                                    </div>
                                    
                                    <!-- Estrellas -->
                                    <div class="diploma-stars">
                                        <i class="fas fa-star"></i>
                                        <i class="fas fa-star"></i>
                                        <i class="fas fa-star"></i>
                                    </div>
                                    
                                    <!-- Logo Derecha (Logo UTH.png) desplazado hacia abajo -->
                                    <div class="diploma-logo-right" style="margin-top: 75px;">
                                        <img src="img/UTH.png" alt="Logo UTH" style="max-height: 280px; max-width: 500px;" onerror="this.src='img/media__1786081543163.png'">
                                    </div>
                                </div>
                                
                                <div class="diploma-title">Feria de Ingeniería</div>
                                
                                <div class="diploma-place">
                                    <span class="red">${placeText} Lugar | Categoria: ${categoria}</span>
                                </div>
                                
                                <div class="diploma-certifies">CON ESTE DIPLOMA SE RECONOCE QUE</div>
                                
                                <div class="diploma-project" style="display: flex; flex-direction: column; align-items: center; gap: 15px; width: 100%;">
                                    <div style="display: flex; align-items: center; justify-content: center; gap: 20px;">
                                        <div style="font-size: 38px; font-weight: 800; color: #222; white-space: nowrap;">Código: ${g.id}</div>
                                        <img src="https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(g.id)}" alt="QR Code" style="width: 80px; height: 80px; border: 2px solid #007A33; border-radius: 8px; padding: 4px; background: white;">
                                    </div>
                                    <div style="font-size: 38px; font-weight: 800; color: #222; white-space: nowrap;">Nombre Corto Proyecto: ${g.nombre}</div>
                                    <div style="font-size: 38px; font-weight: 800; color: #222; white-space: nowrap;">Catedrático: ${g.catedratico}</div>
                                </div>
                                
                                <div class="diploma-footer" style="align-items: center;">
                                    <div class="diploma-signature" style="display: flex; flex-direction: column; align-items: center;">
                                        <div style="font-family: 'Great Vibes', cursive; font-size: 68px; color: #000; line-height: 1;">Dr. Dennis Aguilar</div>
                                        <div style="font-size: 20px; font-weight: 500; color: #000; margin-top: 5px;">Decano de Ingenierias</div>
                                    </div>
                                    <div class="diploma-date" style="display: flex; flex-direction: column; align-items: center; padding-bottom: 5px;">
                                        <div style="font-size: 36px; font-weight: 800; color: #000; letter-spacing: 1px;">${fechaStr}</div>
                                        <div style="font-size: 18px; color: #000;">Fecha</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    `;
                    
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
