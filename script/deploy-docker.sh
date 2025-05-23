#!/bin/bash
# Script de déploiement pour Docker Desktop (Linux/Mac)

echo -e "\e[32mDéploiement de l'application sur Docker Desktop...\e[0m"

# Vérifier si Docker est en cours d'exécution
if ! docker info > /dev/null 2>&1; then
    echo -e "\e[31mDocker Desktop n'est pas en cours d'exécution. Veuillez démarrer Docker Desktop et réessayer.\e[0m"
    exit 1
else
    echo -e "\e[32mDocker Desktop est en cours d'exécution.\e[0m"
fi

# Télécharger les dernières images depuis Docker Hub
echo -e "\e[33mTéléchargement des dernières images depuis Docker Hub...\e[0m"
docker pull waelbenabid/rh-frontend:latest
docker pull waelbenabid/rh-system-backend:latest

# Arrêter les conteneurs existants
echo -e "\e[33mArrêt des conteneurs existants...\e[0m"
docker-compose down

# Démarrer les conteneurs avec les nouvelles images
echo -e "\e[33mDémarrage des conteneurs avec les nouvelles images...\e[0m"
docker-compose up -d

# Vérifier l'état des conteneurs
echo -e "\e[33mVérification de l'état des conteneurs...\e[0m"
docker-compose ps

echo -e "\e[32mDéploiement terminé avec succès!\e[0m"
echo -e "\e[36mL'application est accessible aux adresses suivantes:\e[0m"
echo -e "\e[36m- Frontend: http://localhost:5175\e[0m"
echo -e "\e[36m- Backend API: http://localhost:8000\e[0m"
echo -e "\e[36m- Interface d'administration Django: http://localhost:8000/admin/\e[0m"
echo -e "\e[36m- Zipkin (si activé): http://localhost:9411\e[0m"
