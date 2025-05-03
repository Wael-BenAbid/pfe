# Système de Gestion RH

Ce projet est un système de gestion des ressources humaines qui permet de gérer les employés, les stagiaires, les missions, les congés, etc.

## Prérequis

- Docker et Docker Compose
- Node.js (pour le développement local)
- Python 3.11 (pour le développement local)
- PostgreSQL (pour le développement local)

## Configuration

Le projet est configuré pour utiliser une base de données PostgreSQL locale au lieu d'une base de données dans un conteneur Docker. Cela permet de conserver les données même lorsque les conteneurs Docker sont arrêtés.

### Configuration de la base de données locale

1. Assurez-vous que PostgreSQL est installé et en cours d'exécution sur le port 5433.
2. Créez une base de données nommée `rh_v2` :
   ```sql
   CREATE DATABASE rh_v2;
   ```
3. Assurez-vous que l'utilisateur `postgres` avec le mot de passe `12345` a les droits nécessaires sur la base de données `rh_v2`.

### Variables d'environnement

Le fichier `.env` dans le dossier `back-end` est déjà configuré pour utiliser la base de données locale :

```
SECRET_KEY=django-insecure-4!@e#some$%random^&characters
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1
DATABASE_NAME=rh_v2
DATABASE_USER=postgres
DATABASE_PASSWORD=12345
DATABASE_HOST=host.docker.internal
DATABASE_PORT=5433

# Configuration des emails
EMAIL_HOST_USER=waelbenabid1@gmail.com
EMAIL_HOST_PASSWORD=voct gluk oifw jcpo
```

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

3. Pour nettoyer l'environnement Docker :
   ```powershell
   ./clean-docker.ps1
   ```

### Utilisation manuelle de Docker Compose

1. Démarrez l'application :
   ```powershell
   docker-compose up --build
   ```

2. Arrêtez l'application :
   ```powershell
   docker-compose down
   ```

L'application sera accessible à :
- Frontend : http://localhost:5173/
- Backend API : http://localhost:8000/api/
- Interface d'administration Django : http://localhost:8000/admin/

### Informations d'identification par défaut

- Nom d'utilisateur : wael
- Mot de passe : Azerty$123

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

## Fonctionnalités

- Gestion des employés et des stagiaires
- Gestion des missions
- Gestion des congés
- Gestion des candidatures
- Notifications par email
- Suivi des candidatures
- Récupération de mot de passe

## CI/CD

Le projet utilise GitHub Actions pour l'intégration continue et le déploiement continu. Le pipeline CI/CD :

1. Exécute les tests du frontend et du backend
2. Construit et pousse les images Docker vers Docker Hub
3. Déploie l'application (si configuré)

Pour que le pipeline CI/CD fonctionne correctement, vous devez configurer les secrets suivants dans votre dépôt GitHub :

- `DOCKER_HUB_ACCESS_TOKEN` : Token d'accès Docker Hub
- `SECRET_KEY` : Clé secrète Django
- `EMAIL_HOST_USER` : Adresse email pour l'envoi d'emails
- `EMAIL_HOST_PASSWORD` : Mot de passe d'application pour l'envoi d'emails

## Sécurité

- Les informations sensibles sont stockées dans des variables d'environnement
- Le fichier `.env` est exclu du dépôt Git
- Les mots de passe sont hachés avant d'être stockés dans la base de données
- Les connexions sont sécurisées par JWT

## Contribution

1. Forkez le projet
2. Créez une branche pour votre fonctionnalité (`git checkout -b feature/amazing-feature`)
3. Committez vos changements (`git commit -m 'Add some amazing feature'`)
4. Poussez vers la branche (`git push origin feature/amazing-feature`)
5. Ouvrez une Pull Request
