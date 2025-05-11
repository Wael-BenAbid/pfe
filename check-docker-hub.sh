#!/bin/bash
# Script pour vérifier si les images Docker Hub sont à jour
# Ce script récupère les informations sur les images Docker Hub et les affiche

# Configuration
DOCKER_HUB_USERNAME="waelbenabid"
FRONTEND_IMAGE="rh-frontend"
BACKEND_IMAGE="rh-backend"
KUBERNETES_NAMESPACE="rh-system"

# Variables par défaut
CHECK_FRONTEND=false
CHECK_BACKEND=false
CHECK_KUBERNETES=false

# Fonction pour afficher l'aide
show_help() {
    echo "Usage: ./check-docker-hub.sh [options]"
    echo ""
    echo "Options:"
    echo "  -f, --frontend    Vérifier uniquement l'image frontend"
    echo "  -b, --backend     Vérifier uniquement l'image backend"
    echo "  -a, --all         Vérifier les deux images"
    echo "  -k, --kubernetes  Vérifier également les images utilisées dans Kubernetes"
    echo "  -h, --help        Afficher cette aide"
    echo ""
    echo "Exemples:"
    echo "  ./check-docker-hub.sh --all                  # Vérifie les deux images"
    echo "  ./check-docker-hub.sh -f                     # Vérifie uniquement l'image frontend"
    echo "  ./check-docker-hub.sh -a -k                  # Vérifie les deux images et Kubernetes"
    exit 0
}

# Traiter les arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -f|--frontend)
            CHECK_FRONTEND=true
            shift
            ;;
        -b|--backend)
            CHECK_BACKEND=true
            shift
            ;;
        -a|--all)
            CHECK_FRONTEND=true
            CHECK_BACKEND=true
            shift
            ;;
        -k|--kubernetes)
            CHECK_KUBERNETES=true
            shift
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
if [ "$CHECK_FRONTEND" = false ] && [ "$CHECK_BACKEND" = false ]; then
    show_help
fi

# Fonction pour vérifier une image Docker Hub
check_dockerhub_image() {
    local image_name=$1
    
    echo -e "\033[0;36mVérification de l'image $DOCKER_HUB_USERNAME/$image_name...\033[0m"
    
    # Récupérer les informations sur l'image depuis Docker Hub
    response=$(curl -s "https://hub.docker.com/v2/repositories/$DOCKER_HUB_USERNAME/$image_name/tags/latest")
    
    if [ $? -eq 0 ] && [ -n "$response" ] && ! echo "$response" | grep -q "error"; then
        # Extraire les informations
        last_updated=$(echo "$response" | grep -o '"last_updated":"[^"]*"' | cut -d'"' -f4)
        full_size=$(echo "$response" | grep -o '"full_size":[0-9]*' | cut -d':' -f2)
        full_size_mb=$(echo "scale=2; $full_size / 1048576" | bc)
        digest=$(echo "$response" | grep -o '"digest":"[^"]*"' | cut -d'"' -f4)
        
        # Afficher les informations
        echo -e "\033[0;32mImage: $DOCKER_HUB_USERNAME/$image_name\033[0m"
        echo -e "\033[0;32mTag: latest\033[0m"
        echo -e "\033[0;32mDernière mise à jour: $last_updated\033[0m"
        echo -e "\033[0;32mTaille: $full_size_mb MB\033[0m"
        echo -e "\033[0;32mDigest: $digest\033[0m"
        echo ""
        
        return 0
    else
        echo -e "\033[0;31mErreur lors de la récupération des informations pour $DOCKER_HUB_USERNAME/$image_name\033[0m"
        echo -e "\033[0;31mRéponse: $response\033[0m"
        echo ""
        
        return 1
    fi
}

# Fonction pour vérifier une image dans Kubernetes
check_kubernetes_image() {
    local app_name=$1
    local image_name=$2
    
    echo -e "\033[0;36mVérification de l'image $image_name dans Kubernetes...\033[0m"
    
    # Récupérer le nom du pod
    pod_name=$(kubectl get pods -n $KUBERNETES_NAMESPACE -l app=$app_name -o jsonpath="{.items[0].metadata.name}" 2>/dev/null)
    
    if [ -z "$pod_name" ]; then
        echo -e "\033[0;33mAucun pod trouvé pour l'application $app_name\033[0m"
        return
    fi
    
    # Récupérer les détails du pod
    pod_details=$(kubectl describe pod -n $KUBERNETES_NAMESPACE $pod_name 2>/dev/null)
    
    if [ -z "$pod_details" ]; then
        echo -e "\033[0;33mImpossible de récupérer les détails du pod $pod_name\033[0m"
        return
    fi
    
    # Extraire l'image utilisée
    image_line=$(echo "$pod_details" | grep -E "Image:.*$DOCKER_HUB_USERNAME/$image_name")
    
    if [ -n "$image_line" ]; then
        image_tag=$(echo "$image_line" | sed -E "s/.*$DOCKER_HUB_USERNAME\/$image_name:([^ ]+).*/\1/")
        echo -e "\033[0;32mPod: $pod_name\033[0m"
        echo -e "\033[0;32mImage utilisée: $DOCKER_HUB_USERNAME/$image_name:$image_tag\033[0m"
        echo ""
    else
        echo -e "\033[0;33mImpossible de trouver l'image $DOCKER_HUB_USERNAME/$image_name dans le pod $pod_name\033[0m"
        echo ""
    fi
}

# Vérifier l'image frontend si demandé
if [ "$CHECK_FRONTEND" = true ]; then
    check_dockerhub_image $FRONTEND_IMAGE
    frontend_result=$?
    
    if [ "$CHECK_KUBERNETES" = true ] && [ $frontend_result -eq 0 ]; then
        check_kubernetes_image "rh-frontend" $FRONTEND_IMAGE
    fi
fi

# Vérifier l'image backend si demandé
if [ "$CHECK_BACKEND" = true ]; then
    check_dockerhub_image $BACKEND_IMAGE
    backend_result=$?
    
    if [ "$CHECK_KUBERNETES" = true ] && [ $backend_result -eq 0 ]; then
        check_kubernetes_image "rh-backend" $BACKEND_IMAGE
    fi
fi

echo -e "\033[0;32mVérification terminée!\033[0m"
