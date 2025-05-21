#!/bin/bash

# Script pour créer un tableau de bord simple dans Grafana

echo "Création d'un tableau de bord simple dans Grafana..."

# Obtenir le pod Grafana
GRAFANA_POD=$(kubectl get pods -n monitoring -l app=grafana -o jsonpath="{.items[0].metadata.name}")
if [ -z "$GRAFANA_POD" ]; then
  echo "Aucun pod Grafana trouvé. Vérifiez que Grafana est déployé."
  exit 1
fi

# Créer un fichier de configuration pour le tableau de bord
cat <<EOF > dashboard.json
{
  "dashboard": {
    "id": null,
    "uid": null,
    "title": "RH System Simple Dashboard",
    "tags": ["rh-system"],
    "timezone": "browser",
    "schemaVersion": 16,
    "version": 0,
    "refresh": "10s",
    "panels": [
      {
        "id": 1,
        "title": "Backend Status",
        "type": "stat",
        "datasource": "Prometheus",
        "targets": [
          {
            "expr": "up{job=\"rh-backend\"}",
            "refId": "A"
          }
        ],
        "options": {
          "colorMode": "value",
          "graphMode": "area",
          "justifyMode": "auto",
          "orientation": "auto",
          "reduceOptions": {
            "calcs": [
              "lastNotNull"
            ],
            "fields": "",
            "values": false
          },
          "textMode": "auto"
        },
        "fieldConfig": {
          "defaults": {
            "mappings": [],
            "thresholds": {
              "mode": "absolute",
              "steps": [
                {
                  "color": "red",
                  "value": null
                },
                {
                  "color": "green",
                  "value": 1
                }
              ]
            }
          }
        },
        "gridPos": {
          "h": 8,
          "w": 12,
          "x": 0,
          "y": 0
        }
      },
      {
        "id": 2,
        "title": "Frontend Status",
        "type": "stat",
        "datasource": "Prometheus",
        "targets": [
          {
            "expr": "up{job=\"rh-frontend\"}",
            "refId": "A"
          }
        ],
        "options": {
          "colorMode": "value",
          "graphMode": "area",
          "justifyMode": "auto",
          "orientation": "auto",
          "reduceOptions": {
            "calcs": [
              "lastNotNull"
            ],
            "fields": "",
            "values": false
          },
          "textMode": "auto"
        },
        "fieldConfig": {
          "defaults": {
            "mappings": [],
            "thresholds": {
              "mode": "absolute",
              "steps": [
                {
                  "color": "red",
                  "value": null
                },
                {
                  "color": "green",
                  "value": 1
                }
              ]
            }
          }
        },
        "gridPos": {
          "h": 8,
          "w": 12,
          "x": 12,
          "y": 0
        }
      }
    ]
  },
  "folderId": 0,
  "overwrite": true
}
EOF

# Créer le tableau de bord via l'API Grafana
echo "Création du tableau de bord via l'API Grafana..."
curl -s -X POST -H "Content-Type: application/json" -d @dashboard.json http://admin:admin123@grafana.rh-system.local/api/dashboards/db

echo "Le tableau de bord a été créé dans Grafana."
echo "Vous pouvez y accéder via l'interface Grafana à l'adresse http://grafana.rh-system.local ou http://grafana-ingress.local"
