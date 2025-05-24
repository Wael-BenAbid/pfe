#!/bin/bash

# Script pour corriger le tableau de bord Grafana

echo "Vérification et correction du tableau de bord Grafana..."

# 1. Vérifier que Prometheus collecte correctement les métriques
echo "Vérification des métriques dans Prometheus..."

# Obtenir le pod Prometheus
PROMETHEUS_POD=$(kubectl get pods -n monitoring -l app=prometheus -o jsonpath="{.items[0].metadata.name}")
if [ -z "$PROMETHEUS_POD" ]; then
  echo "Aucun pod Prometheus trouvé. Vérifiez que Prometheus est déployé."
  exit 1
fi

# Vérifier les targets dans Prometheus
echo "Vérification des targets dans Prometheus..."
kubectl exec -n monitoring $PROMETHEUS_POD -- curl -s http://localhost:9090/api/v1/targets | grep -E "rh-backend|rh-frontend"

# 2. Vérifier la source de données Prometheus dans Grafana
echo "Vérification de la source de données Prometheus dans Grafana..."

# Obtenir le pod Grafana
GRAFANA_POD=$(kubectl get pods -n monitoring -l app=grafana -o jsonpath="{.items[0].metadata.name}")
if [ -z "$GRAFANA_POD" ]; then
  echo "Aucun pod Grafana trouvé. Vérifiez que Grafana est déployé."
  exit 1
fi

# Créer un fichier de configuration pour la source de données Prometheus
cat <<EOF > /tmp/prometheus-datasource.yaml
apiVersion: 1
datasources:
- name: Prometheus
  type: prometheus
  access: proxy
  url: http://prometheus-service:9090
  isDefault: true
  editable: true
EOF

# Copier le fichier dans le pod Grafana
kubectl cp /tmp/prometheus-datasource.yaml monitoring/$GRAFANA_POD:/tmp/prometheus-datasource.yaml

# Appliquer la configuration
kubectl exec -n monitoring $GRAFANA_POD -- sh -c "mkdir -p /etc/grafana/provisioning/datasources && cp /tmp/prometheus-datasource.yaml /etc/grafana/provisioning/datasources/"

# 3. Mettre à jour le tableau de bord Grafana
echo "Mise à jour du tableau de bord Grafana..."

# Créer un ConfigMap pour le tableau de bord
cat <<EOF > /tmp/rh-system-dashboard.json
{
  "annotations": {
    "list": [
      {
        "builtIn": 1,
        "datasource": {
          "type": "grafana",
          "uid": "-- Grafana --"
        },
        "enable": true,
        "hide": true,
        "iconColor": "rgba(0, 211, 255, 1)",
        "name": "Annotations & Alerts",
        "target": {
          "limit": 100,
          "matchAny": false,
          "tags": [],
          "type": "dashboard"
        },
        "type": "dashboard"
      }
    ]
  },
  "editable": true,
  "fiscalYearStartMonth": 0,
  "graphTooltip": 0,
  "id": null,
  "links": [],
  "liveNow": false,
  "panels": [
    {
      "datasource": {
        "type": "prometheus",
        "uid": "prometheus"
      },
      "fieldConfig": {
        "defaults": {
          "color": {
            "mode": "thresholds"
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
        },
        "overrides": []
      },
      "gridPos": {
        "h": 8,
        "w": 12,
        "x": 0,
        "y": 0
      },
      "id": 2,
      "options": {
        "orientation": "auto",
        "reduceOptions": {
          "calcs": [
            "lastNotNull"
          ],
          "fields": "",
          "values": false
        },
        "showThresholdLabels": false,
        "showThresholdMarkers": true
      },
      "pluginVersion": "9.3.6",
      "title": "Backend Status",
      "type": "gauge",
      "targets": [
        {
          "datasource": {
            "type": "prometheus",
            "uid": "prometheus"
          },
          "expr": "up{job=\"rh-backend\"}",
          "refId": "A"
        }
      ]
    },
    {
      "datasource": {
        "type": "prometheus",
        "uid": "prometheus"
      },
      "fieldConfig": {
        "defaults": {
          "color": {
            "mode": "thresholds"
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
        },
        "overrides": []
      },
      "gridPos": {
        "h": 8,
        "w": 12,
        "x": 12,
        "y": 0
      },
      "id": 3,
      "options": {
        "orientation": "auto",
        "reduceOptions": {
          "calcs": [
            "lastNotNull"
          ],
          "fields": "",
          "values": false
        },
        "showThresholdLabels": false,
        "showThresholdMarkers": true
      },
      "pluginVersion": "9.3.6",
      "title": "Frontend Status",
      "type": "gauge",
      "targets": [
        {
          "datasource": {
            "type": "prometheus",
            "uid": "prometheus"
          },
          "expr": "up{job=\"rh-frontend\"}",
          "refId": "A"
        }
      ]
    },
    {
      "datasource": {
        "type": "prometheus",
        "uid": "prometheus"
      },
      "fieldConfig": {
        "defaults": {
          "color": {
            "mode": "palette-classic"
          },
          "custom": {
            "axisCenteredZero": false,
            "axisColorMode": "text",
            "axisLabel": "",
            "axisPlacement": "auto",
            "barAlignment": 0,
            "drawStyle": "line",
            "fillOpacity": 0.5,
            "gradientMode": "none",
            "hideFrom": {
              "legend": false,
              "tooltip": false,
              "viz": false
            },
            "lineInterpolation": "linear",
            "lineWidth": 1,
            "pointSize": 5,
            "scaleDistribution": {
              "type": "linear"
            },
            "showPoints": "auto",
            "spanNulls": false,
            "stacking": {
              "group": "A",
              "mode": "none"
            },
            "thresholdsStyle": {
              "mode": "off"
            }
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
        },
        "overrides": []
      },
      "gridPos": {
        "h": 8,
        "w": 24,
        "x": 0,
        "y": 8
      },
      "id": 4,
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
      "title": "HTTP Request Duration",
      "type": "timeseries",
      "targets": [
        {
          "datasource": {
            "type": "prometheus",
            "uid": "prometheus"
          },
          "expr": "rate(http_request_duration_seconds_sum[5m]) / rate(http_request_duration_seconds_count[5m])",
          "refId": "A"
        }
      ]
    }
  ],
  "refresh": "5s",
  "schemaVersion": 37,
  "style": "dark",
  "tags": ["rh-system"],
  "templating": {
    "list": []
  },
  "time": {
    "from": "now-6h",
    "to": "now"
  },
  "timepicker": {},
  "timezone": "",
  "title": "RH System Dashboard",
  "uid": "rh-system-dashboard",
  "version": 1,
  "weekStart": ""
}
EOF

# Créer un ConfigMap pour le tableau de bord
kubectl create configmap rh-system-dashboard -n monitoring --from-file=/tmp/rh-system-dashboard.json -o yaml --dry-run=client | kubectl apply -f -

# Ajouter le label pour que Grafana détecte le tableau de bord
kubectl label configmap rh-system-dashboard -n monitoring grafana_dashboard=1

# Redémarrer Grafana pour appliquer les changements
echo "Redémarrage de Grafana..."
kubectl delete pod -n monitoring $GRAFANA_POD

# Attendre que le pod soit prêt
echo "Attente du redémarrage du pod Grafana..."
kubectl wait --for=condition=ready pod -l app=grafana -n monitoring --timeout=120s

echo "Le tableau de bord Grafana a été mis à jour."
echo "Vous pouvez y accéder via l'interface Grafana à l'adresse http://grafana.rh-system.local ou http://grafana-ingress.local"
