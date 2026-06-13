# 🖨️ PrintOS — Printer Manager

Sistema completo de gerenciamento de impressoras com autenticação MySQL.

---

## 📋 Pré-requisitos

- **Node.js** v16 ou superior
- **MySQL** 5.7 ou superior (ou MariaDB 10.3+)

---

## ⚡ Instalação em 4 passos

### 1. Criar o banco de dados no MySQL

Abra o MySQL Workbench, DBeaver ou o terminal e execute:

```sql
CREATE DATABASE printos_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 2. Instalar as dependências Node.js

```bash
cd printos
npm install
```

### 3. Configurar a conexão (se necessário)

Por padrão o sistema conecta com:
- Host: `localhost`
- Porta: `3306`
- Banco: `printos_db`
- Usuário: `root`
- Senha: *(vazia)*

Se precisar mudar, edite o arquivo `config/database.js` ou crie um `.env`:

```env
DB_NAME=printos_db
DB_USER=root
DB_PASSWORD=sua_senha_aqui
DB_HOST=localhost
DB_PORT=3306
SESSION_SECRET=troque_por_algo_seguro
PORT=3000
```

> Para usar .env, instale o dotenv: `npm install dotenv`  
> e adicione `require('dotenv').config()` no topo do `server.js`

### 4. Iniciar o servidor

```bash
node server.js
```

Você verá:
```
✅  MySQL conectado com sucesso.
✅  Tabelas sincronizadas.
✅  Admin padrão criado: admin@printos.com / admin123

🖨️  PrintOS rodando em http://localhost:3000
```

### 5. Acessar no navegador

Abra: **http://localhost:3000**

---

## 🔐 Login padrão (admin)

| Campo | Valor |
|-------|-------|
| E-mail | `admin@printos.com` |
| Senha | `admin123` |

> ⚠️ Troque a senha do admin após o primeiro acesso em produção!

---

## 📁 Estrutura do Projeto

```
printos/
├── server.js              ← Servidor Express principal
├── package.json
├── config/
│   └── database.js        ← Conexão com MySQL via Sequelize
├── models/
│   └── User.js            ← Model de usuário (hash bcrypt automático)
├── middleware/
│   └── auth.js            ← Proteção de rotas (requireAuth, requireAdmin)
├── routes/
│   ├── auth.js            ← Login, cadastro, logout, /me
│   └── users.js           ← CRUD completo de usuários (admin)
└── public/
    └── index.html         ← Frontend completo (login + printer manager)
```

---

## 🗄️ Tabelas criadas automaticamente

| Tabela | Descrição |
|--------|-----------|
| `usuarios` | Usuários do sistema |
| `sessoes` | Sessões de login (armazenadas no MySQL) |

### Estrutura da tabela `usuarios`

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | INT UNSIGNED | Chave primária |
| `nome` | VARCHAR(100) | Nome completo |
| `email` | VARCHAR(150) | E-mail único |
| `senha` | VARCHAR(255) | Hash bcrypt (nunca texto puro) |
| `perfil` | ENUM | `admin`, `operador`, `visualizador` |
| `ativo` | BOOLEAN | Conta ativa/inativa |
| `criado_em` | DATETIME | Data de criação |
| `atualizado_em` | DATETIME | Última atualização |

---

## 🌐 API Endpoints

### Autenticação
| Método | Rota | Descrição |
|--------|------|-----------|
| POST | `/api/auth/cadastro` | Criar conta |
| POST | `/api/auth/login` | Fazer login |
| POST | `/api/auth/logout` | Sair |
| GET | `/api/auth/me` | Dados do usuário logado |

### Usuários (somente admin)
| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/api/users` | Listar todos |
| GET | `/api/users/:id` | Buscar um |
| POST | `/api/users` | Criar |
| PUT | `/api/users/:id` | Atualizar |
| DELETE | `/api/users/:id` | Remover |

---

## 👤 Perfis de Acesso

| Perfil | Acesso |
|--------|--------|
| `admin` | Tudo, incluindo gerenciar usuários |
| `operador` | Dashboard, impressoras, fila, simulação |
| `visualizador` | Somente leitura |
