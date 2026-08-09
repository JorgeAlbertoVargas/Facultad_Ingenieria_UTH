/**
 * Módulo para la Inscripción de Proyectos de Estudiantes
 */

const StudentRegistration = {
    stands: [],
    selectedStand: null,
    randomChars: '',

    init() {
        // Generar 8 caracteres aleatorios para el ID base
        this.randomChars = this.generateRandomString(8);
        this.render();
        this.loadStands();
    },

    generateRandomString(length) {
        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let result = '';
        for (let i = 0; i < length; i++) {
            result += characters.charAt(Math.floor(Math.random() * characters.length));
        }
        return result;
    },

    updateProjectID() {
        const idInput = document.getElementById('reg-id-proyecto');
        if (idInput && this.selectedStand) {
            // Formato: FI - 8 chars - 001
            const standNum = this.selectedStand.toString().padStart(3, '0');
            idInput.value = `FI-${this.randomChars}-${standNum}`;
        }
    },

    async loadStands() {
        try {
            const mapContainer = document.getElementById('interactive-map-container');
            if (mapContainer) {
                mapContainer.innerHTML = '<p style="text-align:center; padding: 20px;"><i class="fas fa-spinner fa-spin"></i> Cargando disponibilidad de stands...</p>';
            }

            const response = await API.get('getAvailableStands');
            if (response.success) {
                this.stands = response.stands; // Array of objects { number: 1, status: 'libre' | 'ocupado' }
                this.renderMap();
            } else {
                if (mapContainer) {
                    mapContainer.innerHTML = `<p style="text-align:center; color: var(--danger);">${response.error || 'Error al cargar mapa'}</p>`;
                }
            }
        } catch (error) {
            console.error(error);
            const mapContainer = document.getElementById('interactive-map-container');
            if (mapContainer) {
                mapContainer.innerHTML = '<p style="text-align:center; color: var(--danger);">Error de conexión al cargar el mapa.</p>';
            }
        }
    },

    getStandGridPosition(i) {
        let row = 1;
        let col = 1;

        if (i >= 1 && i <= 10) { row = 1; col = 2 + i; }
        else if (i >= 11 && i <= 20) { row = 2; col = 2 + (i - 10); }
        else if (i >= 21 && i <= 30) { row = 3; col = 2 + (i - 20); }
        else if (i >= 31 && i <= 40) { row = 6; col = 2 + (i - 30); }
        else if (i >= 41 && i <= 50) { row = 7; col = 2 + (i - 40); }
        else if (i >= 51 && i <= 60) { row = 8; col = 2 + (i - 50); }
        else if (i >= 61 && i <= 64) { row = i - 60; col = 1; }
        else if (i >= 65 && i <= 67) { row = (i - 65) + 5; col = 1; }
        else if (i === 68) { row = 1; col = 14; }
        else if (i === 69) { row = 1; col = 15; }
        else if (i === 70) { row = 8; col = 14; }
        else if (i === 71) { row = 8; col = 15; }
        else if (i >= 72 && i <= 75) { row = i - 71; col = 17; }
        else if (i >= 76 && i <= 78) { row = (i - 76) + 6; col = 17; }

        return { row, col };
    },

    renderMap() {
        const mapContainer = document.getElementById('interactive-map-container');
        if (!mapContainer) return;

        let html = '<div class="stands-map-wrapper"><div class="stands-grid-custom">';
        
        for (let i = 1; i <= 78; i++) {
            const standInfo = this.stands.find(s => s.number === i) || { number: i, status: 'libre' };
            const isOccupied = standInfo.status !== 'libre';
            const statusClass = isOccupied ? 'stand-occupied' : 'stand-free';
            
            const pos = this.getStandGridPosition(i);
            
            html += `
                <div class="stand-box ${statusClass}" data-stand="${i}" 
                     style="grid-row: ${pos.row}; grid-column: ${pos.col};"
                     ${isOccupied ? '' : `onclick="StudentRegistration.selectStand(${i})"`} 
                     title="Stand ${i} - ${isOccupied ? 'Ocupado' : 'Disponible'}">
                    ${i}
                </div>
            `;
        }
        
        // Agregar etiquetas
        html += `<div class="map-label" style="grid-row: 5; grid-column: 1;">Baños</div>`;
        html += `<div class="map-label" style="grid-row: 5; grid-column: 17;">Escenario</div>`;
        html += `<div class="map-label label-red" style="grid-row: 1; grid-column: 2; align-self: start; white-space: nowrap;">Entrada<br>Posterior</div>`;
        html += `<div class="map-label label-red" style="grid-row: 8; grid-column: 2; align-self: end; white-space: nowrap;">Entrada<br>Frontal</div>`;

        html += '</div></div>';
        
        html += `
        <style>
            .stands-map-wrapper {
                overflow-x: auto;
                padding: 10px 0;
            }
            .stands-grid-custom {
                display: grid;
                grid-template-columns: 1fr 0.6fr repeat(10, 1fr) 0.8fr repeat(2, 1fr) 0.8fr 1fr;
                grid-template-rows: repeat(8, minmax(45px, 1fr));
                gap: 6px;
                background: white;
                min-width: 860px;
                position: relative;
            }
            .stand-box {
                display: flex;
                align-items: center;
                justify-content: center;
                font-weight: bold;
                font-size: 13px;
                cursor: pointer;
                transition: transform 0.1s, box-shadow 0.1s;
                border: 1px solid rgba(0,0,0,0.2);
                border-top-width: 6px;
                border-top-color: #a5d6a7;
                aspect-ratio: 1;
            }
            .stand-free {
                background-color: #ffffff;
                color: #2e7d32;
            }
            .stand-free:hover {
                transform: scale(1.1);
                box-shadow: 0 2px 8px rgba(0,0,0,0.3);
                z-index: 10;
            }
            .stand-occupied {
                background-color: #f5f5f5;
                color: #bdbdbd;
                cursor: not-allowed;
                border-top-color: #e0e0e0;
            }
            .stand-selected {
                background-color: var(--primary) !important;
                color: white !important;
                border-color: #004d20 !important;
                border-top-color: #004d20 !important;
                transform: scale(1.1);
                box-shadow: 0 0 0 2px #fff, 0 0 0 4px var(--primary);
                z-index: 10;
            }
            .map-label {
                display: flex;
                align-items: center;
                justify-content: center;
                font-weight: bold;
                color: #d32f2f;
                font-size: 13px;
                text-align: center;
            }
            .label-red {
                color: #d32f2f;
                font-size: 11px;
            }
        </style>
        `;
        
        mapContainer.innerHTML = html;

        if (this.selectedStand) {
            this.highlightStand(this.selectedStand);
        }
    },

    selectStand(standNumber) {
        this.selectedStand = standNumber;
        this.updateProjectID();
        
        // Actualizar UI del mapa
        const allStands = document.querySelectorAll('.stand-box');
        allStands.forEach(el => el.classList.remove('stand-selected'));
        
        const selectedEl = document.querySelector(`.stand-box[data-stand="${standNumber}"]`);
        if (selectedEl) {
            selectedEl.classList.add('stand-selected');
        }
    },

    highlightStand(standNumber) {
        const selectedEl = document.querySelector(`.stand-box[data-stand="${standNumber}"]`);
        if (selectedEl) {
            selectedEl.classList.add('stand-selected');
        }
    },

    render() {
        const container = document.getElementById('student-registration-view');
        
        const today = new Date().toISOString().split('T')[0];

        container.innerHTML = `
            <div style="background-color: #EDF3EA; min-height: 100vh; padding: 30px 15px;">
                <div style="max-width: 1600px; width: 96%; margin: 0 auto;">
                    
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                        <button class="btn btn-text" onclick="UI.navigate('login-view')" style="background-color: white; border-radius: 20px; padding: 6px 16px; box-shadow: var(--shadow-sm); font-size: 13px;">
                            <i class="fas fa-arrow-left"></i> Volver al Inicio
                        </button>
                    </div>

                    <!-- Banner de imagen -->
                    <div class="card" style="padding: 0; overflow: hidden; margin-bottom: 12px; border-radius: 8px; border: 1px solid #dadce0;">
                        <img src="./img/UTH.png" alt="Logo UTH" style="width: 100%; height: auto; display: block; object-fit: cover;">
                    </div>

                    <form id="student-registration-form" onsubmit="StudentRegistration.submitForm(event)">
                        
                        <!-- Tarjeta de Título -->
                        <div class="card" style="padding: 22px 24px 24px; border-radius: 8px; margin-bottom: 12px; border: 1px solid #dadce0; border-top: 10px solid var(--primary); background: white;">
                            <h1 style="color: #202124; margin: 0 0 12px 0; font-size: 32px; font-weight: 400; line-height: 1.2;">Feria Ingeniería | Formulario de Inscripción de Proyectos 2do. Periodo del 2026.</h1>
                            <p style="color: #202124; font-size: 14px; margin: 0; line-height: 1.5;">Completa el formulario a continuación para inscribir tu proyecto.</p>
                        </div>

                        <!-- Tarjeta 1: Mapa -->
                        <div class="card" style="padding: 24px; border-radius: 8px; margin-bottom: 12px; border: 1px solid #dadce0; background: white;">
                            <h3 style="margin-top:0; color: #202124; font-size: 16px; font-weight: 500; margin-bottom: 12px;">1. Ubicación en el Mapa (Check-in)</h3>
                            <p style="color: #5f6368; font-size: 14px; margin-bottom: 16px; line-height: 1.5;">Selecciona un stand disponible (en verde) para tu proyecto. El ID de tu proyecto se generará automáticamente basado en esta selección.</p>
                            
                            <div id="interactive-map-container" style="margin-bottom: 10px;">
                                <!-- El mapa se renderiza aquí -->
                            </div>
                        </div>

                        <!-- Tarjeta 2: Datos Generales -->
                        <div class="card" style="padding: 24px; border-radius: 8px; margin-bottom: 12px; border: 1px solid #dadce0; background: white;">
                            <h3 style="color: #202124; font-size: 16px; font-weight: 500; margin-bottom: 20px; margin-top: 0;">2. Datos Generales</h3>
                            <div class="registration-form-grid">
                                <div class="input-group">
                                    <label for="reg-fecha" style="font-size: 14px; color: #202124; margin-bottom: 8px; display: block;">Fecha</label>
                                    <input type="date" id="reg-fecha" value="${today}" required readonly style="background-color: #f1f3f4; border: 0; border-bottom: 1px solid #80868b; border-radius: 4px 4px 0 0; padding: 12px 14px;">
                                </div>
                                <div class="input-group">
                                    <label for="reg-id-proyecto" style="font-size: 14px; color: #202124; margin-bottom: 8px; display: block;">ID Proyecto (Auto-generado)</label>
                                    <input type="text" id="reg-id-proyecto" placeholder="Selecciona un stand primero..." required readonly style="background-color: #f1f3f4; border: 0; border-bottom: 1px solid #80868b; border-radius: 4px 4px 0 0; padding: 12px 14px; font-weight: bold; color: var(--primary);">
                                </div>
                                <div class="input-group">
                                    <label for="reg-email-grupo" style="font-size: 14px; color: #202124; margin-bottom: 8px; display: block;">Correo Electrónico del Grupo / Líder *</label>
                                    <input type="email" id="reg-email-grupo" required placeholder="Tu respuesta" style="border: 0; border-bottom: 1px solid #80868b; border-radius: 0; padding: 8px 0; background: transparent; outline: none; transition: border-bottom 0.2s;">
                                </div>
                                <div class="input-group">
                                    <label for="reg-nombre-largo" style="font-size: 14px; color: #202124; margin-bottom: 8px; display: block;">Nombre Largo del Proyecto *</label>
                                    <input type="text" id="reg-nombre-largo" required placeholder="Tu respuesta" style="border: 0; border-bottom: 1px solid #80868b; border-radius: 0; padding: 8px 0; background: transparent; outline: none;">
                                </div>
                                <div class="input-group">
                                    <label for="reg-nombre-corto" style="font-size: 14px; color: #202124; margin-bottom: 8px; display: block;">Nombre Corto del Proyecto *</label>
                                    <input type="text" id="reg-nombre-corto" required placeholder="Tu respuesta" style="border: 0; border-bottom: 1px solid #80868b; border-radius: 0; padding: 8px 0; background: transparent; outline: none;">
                                </div>
                                <div class="input-group">
                                    <label for="reg-funcionalidad" style="font-size: 14px; color: #202124; margin-bottom: 8px; display: block;">Funcionalidad del Proyecto *</label>
                                    <input type="text" id="reg-funcionalidad" required placeholder="Tu respuesta" style="border: 0; border-bottom: 1px solid #80868b; border-radius: 0; padding: 8px 0; background: transparent; outline: none;">
                                </div>
                                <div class="input-group">
                                    <label for="reg-campus" style="font-size: 14px; color: #202124; margin-bottom: 8px; display: block;">Campus *</label>
                                    <select id="reg-campus" required style="border: 1px solid #dadce0; border-radius: 4px; padding: 12px; background: white;">
                                        <option value="">Elige</option>
                                        <option value="SPS">San Pedro Sula</option>
                                        <option value="Tegucigalpa">Tegucigalpa</option>
                                        <option value="El Progreso">El Progreso</option>
                                        <option value="La Ceiba">La Ceiba</option>
                                        <option value="Choluteca">Choluteca</option>
                                        <option value="Roatán">Roatán</option>
                                        <option value="Siguatepeque">Siguatepeque</option>
                                        <option value="Santa Bárbara">Santa Bárbara</option>
                                    </select>
                                </div>
                                <div class="input-group">
                                    <label for="reg-asignatura" style="font-size: 14px; color: #202124; margin-bottom: 8px; display: block;">Asignatura *</label>
                                    <input type="text" id="reg-asignatura" required placeholder="Tu respuesta" style="border: 0; border-bottom: 1px solid #80868b; border-radius: 0; padding: 8px 0; background: transparent; outline: none;">
                                </div>
                                <div class="input-group">
                                    <label for="reg-carrera" style="font-size: 14px; color: #202124; margin-bottom: 8px; display: block;">Carrera *</label>
                                    <select id="reg-carrera" required style="border: 1px solid #dadce0; border-radius: 4px; padding: 12px; background: white;">
                                        <option value="">Elige</option>
                                        <option value="Ing. Computación">Ing. Computación</option>
                                        <option value="Ing. Electrónica">Ing. Electrónica</option>
                                        <option value="Ing. Producción Industrial">Ing. Producción Industrial</option>
                                        <option value="Ing. Financiera">Ing. Financiera</option>
                                        <option value="Otra">Otra</option>
                                    </select>
                                </div>
                                <div class="input-group">
                                    <label for="reg-catedratico" style="font-size: 14px; color: #202124; margin-bottom: 8px; display: block;">Catedrático *</label>
                                    <input type="text" id="reg-catedratico" required placeholder="Tu respuesta" style="border: 0; border-bottom: 1px solid #80868b; border-radius: 0; padding: 8px 0; background: transparent; outline: none;">
                                </div>
                                <div class="input-group">
                                    <label for="reg-periodo" style="font-size: 14px; color: #202124; margin-bottom: 8px; display: block;">Periodo *</label>
                                    <input type="text" id="reg-periodo" required placeholder="Tu respuesta" style="border: 0; border-bottom: 1px solid #80868b; border-radius: 0; padding: 8px 0; background: transparent; outline: none;">
                                </div>
                                <div class="input-group">
                                    <label for="reg-categoria" style="font-size: 14px; color: #202124; margin-bottom: 8px; display: block;">Categoría *</label>
                                    <select id="reg-categoria" required style="border: 1px solid #dadce0; border-radius: 4px; padding: 12px; background: white;">
                                        <option value="">Elige</option>
                                        <option value="Junior">Junior</option>
                                        <option value="Senior">Senior</option>
                                        <option value="Avanzado">Avanzado</option>
                                        <option value="Maestría">Maestría</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        <!-- Tarjeta 3: Logística -->
                        <div class="card" style="padding: 24px; border-radius: 8px; margin-bottom: 12px; border: 1px solid #dadce0; background: white;">
                            <h3 style="margin-top:0; color: #202124; font-size: 16px; font-weight: 500; margin-bottom: 20px;">3. Logística</h3>
                            <div class="registration-form-grid">
                                <div class="input-group">
                                    <label for="reg-alimentacion" style="font-size: 14px; color: #202124; margin-bottom: 8px; display: block;">Alimentación Eléctrica requerida *</label>
                                    <select id="reg-alimentacion" required style="border: 1px solid #dadce0; border-radius: 4px; padding: 12px; background: white;">
                                        <option value="">Elige</option>
                                        <option value="110V">110V</option>
                                        <option value="220V">220V</option>
                                        <option value="No requiere">No requiere</option>
                                    </select>
                                </div>
                                <div class="input-group">
                                    <label for="reg-dimensiones" style="font-size: 14px; color: #202124; margin-bottom: 8px; display: block;">Dimensiones del Stand estimadas *</label>
                                    <input type="text" id="reg-dimensiones" required placeholder="Tu respuesta" style="border: 0; border-bottom: 1px solid #80868b; border-radius: 0; padding: 8px 0; background: transparent; outline: none;">
                                </div>
                            </div>
                        </div>

                        <!-- Tarjeta 4: Archivos -->
                        <div class="card" style="padding: 24px; border-radius: 8px; margin-bottom: 12px; border: 1px solid #dadce0; background: white;">
                            <h3 style="margin-top:0; color: #202124; font-size: 16px; font-weight: 500; margin-bottom: 12px;">4. Archivos y Documentación</h3>
                            <p style="color: #5f6368; font-size: 13px; margin-bottom: 24px; line-height: 1.5;">Nota: Solo se permite 1 documento por campo. Extensiones permitidas: PDF, JPG, PNG.</p>
                            
                            <div class="registration-form-grid">
                                <div class="input-group">
                                    <label for="reg-factura" style="font-size: 14px; color: #202124; margin-bottom: 8px; display: block;">No. Factura / Recibo *</label>
                                    <input type="text" id="reg-factura" required placeholder="Tu respuesta" style="border: 0; border-bottom: 1px solid #80868b; border-radius: 0; padding: 8px 0; background: transparent; outline: none;">
                                </div>
                                <div class="input-group">
                                    <label for="reg-comprobante-file" style="font-size: 14px; color: #202124; margin-bottom: 8px; display: block;">Comprobante de Pago (Foto/PDF) *</label>
                                    <input type="file" id="reg-comprobante-file" accept=".pdf,image/*" required style="border: 1px solid #dadce0; border-radius: 4px; padding: 10px; width: 100%;">
                                    <span class="file-note" style="color: #5f6368; font-size: 12px; margin-top: 4px;">Peso máximo recomendado: 2MB</span>
                                </div>
                                <div class="input-group">
                                    <label for="reg-foto-file" style="font-size: 14px; color: #202124; margin-bottom: 8px; display: block;">Fotografía Grupal *</label>
                                    <input type="file" id="reg-foto-file" accept="image/*" required style="border: 1px solid #dadce0; border-radius: 4px; padding: 10px; width: 100%;">
                                    <span class="file-note" style="color: #5f6368; font-size: 12px; margin-top: 4px;">Peso máximo recomendado: 2MB</span>
                                </div>
                                <div class="input-group">
                                    <label for="reg-articulo-file" style="font-size: 14px; color: #202124; margin-bottom: 8px; display: block;">Artículo Científico (PDF) *</label>
                                    <input type="file" id="reg-articulo-file" accept=".pdf" required style="border: 1px solid #dadce0; border-radius: 4px; padding: 10px; width: 100%;">
                                    <span class="file-note" style="color: #5f6368; font-size: 12px; margin-top: 4px;">Peso máximo recomendado: 2MB</span>
                                </div>
                            </div>
                            
                            <div class="input-group" style="margin-top: 24px;">
                                <label for="reg-video-url" style="font-size: 14px; color: #202124; margin-bottom: 8px; display: block;">Video del Proyecto (URL) *</label>
                                <input type="url" id="reg-video-url" required placeholder="Tu respuesta" style="border: 0; border-bottom: 1px solid #80868b; border-radius: 0; padding: 8px 0; background: transparent; outline: none; width: 100%;">
                                <span class="file-note" style="color: #5f6368; font-size: 12px; margin-top: 4px;">Sube tu video a YouTube o Google Drive y pega el enlace aquí. (Asegúrate de que el enlace sea público)</span>
                            </div>
                        </div>

                        <div style="margin-top: 20px; display: flex; justify-content: space-between; align-items: center; padding-bottom: 20px;">
                            <button type="submit" id="btn-submit-registration" class="btn btn-primary" style="background-color: var(--primary); color: white; padding: 10px 24px; font-size: 14px; border-radius: 4px; border: none; font-weight: 500;">
                                Enviar
                            </button>
                            <span style="font-size: 12px; color: #5f6368;">Feria de Ingeniería | App (Simulado)</span>
                        </div>
                    </form>
                </div>
            </div>
        `;
    },

    async submitForm(event) {
        event.preventDefault();
        
        if (!this.selectedStand) {
            UI.showToast("Debes seleccionar un stand en el mapa antes de continuar.", "error");
            return;
        }

        const btn = document.getElementById('btn-submit-registration');
        const originalText = btn.innerHTML;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Enviando...';
        btn.disabled = true;

        try {
            // Leer archivos como Base64
            const comprobanteBase64 = await this.readFileAsBase64(document.getElementById('reg-comprobante-file').files[0]);
            const fotoBase64 = await this.readFileAsBase64(document.getElementById('reg-foto-file').files[0]);
            const articuloBase64 = await this.readFileAsBase64(document.getElementById('reg-articulo-file').files[0]);

            const payload = {
                Fecha: document.getElementById('reg-fecha').value,
                E_mail_Grupo: document.getElementById('reg-email-grupo').value,
                ID_Proyecto: document.getElementById('reg-id-proyecto').value,
                Nombre_Largo_Proyecto: document.getElementById('reg-nombre-largo').value,
                Nombre_Corto_Proyecto: document.getElementById('reg-nombre-corto').value,
                No_Factura: document.getElementById('reg-factura').value,
                Funcionalidad_Proyecto: document.getElementById('reg-funcionalidad').value,
                Campus: document.getElementById('reg-campus').value,
                Alimentacion_Electrica: document.getElementById('reg-alimentacion').value,
                Dimensiones_Stand: document.getElementById('reg-dimensiones').value,
                Asignatura: document.getElementById('reg-asignatura').value,
                Carrera: document.getElementById('reg-carrera').value,
                Periodo: document.getElementById('reg-periodo').value,
                Categoria_Ingresada: document.getElementById('reg-categoria').value,
                Catedratico: document.getElementById('reg-catedratico').value,
                Video_Proyecto: document.getElementById('reg-video-url').value,
                Stand_Seleccionado: this.selectedStand,
                
                // Archivos en Base64
                Comprobante_Pago: comprobanteBase64,
                Fotografia_Grupal: fotoBase64,
                Articulo_Cientifico: articuloBase64
            };

            const response = await API.post('registerProject', payload);

            if (response.success) {
                UI.showToast("Proyecto inscrito con éxito.", "success");
                
                // Limpiar formulario y volver al login
                document.getElementById('student-registration-form').reset();
                this.selectedStand = null;
                this.randomChars = this.generateRandomString(8); // Generar uno nuevo por si acaso
                
                setTimeout(() => {
                    UI.navigate('login-view');
                }, 2000);
            } else {
                UI.showToast(response.error || "Error al inscribir el proyecto.", "error");
            }
        } catch (error) {
            console.error(error);
            UI.showToast("Error de conexión al enviar los datos.", "error");
        } finally {
            btn.innerHTML = originalText;
            btn.disabled = false;
        }
    },

    readFileAsBase64(file) {
        return new Promise((resolve, reject) => {
            if (!file) {
                resolve(null);
                return;
            }
            
            // Validar tamaño (~3MB)
            if (file.size > 3 * 1024 * 1024) {
                reject(new Error(`El archivo ${file.name} es demasiado grande. Máximo 3MB.`));
                UI.showToast(`El archivo ${file.name} es demasiado grande.`, "error");
                return;
            }

            const reader = new FileReader();
            reader.onload = () => {
                // Return only the base64 string, remove the Data-URL prefix (e.g. data:image/png;base64,)
                const base64String = reader.result.split(',')[1];
                resolve({
                    filename: file.name,
                    mimeType: file.type,
                    data: base64String
                });
            };
            reader.onerror = error => reject(error);
            reader.readAsDataURL(file);
        });
    }
};

// Listeners globales para conectar con app.js o index.html
document.addEventListener('DOMContentLoaded', () => {
    const btnRegister = document.getElementById('btn-public-register');
    if (btnRegister) {
        btnRegister.addEventListener('click', (e) => {
            e.preventDefault();
            StudentRegistration.init();
            UI.navigate('student-registration-view');
        });
    }
});
