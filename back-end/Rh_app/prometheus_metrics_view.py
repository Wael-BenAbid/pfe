from django.http import HttpResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_GET
from prometheus_client import generate_latest, CONTENT_TYPE_LATEST
import logging

logger = logging.getLogger(__name__)

@csrf_exempt
@require_GET
def metrics_view(request):
    """
    View that exposes Prometheus metrics without authentication.
    """
    try:
        metrics_data = generate_latest()
        return HttpResponse(metrics_data, content_type=CONTENT_TYPE_LATEST)
    except Exception as e:
        logger.error(f"Error generating metrics: {e}")
        return HttpResponse(f"Error generating metrics: {e}", status=500)
