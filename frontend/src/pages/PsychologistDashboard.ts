import { auth } from '@/services/auth';
import { patientService, psychologistService } from '@/services/api';
import type { Usuario, ClientePaciente, Psicologo } from '@/types';

function getDemoPsychologists(): Psicologo[] {
  const raw = localStorage.getItem('psico_demo_psychologists');
  if (!raw) return [];
  return JSON.parse(raw);
}

function getDemoPatients(): ClientePaciente[] {
  const raw = localStorage.getItem('psico_demo_patients');
  if (!raw) return [];
  return JSON.parse(raw);
}

export async function renderPsychologistDashboard(usuario: Usuario): Promise<void> {
  document.getElementById('page-login')!.style.display = 'none';
  document.getElementById('page-admin')!.style.display = 'none';
  const psychologistPage = document.getElementById('page-psychologist')!;
  psychologistPage.style.display = 'block';

  const navbar = document.getElementById('navbar') as HTMLElement;
  navbar.style.display = 'flex';
  document.getElementById('nav-user-name')!.textContent = `${usuario.nome} (Psicólogo)`;

  const logoutBtn = document.getElementById('nav-logout')!;
  logoutBtn.onclick = async () => {
    await auth.logout();
    location.reload();
  };

  psychologistPage.innerHTML = `
    <div class="container">
      <h1 class="section-title">Painel do Psicólogo</h1>

      <div class="dashboard-grid" id="stats-container">
        <div class="stat-card">
          <h3>Carregando...</h3>
        </div>
      </div>

      <div class="header-actions">
        <h2 class="section-title" style="margin-bottom: 0;">Meus Pacientes</h2>
        <button id="btn-novo-paciente" class="btn btn-primary">Novo Paciente</button>
      </div>

      <div id="pesquisa-container" class="form-group" style="max-width: 300px;">
        <input type="text" id="pesquisa-paciente" placeholder="Pesquisar por nome..." />
      </div>

      <div id="pacientes-container" class="table-container">
        <p style="padding: 1rem; color: var(--text-dim);">Carregando pacientes...</p>
      </div>
    </div>
  `;

  document.getElementById('btn-novo-paciente')!.addEventListener('click', () => {
    openPacienteModal();
  });

  const searchInput = document.getElementById('pesquisa-paciente') as HTMLInputElement;
  searchInput.addEventListener('input', () => {
    carregarPacientes(searchInput.value);
  });

  await carregarEstatisticas(usuario);
  await carregarPacientes();
}

async function carregarEstatisticas(usuario: Usuario): Promise<void> {
  const container = document.getElementById('stats-container')!;
  try {
    const psicologos = await psychologistService.listarPsicologos();
    const psicologo = psicologos.find((p) => p.usuarioId === usuario.id);

    if (!psicologo) {
      container.innerHTML = `
        <div class="stat-card">
          <h3>Perfil Profissional</h3>
          <p style="color: var(--text-dim); font-size: 0.875rem;">Complete seu cadastro profissional.</p>
        </div>
      `;
      return;
    }

    const pacientes = await patientService.listarPacientes();
    const meusPacientes = pacientes.filter((p) => p.psicologoId === psicologo.id);
    const ativos = meusPacientes.filter((p) => p.situacao === 'ativo').length;

    container.innerHTML = `
      <div class="stat-card">
        <h3>Meus Pacientes</h3>
        <div class="stat-value">${meusPacientes.length}</div>
        <p style="color: var(--text-dim); font-size: 0.8125rem; margin-top: 0.25rem;">
          ${ativos} ativos
        </p>
      </div>
      <div class="stat-card">
        <h3>Área de Atuação</h3>
        <div class="stat-value" style="font-size: 1.25rem; margin-top: 0.25rem;">${psicologo.areaAtuacao || 'Não informada'}</div>
      </div>
    `;
  } catch {
    const psicologos = getDemoPsychologists();
    const psicologo = psicologos.find((p) => p.usuarioId === usuario.id);
    if (!psicologo) {
      container.innerHTML = `
        <div class="stat-card">
          <h3>Perfil Profissional</h3>
          <p style="color: var(--text-dim); font-size: 0.875rem;">Complete seu cadastro profissional.</p>
        </div>
      `;
      return;
    }

    const pacientes = getDemoPatients();
    const meusPacientes = pacientes.filter((p) => p.psicologoId === psicologo.id);
    const ativos = meusPacientes.filter((p) => p.situacao === 'ativo').length;

    container.innerHTML = `
      <div class="stat-card">
        <h3>Meus Pacientes</h3>
        <div class="stat-value">${meusPacientes.length}</div>
        <p style="color: var(--text-dim); font-size: 0.8125rem; margin-top: 0.25rem;">
          ${ativos} ativos
        </p>
      </div>
      <div class="stat-card">
        <h3>Área de Atuação</h3>
        <div class="stat-value" style="font-size: 1.25rem; margin-top: 0.25rem;">${psicologo.areaAtuacao || 'Não informada'}</div>
      </div>
    `;
  }
}

