import { authService } from './api';
import type { LoginRequest, LoginResponse, Sessao, Usuario, Psicologo, Administrador, Consulta } from '@/types';

const STORAGE_KEYS = {
  TOKEN: 'token',
  SESSAO: 'sessao',
  DEMO_ADMINS: 'ujcaps_demo_admins',
  DEMO_PSICOLOGOS: 'ujcaps_demo_psicologos',
  DEMO_USUARIOS: 'ujcaps_demo_usuarios',
  DEMO_CONSULTAS: 'ujcaps_demo_consultas',
};

function hashSenha(senha: string): string {
  let hash = 0;
  for (let i = 0; i < senha.length; i++) {
    const chr = senha.charCodeAt(i);
    hash = ((hash << 5) - hash) + chr;
    hash |= 0;
  }
  return String(Math.abs(hash));
}

function novoId(prefixo: string): string {
  return `${prefixo}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function somenteDigitos(valor: string): string {
  return valor.replace(/\D/g, '');
}

type DemoAdmin = Administrador & { adminSenha: string };
type DemoPsicologo = Psicologo & { psicologoSenha: string };
type DemoUsuario = Usuario & { usuarioSenha: string };

export function getDemoAdmins(): DemoAdmin[] {
  const raw = localStorage.getItem(STORAGE_KEYS.DEMO_ADMINS);
  return raw ? JSON.parse(raw) : [];
}

export function saveDemoAdmins(admins: DemoAdmin[]): void {
  localStorage.setItem(STORAGE_KEYS.DEMO_ADMINS, JSON.stringify(admins));
}

export function getDemoPsicologos(): DemoPsicologo[] {
  const raw = localStorage.getItem(STORAGE_KEYS.DEMO_PSICOLOGOS);
  return raw ? JSON.parse(raw) : [];
}

export function saveDemoPsicologos(psicologos: DemoPsicologo[]): void {
  localStorage.setItem(STORAGE_KEYS.DEMO_PSICOLOGOS, JSON.stringify(psicologos));
}

export function getDemoUsuarios(): DemoUsuario[] {
  const raw = localStorage.getItem(STORAGE_KEYS.DEMO_USUARIOS);
  return raw ? JSON.parse(raw) : [];
}

export function saveDemoUsuarios(usuarios: DemoUsuario[]): void {
  localStorage.setItem(STORAGE_KEYS.DEMO_USUARIOS, JSON.stringify(usuarios));
}

export function getDemoConsultas(): Consulta[] {
  const raw = localStorage.getItem(STORAGE_KEYS.DEMO_CONSULTAS);
  return raw ? JSON.parse(raw) : [];
}

export function saveDemoConsultas(consultas: Consulta[]): void {
  localStorage.setItem(STORAGE_KEYS.DEMO_CONSULTAS, JSON.stringify(consultas));
}

export function ensureDemoData(): void {
  if (!localStorage.getItem(STORAGE_KEYS.DEMO_ADMINS)) {
    saveDemoAdmins([
      {
        adminID: 'admin-mestre',
        adminNome: 'Admin Mestre',
        adminEmail: 'joaodan.lisboa@gmail.com',
        adminSenha: hashSenha('2905@'),
        dataCriacao: new Date().toISOString(),
      },
    ]);
  }
  if (!localStorage.getItem(STORAGE_KEYS.DEMO_PSICOLOGOS)) {
    saveDemoPsicologos([
      {
        psicologoID: 'psi-demo',
        psicologoCPF: '11122233344',
        psicologoNome: 'Psicólogo Demo',
        psicologoCEP: '01310100',
        psicologoSenha: hashSenha('psico123'),
        contaLiberada: true,
        dataAprovacao: new Date(Date.now() - 86400000).toISOString(),
        aprovadoADM: 'admin-mestre',
      },
    ]);
  }
  if (!localStorage.getItem(STORAGE_KEYS.DEMO_USUARIOS)) {
    saveDemoUsuarios([
      {
        usuarioID: 'usr-demo',
        usuarioCPF: '55566677788',
        usuarioNome: 'Paciente Demo',
        usuarioCEP: '01310100',
        usuarioSenha: hashSenha('pac123'),
        usuarioPago: true,
      },
    ]);
  }
  if (!localStorage.getItem(STORAGE_KEYS.DEMO_CONSULTAS)) {
    saveDemoConsultas([
      {
        consultaID: 1,
        usuarioID: 'usr-demo',
        psicologoID: 'psi-demo',
        dataConsulta: new Date(Date.now() + 3 * 86400000).toISOString(),
        statusConsulta: 'AGENDADA',
      },
    ]);
  }
}

export const auth = {
  getToken(): string | null {
    return localStorage.getItem(STORAGE_KEYS.TOKEN);
  },

  getSessao(): Sessao | null {
    const data = localStorage.getItem(STORAGE_KEYS.SESSAO);
    return data ? JSON.parse(data) : null;
  },

  isAuthenticated(): boolean {
    return !!this.getToken();
  },

  isAdmin(): boolean {
    return this.getSessao()?.tipo === 'administrador';
  },

  async login(credentials: LoginRequest): Promise<LoginResponse> {
    ensureDemoData();
    const identificador = credentials.identificador.trim();
    const senhaHash = hashSenha(credentials.senha);
    const ehEmail = identificador.includes('@');

    if (ehEmail) {
      const admins = getDemoAdmins();
      const admin = admins.find((a) => a.adminEmail.toLowerCase() === identificador.toLowerCase() && a.adminSenha === senhaHash);
      if (admin) {
        return this.abrirSessao({ tipo: 'administrador', id: admin.adminID, nome: admin.adminNome });
      }
    } else {
      const cpf = somenteDigitos(identificador);

      const psicologos = getDemoPsicologos();
      const psicologo = psicologos.find((p) => p.psicologoCPF === cpf && p.psicologoSenha === senhaHash);
      if (psicologo) {
        if (!psicologo.contaLiberada) {
          throw new Error('Seu cadastro ainda não foi autorizado pelo administrador.');
        }
        return this.abrirSessao({ tipo: 'psicologo', id: psicologo.psicologoID, nome: psicologo.psicologoNome });
      }

      const usuarios = getDemoUsuarios();
      const usuario = usuarios.find((u) => u.usuarioCPF === cpf && u.usuarioSenha === senhaHash);
      if (usuario) {
        return this.abrirSessao({ tipo: 'usuario', id: usuario.usuarioID, nome: usuario.usuarioNome });
      }
    }

    return authService.login(credentials);
  },

  abrirSessao(sessao: Sessao): LoginResponse {
    const token = btoa(`${sessao.tipo}:${sessao.id}:${Date.now()}`);
    localStorage.setItem(STORAGE_KEYS.TOKEN, token);
    localStorage.setItem(STORAGE_KEYS.SESSAO, JSON.stringify(sessao));
    return { token, sessao };
  },

  async cadastrarDemo(dados: { nome: string; cpf: string; cep: string; senha: string; perfil: 'psicologo' | 'usuario' }): Promise<void> {
    ensureDemoData();
    const cpf = somenteDigitos(dados.cpf);

    if (dados.perfil === 'psicologo') {
      const psicologos = getDemoPsicologos();
      if (psicologos.some((p) => p.psicologoCPF === cpf)) {
        throw new Error('CPF já cadastrado.');
      }
      // Todo psicólogo entra com contaLiberada = false: precisa da aprovação
      // do administrador mestre antes do primeiro login (aprovadoADM/dataAprovacao
      // só são preenchidos nesse momento).
      psicologos.push({
        psicologoID: novoId('psi'),
        psicologoCPF: cpf,
        psicologoNome: dados.nome,
        psicologoCEP: somenteDigitos(dados.cep),
        psicologoSenha: hashSenha(dados.senha),
        contaLiberada: false,
        dataAprovacao: null,
        aprovadoADM: null,
      });
      saveDemoPsicologos(psicologos);
      return;
    }

    const usuarios = getDemoUsuarios();
    if (usuarios.some((u) => u.usuarioCPF === cpf)) {
      throw new Error('CPF já cadastrado.');
    }
    usuarios.push({
      usuarioID: novoId('usr'),
      usuarioCPF: cpf,
      usuarioNome: dados.nome,
      usuarioCEP: somenteDigitos(dados.cep),
      usuarioSenha: hashSenha(dados.senha),
      usuarioPago: true,
    });
    saveDemoUsuarios(usuarios);
  },

  async logout(): Promise<void> {
    try {
      await authService.logout();
    } catch {
      // Sem back-end disponível (modo demo): a sessão local ainda deve ser encerrada.
    }
    localStorage.removeItem(STORAGE_KEYS.TOKEN);
    localStorage.removeItem(STORAGE_KEYS.SESSAO);
  },
};
