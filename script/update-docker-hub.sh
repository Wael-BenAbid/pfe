#!/bin/bash
# Script pour mettre à jour Docker Hub à partir de l'environnement local
# Ce script construit et pousse les images Docker vers Docker Hub

# Configuration
DOCKER_HUB_USERNAME="waelbenabid"
FRONTEND_IMAGE="rh-frontend"
BACKEND_IMAGE="rh-backend"
KUBERNETES_NAMESPACE="rh-system"

# Variables par défaut
UPDATE_FRONTEND=false
UPDATE_BACKEND=false
TAG="latest"

# Fonction pour afficher l'aide
show_help() {
    echo "Usage: ./update-docker-hub.sh [options]"
    echo ""
    echo "Options:"
    echo "  -f, --frontend    Mettre à jour uniquement l'image frontend"
    echo "  -b, --backend     Mettre à jour uniquement l'image backend"
    echo "  -a, --all         Mettre à jour les deux images"
    echo "  -t, --tag TAG     Spécifier un tag pour les images (par défaut: latest)"
    echo "  -h, --help        Afficher cette aide"
    echo ""
    echo "Exemples:"
    echo "  ./update-docker-hub.sh --all                  # Met à jour les deux images avec le tag 'latest'"
    echo "  ./update-docker-hub.sh -f -t v1.0             # Met à jour uniquement l'image frontend avec le tag 'v1.0'"
    echo "  ./update-docker-hub.sh --backend              # Met à jour uniquement l'image backend avec le tag 'latest'"
    exit 0
}

# Traiter les arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -f|--frontend)
            UPDATE_FRONTEND=true
            shift
            ;;
        -b|--backend)
            UPDATE_BACKEND=true
            shift
            ;;
        -a|--all)
            UPDATE_FRONTEND=true
            UPDATE_BACKEND=true
            shift
            ;;
        -t|--tag)
            TAG="$2"
            shift 2
            ;;
        -h|--help)
            show_help
            ;;
        *)
            echo "Option inconnue: $1"
            show_help
            ;;
    esac
done

# Vérifier si aucune option n'est spécifiée
if [ "$UPDATE_FRONTEND" = false ] && [ "$UPDATE_BACKEND" = false ]; then
    show_help
fi

# Générer un timestamp pour le tag si aucun tag n'est spécifié
if [ "$TAG" = "latest" ]; then
    TIMESTAMP=$(date +"%Y%m%d-%H%M%S")
    TAGS="latest,$TIMESTAMP"
else
    TAGS="$TAG"
fi

# Fonction pour construire et pousser une image
build_and_push_image() {
    local image_name=$1
    local context=$2
    local tags=$3
    
    echo "Construction de l'image $image_name..."
    
    # Construire l'image
    IFS=',' read -ra TAGS_ARRAY <<< "$tags"
    TAGS_STRING=""
    for tag_item in "${TAGS_ARRAY[@]}"; do
        TAGS_STRING+="-t $DOCKER_HUB_USERNAME/$image_name:$tag_item "
    done
    
    # Exécuter la commande de construction
    BUILD_COMMAND="docker build $TAGS_STRING $context"
    echo "Exécution de: $BUILD_COMMAND"
    eval $BUILD_COMMAND
    
    if [ $? -ne 0 ]; then
        echo "Erreur lors de la construction de l'image $image_name"
        exit 1
    fi
    
    # Pousser l'image vers Docker Hub
    echo "Envoi de l'image $image_name vers Docker Hub..."
    for tag_item in "${TAGS_ARRAY[@]}"; do
        PUSH_COMMAND="docker push $DOCKER_HUB_USERNAME/$image_name:$tag_item"
        echo "Exécution de: $PUSH_COMMAND"
        eval $PUSH_COMMAND
        
        if [ $? -ne 0 ]; then
            echo "Erreur lors de l'envoi de l'image $image_name:$tag_item vers Docker Hub"
            exit 1
        fi
    done
    
    echo "Image $image_name mise à jour avec succès sur Docker Hub"
}

# Se connecter à Docker Hub
echo "Connexion à Docker Hub..."
docker login -u $DOCKER_HUB_USERNAME
if [ $? -ne 0 ]; then
    echo "Erreur lors de la connexion à Docker Hub"
    exit 1
fi

# Mettre à jour l'image frontend si demandé
if [ "$UPDATE_FRONTEND" = true ]; then
    build_and_push_image "$FRONTEND_IMAGE" "./project" "$TAGS"
fi

# Mettre à jour l'image backend si demandé
if [ "$UPDATE_BACKEND" = true ]; then
    build_and_push_image "$BACKEND_IMAGE" "./back-end" "$TAGS"
fi

echo "Mise à jour de Docker Hub terminée avec succès!"

# Mettre à jour les déploiements Kubernetes si nécessaire
read -p "Voulez-vous mettre à jour les déploiements Kubernetes? (o/n) " UPDATE_K8S
if [ "$UPDATE_K8S" = "o" ] || [ "$UPDATE_K8S" = "O" ]; then
    # Extraire le dernier tag (timestamp)
    IFS=',' read -ra TAGS_ARRAY <<< "$TAGS"
    LAST_TAG="${TAGS_ARRAY[-1]}"
    
    if [ "$UPDATE_FRONTEND" = true ]; then
        echo "Mise à jour du déploiement frontend dans Kubernetes..."
        kubectl set image deployment/rh-frontend rh-frontend=$DOCKER_HUB_USERNAME/$FRONTEND_IMAGE:$LAST_TAG -n $KUBERNETES_NAMESPACE
        kubectl rollout status deployment/rh-frontend -n $KUBERNETES_NAMESPACE
    fi
    
    if [ "$UPDATE_BACKEND" = true ]; then
        echo "Mise à jour du déploiement backend dans Kubernetes..."
        kubectl set image deployment/rh-backend rh-backend=$DOCKER_HUB_USERNAME/$BACKEND_IMAGE:$LAST_TAG -n $KUBERNETES_NAMESPACE
        kubectl rollout status deployment/rh-backend -n $KUBERNETES_NAMESPACE
    fi
    
    echo "Déploiements Kubernetes mis à jour avec succès!"
fi
