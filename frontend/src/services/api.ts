import axios from 'axios';
import type { LoginRequest, LoginResponse, Usuario, Psicologo, Administrador, Consulta } from '@/types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('sessao');
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

export const authService = {
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const { data } = await api.post<LoginResponse>('/api/auth/login', credentials);
    return data;
  },

  async logout(): Promise<void> {
    await api.post('/api/auth/logout');
  },
};

export const usuarioService = {
  async listarUsuarios(): Promise<Usuario[]> {
    const { data } = await api.get<Usuario[]>('/api/usuarios');
    return data;
  },

  async cadastrarUsuario(usuario: Partial<Usuario> & { usuarioSenha: string }): Promise<Usuario> {
    const { data } = await api.post<Usuario>('/api/usuarios', usuario);
    return data;
  },

  async atualizarUsuario(usuarioID: string, usuario: Partial<Usuario>): Promise<Usuario> {
    const { data } = await api.patch<Usuario>(`/api/usuarios/${usuarioID}`, usuario);
    return data;
  },
};

export const psicologoService = {
  async listarPsicologos(): Promise<Psicologo[]> {
    const { data } = await api.get<Psicologo[]>('/api/psicologos');
    return data;
  },

  async cadastrarPsicologo(psicologo: Partial<Psicologo> & { psicologoSenha: string }): Promise<Psicologo> {
    const { data } = await api.post<Psicologo>('/api/psicologos', psicologo);
    return data;
  },

  async atualizarPsicologo(psicologoID: string, psicologo: Partial<Psicologo>): Promise<Psicologo> {
    const { data } = await api.patch<Psicologo>(`/api/psicologos/${psicologoID}`, psicologo);
    return data;
  },
};

export const administradorService = {
  async listarAdministradores(): Promise<Administrador[]> {
    const { data } = await api.get<Administrador[]>('/api/administradores');
    return data;
  },
};

export const consultaService = {
  async listarConsultas(): Promise<Consulta[]> {
    const { data } = await api.get<Consulta[]>('/api/consultas');
    return data;
  },

  async cadastrarConsulta(consulta: Pick<Consulta, 'usuarioID' | 'psicologoID' | 'dataConsulta'>): Promise<Consulta> {
    const { data } = await api.post<Consulta>('/api/consultas', consulta);
    return data;
  },

  async atualizarConsulta(consultaID: number, consulta: Partial<Consulta>): Promise<Consulta> {
    const { data } = await api.patch<Consulta>(`/api/consultas/${consultaID}`, consulta);
    return data;
  },
};
