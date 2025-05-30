@echo off
echo ========================================
echo    Vérification du déploiement Minikube
echo ========================================

echo.
echo 1. Statut de Minikube...
minikube status

echo.
echo 2. Statut des pods rh-system...
kubectl get pods -n rh-system -o wide

echo.
echo 3. Statut des services...
kubectl get services -n rh-system

echo.
echo 5. Statut de l'Ingress...
kubectl get ingress -n rh-system

echo.
echo 6. Logs du backend (dernières 10 lignes)...
kubectl logs -n rh-system -l app=rh-backend --tail=10

echo.
echo 7. Logs du frontend (dernières 10 lignes)...
kubectl logs -n rh-system -l app=rh-frontend --tail=10

echo.
echo 8. Logs de Zipkin (dernières 10 lignes)...
kubectl logs -n rh-system -l app=zipkin --tail=10

echo.
echo 9. Test de connectivité...
echo Testing backend health...
kubectl exec -n rh-system deployment/rh-backend -- curl -s http://localhost:8000/admin/ | head -5

echo.
echo Testing frontend...
kubectl exec -n rh-system deployment/rh-frontend -- curl -s http://localhost/env.js

echo.
echo Testing Zipkin...
kubectl exec -n rh-system deployment/zipkin -- curl -s http://localhost:9411/health

echo.
echo ========================================
echo    Vérification terminée !
echo ========================================
echo.
echo Pour accéder aux services :
echo - Application: https://rh-system.local
echo - Zipkin: https://zipkin.rh-system.local
echo.
echo N'oubliez pas de démarrer le tunnel : minikube tunnel
echo.
pause
