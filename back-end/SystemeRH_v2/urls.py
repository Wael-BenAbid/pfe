"""
URL configuration for SystemeRH project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include, re_path
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework.routers import DefaultRouter
from django.conf import settings
from django.conf.urls.static import static
from Rh_app.views import (
    UserViewSet, LeaveViewSet, MissionViewSet,
    WorkHoursViewSet, InternshipViewSet, JobApplicationViewSet,
    UserSessionViewSet, MeetingViewSet,
    SystemActivityViewSet, login_view, api_logout
)
from Rh_app.views_notification import NotificationViewSet as NotificationViewSetCustom
from rest_framework_simplejwt.views import TokenVerifyView
router = DefaultRouter()
router.register(r'users', UserViewSet)
router.register(r'leaves', LeaveViewSet)
router.register(r'missions', MissionViewSet)
router.register(r'work-hours', WorkHoursViewSet)
router.register(r'internships', InternshipViewSet)
router.register(r'job-applications', JobApplicationViewSet)
router.register(r'user-sessions', UserSessionViewSet)
router.register(r'meetings', MeetingViewSet)
router.register(r'notifications', NotificationViewSetCustom)
router.register(r'system-activities', SystemActivityViewSet)


from django.http import JsonResponse, HttpResponseRedirect

def api_root(request):
    return JsonResponse({
        'message': 'RH System API',
        'version': '1.0',
        'status': 'running'
    })

# Fonction pour servir l'admin Django directement
def django_admin_view(request, path=''):
    # Cette fonction n'est plus utilisée, mais conservée pour référence
    pass

urlpatterns = [
    # Interface d'administration Django directement à la racine
    path('', admin.site.urls, name='django_admin'),

    # Ancienne route d'administration pour la compatibilité
    path('admin/', admin.site.urls, name='django_admin_legacy'),

    # API root endpoint accessible via /api/
    path('api/', api_root, name='api_root'),

    # Inclure toutes les URLs de l'application Rh_app avec préfixe api/
    path('api/', include('Rh_app.urls')),

    # Métriques Prometheus
    path('', include('django_prometheus.urls')),

    # Routes API avec préfixe api/
    path('api/', include(router.urls)),  # Routes API principales
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/auth/verify-token/', TokenVerifyView.as_view(), name='token_verify'),
    path('api/auth/login/', login_view, name='api_login'),
    path('api/auth/logout/', api_logout, name='api_logout'),

    # Routes spécifiques pour les utilisateurs par ID
    # Cette route est déjà définie par le routeur, mais nous la redéfinissons ici pour être sûr
    path('api/users/<int:pk>/', UserViewSet.as_view({'get': 'retrieve', 'put': 'update', 'patch': 'partial_update', 'delete': 'destroy'}), name='user-detail'),
]

# Ajouter les URLs pour servir les fichiers média et statiques
urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)

# Servir les fichiers statiques de l'admin Django
from django.contrib.staticfiles.urls import staticfiles_urlpatterns
urlpatterns += staticfiles_urlpatterns()