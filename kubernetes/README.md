# Configuration Kubernetes pour le Système de Gestion RH

Ce répertoire contient les fichiers de configuration Kubernetes pour déployer l'application de gestion RH sur un cluster Kubernetes.

## Structure des fichiers

- `deployments/` : Contient les fichiers de déploiement pour le frontend, le backend et PostgreSQL
- `services/` : Contient les définitions de services pour exposer les applications
- `configmaps/` : Contient les ConfigMaps pour la configuration des applications
- `secrets/` : Contient les templates pour les Secrets (les valeurs réelles doivent être ajoutées manuellement)
- `ingress/` : Contient les configurations d'Ingress pour l'accès externe
- `autoscaling/` : Contient les configurations d'autoscaling horizontal (HPA)
- `storage/` : Contient les configurations de stockage persistant
- `helm/` : Contient le chart Helm pour un déploiement simplifié

## Prérequis

- Un cluster Kubernetes fonctionnel (Minikube, GKE, AKS, EKS, etc.)
- kubectl configuré pour communiquer avec votre cluster
- Helm v3 installé (pour le déploiement via Helm)

## Options de déploiement

### 1. Déploiement manuel avec kubectl

Pour déployer manuellement l'application sans Helm, utilisez le script `deploy.sh` :

```bash
chmod +x deploy.sh
./deploy.sh
```

Ce script va :
1. Créer le namespace
2. Appliquer les ConfigMaps
3. Vérifier l'existence des Secrets (vous devez les créer manuellement)
4. Créer le stockage persistant
5. Déployer PostgreSQL
6. Déployer le backend
7. Déployer le frontend
8. Configurer l'auto-scaling
9. Déployer l'ingress

### 2. Déploiement avec Helm

Pour déployer l'application avec Helm, utilisez le script dans le répertoire `helm/` :

```bash
cd helm
chmod +x install-helm.sh
./install-helm.sh
```

Le chart Helm simplifie le déploiement en regroupant toutes les ressources Kubernetes dans un package unique et configurable.

## Configuration des Secrets

Avant de déployer l'application, vous devez créer les secrets nécessaires :

```bash
# Créer les secrets pour le backend
kubectl create secret generic rh-backend-secrets \
  --namespace=rh-system \
  --from-literal=SECRET_KEY='your-django-secret-key' \
  --from-literal=DATABASE_PASSWORD='your-database-password' \
  --from-literal=EMAIL_HOST_USER='your-email@example.com' \
  --from-literal=EMAIL_HOST_PASSWORD='your-email-password' \
  --from-literal=SENDGRID_API_KEY='your-sendgrid-api-key'

# Créer les secrets pour PostgreSQL
kubectl create secret generic postgres-secrets \
  --namespace=rh-system \
  --from-literal=POSTGRES_PASSWORD='your-postgres-password'
```

## Accès à l'application

Une fois déployée, l'application sera accessible via l'Ingress configuré. Par défaut, l'URL sera `http://rh-system.local`.

Pour un environnement de développement local, vous devrez ajouter cette entrée à votre fichier hosts :

```
127.0.0.1 rh-system.local
```

## Surveillance et maintenance

Pour vérifier l'état des pods :
```bash
kubectl get pods -n rh-system
```

Pour voir les logs du backend :
```bash
kubectl logs -n rh-system -l app=rh-backend -f
```

Pour voir les logs du frontend :
```bash
kubectl logs -n rh-system -l app=rh-frontend -f
```

## Mise à l'échelle

L'application est configurée avec des HorizontalPodAutoscalers qui ajusteront automatiquement le nombre de pods en fonction de l'utilisation des ressources.

Pour ajuster manuellement le nombre de réplicas :
```bash
kubectl scale deployment rh-backend -n rh-system --replicas=3
kubectl scale deployment rh-frontend -n rh-system --replicas=3
```
