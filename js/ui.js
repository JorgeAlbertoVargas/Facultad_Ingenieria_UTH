/**
 * Utilidades de Interfaz de Usuario
 */
const UI = {
    showToast(message, type = 'info') {
        const container = document.getElementById('toast-container');
        if (!container) return;

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        let icon = 'info-circle';
        if (type === 'success') icon = 'check-circle';
        if (type === 'error') icon = 'exclamation-circle';

        toast.innerHTML = `
            <i class="fas fa-${icon}"></i>
            <span>${message}</span>
        `;

        container.appendChild(toast);

        // Animar entrada
        setTimeout(() => toast.classList.add('show'), 10);

        // Remover después de 3s
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    },

    showLoader(elementId) {
        const el = document.getElementById(elementId);
        if (el) {
            el.innerHTML = '<div style="text-align:center; padding:40px;"><i class="fas fa-spinner fa-spin fa-2x" style="color:var(--primary)"></i><p style="margin-top:10px; color:var(--text-muted)">Cargando...</p></div>';
        }
    },

    navigate(viewId) {
        document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
        const view = document.getElementById(viewId);
        if (view) {
            view.classList.add('active');
        }
    },

    showPdfViewer(url) {
        if (!url) return;
        
        let previewUrl = url;
        // Convert to preview URL to bypass account picker and embed nicely
        if (url.includes('drive.google.com/open?id=')) {
            const id = new URL(url).searchParams.get('id');
            if (id) previewUrl = `https://drive.google.com/file/d/${id}/preview`;
        } else if (url.includes('/view')) {
            previewUrl = url.replace('/view', '/preview');
        } else if (url.includes('/file/d/')) {
            const match = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
            if (match) previewUrl = `https://drive.google.com/file/d/${match[1]}/preview`;
        }

        // Create modal container
        const modal = document.createElement('div');
        modal.style.position = 'fixed';
        modal.style.top = '0';
        modal.style.left = '0';
        modal.style.width = '100%';
        modal.style.height = '100%';
        modal.style.backgroundColor = 'rgba(0,0,0,0.85)';
        modal.style.zIndex = '9999';
        modal.style.display = 'flex';
        modal.style.flexDirection = 'column';
        modal.style.alignItems = 'center';
        modal.style.justifyContent = 'center';

        // Create close button
        const closeBtn = document.createElement('button');
        closeBtn.innerHTML = '<i class="fas fa-times"></i> Cerrar Visor';
        closeBtn.style.position = 'absolute';
        closeBtn.style.top = '15px';
        closeBtn.style.right = '15px';
        closeBtn.style.padding = '8px 16px';
        closeBtn.style.backgroundColor = '#e11d48';
        closeBtn.style.color = '#fff';
        closeBtn.style.border = 'none';
        closeBtn.style.borderRadius = '6px';
        closeBtn.style.cursor = 'pointer';
        closeBtn.style.fontWeight = 'bold';
        closeBtn.style.zIndex = '10000';
        closeBtn.onclick = () => modal.remove();

        // Create warning text if it doesn't load
        const warningText = document.createElement('div');
        warningText.style.position = 'absolute';
        warningText.style.color = 'white';
        warningText.style.top = '70px';
        warningText.style.fontSize = '12px';
        warningText.style.textAlign = 'center';
        warningText.style.maxWidth = '90%';
        warningText.innerHTML = 'Si la pantalla aparece gris o pide iniciar sesión, <a href="' + url + '" target="_blank" style="color: #60a5fa; text-decoration: underline;">haz clic aquí para abrirlo externamente</a> (asegúrate de darle permiso de Lector a la carpeta en Drive).';
        
        // Create iframe
        const iframe = document.createElement('iframe');
        iframe.src = previewUrl;
        iframe.style.width = '95%';
        iframe.style.height = '80%';
        iframe.style.border = 'none';
        iframe.style.borderRadius = '8px';
        iframe.style.backgroundColor = '#fff';
        iframe.style.marginTop = '60px';

        modal.appendChild(closeBtn);
        modal.appendChild(warningText);
        modal.appendChild(iframe);
        document.body.appendChild(modal);
    }
};
