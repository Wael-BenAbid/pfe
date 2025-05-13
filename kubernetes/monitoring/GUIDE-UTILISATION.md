# Guide d'utilisation des outils de surveillance

Ce guide explique comment utiliser Prometheus, Grafana et Kibana pour surveiller votre application RH System.

## 1. Prometheus (http://prometheus.rh-system.local/)

### Qu'est-ce que Prometheus ?
Prometheus est un système de surveillance et d'alerte open-source qui collecte et stocke des métriques de vos applications et de votre infrastructure.

### Comment l'utiliser avec votre application RH System ?

#### Accès et interface
- Accédez à http://prometheus.rh-system.local/
- L'interface principale vous montre un champ de recherche pour interroger les métriques

#### Métriques disponibles pour votre application
Pour voir les métriques disponibles :
1. Cliquez sur "Status" dans le menu supérieur
2. Sélectionnez "Targets" pour voir tous les services surveillés

#### Exemples concrets avec votre application

##### Exemple 1 : Surveiller les performances du backend
Si un administrateur assigne une mission à un employé, vous pouvez surveiller :
- Le temps de réponse de l'API : recherchez `http_request_duration_seconds{handler="/api/missions/create"}`
- Le nombre de requêtes : recherchez `http_requests_total{path="/api/missions/create"}`

##### Exemple 2 : Surveiller la base de données
Si plusieurs utilisateurs oublient leur mot de passe simultanément :
- Charge de la base de données : recherchez `pg_stat_activity_count`
- Temps de réponse des requêtes : recherchez `pg_stat_activity_max_tx_duration`

## 2. Grafana (http://grafana.rh-system.local/)

### Qu'est-ce que Grafana ?
Grafana est une plateforme de visualisation qui vous permet de créer des tableaux de bord à partir des données collectées par Prometheus.

### Comment l'utiliser avec votre application RH System ?

#### Accès et authentification
- Accédez à http://grafana.rh-system.local/
- Connectez-vous avec les identifiants par défaut (admin/admin)
- Vous serez invité à changer le mot de passe lors de la première connexion

#### Tableaux de bord pour votre application
Votre installation inclut plusieurs tableaux de bord préconfigurés :
1. Dans le menu latéral, cliquez sur "Dashboards"
2. Recherchez des tableaux de bord comme :
   - "PostgreSQL Dashboard" - Pour surveiller votre base de données
   - "Application Performance" - Pour surveiller les performances de l'application
   - "Cluster Overview" - Pour surveiller l'infrastructure Kubernetes

#### Exemples concrets avec votre application

##### Exemple 1 : Surveiller l'activité des utilisateurs
Lorsqu'un administrateur se connecte et assigne des missions :
- Vous pouvez voir le nombre de sessions actives dans le tableau de bord PostgreSQL
- Vous pouvez suivre le nombre de requêtes API par minute
- Vous pouvez observer la charge du serveur pendant les périodes d'activité intense

##### Exemple 2 : Tableau de bord pour les performances de l'application
Le tableau de bord "Application Performance" vous permet de surveiller :
- Le temps de réponse des pages les plus importantes (login, dashboard admin, gestion des missions)
- Le nombre d'erreurs 500 (erreurs serveur)
- L'utilisation de la mémoire et du CPU par vos pods

## 3. Kibana (http://kibana.rh-system.local/)

### Qu'est-ce que Kibana ?
Kibana est une interface de visualisation pour Elasticsearch qui vous permet d'explorer, d'analyser et de visualiser les logs de votre application.

### Configuration initiale
Lors de votre première connexion à Kibana, vous devrez créer un index pattern :
1. Cliquez sur le bouton "Create index pattern"
2. Dans le champ "Index pattern name", entrez `filebeat-*`
3. Cliquez sur "Next step"
4. Pour le "Time field", sélectionnez "@timestamp"
5. Cliquez sur "Create index pattern"

### Explorer les logs de votre application
1. Dans le menu latéral, cliquez sur "Discover"
2. Sélectionnez l'index pattern correspondant à vos logs (généralement "filebeat-*")
3. Utilisez la barre de recherche pour filtrer les logs

### Exemples concrets avec votre application

#### Exemple 1 : Suivre le processus d'attribution de mission
Lorsqu'un administrateur assigne une mission à un employé :
1. Dans Kibana, recherchez : `message:"mission created"` ou `message:"mission assigned"`
2. Vous verrez les logs détaillant :
   - Qui a créé la mission
   - À qui elle a été assignée
   - Quand elle a été créée
   - Les détails de la mission

#### Exemple 2 : Déboguer les problèmes de réinitialisation de mot de passe
Si un utilisateur utilise la fonction "mot de passe oublié" :
1. Recherchez : `message:"password reset"` ou `message:"forgot password"`
2. Vous verrez les logs montrant :
   - L'email utilisé pour la demande
   - Si l'email a été envoyé avec succès
   - Si le lien de réinitialisation a été utilisé
   - Si le mot de passe a été changé avec succès

## Utilisation combinée des trois outils

Pour une surveillance complète de votre application RH System, utilisez ces outils ensemble :

1. **Prometheus** : Collecte les métriques techniques (CPU, mémoire, temps de réponse)
2. **Grafana** : Visualise ces métriques dans des tableaux de bord intuitifs
3. **Kibana** : Explore les logs détaillés pour comprendre le comportement de l'application

### Scénario complet : Problème d'authentification

Imaginons qu'un utilisateur signale qu'il ne peut pas se connecter :

1. **Dans Kibana** :
   - Recherchez `message:"login failed"` et l'email de l'utilisateur
   - Vous trouvez des logs indiquant "Invalid password attempts"

2. **Dans Grafana** :
   - Consultez le tableau de bord "Authentication"
   - Vous remarquez un pic d'échecs d'authentification

3. **Dans Prometheus** :
   - Vérifiez `http_requests_total{path="/api/auth/login",status="401"}`
   - Confirmez l'augmentation des erreurs 401 (Non autorisé)

Cette approche vous permet d'identifier rapidement que l'utilisateur a peut-être oublié son mot de passe ou qu'il y a un problème avec le système d'authentification.
