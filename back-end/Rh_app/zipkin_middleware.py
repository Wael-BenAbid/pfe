import time
import logging
import random
import uuid
from django.conf import settings
from py_zipkin.zipkin import ZipkinAttrs, zipkin_span

logger = logging.getLogger(__name__)

def http_transport(encoded_span):
    """
    Transport HTTP simple pour envoyer les spans à Zipkin
    """
    try:
        import requests

        # Utiliser l'URL de configuration unifiée
        zipkin_url = getattr(settings, 'ZIPKIN_URL', 'http://zipkin:9411')
        api_url = f"{zipkin_url}/api/v2/spans"

        logger.info(f"Sending span to Zipkin: {api_url}")

        response = requests.post(
            api_url,
            data=encoded_span,
            headers={'Content-Type': 'application/json'},
            timeout=5
        )

        logger.info(f"Zipkin response: {response.status_code}")

        if response.status_code not in [200, 202]:
            logger.error(f"Zipkin rejected span: {response.status_code} - {response.text}")

    except Exception as e:
        logger.error(f"Error sending span to Zipkin: {e}")

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
                transport_handler=http_transport,
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
