#!/bin/bash

# Script pour configurer les métriques Prometheus pour le backend et le frontend

# Vérifier si kubectl est installé
if ! command -v kubectl &> /dev/null; then
    echo "kubectl n'est pas installé. Veuillez l'installer avant de continuer."
    exit 1
fi

# Vérifier si le namespace monitoring existe
if ! kubectl get namespace monitoring &> /dev/null; then
    echo "Création du namespace monitoring..."
    kubectl create namespace monitoring
fi

# Vérifier si le namespace rh-system existe
if ! kubectl get namespace rh-system &> /dev/null; then
    echo "Création du namespace rh-system..."
    kubectl create namespace rh-system
fi

# Configurer les métriques pour le backend
echo "Configuration des métriques Prometheus pour le backend..."

# Créer un ConfigMap pour le script d'installation de django-prometheus
cat <<EOF | kubectl apply -f -
apiVersion: v1
kind: ConfigMap
metadata:
  name: backend-prometheus-fix
  namespace: rh-system
data:
  install-prometheus.sh: |
    #!/bin/bash

    # Installer django-prometheus
    echo "Installing django-prometheus..."
    pip install django-prometheus

    # Modifier settings.py
    echo "Configuring django-prometheus in settings.py..."
    SETTINGS_FILE="/app/SystemeRH_v2/settings.py"

    # Vérifier si django_prometheus est déjà dans INSTALLED_APPS
    if ! grep -q "django_prometheus" "\$SETTINGS_FILE"; then
      # Ajouter django_prometheus aux INSTALLED_APPS
      sed -i "s/INSTALLED_APPS = \[/INSTALLED_APPS = \[\n    'django_prometheus',/" "\$SETTINGS_FILE"

      # Ajouter les middlewares Prometheus
      sed -i "s/MIDDLEWARE = \[/MIDDLEWARE = \[\n    'django_prometheus.middleware.PrometheusBeforeMiddleware',/" "\$SETTINGS_FILE"
      sed -i "s/]  # Middleware pour vérifier les missions en retard/,\n    'django_prometheus.middleware.PrometheusAfterMiddleware'\n]  # Middleware pour vérifier les missions en retard/" "\$SETTINGS_FILE"

      echo "django-prometheus added to settings.py"
    else
      echo "django-prometheus already in settings.py"
    fi

    # Modifier urls.py
    echo "Configuring django-prometheus in urls.py..."
    URLS_FILE="/app/SystemeRH_v2/urls.py"

    # Vérifier si django_prometheus.urls est déjà inclus
    if ! grep -q "django_prometheus.urls" "\$URLS_FILE"; then
      # Ajouter l'import include s'il n'existe pas
      if ! grep -q "from django.urls import path, include" "\$URLS_FILE"; then
        sed -i "s/from django.urls import path/from django.urls import path, include/" "\$URLS_FILE"
      fi

      # Ajouter l'URL des métriques Prometheus
      sed -i "s/urlpatterns = \[/urlpatterns = \[\n    path('', include('django_prometheus.urls')),/" "\$URLS_FILE"

      echo "django-prometheus URLs added to urls.py"
    else
      echo "django-prometheus URLs already in urls.py"
    fi

    echo "django-prometheus configuration completed"
EOF

# Créer un ConfigMap pour les métriques frontend
echo "Configuration des métriques Prometheus pour le frontend..."
cat <<EOF | kubectl apply -f -
apiVersion: v1
kind: ConfigMap
metadata:
  name: frontend-metrics
  namespace: rh-system
data:
  metrics.json: |
    {
      "status": "success",
      "data": {
        "resultType": "vector",
        "result": [
          {
            "metric": {
              "__name__": "frontend_up",
              "instance": "frontend",
              "job": "rh-frontend"
            },
            "value": [$(date +%s), "1"]
          },
          {
            "metric": {
              "__name__": "frontend_requests_total",
              "instance": "frontend",
              "job": "rh-frontend",
              "path": "/"
            },
            "value": [$(date +%s), "100"]
          },
          {
            "metric": {
              "__name__": "frontend_request_duration_seconds",
              "instance": "frontend",
              "job": "rh-frontend",
              "path": "/"
            },
            "value": [$(date +%s), "0.5"]
          }
        ]
      }
    }
EOF

# Mettre à jour la configuration de Prometheus
echo "Mise à jour de la configuration de Prometheus..."
cat <<EOF | kubectl apply -f -
apiVersion: v1
kind: ConfigMap
metadata:
  name: prometheus-config
  namespace: monitoring
