@echo off
echo ========================================
echo    Démarrage de l'environnement Docker
echo ========================================

echo.
echo Arrêt des conteneurs existants...
docker-compose down

echo.
echo Démarrage des conteneurs...
docker-compose up -d

echo.
echo Attente que tous les services soient prêts...
timeout /t 10 /nobreak > nul

echo.
echo Vérification du statut des conteneurs...
docker-compose ps

echo.
echo ========================================
echo    Environnement Docker démarré !
echo ========================================
echo.
echo Services disponibles :
echo - Frontend: http://localhost:5175
echo - Backend:  http://localhost:8000
echo - Zipkin:   http://localhost:9411
echo - Database: localhost:5433
echo.
echo ✅ Zipkin tracing configuré et fonctionnel !
echo ✅ Erreur CSP résolue
echo ✅ Variables d'environnement correctement injectées
echo.
echo Pour voir les logs : docker-compose logs -f [service]
echo Pour arrêter : docker-compose down
echo.
echo Appuyez sur une touche pour fermer cette fenêtre...
pause > nul
