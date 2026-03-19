// =============================================
// FitJR - Personal Trainer Dashboard
// =============================================

const Personal = {
  // Render Dashboard
  renderDashboard(profile, students, workouts) {
    const totalStudents = students.length;
    const totalWorkouts = workouts.length;
    const todayLogs = 0; // Will be fetched separately

    return `
      <div class="page-header">
        <div>
          <h2>Olá, ${profile.full_name.split(' ')[0]} 👋</h2>
          <div class="subtitle">Painel do Personal</div>
        </div>
      </div>

      <!-- Stats -->
      <div class="stats-bar">
        <div class="stat-card">
          <div class="stat-value">${totalStudents}</div>
          <div class="stat-label">Alunos</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${totalWorkouts}</div>
          <div class="stat-label">Treinos</div>
        </div>
        <div class="stat-card">
          <div class="stat-value" id="today-logs-count">-</div>
          <div class="stat-label">Hoje</div>
        </div>
      </div>

      <!-- Invite Code -->
      <div class="invite-code">
        <div class="code-label">Seu código de personal</div>
        <div class="code" id="personal-code">${profile.id.substring(0, 8).toUpperCase()}</div>
        <button class="btn btn-ghost btn-sm mt-1" id="copy-code-btn" data-code="${profile.id}">
          📋 Copiar código completo
        </button>
      </div>

      <!-- Students Section -->
      <div class="section-title mt-2">
        <span>Meus Alunos (${totalStudents})</span>
        <button class="btn btn-ghost btn-sm" id="add-student-btn">+ Convidar</button>
      </div>

      <div id="students-list">
        ${totalStudents === 0 ? `
          <div class="empty-state">
            <div class="empty-icon">👥</div>
            <h3>Nenhum aluno ainda</h3>
            <p>Compartilhe seu código para que alunos se vinculem a você</p>
          </div>
        ` : students.map(s => this.renderStudentCard(s)).join('')}
      </div>
    `;
  },

  // Render Student Card
  renderStudentCard(student) {
    const initials = student.full_name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
    return `
      <div class="student-card" data-student-id="${student.id}" data-student-name="${student.full_name}">
        <div class="student-avatar">${initials}</div>
        <div class="student-info">
          <div class="name">${student.full_name}</div>
          <div class="meta">Aluno ativo</div>
        </div>
        <div class="arrow">→</div>
      </div>
    `;
  },

  // Render Workouts Page (Personal View)
  renderWorkouts(workouts, students) {
    return `
      <div class="page-header">
        <div>
          <h2>Treinos</h2>
          <div class="subtitle">Gerencie os treinos dos seus alunos</div>
        </div>
        <button class="btn btn-primary btn-sm" id="create-workout-btn">+ Novo</button>
      </div>

      <div id="workouts-list">
        ${workouts.length === 0 ? `
          <div class="empty-state">
            <div class="empty-icon">🏋️</div>
            <h3>Nenhum treino criado</h3>
            <p>Crie treinos e atribua aos seus alunos</p>
            <button class="btn btn-primary mt-2" id="create-workout-btn-empty">+ Criar Treino</button>
          </div>
        ` : workouts.map((w, i) => this.renderWorkoutCard(w, i)).join('')}
      </div>
    `;
  },

  // Render Workout Card
  renderWorkoutCard(workout, index) {
    const letters = ['a', 'b', 'c', 'd'];
    const letter = letters[index % letters.length];
    const exerciseCount = workout.exercises ? workout.exercises.length : 0;
    const studentName = workout.profiles ? workout.profiles.full_name : 'Sem aluno';

    return `
      <div class="workout-card workout-${letter}" data-workout-id="${workout.id}">
        <div class="workout-header">
          <div class="workout-title">${workout.title}</div>
          <span class="workout-badge badge-${letter}">Treino ${letter.toUpperCase()}</span>
        </div>
        ${workout.description ? `<div class="workout-desc">${workout.description}</div>` : ''}
        <div class="workout-meta">
          <span>👤 ${studentName}</span>
          <span>💪 ${exerciseCount} exercícios</span>
        </div>
      </div>
    `;
  },

  // Render Create Workout Form (Modal)
  renderCreateWorkoutForm(students) {
    return `
      <div class="modal-handle"></div>
      <h3 class="modal-title">Criar Novo Treino</h3>

      <form id="create-workout-form">
        <div class="form-group">
          <label for="workout-student">Aluno</label>
          <select id="workout-student" required>
            <option value="">Selecione o aluno...</option>
            ${students.map(s => `<option value="${s.id}">${s.full_name}</option>`).join('')}
          </select>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label for="workout-title">Título</label>
            <input type="text" id="workout-title" placeholder="Ex: Treino A - Peito" required>
          </div>
          <div class="form-group">
            <label for="workout-desc">Descrição</label>
            <input type="text" id="workout-desc" placeholder="Opcional">
          </div>
        </div>

        <div class="form-section">
          <div class="form-section-title">
            <span>💪 Exercícios</span>
          </div>
          <div id="exercises-container"></div>
          <button type="button" class="btn btn-secondary btn-block btn-sm mt-1" id="add-exercise-btn">
            + Adicionar Exercício
          </button>
        </div>

        <div class="flex gap-1 mt-2">
          <button type="button" class="btn btn-secondary" id="cancel-workout-btn" style="flex:1">Cancelar</button>
          <button type="submit" class="btn btn-primary" style="flex:2">Salvar Treino</button>
        </div>
      </form>
    `;
  },

  // Render Exercise Form Card
  renderExerciseFormCard(index) {
    return `
      <div class="exercise-form-card" data-exercise-index="${index}">
        <div class="exercise-form-header">
          <span class="exercise-form-title">Exercício ${index + 1}</span>
          <button type="button" class="btn btn-icon btn-ghost" onclick="Personal.removeExercise(${index})" title="Remover">✕</button>
        </div>
        <div class="form-group">
          <input type="text" name="ex-name-${index}" placeholder="Nome do exercício" required>
        </div>
        <div class="form-row-3">
          <div class="form-group">
            <label>Séries</label>
            <input type="number" name="ex-sets-${index}" placeholder="3" min="1" value="3">
          </div>
          <div class="form-group">
            <label>Repetições</label>
            <input type="text" name="ex-reps-${index}" placeholder="12" value="12">
          </div>
          <div class="form-group">
            <label>Descanso</label>
            <input type="text" name="ex-rest-${index}" placeholder="60s" value="60s">
          </div>
        </div>
        <div class="form-group">
          <input type="text" name="ex-notes-${index}" placeholder="Observações (opcional)">
        </div>
      </div>
    `;
  },

  exerciseCount: 0,

  // Add Exercise to Form
  addExercise() {
    const container = document.getElementById('exercises-container');
    if (!container) return;
    container.insertAdjacentHTML('beforeend', this.renderExerciseFormCard(this.exerciseCount));
    this.exerciseCount++;
  },

  // Remove Exercise from Form
  removeExercise(index) {
    const card = document.querySelector(`[data-exercise-index="${index}"]`);
    if (card) {
      card.style.animation = 'none';
      card.style.opacity = '0';
      card.style.transform = 'translateX(100%)';
      card.style.transition = '0.25s ease';
      setTimeout(() => card.remove(), 250);
    }
  },

  // Render Student Detail (workouts per student)
  renderStudentDetail(student, workouts, logs) {
    return `
      <button class="back-btn" id="back-to-dashboard">← Voltar</button>

      <div class="page-header">
        <div>
          <h2>${student.full_name}</h2>
          <div class="subtitle">${workouts.length} treinos atribuídos</div>
        </div>
        <button class="btn btn-primary btn-sm" id="create-workout-for-student-btn" data-student-id="${student.id}">+ Treino</button>
      </div>

      <!-- Treinos deste aluno -->
      <div class="section-title">
        <span>Treinos</span>
      </div>
      ${workouts.length === 0 ? `
        <div class="empty-state">
          <div class="empty-icon">📋</div>
          <h3>Nenhum treino</h3>
          <p>Crie um treino para este aluno</p>
        </div>
      ` : workouts.map((w, i) => `
        <div class="workout-card workout-${['a','b','c','d'][i % 4]}" data-workout-id="${w.id}">
          <div class="workout-header">
            <div class="workout-title">${w.title}</div>
            <button class="btn btn-ghost btn-sm delete-workout-btn" data-workout-id="${w.id}" title="Excluir">🗑️</button>
          </div>
          ${w.description ? `<div class="workout-desc">${w.description}</div>` : ''}
          <div class="workout-meta">
            <span>💪 ${w.exercises ? w.exercises.length : 0} exercícios</span>
          </div>
        </div>
      `).join('')}

      <!-- Histórico -->
      <div class="section-title mt-2">
        <span>Histórico Recente</span>
      </div>
      ${logs.length === 0 ? `
        <p class="text-muted" style="font-size:0.85rem;">Nenhum treino finalizado ainda.</p>
      ` : logs.slice(0, 10).map(log => `
        <div class="log-item">
          <div class="log-icon">✅</div>
          <div class="log-details">
            <div class="log-title">${log.workouts ? log.workouts.title : 'Treino'}</div>
            <div class="log-date">${new Date(log.completed_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
          </div>
        </div>
      `).join('')}
    `;
  },

  // Bind Dashboard Events
  bindDashboardEvents(profile) {
    // Copy code button
    document.getElementById('copy-code-btn')?.addEventListener('click', (e) => {
      const code = e.currentTarget.dataset.code;
      navigator.clipboard.writeText(code).then(() => {
        App.showToast('Código copiado!', 'success');
      }).catch(() => {
        // Fallback
        const textarea = document.createElement('textarea');
        textarea.value = code;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        App.showToast('Código copiado!', 'success');
      });
    });

    // Student cards click
    document.querySelectorAll('.student-card').forEach(card => {
      card.addEventListener('click', async () => {
        const studentId = card.dataset.studentId;
        const studentName = card.dataset.studentName;
        await Personal.showStudentDetail({ id: studentId, full_name: studentName }, profile.id);
      });
    });
  },

  // Bind Workouts Page Events
  bindWorkoutsEvents(students) {
    const createBtn = document.getElementById('create-workout-btn') || document.getElementById('create-workout-btn-empty');
    if (createBtn) {
      createBtn.addEventListener('click', () => {
        this.openCreateWorkoutModal(students);
      });
    }

    // Workout card clicks
    document.querySelectorAll('.workout-card').forEach(card => {
      card.addEventListener('click', async () => {
        const workoutId = card.dataset.workoutId;
        await this.showWorkoutExercises(workoutId);
      });
    });
  },

  // Open Create Workout Modal
  openCreateWorkoutModal(students, preselectedStudentId = null) {
    this.exerciseCount = 0;
    App.openModal(this.renderCreateWorkoutForm(students));

    // Pre-select student if provided
    if (preselectedStudentId) {
      const select = document.getElementById('workout-student');
      if (select) select.value = preselectedStudentId;
    }

    // Add first exercise by default
    this.addExercise();

    // Add exercise button
    document.getElementById('add-exercise-btn')?.addEventListener('click', () => {
      this.addExercise();
    });

    // Cancel button
    document.getElementById('cancel-workout-btn')?.addEventListener('click', () => {
      App.closeModal();
    });

    // Form submit
    document.getElementById('create-workout-form')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      await this.handleCreateWorkout();
    });
  },

  // Handle Create Workout Submit
  async handleCreateWorkout() {
    const studentId = document.getElementById('workout-student').value;
    const title = document.getElementById('workout-title').value.trim();
    const description = document.getElementById('workout-desc').value.trim();

    if (!studentId || !title) {
      App.showToast('Preencha aluno e título', 'error');
      return;
    }

    // Collect exercises
    const exerciseCards = document.querySelectorAll('.exercise-form-card');
    const exercisesList = [];

    exerciseCards.forEach(card => {
      const idx = card.dataset.exerciseIndex;
      const name = card.querySelector(`[name="ex-name-${idx}"]`)?.value.trim();
      if (name) {
        exercisesList.push({
          name,
          sets: card.querySelector(`[name="ex-sets-${idx}"]`)?.value || '3',
          reps: card.querySelector(`[name="ex-reps-${idx}"]`)?.value || '12',
          rest: card.querySelector(`[name="ex-rest-${idx}"]`)?.value || '60s',
          notes: card.querySelector(`[name="ex-notes-${idx}"]`)?.value || ''
        });
      }
    });

    if (exercisesList.length === 0) {
      App.showToast('Adicione pelo menos 1 exercício', 'error');
      return;
    }

    try {
      const workout = await createWorkout(App.state.profile.id, studentId, title, description);
      await addExercises(workout.id, exercisesList);
      App.showToast('Treino criado com sucesso!', 'success');
      App.closeModal();
      App.navigate(App.state.currentRoute);
    } catch (err) {
      App.showToast('Erro ao criar treino: ' + err.message, 'error');
    }
  },

  // Show Student Detail
  async showStudentDetail(student, personalId) {
    const app = document.getElementById('app');
    app.innerHTML = '<div class="text-center mt-3"><div class="loading-spinner" style="margin:0 auto;"></div></div>';

    try {
      const [workouts, logs] = await Promise.all([
        getWorkoutsByStudent(student.id),
        db.from('logs').select('*, workouts(title)').eq('student_id', student.id).order('completed_at', { ascending: false }).limit(10).then(r => r.data || [])
      ]);

      app.innerHTML = this.renderStudentDetail(student, workouts, logs);

      // Back button
      document.getElementById('back-to-dashboard')?.addEventListener('click', () => {
        App.navigate('dashboard');
      });

      // Create workout for this student
      document.getElementById('create-workout-for-student-btn')?.addEventListener('click', async () => {
        const students = await getStudents(personalId);
        this.openCreateWorkoutModal(students, student.id);
      });

      // Delete workout buttons
      document.querySelectorAll('.delete-workout-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
          e.stopPropagation();
          const workoutId = btn.dataset.workoutId;
          if (confirm('Tem certeza que deseja excluir este treino?')) {
            try {
              await deleteWorkout(workoutId);
              App.showToast('Treino excluído', 'success');
              await this.showStudentDetail(student, personalId);
            } catch (err) {
              App.showToast('Erro ao excluir: ' + err.message, 'error');
            }
          }
        });
      });
    } catch (err) {
      app.innerHTML = `<div class="empty-state"><div class="empty-icon">⚠️</div><h3>Erro ao carregar</h3><p>${err.message}</p></div>`;
    }
  },

  // Show Workout Exercises (Modal)
  async showWorkoutExercises(workoutId) {
    try {
      const exercises = await getExercises(workoutId);
      const html = `
        <div class="modal-handle"></div>
        <h3 class="modal-title">Exercícios</h3>
        <ul class="exercise-list">
          ${exercises.map((ex, i) => `
            <li class="exercise-item">
              <div class="exercise-number">${i + 1}</div>
              <div class="exercise-details">
                <div class="exercise-name">${ex.name}</div>
                <div class="exercise-info">
                  <span class="tag">${ex.sets}x${ex.reps}</span>
                  <span class="tag">⏱️ ${ex.rest}</span>
                </div>
                ${ex.notes ? `<div class="exercise-notes">${ex.notes}</div>` : ''}
              </div>
            </li>
          `).join('')}
        </ul>
        <button class="btn btn-secondary btn-block mt-2" id="close-exercises-modal">Fechar</button>
      `;
      App.openModal(html);
      document.getElementById('close-exercises-modal')?.addEventListener('click', () => App.closeModal());
    } catch (err) {
      App.showToast('Erro ao carregar exercícios', 'error');
    }
  }
};
