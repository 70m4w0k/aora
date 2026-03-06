# Tipi — Guide de déploiement sur VPS

## Prérequis

- VPS avec Ubuntu 22.04+
- Docker + Docker Compose installés
- Un domaine pointant vers le VPS (ex: `tipi.yourdomain.com` et `pb.tipi.yourdomain.com`)

---

## 1. Préparer le serveur

```bash
# Installer Docker
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
newgrp docker

# Créer le répertoire de l'application
sudo mkdir -p /opt/tipi
sudo chown $USER:$USER /opt/tipi
cd /opt/tipi
```

## 2. Cloner le dépôt

```bash
git clone https://github.com/votre-org/tipi.git .
```

## 3. Configurer l'environnement

```bash
cp .env.example .env
nano .env
```

Remplir les variables :

```env
TIPI_DOMAIN=tipi.yourdomain.com
POCKETBASE_URL=https://pb.tipi.yourdomain.com
```

## 4. Premier démarrage

```bash
docker compose up -d
```

Caddy va automatiquement obtenir les certificats SSL via Let's Encrypt.

## 5. Configurer PocketBase

1. Accéder à l'interface admin : `https://pb.tipi.yourdomain.com/_/`
2. Créer le compte administrateur
3. Les migrations s'appliquent automatiquement au démarrage

## 6. Vérifier le déploiement

```bash
# Statut des services
docker compose ps

# Logs
docker compose logs -f

# Test de l'application
curl -f https://tipi.yourdomain.com
```

---

## Développement local

```bash
# Démarrer l'environnement de dev
docker compose -f docker-compose.dev.yml up

# Frontend : http://localhost:5173
# PocketBase : http://localhost:8090
# Admin PB : http://localhost:8090/_/
```

Ou sans Docker :

```bash
# Terminal 1 — PocketBase
cd backend && ./pocketbase serve

# Terminal 2 — Frontend
cd frontend && npm install && npm run dev
```

---

## CI/CD

### Secrets GitHub à configurer

Dans `Settings > Secrets and variables > Actions` :

| Secret | Description |
|--------|-------------|
| `VPS_HOST` | IP ou hostname du VPS |
| `VPS_USER` | Utilisateur SSH (ex: `ubuntu`) |
| `VPS_SSH_KEY` | Clé SSH privée |

### Variables GitHub

Dans `Settings > Variables > Actions` :

| Variable | Description |
|----------|-------------|
| `POCKETBASE_URL` | URL publique de PocketBase |
| `PREPROD_URL` | URL de l'application en préprod |

### Déploiement manuel en prod

```bash
# Sur le VPS
cd /opt/tipi
git pull
docker compose pull
docker compose up -d --remove-orphans
```

---

## Sauvegarde

Les données PocketBase sont dans le volume `pb_data`. Pour sauvegarder :

```bash
docker run --rm -v tipi_pb_data:/pb_data -v $(pwd):/backup alpine \
  tar czf /backup/pb_data_$(date +%Y%m%d).tar.gz /pb_data
```

---

## Mise à jour

```bash
cd /opt/tipi
git pull
docker compose pull
docker compose up -d
docker image prune -f
```
