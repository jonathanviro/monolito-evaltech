# Monolito EvalTech

Plataforma monolítica de evaluación técnica para candidatos al cargo de Desarrollador Senior Full Stack JavaScript/TypeScript. Consta de un backend (Nest.js + Prisma + PostgreSQL) y un frontend (Next.js + TailwindCSS + Shadcn UI) dentro de un mismo repositorio.

## Stack

| Capa | Tecnología |
|------|-----------|
| Backend | Nest.js, TypeScript, Prisma ORM, PostgreSQL |
| Frontend | Next.js 14, TailwindCSS, Shadcn UI, Recharts |
| Base de datos | PostgreSQL 16 |
| Contenedores | Docker Compose (desarrollo local) |
| Deploy | Railway (3 servicios: PostgreSQL, Backend, Frontend) |

## Estructura

```
monolito-evaltech/
├── docker-compose.yml          # PostgreSQL + backend + frontend (dev local)
├── .env                        # Variables de entorno locales
├── packages/
│   ├── backend/                # API Nest.js
│   │   ├── prisma/             # Schema + migraciones + seed
│   │   ├── src/                # Código fuente
│   │   │   ├── admin/          # Admin stats
│   │   │   ├── auth/           # JWT auth
│   │   │   ├── candidates/     # CRUD candidatos
│   │   │   └── evaluation/     # Evaluación, respuestas, scoring
│   │   └── package.json
│   └── frontend/               # Next.js App Router
│       ├── src/
│       │   ├── app/
│       │   │   ├── admin/      # Dashboard, detalle, resultados
│       │   │   └── eval/       # Evaluación + token input
│       │   └── lib/            # API client
│       └── package.json
```

## Funcionalidades

- **Evaluación técnica** con 31 preguntas (9 opción múltiple, 17 debugging, 5 abiertas)
- **Timer persistente** de 45 minutos (vía `startedAt` del backend, no se reinicia al perder conexión)
- **Auto-save** al avanzar a la siguiente pregunta
- **Navegación secuencial** sin retroceder, sin índice de preguntas
- **Focus loss detection** — registra automáticamente si el candidato cambia de pestaña
- **Bloqueo de copy/paste y clic derecho** durante la evaluación
- **Detección de sospecha** combinando: MC perfectas + abiertas vacías, focus loss excesivo
- **Panel admin** — dashboard, detalle por candidato con radar chart por categorías, calificación manual de preguntas abiertas
- **Categorías**: React, TypeScript, REST/Nest.js, Git, Docker, SQL, AI/Vibe Coding

## Desarrollo local

### Prerequisitos

- Node.js 20+
- Docker Desktop (para PostgreSQL)

### Inicio rápido

```bash
# 1. Clonar e instalar dependencias
git clone <repo>
cd monolito-evaltech
cd packages/backend && npm install
cd ../frontend && npm install
cd ../..

# 2. Iniciar base de datos
docker compose up -d db

# 3. Migrar y seedear
cd packages/backend
npx prisma migrate dev
npx ts-node prisma/seed.ts

# 4. Iniciar servidores
# Terminal 1 - Backend (puerto 4000)
cd packages/backend && npm run start:dev

# Terminal 2 - Frontend (puerto 3000)
cd packages/frontend && npm run dev
```

### Credenciales admin

```
Email:    admin@evaltest.com
Password: admin123
```

### Rutas

| Ruta | Descripción |
|------|-------------|
| `/` | Redirige a `/eval` |
| `/eval` | Ingreso de token para candidatos |
| `/eval/[token]` | Evaluación del candidato |
| `/admin/login` | Login de administrador |
| `/admin` | Dashboard de candidatos |
| `/admin/candidates/[id]` | Detalle del candidato + calificar abiertas |
| `/admin/results` | Resultados globales |

## Deploy en Railway

El proyecto está diseñado para desplegarse en Railway como 3 servicios independientes dentro del mismo proyecto:

### Servicios

| Servicio | Root Directory | Build | Start |
|----------|---------------|-------|-------|
| PostgreSQL | Add-on de Railway | — | — |
| Backend | `packages/backend` | `npm run build` | `npm run start:prod` |
| Frontend | `packages/frontend` | `npm run build` | `npm run start` |

### Variables de entorno

**Backend:**
| Variable | Valor |
|----------|-------|
| `DATABASE_URL` | Inyectado por Railway (add-on PostgreSQL) |
| `JWT_SECRET` | Secreto para JWT |
| `ADMIN_EMAIL` | `admin@evaltest.com` |
| `ADMIN_PASSWORD` | `admin123` |

**Frontend:**
| Variable | Valor |
|----------|-------|
| `NEXT_PUBLIC_API_URL` | `https://<backend>.railway.app` |

### Seed inicial

Después del primer deploy, ejecutar desde Railway Console del backend:

```bash
npx prisma migrate deploy
npx ts-node prisma/seed.ts
```
