import {
  auth,
  getDemoUsers as getDemoUsersRaw,
  saveDemoUsers,
  perfilIdFromNome,
  getDemoPsychologists,
  getDemoPatients,
  getDemoLogs,
  registrarLogDemo,
} from '@/services/auth';
import { userService, psychologistService, patientService, auditService } from '@/services/api';
import type { Usuario, Psicologo, ClientePaciente, LogAcao } from '@/types';

function getDemoUsers(): Usuario[] {
  return getDemoUsersRaw().map((u) => ({
    id: u.id,
    nome: u.nome,
    email: u.email,
    perfilId: perfilIdFromNome(u.perfilNome),
    perfilNome: u.perfilNome,
    situacao: u.situacao,
  }));
}

export async function renderAdminDashboard(usuario: Usuario): Promise<void> {
  document.getElementById('page-login')!.style.display = 'none';
  document.getElementById('page-psychologist')!.style.display = 'none';
  const adminPage = document.getElementById('page-admin')!;
  adminPage.style.display = 'block';

  const navbar = document.getElementById('navbar') as HTMLElement;
  navbar.style.display = 'flex';
  document.getElementById('nav-user-name')!.textContent = `${usuario.nome} (Administrador)`;

  const logoutBtn = document.getElementById('nav-logout')!;
  logoutBtn.onclick = async () => {
    await auth.logout();
    location.reload();
  };

  adminPage.innerHTML = `
    <div class="container">
      <h1 class="section-title">Painel do Administrador</h1>
      
      <div class="dashboard-grid" id="stats-container">
        <div class="stat-card">
          <h3>Carregando...</h3>
        </div>
      </div>

      <div class="header-actions">
        <h2 class="section-title" style="margin-bottom: 0;">Gerenciar Usuários</h2>
        <button id="btn-novo-usuario" class="btn btn-primary">Novo Usuário</button>
      </div>

      <div id="usuarios-container" class="table-container" style="margin-bottom: 2rem;">
        <p style="padding: 1rem; color: var(--text-dim);">Carregando usuários...</p>
      </div>

      <div class="header-actions">
        <h2 class="section-title" style="margin-bottom: 0;">Psicólogos</h2>
      </div>

      <div id="psicologos-container" class="table-container">
        <p style="padding: 1rem; color: var(--text-dim);">Carregando psicólogos...</p>
      </div>
    </div>
  `;

  document.getElementById('btn-novo-usuario')!.addEventListener('click', () => {
    openUsuarioModal();
  });

  await carregarEstatisticas();
  await carregarUsuarios();
  await carregarPsicologos();
}

