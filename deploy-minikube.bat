@echo off
echo ========================================
echo    Déploiement complet sur Minikube
echo ========================================

echo.
echo 1. Vérification de Minikube...
minikube status
if %ERRORLEVEL% neq 0 (
    echo Minikube n'est pas démarré. Démarrage...
    minikube start --driver=docker
)

echo.
echo 2. Activation des addons nécessaires...
minikube addons enable ingress
minikube addons enable metrics-server

echo.
echo 3. Création des namespaces...
kubectl create namespace rh-system --dry-run=client -o yaml | kubectl apply -f -
kubectl create namespace monitoring --dry-run=client -o yaml | kubectl apply -f -

echo.
echo 4. Création des secrets...
kubectl create secret generic postgres-secrets ^
  --namespace=rh-system ^
  --from-literal=POSTGRES_PASSWORD=12345 ^
  --dry-run=client -o yaml | kubectl apply -f -

kubectl create secret generic rh-backend-secrets ^
  --namespace=rh-system ^
  --from-literal=SECRET_KEY=django-insecure-your-secret-key-here ^
  --from-literal=DATABASE_PASSWORD=12345 ^
  --from-literal=EMAIL_HOST_USER=waelbenabid1@gmail.com ^
  --from-literal=EMAIL_HOST_PASSWORD=dummy-password ^
  --from-literal=SENDGRID_API_KEY=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 ^
  --dry-run=client -o yaml | kubectl apply -f -

echo.
echo 5. Déploiement des ConfigMaps...
kubectl apply -f kubernetes/configmaps/

echo.
echo 6. Déploiement du stockage...
kubectl apply -f kubernetes/storage/

echo.
echo 7. Déploiement des services...
kubectl apply -f kubernetes/services/

echo.
echo 8. Déploiement de PostgreSQL...
kubectl apply -f kubernetes/deployments/postgres-deployment.yaml

echo.
echo 9. Attente que PostgreSQL soit prêt...
kubectl wait --for=condition=ready pod -l app=postgres-db -n rh-system --timeout=300s

echo.
echo 10. Déploiement du backend...
kubectl apply -f kubernetes/deployments/backend-deployment.yaml

echo.
echo 11. Attente que le backend soit prêt...
kubectl wait --for=condition=ready pod -l app=rh-backend -n rh-system --timeout=300s

echo.
echo 12. Déploiement du frontend...
kubectl apply -f kubernetes/deployments/frontend-deployment.yaml

echo.
echo 13. Déploiement de Zipkin (monitoring)...
kubectl apply -f kubernetes/monitoring/zipkin/zipkin-deployment.yaml

echo.
echo 14. Attente que tous les services soient prêts...
kubectl wait --for=condition=ready pod -l app=rh-frontend -n rh-system --timeout=300s
kubectl wait --for=condition=ready pod -l app=zipkin -n monitoring --timeout=300s

echo.
echo 15. Déploiement de l'Ingress...
kubectl apply -f kubernetes/ingress/ingress.yaml

echo.
echo 16. Configuration des certificats TLS...
kubectl apply -f kubernetes/cert-manager/

echo.
echo ========================================
echo    Déploiement terminé !
echo ========================================
echo.
echo Services disponibles :
echo - Application: https://rh-system.local
echo - Admin: https://rh-system.local/admin
echo - Zipkin: https://zipkin.rh-system.local
echo.
echo Pour accéder aux services :
echo 1. Ajoutez à votre fichier hosts :
echo    192.168.49.2 rh-system.local zipkin.rh-system.local
echo 2. Démarrez le tunnel : minikube tunnel
echo.
echo Vérification des pods :
kubectl get pods -n rh-system
kubectl get pods -n monitoring
echo.
echo Appuyez sur une touche pour fermer...
pause > nul
