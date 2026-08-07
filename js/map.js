/**
 * Módulo para el Mapa Público de Visitantes
 */
const MapView = {
    currentZoom: 0.70,
    
    async load() {
        const app = document.getElementById('app');
        app.innerHTML = `
            <div style="padding: 15px; text-align: center; height: 100vh; background: var(--bg-light); display: flex; flex-direction: column;">
                <div style="margin-bottom: 15px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px;">
                    <div style="text-align: left;">
                        <h2 style="color:var(--primary); margin: 0;">Feria Facultad Ingenieria</h2>
                        <span style="color:var(--text-muted); font-size: 0.9rem;">Mapa en Tiempo Real</span>
                    </div>
                    
                    <div style="display: flex; gap: 10px; align-items: center;">
                        <button id="btn-update-stands" class="btn btn-secondary" onclick="MapView.updateStands()" style="padding: 10px; margin-right: 15px; background: var(--secondary); color: white;">
                            <i class="fas fa-sync-alt"></i> Ubicar Proyectos en Stands
                        </button>

                        <button class="btn btn-primary" onclick="MapView.zoomOut()" style="padding: 10px; font-size: 1rem; border-radius: 50%; width: 35px; height: 35px; display: flex; align-items: center; justify-content: center;"><i class="fas fa-minus"></i></button>
                        
                        <input type="range" id="zoom-slider" min="0.4" max="2.5" step="0.05" value="0.70" oninput="MapView.onSliderChange(this.value)" style="width: 150px; cursor: pointer; accent-color: var(--primary);">
                        
                        <button class="btn btn-primary" onclick="MapView.zoomIn()" style="padding: 10px; font-size: 1rem; border-radius: 50%; width: 35px; height: 35px; display: flex; align-items: center; justify-content: center;"><i class="fas fa-plus"></i></button>
                        
                        <span style="font-weight: 600; min-width: 50px; text-align: right;" id="zoom-level">70%</span>
                    </div>
                    
                    <div>
                        <button class="btn" style="background: var(--text-dark); color: white;" onclick="location.reload()">
                            <i class="fas fa-arrow-left"></i> Salir
                        </button>
                    </div>
                </div>
                
                <div id="map-container" style="flex: 1; width: 100%; border-radius: var(--radius); overflow: auto; box-shadow: var(--shadow-md); background: var(--white); position: relative; display: flex; justify-content: center; align-items: center;">
                    <p style="color: var(--text-muted);"><i class="fas fa-spinner fa-spin"></i> Cargando mapa...</p>
                </div>
            </div>
        `;

        try {
            const response = await API.get('getMapUrl');
            const container = document.getElementById('map-container');
            
            if (response.success && response.url) {
                container.innerHTML = `
                    <iframe id="map-iframe"
                        src="${response.url}" 
                        width="100%" 
                        height="100%" 
                        frameborder="0"
                        style="border:0; min-height: 800px; zoom: ${this.currentZoom}; transition: zoom 0.2s;">
                    </iframe>
                `;
            } else {
                container.innerHTML = `
                    <div style="text-align: center; color: var(--danger); padding: 20px;">
                        <i class="fas fa-exclamation-circle" style="font-size: 2rem; margin-bottom: 10px;"></i>
                        <p>${response.error || 'No se pudo cargar el mapa. Verifica que exista la pestaña "Distribucion_Proyectos".'}</p>
                    </div>
                `;
            }
        } catch (error) {
            document.getElementById('map-container').innerHTML = `
                <div style="text-align: center; color: var(--danger); padding: 20px;">
                    <i class="fas fa-wifi" style="font-size: 2rem; margin-bottom: 10px;"></i>
                    <p>Error de conexión al obtener el mapa.</p>
                </div>
            `;
        }
    },
    
    onSliderChange(val) {
        this.currentZoom = parseFloat(val);
        this.applyZoom();
    },
    
    zoomIn() {
        if(this.currentZoom < 2.5) {
            this.currentZoom += 0.1;
            this.applyZoom();
        }
    },
    
    zoomOut() {
        if(this.currentZoom > 0.4) {
            this.currentZoom -= 0.1;
            this.applyZoom();
        }
    },
    
    applyZoom() {
        const iframe = document.getElementById('map-iframe');
        const zoomLabel = document.getElementById('zoom-level');
        const slider = document.getElementById('zoom-slider');
        if (iframe && zoomLabel) {
            iframe.style.zoom = this.currentZoom;
            zoomLabel.innerText = Math.round(this.currentZoom * 100) + '%';
            if (slider) {
                slider.value = this.currentZoom;
            }
        }
    },

    async updateStands() {
        const btn = document.getElementById('btn-update-stands');
        if(!btn) return;
        const originalText = btn.innerHTML;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Ubicando...';
        btn.disabled = true;
        
        try {
            const res = await API.get('ubicarProyectos');
            if (res.success) {
                UI.showToast('Proyectos ubicados correctamente en el mapa.', 'success');
                // Recargar el iframe para ver los cambios
                const iframe = document.getElementById('map-iframe');
                if (iframe) {
                    // Forzar recarga del iframe añadiendo un parámetro de tiempo
                    const currentSrc = iframe.src.split('&t=')[0];
                    iframe.src = currentSrc + '&t=' + new Date().getTime();
                }
            } else {
                UI.showToast('Error: ' + (res.error || 'No se pudieron ubicar los proyectos.'), 'error');
            }
        } catch (error) {
            UI.showToast('Error de conexión al sincronizar.', 'error');
        } finally {
            btn.innerHTML = originalText;
            btn.disabled = false;
        }
    }
};
