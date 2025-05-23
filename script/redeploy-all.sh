#!/bin/bash
# Script pour redéployer l'application complète

echo -e "\e[32mRedéploiement complet de l'application...\e[0m"

# Étape 1: Nettoyage des déploiements précédents
echo -e "\e[33mÉtape 1: Nettoyage des déploiements précédents...\e[0m"
bash ./cleanup.sh

# Étape 2: Mise à jour des images Docker et push vers Docker Hub
echo -e "\e[33mÉtape 2: Mise à jour des images Docker et push vers Docker Hub...\e[0m"
bash ./update-docker-images.sh

# Étape 3: Déploiement sur Docker Desktop
echo -e "\e[33mÉtape 3: Déploiement sur Docker Desktop...\e[0m"
bash ./deploy-docker.sh

# Demander à l'utilisateur s'il souhaite également déployer sur Kubernetes
read -p "Souhaitez-vous également déployer sur Kubernetes? (O/N): " deployKubernetes
if [ "$deployKubernetes" = "O" ] || [ "$deployKubernetes" = "o" ]; then
    # Étape 4: Déploiement sur Kubernetes
    echo -e "\e[33mÉtape 4: Déploiement sur Kubernetes...\e[0m"
    bash ./deploy-kubernetes.sh
fi

echo -e "\e[32mRedéploiement complet terminé avec succès!\e[0m"
