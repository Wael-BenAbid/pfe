#!/usr/bin/env pwsh

# Script de déploiement complet pour l'application RH System sur Kubernetes
# Auteur: Wael Ben Abid
# Date: 2024

param(
    [Parameter(Mandatory=$false)]
    [string]$namespace = "rh-system",

    [Parameter(Mandatory=$false)]
    [switch]$enableHttps = $true,

    [Parameter(Mandatory=$false)]
    [switch]$enableMonitoring = $false,

    [Parameter(Mandatory=$false)]
    [switch]$enableLogging = $false,

    [Parameter(Mandatory=$false)]
    [switch]$enableBackups = $true,

    [Parameter(Mandatory=$false)]
    [switch]$exposeExternally = $false,

    [Parameter(Mandatory=$false)]
    [string]$hostName = "rh-system.local",

    [Parameter(Mandatory=$false)]
    [string]$emailHost = "smtp.gmail.com",

    [Parameter(Mandatory=$false)]
    [string]$emailUser = "waelbenabid1@gmail.com",

    [Parameter(Mandatory=$false)]
    [string]$emailPassword = "rkoe ufhs iike osmz",

    [Parameter(Mandatory=$false)]
    [string]$sendgridApiKey = "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",

    [Parameter(Mandatory=$false)]
    [string]$dbPassword = "12345",

    [Parameter(Mandatory=$false)]
    [switch]$skipConfirmation = $false
)

# Définir les couleurs pour les messages
$colorInfo = "Cyan"
$colorSuccess = "Green"
$colorWarning = "Yellow"
$colorError = "Red"
$colorHighlight = "Magenta"

# Fonction pour afficher des messages
function Write-Message {
    param(
        [Parameter(Mandatory=$true)]
        [string]$message,

        [Parameter(Mandatory=$false)]
        [string]$color = "White"
    )

    Write-Host $message -ForegroundColor $color
}

# Fonction pour afficher une section
function Write-Section {
    param(
        [Parameter(Mandatory=$true)]
        [string]$title
    )

    Write-Host "`n========== $title ==========" -ForegroundColor $colorHighlight
}

# Fonction pour vérifier si une commande existe
function Test-CommandExists {
    param (
        [Parameter(Mandatory=$true)]
        [string]$command
    )

    $exists = $null -ne (Get-Command $command -ErrorAction SilentlyContinue)
    return $exists
}

# Fonction pour attendre qu'un pod soit prêt
function Wait-ForPod {
    param(
        [Parameter(Mandatory=$true)]
        [string]$selector,

        [Parameter(Mandatory=$false)]
        [int]$timeoutSeconds = 300
    )

    Write-Message "Attente que le pod avec le sélecteur '$selector' soit prêt..." -color $colorInfo

    try {
        kubectl wait --for=condition=ready pod -l $selector -n $namespace --timeout=${timeoutSeconds}s
        return $true
    }
    catch {
        Write-Message "Timeout en attendant que le pod soit prêt: $selector" -color $colorWarning
        return $false
    }
}

# Vérifier les prérequis
Write-Section "Vérification des prérequis"

# Vérifier si kubectl est installé
if (-not (Test-CommandExists "kubectl")) {
    Write-Message "kubectl n'est pas installé ou n'est pas dans le PATH. Veuillez l'installer et réessayer." -color $colorError
    exit 1
}
else {
    Write-Message "kubectl est installé" -color $colorSuccess
}

