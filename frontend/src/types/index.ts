export interface Administrador {
  adminID: string;
  adminNome: string;
  adminEmail: string;
  dataCriacao?: string;
}

export interface Psicologo {
  psicologoID: string;
  psicologoCPF: string;
  psicologoNome: string;
  psicologoCEP: string;
  contaLiberada: boolean;
  dataAprovacao?: string | null;
  aprovadoADM?: string | null;
}

export interface Usuario {
  usuarioID: string;
  usuarioCPF: string;
  usuarioNome: string;
  usuarioCEP: string;
  usuarioPago: boolean;
}

export interface Consulta {
  consultaID: number;
  usuarioID: string;
  psicologoID: string;
  dataConsulta: string;
  statusConsulta: string;
}

export type TipoConta = 'administrador' | 'psicologo' | 'usuario';

export interface Sessao {
  tipo: TipoConta;
  id: string;
  nome: string;
}

export interface LoginRequest {
  identificador: string;
  senha: string;
}

export interface LoginResponse {
  token: string;
  sessao: Sessao;
}

export interface ApiError {
  message: string;
  statusCode: number;
}
