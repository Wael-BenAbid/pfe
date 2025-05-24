#!/bin/bash

# Script pour créer un tableau de bord Grafana directement via l'API

echo "Création d'un tableau de bord Grafana via l'API..."

# Obtenir le pod Grafana
GRAFANA_POD=$(kubectl get pods -n monitoring -l app=grafana -o jsonpath="{.items[0].metadata.name}")
if [ -z "$GRAFANA_POD" ]; then
  echo "Aucun pod Grafana trouvé. Vérifiez que Grafana est déployé."
  exit 1
fi

# Attendre que Grafana soit prêt
echo "Attente que Grafana soit prêt..."
kubectl wait --for=condition=ready pod -l app=grafana -n monitoring --timeout=120s

# Attendre quelques secondes pour que Grafana démarre complètement
echo "Attente de 10 secondes pour que Grafana démarre complètement..."
sleep 10

# Créer un fichier temporaire avec le JSON du tableau de bord
cat <<EOF > /tmp/dashboard.json
{
  "dashboard": {
    "id": null,
    "uid": null,
    "title": "RH System Dashboard",
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
      },
      {
        "id": 3,
        "title": "Scrape Duration",
        "type": "timeseries",
        "datasource": "Prometheus",
        "targets": [
          {
            "expr": "scrape_duration_seconds{job=~\"rh-backend|rh-frontend\"}",
            "refId": "A",
            "legendFormat": "{{job}}"
          }
        ],
        "options": {
          "legend": {
            "calcs": [],
            "displayMode": "list",
            "placement": "bottom",
            "showLegend": true
          },
          "tooltip": {
            "mode": "single",
            "sort": "none"
          }
        },
        "fieldConfig": {
          "defaults": {
            "custom": {
              "drawStyle": "line",
              "lineInterpolation": "linear",
              "barAlignment": 0,
              "lineWidth": 1,
              "fillOpacity": 0,
              "gradientMode": "none",
              "spanNulls": false,
              "showPoints": "auto",
              "pointSize": 5,
              "stacking": {
                "mode": "none",
                "group": "A"
              },
              "axisPlacement": "auto",
              "axisLabel": "",
              "axisColorMode": "text",
              "scaleDistribution": {
                "type": "linear"
              },
              "axisCenteredZero": false,
              "hideFrom": {
                "tooltip": false,
                "viz": false,
                "legend": false
              },
              "thresholdsStyle": {
                "mode": "off"
              }
            },
            "color": {
              "mode": "palette-classic"
            },
            "mappings": [],
            "thresholds": {
              "mode": "absolute",
              "steps": [
                {
                  "color": "green",
                  "value": null
                },
                {
                  "color": "red",
                  "value": 80
                }
              ]
            }
          }
        },
        "gridPos": {
          "h": 8,
          "w": 24,
          "x": 0,
          "y": 8
        }
      }
    ]
  },
  "folderId": 0,
  "overwrite": true
}
EOF

# Copier le fichier dans le pod Grafana
kubectl cp /tmp/dashboard.json monitoring/$GRAFANA_POD:/tmp/dashboard.json

# Créer le tableau de bord via l'API Grafana
echo "Création du tableau de bord via l'API Grafana..."
kubectl exec -n monitoring $GRAFANA_POD -- curl -s -X POST -H "Content-Type: application/json" -d @/tmp/dashboard.json http://admin:admin123@localhost:3000/dashboards/db

echo "Le tableau de bord a été créé dans Grafana."
echo "Vous pouvez y accéder via l'interface Grafana à l'adresse http://grafana.rh-system.local ou http://grafana-ingress.local"
