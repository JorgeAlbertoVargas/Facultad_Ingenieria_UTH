/**
 * Módulo del Juez (Dashboard y Evaluación)
 */
const Judge = {
    async loadDashboard() {
        const content = document.getElementById('content-area');
        content.innerHTML = `
            <div class="page-header">
                <h1>Mis Proyectos Asignados</h1>
                <p style="color:var(--text-muted); margin-top:5px;">Seleccione un proyecto para evaluar.</p>
            </div>
            <div id="projects-grid" class="projects-grid"></div>
        `;

        UI.showLoader('projects-grid');

        try {
            console.log("Solicitando proyectos para la terna:", Auth.user.terna);
            const response = await API.get('getProjects', { 
                terna: Auth.user.terna || '',
                email: Auth.user.email
            });
            console.log("Respuesta de getProjects:", response);
            if (response.success) {
                this.renderProjects(response.projects);
            } else {
                document.getElementById('projects-grid').innerHTML = `<p class="error-msg">${response.error}</p>`;
            }
        } catch (err) {
            document.getElementById('projects-grid').innerHTML = `<p class="error-msg">${err.message}</p>`;
        }
    },

    renderProjects(projects) {
        const grid = document.getElementById('projects-grid');
        grid.innerHTML = '';

        if (projects.length === 0) {
            grid.innerHTML = '<p>No hay proyectos asignados.</p>';
            return;
        }

        projects.forEach(p => {
            const isEvaluated = p.evaluado; // Dependerá de la lógica real en Google Sheets si devolvemos esto
            
            // Generación dinámica del QR
            const qrData = encodeURIComponent(`Código: ${p['ID_Proyecto']} | Proyecto: ${p['Nombre_Corto_Proyecto']} | Categoría: ${p['Categoria_Ingresada']}`);
            const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=90x90&data=${qrData}&color=007A33`;
            
            const card = document.createElement('div');
            card.className = `card ${isEvaluated ? 'evaluated' : ''}`;
            card.style.position = 'relative';
            
            card.innerHTML = `
                <div style="position: absolute; top: 20px; right: 20px; display: flex; align-items: flex-start; gap: 15px; text-align: center;">
                    ${p['Articulo_Cientifico'] ? `
                    <div style="display: flex; flex-direction: column; align-items: center; gap: 4px;">
                        <a href="#" onclick="event.preventDefault(); UI.showPdfViewer('${p['Articulo_Cientifico']}');" title="Ver Artículo Científico" style="display: flex; align-items: center; justify-content: center; width: 45px; height: 45px; background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 6px; color: #e11d48; text-decoration: none; transition: background 0.2s;" onmouseover="this.style.background='#f1f5f9'" onmouseout="this.style.background='#f8fafc'">
                            <i class="fas fa-file-pdf fa-lg"></i>
                        </a>
                        <span style="font-size: 10px; color: var(--text-muted); font-weight: bold; text-transform: uppercase; line-height: 1;">Artículo</span>
                    </div>
                    ` : ''}
                    <div>
                        <img src="${qrUrl}" alt="QR Code" style="border-radius: 4px; border: 1px solid #eee; padding: 2px; background: white; margin-bottom: 5px;">
                        ${isEvaluated && p.nota_obtenida && p.nota_obtenida.toString().trim() !== '' ? `<div style="font-size: 11px; font-weight: bold; color: var(--text-muted); text-transform: uppercase;">Calificación:</div><div style="font-size: 24px; font-weight: bold; color: var(--primary);">${p.nota_obtenida}%</div>` : ''}
                    </div>
                </div>
                <div class="card-header" style="padding-right: 190px;">
                    <span class="card-code">${p['ID_Proyecto']}</span>
                    ${isEvaluated ? '<span class="tag" style="background:var(--success); color:white;"><i class="fas fa-check"></i> Ya evaluado</span>' : ''}
                </div>
                <h3 class="card-title" style="margin-right: 190px;">${p['Nombre_Corto_Proyecto']}</h3>
                <div class="card-body">
                    <p><strong>Carrera:</strong> ${p['Carrera']}</p>
                    <p><strong>Campus:</strong> ${p['Campus']}</p>
                    <p><strong>Categoría:</strong> ${p['Categoria_Ingresada']}</p>
                    <p><strong>Profesor:</strong> ${p['Catedratico']}</p>
                </div>
                <button class="btn btn-primary btn-large" ${isEvaluated ? 'disabled' : ''} onclick="Judge.openEvaluation('${p['ID_Proyecto']}', '${p['Categoria_Ingresada']}', '${p['Articulo_Cientifico'] || ''}')">
                    ${isEvaluated ? '<i class="fas fa-lock"></i> Proyecto Evaluado' : '<i class="fas fa-edit"></i> Evaluar'}
                </button>
            `;
            grid.appendChild(card);
        });
    },

    async openEvaluation(codigo, categoria, linkArticulo) {
        UI.showToast(`Abriendo evaluación para ${codigo}`, 'info');
        
        const content = document.getElementById('content-area');
        content.innerHTML = `<div style="text-align:center; padding:50px;"><i class="fas fa-spinner fa-spin fa-2x"></i><p>Cargando instrumento de evaluación...</p></div>`;

        try {
            const response = await API.get('getQuestions', { categoria: categoria });
            if (!response.success) {
                content.innerHTML = `
                    <div class="page-header"><button class="btn btn-text" onclick="Judge.loadDashboard()"><i class="fas fa-arrow-left"></i> Volver</button></div>
                    <div class="card" style="color:var(--danger);">${response.error}</div>
                `;
                return;
            }

            const questions = response.questions || [];
            
            // Agrupar por bloque
            const blocks = {};
            questions.forEach((q, idx) => {
                if (!blocks[q.bloque]) blocks[q.bloque] = [];
                // Añadimos un index único
                q.globalIndex = idx;
                blocks[q.bloque].push(q);
            });

            // Botón del artículo
            let btnArticuloHtml = '';
            if (linkArticulo && linkArticulo.trim() !== '') {
                btnArticuloHtml = `
                    <a href="#" onclick="event.preventDefault(); UI.showPdfViewer('${linkArticulo}');" class="btn" style="background-color: #f1f5f9; color: #334155; border: 1px solid #cbd5e1; text-decoration: none; display: inline-flex; align-items: center; gap: 8px; margin-top: 10px;">
                        <i class="fas fa-file-pdf" style="color: #e11d48;"></i> Ver Artículo Científico
                    </a>
                `;
            }

            let html = `
                <div class="page-header" style="margin-bottom: 20px;">
                    <button class="btn btn-text" onclick="Judge.loadDashboard()" style="margin-bottom:15px; padding-left:0;">
                        <i class="fas fa-arrow-left"></i> Volver al Dashboard
                    </button>
                    <h1>Evaluación: ${codigo}</h1>
                    <p style="color:var(--text-muted); margin-top:5px; font-weight: 500;">Categoría: ${categoria}</p>
                    ${btnArticuloHtml}
                </div>
                <form id="eval-form" style="padding-bottom: 80px;">
            `;

            for (const [blockName, blockQs] of Object.entries(blocks)) {
                html += `<h2 style="margin: 30px 0 15px 0; color: var(--primary); border-bottom: 2px solid var(--primary); padding-bottom:5px;">${blockName}</h2>`;
                
                blockQs.forEach(q => {
                    html += `
                        <div class="eval-question-card">
                            <div class="eval-question-header">
                                <strong>${q.numero}. ${q.titulo}</strong>
                                <span class="tag" style="background:#e2e8f0; color:#475569;">Valor: ${q.porcentaje}%</span>
                            </div>
                            <div class="eval-options" data-index="${q.globalIndex}" data-percent="${q.porcentaje}" data-max-pts="${q.puntos_A}">
                                <label class="eval-option">
                                    <input type="radio" name="q_${q.globalIndex}" value="${q.puntos_A}" required>
                                    <div>
                                        <div style="font-weight:bold; margin-bottom:4px;">${q.puntos_A} Puntos (Excelente)</div>
                                        <div style="font-size:13px; color:#475569;">${q.criterio_A}</div>
                                    </div>
                                </label>
                                <label class="eval-option">
                                    <input type="radio" name="q_${q.globalIndex}" value="${q.puntos_B}" required>
                                    <div>
                                        <div style="font-weight:bold; margin-bottom:4px;">${q.puntos_B} Puntos (Regular)</div>
                                        <div style="font-size:13px; color:#475569;">${q.criterio_B}</div>
                                    </div>
                                </label>
                                <label class="eval-option">
                                    <input type="radio" name="q_${q.globalIndex}" value="${q.puntos_C}" required>
                                    <div>
                                        <div style="font-weight:bold; margin-bottom:4px;">${q.puntos_C} Puntos (Deficiente)</div>
                                        <div style="font-size:13px; color:#475569;">${q.criterio_C}</div>
                                    </div>
                                </label>
                                <label class="eval-option">
                                    <input type="radio" name="q_${q.globalIndex}" value="custom" required>
                                    <div>
                                        <div style="font-weight:bold; margin-bottom:4px;">Personalizado (1-${q.puntos_A})</div>
                                        <div style="font-size:13px; color:#475569;">
                                            <input type="number" class="custom-score-input" min="1" max="${q.puntos_A}" step="1" style="width: 70px; padding: 5px; margin-top: 5px; border: 1px solid #cbd5e1; border-radius: 4px;" disabled placeholder="Nota">
                                        </div>
                                    </div>
                                </label>
                            </div>
                        </div>
                    `;
                });
            }

            html += `
                    <div class="card" style="margin-top: 30px;">
                        <h3 style="margin-bottom: 15px;">Observaciones Generales</h3>
                        <textarea id="eval-observaciones" style="width:100%; padding:15px; border-radius:var(--radius-sm); border:1px solid #cbd5e1" rows="4" placeholder="Escribe aquí cualquier comentario adicional sobre el proyecto..."></textarea>
                    </div>
                </form>
                
                <div class="sticky-score-panel">
                    <div>
                        <div style="font-size: 13px; color: #475569; text-transform: uppercase; font-weight: 600; letter-spacing: 0.5px;">Calificación Parcial</div>
                        <div class="score-display" id="running-score">0.00%</div>
                    </div>
                    <button type="submit" form="eval-form" class="btn btn-primary btn-large" id="btn-submit-eval">
                        <i class="fas fa-save"></i> Guardar Evaluación
                    </button>
                </div>
            `;

            content.innerHTML = html;

            const form = document.getElementById('eval-form');
            const scoreDisplay = document.getElementById('running-score');
            
            const calculateTotal = () => {
                let totalScore = 0;
                document.querySelectorAll('.eval-options').forEach(optGroup => {
                    const checked = optGroup.querySelector('input[type="radio"]:checked');
                    if (checked) {
                        const maxPts = parseFloat(optGroup.dataset.maxPts);
                        let val = 0;
                        if (checked.value === 'custom') {
                            const customInput = optGroup.querySelector('.custom-score-input');
                            val = parseInt(customInput.value) || 0;
                            // Limitar
                            if (val > maxPts) val = maxPts;
                            if (val < 0) val = 0;
                        } else {
                            val = parseInt(checked.value);
                        }
                        
                        const maxPercent = parseFloat(optGroup.dataset.percent);
                        const earnedPercent = (val / maxPts) * maxPercent;
                        totalScore += earnedPercent;
                    }
                });
                scoreDisplay.innerText = totalScore.toFixed(2) + '%';
            };

            form.addEventListener('input', (e) => {
                if (e.target.classList.contains('custom-score-input')) {
                    calculateTotal();
                }
            });

            form.addEventListener('change', (e) => {
                if (e.target.type === 'radio') {
                    const optionsContainer = e.target.closest('.eval-options');
                    optionsContainer.querySelectorAll('.eval-option').forEach(opt => opt.classList.remove('selected'));
                    e.target.closest('.eval-option').classList.add('selected');

                    const customInput = optionsContainer.querySelector('.custom-score-input');
                    if (e.target.value === 'custom') {
                        customInput.disabled = false;
                        customInput.focus();
                        customInput.required = true;
                    } else {
                        customInput.disabled = true;
                        customInput.value = '';
                        customInput.required = false;
                    }

                    calculateTotal();
                }
            });

            // Enviar formulario
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                
                // Recopilar respuestas y recalcular score por seguridad
                let totalScore = 0;
                let respuestas = [];
                let allAnswered = true;

                document.querySelectorAll('.eval-options').forEach(optGroup => {
                    const checked = optGroup.querySelector('input[type="radio"]:checked');
                    if (checked) {
                        const maxPts = parseFloat(optGroup.dataset.maxPts);
                        let val = 0;
                        if (checked.value === 'custom') {
                            const customInput = optGroup.querySelector('.custom-score-input');
                            val = parseInt(customInput.value);
                            if (isNaN(val) || val < 1 || val > maxPts) {
                                allAnswered = false;
                            }
                        } else {
                            val = parseInt(checked.value);
                        }

                        const maxPercent = parseFloat(optGroup.dataset.percent);
                        const earnedPercent = (val / maxPts) * maxPercent;
                        totalScore += earnedPercent;
                        
                        respuestas.push({
                            index: optGroup.dataset.index,
                            puntos: val,
                            porcentajeGanado: earnedPercent
                        });
                    } else {
                        allAnswered = false;
                    }
                });

                if (!allAnswered) {
                    UI.showToast("Por favor responde todas las preguntas.", "error");
                    return;
                }

                const btn = document.getElementById('btn-submit-eval');
                btn.disabled = true;
                btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Guardando...';

                try {
                    const postResponse = await API.post('saveEvaluation', {
                        codigoProyecto: codigo,
                        correoJuez: Auth.user.email,
                        categoria: categoria,
                        notaTotal: totalScore.toFixed(2),
                        respuestas: respuestas,
                        observaciones: document.getElementById('eval-observaciones').value
                    });
                    
                    if(postResponse.success) {
                        UI.showToast('Evaluación guardada con éxito', 'success');
                        this.loadDashboard();
                    } else {
                        UI.showToast(postResponse.error || 'Error al guardar', 'error');
                        btn.disabled = false;
                        btn.innerHTML = '<i class="fas fa-save"></i> Guardar Evaluación';
                    }
                } catch (err) {
                    UI.showToast('Error de conexión', 'error');
                    btn.disabled = false;
                    btn.innerHTML = '<i class="fas fa-save"></i> Guardar Evaluación';
                }
            });

        } catch (error) {
            content.innerHTML = `<div class="card" style="color:var(--danger);">Error cargando evaluación. ${error.message}</div>`;
        }
    }
};
