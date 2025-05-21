#!/bin/bash

# Script principal corrigé pour la configuration de monitoring

echo "Correction de la configuration de monitoring (version 2)..."

# 1. Supprimer les jobs existants pour éviter les erreurs "field is immutable"
echo "Suppression des jobs existants..."
kubectl delete job fix-frontend-metrics -n rh-system --ignore-not-found

# 2. Appliquer les configurations Prometheus
echo "Application des configurations Prometheus..."
kubectl apply -f kubernetes/monitoring/prometheus-metrics-view.yaml
kubectl apply -f kubernetes/monitoring/prometheus-metrics.yaml
kubectl apply -f kubernetes/monitoring/backend-prometheus-fix.yaml
kubectl apply -f kubernetes/monitoring/fix-frontend-metrics.yaml
kubectl apply -f kubernetes/monitoring/prometheus/prometheus-config.yaml

# 3. Appliquer le déploiement backend avec les volumes pour les métriques
echo "Application du déploiement backend..."
kubectl apply -f kubernetes/deployments/backend-deployment.yaml

# 4. Redémarrer les pods pour appliquer les changements
echo "Redémarrage des pods..."
kubectl rollout restart deployment rh-backend -n rh-system
kubectl rollout restart deployment rh-frontend -n rh-system

# 5. Attendre que les pods soient prêts
echo "Attente du redémarrage des pods..."
kubectl rollout status deployment rh-backend -n rh-system
kubectl rollout status deployment rh-frontend -n rh-system

# 6. Créer un ConfigMap pour la source de données Prometheus dans Grafana
echo "Configuration de la source de données Prometheus dans Grafana..."
cat <<EOF > kubernetes/monitoring/grafana/prometheus-datasource.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: grafana-prometheus-datasource
  namespace: monitoring
  labels:
    grafana_datasource: "1"
data:
  prometheus-datasource.yaml: |
    apiVersion: 1
    datasources:
    - name: Prometheus
      type: prometheus
      access: proxy
      url: http://prometheus-service:9090
      isDefault: true
      editable: true
EOF

# 7. Appliquer le ConfigMap de la source de données
kubectl apply -f kubernetes/monitoring/grafana/prometheus-datasource.yaml

# 8. Appliquer le tableau de bord simple
echo "Application du tableau de bord simple..."
kubectl apply -f kubernetes/monitoring/grafana/simple-dashboard-configmap.yaml

# 9. Redémarrer Grafana pour appliquer les changements
echo "Redémarrage de Grafana..."
GRAFANA_POD=$(kubectl get pods -n monitoring -l app=grafana -o jsonpath="{.items[0].metadata.name}")
if [ -n "$GRAFANA_POD" ]; then
  kubectl delete pod -n monitoring $GRAFANA_POD

  # Attendre que le pod soit prêt
  echo "Attente du redémarrage du pod Grafana..."
  kubectl wait --for=condition=ready pod -l app=grafana -n monitoring --timeout=120s

  # Attendre quelques secondes pour que Grafana démarre complètement
  echo "Attente de 10 secondes pour que Grafana démarre complètement..."
  sleep 10

  # Vérifier les sources de données avec les identifiants corrects
  NEW_GRAFANA_POD=$(kubectl get pods -n monitoring -l app=grafana -o jsonpath="{.items[0].metadata.name}")
  echo "Vérification des sources de données dans Grafana..."
  kubectl exec -n monitoring $NEW_GRAFANA_POD -- curl -s http://admin:admin123@localhost:3000/api/datasources
else
  echo "Aucun pod Grafana trouvé. Vérifiez que Grafana est déployé."
fi

# 10. Vérifier les endpoints dans Prometheus
echo "Vérification des endpoints dans Prometheus..."
PROMETHEUS_POD=$(kubectl get pods -n monitoring -l app=prometheus -o jsonpath="{.items[0].metadata.name}")
if [ -n "$PROMETHEUS_POD" ]; then
  echo "Endpoints dans Prometheus :"
  kubectl exec -n monitoring $PROMETHEUS_POD -- wget -qO- http://localhost:9090/api/v1/targets | grep -E "rh-backend|rh-frontend"
else
  echo "Aucun pod Prometheus trouvé. Vérifiez que Prometheus est déployé."
fi

echo "La configuration de monitoring a été corrigée."
echo "Vous pouvez accéder à Grafana via l'interface à l'adresse http://grafana.rh-system.local ou http://grafana-ingress.local"
echo "Identifiants Grafana : admin / admin123"
echo "Vous pouvez accéder à Prometheus via l'interface à l'adresse http://prometheus.rh-system.local ou http://prometheus-ingress.local"
