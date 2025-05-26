"""
Middleware Prometheus simplifié pour éviter les erreurs d'import
"""
import time
import logging
from prometheus_client import Counter, Histogram

logger = logging.getLogger(__name__)

# Métriques de base
api_requests_total = Counter(
    'rh_api_requests_total',
    'Total API requests',
    ['method', 'endpoint', 'status']
)

api_request_duration = Histogram(
    'rh_api_request_duration_seconds',
    'API request duration in seconds',
    ['method', 'endpoint']
)

class SimplePrometheusMiddleware:
    """
    Middleware Prometheus simplifié qui ne dépend pas des modèles Django
    """
    def __init__(self, get_response):
        self.get_response = get_response
        logger.info("SimplePrometheusMiddleware initialisé")

    def __call__(self, request):
        # Exclure les chemins statiques et admin
        excluded_paths = ['/static/', '/media/', '/admin/', '/metrics/']
        
        if any(request.path.startswith(path) for path in excluded_paths):
            return self.get_response(request)

        # Mesurer le temps de réponse pour les API
        start_time = time.time()
        response = self.get_response(request)
        duration = time.time() - start_time

        # Enregistrer les métriques
        try:
            endpoint = self._get_endpoint(request.path)
            method = request.method
            status = str(response.status_code)

            # Incrémenter le compteur de requêtes
            api_requests_total.labels(
                method=method,
                endpoint=endpoint,
                status=status
            ).inc()

            # Enregistrer la durée
            api_request_duration.labels(
                method=method,
                endpoint=endpoint
            ).observe(duration)

        except Exception as e:
            logger.error(f"Erreur lors de l'enregistrement des métriques: {e}")

        return response

    def _get_endpoint(self, path):
        """
        Extraire l'endpoint principal du chemin
        """
        # Supprimer les paramètres de requête
        path = path.split('?')[0]
        
        # Extraire le premier segment après /
        segments = path.strip('/').split('/')
        if segments and segments[0]:
            return f"/{segments[0]}/"
        return "/"
