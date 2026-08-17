# Memorias do Projeto - PsicoGest

## 1. Leitura e Analise do Documento AV3-UJ

**Data:** 2026-08-17
**Documento analisado:** AV3-UJ.docx (conteudo salvo em AV3-UJ.txt)

### 1.1 Resumo do Projeto

Projeto acadêmico AV3 (Avaliacao 3) da disciplina de Desenvolvimento. O objetivo é criar uma **plataforma web de gestao para profissionais de Psicologia** com front-end, back-end em TypeScript e banco de dados MySQL.

**Nome do produto:** PsicoGest - Gestao para Profissionais de Psicologia

### 1.2 Requisitos Obrigatorios

- **Front-end:** Aplicacao web responsiva com HTML, CSS e TypeScript
- **Back-end:** Node.js com TypeScript, API REST
- **Banco de dados:** MySQL com modelagem relacional
- **Seguranca:** Autenticacao, autorizacao, hash de senha
- **Perfis de acesso:** Administrador, Psicologo (e opcionalmente Atendente)

### 1.3 Entidades do Banco de Dados (Minimo)

1. `usuarios` - Credenciais, nome, e-mail, situacao e vinculo com perfil
2. `perfis` - Administrador, psicologo e outros perfis
3. `psicologos` - Dados profissionais e area de atuacao
4. `clientes_pacientes` - Dados administrativos dos clientes/pacientes
5. `vinculos` - Associacao entre psicologo e cliente/paciente
6. `logs_acoes` - Registro de operacoes relevantes
7. `entidade_inovacao` - Tabela para funcionalidade inovadora

### 1.4 Rotas da API (Minimo Sugerido)

- `POST /api/auth/login` - Autenticar usuario
- `POST /api/auth/logout` - Encerrar sessao
- `GET /api/users` - Listar usuarios (admin)
- `POST /api/users` - Cadastrar usuario (admin)
- `PATCH /api/users/:id` - Atualizar usuario
- `GET /api/psychologists` - Listar psicologos
- `POST /api/psychologists` - Cadastrar psicologo
- `GET /api/patients` - Listar pacientes
- `POST /api/patients` - Cadastrar paciente
- `GET /api/patients/:id` - Consultar paciente
- `PATCH /api/patients/:id` - Atualizar paciente
- `GET /api/audit-logs` - Consultar logs de auditoria

### 1.5 Regras de Negocio Essenciais

1. Somente usuario autenticado acessa paginas internas
2. Somente administrador pode ativar/bloquear/liberar usuarios
3. Nenhum usuario pode elevar a propria permissao
4. Senhas nunca exibidas ou armazenadas em texto puro
5. Psicologos veem apenas informacoes permitidas
6. Autorizacao validada no back-end
7. Preferir inativacao a exclusao
8. Validacao antes da gravacao no MySQL
9. Erros sem detalhes internos ou credenciais
10. Dados de demonstracao sao ficticios

---

## 2. Estrutura do Front-end Criada

**Data de criacao:** 2026-08-17
**Diretorio:** `/home/basquat/Documentos/ProjetoTypeScript/frontend/`

### 2.1 Tecnologias Utilizadas

- **TypeScript** - Tipagem estatica
- **Vite** - Build tool e dev server
- **Axios** - Cliente HTTP para consumo da API
- **CSS puro** - Estilos globais com variaveis CSS

### 2.2 Estrutura de Diretorios

```
frontend/
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
└── src/
    ├── main.ts                    # Ponto de entrada da aplicacao
    ├── types/
    │   └── index.ts               # Interfaces TypeScript do projeto
    ├── services/
    │   ├── api.ts                 # Servicos de comunicacao com API
    │   └── auth.ts                # Servico de autenticacao
    ├── pages/
    │   ├── Login.ts               # Tela de login
    │   ├── AdminDashboard.ts      # Painel do administrador
    │   └── PsychologistDashboard.ts # Painel do psicologo
    └── styles/
        └── global.css             # Estilos globais da aplicacao
```

### 2.3 Decisoes de Arquitetura

1. **SPA (Single Page Application):** Navegacao entre telas sem recarregar a pagina, usando modulos ES dinamicos.
2. **Servicos separados:** Camada de servicos (`services/`) isola a logica de comunicacao com a API.
3. **Tipagem forte:** Interfaces TypeScript definem contratos claros para dados (usuario, paciente, psicologo, logs).
4. **Autenticacao via token:** Token JWT armazenado em localStorage, interceptado pelo axios para requisicoes autenticadas.
5. **Responsivo:** CSS com grid e variaveis para adaptacao mobile.
6. **Proxy no Vite:** Configurado para redirecionar chamadas `/api` para `localhost:4000` em desenvolvimento.