# Vérifier si Minikube est installé
if (-not (Test-CommandExists "minikube")) {
    Write-Message "minikube n'est pas installé ou n'est pas dans le PATH. Veuillez l'installer et réessayer." -color $colorWarning
    Write-Message "Vous pouvez continuer si vous utilisez un autre cluster Kubernetes." -color $colorInfo
}
else {
    # Vérifier si Minikube est en cours d'exécution
    $minikubeStatus = minikube status
    if ($minikubeStatus -match "host: Stopped") {
        Write-Message "Minikube n'est pas en cours d'exécution. Démarrage..." -color $colorWarning
        minikube start --driver=docker
    }
    else {
        Write-Message "Minikube est en cours d'exécution" -color $colorSuccess
    }

    # Vérifier si l'addon ingress est activé
    $ingressOutput = minikube addons list
    $ingressEnabled = $ingressOutput | Select-String "ingress"
    if ($ingressEnabled -match "disabled") {
        Write-Message "L'addon ingress n'est pas activé. Activation..." -color $colorWarning
        minikube addons enable ingress
    }
    else {
        Write-Message "L'addon ingress est activé" -color $colorSuccess
    }

    # Obtenir l'adresse IP de Minikube
    $minikubeIP = minikube ip
    Write-Message "Adresse IP de Minikube: $minikubeIP" -color $colorInfo

    # Ajouter l'entrée dans le fichier hosts si elle n'existe pas déjà
    $hostsFile = "$env:SystemRoot\System32\drivers\etc\hosts"
    $hostsContent = Get-Content $hostsFile
    $hostEntry = "$minikubeIP $hostName"

    if (-not ($hostsContent -match "$hostName")) {
        Write-Message "Ajout de l'entrée '$hostEntry' au fichier hosts..." -color $colorInfo
        if (-not $skipConfirmation) {
            $confirmation = Read-Host "Voulez-vous ajouter cette entrée au fichier hosts? (O/N)"
            if ($confirmation -ne "O" -and $confirmation -ne "o") {
                Write-Message "Vous devrez ajouter manuellement l'entrée suivante à votre fichier hosts:" -color $colorWarning
                Write-Message $hostEntry -color $colorInfo
            }
            else {
                Add-Content -Path $hostsFile -Value $hostEntry -Force
                Write-Message "Entrée ajoutée au fichier hosts" -color $colorSuccess
            }
        }
        else {
            Add-Content -Path $hostsFile -Value $hostEntry -Force
            Write-Message "Entrée ajoutée au fichier hosts" -color $colorSuccess
        }
    }
    else {
        Write-Message "L'entrée pour $hostName existe déjà dans le fichier hosts" -color $colorSuccess
    }
}

# Afficher le résumé de la configuration
Write-Section "Résumé de la configuration"
Write-Message "Namespace: $namespace" -color $colorInfo
Write-Message "Hostname: $hostName" -color $colorInfo
Write-Message "HTTPS: $enableHttps" -color $colorInfo
Write-Message "Monitoring: $enableMonitoring" -color $colorInfo
Write-Message "Logging: $enableLogging" -color $colorInfo
Write-Message "Backups: $enableBackups" -color $colorInfo
Write-Message "Exposition externe: $exposeExternally" -color $colorInfo

# Demander confirmation avant de continuer
if (-not $skipConfirmation) {
    $confirmation = Read-Host "Voulez-vous continuer avec cette configuration? (O/N)"
    if ($confirmation -ne "O" -and $confirmation -ne "o") {
        Write-Message "Déploiement annulé par l'utilisateur" -color $colorWarning
        exit 0
    }
}

# Créer le namespace s'il n'existe pas
Write-Section "Création du namespace"
kubectl create namespace $namespace --dry-run=client -o yaml | kubectl apply -f - --validate=false
Write-Message "Namespace $namespace créé ou déjà existant" -color $colorSuccess

# Créer les secrets
Write-Section "Création des secrets"
kubectl create secret generic postgres-secrets `
    --namespace=$namespace `
    --from-literal=POSTGRES_PASSWORD="$dbPassword" `
    --dry-run=client -o yaml | kubectl apply -f - --validate=false

kubectl create secret generic rh-backend-secrets `
    --namespace=$namespace `
    --from-literal=SECRET_KEY="django-insecure-4!@e#some$%random^&characters" `
    --from-literal=DATABASE_PASSWORD="$dbPassword" `
    --from-literal=EMAIL_HOST_USER="$emailUser" `
    --from-literal=EMAIL_HOST_PASSWORD="$emailPassword" `
    --from-literal=SENDGRID_API_KEY="$sendgridApiKey" `
    --dry-run=client -o yaml | kubectl apply -f - --validate=false

Write-Message "Secrets créés" -color $colorSuccess

# Mettre à jour les ConfigMaps
Write-Section "Mise à jour des ConfigMaps"
$backendConfigMap = Get-Content kubernetes/configmaps/backend-configmap.yaml
$backendConfigMap = $backendConfigMap -replace 'ALLOWED_HOSTS: "localhost,127.0.0.1,rh-backend,rh-frontend,rh-system.local"', "ALLOWED_HOSTS: `"localhost,127.0.0.1,rh-backend,rh-frontend,$hostName,$minikubeIP`""
if ($enableHttps) {
    $backendConfigMap = $backendConfigMap -replace 'FRONTEND_URL: "http://rh-system.local"', "FRONTEND_URL: `"https://$hostName`""
}
else {
    $backendConfigMap = $backendConfigMap -replace 'FRONTEND_URL: "http://rh-system.local"', "FRONTEND_URL: `"http://$hostName`""
}
Set-Content kubernetes/configmaps/backend-configmap.yaml $backendConfigMap

