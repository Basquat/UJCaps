# Atualizações

Este arquivo registra as atualizações trazidas de fora do repositório (ex.: zips enviados) e aplicadas ao projeto. Antes de mexer no código, leia a seção mais recente para saber exatamente o que mudou e aguardar confirmação antes de qualquer novo envio.

## 2026-08-25 — Fluxo de aprovação de cadastro (pendente)

Origem: `UJCaps-main-atualizado.zip`

**O que mudou:**

- [frontend/src/types/index.ts](frontend/src/types/index.ts) — o tipo `situacao` do usuário ganhou o valor `'pendente'` (antes só existia `ativo | inativo | bloqueado`).
- [frontend/src/services/auth.ts](frontend/src/services/auth.ts):
  - Todo novo cadastro (`cadastrarDemo`) agora entra com `situacao: 'pendente'` e **não faz mais login automático**.
  - `login` passou a verificar a situação do usuário: bloqueia acesso se `pendente` (exige autorização do admin) ou `bloqueado`/`inativo`.
  - Adicionados `DemoUser` (tipo), `perfilIdFromNome`, e `getDemoUsers`/`saveDemoUsers` passaram a ser exportados (antes eram internos e causavam erro de compilação no AdminDashboard).
- [frontend/src/pages/AdminDashboard.ts](frontend/src/pages/AdminDashboard.ts):
  - Novo botão **Autorizar** para aprovar cadastros com situação `pendente`.
  - Contador de usuários pendentes nos cards de resumo.
  - Badge de status para `pendente` na lista de usuários.
- [frontend/src/pages/Login.ts](frontend/src/pages/Login.ts):
  - Cadastro agora mostra mensagem "Aguarde a autorização do administrador" em vez de logar direto.
  - Tratamento de erro de login mais completo (distingue erro de API de erro lançado pelo `auth.login`, ex.: cadastro pendente/bloqueado).

**Por que:** fechar uma brecha em que qualquer pessoa podia se cadastrar (inclusive como Administrador) e obter acesso imediato só com e-mail/senha válidos. Agora todo cadastro precisa ser autorizado pelo Administrador Mestre antes do primeiro login.

**Correções colaterais:** essas mudanças também resolveram erros de TypeScript que já existiam no projeto local antes desta atualização (`saveDemoUsers` não definida, `perfilId` ausente no tipo `Usuario`, `ClientePaciente` não importado em `auth.ts`).

---

## Como usar este arquivo

Antes de aplicar um novo zip de atualização:
1. Leia a seção mais recente acima para saber o estado atual do projeto.
2. Aguarde a confirmação/envio do novo zip.
3. Após aplicar as mudanças, adicione uma nova seção no topo (mesmo formato: data, origem, o que mudou, por quê) — não sobrescreva as anteriores.
