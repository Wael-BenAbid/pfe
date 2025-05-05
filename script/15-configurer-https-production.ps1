#!/usr/bin/env pwsh

# Script pour configurer HTTPS en production sur l'application RH System
# Auteur: Wael Ben Abid
# Date: 06/05/2025

param(
    [Parameter(Mandatory=$true)]
    [string]$domainName
)

# Définir les couleurs pour les messages
$colorInfo = "Cyan"
$colorSuccess = "Green"
$colorWarning = "Yellow"
$colorError = "Red"

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

# Vérifier si le domaine est valide
if (-not $domainName -or $domainName -eq "rh-system.local") {
    Write-Message "Veuillez spécifier un nom de domaine valide pour la production." -color $colorError
    Write-Message "Exemple: .\15-configurer-https-production.ps1 -domainName votredomaine.com" -color $colorInfo
    exit 1
}

# Vérifier si cert-manager est installé
$certManagerPods = kubectl get pods -n cert-manager -l app.kubernetes.io/instance=cert-manager --ignore-not-found
if (-not $certManagerPods) {
    Write-Message "cert-manager n'est pas installé. Installation..." -color $colorWarning
    & .\kubernetes\cert-manager\install-cert-manager.ps1
} else {
    Write-Message "cert-manager est déjà installé." -color $colorInfo
}

# Appliquer les émetteurs de certificats
Write-Message "Application des émetteurs de certificats..." -color $colorInfo
kubectl apply -f kubernetes\cert-manager\letsencrypt-staging-issuer.yaml
kubectl apply -f kubernetes\cert-manager\letsencrypt-prod-issuer.yaml

# Attendre que les émetteurs soient prêts
Write-Message "Attente que les émetteurs soient prêts..." -color $colorInfo
Start-Sleep -Seconds 10

# Créer l'ingress avec TLS pour la production
$ingressContent = @"
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  annotations:
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
    nginx.ingress.kubernetes.io/configuration-snippet: |
      location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, max-age=31536000";
        try_files \$uri \$uri/ =404;
      }
    cert-manager.io/cluster-issuer: "letsencrypt-prod"  # Utiliser letsencrypt-prod pour la production
  name: rh-system-ingress
  namespace: rh-system
spec:
  ingressClassName: nginx
  tls:
  - hosts:
    - $domainName
    secretName: rh-system-tls-prod
  rules:
  - host: $domainName
    http:
      paths:
      - backend:
          service:
            name: rh-backend
            port:
              number: 8000
        path: /api
        pathType: Prefix
      - backend:
          service:
            name: rh-backend
            port:
              number: 8000
        path: /admin
        pathType: Prefix
      - backend:
          service:
            name: rh-frontend
            port:
              number: 80
        path: /
        pathType: Prefix
"@

$ingressFile = "kubernetes\ingress\ingress-tls-prod.yaml"
Set-Content -Path $ingressFile -Value $ingressContent

# Appliquer l'ingress avec TLS
Write-Message "Application de l'ingress avec TLS pour la production..." -color $colorInfo
kubectl apply -f $ingressFile

# Attendre que le certificat soit émis
Write-Message "Attente que le certificat soit émis..." -color $colorInfo
Write-Message "Cela peut prendre quelques minutes..." -color $colorInfo
Start-Sleep -Seconds 60

# Vérifier le certificat
Write-Message "Vérification du certificat..." -color $colorInfo
kubectl get certificate -n rh-system

# Vérifier l'ingress
Write-Message "Vérification de l'ingress..." -color $colorInfo
kubectl get ingress -n rh-system

# Afficher les instructions pour accéder à l'application
Write-Message "HTTPS a été configuré avec succès pour la production!" -color $colorSuccess
Write-Message "Vous pouvez maintenant accéder à l'application via HTTPS:" -color $colorInfo
Write-Message "Frontend: https://$domainName/" -color $colorSuccess
Write-Message "Backend API: https://$domainName/api/" -color $colorSuccess
Write-Message "Backend Admin: https://$domainName/admin/" -color $colorSuccess
Write-Message "Note: Assurez-vous que votre domaine pointe vers l'adresse IP de votre cluster Kubernetes." -color $colorWarning
