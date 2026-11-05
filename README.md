# 💰 MeuBolso

Sistema web de gestão de despesas pessoais que permite registrar rendas, gastos fixos e despesas variáveis, calculando automaticamente o **saldo do mês**.

Projeto desenvolvido para a disciplina de **Projeto de Desenvolvimento de Software** (Unifil).

---

## 📸 Screenshots

<table>
  <tr>
    <td><img src="./docs/screenshots/inicial.png" width="300" alt="Início" /></td>
    <td><img src="./docs/screenshots/dashboard.png" width="300" alt="Dashboard" /></td>
  </tr>
  <tr>
    <td><img src="./docs/screenshots/despesas.png" width="300" alt="Despesas" /></td>
    <td><img src="./docs/screenshots/gastosfixos.png" width="300" alt="Gastos fixos" /></td>
  </tr>
  <tr>
    <td><img src="./docs/screenshots/renda.png" width="300" alt="Renda" /></td>
    <td><img src="./docs/screenshots/categorias.png" width="300" alt="Categorias" /></td>
  </tr>
</table>

---

## ✨ Funcionalidades

- 🔐 **Autenticação** via Clerk (e-mail/senha ou Google)
- 🏷️ **Categorias** — CRUD completo com nome e cor personalizada
- 💸 **Despesas** — CRUD completo com descrição, valor, data e categoria
- 💰 **Rendas** — CRUD completo com múltiplas fontes por mês
- 🔁 **Gastos fixos** — CRUD completo com dia de vencimento e status ativo/inativo
- 📊 **Dashboard** — totais do mês, saldo, distribuição por categoria e evolução dos últimos 6 meses
- 📅 **Filtros por mês** em despesas, rendas e dashboard
- 🔒 **Isolamento de dados** — cada usuário vê apenas os próprios registros

---

## 🛠 Stack Tecnológica

### Frontend
- **React** 18 + **Vite** 5
- **Tailwind CSS** 4
- **Lucide React** (ícones)
- **@clerk/react** (autenticação)

### Backend
- **Node.js** 20 + **Express** 4
- **pg** (driver PostgreSQL)
- **@clerk/express** (middleware de autenticação)
- **cors**

### Banco de Dados
- **PostgreSQL** 16

### Autenticação
- **Clerk** (gerenciamento completo de identidade)

## 📁 Estrutura do Projeto

```
meubolso/
├── backend/
│   ├── src/
│   │   ├── routes/
│   │   │   ├── categorias.js
│   │   │   ├── despesas.js
│   │   │   ├── rendas.js
│   │   │   ├── gastos-fixos.js
│   │   │   └── dashboard.js
│   │   ├── db.js
│   │   └── server.js
│   ├── database/
│   │   └── schema.sql
│   ├── .env.example
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── api.js
│   │   ├── Categorias.jsx
│   │   ├── Despesas.jsx
│   │   ├── Rendas.jsx
│   │   ├── GastosFixos.jsx
│   │   └── Dashboard.jsx
│   ├── .env.example
│   └── package.json
├── docs/
│   ├── documentacao.md
│   ├── diagramas/
│   └── screenshots/
└── README.md
```

---

## 🚀 Como Rodar Localmente

### Pré-requisitos

- **Node.js** 20+
- **PostgreSQL** 16+
- Conta gratuita no [Clerk](https://clerk.com)

### 1. Clonar o repositório

```bash
git clone https://github.com/tiagobalan2/meubolso.git
cd meubolso
```

### 2. Configurar o banco de dados

Crie o banco `meubolso` no PostgreSQL e execute o script:

```bash
psql -U postgres -d meubolso -f backend/database/schema.sql
```

### 3. Configurar o backend

```bash
cd backend
npm install
```

Crie o arquivo `.env` (use o `.env.example` como base):

```env
CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
DATABASE_URL=postgresql://postgres:sua_senha@localhost:5432/meubolso
PORT=3001
```

Rode:

```bash
npm run dev
```

O backend estará em `http://localhost:3001`.

### 4. Configurar o frontend

Em outro terminal:

```bash
cd frontend
npm install
```

Crie o arquivo `.env`:

```env
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
```

Rode:

```bash
npm run dev
```

O frontend estará em `http://localhost:5173`.

### 5. Criar uma conta

- Acesse `http://localhost:5173`
- Clique em **Entrar** e cadastre-se
- Use um e-mail no formato `seunome+clerk_test@exemplo.com` e o código **`424242`** (modo de teste do Clerk)

---

## 📖 Documentação

A documentação completa do projeto (Parte I da disciplina) está em:

📄 [`docs/documentacao.md`](./docs/documentacao.md)

Ela inclui:

- Identificação, introdução, objetivos
- Escopo e limitações
- Requisitos funcionais, não funcionais e regras de negócio
- Casos de uso (com diagramas Mermaid)
- Modelagem de dados (DER + dicionário)
- Arquitetura
- Stack tecnológica (com justificativas)
- Segurança

---

## 🗄 Modelo de Dados

O sistema possui 4 entidades:

| Entidade | Descrição |
|---|---|
| **categoria** | Classifica despesas (com cor personalizada) |
| **despesa** | Gastos variáveis do dia a dia |
| **renda** | Receitas mensais (múltiplas fontes por mês) |
| **gasto_fixo** | Despesas recorrentes (aluguel, assinaturas) |

**Regra de negócio principal:**

```
saldo do mês = total_renda − total_gastos_fixos_ativos − total_despesas
```

Todas as tabelas usam `usuario_id` (TEXT) para armazenar o `userId` do Clerk, garantindo isolamento de dados.

---

## 🔐 Segurança

- Senhas gerenciadas pelo Clerk (nunca armazenadas no banco)
- Token JWT validado a cada requisição pelo `clerkMiddleware`
- Isolamento de dados no nível do banco (`WHERE usuario_id = $1` em todas as queries)
- `.env` protegido no `.gitignore`
- Validações no backend (valor > 0, categoria do próprio usuário, etc.)

---

## 🧪 Testes Manuais

Para validar o sistema:

1. **Login:** cadastre-se e verifique se o Dashboard carrega
2. **Categorias:** crie, edite e exclua uma categoria
3. **Despesas:** cadastre uma despesa, filtre por mês, edite e exclua
4. **Rendas:** cadastre duas fontes no mesmo mês e veja a soma
5. **Gastos fixos:** cadastre, desative, reative e exclua
6. **Dashboard:** verifique se o saldo é `renda − gastos fixos − despesas`
7. **Saldo negativo:** cadastre uma despesa gigante e confirme o card vermelho
8. **Isolamento:** crie um segundo usuário e confirme que ele não vê os dados do primeiro

---

## 👤 Autor

**Tiago Leomil Balan**

- Disciplina: Projeto de Desenvolvimento de Software — Unifil

---
Este projeto foi desenvolvido para fins acadêmicos. Sinta-se livre para estudar e se inspirar.

---

## 🙏 Agradecimentos

- Prof. Fernando Nakagawa (Unifil)
- Documentação do [Clerk](https://clerk.com/docs), [Express](https://expressjs.com/) e [PostgreSQL](https://www.postgresql.org/docs/)
