#!/bin/bash

# Script pour diagnostiquer et corriger les problèmes de métriques backend

echo "Diagnostic des problèmes de métriques backend..."

# Obtenir le nom du pod backend
BACKEND_POD=$(kubectl get pods -n rh-system -l app=rh-backend -o jsonpath="{.items[0].metadata.name}")
echo "Pod backend: $BACKEND_POD"

# Vérifier si django-prometheus est installé
echo "Vérification de l'installation de django-prometheus..."
kubectl exec -n rh-system $BACKEND_POD -- pip list | grep django-prometheus

# Vérifier les fichiers de métriques
echo "Vérification des fichiers de métriques..."
kubectl exec -n rh-system $BACKEND_POD -- ls -la /app/Rh_app/prometheus_metrics.py
kubectl exec -n rh-system $BACKEND_POD -- ls -la /app/Rh_app/prometheus_metrics_view.py

# Vérifier la configuration de urls.py
echo "Vérification de urls.py..."
kubectl exec -n rh-system $BACKEND_POD -- grep -A 5 "metrics" /app/SystemeRH_v2/urls.py

# Vérifier la configuration de settings.py
echo "Vérification de settings.py..."
kubectl exec -n rh-system $BACKEND_POD -- grep -A 5 "django_prometheus" /app/SystemeRH_v2/settings.py

# Tester l'accès aux métriques en interne
echo "Test d'accès aux métriques en interne..."
kubectl exec -n rh-system $BACKEND_POD -- curl -v http://localhost:8000/metrics/

# Corriger les problèmes potentiels
echo "Application des corrections..."

# Créer un script de correction
cat <<EOF > /tmp/fix_metrics.py
from django.http import HttpResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_GET
from prometheus_client import generate_latest, CONTENT_TYPE_LATEST
import logging

logger = logging.getLogger(__name__)

@csrf_exempt
@require_GET
def metrics_view(request):
    """
    View that exposes Prometheus metrics without authentication.
    """
    try:
        metrics_data = generate_latest()
        return HttpResponse(metrics_data, content_type=CONTENT_TYPE_LATEST)
    except Exception as e:
        logger.error(f"Error generating metrics: {e}")
        return HttpResponse(f"Error generating metrics: {e}", status=500)
EOF

# Copier le script de correction dans le pod
kubectl cp /tmp/fix_metrics.py rh-system/$BACKEND_POD:/app/Rh_app/prometheus_metrics_view.py

# Redémarrer le pod pour appliquer les changements
echo "Redémarrage du pod backend..."
kubectl delete pod -n rh-system $BACKEND_POD

# Attendre que le pod soit prêt
echo "Attente du redémarrage du pod..."
kubectl wait --for=condition=ready pod -l app=rh-backend -n rh-system --timeout=120s

# Vérifier à nouveau l'accès aux métriques
echo "Vérification de l'accès aux métriques après correction..."
NEW_BACKEND_POD=$(kubectl get pods -n rh-system -l app=rh-backend -o jsonpath="{.items[0].metadata.name}")
kubectl exec -n rh-system $NEW_BACKEND_POD -- curl -v http://localhost:8000/metrics/

echo "Diagnostic et correction terminés!"
