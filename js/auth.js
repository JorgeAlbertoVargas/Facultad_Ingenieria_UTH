/**
 * Módulo de Autenticación
 */
const Auth = {
    user: null,

    async init() {
        try {
            const configResp = await API.get('getConfig');
            if (configResp.success && configResp.adminicion) {
                this.disableLogin();
            }
        } catch (e) {
            console.error('Error fetching config in Auth:', e);
        }

        const storedUser = localStorage.getItem('uefes_user');
        if (storedUser) {
            this.user = JSON.parse(storedUser);
            App.loadMainLayout();
        } else {
            UI.navigate('login-view');
        }
        this.bindEvents();
    },

    disableLogin() {
        const loginForm = document.getElementById('login-form');
        const registerForm = document.getElementById('register-form');
        
        if(loginForm) {
            const inputs = loginForm.querySelectorAll('input, button[type="submit"]');
            inputs.forEach(el => {
                el.disabled = true;
                el.style.opacity = '0.5';
                el.style.cursor = 'not-allowed';
            });
            const link = document.getElementById('link-to-register');
            if(link) {
                link.style.pointerEvents = 'none';
                link.style.opacity = '0.5';
            }
        }
        
        if(registerForm) {
            const inputs = registerForm.querySelectorAll('input, button[type="submit"]');
            inputs.forEach(el => {
                el.disabled = true;
                el.style.opacity = '0.5';
                el.style.cursor = 'not-allowed';
            });
            const link = document.getElementById('link-to-login');
            if(link) {
                link.style.pointerEvents = 'none';
                link.style.opacity = '0.5';
            }
        }
    },

    bindEvents() {
        const loginForm = document.getElementById('login-form');
        const registerForm = document.getElementById('register-form');
        const linkToRegister = document.getElementById('link-to-register');
        const linkToLogin = document.getElementById('link-to-login');

        if (linkToRegister) {
            linkToRegister.addEventListener('click', (e) => {
                e.preventDefault();
                loginForm.style.display = 'none';
                registerForm.style.display = 'block';
            });
        }

        if (linkToLogin) {
            linkToLogin.addEventListener('click', (e) => {
                e.preventDefault();
                registerForm.style.display = 'none';
                loginForm.style.display = 'block';
            });
        }

        if (loginForm) {
            loginForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const email = document.getElementById('email').value;
                const password = document.getElementById('password').value;
                const btn = loginForm.querySelector('button');
                
                btn.disabled = true;
                btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Ingresando...';
                
                try {
                    const response = await API.post('login', { email, password });
                    if (response.success) {
                        this.user = response.user;
                        localStorage.setItem('uefes_user', JSON.stringify(this.user));
                        UI.showToast(`Bienvenido ${this.user.name}`, 'success');
                        App.loadMainLayout();
                    } else {
                        document.getElementById('login-error').innerText = response.error;
                    }
                } catch (err) {
                    document.getElementById('login-error').innerText = err.message;
                } finally {
                    btn.disabled = false;
                    btn.innerText = 'Iniciar Sesión';
                }
            });
        }

        if (registerForm) {
            registerForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const name = document.getElementById('reg-name').value;
                const email = document.getElementById('reg-email').value;
                const password = document.getElementById('reg-password').value;
                const btn = registerForm.querySelector('button');
                
                btn.disabled = true;
                btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Registrando...';
                
                try {
                    const response = await API.post('register', { name, email, password });
                    if (response.success) {
                        // Auto-login después de registro
                        this.user = response.user;
                        localStorage.setItem('uefes_user', JSON.stringify(this.user));
                        UI.showToast(`Cuenta creada. ¡Bienvenido ${this.user.name}!`, 'success');
                        App.loadMainLayout();
                    } else {
                        document.getElementById('register-error').innerText = response.error;
                    }
                } catch (err) {
                    document.getElementById('register-error').innerText = err.message;
                } finally {
                    btn.disabled = false;
                    btn.innerText = 'Crear Cuenta';
                }
            });
        }

        const btnLogout = document.getElementById('btn-logout');
        if (btnLogout) {
            btnLogout.addEventListener('click', () => this.logout());
        }
    },

    logout() {
        this.user = null;
        localStorage.removeItem('uefes_user');
        UI.navigate('login-view');
        document.getElementById('login-form').reset();
        document.getElementById('login-error').innerText = '';
    }
};
