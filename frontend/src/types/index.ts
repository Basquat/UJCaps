export interface Usuario {
  id: number;
  nome: string;
  email: string;
  perfilId: number;
  perfilNome?: string;
  situacao: 'ativo' | 'inativo' | 'bloqueado';
  createdAt?: string;
}

export interface Perfil {
  id: number;
  nome: string;
  descricao?: string;
}

export interface Psicologo {
  id: number;
  usuarioId: number;
  nome: string;
  crm?: string;
  areaAtuacao?: string;
  telefone?: string;
  email?: string;
  situacao: 'ativo' | 'inativo';
}

export interface ClientePaciente {
  id: number;
  nome: string;
  dataNascimento?: string;
  telefone?: string;
  email?: string;
  endereco?: string;
  psicologoId?: number;
  psicologoNome?: string;
  situacao: 'ativo' | 'inativo';
  createdAt?: string;
}

export interface Vinculo {
  id: number;
  psicologoId: number;
  clienteId: number;
  dataVinculo: string;
}

export interface LogAcao {
  id: number;
  usuarioId: number;
  usuarioNome?: string;
  acao: string;
  entidade: string;
  entidadeId?: number;
  dataHora: string;
}

export interface LoginRequest {
  email: string;
  senha: string;
}

export interface LoginResponse {
  token: string;
  usuario: Usuario;
}

export interface ApiError {
  message: string;
  statusCode: number;
}
