#!/bin/bash
# Script de nettoyage pour supprimer les déploiements précédents

echo -e "\e[33mSuppression des déploiements précédents...\e[0m"

# Vérifier si Minikube est en cours d'exécution
if minikube status &> /dev/null; then
    echo -e "\e[33mSuppression des déploiements Kubernetes...\e[0m"
    
    # Supprimer les déploiements dans le namespace rh-system
    kubectl delete all --all -n rh-system
    kubectl delete pvc --all -n rh-system
    kubectl delete configmap --all -n rh-system
    kubectl delete secret --all -n rh-system
    kubectl delete ingress --all -n rh-system
    
    # Supprimer les déploiements dans le namespace monitoring
    kubectl delete all --all -n monitoring
    kubectl delete pvc --all -n monitoring
    kubectl delete configmap --all -n monitoring
    kubectl delete secret --all -n monitoring
    kubectl delete ingress --all -n monitoring
    
    # Supprimer les déploiements dans le namespace logging
    kubectl delete all --all -n logging
    kubectl delete pvc --all -n logging
    kubectl delete configmap --all -n logging
    kubectl delete secret --all -n logging
    kubectl delete ingress --all -n logging
    
    echo -e "\e[32mDéploiements Kubernetes supprimés avec succès.\e[0m"
else
    echo -e "\e[33mMinikube n'est pas en cours d'exécution, aucun déploiement Kubernetes à supprimer.\e[0m"
fi

# Arrêter les conteneurs Docker
echo -e "\e[33mArrêt des conteneurs Docker...\e[0m"
docker-compose down

# Supprimer les conteneurs et images Docker non utilisés
echo -e "\e[33mNettoyage des conteneurs et images Docker non utilisés...\e[0m"
docker system prune -f

echo -e "\e[32mNettoyage terminé avec succès!\e[0m"
