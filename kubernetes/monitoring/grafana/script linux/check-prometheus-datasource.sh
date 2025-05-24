#!/bin/bash

# Script pour vérifier et configurer la source de données Prometheus dans Grafana

echo "Vérification de la source de données Prometheus dans Grafana..."

# Obtenir le pod Grafana
GRAFANA_POD=$(kubectl get pods -n monitoring -l app=grafana -o jsonpath="{.items[0].metadata.name}")
if [ -z "$GRAFANA_POD" ]; then
  echo "Aucun pod Grafana trouvé. Vérifiez que Grafana est déployé."
  exit 1
fi

# Vérifier si la source de données Prometheus existe
echo "Vérification des sources de données existantes..."
kubectl exec -n monitoring $GRAFANA_POD -- curl -s http://admin:admin@localhost:3000/api/datasources

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

# Redémarrer Grafana pour appliquer les changements
echo "Redémarrage de Grafana..."
kubectl delete pod -n monitoring $GRAFANA_POD

# Attendre que le pod soit prêt
echo "Attente du redémarrage du pod Grafana..."
kubectl wait --for=condition=ready pod -l app=grafana -n monitoring --timeout=120s

# Vérifier à nouveau si la source de données Prometheus existe
echo "Vérification des sources de données après configuration..."
NEW_GRAFANA_POD=$(kubectl get pods -n monitoring -l app=grafana -o jsonpath="{.items[0].metadata.name}")
kubectl exec -n monitoring $NEW_GRAFANA_POD -- curl -s http://admin:admin@localhost:3000/api/datasources

echo "La source de données Prometheus a été configurée dans Grafana."
echo "Vous pouvez maintenant appliquer les tableaux de bord avec le script apply-simple-dashboard.sh"
