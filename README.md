# Système de Gestion RH

Ce projet est un système de gestion des ressources humaines qui permet de gérer les employés, les stagiaires, les missions, les congés, etc.

## Prérequis

- Docker et Docker Compose
- Node.js (pour le développement local)
- Python 3.11 (pour le développement local)
- PostgreSQL (pour le développement local)
- Kubernetes et Helm (pour le déploiement sur Kubernetes)

## Configuration

Le projet est configuré pour utiliser une base de données PostgreSQL locale au lieu d'une base de données dans un conteneur Docker. Cela permet de conserver les données même lorsque les conteneurs Docker sont arrêtés.

### Configuration de la base de données locale

1. Assurez-vous que PostgreSQL est installé et en cours d'exécution sur le port 5433.
2. Créez une base de données nommée `rh_v2` :
   ```sql
   CREATE DATABASE rh_v2;
   ```
3. Assurez-vous que l'utilisateur `postgres` avec le mot de passe `12345` a les droits nécessaires sur la base de données `rh_v2`.

### Variables d'environnement et informations sensibles

#### Configuration des variables d'environnement

1. Copiez le fichier modèle pour créer votre fichier de configuration :

```bash
# Pour le backend
cp back-end/.env.template back-end/.env

# Pour le frontend
cp project/.env.template project/.env
```

2. Modifiez les fichiers `.env` avec vos propres valeurs :

```bash
# Ouvrez le fichier .env du backend dans votre éditeur préféré
notepad back-end/.env

# Ouvrez le fichier .env du frontend dans votre éditeur préféré
notepad project/.env
```

#### Gestion des informations sensibles

Les fichiers `.env` contiennent des informations sensibles et ne doivent jamais être commités dans Git. Ils sont déjà ajoutés au fichier `.gitignore`.

Le fichier `.env` du backend doit contenir les variables suivantes :
- `SECRET_KEY` : Clé secrète Django
- `DEBUG` : Mode de débogage (True/False)
- `ALLOWED_HOSTS` : Hôtes autorisés
- `DATABASE_NAME` : Nom de la base de données
- `DATABASE_USER` : Utilisateur de la base de données
- `DATABASE_PASSWORD` : Mot de passe de la base de données
- `DATABASE_HOST` : Hôte de la base de données
- `DATABASE_PORT` : Port de la base de données
- `SENDGRID_API_KEY` : Clé API SendGrid pour l'envoi d'emails
- `DEFAULT_FROM_EMAIL` : Adresse email d'expéditeur par défaut

#### Sécurité des clés API

Pour des raisons de sécurité, il est recommandé de :
1. Ne jamais partager vos clés API ou les inclure dans le code source
2. Changer régulièrement vos clés API (tous les 3-6 mois)
3. Utiliser des clés API différentes pour les environnements de développement et de production

### Configuration des emails

Pour utiliser Gmail comme serveur SMTP, vous devez :

1. Activer l'authentification à deux facteurs sur votre compte Gmail
2. Créer un mot de passe d'application spécifique pour votre application
3. Utiliser ce mot de passe d'application dans la variable `EMAIL_HOST_PASSWORD`

## Démarrage

### Utilisation des scripts PowerShell

1. Vérifiez la connexion à la base de données :
   ```powershell
   ./check-db.ps1
   ```

2. Démarrez l'application :
   ```powershell
   ./start-app.ps1
   ```

   Ou utilisez le nouveau script de déploiement :
   ```powershell
   ./deploy.ps1
   ```

   Pour démarrer l'application avec Zipkin :
   ```powershell
   ./start-app-zipkin.ps1
   ```

3. Pour construire et pousser les images Docker vers Docker Hub :
   ```powershell
   ./build-push-docker.ps1
   ```

   Pour construire et pousser les images Docker avec Zipkin :
   ```powershell
   ./build-push-docker-zipkin.ps1
   ```

