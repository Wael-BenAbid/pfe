# Script pour redéployer l'application complète
Write-Host "Redéploiement complet de l'application..." -ForegroundColor Green

# Étape 1: Nettoyage des déploiements précédents
Write-Host "Étape 1: Nettoyage des déploiements précédents..." -ForegroundColor Yellow
& .\cleanup.ps1

# Étape 2: Mise à jour des images Docker et push vers Docker Hub
Write-Host "Étape 2: Mise à jour des images Docker et push vers Docker Hub..." -ForegroundColor Yellow
& .\update-docker-images.ps1

# Étape 3: Déploiement sur Docker Desktop
Write-Host "Étape 3: Déploiement sur Docker Desktop..." -ForegroundColor Yellow
& .\deploy-docker.ps1

# Demander à l'utilisateur s'il souhaite également déployer sur Kubernetes
$deployKubernetes = Read-Host -Prompt "Souhaitez-vous également déployer sur Kubernetes? (O/N)"
if ($deployKubernetes -eq "O" -or $deployKubernetes -eq "o") {
    # Étape 4: Déploiement sur Kubernetes
    Write-Host "Étape 4: Déploiement sur Kubernetes..." -ForegroundColor Yellow
    & .\deploy-kubernetes.ps1
}

Write-Host "Redéploiement complet terminé avec succès!" -ForegroundColor Green
