# Système de Gestion RH

Ce projet est un système de gestion des ressources humaines qui permet de gérer les employés, les stagiaires, les missions, les congés, etc.

## Prérequis

- Docker et Docker Compose
- Node.js (pour le développement local)
- Python 3.11 (pour le développement local)
- PostgreSQL (pour le développement local)

## Configuration

### Variables d'environnement

1. Créez un fichier `.env` dans le dossier `back-end` en vous basant sur le fichier `.env.example` :

```bash
cp back-end/.env.example back-end/.env
```

2. Modifiez les valeurs dans le fichier `.env` selon votre environnement :

```
SECRET_KEY=votre-clé-secrète
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1
DATABASE_NAME=votre_db_name
DATABASE_USER=votre_db_user
DATABASE_PASSWORD=votre_db_password
DATABASE_HOST=localhost
DATABASE_PORT=5432

# Configuration des emails
EMAIL_HOST_USER=votre.email@gmail.com
EMAIL_HOST_PASSWORD=votre-mot-de-passe-app
```

### Configuration des emails

Pour utiliser Gmail comme serveur SMTP, vous devez :

1. Activer l'authentification à deux facteurs sur votre compte Gmail
2. Créer un mot de passe d'application spécifique pour votre application
3. Utiliser ce mot de passe d'application dans la variable `EMAIL_HOST_PASSWORD`

## Démarrage

### Avec Docker

```bash
docker-compose up -d
```

L'application sera accessible à :
- Frontend : http://localhost:5173
- Backend : http://localhost:8000

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