async function carregarEstatisticas(): Promise<void> {
  const container = document.getElementById('stats-container')!;
  try {
    const [usuarios, psicologos, pacientes] = await Promise.all([
      userService.listarUsuarios(),
      psychologistService.listarPsicologos(),
      patientService.listarPacientes(),
    ]);

    const ativos = usuarios.filter((u) => u.situacao === 'ativo').length;
    const inativos = usuarios.filter((u) => u.situacao === 'inativo').length;
    const bloqueados = usuarios.filter((u) => u.situacao === 'bloqueado').length;
    const pendentes = usuarios.filter((u) => u.situacao === 'pendente').length;

    container.innerHTML = `
      <div class="stat-card">
        <h3>Total de Usuários</h3>
        <div class="stat-value">${usuarios.length}</div>
        <p style="color: var(--text-dim); font-size: 0.8125rem; margin-top: 0.25rem;">
          ${ativos} ativos, ${pendentes} pendentes, ${inativos} inativos, ${bloqueados} bloqueados
        </p>
      </div>
      <div class="stat-card">
        <h3>Psicólogos</h3>
        <div class="stat-value">${psicologos.length}</div>
        <p style="color: var(--text-dim); font-size: 0.8125rem; margin-top: 0.25rem;">
          Profissionais cadastrados
        </p>
      </div>
      <div class="stat-card">
        <h3>Clientes/Pacientes</h3>
        <div class="stat-value">${pacientes.length}</div>
        <p style="color: var(--text-dim); font-size: 0.8125rem; margin-top: 0.25rem;">
          Registros ativos
        </p>
      </div>
    `;
  } catch {
    const usuarios = getDemoUsers();
    const psicologos = getDemoPsychologists();
    const pacientes = getDemoPatients();
    const ativos = usuarios.filter((u) => u.situacao === 'ativo').length;
    const inativos = usuarios.filter((u) => u.situacao === 'inativo').length;
    const bloqueados = usuarios.filter((u) => u.situacao === 'bloqueado').length;
    const pendentes = usuarios.filter((u) => u.situacao === 'pendente').length;

    container.innerHTML = `
      <div class="stat-card">
        <h3>Total de Usuários</h3>
        <div class="stat-value">${usuarios.length}</div>
        <p style="color: var(--text-dim); font-size: 0.8125rem; margin-top: 0.25rem;">
          ${ativos} ativos, ${pendentes} pendentes, ${inativos} inativos, ${bloqueados} bloqueados
        </p>
      </div>
      <div class="stat-card">
        <h3>Psicólogos</h3>
        <div class="stat-value">${psicologos.length}</div>
        <p style="color: var(--text-dim); font-size: 0.8125rem; margin-top: 0.25rem;">
          Profissionais cadastrados
        </p>
      </div>
      <div class="stat-card">
        <h3>Clientes/Pacientes</h3>
        <div class="stat-value">${pacientes.length}</div>
        <p style="color: var(--text-dim); font-size: 0.8125rem; margin-top: 0.25rem;">
          Registros ativos
        </p>
      </div>
    `;
  }
}

async function carregarUsuarios(): Promise<void> {
  const container = document.getElementById('usuarios-container')!;

  try {
    const usuarios = await userService.listarUsuarios();

    if (usuarios.length === 0) {
      container.innerHTML = '<p style="padding: 1rem; color: var(--text-dim);">Nenhum usuário cadastrado.</p>';
      return;
    }

    const rows = usuarios
      .map(
        (u) => `
        <tr>
          <td>${u.nome}</td>
          <td>${u.email}</td>
          <td><span class="badge badge-${getSituacaoClass(u.situacao)}">${u.situacao}</span></td>
          <td>${u.perfilNome || '-'}</td>
          <td>
            <button class="btn btn-sm btn-secondary btn-editar" data-id="${u.id}">Editar</button>
            ${u.situacao === 'pendente' ? `<button class="btn btn-sm btn-success btn-autorizar" data-id="${u.id}">Autorizar</button>` : ''}
            ${u.situacao !== 'bloqueado' && u.situacao !== 'pendente' ? `<button class="btn btn-sm btn-danger btn-bloquear" data-id="${u.id}">Bloquear</button>` : ''}
            ${u.situacao === 'pendente' ? `<button class="btn btn-sm btn-danger btn-bloquear" data-id="${u.id}">Recusar</button>` : ''}
            ${u.situacao === 'bloqueado' ? `<button class="btn btn-sm btn-success btn-desbloquear" data-id="${u.id}">Liberar</button>` : ''}
          </td>
        </tr>
      `
      )
      .join('');

    container.innerHTML = `
      <table>
        <thead>
          <tr>
            <th>Nome</th>
            <th>E-mail</th>
            <th>Situação</th>
            <th>Perfil</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    `;

    container.querySelectorAll('.btn-editar').forEach((btn) => {
      btn.addEventListener('click', () => openUsuarioModal(Number((btn as HTMLElement).dataset.id)));
    });

    container.querySelectorAll('.btn-autorizar').forEach((btn) => {
      btn.addEventListener('click', () => alterarSituacao(Number((btn as HTMLElement).dataset.id), 'ativo'));
    });

    container.querySelectorAll('.btn-bloquear').forEach((btn) => {
      btn.addEventListener('click', () => alterarSituacao(Number((btn as HTMLElement).dataset.id), 'bloqueado'));
    });

    container.querySelectorAll('.btn-desbloquear').forEach((btn) => {
      btn.addEventListener('click', () => alterarSituacao(Number((btn as HTMLElement).dataset.id), 'ativo'));
    });
  } catch {
    const usuarios = getDemoUsers();

    if (usuarios.length === 0) {
      container.innerHTML = '<p style="padding: 1rem; color: var(--text-dim);">Nenhum usuário cadastrado.</p>';
      return;
    }

    const rows = usuarios
      .map(
        (u) => `
        <tr>
          <td>${u.nome}</td>
          <td>${u.email}</td>
          <td><span class="badge badge-${getSituacaoClass(u.situacao)}">${u.situacao}</span></td>
          <td>${u.perfilNome || '-'}</td>
          <td>
            <button class="btn btn-sm btn-secondary btn-editar" data-id="${u.id}">Editar</button>
            ${u.situacao === 'pendente' ? `<button class="btn btn-sm btn-success btn-autorizar" data-id="${u.id}">Autorizar</button>` : ''}
            ${u.situacao !== 'bloqueado' && u.situacao !== 'pendente' ? `<button class="btn btn-sm btn-danger btn-bloquear" data-id="${u.id}">Bloquear</button>` : ''}
            ${u.situacao === 'pendente' ? `<button class="btn btn-sm btn-danger btn-bloquear" data-id="${u.id}">Recusar</button>` : ''}
            ${u.situacao === 'bloqueado' ? `<button class="btn btn-sm btn-success btn-desbloquear" data-id="${u.id}">Liberar</button>` : ''}
          </td>
        </tr>
      `
      )
      .join('');

    container.innerHTML = `
      <table>
        <thead>
          <tr>
            <th>Nome</th>
            <th>E-mail</th>
            <th>Situação</th>
            <th>Perfil</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    `;

    container.querySelectorAll('.btn-editar').forEach((btn) => {
      btn.addEventListener('click', () => openUsuarioModal(Number((btn as HTMLElement).dataset.id)));
    });

    container.querySelectorAll('.btn-autorizar').forEach((btn) => {
      btn.addEventListener('click', () => alterarSituacaoDemo(Number((btn as HTMLElement).dataset.id), 'ativo'));
    });

    container.querySelectorAll('.btn-bloquear').forEach((btn) => {
      btn.addEventListener('click', () => alterarSituacaoDemo(Number((btn as HTMLElement).dataset.id), 'bloqueado'));
    });

    container.querySelectorAll('.btn-desbloquear').forEach((btn) => {
      btn.addEventListener('click', () => alterarSituacaoDemo(Number((btn as HTMLElement).dataset.id), 'ativo'));
    });
  }
}

