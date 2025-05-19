# Logging pour RH System

Ce dossier contient les fichiers de configuration pour le logging de RH System.

## Structure

- `elasticsearch/` : Configuration d'Elasticsearch
- `kibana/` : Configuration de Kibana
- `filebeat/` : Configuration de Filebeat pour collecter les logs

## Installation

Pour installer le logging, exécutez le script suivant :

```bash
bash install-logging.sh
```

## Accès

- Kibana : http://kibana.rh-system.local
  - Utilisateur : elastic
  - Mot de passe : elastic123

## Configuration

### Elasticsearch

Elasticsearch est configuré en mode single-node pour stocker les logs.

### Kibana

Kibana est configuré pour se connecter à Elasticsearch et fournir une interface utilisateur pour visualiser les logs.

### Filebeat

Filebeat est configuré pour collecter les logs des conteneurs et les envoyer à Elasticsearch.

## Utilisation

1. Accédez à Kibana via l'URL http://kibana.rh-system.local
2. Connectez-vous avec les identifiants fournis
3. Créez un index pattern pour les logs Filebeat
4. Explorez les logs dans la section "Discover"
