/**
 * API Wrapper para conectar con Google Apps Script
 */

const API_URL = 'https://script.google.com/macros/s/AKfycbxOC-9d1E01zmF7_Ozs8ICKrAM9yXmfDpNVUQV6zrjArSSMaxmvoAF_Vmj1AktiEyFsEQ/exec';

const API = {
    async post(action, payload) {
        if (!API_URL || API_URL === 'AQUÍ_IRÁ_LA_URL_DEL_WEBAPP_DE_APPS_SCRIPT') {
            console.warn("API URL no configurada. Simulando respuesta.");
            return this.mockPost(action, payload);
        }

        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                mode: 'cors',
                headers: {
                    'Content-Type': 'text/plain;charset=utf-8', // Apps script CORS workaround
                },
                body: JSON.stringify({ action, ...payload })
            });
            return await response.json();
        } catch (error) {
            console.error("API Error:", error);
            alert("Error de conexión al enviar los datos a Google. Revisa la consola (F12) para más detalles. Mensaje: " + error.message);
            throw new Error("Error de conexión con el servidor.");
        }
    },

    async get(action, params = {}) {
        if (!API_URL || API_URL === 'AQUÍ_IRÁ_LA_URL_DEL_WEBAPP_DE_APPS_SCRIPT') {
            return this.mockGet(action, params);
        }

        try {
            const url = new URL(API_URL);
            url.searchParams.append('action', action);
            for (const [key, value] of Object.entries(params)) {
                url.searchParams.append(key, value);
            }
            const response = await fetch(url);
            return await response.json();
        } catch (error) {
            console.error("API Error:", error);
            throw new Error("Error de conexión con el servidor.");
        }
    },

    // ==========================================
    // Mocks para desarrollo sin conexión real
    // ==========================================
    _mockProjects: [
        { 'Código Proyecto': 'PRJ-001', 'Nombre corto': 'Brazo Robótico', 'Nombre largo': 'Brazo Robótico Controlado por IA', 'Carrera': 'Ing. Mecatrónica', 'Categoría': 'Avanzado', 'Campus': 'SPS', 'Profesor': 'Ing. Carlos', evaluado: false },
        { 'Código Proyecto': 'PRJ-002', 'Nombre corto': 'App Reciclaje', 'Nombre largo': 'EcoTrack: App de reciclaje', 'Carrera': 'Ing. Computación', 'Categoría': 'Junior', 'Campus': 'Tegucigalpa', 'Profesor': 'Ing. Ana', evaluado: true },
        { 'Código Proyecto': 'PRJ-003', 'Nombre corto': 'Panel Solar', 'Nombre largo': 'Eficiencia en Paneles Solares', 'Carrera': 'Ing. Electrónica', 'Categoría': 'Senior', 'Campus': 'SPS', 'Profesor': 'Ing. Luis', evaluado: false },
    ],

    async mockPost(action, payload) {
        return new Promise((resolve) => {
            setTimeout(() => {
                if (action === 'login') {
                    if (payload.email === 'juez@uth.hn' && payload.password === '1234') {
                        resolve({ success: true, user: { email: 'juez@uth.hn', role: 'Evaluador', name: 'Juan Pérez' } });
                    } else if (payload.email === 'admin@uth.hn') {
                        resolve({ success: true, user: { email: 'admin@uth.hn', role: 'Administrador', name: 'Admin UTH', correoSender: true } });
                    } else {
                        resolve({ success: false, error: 'Credenciales inválidas (Prueba con juez@uth.hn / 1234)' });
                    }
                } else if (action === 'register') {
                    // Simular registro exitoso
                    resolve({ success: true, user: { email: payload.email, role: 'Evaluador', name: payload.name } });
                } else if (action === 'saveEvaluation') {
                    // Marcar el proyecto como evaluado en el Mock
                    const index = this._mockProjects.findIndex(p => p['Código Proyecto'] === payload.codigoProyecto);
                    if (index !== -1) {
                        this._mockProjects[index].evaluado = true;
                    }
                    resolve({ success: true, message: 'Evaluación guardada (Mock)' });
                } else if (action === 'sendReportEmails') {
                    resolve({
                        success: true,
                        message: 'Se enviaron correos de prueba (Mock) a jorge.vargas@uth.hn',
                        log: ['Mock email enviado para Catedrático X']
                    });
                } else if (action === 'registerProject') {
                    console.log('Mock registerProject payload:', payload);
                    resolve({ success: true, message: 'Proyecto registrado (Mock)' });
                }
            }, 800);
        });
    },

    async mockGet(action, params) {
        return new Promise((resolve) => {
            setTimeout(() => {
                if (action === 'getProjects') {
                    resolve({
                        success: true,
                        projects: this._mockProjects
                    });
                } else if (action === 'getStats') {
                    resolve({
                        success: true,
                        stats: { totalProjects: 35, totalEvaluations: 120, categories: 4 }
                    });
                } else if (action === 'getQuestions') {
                    // Mock para poder probar la generación dinámica
                    resolve({
                        success: true,
                        questions: [
                            { bloque: "I - EL GRUPO (30%)", numero: 1, titulo: "Preparación y Puntualidad", porcentaje: 6, puntos_A: 5, criterio_A: "Instalado a tiempo y funcionando.", puntos_B: 3, criterio_B: "Retrasos menores.", puntos_C: 1, criterio_C: "Tardío o incompleta." },
                            { bloque: "I - EL GRUPO (30%)", numero: 2, titulo: "Orden y Presentación", porcentaje: 6, puntos_A: 5, criterio_A: "Stand profesional, claro.", puntos_B: 3, criterio_B: "Bien organizado.", puntos_C: 1, criterio_C: "Desorganizado." },
                            { bloque: "II - TÉCNICO (50%)", numero: 6, titulo: "Claridad de Objetivos", porcentaje: 10, puntos_A: 10, criterio_A: "Específicos y correctos (Escala 10).", puntos_B: 5, criterio_B: "Básico correcto (Escala 5).", puntos_C: 1, criterio_C: "Vagos o débiles." }
                        ]
                    });
                } else if (action === 'getAvailableStands') {
                    let standsMock = [];
                    for (let i = 1; i <= 78; i++) {
                        standsMock.push({
                            number: i,
                            status: Math.random() > 0.85 ? 'ocupado' : 'libre'
                        });
                    }
                    resolve({
                        success: true,
                        stands: standsMock
                    });
                } else if (action === 'getMapUrl') {
                    resolve({
                        success: true,
                        url: "https://docs.google.com/spreadsheets/d/1gJjPjGDhjcfP_wMxQHYCEXkNHLD-lAewLhGeb-UMtBw/htmlembed?gid=1169813579&widget=false&headers=false&chrome=false"
                    });
                } else if (action === 'ubicarProyectos') {
                    resolve({
                        success: true,
                        message: 'Proyectos ubicados (Mock)'
                    });
                } else if (action === 'getReportData') {
                    resolve({
                        success: true,
                        report: [
                            { idProyecto: 'PRJ-001', nombreLargo: 'Brazo Robótico Controlado por IA', nombreCorto: 'Brazo Robótico', asignatura: 'Robótica 1', catedratico: 'Ing. Carlos', calificacion: 95.5 },
                            { idProyecto: 'PRJ-002', nombreLargo: 'EcoTrack: App de reciclaje', nombreCorto: 'App Reciclaje', asignatura: 'Programación 3', catedratico: 'Ing. Ana', calificacion: 88.0 },
                            { idProyecto: 'PRJ-003', nombreLargo: 'Eficiencia en Paneles Solares', nombreCorto: 'Panel Solar', asignatura: 'Física 2', catedratico: 'Ing. Luis', calificacion: 0 }
                        ]
                    });
                }
            }, 800);
        });
    }
};