### 2.4 Tipos TypeScript Definidos

**Em `src/types/index.ts`:**

```typescript
- Usuario
- Perfil
- Psicologo
- ClientePaciente
- Vinculo
- LogAcao
- LoginRequest
- LoginResponse
- ApiError
```

### 2.5 Paginas Implementadas

1. **Login** (`Login.ts`)
   - Formulario de autenticacao com e-mail e senha
   - Validacao de campos
   - Tratamento de erros
   - Redirecionamento por perfil
   - Modo demonstracao: checkbox "Usar modo demonstração (sem back-end)"
   - Cadastro de novo usuario integrado na mesma tela (tab Cadastro)
   - Credenciais demo padrao: `admin@demo.com` / `admin123` e `psicologo@demo.com` / `psicologo123`

2. **AdminDashboard** (`AdminDashboard.ts`)
   - Estatisticas (usuarios, psicologos, pacientes)
   - Listagem de usuarios com acoes (editar, bloquear/liberar)
   - Modal para cadastro/edicao de usuarios
   - Controle de situacao (ativo/inativo/bloqueado)
   - Fallback para dados locais quando API indisponivel

3. **PsychologistDashboard** (`PsychologistDashboard.ts`)
   - Estatisticas do psicologo
   - Listagem de pacientes vinculados
   - Pesquisa/filtro por nome
   - Modal para cadastro/edicao de pacientes
   - Fallback para dados locais quando API indisponivel

### 2.6 Servicos de API

**Em `src/services/api.ts`:**
- `authService` - login e logout
- `userService` - CRUD de usuarios
- `psychologistService` - CRUD de psicologos
- `patientService` - CRUD de clientes/pacientes
- `auditService` - Listagem de logs de auditoria

**Em `src/services/auth.ts`:**
- Gerenciamento de token e dados do usuario no localStorage
- Verificacao de autenticacao e perfil
- Logout com limpeza de estado

---

## 3. Como Executar o Front-end

### 3.1 Pre-requisitos

- Node.js 18+ instalado
- npm ou yarn

### 3.2 Passos

```bash
cd frontend
npm install
npm run dev
```

O aplicativo estara disponivel em `http://localhost:3000`.

### 3.3 Configuracao

- API backend esperada em `http://localhost:4000` (configurado no `vite.config.ts`)
- Variavel de ambiente `VITE_API_URL` pode ser usada para alterar a URL da API

---

## 4. Proximos Passos

### 4.1 Back-end (pendente)

- Criar estrutura Node.js + TypeScript
- Implementar API REST com Express/Fastify
- Configurar Prisma/TypeORM ou conexao direta MySQL
- Implementar autenticacao JWT com bcrypt
- Criar endpoints minimos da API

### 4.2 Banco de Dados (pendente)

- Criar script SQL com DER
- Implementar tabelas e relacionamentos
- Criar seed com dados ficticios
- Configurar usuario e permissoes MySQL

### 4.3 Funcionalidades Adicionais

- [ ] Implementar funcionalidade inovadora (a definir pelo grupo)
- [ ] Adicionar validacoes de formulario mais robustas
- [ ] Implementar testes automatizados
- [ ] Adicionar tratamento de erros global
- [ ] Implementar refresh de token
- [ ] Adicionar feedback visual (toasts/snackbars)

### 4.4 Documentacao

- [ ] README.md do projeto principal
- [ ] Documentacao tecnica da API
- [ ] Manual do usuario
- [ ] DER e dicionario de dados

---

## 5. Observacoes

- O front-end atual e uma base funcional pronta para consumo da API.
- A estrutura foi projetada para ser facilmente extensivel.
- Todas as operacoes de autenticacao usam o interceptor do axios para injetar o token.
- A navegacao entre perfis e feita de forma dinamica apos o login.
- Os estilos usam variaveis CSS para facilitar customizacao da identidade visual.
- Foi adicionado modo demonstracao local para permitir uso sem back-end: login e cadastro persistem no localStorage.
- Dashboard inclui fallback para dados demo quando API esta indisponivel.

**Proxima etapa:** Implementar o back-end em TypeScript e o banco de dados MySQL para integrar com este front-end.
