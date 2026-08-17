# TIKANE — Plateforme de Tontine Numérique Haïtienne

> Gestion de sòl, sabotay et tontines pour la communauté haïtienne

---

## Stack technique

| Couche | Technologies |
|--------|-------------|
| **Backend** | Node.js + Express.js + TypeScript |
| **Base de données** | PostgreSQL 16 + Prisma ORM |
| **Cache / Queue** | Redis 7 (ioredis) |
| **Authentification** | JWT access tokens (15m) + refresh tokens (7j) |
| **Stockage** | AWS S3 / MinIO |
| **Frontend** | Angular 18 (standalone) + Angular Material + TailwindCSS 3 |
| **État** | NgRx 18 |
| **Notifications** | Nodemailer (SMTP) + Twilio SMS |
| **Docker** | Multi-stage builds + Docker Compose |
| **Proxy** | Nginx + certbot SSL |

---

## Prérequis

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) ≥ 4.x
- [Node.js](https://nodejs.org/) 20 LTS (pour développement local)
- [Git](https://git-scm.com/)

---

## Démarrage rapide avec Docker

### 1. Cloner et configurer l'environnement

```bash
git clone <repo-url> tikane
cd tikane

# Copier le fichier d'environnement
cp .env.example .env
```

Editez `.env` et renseignez au minimum :
```env
DATABASE_URL=postgresql://tikane:tikane_pass@postgres:5432/tikane_db
REDIS_URL=redis://redis:6379
JWT_ACCESS_SECRET=votre-secret-access-tres-long-32-chars-min
JWT_REFRESH_SECRET=votre-secret-refresh-tres-long-32-chars-min
SMTP_HOST=smtp.gmail.com
SMTP_USER=votre@email.com
SMTP_PASS=votre-mot-de-passe-app
```

### 2. Lancer les services

```bash
docker-compose up -d
```

Cela démarre:
- `postgres:5432` — Base de données PostgreSQL
- `redis:6379` — Cache Redis
- `minio:9000` — Stockage S3 compatible (console: `9001`)
- `backend:3000` — API Express
- `frontend:4200` — Application Angular
- `pgadmin:5050` — Interface web PostgreSQL

### 3. Initialiser la base de données

```bash
# Exécuter dans le container backend
docker-compose exec backend npx prisma migrate deploy
docker-compose exec backend npx ts-node prisma/seed.ts
```

### 4. Accéder à l'application

| Service | URL | Credentials |
|---------|-----|-------------|
| **Application** | http://localhost:4200 | voir ci-dessous |
| **API** | http://localhost:3000/api/v1 | — |
| **Swagger** | http://localhost:3000/api/docs | — |
| **PgAdmin** | http://localhost:5050 | admin@tikane.ht / admin |
| **MinIO Console** | http://localhost:9001 | minioadmin / minioadmin |

### Comptes de test (après seed)

| Rôle | Email | Mot de passe |
|------|-------|-------------|
| Super Admin | admin@tikane.ht | Admin@Tikane2025! |
| Admin | manager@tikane.ht | Admin@Tikane2025! |
| Agent Nord | agent.nord@tikane.ht | Agent@2025! |
| Agent Ouest | agent.ouest@tikane.ht | Agent@2025! |
| Client 1 | client1@example.com | Client@2025! |
| Client 2 | client2@example.com | Client@2025! |
| Client 3 | client3@example.com | Client@2025! |

---

## Développement local (sans Docker)

### Backend

```bash
cd backend
npm install

# Démarrer PostgreSQL et Redis localement ou via Docker
docker-compose up -d postgres redis

# Migrations et seed
npx prisma migrate dev
npx ts-node prisma/seed.ts

# Démarrer en mode dev
npm run dev
```

### Frontend

```bash
cd frontend
npm install
npx ng serve
```

---

## Structure du projet

```
tikane/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma        # Modèles de base de données
│   │   ├── seed.ts              # Données de test
│   │   └── init.sql             # Extensions PostgreSQL
│   ├── src/
│   │   ├── config/              # Configuration (env, db, redis, swagger)
│   │   ├── common/
│   │   │   ├── errors/          # ApiError
│   │   │   ├── middleware/      # auth, error handlers
│   │   │   └── utils/           # logger, bcrypt, jwt, helpers
│   │   ├── modules/
│   │   │   ├── auth/            # Authentification JWT
│   │   │   ├── users/           # Gestion utilisateurs
│   │   │   ├── plans/           # Plans de tontine
│   │   │   ├── subscriptions/   # Souscriptions
│   │   │   ├── payments/        # Paiements
│   │   │   ├── transactions/    # Transactions
│   │   │   ├── withdrawals/     # Retraits
│   │   │   ├── admin/           # Dashboard admin
│   │   │   ├── agents/          # Gestion agents
│   │   │   └── notifications/   # Notifications
│   │   ├── app.ts
│   │   └── server.ts
│   └── Dockerfile
│
├── frontend/
│   └── src/
│       ├── app/
│       │   ├── core/
│       │   │   ├── guards/      # authGuard, roleGuard
│       │   │   ├── interceptors/# auth, error
│       │   │   ├── models/      # TypeScript interfaces
│       │   │   └── services/    # auth, api, storage
│       │   ├── features/
│       │   │   ├── auth/        # login, register, forgot, etc.
│       │   │   ├── client/      # dashboard client
│       │   │   └── admin/       # dashboard admin
│       │   └── shared/
│       │       └── components/
│       ├── environments/
│       ├── styles.scss
│       └── main.ts
│
├── nginx/nginx.conf             # Proxy production
├── docker-compose.yml           # Dev
├── docker-compose.prod.yml      # Production
└── .env.example
```

---

## Plans de tontine disponibles

| Type | Description | Exemple |
|------|-------------|---------|
| **PROGRESSIVE** | Montants croissants chaque jour | 100 HTG → +50/jour → 30 jours |
| **FIXED_DAILY** | Montant fixe journalier | 500 HTG × 30 jours |
| **WEEKLY** | Versement hebdomadaire | 2000 HTG × 12 semaines |
| **MONTHLY** | Versement mensuel | 5000 HTG × 6 mois |
| **SABOTAY** | Capital + intérêts | 10 000 HTG @ 5% = 10 500 HTG |

---

## API Reference

Documentation Swagger interactive: **http://localhost:3000/api/docs**

### Endpoints principaux

```
POST   /api/v1/auth/register
POST   /api/v1/auth/login
POST   /api/v1/auth/refresh
POST   /api/v1/auth/logout

GET    /api/v1/plans
POST   /api/v1/plans               (Admin)
GET    /api/v1/plans/:id

GET    /api/v1/subscriptions/my
POST   /api/v1/subscriptions
GET    /api/v1/subscriptions/:id

POST   /api/v1/payments
GET    /api/v1/payments/my
PATCH  /api/v1/payments/:id/confirm (Admin)

POST   /api/v1/withdrawals/request
GET    /api/v1/withdrawals/my
PATCH  /api/v1/withdrawals/:id/approve (Admin)

GET    /api/v1/admin/stats          (Admin)
GET    /api/v1/admin/audit-logs     (Admin)
```

---

## Sécurité

- Mots de passe hashés avec bcrypt (12 rounds)
- JWT avec rotation des refresh tokens
- Détection de réutilisation des tokens (révocation en cascade)
- Rate limiting par IP et par endpoint
- Helmet.js pour les headers HTTP sécurisés
- Validation des inputs avec Zod
- RBAC (Super Admin / Admin / Agent / Client)
- Logs d'audit pour toutes les actions sensibles

---

## Déploiement production

```bash
# Construire et démarrer en production
docker-compose -f docker-compose.prod.yml up -d --build

# Migrer la base de données
docker-compose -f docker-compose.prod.yml exec backend npx prisma migrate deploy
```

Configurez votre DNS pour pointer vers le serveur, puis Nginx gère le SSL via certbot.

---

## Contribuer

1. Forkez le repository
2. Créez une branche feature: `git checkout -b feature/ma-feature`
3. Committez: `git commit -m 'feat: description'`
4. Poussez: `git push origin feature/ma-feature`
5. Ouvrez une Pull Request

---

## Licence

MIT — © 2025 Tikane Platform
