// =============================================
// MFit Personal - Student Dashboard
// =============================================

const Student = {
  // Render Dashboard
  renderDashboard(profile, workouts) {
    return `
      <div class="page-header">
        <div>
          <h2>Olá, ${profile.full_name.split(' ')[0]} 👋</h2>
          <div class="subtitle">Seus treinos do dia</div>
        </div>
      </div>

      <!-- Quick Stats -->
      <div class="stats-bar">
        <div class="stat-card">
          <div class="stat-value">${workouts.length}</div>
          <div class="stat-label">Treinos</div>
        </div>
        <div class="stat-card">
          <div class="stat-value" id="total-exercises">
            ${workouts.reduce((sum, w) => sum + (w.exercises?.length || 0), 0)}
          </div>
          <div class="stat-label">Exercícios</div>
        </div>
        <div class="stat-card">
          <div class="stat-value" id="completed-count">-</div>
          <div class="stat-label">Finalizados</div>
        </div>
      </div>

      <!-- Workouts -->
      <div class="section-title">
        <span>Meus Treinos</span>
      </div>

      <div id="student-workouts-list">
        ${workouts.length === 0 ? `
          <div class="empty-state">
            <div class="empty-icon">🏋️</div>
            <h3>Nenhum treino atribuído</h3>
            <p>Peça ao seu Personal para criar treinos para você</p>
          </div>
        ` : workouts.map((w, i) => this.renderWorkoutCard(w, i)).join('')}
      </div>
    `;
  },

  // Render Workout Card (Student)
  renderWorkoutCard(workout, index) {
    const letters = ['a', 'b', 'c', 'd'];
    const letter = letters[index % letters.length];
    const exerciseCount = workout.exercises ? workout.exercises.length : 0;

    return `
      <div class="workout-card workout-${letter}" data-workout-id="${workout.id}">
        <div class="workout-header">
          <div class="workout-title">${workout.title}</div>
          <span class="workout-badge badge-${letter}">${letter.toUpperCase()}</span>
        </div>
        ${workout.description ? `<div class="workout-desc">${workout.description}</div>` : ''}
        <div class="workout-meta">
          <span>💪 ${exerciseCount} exercícios</span>
        </div>
      </div>
    `;
  },

  // Active timer reference
  _restTimer: null,
  _restInterval: null,

  // Render Workout Detail (Interactive)
  renderWorkoutDetail(workout, exercises) {
    return `
      <button class="back-btn" id="back-to-student-dashboard">← Voltar</button>

      <div class="page-header">
        <div>
          <h2>${workout.title}</h2>
          ${workout.description ? `<div class="subtitle">${workout.description}</div>` : ''}
        </div>
      </div>

      <!-- Rest Timer Overlay -->
      <div class="rest-timer-overlay hidden" id="rest-timer-overlay">
        <div class="rest-timer-content">
          <div class="rest-timer-label">⏱️ Descanso</div>
          <div class="rest-timer-display" id="rest-timer-display">00:00</div>
          <div class="rest-timer-bar-container">
            <div class="rest-timer-bar" id="rest-timer-bar"></div>
          </div>
          <button class="btn btn-secondary" id="skip-rest-btn">Pular Descanso</button>
        </div>
      </div>

      <div class="section-title">
        <span>Exercícios (${exercises.length})</span>
        <span class="progress-label" id="workout-progress">0/${exercises.reduce((sum, ex) => sum + ex.sets, 0)} séries</span>
      </div>

      <div class="exercise-list-interactive">
        ${exercises.map((ex, exIdx) => `
          <div class="exercise-block" data-exercise-idx="${exIdx}">
            <div class="exercise-block-header">
              <div class="exercise-number">${exIdx + 1}</div>
              <div class="exercise-block-info">
                <div class="exercise-name">${ex.name}</div>
                <div class="exercise-meta">
                  <span class="tag">${ex.sets}x${ex.reps}</span>
                  <span class="tag">⏱️ ${ex.rest}</span>
                </div>
                ${ex.notes ? `<div class="exercise-notes">${ex.notes}</div>` : ''}
              </div>
            </div>

            <div class="sets-grid">
              <div class="sets-header">
                <span>Série</span>
                <span>Peso (kg)</span>
                <span>Reps</span>
                <span></span>
              </div>
              ${Array.from({length: ex.sets}, (_, setIdx) => `
                <div class="set-row" data-exercise="${exIdx}" data-set="${setIdx}" data-rest="${ex.rest}">
                  <span class="set-number">${setIdx + 1}</span>
                  <input type="number" class="set-weight-input" placeholder="-" step="0.5" min="0" inputmode="decimal">
                  <input type="number" class="set-reps-input" value="${ex.reps}" min="1" inputmode="numeric">
                  <button class="set-check-btn" title="Marcar série como concluída">
                    <span class="check-icon">○</span>
                  </button>
                </div>
              `).join('')}
            </div>
          </div>
        `).join('')}
      </div>

      <button class="btn btn-primary btn-block mt-2" id="finish-workout-btn" data-workout-id="${workout.id}">
        ✅ Finalizar Treino
      </button>
    `;
  },

  // Parse rest time string like "60s" or "45s" to seconds
  parseRestTime(restStr) {
    const match = restStr.match(/(\d+)/);
    return match ? parseInt(match[1]) : 60;
  },

  // Start rest timer countdown
  startRestTimer(seconds) {
    const overlay = document.getElementById('rest-timer-overlay');
    const display = document.getElementById('rest-timer-display');
    const bar = document.getElementById('rest-timer-bar');
    if (!overlay || !display || !bar) return;

    // Clear any existing timer
    this.stopRestTimer();

    let remaining = seconds;
    const total = seconds;

    overlay.classList.remove('hidden');
    bar.style.width = '100%';

    const updateDisplay = () => {
      const mins = Math.floor(remaining / 60);
      const secs = remaining % 60;
      display.textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
      bar.style.width = `${(remaining / total) * 100}%`;

      if (remaining <= 5) {
        display.classList.add('timer-ending');
      } else {
        display.classList.remove('timer-ending');
      }
    };

    updateDisplay();

    this._restInterval = setInterval(() => {
      remaining--;
      updateDisplay();

      if (remaining <= 0) {
        this.stopRestTimer();
        // Play a beep sound
        this.playBeep();
        App.showToast('⏰ Descanso finalizado! Próxima série!', 'info');
      }
    }, 1000);
  },

  // Stop rest timer
  stopRestTimer() {
    if (this._restInterval) {
      clearInterval(this._restInterval);
      this._restInterval = null;
    }
    const overlay = document.getElementById('rest-timer-overlay');
    const display = document.getElementById('rest-timer-display');
    if (overlay) overlay.classList.add('hidden');
    if (display) display.classList.remove('timer-ending');
  },

  // Play beep sound
  playBeep() {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = 880;
      osc.type = 'sine';
      gain.gain.value = 0.3;
      osc.start();
      setTimeout(() => { osc.stop(); ctx.close(); }, 300);
      // Second beep
      setTimeout(() => {
        const ctx2 = new (window.AudioContext || window.webkitAudioContext)();
        const osc2 = ctx2.createOscillator();
        const gain2 = ctx2.createGain();
        osc2.connect(gain2);
        gain2.connect(ctx2.destination);
        osc2.frequency.value = 1100;
        osc2.type = 'sine';
        gain2.gain.value = 0.3;
        osc2.start();
        setTimeout(() => { osc2.stop(); ctx2.close(); }, 300);
      }, 400);
    } catch (e) { /* audio not supported */ }
  },

  // Update progress counter
  updateProgress() {
    const completedSets = document.querySelectorAll('.set-row.completed').length;
    const totalSets = document.querySelectorAll('.set-row').length;
    const progressEl = document.getElementById('workout-progress');
    if (progressEl) progressEl.textContent = `${completedSets}/${totalSets} séries`;
  },

  // Render Workouts Page (History)
  renderWorkoutsPage(workouts, logs) {
    return `
      <div class="page-header">
        <div>
          <h2>Treinos</h2>
          <div class="subtitle">Seus treinos e histórico</div>
        </div>
      </div>

      <!-- Tab Switcher -->
      <div class="tab-switcher">
        <button class="tab-btn active" data-tab="workouts-tab">Meus Treinos</button>
        <button class="tab-btn" data-tab="history-tab">Histórico</button>
      </div>

      <!-- Workouts Tab -->
      <div id="workouts-tab">
        ${workouts.length === 0 ? `
          <div class="empty-state">
            <div class="empty-icon">📋</div>
            <h3>Sem treinos</h3>
            <p>Seu Personal ainda não criou treinos para você</p>
          </div>
        ` : workouts.map((w, i) => this.renderWorkoutCard(w, i)).join('')}
      </div>

      <!-- History Tab -->
      <div id="history-tab" class="hidden">
        ${logs.length === 0 ? `
          <div class="empty-state">
            <div class="empty-icon">📊</div>
            <h3>Nenhum registro</h3>
            <p>Finalize treinos para ver seu histórico aqui</p>
          </div>
        ` : logs.map(log => `
          <div class="log-item">
            <div class="log-icon">✅</div>
            <div class="log-details">
              <div class="log-title">${log.workouts ? log.workouts.title : 'Treino'}</div>
              <div class="log-date">${new Date(log.completed_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  },

  // Bind Dashboard Events
  bindDashboardEvents() {
    // Workout cards click
    document.querySelectorAll('.workout-card').forEach(card => {
      card.addEventListener('click', async () => {
        const workoutId = card.dataset.workoutId;
        await this.showWorkoutDetail(workoutId);
      });
    });

    // Load completed count
    this.loadCompletedCount();
  },

  // Bind Workouts Page Events
  bindWorkoutsEvents() {
    // Tab switcher
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        const tabId = btn.dataset.tab;
        document.getElementById('workouts-tab')?.classList.toggle('hidden', tabId !== 'workouts-tab');
        document.getElementById('history-tab')?.classList.toggle('hidden', tabId !== 'history-tab');
      });
    });

    // Workout cards click
    document.querySelectorAll('.workout-card').forEach(card => {
      card.addEventListener('click', async () => {
        const workoutId = card.dataset.workoutId;
        await this.showWorkoutDetail(workoutId);
      });
    });
  },

  // Show Workout Detail
  async showWorkoutDetail(workoutId) {
    const app = document.getElementById('app');
    app.innerHTML = '<div class="text-center mt-3"><div class="loading-spinner" style="margin:0 auto;"></div></div>';

    try {
      const [workoutData, exercises] = await Promise.all([
        db.from('workouts').select('*').eq('id', workoutId).single().then(r => {
          if (r.error) throw r.error;
          return r.data;
        }),
        getExercises(workoutId)
      ]);

      app.innerHTML = this.renderWorkoutDetail(workoutData, exercises);

      // Back button
      document.getElementById('back-to-student-dashboard')?.addEventListener('click', () => {
        this.stopRestTimer();
        App.navigate('dashboard');
      });

      // Skip rest button
      document.getElementById('skip-rest-btn')?.addEventListener('click', () => {
        this.stopRestTimer();
      });

      // Set check buttons — mark set as completed + start rest timer
      document.querySelectorAll('.set-check-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const row = btn.closest('.set-row');
          if (!row || row.classList.contains('completed')) return;

          // Mark as completed
          row.classList.add('completed');
          btn.querySelector('.check-icon').textContent = '✅';
          btn.disabled = true;

          // Update progress
          this.updateProgress();

          // Start rest timer
          const restStr = row.dataset.rest || '60s';
          const restSeconds = this.parseRestTime(restStr);
          this.startRestTimer(restSeconds);
        });
      });

      // Finish workout button
      document.getElementById('finish-workout-btn')?.addEventListener('click', async (e) => {
        const btn = e.currentTarget;
        btn.disabled = true;
        btn.textContent = 'Registrando...';

        try {
          this.stopRestTimer();

          // 1. Create the log entry
          const log = await logWorkout(App.state.profile.id, workoutId);

          // 2. Collect and save set data per exercise
          const setsByExercise = {};
          document.querySelectorAll('.set-row').forEach(row => {
            const exIdx = parseInt(row.dataset.exercise);
            const setIdx = parseInt(row.dataset.set);
            const weight = parseFloat(row.querySelector('.set-weight-input')?.value) || null;
            const reps = parseInt(row.querySelector('.set-reps-input')?.value) || null;
            const completed = row.classList.contains('completed');

            if (!setsByExercise[exIdx]) setsByExercise[exIdx] = [];
            setsByExercise[exIdx].push({
              set_number: setIdx + 1,
              weight,
              reps,
              completed
            });
          });

          // 3. Save set_logs for each exercise
          const savePromises = Object.entries(setsByExercise).map(([exIdx, sets]) => {
            const exerciseId = exercises[parseInt(exIdx)]?.id;
            if (!exerciseId) return Promise.resolve();
            return saveSetLogs(log.id, exerciseId, sets);
          });
          await Promise.all(savePromises);

          App.showToast('Treino finalizado! 💪🔥', 'success');
          btn.textContent = '✅ Treino Finalizado!';
          btn.style.background = 'var(--bg-card)';
          btn.style.color = 'var(--accent)';
          btn.style.boxShadow = 'none';
        } catch (err) {
          App.showToast('Erro ao registrar: ' + err.message, 'error');
          btn.disabled = false;
          btn.textContent = '✅ Finalizar Treino';
        }
      });
    } catch (err) {
      app.innerHTML = `<div class="empty-state"><div class="empty-icon">⚠️</div><h3>Erro ao carregar</h3><p>${err.message}</p></div>`;
    }
  },

  // Load completed count
  async loadCompletedCount() {
    try {
      const logs = await getStudentLogs(App.state.profile.id);
      const countEl = document.getElementById('completed-count');
      if (countEl) countEl.textContent = logs.length;
    } catch (err) {
      console.warn('Erro ao carregar contagem:', err);
    }
  }
};
