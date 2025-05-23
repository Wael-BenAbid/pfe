# Script de déploiement pour Kubernetes
Write-Host "Déploiement de l'application sur Kubernetes..." -ForegroundColor Green

# Vérifier si kubectl est installé
try {
    kubectl version --client | Out-Null
    Write-Host "kubectl est installé." -ForegroundColor Green
}
catch {
    Write-Host "kubectl n'est pas installé. Veuillez l'installer et réessayer." -ForegroundColor Red
    exit 1
}

# Vérifier si Minikube est en cours d'exécution
try {
    $minikubeStatus = minikube status | Out-String
    if ($minikubeStatus -match "Running") {
        Write-Host "Minikube est en cours d'exécution." -ForegroundColor Green
    }
    else {
        Write-Host "Minikube n'est pas en cours d'exécution. Démarrage de Minikube..." -ForegroundColor Yellow
        minikube start --driver=docker
    }
}
catch {
    Write-Host "Erreur lors de la vérification de l'état de Minikube. Démarrage de Minikube..." -ForegroundColor Yellow
    minikube start --driver=docker
}

# Activer les addons nécessaires
Write-Host "Activation des addons nécessaires..." -ForegroundColor Yellow
minikube addons enable ingress
minikube addons enable metrics-server

# Créer le namespace rh-system s'il n'existe pas
Write-Host "Création du namespace rh-system..." -ForegroundColor Yellow
kubectl create namespace rh-system --dry-run=client -o yaml | kubectl apply -f -

# Créer le namespace monitoring s'il n'existe pas
Write-Host "Création du namespace monitoring..." -ForegroundColor Yellow
kubectl create namespace monitoring --dry-run=client -o yaml | kubectl apply -f -

# Créer le namespace logging s'il n'existe pas
Write-Host "Création du namespace logging..." -ForegroundColor Yellow
kubectl create namespace logging --dry-run=client -o yaml | kubectl apply -f -

# Installer cert-manager
Write-Host "Installation de cert-manager..." -ForegroundColor Yellow
kubectl apply -f cert-manager.yaml

# Attendre que cert-manager soit prêt
Write-Host "Attente que cert-manager soit prêt..." -ForegroundColor Yellow
kubectl wait --for=condition=Available deployment/cert-manager -n cert-manager --timeout=120s
kubectl wait --for=condition=Available deployment/cert-manager-cainjector -n cert-manager --timeout=120s
kubectl wait --for=condition=Available deployment/cert-manager-webhook -n cert-manager --timeout=120s

# Déployer les ConfigMaps
Write-Host "Déploiement des ConfigMaps..." -ForegroundColor Yellow
kubectl apply -f kubernetes/configmaps/

# Déployer les secrets
Write-Host "Déploiement des secrets..." -ForegroundColor Yellow
kubectl apply -f kubernetes/secrets/

# Déployer le stockage
Write-Host "Déploiement du stockage..." -ForegroundColor Yellow
kubectl apply -f kubernetes/storage/

# Déployer PostgreSQL
Write-Host "Déploiement de PostgreSQL..." -ForegroundColor Yellow
kubectl apply -f kubernetes/deployments/postgres-deployment.yaml
kubectl apply -f kubernetes/services/postgres-service.yaml

# Attendre que PostgreSQL soit prêt
Write-Host "Attente que PostgreSQL soit prêt..." -ForegroundColor Yellow
kubectl wait --for=condition=Available deployment/postgres-db -n rh-system --timeout=120s

# Déployer Zipkin
Write-Host "Déploiement de Zipkin..." -ForegroundColor Yellow
kubectl apply -f kubernetes/monitoring/zipkin/zipkin-deployment.yaml

# Attendre que Zipkin soit prêt
Write-Host "Attente que Zipkin soit prêt..." -ForegroundColor Yellow
kubectl wait --for=condition=Available deployment/zipkin -n monitoring --timeout=120s