async function carregarPacientes(filtro?: string): Promise<void> {
  const container = document.getElementById('pacientes-container')!;

  try {
    const pacientes = await patientService.listarPacientes();
    const usuario = auth.getUsuario();
    const psicologos = await psychologistService.listarPsicologos();
    const psicologo = psicologos.find((p) => p.usuarioId === usuario?.id);

    let meusPacientes = psicologo ? pacientes.filter((p) => p.psicologoId === psicologo.id) : [];

    if (filtro) {
      const termo = filtro.toLowerCase();
      meusPacientes = meusPacientes.filter((p) => p.nome.toLowerCase().includes(termo));
    }

    if (meusPacientes.length === 0) {
      container.innerHTML = '<p style="padding: 1rem; color: var(--text-dim);">Nenhum paciente encontrado.</p>';
      return;
    }

    const rows = meusPacientes
      .map(
        (p) => `
        <tr>
          <td>${p.nome}</td>
          <td>${p.telefone || '-'}</td>
          <td>${p.dataNascimento || '-'}</td>
          <td><span class="badge badge-${p.situacao === 'ativo' ? 'success' : 'warning'}">${p.situacao}</span></td>
          <td>
            <button class="btn btn-sm btn-secondary btn-editar" data-id="${p.id}">Editar</button>
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
            <th>Telefone</th>
            <th>Nascimento</th>
            <th>Situação</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    `;

    container.querySelectorAll('.btn-editar').forEach((btn) => {
      btn.addEventListener('click', () => openPacienteModal(Number((btn as HTMLElement).dataset.id)));
    });
  } catch {
    const usuario = auth.getUsuario();
    const psicologos = getDemoPsychologists();
    const psicologo = psicologos.find((p) => p.usuarioId === usuario?.id);
    let meusPacientes = psicologo ? getDemoPatients().filter((p) => p.psicologoId === psicologo.id) : [];

    if (filtro) {
      const termo = filtro.toLowerCase();
      meusPacientes = meusPacientes.filter((p) => p.nome.toLowerCase().includes(termo));
    }

    if (meusPacientes.length === 0) {
      container.innerHTML = '<p style="padding: 1rem; color: var(--text-dim);">Nenhum paciente encontrado.</p>';
      return;
    }

    const rows = meusPacientes
      .map(
        (p) => `
        <tr>
          <td>${p.nome}</td>
          <td>${p.telefone || '-'}</td>
          <td>${p.dataNascimento || '-'}</td>
          <td><span class="badge badge-${p.situacao === 'ativo' ? 'success' : 'warning'}">${p.situacao}</span></td>
          <td>
            <button class="btn btn-sm btn-secondary btn-editar" data-id="${p.id}">Editar</button>
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
            <th>Telefone</th>
            <th>Nascimento</th>
            <th>Situação</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    `;

    container.querySelectorAll('.btn-editar').forEach((btn) => {
      btn.addEventListener('click', () => openPacienteModal(Number((btn as HTMLElement).dataset.id)));
    });
  }
}

function openPacienteModal(id?: number): void {
  const modal = document.createElement('div');
  modal.id = 'modal-paciente';
  modal.style.cssText = 'position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000;';

  modal.innerHTML = `
    <div class="card" style="max-width: 500px;">
      <h2 style="margin-bottom: 1.5rem;">${id ? 'Editar Paciente' : 'Novo Paciente'}</h2>
      <form id="paciente-form">
        <div class="form-group">
          <label for="nome">Nome completo</label>
          <input type="text" id="nome" name="nome" required />
        </div>
        <div class="form-group">
          <label for="telefone">Telefone</label>
          <input type="tel" id="telefone" name="telefone" />
        </div>
        <div class="form-group">
          <label for="dataNascimento">Data de nascimento</label>
          <input type="date" id="dataNascimento" name="dataNascimento" />
        </div>
        <div class="form-group">
          <label for="email">E-mail</label>
          <input type="email" id="email" name="email" />
        </div>
        <div class="form-group">
          <label for="situacao">Situação</label>
          <select id="situacao" name="situacao" required>
            <option value="ativo">Ativo</option>
            <option value="inativo">Inativo</option>
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

  modal.querySelector('#paciente-form')!.addEventListener('submit', async (e) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const data = {
      nome: (form.elements.namedItem('nome') as HTMLInputElement).value,
      telefone: (form.elements.namedItem('telefone') as HTMLInputElement).value,
      dataNascimento: (form.elements.namedItem('dataNascimento') as HTMLInputElement).value,
      email: (form.elements.namedItem('email') as HTMLInputElement).value,
      situacao: (form.elements.namedItem('situacao') as HTMLSelectElement).value as ClientePaciente['situacao'],
    };

    try {
      if (id) {
        await patientService.atualizarPaciente(id, data);
      } else {
        await patientService.cadastrarPaciente(data);
      }
      modal.remove();
      const searchInput = document.getElementById('pesquisa-paciente') as HTMLInputElement;
      await carregarPacientes(searchInput.value);
    } catch {
      alert('Erro ao salvar paciente.');
    }
  });
}
