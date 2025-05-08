# Gestion des Secrets dans le Projet RH System

Ce document explique comment les informations sensibles sont gérées dans le projet RH System.

## Principes généraux

1. **Aucune information sensible ne doit être stockée dans Git**
2. **Toutes les informations sensibles doivent être stockées dans des endroits sécurisés**
3. **Les fichiers contenant des informations sensibles doivent être ignorés par Git**

## Types d'informations sensibles

Les informations sensibles dans ce projet incluent :

- `SECRET_KEY` : La clé secrète Django
- `DATABASE_PASSWORD` : Le mot de passe de la base de données PostgreSQL
- `EMAIL_HOST_USER` : L'adresse email utilisée pour envoyer des emails
- `EMAIL_HOST_PASSWORD` : Le mot de passe de l'email
- `SENDGRID_API_KEY` : La clé API SendGrid
- `AZURE_STORAGE_KEY` : La clé de stockage Azure (pour les sauvegardes)

## Où sont stockées les informations sensibles

### Développement local

- Fichier `.env` dans le répertoire `back-end/`
- Ce fichier est ignoré par Git (voir `.gitignore`)

### CI/CD (GitHub Actions)

- Secrets GitHub configurés dans les paramètres du dépôt
- Ces secrets sont référencés dans le workflow CI/CD avec la syntaxe `${{ secrets.NOM_DU_SECRET }}`

### Production (Kubernetes)

- Secrets Kubernetes créés à partir des secrets GitHub
- Ces secrets sont montés dans les pods comme variables d'environnement

## Comment configurer les secrets

### Secrets GitHub

1. Accédez aux paramètres de votre dépôt GitHub
2. Cliquez sur "Secrets and variables" > "Actions"
3. Ajoutez les secrets suivants :
   - `SECRET_KEY`
   - `DATABASE_PASSWORD`
   - `EMAIL_HOST_USER`
   - `EMAIL_HOST_PASSWORD`
   - `SENDGRID_API_KEY`
   - `DOCKER_HUB_ACCESS_TOKEN`
   - `AZURE_STORAGE_KEY` (si vous utilisez Azure pour les sauvegardes)

### Fichier .env local

1. Copiez le fichier `.env.template` en `.env` dans le répertoire `back-end/`
2. Remplissez les valeurs avec vos informations sensibles

### Secrets Kubernetes

Les secrets Kubernetes sont créés automatiquement par le workflow CI/CD à partir des secrets GitHub.

## Fichiers de template

Des fichiers de template sont fournis pour tous les fichiers contenant des informations sensibles :

- `back-end/.env.template` : Template pour le fichier `.env`
- `kubernetes/secrets/backend-secrets-template.yaml` : Template pour les secrets backend
- `kubernetes/secrets/postgres-secrets-template.yaml` : Template pour les secrets PostgreSQL
- `kubernetes/backup/backup-secrets-template.yaml` : Template pour les secrets de sauvegarde
- `kubernetes/monitoring/exporters/postgres-exporter-secret-template.yaml` : Template pour les secrets de l'exporteur PostgreSQL
- `kubernetes/monitoring/grafana/grafana-credentials-secret-template.yaml` : Template pour les credentials Grafana
- `kubernetes/logging/elasticsearch/elasticsearch-credentials-secret-template.yaml` : Template pour les credentials Elasticsearch

## Bonnes pratiques

1. Ne commettez jamais de fichiers contenant des informations sensibles
2. Utilisez toujours les variables d'environnement pour les informations sensibles
3. Vérifiez régulièrement que les fichiers sensibles sont bien ignorés par Git
4. Changez régulièrement vos mots de passe et clés API
5. Limitez l'accès aux secrets aux personnes qui en ont besoin

## En cas de fuite d'informations sensibles

Si vous suspectez qu'une information sensible a été exposée :

1. Changez immédiatement le mot de passe ou la clé concernée
2. Vérifiez les logs d'accès pour détecter toute activité suspecte
3. Informez les personnes concernées
4. Documentez l'incident et les mesures prises
