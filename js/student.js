/**
 * Módulo para la Inscripción de Proyectos de Estudiantes
 */

const StudentRegistration = {
    stands: [],
    selectedStand: null,
    config: null,
    mapOnly: false,

    async init(mapOnly = false) {
        this.mapOnly = mapOnly;
        this.selectedStand = null;
        // Generar 8 caracteres aleatorios para el ID base
        this.randomChars = this.generateRandomString(8);
        try {
            const configResp = await API.get('getConfig');
            if (configResp.success && configResp.config) {
                this.config = configResp.config;
            } else {
                this.config = {};
                console.error("No se pudo cargar la configuración:", configResp.error);
            }
        } catch (e) {
            console.error("Error al cargar configuración:", e);
            this.config = {};
        }
        this.render();
        this.loadStands();
    },

    buildOptions(optionsArray) {
        if (!optionsArray || !optionsArray.length) return '';
        return optionsArray.map(opt => `<option value="${opt}">${opt}</option>`).join('\n                                        ');
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

    validateCategoria() {
        const categoriaSelect = document.getElementById('reg-categoria');
        const periodoSelect = document.getElementById('reg-periodo');
        
        if (!categoriaSelect || !periodoSelect) return true;

        const categoria = categoriaSelect.value.toLowerCase();
        const periodo = periodoSelect.value;
        
        if (!categoria || !periodo) return true;

        const match = periodo.match(/(\d+)/);
        if (!match) return true;
        const periodoNum = parseInt(match[1], 10);

        if (categoria.includes('junior')) {
            if (periodoNum > 7) {
                UI.showToast("La categoría Junior requiere estar entre el 1er y 7mo Periodo.", "warning");
                categoriaSelect.value = '';
                return false;
            }
        } else if (categoria.includes('avanzado')) {
            if (periodoNum < 8) {
                UI.showToast("La categoría Avanzado requiere estar entre el 8vo y 13vo Periodo.", "warning");
                categoriaSelect.value = '';
                return false;
            }
        }
        return true;
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
                
                // Actualizar instrucciones si provienen de la BD
                if (response.instrucciones) {
                    const instContainer = document.getElementById('dynamic-instructions-container');
                    if (instContainer) {
                        instContainer.innerHTML = response.instrucciones.replace(/\n/g, '<br>');
                    }
                }

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
        else if (i >= 61 && i <= 63) { row = i - 60; col = 1; }
        else if (i >= 64 && i <= 66) { row = (i - 64) + 6; col = 1; }
        // Antiguo 68 y 69 ahora son 67 y 68
        else if (i === 67) { row = 1; col = 14; }
        else if (i === 68) { row = 1; col = 15; }
        // Antiguo 70 y 71 ahora son 69 y 70
        else if (i === 69) { row = 8; col = 14; }
        else if (i === 70) { row = 8; col = 15; }
        // Antiguo 71-74 ahora son 71-73 (3 cuadros arriba)
        else if (i >= 71 && i <= 73) { row = i - 70; col = 17; }
        // Antiguo 75-77 ahora son 74-76 (3 cuadros abajo)
        else if (i >= 74 && i <= 76) { row = (i - 74) + 6; col = 17; }

        return { row, col };
    },

    renderMap() {
        const mapContainer = document.getElementById('interactive-map-container');
        if (!mapContainer) return;

        let html = '<div class="stands-map-wrapper"><div class="stands-grid-custom">';
        
        for (let i = 1; i <= 76; i++) {
            let standInfo = this.stands.find(s => s.number === i) || { number: i, status: 'libre' };
            // FORZAR LIBERACIÓN PARA PRUEBAS (antiguos 76, 77 ahora son 75, 76. Sumamos 63 y 64)
            if (i === 75 || i === 76 || i === 63 || i === 64) standInfo = { number: i, status: 'libre' };

            const isOccupied = standInfo.status !== 'libre';
            const statusClass = isOccupied ? 'stand-occupied' : 'stand-free';
            
            const pos = this.getStandGridPosition(i);
            
            let typeClass = 'stand-110v';
            if (pos.col === 1) {
                typeClass = 'stand-trifasico';
            } else if (pos.col === 17) {
                typeClass = 'stand-monofasico';
            }
            
            let idProyecto = standInfo.id_proyecto || `PRJ-${i.toString().padStart(3, '0')}`;
            let nombreCorto = standInfo.nombre_corto || `Nombre Corto`;

            html += `
                <div class="stand-box ${statusClass} ${typeClass}" data-stand="${i}" 
                     style="grid-row: ${pos.row}; grid-column: ${pos.col}; flex-direction: column; padding: 2px; text-align: center;"
                     ${isOccupied ? '' : `onclick="StudentRegistration.selectStand(${i})"`} 
                     title="Stand ${i} - ${isOccupied ? 'Ocupado' : 'Disponible'}">
                    <span style="font-size: 12px; font-weight: 900; line-height: 1;">${i}</span>
                    <span style="font-size: 8.5px; font-weight: bold; margin-top: 2px;">${idProyecto}</span>
                    <span style="font-size: 7px; line-height: 1.1; margin-top: 1px; overflow: hidden; text-overflow: ellipsis; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; width: 100%; word-break: break-word;">${nombreCorto}</span>
                </div>
            `;
        }
        
        // Agregar etiquetas
        html += `<div class="map-label" style="grid-row: 4 / 6; grid-column: 1; align-self: center; font-size: 20px; font-weight: bold; color: #1b5e20;">Baños</div>`;
        html += `<div class="map-label" style="grid-row: 4 / 6; grid-column: 17; align-self: center; font-size: 20px; font-weight: bold; color: #1b5e20;">Escenario</div>`;
        html += `<div class="map-label label-red" style="grid-row: 1; grid-column: 2; align-self: start; white-space: nowrap;">Entrada<br>Posterior</div>`;
        html += `<div class="map-label label-red" style="grid-row: 8; grid-column: 2; align-self: end; white-space: nowrap;">Entrada<br>Frontal</div>`;

        html += `<div class="map-vertical-label" style="left: -65px; top: 50%; transform: translateY(-50%) rotate(180deg);">220 Volts. Trifásico.</div>`;
        html += `<div class="map-vertical-label" style="right: -70px; top: 50%; transform: translateY(-50%);">220 Volts. Monofásico.</div>`;
        html += `<div class="map-horizontal-label" style="top: -35px; left: 50%; transform: translateX(-50%);">110 Volts. Monofásico.</div>`;

        html += '</div></div>';
        
        html += `
        <style>
            .stands-map-wrapper {
                overflow-x: hidden;
                padding: 45px 80px;
                width: 100%;
            }
            .stands-grid-custom {
                display: grid;
                grid-template-columns: minmax(0, 1fr) minmax(0, 0.6fr) repeat(10, minmax(0, 1fr)) minmax(0, 0.8fr) repeat(2, minmax(0, 1fr)) minmax(0, 0.8fr) minmax(0, 1fr);
                grid-template-rows: repeat(8, 1fr);
                gap: 4px;
                background: white;
                width: 100%;
                margin: 0 auto;
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
                aspect-ratio: 1;
            }
            .stand-110v {
                border-color: #81c784;
                border-top-color: #2e7d32;
            }
            .stand-110v.stand-free {
                background-color: #e8f5e9;
                color: #1b5e20;
            }
            .stand-trifasico {
                border-color: #ef9a9a;
                border-top-color: #d32f2f;
            }
            .stand-trifasico.stand-free {
                background-color: #ffebee;
                color: #c62828;
            }
            .stand-monofasico {
                border-color: #bcaaa4;
                border-top-color: #5d4037;
            }
            .stand-monofasico.stand-free {
                background-color: #ffe0b2;
                color: #e65100;
            }
            .stand-free:hover {
                transform: scale(1.1);
                box-shadow: 0 2px 8px rgba(0,0,0,0.3);
                z-index: 10;
            }
            .stand-occupied {
                background-color: #f5f5f5 !important;
                color: #bdbdbd !important;
                cursor: not-allowed;
                border-color: rgba(0,0,0,0.2) !important;
                border-top-color: #e0e0e0 !important;
            }
            .stand-selected {
                background-color: #4caf50 !important;
                color: white !important;
                border-color: #2e7d32 !important;
                border-top-color: #2e7d32 !important;
                transform: scale(1.1);
                box-shadow: 0 0 0 2px #fff, 0 0 0 4px #4caf50 !important;
                z-index: 10;
            }
            .stand-trifasico.stand-selected {
                background-color: #29b6f6 !important;
                border-color: #0277bd !important;
                border-top-color: #0277bd !important;
                box-shadow: 0 0 0 2px #fff, 0 0 0 4px #29b6f6 !important;
            }
            .stand-monofasico.stand-selected {
                background-color: #ff9800 !important;
                border-color: #e65100 !important;
                border-top-color: #e65100 !important;
                box-shadow: 0 0 0 2px #fff, 0 0 0 4px #ff9800 !important;
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
                color: #c62828;
                font-size: 11px;
            }
            .map-vertical-label {
                writing-mode: vertical-rl;
                position: absolute;
                display: flex;
                align-items: center;
                justify-content: center;
                font-weight: 900;
                color: #555;
                font-size: 26px;
                letter-spacing: 2px;
                text-align: center;
                white-space: nowrap;
            }
            .map-horizontal-label {
                position: absolute;
                display: flex;
                align-items: center;
                justify-content: center;
                font-weight: 900;
                color: #555;
                font-size: 24px;
                letter-spacing: 1px;
                text-align: center;
                white-space: nowrap;
            }
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
            
            // Restricción de Alimentación Eléctrica
            const alimSelect = document.getElementById('reg-alimentacion');
            if (alimSelect) {
                let restrictType = "110";
                if (selectedEl.classList.contains('stand-trifasico')) {
                    restrictType = "trifasica";
                } else if (selectedEl.classList.contains('stand-monofasico')) {
                    restrictType = "220_monofasica";
                }
                
                Array.from(alimSelect.options).forEach(opt => {
                    if (opt.value === "") return;
                    let valLower = opt.value.toLowerCase();
                    let keep = false;
                    
                    if (restrictType === "trifasica" && valLower.includes("trifásica")) keep = true;
                    if (restrictType === "220_monofasica" && valLower.includes("220") && valLower.includes("monofásica")) keep = true;
                    if (restrictType === "110" && valLower.includes("110")) keep = true;
                    
                    if (keep) {
                        opt.disabled = false;
                        opt.style.display = 'block';
                        alimSelect.value = opt.value;
                    } else {
                        opt.disabled = true;
                        opt.style.display = 'none';
                    }
                });
                
                let msgDiv = document.getElementById('alim-warning-msg');
                if (!msgDiv) {
                    msgDiv = document.createElement('div');
                    msgDiv.id = 'alim-warning-msg';
                    msgDiv.style.fontSize = '12px';
                    msgDiv.style.color = '#d32f2f';
                    msgDiv.style.marginTop = '8px';
                    alimSelect.parentNode.appendChild(msgDiv);
                }
                msgDiv.innerHTML = `<i class="fas fa-info-circle"></i> La alimentación eléctrica está restringida por la ubicación seleccionada. Si requiere otro tipo, cambie de ubicación en el mapa.`;
            }
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
        
        if (this.mapOnly) {
            container.innerHTML = `
                <div style="background-color: #EDF3EA; min-height: 100vh; padding: 30px 15px;">
                    <div style="max-width: 1600px; width: 96%; margin: 0 auto;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                            <button class="btn btn-text" onclick="UI.navigate('login-view')" style="background-color: white; border-radius: 20px; padding: 6px 16px; box-shadow: var(--shadow-sm); font-size: 13px;">
                                <i class="fas fa-arrow-left"></i> Volver al Inicio
                            </button>
                        </div>
                        <div class="card" style="padding: 24px; border-radius: 8px; margin-bottom: 12px; border: 1px solid #dadce0; background: white;">
                            <h3 style="margin-top:0; color: #202124; font-size: 22px; font-weight: 700; margin-bottom: 12px;">Mapa de Stands Disponibles</h3>
                            <div id="interactive-map-container" style="margin-bottom: 10px;">
                                <!-- El mapa se renderiza aquí -->
                            </div>
                        </div>
                    </div>
                </div>
            `;
            return;
        }

        const today = new Date().toISOString().split('T')[0];

        const tituloPrincipal = (this.config && this.config.Titulo && this.config.Titulo.length > 0) 
            ? this.config.Titulo[0] 
            : 'Feria Ingeniería | Formulario de Inscripción de Proyectos | 2do. Periodo del 2026.';
            
        const instruccionesHtml = (this.config && this.config.Instrucciones && this.config.Instrucciones.length > 0)
            ? this.config.Instrucciones.join('<br><br>')
            : `<p><strong>Bienvenido(a) al proceso de inscripción de proyectos.</strong> Por favor, complete todos los campos con información verídica actualizada. Es importante tener en cuenta que los datos proporcionados serán verificados por los organizadores, cualquier información falsa o incompleta podría invalidar su inscripción. Agradecemos su honestidad y colaboración.</p>

                                        <p><strong>¡Felicidades y gracias, futuros ingenieros e ingenieras de la UTH!</strong><br>
                                        Hoy es un día para celebrar. Cada proyecto que presentan en esta Feria de Ingeniería 2doP 2026 es la prueba de que lo aprendido en el aula puede convertirse en algo real: una solución que resuelve un problema, que mejora un proceso, que transforma una idea en algo tangible y útil para nuestra sociedad y nuestra industria.</p>

                                        <p>La Facultad de Ingeniería de la UTH reconoce y agradece profundamente el esfuerzo, las noches de trabajo, la creatividad y la dedicación que cada uno de ustedes puso para llegar hasta aquí. No es fácil tomar un concepto de clase y convertirlo en un prototipo, un sistema o una propuesta funcional. Pero ustedes lo lograron, y eso habla de su compromiso con la excelencia y la innovación.</p>

                                        <p>Recuerden que cada proyecto cuenta una historia: la del problema que identificaron, la del proceso que siguieron y la de la solución que construyeron. Por eso, les pedimos que completen toda la información solicitada en su ficha/formato de participación, esto nos permite conocer a fondo su trabajo. Reconocer su esfuerzo como se merece y compartir su innovación con quienes evaluarán los proyectos.</p>

                                        <p>Sigan soñando en grande, sigan innovando, y no olviden que la ingeniería no solo se trata de resolver ecuaciones, sino de resolver la vida de las personas a través del conocimiento adquirido cambiando para bien la sociedad a la que nos debemos.</p>

                                        <p><strong>¡Mucho éxito en su presentación!</strong><br>
                                        Facultad de Ingeniería — Universidad Tecnológica de Honduras (UTH)</p>`;

        const campusOpts = this.buildOptions(this.config?.Campus?.length > 0 ? this.config.Campus : [
            '1. Campus La Ceiba', '2. Campus Choluteca', '3. Campus Comayagua', '4. Campus El Progreso',
            '5. Campus Juticalpa', '6. Campus Puerto Cortes', '7. Campus Roatan', '8. Campus San Pedro Sula',
            '9. Campus Santa Barbara', '10. Campus Siguatepeque', '11. Campus Tegucigalpa', '12. Campus Villanueva', '13. Campus Choloma'
        ]);
        const fallbackAsignaturas = [
            '1. Automatización Industrial', '2. Automatización de Sistemas de Producción', '3. Automatización Industrial y Sistemas de Percepción', 
            '4. Circuitos Eléctricos I', '5. Circuitos Eléctricos II', '6. Circuitos Integrados', '7. Control de Procesos I', '8. Control de Procesos II', 
            '9. Diseño y Experimentación', '10. Dispositivos Lógicos Programables', '11. Dibujo Técnico I', '12. Dibujo Técnico II', 
            '13. Electrónica Análoga I', '14. Electrónica Análoga II', '15. Electrónica Digital', '16. Electromagnetismo', '17. Electrónica de Potencia', 
            '18. Estática', '19. Física I', '20. Física II', '21. Introducción a la Ingeniería Electrónica', '22. Internet Industrial de las Cosas IOT', 
            '23. Ingeniería de Métodos I', '24. Ingeniería de Métodos II', '25. Investigación de Operaciones I', '26. Investigación de Operaciones II', 
            '27. Microcontroladores', '28. Máquinas Eléctricas', '29. Metrología', '30. Mecánica de Fluidos', '31. Ondas Electromagnéticas', 
            '32. Optimización de Sistemas Productivos', '33. Preparación y Evaluación de Proyectos', '34. Producción I', '35. Producción II', 
            '36. Programación y Control de la Producción', '37. Planeación y Control de Proyectos', '38. Planeación y Control de la Calidad', 
            '39. Presupuesto y Control', '40. Procesos de Fabricación I', '41. Procesos de Fabricación II', '42. Proyectos de Inversión', '43. PLCs', 
            '44. Química General', '45. Robótica Industrial', '46. Redes Industriales', '47. Resistencia de Materiales I', 
            '48. Sistemas de Calidad Seis Sigma I', '49. Sistemas de Calidad Seis Sigma II', '50. Sistemas Hidráulicos y Neumáticos', 
            '51. Sistemas Industriales Distribuidos', '52. Telefonía y Seguridad IP', '53. Transductores y Actuadores', '54. Teoría de Control I', 
            '55. Teoría de Control II', '56. Telecomunicaciones'
        ];
        const fallbackCatedraticos = [
            'Ada Lesbia Gallo González', 'Alejandro Bosco Menocal Castillo', 'Alicia Cárdenas Maldonado', 'Carlos Antonio Ramírez Maldonado', 
            'Carlos Julio David Arita Castellanos', 'Carlos Bladimir', 'David Ricardo Santos Erazo', 'Dennis Amílcar Nolasco Martínez', 
            'Edgar Quinett Sanabria Peña', 'Eduin Alexis Figueroa Torres', 'Emilio José Estévez Pleitez', 'Enoc Murillo Henríquez', 
            'Erick Eduardo Escobar Orellana', 'Fredy Omar Hernández Torres', 'Gloria Carolina Ardón Montero', 'Gustavo Geovany López Membreño', 
            'Janania Clariza Viana Sevilla', 'Jonathan Medardo Paz Salgado', 'Jorge Alberto Vargas', 'Jorge Luis Diaz Ayestas', 
            'José Armando Hernández Gabrie', 'Jose David Valerio Eguigurems', 'José Luis Bendaña Laínez', 'José Ricardo Marín De Jesús', 
            'Juan José Cruz Orellana', 'Junior Armando Medina Agurcia', 'Karla Patricia Guardado Solorzano', 'Luis Edgardo Leiva Aguilar', 
            'Laura', 'Mirna Belisle Cardona', 'Nelson David Reyes Cárcamo', 'Oscar Alfonzo Bedoya Ramírez', 'Oscar David Carbajal Zuniga', 
            'Reynerio Edgardo Vásquez Becerra', 'Rosa María Segura Enamorado', 'Vilma Valladares Fajardo'
        ];
        const fallbackPeriodos = [
            '1er. Periodo', '2do. Periodo', '3er. Periodo', '4to. Periodo', '5to. Periodo', '6to. Periodo', '7mo. Periodo', 
            '8vo. Periodo', '9no. Periodo', '10mo. Periodo', '11mo. Periodo', '12mo. Periodo', '13vo. Periodo'
        ];
        
        const asigOpts = this.buildOptions(this.config?.Asignaturas?.length > 0 ? this.config.Asignaturas : fallbackAsignaturas); 
        const catOpts = this.buildOptions(this.config?.Categorias?.length > 0 ? this.config.Categorias : ['1.- Junior', '2.- Avanzado', '3.- Emprendimiento.', '4.- Demostrativo.', '5.- Investigacion.']);
        const carOpts = this.buildOptions(this.config?.Carreras?.length > 0 ? this.config.Carreras : ['Ingeniería Computación', 'Ingeniería Electrónica', 'Ingeniería Mecatrónica', 'Ingeniería Producción Industrial', 'Matemáticas', 'Técnico Automotriz']);
        const perOpts = this.buildOptions(this.config?.Periodos?.length > 0 ? this.config.Periodos : fallbackPeriodos); 
        const catedOpts = this.buildOptions(this.config?.Catedraticos?.length > 0 ? this.config.Catedraticos : fallbackCatedraticos); 
        const alimOpts = this.buildOptions(this.config?.Alimentacion?.length > 0 ? this.config.Alimentacion : ['110 Volts. Monofásica.', '220 Volts. Monofásica.', '220 Volts. Trifásica.']);
        const dimOpts = this.buildOptions(this.config?.Dimensiones?.length > 0 ? this.config.Dimensiones : ['2 Mts. x 1 Mts. (2 Mts. Cuadrados).', '3 Mts. x 2 Mts (6 Mts. Cuadrados).', 'Planta Baja UTH | Consulte con su catedrático, si no es justificable automáticamente es descalificado.']); 

        container.innerHTML = `
            <div style="background-color: #EDF3EA; min-height: 100vh; padding: 30px 15px;">
                <div style="max-width: 1600px; width: 96%; margin: 0 auto;">
                    
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                        <button class="btn btn-text" onclick="UI.navigate('login-view')" style="background-color: white; border-radius: 20px; padding: 6px 16px; box-shadow: var(--shadow-sm); font-size: 13px;">
                            <i class="fas fa-arrow-left"></i> Volver al Inicio
                        </button>
                    </div>

                    <!-- Tarjeta de Título -->
                    <div class="card" style="padding: 22px 24px 24px; border-radius: 8px; margin-bottom: 12px; border: 1px solid #dadce0; border-top: 10px solid var(--primary); background: white;">
                        <h1 style="color: #202124; margin: 0; font-size: 32px; font-weight: 400; line-height: 1.2;">${tituloPrincipal}</h1>
                    </div>

                    <!-- Banner de imagen -->
                    <div class="card" style="padding: 0; overflow: hidden; margin-bottom: 12px; border-radius: 8px; border: 1px solid #dadce0;">
                        <img src="./img/UTH.png" alt="Logo UTH" style="width: 100%; height: auto; display: block; object-fit: cover;">
                    </div>

                    <form id="student-registration-form" onsubmit="StudentRegistration.submitForm(event)">
                        
                        <!-- Tarjeta de Instrucciones -->
                        <div class="card" style="padding: 22px 24px 24px; border-radius: 8px; margin-bottom: 12px; border: 1px solid #dadce0; background: white;">
                            <h1 style="color: #202124; margin: 0 0 12px 0; font-size: 32px; font-weight: 400; line-height: 1.2;">Instrucciones</h1>
                            
                            <div style="background: #f8f9fa; border: 1px solid #e8eaed; border-radius: 8px; padding: 15px; margin-top: 5px;">
                                <details>
                                    <summary style="font-weight: 500; color: var(--primary); cursor: pointer; outline: none; font-size: 15px;">
                                        <i class="fas fa-info-circle" style="margin-right: 5px;"></i> Leer Instrucciones Importantes y Mensaje de Bienvenida
                                    </summary>
                                    <div id="dynamic-instructions-container" style="margin-top: 15px; font-size: 13.5px; color: #3c4043; line-height: 1.6; max-height: 350px; overflow-y: auto; padding-right: 10px; white-space: pre-wrap;">
                                        ${instruccionesHtml}
                                    </div>
                                </details>
                            </div>
                        </div>

                        <!-- Tarjeta 1: Mapa -->
                        <div class="card" style="padding: 24px; border-radius: 8px; margin-bottom: 12px; border: 1px solid #dadce0; background: white;">
                            <h3 style="margin-top:0; color: #202124; font-size: 22px; font-weight: 700; margin-bottom: 12px;">1. Ubicación en el Mapa (Check-in)</h3>
                            <p style="color: #5f6368; font-size: 14px; margin-bottom: 16px; line-height: 1.5;">Selecciona un stand disponible (en verde) para tu proyecto. El ID de tu proyecto se generará automáticamente basado en esta selección.</p>
                            
                            <div id="interactive-map-container" style="margin-bottom: 10px;">
                                <!-- El mapa se renderiza aquí -->
                            </div>
                        </div>

                        <!-- Tarjeta 2: Datos Generales -->
                        <div class="card" style="padding: 24px; border-radius: 8px; margin-bottom: 12px; border: 1px solid #dadce0; background: white;">
                            <h3 style="color: #202124; font-size: 22px; font-weight: 700; margin-bottom: 20px; margin-top: 0;">2. Datos Generales</h3>
                            
                            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-bottom: 30px;">
                                <div class="input-group">
                                    <label for="reg-fecha" style="font-size: 14px; color: #202124; margin-bottom: 8px; display: block;">Fecha</label>
                                    <input type="date" id="reg-fecha" value="${today}" required readonly style="background-color: #f1f3f4; border: 0; border-bottom: 1px solid #80868b; border-radius: 4px 4px 0 0; padding: 12px 14px; width: 100%; box-sizing: border-box;">
                                </div>
                                <div class="input-group">
                                    <label for="reg-id-proyecto" style="font-size: 14px; color: #202124; margin-bottom: 8px; display: block;">ID Proyecto (Auto-generado)</label>
                                    <input type="text" id="reg-id-proyecto" placeholder="Selecciona un stand primero..." required readonly style="background-color: #f1f3f4; border: 0; border-bottom: 1px solid #80868b; border-radius: 4px 4px 0 0; padding: 12px 14px; font-weight: bold; color: var(--primary); width: 100%; box-sizing: border-box;">
                                </div>
                                <div class="input-group" style="grid-column: 1 / -1;">
                                    <label for="reg-email-grupo" style="font-size: 14px; color: #202124; margin-bottom: 8px; display: block;">Correo Electrónico del Grupo / Líder *</label>
                                    <input type="email" id="reg-email-grupo" required placeholder="ejemplo@uth.hn" style="border: 0; border-bottom: 1px solid #80868b; border-radius: 0; padding: 8px 0; background: transparent; outline: none; transition: border-bottom 0.2s; width: 100%; box-sizing: border-box;">
                                </div>
                                <div class="input-group">
                                    <label for="reg-nombre-largo" style="font-size: 14px; color: #202124; margin-bottom: 8px; display: block;">Nombre Largo del Proyecto *</label>
                                    <input type="text" id="reg-nombre-largo" required placeholder="Ej. Brazo Robótico Automatizado con IA" style="border: 0; border-bottom: 1px solid #80868b; border-radius: 0; padding: 8px 0; background: transparent; outline: none; width: 100%; box-sizing: border-box;">
                                </div>
                                <div class="input-group">
                                    <label for="reg-nombre-corto" style="font-size: 14px; color: #202124; margin-bottom: 8px; display: block;">Nombre Corto del Proyecto *</label>
                                    <input type="text" id="reg-nombre-corto" required placeholder="Ej. Brazo Robot IA" style="border: 0; border-bottom: 1px solid #80868b; border-radius: 0; padding: 8px 0; background: transparent; outline: none; width: 100%; box-sizing: border-box;">
                                </div>
                                <div class="input-group" style="grid-column: 1 / -1;">
                                    <label for="reg-funcionalidad" style="font-size: 14px; color: #202124; margin-bottom: 8px; display: block;">Funcionalidad del Proyecto *</label>
                                    <input type="text" id="reg-funcionalidad" required placeholder="Ej. Seleccionar y clasificar piezas en la banda..." style="border: 0; border-bottom: 1px solid #80868b; border-radius: 0; padding: 8px 0; background: transparent; outline: none; width: 100%; box-sizing: border-box;">
                                </div>
                            </div>
                            
                            <h4 style="color: #202124; font-size: 18px; font-weight: 700; margin-bottom: 15px; border-bottom: 1px solid #eee; padding-bottom: 8px;">Clasificación Académica</h4>
                            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px;">
                                <div class="input-group">
                                    <label for="reg-campus" style="font-size: 14px; color: #202124; margin-bottom: 8px; display: block;">Campus *</label>
                                    <select id="reg-campus" required style="border: 1px solid #dadce0; border-radius: 4px; padding: 12px; background: white; width: 100%; box-sizing: border-box;">
                                        <option value="">Elige</option>
                                        ${campusOpts}
                                    </select>
                                </div>
                                <div class="input-group">
                                    <label for="reg-asignatura" style="font-size: 14px; color: #202124; margin-bottom: 8px; display: block;">Asignatura *</label>
                                    <select id="reg-asignatura" required style="border: 1px solid #dadce0; border-radius: 4px; padding: 12px; background: white; width: 100%; box-sizing: border-box;">
                                        <option value="">Elige</option>
                                        ${asigOpts}
                                    </select>
                                </div>
                                <div class="input-group">
                                    <label for="reg-carrera" style="font-size: 14px; color: #202124; margin-bottom: 8px; display: block;">Carrera *</label>
                                    <select id="reg-carrera" required style="border: 1px solid #dadce0; border-radius: 4px; padding: 12px; background: white; width: 100%; box-sizing: border-box;">
                                        <option value="">Elige</option>
                                        ${carOpts}
                                    </select>
                                </div>
                                <div class="input-group">
                                    <label for="reg-catedratico" style="font-size: 14px; color: #202124; margin-bottom: 8px; display: block;">Catedrático *</label>
                                    <select id="reg-catedratico" required style="border: 1px solid #dadce0; border-radius: 4px; padding: 12px; background: white; width: 100%; box-sizing: border-box;">
                                        <option value="">Elige</option>
                                        ${catedOpts}
                                    </select>
                                </div>
                                <div class="input-group">
                                    <label for="reg-periodo" style="font-size: 14px; color: #202124; margin-bottom: 8px; display: block;">Periodo *</label>
                                    <select id="reg-periodo" required onchange="StudentRegistration.validateCategoria()" style="border: 1px solid #dadce0; border-radius: 4px; padding: 12px; background: white; width: 100%; box-sizing: border-box;">
                                        <option value="">Elige</option>
                                        ${perOpts}
                                    </select>
                                </div>
                                <div class="input-group">
                                    <label for="reg-categoria" style="font-size: 14px; color: #202124; margin-bottom: 8px; display: block;">Categoría *</label>
                                    <select id="reg-categoria" required onchange="StudentRegistration.validateCategoria()" style="border: 1px solid #dadce0; border-radius: 4px; padding: 12px; background: white; width: 100%; box-sizing: border-box;">
                                        <option value="">Elige</option>
                                        ${catOpts}
                                    </select>
                                </div>
                            </div>
                        </div>

                        <!-- Tarjeta 3: Logística -->
                        <div class="card" style="padding: 24px; border-radius: 8px; margin-bottom: 12px; border: 1px solid #dadce0; background: white;">
                            <h3 style="margin-top:0; color: #202124; font-size: 22px; font-weight: 700; margin-bottom: 20px;">3. Logística</h3>
                            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px;">
                                <div class="input-group">
                                    <label for="reg-alimentacion" style="font-size: 14px; color: #202124; margin-bottom: 8px; display: block;">¿Qué tipo de alimentación eléctrica requiere su proyecto? *</label>
                                    <select id="reg-alimentacion" required style="border: 1px solid #dadce0; border-radius: 4px; padding: 12px; background: white; width: 100%; box-sizing: border-box;">
                                        <option value="">Elige</option>
                                        ${alimOpts}
                                    </select>
                                </div>
                                <div class="input-group">
                                    <label for="reg-dimensiones" style="font-size: 14px; color: #202124; margin-bottom: 8px; display: block;">¿Qué dimensiones en términos de área física necesita su proyecto? *</label>
                                    <select id="reg-dimensiones" required style="border: 1px solid #dadce0; border-radius: 4px; padding: 12px; background: white; width: 100%; box-sizing: border-box;">
                                        <option value="">Elige</option>
                                        ${dimOpts}
                                    </select>
                                </div>
                            </div>
                        </div>

                        <!-- Tarjeta 4: Archivos -->
                        <div class="card" style="padding: 24px; border-radius: 8px; margin-bottom: 12px; border: 1px solid #dadce0; background: white;">
                            <h3 style="margin-top:0; color: #202124; font-size: 22px; font-weight: 700; margin-bottom: 12px;">4. Archivos y Documentación</h3>
                            <p style="color: #5f6368; font-size: 13px; margin-bottom: 24px; line-height: 1.5;">Nota: Solo se permite 1 documento por campo. Extensiones permitidas: PDF, DOC, DOCX, PNG.</p>
                            
                            <div class="registration-form-grid">
                                <div class="input-group">
                                    <label for="reg-factura" style="font-size: 14px; color: #202124; margin-bottom: 8px; display: block;">No. Factura / Recibo *</label>
                                    <input type="text" id="reg-factura" pattern="\\d{3}-\\d{3}-\\d{2}-\\d{8}" title="El formato debe ser 000-000-00-00000000" required placeholder="000-000-00-00000000" style="border: 0; border-bottom: 1px solid #80868b; border-radius: 0; padding: 8px 0; background: transparent; outline: none; width: 100%; box-sizing: border-box;">
                                </div>
                                <div class="input-group">
                                    <label for="reg-comprobante-file" style="font-size: 14px; color: #202124; margin-bottom: 8px; display: block;">Comprobante de Pago (Foto/PDF) *</label>
                                    <input type="file" id="reg-comprobante-file" accept=".pdf,image/png" required style="border: 1px solid #dadce0; border-radius: 4px; padding: 10px; width: 100%; box-sizing: border-box;">
                                    <span class="file-note" style="color: #5f6368; font-size: 12px; margin-top: 4px;">Peso máximo recomendado: 2MB</span>
                                </div>
                                <div class="input-group">
                                    <label for="reg-foto-file" style="font-size: 14px; color: #202124; margin-bottom: 8px; display: block;">Fotografía Grupal (PNG) *</label>
                                    <input type="file" id="reg-foto-file" accept="image/png" required style="border: 1px solid #dadce0; border-radius: 4px; padding: 10px; width: 100%; box-sizing: border-box;">
                                    <span class="file-note" style="color: #5f6368; font-size: 12px; margin-top: 4px;">Peso máximo recomendado: 2MB</span>
                                </div>
                                <div class="input-group">
                                    <label for="reg-articulo-file" style="font-size: 14px; color: #202124; margin-bottom: 8px; display: block;">Artículo Científico (PDF o Word) *</label>
                                    <input type="file" id="reg-articulo-file" accept=".pdf,.doc,.docx" required style="border: 1px solid #dadce0; border-radius: 4px; padding: 10px; width: 100%; box-sizing: border-box;">
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

        if (!this.validateCategoria()) {
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
                    MapView.load();
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
