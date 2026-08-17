import { auth } from '@/services/auth';
import { renderLogin } from '@/pages/Login';

function init(): void {
  if (auth.isAuthenticated()) {
    const usuario = auth.getUsuario();
    if (usuario) {
      const perfil = usuario.perfilNome?.toLowerCase() || '';
      if (perfil === 'administrador') {
        import('./pages/AdminDashboard').then((m) => m.renderAdminDashboard(usuario));
      } else if (perfil === 'psicólogo' || perfil === 'psicologo') {
        import('./pages/PsychologistDashboard').then((m) => m.renderPsychologistDashboard(usuario));
      } else {
        renderLogin();
      }
    } else {
      renderLogin();
    }
  } else {
    renderLogin();
  }
}

init();
