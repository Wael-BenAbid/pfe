#!/bin/bash
# Script pour mettre à jour les images Docker et les pousser vers Docker Hub

echo -e "\e[32mMise à jour des images Docker et push vers Docker Hub...\e[0m"

# Vérifier si Docker est en cours d'exécution
if ! docker info &> /dev/null; then
    echo -e "\e[31mDocker n'est pas en cours d'exécution. Veuillez démarrer Docker et réessayer.\e[0m"
    exit 1
else
    echo -e "\e[32mDocker est en cours d'exécution.\e[0m"
fi

# Demander les identifiants Docker Hub
read -p "Entrez votre nom d'utilisateur Docker Hub (par défaut: waelbenabid): " dockerHubUsername
if [ -z "$dockerHubUsername" ]; then
    dockerHubUsername="waelbenabid"
fi

read -s -p "Entrez votre mot de passe Docker Hub: " dockerHubPassword
echo ""

# Se connecter à Docker Hub
echo -e "\e[33mConnexion à Docker Hub...\e[0m"
echo "$dockerHubPassword" | docker login -u "$dockerHubUsername" --password-stdin
if [ $? -ne 0 ]; then
    echo -e "\e[31mÉchec de la connexion à Docker Hub. Veuillez vérifier vos identifiants.\e[0m"
    exit 1
fi
echo -e "\e[32mConnexion à Docker Hub réussie.\e[0m"

# Construire l'image du frontend
echo -e "\e[33mConstruction de l'image du frontend...\e[0m"
docker build -t "$dockerHubUsername/rh-frontend:latest" ./project

# Construire l'image du backend
echo -e "\e[33mConstruction de l'image du backend...\e[0m"
docker build -t "$dockerHubUsername/rh-system-backend:latest" ./back-end

# Pousser les images vers Docker Hub
echo -e "\e[33mPush de l'image du frontend vers Docker Hub...\e[0m"
docker push "$dockerHubUsername/rh-frontend:latest"

echo -e "\e[33mPush de l'image du backend vers Docker Hub...\e[0m"
docker push "$dockerHubUsername/rh-system-backend:latest"

echo -e "\e[32mMise à jour des images Docker terminée avec succès!\e[0m"
echo -e "\e[36mLes images suivantes ont été mises à jour et poussées vers Docker Hub:\e[0m"
echo -e "\e[36m- $dockerHubUsername/rh-frontend:latest\e[0m"
echo -e "\e[36m- $dockerHubUsername/rh-system-backend:latest\e[0m"
