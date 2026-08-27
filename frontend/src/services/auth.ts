import { authService } from './api';
import type { LoginRequest, LoginResponse, Usuario, ClientePaciente } from '@/types';

const STORAGE_KEYS = {
  TOKEN: 'token',
  USUARIO: 'usuario',
  DEMO_USERS: 'psico_demo_users',
  DEMO_PATIENTS: 'psico_demo_patients',
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

export type DemoUser = { id: number; nome: string; email: string; senha: string; perfilNome: string; situacao: Usuario['situacao'] };

export function perfilIdFromNome(perfilNome: string): number {
  return perfilNome.toLowerCase() === 'administrador' ? 1 : 2;
}

export function getDemoUsers(): DemoUser[] {
  const raw = localStorage.getItem(STORAGE_KEYS.DEMO_USERS);
  return raw ? JSON.parse(raw) : [];
}

export function saveDemoUsers(users: DemoUser[]): void {
  localStorage.setItem(STORAGE_KEYS.DEMO_USERS, JSON.stringify(users));
}

function getDemoPatients(): ClientePaciente[] {
  const raw = localStorage.getItem(STORAGE_KEYS.DEMO_PATIENTS);
  return raw ? JSON.parse(raw) : [];
}

function saveDemoPatients(patients: ClientePaciente[]): void {
  localStorage.setItem(STORAGE_KEYS.DEMO_PATIENTS, JSON.stringify(patients));
}

function ensureDemoData(): void {
  if (!localStorage.getItem(STORAGE_KEYS.DEMO_USERS)) {
    saveDemoUsers([
      { id: 1, nome: 'Admin Demo', email: 'admin@demo.com', senha: hashSenha('admin123'), perfilNome: 'Administrador', situacao: 'ativo' },
      { id: 2, nome: 'Psicólogo Demo', email: 'psicologo@demo.com', senha: hashSenha('psicologo123'), perfilNome: 'Psicólogo', situacao: 'ativo' },
    ]);
  }
  if (!localStorage.getItem(STORAGE_KEYS.DEMO_PATIENTS)) {
    saveDemoPatients([
      { id: 1, nome: 'Paciente Demo', telefone: '(11) 99999-9999', dataNascimento: '1990-01-01', email: 'paciente@demo.com', situacao: 'ativo', psicologoId: 2 },
    ]);
  }
}

export const auth = {
  getToken(): string | null {
    return localStorage.getItem(STORAGE_KEYS.TOKEN);
  },

  getUsuario(): Usuario | null {
    const data = localStorage.getItem(STORAGE_KEYS.USUARIO);
    return data ? JSON.parse(data) : null;
  },

  isAuthenticated(): boolean {
    return !!this.getToken();
  },

  isAdmin(): boolean {
    const usuario = this.getUsuario();
    return usuario?.perfilNome?.toLowerCase() === 'administrador';
  },

  async login(credentials: LoginRequest): Promise<LoginResponse> {
    ensureDemoData();
    const users = getDemoUsers();
    const user = users.find((u) => u.email === credentials.email && u.senha === hashSenha(credentials.senha));
    if (!user) {
      const response = await authService.login(credentials);
      return response;
    }

    // Verificação de autorização: mesmo com credenciais válidas, o acesso só é
    // concedido se o cadastro estiver autorizado (situacao === 'ativo').
    // Esta checagem é o ponto central de autenticação usado por toda a aplicação
    // (Login.ts sempre passa por auth.login), portanto não pode ser contornada
    // alterando apenas o front-end.
    if (user.situacao === 'pendente') {
      throw new Error('Seu cadastro ainda não foi autorizado pelo administrador.');
    }
    if (user.situacao === 'bloqueado' || user.situacao === 'inativo') {
      throw new Error('Seu acesso está bloqueado. Entre em contato com o administrador.');
    }

    const token = btoa(`${user.id}:${Date.now()}`);
    const usuario: Usuario = { id: user.id, nome: user.nome, email: user.email, perfilId: perfilIdFromNome(user.perfilNome), perfilNome: user.perfilNome, situacao: user.situacao };
    localStorage.setItem(STORAGE_KEYS.TOKEN, token);
    localStorage.setItem(STORAGE_KEYS.USUARIO, JSON.stringify(usuario));
    return { token, usuario };
  },

  async cadastrarDemo(dados: { nome: string; email: string; senha: string; perfilNome: string }): Promise<Usuario> {
    ensureDemoData();
    const users = getDemoUsers();
    if (users.some((u) => u.email === dados.email)) {
      throw new Error('E-mail já cadastrado.');
    }
    // Todo novo cadastro entra como "pendente", independente do perfil escolhido.
    // Isso impede que um usuário obtenha acesso (inclusive como Administrador)
    // apenas por possuir e-mail e senha válidos: é sempre necessária a
    // autorização do Administrador Mestre antes do primeiro login.
    const newUser: DemoUser = {
      id: users.length ? Math.max(...users.map((u) => u.id)) + 1 : 1,
      nome: dados.nome,
      email: dados.email,
      senha: hashSenha(dados.senha),
      perfilNome: dados.perfilNome,
      situacao: 'pendente',
    };
    users.push(newUser);
    saveDemoUsers(users);

    // Nenhuma sessão é criada aqui: cadastro não concede login automático.
    const usuario: Usuario = { id: newUser.id, nome: newUser.nome, email: newUser.email, perfilId: perfilIdFromNome(newUser.perfilNome), perfilNome: newUser.perfilNome, situacao: newUser.situacao };
    return usuario;
  },

  async logout(): Promise<void> {
    await authService.logout();
  },
};
