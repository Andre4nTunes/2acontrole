# 🔐 Instruções de Autenticação - IMPORTANTE

A autenticação foi implementada com sucesso! Agora você precisa executar um script SQL para criar as tabelas de usuários e sessões no seu banco de dados Supabase.

## ⚙️ Passos de Configuração

### 1. Execute o Script SQL de Autenticação

Você precisa criar duas novas tabelas no seu banco Supabase:

1. Acesse [Supabase Console](https://supabase.com)
2. Vá para seu projeto
3. Clique em **SQL Editor** no menu esquerdo
4. Clique em **New Query**
5. Cole o conteúdo do arquivo `scripts/init-auth-db.sql`:

```sql
-- Create User table
CREATE TABLE IF NOT EXISTS "User" (
  id SERIAL PRIMARY KEY,
  username VARCHAR(255) NOT NULL UNIQUE,
  email VARCHAR(255) NOT NULL UNIQUE,
  "passwordHash" VARCHAR(255) NOT NULL,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Create Session table
CREATE TABLE IF NOT EXISTS "Session" (
  id SERIAL PRIMARY KEY,
  token VARCHAR(255) NOT NULL UNIQUE,
  "userId" INTEGER NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  "expiresAt" TIMESTAMP NOT NULL,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_username ON "User"(username);
CREATE INDEX IF NOT EXISTS idx_user_email ON "User"(email);
CREATE INDEX IF NOT EXISTS idx_session_token ON "Session"(token);
CREATE INDEX IF NOT EXISTS idx_session_userId ON "Session"("userId");
```

6. Clique em **Run** para executar o script

### 2. Teste a Autenticação

1. Acesse [http://localhost:3000](http://localhost:3000)
2. Você será redirecionado para `/login`
3. Clique em "Não tem conta? Crie uma" para ir para `/register`
4. Registre uma nova conta com:
   - **Usuário**: seu_usuario
   - **Email**: seu_email@example.com
   - **Senha**: uma senha com pelo menos 6 caracteres
5. Após registrar, você será redirecionado para a tela de login
6. Faça login com as credenciais que criou
7. Você será redirecionado para o dashboard principal

## 🔒 Recursos de Segurança

- ✅ Senhas são hasheadas com SHA-256 antes de serem armazenadas
- ✅ Sessions expiram em 30 dias
- ✅ Cookies de sessão são HTTP-only (protegidos contra acesso JavaScript)
- ✅ Dashboard é protegido por middleware - usuários não autenticados são redirecionados para login
- ✅ Logout limpa a sessão do banco de dados e remove o cookie

## 📋 Fluxo de Autenticação

1. **Registro** → Cria novo usuário no banco
2. **Login** → Verifica credenciais e cria sessão
3. **Dashboard** → Middleware verifica sessão válida
4. **Logout** → Deleta sessão e redireciona para login

## ⚠️ Próximos Passos

Após completar a configuração:
- A tela de login está pronta em `/login`
- A tela de registro está pronta em `/register`
- O dashboard (`/`) agora requer autenticação
- Um header mostra o nome do usuário logado e opção de logout

Bom uso! 🎉
