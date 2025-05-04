# Centralisation des Logs pour le Système de Gestion RH

Ce répertoire contient les configurations nécessaires pour mettre en place la centralisation des logs de l'application RH System sur Kubernetes avec la stack ELK (Elasticsearch, Logstash, Kibana).

## Structure des fichiers

- `elasticsearch/` : Contient les configurations pour Elasticsearch
- `logstash/` : Contient les configurations pour Logstash
- `kibana/` : Contient les configurations pour Kibana
- `filebeat/` : Contient les configurations pour Filebeat

## Prérequis

- Un cluster Kubernetes fonctionnel avec l'application RH System déployée
- kubectl configuré pour communiquer avec votre cluster
- Helm v3 installé (pour le déploiement via Helm)
- Au moins 8 Go de RAM disponible dans le cluster pour la stack ELK

## Déploiement

### Option 1: Déploiement manuel avec kubectl

Pour déployer manuellement la stack ELK :

```bash
# Créer le namespace pour la centralisation des logs
kubectl apply -f namespace.yaml

# Déployer Elasticsearch
kubectl apply -f elasticsearch/

# Déployer Logstash
kubectl apply -f logstash/

# Déployer Kibana
kubectl apply -f kibana/

# Déployer Filebeat
kubectl apply -f filebeat/
```

### Option 2: Déploiement avec Helm (recommandé)

Pour déployer la stack ELK avec Helm, utilisez le script `install-logging.sh` :

```bash
chmod +x install-logging.sh
./install-logging.sh
```

## Accès à Kibana

Une fois déployé, Kibana sera accessible à l'URL suivante :

- Kibana : http://kibana.rh-system.local

Pour un environnement de développement local, vous devrez ajouter cette entrée à votre fichier hosts :

```
127.0.0.1 kibana.rh-system.local
```

## Dashboards Kibana

Plusieurs dashboards sont préconfigurés :

1. **Vue d'ensemble du système** : Affiche les logs système de tous les nœuds
2. **Logs d'application** : Affiche les logs spécifiques à l'application (frontend et backend)
3. **Logs de base de données** : Affiche les logs de PostgreSQL
4. **Logs d'accès** : Affiche les logs d'accès HTTP (requêtes, codes de statut, temps de réponse)
5. **Logs de sécurité** : Affiche les logs liés à la sécurité (authentification, autorisations)

## Requêtes utiles

Voici quelques exemples de requêtes Kibana pour rechercher des informations spécifiques :

- Erreurs dans le backend : `kubernetes.labels.app:rh-backend AND log:*error*`
- Requêtes HTTP lentes : `kubernetes.labels.app:rh-frontend AND response_time:>1000`
- Tentatives d'authentification échouées : `kubernetes.labels.app:rh-backend AND log:*authentication failed*`
- Logs d'un pod spécifique : `kubernetes.pod.name:rh-backend-5d4d7b9f68-2c6xj`
