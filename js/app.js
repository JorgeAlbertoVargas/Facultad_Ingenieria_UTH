/**
 * Router y Controlador Principal
 */
const App = {
    init() {
        Auth.init();

        // Enlaces públicos
        document.getElementById('btn-public-map').addEventListener('click', () => {
            StudentRegistration.init();
            UI.navigate('student-registration-view');
        });
    },

    async loadMainLayout() {
        UI.navigate('main-layout');
        
        // Actualizar datos del usuario en Sidebar
        document.getElementById('user-name').innerText = Auth.user.name;
        document.getElementById('user-role-badge').innerText = Auth.user.role;
        
        this.buildMenu();
        
        // Cargar vista por defecto según el rol
        if (Auth.user.role === 'Evaluador') {
            await this.loadTernaInfo(); // <- SE ESPERA A CONOCER LA TERNA ANTES DE CARGAR PROYECTOS
            Judge.loadDashboard();
        } else if (Auth.user.role === 'Administrador') {
            Admin.loadDashboard();
        }
    },

    async loadTernaInfo() {
        try {
            const response = await API.get('getTerna', { email: Auth.user.email });
            if (response.success && response.terna) {
                Auth.user.terna = response.terna;
                document.getElementById('user-terna-info').style.display = 'block';
                document.getElementById('user-terna-name').innerText = response.terna;
                if (response.companeros.length > 0) {
                    const listHtml = '<ul style="padding-left: 15px; margin-top: 0; line-height: 1.6;">' + 
                        response.companeros.map(c => `<li>${c}</li>`).join('') + 
                        '</ul>';
                    document.getElementById('user-terna-colleagues').innerHTML = listHtml;
                } else {
                    document.getElementById('user-terna-colleagues').innerHTML = '<span style="font-style:italic;">Ninguno asignado</span>';
                }
            }
        } catch (error) {
            console.error("No se pudo cargar la info de la terna");
        }
    },

    buildMenu() {
        const menu = document.getElementById('nav-menu');
        menu.innerHTML = '';

        if (Auth.user.role === 'Evaluador') {
            menu.innerHTML = `
                <li><a href="#" class="active" id="nav-judge-dash"><i class="fas fa-clipboard-list"></i> Proyectos</a></li>
            `;
            document.getElementById('nav-judge-dash').addEventListener('click', (e) => {
                e.preventDefault();
                Judge.loadDashboard();
            });
        } else if (Auth.user.role === 'Administrador') {
            let menuHTML = `
                <li><a href="#" class="active" id="nav-admin-dash"><i class="fas fa-chart-pie"></i> Dashboard</a></li>
                <li><a href="#" id="nav-admin-ranking"><i class="fas fa-trophy"></i> Diplomas y Rankings</a></li>
            `;
            
            if (Auth.user.correoSender) {
                menuHTML += `<li><a href="#" id="nav-admin-report"><i class="fas fa-file-alt"></i> Reporte de Notas</a></li>`;
            }

            menuHTML += `<li><a href="#" id="nav-admin-users"><i class="fas fa-users"></i> Jueces</a></li>`;
            
            menu.innerHTML = menuHTML;

            document.getElementById('nav-admin-dash').addEventListener('click', (e) => {
                e.preventDefault();
                UI.updateActiveNav('nav-admin-dash');
                Admin.loadDashboard();
            });
            
            document.getElementById('nav-admin-ranking').addEventListener('click', (e) => {
                e.preventDefault();
                UI.updateActiveNav('nav-admin-ranking');
                Admin.loadRankings();
            });

            if (Auth.user.correoSender) {
                document.getElementById('nav-admin-report').addEventListener('click', (e) => {
                    e.preventDefault();
                    UI.updateActiveNav('nav-admin-report');
                    Admin.loadReport();
                });
            }

            document.getElementById('nav-admin-users').addEventListener('click', (e) => {
                e.preventDefault();
                UI.updateActiveNav('nav-admin-users');
                UI.showToast('Módulo de jueces en construcción...', 'info');
            });
        }
    }
};

// Iniciar aplicación al cargar el DOM
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});
