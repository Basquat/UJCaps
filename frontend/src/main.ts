import { auth } from '@/services/auth';
import { renderLogin } from '@/pages/Login';

function init(): void {
  const sessao = auth.isAuthenticated() ? auth.getSessao() : null;

  if (!sessao) {
    renderLogin();
    return;
  }

  if (sessao.tipo === 'administrador') {
    import('./pages/AdminDashboard').then((m) => m.renderAdminDashboard(sessao));
  } else if (sessao.tipo === 'psicologo') {
    import('./pages/PsychologistDashboard').then((m) => m.renderPsychologistDashboard(sessao));
  } else {
    renderLogin();
  }
}

init();
