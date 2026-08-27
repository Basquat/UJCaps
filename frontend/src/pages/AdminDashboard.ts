import {
  auth,
  getDemoPsicologos,
  saveDemoPsicologos,
  getDemoUsuarios,
  saveDemoUsuarios,
  getDemoConsultas,
} from '@/services/auth';
import { usuarioService, psicologoService, consultaService } from '@/services/api';
import type { Sessao, Usuario, Psicologo, Consulta } from '@/types';

function formatarCPF(cpf: string): string {
  const d = cpf.replace(/\D/g, '');
  if (d.length !== 11) return cpf;
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
}

export async function renderAdminDashboard(sessao: Sessao): Promise<void> {
  document.getElementById('page-login')!.style.display = 'none';
  document.getElementById('page-psychologist')!.style.display = 'none';
  const adminPage = document.getElementById('page-admin')!;
  adminPage.style.display = 'block';

  const navbar = document.getElementById('navbar') as HTMLElement;
  navbar.style.display = 'flex';
  document.getElementById('nav-user-name')!.textContent = `${sessao.nome} (Administrador)`;

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
        <h2 class="section-title" style="margin-bottom: 0;">Psicólogos</h2>
      </div>

      <div id="psicologos-container" class="table-container" style="margin-bottom: 2rem;">
        <p style="padding: 1rem; color: var(--text-dim);">Carregando psicólogos...</p>
      </div>

      <div class="header-actions">
        <h2 class="section-title" style="margin-bottom: 0;">Usuários (Pacientes)</h2>
      </div>

      <div id="usuarios-container" class="table-container">
        <p style="padding: 1rem; color: var(--text-dim);">Carregando usuários...</p>
      </div>
    </div>
  `;

  await carregarEstatisticas();
  await carregarPsicologos();
  await carregarUsuarios();
}

async function carregarEstatisticas(): Promise<void> {
  const container = document.getElementById('stats-container')!;
  try {
    const [usuarios, psicologos, consultas] = await Promise.all([
      usuarioService.listarUsuarios(),
      psicologoService.listarPsicologos(),
      consultaService.listarConsultas(),
    ]);
    renderStats(container, usuarios, psicologos, consultas);
  } catch {
    renderStats(container, getDemoUsuarios(), getDemoPsicologos(), getDemoConsultas());
  }
}

function renderStats(container: HTMLElement, usuarios: Usuario[], psicologos: Psicologo[], consultas: Consulta[]): void {
  const liberados = psicologos.filter((p) => p.contaLiberada).length;
  const pendentes = psicologos.length - liberados;
  const pagos = usuarios.filter((u) => u.usuarioPago).length;

  container.innerHTML = `
    <div class="stat-card">
      <h3>Usuários (Pacientes)</h3>
      <div class="stat-value">${usuarios.length}</div>
      <p style="color: var(--text-dim); font-size: 0.8125rem; margin-top: 0.25rem;">
        ${pagos} com pagamento em dia
      </p>
    </div>
    <div class="stat-card">
      <h3>Psicólogos</h3>
      <div class="stat-value">${psicologos.length}</div>
      <p style="color: var(--text-dim); font-size: 0.8125rem; margin-top: 0.25rem;">
        ${liberados} liberados, ${pendentes} pendentes
      </p>
    </div>
    <div class="stat-card">
      <h3>Consultas</h3>
      <div class="stat-value">${consultas.length}</div>
      <p style="color: var(--text-dim); font-size: 0.8125rem; margin-top: 0.25rem;">
        Registros de agendamento
      </p>
    </div>
  `;
}

async function carregarPsicologos(): Promise<void> {
  const container = document.getElementById('psicologos-container')!;

  let psicologos: Psicologo[];
  let usandoDemo = false;
  try {
    psicologos = await psicologoService.listarPsicologos();
  } catch {
    psicologos = getDemoPsicologos();
    usandoDemo = true;
  }

  let consultas: Consulta[];
  try {
    consultas = usandoDemo ? getDemoConsultas() : await consultaService.listarConsultas();
  } catch {
    consultas = getDemoConsultas();
  }

  if (psicologos.length === 0) {
    container.innerHTML = '<p style="padding: 1rem; color: var(--text-dim);">Nenhum psicólogo cadastrado.</p>';
    return;
  }

  const rows = psicologos
    .map((p) => {
      const totalConsultas = consultas.filter((c) => c.psicologoID === p.psicologoID).length;
      return `
        <tr>
          <td>${p.psicologoNome}</td>
          <td>${formatarCPF(p.psicologoCPF)}</td>
          <td>${totalConsultas}</td>
          <td><span class="badge badge-${p.contaLiberada ? 'success' : 'warning'}">${p.contaLiberada ? 'liberada' : 'pendente'}</span></td>
          <td>
            <button class="btn btn-sm btn-secondary btn-ver-detalhes" data-id="${p.psicologoID}">Ver detalhes</button>
            ${!p.contaLiberada ? `<button class="btn btn-sm btn-success btn-autorizar" data-id="${p.psicologoID}">Autorizar</button>` : ''}
            ${p.contaLiberada ? `<button class="btn btn-sm btn-danger btn-bloquear" data-id="${p.psicologoID}">Bloquear</button>` : ''}
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
          <th>CPF</th>
          <th>Consultas</th>
          <th>Conta</th>
          <th>Ações</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  `;

  container.querySelectorAll('.btn-ver-detalhes').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = (btn as HTMLElement).dataset.id!;
      const psicologo = psicologos.find((p) => p.psicologoID === id);
      if (psicologo) abrirDetalhesPsicologo(psicologo, consultas, usandoDemo);
    });
  });

  container.querySelectorAll('.btn-autorizar').forEach((btn) => {
    btn.addEventListener('click', () => alterarContaPsicologo((btn as HTMLElement).dataset.id!, true, usandoDemo));
  });

  container.querySelectorAll('.btn-bloquear').forEach((btn) => {
    btn.addEventListener('click', () => alterarContaPsicologo((btn as HTMLElement).dataset.id!, false, usandoDemo));
  });
}

async function alterarContaPsicologo(psicologoID: string, liberar: boolean, usandoDemo: boolean): Promise<void> {
  if (!usandoDemo) {
    try {
      const admin = auth.getSessao();
      await psicologoService.atualizarPsicologo(psicologoID, {
        contaLiberada: liberar,
        dataAprovacao: liberar ? new Date().toISOString() : null,
        aprovadoADM: liberar ? admin?.id : null,
      });
      await carregarPsicologos();
      await carregarEstatisticas();
      return;
    } catch {
      alert('Erro ao atualizar situação do psicólogo.');
      return;
    }
  }

  const psicologos = getDemoPsicologos();
  const idx = psicologos.findIndex((p) => p.psicologoID === psicologoID);
  if (idx === -1) return;
  const admin = auth.getSessao();
  psicologos[idx].contaLiberada = liberar;
  psicologos[idx].dataAprovacao = liberar ? new Date().toISOString() : null;
  psicologos[idx].aprovadoADM = liberar ? admin?.id ?? null : null;
  saveDemoPsicologos(psicologos);

  await carregarPsicologos();
  await carregarEstatisticas();
}

async function abrirDetalhesPsicologo(psicologo: Psicologo, consultas: Consulta[], usandoDemo: boolean): Promise<void> {
  const minhasConsultas = consultas.filter((c) => c.psicologoID === psicologo.psicologoID);

  let usuarios: Usuario[];
  try {
    usuarios = usandoDemo ? getDemoUsuarios() : await usuarioService.listarUsuarios();
  } catch {
    usuarios = getDemoUsuarios();
  }

  const modal = document.createElement('div');
  modal.id = 'modal-detalhes-psicologo';
  modal.style.cssText = 'position: fixed; inset: 0; background: rgba(0,0,0,0.7); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 1.5rem;';

  const consultasRows = minhasConsultas.length
    ? minhasConsultas
        .map((c) => {
          const paciente = usuarios.find((u) => u.usuarioID === c.usuarioID);
          return `
        <tr>
          <td>${paciente?.usuarioNome || c.usuarioID}</td>
          <td>${new Date(c.dataConsulta).toLocaleString('pt-BR')}</td>
          <td><span class="badge badge-${c.statusConsulta === 'AGENDADA' ? 'success' : c.statusConsulta === 'CANCELADA' ? 'danger' : 'warning'}">${c.statusConsulta}</span></td>
        </tr>
      `;
        })
        .join('')
    : '<tr><td colspan="3" style="color: var(--text-dim);">Nenhuma consulta registrada.</td></tr>';

  modal.innerHTML = `
    <div class="card" style="max-width: 720px; max-height: 85vh; overflow-y: auto;">
      <h2 style="margin-bottom: 0.25rem;">${psicologo.psicologoNome}</h2>
      <p style="color: var(--text-faint); font-size: 0.8125rem; text-transform: uppercase; letter-spacing: 0.04em; margin-bottom: 1.5rem;">
        CPF ${formatarCPF(psicologo.psicologoCPF)} · CEP ${psicologo.psicologoCEP}
      </p>

      <div class="dashboard-grid" style="margin-bottom: 1.5rem;">
        <div class="stat-card">
          <h3>Situação da conta</h3>
          <div class="stat-value" style="font-size: 1.1rem;">${psicologo.contaLiberada ? 'Liberada' : 'Pendente'}</div>
        </div>
        <div class="stat-card">
          <h3>Aprovada em</h3>
          <div class="stat-value" style="font-size: 1.1rem;">${psicologo.dataAprovacao ? new Date(psicologo.dataAprovacao).toLocaleDateString('pt-BR') : '-'}</div>
        </div>
      </div>

      <h3 class="section-title" style="font-size: 0.9375rem;">Consultas (pontos marcados)</h3>
      <div class="table-container">
        <table>
          <thead><tr><th>Paciente</th><th>Data/Hora</th><th>Status</th></tr></thead>
          <tbody>${consultasRows}</tbody>
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

async function carregarUsuarios(): Promise<void> {
  const container = document.getElementById('usuarios-container')!;

  let usuarios: Usuario[];
  let usandoDemo = false;
  try {
    usuarios = await usuarioService.listarUsuarios();
  } catch {
    usuarios = getDemoUsuarios();
    usandoDemo = true;
  }

  if (usuarios.length === 0) {
    container.innerHTML = '<p style="padding: 1rem; color: var(--text-dim);">Nenhum usuário cadastrado.</p>';
    return;
  }

  const rows = usuarios
    .map(
      (u) => `
        <tr>
          <td>${u.usuarioNome}</td>
          <td>${formatarCPF(u.usuarioCPF)}</td>
          <td>${u.usuarioCEP}</td>
          <td><span class="badge badge-${u.usuarioPago ? 'success' : 'danger'}">${u.usuarioPago ? 'pago' : 'pendente'}</span></td>
          <td>
            <button class="btn btn-sm btn-secondary btn-alternar-pagamento" data-id="${u.usuarioID}">${u.usuarioPago ? 'Marcar pendente' : 'Marcar pago'}</button>
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
          <th>CPF</th>
          <th>CEP</th>
          <th>Pagamento</th>
          <th>Ações</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  `;

  container.querySelectorAll('.btn-alternar-pagamento').forEach((btn) => {
    btn.addEventListener('click', () => alternarPagamento((btn as HTMLElement).dataset.id!, usandoDemo));
  });
}

async function alternarPagamento(usuarioID: string, usandoDemo: boolean): Promise<void> {
  if (!usandoDemo) {
    try {
      const usuarios = await usuarioService.listarUsuarios();
      const atual = usuarios.find((u) => u.usuarioID === usuarioID);
      if (!atual) return;
      await usuarioService.atualizarUsuario(usuarioID, { usuarioPago: !atual.usuarioPago });
      await carregarUsuarios();
      await carregarEstatisticas();
      return;
    } catch {
      alert('Erro ao atualizar situação de pagamento.');
      return;
    }
  }

  const usuarios = getDemoUsuarios();
  const idx = usuarios.findIndex((u) => u.usuarioID === usuarioID);
  if (idx === -1) return;
  usuarios[idx].usuarioPago = !usuarios[idx].usuarioPago;
  saveDemoUsuarios(usuarios);

  await carregarUsuarios();
  await carregarEstatisticas();
}
