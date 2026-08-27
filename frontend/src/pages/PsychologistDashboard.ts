import { auth, getDemoUsuarios, getDemoConsultas, saveDemoConsultas } from '@/services/auth';
import { usuarioService, consultaService } from '@/services/api';
import type { Sessao, Usuario, Consulta } from '@/types';

export async function renderPsychologistDashboard(sessao: Sessao): Promise<void> {
  document.getElementById('page-login')!.style.display = 'none';
  document.getElementById('page-admin')!.style.display = 'none';
  const psychologistPage = document.getElementById('page-psychologist')!;
  psychologistPage.style.display = 'block';

  const navbar = document.getElementById('navbar') as HTMLElement;
  navbar.style.display = 'flex';
  document.getElementById('nav-user-name')!.textContent = `${sessao.nome} (Psicólogo)`;

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
        <h2 class="section-title" style="margin-bottom: 0;">Minhas Consultas</h2>
        <button id="btn-nova-consulta" class="btn btn-primary">Marcar Consulta</button>
      </div>

      <div class="form-group" style="max-width: 300px;">
        <input type="text" id="pesquisa-paciente" placeholder="Pesquisar por paciente..." />
      </div>

      <div id="consultas-container" class="table-container">
        <p style="padding: 1rem; color: var(--text-dim);">Carregando consultas...</p>
      </div>
    </div>
  `;

  document.getElementById('btn-nova-consulta')!.addEventListener('click', () => {
    abrirNovaConsultaModal(sessao);
  });

  const searchInput = document.getElementById('pesquisa-paciente') as HTMLInputElement;
  searchInput.addEventListener('input', () => {
    carregarConsultas(sessao, searchInput.value);
  });

  await carregarEstatisticas(sessao);
  await carregarConsultas(sessao);
}

async function carregarEstatisticas(sessao: Sessao): Promise<void> {
  const container = document.getElementById('stats-container')!;

  let consultas: Consulta[];
  try {
    consultas = await consultaService.listarConsultas();
  } catch {
    consultas = getDemoConsultas();
  }

  const minhas = consultas.filter((c) => c.psicologoID === sessao.id);
  const agendadas = minhas.filter((c) => c.statusConsulta === 'AGENDADA').length;
  const pacientesUnicos = new Set(minhas.map((c) => c.usuarioID)).size;

  container.innerHTML = `
    <div class="stat-card">
      <h3>Consultas</h3>
      <div class="stat-value">${minhas.length}</div>
      <p style="color: var(--text-dim); font-size: 0.8125rem; margin-top: 0.25rem;">
        ${agendadas} agendadas
      </p>
    </div>
    <div class="stat-card">
      <h3>Pacientes atendidos</h3>
      <div class="stat-value">${pacientesUnicos}</div>
      <p style="color: var(--text-dim); font-size: 0.8125rem; margin-top: 0.25rem;">
        Pacientes distintos com consulta registrada
      </p>
    </div>
  `;
}

async function carregarConsultas(sessao: Sessao, filtro?: string): Promise<void> {
  const container = document.getElementById('consultas-container')!;

  let consultas: Consulta[];
  let usandoDemo = false;
  try {
    consultas = await consultaService.listarConsultas();
  } catch {
    consultas = getDemoConsultas();
    usandoDemo = true;
  }

  let usuarios: Usuario[];
  try {
    usuarios = usandoDemo ? getDemoUsuarios() : await usuarioService.listarUsuarios();
  } catch {
    usuarios = getDemoUsuarios();
  }

  let minhas = consultas
    .filter((c) => c.psicologoID === sessao.id)
    .sort((a, b) => new Date(b.dataConsulta).getTime() - new Date(a.dataConsulta).getTime());

  if (filtro) {
    const termo = filtro.toLowerCase();
    minhas = minhas.filter((c) => {
      const paciente = usuarios.find((u) => u.usuarioID === c.usuarioID);
      return paciente?.usuarioNome.toLowerCase().includes(termo);
    });
  }

  if (minhas.length === 0) {
    container.innerHTML = '<p style="padding: 1rem; color: var(--text-dim);">Nenhuma consulta encontrada.</p>';
    return;
  }

  const rows = minhas
    .map((c) => {
      const paciente = usuarios.find((u) => u.usuarioID === c.usuarioID);
      return `
        <tr>
          <td>${paciente?.usuarioNome || c.usuarioID}</td>
          <td>${new Date(c.dataConsulta).toLocaleString('pt-BR')}</td>
          <td><span class="badge badge-${c.statusConsulta === 'AGENDADA' ? 'success' : c.statusConsulta === 'CANCELADA' ? 'danger' : 'warning'}">${c.statusConsulta}</span></td>
          <td>
            ${c.statusConsulta === 'AGENDADA' ? `<button class="btn btn-sm btn-secondary btn-concluir" data-id="${c.consultaID}">Concluir</button>
            <button class="btn btn-sm btn-danger btn-cancelar" data-id="${c.consultaID}">Cancelar</button>` : ''}
          </td>
        </tr>
      `;
    })
    .join('');

  container.innerHTML = `
    <table>
      <thead>
        <tr>
          <th>Paciente</th>
          <th>Data/Hora</th>
          <th>Status</th>
          <th>Ações</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  `;

  container.querySelectorAll('.btn-concluir').forEach((btn) => {
    btn.addEventListener('click', () => atualizarStatusConsulta(Number((btn as HTMLElement).dataset.id), 'REALIZADA', sessao, usandoDemo));
  });

  container.querySelectorAll('.btn-cancelar').forEach((btn) => {
    btn.addEventListener('click', () => atualizarStatusConsulta(Number((btn as HTMLElement).dataset.id), 'CANCELADA', sessao, usandoDemo));
  });
}

async function atualizarStatusConsulta(consultaID: number, status: string, sessao: Sessao, usandoDemo: boolean): Promise<void> {
  if (!usandoDemo) {
    try {
      await consultaService.atualizarConsulta(consultaID, { statusConsulta: status });
      await carregarConsultas(sessao);
      await carregarEstatisticas(sessao);
      return;
    } catch {
      alert('Erro ao atualizar consulta.');
      return;
    }
  }

  const consultas = getDemoConsultas();
  const idx = consultas.findIndex((c) => c.consultaID === consultaID);
  if (idx === -1) return;
  consultas[idx].statusConsulta = status;
  saveDemoConsultas(consultas);
  await carregarConsultas(sessao);
  await carregarEstatisticas(sessao);
}

function abrirNovaConsultaModal(sessao: Sessao): void {
  const modal = document.createElement('div');
  modal.id = 'modal-consulta';
  modal.style.cssText = 'position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000;';

  const usuarios = getDemoUsuarios();
  const opcoesPacientes = usuarios.map((u) => `<option value="${u.usuarioID}">${u.usuarioNome}</option>`).join('');

  modal.innerHTML = `
    <div class="card" style="max-width: 500px;">
      <h2 style="margin-bottom: 1.5rem;">Marcar Consulta</h2>
      <form id="consulta-form">
        <div class="form-group">
          <label for="usuarioID">Paciente</label>
          <select id="usuarioID" name="usuarioID" required>${opcoesPacientes}</select>
        </div>
        <div class="form-group">
          <label for="dataConsulta">Data e hora</label>
          <input type="datetime-local" id="dataConsulta" name="dataConsulta" required />
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

  modal.querySelector('#consulta-form')!.addEventListener('submit', async (e) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const usuarioID = (form.elements.namedItem('usuarioID') as HTMLSelectElement).value;
    const dataConsulta = (form.elements.namedItem('dataConsulta') as HTMLInputElement).value;

    try {
      await consultaService.cadastrarConsulta({ usuarioID, psicologoID: sessao.id, dataConsulta: new Date(dataConsulta).toISOString() });
    } catch {
      const consultas = getDemoConsultas();
      consultas.push({
        consultaID: consultas.length ? Math.max(...consultas.map((c) => c.consultaID)) + 1 : 1,
        usuarioID,
        psicologoID: sessao.id,
        dataConsulta: new Date(dataConsulta).toISOString(),
        statusConsulta: 'AGENDADA',
      });
      saveDemoConsultas(consultas);
    }

    modal.remove();
    await carregarConsultas(sessao);
    await carregarEstatisticas(sessao);
  });
}
