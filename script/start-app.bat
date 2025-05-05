@echo off
echo Démarrage des port-forwards pour l'application RH System...
echo.
echo Vérification de l'état des pods...
kubectl get pods -n rh-system
echo.
echo Démarrage des port-forwards...
start cmd /k kubectl port-forward -n rh-system svc/rh-frontend 5173:80
start cmd /k kubectl port-forward -n rh-system svc/rh-backend 8000:8000
echo.
echo Application accessible à l'adresse http://localhost:5173
echo API accessible à l'adresse http://localhost:8000/api
echo.
echo Appuyez sur une touche pour quitter...
pause > nul
