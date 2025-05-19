# Monitoring pour RH System

Ce dossier contient les fichiers de configuration pour le monitoring de RH System.

## Structure

- `prometheus/` : Configuration de Prometheus
- `exporters/` : Exporters pour collecter des métriques (PostgreSQL, Node, etc.)
- `grafana/` : Configuration de Grafana (optionnel)

## Installation

Pour installer le monitoring, exécutez le script suivant :

```bash
bash install-monitoring.sh
```

## Accès

- Prometheus : http://prometheus.rh-system.local

## Configuration

### Prometheus

Prometheus est configuré pour scraper les métriques des services suivants :
- Prometheus lui-même
- API Server Kubernetes
- Nodes Kubernetes
- PostgreSQL Exporter

### Ajout de métriques pour les applications

Pour ajouter des métriques pour les applications RH System, vous pouvez :

1. Pour le backend Django :
   - Installer django-prometheus dans le conteneur
   - Ajouter django-prometheus aux INSTALLED_APPS
   - Ajouter les middlewares Prometheus
   - Ajouter les URLs de django-prometheus

2. Pour le frontend :
   - Créer un endpoint /metrics.json qui expose des métriques au format JSON

Ces modifications peuvent être faites sans modifier les déploiements principaux, en utilisant des annotations et des ConfigMaps.
