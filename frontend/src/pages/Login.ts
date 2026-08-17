import { auth } from '@/services/auth';
import type { LoginRequest, Usuario } from '@/types';

const STORAGE_KEYS = {
  TOKEN: 'token',
  USUARIO: 'usuario',
  DEMO_PATIENTS: 'psico_demo_patients',
};

function ensureDemoPatients(): void {
  if (!localStorage.getItem(STORAGE_KEYS.DEMO_PATIENTS)) {
    localStorage.setItem(STORAGE_KEYS.DEMO_PATIENTS, JSON.stringify([
      { id: 1, nome: 'Paciente Demo', telefone: '(11) 99999-9999', dataNascimento: '1990-01-01', email: 'paciente@demo.com', situacao: 'ativo', psicologoId: 999 },
    ]));
  }
}

export function renderLogin(): void {
  ensureDemoPatients();
  const container = document.getElementById('page-login')!;
  container.innerHTML = `
    <div class="card">
      <h2 style="text-align: center; margin-bottom: 0.5rem; color: var(--gray-900);">PsicoGest</h2>
      <p style="text-align: center; color: var(--gray-500); margin-bottom: 2rem; font-size: 0.875rem;">Gestão para Profissionais de Psicologia</p>
      
      <div style="display: flex; gap: 0.5rem; margin-bottom: 1rem; background: var(--gray-100); padding: 0.25rem; border-radius: 0.375rem;">
        <button id="tab-login" type="button" class="btn btn-sm" style="flex: 1; background: white;">Login</button>
        <button id="tab-cadastro" type="button" class="btn btn-sm" style="flex: 1;">Cadastro</button>
      </div>

      <form id="login-form">
        <div class="form-group">
          <label for="email">E-mail</label>
          <input type="email" id="email" name="email" required placeholder="seu@email.com" autocomplete="email" />
        </div>
        
        <div class="form-group">
          <label for="senha">Senha</label>
          <input type="password" id="senha" name="senha" required placeholder="********" autocomplete="current-password" />
        </div>

        <div class="form-group" style="display: flex; align-items: center; gap: 0.5rem;">
          <input type="checkbox" id="modo-demo" />
          <label for="modo-demo" style="margin: 0; cursor: pointer;">Usar modo demonstração (sem back-end)</label>
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
          <label for="cad-email">E-mail</label>
          <input type="email" id="cad-email" name="email" required />
        </div>
        <div class="form-group">
          <label for="cad-senha">Senha</label>
          <input type="password" id="cad-senha" name="senha" required minlength="6" />
        </div>
        <div class="form-group">
          <label for="cad-perfil">Perfil</label>
          <select id="cad-perfil" name="perfil" required>
            <option value="Psicólogo">Psicólogo</option>
            <option value="Administrador">Administrador</option>
          </select>
        </div>
        <div id="cadastro-error" class="alert alert-error" style="display: none;"></div>
        <button type="submit" class="btn btn-primary" style="width: 100%;">Cadastrar e Entrar</button>
      </form>
      
      <p style="text-align: center; margin-top: 1.5rem; font-size: 0.8125rem; color: var(--gray-500);">
        Acesso restrito a profissionais cadastrados
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
      tabLogin.style.background = 'white';
      tabCadastro.style.background = 'transparent';
    } else {
      loginForm.style.display = 'none';
      cadastroForm.style.display = 'block';
      tabLogin.style.background = 'transparent';
      tabCadastro.style.background = 'white';
    }
  };

  tabLogin.addEventListener('click', () => setActiveTab('login'));
  tabCadastro.addEventListener('click', () => setActiveTab('cadastro'));

  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const errorDiv = document.getElementById('login-error')!;
    errorDiv.style.display = 'none';

    const email = (loginForm.elements.namedItem('email') as HTMLInputElement).value.trim();
    const senha = (loginForm.elements.namedItem('senha') as HTMLInputElement).value;
    const modoDemo = (document.getElementById('modo-demo') as HTMLInputElement).checked;

    if (!email || !senha) {
      errorDiv.textContent = 'Preencha todos os campos.';
      errorDiv.style.display = 'block';
      return;
    }

    try {
      let response;
      if (modoDemo) {
        const fakeResponse = await auth.login({ email, senha });
        response = fakeResponse;
      } else {
        response = await auth.login({ email, senha });
      }
      showDashboard(response.usuario);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      errorDiv.textContent = error.response?.data?.message || 'Credenciais inválidas. Tente novamente.';
      errorDiv.style.display = 'block';
    }
  });

  cadastroForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const errorDiv = document.getElementById('cadastro-error')!;
    errorDiv.style.display = 'none';

    const nome = (cadastroForm.elements.namedItem('nome') as HTMLInputElement).value.trim();
    const email = (cadastroForm.elements.namedItem('email') as HTMLInputElement).value.trim();
    const senha = (cadastroForm.elements.namedItem('senha') as HTMLInputElement).value;
    const perfil = (cadastroForm.elements.namedItem('perfil') as HTMLSelectElement).value;

    if (!nome || !email || !senha) {
      errorDiv.textContent = 'Preencha todos os campos.';
      errorDiv.style.display = 'block';
      return;
    }

    try {
      const usuario = await auth.cadastrarDemo({ nome, email, senha, perfilNome: perfil });
      showDashboard(usuario);
    } catch (err: unknown) {
      const error = err as { message?: string };
      errorDiv.textContent = error.message || 'Erro ao cadastrar.';
      errorDiv.style.display = 'block';
    }
  });
}

function showDashboard(usuario: { nome: string; perfilNome?: string }): void {
  const perfil = usuario.perfilNome?.toLowerCase() || '';

  if (perfil === 'administrador') {
    import('./AdminDashboard').then((m) => m.renderAdminDashboard(usuario as Usuario));
  } else if (perfil === 'psicólogo' || perfil === 'psicologo') {
    import('./PsychologistDashboard').then((m) => m.renderPsychologistDashboard(usuario as Usuario));
  } else {
    alert('Perfil de acesso não reconhecido. Contate o administrador.');
  }
}
