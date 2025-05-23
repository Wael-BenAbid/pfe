import time
import logging
import random
import uuid
import os
from django.conf import settings
from py_zipkin import zipkin
from py_zipkin.zipkin import ZipkinAttrs, zipkin_span

logger = logging.getLogger(__name__)

def get_transport():
    """
    Fonction pour créer un transport pour envoyer les spans à Zipkin
    """
    # Utiliser l'URL de configuration pour tous les environnements
    zipkin_url = getattr(settings, 'ZIPKIN_SERVER_URL', 'http://zipkin:9411')

    # Forcer l'utilisation de l'URL correcte en environnement Kubernetes
    if os.environ.get('KUBERNETES_SERVICE_HOST'):
        # Utiliser le service DNS interne de Kubernetes
        api_url = "http://zipkin.monitoring.svc.cluster.local:9411/v2/spans"
    else:
        # Pour le développement local
        api_url = f"{zipkin_url}/v2/spans"

    # Forcer l'utilisation de l'URL correcte pour les tests
    api_url = "http://zipkin.monitoring.svc.cluster.local:9411/v2/spans"

    # Log l'URL pour le débogage
    logger.info(f"Zipkin API URL: {api_url}")

    # Créer une classe de transport personnalisée
    class CustomTransport:
        def __init__(self, url):
            self.url = url

        def __call__(self, spans):
            # Cette fonction sera appelée avec les spans encodés
            try:
                import requests
                requests.post(
                    self.url,
                    data=spans,
                    headers={'Content-Type': 'application/json'},
                    timeout=1  # Timeout court pour éviter de bloquer
                )
            except Exception as e:
                logger.error(f"Error emitting zipkin trace. {e}")

    # Gérer les erreurs de connexion
    try:
        # Retourner une instance de notre transport personnalisé
        return CustomTransport(api_url)
    except Exception as e:
        logger.error(f"Erreur lors de la création du transport Zipkin: {e}")
        # Retourner une fonction qui ne fait rien en cas d'erreur
        return lambda spans: None

def safe_transport_handler(spans):
    """
    Fonction qui enveloppe le transport pour gérer les erreurs de connexion
    """
    # Obtenir le transport et l'appeler avec les spans
    # Les erreurs sont déjà gérées dans le transport lui-même
    transport = get_transport()
    if callable(transport):
        transport(spans)

class ZipkinMiddleware:
    """
    Middleware Django pour tracer les requêtes avec Zipkin
    """
    def __init__(self, get_response):
        self.get_response = get_response
        self.service_name = getattr(settings, 'ZIPKIN_SERVICE_NAME', 'rh-backend')

        # Vérifier si Zipkin est activé dans les paramètres
        zipkin_enabled_setting = getattr(settings, 'ZIPKIN_ENABLED', 'False')
        # Convertir en booléen si c'est une chaîne
        if isinstance(zipkin_enabled_setting, str):
            self.zipkin_enabled = zipkin_enabled_setting.lower() in ('true', '1', 't', 'yes')
        else:
            self.zipkin_enabled = bool(zipkin_enabled_setting)

        # Vérifier le taux d'échantillonnage
        sample_rate = getattr(settings, 'ZIPKIN_SAMPLE_RATE', '0.0')
        # Convertir en float si c'est une chaîne
        if isinstance(sample_rate, str):
            try:
                self.sample_rate = float(sample_rate)
            except ValueError:
                self.sample_rate = 0.0
        else:
            self.sample_rate = float(sample_rate)

        # Désactiver Zipkin si le taux d'échantillonnage est 0
        if self.sample_rate <= 0:
            self.zipkin_enabled = False

        # Log l'état de Zipkin au démarrage
        if self.zipkin_enabled:
            logger.info(f"Zipkin tracing enabled with sample rate {self.sample_rate}%")
        else:
            logger.info("Zipkin tracing disabled")

    def __call__(self, request):
        if not self.zipkin_enabled:
            return self.get_response(request)

        # Décider si cette requête doit être tracée
        if random.random() * 100 < self.sample_rate:
            # Générer un ID de trace si aucun n'est présent dans les en-têtes
            trace_id = request.headers.get('X-B3-TraceId', uuid.uuid4().hex)
            span_id = request.headers.get('X-B3-SpanId', uuid.uuid4().hex[:16])
            parent_span_id = request.headers.get('X-B3-ParentSpanId', None)
            sampled = request.headers.get('X-B3-Sampled', '1')
            flags = request.headers.get('X-B3-Flags', '0')

            zipkin_attrs = ZipkinAttrs(
                trace_id=trace_id,
                span_id=span_id,
                parent_span_id=parent_span_id,
                flags=flags,
                is_sampled=sampled == '1',
            )

            span_name = f"{request.method} {request.path}"

            with zipkin_span(
                service_name=self.service_name,
                span_name=span_name,
                zipkin_attrs=zipkin_attrs,
                transport_handler=safe_transport_handler,
                port=8000,
                sample_rate=self.sample_rate,
            ) as span:
                # Ajouter des tags au span
                span.update_binary_annotations({
                    'http.method': request.method,
                    'http.path': request.path,
                    'http.url': request.build_absolute_uri(),
                    'http.remote_addr': request.META.get('REMOTE_ADDR', ''),
                    'http.user_agent': request.META.get('HTTP_USER_AGENT', ''),
                })

                # Mesurer le temps de réponse
                start_time = time.time()
                response = self.get_response(request)
                duration = time.time() - start_time

                # Ajouter des tags supplémentaires après la réponse
                span.update_binary_annotations({
                    'http.status_code': str(response.status_code),
                    'http.duration_ms': str(int(duration * 1000)),
                })

                # Log pour le débogage
                logger.info(f"Zipkin trace sent: {trace_id}, span: {span_id}, duration: {int(duration * 1000)}ms")

                # Ajouter les en-têtes de trace à la réponse pour le client
                response['X-B3-TraceId'] = trace_id
                response['X-B3-SpanId'] = span_id

                return response
        else:
            # Si la requête n'est pas échantillonnée, simplement la traiter
            return self.get_response(request)
