# Script de nettoyage complet de Minikube pour le projet RH
# Usage: .\cleanup-minikube.ps1

param(
    [switch]$Force = $false,
    [switch]$KeepCertManager = $false
)

Write-Host "🧹 Nettoyage complet de Minikube..." -ForegroundColor Yellow

function Write-Info {
    param($Message)
    Write-Host "[INFO] $Message" -ForegroundColor Blue
}

function Write-Success {
    param($Message)
    Write-Host "[SUCCESS] $Message" -ForegroundColor Green
}

function Write-Warning {
    param($Message)
    Write-Host "[WARNING] $Message" -ForegroundColor Yellow
}

function Write-Error {
    param($Message)
    Write-Host "[ERROR] $Message" -ForegroundColor Red
}

# Confirmation si pas de force
if (-not $Force) {
    $confirmation = Read-Host "⚠️  Êtes-vous sûr de vouloir supprimer TOUT le déploiement ? (y/N)"
    if ($confirmation -ne 'y' -and $confirmation -ne 'Y') {
        Write-Info "Annulation du nettoyage."
        exit 0
    }
}

try {
    # 1. Supprimer les namespaces de l'application
    Write-Info "Suppression des namespaces de l'application..."
    
    $namespaces = @("rh-system", "monitoring", "logging")
    foreach ($ns in $namespaces) {
        $exists = kubectl get namespace $ns 2>$null
        if ($exists) {
            Write-Info "Suppression du namespace: $ns"
            kubectl delete namespace $ns --force --grace-period=0
        }
    }

    # 2. Supprimer les ClusterRoleBindings
    Write-Info "Suppression des ClusterRoleBindings..."
    kubectl get clusterrolebindings -o name | Where-Object { $_ -match "rh-|monitoring|logging" } | ForEach-Object { 
        Write-Info "Suppression: $_"
        kubectl delete $_ 
    }

    # 3. Supprimer les ClusterRoles
    Write-Info "Suppression des ClusterRoles..."
    kubectl get clusterroles -o name | Where-Object { $_ -match "rh-|monitoring|logging" } | ForEach-Object { 
        Write-Info "Suppression: $_"
        kubectl delete $_ 
    }

    # 4. Supprimer les PersistentVolumes
    Write-Info "Suppression des PersistentVolumes..."
    kubectl get pv -o name | Where-Object { $_ -match "rh-|postgres|grafana|prometheus|zipkin|kibana|elasticsearch" } | ForEach-Object { 
        Write-Info "Suppression: $_"
        kubectl delete $_ 
    }

    # 5. Supprimer les ClusterIssuers
    Write-Info "Suppression des ClusterIssuers..."
    kubectl get clusterissuers -o name | Where-Object { $_ -match "selfsigned" } | ForEach-Object { 
        Write-Info "Suppression: $_"
        kubectl delete $_ 
    }

    # 6. Supprimer cert-manager si demandé
    if (-not $KeepCertManager) {
        Write-Info "Suppression de cert-manager..."
        kubectl delete namespace cert-manager --force --grace-period=0 2>$null
    }

    # 7. Nettoyer les images Docker dans Minikube
    Write-Info "Nettoyage des images Docker dans Minikube..."
    minikube ssh "docker system prune -a -f" 2>$null

    # 8. Vérification finale
    Write-Info "Vérification finale..."
    $remainingNamespaces = kubectl get namespaces -o name | Where-Object { $_ -match "rh-|monitoring|logging" }
    if ($remainingNamespaces) {
        Write-Warning "Certains namespaces sont encore présents:"
        $remainingNamespaces | ForEach-Object { Write-Warning "  - $_" }
    } else {
        Write-Success "Tous les namespaces de l'application ont été supprimés"
    }

    $remainingPods = kubectl get pods --all-namespaces | Where-Object { $_ -match "rh-|postgres|grafana|prometheus|zipkin|kibana|elasticsearch" }
    if ($remainingPods) {
        Write-Warning "Certains pods sont encore présents:"
        Write-Warning $remainingPods
    } else {
        Write-Success "Aucun pod de l'application n'est présent"
    }

    Write-Success "Nettoyage terminé !"
    Write-Info "Minikube est maintenant propre et prêt pour un nouveau déploiement."
    
    Write-Host ""
    Write-Host "🚀 Pour redéployer avec HTTPS, utilisez:" -ForegroundColor Cyan
    Write-Host ".\kubernetes\deploy-all-https.ps1" -ForegroundColor Yellow

} catch {
    Write-Error "Erreur lors du nettoyage: $_"
    exit 1
}

Write-Host ""
Write-Host "📊 État final de Minikube:" -ForegroundColor Cyan
kubectl get namespaces
Write-Host ""
Write-Host "💾 Espace disque libéré dans Minikube:" -ForegroundColor Cyan
minikube ssh "df -h /" 2>$null
