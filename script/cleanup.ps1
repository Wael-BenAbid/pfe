# Script de nettoyage pour supprimer les déploiements précédents
Write-Host "Suppression des déploiements précédents..." -ForegroundColor Yellow

# Vérifier si Minikube est en cours d'exécution
try {
    $minikubeStatus = minikube status | Out-String
    if ($minikubeStatus -match "Running") {
        Write-Host "Suppression des déploiements Kubernetes..." -ForegroundColor Yellow
        
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
        
        Write-Host "Déploiements Kubernetes supprimés avec succès." -ForegroundColor Green
    }
    else {
        Write-Host "Minikube n'est pas en cours d'exécution, aucun déploiement Kubernetes à supprimer." -ForegroundColor Yellow
    }
}
catch {
    Write-Host "Erreur lors de la vérification de l'état de Minikube. Aucun déploiement Kubernetes supprimé." -ForegroundColor Yellow
}

# Arrêter les conteneurs Docker
Write-Host "Arrêt des conteneurs Docker..." -ForegroundColor Yellow
docker-compose down

# Supprimer les conteneurs et images Docker non utilisés
Write-Host "Nettoyage des conteneurs et images Docker non utilisés..." -ForegroundColor Yellow
docker system prune -f

Write-Host "Nettoyage terminé avec succès!" -ForegroundColor Green