$frontendConfigMap = Get-Content kubernetes/configmaps/frontend-configmap.yaml
if ($enableHttps) {
    $frontendConfigMap = $frontendConfigMap -replace 'API_BASE_URL: "http://rh-system.local/api"', "API_BASE_URL: `"https://$hostName/api`""
}
else {
    $frontendConfigMap = $frontendConfigMap -replace 'API_BASE_URL: "http://rh-system.local/api"', "API_BASE_URL: `"http://$hostName/api`""
}
Set-Content kubernetes/configmaps/frontend-configmap.yaml $frontendConfigMap

# Déployer les ConfigMaps
Write-Message "Déploiement des ConfigMaps..." -color $colorInfo
kubectl apply -f kubernetes/configmaps/ -n $namespace --validate=false
Write-Message "ConfigMaps déployés" -color $colorSuccess

# Déployer le stockage
Write-Section "Déploiement du stockage"
kubectl apply -f kubernetes/storage/ -n $namespace --validate=false
Write-Message "Stockage déployé" -color $colorSuccess

# Configurer PostgreSQL
Write-Section "Configuration de PostgreSQL"
Write-Message "Utilisation de la base de données Docker existante..." -color $colorInfo

# Créer un service pour accéder à la base de données Docker depuis Kubernetes
$dbServiceYaml = @"
apiVersion: v1
kind: Service
metadata:
  name: postgres-db
  namespace: $namespace
spec:
  type: ExternalName
  externalName: host.docker.internal
  ports:
  - port: 5433
    targetPort: 5433
"@

$dbServiceYaml | Out-File -FilePath "kubernetes/services/postgres-external-service.yaml" -Encoding utf8
kubectl apply -f kubernetes/services/postgres-external-service.yaml -n $namespace --validate=false

Write-Message "Service pour accéder à la base de données Docker créé" -color $colorSuccess

# Déployer le backend
Write-Section "Déploiement du backend"
kubectl apply -f kubernetes/deployments/backend-deployment.yaml -n $namespace --validate=false
kubectl apply -f kubernetes/services/backend-service.yaml -n $namespace --validate=false

# Attendre que le backend soit prêt
Wait-ForPod "app=rh-backend" 300
Write-Message "Backend déployé" -color $colorSuccess

# Déployer le frontend
Write-Section "Déploiement du frontend"
kubectl apply -f kubernetes/deployments/frontend-deployment.yaml -n $namespace
kubectl apply -f kubernetes/services/frontend-service.yaml -n $namespace

# Attendre que le frontend soit prêt
Wait-ForPod "app=rh-frontend" 300
Write-Message "Frontend déployé" -color $colorSuccess

# Déployer cert-manager si HTTPS est activé
if ($enableHttps) {
    Write-Section "Déploiement de cert-manager"

    # Vérifier si cert-manager est déjà installé
    $certManagerPods = kubectl get pods -n cert-manager -l app.kubernetes.io/instance=cert-manager --ignore-not-found
    if (-not $certManagerPods) {
        Write-Message "cert-manager n'est pas installé. Installation..." -color $colorInfo

        # Créer le namespace cert-manager
        kubectl create namespace cert-manager --dry-run=client -o yaml | kubectl apply -f -

        # Télécharger le manifeste cert-manager
        $certManagerVersion = "v1.14.3"
        $certManagerUrl = "https://github.com/cert-manager/cert-manager/releases/download/$certManagerVersion/cert-manager.yaml"
        $certManagerYaml = "cert-manager.yaml"

        Write-Message "Téléchargement du manifeste cert-manager $certManagerVersion..." -color $colorInfo
        Invoke-WebRequest -Uri $certManagerUrl -OutFile $certManagerYaml

        # Appliquer le manifeste
        Write-Message "Application du manifeste cert-manager..." -color $colorInfo
        kubectl apply -f $certManagerYaml

        # Attendre que cert-manager soit prêt
        Write-Message "Attente que cert-manager soit prêt..." -color $colorInfo
        Start-Sleep -Seconds 30
        kubectl -n cert-manager wait --for=condition=ready pod -l app.kubernetes.io/instance=cert-manager --timeout=300s
    }
    else {
        Write-Message "cert-manager est déjà installé" -color $colorSuccess
    }

    # Appliquer les émetteurs de certificats
    Write-Message "Application des émetteurs de certificats..." -color $colorInfo
    kubectl apply -f kubernetes/cert-manager/selfsigned-issuer.yaml

    # Attendre que les émetteurs soient prêts
    Write-Message "Attente que les émetteurs soient prêts..." -color $colorInfo
    Start-Sleep -Seconds 10

    # Appliquer l'ingress avec TLS
    Write-Message "Application de l'ingress avec TLS..." -color $colorInfo
    kubectl apply -f kubernetes/ingress/ingress-tls.yaml -n $namespace

    Write-Message "cert-manager et ingress TLS déployés" -color $colorSuccess
}
else {
    # Appliquer l'ingress standard
    Write-Section "Déploiement de l'ingress"
    kubectl apply -f kubernetes/ingress/ingress.yaml -n $namespace
    Write-Message "Ingress déployé" -color $colorSuccess
}

