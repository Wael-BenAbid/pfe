#!/bin/bash

# Script d'installation pour les composants de sécurité
set -e

# Vérifier si kubectl est installé
if ! command -v kubectl &> /dev/null; then
    echo "kubectl n'est pas installé. Veuillez l'installer avant de continuer."
    exit 1
fi

# Vérifier la connexion au cluster
echo "Vérification de la connexion au cluster Kubernetes..."
kubectl cluster-info

# Créer le namespace pour la sécurité
echo "Création du namespace security..."
kubectl apply -f namespace.yaml

# Demander confirmation pour continuer
read -p "Voulez-vous continuer avec l'installation des composants de sécurité? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Installation annulée."
    exit 0
fi

# Déployer Trivy
echo "Déploiement de Trivy..."
kubectl apply -f trivy/

# Déployer les NetworkPolicies
echo "Déploiement des NetworkPolicies..."
kubectl apply -f network-policies/

# Déployer Kyverno (si Flux n'est pas utilisé)
echo "Voulez-vous déployer Kyverno avec Helm? (y/n) "
read -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "Installation de Kyverno avec Helm..."
    helm repo add kyverno https://kyverno.github.io/kyverno/
    helm repo update
    helm install kyverno kyverno/kyverno -n kyverno --create-namespace
    
    echo "Attente du démarrage de Kyverno..."
    kubectl wait --for=condition=available --timeout=300s deployment/kyverno -n kyverno
    
    echo "Déploiement des politiques Kyverno..."
    kubectl apply -f kyverno/kyverno-policies.yaml
else
    echo "Déploiement de Kyverno ignoré."
fi

echo "Installation des composants de sécurité terminée avec succès!"
echo "Pour lancer un scan manuel des images, exécutez:"
echo "kubectl create job --from=cronjob/trivy-scan trivy-scan-manual -n security"
