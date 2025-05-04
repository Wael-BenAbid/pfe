# Gestion des Secrets Kubernetes

Ce répertoire contient des templates pour les secrets Kubernetes. Pour des raisons de sécurité, les valeurs réelles ne doivent pas être stockées dans le dépôt Git.

## Création des secrets

### Méthode 1: À partir d'un fichier YAML

1. Copiez le fichier template et renommez-le (sans le suffixe `-template`)
2. Remplacez les valeurs par vos secrets réels
3. Appliquez le fichier avec kubectl

```bash
kubectl apply -f backend-secrets.yaml
```

### Méthode 2: Création manuelle avec kubectl

```bash
kubectl create secret generic rh-backend-secrets \
  --namespace=rh-system \
  --from-literal=SECRET_KEY='your-django-secret-key' \
  --from-literal=DATABASE_PASSWORD='your-database-password' \
  --from-literal=EMAIL_HOST_USER='your-email@example.com' \
  --from-literal=EMAIL_HOST_PASSWORD='your-email-password' \
  --from-literal=SENDGRID_API_KEY='your-sendgrid-api-key'
```

### Méthode 3: Utilisation de Sealed Secrets ou HashiCorp Vault

Pour une gestion plus sécurisée des secrets en production, envisagez d'utiliser:
- [Sealed Secrets](https://github.com/bitnami-labs/sealed-secrets)
- [HashiCorp Vault](https://www.vaultproject.io/)
- [Kubernetes External Secrets](https://github.com/external-secrets/kubernetes-external-secrets)

## Vérification des secrets

Pour vérifier que vos secrets ont été correctement créés:

```bash
kubectl get secrets -n rh-system
kubectl describe secret rh-backend-secrets -n rh-system
```
