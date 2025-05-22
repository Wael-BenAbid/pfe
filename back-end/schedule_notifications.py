#!/usr/bin/env python
"""
Script pour planifier l'exécution des notifications à des heures spécifiques.
Ce script utilise la bibliothèque schedule pour exécuter les commandes Django
à 8h00, 11h30 et 17h00 chaque jour.
"""

import os
import sys
import time
import schedule
import logging
import datetime
import subprocess
from pathlib import Path

# Configurer le logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler('notification_scheduler.log')
    ]
)
logger = logging.getLogger('notification_scheduler')

# Chemin vers le répertoire du projet Django
BASE_DIR = Path(__file__).resolve().parent

def run_command(command):
    """Exécute une commande Django manage.py"""
    try:
        logger.info(f"Exécution de la commande: {command}")
        result = subprocess.run(
            command,
            shell=True,
            check=True,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True
        )
        logger.info(f"Commande exécutée avec succès: {result.stdout}")
        return True
    except subprocess.CalledProcessError as e:
        logger.error(f"Erreur lors de l'exécution de la commande: {e}")
        logger.error(f"Sortie d'erreur: {e.stderr}")
        return False

def morning_job():
    """Tâche exécutée à 8h00"""
    logger.info("Exécution des notifications du matin (8h00)")
    cmd = f"cd {BASE_DIR} && python manage.py scheduled_notifications --time=morning"
    run_command(cmd)

def noon_job():
    """Tâche exécutée à 11h30"""
    logger.info("Exécution des notifications de midi (11h30)")
    cmd = f"cd {BASE_DIR} && python manage.py scheduled_notifications --time=noon"
    run_command(cmd)

def evening_job():
    """Tâche exécutée à 17h00"""
    logger.info("Exécution des notifications du soir (17h00)")
    cmd = f"cd {BASE_DIR} && python manage.py scheduled_notifications --time=evening"
    run_command(cmd)

def main():
    """Fonction principale qui planifie les tâches"""
    logger.info("Démarrage du planificateur de notifications")
    
    # Planifier les tâches
    schedule.every().day.at("08:00").do(morning_job)
    schedule.every().day.at("11:30").do(noon_job)
    schedule.every().day.at("17:00").do(evening_job)
    
    logger.info("Tâches planifiées:")
    logger.info("- Notifications du matin: 08:00")
    logger.info("- Notifications de midi: 11:30")
    logger.info("- Notifications du soir: 17:00")
    
    # Exécuter immédiatement pour tester
    current_hour = datetime.datetime.now().hour
    if 8 <= current_hour < 11:
        logger.info("Exécution immédiate des notifications du matin pour test")
        morning_job()
    elif 11 <= current_hour < 17:
        logger.info("Exécution immédiate des notifications de midi pour test")
        noon_job()
    else:
        logger.info("Exécution immédiate des notifications du soir pour test")
        evening_job()
    
    # Boucle principale
    while True:
        schedule.run_pending()
        time.sleep(60)  # Vérifier toutes les minutes

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        logger.info("Arrêt du planificateur de notifications")
        sys.exit(0)
    except Exception as e:
        logger.error(f"Erreur non gérée: {e}", exc_info=True)
        sys.exit(1)