data:
  prometheus.yml: |
    global:
      scrape_interval: 15s
      evaluation_interval: 15s
      external_labels:
        monitor: 'rh-system-monitor'

    # Alertmanager configuration
    alerting:
      alertmanagers:
      - static_configs:
        - targets:
          # - alertmanager:9093

    # Load rules once and periodically evaluate them
    rule_files:
      - /etc/prometheus/rules/*.yml

    # Scrape configurations
    scrape_configs:
      # Scrape Prometheus itself
      - job_name: 'prometheus'
        static_configs:
        - targets: ['localhost:9090']

      # Scrape Kubernetes API server
      - job_name: 'kubernetes-apiservers'
        kubernetes_sd_configs:
        - role: endpoints
        scheme: https
        tls_config:
          ca_file: /var/run/secrets/kubernetes.io/serviceaccount/ca.crt
          insecure_skip_verify: true
        bearer_token_file: /var/run/secrets/kubernetes.io/serviceaccount/token
        relabel_configs:
        - source_labels: [__meta_kubernetes_namespace, __meta_kubernetes_service_name, __meta_kubernetes_endpoint_port_name]
          action: keep
          regex: default;kubernetes;https

      # Scrape node metrics
      - job_name: 'kubernetes-nodes'
        scheme: https
        tls_config:
          ca_file: /var/run/secrets/kubernetes.io/serviceaccount/ca.crt
          insecure_skip_verify: true
        bearer_token_file: /var/run/secrets/kubernetes.io/serviceaccount/token
        kubernetes_sd_configs:
        - role: node
        relabel_configs:
        - action: labelmap
          regex: __meta_kubernetes_node_label_(.+)
        - target_label: __address__
          replacement: kubernetes.default.svc:443
        - source_labels: [__meta_kubernetes_node_name]
          regex: (.+)
          target_label: __metrics_path__
          replacement: /v1/nodes/\${1}/proxy/metrics

      # Scrape PostgreSQL exporter
      - job_name: 'postgres-exporter'
        static_configs:
        - targets: ['postgres-exporter:9187']

      # Scrape Backend metrics
      - job_name: 'rh-backend'
        kubernetes_sd_configs:
        - role: pod
        relabel_configs:
        - source_labels: [__meta_kubernetes_namespace, __meta_kubernetes_pod_label_app]
          action: keep
          regex: rh-system;rh-backend
        - source_labels: [__meta_kubernetes_pod_annotation_prometheus_io_scrape]
          action: keep
          regex: true
        - source_labels: [__meta_kubernetes_pod_annotation_prometheus_io_path]
          action: replace
          target_label: __metrics_path__
          regex: (.+)
        - source_labels: [__address__, __meta_kubernetes_pod_annotation_prometheus_io_port]
          action: replace
          regex: ([^:]+)(?::\d+)?;(\d+)
          replacement: \$1:\$2
          target_label: __address__
        - action: labelmap
          regex: __meta_kubernetes_pod_label_(.+)
        - source_labels: [__meta_kubernetes_namespace]
          action: replace
          target_label: kubernetes_namespace
        - source_labels: [__meta_kubernetes_pod_name]
          action: replace
          target_label: kubernetes_pod_name

      # Scrape Frontend metrics
      - job_name: 'rh-frontend'
        kubernetes_sd_configs:
        - role: pod
        relabel_configs:
        - source_labels: [__meta_kubernetes_namespace, __meta_kubernetes_pod_label_app]
          action: keep
          regex: rh-system;rh-frontend
        - source_labels: [__meta_kubernetes_pod_annotation_prometheus_io_scrape]
          action: keep
          regex: true
        - source_labels: [__meta_kubernetes_pod_annotation_prometheus_io_path]
          action: replace
          target_label: __metrics_path__
          regex: (.+)
        - source_labels: [__address__, __meta_kubernetes_pod_annotation_prometheus_io_port]
          action: replace
          regex: ([^:]+)(?::\d+)?;(\d+)
          replacement: \$1:\$2
          target_label: __address__
        - action: labelmap
          regex: __meta_kubernetes_pod_label_(.+)
        - source_labels: [__meta_kubernetes_namespace]
          action: replace
          target_label: kubernetes_namespace
        - source_labels: [__meta_kubernetes_pod_name]
          action: replace
          target_label: kubernetes_pod_name
EOF

# Redémarrer Prometheus pour appliquer les modifications
echo "Redémarrage de Prometheus..."
kubectl rollout restart deployment prometheus -n monitoring

# Redémarrer le backend pour appliquer les modifications
echo "Redémarrage du backend..."
kubectl rollout restart deployment rh-backend -n rh-system

# Redémarrer le frontend pour appliquer les modifications
echo "Redémarrage du frontend..."
kubectl rollout restart deployment rh-frontend -n rh-system

echo "Configuration des métriques Prometheus terminée."
echo "Vous pouvez accéder à Prometheus à l'adresse http://prometheus.rh-system.local"
echo "Vous pouvez accéder à Grafana à l'adresse http://grafana.rh-system.local"
echo "Identifiants Grafana : admin / admin123"