async function carregarPsicologos(): Promise<void> {
  const container = document.getElementById('psicologos-container')!;

  let psicologos: Psicologo[];
  let usandoDemo = false;
  try {
    psicologos = await psychologistService.listarPsicologos();
  } catch {
    psicologos = getDemoPsychologists();
    usandoDemo = true;
  }

  let pacientes: ClientePaciente[];
  try {
    pacientes = usandoDemo ? getDemoPatients() : await patientService.listarPacientes();
  } catch {
    pacientes = getDemoPatients();
  }

  if (psicologos.length === 0) {
    container.innerHTML = '<p style="padding: 1rem; color: var(--text-dim);">Nenhum psicólogo cadastrado.</p>';
    return;
  }

  const rows = psicologos
    .map((p) => {
      const vinculados = pacientes.filter((pac) => pac.psicologoId === p.id).length;
      return `
        <tr>
          <td>${p.nome}</td>
          <td>${p.areaAtuacao || '-'}</td>
          <td>${p.crm || '-'}</td>
          <td>${vinculados}</td>
          <td><span class="badge badge-${p.situacao === 'ativo' ? 'success' : 'danger'}">${p.situacao}</span></td>
          <td>
            <button class="btn btn-sm btn-secondary btn-ver-detalhes" data-id="${p.id}">Ver detalhes</button>
          </td>
        </tr>
      `;
    })
    .join('');

  container.innerHTML = `
    <table>
      <thead>
        <tr>
          <th>Nome</th>
          <th>Área</th>
          <th>CRM</th>
          <th>Pacientes</th>
          <th>Situação</th>
          <th>Ações</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  `;

  container.querySelectorAll('.btn-ver-detalhes').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = Number((btn as HTMLElement).dataset.id);
      const psicologo = psicologos.find((p) => p.id === id);
      if (psicologo) abrirDetalhesPsicologo(psicologo, pacientes, usandoDemo);
    });
  });
}

