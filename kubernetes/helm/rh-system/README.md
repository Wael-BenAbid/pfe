# Helm Chart pour RH System

Ce chart Helm permet de déployer l'application RH System sur un cluster Kubernetes.

## Prérequis

- Kubernetes 1.19+
- Helm 3.2.0+
- Un cluster Kubernetes avec un contrôleur Ingress installé (comme NGINX Ingress Controller)
- Un StorageClass disponible pour le stockage persistant

## Installation

### Préparation

Avant d'installer le chart, vous devez créer les secrets nécessaires :

```bash
# Créer le namespace
kubectl create namespace rh-system

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

### Installation du chart

```bash
# Ajouter le repository (si hébergé sur un repository Helm)
# helm repo add my-repo https://charts.example.com/
# helm repo update

# Installation depuis un répertoire local
helm install rh-system ./rh-system -n rh-system
```

## Configuration

Le fichier `values.yaml` contient les valeurs par défaut pour le chart. Vous pouvez personnaliser ces valeurs en créant votre propre fichier de valeurs :

```bash
helm install rh-system ./rh-system -n rh-system -f my-values.yaml
```

### Paramètres principaux

| Paramètre | Description | Valeur par défaut |
|-----------|-------------|-------------------|
| `global.environment` | Environnement de déploiement | `production` |
| `global.domain` | Nom de domaine pour l'ingress | `rh-system.local` |
| `frontend.enabled` | Activer le déploiement du frontend | `true` |
| `frontend.replicaCount` | Nombre de réplicas pour le frontend | `2` |
| `backend.enabled` | Activer le déploiement du backend | `true` |
| `backend.replicaCount` | Nombre de réplicas pour le backend | `2` |
| `postgresql.enabled` | Activer le déploiement de PostgreSQL | `true` |
| `ingress.enabled` | Activer l'ingress | `true` |

## Mise à jour

Pour mettre à jour le déploiement avec de nouvelles valeurs :

```bash
helm upgrade rh-system ./rh-system -n rh-system -f my-values.yaml
```

## Désinstallation

Pour désinstaller le chart :

```bash
helm uninstall rh-system -n rh-system
```

## Persistance des données

Ce chart utilise un PersistentVolumeClaim pour stocker les données PostgreSQL. Assurez-vous que votre cluster dispose d'un StorageClass approprié.

## Sécurité

Les informations sensibles sont stockées dans des secrets Kubernetes. Assurez-vous de créer ces secrets avant d'installer le chart.

## Autoscaling

Le chart prend en charge l'autoscaling horizontal pour le frontend et le backend. Vous pouvez configurer les paramètres d'autoscaling dans le fichier `values.yaml`.