4. Pour déployer l'application sur Kubernetes :
   ```powershell
   ./deploy-kubernetes.ps1
   ```

   Pour déployer l'application avec Zipkin sur Kubernetes :
   ```powershell
   ./deploy-kubernetes-zipkin.ps1
   ```

5. Pour redémarrer tous les services après un redémarrage du PC :
   ```powershell
   ./restart-services.ps1
   ```

6. Pour nettoyer l'environnement Docker :
   ```powershell
   ./clean-docker.ps1
   ```

7. Pour sauvegarder la base de données :
   ```powershell
   ./backup.ps1
   ```

8. Pour restaurer la base de données à partir d'une sauvegarde :
   ```powershell
   ./restore.ps1 ./backups/rh_v2_20250505_120000.sql
   ```

### Déploiement avec Docker (recommandé)

#### Déploiement automatique (recommandé)

Utilisez les scripts de déploiement automatique pour télécharger les dernières images depuis Docker Hub et démarrer l'application :

**Windows** :
```powershell
.\deploy-docker.ps1
```

**Linux/Mac** :
```bash
./deploy-docker.sh
```

#### Déploiement manuel avec Docker Compose

1. Démarrez l'application :
   ```powershell
   docker-compose up --build
   ```

2. Arrêtez l'application :
   ```powershell
   docker-compose down
   ```

L'application sera accessible à :
- Frontend : http://localhost:5175/
- Backend API : http://localhost:8000/
- Interface d'administration Django : http://localhost:8000/admin/
- Zipkin (si activé) : http://localhost:9411/

### Informations d'identification par défaut

- Admin : wael / Abidos$123
- Employé : user2 / Azerty$123
- Stagiaire : user3 / Azerty$123

### Sans Docker (développement local)

#### Backend

