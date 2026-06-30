# Backend - Cheguei Mãe API

Backend Node.js + TypeScript + MySQL para o sistema de transporte escolar Cheguei Mãe.

## 🚀 Tecnologias

- **Node.js** com **TypeScript**
- **Express.js** - Framework web
- **MySQL2** - Cliente MySQL
- **JWT** - Autenticação
- **bcryptjs** - Hash de senhas

## 📋 Pré-requisitos

- Node.js 18+ 
- Docker e Docker Compose (recomendado) ou MySQL 8.0+ instalado localmente
- npm ou yarn

## 🐳 Configuração com Docker (Recomendado)

### 1. Iniciar o banco de dados MySQL via Docker

Na raiz do projeto, execute:
```bash
docker-compose up -d
```

Isso irá:
- Criar um container MySQL 8.0
- Criar o banco de dados `cheguei_mae` automaticamente
- Configurar usuário e senha padrão
- Expor a porta 3306

**Credenciais padrão do Docker:**
- Host: `localhost`
- Porta: `3306`
- Usuário: `cheguei_user`
- Senha: `cheguei_pass`
- Banco: `cheguei_mae`

### 2. Parar o banco de dados
```bash
docker-compose down
```

### 3. Parar e remover volumes (resetar banco)
```bash
docker-compose down -v
```

## 🔧 Instalação

1. Instale as dependências:
```bash
npm install
```

2. Configure as variáveis de ambiente:
```bash
cp .env.example .env
```

Edite o arquivo `.env` com suas configurações:

**Para usar com Docker (valores padrão):**
```env
PORT=3000
NODE_ENV=development

DB_HOST=localhost
DB_PORT=3306
DB_USER=cheguei_user
DB_PASSWORD=cheguei_pass
DB_NAME=cheguei_mae

JWT_SECRET=seu_secret_jwt_aqui_min_32_caracteres
JWT_EXPIRES_IN=7d

CORS_ORIGIN=http://localhost:8081
```

**Para usar MySQL local (sem Docker):**
```env
PORT=3000
NODE_ENV=development

DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=sua_senha
DB_NAME=cheguei_mae

JWT_SECRET=seu_secret_jwt_aqui_min_32_caracteres
JWT_EXPIRES_IN=7d

CORS_ORIGIN=http://localhost:8081
```

3. Se estiver usando MySQL local, crie o banco de dados:
```sql
CREATE DATABASE cheguei_mae CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

4. Execute as migrations:
```bash
npm run migrate
```

## 🏃 Executando

### Desenvolvimento
```bash
npm run dev
```

### Produção
```bash
npm run build
npm start
```

## 📡 Endpoints da API

### Autenticação
- `POST /api/auth/login` - Login
- `POST /api/auth/register` - Registro
- `GET /api/auth/me` - Dados do usuário logado

### Alunos
- `GET /api/alunos` - Listar alunos
- `GET /api/alunos/:id` - Buscar aluno por ID
- `POST /api/alunos` - Criar aluno (admin/motorista)
- `PUT /api/alunos/:id` - Atualizar aluno (admin/motorista)
- `DELETE /api/alunos/:id` - Deletar aluno (admin)

### Manutenções
- `GET /api/manutencoes` - Listar manutenções
- `POST /api/manutencoes` - Criar manutenção (admin/motorista)
- `PUT /api/manutencoes/:id` - Atualizar manutenção (admin/motorista)

### Notificações
- `GET /api/notificacoes` - Listar notificações
- `POST /api/notificacoes` - Criar notificação (admin/motorista)
- `POST /api/notificacoes/:id/marcar-lida` - Marcar como lida
- `GET /api/notificacoes/responsaveis/disponiveis` - Listar responsáveis disponíveis (motorista)

## 🔐 Autenticação

Todas as rotas (exceto login e register) requerem autenticação via JWT.

Envie o token no header:
```
Authorization: Bearer <seu_token>
```

## 🏢 Multi-tenancy

O sistema suporta multi-tenancy através do campo `tenantId`. Cada motorista/responsável tem seu próprio `tenantId` que isola seus dados.

## 📝 Estrutura do Projeto

```
backend/
├── src/
│   ├── config/          # Configurações (DB, env)
│   ├── controllers/     # Controllers das rotas
│   ├── database/        # Migrations e seeds
│   ├── middleware/      # Middlewares (auth, tenant)
│   ├── models/          # Models de acesso ao banco
│   ├── routes/          # Definição das rotas
│   ├── types/           # Tipos TypeScript
│   ├── utils/           # Utilitários
│   └── server.ts        # Arquivo principal
├── .env.example
├── package.json
└── tsconfig.json
```

## 🗄️ Banco de Dados

O banco de dados MySQL contém as seguintes tabelas principais:

- `users` - Usuários do sistema
- `alunos` - Alunos cadastrados
- `escolas` - Escolas
- `enderecos` - Endereços
- `veiculos` - Veículos dos motoristas
- `manutencoes` - Manutenções dos veículos
- `contratos` - Contratos com responsáveis
- `lancamentos` - Lançamentos financeiros
- `notificacoes` - Notificações enviadas
- `rotas` - Rotas de transporte
- E outras tabelas relacionadas

## 🔄 Próximos Passos

- [ ] Implementar controllers de Contratos
- [ ] Implementar controllers de Financeiro
- [ ] Implementar controllers de Rotas
- [ ] Adicionar validação de dados com express-validator
- [ ] Implementar upload de arquivos
- [ ] Adicionar testes unitários
- [ ] Implementar cache com Redis
- [ ] Adicionar documentação Swagger

