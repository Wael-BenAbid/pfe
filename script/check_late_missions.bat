@echo off
echo Vérification des missions en retard...
cd %~dp0..\back-end
python manage.py check_late_missions
echo Vérification terminée.
pause
