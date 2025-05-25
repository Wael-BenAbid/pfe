#!/bin/bash

# Script pour mettre à jour le ConfigMap grafana-dashboards avec tous les dashboards

echo "Mise à jour du ConfigMap grafana-dashboards avec tous les dashboards..."

# Créer un fichier temporaire pour le nouveau ConfigMap
cat > /tmp/grafana-dashboards-updated.yaml << 'EOF'
apiVersion: v1
kind: ConfigMap
metadata:
  name: grafana-dashboards
  namespace: monitoring
data:
EOF

# Ajouter le dashboard Kubernetes existant
echo "  kubernetes-dashboard.json: |" >> /tmp/grafana-dashboards-updated.yaml
kubectl get configmap grafana-dashboards -n monitoring -o jsonpath='{.data.kubernetes-dashboard\.json}' | sed 's/^/    /' >> /tmp/grafana-dashboards-updated.yaml

# Ajouter le dashboard Django
echo "  django-backend-dashboard.json: |" >> /tmp/grafana-dashboards-updated.yaml
kubectl get configmap django-backend-dashboard -n monitoring -o jsonpath='{.data.django-metrics-dashboard\.json}' | sed 's/^/    /' >> /tmp/grafana-dashboards-updated.yaml

# Ajouter le dashboard RH System
echo "  rh-system-dashboard.json: |" >> /tmp/grafana-dashboards-updated.yaml
kubectl get configmap rh-system-dashboard -n monitoring -o jsonpath='{.data.rh-system-dashboard\.json}' | sed 's/^/    /' >> /tmp/grafana-dashboards-updated.yaml

# Ajouter le dashboard Zipkin
echo "  zipkin-dashboard.json: |" >> /tmp/grafana-dashboards-updated.yaml
kubectl get configmap zipkin-dashboard -n monitoring -o jsonpath='{.data.zipkin-dashboard\.json}' | sed 's/^/    /' >> /tmp/grafana-dashboards-updated.yaml

# Appliquer le ConfigMap mis à jour
kubectl apply -f /tmp/grafana-dashboards-updated.yaml

# Redémarrer Grafana
kubectl rollout restart deployment/grafana -n monitoring

echo "ConfigMap grafana-dashboards mis à jour avec succès!"
echo "Grafana redémarre pour charger les nouveaux dashboards..."

# Attendre que Grafana soit prêt
kubectl wait --for=condition=ready pod -l app=grafana -n monitoring --timeout=120s

echo "Dashboards disponibles:"
echo "- Kubernetes Dashboard"
echo "- Django Backend Metrics"
echo "- RH System Dashboard"
echo "- Zipkin Dashboard"
echo ""
echo "Accédez à Grafana: https://grafana.rh-system.local/"
