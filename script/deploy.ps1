#!/usr/bin/env pwsh

# Script de déploiement pour l'application RH System
# Auteur: Wael Ben Abid
# Date: 05/05/2025

Write-Host "Déploiement de l'application RH System..." -ForegroundColor Green

# Vérifier si Docker est en cours d'exécution
try {
    docker info | Out-Null
    Write-Host "Docker est en cours d'exécution." -ForegroundColor Green
} catch {
    Write-Host "Docker n'est pas en cours d'exécution. Veuillez démarrer Docker et réessayer." -ForegroundColor Red
    exit 1
}

# Arrêter les conteneurs existants
Write-Host "Arrêt des conteneurs existants..." -ForegroundColor Yellow
docker compose down

# Construire et démarrer les conteneurs
Write-Host "Construction et démarrage des conteneurs..." -ForegroundColor Yellow
docker compose up -d --build

# Vérifier que les conteneurs sont en cours d'exécution
Write-Host "Vérification des conteneurs..." -ForegroundColor Yellow
docker ps

# Afficher les URLs d'accès
Write-Host "L'application est maintenant accessible aux URLs suivantes :" -ForegroundColor Green
Write-Host "Frontend : http://localhost:5173/" -ForegroundColor Cyan
Write-Host "Backend API : http://localhost:8000/api/" -ForegroundColor Cyan
Write-Host "Backend Admin : http://localhost:8000/admin/" -ForegroundColor Cyan
Write-Host "Identifiants par défaut : wael / Azerty`$123" -ForegroundColor Cyan

Write-Host "Déploiement terminé avec succès !" -ForegroundColor Green
