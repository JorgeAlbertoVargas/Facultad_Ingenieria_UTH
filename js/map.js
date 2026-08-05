/**
 * Módulo para el Mapa Público de Visitantes
 */
const MapView = {
    currentZoom: 1.15,
    
    load() {
        const app = document.getElementById('app');
        app.innerHTML = `
            <div style="padding: 15px; text-align: center; height: 100vh; background: var(--bg-light); display: flex; flex-direction: column;">
                <div style="margin-bottom: 15px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px;">
                    <div style="text-align: left;">
                        <h2 style="color:var(--primary); margin: 0;">Feria Facultad Ingenieria</h2>
                        <span style="color:var(--text-muted); font-size: 0.9rem;">Mapa en Tiempo Real</span>
                    </div>
                    
                    <div style="display: flex; gap: 10px; align-items: center;">
                        <button class="btn btn-primary" onclick="MapView.zoomOut()" style="padding: 10px; font-size: 1rem; border-radius: 50%; width: 35px; height: 35px; display: flex; align-items: center; justify-content: center;"><i class="fas fa-minus"></i></button>
                        
                        <input type="range" id="zoom-slider" min="0.4" max="2.5" step="0.05" value="1.15" oninput="MapView.onSliderChange(this.value)" style="width: 150px; cursor: pointer; accent-color: var(--primary);">
                        
                        <button class="btn btn-primary" onclick="MapView.zoomIn()" style="padding: 10px; font-size: 1rem; border-radius: 50%; width: 35px; height: 35px; display: flex; align-items: center; justify-content: center;"><i class="fas fa-plus"></i></button>
                        
                        <span style="font-weight: 600; min-width: 50px; text-align: right;" id="zoom-level">115%</span>
                    </div>
                    
                    <div>
                        <button class="btn" style="background: var(--text-dark); color: white;" onclick="location.reload()">
                            <i class="fas fa-arrow-left"></i> Salir
                        </button>
                    </div>
                </div>
                
                <div style="flex: 1; width: 100%; border-radius: var(--radius); overflow: auto; box-shadow: var(--shadow-md); background: var(--white); position: relative;">
                    <iframe id="map-iframe"
                        src="https://docs.google.com/spreadsheets/d/1uWdbjKJRVTTzSwlmaLFIexWViE4xGhttL_WhKduolOw/htmlembed?gid=1405650204&widget=false&headers=false&chrome=false" 
                        width="100%" 
                        height="100%" 
                        frameborder="0"
                        style="border:0; min-height: 800px; zoom: ${this.currentZoom}; transition: zoom 0.2s;">
                    </iframe>
                </div>
            </div>
        `;
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
    }
};
