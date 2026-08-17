import axios from 'axios';
import type { LoginRequest, LoginResponse, Usuario, Psicologo, ClientePaciente, LogAcao } from '@/types';

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
      localStorage.removeItem('usuario');
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
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
  },
};

export const userService = {
  async listarUsuarios(): Promise<Usuario[]> {
    const { data } = await api.get<Usuario[]>('/api/users');
    return data;
  },

  async cadastrarUsuario(usuario: Partial<Usuario> & { senha: string }): Promise<Usuario> {
    const { data } = await api.post<Usuario>('/api/users', usuario);
    return data;
  },

  async atualizarUsuario(id: number, usuario: Partial<Usuario>): Promise<Usuario> {
    const { data } = await api.patch<Usuario>(`/api/users/${id}`, usuario);
    return data;
  },
};

export const psychologistService = {
  async listarPsicologos(): Promise<Psicologo[]> {
    const { data } = await api.get<Psicologo[]>('/api/psychologists');
    return data;
  },

  async cadastrarPsicologo(psicologo: Partial<Psicologo>): Promise<Psicologo> {
    const { data } = await api.post<Psicologo>('/api/psychologists', psicologo);
    return data;
  },
};

export const patientService = {
  async listarPacientes(): Promise<ClientePaciente[]> {
    const { data } = await api.get<ClientePaciente[]>('/api/patients');
    return data;
  },

  async buscarPaciente(id: number): Promise<ClientePaciente> {
    const { data } = await api.get<ClientePaciente>(`/api/patients/${id}`);
    return data;
  },

  async cadastrarPaciente(paciente: Partial<ClientePaciente>): Promise<ClientePaciente> {
    const { data } = await api.post<ClientePaciente>('/api/patients', paciente);
    return data;
  },

  async atualizarPaciente(id: number, paciente: Partial<ClientePaciente>): Promise<ClientePaciente> {
    const { data } = await api.patch<ClientePaciente>(`/api/patients/${id}`, paciente);
    return data;
  },
};

export const auditService = {
  async listarLogs(): Promise<LogAcao[]> {
    const { data } = await api.get<LogAcao[]>('/api/audit-logs');
    return data;
  },
};
