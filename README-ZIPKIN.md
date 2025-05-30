# Configuration Zipkin - Guide de démarrage

## ✅ Problèmes résolus

### Erreur CSP (Content Security Policy)
- **Problème** : `env.js:5 Uncaught SyntaxError: Invalid or unexpected token`
- **Cause** : Fichier `env.js` malformé et URLs Zipkin non autorisées dans la CSP
- **Solution** : 
  - Correction du script de génération `env.js` dans le Dockerfile
  - Ajout des URLs Zipkin dans la CSP (`http://localhost:9411`, `http://localhost:9411/api`, `http://localhost:9411/api/v2`)

### Configuration Zipkin
- **Problème** : Tracing non fonctionnel entre frontend et backend
- **Solution** : Configuration unifiée pour tous les environnements (local, Docker, Kubernetes)

### Variables d'environnement
- **Problème** : Variables mal injectées au runtime
- **Solution** : Génération directe du fichier `env.js` dans le Dockerfile avec syntaxe correcte

## 🚀 Démarrage rapide

### Option 1: Docker (Recommandé)
```bash
# Démarrer tous les services avec Docker
./start-docker.bat

# Ou manuellement :
docker-compose up -d
```

### Option 2: Développement local
```bash
# Démarrer en mode développement local
./start-local.bat

# Ou manuellement :
# 1. Démarrer Zipkin
java -jar zipkin-server-exec.jar

# 2. Démarrer le backend
cd back-end
python manage.py runserver 0.0.0.0:8000

# 3. Démarrer le frontend
cd project
npm run dev
```

## 🌐 URLs des services

### Docker
- **Frontend**: http://localhost:5175
- **Backend**: http://localhost:8000
- **Zipkin**: http://localhost:9411
- **Database**: localhost:5433

### Local
- **Frontend**: http://localhost:5173
- **Backend**: http://localhost:8000
- **Zipkin**: http://localhost:9411

## 🔧 Configuration Zipkin

### Frontend (.env)
```env
VITE_API_BASE_URL=http://localhost:8000
VITE_ZIPKIN_URL=http://localhost:9411
VITE_ZIPKIN_ENABLED=true
```

### Backend (.env.local)
```env
ZIPKIN_ENABLED=True
ZIPKIN_SERVER_URL=http://localhost:9411
ZIPKIN_SERVICE_NAME=rh-backend
ZIPKIN_SAMPLE_RATE=100.0
```

## 📊 Utilisation de Zipkin

1. Ouvrez Zipkin : http://localhost:9411
2. Naviguez dans l'application frontend
3. Les traces apparaîtront automatiquement dans Zipkin
4. Utilisez les filtres pour rechercher des traces spécifiques

## 🔍 Types de traces capturées

### Frontend
- Navigation entre pages
- Requêtes API
- Actions utilisateur (login, logout, etc.)
- Actions métier (missions, congés, etc.)

### Backend
- Requêtes HTTP
- Opérations de base de données
- Authentification
- Traitement des emails

## 📝 Logs utiles

```bash
# Voir tous les logs
docker-compose logs -f

# Logs spécifiques
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f zipkin
```

## 🛠️ Développement

### Modifier la configuration Zipkin
1. Éditez les fichiers `.env` appropriés
2. Redémarrez les services
3. Vérifiez que les nouvelles configurations sont appliquées

### Ajouter de nouvelles traces
- **Frontend**: Utilisez les fonctions dans `src/services/zipkinService.ts`
- **Backend**: Utilisez le middleware Zipkin dans `Rh_app/zipkin_middleware.py`

## 🔒 Sécurité

- Les clés API et mots de passe sont dans les fichiers `.env`
- Ne commitez jamais les fichiers `.env` avec des vraies clés
- Utilisez des variables d'environnement en production

## ✅ Tests de fonctionnement

### Vérifier que Zipkin fonctionne
```bash
# Test de santé Zipkin
curl http://localhost:9411/health

# Voir les traces
curl http://localhost:9411/api/v2/traces
```

### Vérifier les services
```bash
# Frontend
curl http://localhost:5175

# Backend
curl http://localhost:8000

# Statut des conteneurs
docker-compose ps
```
