// =============================================
// FitJR - Auth Module
// =============================================

const Auth = {
  // Render Login Page
  renderLogin() {
    return `
      <div class="auth-page">
        <div class="auth-logo">
          <span class="logo-icon">💪</span>
          <h1>Fit<span class="accent text-accent">JR</span></h1>
          <p>Gerencie seus treinos com inteligência</p>
        </div>

        <form class="auth-form" id="login-form">
          <div class="form-group">
            <label for="login-email">E-mail</label>
            <input type="email" id="login-email" placeholder="seu@email.com" required autocomplete="email">
          </div>

          <div class="form-group">
            <label for="login-password">Senha</label>
            <input type="password" id="login-password" placeholder="Sua senha" required autocomplete="current-password">
          </div>

          <button type="submit" class="btn btn-primary btn-block" id="login-btn">
            Entrar
          </button>
        </form>

        <div class="auth-footer">
          Não tem conta? <a href="#" id="go-register">Criar conta</a>
        </div>
      </div>
    `;
  },

  // Render Register Page
  renderRegister() {
    return `
      <div class="auth-page">
        <div class="auth-logo">
          <span class="logo-icon">💪</span>
          <h1>Fit<span class="accent text-accent">JR</span></h1>
          <p>Crie sua conta</p>
        </div>

        <form class="auth-form" id="register-form">
          <div class="form-group">
            <label for="reg-name">Nome completo</label>
            <input type="text" id="reg-name" placeholder="Seu nome" required autocomplete="name">
          </div>

          <div class="form-group">
            <label for="reg-email">E-mail</label>
            <input type="email" id="reg-email" placeholder="seu@email.com" required autocomplete="email">
          </div>

          <div class="form-group">
            <label for="reg-password">Senha</label>
            <input type="password" id="reg-password" placeholder="Mínimo 6 caracteres" required minlength="6" autocomplete="new-password">
          </div>

          <div class="form-group">
            <label for="reg-role">Eu sou</label>
            <select id="reg-role" required>
              <option value="">Selecione...</option>
              <option value="personal">Personal Trainer</option>
              <option value="student">Aluno</option>
            </select>
          </div>

          <div class="form-group hidden" id="personal-code-group">
            <label for="reg-personal-code">Código do Personal (ID)</label>
            <input type="text" id="reg-personal-code" placeholder="Cole o código do seu personal">
          </div>

          <button type="submit" class="btn btn-primary btn-block" id="register-btn">
            Criar Conta
          </button>
        </form>

        <div class="auth-footer">
          Já tem conta? <a href="#" id="go-login">Fazer login</a>
        </div>
      </div>
    `;
  },

  // Bind Login Events
  bindLoginEvents() {
    const form = document.getElementById('login-form');
    const goRegister = document.getElementById('go-register');

    if (form) {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = document.getElementById('login-btn');
        const email = document.getElementById('login-email').value.trim();
        const password = document.getElementById('login-password').value;

        btn.disabled = true;
        btn.textContent = 'Entrando...';

        try {
          await signIn(email, password);
          App.showToast('Login realizado com sucesso!', 'success');
        } catch (err) {
          App.showToast(err.message || 'Erro ao fazer login', 'error');
          btn.disabled = false;
          btn.textContent = 'Entrar';
        }
      });
    }

    if (goRegister) {
      goRegister.addEventListener('click', (e) => {
        e.preventDefault();
        App.navigate('register');
      });
    }
  },

  // Bind Register Events
  bindRegisterEvents() {
    const form = document.getElementById('register-form');
    const goLogin = document.getElementById('go-login');
    const roleSelect = document.getElementById('reg-role');
    const personalCodeGroup = document.getElementById('personal-code-group');

    if (roleSelect) {
      roleSelect.addEventListener('change', () => {
        if (roleSelect.value === 'student') {
          personalCodeGroup.classList.remove('hidden');
        } else {
          personalCodeGroup.classList.add('hidden');
        }
      });
    }

    if (form) {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = document.getElementById('register-btn');
        const name = document.getElementById('reg-name').value.trim();
        const email = document.getElementById('reg-email').value.trim();
        const password = document.getElementById('reg-password').value;
        const role = document.getElementById('reg-role').value;
        const personalCode = document.getElementById('reg-personal-code')?.value.trim();

        if (!role) {
          App.showToast('Selecione seu perfil', 'error');
          return;
        }

        btn.disabled = true;
        btn.textContent = 'Criando conta...';

        try {
          const data = await signUp(email, password, name, role);

          // If student, link to personal
          if (role === 'student' && personalCode) {
            // Wait a moment for the trigger to create the profile
            setTimeout(async () => {
              try {
                await linkStudentToPersonal(data.user.id, personalCode);
              } catch (err) {
                console.warn('Não foi possível vincular ao personal:', err);
              }
            }, 1500);
          }

          App.showToast('Conta criada! Verifique seu e-mail se necessário.', 'success');

          // Auto-login if email confirmation is disabled
          if (data.session) {
            // Will be handled by onAuthStateChange
          } else {
            App.navigate('login');
          }
        } catch (err) {
          App.showToast(err.message || 'Erro ao criar conta', 'error');
          btn.disabled = false;
          btn.textContent = 'Criar Conta';
        }
      });
    }

    if (goLogin) {
      goLogin.addEventListener('click', (e) => {
        e.preventDefault();
        App.navigate('login');
      });
    }
  }
};
