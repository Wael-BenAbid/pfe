#!/bin/bash
# Script de déploiement pour Kubernetes

echo -e "\e[32mDéploiement de l'application sur Kubernetes...\e[0m"

# Vérifier si kubectl est installé
if ! command -v kubectl &> /dev/null; then
    echo -e "\e[31mkubectl n'est pas installé. Veuillez l'installer et réessayer.\e[0m"
    exit 1
else
    echo -e "\e[32mkubectl est installé.\e[0m"
fi

# Vérifier si Minikube est en cours d'exécution
if ! minikube status &> /dev/null; then
    echo -e "\e[33mMinikube n'est pas en cours d'exécution. Démarrage de Minikube...\e[0m"
    minikube start --driver=docker
else
    echo -e "\e[32mMinikube est en cours d'exécution.\e[0m"
fi

# Activer les addons nécessaires
echo -e "\e[33mActivation des addons nécessaires...\e[0m"
minikube addons enable ingress
minikube addons enable metrics-server

# Créer le namespace rh-system s'il n'existe pas
echo -e "\e[33mCréation du namespace rh-system...\e[0m"
kubectl create namespace rh-system --dry-run=client -o yaml | kubectl apply -f - --validate=false

# Créer le namespace monitoring s'il n'existe pas
echo -e "\e[33mCréation du namespace monitoring...\e[0m"
kubectl create namespace monitoring --dry-run=client -o yaml | kubectl apply -f - --validate=false

# Créer le namespace logging s'il n'existe pas
echo -e "\e[33mCréation du namespace logging...\e[0m"
kubectl create namespace logging --dry-run=client -o yaml | kubectl apply -f - --validate=false

# Installer cert-manager
echo -e "\e[33mInstallation de cert-manager...\e[0m"
kubectl apply -f cert-manager.yaml --validate=false

# Attendre que cert-manager soit prêt
echo -e "\e[33mAttente que cert-manager soit prêt...\e[0m"
kubectl wait --for=condition=Available deployment/cert-manager -n cert-manager --timeout=120s
kubectl wait --for=condition=Available deployment/cert-manager-cainjector -n cert-manager --timeout=120s
kubectl wait --for=condition=Available deployment/cert-manager-webhook -n cert-manager --timeout=120s

# Déployer les ConfigMaps
echo -e "\e[33mDéploiement des ConfigMaps...\e[0m"
kubectl apply -f kubernetes/configmaps/ --validate=false

# Déployer les secrets
echo -e "\e[33mDéploiement des secrets...\e[0m"
kubectl apply -f kubernetes/secrets/ --validate=false

# Déployer le stockage
echo -e "\e[33mDéploiement du stockage...\e[0m"
kubectl apply -f kubernetes/storage/ --validate=false

# Déployer PostgreSQL
echo -e "\e[33mDéploiement de PostgreSQL...\e[0m"
kubectl apply -f kubernetes/deployments/postgres-deployment.yaml --validate=false
kubectl apply -f kubernetes/services/postgres-service.yaml --validate=false

# Attendre que PostgreSQL soit prêt
echo -e "\e[33mAttente que PostgreSQL soit prêt...\e[0m"
kubectl wait --for=condition=Available deployment/postgres-db -n rh-system --timeout=120s

# Déployer Zipkin
echo -e "\e[33mDéploiement de Zipkin...\e[0m"
kubectl apply -f kubernetes/monitoring/zipkin/zipkin-deployment.yaml --validate=false
kubectl apply -f kubernetes/monitoring/zipkin/zipkin-service.yaml --validate=false

# Attendre que Zipkin soit prêt
echo -e "\e[33mAttente que Zipkin soit prêt...\e[0m"
kubectl wait --for=condition=Available deployment/zipkin -n monitoring --timeout=120s

