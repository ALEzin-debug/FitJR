# 💪 MFit Personal

> PWA de gerenciamento de treinos para Personal Trainers e Alunos.

![MFit Personal](https://img.shields.io/badge/PWA-Mobile%20First-00E676?style=for-the-badge)
![Supabase](https://img.shields.io/badge/Supabase-Backend-3ECF8E?style=for-the-badge&logo=supabase)
![Vanilla JS](https://img.shields.io/badge/JavaScript-Vanilla-F7DF1E?style=for-the-badge&logo=javascript)

## 📱 Sobre

MFit Personal é um aplicativo web progressivo (PWA) para gerenciamento de treinos, conectando Personal Trainers e seus Alunos. O Personal cria treinos com exercícios detalhados e o Aluno acompanha, registra pesos e descansa com timer integrado.

## ✨ Funcionalidades

### Personal Trainer
- 📊 Dashboard com stats (alunos, treinos, check-ins)
- 👥 Gerenciamento de alunos via código de convite
- 🏋️ Criação de treinos com exercícios (nome, séries, reps, descanso, notas)
- 📈 Acompanhamento do progresso dos alunos

### Aluno
- 🏠 Dashboard com treinos atribuídos
- 💪 **Treino interativo** com registro de peso (kg) por série
- ⏱️ **Timer de descanso** com countdown, barra de progresso e alerta sonoro
- ✅ Check-in de séries concluídas com progresso em tempo real
- 📜 Histórico de treinos finalizados

### Geral
- 🌙 Tema Escuro/Claro
- 📱 Mobile-first e responsivo
- 🔒 Row Level Security (RLS) no Supabase
- 📦 PWA instalável

## 🛠️ Tech Stack

- **Frontend:** HTML5, CSS3, Vanilla JavaScript
- **Backend:** [Supabase](https://supabase.com) (PostgreSQL + Auth)
- **Design:** Dark mode, glassmorphism, micro-animações
- **PWA:** Service Worker + Web App Manifest

## 🚀 Setup

### 1. Clone o repositório

```bash
git clone https://github.com/SEU-USUARIO/MFitPersonal.git
cd MFitPersonal
```

### 2. Configure o Supabase

1. Crie um projeto no [Supabase](https://supabase.com)
2. Execute o SQL em `sql/schema.sql` no **SQL Editor**
3. Execute `sql/migration_set_logs.sql` para a tabela de registros por série
4. Em **Authentication** → **Providers** → **Email**: habilite o provedor e desabilite "Confirm email" (para dev)

### 3. Configure as credenciais

```bash
cp js/config.example.js js/config.js
```

Edite `js/config.js` com sua URL e Anon Key do Supabase:

```javascript
const MFIT_CONFIG = {
  SUPABASE_URL: 'https://seu-projeto.supabase.co',
  SUPABASE_ANON_KEY: 'sua-anon-key-aqui'
};
```

### 4. Rode localmente

```bash
npx serve . -l 3000
```

Acesse `http://localhost:3000`

## 📁 Estrutura

```
├── index.html              # SPA principal
├── manifest.json           # PWA manifest
├── sw.js                   # Service Worker
├── css/
│   └── style.css           # Design system completo
├── js/
│   ├── config.example.js   # Template de credenciais
│   ├── config.js           # Credenciais (gitignored)
│   ├── supabase.js         # Cliente Supabase + helpers
│   ├── auth.js             # Login / Registro
│   ├── app.js              # Router SPA, estado, init
│   ├── personal.js         # Dashboard do Personal
│   └── student.js          # Dashboard do Aluno + treino interativo
└── sql/
    ├── schema.sql           # Schema completo do banco
    └── migration_set_logs.sql # Migration para registros por série
```

## 🗄️ Database Schema

| Tabela | Descrição |
|--------|-----------|
| `profiles` | Usuários (personal/student) com vínculo |
| `workouts` | Treinos criados pelo personal |
| `exercises` | Exercícios de cada treino |
| `logs` | Check-ins de treinos finalizados |
| `set_logs` | Registro de peso/reps por série |

## 📄 Licença

MIT
