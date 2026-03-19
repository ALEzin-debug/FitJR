// =============================================
// FitJR - App Core (Router, State, Init)
// =============================================

const App = {
  state: {
    user: null,
    profile: null,
    currentRoute: 'login',
    theme: localStorage.getItem('mfit-theme') || 'dark'
  },

  // Initialize App
  async init() {
    // Apply saved theme
    document.documentElement.setAttribute('data-theme', this.state.theme);

    const hideLoading = () => {
      const ls = document.getElementById('loading-screen');
      if (ls) {
        ls.classList.add('hide');
        setTimeout(() => ls.remove(), 500);
      }
    };

    // Listen for auth state changes (fires on login/logout AFTER init)
    db.auth.onAuthStateChange(async (event, session) => {
      // Skip INITIAL_SESSION event — we handle that below
      if (event === 'INITIAL_SESSION') return;

      if (session?.user) {
        this.state.user = session.user;
        try {
          this.state.profile = await getProfile(session.user.id);
          this.navigate('dashboard');
        } catch (err) {
          console.error('Error loading profile:', err);
          // Profile might not exist yet (trigger delay)
          setTimeout(async () => {
            try {
              this.state.profile = await getProfile(session.user.id);
              this.navigate('dashboard');
            } catch (e) {
              console.error('Profile still not found:', e);
              this.navigate('login');
            }
          }, 2000);
        }
      } else {
        this.state.user = null;
        this.state.profile = null;
        this.navigate('login');
      }
    });

    // Check existing session and navigate
    try {
      const session = await getSession();
      if (session?.user) {
        this.state.user = session.user;
        try {
          this.state.profile = await getProfile(session.user.id);
          this.navigate('dashboard');
        } catch (err) {
          this.navigate('login');
        }
      } else {
        this.navigate('login');
      }
    } catch (err) {
      console.error('Session check failed:', err);
      this.navigate('login');
    } finally {
      // Always hide loading screen after navigation resolves
      setTimeout(hideLoading, 600);
    }

    // Bottom nav events
    this.setupBottomNav();

    // Modal close on overlay click
    document.getElementById('modal-overlay')?.addEventListener('click', (e) => {
      if (e.target === e.currentTarget) {
        this.closeModal();
      }
    });
  },

  // Setup Bottom Navigation
  setupBottomNav() {
    document.querySelectorAll('.nav-item').forEach(item => {
      item.addEventListener('click', () => {
        const route = item.dataset.route;
        this.navigate(route);
      });
    });
  },

  // Update Active Nav Item
  updateNav(route) {
    document.querySelectorAll('.nav-item').forEach(item => {
      item.classList.toggle('active', item.dataset.route === route);
    });
  },

  // Navigate to Route
  async navigate(route) {
    const app = document.getElementById('app');
    const bottomNav = document.getElementById('bottom-nav');

    this.state.currentRoute = route;

    // Show/hide bottom nav based on auth
    const isAuth = ['login', 'register'].includes(route);
    bottomNav?.classList.toggle('hidden', isAuth);

    if (isAuth) {
      app.style.padding = '0';
    } else {
      app.style.padding = '';
    }

    // Update nav highlight
    this.updateNav(route);

    // Route handling
    switch (route) {
      case 'login':
        app.innerHTML = Auth.renderLogin();
        Auth.bindLoginEvents();
        break;

      case 'register':
        app.innerHTML = Auth.renderRegister();
        Auth.bindRegisterEvents();
        break;

      case 'dashboard':
        await this.loadDashboard(app);
        break;

      case 'workouts':
        await this.loadWorkouts(app);
        break;

      case 'profile':
        this.loadProfile(app);
        break;

      default:
        app.innerHTML = Auth.renderLogin();
        Auth.bindLoginEvents();
        break;
    }
  },

  // Load Dashboard based on role
  async loadDashboard(app) {
    if (!this.state.profile) return this.navigate('login');

    app.innerHTML = '<div class="text-center mt-3"><div class="loading-spinner" style="margin:0 auto;"></div></div>';

    try {
      if (this.state.profile.role === 'personal') {
        const [students, workouts] = await Promise.all([
          getStudents(this.state.profile.id),
          getWorkoutsByPersonal(this.state.profile.id)
        ]);
        app.innerHTML = Personal.renderDashboard(this.state.profile, students, workouts);
        Personal.bindDashboardEvents(this.state.profile);

        // Load today's log count
        try {
          const logs = await getStudentLogsByPersonal(this.state.profile.id);
          const today = new Date().toDateString();
          const todayCount = logs.filter(l => new Date(l.completed_at).toDateString() === today).length;
          const el = document.getElementById('today-logs-count');
          if (el) el.textContent = todayCount;
        } catch (e) { /* ignore */ }

      } else {
        const workouts = await getWorkoutsByStudent(this.state.profile.id);
        app.innerHTML = Student.renderDashboard(this.state.profile, workouts);
        Student.bindDashboardEvents();
      }
    } catch (err) {
      app.innerHTML = `<div class="empty-state"><div class="empty-icon">⚠️</div><h3>Erro ao carregar</h3><p>${err.message}</p></div>`;
    }
  },

  // Load Workouts based on role
  async loadWorkouts(app) {
    if (!this.state.profile) return this.navigate('login');

    app.innerHTML = '<div class="text-center mt-3"><div class="loading-spinner" style="margin:0 auto;"></div></div>';

    try {
      if (this.state.profile.role === 'personal') {
        const [workouts, students] = await Promise.all([
          getWorkoutsByPersonal(this.state.profile.id),
          getStudents(this.state.profile.id)
        ]);
        app.innerHTML = Personal.renderWorkouts(workouts, students);
        Personal.bindWorkoutsEvents(students);
      } else {
        const [workouts, logs] = await Promise.all([
          getWorkoutsByStudent(this.state.profile.id),
          getStudentLogs(this.state.profile.id)
        ]);
        app.innerHTML = Student.renderWorkoutsPage(workouts, logs);
        Student.bindWorkoutsEvents();
      }
    } catch (err) {
      app.innerHTML = `<div class="empty-state"><div class="empty-icon">⚠️</div><h3>Erro ao carregar</h3><p>${err.message}</p></div>`;
    }
  },

  // Load Profile Page
  loadProfile(app) {
    if (!this.state.profile) return this.navigate('login');

    const profile = this.state.profile;
    const initials = profile.full_name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
    const roleLabel = profile.role === 'personal' ? 'Personal Trainer' : 'Aluno';
    const isDark = this.state.theme === 'dark';

    app.innerHTML = `
      <div class="profile-header">
        <div class="profile-avatar">${initials}</div>
        <div class="profile-name">${profile.full_name}</div>
        <div class="profile-role">${roleLabel}</div>
      </div>

      <ul class="profile-menu">
        <li class="profile-menu-item" id="toggle-theme">
          <div class="menu-icon">${isDark ? '🌙' : '☀️'}</div>
          <div class="menu-text">
            <div class="menu-label">Tema ${isDark ? 'Escuro' : 'Claro'}</div>
            <div class="menu-desc">Alternar aparência do app</div>
          </div>
          <button class="toggle-switch ${isDark ? 'active' : ''}" id="theme-switch"></button>
        </li>

        ${profile.role === 'personal' ? `
        <li class="profile-menu-item" id="show-personal-id">
          <div class="menu-icon">🔑</div>
          <div class="menu-text">
            <div class="menu-label">Meu Código</div>
            <div class="menu-desc">Compartilhe com seus alunos</div>
          </div>
        </li>
        ` : `
        <li class="profile-menu-item" id="link-personal">
          <div class="menu-icon">🔗</div>
          <div class="menu-text">
            <div class="menu-label">Vincular Personal</div>
            <div class="menu-desc">Conectar com seu personal trainer</div>
          </div>
        </li>
        `}

        <li class="profile-menu-item danger" id="logout-btn">
          <div class="menu-icon">🚪</div>
          <div class="menu-text">
            <div class="menu-label">Sair</div>
            <div class="menu-desc">Encerrar sessão</div>
          </div>
        </li>
      </ul>
    `;

    // Theme toggle
    document.getElementById('toggle-theme')?.addEventListener('click', () => {
      this.toggleTheme();
      this.loadProfile(app); // Refresh display
    });

    // Logout
    document.getElementById('logout-btn')?.addEventListener('click', async () => {
      try {
        await signOut();
        this.showToast('Sessão encerrada', 'info');
      } catch (err) {
        this.showToast('Erro ao sair: ' + err.message, 'error');
      }
    });

    // Show personal ID
    document.getElementById('show-personal-id')?.addEventListener('click', () => {
      this.openModal(`
        <div class="modal-handle"></div>
        <h3 class="modal-title">Seu Código de Personal</h3>
        <p style="font-size:0.85rem;color:var(--text-secondary);margin-bottom:1rem;">
          Compartilhe este código com seus alunos para que eles possam se vincular a você na hora do cadastro.
        </p>
        <div class="invite-code">
          <div class="code-label">Código completo</div>
          <div class="code" style="font-size:0.85rem;word-break:break-all;">${profile.id}</div>
        </div>
        <button class="btn btn-primary btn-block mt-1" id="copy-full-code">📋 Copiar</button>
        <button class="btn btn-secondary btn-block mt-1" id="close-code-modal">Fechar</button>
      `);

      document.getElementById('copy-full-code')?.addEventListener('click', () => {
        navigator.clipboard.writeText(profile.id);
        this.showToast('Código copiado!', 'success');
      });
      document.getElementById('close-code-modal')?.addEventListener('click', () => this.closeModal());
    });

    // Link personal (student)
    document.getElementById('link-personal')?.addEventListener('click', () => {
      this.openModal(`
        <div class="modal-handle"></div>
        <h3 class="modal-title">Vincular ao Personal</h3>
        <p style="font-size:0.85rem;color:var(--text-secondary);margin-bottom:1rem;">
          Cole o código que seu personal compartilhou com você.
        </p>
        <form id="link-personal-form">
          <div class="form-group">
            <label for="personal-code-input">Código do Personal</label>
            <input type="text" id="personal-code-input" placeholder="Cole o código aqui" required>
          </div>
          <button type="submit" class="btn btn-primary btn-block">Vincular</button>
          <button type="button" class="btn btn-secondary btn-block mt-1" id="cancel-link">Cancelar</button>
        </form>
      `);

      document.getElementById('cancel-link')?.addEventListener('click', () => this.closeModal());
      document.getElementById('link-personal-form')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const code = document.getElementById('personal-code-input').value.trim();
        if (!code) return;

        try {
          await linkStudentToPersonal(profile.id, code);
          this.state.profile.personal_id = code;
          this.showToast('Vinculado com sucesso!', 'success');
          this.closeModal();
        } catch (err) {
          this.showToast('Erro: código inválido', 'error');
        }
      });
    });
  },

  // Toggle Theme
  toggleTheme() {
    this.state.theme = this.state.theme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', this.state.theme);
    localStorage.setItem('mfit-theme', this.state.theme);
  },

  // Modal
  openModal(html) {
    const overlay = document.getElementById('modal-overlay');
    const content = document.getElementById('modal-content');
    if (overlay && content) {
      content.innerHTML = html;
      overlay.classList.remove('hidden');
    }
  },

  closeModal() {
    const overlay = document.getElementById('modal-overlay');
    overlay?.classList.add('hidden');
  },

  // Toast Notification
  showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const icons = { success: '✅', error: '❌', info: 'ℹ️', warning: '⚠️' };
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `<span>${icons[type] || 'ℹ️'}</span><span>${message}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
      toast.classList.add('toast-out');
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }
};

// --- Start App ---
document.addEventListener('DOMContentLoaded', () => {
  App.init();
});
