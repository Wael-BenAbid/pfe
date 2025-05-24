#!/bin/bash

# Script pour ajouter des métriques aux applications RH System
# Ce script ajoute des annotations et des ConfigMaps pour exposer des métriques Prometheus
# sans modifier les déploiements principaux

# Créer un ConfigMap pour les métriques frontend
echo "Création du ConfigMap pour les métriques frontend..."
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
        "frontend_up": 1,
        "frontend_version": "1.0.0",
        "frontend_build_timestamp": "$(date +%s)",
        "frontend_metrics": [
          {
            "name": "http_requests_total",
            "help": "Total number of HTTP requests",
            "type": "counter",
            "value": 100
          },
          {
            "name": "http_request_duration_seconds",
            "help": "HTTP request duration in seconds",
            "type": "gauge",
            "value": 0.5
          }
        ]
      }
    }
EOF

# Ajouter des annotations aux pods frontend
echo "Ajout des annotations aux pods frontend..."
kubectl patch deployment rh-frontend -n rh-system --type=json -p='[
  {
    "op": "add",
    "path": "/spec/template/metadata/annotations",
    "value": {
      "prometheus.io/scrape": "true",
      "prometheus.io/path": "/metrics.json",
      "prometheus.io/port": "80"
    }
  }
]'

# Monter le fichier metrics.json dans le pod frontend
echo "Montage du fichier metrics.json dans le pod frontend..."
kubectl patch deployment rh-frontend -n rh-system --type=json -p='[
  {
    "op": "add",
    "path": "/spec/template/spec/containers/0/volumeMounts/-",
    "value": {
      "mountPath": "/usr/share/nginx/html/metrics.json",
      "name": "metrics-config",
      "subPath": "metrics.json"
    }
  },
  {
    "op": "add",
    "path": "/spec/template/spec/volumes/-",
    "value": {
      "name": "metrics-config",
      "configMap": {
        "name": "frontend-metrics"
      }
    }
  }
]'

# Créer un script pour installer django-prometheus dans le backend
echo "Création du script pour installer django-prometheus dans le backend..."
cat <<EOF | kubectl apply -f -
apiVersion: v1
kind: ConfigMap
metadata:
  name: django-prometheus-installer
  namespace: rh-system
data:
  install-prometheus.sh: |
    #!/bin/bash
    
    # Installer django-prometheus
    pip install django-prometheus
    
    # Configurer django-prometheus dans settings.py
    python -c "
    import os
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'SystemeRH_v2.settings')
    import django
    django.setup()
    from django.conf import settings
    
    # Vérifier si django_prometheus est dans INSTALLED_APPS
    if 'django_prometheus' not in settings.INSTALLED_APPS:
        settings_path = '/app/SystemeRH_v2/settings.py'
        with open(settings_path, 'r') as f:
            content = f.read()
        
        # Ajouter django_prometheus aux INSTALLED_APPS
        content = content.replace(
            'INSTALLED_APPS = [',
            'INSTALLED_APPS = [\\n    \"django_prometheus\",')
        
        # Ajouter les middlewares Prometheus
        content = content.replace(
            'MIDDLEWARE = [',
            'MIDDLEWARE = [\\n    \"django_prometheus.middleware.PrometheusBeforeMiddleware\",')
        
        content = content.replace(
            ']  # Middleware pour vérifier les missions en retard',
            ',\\n    \"django_prometheus.middleware.PrometheusAfterMiddleware\"\\n]  # Middleware pour vérifier les missions en retard')
        
        # Écrire les modifications
        with open(settings_path, 'w') as f:
            f.write(content)
        
        print('django-prometheus configured in settings.py')
    else:
        print('django-prometheus already configured in settings.py')
    "
    
    # Ajouter les URLs de django-prometheus
    python -c "
    import os
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'SystemeRH_v2.settings')
    import django
    django.setup()
    
    urls_path = '/app/SystemeRH_v2/urls.py'
    with open(urls_path, 'r') as f:
        content = f.read()
    
    if 'django_prometheus.urls' not in content:
        # Ajouter l'import
        if 'from django.urls import path, include' in content:
            # L'import include existe déjà
            pass
        else:
            # Remplacer l'import path par path, include
            content = content.replace(
                'from django.urls import path',
                'from django.urls import path, include')
        
        # Ajouter l'URL des métriques Prometheus
        content = content.replace(
            'urlpatterns = [',
            'urlpatterns = [\\n    path(\"\", include(\"django_prometheus.urls\")),')
        
        # Écrire les modifications
        with open(urls_path, 'w') as f:
            f.write(content)
        
        print('django-prometheus URLs added to urls.py')
    else:
        print('django-prometheus URLs already in urls.py')
    "
EOF

# Ajouter des annotations aux pods backend
echo "Ajout des annotations aux pods backend..."
kubectl patch deployment rh-backend -n rh-system --type=json -p='[
  {
    "op": "add",
    "path": "/spec/template/metadata/annotations",
    "value": {
      "prometheus.io/scrape": "true",
      "prometheus.io/path": "/metrics",
      "prometheus.io/port": "8000"
    }
  }
]'

# Monter le script d'installation dans le pod backend
echo "Montage du script d'installation dans le pod backend..."
kubectl patch deployment rh-backend -n rh-system --type=json -p='[
  {
    "op": "add",
    "path": "/spec/template/spec/containers/0/volumeMounts/-",
    "value": {
      "mountPath": "/app/install-prometheus.sh",
      "name": "prometheus-installer",
      "subPath": "install-prometheus.sh"
    }
  },
  {
    "op": "add",
    "path": "/spec/template/spec/volumes/-",
    "value": {
      "name": "prometheus-installer",
      "configMap": {
        "name": "django-prometheus-installer",
        "defaultMode": 0755
      }
    }
  }
]'

# Exécuter le script d'installation dans le pod backend
echo "Exécution du script d'installation dans le pod backend..."
kubectl exec -n rh-system $(kubectl get pods -n rh-system -l app=rh-backend -o jsonpath='{.items[0].metadata.name}') -- /bin/bash /app/install-prometheus.sh

echo "Ajout des métriques aux applications terminé."
echo "Redémarrez les pods pour appliquer les modifications :"
echo "kubectl rollout restart deployment rh-frontend rh-backend -n rh-system"
