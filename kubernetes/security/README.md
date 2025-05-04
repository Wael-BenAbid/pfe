# Sécurité pour le Système de Gestion RH

Ce répertoire contient les configurations nécessaires pour sécuriser l'application RH System sur Kubernetes.

## Structure des fichiers

- `trivy/` : Contient les configurations pour Trivy (scanner de vulnérabilités)
- `kyverno/` : Contient les politiques de sécurité Kubernetes avec Kyverno
- `network-policies/` : Contient les NetworkPolicies pour sécuriser les communications entre pods

## Prérequis

- Un cluster Kubernetes fonctionnel avec l'application RH System déployée
- kubectl configuré pour communiquer avec votre cluster
- Helm v3 installé (pour le déploiement via Helm)

## Déploiement

### Trivy Scanner

Pour déployer Trivy et configurer des scans réguliers :

```bash
kubectl apply -f trivy/
```

### Politiques Kyverno

Pour déployer Kyverno et appliquer les politiques de sécurité :

```bash
kubectl apply -f kyverno/
```

### Network Policies

Pour appliquer les NetworkPolicies :

```bash
kubectl apply -f network-policies/
```

## Scans de sécurité manuels

Pour lancer un scan manuel des images déployées :

```bash
kubectl create job --from=cronjob/trivy-scan trivy-scan-manual -n security
```

## Visualisation des résultats

Les résultats des scans sont stockés dans des ConfigMaps et peuvent être consultés via :

```bash
kubectl get configmap -n security
kubectl describe configmap trivy-results-<timestamp> -n security
```

## Intégration CI/CD

Des exemples de configuration pour intégrer les scans de sécurité dans votre pipeline CI/CD sont disponibles dans le répertoire `ci-cd/`.
