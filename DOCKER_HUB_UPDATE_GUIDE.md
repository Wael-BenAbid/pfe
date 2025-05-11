# Guide de mise à jour de Docker Hub

Ce guide explique comment mettre à jour vos images Docker sur Docker Hub à partir de votre environnement local, puis comment synchroniser ces images avec votre déploiement Kubernetes.

## Prérequis

- Docker Desktop installé et en cours d'exécution
- Compte Docker Hub (username: waelbenabid)
- kubectl configuré pour accéder à votre cluster Kubernetes
- Minikube en cours d'exécution (si vous utilisez Minikube)

## Méthode 1: Utilisation des scripts fournis

### Pour les utilisateurs Windows (PowerShell)

1. Ouvrez PowerShell et naviguez vers le répertoire racine de votre projet.

2. Exécutez le script `update-docker-hub.ps1` avec les options appropriées :

   ```powershell
   # Pour mettre à jour les deux images (frontend et backend)
   .\update-docker-hub.ps1 -All

   # Pour mettre à jour uniquement l'image frontend
   .\update-docker-hub.ps1 -Frontend

   # Pour mettre à jour uniquement l'image backend
   .\update-docker-hub.ps1 -Backend

   # Pour spécifier un tag personnalisé
   .\update-docker-hub.ps1 -All -Tag v1.0
   ```

3. Lorsque vous y êtes invité, entrez votre mot de passe Docker Hub.

4. Le script vous demandera si vous souhaitez également mettre à jour les déploiements Kubernetes. Répondez `o` pour oui ou `n` pour non.

### Pour les utilisateurs Linux/Mac (Bash)

1. Ouvrez un terminal et naviguez vers le répertoire racine de votre projet.

2. Assurez-vous que le script est exécutable :

   ```bash
   chmod +x update-docker-hub.sh
   ```

3. Exécutez le script `update-docker-hub.sh` avec les options appropriées :

   ```bash
   # Pour mettre à jour les deux images (frontend et backend)
   ./update-docker-hub.sh --all

   # Pour mettre à jour uniquement l'image frontend
   ./update-docker-hub.sh -f

   # Pour mettre à jour uniquement l'image backend
   ./update-docker-hub.sh -b

   # Pour spécifier un tag personnalisé
   ./update-docker-hub.sh -a -t v1.0
   ```

4. Lorsque vous y êtes invité, entrez votre mot de passe Docker Hub.

5. Le script vous demandera si vous souhaitez également mettre à jour les déploiements Kubernetes. Répondez `o` pour oui ou `n` pour non.

## Méthode 2: Commandes manuelles

Si vous préférez exécuter les commandes manuellement, voici les étapes à suivre :

### 1. Connexion à Docker Hub

```bash
docker login -u waelbenabid
```

### 2. Construction et envoi des images

#### Pour le frontend :

```bash
# Générer un tag timestamp
$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"  # PowerShell
timestamp=$(date +"%Y%m%d-%H%M%S")  # Bash

# Construire l'image
docker build -t waelbenabid/rh-frontend:latest -t waelbenabid/rh-frontend:$timestamp ./project

# Pousser l'image vers Docker Hub
docker push waelbenabid/rh-frontend:latest
docker push waelbenabid/rh-frontend:$timestamp
```

#### Pour le backend :

```bash
# Construire l'image
docker build -t waelbenabid/rh-backend:latest -t waelbenabid/rh-backend:$timestamp ./back-end

# Pousser l'image vers Docker Hub
docker push waelbenabid/rh-backend:latest
docker push waelbenabid/rh-backend:$timestamp
```

### 3. Mise à jour des déploiements Kubernetes

```bash
# Mettre à jour le déploiement frontend
kubectl set image deployment/rh-frontend rh-frontend=waelbenabid/rh-frontend:$timestamp -n rh-system
kubectl rollout status deployment/rh-frontend -n rh-system

# Mettre à jour le déploiement backend
kubectl set image deployment/rh-backend rh-backend=waelbenabid/rh-backend:$timestamp -n rh-system
kubectl rollout status deployment/rh-backend -n rh-system
```

## Méthode 3: Utilisation du workflow GitHub Actions

Vous pouvez également utiliser le workflow GitHub Actions pour automatiser ce processus. Pour cela :

1. Poussez vos modifications vers GitHub :

   ```bash
   git add .
   git commit -m "Mise à jour du code"
   git push origin main
   ```

2. Allez sur GitHub, dans l'onglet "Actions" de votre dépôt.

3. Cliquez sur "CI/CD Pipeline" dans la liste des workflows.

4. Cliquez sur "Run workflow" et sélectionnez les options appropriées :
   - Cochez "Synchroniser Docker Desktop avec Kubernetes"
   - Cochez "Mettre à jour le frontend" et/ou "Mettre à jour le backend" selon vos besoins
   - Décochez "Utiliser les images Docker locales" si vous souhaitez construire et pousser de nouvelles images

5. Cliquez sur "Run workflow" pour démarrer le processus.

## Vérification

Pour vérifier que vos images ont été correctement mises à jour sur Docker Hub, vous pouvez :

1. Visiter https://hub.docker.com/u/waelbenabid pour voir vos images
2. Exécuter `kubectl get pods -n rh-system` pour vérifier que vos pods sont en cours d'exécution
3. Exécuter `kubectl describe pod <nom-du-pod> -n rh-system` pour voir quelle version de l'image est utilisée

## Dépannage

Si vous rencontrez des problèmes :

1. Vérifiez que Docker Desktop est en cours d'exécution
2. Vérifiez que vous êtes connecté à Docker Hub (`docker login -u waelbenabid`)
3. Vérifiez que kubectl est correctement configuré (`kubectl cluster-info`)
4. Vérifiez les logs des pods pour détecter d'éventuelles erreurs (`kubectl logs <nom-du-pod> -n rh-system`)