```bash
cd back-end
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

#### Frontend

```bash
cd project
npm install
npm run dev
```

## Monitoring

Le système intègre plusieurs outils de monitoring pour surveiller les performances et le comportement de l'application :

### Prometheus et Grafana

Prometheus est utilisé pour collecter des métriques sur l'application, tandis que Grafana permet de visualiser ces métriques sous forme de tableaux de bord.

- Prometheus : http://prometheus.rh-system.local (en mode Kubernetes)
- Grafana : http://grafana.rh-system.local (en mode Kubernetes)

### Zipkin

Zipkin est un système de traçage distribué qui aide à collecter les données de latence et à résoudre les problèmes dans les architectures de microservices.

- Zipkin : http://zipkin.rh-system.local (en mode Kubernetes) ou http://localhost:9411 (en mode local)

Zipkin permet de suivre le parcours des requêtes à travers l'application, d'identifier les goulots d'étranglement et d'améliorer les performances. Vous pouvez voir quelles parties de votre application prennent le plus de temps et optimiser en conséquence.

Les métriques suivantes sont disponibles dans Zipkin :
- Traces des requêtes HTTP
- Durée des requêtes
- Dépendances entre les services
- Erreurs et exceptions

## Fonctionnalités

- Gestion des employés et des stagiaires
- Gestion des missions
- Suivi des heures de travail
- Gestion des congés
- Messagerie interne avec support pour les fichiers (images, PDF, Word)
- Notifications par email et dans l'application
- Suivi des candidatures
- Récupération de mot de passe
- Calendrier des événements
- Statistiques et rapports

## Déploiement sur Kubernetes

Le projet peut être déployé sur un cluster Kubernetes. Les configurations nécessaires se trouvent dans le répertoire `kubernetes/`.

### Options de déploiement

1. **Déploiement local avec Minikube** :
   ```powershell
   # Démarrer Minikube
   minikube start --driver=docker

   # Activer l'addon ingress
   minikube addons enable ingress

   # Déployer l'application
   ./deploy-kubernetes.ps1
   ```

2. **Déploiement sur Azure Kubernetes Service (AKS)** :
   ```powershell
   # Configurer un cluster AKS
   ./setup-aks.ps1

   # Déployer l'application
   ./deploy-kubernetes.ps1
   ```

3. **Déploiement sur Amazon Elastic Kubernetes Service (EKS)** :
   ```powershell
   # Configurer un cluster EKS
   ./setup-eks.ps1

   # Déployer l'application
   ./deploy-kubernetes.ps1
   ```

4. **Déploiement manuel avec kubectl** :
   ```powershell
   # Créer le namespace
   kubectl create namespace rh-system

   # Appliquer les configurations
   kubectl apply -f kubernetes/configmaps/ -n rh-system
   kubectl apply -f kubernetes/storage/ -n rh-system
   kubectl apply -f kubernetes/deployments/ -n rh-system
   kubectl apply -f kubernetes/services/ -n rh-system
   kubectl apply -f kubernetes/ingress/ -n rh-system
   ```

5. **Déploiement avec Helm** :
   ```powershell
   # Installer Helm
   choco install kubernetes-helm

   # Déployer l'application
   helm install rh-system kubernetes/helm/rh-system/ --namespace rh-system --create-namespace
   ```

### Structure des fichiers Kubernetes

- `kubernetes/configmaps/` : ConfigMaps pour la configuration de l'application
- `kubernetes/deployments/` : Déploiements pour les pods
- `kubernetes/services/` : Services pour exposer les pods
- `kubernetes/ingress/` : Ingress pour l'accès externe
- `kubernetes/storage/` : PersistentVolumeClaims pour le stockage
- `kubernetes/autoscaling/` : HorizontalPodAutoscalers pour l'autoscaling
- `kubernetes/security/` : Politiques de sécurité et NetworkPolicies
- `kubernetes/monitoring/` : Configurations pour Prometheus et Grafana
- `kubernetes/logging/` : Configurations pour la stack ELK
- `kubernetes/helm/` : Charts Helm pour le déploiement

### Problèmes connus

Si vous rencontrez des problèmes avec Minikube, essayez les solutions suivantes :

1. Utilisez le pilote Docker au lieu de WSL2 :
   ```powershell
   minikube delete
   minikube start --driver=docker
   ```

2. Vérifiez que l'addon ingress est activé :
   ```powershell
   minikube addons enable ingress
   ```

3. Utilisez le tunnel Minikube pour accéder aux services :
   ```powershell
   minikube tunnel
   ```

4. Si vous ne pouvez pas accéder à l'application via `http://rh-system.local/`, utilisez Docker Compose comme alternative pour le développement local.

### Monitoring avec Prometheus et Grafana

Le projet inclut une configuration complète pour le monitoring avec Prometheus et Grafana. Les configurations se trouvent dans le répertoire `kubernetes/monitoring/`.

Pour déployer la stack de monitoring :

```bash
cd kubernetes/monitoring
chmod +x install-monitoring.sh
./install-monitoring.sh
```

Une fois déployé, vous pouvez accéder aux interfaces :
- Prometheus : http://prometheus.rh-system.local
- Grafana : http://grafana.rh-system.local (identifiants par défaut : admin/admin)

Des dashboards préconfigurés sont disponibles pour surveiller :
- L'état général du cluster
- Les performances des applications
- La base de données PostgreSQL
- Les ressources système

### Sécurité

Le projet inclut des configurations pour renforcer la sécurité de l'application sur Kubernetes. Les configurations se trouvent dans le répertoire `kubernetes/security/`.

Pour déployer les composants de sécurité :

```bash
cd kubernetes/security
chmod +x install-security.sh
./install-security.sh
```

Les composants de sécurité incluent :
- **Trivy** : Scanner de vulnérabilités pour les images de conteneurs
- **Kyverno** : Politiques de sécurité Kubernetes
- **NetworkPolicies** : Sécurisation des communications entre pods

Le projet intègre également des scans de sécurité automatiques dans le pipeline CI/CD pour détecter les vulnérabilités avant le déploiement.

### Centralisation des Logs