async function abrirDetalhesPsicologo(psicologo: Psicologo, pacientes: ClientePaciente[], usandoDemo: boolean): Promise<void> {
  const meusPacientes = pacientes.filter((p) => p.psicologoId === psicologo.id);

  let logs: LogAcao[];
  if (usandoDemo) {
    logs = getDemoLogs().filter((l) => l.usuarioId === psicologo.usuarioId);
  } else {
    try {
      const todosLogs = await auditService.listarLogs();
      logs = todosLogs.filter((l) => l.usuarioId === psicologo.usuarioId);
    } catch {
      logs = [];
    }
  }

  const modal = document.createElement('div');
  modal.id = 'modal-detalhes-psicologo';
  modal.style.cssText = 'position: fixed; inset: 0; background: rgba(0,0,0,0.7); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 1.5rem;';

  const pacientesRows = meusPacientes.length
    ? meusPacientes
        .map(
          (p) => `
        <tr>
          <td>${p.nome}</td>
          <td>${p.telefone || '-'}</td>
          <td><span class="badge badge-${p.situacao === 'ativo' ? 'success' : 'warning'}">${p.situacao}</span></td>
        </tr>
      `
        )
        .join('')
    : '<tr><td colspan="3" style="color: var(--text-dim);">Nenhum paciente vinculado.</td></tr>';

  const logsRows = logs.length
    ? logs
        .map(
          (l) => `
        <tr>
          <td>${new Date(l.dataHora).toLocaleString('pt-BR')}</td>
          <td>${l.acao}</td>
          <td>${l.entidade}${l.entidadeId ? ' #' + l.entidadeId : ''}</td>
        </tr>
      `
        )
        .join('')
    : '<tr><td colspan="3" style="color: var(--text-dim);">Nenhuma atividade registrada.</td></tr>';

  modal.innerHTML = `
    <div class="card" style="max-width: 720px; max-height: 85vh; overflow-y: auto;">
      <h2 style="margin-bottom: 0.25rem;">${psicologo.nome}</h2>
      <p style="color: var(--text-faint); font-size: 0.8125rem; text-transform: uppercase; letter-spacing: 0.04em; margin-bottom: 1.5rem;">
        ${psicologo.areaAtuacao || 'Área não informada'} ${psicologo.crm ? '· ' + psicologo.crm : ''}
      </p>

      <div class="dashboard-grid" style="margin-bottom: 1.5rem;">
        <div class="stat-card">
          <h3>Telefone</h3>
          <div class="stat-value" style="font-size: 1.1rem;">${psicologo.telefone || '-'}</div>
        </div>
        <div class="stat-card">
          <h3>E-mail</h3>
          <div class="stat-value" style="font-size: 1.1rem;">${psicologo.email || '-'}</div>
        </div>
      </div>

      <h3 class="section-title" style="font-size: 0.9375rem;">Pacientes vinculados</h3>
      <div class="table-container" style="margin-bottom: 1.5rem;">
        <table>
          <thead><tr><th>Nome</th><th>Telefone</th><th>Situação</th></tr></thead>
          <tbody>${pacientesRows}</tbody>
        </table>
      </div>

      <h3 class="section-title" style="font-size: 0.9375rem;">Atividade registrada</h3>
      <div class="table-container">
        <table>
          <thead><tr><th>Data/Hora</th><th>Ação</th><th>Entidade</th></tr></thead>
          <tbody>${logsRows}</tbody>
        </table>
      </div>

      <div style="display: flex; justify-content: flex-end; margin-top: 1.5rem;">
        <button type="button" class="btn btn-secondary" id="modal-fechar">Fechar</button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  modal.querySelector('#modal-fechar')!.addEventListener('click', () => modal.remove());
  modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.remove();
  });
}

async function alterarSituacao(id: number, situacao: string): Promise<void> {
  try {
    await userService.atualizarUsuario(id, { situacao: situacao as Usuario['situacao'] });
    await carregarUsuarios();
    await carregarEstatisticas();
  } catch {
    alert('Erro ao atualizar situação do usuário.');
  }
}

async function alterarSituacaoDemo(id: number, situacao: string): Promise<void> {
  const users = getDemoUsersRaw();
  const idx = users.findIndex((u) => u.id === id);
  if (idx === -1) return;
  users[idx].situacao = situacao as Usuario['situacao'];
  saveDemoUsers(users);

  const admin = auth.getUsuario();
  const acao = situacao === 'ativo' ? 'Cadastro autorizado' : situacao === 'bloqueado' ? 'Usuário bloqueado' : 'Situação alterada';
  registrarLogDemo(admin?.id ?? 0, admin?.nome ?? 'Administrador', `${acao} (${users[idx].nome})`, 'Usuario', id);

  await carregarUsuarios();
  await carregarEstatisticas();
  await carregarPsicologos();
}

function openUsuarioModal(id?: number): void {
  const modal = document.createElement('div');
  modal.id = 'modal-usuario';
  modal.style.cssText = 'position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000;';

  modal.innerHTML = `
    <div class="card" style="max-width: 500px;">
      <h2 style="margin-bottom: 1.5rem;">${id ? 'Editar Usuário' : 'Novo Usuário'}</h2>
      <form id="usuario-form">
        <div class="form-group">
          <label for="nome">Nome completo</label>
          <input type="text" id="nome" name="nome" required />
        </div>
        <div class="form-group">
          <label for="email">E-mail</label>
          <input type="email" id="email" name="email" required />
        </div>
        ${!id ? `
        <div class="form-group">
          <label for="senha">Senha</label>
          <input type="password" id="senha" name="senha" required minlength="4" />
        </div>
        ` : ''}
        <div class="form-group">
          <label for="perfilId">Perfil</label>
          <select id="perfilId" name="perfilId" required>
            <option value="1">Administrador</option>
            <option value="2">Psicólogo</option>
          </select>
        </div>
        <div class="form-group">
          <label for="situacao">Situação</label>
          <select id="situacao" name="situacao" required>
            <option value="pendente">Pendente</option>
            <option value="ativo">Ativo</option>
            <option value="inativo">Inativo</option>
            <option value="bloqueado">Bloqueado</option>
          </select>
        </div>
        <div style="display: flex; gap: 0.75rem; justify-content: flex-end;">
          <button type="button" class="btn btn-secondary" id="modal-cancelar">Cancelar</button>
          <button type="submit" class="btn btn-primary">Salvar</button>
        </div>
      </form>
    </div>
  `;

  document.body.appendChild(modal);

  modal.querySelector('#modal-cancelar')!.addEventListener('click', () => modal.remove());

  modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.remove();
  });

  modal.querySelector('#usuario-form')!.addEventListener('submit', async (e) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const data = {
      nome: (form.elements.namedItem('nome') as HTMLInputElement).value,
      email: (form.elements.namedItem('email') as HTMLInputElement).value,
      perfilId: Number((form.elements.namedItem('perfilId') as HTMLSelectElement).value),
      situacao: (form.elements.namedItem('situacao') as HTMLSelectElement).value as Usuario['situacao'],
    };

    try {
      if (id) {
        const senha = (form.elements.namedItem('senha') as HTMLInputElement | undefined)?.value;
        await userService.atualizarUsuario(id, senha ? { ...data, senha } : data);
      } else {
        const senha = (form.elements.namedItem('senha') as HTMLInputElement).value;
        await userService.cadastrarUsuario({ ...data, senha });
      }
      modal.remove();
      await carregarUsuarios();
      await carregarEstatisticas();
    } catch {
      alert('Erro ao salvar usuário.');
    }
  });
}

function getSituacaoClass(situacao: string): string {
  switch (situacao) {
    case 'ativo':
      return 'success';
    case 'pendente':
      return 'warning';
    case 'inativo':
      return 'warning';
    case 'bloqueado':
      return 'danger';
    default:
      return '';
  }
}
