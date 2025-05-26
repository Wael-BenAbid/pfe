# 🐳 Guide Docker - RH System

Ce guide explique comment utiliser Docker pour le développement local et la production.

> **✅ Déploiement Docker Desktop réussi !** Tous les services fonctionnent correctement.

## 🚀 Commandes Rapides

### **Développement Local (avec hot-reload)**
```bash
# Démarrer en mode développement
npm run docker:local

# Voir les logs en temps réel
npm run docker:logs

# Arrêter les conteneurs
npm run docker:stop

# Nettoyer complètement
npm run docker:clean

# Reconstruire complètement
npm run docker:rebuild
```

### **Production (avec images Docker Hub)**
```bash
# Démarrer en mode production
npm run docker:prod

# Arrêter
npm run docker:stop
```

## 📋 Modes de Déploiement

### **1. Mode Local (.env.local)**
- **Images** : Build local des sources
- **Ports** : Frontend 5173, Backend 8000, DB 5432
- **Hot-reload** : ✅ Activé
- **Debug** : ✅ Activé
- **Email** : Console backend

### **2. Mode Production (.env.production)**
- **Images** : Docker Hub (waelbenabid/*)
- **Ports** : Frontend 5175, Backend 8000, DB 5433
- **Hot-reload** : ❌ Désactivé
- **Debug** : ❌ Désactivé
- **Email** : SMTP/SendGrid

## 🔧 Configuration

### **Variables d'Environnement**

Copiez et modifiez selon vos besoins :

```bash
# Pour le développement local
cp .env.local .env

# Pour la production
cp .env.production .env
```

### **Ports Utilisés**

| Service | Local | Production |
|---------|-------|------------|
| Frontend | 5173 | 5175 |
| Backend | 8000 | 8000 |
| PostgreSQL | 5432 | 5433 |
| Zipkin | 9411 | 9411 |

## 🛠️ Commandes Docker Avancées

### **Gestion des Conteneurs**
```bash
# Voir les conteneurs actifs
docker ps

# Voir tous les conteneurs
docker ps -a

# Entrer dans un conteneur
docker exec -it rh-backend-local bash
docker exec -it rh-frontend-local sh

# Voir les logs d'un service spécifique
docker-compose logs -f backend
docker-compose logs -f frontend
```

### **Gestion des Images**
```bash
# Voir les images
docker images

# Supprimer les images inutilisées
docker image prune -f

# Reconstruire une image spécifique
docker-compose build backend
docker-compose build frontend
```

### **Gestion des Volumes**
```bash
# Voir les volumes
docker volume ls

# Supprimer les volumes inutilisés
docker volume prune -f

# Sauvegarder la base de données
docker exec rh-postgres-local pg_dump -U postgres rh_v2 > backup.sql
```

## 🔄 CI/CD et Docker Hub

### **Push Automatique**
Le CI/CD push automatiquement vers Docker Hub sur :
- ✅ Push sur `main`
- ✅ Déclenchement manuel
- ✅ Multi-architecture (amd64, arm64)
- ✅ Cache optimisé

### **Tags Créés**
- `latest` : Dernière version
- `{sha}` : Version spécifique du commit
- `v{date}` : Version horodatée

## 🐛 Dépannage

### **Problèmes Courants**

**Port déjà utilisé :**
```bash
# Voir qui utilise le port
netstat -tulpn | grep :5173

# Tuer le processus
kill -9 <PID>
```

**Problème de permissions :**
```bash
# Reconstruire avec sudo (Linux/Mac)
sudo docker-compose down -v
sudo docker-compose up --build
```

**Base de données corrompue :**
```bash
# Supprimer le volume de la DB
docker volume rm pfe_postgres_data_local
npm run docker:rebuild
```

**Cache Docker plein :**
```bash
# Nettoyer complètement Docker
docker system prune -a -f
docker volume prune -f
```

## 📊 Monitoring

### **Accès aux Services**
- **Frontend** : http://localhost:5173 (local) / http://localhost:5175 (prod)
- **Backend** : http://localhost:8000
- **Zipkin** : http://localhost:9411
- **PostgreSQL** : localhost:5432 (local) / localhost:5433 (prod)

### **Health Checks**
```bash
# Vérifier la santé des services
docker-compose ps

# Tester les endpoints
curl http://localhost:8000/health/
curl http://localhost:5173
curl http://localhost:9411/health
```

## 🔐 Sécurité

### **Secrets de Production**
- Utilisez des mots de passe forts
- Changez les clés par défaut
- Utilisez des variables d'environnement
- Ne commitez jamais les secrets

### **Variables Sensibles**
```bash
# À changer en production
ADMIN_PASSWORD=VotreMotDePasseSecurise
DATABASE_PASSWORD=VotreMotDePasseDB
SENDGRID_API_KEY=VotreCleAPI
```
