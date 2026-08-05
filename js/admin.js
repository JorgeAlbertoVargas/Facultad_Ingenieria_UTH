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
    }
};