# Déployer Prometheus
echo -e "\e[33mDéploiement de Prometheus...\e[0m"
kubectl apply -f kubernetes/monitoring/prometheus/prometheus-rbac.yaml --validate=false
kubectl apply -f kubernetes/monitoring/prometheus/prometheus-configmap.yaml --validate=false
kubectl apply -f kubernetes/monitoring/prometheus/prometheus-deployment.yaml --validate=false
kubectl apply -f kubernetes/monitoring/prometheus/prometheus-service.yaml --validate=false
kubectl apply -f kubernetes/monitoring/prometheus/prometheus-ingress.yaml --validate=false

# Attendre que Prometheus soit prêt
echo -e "\e[33mAttente que Prometheus soit prêt...\e[0m"
kubectl wait --for=condition=Available deployment/prometheus -n monitoring --timeout=120s

# Déployer Grafana
echo -e "\e[33mDéploiement de Grafana...\e[0m"
kubectl apply -f kubernetes/monitoring/grafana/grafana-datasources-configmap.yaml --validate=false
kubectl apply -f kubernetes/monitoring/grafana/grafana-dashboards-configmap.yaml --validate=false
kubectl apply -f kubernetes/monitoring/grafana/grafana-deployment.yaml --validate=false
kubectl apply -f kubernetes/monitoring/grafana/grafana-service.yaml --validate=false
kubectl apply -f kubernetes/monitoring/grafana/grafana-ingress.yaml --validate=false

# Attendre que Grafana soit prêt
echo -e "\e[33mAttente que Grafana soit prêt...\e[0m"
kubectl wait --for=condition=Available deployment/grafana -n monitoring --timeout=120s

# Déployer le backend
echo -e "\e[33mDéploiement du backend...\e[0m"
kubectl apply -f kubernetes/deployments/backend-deployment.yaml --validate=false
kubectl apply -f kubernetes/services/backend-service.yaml --validate=false

# Attendre que le backend soit prêt
echo -e "\e[33mAttente que le backend soit prêt...\e[0m"
kubectl wait --for=condition=Available deployment/rh-backend -n rh-system --timeout=120s

# Déployer le frontend
echo -e "\e[33mDéploiement du frontend...\e[0m"
kubectl apply -f kubernetes/deployments/frontend-deployment.yaml --validate=false
kubectl apply -f kubernetes/services/frontend-service.yaml --validate=false

# Attendre que le frontend soit prêt
echo -e "\e[33mAttente que le frontend soit prêt...\e[0m"
kubectl wait --for=condition=Available deployment/rh-frontend -n rh-system --timeout=120s

# Déployer l'ingress
echo -e "\e[33mDéploiement de l'ingress...\e[0m"
kubectl apply -f kubernetes/ingress/ingress.yaml --validate=false

# Déployer les certificats HTTPS
echo -e "\e[33mDéploiement des certificats HTTPS...\e[0m"
kubectl apply -f kubernetes/cert-manager/selfsigned-issuer.yaml --validate=false
kubectl apply -f kubernetes/cert-manager/certificate.yaml --validate=false

echo -e "\e[32mDéploiement terminé avec succès!\e[0m"
echo -e "\e[36mL'application est accessible aux adresses suivantes:\e[0m"
echo -e "\e[36m- Frontend: https://rh-system.local\e[0m"
echo -e "\e[36m- Backend API: https://rh-system.local/api\e[0m"
echo -e "\e[36m- Interface d'administration Django: https://rh-system.local/admin/\e[0m"
echo -e "\e[36m- Zipkin: http://zipkin.rh-system.local:9411\e[0m"
echo -e "\e[36m- Prometheus: http://prometheus.rh-system.local\e[0m"
echo -e "\e[36m- Grafana: http://grafana.rh-system.local\e[0m"

echo -e "\e[33mN'oubliez pas d'ajouter les entrées suivantes à votre fichier hosts:\e[0m"
echo -e "\e[33m127.0.0.1 rh-system.local\e[0m"
echo -e "\e[33m127.0.0.1 zipkin.rh-system.local\e[0m"
echo -e "\e[33m127.0.0.1 prometheus.rh-system.local\e[0m"
echo -e "\e[33m127.0.0.1 grafana.rh-system.local\e[0m"
