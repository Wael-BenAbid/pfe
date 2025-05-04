# Monitoring pour le Système de Gestion RH

Ce répertoire contient les configurations nécessaires pour mettre en place le monitoring de l'application RH System sur Kubernetes avec Prometheus et Grafana.

## Structure des fichiers

- `prometheus/` : Contient les configurations pour Prometheus
- `grafana/` : Contient les configurations pour Grafana
- `exporters/` : Contient les configurations pour les exporters (node-exporter, postgres-exporter, etc.)

## Prérequis

- Un cluster Kubernetes fonctionnel avec l'application RH System déployée
- kubectl configuré pour communiquer avec votre cluster
- Helm v3 installé (pour le déploiement via Helm)

## Déploiement

### Option 1: Déploiement manuel avec kubectl

Pour déployer manuellement la stack de monitoring :

```bash
# Créer le namespace pour le monitoring
kubectl apply -f namespace.yaml

# Déployer Prometheus
kubectl apply -f prometheus/

# Déployer les exporters
kubectl apply -f exporters/

# Déployer Grafana
kubectl apply -f grafana/
```

### Option 2: Déploiement avec Helm (recommandé)

Pour déployer la stack de monitoring avec Helm, utilisez le script `install-monitoring.sh` :

```bash
chmod +x install-monitoring.sh
./install-monitoring.sh
```

## Accès aux interfaces

Une fois déployés, les services seront accessibles aux URLs suivantes :

- Prometheus : http://prometheus.rh-system.local
- Grafana : http://grafana.rh-system.local

Pour un environnement de développement local, vous devrez ajouter ces entrées à votre fichier hosts :

```
127.0.0.1 prometheus.rh-system.local
127.0.0.1 grafana.rh-system.local
```

## Informations d'identification par défaut pour Grafana

- Nom d'utilisateur : admin
- Mot de passe : admin

Vous serez invité à changer le mot de passe lors de la première connexion.

## Dashboards Grafana

Plusieurs dashboards sont préconfigurés :

1. **Vue d'ensemble du cluster** : Affiche l'état général du cluster Kubernetes
2. **Performances des applications** : Affiche les métriques spécifiques aux applications (frontend et backend)
3. **Base de données PostgreSQL** : Affiche les métriques de performance de la base de données
4. **Ressources système** : Affiche l'utilisation des ressources (CPU, mémoire, disque, réseau)

## Alertes

Des alertes sont préconfigurées pour vous avertir en cas de problèmes :

1. **Haute utilisation CPU/Mémoire** : Alerte lorsque l'utilisation des ressources dépasse un seuil
2. **Indisponibilité des services** : Alerte lorsqu'un service devient indisponible
3. **Erreurs HTTP** : Alerte en cas d'augmentation des erreurs HTTP
4. **Problèmes de base de données** : Alerte en cas de problèmes avec PostgreSQL
