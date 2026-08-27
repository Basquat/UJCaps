import { auth, ensureDemoData } from '@/services/auth';
import type { Sessao } from '@/types';

export function renderLogin(): void {
  ensureDemoData();
  const container = document.getElementById('page-login')!;
  container.innerHTML = `
    <div class="card">
      <h2 style="text-align: center; margin-bottom: 0.25rem; letter-spacing: 0.02em; color: var(--text);">UJcaps</h2>
      <p style="text-align: center; color: var(--text-faint); margin-bottom: 2rem; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.06em;">Gestão para Profissionais de Psicologia</p>

      <div style="display: flex; margin-bottom: 1.5rem; border-bottom: 1px solid var(--border);">
        <button id="tab-login" type="button" class="tab-btn tab-btn-active" style="flex: 1;">Login</button>
        <button id="tab-cadastro" type="button" class="tab-btn" style="flex: 1;">Cadastro</button>
      </div>

      <form id="login-form">
        <div class="form-group">
          <label for="identificador">CPF ou e-mail (administrador)</label>
          <input type="text" id="identificador" name="identificador" required placeholder="000.000.000-00" autocomplete="username" />
        </div>

        <div class="form-group">
          <label for="senha">Senha</label>
          <input type="password" id="senha" name="senha" required placeholder="********" autocomplete="current-password" />
        </div>

        <div id="login-error" class="alert alert-error" style="display: none;"></div>

        <button type="submit" class="btn btn-primary" style="width: 100%;">Entrar</button>
      </form>

      <form id="cadastro-form" style="display: none;">
        <div class="form-group">
          <label for="cad-nome">Nome completo</label>
          <input type="text" id="cad-nome" name="nome" required />
        </div>
        <div class="form-group">
          <label for="cad-cpf">CPF</label>
          <input type="text" id="cad-cpf" name="cpf" required maxlength="14" placeholder="000.000.000-00" />
        </div>
        <div class="form-group">
          <label for="cad-cep">CEP</label>
          <input type="text" id="cad-cep" name="cep" required maxlength="9" placeholder="00000-000" />
        </div>
        <div class="form-group">
          <label for="cad-senha">Senha</label>
          <input type="password" id="cad-senha" name="senha" required minlength="4" />
        </div>
        <div class="form-group">
          <label for="cad-perfil">Perfil</label>
          <select id="cad-perfil" name="perfil" required>
            <option value="usuario">Paciente</option>
            <option value="psicologo">Psicólogo</option>
          </select>
        </div>
        <div id="cadastro-error" class="alert alert-error" style="display: none;"></div>
        <button type="submit" class="btn btn-primary" style="width: 100%;">Cadastrar</button>
      </form>

      <p style="text-align: center; margin-top: 1.5rem; font-size: 0.8125rem; color: var(--text-dim);">
        Acesso restrito a profissionais e pacientes cadastrados
      </p>
    </div>
  `;

  const loginForm = document.getElementById('login-form') as HTMLFormElement;
  const cadastroForm = document.getElementById('cadastro-form') as HTMLFormElement;
  const tabLogin = document.getElementById('tab-login') as HTMLElement;
  const tabCadastro = document.getElementById('tab-cadastro') as HTMLElement;

  const setActiveTab = (tab: 'login' | 'cadastro') => {
    if (tab === 'login') {
      loginForm.style.display = 'block';
      cadastroForm.style.display = 'none';
      tabLogin.classList.add('tab-btn-active');
      tabCadastro.classList.remove('tab-btn-active');
    } else {
      loginForm.style.display = 'none';
      cadastroForm.style.display = 'block';
      tabLogin.classList.remove('tab-btn-active');
      tabCadastro.classList.add('tab-btn-active');
    }
  };

  tabLogin.addEventListener('click', () => setActiveTab('login'));
  tabCadastro.addEventListener('click', () => setActiveTab('cadastro'));

  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const errorDiv = document.getElementById('login-error')!;
    errorDiv.className = 'alert alert-error';
    errorDiv.style.display = 'none';

    const identificador = (loginForm.elements.namedItem('identificador') as HTMLInputElement).value.trim();
    const senha = (loginForm.elements.namedItem('senha') as HTMLInputElement).value;

    if (!identificador || !senha) {
      errorDiv.textContent = 'Preencha todos os campos.';
      errorDiv.style.display = 'block';
      return;
    }

    try {
      const response = await auth.login({ identificador, senha });
      showDashboard(response.sessao);
    } catch (err: unknown) {
      const axiosError = err as { isAxiosError?: boolean; response?: { data?: { message?: string } } };
      const plainError = err as { message?: string };
      if (axiosError.response?.data?.message) {
        errorDiv.textContent = axiosError.response.data.message;
      } else if (!axiosError.isAxiosError && plainError.message) {
        // Erro lançado por auth.login (ex.: cadastro pendente de autorização)
        errorDiv.textContent = plainError.message;
      } else {
        errorDiv.textContent = 'Credenciais inválidas. Tente novamente.';
      }
      errorDiv.style.display = 'block';
    }
  });

  cadastroForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const errorDiv = document.getElementById('cadastro-error')!;
    errorDiv.style.display = 'none';

    const nome = (cadastroForm.elements.namedItem('nome') as HTMLInputElement).value.trim();
    const cpf = (cadastroForm.elements.namedItem('cpf') as HTMLInputElement).value.trim();
    const cep = (cadastroForm.elements.namedItem('cep') as HTMLInputElement).value.trim();
    const senha = (cadastroForm.elements.namedItem('senha') as HTMLInputElement).value;
    const perfil = (cadastroForm.elements.namedItem('perfil') as HTMLSelectElement).value as 'psicologo' | 'usuario';

    if (!nome || !cpf || !cep || !senha) {
      errorDiv.textContent = 'Preencha todos os campos.';
      errorDiv.style.display = 'block';
      return;
    }

    try {
      await auth.cadastrarDemo({ nome, cpf, cep, senha, perfil });
      cadastroForm.reset();
      errorDiv.style.display = 'none';
      setActiveTab('login');
      const loginErrorDiv = document.getElementById('login-error')!;
      loginErrorDiv.className = 'alert alert-success';
      loginErrorDiv.textContent =
        perfil === 'psicologo'
          ? 'Cadastro realizado com sucesso! Aguarde a autorização do administrador para poder entrar.'
          : 'Cadastro realizado com sucesso! Você já pode entrar com seu CPF e senha.';
      loginErrorDiv.style.display = 'block';
    } catch (err: unknown) {
      const error = err as { message?: string };
      errorDiv.textContent = error.message || 'Erro ao cadastrar.';
      errorDiv.style.display = 'block';
    }
  });
}

function showDashboard(sessao: Sessao): void {
  if (sessao.tipo === 'administrador') {
    import('./AdminDashboard').then((m) => m.renderAdminDashboard(sessao));
  } else if (sessao.tipo === 'psicologo') {
    import('./PsychologistDashboard').then((m) => m.renderPsychologistDashboard(sessao));
  } else {
    alert('Acesso de paciente ainda não possui painel próprio nesta versão.');
  }
}
