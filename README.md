# Tipi

> Gérez votre foyer partagé ensemble

Tipi est une PWA de gestion de lieu de vie (colocation / maison partagée). Organisez tâches, courses, dépenses et documents avec vos colocataires.

## Stack

| Couche | Technologie |
|--------|-------------|
| Frontend | React 19 + Vite 6 + TypeScript |
| UI | TailwindCSS 4 + shadcn/ui |
| Routing | TanStack Router |
| Data | TanStack Query |
| Backend | PocketBase |
| Deploy | Docker + Caddy |

## Fonctionnalités V1

- **Auth** — Inscription, connexion, profil
- **Foyer** — Création, invitation via code, gestion des membres
- **Tâches** — CRUD, priorités, récurrence, assignation
- **Courses** — Liste partagée, catégories, historique
- **Dépenses** — Split Tricount-style, soldes, règlements
- **Documents** — Upload, catégories, alertes d'expiration

## Développement

```bash
# Dev avec Docker
docker compose -f docker-compose.dev.yml up

# Dev sans Docker
cd frontend && npm install && npm run dev

# Tests
cd frontend && npm test
cd frontend && npm run test:e2e
```

## Déploiement

Voir [SETUP.md](./SETUP.md).
