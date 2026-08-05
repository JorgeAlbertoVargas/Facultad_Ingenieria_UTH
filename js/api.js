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
                        resolve({ success: true, user: { email: 'admin@uth.hn', role: 'Administrador', name: 'Admin UTH' } });
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
                }
            }, 800);
        });
    }
};