# Déployer Prometheus
Write-Host "Déploiement de Prometheus..." -ForegroundColor Yellow
kubectl apply -f kubernetes/monitoring/prometheus/prometheus-rbac.yaml
kubectl apply -f kubernetes/monitoring/prometheus/prometheus-configmap.yaml
kubectl apply -f kubernetes/monitoring/prometheus/prometheus-deployment.yaml
kubectl apply -f kubernetes/monitoring/prometheus/prometheus-service.yaml
kubectl apply -f kubernetes/monitoring/prometheus/prometheus-ingress.yaml

# Attendre que Prometheus soit prêt
Write-Host "Attente que Prometheus soit prêt..." -ForegroundColor Yellow
kubectl wait --for=condition=Available deployment/prometheus -n monitoring --timeout=120s

# Déployer Grafana
Write-Host "Déploiement de Grafana..." -ForegroundColor Yellow
kubectl apply -f kubernetes/monitoring/grafana/grafana-datasources-configmap.yaml
kubectl apply -f kubernetes/monitoring/grafana/grafana-dashboards-configmap.yaml
kubectl apply -f kubernetes/monitoring/grafana/grafana-deployment.yaml
kubectl apply -f kubernetes/monitoring/grafana/grafana-service.yaml
kubectl apply -f kubernetes/monitoring/grafana/grafana-ingress.yaml

# Attendre que Grafana soit prêt
Write-Host "Attente que Grafana soit prêt..." -ForegroundColor Yellow
kubectl wait --for=condition=Available deployment/grafana -n monitoring --timeout=120s

# Déployer le backend
Write-Host "Déploiement du backend..." -ForegroundColor Yellow
kubectl apply -f kubernetes/deployments/backend-deployment.yaml
kubectl apply -f kubernetes/services/backend-service.yaml

# Attendre que le backend soit prêt
Write-Host "Attente que le backend soit prêt..." -ForegroundColor Yellow
kubectl wait --for=condition=Available deployment/rh-backend -n rh-system --timeout=120s

# Déployer le frontend
Write-Host "Déploiement du frontend..." -ForegroundColor Yellow
kubectl apply -f kubernetes/deployments/frontend-deployment.yaml
kubectl apply -f kubernetes/services/frontend-service.yaml

# Attendre que le frontend soit prêt
Write-Host "Attente que le frontend soit prêt..." -ForegroundColor Yellow
kubectl wait --for=condition=Available deployment/rh-frontend -n rh-system --timeout=120s

# Déployer l'ingress
Write-Host "Déploiement de l'ingress..." -ForegroundColor Yellow
kubectl apply -f kubernetes/ingress/ingress.yaml

# Déployer les certificats HTTPS
Write-Host "Déploiement des certificats HTTPS..." -ForegroundColor Yellow
kubectl apply -f kubernetes/cert-manager/selfsigned-issuer.yaml
kubectl apply -f kubernetes/cert-manager/certificate.yaml

Write-Host "Déploiement terminé avec succès!" -ForegroundColor Green
Write-Host "L'application est accessible aux adresses suivantes:" -ForegroundColor Cyan
Write-Host "- Frontend: https://rh-system.local" -ForegroundColor Cyan
Write-Host "- Backend API: https://rh-system.local/api" -ForegroundColor Cyan
Write-Host "- Interface d'administration Django: https://rh-system.local/admin/" -ForegroundColor Cyan
Write-Host "- Zipkin: http://zipkin.rh-system.local:9411" -ForegroundColor Cyan
Write-Host "- Prometheus: http://prometheus.rh-system.local" -ForegroundColor Cyan
Write-Host "- Grafana: http://grafana.rh-system.local" -ForegroundColor Cyan

Write-Host "N'oubliez pas d'ajouter les entrées suivantes à votre fichier hosts:" -ForegroundColor Yellow
Write-Host "127.0.0.1 rh-system.local" -ForegroundColor Yellow
Write-Host "127.0.0.1 zipkin.rh-system.local" -ForegroundColor Yellow
Write-Host "127.0.0.1 prometheus.rh-system.local" -ForegroundColor Yellow
Write-Host "127.0.0.1 grafana.rh-system.local" -ForegroundColor Yellow