Le projet inclut une configuration complète pour la centralisation des logs avec la stack ELK (Elasticsearch, Logstash, Kibana). Les configurations se trouvent dans le répertoire `kubernetes/logging/`.

Pour déployer la stack ELK :

```bash
cd kubernetes/logging
chmod +x install-logging.sh
./install-logging.sh
```

Une fois déployée, l'interface Kibana est accessible à l'adresse :
- Kibana : http://kibana.rh-system.local

Les composants de la stack ELK incluent :
- **Elasticsearch** : Stockage et indexation des logs
- **Logstash** : Traitement et enrichissement des logs
- **Kibana** : Visualisation et analyse des logs
- **Filebeat** : Collecte des logs sur les nœuds

Des dashboards préconfigurés sont disponibles pour visualiser les logs du système, de l'application, de la base de données, des accès HTTP et de la sécurité.

## CI/CD

Le projet utilise GitHub Actions pour l'intégration continue et le déploiement continu. Le pipeline CI/CD est entièrement automatisé et s'exécute à chaque push sur la branche principale :

1. Exécute les tests du frontend et du backend
2. Effectue des scans de sécurité sur le code et les images Docker
3. Construit et pousse automatiquement les images Docker vers Docker Hub
4. Déploie l'application sur Kubernetes (si configuré)
5. Met à jour les tags des images pour faciliter le déploiement

Pour que le pipeline CI/CD fonctionne correctement, vous devez configurer les secrets suivants dans votre dépôt GitHub :

- `DOCKER_HUB_ACCESS_TOKEN` : Token d'accès Docker Hub
- `SECRET_KEY` : Clé secrète Django
- `EMAIL_HOST_USER` : Adresse email pour l'envoi d'emails
- `EMAIL_HOST_PASSWORD` : Mot de passe d'application pour l'envoi d'emails
- `SENDGRID_API_KEY` : Clé API SendGrid pour l'envoi d'emails

Pour déployer les dernières images sur votre environnement local, utilisez les scripts de déploiement fournis :
- `deploy-docker.ps1` (Windows)
- `deploy-docker.sh` (Linux/Mac)

Ces scripts téléchargent automatiquement les dernières images depuis Docker Hub et démarrent l'application avec Docker Compose.

## Sécurité

- Les informations sensibles sont stockées dans des variables d'environnement
- Le fichier `.env` est exclu du dépôt Git
- Les mots de passe sont hachés avant d'être stockés dans la base de données
- Les connexions sont sécurisées par JWT

## Résolution des problèmes

### Problèmes courants

1. **Impossible de se connecter à la base de données**
   - Vérifiez que PostgreSQL est en cours d'exécution sur le port 5433
   - Vérifiez que la base de données `rh_v2` existe
   - Vérifiez que l'utilisateur `postgres` a les droits nécessaires

2. **Problèmes avec Docker**
   - Vérifiez que Docker Desktop est en cours d'exécution
   - Essayez de redémarrer Docker Desktop
   - Nettoyez les conteneurs et les images avec `./clean-docker.ps1`

3. **Problèmes avec Kubernetes/Minikube**
   - Si vous rencontrez des problèmes avec Minikube, utilisez Docker Compose comme alternative
   - Pour les déploiements en production, envisagez d'utiliser un service Kubernetes géré (AKS, EKS, GKE)

4. **Problèmes avec les emails**
   - Vérifiez que les informations d'identification SendGrid sont correctes
   - Vérifiez que l'expéditeur est autorisé dans SendGrid

### Logs

Les logs des conteneurs peuvent être consultés avec :

```powershell
docker logs pfe-frontend-1
docker logs pfe-backend-1
```

## Contribution

1. Forkez le projet
2. Créez une branche pour votre fonctionnalité (`git checkout -b feature/amazing-feature`)
3. Committez vos changements (`git commit -m 'Add some amazing feature'`)
4. Poussez vers la branche (`git push origin feature/amazing-feature`)
5. Ouvrez une Pull Request