# Déployer les backups si activés
if ($enableBackups) {
    Write-Section "Configuration des backups"
    kubectl apply -f kubernetes/backup/ -n $namespace
    Write-Message "Système de backup configuré" -color $colorSuccess
}

# Exposer l'application en externe si demandé
if ($exposeExternally) {
    Write-Section "Exposition de l'application en externe"

    # Obtenir l'adresse IP locale
    $localIP = (Get-NetIPAddress | Where-Object { $_.AddressFamily -eq 'IPv4' -and $_.PrefixOrigin -eq 'Dhcp' }).IPAddress
    Write-Message "Adresse IP locale: $localIP" -color $colorInfo

    # Configurer les services NodePort
    Write-Message "Configuration des services NodePort..." -color $colorInfo
    kubectl patch service rh-frontend -n $namespace -p '{"spec": {"type": "NodePort", "ports": [{"port": 80, "nodePort": 30090}]}}' | Out-Null
    kubectl patch service rh-backend -n $namespace -p '{"spec": {"type": "NodePort", "ports": [{"port": 8000, "nodePort": 30091}]}}' | Out-Null

    # Démarrer le tunnel Minikube
    Write-Message "Démarrage du tunnel Minikube en arrière-plan..." -color $colorInfo
    Start-Process -FilePath "minikube" -ArgumentList "tunnel" -WindowStyle Hidden

    Write-Message "L'application est exposée en externe" -color $colorSuccess
    Write-Message "Frontend: http://$localIP:30090" -color $colorInfo
    Write-Message "Backend: http://$localIP:30091" -color $colorInfo
}

# Afficher les ressources déployées
Write-Section "Ressources déployées"
Write-Message "Pods:" -color $colorInfo
kubectl get pods -n $namespace
Write-Message "Services:" -color $colorInfo
kubectl get services -n $namespace
Write-Message "Ingress:" -color $colorInfo
kubectl get ingress -n $namespace

# Afficher les instructions pour accéder à l'application
Write-Section "Accès à l'application"
Write-Message "L'application est maintenant déployée sur Kubernetes!" -color $colorSuccess

if (Test-CommandExists "minikube") {
    Write-Message "Pour accéder à l'application, vous devez:" -color $colorInfo
    Write-Message "1. Vérifier que l'entrée suivante est dans votre fichier hosts:" -color $colorInfo
    Write-Message "   $minikubeIP $hostName" -color $colorInfo
    Write-Message "2. Démarrer le tunnel Minikube (si ce n'est pas déjà fait):" -color $colorInfo
    Write-Message "   minikube tunnel" -color $colorInfo
}

Write-Message "3. Accéder à l'application via:" -color $colorInfo
if ($enableHttps) {
    Write-Message "   Frontend: https://$hostName/" -color $colorSuccess
    Write-Message "   Backend API: https://$hostName/api/" -color $colorSuccess
    Write-Message "   Admin: https://$hostName/admin/" -color $colorSuccess
}
else {
    Write-Message "   Frontend: http://$hostName/" -color $colorSuccess
    Write-Message "   Backend API: http://$hostName/api/" -color $colorSuccess
    Write-Message "   Admin: http://$hostName/admin/" -color $colorSuccess
}

Write-Section "Fin du déploiement"
