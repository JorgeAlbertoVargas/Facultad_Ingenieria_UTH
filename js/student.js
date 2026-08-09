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

    renderMap() {
        const mapContainer = document.getElementById('interactive-map-container');
        if (!mapContainer) return;

        let html = '<div class="stands-grid">';
        
        // Renderizar stands del 1 al máximo disponible (asumiremos hasta el stand más alto o 60)
        const maxStand = this.stands.length > 0 ? Math.max(...this.stands.map(s => s.number)) : 60;
        
        for (let i = 1; i <= Math.max(maxStand, 60); i++) {
            const standInfo = this.stands.find(s => s.number === i) || { number: i, status: 'libre' };
            const isOccupied = standInfo.status !== 'libre';
            const statusClass = isOccupied ? 'stand-occupied' : 'stand-free';
            
            html += `
                <div class="stand-box ${statusClass}" data-stand="${i}" ${isOccupied ? '' : `onclick="StudentRegistration.selectStand(${i})"`} title="Stand ${i} - ${isOccupied ? 'Ocupado' : 'Disponible'}">
                    ${i}
                </div>
            `;
        }
        
        html += '</div>';
        
        // Agregar CSS básico para el mapa aquí para asegurar que se vea bien si no está en styles.css
        html += `
        <style>
            .stands-grid {
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(40px, 1fr));
                gap: 5px;
                padding: 15px;
                background: #f8f9fa;
                border-radius: 8px;
                border: 1px solid #ddd;
                max-height: 300px;
                overflow-y: auto;
            }
            .stand-box {
                aspect-ratio: 1;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: 4px;
                font-weight: bold;
                font-size: 12px;
                cursor: pointer;
                transition: transform 0.1s, box-shadow 0.1s;
                border: 1px solid rgba(0,0,0,0.1);
            }
            .stand-free {
                background-color: #e6f4ea;
                color: #1e8e3e;
            }
            .stand-free:hover {
                transform: scale(1.1);
                box-shadow: 0 2px 4px rgba(0,0,0,0.2);
            }
            .stand-occupied {
                background-color: #fce8e6;
                color: #d93025;
                cursor: not-allowed;
                opacity: 0.7;
            }
            .stand-selected {
                background-color: var(--primary) !important;
                color: white !important;
                border-color: #004d20 !important;
                transform: scale(1.1);
                box-shadow: 0 0 0 2px #fff, 0 0 0 4px var(--primary);
            }
            .registration-form-grid {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 15px;
            }
            @media (max-width: 768px) {
                .registration-form-grid {
                    grid-template-columns: 1fr;
                }
            }
            .file-note {
                font-size: 11px;
                color: var(--text-muted);
                margin-top: 4px;
                display: block;
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
            <div style="max-width: 1000px; margin: 0 auto; padding: 20px; min-height: 100vh;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                    <h1 style="color: var(--primary); margin: 0;">Inscripción de Proyecto</h1>
                    <button class="btn btn-text" onclick="ui.showView('login-view')">
                        <i class="fas fa-arrow-left"></i> Volver
                    </button>
                </div>
                
                <div class="card" style="padding: 25px;">
                    <form id="student-registration-form" onsubmit="StudentRegistration.submitForm(event)">
                        
                        <h3 style="margin-top:0; color: var(--text-dark); border-bottom: 2px solid var(--primary); padding-bottom: 5px;">1. Ubicación en el Mapa (Check-in)</h3>
                        <p style="color: var(--text-muted); font-size: 14px;">Selecciona un stand disponible (en verde) para tu proyecto. El ID de tu proyecto se generará automáticamente basado en esta selección.</p>
                        
                        <div id="interactive-map-container" style="margin-bottom: 20px;">
                            <!-- El mapa se renderiza aquí -->
                        </div>

                        <h3 style="color: var(--text-dark); border-bottom: 2px solid var(--primary); padding-bottom: 5px;">2. Datos Generales</h3>
                        <div class="registration-form-grid">
                            <div class="input-group">
                                <label for="reg-fecha">Fecha</label>
                                <input type="date" id="reg-fecha" value="${today}" required readonly style="background-color: #e9ecef;">
                            </div>
                            <div class="input-group">
                                <label for="reg-id-proyecto">ID Proyecto (Auto-generado)</label>
                                <input type="text" id="reg-id-proyecto" placeholder="Selecciona un stand primero..." required readonly style="background-color: #e9ecef; font-weight: bold; color: var(--primary);">
                            </div>
                            <div class="input-group">
                                <label for="reg-email-grupo">Correo Electrónico del Grupo / Líder</label>
                                <input type="email" id="reg-email-grupo" required placeholder="correo@uth.hn">
                            </div>
                            <div class="input-group">
                                <label for="reg-nombre-largo">Nombre Largo del Proyecto</label>
                                <input type="text" id="reg-nombre-largo" required placeholder="Ej: Sistema Integrado de Gestión...">
                            </div>
                            <div class="input-group">
                                <label for="reg-nombre-corto">Nombre Corto del Proyecto</label>
                                <input type="text" id="reg-nombre-corto" required placeholder="Ej: SisGen">
                            </div>
                            <div class="input-group">
                                <label for="reg-funcionalidad">Funcionalidad del Proyecto</label>
                                <input type="text" id="reg-funcionalidad" required placeholder="¿Qué problema resuelve?">
                            </div>
                            <div class="input-group">
                                <label for="reg-campus">Campus</label>
                                <select id="reg-campus" required>
                                    <option value="">Seleccione...</option>
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
                                <label for="reg-asignatura">Asignatura</label>
                                <input type="text" id="reg-asignatura" required placeholder="Nombre de la clase">
                            </div>
                            <div class="input-group">
                                <label for="reg-carrera">Carrera</label>
                                <select id="reg-carrera" required>
                                    <option value="">Seleccione...</option>
                                    <option value="Ing. Computación">Ing. Computación</option>
                                    <option value="Ing. Electrónica">Ing. Electrónica</option>
                                    <option value="Ing. Producción Industrial">Ing. Producción Industrial</option>
                                    <option value="Ing. Financiera">Ing. Financiera</option>
                                    <option value="Otra">Otra</option>
                                </select>
                            </div>
                            <div class="input-group">
                                <label for="reg-catedratico">Catedrático</label>
                                <input type="text" id="reg-catedratico" required placeholder="Nombre del catedrático">
                            </div>
                            <div class="input-group">
                                <label for="reg-periodo">Periodo</label>
                                <input type="text" id="reg-periodo" required placeholder="Ej: I PAC 2026">
                            </div>
                            <div class="input-group">
                                <label for="reg-categoria">Categoría</label>
                                <select id="reg-categoria" required>
                                    <option value="">Seleccione...</option>
                                    <option value="Junior">Junior</option>
                                    <option value="Senior">Senior</option>
                                    <option value="Avanzado">Avanzado</option>
                                    <option value="Maestría">Maestría</option>
                                </select>
                            </div>
                        </div>

                        <h3 style="color: var(--text-dark); border-bottom: 2px solid var(--primary); padding-bottom: 5px; margin-top: 20px;">3. Logística</h3>
                        <div class="registration-form-grid">
                            <div class="input-group">
                                <label for="reg-alimentacion">Alimentación Eléctrica requerida</label>
                                <select id="reg-alimentacion" required>
                                    <option value="">Seleccione...</option>
                                    <option value="110V">110V</option>
                                    <option value="220V">220V</option>
                                    <option value="No requiere">No requiere</option>
                                </select>
                            </div>
                            <div class="input-group">
                                <label for="reg-dimensiones">Dimensiones del Stand estimadas</label>
                                <input type="text" id="reg-dimensiones" required placeholder="Ej: 2x2 metros">
                            </div>
                        </div>

                        <h3 style="color: var(--text-dark); border-bottom: 2px solid var(--primary); padding-bottom: 5px; margin-top: 20px;">4. Archivos y Documentación</h3>
                        <p style="color: var(--text-muted); font-size: 13px;">Nota: Solo se permite 1 documento por campo. Extensiones permitidas: PDF, JPG, PNG.</p>
                        
                        <div class="registration-form-grid">
                            <div class="input-group">
                                <label for="reg-factura">No. Factura / Recibo</label>
                                <input type="text" id="reg-factura" required placeholder="Número de comprobante">
                            </div>
                            <div class="input-group">
                                <label for="reg-comprobante-file">Comprobante de Pago (Foto/PDF)</label>
                                <input type="file" id="reg-comprobante-file" accept=".pdf,image/*" required>
                                <span class="file-note">Peso máximo recomendado: 2MB</span>
                            </div>
                            <div class="input-group">
                                <label for="reg-foto-file">Fotografía Grupal</label>
                                <input type="file" id="reg-foto-file" accept="image/*" required>
                                <span class="file-note">Peso máximo recomendado: 2MB</span>
                            </div>
                            <div class="input-group">
                                <label for="reg-articulo-file">Artículo Científico (PDF)</label>
                                <input type="file" id="reg-articulo-file" accept=".pdf" required>
                                <span class="file-note">Peso máximo recomendado: 2MB</span>
                            </div>
                        </div>
                        
                        <div class="input-group" style="margin-top: 15px;">
                            <label for="reg-video-url">Video del Proyecto (URL)</label>
                            <input type="url" id="reg-video-url" required placeholder="https://youtube.com/... o https://drive.google.com/..." style="border-color: var(--primary);">
                            <span class="file-note">Sube tu video a YouTube o Google Drive y pega el enlace aquí. (Asegúrate de que el enlace sea público)</span>
                        </div>

                        <div style="margin-top: 30px; text-align: right;">
                            <button type="submit" id="btn-submit-registration" class="btn btn-primary" style="padding: 12px 30px; font-size: 16px;">
                                <i class="fas fa-paper-plane"></i> Inscribir Proyecto
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        `;
    },

    async submitForm(event) {
        event.preventDefault();
        
        if (!this.selectedStand) {
            ui.showToast("Debes seleccionar un stand en el mapa antes de continuar.", "error");
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
                ui.showToast("Proyecto inscrito con éxito.", "success");
                
                // Limpiar formulario y volver al login
                document.getElementById('student-registration-form').reset();
                this.selectedStand = null;
                this.randomChars = this.generateRandomString(8); // Generar uno nuevo por si acaso
                
                setTimeout(() => {
                    ui.showView('login-view');
                }, 2000);
            } else {
                ui.showToast(response.error || "Error al inscribir el proyecto.", "error");
            }
        } catch (error) {
            console.error(error);
            ui.showToast("Error de conexión al enviar los datos.", "error");
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
                ui.showToast(`El archivo ${file.name} es demasiado grande.`, "error");
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
            ui.showView('student-registration-view');
        });
    }
});
